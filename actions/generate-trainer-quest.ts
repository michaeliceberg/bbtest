// app/actions/generate-trainer-quest.ts

'use server';

import db from '@/db/drizzle';
import { trainerQuests, t_lessons, t_units, trainerStreaks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function generateDailyTrainerQuest(tCourseId: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Не авторизован');
    
    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Проверяем, есть ли уже квест на сегодня
    const existing = await db.query.trainerQuests.findFirst({
        where: and(
            eq(trainerQuests.userId, userId),
            eq(trainerQuests.tCourseId, tCourseId),
            eq(trainerQuests.date, today)
        ),
    });
    
    if (existing) return existing;
    
    // Получаем все уроки тренажера по этому курсу через t_units
    // 1. Сначала получаем все unit'ы этого курса
    const units = await db.query.t_units.findMany({
        where: eq(t_units.t_courseId, tCourseId),
    });
    
    const unitIds = units.map(u => u.id);
    
    if (unitIds.length === 0) {
        // Нет уроков в этом тренажере
        return null;
    }
    
    // 2. Получаем все уроки из этих unit'ов
    const allLessons = await db.query.t_lessons.findMany({
        where: (t_lessons, { inArray }) => inArray(t_lessons.t_unitId, unitIds),
    });
    
    if (allLessons.length === 0) return null;
    
    // Выбираем 3-5 случайных уроков
    const questCount = Math.min(5, Math.max(3, allLessons.length));
    const shuffled = [...allLessons].sort(() => 0.5 - Math.random());
    const selectedLessons = shuffled.slice(0, questCount);
    const tLessonIds = selectedLessons.map(l => l.id).join(',');
    
    // Создаем квест
    const [quest] = await db.insert(trainerQuests).values({
        userId,
        tCourseId: tCourseId,
        date: today,
        tLessonIds: tLessonIds,
        totalCount: selectedLessons.length,
        completedCount: 0,
        isCompleted: false,
    }).returning();
    
    return quest;
}



// app/actions/generate-trainer-quest.ts

export async function completeTrainerQuestLesson(tLessonId: number, tCourseId: number, userId: string) {
    const session = await auth();
    const currentUserId = userId || session?.user?.id;
    
    if (!currentUserId) throw new Error('Не авторизован');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const quest = await db.query.trainerQuests.findFirst({
        where: and(
            eq(trainerQuests.userId, currentUserId),
            eq(trainerQuests.tCourseId, tCourseId),
            eq(trainerQuests.date, today)
        ),
    });
    
    if (!quest || quest.isCompleted) return { success: false, message: 'Квест не найден или уже выполнен' };
    
    const lessonIds = quest.tLessonIds.split(',').map(Number);
    if (!lessonIds.includes(tLessonId)) return { success: false, message: 'Урок не входит в квест' };
    
    const newCompletedCount = (quest.completedCount || 0) + 1;
    const isCompleted = newCompletedCount >= quest.totalCount;
    
    await db.update(trainerQuests)
        .set({
            completedCount: newCompletedCount,
            isCompleted: isCompleted,
            completedAt: isCompleted ? new Date() : null,
            updatedAt: new Date(),
        })
        .where(eq(trainerQuests.id, quest.id));
    
    if (isCompleted) {
        await updateTrainerStreak(currentUserId, tCourseId);
    }
    
    return { 
        success: true, 
        completedCount: newCompletedCount, 
        totalCount: quest.totalCount,
        isCompleted 
    };
}



// // Отметка выполнения урока в квесте
// export async function completeTrainerQuestLesson(tLessonId: number, tCourseId: number, userId: string) {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const quest = await db.query.trainerQuests.findFirst({
//         where: and(
//             eq(trainerQuests.userId, userId),
//             eq(trainerQuests.tCourseId, tCourseId),
//             eq(trainerQuests.date, today)
//         ),
//     });
    
//     if (!quest || quest.isCompleted) return;
    
//     const lessonIds = quest.tLessonIds.split(',').map(Number);
//     if (!lessonIds.includes(tLessonId)) return;
    
//     const newCompletedCount = (quest.completedCount || 0) + 1;
//     const isCompleted = newCompletedCount >= quest.totalCount;
    
//     await db.update(trainerQuests)
//         .set({
//             completedCount: newCompletedCount,
//             isCompleted: isCompleted,
//             completedAt: isCompleted ? new Date() : null,
//             updatedAt: new Date(),
//         })
//         .where(eq(trainerQuests.id, quest.id));
    
//     // Если квест выполнен полностью, обновляем стрик
//     if (isCompleted) {
//         await updateTrainerStreak(userId, tCourseId);
//     }
// }



// Обновление стрика (упрощенная версия)
async function updateTrainerStreak(userId: string, tCourseId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayQuest = await db.query.trainerQuests.findFirst({
        where: and(
            eq(trainerQuests.userId, userId),
            eq(trainerQuests.tCourseId, tCourseId),
            eq(trainerQuests.date, today)
        ),
    });
    
    const todayCompleted = todayQuest?.isCompleted || false;
    
    const yesterdayQuest = await db.query.trainerQuests.findFirst({
        where: and(
            eq(trainerQuests.userId, userId),
            eq(trainerQuests.tCourseId, tCourseId),
            eq(trainerQuests.date, yesterday)
        ),
    });
    
    const yesterdayCompleted = yesterdayQuest?.isCompleted || false;
    
    let existingStreak = await db.query.trainerStreaks.findFirst({
        where: and(
            eq(trainerStreaks.userId, userId),
            eq(trainerStreaks.tCourseId, tCourseId)
        ),
    });
    
    let newStreak = 0;
    if (todayCompleted) {
        const currentStreak = existingStreak?.currentStreak ?? 0;
        newStreak = yesterdayCompleted ? currentStreak + 1 : 1;
    }
    
    if (existingStreak) {
        await db.update(trainerStreaks)
            .set({
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, existingStreak.longestStreak ?? 0),
                lastCompletedDate: todayCompleted ? today : existingStreak.lastCompletedDate,
                updatedAt: new Date(),
            })
            .where(eq(trainerStreaks.id, existingStreak.id));
    } else if (todayCompleted) {
        await db.insert(trainerStreaks).values({
            userId,
            tCourseId,
            currentStreak: newStreak,
            longestStreak: newStreak,
            lastCompletedDate: today,
        });
    }
}