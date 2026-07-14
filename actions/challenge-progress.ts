// app/actions/challenge-progress.ts
'use server';

import db from '@/db/drizzle';
import { 
    challengeProgress, 
    userDailyStats, 
    userHomework, 
    userProgress, 
    userCourseProgress,
    challenges,
    lessons,
    units
} from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface UpdateChallengeProgressProps {
    challengeId: number;
    doneRight: boolean;
    isPractice?: boolean;
}

interface ChallengeProgressResponse {
    success: boolean;
    message?: string;
    pointsEarned?: number;
    gemsEarned?: number;
    accuracy?: number;
    hwDone?: number;
    hwCompleted?: boolean;
    redirectTo?: string;
    isHomeworkCompleted?: boolean;
}

export async function updateChallengeProgress({
    challengeId,
    doneRight,
    isPractice = false,
}: UpdateChallengeProgressProps): Promise<ChallengeProgressResponse> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Не авторизован');
    
    const userId = session.user.id;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 1. Получаем challenge
    const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId),
    });
    
    if (!challenge) throw new Error('Challenge не найден');
    
    // 2. Получаем lesson
    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, challenge.lessonId),
    });
    
    if (!lesson) throw new Error('Lesson не найден');
    
    // 3. Получаем unit
    const unit = await db.query.units.findFirst({
        where: eq(units.id, lesson.unitId),
    });
    
    if (!unit) throw new Error('Unit не найден');
    
    const courseId = unit.courseId;
    
    // 4. Проверяем сердца
    const userProgressData = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
    });
    
    if ((userProgressData?.hearts ?? 0) <= 0 && !isPractice && !doneRight) {
        return {
            success: false,
            message: 'hearts',
        };
    }
    
    // 5. Проверяем, не решал ли уже пользователь этот challenge
    const existingProgress = await db.query.challengeProgress.findFirst({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
        ),
    });
    
    // Если уже решал и правильно - не даём второй раз получить очки
    if (existingProgress?.completed && existingProgress.doneRight) {
        return { success: false, message: 'Challenge уже выполнен' };
    }
    
    // 6. Получаем сегодняшнюю статистику
    let todayStats = await db.query.userDailyStats.findFirst({
        where: and(
            eq(userDailyStats.userId, userId),
            eq(userDailyStats.courseId, courseId),
            eq(userDailyStats.date, today)
        ),
    });
    
    // 7. Проверяем, является ли challenge частью ДЗ
    const allPendingHomework = await db.query.userHomework.findMany({
        where: and(
            eq(userHomework.userId, userId),
            eq(userHomework.courseId, courseId),
            eq(userHomework.status, 'pending')
        ),
    });
    
    const targetHomework = allPendingHomework.find(hw => 
        hw.challengeIds?.split(',').map(Number).includes(challengeId)
    );
    
    // 8. Обновляем challengeProgress
    if (existingProgress) {
        await db.update(challengeProgress)
            .set({
                completed: true,
                doneRight: doneRight,
                dateDone: now,
            })
            .where(eq(challengeProgress.id, existingProgress.id));
    } else {
        await db.insert(challengeProgress).values({
            userId,
            challengeId,
            completed: true,
            doneRight: doneRight,
            dateDone: now,
        });
    }
    
    // 9. Подготавливаем обновления для userDailyStats
    const currentChallengesDone = todayStats?.challengesDone ?? 0;
    const currentChallengesRight = todayStats?.challengesRight ?? 0;
    const currentPointsEarned = todayStats?.pointsEarned ?? 0;
    const currentGemsEarned = todayStats?.gemsEarned ?? 0;
    const currentGemsSpent = todayStats?.gemsSpent ?? 0;
    
    const newChallengesDone = currentChallengesDone + 1;
    const newChallengesRight = currentChallengesRight + (doneRight ? 1 : 0);
    const newAccuracy = newChallengesDone > 0 ? newChallengesRight / newChallengesDone : 0;
    
    // 10. Очки и гемы
    let pointsEarned = 0;
    let gemsEarned = 0;
    
    if (!isPractice && doneRight && !existingProgress?.completed) {
        pointsEarned = challenge.points;
        gemsEarned = Math.floor(challenge.points / 10);
        
        await db.update(userProgress)
            .set({
                points: sql`${userProgress.points} + ${pointsEarned}`,
                gems: sql`${userProgress.gems} + ${gemsEarned}`,
            })
            .where(eq(userProgress.userId, userId));
        
        const courseProgress = await db.query.userCourseProgress.findFirst({
            where: and(
                eq(userCourseProgress.userId, userId),
                eq(userCourseProgress.courseId, courseId)
            ),
        });
        
        if (courseProgress) {
            await db.update(userCourseProgress)
                .set({
                    points: sql`${userCourseProgress.points} + ${pointsEarned}`,
                    gems: sql`${userCourseProgress.gems} + ${gemsEarned}`,
                    updatedAt: now,
                })
                .where(eq(userCourseProgress.id, courseProgress.id));
        }
    }
    
    // 11. HW статистика
    let hwDone = todayStats?.hwDone ?? 0;
    let hwAssigned = todayStats?.hwAssigned ?? 0;
    let hwCompleted = todayStats?.hwCompleted ?? false;
    let isHomeworkCompleted = false;
    
    if (targetHomework && doneRight && !isPractice) {
        const newCorrectCount = (targetHomework.correctCount ?? 0) + 1;
        const isCompleted = newCorrectCount >= (targetHomework.totalCount ?? 0);
        isHomeworkCompleted = isCompleted;
        
        await db.update(userHomework)
            .set({
                correctCount: newCorrectCount,
                status: isCompleted ? 'completed' : 'pending',
                completedAt: isCompleted ? now : null,
                updatedAt: now,
            })
            .where(eq(userHomework.id, targetHomework.id));
        
        // Получаем все ДЗ за сегодня
        const allTodayHomework = await db.query.userHomework.findMany({
            where: and(
                eq(userHomework.userId, userId),
                eq(userHomework.courseId, courseId),
                eq(userHomework.dueDate, today)
            ),
        });
        
        hwAssigned = allTodayHomework.reduce((sum, h) => sum + (h.totalCount ?? 0), 0);
        hwDone = allTodayHomework.reduce((sum, h) => sum + (h.correctCount ?? 0), 0);
        hwCompleted = hwDone >= hwAssigned && hwAssigned > 0;
    }
    
    // 12. Сохраняем userDailyStats
    if (todayStats) {
        await db.update(userDailyStats)
            .set({
                challengesDone: newChallengesDone,
                challengesRight: newChallengesRight,
                challengesWrong: (todayStats.challengesWrong ?? 0) + (doneRight ? 0 : 1),
                accuracy: newAccuracy,
                pointsEarned: currentPointsEarned + pointsEarned,
                gemsEarned: currentGemsEarned + gemsEarned,
                gemsSpent: currentGemsSpent,
                hwAssigned: hwAssigned,
                hwDone: hwDone,
                hwCompleted: hwCompleted,
                lastActivityAt: now,
                updatedAt: now,
            })
            .where(eq(userDailyStats.id, todayStats.id));
    } else {
        await db.insert(userDailyStats).values({
            userId,
            courseId,
            date: today,
            challengesDone: newChallengesDone,
            challengesRight: newChallengesRight,
            challengesWrong: doneRight ? 0 : 1,
            accuracy: newAccuracy,
            pointsEarned: pointsEarned,
            gemsEarned: gemsEarned,
            gemsSpent: 0,
            hwAssigned: hwAssigned,
            hwDone: hwDone,
            hwCompleted: hwCompleted,
            lastActivityAt: now,
            createdAt: now,
            updatedAt: now,
        });
    }
    
    // 13. Обновляем сердца при неправильном ответе
    if (!isPractice && !doneRight && !existingProgress?.completed) {
        const newHearts = Math.max((userProgressData?.hearts ?? 0) - 1, 0);
        await db.update(userProgress)
            .set({ hearts: newHearts })
            .where(eq(userProgress.userId, userId));
    }
    
    revalidatePath('/learn');
    revalidatePath(`/lesson/${challenge.lessonId}`);
    
    return {
        success: true,
        pointsEarned,
        gemsEarned,
        accuracy: newAccuracy,
        hwDone: hwDone,
        hwCompleted: isHomeworkCompleted,
    };
}

