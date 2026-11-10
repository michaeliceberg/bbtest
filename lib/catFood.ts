// lib/catFood.ts
//
// Еда котика в холодильнике (components/cat-fridge-modal.tsx). Покупается за монеты (user_progress.points),
// сколько куплено — user_progress.cat_milk / cat_sausage / cat_sourcream / cat_fish. Цены общие для клиента и сервера (actions/cat.ts).

export type CatFood = 'milk' | 'sausage' | 'sourcream' | 'fish'
export const CAT_FOODS: CatFood[] = ['milk', 'sausage', 'sourcream', 'fish']
export const CAT_FOOD: Record<CatFood, { title: string; price: number; src: string; gain: number }> = {
    milk: { title: 'Молочко', price: 129, gain: 25, src: '/hangar/life/cat-milk.webp' },
    sausage: { title: 'Колбаска', price: 249, gain: 50, src: '/hangar/life/cat-sausage.webp' },
    sourcream: { title: 'Сметанка', price: 179, gain: 25, src: '/hangar/life/cat-sourcream.webp' },
    fish: { title: 'Рыбка', price: 299, gain: 50, src: '/hangar/life/cat-fish.webp' },
}
// gain — на сколько процентов порция поднимает сытость (полоска над котиком убывает от 100% до 0 за сутки).
// Кормить можно, пока сытость меньше CAT_FEED_BELOW.
export const CAT_FEED_BELOW = 0.5
/** Сытость 0…1 по времени последнего кормления: за сутки убывает до нуля. */
export const satietyAt = (fedAt: string | null | undefined, now = Date.now()) =>
    fedAt ? Math.max(0, Math.min(1, 1 - (now - new Date(fedAt).getTime()) / 86_400_000)) : 0
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
