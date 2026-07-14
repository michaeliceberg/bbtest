// app/actions/upsert-trainer-homework.ts

'use server';

import db from "@/db/drizzle";
import { classesHw, userDailyStats, userHomework, userProgress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const upsertTrainerHomework = async (
    classId: number,
    tLessonIds: number[],
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
        taskTrainer: tLessonIds.length > 0 ? tLessonIds.join(',') : null,
        task: null,
        dateHw: today,
    });

    // 2. Находим всех учеников класса
    const students = await db.query.userProgress.findMany({
        where: eq(userProgress.classId, classId),
    });

    console.log(`📦 Выдача HW (тренажер) для класса ${classId}`);
    console.log(`📚 tLessonIds:`, tLessonIds);

    for (const student of students) {
        const activeCourseId = student.activeCourseId;
        if (!activeCourseId) continue;

        // 3. Сохраняем запись в userHomework (история ДЗ тренажера)
        // 🔥 Используем новую колонку tLessonIds
        await db.insert(userHomework).values({
            userId: student.userId,
            courseId: activeCourseId,
            tLessonIds: tLessonIds.join(','),  // ← теперь в свою колонку
            totalCount: tLessonIds.length,
            assignedAt: today,
            dueDate: dueDate,
            status: 'pending',
            correctCount: 0,
            wrongCount: 0,
        });

        // 4. Обновляем userDailyStats (агрегация)
        const existingStats = await db.query.userDailyStats.findFirst({
            where: and(
                eq(userDailyStats.userId, student.userId),
                eq(userDailyStats.courseId, activeCourseId),
                eq(userDailyStats.date, today)
            ),
        });

        // Получаем все активные ДЗ за сегодня (и задачник, и тренажер)
        const todayHomework = await db.query.userHomework.findMany({
            where: and(
                eq(userHomework.userId, student.userId),
                eq(userHomework.courseId, activeCourseId),
                eq(userHomework.dueDate, today)
            ),
        });

        let totalAssigned = 0;
        let totalCorrect = 0;
        for (const hw of todayHomework) {
            totalAssigned += hw.totalCount;
            totalCorrect += hw.correctCount;
        }

        if (existingStats) {
            await db.update(userDailyStats)
                .set({
                    hwAssigned: totalAssigned,
                    hwDone: totalCorrect,
                    hwCompleted: totalCorrect >= totalAssigned && totalAssigned > 0,
                    updatedAt: new Date(),
                })
                .where(eq(userDailyStats.id, existingStats.id));
        } else {
            await db.insert(userDailyStats).values({
                userId: student.userId,
                courseId: activeCourseId,
                date: today,
                hwAssigned: totalAssigned,
                hwDone: totalCorrect,
                hwCompleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    revalidatePath('/classroom');
    revalidatePath('/learn');
    revalidatePath('/trainer');

    return { success: true };
};


