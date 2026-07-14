// lib/active-lessons.ts

import { cache } from 'react';
import db from '@/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { units as unitsTable, challenges, challengeProgress } from '@/db/schema';

// Веса для разных приоритетов
const PRIORITY_WEIGHTS = {
    1: 0.45, // Текущий урок
    2: 0.25, // Начатый урок
    3: 0.15, // Открытый урок
    4: 0.05, // Для повторения
};

export type ActiveLesson = {
    id: number;
    title: string;
    unitId: number;
    unitTitle: string;
    priority: number;
    progress: number;
    isEnoughToUnlockNext: boolean;
    needMore: number;
    correctCount: number;
    totalCount: number;
};

export type WeightedActiveLesson = ActiveLesson & {
    weight: number;
};

/**
 * Получить все уроки, которые открыты для ученика
 */
export async function getActiveLessons(userId: string, courseId: number): Promise<ActiveLesson[]> {
    const start = Date.now();
    
    // Получаем все юниты курса с уроками
    const courseUnits = await db.query.units.findMany({
        where: eq(unitsTable.courseId, courseId),
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
            },
        },
    });
    
    if (courseUnits.length === 0) {
        return [];
    }
    
    // Получаем все challenge для всех уроков
    const allLessons = courseUnits.flatMap(u => u.lessons);
    const lessonIds = allLessons.map(l => l.id);
    
    const allChallenges = await db.query.challenges.findMany({
        where: (challenges, { inArray }) => inArray(challenges.lessonId, lessonIds),
    });
    
    // Получаем прогресс пользователя
    const userProgressList = await db.query.challengeProgress.findMany({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.completed, true)
        ),
    });
    
    const progressByChallenge = new Map();
    for (const p of userProgressList) {
        progressByChallenge.set(p.challengeId, p);
    }
    
    // Группируем challenge по урокам
    const challengesByLesson = new Map<number, typeof allChallenges>();
    for (const challenge of allChallenges) {
        if (!challengesByLesson.has(challenge.lessonId)) {
            challengesByLesson.set(challenge.lessonId, []);
        }
        challengesByLesson.get(challenge.lessonId)!.push(challenge);
    }
    
    // Определяем текущий юнит
    let currentUnitId: number | null = null;
    for (const unit of courseUnits) {
        const unitLessons = unit.lessons;
        let unlockedCount = 0;
        
        for (const lesson of unitLessons) {
            const lessonChallenges = challengesByLesson.get(lesson.id) || [];
            let correctCount = 0;
            for (const challenge of lessonChallenges) {
                const progress = progressByChallenge.get(challenge.id);
                if (progress?.doneRight) {
                    correctCount++;
                }
            }
            const needsToUnlock = Math.min(4, lessonChallenges.length);
            if (correctCount >= needsToUnlock) {
                unlockedCount++;
            }
        }
        
        const percent = unitLessons.length > 0 ? unlockedCount / unitLessons.length : 1;
        if (percent < 0.5) {
            currentUnitId = unit.id;
            break;
        }
    }
    
    if (!currentUnitId && courseUnits.length > 0) {
        currentUnitId = courseUnits[courseUnits.length - 1].id;
    }
    
    // Формируем список активных уроков
    const activeLessons: ActiveLesson[] = [];
    
    for (const unit of courseUnits) {
        for (const lesson of unit.lessons) {
            const lessonChallenges = challengesByLesson.get(lesson.id) || [];
            const totalCount = lessonChallenges.length;
            
            let correctCount = 0;
            for (const challenge of lessonChallenges) {
                const progress = progressByChallenge.get(challenge.id);
                if (progress?.doneRight) {
                    correctCount++;
                }
            }
            
            const needsToUnlock = Math.min(4, totalCount);
            const isEnoughToUnlockNext = correctCount >= needsToUnlock;
            const isMastery = correctCount >= totalCount;
            const progress = totalCount > 0 ? correctCount / totalCount : 0;
            const needMore = Math.max(0, needsToUnlock - correctCount);
            
            // Проверяем, открыт ли урок
            let isUnlocked = true;
            if (unit.id !== currentUnitId) {
                isUnlocked = false;
            } else {
                const lessonIndex = unit.lessons.findIndex(l => l.id === lesson.id);
                if (lessonIndex > 0) {
                    const prevLesson = unit.lessons[lessonIndex - 1];
                    const prevChallenges = challengesByLesson.get(prevLesson.id) || [];
                    let prevCorrect = 0;
                    for (const ch of prevChallenges) {
                        const prog = progressByChallenge.get(ch.id);
                        if (prog?.doneRight) prevCorrect++;
                    }
                    const prevNeeds = Math.min(4, prevChallenges.length);
                    isUnlocked = prevCorrect >= prevNeeds;
                }
            }
            
            if (!isUnlocked) continue;
            
            let priority = 4;
            
            if (unit.id === currentUnitId && !isEnoughToUnlockNext && !isMastery) {
                priority = 1;
            } else if (correctCount > 0 && !isEnoughToUnlockNext && !isMastery) {
                priority = 2;
            } else if (correctCount === 0 && !isEnoughToUnlockNext && !isMastery) {
                priority = 3;
            } else if (isEnoughToUnlockNext && !isMastery) {
                priority = 4;
            }
            
            activeLessons.push({
                id: lesson.id,
                title: lesson.title,
                unitId: unit.id,
                unitTitle: unit.title,
                priority,
                progress,
                isEnoughToUnlockNext,
                needMore,
                correctCount,
                totalCount,
            });
        }
    }
    
    console.log(`⏱️ getActiveLessons: ${Date.now() - start}ms, найдено уроков: ${activeLessons.length}`);
    
    return activeLessons.sort((a, b) => a.priority - b.priority);
}

