'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/auth'

// Запоминает слабые места: ошибка +1 (максимум 6), верный ответ −1 (минимум 0).
export const recordChallengeResult = async (t_challengeId: number, isRight: boolean) => {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return
    if (isRight) {
        await db.execute(sql`UPDATE t_challenge_mistakes SET wrong_count = GREATEST(wrong_count - 1, 0), updated_at = now() WHERE user_id = ${userId} AND t_challenge_id = ${t_challengeId}`)
    } else {
        await db.execute(sql`INSERT INTO t_challenge_mistakes (user_id, t_challenge_id, wrong_count) VALUES (${userId}, ${t_challengeId}, 1)
            ON CONFLICT (user_id, t_challenge_id) DO UPDATE SET wrong_count = LEAST(t_challenge_mistakes.wrong_count + 1, 6), updated_at = now()`)
    }
}
