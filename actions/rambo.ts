'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/auth'
import { checkRamboAnswers, RAMBO_LEVELS, RAMBO_PASS_SHARE } from '@/lib/rambo'

/** Монет за каждый верный ответ в «Рэмбо». */
const COINS_PER_RIGHT = 3

/** Конец сессии «Рэмбо»: ответы перепроверяются на сервере, результат пишется в rambo_runs, монеты — за верные. */
export async function finishRambo(taskNum: number, level: number, answers: { kind: 't' | 'c'; id: number; answer: string }[]) {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error('Нужно войти')
    if (!(taskNum >= 1 && taskNum <= 20 && level >= 1 && level <= RAMBO_LEVELS)) throw new Error('Неверная клетка')
    const total = Math.min(answers.length, 20)
    const correct = await checkRamboAnswers(answers)
    await db.execute(sql`INSERT INTO rambo_runs (user_id, task_num, level, correct, total) VALUES (${userId}, ${taskNum}, ${level}, ${correct}, ${total})`)
    const coins = correct * COINS_PER_RIGHT
    if (coins > 0) await db.execute(sql`UPDATE user_progress SET points = points + ${coins} WHERE user_id = ${userId}`)
    return { correct, total, passed: total > 0 && correct / total >= RAMBO_PASS_SHARE, coins }
}