/**
 * Получить уроки с весами для ДЗ
 */
export async function getWeightedActiveLessons(userId: string, courseId: number): Promise<WeightedActiveLesson[]> {
    const activeLessons = await getActiveLessons(userId, courseId);
    
    if (activeLessons.length === 0) {
        return [];
    }
    
    let totalWeight = 0;
    const weightedLessons: WeightedActiveLesson[] = activeLessons.map((lesson) => {
        let weight = PRIORITY_WEIGHTS[lesson.priority as keyof typeof PRIORITY_WEIGHTS] || 0.05;
        
        if (lesson.needMore > 0 && lesson.needMore <= 2) {
            weight += 0.1;
        }
        
        if (lesson.progress > 0.5 && lesson.progress < 0.9) {
            weight += 0.05;
        }
        
        totalWeight += weight;
        
        return {
            ...lesson,
            weight,
        };
    });
    
    if (totalWeight > 0) {
        for (const lesson of weightedLessons) {
            lesson.weight = lesson.weight / totalWeight;
        }
    }
    
    return weightedLessons.sort((a, b) => b.weight - a.weight);
}












// // lib/active-lessons.ts

// import { cache } from 'react';
// import db from '@/db/drizzle';
// import { getLessonProgress, getUnitProgress, isLessonUnlocked } from './lesson-access';
// import { eq, and } from 'drizzle-orm';
// import { units as unitsTable, lessons as lessonsTable, challenges, challengeProgress } from '@/db/schema';

// // Веса для разных приоритетов
// const PRIORITY_WEIGHTS = {
//     1: 0.45, // Текущий урок
//     2: 0.25, // Начатый урок
//     3: 0.15, // Открытый урок
//     4: 0.05, // Для повторения
// };

// export type ActiveLesson = {
//     id: number;
//     title: string;
//     unitId: number;
//     unitTitle: string;
//     priority: number;
//     progress: number;
//     isEnoughToUnlockNext: boolean;
//     needMore: number;
//     correctCount: number;
//     totalCount: number;
// };

// export type WeightedActiveLesson = ActiveLesson & {
//     weight: number;
// };

