// app/actions/generate-homework.ts

'use server';

import db from '@/db/drizzle';
import { userHomework, challenges, challengeProgress } from '@/db/schema';
import { getWeightedActiveLessons } from '@/lib/active-lessons';
import { recalculateDailyStats } from './recalculate-daily-stats';
import { auth } from '@/lib/auth';
import { and, eq, inArray, gte, lte, ne, or, lt } from 'drizzle-orm'; // ← добавить lt

const DAILY_HOMEWORK_SIZE = 2;

export async function generateHomework(courseId: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Не авторизован');
    
    const userId = session.user.id;
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // 1. Проверяем ДЗ на сегодня
    const existing = await db.query.userHomework.findFirst({
        where: and(
            eq(userHomework.userId, userId),
            eq(userHomework.courseId, courseId),
            eq(userHomework.type, 'daily'),
            gte(userHomework.assignedAt, startOfDay),
            lte(userHomework.assignedAt, endOfDay)
        ),
    });
    
    if (existing) {
        console.log('✅ ДЗ на сегодня уже существует');
        return [existing];
    }
    
    // 🔥 НАСТРОЙКА: количество дней, после которых задачи можно повторно использовать
    const DAYS_TO_RESET = 30; // можно настроить под свои нужды
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() - DAYS_TO_RESET);
    
    console.log(`🔄 Сбрасываем задачи, которые были в ДЗ до ${resetDate.toLocaleDateString()}`);
    
    // 🔥 Получаем НЕДАВНИЕ ДЗ (только за последние DAYS_TO_RESET дней)
    const recentHomework = await db.query.userHomework.findMany({
        where: and(
            eq(userHomework.userId, userId),
            eq(userHomework.courseId, courseId),
            eq(userHomework.type, 'daily'),
            or(
                eq(userHomework.status, 'pending'),
                eq(userHomework.status, 'expired')
            ),
            gte(userHomework.dueDate, resetDate) // ← только ДЗ не старше N дней
        ),
    });
    
    // Старые ДЗ (старше DAYS_TO_RESET дней) - игнорируем, их задачи можно использовать снова
    const oldHomework = await db.query.userHomework.findMany({
        where: and(
            eq(userHomework.userId, userId),
            eq(userHomework.courseId, courseId),
            eq(userHomework.type, 'daily'),
            lt(userHomework.dueDate, resetDate) // ← ДЗ старше N дней
        ),
    });
    
    console.log(`📊 Недавних ДЗ: ${recentHomework.length}, старых ДЗ: ${oldHomework.length} (игнорируем)`);
    
    // Собираем challengeId ТОЛЬКО из недавних ДЗ
    const usedChallengeIds = new Set<number>();
    for (const hw of recentHomework) {
        if (hw.challengeIds) {
            const ids = hw.challengeIds.split(',').map(Number);
            ids.forEach(id => usedChallengeIds.add(id));
        }
    }
    
    console.log(`📚 Использованные challengeId за последние ${DAYS_TO_RESET} дней:`, Array.from(usedChallengeIds));
    
    // 2. Получаем все активные уроки
    const weightedLessons = await getWeightedActiveLessons(userId, courseId);
    
    if (weightedLessons.length === 0) {
        console.log('❌ Нет активных уроков');
        return [];
    }
    
    const lessonIds = weightedLessons.map(l => l.id);
    
    // 3. Получаем все challenge для всех уроков
    const allChallenges = await db.query.challenges.findMany({
        where: inArray(challenges.lessonId, lessonIds),
    });
    
    // 4. Получаем все правильно решённые challenge пользователя
    const solvedCorrectly = await db.query.challengeProgress.findMany({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.doneRight, true)
        ),
    });
    const solvedIds = new Set(solvedCorrectly.map(s => s.challengeId));
    
    // 5. Группируем challenge по урокам (не решённые И не использованные в НЕДАВНИХ ДЗ)
    const challengesByLesson = new Map<number, typeof allChallenges>();
    for (const challenge of allChallenges) {
        const isRecentlyUsed = usedChallengeIds.has(challenge.id);
        const isAlreadySolved = solvedIds.has(challenge.id);
        
        // 🔥 Исключаем только НЕДАВНО использованные в ДЗ и уже решённые
        if (!isRecentlyUsed && !isAlreadySolved) {
            if (!challengesByLesson.has(challenge.lessonId)) {
                challengesByLesson.set(challenge.lessonId, []);
            }
            challengesByLesson.get(challenge.lessonId)!.push(challenge);
        }
    }
    
    // 6. Проверяем, есть ли вообще доступные задачи
    let totalAvailable = Array.from(challengesByLesson.values()).flat().length;
    console.log(`📊 Доступно новых задач: ${totalAvailable}`);
    
    if (totalAvailable === 0) {
        console.log('⚠️ Нет новых задач для ДЗ!');
        
        // 🔥 Опционально: можно расширить пул, включив старые задачи
        console.log('🔄 Расширяем пул задач за счёт старых ДЗ...');
        
        // Собираем ВСЕ использованные задачи (включая старые)
        const allUsedChallengeIds = new Set<number>();
        const allHomework = [...recentHomework, ...oldHomework];
        for (const hw of allHomework) {
            if (hw.challengeIds) {
                const ids = hw.challengeIds.split(',').map(Number);
                ids.forEach(id => allUsedChallengeIds.add(id));
            }
        }
        
        // Теперь исключаем только решённые, но включаем старые задачи из ДЗ
        for (const challenge of allChallenges) {
            const isUsed = allUsedChallengeIds.has(challenge.id);
            const isAlreadySolved = solvedIds.has(challenge.id);
            
            if (!isAlreadySolved) { // Разрешаем использовать старые задачи из ДЗ
                if (!challengesByLesson.has(challenge.lessonId)) {
                    challengesByLesson.set(challenge.lessonId, []);
                }
                if (!challengesByLesson.get(challenge.lessonId)!.includes(challenge)) {
                    challengesByLesson.get(challenge.lessonId)!.push(challenge);
                }
            }
        }
        
        totalAvailable = Array.from(challengesByLesson.values()).flat().length;
        console.log(`📊 После расширения доступно задач: ${totalAvailable}`);
        
        if (totalAvailable === 0) {
            return [];
        }
    }
    
    // 7. Выбираем challenge с учётом весов (только новые)
    const selectedChallengeIds: number[] = [];
    const distribution: { lessonTitle: string; count: number }[] = [];
    
    const sortedLessons = [...weightedLessons].sort((a, b) => b.weight - a.weight);
    
    for (const lesson of sortedLessons) {
        const lessonChallenges = challengesByLesson.get(lesson.id) || [];
        if (lessonChallenges.length === 0) continue;
        
        let targetCount = Math.round(DAILY_HOMEWORK_SIZE * lesson.weight);
        targetCount = Math.min(targetCount, lessonChallenges.length);
        targetCount = Math.max(1, targetCount);
        
        const shuffled = [...lessonChallenges].sort(() => 0.5 - Math.random());
        for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
            if (!selectedChallengeIds.includes(shuffled[i].id) && selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
                selectedChallengeIds.push(shuffled[i].id);
                const existingDist = distribution.find(d => d.lessonTitle === lesson.title);
                if (existingDist) {
                    existingDist.count++;
                } else {
                    distribution.push({ lessonTitle: lesson.title, count: 1 });
                }
            }
        }
        
        if (selectedChallengeIds.length >= DAILY_HOMEWORK_SIZE) break;
    }
    
    // Если не хватает, добираем из любых новых
    if (selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
        const allAvailable = Array.from(challengesByLesson.values()).flat();
        const remaining = allAvailable.filter(c => !selectedChallengeIds.includes(c.id));
        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        const needed = DAILY_HOMEWORK_SIZE - selectedChallengeIds.length;
        for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
            selectedChallengeIds.push(shuffled[i].id);
        }
    }
    
    if (selectedChallengeIds.length === 0) {
        console.log('❌ Не удалось выбрать challenge');
        return [];
    }
    
    // Проверка на NaN
    if (selectedChallengeIds.some(id => isNaN(id))) {
        console.error('❌ Обнаружен NaN в selectedChallengeIds!', selectedChallengeIds);
        return [];
    }
    
    console.log(`✅ Выбраны задачи: ${selectedChallengeIds.join(', ')}`);
    console.log('📚 Распределение:', distribution);
    
    // 8. Создаём запись в userHomework
    const assignedAt = new Date();
    assignedAt.setHours(0, 0, 0, 0);
    const dueDate = new Date(assignedAt);
    dueDate.setHours(23, 59, 59, 999);
    
    const [homework] = await db.insert(userHomework).values({
        userId,
        courseId,
        challengeIds: selectedChallengeIds.join(','),
        totalCount: selectedChallengeIds.length,
        assignedAt: assignedAt,
        dueDate: dueDate,
        status: 'pending',
        correctCount: 0,
        wrongCount: 0,
        type: 'daily',
    }).returning();
    
    // 9. Обновляем daily stats
    await recalculateDailyStats(userId, courseId);
    
    console.log(`✅ ДЗ создано. Задач: ${selectedChallengeIds.length}`);
    
    return [homework];
}