// Алиас для обратной совместимости
export const upsertChallengeProgress = updateChallengeProgress;










// // app/actions/challenge-progress.ts
// 'use server';

// import db from '@/db/drizzle';
// import { 
//     challengeProgress, 
//     userDailyStats, 
//     userHomework, 
//     userProgress, 
//     userCourseProgress,
//     challenges,
//     lessons,
//     units
// } from '@/db/schema';
// import { and, eq, sql } from 'drizzle-orm';
// import { auth } from '@/lib/auth';
// import { revalidatePath } from 'next/cache';


// // Добавляем тип возвращаемого значения
// interface ChallengeProgressResponse {
//     success: boolean;
//     error?: 'hearts' | 'unknown';
//     message?: string;
//     pointsEarned?: number;
//     gemsEarned?: number;
//     accuracy?: number;
//     hwDone?: number;
//     hwCompleted?: boolean;
//     redirectTo?: string;
//     isHomeworkCompleted?: boolean;
// }


// interface UpdateChallengeProgressProps {
//     challengeId: number;
//     doneRight: boolean;
//     isPractice?: boolean;
// }

// export async function updateChallengeProgress({
//     challengeId,
//     doneRight,
//     isPractice = false,
// }: UpdateChallengeProgressProps) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const now = new Date();
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     console.log('🔍 Начинаем updateChallengeProgress', { userId, challengeId, doneRight, isPractice });
    
//     // 1. Получаем challenge, lesson, unit
//     const challenge = await db.query.challenges.findFirst({
//         where: eq(challenges.id, challengeId),
//     });
    
//     if (!challenge) throw new Error('Challenge не найден');
    
//     const lesson = await db.query.lessons.findFirst({
//         where: eq(lessons.id, challenge.lessonId),
//     });
    
//     if (!lesson) throw new Error('Lesson не найден');
    
//     const unit = await db.query.units.findFirst({
//         where: eq(units.id, lesson.unitId),
//     });
    
//     if (!unit) throw new Error('Unit не найден');
    
//     const courseId = unit.courseId;
//     console.log('📚 courseId:', courseId);
    
//     // 2. Проверяем существующий прогресс
//     const existingProgress = await db.query.challengeProgress.findFirst({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.challengeId, challengeId)
//         ),
//     });
    
//     if (existingProgress?.completed && existingProgress.doneRight) {
//         console.log('⚠️ Challenge уже выполнен');
//         return { success: false, message: 'Challenge уже выполнен' };
//     }
    
//     // 3. Получаем сегодняшнюю статистику
//     let todayStats = await db.query.userDailyStats.findFirst({
//         where: and(
//             eq(userDailyStats.userId, userId),
//             eq(userDailyStats.courseId, courseId),
//             eq(userDailyStats.date, today)
//         ),
//     });
    
//     console.log('📊 todayStats:', todayStats ? 'найдены' : 'не найдены');
    
//     // 4. Проверяем HW
//     const allPendingHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.status, 'pending')
//         ),
//     });
    
//     const targetHomework = allPendingHomework.find(hw => 
//         hw.challengeIds?.split(',').map(Number).includes(challengeId)
//     );
    
//     console.log('📝 targetHomework:', targetHomework ? `найден (ID: ${targetHomework.id})` : 'не найден');
    
//     // 5. Обновляем challengeProgress
//     if (existingProgress) {
//         await db.update(challengeProgress)
//             .set({
//                 completed: true,
//                 doneRight: doneRight,
//                 dateDone: now,
//             })
//             .where(eq(challengeProgress.id, existingProgress.id));
//     } else {
//         await db.insert(challengeProgress).values({
//             userId,
//             challengeId,
//             completed: true,
//             doneRight: doneRight,
//             dateDone: now,
//         });
//     }
    