// /**
//  * Получить все уроки, которые открыты для ученика
//  */
// export async function getActiveLessons(userId: string, courseId: number): Promise<ActiveLesson[]> {
//     const start = Date.now();
    
//     // Получаем все юниты курса с уроками и challenge
//     const courseUnits = await db.query.units.findMany({
//         where: eq(unitsTable.courseId, courseId),
//         orderBy: (units, { asc }) => [asc(units.order)],
//         with: {
//             lessons: {
//                 orderBy: (lessons, { asc }) => [asc(lessons.order)],
//             },
//         },
//     });
    
//     if (courseUnits.length === 0) {
//         return [];
//     }
    
//     // Получаем все challenge для всех уроков
//     const allLessons = courseUnits.flatMap(u => u.lessons);
//     const lessonIds = allLessons.map(l => l.id);
    
//     const allChallenges = await db.query.challenges.findMany({
//         where: (challenges, { inArray }) => inArray(challenges.lessonId, lessonIds),
//     });
    
//     // Получаем прогресс пользователя по всем challenge
//     const userProgressList = await db.query.challengeProgress.findMany({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.completed, true)
//         ),
//     });
    
//     // Создаём Map для быстрого доступа к прогрессу
//     const progressByChallenge = new Map<number, typeof userProgressList[0]>();
//     for (const p of userProgressList) {
//         progressByChallenge.set(p.challengeId, p);
//     }
    
//     // Группируем challenge по урокам
//     const challengesByLesson = new Map<number, typeof allChallenges>();
//     for (const challenge of allChallenges) {
//         if (!challengesByLesson.has(challenge.lessonId)) {
//             challengesByLesson.set(challenge.lessonId, []);
//         }
//         challengesByLesson.get(challenge.lessonId)!.push(challenge);
//     }
    
//     // Определяем текущий юнит (первый, где не выполнено 50% уроков)
//     let currentUnitId: number | null = null;
//     for (const unit of courseUnits) {
//         const unitLessons = unit.lessons;
//         let unlockedCount = 0;
        
//         for (const lesson of unitLessons) {
//             const lessonChallenges = challengesByLesson.get(lesson.id) || [];
//             let correctCount = 0;
//             for (const challenge of lessonChallenges) {
//                 const progress = progressByChallenge.get(challenge.id);
//                 if (progress?.doneRight) {
//                     correctCount++;
//                 }
//             }
//             const needsToUnlock = Math.min(4, lessonChallenges.length);
//             if (correctCount >= needsToUnlock) {
//                 unlockedCount++;
//             }
//         }
        
//         const percent = unitLessons.length > 0 ? unlockedCount / unitLessons.length : 1;
//         if (percent < 0.5) {
//             currentUnitId = unit.id;
//             break;
//         }
//     }
    
//     if (!currentUnitId && courseUnits.length > 0) {
//         currentUnitId = courseUnits[courseUnits.length - 1].id;
//     }
    
//     // Формируем список активных уроков
//     const activeLessons: ActiveLesson[] = [];
    
//     for (const unit of courseUnits) {
//         for (const lesson of unit.lessons) {
//             const lessonChallenges = challengesByLesson.get(lesson.id) || [];
//             const totalCount = lessonChallenges.length;
            
//             let correctCount = 0;
//             for (const challenge of lessonChallenges) {
//                 const progress = progressByChallenge.get(challenge.id);
//                 if (progress?.doneRight) {
//                     correctCount++;
//                 }
//             }
            
//             const needsToUnlock = Math.min(4, totalCount);
//             const isEnoughToUnlockNext = correctCount >= needsToUnlock;
//             const isMastery = correctCount >= totalCount;
//             const progress = totalCount > 0 ? correctCount / totalCount : 0;
//             const needMore = Math.max(0, needsToUnlock - correctCount);
            
