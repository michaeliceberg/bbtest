// lib/streak.ts
//
// "Ударный режим" (стрик) — общий помощник для user_course_progress.
// По решению пользователя стрик ведётся ОДИН на реальный курс (напр.
// "ЕГЭ Физика"), и продлевается ЛЮБЫМ источником активности по этому
// курсу — решением задачи в задачнике (actions/challenge-progress.ts)
// ИЛИ прохождением урока тренажёра, привязанного к этому курсу через
// t_courses.courseId (actions/user-progress.ts, upsertTrainerLessonProgress).
// Оба места вызывают этот же bumpCourseStreak, чтобы логика подсчёта
// (сегодня/вчера/пропуск) не дублировалась и не могла разъехаться.
//
// trainer_streaks (отдельная таблица, "стрик по дневному квесту
// тренажёра") этим не заменяется и не трогается — это отдельная, более
// узкая механика ("+1 к стрику" за полное выполнение дневного квеста из
// 3-5 уроков), сознательно оставленная как есть.

import db from '@/db/drizzle';
import { userCourseProgress } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export type StreakUpdateResult = {
    streak: number;
    longestStreak: number;
    // true, если этим вызовом стрик реально продвинулся на новый
    // календарный день (а не просто повторно подтвердил уже
    // засчитанный сегодняшний день) — используется, чтобы не показывать
    // тост "серия продлена" на каждый отдельный верный ответ за день,
    // только на первый.
    extended: boolean;
};

export async function bumpCourseStreak(
    userId: string,
    courseId: number,
    today: Date,
    extra?: { pointsDelta?: number; gemsDelta?: number },
): Promise<StreakUpdateResult> {
    const pointsDelta = extra?.pointsDelta ?? 0;
    const gemsDelta = extra?.gemsDelta ?? 0;

    const courseProgress = await db.query.userCourseProgress.findFirst({
        where: and(
            eq(userCourseProgress.userId, userId),
            eq(userCourseProgress.courseId, courseId)
        ),
    });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastActive = courseProgress?.lastActiveDate ? new Date(courseProgress.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    let newStreak: number;
    let extended = true;
    if (lastActive && lastActive.getTime() === today.getTime()) {
        // Уже засчитано сегодня — серию не трогаем (иначе 2 верных
        // ответа за день считались бы как 2 дня подряд).
        newStreak = courseProgress?.streak ?? 1;
        extended = false;
    } else if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        newStreak = (courseProgress?.streak ?? 0) + 1;
    } else {
        // Более старая дата или активности не было вовсе — сброс на 1
        // (не на 0: сегодняшний день тоже реально прожит).
        newStreak = 1;
    }
    const newLongestStreak = Math.max(newStreak, courseProgress?.longestStreak ?? 0);

    if (courseProgress) {
        await db.update(userCourseProgress)
            .set({
                points: sql`${userCourseProgress.points} + ${pointsDelta}`,
                gems: sql`${userCourseProgress.gems} + ${gemsDelta}`,
                streak: newStreak,
                longestStreak: newLongestStreak,
                lastActiveDate: today,
                updatedAt: new Date(),
            })
            .where(eq(userCourseProgress.id, courseProgress.id));
    } else {
        await db.insert(userCourseProgress).values({
            userId,
            courseId,
            points: pointsDelta,
            gems: gemsDelta,
            progressPercent: 0,
            streak: newStreak,
            longestStreak: newLongestStreak,
            lastActiveDate: today,
            updatedAt: new Date(),
        });
    }

    return { streak: newStreak, longestStreak: newLongestStreak, extended };
}

// Текущий стрик курса без записи (для чтения на экране наград
// тренажёра — там к моменту вызова курс уже продлён самим
// upsertTrainerLessonProgress этой же попытки, повторно бампать не нужно).
export async function getCourseStreak(userId: string, courseId: number): Promise<number> {
    const courseProgress = await db.query.userCourseProgress.findFirst({
        where: and(
            eq(userCourseProgress.userId, userId),
            eq(userCourseProgress.courseId, courseId)
        ),
    });
    return courseProgress?.streak ?? 0;
}
