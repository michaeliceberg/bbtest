// lib/streak.ts
//
// "Ударный режим" (стрик, огонёк) — одна серия на реальный курс (user_course_progress).
// День засчитывается «закуской» (решение 2026-11-06): пройден урок тренажёра, привязанного
// к курсу (actions/user-progress.ts), ИЛИ решено STREAK_TASKS_PER_DAY задач задачника за день
// (actions/challenge-progress.ts). Весь сет не требуем: в загруженный день серия иначе оборвётся,
// за целый сет — сундук. Квест дня и его серия «x1» (trainer_streaks) убраны, таблица осталась историей.

import db from '@/db/drizzle';
import { userCourseProgress, userProgress } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

// Сколько верных задач задачника за день продлевают серию без урока тренажёра.
export const STREAK_TASKS_PER_DAY = 5;

export type StreakUpdateResult = {
    streak: number;
    longestStreak: number;
    // true, если этим вызовом стрик реально продвинулся на новый
    // календарный день (а не просто повторно подтвердил уже
    // засчитанный сегодняшний день) — используется, чтобы не показывать
    // тост "серия продлена" на каждый отдельный верный ответ за день,
    // только на первый.
    extended: boolean;
    // Сколько заморозок потрачено этим вызовом (пропущенные дни закрыты заморозками, серия не сгорела).
    frozenDays: number;
};

export async function bumpCourseStreak(
    userId: string,
    courseId: number,
    today: Date,
    extra?: { pointsDelta?: number; gemsDelta?: number; countDay?: boolean },
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

    // Ещё не набрали норму дня: только очки и гемы курса, серию не трогаем.
    if (extra?.countDay === false) {
        const streak = courseProgress?.streak ?? 0;
        const longestStreak = courseProgress?.longestStreak ?? 0;
        if (courseProgress) {
            await db.update(userCourseProgress)
                .set({
                    points: sql`${userCourseProgress.points} + ${pointsDelta}`,
                    gems: sql`${userCourseProgress.gems} + ${gemsDelta}`,
                    updatedAt: new Date(),
                })
                .where(eq(userCourseProgress.id, courseProgress.id));
        } else {
            await db.insert(userCourseProgress).values({ userId, courseId, points: pointsDelta, gems: gemsDelta, progressPercent: 0, streak: 0, longestStreak: 0, updatedAt: new Date() });
        }
        return { streak, longestStreak, extended: false, frozenDays: 0 };
    }

    const lastActive = courseProgress?.lastActiveDate ? new Date(courseProgress.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    let newStreak: number;
    let extended = true;
    let frozenDays = 0;
    if (lastActive && lastActive.getTime() === today.getTime()) {
        // Уже засчитано сегодня — серию не трогаем (иначе 2 верных
        // ответа за день считались бы как 2 дня подряд).
        newStreak = courseProgress?.streak ?? 1;
        extended = false;
    } else if (lastActive && lastActive.getTime() === yesterday.getTime()) {
        newStreak = (courseProgress?.streak ?? 0) + 1;
    } else if (lastActive && (courseProgress?.streak ?? 0) > 0) {
        // Пропущены дни. Если заморозок хватает на все пропущенные — тратим их (атомарно, по одному UPDATE
        // с проверкой остатка), серия продолжается; иначе — сброс на 1 (сегодняшний день тоже прожит).
        const missed = Math.round((today.getTime() - lastActive.getTime()) / 86400000) - 1;
        const spent = missed > 0 ? await db.update(userProgress)
            .set({ streakFreezes: sql`${userProgress.streakFreezes} - ${missed}` })
            .where(and(eq(userProgress.userId, userId), gte(userProgress.streakFreezes, missed)))
            .returning({ left: userProgress.streakFreezes }) : [];
        if (spent.length) { newStreak = (courseProgress?.streak ?? 0) + 1; frozenDays = missed; }
        else newStreak = 1;
    } else {
        // Активности не было вовсе — 1 (не 0: сегодняшний день тоже реально прожит).
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

    return { streak: newStreak, longestStreak: newLongestStreak, extended, frozenDays };
}

