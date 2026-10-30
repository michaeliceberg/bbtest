'use server'

// Ответ в мини-игре «Словарь физтеха» (components/fiztech-dict-game.tsx): пишем в fiztech_dict_answers
// и пересчитываем ачивки группы «Крупицы» (lib/achievements.ts). Гость — ничего не пишем.
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { syncAchievements } from '@/lib/achievements'
import { isDictWord } from '@/lib/zaNauku'

export async function recordDictAnswer(word: string, correct: boolean): Promise<{ ok: boolean }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId || typeof word !== 'string' || !isDictWord(word)) return { ok: false }
    await db.execute(sql`INSERT INTO fiztech_dict_answers (user_id, word, correct) VALUES (${userId}, ${word}, ${!!correct})`)
    await syncAchievements(userId).catch(() => {})
    return { ok: true }
}
