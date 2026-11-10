'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { checkCatName } from '@/lib/catName'
import { CAT_FOOD, CAT_FEED_BELOW, type CatFood } from '@/lib/catFood'

// Котик у входа в ангар пошёл жить на картонку (cat_stage 1 → 2). Ачивку «Кот в ангаре» выдаёт computeStateKeys.
export async function bringCatHome(): Promise<{ ok: boolean }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    const r = await db.execute(sql`UPDATE user_progress SET cat_stage = 2 WHERE user_id = ${userId} AND cat_stage = 1 RETURNING user_id`)
    return { ok: (r as unknown as unknown[]).length > 0 }
}

const CAT_FRIDGE_COST = 25 // рубинов (gems); то же число — FRIDGE_COST в components/hangar-cat.tsx (из "use server" экспортировать можно только функции)

// Починить холодильник котика за 25 рубинов (gems) — одним атомарным UPDATE (не хватает рубинов или уже починен — ничего не меняется).
export async function fixCatFridge(): Promise<{ ok: boolean; reason?: 'gems' }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    const r = await db.execute(sql`UPDATE user_progress SET gems = gems - ${CAT_FRIDGE_COST}, cat_fridge_fixed = true
        WHERE user_id = ${userId} AND cat_stage >= 2 AND NOT cat_fridge_fixed AND gems >= ${CAT_FRIDGE_COST} RETURNING user_id`)
    if ((r as unknown as unknown[]).length > 0) return { ok: true }
    return { ok: false, reason: 'gems' }
}

// Имя котика (табличка над холодильником). Проверка длины и грубых слов — на сервере тоже.
export async function setCatName(raw: string): Promise<{ ok: boolean; name?: string; error?: string }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false, error: 'Нужно войти' }
    const c = checkCatName(raw)
    if (!c.ok) return { ok: false, error: c.error }
    await db.execute(sql`UPDATE user_progress SET cat_name = ${c.name} WHERE user_id = ${userId} AND cat_stage >= 2`)
    return { ok: true, name: c.name }
}

// Колонка запаса: только из этого списка, kind приходит от клиента
const FOOD_COLUMN = {
    milk: sql.raw('cat_milk'),
    sausage: sql.raw('cat_sausage'),
    sourcream: sql.raw('cat_sourcream'),
    fish: sql.raw('cat_fish'),
}

// Купить котику еду за монеты (points) — одним атомарным UPDATE: монет не хватает или холодильник не починен — ничего не меняется.
export async function buyCatFood(kind: CatFood): Promise<{ ok: boolean; count?: number; reason?: 'coins' }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId || !(kind in CAT_FOOD)) return { ok: false }
    const price = CAT_FOOD[kind].price
    const col = FOOD_COLUMN[kind]
    const r = (await db.execute(sql`UPDATE user_progress SET points = points - ${price}, ${col} = ${col} + 1
        WHERE user_id = ${userId} AND cat_fridge_fixed AND points >= ${price} RETURNING ${col} AS n`)) as unknown as { n: number }[]
    if (r.length > 0) return { ok: true, count: Number(r[0].n) }
    return { ok: false, reason: 'coins' }
}

// Покормить котика одной купленной порцией. Можно, пока сытость меньше половины; порция добавляет CAT_FOOD[kind].gain процентов
// (сытость хранится временем кормления cat_fed_at: «виртуальное» время сдвигаем так, чтобы полоска встала на нужный процент).
// Серия кормлений считается по дням: вчера кормили — +1, сегодня уже кормили — без изменений, иначе с 1.
// Всё одним UPDATE: порции нет или котик не голоден — ничего не меняется.
export async function feedCat(kind: CatFood): Promise<{ ok: boolean; reason?: 'empty' | 'full'; streak?: number; left?: number; satiety?: number }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId || !(kind in CAT_FOOD)) return { ok: false }
    const today = sql`(now() AT TIME ZONE 'Europe/Moscow')::date`
    const streak = sql`CASE WHEN cat_fed_date = ${today} THEN cat_feed_streak WHEN cat_fed_date = ${today} - 1 THEN cat_feed_streak + 1 ELSE 1 END`
    const sat = sql`COALESCE(GREATEST(0, 1 - EXTRACT(EPOCH FROM (now() - cat_fed_at)) / 86400), 0)`
    const gain = CAT_FOOD[kind].gain / 100
    const col = FOOD_COLUMN[kind]
    const r = (await db.execute(sql`UPDATE user_progress SET ${col} = ${col} - 1, cat_feed_streak = ${streak},
        cat_feed_best = GREATEST(cat_feed_best, ${streak}), cat_fed_date = ${today},
        cat_fed_at = now() - make_interval(secs => (1 - LEAST(1, ${sat} + ${gain}::float8)) * 86400)
        WHERE user_id = ${userId} AND ${col} > 0 AND ${sat} < ${CAT_FEED_BELOW}::float8
        RETURNING cat_feed_streak AS s, ${col} AS n, GREATEST(0, 1 - EXTRACT(EPOCH FROM (now() - cat_fed_at)) / 86400) AS sat`)) as unknown as { s: number; n: number; sat: number }[]
    if (r.length > 0) return { ok: true, streak: Number(r[0].s), left: Number(r[0].n), satiety: Number(r[0].sat) }
    const cur = (await db.execute(sql`SELECT ${sat} >= ${CAT_FEED_BELOW}::float8 AS full FROM user_progress WHERE user_id = ${userId}`)) as unknown as { full: boolean }[]
    return { ok: false, reason: cur[0]?.full ? 'full' : 'empty' }
}