// // app/actions/generate-homework.ts

// 'use server';

// import db from '@/db/drizzle';
// import { userHomework, challenges, challengeProgress } from '@/db/schema';
// import { getWeightedActiveLessons } from '@/lib/active-lessons';
// import { recalculateDailyStats } from './recalculate-daily-stats';
// import { auth } from '@/lib/auth';
// import { and, eq, inArray, gte, lte, ne, or } from 'drizzle-orm';

// const DAILY_HOMEWORK_SIZE = 2;

// export async function generateHomework(courseId: number) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const today = new Date();
//     const startOfDay = new Date(today);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(today);
//     endOfDay.setHours(23, 59, 59, 999);
    
//     // 1. Проверяем ДЗ на сегодня
//     const existing = await db.query.userHomework.findFirst({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.type, 'daily'),
//             gte(userHomework.assignedAt, startOfDay),
//             lte(userHomework.assignedAt, endOfDay)
//         ),
//     });
    
//     if (existing) {
//         console.log('✅ ДЗ на сегодня уже существует');
//         return [existing];
//     }
    
//     // 🔥 НОВОЕ: Получаем ВСЕ задачи, которые уже есть в любых ДЗ (включая просроченные)
//     const allExistingHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.type, 'daily'),
//             or(
//                 eq(userHomework.status, 'pending'),
//                 eq(userHomework.status, 'expired')
//             )
//         ),
//     });
    
