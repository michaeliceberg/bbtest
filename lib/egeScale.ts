// lib/egeScale.ts — шкала перевода первичных баллов ЕГЭ (профильная математика) в тестовые.
// Шкалы 2027 ещё нет — берём 2026 (максимум 32 первичных), поэтому тестовый балл всегда «≈».
// Общий файл: используется и на сервере (lib/egeMap.ts), и на клиенте (экран «Мой путь»).

const SCALE_2026 = [0, 6, 11, 17, 22, 27, 34, 40, 46, 52, 58, 64, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 95, 96, 97, 98, 99, 100, 100, 100]

export const primaryToTest = (p: number) => {
    const x = Math.max(0, Math.min(SCALE_2026.length - 1, p))
    const lo = Math.floor(x), hi = Math.min(SCALE_2026.length - 1, lo + 1)
    return Math.round(SCALE_2026[lo] + (SCALE_2026[hi] - SCALE_2026[lo]) * (x - lo))
}

// Сколько первичных нужно для тестового балла (минимальное целое по шкале).
export const testToPrimary = (t: number) => {
    const i = SCALE_2026.findIndex((v) => v >= t)
    return i === -1 ? SCALE_2026.length - 1 : i
}
