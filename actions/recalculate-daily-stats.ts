// app/actions/recalculate-daily-stats.ts

'use server';

import db from "@/db/drizzle";
import { userDailyStats, userHomework } from "@/db/schema";
import { and, eq } from "drizzle-orm";


export const recalculateDailyStats = async (userId: string, courseId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    

    console.log('🔄 recalculateDailyStats START');
    console.log('   userId:', userId);
    console.log('   courseId:', courseId);
    console.log('   today:', today.toISOString());


    // Получаем все активные ДЗ за сегодня
    const todayHomework = await db.query.userHomework.findMany({
        where: and(
            eq(userHomework.userId, userId),
            eq(userHomework.courseId, courseId),
            eq(userHomework.dueDate, today)
        ),
    });
    
    // Считаем агрегированные данные
    let totalAssigned = 0;
    let totalCorrect = 0;      // только правильные решения
    let anyIncomplete = false;
    
    for (const hw of todayHomework) {
        totalAssigned += hw.totalCount;
        totalCorrect += hw.correctCount;  // ← только правильные
        if (hw.correctCount < hw.totalCount) {
            anyIncomplete = true;
        }
    }
    
    // Обновляем userDailyStats
    const existingStats = await db.query.userDailyStats.findFirst({
        where: and(
            eq(userDailyStats.userId, userId),
            eq(userDailyStats.courseId, courseId),
            eq(userDailyStats.date, today)
        ),
    });
    
    if (existingStats) {
        await db.update(userDailyStats)
            .set({
                hwAssigned: totalAssigned,
                hwDone: totalCorrect,        // ← только правильные
                hwCompleted: !anyIncomplete && totalAssigned > 0,
                updatedAt: new Date(),
            })
            .where(eq(userDailyStats.id, existingStats.id));
    } else if (totalAssigned > 0) {
        await db.insert(userDailyStats).values({
            userId,
            courseId,
            date: today,
            hwAssigned: totalAssigned,
            hwDone: totalCorrect,
            hwCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    
    return { success: true, totalAssigned, totalCorrect };
};