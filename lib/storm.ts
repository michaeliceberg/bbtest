// lib/storm.ts — «Штурм»: горячие 10 минут. Раз в день после завершённого урока тренажёра с шансом STORM_CHANCE
// начинается штурм: за каждый урок в эти 10 минут — бонусные монеты и почти гарантированный кейс получше,
// а за STORM_GOAL уроков — гарантированный мифический кейс. Урок, который запустил штурм, не считается.
// Состояние — на user_progress (storm_*). Вызывается из actions/plan-lesson-case.ts один раз на урок.
import 'server-only'
import { eq, sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'

import { STORM_COINS_PER_LESSON_UI, STORM_GOAL_UI, STORM_MINUTES_UI } from '@/lib/stormUi'

export const STORM_MINUTES = STORM_MINUTES_UI
export const STORM_GOAL = STORM_GOAL_UI
export const STORM_COINS_PER_LESSON = STORM_COINS_PER_LESSON_UI
const STORM_CHANCE = 0.35
// Урок, начатый в последние секунды штурма, ещё засчитываем.
const STORM_GRACE_MS = 45_000

export type StormState = {
    active: boolean
    until: string | null
    lessons: number
    goal: number
    rewarded: boolean
    started: boolean // штурм начался прямо после этого урока
    counted: boolean // этот урок засчитан в штурм (+монеты)
    mythicNow: boolean // этим уроком набрано STORM_GOAL — мифический кейс
    coins: number
}

const mskDay = (d = new Date()) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10)

// Для плашки с отсчётом (components/storm-pill.tsx): идёт ли штурм прямо сейчас.
export function stormView(row: { stormUntil: Date | null; stormLessons: number; stormRewarded: boolean } | null | undefined) {
    if (!row?.stormUntil || row.stormUntil.getTime() <= Date.now()) return null
    return { until: row.stormUntil.toISOString(), lessons: row.stormLessons, goal: STORM_GOAL, rewarded: row.stormRewarded }
}

export async function advanceStorm(userId: string): Promise<StormState | null> {
    const row = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        columns: { stormUntil: true, stormLessons: true, stormDay: true, stormRewarded: true },
    })
    if (!row) return null
    const now = Date.now()

    if (row.stormUntil && now <= row.stormUntil.getTime() + STORM_GRACE_MS) {
        const lessons = row.stormLessons + 1
        const mythicNow = !row.stormRewarded && lessons >= STORM_GOAL
        await db.update(userProgress).set({
            stormLessons: lessons,
            stormRewarded: row.stormRewarded || mythicNow,
            points: sql`${userProgress.points} + ${STORM_COINS_PER_LESSON}`,
        }).where(eq(userProgress.userId, userId))
        return {
            active: now <= row.stormUntil.getTime(), until: row.stormUntil.toISOString(), lessons, goal: STORM_GOAL,
            rewarded: row.stormRewarded || mythicNow, started: false, counted: true, mythicNow, coins: STORM_COINS_PER_LESSON,
        }
    }

    if (row.stormDay !== mskDay() && Math.random() < STORM_CHANCE) {
        const until = new Date(now + STORM_MINUTES * 60_000)
        await db.update(userProgress).set({ stormUntil: until, stormLessons: 0, stormRewarded: false, stormDay: mskDay() })
            .where(eq(userProgress.userId, userId))
        return { active: true, until: until.toISOString(), lessons: 0, goal: STORM_GOAL, rewarded: false, started: true, counted: false, mythicNow: false, coins: 0 }
    }
    return null
}
