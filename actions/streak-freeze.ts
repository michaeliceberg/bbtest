'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { auth } from '@/lib/server-auth'
import { STREAK_FREEZE_MAX, STREAK_FREEZE_PRICE_GEMS } from '@/lib/streakFreeze'

export type BuyFreezeResult = { ok: true; freezes: number; gems: number } | { ok: false; error: 'auth' | 'gems' | 'max' }

// Атомарно: списываем гемы и добавляем заморозку одним UPDATE, только если хватает гемов и не превышен запас.
export async function buyStreakFreeze(): Promise<BuyFreezeResult> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false, error: 'auth' }
    const rows = await db.update(userProgress)
        .set({ gems: sql`${userProgress.gems} - ${STREAK_FREEZE_PRICE_GEMS}`, streakFreezes: sql`${userProgress.streakFreezes} + 1` })
        .where(and(eq(userProgress.userId, userId), gte(userProgress.gems, STREAK_FREEZE_PRICE_GEMS), lt(userProgress.streakFreezes, STREAK_FREEZE_MAX)))
        .returning({ freezes: userProgress.streakFreezes, gems: userProgress.gems })
    if (!rows.length) {
        const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) })
        return { ok: false, error: (up?.streakFreezes ?? 0) >= STREAK_FREEZE_MAX ? 'max' : 'gems' }
    }
    revalidatePath('/account'); revalidatePath('/trainer'); revalidatePath('/learn')
    return { ok: true, ...rows[0] }
}
