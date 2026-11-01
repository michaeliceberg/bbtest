'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { checkCatName } from '@/lib/catName'
import { CAT_FOOD, type CatFood } from '@/lib/catFood'

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

// Купить котику еду за монеты (points) — одним атомарным UPDATE: монет не хватает или холодильник не починен — ничего не меняется.
export async function buyCatFood(kind: CatFood): Promise<{ ok: boolean; count?: number; reason?: 'coins' }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId || !(kind in CAT_FOOD)) return { ok: false }
    const price = CAT_FOOD[kind].price
    const r = (kind === 'milk'
        ? await db.execute(sql`UPDATE user_progress SET points = points - ${price}, cat_milk = cat_milk + 1
            WHERE user_id = ${userId} AND cat_fridge_fixed AND points >= ${price} RETURNING cat_milk AS n`)
        : await db.execute(sql`UPDATE user_progress SET points = points - ${price}, cat_sausage = cat_sausage + 1
            WHERE user_id = ${userId} AND cat_fridge_fixed AND points >= ${price} RETURNING cat_sausage AS n`)) as unknown as { n: number }[]
    if (r.length > 0) return { ok: true, count: Number(r[0].n) }
    return { ok: false, reason: 'coins' }
}

// Покормить котика одной купленной порцией (раз в день по Москве). Серия кормлений: вчера кормили — +1, иначе с 1.
// Всё одним UPDATE: порции нет или сегодня уже кормили — ничего не меняется.
export async function feedCat(kind: CatFood): Promise<{ ok: boolean; reason?: 'empty' | 'fed'; streak?: number; left?: number }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId || !(kind in CAT_FOOD)) return { ok: false }
    const today = sql`(now() AT TIME ZONE 'Europe/Moscow')::date`
    const streak = sql`CASE WHEN cat_fed_date = ${today} - 1 THEN cat_feed_streak + 1 ELSE 1 END`
    const r = (kind === 'milk'
        ? await db.execute(sql`UPDATE user_progress SET cat_milk = cat_milk - 1, cat_feed_streak = ${streak},
            cat_feed_best = GREATEST(cat_feed_best, ${streak}), cat_fed_date = ${today}
            WHERE user_id = ${userId} AND cat_milk > 0 AND cat_fed_date IS DISTINCT FROM ${today} RETURNING cat_feed_streak AS s, cat_milk AS n`)
        : await db.execute(sql`UPDATE user_progress SET cat_sausage = cat_sausage - 1, cat_feed_streak = ${streak},
            cat_feed_best = GREATEST(cat_feed_best, ${streak}), cat_fed_date = ${today}
            WHERE user_id = ${userId} AND cat_sausage > 0 AND cat_fed_date IS DISTINCT FROM ${today} RETURNING cat_feed_streak AS s, cat_sausage AS n`)) as unknown as { s: number; n: number }[]
    if (r.length > 0) return { ok: true, streak: Number(r[0].s), left: Number(r[0].n) }
    const cur = (await db.execute(sql`SELECT cat_fed_date = ${today} AS fed FROM user_progress WHERE user_id = ${userId}`)) as unknown as { fed: boolean }[]
    return { ok: false, reason: cur[0]?.fed ? 'fed' : 'empty' }
}
