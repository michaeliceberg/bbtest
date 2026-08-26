// lib/haptics.ts
//
// Тактильный отклик на нажатия через Vibration API. Работает в мобильных
// браузерах и особенно ощутимо в PWA (установленном на телефон) — на
// десктопе/там где API нет, вызов просто no-op.
//
// Сила отклика зависит от значимости действия: лёгкая — на навигацию и
// выбор варианта, посильнее — на подтверждающее действие ("Ответить"),
// самая сильная (и с паттерном) — на итоговый результат ответа.

export type HapticIntensity = 'light' | 'medium' | 'strong' | 'success' | 'error'

const PATTERNS: Record<HapticIntensity, number | number[]> = {
    light: 8,
    medium: 18,
    strong: 30,
    success: [15, 40, 15],
    error: [25, 50, 25, 50, 25],
}

export function vibrate(intensity: HapticIntensity = 'light') {
    if (typeof window === 'undefined') return
    if (!('vibrate' in navigator)) return
    try {
        navigator.vibrate(PATTERNS[intensity])
    } catch {
        // Vibration API иногда бросает в некоторых WebView — просто игнорируем
    }
}
