// app/actions/updateHwProgress.ts

'use server';

import db from "@/db/drizzle";
import { userDailyStats } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export const updateHwProgress = async (courseId: number, challengeId: number, isCorrect: boolean) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Вы не авторизованы!');
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await db.query.userDailyStats.findFirst({
        where: and(
            eq(userDailyStats.userId, userId),
            eq(userDailyStats.courseId, courseId),
            eq(userDailyStats.date, today)
        ),
    });

    if (!todayStats) return;

    // Если есть HW и оно не выполнено полностью
    if (todayStats.hwAssigned > 0 && todayStats.hwDone < todayStats.hwAssigned && isCorrect) {
        const newHwDone = (todayStats.hwDone || 0) + 1;
        
        await db.update(userDailyStats)
            .set({
                hwDone: newHwDone,
                hwCompleted: newHwDone >= todayStats.hwAssigned,
                updatedAt: new Date(),
            })
            .where(eq(userDailyStats.id, todayStats.id));
    }
};