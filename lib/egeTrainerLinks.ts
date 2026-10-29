import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'

// Связи «тема тренажёра ↔ задание ЕГЭ» (ege_task_links kind='t_unit') + прогресс ученика по теме.
// Процент темы — как у медали на карте тренажёра (GetTUnitCompletionPercent): доля уроков темы,
// где верных ответов ≥ 50%.

export type TrainerKey = { tUnitId: number; title: string; percent: number }

type Row = Record<string, unknown>

/** Номер задания ЕГЭ → темы тренажёра, которые к нему готовят (порядок — как в ege_task_links). */
export async function getTrainerKeysByTask(userId: string | null, subject = 'math_profile'): Promise<Record<number, TrainerKey[]>> {
    const rows = (await db.execute(sql`
        SELECT t.num, u.id AS t_unit_id, u.title,
            (SELECT count(*) FROM t_lessons tl WHERE tl.t_unit_id = u.id) AS total,
            (SELECT count(*) FROM t_lessons tl WHERE tl.t_unit_id = u.id AND (
                SELECT CASE WHEN sum(p.done_right) > 0 AND sum(p.done_right)::float / nullif(sum(p.done_right + p.done_wrong), 0) >= 0.5 THEN 1 ELSE 0 END
                FROM t_lesson_progress p WHERE p.t_lesson_id = tl.id AND p.user_id = ${userId ?? ''}) = 1) AS done
        FROM ege_task_links l
        JOIN ege_tasks t ON t.id = l.task_id
        JOIN t_units u ON u.id = l.ref_id
        WHERE l.kind = 't_unit' AND t.subject = ${subject}
        ORDER BY t.num, l.id`)) as unknown as Row[]
    const out: Record<number, TrainerKey[]> = {}
    for (const r of rows) {
        const num = Number(r.num), total = Number(r.total)
        ;(out[num] ??= []).push({
            tUnitId: Number(r.t_unit_id),
            title: String(r.title),
            percent: total > 0 ? Math.round((Number(r.done) / total) * 100) : 0,
        })
    }
    return out
}

/** Тема тренажёра → номера заданий ЕГЭ, к которым она готовит. */
export async function getEgeTasksByTUnit(subject = 'math_profile'): Promise<Record<number, number[]>> {
    const rows = (await db.execute(sql`
        SELECT l.ref_id, t.num FROM ege_task_links l JOIN ege_tasks t ON t.id = l.task_id
        WHERE l.kind = 't_unit' AND t.subject = ${subject} ORDER BY t.num`)) as unknown as Row[]
    const out: Record<number, number[]> = {}
    for (const r of rows) (out[Number(r.ref_id)] ??= []).push(Number(r.num))
    return out
}
