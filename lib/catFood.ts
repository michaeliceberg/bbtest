// lib/catFood.ts
//
// Еда котика в холодильнике (components/cat-fridge-modal.tsx). Покупается за монеты (user_progress.points),
// сколько куплено — user_progress.cat_milk / cat_sausage. Цены общие для клиента и сервера (actions/cat.ts).

export type CatFood = 'milk' | 'sausage'
export const CAT_FOOD: Record<CatFood, { title: string; price: number; src: string }> = {
    milk: { title: 'Молоко', price: 129, src: '/hangar/life/cat-milk.webp' },
    sausage: { title: 'Колбаска', price: 249, src: '/hangar/life/cat-sausage.webp' },
}
// fedDate — день последнего кормления (YYYY-MM-DD по Москве), streak — сколько дней подряд кормили
export type CatFoodStock = Record<CatFood, number> & { fedDate?: string | null; streak?: number }
/** Сегодняшний день по Москве в формате YYYY-MM-DD (как cat_fed_date в базе). */
export const moscowToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())

/** Серия кормлений на сегодня: если последний раз кормили раньше вчера — серия прервалась (0). */
export function liveFeedStreak(fedDate: string | null | undefined, streak: number | undefined): number {
    if (!fedDate || !streak) return 0
    const today = moscowToday()
    const y = new Date(`${today}T12:00:00Z`); y.setUTCDate(y.getUTCDate() - 1)
    return fedDate === today || fedDate === y.toISOString().slice(0, 10) ? streak : 0
}