//             // Проверяем, открыт ли урок
//             let isUnlocked = true;
//             if (unit.id !== currentUnitId) {
//                 // Уроки не в текущем юните считаем открытыми только если юнит уже пройден
//                 isUnlocked = false;
//             } else {
//                 // В текущем юните проверяем последовательность
//                 const lessonIndex = unit.lessons.findIndex(l => l.id === lesson.id);
//                 if (lessonIndex > 0) {
//                     const prevLesson = unit.lessons[lessonIndex - 1];
//                     const prevChallenges = challengesByLesson.get(prevLesson.id) || [];
//                     let prevCorrect = 0;
//                     for (const ch of prevChallenges) {
//                         const prog = progressByChallenge.get(ch.id);
//                         if (prog?.doneRight) prevCorrect++;
//                     }
//                     const prevNeeds = Math.min(4, prevChallenges.length);
//                     isUnlocked = prevCorrect >= prevNeeds;
//                 }
//             }
            
//             if (!isUnlocked) continue;
            
//             let priority = 4;
            
//             // Приоритет 1: текущий урок (первый незавершённый в текущем юните)
//             if (unit.id === currentUnitId && !isEnoughToUnlockNext && !isMastery) {
//                 priority = 1;
//             }
//             // Приоритет 2: начатые, но не завершённые
//             else if (correctCount > 0 && !isEnoughToUnlockNext && !isMastery) {
//                 priority = 2;
//             }
//             // Приоритет 3: открытые, но не начатые
//             else if (correctCount === 0 && !isEnoughToUnlockNext && !isMastery) {
//                 priority = 3;
//             }
//             // Приоритет 4: для повторения
//             else if (isEnoughToUnlockNext && !isMastery) {
//                 priority = 4;
//             }
            
//             activeLessons.push({
//                 id: lesson.id,
//                 title: lesson.title,
//                 unitId: unit.id,
//                 unitTitle: unit.title,
//                 priority,
//                 progress,
//                 isEnoughToUnlockNext,
//                 needMore,
//                 correctCount,
//                 totalCount,
//             });
//         }
//     }
    
//     console.log(`⏱️ getActiveLessons: ${Date.now() - start}ms, найдено уроков: ${activeLessons.length}`);
    
//     return activeLessons.sort((a, b) => a.priority - b.priority);
// }

// /**
//  * Получить уроки с весами для ДЗ
//  */
// export async function getWeightedActiveLessons(userId: string, courseId: number): Promise<WeightedActiveLesson[]> {
//     const start = Date.now();
    
//     const activeLessons = await getActiveLessons(userId, courseId);
    
//     if (activeLessons.length === 0) {
//         return [];
//     }
    
//     // Рассчитываем веса для каждого урока
//     let totalWeight = 0;
//     const weightedLessons: WeightedActiveLesson[] = activeLessons.map((lesson) => {
//         let weight = PRIORITY_WEIGHTS[lesson.priority as keyof typeof PRIORITY_WEIGHTS] || 0.05;
        
//         // Дополнительный вес для уроков, которые близки к открытию следующего (осталось 1-2 задачи)
//         if (lesson.needMore > 0 && lesson.needMore <= 2) {
//             weight += 0.1;
//         }
        
//         // Дополнительный вес для уроков с высоким прогрессом (50-90%)
//         if (lesson.progress > 0.5 && lesson.progress < 0.9) {
//             weight += 0.05;
//         }
        
//         totalWeight += weight;
        
//         return {
//             ...lesson,
//             weight,
//         };
//     });
    
//     // Нормализуем веса (сумма должна быть 1)
//     if (totalWeight > 0) {
//         for (const lesson of weightedLessons) {
//             lesson.weight = lesson.weight / totalWeight;
//         }
//     }
    
//     console.log(`⏱️ getWeightedActiveLessons: ${Date.now() - start}ms`);
    
//     // Сортируем по весу (от большего к меньшему)
//     return weightedLessons.sort((a, b) => b.weight - a.weight);
// }

// /**
//  * Выбрать N случайных уроков на основе весов
//  */
// export async function selectRandomLessonsByWeight(
//     userId: string, 
//     courseId: number, 
//     count: number
// ): Promise<WeightedActiveLesson[]> {
//     const weightedLessons = await getWeightedActiveLessons(userId, courseId);
    