//     // 6. Безопасно получаем текущие значения (всегда числа)
//     const currentChallengesDone = todayStats?.challengesDone ?? 0;
//     const currentChallengesRight = todayStats?.challengesRight ?? 0;
//     const currentPointsEarned = todayStats?.pointsEarned ?? 0;
//     const currentGemsEarned = todayStats?.gemsEarned ?? 0;
//     const currentGemsSpent = todayStats?.gemsSpent ?? 0;
    
//     const newChallengesDone = currentChallengesDone + 1;
//     const newChallengesRight = currentChallengesRight + (doneRight ? 1 : 0);
//     const newAccuracy = newChallengesDone > 0 ? newChallengesRight / newChallengesDone : 0;
    
//     // 7. Очки и гемы
//     let pointsEarned = 0;
//     let gemsEarned = 0;
    
//     if (!isPractice && doneRight && !existingProgress?.completed) {
//         pointsEarned = challenge.points;
//         gemsEarned = Math.floor(challenge.points / 10);
        
//         await db.update(userProgress)
//             .set({
//                 points: sql`${userProgress.points} + ${pointsEarned}`,
//                 gems: sql`${userProgress.gems} + ${gemsEarned}`,
//             })
//             .where(eq(userProgress.userId, userId));
        
//         const courseProgress = await db.query.userCourseProgress.findFirst({
//             where: and(
//                 eq(userCourseProgress.userId, userId),
//                 eq(userCourseProgress.courseId, courseId)
//             ),
//         });
        
//         if (courseProgress) {
//             await db.update(userCourseProgress)
//                 .set({
//                     points: sql`${userCourseProgress.points} + ${pointsEarned}`,
//                     gems: sql`${userCourseProgress.gems} + ${gemsEarned}`,
//                     updatedAt: now,
//                 })
//                 .where(eq(userCourseProgress.id, courseProgress.id));
//         }
//     }
    
//     // 8. HW статистика
//     let hwDone = todayStats?.hwDone ?? 0;
//     let hwAssigned = todayStats?.hwAssigned ?? 0;
//     let hwCompleted = todayStats?.hwCompleted ?? false;
    
//     if (targetHomework && doneRight && !isPractice) {
//         const newCorrectCount = (targetHomework.correctCount ?? 0) + 1;
//         const isCompleted = newCorrectCount >= (targetHomework.totalCount ?? 0);
        
//         await db.update(userHomework)
//             .set({
//                 correctCount: newCorrectCount,
//                 status: isCompleted ? 'completed' : 'pending',
//                 completedAt: isCompleted ? now : null,
//                 updatedAt: now,
//             })
//             .where(eq(userHomework.id, targetHomework.id));
        
//         // Получаем все ДЗ за сегодня
//         const allTodayHomework = await db.query.userHomework.findMany({
//             where: and(
//                 eq(userHomework.userId, userId),
//                 eq(userHomework.courseId, courseId),
//                 eq(userHomework.dueDate, today)
//             ),
//         });
        
//         hwAssigned = allTodayHomework.reduce((sum, h) => sum + (h.totalCount ?? 0), 0);
//         hwDone = allTodayHomework.reduce((sum, h) => sum + (h.correctCount ?? 0), 0);
//         hwCompleted = hwDone >= hwAssigned && hwAssigned > 0;
//     }
    
//     // 9. Создаём объект для вставки с правильными типами
//     const statsValues = {
//         userId: userId,
//         courseId: courseId,
//         date: today,
//         challengesDone: newChallengesDone,
//         challengesRight: newChallengesRight,
//         challengesWrong: (todayStats?.challengesWrong ?? 0) + (doneRight ? 0 : 1),
//         accuracy: newAccuracy,
//         pointsEarned: (todayStats?.pointsEarned ?? 0) + pointsEarned,
//         gemsEarned: (todayStats?.gemsEarned ?? 0) + gemsEarned,
//         gemsSpent: todayStats?.gemsSpent ?? 0,
//         hwAssigned: hwAssigned,
//         hwDone: hwDone,
//         hwCompleted: hwCompleted,
//         lastActivityAt: now,
//         updatedAt: now,
//     };
    
//     // 🔥 10. Сохраняем - исправленная версия
//     if (todayStats) {
//         await db
//             .update(userDailyStats)
//             .set({
//                 challengesDone: statsValues.challengesDone,
//                 challengesRight: statsValues.challengesRight,
//                 challengesWrong: statsValues.challengesWrong,
//                 accuracy: statsValues.accuracy,
//                 pointsEarned: statsValues.pointsEarned,
//                 gemsEarned: statsValues.gemsEarned,
//                 gemsSpent: statsValues.gemsSpent,
//                 hwAssigned: statsValues.hwAssigned,
//                 hwDone: statsValues.hwDone,
//                 hwCompleted: statsValues.hwCompleted,
//                 lastActivityAt: statsValues.lastActivityAt,
//                 updatedAt: statsValues.updatedAt,
//             })
//             .where(eq(userDailyStats.id, todayStats.id));
//     } else {
//         await db.insert(userDailyStats).values({
//             userId: statsValues.userId,
//             courseId: statsValues.courseId,
//             date: statsValues.date,
//             challengesDone: statsValues.challengesDone,
//             challengesRight: statsValues.challengesRight,
//             challengesWrong: statsValues.challengesWrong,
//             accuracy: statsValues.accuracy,
//             pointsEarned: statsValues.pointsEarned,
//             gemsEarned: statsValues.gemsEarned,
//             gemsSpent: statsValues.gemsSpent,
//             hwAssigned: statsValues.hwAssigned,
//             hwDone: statsValues.hwDone,
//             hwCompleted: statsValues.hwCompleted,
//             lastActivityAt: statsValues.lastActivityAt,
//             createdAt: now,
//             updatedAt: statsValues.updatedAt,
//         });
//     }
    
//     console.log('✅ updateChallengeProgress завершён успешно');
    
//     revalidatePath('/learn');
//     revalidatePath(`/lesson/${challenge.lessonId}`);
    
//     return {
//         success: true,
//         pointsEarned,
//         gemsEarned,
//         accuracy: newAccuracy,
//         hwDone: hwDone,
//         hwCompleted: hwCompleted,
//     };
// }

// export const upsertChallengeProgress = updateChallengeProgress;







// // app/actions/challenge-progress.ts
// 'use server';

