// lib/link-conflict-store.ts
//
// Когда способ входа уже привязан к ДРУГОМУ аккаунту с реальным прогрессом,
// мы не сливаем автоматически, а предлагаем пользователю осознанно
// "забрать" этот способ себе (см. /api/account/link/force). Токен живёт
// недолго и одноразовый — как и link-state-store.

import crypto from 'crypto'

type Entry = {
    targetUserId: string
    provider: string
    providerAccountId: string
    createdAt: number
}

const store = new Map<string, Entry>()
const TTL_MS = 10 * 60 * 1000

function cleanup() {
    const now = Date.now()
    for (const [key, entry] of store) {
        if (now - entry.createdAt > TTL_MS) store.delete(key)
    }
}

export function rememberConflict(entry: Omit<Entry, 'createdAt'>): string {
    cleanup()
    const token = crypto.randomBytes(16).toString('hex')
    store.set(token, { ...entry, createdAt: Date.now() })
    return token
}

export function consumeConflict(token: string): Entry | null {
    cleanup()
    const entry = store.get(token)
    if (!entry) return null
    store.delete(token)
    return entry
}
