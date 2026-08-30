// actions/check-achievements.ts

'use server';

import db from '@/db/drizzle';
import { achievements, userAchievements } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export type NewlyCompletedAchievement = {
    id: number;
    name: string;
    description: string;
    rewardPoints: number;
    rewardGems: number;
};

// Категория achievements.category — не enum, а конвенция: 'homework' и
// 'streak' и 'trainer' читаются из уже существующих таблиц одним COUNT-
// запросом, 'special' — мета-достижение, считающее количество остальных
// уже выполненных достижений (второй проход, после всех остальных).
async function getMetricForCategory(userId: string, category: string): Promise<number> {
    if (category === 'homework') {
        const rows = await db.execute(sql`
            SELECT COUNT(*)::int AS count FROM user_homework
            WHERE user_id = ${userId} AND status = 'completed'
        `);
        return Number((rows[0] as any)?.count ?? 0);
    }
    if (category === 'streak') {
        const rows = await db.execute(sql`
            SELECT COALESCE(MAX(longest_streak), 0)::int AS count FROM user_course_progress
            WHERE user_id = ${userId}
        `);
        return Number((rows[0] as any)?.count ?? 0);
    }
    if (category === 'trainer') {
        // training_pts > 0 — тот же признак «настоящего завершения основного
        // прохода», что уже используется для начисления XP за тренажёр
        // (см. actions/user-progress.ts) — не считает провалы (0 сердечек).
        const rows = await db.execute(sql`
            SELECT COUNT(DISTINCT t_lesson_id)::int AS count FROM t_lesson_progress
            WHERE user_id = ${userId} AND training_pts > 0
        `);
        return Number((rows[0] as any)?.count ?? 0);
    }
    return 0;
}

// Пересчитывает progress/isCompleted всех достижений для юзера по
// реальным данным (challengeProgress/userHomework/userCourseProgress/
// t_lessonProgress — метрик, специально заведённого поля-условия в схеме
// achievements нет, критерий закодирован конвенцией по `category`).
// Возвращает достижения, которые СТАЛИ выполненными именно в этом вызове
// (для тоста), не трогает уже выполненные/уже забранные (claimed).
export async function recalculateAchievements(userId: string): Promise<NewlyCompletedAchievement[]> {
    const allAchievements = await db.query.achievements.findMany();
    const existingRows = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
    });
    const existingByAchievementId = new Map(existingRows.map((row) => [row.achievementId, row]));

    const newlyCompleted: NewlyCompletedAchievement[] = [];

    const applyResult = async (ach: typeof allAchievements[number], metric: number) => {
        const existing = existingByAchievementId.get(ach.id);
        const wasCompleted = existing?.isCompleted ?? false;
        const isCompleted = metric >= ach.requirement;

        if (!existing) {
            await db.insert(userAchievements).values({
                userId,
                achievementId: ach.id,
                progress: metric,
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            });
        } else if (metric !== existing.progress || isCompleted !== wasCompleted) {
            await db.update(userAchievements)
                .set({
                    progress: metric,
                    isCompleted,
                    completedAt: isCompleted && !wasCompleted ? new Date() : existing.completedAt,
                })
                .where(and(
                    eq(userAchievements.userId, userId),
                    eq(userAchievements.achievementId, ach.id)
                ));
        }

        if (isCompleted && !wasCompleted) {
            newlyCompleted.push({
                id: ach.id,
                name: ach.name,
                description: ach.description ?? '',
                rewardPoints: ach.rewardPoints ?? 0,
                rewardGems: ach.rewardGems ?? 0,
            });
        }
    };

    const regularAchievements = allAchievements.filter((a) => a.category !== 'special');
    for (const ach of regularAchievements) {
        const metric = await getMetricForCategory(userId, ach.category);
        await applyResult(ach, metric);
    }

    // 'special' — считаем ПОСЛЕ обновления остальных, чтобы достижение,
    // выполненное только что этим же вызовом, уже попало в счёт.
    const specialAchievements = allAchievements.filter((a) => a.category === 'special');
    if (specialAchievements.length > 0) {
        const nonSpecialIds = new Set(regularAchievements.map((a) => a.id));
        const completedNonSpecial = await db.query.userAchievements.findMany({
            where: and(
                eq(userAchievements.userId, userId),
                eq(userAchievements.isCompleted, true)
            ),
        });
        const metric = completedNonSpecial.filter((row) =>
            row.achievementId !== null && nonSpecialIds.has(row.achievementId)
        ).length;

        for (const ach of specialAchievements) {
            await applyResult(ach, metric);
        }
    }

    return newlyCompleted;
}
