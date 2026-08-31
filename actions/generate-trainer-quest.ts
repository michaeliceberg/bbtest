// app/actions/generate-trainer-quest.ts

'use server';

import db from '@/db/drizzle';
import { trainerQuests, t_lessons, t_units, t_courses, trainerStreaks, userHomework } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
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

// Целевые значения дневных мини-квестов на экране "промежуточных наград"
// (components/trainer-quest-rewards-screen.tsx) — фиксированные, не
// настраиваются по теме/пользователю (то же самое, что уже сделано для
// generateDailyTrainerQuest's questCount=3..5, просто константы попроще).
const STREAK5_TARGET = 2;
const PERFECT_TARGET = 2;

// Вызывается ровно один раз при завершении урока тренажёра С ИДЕАЛЬНЫМ
// результатом (тем же условием, что уже открывает сундук, см. TQUIZ.tsx —
// т.е. "без ошибок" для perfectLessonCount выполняется автоматически на
// каждый вызов). maxStreak — наибольшая серия подряд верных ответов,
// достигнутая ВНУТРИ этой попытки (не путать с trainerStreaks —
// стриком по ДНЯМ, это отдельное понятие, см. комментарий у полей схемы).
//
// В отличие от completeTrainerQuestLesson (гейтится ?fromQuest=true и
// конкретным списком tLessonIds дневного квеста) — эти два счётчика растут
// от ЛЮБОГО урока темы, пройденного сегодня, независимо от того, входил
// ли он в основной список из 3-5 уроков.
export async function reportLessonQuestSignals(t_lessonId: number, maxStreak: number) {
    const session = await auth();
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    const lesson = await db.query.t_lessons.findFirst({
        where: eq(t_lessons.id, t_lessonId),
        with: { t_unit: true },
    });
    const tCourseId = lesson?.t_unit?.t_courseId;
    if (!tCourseId) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quest = (await db.query.trainerQuests.findFirst({
        where: and(
            eq(trainerQuests.userId, userId),
            eq(trainerQuests.tCourseId, tCourseId),
            eq(trainerQuests.date, today)
        ),
    })) ?? null;

    // Урок мог быть пройден раньше первого визита на /trainer сегодня
    // (например, по прямой ссылке) — тогда дневной строки квеста ещё нет,
    // создаём её тем же путём, что и сама страница /trainer.
    if (!quest) {
        quest = await generateDailyTrainerQuest(tCourseId);
        if (!quest) return null;
    }

    const newStreak5Count = Math.min((quest.streak5Count ?? 0) + (maxStreak >= 5 ? 1 : 0), STREAK5_TARGET);
    const newPerfectCount = Math.min((quest.perfectLessonCount ?? 0) + 1, PERFECT_TARGET);

    await db.update(trainerQuests)
        .set({
            streak5Count: newStreak5Count,
            perfectLessonCount: newPerfectCount,
            updatedAt: new Date(),
        })
        .where(eq(trainerQuests.id, quest.id));

    // Домашка за текущий месяц — только если у этого t_course есть
    // привязанный основной курс (t_courses.courseId, nullable). Без
    // привязки честно возвращаем null, а не 0/0 (которое выглядело бы как
    // "всё сделано", хотя на деле просто нечего было бы считать).
    let hwDone: number | null = null;
    let hwTotal: number | null = null;
    const tCourse = await db.query.t_courses.findFirst({ where: eq(t_courses.id, tCourseId) });
    if (tCourse?.courseId) {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const rows = await db.select({ status: userHomework.status })
            .from(userHomework)
            .where(and(
                eq(userHomework.userId, userId),
                eq(userHomework.courseId, tCourse.courseId),
                gte(userHomework.assignedAt, monthStart)
            ));
        hwTotal = rows.length;
        hwDone = rows.filter((r) => r.status === 'completed').length;
    }

    return {
        streak5Count: newStreak5Count,
        streak5Target: STREAK5_TARGET,
        perfectLessonCount: newPerfectCount,
        perfectTarget: PERFECT_TARGET,
        hwDone,
        hwTotal,
    };
}