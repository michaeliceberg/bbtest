'use server'

// actions/ege-diagnostic.ts — диагностика «Мой путь» (см. lib/egeDiagnostic.ts).

import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { buildDiagResult, buildDiagnosticPlan, getCorrectText, getLatestDiagnostic, normalizeAnswer, type DiagResult } from '@/lib/egeDiagnostic'

const SUBJECT = 'math_profile'

// Начать диагностику (или продолжить незаконченную). Возвращает id.
export async function startEgeDiagnostic(): Promise<{ id: number } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Не авторизован' }
    const userId = session.user.id
    const active = await getLatestDiagnostic(userId, SUBJECT, 'active')
    if (active) return { id: active.id }
    const plan = await buildDiagnosticPlan(SUBJECT)
    if (!plan.length) return { error: 'Пока нет заданий для диагностики' }
    const rows = (await db.execute(sql`
        INSERT INTO ege_diagnostics (user_id, subject, status, plan, created_at)
        VALUES (${userId}, ${SUBJECT}, 'active', ${JSON.stringify(plan)}::jsonb, ${new Date().toISOString()})
        RETURNING id`)) as unknown as { id: number }[]
    return { id: Number(rows[0].id) }
}

// «Пройду позже» — экран-приглашение больше не открывается сам, на /path остаётся карточка.
export async function postponeEgeDiagnostic(): Promise<void> {
    const session = await auth()
    if (!session?.user?.id) return
    await db.execute(sql`
        INSERT INTO ege_diagnostics (user_id, subject, status, created_at)
        VALUES (${session.user.id}, ${SUBJECT}, 'postponed', ${new Date().toISOString()})`)
    revalidatePath('/path')
}

// Ответ на вопрос (answer = null — «Не знаю»). Проверяет сервер.
export async function answerEgeDiagnostic(id: number, num: number, level: number, answer: string | null): Promise<{ result: 'right' | 'wrong' | 'skip'; correct: string } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Не авторизован' }
    const d = await getLatestDiagnostic(session.user.id, SUBJECT, 'active')
    if (!d || d.id !== Number(id)) return { error: 'Диагностика не найдена' }
    const p = d.plan.find((x) => x.num === Number(num))
    const challengeId = p ? (Number(level) === 2 ? p.hard : p.easy) : null
    if (!challengeId) return { error: 'Нет такого вопроса' }
    const correct = (await getCorrectText(challengeId)) ?? ''
    const result = answer === null || !answer.trim() ? 'skip' : normalizeAnswer(answer) === normalizeAnswer(correct) ? 'right' : 'wrong'
    await db.execute(sql`
        INSERT INTO ege_diagnostic_answers (diagnostic_id, task_num, level, challenge_id, answer, result, created_at)
        VALUES (${d.id}, ${Number(num)}, ${Number(level)}, ${challengeId}, ${answer}, ${result}, ${new Date().toISOString()})
        ON CONFLICT (diagnostic_id, task_num, level) DO NOTHING`)
    return { result, correct }
}

// Закончить и получить итог.
export async function finishEgeDiagnostic(id: number): Promise<DiagResult | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Не авторизован' }
    const userId = session.user.id
    const rows = (await db.execute(sql`
        UPDATE ege_diagnostics SET status = 'done', finished_at = ${new Date().toISOString()}
        WHERE id = ${Number(id)} AND user_id = ${userId} AND status IN ('active', 'done') RETURNING id`)) as unknown as unknown[]
    if (!rows.length) return { error: 'Диагностика не найдена' }
    const d = await getLatestDiagnostic(userId, SUBJECT, 'done')
    if (!d) return { error: 'Диагностика не найдена' }
    revalidatePath('/path')
    return buildDiagResult(userId, SUBJECT, d)
}
