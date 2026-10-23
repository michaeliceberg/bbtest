import { TRIAL_TRACKS } from '@/lib/trialTracks'

// lib/pro.ts — подписка PRO. Пока только проверка спроса: экран с ценой и кнопка «Хочу»,
// денег не берём (решение 2026-10-10: сначала понять, будут ли платить, потом касса/самозанятость).
export const PRO_PRICE_RUB = 1100
// Premium — PRO + полное решение задачи по шагам (билд на задачу). Пока тоже только проверка спроса.
export const PREMIUM_PRICE_RUB = 2000
export const PRO_EARLY_DISCOUNT = 50 // скидка первым, кто оставил заявку

// Временно выключено (2026-10-10): пункт «PRO» в меню заблокирован, карточки в аккаунте нет, /pro уводит на /trainer.
// Включить — поставить true.
export const PRO_ENABLED = false

// ── Платная граница (решение 2026-10-23) ──────────────────────────────────────
// Бесплатно: первый урок каждого юнита тренажёра, уроки пробных треков (пицца за 3 урока
// и открытие задачника), первая часть задачника ЕГЭ Математика, 3 фото ИИ-помощнику за всё время.
// Остальное — PRO. Пока оплата не подключена (ЮKassa), замок выключен: PRO_PAYWALL_ENABLED = false.
export const PRO_PAYWALL_ENABLED = false
export const FREE_AI_PHOTOS = 3
export const PRO_AI_PHOTOS_PER_DAY = 3

const TRIAL_LESSON_IDS = new Set(Object.values(TRIAL_TRACKS).flatMap((t) => [t.trial, ...t.lessons]))

// Урок тренажёра бесплатный? isFirstInUnit — урок с наименьшим order в своём юните.
export const isTLessonFree = (tLessonId: number, isFirstInUnit: boolean) =>
    isFirstInUnit || TRIAL_LESSON_IDS.has(tLessonId)

// Есть ли у ученика доступ ко всему (PRO, админ или замок выключен).
export const hasProFor = (up: { isAdmin?: number | null; proUntil?: Date | string | null } | null | undefined) => {
    if (!PRO_PAYWALL_ENABLED) return true
    if (!up) return false
    if (up.isAdmin === 1) return true
    return !!up.proUntil && new Date(up.proUntil).getTime() > Date.now()
}

// Что даёт PRO — показывается на /pro и на публичной странице /pricing. Только то, что реально закрыто замком.
export const PRO_FEATURES = [
    { icon: '🧠', title: 'Все уроки тренажёра', text: 'Математика и физика ЕГЭ: каждая тема по шагам. Без подписки открыт первый урок каждой темы.' },
    { icon: '⚔️', title: 'Вторая часть задачника', text: 'Задания 14–20 ЕГЭ по математике: уравнения, неравенства, стереометрия, планиметрия, параметр.' },
    { icon: '📸', title: `ИИ-помощник: ${PRO_AI_PHOTOS_PER_DAY} фото в день`, text: `Сфоткай любую задачу — подскажем, какие уроки пройти. Без подписки — ${FREE_AI_PHOTOS} фото, чтобы попробовать.` },
]
