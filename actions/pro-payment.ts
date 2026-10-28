'use server'

import { headers } from 'next/headers'
import { and, desc, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { proPayments, userProgress } from '@/db/schema'
import { auth } from '@/lib/server-auth'
import { PRO_PRICE_RUB } from '@/lib/pro'

// Админ платит символическую сумму за 1 день — проверка настоящей оплаты и чека без 1100 ₽.
const ADMIN_TEST_PRICE_RUB = 10
import { PRO_DAYS, syncProPayment } from '@/lib/proPayments'
import { createYkPayment, yookassaConfigured, yookassaIsTest } from '@/lib/yookassa'

// Кнопка «Купить PRO»: создаём платёж в ЮKassa и отдаём ссылку на её форму оплаты.
export async function startProPayment(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false, error: 'Сначала войди в аккаунт' }
    if (!yookassaConfigured()) return { ok: false, error: 'Оплата ещё не подключена' }

    const h = headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'ggege.ru'
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

    const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId), columns: { isAdmin: true } })
    const isAdmin = up?.isAdmin === 1
    const amountRub = isAdmin ? ADMIN_TEST_PRICE_RUB : PRO_PRICE_RUB
    const days = isAdmin ? 1 : PRO_DAYS
    const [row] = await db
        .insert(proPayments)
        .values({ userId, amountRub, days, test: yookassaIsTest() })
        .returning({ id: proPayments.id })

    try {
        const p = await createYkPayment({
            amountRub,
            description: isAdmin ? 'Проверка оплаты ggege PRO (1 день)' : `Подписка ggege PRO на ${PRO_DAYS} дней`,
            returnUrl: `${proto}://${host}/pro?paid=${row.id}`,
            metadata: { userId, localId: String(row.id) },
            idempotenceKey: `pro-${row.id}`,
        })
        const url = p.confirmation?.confirmation_url
        if (!url) throw new Error('нет confirmation_url')
        await db.update(proPayments).set({ ykPaymentId: p.id, status: p.status }).where(eq(proPayments.id, row.id))
        return { ok: true, url }
    } catch (e) {
        console.error('startProPayment', e)
        await db.update(proPayments).set({ status: 'error' }).where(eq(proPayments.id, row.id))
        return { ok: false, error: 'Не получилось открыть оплату, попробуй ещё раз' }
    }
}

// Страница /pro после возврата с оплаты: узнать, чем закончился платёж (и продлить PRO, если webhook ещё не дошёл).
export async function checkProPayment(localId: number): Promise<{ status: string; proUntil: string | null; receiptUrl?: string | null }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { status: 'unknown', proUntil: null }
    const row = await db.query.proPayments.findFirst({
        where: and(eq(proPayments.id, localId), eq(proPayments.userId, userId)),
        orderBy: desc(proPayments.id),
    })
    if (!row?.ykPaymentId) return { status: row?.status ?? 'unknown', proUntil: null }
    try {
        const r = await syncProPayment(row.ykPaymentId)
        const fresh = await db.query.proPayments.findFirst({ where: eq(proPayments.id, row.id) })
        return { status: r.status, proUntil: r.proUntil ? r.proUntil.toISOString() : null, receiptUrl: fresh?.receiptUrl ?? null }
    } catch (e) {
        console.error('checkProPayment', e)
        return { status: row.status, proUntil: null }
    }
}
