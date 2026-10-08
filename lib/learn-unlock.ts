// lib/learn-unlock.ts
//
// Задачник закрыт, пока ученик не прошёл все три вводных пошаговых разбора
// ЛЮБОГО предмета (трек из lib/trialTracks.ts): физика — «Направление поля»
// (485), «Закон Фарадея» (484), «Правило Ленца» (491); математика (с 2026-10-09,
// раньше считалась только физика и математики сидели с закрытым задачником) —
// «Знакомство с окружностью» (490), «Три волшебных угла» (488), «Тангенс» (489). Урок считается
// пройденным, если есть запись t_lesson_progress с trainingPts > 0 (тот же
// признак, что для XP/ачивок). Админы видят задачник всегда.
// После открытия один раз показывается экран components/learn-unlock-celebration.tsx.

import 'server-only'
import { and, eq, gt, inArray } from 'drizzle-orm'
import db from '@/db/drizzle'
import { t_lessonProgress } from '@/db/schema'
import { ALL_TRACK_LESSONS, TRIAL_SUBJECTS, TRIAL_TRACKS } from '@/lib/trialTracks'


export async function isLearnUnlocked(userId: string, isAdmin: boolean): Promise<boolean> {
    if (isAdmin) return true
    return (await referralLessonsLeft(userId)) === 0
}

// Реферальная пицца (2026-10-02): трек физики (485/484/491) ИЛИ математики
// (490/488/489), см. lib/trialTracks.ts. Возвращает минимум недопройденных
// уроков по трекам (0 — какой-то трек пройден целиком).
export async function referralLessonsLeft(userId: string): Promise<number> {
    const rows = await db
        .selectDistinct({ id: t_lessonProgress.t_lessonId })
        .from(t_lessonProgress)
        .where(and(
            eq(t_lessonProgress.userId, userId),
            inArray(t_lessonProgress.t_lessonId, ALL_TRACK_LESSONS),
            gt(t_lessonProgress.trainingPts, 0),
        ))
    const done = new Set(rows.map((r) => r.id))
    return Math.min(...TRIAL_SUBJECTS.map((s) => TRIAL_TRACKS[s].lessons.filter((id) => !done.has(id)).length))
}