//     // Собираем все challengeId, которые уже были выданы
//     const usedChallengeIds = new Set<number>();
//     for (const hw of allExistingHomework) {
//         if (hw.challengeIds) {
//             const ids = hw.challengeIds.split(',').map(Number);
//             ids.forEach(id => usedChallengeIds.add(id));
//         }
//     }
    
//     console.log(`📚 Уже использованные challengeId:`, Array.from(usedChallengeIds));
    
//     // 2. Получаем все активные уроки
//     const weightedLessons = await getWeightedActiveLessons(userId, courseId);
    
//     if (weightedLessons.length === 0) {
//         console.log('❌ Нет активных уроков');
//         return [];
//     }
    
//     const lessonIds = weightedLessons.map(l => l.id);
    
//     // 3. Получаем все challenge для всех уроков
//     const allChallenges = await db.query.challenges.findMany({
//         where: inArray(challenges.lessonId, lessonIds),
//     });
    
//     // 4. Получаем все правильно решённые challenge пользователя
//     const solvedCorrectly = await db.query.challengeProgress.findMany({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.doneRight, true)
//         ),
//     });
//     const solvedIds = new Set(solvedCorrectly.map(s => s.challengeId));
    
//     // 5. Группируем challenge по урокам (только нерешённые И НЕ использованные ранее)
//     const challengesByLesson = new Map<number, typeof allChallenges>();
//     for (const challenge of allChallenges) {
//         const isAlreadyUsed = usedChallengeIds.has(challenge.id);
//         const isAlreadySolved = solvedIds.has(challenge.id);
        
//         // 🔥 Исключаем уже использованные в ДЗ и уже решённые
//         if (!isAlreadyUsed && !isAlreadySolved) {
//             if (!challengesByLesson.has(challenge.lessonId)) {
//                 challengesByLesson.set(challenge.lessonId, []);
//             }
//             challengesByLesson.get(challenge.lessonId)!.push(challenge);
//         }
//     }
    
//     // 6. Проверяем, есть ли вообще доступные задачи
//     let totalAvailable = Array.from(challengesByLesson.values()).flat().length;
//     console.log(`📊 Доступно новых задач: ${totalAvailable}`);
    
