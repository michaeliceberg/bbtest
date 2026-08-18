// lib/phone.ts
//
// Нормализация российских номеров телефона к формату E.164 без плюса
// (79261234567), как ожидает SMS.ru.

export function normalizeRuPhone(input: string): string | null {
    const digits = input.replace(/\D/g, "")

    let d = digits
    if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1)
    if (d.length === 10 && d.startsWith("9")) d = "7" + d

    if (d.length !== 11 || !d.startsWith("7")) return null

    return d
}

export function formatRuPhonePretty(digits: string): string {
    // 79261234567 -> +7 (926) 123-45-67
    const m = digits.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/)
    if (!m) return `+${digits}`
    return `+7 (${m[1]}) ${m[2]}-${m[3]}-${m[4]}`
}
