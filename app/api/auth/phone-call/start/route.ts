// app/api/auth/phone-call/start/route.ts

import { NextRequest, NextResponse } from "next/server"
import { normalizeRuPhone, formatRuPhonePretty } from "@/lib/phone"
import { startCallCheck } from "@/lib/sms-ru"
import { rememberPhoneCheck } from "@/lib/phone-call-store"

// Простой лимитер в памяти процесса: не более 5 попыток в час с одного IP.
// Переживает только до рестарта процесса — этого достаточно как базовая
// защита от спама на этот эндпоинт (звонок инициирует сам пользователь,
// но всё равно не даём дёргать SMS.ru API без разбора).
const attemptsByIp = new Map<string, number[]>()
const MAX_ATTEMPTS_PER_HOUR = 5
const HOUR_MS = 60 * 60 * 1000

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const timestamps = (attemptsByIp.get(ip) || []).filter((t) => now - t < HOUR_MS)
    timestamps.push(now)
    attemptsByIp.set(ip, timestamps)
    return timestamps.length > MAX_ATTEMPTS_PER_HOUR
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: "Слишком много попыток. Попробуйте позже." },
            { status: 429 }
        )
    }

    const body = await req.json().catch(() => null)
    const rawPhone = body?.phone

    if (!rawPhone || typeof rawPhone !== "string") {
        return NextResponse.json({ error: "Укажите номер телефона" }, { status: 400 })
    }

    const phone = normalizeRuPhone(rawPhone)
    if (!phone) {
        return NextResponse.json({ error: "Некорректный номер телефона" }, { status: 400 })
    }

    try {
        const result = await startCallCheck(phone)
        rememberPhoneCheck(result.checkId, phone)
        return NextResponse.json({
            checkId: result.checkId,
            callPhone: result.callPhone,
            callPhonePretty: result.callPhonePretty || formatRuPhonePretty(result.callPhone),
            phone,
        })
    } catch (err: any) {
        console.error("[phone-call/start]", err)
        return NextResponse.json(
            { error: err?.message || "Не удалось начать проверку" },
            { status: 500 }
        )
    }
}
