'use server'

// actions/ege-move.ts — «ход» по башне ЕГЭ (см. lib/egeMove.ts).

import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { egeMoves } from '@/db/schema'
import { createEgeMove, getActiveEgeMove, getEgeMove, nextStepAfter } from '@/lib/egeMove'
import { applyCaseReward, type OpenCaseResult } from '@/lib/caseApply'
import { getLessonCasePool } from '@/lib/caseRewards'

// Продолжить незаконченный ход или собрать новый. Возвращает id хода.
export async function startEgeMove(): Promise<{ id: number } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Не авторизован' }
    const userId = session.user.id
    const active = await getActiveEgeMove(userId)
    if (active) return { id: active.id }
    const m = await createEgeMove(userId)
    return m ? { id: m.id } : { error: 'Для этого задания пока нет заданий' }
}

// Шаг закончен (from = 'trainer' | 'tasks') — переходим к следующему.
export async function advanceEgeMove(id: number, from: 'trainer' | 'tasks'): Promise<void> {
    const session = await auth()
    if (!session?.user?.id) return
    const m = await getEgeMove(Number(id), session.user.id)
    if (!m || m.step !== from) return
    const next = nextStepAfter(m, from)
    await db.update(egeMoves)
        .set({ step: next, finishedAt: next === 'done' ? new Date() : null })
        .where(and(eq(egeMoves.id, m.id), eq(egeMoves.step, from)))
}

// Бонус за законченный ход — редкий кейс, один раз.
export async function claimEgeMoveCase(id: number): Promise<OpenCaseResult> {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Не авторизован' }
    const marked = await db.update(egeMoves)
        .set({ caseClaimed: true })
        .where(and(eq(egeMoves.id, Number(id)), eq(egeMoves.userId, session.user.id), eq(egeMoves.step, 'done'), eq(egeMoves.caseClaimed, false)))
        .returning({ id: egeMoves.id })
    if (marked.length === 0) return { success: false, error: 'Кейс уже получен' }
    return applyCaseReward(getLessonCasePool('rare'))
}