// import db from '@/db/drizzle';
// import { 
//     challengeProgress, 
//     userDailyStats, 
//     userHomework, 
//     userProgress, 
//     userCourseProgress,
//     challenges,
//     lessons,
//     units
// } from '@/db/schema';
// import { and, eq, sql } from 'drizzle-orm';
// import { auth } from '@/lib/auth';
// import { revalidatePath } from 'next/cache';

// interface UpdateChallengeProgressProps {
//     challengeId: number;
//     doneRight: boolean;
//     isPractice?: boolean;
// }

// export async function updateChallengeProgress({
//     challengeId,
//     doneRight,
//     isPractice = false,
// }: UpdateChallengeProgressProps) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const now = new Date();
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     // 1. Получаем challenge, lesson, unit
//     const challenge = await db.query.challenges.findFirst({
//         where: eq(challenges.id, challengeId),
//     });
    
//     if (!challenge) throw new Error('Challenge не найден');
    
//     const lesson = await db.query.lessons.findFirst({
//         where: eq(lessons.id, challenge.lessonId),
//     });
    
//     if (!lesson) throw new Error('Lesson не найден');
    
//     const unit = await db.query.units.findFirst({
//         where: eq(units.id, lesson.unitId),
//     });
    
//     if (!unit) throw new Error('Unit не найден');
    
//     const courseId = unit.courseId;
    
//     // 2. Проверяем, не решал ли уже пользователь этот challenge
//     const existingProgress = await db.query.challengeProgress.findFirst({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.challengeId, challengeId)
//         ),
//     });
    
//     // Если уже решал и правильно - не даём второй раз получить очки
//     if (existingProgress?.completed && existingProgress.doneRight) {
//         return { success: false, message: 'Challenge уже выполнен' };
//     }
    
//     // 3. Получаем сегодняшнюю статистику
//     let todayStats = await db.query.userDailyStats.findFirst({
//         where: and(
//             eq(userDailyStats.userId, userId),
//             eq(userDailyStats.courseId, courseId),
//             eq(userDailyStats.date, today)
//         ),
//     });
    
//     // 4. Проверяем, является ли challenge частью ДЗ
//     const allPendingHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.status, 'pending')
//         ),
//     });
    
//     const targetHomework = allPendingHomework.find(hw => 
//         hw.challengeIds?.split(',').map(Number).includes(challengeId)
//     );
    
//     // 5. Обновляем challengeProgress
//     if (existingProgress) {
//         await db.update(challengeProgress)
//             .set({
//                 completed: true,
//                 doneRight: doneRight,
//                 dateDone: now,
//             })
//             .where(eq(challengeProgress.id, existingProgress.id));
//     } else {
//         await db.insert(challengeProgress).values({
//             userId,
//             challengeId,
//             completed: true,
//             doneRight: doneRight,
//             dateDone: now,
//         });
//     }
    
//     // 6. Подготавливаем обновления для userDailyStats (с гарантированными значениями)
//     const currentChallengesDone = todayStats?.challengesDone ?? 0;
//     const currentChallengesRight = todayStats?.challengesRight ?? 0;
//     const currentChallengesWrong = todayStats?.challengesWrong ?? 0;
    
//     const newChallengesDone = currentChallengesDone + 1;
//     const newChallengesRight = currentChallengesRight + (doneRight ? 1 : 0);
//     const newChallengesWrong = currentChallengesWrong + (doneRight ? 0 : 1);
    
//     // 🔥 Рассчитываем accuracy (всегда число)
//     const newAccuracy = newChallengesDone > 0 ? newChallengesRight / newChallengesDone : 0;
    
//     // 7. Обновляем очки и гемы
//     let pointsEarned = 0;
//     let gemsEarned = 0;
    
//     if (!isPractice && doneRight && !existingProgress?.completed) {
//         pointsEarned = challenge.points;
//         gemsEarned = Math.floor(challenge.points / 10);
        
//         await db.update(userProgress)
//             .set({
//                 points: sql`${userProgress.points} + ${pointsEarned}`,
//                 gems: sql`${userProgress.gems} + ${gemsEarned}`,
//             })
//             .where(eq(userProgress.userId, userId));
        
//         const courseProgress = await db.query.userCourseProgress.findFirst({
//             where: and(
//                 eq(userCourseProgress.userId, userId),
//                 eq(userCourseProgress.courseId, courseId)
//             ),
//         });
        
//         if (courseProgress) {
//             await db.update(userCourseProgress)
//                 .set({
//                     points: sql`${userCourseProgress.points} + ${pointsEarned}`,
//                     gems: sql`${userCourseProgress.gems} + ${gemsEarned}`,
//                     updatedAt: now,
//                 })
//                 .where(eq(userCourseProgress.id, courseProgress.id));
//         }
//     }
    
//     // 8. Обновляем HW статистику (с гарантированными значениями)
//     let hwDone = todayStats?.hwDone ?? 0;
//     let hwAssigned = todayStats?.hwAssigned ?? 0;
//     let hwCompleted = todayStats?.hwCompleted ?? false;
    
//     if (targetHomework && doneRight && !isPractice) {
//         const newCorrectCount = (targetHomework.correctCount ?? 0) + 1;
//         const isCompleted = newCorrectCount >= (targetHomework.totalCount ?? 0);
        
//         await db.update(userHomework)
//             .set({
//                 correctCount: newCorrectCount,
//                 wrongCount: targetHomework.wrongCount ?? 0,
//                 status: isCompleted ? 'completed' : 'pending',
//                 completedAt: isCompleted ? now : null,
//                 updatedAt: now,
//             })
//             .where(eq(userHomework.id, targetHomework.id));
        
//         // Получаем все ДЗ за сегодня и суммируем
//         const allTodayHomework = await db.query.userHomework.findMany({
//             where: and(
//                 eq(userHomework.userId, userId),
//                 eq(userHomework.courseId, courseId),
//                 eq(userHomework.dueDate, today)
//             ),
//         });
        
