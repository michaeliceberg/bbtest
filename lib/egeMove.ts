import 'server-only'

// lib/egeMove.ts
//
// «Ход» по башне ЕГЭ (/path → /move/[id]): 1 урок тренажёра + N задач задачника
// одного задания экзамена. Шаги: 'trainer' → 'tasks' → 'done'.
// Задача «сделана» в ходе, когда на неё ответили (верно или нет); в копилку
// идут только верные — неверную можно перерешать через 24 часа, как в задачнике.

import { sql, and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { egeMoves } from '@/db/schema'
import { getEgeMap } from '@/lib/egeMap'

export type EgeMoveRow = typeof egeMoves.$inferSelect
type Row = Record<string, unknown>

// Незаконченный ход старше 3 дней не продолжаем — соберём новый.
const ACTIVE_MOVE_MAX_AGE_DAYS = 3

export const moveChallengeIds = (m: EgeMoveRow) => m.challengeIds.split(',').filter(Boolean).map(Number)

export async function getEgeMove(id: number, userId: string): Promise<EgeMoveRow | null> {
    const m = await db.query.egeMoves.findFirst({ where: and(eq(egeMoves.id, id), eq(egeMoves.userId, userId)) })
    return m ?? null
}

export async function getActiveEgeMove(userId: string): Promise<EgeMoveRow | null> {
    const rows = (await db.execute(sql`
        SELECT id FROM ege_moves
        WHERE user_id = ${userId} AND step <> 'done'
          AND created_at > now() - make_interval(days => ${ACTIVE_MOVE_MAX_AGE_DAYS})
        ORDER BY id DESC LIMIT 1`)) as unknown as Row[]
    return rows[0] ? getEgeMove(Number(rows[0].id), userId) : null
}

// Собирает новый ход по «следующему ходу» карты: конкретный урок тренажёра
// (если вся тема пройдена — повторяем первый урок темы) и конкретные задачи
// задачника — ещё не решённые верно и не решавшиеся в последние 24 часа.
export async function createEgeMove(userId: string): Promise<EgeMoveRow | null> {
    const map = await getEgeMap(userId)
    const mv = map.move
    if (!mv) return null
    const st = mv.station

    let tLessonId: number | null = null
    const href = mv.trainerLesson?.href.match(/\/t-lesson\/(\d+)/)
    if (href) tLessonId = Number(href[1])
    else if (st.tUnitIds.length) {
        const r = (await db.execute(sql`
            SELECT id FROM t_lessons WHERE t_unit_id = ${st.tUnitIds[0]} ORDER BY "order", id LIMIT 1`)) as unknown as Row[]
        if (r[0]) tLessonId = Number(r[0].id)
    }

    const ids = await pickMoveTasks(userId, st.unitIds, mv.tasks?.count ?? 0, [])
    if (!tLessonId && ids.length === 0) return null

    const [row] = await db.insert(egeMoves).values({
        userId, taskNum: st.num, tLessonId,
        challengeIds: ids.join(','),
        targetTasks: ids.length,
        step: tLessonId ? 'trainer' : 'tasks',
        fromPrimary: map.primary,
        // Время пишем из приложения, как и challenge_progress.date_done (колонки без
        // часового пояса): иначе сравнение «ответил после начала хода» съезжает на часы.
        createdAt: new Date(),
    }).returning()
    return row
}

export function nextStepAfter(m: EgeMoveRow, from: string): string {
    if (from === 'trainer') return moveChallengeIds(m).length ? 'tasks' : 'done'
    return 'done'
}

// Задачи хода в той же форме, что getLesson().challenges (для app/lesson/quiz.tsx),
// в порядке, заданном в ходе.
export async function getMoveChallenges(m: EgeMoveRow, userId: string) {
    const ids = moveChallengeIds(m)
    if (!ids.length) return []
    const rows = await db.query.challenges.findMany({
        where: (c, { inArray }) => inArray(c.id, ids),
        with: {
            challengeOptions: true,
            challengeProgress: { where: (cp, { eq: e }) => e(cp.userId, userId) },
            skillTags: { with: { t_unit: { with: { t_lessons: { orderBy: (t, { asc }) => [asc(t.order)] } } } } },
        },
    })
    const byId = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c).map((c) => ({
        ...c,
        completed: c.challengeProgress.length > 0 && c.challengeProgress.every((p) => p.completed),
    }))
}

