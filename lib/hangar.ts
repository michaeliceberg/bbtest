import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import type { EgeMap, EgeStation } from '@/lib/egeMap'

// «Ангар» в «Моём пути»: задания 1–13 — предметы, 14–20 — детали ракеты.
// Раздел решён (готов к починке) — решено столько задач задачника, сколько нужно для «закрытия» станции
// (TARGET_SOLVED на юнит), а если у задания только тренажёр — пройдены все его уроки.
// Починка — отдельное действие ученика (кнопка «Починить …»), хранится в hangar_fixed.

export type HangarItemState = 'broken' | 'ready' | 'fixed'
export type HangarItem = {
    num: number; title: string; state: HangarItemState; progress: number; href: string | null
    // задачи задачника этого задания: решено / сколько нужно для починки (0 — у задания нет задачника)
    tasks?: { solved: number; target: number }
    // темы тренажёра к заданию (percent > 0 — тема пройдена, есть медаль)
    trainers?: { title: string; percent: number }[]
    // «под брезентом»: тренажёры к заданию ещё не пройдены, а задач ещё не решал — задачи раздела закрыты
    locked?: boolean
}

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
            tasks: { solved: s.courseSolved, target: s.courseTarget },
        }
    })
}

/** Ангар — карта задачника: сначала тренажёры к заданию, потом его задачи. Пока тренажёры не пройдены
 *  (все темы хотя бы с бронзой) и ни одной задачи раздела не решено — предмет под брезентом, раздел закрыт.
 *  Кто уже начал решать задачи раздела раньше — не запираем. */
export function withTrainers(items: HangarItem[], keys: Record<number, { title: string; percent: number }[]>): HangarItem[] {
    return items.map((it) => {
        const trainers = keys[it.num] ?? []
        const done = trainers.filter((k) => k.percent > 0).length
        const locked = it.state === 'broken' && trainers.length > 0 && done < trainers.length && (it.tasks?.solved ?? 0) === 0
        return { ...it, trainers, locked }
    })
}