//         // 🔥 Безопасное суммирование
//         hwAssigned = allTodayHomework.reduce((sum, h) => sum + (h.totalCount ?? 0), 0);
//         hwDone = allTodayHomework.reduce((sum, h) => sum + (h.correctCount ?? 0), 0);
//         hwCompleted = hwDone >= hwAssigned && hwAssigned > 0;
//     }
    
//     // 9. Сохраняем userDailyStats (гарантированно без undefined)
//     const statsValues = {
//         userId,
//         courseId,
//         date: today,
//         challengesDone: newChallengesDone,
//         challengesRight: newChallengesRight,
//         challengesWrong: newChallengesWrong,
//         accuracy: newAccuracy,
//         pointsEarned: (todayStats?.pointsEarned ?? 0) + pointsEarned,
//         gemsEarned: (todayStats?.gemsEarned ?? 0) + gemsEarned,
//         gemsSpent: todayStats?.gemsSpent ?? 0,
//         hwAssigned: hwAssigned,
//         hwDone: hwDone,
//         hwCompleted: hwCompleted,
//         lastActivityAt: now,
//         updatedAt: now,
//     };
    
//     if (todayStats) {
//         await db.update(userDailyStats)
//             .set(statsValues)
//             .where(eq(userDailyStats.id, todayStats.id));
//     } else {
//         await db.insert(userDailyStats).values({
//             ...statsValues,
//             createdAt: now,
//         });
//     }
    
//     revalidatePath('/learn');
//     revalidatePath(`/lesson/${challenge.lessonId}`);
    
//     return {
//         success: true,
//         pointsEarned,
//         gemsEarned,
//         accuracy: newAccuracy,
//         hwDone: hwDone,
//         hwCompleted: hwCompleted,
//     };
// }

// // Алиас для обратной совместимости
// export const upsertChallengeProgress = updateChallengeProgress;








// // app/actions/challenge-progress.ts
// 'use server';

// import db from '@/db/drizzle';
// import { 
//     challengeProgress, 
//     userDailyStats, 
//     userHomework, 
//     userProgress, 
//     userCourseProgress,
//     challenges,
//     lessons,
//     units
// } from '@/db/schema';
// import { and, eq, sql } from 'drizzle-orm';
// import { auth } from '@/lib/auth';
// import { revalidatePath } from 'next/cache';

// interface UpdateChallengeProgressProps {
//     challengeId: number;
//     doneRight: boolean;
//     isPractice?: boolean;
// }

// export async function updateChallengeProgress({
//     challengeId,
//     doneRight,
//     isPractice = false,
// }: UpdateChallengeProgressProps) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const now = new Date();
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     // Получаем challenge
//     const challenge = await db.query.challenges.findFirst({
//         where: eq(challenges.id, challengeId),
//     });
    
//     if (!challenge) throw new Error('Challenge не найден');
    
//     // Получаем lesson
//     const lesson = await db.query.lessons.findFirst({
//         where: eq(lessons.id, challenge.lessonId),
//     });
    
//     if (!lesson) throw new Error('Lesson не найден');
    
//     // Получаем unit
//     const unit = await db.query.units.findFirst({
//         where: eq(units.id, lesson.unitId),
//     });
    
//     if (!unit) throw new Error('Unit не найден');
    
//     const courseId = unit.courseId;
    
//     // ... остальной код функции (как писали ранее) ...
    
//     revalidatePath('/learn');
//     revalidatePath(`/lesson/${challenge.lessonId}`);
    
//     return {
//         success: true,
//         pointsEarned,
//         gemsEarned,
//         accuracy: statsUpdates.accuracy,
//         hwDone: statsUpdates.hwDone,
//         hwCompleted: statsUpdates.hwCompleted,
//     };
// }

// // 🔥 Алиас для обратной совместимости
// export const upsertChallengeProgress = updateChallengeProgress;






// // app/actions/challenge-progress.ts
// 'use server';

// import db from '@/db/drizzle';
// import { 
//     challengeProgress, 
//     userDailyStats, 
//     userHomework, 
//     userProgress, 
//     userCourseProgress,
//     challenges,
//     lessons,
//     units
// } from '@/db/schema';
// import { and, eq, sql } from 'drizzle-orm';
// import { auth } from '@/lib/auth';
// import { revalidatePath } from 'next/cache';

// interface UpdateChallengeProgressProps {
//     challengeId: number;
//     doneRight: boolean;
//     isPractice?: boolean;
// }

// export async function updateChallengeProgress({
//     challengeId,
//     doneRight,
//     isPractice = false,
// }: UpdateChallengeProgressProps) {
//     const session = await auth();
//     if (!session?.user?.id) throw new Error('Не авторизован');
    
//     const userId = session.user.id;
//     const now = new Date();
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     // 1. Получаем информацию о challenge
//     const challenge = await db.query.challenges.findFirst({
//         where: eq(challenges.id, challengeId),
//         with: {
//             lesson: {
//                 with: {
//                     unit: true,
//                 },
//             },
//         },
//     });
    
//     if (!challenge) throw new Error('Challenge не найден');
    
//     const courseId = challenge.lesson.unit.courseId;
    
//     // 2. Проверяем, не решал ли уже пользователь этот challenge
//     const existingProgress = await db.query.challengeProgress.findFirst({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.challengeId, challengeId)
//         ),
//     });
    
//     // Если уже решал и правильно - не даём второй раз получить очки
//     if (existingProgress?.completed && existingProgress.doneRight) {
//         return { success: false, message: 'Challenge уже выполнен' };
//     }
    
//     // 3. Получаем сегодняшнюю статистику
//     let todayStats = await db.query.userDailyStats.findFirst({
//         where: and(
//             eq(userDailyStats.userId, userId),
//             eq(userDailyStats.courseId, courseId),
//             eq(userDailyStats.date, today)
//         ),
//     });
    
//     // 4. Проверяем, является ли challenge частью ДЗ (daily или teacher)
//     const todayHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.status, 'pending'),
//             sql`${userHomework.challengeIds} LIKE ${`%${challengeId}%`}`
//         ),
//     });
    
//     const targetHomework = todayHomework.find(hw => 
//         hw.challengeIds?.split(',').map(Number).includes(challengeId)
//     );
    
