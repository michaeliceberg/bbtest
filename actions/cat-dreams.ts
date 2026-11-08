'use server'

// Загадки из снов котика (lib/catDreams.ts, components/hangar-cat.tsx). Таблица cat_dream_answers:
// одна строка на ответ, night_key — «ночь» по Москве (дата 12 часов назад: ночь с 7 на 8 — это 7-е).
// За ночь не больше CAT_DREAMS_PER_NIGHT разных загадок (повторный ответ на ту же — можно).
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { syncAchievements } from '@/lib/achievements'
import { CAT_DREAM_BY_ID, CAT_DREAMS_PER_NIGHT, sameDreamAnswer } from '@/lib/catDreams'

type Row = Record<string, unknown>
const NIGHT = sql.raw(`((now() AT TIME ZONE 'Europe/Moscow') - interval '12 hours')::date`)

export type CatDreamState = { solved: number[]; tonight: number[]; left: number }

async function stateOf(userId: string): Promise<CatDreamState> {
    const r = (await db.execute(sql`
        SELECT coalesce(array_agg(DISTINCT dream_id) FILTER (WHERE correct), '{}') AS solved,
               coalesce(array_agg(DISTINCT dream_id) FILTER (WHERE night_key = ${NIGHT}), '{}') AS tonight
        FROM cat_dream_answers WHERE user_id = ${userId}`)) as unknown as Row[]
    const solved = ((r[0]?.solved as number[]) ?? []).map(Number)
    const tonight = ((r[0]?.tonight as number[]) ?? []).map(Number)
    return { solved, tonight, left: Math.max(0, CAT_DREAMS_PER_NIGHT - tonight.length) }
}

export async function getCatDreamState(): Promise<CatDreamState | null> {
    const userId = (await auth())?.user?.id
    if (!userId) return null
    return stateOf(userId)
}

export async function answerCatDream(dreamId: number, answer: string): Promise<
    { ok: false; limit?: boolean } | { ok: true; correct: boolean; state: CatDreamState }
> {
    const userId = (await auth())?.user?.id
    const dream = CAT_DREAM_BY_ID.get(Number(dreamId))
    if (!userId || !dream || typeof answer !== 'string' || answer.length > 20) return { ok: false }
    const before = await stateOf(userId)
    if (!before.tonight.includes(dream.id) && before.left <= 0) return { ok: false, limit: true }
    const correct = sameDreamAnswer(answer, dream.a)
    await db.execute(sql`INSERT INTO cat_dream_answers (user_id, dream_id, correct, night_key) VALUES (${userId}, ${dream.id}, ${correct}, ${NIGHT})`)
    if (correct) await syncAchievements(userId).catch(() => {})
    return { ok: true, correct, state: await stateOf(userId) }
}
