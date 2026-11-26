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
    fish: { title: 'Рыбка', price: 375, gain: 75, src: '/hangar/life/cat-fish.webp' },
}
// gain — на сколько процентов порция поднимает сытость (полоска над котиком убывает от 100% до 0 за CAT_SATIETY_DAYS суток).
// Кормить можно, пока сытость меньше CAT_FEED_BELOW (90%); выше — «котик сыт». Больше 100% не бывает.
export const CAT_FEED_BELOW = 0.9
/** За сколько суток полная сытость (100%) падает до нуля (раньше было 1 сутки). */
export const CAT_SATIETY_DAYS = 3
export const CAT_SATIETY_MS = CAT_SATIETY_DAYS * 86_400_000
/** Сытость 0…1 по времени последнего кормления: за CAT_SATIETY_DAYS суток убывает до нуля. */
export const satietyAt = (fedAt: string | null | undefined, now = Date.now()) =>
    fedAt ? Math.max(0, Math.min(1, 1 - (now - new Date(fedAt).getTime()) / CAT_SATIETY_MS)) : 0

/**
 * Худоба: котик 3 дня не ел (с последнего кормления прошло ≥ 3 суток, полоска сытости на нуле) — 1 «худенький»;
 * не ел 5 суток — 2 «супер-худой, высушенный». Никогда не кормили (fedAt = null) — котик только заехал, не худеет.
 * Картинки худых котиков — промпты в docs/hangar/cat-thin-prompts.md; пока их нет, котик сплющивается по ширине (hangar-cat.tsx).
 */
export const CAT_THIN_AFTER_DAYS: [number, number] = [3, 5]
export type CatThin = 0 | 1 | 2
export function catThinLevel(fedAt: string | null | undefined, now = Date.now()): CatThin {
    if (!fedAt) return 0
    const days = (now - new Date(fedAt).getTime()) / 86_400_000
    return days >= CAT_THIN_AFTER_DAYS[1] ? 2 : days >= CAT_THIN_AFTER_DAYS[0] ? 1 : 0
}

// ── Зелье толстости (actions/cat.ts buyFatPotion, user_progress.cat_fat) ──
// Сытому котику (сытость ≥ CAT_FEED_BELOW, 90% — тому, кого кормить уже нельзя) за 500 монет можно дать зелье: он вырастает
// в размере. Накопительно, на сытость не влияет. Реальный размер растёт в FAT_GROWTH раз за зелье и за FAT_MAX зелий
// доходит до размера Луны; в ангаре картинка растёт плавно, но не больше FAT_VISUAL_MAX (иначе не влезет на экран).
export const FAT_POTION_PRICE = 500
export const FAT_BASE_M = 0.35 // обычный котик, м
export const FAT_GROWTH = 1.15
const MOON_M = 3_474_000
export const FAT_MAX = Math.ceil(Math.log(MOON_M / FAT_BASE_M) / Math.log(FAT_GROWTH)) // 116
export const FAT_VISUAL_MAX = 1.7
/** С какого числа зелий котик «пухлый» (1) и «шарик» (2): свои картинки сидячей позы, и он не гуляет по ангару. */
export const FAT_STAGE_AT: [number, number] = [10, 30]
export type CatFatStage = 0 | 1 | 2
export const catFatStage = (n: number): CatFatStage => (n >= FAT_STAGE_AT[1] ? 2 : n >= FAT_STAGE_AT[0] ? 1 : 0)
export const catFatSizeM = (n: number) => FAT_BASE_M * Math.pow(FAT_GROWTH, Math.max(0, Math.min(FAT_MAX, n)))
export const catFatVisualScale = (n: number) => Math.min(FAT_VISUAL_MAX, 1 + 0.03 * Math.max(0, n))
const FAT_LADDER: [number, string][] = [
    [0, 'котик как котик'], [0.8, 'с овчарку'], [2, 'с пони'], [4, 'со слона'], [10, 'с автобус'], [30, 'с синего кита'], [70, 'с самолёт'],
    [300, 'с Эйфелеву башню'], [1500, 'с небоскрёб'], [8848, 'с Эверест'], [100_000, 'с остров'], [1_000_000, 'с Луну поменьше'], [MOON_M * 0.98, 'с Луну'],
]
/** Длина в метрах словами: «35 см», «1,4 м», «23 км». */
export function fmtLengthM(m: number): string {
    const num = (v: number) => (v < 10 && Math.abs(v - Math.round(v)) > 0.05 ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('ru-RU'))
    if (m < 1) return `${Math.round(m * 100)} см`
    if (m < 1000) return `${num(m)} м`
    return `${num(m / 1000)} км`
}
/** Размер котика с n зельями словами для рейтинга и линейки. */
export const catFatSizeText = (n: number) => fmtLengthM(catFatSizeM(n))
export const catFatLabel = (n: number) => FAT_LADDER.reduce((acc, [m, t]) => (catFatSizeM(n) >= m ? t : acc), FAT_LADDER[0][1])
// fedDate — день последнего кормления (YYYY-MM-DD по Москве), streak — сколько дней подряд кормили
export type CatFoodStock = Record<CatFood, number> & { fedDate?: string | null; streak?: number; fat?: number }
/** Сегодняшний день по Москве в формате YYYY-MM-DD (как cat_fed_date в базе). */
export const moscowToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())

/** Серия кормлений на сегодня: если последний раз кормили раньше вчера — серия прервалась (0). */
export function liveFeedStreak(fedDate: string | null | undefined, streak: number | undefined): number {
    if (!fedDate || !streak) return 0
    const today = moscowToday()
    const y = new Date(`${today}T12:00:00Z`); y.setUTCDate(y.getUTCDate() - 1)
    return fedDate === today || fedDate === y.toISOString().slice(0, 10) ? streak : 0
}
