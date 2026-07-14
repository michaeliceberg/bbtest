// app/actions/class-hw-update.ts

'use server';

import db from "@/db/drizzle";
import { classesHw, userDailyStats, userProgress, userHomework } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recalculateDailyStats } from "./recalculate-daily-stats";

export const upsertClassHW = async (
    classId: number,
    lessonsIdsHw: number[],
    challengeIdsHw: number[],
) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Вы не авторизованы!');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(today);
    dueDate.setHours(23, 59, 59, 999);

    // 1. Сохраняем в classesHw (история выдачи)
    await db.insert(classesHw).values({
        classId,
        taskTrainer: lessonsIdsHw.length > 0 ? lessonsIdsHw.join(',') : null,
        task: challengeIdsHw.length > 0 ? challengeIdsHw.join(',') : null,
        dateHw: today,
    });

    // 2. Находим всех учеников класса
    const students = await db.query.userProgress.findMany({
        where: eq(userProgress.classId, classId),
    });

    console.log(`📦 Выдача HW для класса ${classId}`);
    console.log(`📚 Новые challengeIds:`, challengeIdsHw);
    console.log(`👨‍🎓 Найдено учеников: ${students.length}`);

    for (const student of students) {
        const activeCourseId = student.activeCourseId;
        if (!activeCourseId) {
            console.log(`⚠️ У ученика ${student.userName} нет активного курса`);
            continue;
        }

        // 3. Сохраняем запись в userHomework (история ДЗ)
        // 🔥 Тип 'teacher' для ДЗ от учителя
        await db.insert(userHomework).values({
            userId: student.userId,
            courseId: activeCourseId,
            challengeIds: challengeIdsHw.join(','),
            totalCount: challengeIdsHw.length,
            assignedAt: today,
            dueDate: dueDate,
            status: 'pending',
            correctCount: 0,
            wrongCount: 0,
            type: 'teacher', // 🔥 ДЗ от учителя
        });

        // 4. Обновляем userDailyStats
        const existingStats = await db.query.userDailyStats.findFirst({
            where: and(
                eq(userDailyStats.userId, student.userId),
                eq(userDailyStats.courseId, activeCourseId),
                eq(userDailyStats.date, today)
            ),
        });

        if (existingStats) {
            await db.update(userDailyStats)
                .set({
                    hwAssigned: (existingStats.hwAssigned || 0) + challengeIdsHw.length,
                    updatedAt: new Date(),
                })
                .where(eq(userDailyStats.id, existingStats.id));
        } else {
            await db.insert(userDailyStats).values({
                userId: student.userId,
                courseId: activeCourseId,
                date: today,
                hwAssigned: challengeIdsHw.length,
                hwDone: 0,
                hwCompleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        await recalculateDailyStats(student.userId, activeCourseId);
    }

    revalidatePath('/classroom');
    revalidatePath('/learn');

    return { success: true };
};


