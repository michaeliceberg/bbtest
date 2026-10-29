import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import type { EgeMap, EgeStation } from '@/lib/egeMap'

// «Ангар» в «Моём пути»: задания 1–13 — предметы, 14–20 — детали ракеты.
// Раздел решён (готов к починке) — решено столько задач задачника, сколько нужно для «закрытия» станции
// (TARGET_SOLVED на юнит), а если у задания только тренажёр — пройдены все его уроки.
// Починка — отдельное действие ученика (кнопка «Починить …»), хранится в hangar_fixed.

export type HangarItemState = 'broken' | 'ready' | 'fixed'
export type HangarItem = { num: number; title: string; state: HangarItemState; progress: number; href: string | null }

export const isStationDone = (s: EgeStation) =>
    s.courseTarget > 0 ? s.courseSolved >= s.courseTarget : s.trainerTotal > 0 && s.trainerDone >= s.trainerTotal

export async function getFixedNums(userId: string): Promise<number[]> {
    const rows = (await db.execute(sql`SELECT task_num FROM hangar_fixed WHERE user_id = ${userId} ORDER BY fixed_at`)) as unknown as { task_num: number }[]
    return rows.map((r) => Number(r.task_num))
}

export async function getHangarItems(userId: string, map: EgeMap): Promise<HangarItem[]> {
    const fixed = new Set(await getFixedNums(userId))
    return map.stations.map((s) => {
        const progress = s.courseTarget > 0 ? s.courseSolved / s.courseTarget : s.trainerTotal > 0 ? s.trainerDone / s.trainerTotal : 0
        return {
            num: s.num, title: s.title,
            state: fixed.has(s.num) ? 'fixed' : isStationDone(s) ? 'ready' : 'broken',
            progress: Math.min(1, progress),
            href: s.lessonHref ?? s.trainerHref,
        }
    })
}
