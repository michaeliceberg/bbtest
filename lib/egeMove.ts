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

    let ids: number[] = []
    const count = mv.tasks?.count ?? 0
    if (count > 0 && st.unitIds.length) {
        const units = st.unitIds
        const rows = (await db.execute(sql`
            SELECT c.id FROM challenges c JOIN lessons l ON l.id = c.lesson_id
            WHERE l.unit_id IN ${sql.raw(`(${units.join(',')})`)}
              AND NOT EXISTS (SELECT 1 FROM challenge_progress cp WHERE cp.challenge_id = c.id AND cp.user_id = ${userId}
                              AND (cp.done_right OR cp.date_done > now() - interval '24 hours'))
            ORDER BY array_position(${sql.raw(`ARRAY[${units.join(',')}]`)}, l.unit_id), l."order", c."order", c.id
            LIMIT ${count}`)) as unknown as Row[]
        ids = rows.map((r) => Number(r.id))
    }
    if (!tLessonId && ids.length === 0) return null

    const [row] = await db.insert(egeMoves).values({
        userId, taskNum: st.num, tLessonId,
        challengeIds: ids.join(','),
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