//     // 5. Обновляем или создаём запись challengeProgress
//     if (existingProgress) {
//         await db.update(challengeProgress)
//             .set({
//                 completed: true,
//                 doneRight: doneRight,
//                 dateDone: now,
//             })
//             .where(eq(challengeProgress.id, existingProgress.id));
//     } else {
//         await db.insert(challengeProgress).values({
//             userId,
//             challengeId,
//             completed: true,
//             doneRight: doneRight,
//             dateDone: now,
//         });
//     }
    
//     // 6. Обновляем статистику в userDailyStats
//     const statsUpdates: any = {};
    
//     // Обновляем счётчики задач
//     statsUpdates.challengesDone = (todayStats?.challengesDone || 0) + 1;
//     if (doneRight) {
//         statsUpdates.challengesRight = (todayStats?.challengesRight || 0) + 1;
//     } else {
//         statsUpdates.challengesWrong = (todayStats?.challengesWrong || 0) + 1;
//     }
    
//     // 🔥 РАССЧИТЫВАЕМ ACCURACY
//     const totalDone = statsUpdates.challengesDone;
//     const totalRight = statsUpdates.challengesRight || 0;
//     statsUpdates.accuracy = totalDone > 0 ? totalRight / totalDone : 0;
    
//     // 7. Обновляем очки и гемы (если не практика)
//     let pointsEarned = 0;
//     let gemsEarned = 0;
    
//     if (!isPractice && doneRight && !existingProgress?.completed) {
//         pointsEarned = challenge.points;
//         gemsEarned = Math.floor(challenge.points / 10);
        
//         // Обновляем глобальный прогресс пользователя
//         await db.update(userProgress)
//             .set({
//                 points: sql`${userProgress.points} + ${pointsEarned}`,
//                 gems: sql`${userProgress.gems} + ${gemsEarned}`,
//             })
//             .where(eq(userProgress.userId, userId));
        
//         // Обновляем прогресс по курсу
//         const courseProgress = await db.query.userCourseProgress.findFirst({
//             where: and(
//                 eq(userCourseProgress.userId, userId),
//                 eq(userCourseProgress.courseId, courseId)
//             ),
//         });
        
//         if (courseProgress) {
//             await db.update(userCourseProgress)
//                 .set({
//                     points: sql`${userCourseProgress.points} + ${pointsEarned}`,
//                     gems: sql`${userCourseProgress.gems} + ${gemsEarned}`,
//                     updatedAt: now,
//                 })
//                 .where(eq(userCourseProgress.id, courseProgress.id));
//         }
        
//         statsUpdates.pointsEarned = pointsEarned;
//         statsUpdates.gemsEarned = gemsEarned;
//     }
    
//     // 8. 🔥 ОБНОВЛЯЕМ HW ДЛЯ ЛЮБОГО ТИПА ДЗ (и daily, и teacher)
//     if (targetHomework && doneRight && !isPractice) {
//         // Обновляем correctCount в userHomework
//         const newCorrectCount = (targetHomework.correctCount || 0) + 1;
//         const isCompleted = newCorrectCount >= targetHomework.totalCount;
        
//         await db.update(userHomework)
//             .set({
//                 correctCount: newCorrectCount,
//                 wrongCount: targetHomework.wrongCount,
//                 status: isCompleted ? 'completed' : 'pending',
//                 completedAt: isCompleted ? now : null,
//                 updatedAt: now,
//             })
//             .where(eq(userHomework.id, targetHomework.id));
        
//         // 🔥 ГЛАВНОЕ: обновляем hwDone в userDailyStats (сумма всех correctCount)
//         // Получаем все ДЗ за сегодня
//         const allTodayHomework = await db.query.userHomework.findMany({
//             where: and(
//                 eq(userHomework.userId, userId),
//                 eq(userHomework.courseId, courseId),
//                 eq(userHomework.dueDate, today)
//             ),
//         });
        
//         // Суммируем все correctCount из всех ДЗ
//         const totalHwDone = allTodayHomework.reduce((sum, hw) => sum + (hw.correctCount || 0), 0);
//         const totalHwAssigned = allTodayHomework.reduce((sum, hw) => sum + (hw.totalCount || 0), 0);
        
//         statsUpdates.hwDone = totalHwDone;
//         statsUpdates.hwAssigned = totalHwAssigned;
//         statsUpdates.hwCompleted = totalHwDone >= totalHwAssigned && totalHwAssigned > 0;
//     }
    
//     // 9. Сохраняем или обновляем userDailyStats
//     if (todayStats) {
//         await db.update(userDailyStats)
//             .set({
//                 ...statsUpdates,
//                 lastActivityAt: now,
//                 updatedAt: now,
//             })
//             .where(eq(userDailyStats.id, todayStats.id));
//     } else {
//         await db.insert(userDailyStats).values({
//             userId,
//             courseId,
//             date: today,
//             challengesDone: statsUpdates.challengesDone || 0,
//             challengesRight: statsUpdates.challengesRight || 0,
//             challengesWrong: statsUpdates.challengesWrong || 0,
//             accuracy: statsUpdates.accuracy || 0,
//             pointsEarned: statsUpdates.pointsEarned || 0,
//             gemsEarned: statsUpdates.gemsEarned || 0,
//             hwAssigned: statsUpdates.hwAssigned || 0,
//             hwDone: statsUpdates.hwDone || 0,
//             hwCompleted: statsUpdates.hwCompleted || false,
//             lastActivityAt: now,
//             createdAt: now,
//             updatedAt: now,
//         });
//     }
    
//     revalidatePath('/learn');
//     revalidatePath(`/lesson/${challenge.lessonId}`);
    
//     return {
//         success: true,
//         pointsEarned,
//         gemsEarned,
//         accuracy: statsUpdates.accuracy,
//         hwDone: statsUpdates.hwDone,
//         hwCompleted: statsUpdates.hwCompleted,
//     };
// }








// // app/actions/challenge-progress.ts

// 'use server';

// import db from "@/db/drizzle";
// import { getUserProgress } from "@/db/queries";
// import { challengeProgress, challenges, userProgress, userDailyStats, userCourseProgress, userHomework } from "@/db/schema";
// import { auth } from "@/lib/auth";
// import { and, eq } from "drizzle-orm";
// import { revalidatePath } from "next/cache";
// import { recalculateDailyStats } from "./recalculate-daily-stats";

