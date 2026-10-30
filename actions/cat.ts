'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'

// Котик у входа в ангар пошёл жить на картонку (cat_stage 1 → 2). Ачивку «Кот в ангаре» выдаёт computeStateKeys.
export async function bringCatHome(): Promise<{ ok: boolean }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    const r = await db.execute(sql`UPDATE user_progress SET cat_stage = 2 WHERE user_id = ${userId} AND cat_stage = 1 RETURNING user_id`)
    return { ok: (r as unknown as unknown[]).length > 0 }
}

const CAT_FRIDGE_COST = 999 // то же число — FRIDGE_COST в components/hangar-cat.tsx (из "use server" экспортировать можно только функции)

// Починить холодильник котика за 999 монет — одним атомарным UPDATE (не хватает монет или уже починен — ничего не меняется).
export async function fixCatFridge(): Promise<{ ok: boolean; reason?: 'coins' }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    const r = await db.execute(sql`UPDATE user_progress SET points = points - ${CAT_FRIDGE_COST}, cat_fridge_fixed = true
        WHERE user_id = ${userId} AND cat_stage >= 2 AND NOT cat_fridge_fixed AND points >= ${CAT_FRIDGE_COST} RETURNING user_id`)
    if ((r as unknown as unknown[]).length > 0) return { ok: true }
    return { ok: false, reason: 'coins' }
}