//     if (weightedLessons.length === 0) {
//         return [];
//     }
    
//     const selected: WeightedActiveLesson[] = [];
//     const remaining = [...weightedLessons];
    
//     for (let i = 0; i < Math.min(count, weightedLessons.length); i++) {
//         const random = Math.random();
//         let cumulative = 0;
//         let selectedIndex = -1;
        
//         for (let j = 0; j < remaining.length; j++) {
//             cumulative += remaining[j].weight;
//             if (random <= cumulative) {
//                 selectedIndex = j;
//                 break;
//             }
//         }
        
//         if (selectedIndex >= 0) {
//             selected.push(remaining[selectedIndex]);
//             remaining.splice(selectedIndex, 1);
            
//             const remainingTotalWeight = remaining.reduce((sum, l) => sum + l.weight, 0);
//             if (remainingTotalWeight > 0) {
//                 for (const lesson of remaining) {
//                     lesson.weight = lesson.weight / remainingTotalWeight;
//                 }
//             }
//         }
//     }
    
//     return selected;
// }







// // lib/active-lessons.ts

// import db from '@/db/drizzle';
// import { getLessonProgress, getUnitProgress, isLessonUnlocked } from './lesson-access';
// import { eq } from 'drizzle-orm';
// import { units as unitsTable } from '@/db/schema';

// // Веса для разных приоритетов
// const PRIORITY_WEIGHTS = {
//     1: 0.45, // Текущий урок
//     2: 0.25, // Начатый урок
//     3: 0.15, // Открытый урок
//     4: 0.05, // Для повторения
// };

// export type ActiveLesson = {
//     id: number;
//     title: string;
//     unitId: number;
//     unitTitle: string;
//     priority: number;
//     progress: number;
//     isEnoughToUnlockNext: boolean;
//     needMore: number;
// };

// export type WeightedActiveLesson = ActiveLesson & {
//     weight: number;
// };

// /**
//  * Получить все уроки, которые открыты для ученика
//  */
// export async function getActiveLessons(userId: string, courseId: number): Promise<ActiveLesson[]> {
//     const courseUnits = await db.query.units.findMany({
//         where: eq(unitsTable.courseId, courseId),
//         orderBy: (units, { asc }) => [asc(units.order)],
//         with: {
//             lessons: {
//                 orderBy: (lessons, { asc }) => [asc(lessons.order)],
//             },
//         },
//     });
    
//     const activeLessons: ActiveLesson[] = [];
//     let currentUnitId: number | null = null;
    
//     // Ищем текущий юнит (первый, где не выполнено 50% уроков)
//     for (const unit of courseUnits) {
//         const unitProgress = await getUnitProgress(userId, unit.id);
//         if (!unitProgress.isEnoughToUnlockNextUnit) {
//             currentUnitId = unit.id;
//             break;
//         }
//     }
    
//     // Если все юниты пройдены, берем последний
//     if (!currentUnitId && courseUnits.length > 0) {
//         currentUnitId = courseUnits[courseUnits.length - 1].id;
//     }
    
//     for (const unit of courseUnits) {
//         for (const lesson of unit.lessons) {
//             const progress = await getLessonProgress(userId, lesson.id);
//             const isUnlocked = await isLessonUnlocked(userId, lesson.id);
            
//             if (!isUnlocked) continue;
            
//             let priority = 4;
            
//             // Приоритет 1: текущий урок (первый незавершенный в текущем юните)
//             if (unit.id === currentUnitId && !progress.isEnoughToUnlockNext) {
//                 priority = 1;
//             }
//             // Приоритет 2: начатые, но не завершенные (есть прогресс, но не хватает до 4 задач)
//             else if (progress.correct > 0 && !progress.isEnoughToUnlockNext) {
//                 priority = 2;
//             }
//             // Приоритет 3: открытые, но не начатые
//             else if (progress.correct === 0 && !progress.isEnoughToUnlockNext) {
//                 priority = 3;
//             }
//             // Приоритет 4: для повторения (уже открыт следующий урок, но можно повторить)
//             else if (progress.isEnoughToUnlockNext && !progress.isMastery) {
//                 priority = 4;
//             }
            