//     if (totalAvailable === 0) {
//         console.log('⚠️ Нет новых задач для ДЗ! Все задачи уже были в ДЗ или решены.');
        
//         // 🔥 Опционально: можно сбросить использованные задачи через N дней
//         // Или просто вернуть пустой массив
//         return [];
//     }
    
//     // 7. Выбираем challenge с учётом весов (только новые)
//     const selectedChallengeIds: number[] = [];
//     const distribution: { lessonTitle: string; count: number }[] = [];
    
//     const sortedLessons = [...weightedLessons].sort((a, b) => b.weight - a.weight);
    
//     for (const lesson of sortedLessons) {
//         const lessonChallenges = challengesByLesson.get(lesson.id) || [];
//         if (lessonChallenges.length === 0) continue;
        
//         let targetCount = Math.round(DAILY_HOMEWORK_SIZE * lesson.weight);
//         targetCount = Math.min(targetCount, lessonChallenges.length);
//         targetCount = Math.max(1, targetCount);
        
//         const shuffled = [...lessonChallenges].sort(() => 0.5 - Math.random());
//         for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
//             if (!selectedChallengeIds.includes(shuffled[i].id) && selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
//                 selectedChallengeIds.push(shuffled[i].id);
//                 const existingDist = distribution.find(d => d.lessonTitle === lesson.title);
//                 if (existingDist) {
//                     existingDist.count++;
//                 } else {
//                     distribution.push({ lessonTitle: lesson.title, count: 1 });
//                 }
//             }
//         }
        
//         if (selectedChallengeIds.length >= DAILY_HOMEWORK_SIZE) break;
//     }
    
//     // Если не хватает, добираем из любых новых
//     if (selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
//         const allAvailable = Array.from(challengesByLesson.values()).flat();
//         const remaining = allAvailable.filter(c => !selectedChallengeIds.includes(c.id));
//         const shuffled = [...remaining].sort(() => 0.5 - Math.random());
//         const needed = DAILY_HOMEWORK_SIZE - selectedChallengeIds.length;
//         for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
//             selectedChallengeIds.push(shuffled[i].id);
//         }
//     }
    
//     if (selectedChallengeIds.length === 0) {
//         console.log('❌ Не удалось выбрать challenge');
//         return [];
//     }
    
//     // Проверка на NaN
//     if (selectedChallengeIds.some(id => isNaN(id))) {
//         console.error('❌ Обнаружен NaN в selectedChallengeIds!', selectedChallengeIds);
//         return [];
//     }
    
//     console.log(`✅ Выбраны новые задачи: ${selectedChallengeIds.join(', ')}`);
//     console.log('📚 Распределение:', distribution);
    
//     // 8. Создаём запись в userHomework
//     const assignedAt = new Date();
//     assignedAt.setHours(0, 0, 0, 0);
//     const dueDate = new Date(assignedAt);
//     dueDate.setHours(23, 59, 59, 999);
    
//     const [homework] = await db.insert(userHomework).values({
//         userId,
//         courseId,
//         challengeIds: selectedChallengeIds.join(','),
//         totalCount: selectedChallengeIds.length,
//         assignedAt: assignedAt,
//         dueDate: dueDate,
//         status: 'pending',
//         correctCount: 0,
//         wrongCount: 0,
//         type: 'daily',
//     }).returning();
    
//     // 9. Обновляем daily stats
//     await recalculateDailyStats(userId, courseId);
    
//     console.log(`✅ ДЗ создано. Задач: ${selectedChallengeIds.length}`);
    
//     return [homework];
// }






// // app/actions/generate-homework.ts (ФИНАЛЬНАЯ ВЕРСИЯ)

// 'use server';

// import db from '@/db/drizzle';
// import { userHomework, challenges, challengeProgress } from '@/db/schema';
// import { getWeightedActiveLessons } from '@/lib/active-lessons';
// import { recalculateDailyStats } from './recalculate-daily-stats';
// import { auth } from '@/lib/auth';
// import { and, eq, inArray, gte, lte } from 'drizzle-orm';

// const DAILY_HOMEWORK_SIZE = 2;

