import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import type { EgeMap, EgeStation } from '@/lib/egeMap'

// «Ангар»: задания 1–13 — предметы, 14–20 — детали ракеты. Ангар — карта задачника, у предмета два этапа:
//  1) Починить (первая радость, быстро): все тренажёры к заданию хотя бы на бронзу + FIX_TASKS задач раздела
//     (нет тренажёров — FIX_TASKS_NO_TRAINER задач; нет задачника — достаточно тренажёров).
//  2) Золото (долгая цель): решён весь раздел (TARGET_SOLVED задач) и все тренажёры на золоте — предмет блестит,
//     за него редкий кейс (case_keys source='hangar_gold', source_ref = номер задания, один раз).
// Починка — отдельное действие ученика (кнопка «Починить …»), хранится в hangar_fixed.

export const FIX_TASKS = 5
export const FIX_TASKS_NO_TRAINER = 8

export type HangarItemState = 'broken' | 'ready' | 'fixed'
export type HangarItem = {
    num: number; title: string; state: HangarItemState; progress: number; href: string | null
    // задачи раздела: решено / сколько нужно для починки / сколько для золота (0 — у задания нет задачника)
    tasks?: { solved: number; target: number; full: number }
    // темы тренажёра к заданию (percent > 0 — бронза, 100 — золото)
    trainers?: { title: string; percent: number }[]
    // «под брезентом»: тренажёры к заданию ещё не пройдены, а задач ещё не решал — задачи раздела закрыты
    locked?: boolean
    // золото: раздел решён весь и тренажёры на золоте (только у починенных); goldClaimed — кейс за него забран
    mastered?: boolean
    goldClaimed?: boolean
}

type TrainerKeyLite = { title: string; percent: number }

/** Можно ли починить предмет задания и достиг ли он золота. */
export function repairStatus(s: EgeStation, keys: TrainerKeyLite[]) {
    const bronze = keys.every((k) => k.percent > 0)
    const gold = keys.every((k) => k.percent >= 100)
    const need = s.courseTarget > 0 ? Math.min(s.courseTarget, keys.length ? FIX_TASKS : FIX_TASKS_NO_TRAINER) : 0
    const canFix = (keys.length > 0 || s.courseTarget > 0) && bronze && s.courseSolved >= need
    const mastered = canFix && gold && s.courseSolved >= s.courseTarget
    return { canFix, mastered, need }
}

export async function getFixedNums(userId: string): Promise<number[]> {
    const rows = (await db.execute(sql`SELECT task_num FROM hangar_fixed WHERE user_id = ${userId} ORDER BY fixed_at`)) as unknown as { task_num: number }[]
    return rows.map((r) => Number(r.task_num))
}

export async function getHangarItems(userId: string, map: EgeMap, keys: Record<number, TrainerKeyLite[]>): Promise<HangarItem[]> {
    const fixed = new Set(await getFixedNums(userId))
    const claimed = new Set(((await db.execute(sql`SELECT source_ref FROM case_keys WHERE user_id = ${userId} AND source = 'hangar_gold' AND used_at IS NOT NULL`)) as unknown as { source_ref: string }[]).map((r) => Number(r.source_ref)))
    return map.stations.map((s) => {
        const trainers = keys[s.num] ?? []
        const { canFix, mastered, need } = repairStatus(s, trainers)
        const state: HangarItemState = fixed.has(s.num) ? 'fixed' : canFix ? 'ready' : 'broken'
        const tDone = trainers.filter((k) => k.percent > 0).length
        return {
            num: s.num, title: s.title, state,
            progress: need > 0 ? Math.min(1, s.courseSolved / need) : trainers.length ? tDone / trainers.length : 0,
            href: s.lessonHref ?? s.trainerHref,
            tasks: { solved: s.courseSolved, target: need, full: s.courseTarget },
            trainers,
            locked: state === 'broken' && trainers.length > 0 && tDone < trainers.length && s.courseSolved === 0,
            mastered: state === 'fixed' && mastered,
            goldClaimed: claimed.has(s.num),
        }
    })
}