// export const upsertChallengeProgress = async (
//     challengeId: number,
//     doneRight: boolean,
//     challengePts: number,
//     isDoneChallenge: boolean,
// ): Promise<{ success: boolean; isHomeworkCompleted?: boolean; homeworkType?: string; error?: string; redirectTo?: string }> => {

//     // В самом начале, после проверки challenge
//     if (isNaN(challengeId)) {
//         console.error('❌ challengeId is NaN!', challengeId);
//         throw new Error('Некорректный ID задачи');
//     }

//     // В начале функции, после получения challenge
//     console.log('💰 challengePts:', challengePts, 'type:', typeof challengePts);
//     if (isNaN(challengePts)) {
//         console.error('❌ challengePts is NaN!', challengePts);
//         challengePts = 0;
//     }

//     const session = await auth();
//     if (!session?.user?.id) {
//         throw new Error('Вы не авторизованы!');
//     }
//     const userId = session.user.id;

//     const currentUserProgress = await getUserProgress();

//     if (!currentUserProgress) {
//         throw new Error("У пользователя нет прогресса!");
//     }

//     const challenge = await db.query.challenges.findFirst({
//         where: eq(challenges.id, challengeId)
//     });

//     if (!challenge) {
//         throw new Error('Задание не найдено!');
//     }

//     const lessonId = challenge.lessonId;
//     const courseId = currentUserProgress.activeCourseId;

//     if (!courseId) {
//         throw new Error('Активный курс не найден!');
//     }

//     const existingChallengeProgress = await db.query.challengeProgress.findFirst({
//         where: and(
//             eq(challengeProgress.userId, userId),
//             eq(challengeProgress.challengeId, challengeId)
//         )
//     });

//     const isPractice = !!existingChallengeProgress;

//     // ============================================
//     // ========== ЛОГИКА: userDailyStats ==========
//     // ============================================

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Получаем или создаем запись в userDailyStats на сегодня
//     let todayStats = await db.query.userDailyStats.findFirst({
//         where: and(
//             eq(userDailyStats.userId, userId),
//             eq(userDailyStats.courseId, courseId),
//             eq(userDailyStats.date, today)
//         ),
//     });

//     if (!todayStats) {
//         console.log('📝 Создаём новую запись userDailyStats для сегодня');
//         const inserted = await db.insert(userDailyStats).values({
//             userId,
//             courseId,
//             date: today,
//             pointsEarned: 0,
//             gemsEarned: 0,
//             gemsSpent: 0,
//             challengesDone: 0,
//             challengesRight: 0,
//             challengesWrong: 0,
//             hwAssigned: 0,
//             hwDone: 0,
//             hwCompleted: false,
//             lastActivityAt: new Date(),
//             createdAt: new Date(),
//             updatedAt: new Date(),
//         }).returning();
        
//         if (!inserted || inserted.length === 0) {
//             console.error('❌ Не удалось создать userDailyStats');
//             throw new Error('Не удалось создать запись статистики');
//         }
//         todayStats = inserted[0];
//         console.log('✅ userDailyStats создан, ID:', todayStats.id);
//     }

//     // ==================================================
//     // ========== ЛОГИКА СЕРДЕЧЕК ==========
//     // ==================================================

//     if (currentUserProgress.hearts === 0 && !isPractice && 2 < 1) {
//         return { success: false, error: "hearts" };
//     }

//     if (isPractice) {
//         await db.update(challengeProgress).set({
//             completed: true,
//         }).where(eq(challengeProgress.id, existingChallengeProgress.id));

//         await db.update(userProgress).set({
//             hearts: Math.min(currentUserProgress.hearts + 1, 5),
//             points: isDoneChallenge ? currentUserProgress.points + 0 : currentUserProgress.points + challengePts
//         }).where(eq(userProgress.userId, userId));

//         await db.update(userDailyStats)
//             .set({
//                 challengesDone: (todayStats.challengesDone || 0) + 1,
//                 challengesRight: (todayStats.challengesRight || 0) + (doneRight ? 1 : 0),
//                 challengesWrong: (todayStats.challengesWrong || 0) + (doneRight ? 0 : 1),
//                 pointsEarned: (todayStats.pointsEarned || 0) + (doneRight && !isDoneChallenge ? challengePts : 0),
//                 lastActivityAt: new Date(),
//                 updatedAt: new Date(),
//             })
//             .where(eq(userDailyStats.id, todayStats.id));

//         revalidatePath('/learn');
//         revalidatePath('/lesson');
//         revalidatePath('/progress');
//         revalidatePath('/leaderboard');
//         revalidatePath(`/lesson/${lessonId}`);
//         return { success: true };
//     }

//     // =====================================================
//     // ========== НОВАЯ ЗАПИСЬ CHALLENGE PROGRESS ==========
//     // =====================================================

//     await db.insert(challengeProgress).values({
//         challengeId,
//         userId,
//         completed: true,
//         doneRight,
//     });

//     // ============================================
//     // ========== ОБНОВЛЯЕМ DAILY STATS ===========
//     // ============================================

//     const pointsEarned = (doneRight && !isDoneChallenge) ? (challengePts || 0) : 0;
//     const gemsEarned = doneRight ? Math.floor((challengePts || 0) / 2) : 0;

//     // Убеждаемся, что значения — числа
//     const safePoints = isNaN(pointsEarned) ? 0 : pointsEarned;
//     const safeGems = isNaN(gemsEarned) ? 0 : gemsEarned;

//     const statsUpdates: any = {
//         challengesDone: (todayStats.challengesDone || 0) + 1,
//         challengesRight: (todayStats.challengesRight || 0) + (doneRight ? 1 : 0),
//         challengesWrong: (todayStats.challengesWrong || 0) + (doneRight ? 0 : 1),
//         pointsEarned: (todayStats.pointsEarned || 0) + safePoints,
//         gemsEarned: (todayStats.gemsEarned || 0) + safeGems,
//         lastActivityAt: new Date(),
//         updatedAt: new Date(),
//     };

