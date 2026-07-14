// app/actions/initializeDailyHw.ts

'use server';

import db from "@/db/drizzle";
import { userDailyStats, userProgress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export const initializeDailyHw = async (courseId: number, defaultHwCount: number = 3) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Вы не авторизованы!');
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Проверяем, есть ли уже HW на сегодня
    let existingStats = await db.query.userDailyStats.findFirst({
        where: and(
            eq(userDailyStats.userId, userId),
            eq(userDailyStats.courseId, courseId),
            eq(userDailyStats.date, today)
        ),
    });

    if (!existingStats) {
        // Создаем новую запись без HW (0 заданий)
        const [newStats] = await db.insert(userDailyStats).values({
            userId,
            courseId,
            date: today,
            hwAssigned: 0,
            hwDone: 0,
            hwCompleted: false,
            challengesDone: 0,
            challengesRight: 0,
            challengesWrong: 0,
            pointsEarned: 0,
            gemsEarned: 0,
            gemsSpent: 0,
            lastActivityAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        
        existingStats = newStats;
    }

    return {
        hwAssigned: existingStats.hwAssigned,
        hwDone: existingStats.hwDone,
        hwCompleted: existingStats.hwCompleted,
    };
};