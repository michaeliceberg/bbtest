'use server'

// Цель на ЕГЭ (тестовый балл) для экрана «Мой путь».
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { auth } from '@/lib/server-auth'
import { getVuz, vuzTargetScore } from '@/lib/vuzList'

export async function setEgeTarget(score: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Нужно войти')
    const v = Math.max(30, Math.min(100, Math.round(score)))
    await db.update(userProgress).set({ egeTarget: v }).where(eq(userProgress.userId, session.user.id))
    revalidatePath('/path')
    return v
}

// Вуз-цель: заодно ставим цель по баллу = средний проходной балл вуза.
export async function setTargetVuz(vuzId: string | null) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Нужно войти')
    const vuz = getVuz(vuzId)
    await db.update(userProgress)
        .set(vuz ? { targetVuz: vuz.id, egeTarget: vuzTargetScore(vuz) } : { targetVuz: null })
        .where(eq(userProgress.userId, session.user.id))
    revalidatePath('/path')
    revalidatePath('/learn')
    return { vuzId: vuz?.id ?? null, target: vuz ? vuzTargetScore(vuz) : null }
}