//     // ============================================
//     // ========== HW ПРОГРЕСС ==========
//     // ============================================

//     let isHomeworkCompleted = false;
//     let homeworkType: string | null = null;
//     let redirectTo: string | undefined;

//     // Проверяем, есть ли задача в каком-либо ДЗ
//     const allPendingHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.userId, userId),
//             eq(userHomework.courseId, courseId),
//             eq(userHomework.status, 'pending')
//         ),
//     });

//     // Ищем ДЗ, содержащее эту задачу
//     let targetHomework = null;
//     for (const hw of allPendingHomework) {
//         if (hw.challengeIds && hw.challengeIds.trim() !== '') {
//             const ids = hw.challengeIds.split(',').map(id => {
//                 const parsed = parseInt(id);
//                 return isNaN(parsed) ? null : parsed;
//             }).filter(id => id !== null);
            
//             if (ids.length === 0) {
//                 console.log(`⚠️ HW ${hw.id} не содержит валидных challengeIds: ${hw.challengeIds}`);
//                 continue;
//             }
            
//             if (ids.includes(challengeId)) {
//                 targetHomework = hw;
//                 break;
//             }
//         }
//     }

//     // Если задача из ДЗ и решена правильно
//     if (targetHomework && doneRight && !isPractice) {
//         const currentCorrect = targetHomework.correctCount ?? 0;
//         if (isNaN(currentCorrect)) {
//             console.error('❌ targetHomework.correctCount is NaN!', targetHomework);
//         }
        
//         const newCorrectCount = currentCorrect + 1;
//         const isCompleted = newCorrectCount >= targetHomework.totalCount;
        
//         console.log(`📚 HW прогресс: ${newCorrectCount}/${targetHomework.totalCount} (${targetHomework.type === 'daily' ? 'Челлендж дня' : 'Домашняя работа'})`);
        
//         if (!isNaN(newCorrectCount)) {
//             await db.update(userHomework)
//                 .set({
//                     correctCount: newCorrectCount,
//                     status: isCompleted ? 'completed' : 'pending',
//                     completedAt: isCompleted ? new Date() : null,
//                     updatedAt: new Date(),
//                 })
//                 .where(eq(userHomework.id, targetHomework.id));
            
//             statsUpdates.hwDone = (statsUpdates.hwDone || 0) + 1;
//             statsUpdates.hwCompleted = isCompleted;

            
//             await recalculateDailyStats(userId, courseId);
            
//             if (isCompleted) {
//                 isHomeworkCompleted = true;
//                 homeworkType = targetHomework.type;
//                 redirectTo = '/learn?homeworkCompleted=daily';
//                 // Принудительно обновляем страницу learn
//                 revalidatePath('/learn');
//             }
//         } else {
//             console.error('❌ newCorrectCount is NaN, пропускаем обновление');
//         }
//     }

//     // Если задача из ДЗ и решена неправильно
//     if (targetHomework && !doneRight && !isPractice) {
//         const currentWrong = targetHomework.wrongCount ?? 0;
//         const newWrongCount = currentWrong + 1;
        
//         if (!isNaN(newWrongCount)) {
//             await db.update(userHomework)
//                 .set({
//                     wrongCount: newWrongCount,
//                     updatedAt: new Date(),
//                 })
//             .where(eq(userHomework.id, targetHomework.id));
            
//             console.log(`📚 HW ошибка: ${newWrongCount} (${targetHomework.type === 'daily' ? 'Челлендж дня' : 'Домашняя работа'})`);
//         } else {
//             console.error('❌ newWrongCount is NaN, пропускаем обновление');
//         }
//     }

//     // ============================================
//     // ========== ОБНОВЛЯЕМ DAILY STATS ==========
//     // ============================================

//     console.log('📊 statsUpdates перед обновлением:', JSON.stringify(statsUpdates, null, 2));

//     for (const [key, value] of Object.entries(statsUpdates)) {
//         if (value === null || value === undefined) {
//             statsUpdates[key] = 0;
//         } else if (typeof value === 'number' && isNaN(value)) {
//             console.error(`❌ Поле ${key} содержит NaN!`, value);
//             statsUpdates[key] = 0;
//         }
//     }

//     await db.update(userDailyStats)
//         .set(statsUpdates)
//         .where(eq(userDailyStats.id, todayStats.id));

//     // ====================================================
//     // ========== ОБНОВЛЯЕМ USER COURSE PROGRESS ==========
//     // ====================================================

//     const existingCourseProgress = await db.query.userCourseProgress.findFirst({
//         where: and(
//             eq(userCourseProgress.userId, userId),
//             eq(userCourseProgress.courseId, courseId)
//         ),
//     });

//     if (existingCourseProgress) {
//         await db.update(userCourseProgress)
//             .set({
//                 points: (existingCourseProgress.points || 0) + safePoints,
//                 gems: (existingCourseProgress.gems || 0) + safeGems,
//                 updatedAt: new Date(),
//             })
//             .where(eq(userCourseProgress.id, existingCourseProgress.id));
//     } else {
//         await db.insert(userCourseProgress).values({
//             userId,
//             courseId,
//             points: safePoints,
//             gems: safeGems,
//             progressPercent: 0,
//             streak: 1,
//             longestStreak: 1,
//             updatedAt: new Date(),
//         });
//     }

//     // ============================================
//     // ========== ОБНОВЛЯЕМ USER PROGRESS ==========
//     // ============================================

//     await db.update(userProgress).set({
//         points: isDoneChallenge ? currentUserProgress.points : (doneRight ? currentUserProgress.points + challengePts : currentUserProgress.points),
//         hearts: doneRight ? currentUserProgress.hearts : currentUserProgress.hearts - 1,
//         gems: (currentUserProgress.gems || 0) + safeGems,
//     }).where(eq(userProgress.userId, userId));

//     revalidatePath('/learn');
//     revalidatePath('/lesson');
//     revalidatePath('/progress');
//     revalidatePath('/leaderboard');
//     revalidatePath(`/lesson/${lessonId}`);

//     return { 
//         success: true, 
//         isHomeworkCompleted, 
//         homeworkType: homeworkType || undefined,
//         redirectTo
//     };
// };

