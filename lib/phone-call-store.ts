// lib/phone-call-store.ts
//
// checkId -> телефон, в памяти процесса. Живёт ровно на время проверки
// (5 минут, как и сам таймаут у SMS.ru). Специально не доверяем телефон,
// присланный клиентом при завершении входа — берём только то, что сами
// сохранили при старте проверки.

type Entry = { phone: string; createdAt: number }

const store = new Map<string, Entry>()
const TTL_MS = 5 * 60 * 1000

function cleanup() {
    const now = Date.now()
    for (const [key, entry] of store) {
        if (now - entry.createdAt > TTL_MS) store.delete(key)
    }
}

export function rememberPhoneCheck(checkId: string, phone: string) {
    cleanup()
    store.set(checkId, { phone, createdAt: Date.now() })
}

export function getPhoneForCheck(checkId: string): string | null {
    cleanup()
    const entry = store.get(checkId)
    if (!entry) return null
    return entry.phone
}
