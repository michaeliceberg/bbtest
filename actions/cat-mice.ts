'use server'

// Ученик досмотрел событие с мышами (lib/catMice.ts): кража — сцена закончилась, поимка — нажал на котика.
// Помечаем событие и выдаём ачивку («Первая кровь» / «Страж сокровищ»).

import { sql } from 'drizzle-orm'
import { auth } from '@/lib/server-auth'
import db from '@/db/drizzle'
import { unlockAchievements } from '@/lib/achievements'
import type { AchievementDTO } from '@/lib/achievementsCatalog'

export async function resolveMiceEvent(id: number): Promise<AchievementDTO[]> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId || !Number.isInteger(id)) return []
    const r = (await db.execute(sql`UPDATE cat_mice_events SET resolved_at = now()
        WHERE id = ${id} AND user_id = ${userId} AND resolved_at IS NULL RETURNING kind`)) as unknown as { kind: string }[]
    if (!r.length) return []
    const key = r[0].kind === 'raid' ? 'mice_first_blood' : r[0].kind === 'catch' ? 'cat_guard' : null
    return key ? unlockAchievements(userId, [key], { seen: true }) : []
}
