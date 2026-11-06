'use server'

// actions/ballometer.ts — настройка темпа в Баллометре: ученик сам выбирает дату цели и получает программу (сетов в неделю).

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { auth } from '@/lib/auth'
import { EGE_EXAM_DATE, MAX_SETS_WEEK } from '@/lib/egeMeter'

export async function saveBallometerProgram(goalIso: string, setsWeek: number): Promise<{ ok: boolean }> {
    const session = await auth()
    if (!session?.user?.id) return { ok: false }
    const goal = new Date(goalIso)
    const sets = Math.round(setsWeek)
    if (Number.isNaN(goal.getTime()) || goal > EGE_EXAM_DATE || goal < new Date() || sets < 1 || sets > MAX_SETS_WEEK) return { ok: false }
    await db.update(userProgress).set({ ballometerGoalDate: goal, ballometerSetsWeek: sets }).where(eq(userProgress.userId, session.user.id))
    revalidatePath('/trainer')
    revalidatePath('/learn')
    return { ok: true }
}