// export async function generateHomework(courseId: number) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const today = new Date();
//     const startOfDay = new Date(today);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(today);
//     endOfDay.setHours(23, 59, 59, 999);
    
//     // ШАГ 1: Проверяем ДЗ на сегодня
//     const existing = await db.query.userHomework.findFirst({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.type, 'daily'),
//             gte(userHomework.assignedAt, startOfDay),
//             lte(userHomework.assignedAt, endOfDay)
//         ),
//     });
    
//     if (existing) {
//         console.log('✅ ДЗ на сегодня уже существует');
//         return [existing];
//     }
    
//     // ШАГ 2: Проверяем просроченное ДЗ (последние 3 дня)
//     const threeDaysAgo = new Date();
//     threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
//     const expiredHomework = await db.query.userHomework.findFirst({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.type, 'daily'),
//             eq(userHomework.status, 'expired'),
//             gte(userHomework.dueDate, threeDaysAgo)
//         ),
//         orderBy: (homework, { desc }) => [desc(homework.dueDate)],
//     });
    
//     if (expiredHomework) {
//         console.log('⏳ Возвращаем просроченное ДЗ для доделки');
        
//         // Обновляем статус и даты
//         await db.update(userHomework)
//             .set({
//                 status: 'pending',
//                 assignedAt: startOfDay,
//                 dueDate: endOfDay,
//                 updatedAt: new Date(),
//             })
//             .where(eq(userHomework.id, expiredHomework.id));
        
//         const refreshed = await db.query.userHomework.findFirst({
//             where: eq(userHomework.id, expiredHomework.id),
//         });
        
//         return [refreshed];
//     }
    

//     console.log('🔄 Начинаем генерацию ДЗ...');
//     const startTime = Date.now();
    
//     // 1. Получаем все активные уроки
//     const weightedLessons = await getWeightedActiveLessons(userId, courseId);
    
//     if (weightedLessons.length === 0) {
//         console.log('❌ Нет активных уроков');
//         return [];
//     }
    
//     const lessonIds = weightedLessons.map(l => l.id);
    
//     // 2. Получаем все challenge для всех уроков
//     const allChallenges = await db.query.challenges.findMany({
//         where: inArray(challenges.lessonId, lessonIds),
//     });
    
//     // 3. Получаем все правильно решённые challenge пользователя
//     const solvedCorrectly = await db.query.challengeProgress.findMany({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.doneRight, true)
//         ),
//     });
//     const solvedIds = new Set(solvedCorrectly.map(s => s.challengeId));
    
//     // 4. Группируем challenge по урокам (только нерешённые)
//     const challengesByLesson = new Map<number, typeof allChallenges>();
//     for (const challenge of allChallenges) {
//         if (!solvedIds.has(challenge.id)) {
//             if (!challengesByLesson.has(challenge.lessonId)) {
//                 challengesByLesson.set(challenge.lessonId, []);
//             }
//             challengesByLesson.get(challenge.lessonId)!.push(challenge);
//         }
//     }
    
//     // 5. Выбираем challenge с учётом весов
//     const selectedChallengeIds: number[] = [];
//     const distribution: { lessonTitle: string; count: number }[] = [];
    
//     const sortedLessons = [...weightedLessons].sort((a, b) => b.weight - a.weight);
    
//     for (const lesson of sortedLessons) {
//         const lessonChallenges = challengesByLesson.get(lesson.id) || [];
//         if (lessonChallenges.length === 0) continue;
        
//         let targetCount = Math.round(DAILY_HOMEWORK_SIZE * lesson.weight);
//         targetCount = Math.min(targetCount, lessonChallenges.length);
//         targetCount = Math.max(1, targetCount);
        
//         const shuffled = [...lessonChallenges].sort(() => 0.5 - Math.random());
//         for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
//             if (!selectedChallengeIds.includes(shuffled[i].id) && selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
//                 selectedChallengeIds.push(shuffled[i].id);
//                 const existingDist = distribution.find(d => d.lessonTitle === lesson.title);
//                 if (existingDist) {
//                     existingDist.count++;
//                 } else {
//                     distribution.push({ lessonTitle: lesson.title, count: 1 });
//                 }
//             }
//         }
        
//         if (selectedChallengeIds.length >= DAILY_HOMEWORK_SIZE) break;
//     }
    