// Законченный ход с ещё не открытым кейсом (ученик ушёл с финала хода) — плашка на «Моём пути».
export async function getUnclaimedMoveCase(userId: string): Promise<{ id: number; taskNum: number } | null> {
    const rows = (await db.execute(sql`
        SELECT id, task_num FROM ege_moves
        WHERE user_id = ${userId} AND step = 'done' AND NOT case_claimed
        ORDER BY id DESC LIMIT 1`)) as unknown as Row[]
    return rows[0] ? { id: Number(rows[0].id), taskNum: Number(rows[0].task_num) } : null
}

// Задачи для хода: ещё не решённые верно и не решавшиеся последние сутки, не из exclude.
// preferNumeric — сначала задачи с числовым ответом (их в ходе даём клавиатурой, наугад не подобрать).
async function pickMoveTasks(userId: string, units: number[], count: number, exclude: number[], preferNumeric = false): Promise<number[]> {
    if (count <= 0 || !units.length) return []
    const ex = exclude.length ? sql.raw(`AND c.id NOT IN (${exclude.join(',')})`) : sql``
    const numericFirst = preferNumeric
        ? sql.raw(`(c.type = 'ASSIST' AND EXISTS (SELECT 1 FROM challenge_options o WHERE o.challenge_id = c.id AND o.correct AND trim(o.text) ~ '^-?[0-9]+([.,][0-9]+)?$')) DESC,`)
        : sql``
    const rows = (await db.execute(sql`
        SELECT c.id FROM challenges c JOIN lessons l ON l.id = c.lesson_id
        WHERE l.unit_id IN ${sql.raw(`(${units.join(',')})`)} ${ex}
          AND NOT EXISTS (SELECT 1 FROM challenge_progress cp WHERE cp.challenge_id = c.id AND cp.user_id = ${userId}
                          AND (cp.done_right OR cp.date_done > now() - interval '24 hours'))
        ORDER BY ${numericFirst} array_position(${sql.raw(`ARRAY[${units.join(',')}]`)}, l.unit_id), l."order", c."order", c.id
        LIMIT ${count}`)) as unknown as Row[]
    return rows.map((r) => Number(r.id))
}

const unitsOfTask = async (taskNum: number): Promise<number[]> => {
    const rows = (await db.execute(sql`
        SELECT l.ref_id FROM ege_task_links l JOIN ege_tasks t ON t.id = l.task_id
        WHERE t.num = ${taskNum} AND t.subject = 'math_profile' AND l.kind = 'unit'`)) as unknown as Row[]
    return rows.map((r) => Number(r.ref_id))
}

export const moveTarget = (m: EgeMoveRow) => m.targetTasks ?? moveChallengeIds(m).length

// Состояние задач хода: ответ засчитывается, если дан после начала хода.
export async function moveTaskStatus(m: EgeMoveRow, userId: string) {
    const ids = moveChallengeIds(m)
    const target = moveTarget(m)
    if (!ids.length) return { target, correct: 0, wrong: 0, pending: 0 }
    const rows = (await db.execute(sql`
        SELECT challenge_id, bool_or(done_right) AS right FROM challenge_progress
        WHERE user_id = ${userId} AND challenge_id IN ${sql.raw(`(${ids.join(',')})`)}
          AND date_done >= ${m.createdAt.toISOString()}
        GROUP BY challenge_id`)) as unknown as Row[]
    const correct = rows.filter((r) => r.right).length
    const wrong = rows.length - correct
    return { target, correct, wrong, pending: ids.length - rows.length }
}

// Ошибки в ходе заменяем задачами-близнецами того же задания (пока не наберётся target верных).
// Возвращает, сколько задач добавлено; 0 — замен не нужно или задачи задания закончились.
export async function addMoveReplacements(m: EgeMoveRow, userId: string): Promise<number> {
    const st = await moveTaskStatus(m, userId)
    const need = st.target - st.correct - st.pending
    if (need <= 0) return 0
    const ids = moveChallengeIds(m)
    const extra = await pickMoveTasks(userId, await unitsOfTask(m.taskNum), need, ids, true)
    if (!extra.length) return 0
    await db.update(egeMoves)
        .set({ challengeIds: [...ids, ...extra].join(','), targetTasks: st.target })
        .where(eq(egeMoves.id, m.id))
    return extra.length
}

// Есть ли ещё задачи-близнецы для замены ошибок (иначе ошибку перерешиваем в самом ходе).
export async function moveHasTwins(m: EgeMoveRow, userId: string): Promise<boolean> {
    return (await pickMoveTasks(userId, await unitsOfTask(m.taskNum), 1, moveChallengeIds(m))).length > 0
}
