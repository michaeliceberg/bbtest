import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import type { TrainerKey } from '@/lib/egeTrainerLinks'

// «Рэмбо» — третий режим линейки ЕГЭ: случайная смесь заданий тренажёра и задачника к одному заданию ЕГЭ.
// У каждого задания 4 клетки-уровня: 1 — самые простые уроки тренажёра и задачника, 4 — до самых сложных
// (уровень k берёт уроки из первых k/4 списка, половину — из «новой» четверти). Проходится по кругу сколько угодно.
// Открытие клетки: предыдущая клетка пройдена + пройдено достаточно тем тренажёра (тема «пройдена» — от 50%,
// как в ангаре). Без PRO — только первая клетка. Результаты — таблица rambo_runs (прямой SQL).

export const RAMBO_LEVELS = 4
export const RAMBO_TRAINER_Q = 4
export const RAMBO_TASK_Q = 4
/** Сколько верных из сессии нужно, чтобы клетка засчиталась. */
export const RAMBO_PASS_SHARE = 0.75
const TOPIC_DONE_PERCENT = 50

export type RamboCell = { level: number; open: boolean; proLocked: boolean; best: number; passed: boolean; need: string | null }
export type RamboTask = { num: number; available: boolean; cells: RamboCell[] }

export type RamboQuestion = {
    kind: 't' | 'c'
    id: number
    question: string
    imageSrc: string | null
    options: string[]
    correct: string[]
}

type Row = Record<string, unknown>

/** Сколько пройденных тем тренажёра нужно для клетки level (T — тем у задания). */
export const topicsNeeded = (level: number, T: number) => (T === 0 ? 0 : level === 1 ? 1 : Math.min(T, Math.ceil((level * T) / RAMBO_LEVELS)))

/** Есть ли из чего собрать сессию: задания тренажёра (M_ASC/DIAGRAM) и задачника (ASSIST) по номеру ЕГЭ. */
async function poolSizes(): Promise<Record<number, { t: number; c: number }>> {
    const rows = (await db.execute(sql`
        SELECT t.num,
            (SELECT count(*) FROM ege_task_links k2 JOIN t_lessons tl ON tl.t_unit_id = k2.ref_id JOIN t_challenges tc ON tc.lesson_id = tl.id
                WHERE k2.task_id = t.id AND k2.kind = 't_unit' AND tc.type IN ('M_ASC', 'DIAGRAM')) AS tn,
            (SELECT count(*) FROM ege_task_links k3 JOIN lessons l ON l.unit_id = k3.ref_id JOIN challenges c ON c.lesson_id = l.id
                WHERE k3.task_id = t.id AND k3.kind = 'unit' AND c.type = 'ASSIST') AS cn
        FROM ege_tasks t WHERE t.subject = 'math_profile'`)) as unknown as Row[]
    return Object.fromEntries(rows.map((r) => [Number(r.num), { t: Number(r.tn), c: Number(r.cn) }]))
}

export async function getRamboStatus(userId: string, hasPro: boolean, trainerKeys: Record<number, TrainerKey[]>): Promise<Record<number, RamboTask>> {
    const [sizes, runs] = await Promise.all([
        poolSizes(),
        db.execute(sql`SELECT task_num, level, max(correct::float / nullif(total, 0)) AS best FROM rambo_runs WHERE user_id = ${userId} GROUP BY 1, 2`),
    ])
    const best = new Map<string, number>()
    for (const r of runs as unknown as Row[]) best.set(`${r.task_num}:${r.level}`, Number(r.best) || 0)
    const out: Record<number, RamboTask> = {}
    for (const [numStr, sz] of Object.entries(sizes)) {
        const num = Number(numStr)
        const topics = trainerKeys[num] ?? []
        const done = topics.filter((k) => k.percent >= TOPIC_DONE_PERCENT).length
        const available = sz.t + sz.c > 0
        const cells: RamboCell[] = []
        let prevPassed = true
        for (let level = 1; level <= RAMBO_LEVELS; level++) {
            const b = best.get(`${num}:${level}`) ?? 0
            const passed = b >= RAMBO_PASS_SHARE
            const needTopics = topicsNeeded(level, topics.length)
            const proLocked = !hasPro && level > 1
            const open = available && prevPassed && done >= needTopics && !proLocked
            const need = !available ? null
                : !prevPassed ? `Сначала пройди клетку ${level - 1}`
                : done < needTopics ? `Пройди тренажёры: ${done}/${needTopics}`
                : null
            cells.push({ level, open, proLocked, best: b, passed, need })
            prevPassed = passed
        }
        out[num] = { num, available, cells }
    }
    return out
}

