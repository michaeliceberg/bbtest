import 'server-only'

// lib/egeMap.ts
//
// «Мой путь» — карта заданий ЕГЭ и прогноз балла (2026-10-08).
// Каждое задание экзамена — станция. Освоенность станции считаем из того, что уже есть:
//   • задачник — решённые верно задачи привязанных юнитов (completed && done_right);
//     чтобы станцию можно было «закрыть», цель — не все задачи юнита, а TARGET_SOLVED штук;
//   • тренажёр — доля пройденных уроков привязанных тем (training_pts > 0).
// Оба источника есть → 60% задачник + 40% тренажёр. Во второй части, где пока есть только
// тренажёр, засчитываем не больше четверти баллов: теория есть, а развёрнутых задач ещё нет.
// Копилка = Σ (баллы задания × освоенность), переводим в тестовый балл по шкале
// (шкалы 2027 ещё нет — берём 2026, поэтому на экране «≈»).

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { primaryToTest } from '@/lib/egeScale'
export { primaryToTest }

export const TARGET_SOLVED = 25
const COURSE_WEIGHT = 0.6
const PART2_TRAINER_ONLY_CAP = 0.25

export type EgeStation = {
    num: number
    title: string
    points: number
    part: number
    status: 'soon' | 'open'
    mastery: number // 0..1
    earned: number // первичных баллов в копилке
    courseSolved: number
    courseTarget: number
    trainerDone: number
    trainerTotal: number
    trainerOnly: boolean
    // куда идти, чтобы продвинуться
    lessonHref: string | null
    trainerHref: string | null
    lessonTitle: string | null
    trainerTitle: string | null
    courseLeft: number // сколько задач ещё можно решить до «закрытия» станции
    unitIds: number[] // юниты задачника этого задания
    tUnitIds: number[] // темы тренажёра этого задания
}
// «Следующий ход»: конкретные шаги и сколько он добавит к прогнозу.
export type EgeMove = {
    station: EgeStation
    trainerLesson: { href: string; title: string } | null
    tasks: { href: string; count: number; title: string } | null
    fromTest: number
    toTest: number
    fromPrimary: number
    toPrimary: number
}
export type EgeMap = {
    subject: string
    stations: EgeStation[]
    primary: number
    primaryMax: number
    test: number
    next: EgeStation | null
    move: EgeMove | null
}

type Row = Record<string, unknown>