//             activeLessons.push({
//                 id: lesson.id,
//                 title: lesson.title,
//                 unitId: unit.id,
//                 unitTitle: unit.title,
//                 priority,
//                 progress: progress.correct / Math.max(progress.total, 1),
//                 isEnoughToUnlockNext: progress.isEnoughToUnlockNext,
//                 needMore: progress.needMore,
//             });
//         }
//     }
    
//     // Сортируем по приоритету (от самого высокого к низкому)
//     return activeLessons.sort((a, b) => a.priority - b.priority);
// }

// /**
//  * Получить уроки с весами для ДЗ
//  */
// export async function getWeightedActiveLessons(userId: string, courseId: number): Promise<WeightedActiveLesson[]> {
//     const activeLessons = await getActiveLessons(userId, courseId);
    
//     if (activeLessons.length === 0) {
//         return [];
//     }
    
//     // Рассчитываем базовые веса для каждого урока
//     let totalWeight = 0;
//     const weightedLessons: WeightedActiveLesson[] = activeLessons.map((lesson) => {
//         // Базовый вес по приоритету
//         let weight = PRIORITY_WEIGHTS[lesson.priority as keyof typeof PRIORITY_WEIGHTS] || 0.05;
        
//         // Дополнительный вес для уроков, которые близки к открытию следующего (осталось 1-2 задачи)
//         if (lesson.needMore > 0 && lesson.needMore <= 2) {
//             weight += 0.1;
//         }
        
//         // Дополнительный вес для уроков с высоким прогрессом (50-90%)
//         if (lesson.progress > 0.5 && lesson.progress < 0.9) {
//             weight += 0.05;
//         }
        
//         totalWeight += weight;
        
//         return {
//             ...lesson,
//             weight,
//         };
//     });
    
//     // Нормализуем веса (сумма должна быть 1)
//     if (totalWeight > 0) {
//         for (const lesson of weightedLessons) {
//             lesson.weight = lesson.weight / totalWeight;
//         }
//     }
    
//     // Сортируем по весу (от большего к меньшему)
//     return weightedLessons.sort((a, b) => b.weight - a.weight);
// }

// /**
//  * Выбрать N случайных уроков на основе весов
//  */
// export async function selectRandomLessonsByWeight(
//     userId: string, 
//     courseId: number, 
//     count: number
// ): Promise<WeightedActiveLesson[]> {
//     const weightedLessons = await getWeightedActiveLessons(userId, courseId);
    
//     if (weightedLessons.length === 0) {
//         return [];
//     }
    
//     const selected: WeightedActiveLesson[] = [];
//     const remaining = [...weightedLessons];
    
//     for (let i = 0; i < Math.min(count, weightedLessons.length); i++) {
//         // Вычисляем случайное число от 0 до 1
//         const random = Math.random();
//         let cumulative = 0;
//         let selectedIndex = -1;
        
//         // Выбираем урок на основе весов
//         for (let j = 0; j < remaining.length; j++) {
//             cumulative += remaining[j].weight;
//             if (random <= cumulative) {
//                 selectedIndex = j;
//                 break;
//             }
//         }
        
//         if (selectedIndex >= 0) {
//             selected.push(remaining[selectedIndex]);
//             remaining.splice(selectedIndex, 1);
            
//             // Пересчитываем веса для оставшихся уроков
//             const remainingTotalWeight = remaining.reduce((sum, l) => sum + l.weight, 0);
//             if (remainingTotalWeight > 0) {
//                 for (const lesson of remaining) {
//                     lesson.weight = lesson.weight / remainingTotalWeight;
//                 }
//             }
//         }
//     }
    
//     return selected;
// }