const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

/** Выбор count штук: половина из «новой» четверти уроков (band), остальное — из всех уроков до уровня. */
function pickLeveled<T extends { idx: number }>(items: T[], lessonsTotal: number, level: number, count: number): T[] {
    if (!items.length) return []
    const upTo = Math.max(1, Math.ceil((level / RAMBO_LEVELS) * lessonsTotal))
    const from = Math.floor(((level - 1) / RAMBO_LEVELS) * lessonsTotal)
    const pool = items.filter((x) => x.idx < upTo)
    const band = shuffle(pool.filter((x) => x.idx >= from))
    const picked = band.slice(0, level === 1 ? count : Math.ceil(count / 2))
    const rest = shuffle(pool.filter((x) => !picked.includes(x)))
    return [...picked, ...rest].slice(0, count)
}

const cleanImg = (s: unknown) => { const v = s ? String(s) : ''; return v && v !== '0' ? v : null }
const hasDollar = (s: string) => s.includes('$')

/** Смесь заданий для клетки: RAMBO_TRAINER_Q тренажёра + RAMBO_TASK_Q задачника (если одного нет — добираем другим). */
export async function buildRamboSession(taskNum: number, level: number): Promise<RamboQuestion[]> {
    const [tRows, cRows] = await Promise.all([
        db.execute(sql`
            SELECT tc.id, tc.type, tc.question, tc.image_src, tl.t_unit_id, tl."order" AS lorder,
                dense_rank() OVER (PARTITION BY tl.t_unit_id ORDER BY tl."order", tl.id) - 1 AS idx,
                (SELECT count(*) FROM t_lessons x WHERE x.t_unit_id = tl.t_unit_id) AS ltotal,
                (SELECT json_agg(json_build_object('t', o.text, 'c', o.correct) ORDER BY o.id) FROM t_challenge_options o WHERE o.t_challenge_id = tc.id) AS opts
            FROM ege_tasks t
            JOIN ege_task_links k ON k.task_id = t.id AND k.kind = 't_unit'
            JOIN t_lessons tl ON tl.t_unit_id = k.ref_id
            JOIN t_challenges tc ON tc.lesson_id = tl.id
            WHERE t.subject = 'math_profile' AND t.num = ${taskNum} AND tc.type IN ('M_ASC', 'DIAGRAM')`),
        db.execute(sql`
            SELECT c.id, c.question, c.image_src,
                dense_rank() OVER (ORDER BY u."order", l."order", l.id) - 1 AS idx,
                (SELECT json_agg(json_build_object('t', o.text, 'c', o.correct) ORDER BY o.id) FROM challenge_options o WHERE o.challenge_id = c.id) AS opts
            FROM ege_tasks t
            JOIN ege_task_links k ON k.task_id = t.id AND k.kind = 'unit'
            JOIN units u ON u.id = k.ref_id
            JOIN lessons l ON l.unit_id = u.id
            JOIN challenges c ON c.lesson_id = l.id
            WHERE t.subject = 'math_profile' AND t.num = ${taskNum} AND c.type = 'ASSIST'`),
    ])
    type O = { t: string; c: boolean }
    const tItems = (tRows as unknown as Row[]).map((r) => ({
        id: Number(r.id), type: String(r.type), question: String(r.question), image: cleanImg(r.image_src),
        idx: Number(r.idx), total: Number(r.ltotal), unit: Number(r.t_unit_id), opts: ((r.opts as O[] | null) ?? []).filter((o) => o.t),
    }))
    const cItems = (cRows as unknown as Row[]).map((r) => ({
        id: Number(r.id), question: String(r.question), image: cleanImg(r.image_src), idx: Number(r.idx),
        opts: ((r.opts as O[] | null) ?? []).filter((o) => o.t),
    }))
    const cLessons = cItems.reduce((m, x) => Math.max(m, x.idx + 1), 0)

    // Тренажёр: уровень считается внутри каждой темы, потом темы перемешиваются.
    const byUnit = new Map<number, typeof tItems>()
    for (const x of tItems) byUnit.set(x.unit, [...(byUnit.get(x.unit) ?? []), x])
    const tCandidates = shuffle([...byUnit.values()].flatMap((arr) => pickLeveled(arr, arr[0].total, level, RAMBO_TRAINER_Q + RAMBO_TASK_Q)))

    const wantT = cItems.length ? RAMBO_TRAINER_Q : RAMBO_TRAINER_Q + RAMBO_TASK_Q
    const wantC = tItems.length ? RAMBO_TASK_Q : RAMBO_TRAINER_Q + RAMBO_TASK_Q
    const pickedT = tCandidates.slice(0, wantT)
    const pickedC = pickLeveled(cItems, cLessons, level, wantC)

    const tQuestions: RamboQuestion[] = pickedT.map((x) => {
        const correct = x.opts.filter((o) => o.c).map((o) => o.t)
        let options = x.opts.map((o) => o.t)
        // Мало вариантов — добираем верными ответами соседей того же «жанра» (формула / текст), как в тренажёре.
        if (options.length < 4) {
            const genre = hasDollar(correct[0] ?? '')
            const extra = shuffle(tItems.filter((y) => y.id !== x.id).flatMap((y) => y.opts.filter((o) => o.c).map((o) => o.t)))
                .filter((t) => hasDollar(t) === genre && !options.includes(t))
            options = [...options, ...[...new Set(extra)].slice(0, 4 - options.length)]
        }
        return {
            kind: 't', id: x.id, question: x.question,
            imageSrc: x.image ? (x.image.startsWith('/') ? x.image : `/trainer-images/${x.image}`) : null,
            options: shuffle([...new Set(options)]).slice(0, 6), correct,
        }
    })
    const cQuestions: RamboQuestion[] = pickedC.map((x) => ({
        kind: 'c', id: x.id, question: x.question, imageSrc: x.image,
        options: shuffle([...new Set(x.opts.map((o) => o.t))]), correct: x.opts.filter((o) => o.c).map((o) => o.t),
    }))
    // Смесь: тренажёр и задачник через одного, начинаем с тренажёра (теория → практика).
    const out: RamboQuestion[] = []
    for (let i = 0; i < Math.max(tQuestions.length, cQuestions.length); i++) {
        if (tQuestions[i]) out.push(tQuestions[i])
        if (cQuestions[i]) out.push(cQuestions[i])
    }
    return out.filter((q) => q.options.length >= 2 && q.correct.length > 0)
}

/** Проверка ответов на сервере (клиенту не доверяем): сколько верных. */
export async function checkRamboAnswers(answers: { kind: 't' | 'c'; id: number; answer: string }[]): Promise<number> {
    let right = 0
    for (const a of answers.slice(0, 20)) {
        const rows = a.kind === 't'
            ? await db.execute(sql`SELECT 1 FROM t_challenge_options WHERE t_challenge_id = ${a.id} AND correct AND text = ${a.answer} LIMIT 1`)
            : await db.execute(sql`SELECT 1 FROM challenge_options WHERE challenge_id = ${a.id} AND correct AND text = ${a.answer} LIMIT 1`)
        if ((rows as unknown as Row[]).length) right++
    }
    return right
}
