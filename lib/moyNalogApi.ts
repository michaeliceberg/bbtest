// lib/moyNalogApi.ts — обращение к кабинету самозанятого «Мой налог» (lknpd.nalog.ru).
// Официального API нет: это те же запросы, что делает сам сайт lknpd.nalog.ru. Если ФНС его поменяет —
// чек не пробьётся, админу придёт сообщение «пробей вручную» (lib/moyNalog.ts).
// Без 'server-only': файл используется и скриптом входа по СМС (scripts/nalogLogin.ts).

const BASE = 'https://lknpd.nalog.ru/api/v1'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export type NalogAuth = { token: string; refreshToken: string; tokenExpireIn?: string; profile?: { inn?: string } }

const deviceInfo = (deviceId: string) => ({
    sourceDeviceId: deviceId,
    sourceType: 'WEB',
    appVersion: '1.0.0',
    metaDetails: { userAgent: USER_AGENT },
})

export function newDeviceId() {
    const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length: 21 }, () => abc[Math.floor(Math.random() * abc.length)]).join('')
}

async function call<T>(path: string, body: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': USER_AGENT }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) throw new Error(`Мой налог ${path} ${res.status}: ${text.slice(0, 300)}`)
    return (text ? JSON.parse(text) : {}) as T
}

// Вход по ИНН и паролю от lknpd.nalog.ru
export const loginByPassword = (inn: string, password: string, deviceId: string) =>
    call<NalogAuth>('/auth/lkfl', { username: inn, password, deviceInfo: deviceInfo(deviceId) })

// Вход по СМС: start → код на телефон → verify
export const smsStart = (phone: string) =>
    call<{ challengeToken: string }>('/auth/challenge/sms/start', { phone, requireTpToBeActive: true })
export const smsVerify = (phone: string, code: string, challengeToken: string, deviceId: string) =>
    call<NalogAuth>('/auth/challenge/sms/verify', { phone, code, challengeToken, deviceInfo: deviceInfo(deviceId) })

// Обновить токен доступа (refreshToken живёт долго)
export const refreshAuth = (refreshToken: string, deviceId: string) =>
    call<NalogAuth>('/auth/token', { refreshToken, deviceInfo: deviceInfo(deviceId) })

// Время в формате, который ждёт «Мой налог»: по Москве, со смещением +03:00
export function mskIso(d: Date) {
    return new Date(d.getTime() + 3 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, '+03:00')
}

// Зарегистрировать доход от физлица. Возвращает uuid чека.
export async function registerIncome(token: string, opts: { name: string; amountRub: number; operationTime: Date }) {
    const r = await call<{ approvedReceiptUuid: string }>('/income', {
        operationTime: mskIso(opts.operationTime),
        requestTime: mskIso(new Date()),
        services: [{ name: opts.name, amount: opts.amountRub, quantity: 1 }],
        totalAmount: String(opts.amountRub),
        client: { contactPhone: null, displayName: null, inn: null, incomeType: 'FROM_INDIVIDUAL' },
        paymentType: 'CASH',
        ignoreMaxTotalIncomeRestriction: false,
    }, token)
    if (!r.approvedReceiptUuid) throw new Error('Мой налог: нет approvedReceiptUuid')
    return r.approvedReceiptUuid
}

// Аннулировать чек (при возврате денег)
export const cancelIncome = (token: string, receiptUuid: string, comment: 'Возврат средств' | 'Чек сформирован ошибочно') =>
    call<unknown>('/cancel', { operationTime: mskIso(new Date()), requestTime: mskIso(new Date()), comment, receiptUuid, partnerCode: null }, token)

export const receiptUrl = (inn: string, uuid: string) => `https://lknpd.nalog.ru/api/v1/receipt/${inn}/${uuid}/print`
