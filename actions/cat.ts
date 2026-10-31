'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { checkCatName } from '@/lib/catName'

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
