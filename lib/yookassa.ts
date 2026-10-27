import 'server-only'
import { randomUUID } from 'crypto'

// lib/yookassa.ts — обращение к API ЮKassa (https://yookassa.ru/developers/api).
// Ключи только в .env сервера: YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY (тестовый магазин — ключ вида test_…).
// Никогда не коммитить ключ.

const API_BASE = process.env.YOOKASSA_API_BASE || 'https://api.yookassa.ru/v3'

export const yookassaConfigured = () => !!process.env.YOOKASSA_SHOP_ID && !!process.env.YOOKASSA_SECRET_KEY
export const yookassaIsTest = () => (process.env.YOOKASSA_SECRET_KEY ?? '').startsWith('test_')

export type YkPayment = {
    id: string
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
    paid: boolean
    test?: boolean
    amount: { value: string; currency: string }
    metadata?: Record<string, string>
    confirmation?: { type: string; confirmation_url?: string }
    cancellation_details?: { reason?: string }
}

const authHeader = () =>
    'Basic ' + Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')

async function ykFetch<T>(path: string, init: RequestInit & { idempotenceKey?: string } = {}): Promise<T> {
    const headers: Record<string, string> = { Authorization: authHeader(), 'Content-Type': 'application/json' }
    if (init.idempotenceKey) headers['Idempotence-Key'] = init.idempotenceKey
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) throw new Error(`ЮKassa ${res.status}: ${text.slice(0, 300)}`)
    return JSON.parse(text) as T
}

// Создать платёж. Способ оплаты не задаём — ЮKassa покажет свою форму со всеми включёнными (СБП, карты, SberPay).
// Чек самозанятому ЮKassa оформляет сама через «Мой налог», receipt не передаём.
export function createYkPayment(opts: {
    amountRub: number
    description: string
    returnUrl: string
    metadata: Record<string, string>
    idempotenceKey?: string
}) {
    return ykFetch<YkPayment>('/payments', {
        method: 'POST',
        idempotenceKey: opts.idempotenceKey ?? randomUUID(),
        body: JSON.stringify({
            amount: { value: opts.amountRub.toFixed(2), currency: 'RUB' },
            capture: true,
            confirmation: { type: 'redirect', return_url: opts.returnUrl },
            description: opts.description.slice(0, 128),
            metadata: opts.metadata,
        }),
    })
}

export const getYkPayment = (id: string) => ykFetch<YkPayment>(`/payments/${encodeURIComponent(id)}`)