//     // Если не хватает, добираем из любых
//     if (selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
//         const allAvailable = Array.from(challengesByLesson.values()).flat();
//         const remaining = allAvailable.filter(c => !selectedChallengeIds.includes(c.id));
//         const shuffled = [...remaining].sort(() => 0.5 - Math.random());
//         const needed = DAILY_HOMEWORK_SIZE - selectedChallengeIds.length;
//         for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
//             selectedChallengeIds.push(shuffled[i].id);
//         }
//     }
    
//     if (selectedChallengeIds.length === 0) {
//         console.log('❌ Не удалось выбрать challenge');
//         return [];
//     }
    
//     // Проверка на NaN
//     if (selectedChallengeIds.some(id => isNaN(id))) {
//         console.error('❌ Обнаружен NaN в selectedChallengeIds!', selectedChallengeIds);
//         return [];
//     }
    
//     // 6. Создаём запись в userHomework
//     const assignedAt = new Date();
//     assignedAt.setHours(0, 0, 0, 0);
//     const dueDate = new Date(assignedAt);
//     dueDate.setHours(23, 59, 59, 999);
    
//     const [homework] = await db.insert(userHomework).values({
//         userId,
//         courseId,
//         challengeIds: selectedChallengeIds.join(','),
//         totalCount: selectedChallengeIds.length,
//         assignedAt: assignedAt,
//         dueDate: dueDate,
//         status: 'pending',
//         correctCount: 0,
//         wrongCount: 0,
//         type: 'daily',
//     }).returning();
    
//     // 7. Обновляем daily stats
//     await recalculateDailyStats(userId, courseId);
    
//     const duration = Date.now() - startTime;
//     console.log(`✅ ДЗ создано за ${duration}ms. Задач: ${selectedChallengeIds.length}`);
//     console.log('📚 Распределение:', distribution);
    
//     return [homework];
// }




// // app/actions/generate-homework.ts

// 'use server';

// import db from '@/db/drizzle';
// import { userHomework, challenges, challengeProgress } from '@/db/schema';
// import { getWeightedActiveLessons } from '@/lib/active-lessons';
// import { recalculateDailyStats } from './recalculate-daily-stats';
// import { auth } from '@/lib/auth';
// import { and, eq, inArray, sql, gte, lte } from 'drizzle-orm';

// const DAILY_HOMEWORK_SIZE = 2;

// // Кэш для хранения результатов генерации для текущего пользователя и курса
// const generationCache = new Map<string, { timestamp: number; homework: any }>();

// /**
//  * Генерирует домашнее задание на сегодня для указанного курса
//  * Возвращает массив с домашним заданием
//  */
// export async function generateHomework(courseId: number) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const today = new Date();
    
//     // 🔥 Нормализуем даты для правильного сравнения (без часового пояса)
//     const startOfDay = new Date(today);
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(today);
//     endOfDay.setHours(23, 59, 59, 999);
    
//     const cacheKey = `${userId}_${courseId}_${startOfDay.toISOString().split('T')[0]}`;
    
//     // Проверяем кэш для текущего дня
//     const cached = generationCache.get(cacheKey);
//     if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
//         console.log('📦 ДЗ взято из кэша');
//         return cached.homework;
//     }
    
//     // 🔥 ПРОВЕРЯЕМ СУЩЕСТВУЮЩЕЕ ДЗ ЧЕРЕЗ ДИАПАЗОН ДАТ (надёжнее)
//     const existing = await db.query.userHomework.findFirst({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.type, 'daily'),
//             gte(userHomework.assignedAt, startOfDay),
//             lte(userHomework.assignedAt, endOfDay)
//         ),
//     });
    
//     if (existing) {
//         console.log('✅ ДЗ на сегодня уже существует, ID:', existing.id);
//         const result = [existing];
//         generationCache.set(cacheKey, { timestamp: Date.now(), homework: result });
//         return result;
//     }
    
//     console.log('🔄 Начинаем генерацию ДЗ...');
//     const startTime = Date.now();
    
//     // 1. Получаем все активные уроки
//     const weightedLessons = await getWeightedActiveLessons(userId, courseId);
    
//     if (weightedLessons.length === 0) {
//         console.log('❌ Нет активных уроков');
//         return [];
//     }
    
//     const lessonIds = weightedLessons.map(l => l.id);
    
