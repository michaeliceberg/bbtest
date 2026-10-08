'use server'

// Цель на ЕГЭ (тестовый балл) для экрана «Мой путь».
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { auth } from '@/lib/server-auth'

export async function setEgeTarget(score: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Нужно войти')
    const v = Math.max(30, Math.min(100, Math.round(score)))
    await db.update(userProgress).set({ egeTarget: v }).where(eq(userProgress.userId, session.user.id))
    revalidatePath('/path')
    return v
}
