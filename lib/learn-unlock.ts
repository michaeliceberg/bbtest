// lib/learn-unlock.ts
//
// Задачник закрыт, пока ученик не прошёл все три пошаговых разбора
// электродинамики (просьба пользователя 2026-09-29): «Направление поля»
// (485), «Закон Фарадея» (484), «Правило Ленца» (491). Урок считается
// пройденным, если есть запись t_lesson_progress с trainingPts > 0 (тот же
// признак, что для XP/ачивок). Админы видят задачник всегда.
// После открытия один раз показывается экран components/learn-unlock-celebration.tsx.

import 'server-only'
import { and, eq, gt, inArray } from 'drizzle-orm'
import db from '@/db/drizzle'
import { t_lessonProgress } from '@/db/schema'

export const LEARN_UNLOCK_T_LESSONS = [485, 484, 491]

export async function isLearnUnlocked(userId: string, isAdmin: boolean): Promise<boolean> {
    if (isAdmin) return true
    const rows = await db
        .selectDistinct({ id: t_lessonProgress.t_lessonId })
        .from(t_lessonProgress)
        .where(and(
            eq(t_lessonProgress.userId, userId),
            inArray(t_lessonProgress.t_lessonId, LEARN_UNLOCK_T_LESSONS),
            gt(t_lessonProgress.trainingPts, 0),
        ))
    return rows.length >= LEARN_UNLOCK_T_LESSONS.length
}
