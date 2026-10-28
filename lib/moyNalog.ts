import 'server-only'
import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { nalogAuth } from '@/db/schema'
import { loginByPassword, newDeviceId, receiptUrl, refreshAuth, registerIncome } from '@/lib/moyNalogApi'

// lib/moyNalog.ts — чек в «Мой налог» после оплаты PRO.
// Вход: строка nalog_auth (refreshToken, его кладёт scripts/nalogLogin.ts по СМС или сам вход по паролю),
// либо .env NALOG_INN + NALOG_PASSWORD (пароль от lknpd.nalog.ru). Никогда не коммитить пароль.

export const proReceiptName = (days: number) =>
    `Доступ к обучающей платформе ggege.ru (PRO на ${days} ${days === 1 ? 'день' : 'дней'})`

let cached: { token: string; until: number } | null = null

async function getToken(): Promise<{ token: string; inn: string }> {
    const row = await db.query.nalogAuth.findFirst({ where: eq(nalogAuth.id, 1) })
    const inn = row?.inn || process.env.NALOG_INN || ''
    if (!inn) throw new Error('не задан ИНН для «Мой налог»')
    if (cached && cached.until > Date.now()) return { token: cached.token, inn }

    const deviceId = row?.deviceId || newDeviceId()
    let auth = null
    if (row?.refreshToken) {
        try { auth = await refreshAuth(row.refreshToken, deviceId) } catch (e) { console.error('nalog refresh', e) }
    }
    if (!auth && process.env.NALOG_PASSWORD) auth = await loginByPassword(inn, process.env.NALOG_PASSWORD, deviceId)
    if (!auth?.token) throw new Error('нет входа в «Мой налог» (refreshToken устарел, пароля нет)')

    const values = { id: 1, inn, deviceId, refreshToken: auth.refreshToken || row?.refreshToken || null, updatedAt: new Date() }
    await db.insert(nalogAuth).values(values).onConflictDoUpdate({ target: nalogAuth.id, set: values })
    const until = auth.tokenExpireIn ? new Date(auth.tokenExpireIn).getTime() - 60_000 : Date.now() + 30 * 60_000
    cached = { token: auth.token, until }
    return { token: auth.token, inn }
}

export const nalogConfigured = () => !!process.env.NALOG_INN

// Пробить чек. Ошибку не бросает — возвращает текст, чтобы оплата PRO не ломалась из-за налоговой.
export async function issueReceipt(opts: { name: string; amountRub: number; operationTime: Date }):
    Promise<{ ok: true; uuid: string; url: string } | { ok: false; error: string }> {
    try {
        const { token, inn } = await getToken()
        const uuid = await registerIncome(token, opts)
        return { ok: true, uuid, url: receiptUrl(inn, uuid) }
    } catch (e) {
        cached = null
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
}
