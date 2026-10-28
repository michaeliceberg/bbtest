import 'server-only'
import { and, eq, isNull } from 'drizzle-orm'
import db from '@/db/drizzle'
import { proPayments, userProgress } from '@/db/schema'
import { getYkPayment, type YkPayment } from '@/lib/yookassa'
import { sendMessageToTelegram } from '@/utils/telegram'
import { issueReceipt, nalogConfigured, proReceiptName } from '@/lib/moyNalog'

// lib/proPayments.ts — оплата PRO: сверка платежа с ЮKassa и продление подписки.
// Статусу из тела webhook не доверяем: всегда перечитываем платёж по API.

export const PRO_DAYS = 30

export type SyncResult = { status: YkPayment['status'] | 'unknown'; applied: boolean; proUntil: Date | null }

// Перечитать платёж в ЮKassa, обновить строку и, если оплачен, один раз продлить PRO.
// Вызывается и из webhook, и со страницы /pro после возврата с оплаты — что успеет первым.
export async function syncProPayment(ykPaymentId: string): Promise<SyncResult> {
    const row = await db.query.proPayments.findFirst({ where: eq(proPayments.ykPaymentId, ykPaymentId) })
    if (!row) return { status: 'unknown', applied: false, proUntil: null }

    const p = await getYkPayment(ykPaymentId)
    const amountOk = Math.round(Number(p.amount.value)) === row.amountRub && p.amount.currency === 'RUB'
    const userOk = p.metadata?.userId === row.userId

    if (p.status !== 'succeeded' || !p.paid) {
        if (p.status !== row.status) await db.update(proPayments).set({ status: p.status }).where(eq(proPayments.id, row.id))
        return { status: p.status, applied: false, proUntil: null }
    }

    if (!amountOk || !userOk) {
        await db.update(proPayments).set({ status: 'mismatch' }).where(eq(proPayments.id, row.id))
        await sendMessageToTelegram(`⚠️ Оплата PRO не сошлась: платёж ${ykPaymentId}, сумма ${p.amount.value}, ученик ${row.userId}`)
        return { status: p.status, applied: false, proUntil: null }
    }

    // Захватываем строку: продлить может только тот, кто первым поставил applied_at.
    const now = new Date()
    const claimed = await db
        .update(proPayments)
        .set({ status: 'succeeded', paidAt: row.paidAt ?? now, appliedAt: now, test: !!p.test })
        .where(and(eq(proPayments.id, row.id), isNull(proPayments.appliedAt)))
        .returning({ id: proPayments.id })

    const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, row.userId) })
    if (claimed.length === 0) return { status: 'succeeded', applied: true, proUntil: up?.proUntil ?? null }

    const base = up?.proUntil && up.proUntil.getTime() > now.getTime() ? up.proUntil : now
    const proUntil = new Date(base.getTime() + row.days * 24 * 3600 * 1000)
    await db.update(userProgress).set({ proUntil }).where(eq(userProgress.userId, row.userId))

    const name = up?.nickname || up?.userName || row.userId
    const paidAt = row.paidAt ?? now
    // Чек в «Мой налог». Тестовые оплаты (тестовый магазин ЮKassa) в налоговую НЕ отправляем.
    let receiptLine = ''
    if (p.test) receiptLine = '\nЧек: не нужен (тестовая оплата)'
    else if (!nalogConfigured()) receiptLine = `\n⚠️ Чек не пробит (не подключён «Мой налог»). Пробей вручную: ${proReceiptName(row.days)}, ${row.amountRub} ₽, физлицо, ${paidAt.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
    else {
        const r = await issueReceipt({ name: proReceiptName(row.days), amountRub: row.amountRub, operationTime: paidAt })
        if (r.ok) {
            await db.update(proPayments).set({ receiptUuid: r.uuid, receiptUrl: r.url, receiptError: null }).where(eq(proPayments.id, row.id))
            receiptLine = `\n🧾 Чек пробит: ${r.url}`
        } else {
            await db.update(proPayments).set({ receiptError: r.error.slice(0, 500) }).where(eq(proPayments.id, row.id))
            receiptLine = `\n⚠️ Чек НЕ пробит (${r.error.slice(0, 120)}). Пробей вручную: ${proReceiptName(row.days)}, ${row.amountRub} ₽, физлицо, ${paidAt.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
        }
    }
    await sendMessageToTelegram(
        `💰 ${p.test ? '[ТЕСТ] ' : ''}Оплата PRO: ${row.amountRub} ₽\n${name}\nPRO до ${proUntil.toLocaleDateString('ru-RU')}${receiptLine}`,
    )
    return { status: 'succeeded', applied: true, proUntil }
}
