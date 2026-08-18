// lib/telegram-auth.ts
//
// Проверка подписи данных от Telegram Login Widget.
// https://core.telegram.org/widgets/login#checking-authorization

import crypto from "crypto"

export type TelegramAuthPayload = {
    id: string
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: string
    hash: string
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60 // сутки

export function verifyTelegramAuth(data: TelegramAuthPayload): boolean {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return false
    if (!data?.hash || !data?.auth_date || !data?.id) return false

    const { hash, ...rest } = data
    const checkString = Object.keys(rest)
        .filter((key) => rest[key as keyof typeof rest] !== undefined)
        .sort()
        .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
        .join("\n")

    const secretKey = crypto.createHash("sha256").update(botToken).digest()
    const computedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex")

    if (computedHash.length !== hash.length) return false
    const isValid = crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash))
    if (!isValid) return false

    const authDate = parseInt(data.auth_date, 10)
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isFinite(authDate) || now - authDate > MAX_AUTH_AGE_SECONDS) return false

    return true
}
