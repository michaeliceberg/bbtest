// lib/link-state-store.ts
//
// Одноразовый state для флоу привязки способа входа: помним, "кто именно"
// (какой canonical userId) и через какого провайдера инициировал привязку,
// пока идёт вход новым способом (OAuth-редирект/виджет/звонок). В памяти
// процесса — как и phone-call-store, этого достаточно (один pm2-инстанс,
// без кластера).

type Entry = { userId: string; provider: string; createdAt: number }

const store = new Map<string, Entry>()
const TTL_MS = 10 * 60 * 1000

function cleanup() {
    const now = Date.now()
    for (const [key, entry] of store) {
        if (now - entry.createdAt > TTL_MS) store.delete(key)
    }
}

export function rememberLinkState(state: string, userId: string, provider: string) {
    cleanup()
    store.set(state, { userId, provider, createdAt: Date.now() })
}

// Одноразовый — использованный state сразу удаляется.
export function consumeLinkState(state: string): { userId: string; provider: string } | null {
    cleanup()
    const entry = store.get(state)
    if (!entry) return null
    store.delete(state)
    return { userId: entry.userId, provider: entry.provider }
}