//     // 2. Получаем все challenge для всех уроков
//     const allChallenges = await db.query.challenges.findMany({
//         where: inArray(challenges.lessonId, lessonIds),
//     });
    
//     // 3. Получаем все правильно решённые challenge пользователя
//     const solvedCorrectly = await db.query.challengeProgress.findMany({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.doneRight, true)
//         ),
//     });
//     const solvedIds = new Set(solvedCorrectly.map(s => s.challengeId));
    
//     // 4. Группируем challenge по урокам
//     const challengesByLesson = new Map<number, typeof allChallenges>();
//     for (const challenge of allChallenges) {
//         if (!challengesByLesson.has(challenge.lessonId)) {
//             challengesByLesson.set(challenge.lessonId, []);
//         }
//         if (!solvedIds.has(challenge.id)) {
//             challengesByLesson.get(challenge.lessonId)!.push(challenge);
//         }
//     }
    
//     // 5. Выбираем challenge с учётом весов
//     const selectedChallengeIds: number[] = [];
//     const distribution: { lessonTitle: string; count: number }[] = [];
    
//     const sortedLessons = [...weightedLessons].sort((a, b) => b.weight - a.weight);
    
//     for (const lesson of sortedLessons) {
//         const lessonChallenges = challengesByLesson.get(lesson.id) || [];
//         if (lessonChallenges.length === 0) continue;
        
//         let targetCount = Math.round(DAILY_HOMEWORK_SIZE * lesson.weight);
//         targetCount = Math.min(targetCount, lessonChallenges.length);
//         targetCount = Math.max(1, targetCount);
        
//         const shuffled = [...lessonChallenges].sort(() => 0.5 - Math.random());
//         for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
//             if (!selectedChallengeIds.includes(shuffled[i].id) && selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
//                 selectedChallengeIds.push(shuffled[i].id);
//                 const existingDist = distribution.find(d => d.lessonTitle === lesson.title);
//                 if (existingDist) {
//                     existingDist.count++;
//                 } else {
//                     distribution.push({ lessonTitle: lesson.title, count: 1 });
//                 }
//             }
//         }
        
//         if (selectedChallengeIds.length >= DAILY_HOMEWORK_SIZE) break;
//     }
    
//     // Если не хватает, добираем из любых
//     if (selectedChallengeIds.length < DAILY_HOMEWORK_SIZE) {
//         const allAvailable = Array.from(challengesByLesson.values()).flat();
//         const remaining = allAvailable.filter(c => !selectedChallengeIds.includes(c.id));
//         const shuffled = [...remaining].sort(() => 0.5 - Math.random());
//         const needed = DAILY_HOMEWORK_SIZE - selectedChallengeIds.length;
//         for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
//             selectedChallengeIds.push(shuffled[i].id);
//         }
//     }
    
//     if (selectedChallengeIds.length === 0) {
//         console.log('❌ Не удалось выбрать challenge');
//         return [];
//     }
//     // Проверка на NaN
//     if (selectedChallengeIds.some(id => isNaN(id))) {
//         console.error('❌ Обнаружен NaN в selectedChallengeIds!', selectedChallengeIds);
//         return [];
//     }
    
//     // 6. Создаём запись в userHomework
//     const assignedAt = new Date();
//     assignedAt.setHours(0, 0, 0, 0);
//     const dueDate = new Date(assignedAt);
//     dueDate.setHours(23, 59, 59, 999);
    
//     const [homework] = await db.insert(userHomework).values({
//         userId,
//         courseId,
//         challengeIds: selectedChallengeIds.join(','),
//         totalCount: selectedChallengeIds.length,
//         assignedAt: assignedAt,
//         dueDate: dueDate,
//         status: 'pending',
//         correctCount: 0,
//         wrongCount: 0,
//         type: 'daily',
//     }).returning();
    
//     // 7. Обновляем daily stats
//     await recalculateDailyStats(userId, courseId);
    
//     const duration = Date.now() - startTime;
//     console.log(`✅ ДЗ создано за ${duration}ms. Задач: ${selectedChallengeIds.length}`);
//     console.log('📚 Распределение:', distribution);
    
//     const result = [homework];
//     generationCache.set(cacheKey, { timestamp: Date.now(), homework: result });
    
//     return result;
// }