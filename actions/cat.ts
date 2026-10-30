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