export async function getEgeMap(userId: string, subject = 'math_profile'): Promise<EgeMap> {
    const tasks = (await db.execute(sql`
        SELECT t.id, t.num, t.title, t.points, t.part,
            coalesce(json_agg(json_build_object('kind', l.kind, 'ref', l.ref_id)) FILTER (WHERE l.id IS NOT NULL), '[]') AS links
        FROM ege_tasks t LEFT JOIN ege_task_links l ON l.task_id = t.id
        WHERE t.subject = ${subject}
        GROUP BY t.id ORDER BY t.num`)) as unknown as Row[]

    const unitIds = new Set<number>(), tUnitIds = new Set<number>()
    for (const t of tasks) for (const l of t.links as { kind: string; ref: number }[]) (l.kind === 'unit' ? unitIds : tUnitIds).add(Number(l.ref))

    // задачник: всего задач и решено верно — по юнитам; плюс первый урок с нерешёнными задачами
    const unitStats = new Map<number, { total: number; solved: number; nextLesson: number | null; nextTitle: string | null }>()
    if (unitIds.size) {
        const ids = [...unitIds]
        const rows = (await db.execute(sql`
            SELECT l.unit_id, l.id AS lesson_id, l."order", l.title,
                count(c.id) AS total,
                count(cp.id) FILTER (WHERE cp.completed AND cp.done_right) AS solved
            FROM lessons l
            JOIN challenges c ON c.lesson_id = l.id
            LEFT JOIN challenge_progress cp ON cp.challenge_id = c.id AND cp.user_id = ${userId}
            WHERE l.unit_id IN ${sql.raw(`(${ids.join(',')})`)}
            GROUP BY l.unit_id, l.id, l."order", l.title
            ORDER BY l.unit_id, l."order"`)) as unknown as Row[]
        for (const r of rows) {
            const u = Number(r.unit_id)
            const cur = unitStats.get(u) ?? { total: 0, solved: 0, nextLesson: null, nextTitle: null }
            cur.total += Number(r.total)
            cur.solved += Number(r.solved)
            if (cur.nextLesson === null && Number(r.solved) < Number(r.total)) { cur.nextLesson = Number(r.lesson_id); cur.nextTitle = String(r.title) }
            unitStats.set(u, cur)
        }
    }

    // тренажёр: уроки тем и пройденные; первый непройденный урок
    const tStats = new Map<number, { total: number; done: number; nextLesson: number | null; nextTitle: string | null }>()
    if (tUnitIds.size) {
        const ids = [...tUnitIds]
        const rows = (await db.execute(sql`
            SELECT tl.t_unit_id, tl.id, tl."order", tl.title,
                EXISTS (SELECT 1 FROM t_lesson_progress p WHERE p.t_lesson_id = tl.id AND p.user_id = ${userId} AND p.training_pts > 0) AS done
            FROM t_lessons tl
            WHERE tl.t_unit_id IN ${sql.raw(`(${ids.join(',')})`)}
            ORDER BY tl.t_unit_id, tl."order", tl.id`)) as unknown as Row[]
        for (const r of rows) {
            const u = Number(r.t_unit_id)
            const cur = tStats.get(u) ?? { total: 0, done: 0, nextLesson: null, nextTitle: null }
            cur.total += 1
            if (r.done) cur.done += 1
            else if (cur.nextLesson === null) { cur.nextLesson = Number(r.id); cur.nextTitle = String(r.title) }
            tStats.set(u, cur)
        }
    }

    const stations: EgeStation[] = tasks.map((t) => {
        const links = t.links as { kind: string; ref: number }[]
        const units = links.filter((l) => l.kind === 'unit').map((l) => Number(l.ref))
        const tunits = links.filter((l) => l.kind === 't_unit').map((l) => Number(l.ref))
        let courseSolved = 0, courseTarget = 0, trainerDone = 0, trainerTotal = 0
        let lessonHref: string | null = null, trainerHref: string | null = null
        let lessonTitle: string | null = null, trainerTitle: string | null = null
        for (const u of units) {
            const st = unitStats.get(u)
            if (!st || st.total === 0) continue
            courseTarget += Math.min(st.total, TARGET_SOLVED)
            courseSolved += Math.min(st.solved, Math.min(st.total, TARGET_SOLVED))
            if (!lessonHref && st.nextLesson) { lessonHref = `/lesson/${st.nextLesson}`; lessonTitle = st.nextTitle }
        }
        for (const u of tunits) {
            const st = tStats.get(u)
            if (!st || st.total === 0) continue
            trainerTotal += st.total
            trainerDone += st.done
            if (!trainerHref && st.nextLesson) { trainerHref = `/t-lesson/${st.nextLesson}`; trainerTitle = st.nextTitle }
        }
        const hasCourse = courseTarget > 0, hasTrainer = trainerTotal > 0
        const c = hasCourse ? courseSolved / courseTarget : 0
        const tr = hasTrainer ? trainerDone / trainerTotal : 0
        const part = Number(t.part)
        const trainerOnly = !hasCourse && hasTrainer
        const mastery = hasCourse && hasTrainer ? COURSE_WEIGHT * c + (1 - COURSE_WEIGHT) * tr
            : hasCourse ? c
            : hasTrainer ? (part === 2 ? tr * PART2_TRAINER_ONLY_CAP : tr)
            : 0
        const points = Number(t.points)
        return {
            num: Number(t.num), title: String(t.title), points, part,
            status: hasCourse || hasTrainer ? 'open' : 'soon',
            mastery, earned: points * mastery,
            courseSolved, courseTarget, trainerDone, trainerTotal, trainerOnly,
            lessonHref, trainerHref, lessonTitle, trainerTitle,
            courseLeft: Math.max(0, courseTarget - courseSolved),
            unitIds: units, tUnitIds: tunits,
        }
    })

    const primary = stations.reduce((s, x) => s + x.earned, 0)
    const primaryMax = stations.reduce((s, x) => s + x.points, 0)
    // «Что решать сегодня»: больше всего ещё не взятых баллов (с учётом потолка тренажёра)
    const room = (x: EgeStation) => x.points * ((x.trainerOnly && x.part === 2 ? PART2_TRAINER_ONLY_CAP : 1) - x.mastery)
    // сначала первая часть (быстрые и честные баллы), вторая — когда первая почти закрыта
    const candidates = stations.filter((x) => x.status === 'open' && room(x) > 0.05 && (x.lessonHref || x.trainerHref))
    const part1 = candidates.filter((x) => x.part === 1)
    const next = (part1.length ? part1 : candidates).sort((a, b) => room(b) - room(a))[0] ?? null
    const test = primaryToTest(primary)
    return { subject, stations, primary, primaryMax, test, next, move: next ? buildMove(next, primary, test) : null }
}

// Освоенность станции после хода: +1 урок тренажёра и +k задач задачника.
const masteryAfter = (s: EgeStation, addTrainer: number, addTasks: number) => {
    const hasCourse = s.courseTarget > 0, hasTrainer = s.trainerTotal > 0
    const c = hasCourse ? Math.min(1, (s.courseSolved + addTasks) / s.courseTarget) : 0
    const t = hasTrainer ? Math.min(1, (s.trainerDone + addTrainer) / s.trainerTotal) : 0
    if (hasCourse && hasTrainer) return COURSE_WEIGHT * c + (1 - COURSE_WEIGHT) * t
    if (hasCourse) return c
    return s.part === 2 ? t * PART2_TRAINER_ONLY_CAP : t
}

// Ход подбираем так, чтобы прыжок дал хотя бы +1 тестовый балл: урок тренажёра (если есть)
// и задачи задачника по 5, 10, 15… штук (не больше, чем осталось до «закрытия» станции).
function buildMove(s: EgeStation, primary: number, test: number): EgeMove {
    const addTrainer = s.trainerHref ? 1 : 0
    const maxTasks = s.lessonHref ? s.courseLeft : 0
    let tasks = 0
    let toPrimary = primary - s.earned + s.points * masteryAfter(s, addTrainer, 0)
    if (maxTasks > 0) {
        for (tasks = Math.min(5, maxTasks); ; tasks = Math.min(tasks + 5, maxTasks)) {
            toPrimary = primary - s.earned + s.points * masteryAfter(s, addTrainer, tasks)
            if (primaryToTest(toPrimary) > test || tasks >= maxTasks) break
        }
    }
    return {
        station: s,
        trainerLesson: s.trainerHref ? { href: s.trainerHref, title: s.trainerTitle ?? 'урок тренажёра' } : null,
        tasks: tasks > 0 && s.lessonHref ? { href: s.lessonHref, count: tasks, title: s.lessonTitle ?? 'задачи' } : null,
        fromTest: test, toTest: Math.max(test, primaryToTest(toPrimary)),
        fromPrimary: primary, toPrimary,
    }
}
