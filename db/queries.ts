// db/queries.ts

import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { cache } from 'react';
import db from './drizzle';
import { 
  // Существующие таблицы
  courses, units, lessons, challenges, challengeProgress, 
  userProgress, userSubscription, classes, classesHw,
  // Новые таблицы
  userDailyStats, userCourseProgress,
  // Тренажер
  t_courses, t_units, t_lessons, t_challenges, t_challengeOptions, t_lessonProgress,
  userHomework,
  userAchievements,
  userMines,
  trainerQuests
} from './schema';
import { auth } from '@/lib/auth';




// 🔥 Добавь этот тип
export type HomeworkItem = {
    id: number;
    userId: string;
    courseId: number | null;
    challengeIds: string | null;
    tLessonIds: string | null;
    totalCount: number;
    assignedAt: Date;
    dueDate: Date;
    status: string;
    completedAt: Date | null;
    correctCount: number;
    wrongCount: number;
    lastNotifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    type: 'teacher' | 'daily'; // ← добавляем поле type
};



// ============================================
// ========== ПОЛЬЗОВАТЕЛИ И ПРОГРЕСС ==========
// ============================================

export const getUserProgress = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return null;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });
  return data;
});

// ============================================
// ========== НОВЫЕ ЗАПРОСЫ (userDailyStats) ===
// ============================================

/**
 * Получить ежедневную статистику пользователя за конкретную дату
 */
export const getUserDailyStatsByDate = cache(async (courseId: number, date: Date) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return null;

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const data = await db.query.userDailyStats.findFirst({
    where: and(
      eq(userDailyStats.userId, userId),
      eq(userDailyStats.courseId, courseId),
      eq(userDailyStats.date, normalizedDate)
    ),
  });
  return data;
});

/**
 * Получить статистику пользователя за сегодня
 */
export const getTodayStats = cache(async (courseId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getUserDailyStatsByDate(courseId, today);
});

/**
 * Получить всю статистику пользователя по курсу
 */
export const getUserAllStatsByCourse = cache(async (courseId: number) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return [];

  const data = await db.query.userDailyStats.findMany({
    where: and(
      eq(userDailyStats.userId, userId),
      eq(userDailyStats.courseId, courseId)
    ),
    orderBy: (stats, { desc }) => [desc(stats.date)],
  });
  return data;
});

/**
 * Получить статистику пользователя за последние N дней
 */
export const getUserStatsLastDays = cache(async (courseId: number, days: number) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const data = await db.query.userDailyStats.findMany({
    where: and(
      eq(userDailyStats.userId, userId),
      eq(userDailyStats.courseId, courseId),
      gte(userDailyStats.date, startDate)
    ),
    orderBy: (stats, { asc }) => [asc(stats.date)],
  });
  return data;
});

/**
 * Получить статистику пользователя между двумя датами
 */
export const getUserStatsBetweenDates = cache(async (
  courseId: number, 
  startDate: Date, 
  endDate: Date
) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return [];

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const data = await db.query.userDailyStats.findMany({
    where: and(
      eq(userDailyStats.userId, userId),
      eq(userDailyStats.courseId, courseId),
      gte(userDailyStats.date, start),
      lte(userDailyStats.date, end)
    ),
    orderBy: (stats, { asc }) => [asc(stats.date)],
  });
  return data;
});

/**
 * Обновить или создать запись в userDailyStats (upsert)
 */
export const upsertDailyStats = cache(async (
  courseId: number, 
  updates: {
    pointsEarned?: number;
    gemsEarned?: number;
    gemsSpent?: number;
    challengesDone?: number;
    challengesRight?: number;
    challengesWrong?: number;
    hwAssigned?: number;
    hwDone?: number;
    hwCompleted?: boolean;
    accuracy?: number;
  }
) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) throw new Error('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await getUserDailyStatsByDate(courseId, today);

  if (existing) {
    await db.update(userDailyStats)
      .set({
        ...updates,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userDailyStats.id, existing.id));
  } else {
    await db.insert(userDailyStats).values({
      userId,
      courseId,
      date: today,
      pointsEarned: updates.pointsEarned || 0,
      gemsEarned: updates.gemsEarned || 0,
      gemsSpent: updates.gemsSpent || 0,
      challengesDone: updates.challengesDone || 0,
      challengesRight: updates.challengesRight || 0,
      challengesWrong: updates.challengesWrong || 0,
      hwAssigned: updates.hwAssigned || 0,
      hwDone: updates.hwDone || 0,
      hwCompleted: updates.hwCompleted || false,
      accuracy: updates.accuracy || 0,
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
});

/**
 * Добавить очки пользователю за задачу
 */
export const addPointsToDailyStats = cache(async (
  courseId: number,
  points: number,
  gems: number
) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) throw new Error('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.update(userProgress)
    .set({
      points: sql`${userProgress.points} + ${points}`,
      gems: sql`${userProgress.gems} + ${gems}`,
    })
    .where(eq(userProgress.userId, userId));

  const courseProgress = await getUserCourseProgress(courseId);
  if (courseProgress) {
    await db.update(userCourseProgress)
      .set({
        points: sql`${userCourseProgress.points} + ${points}`,
        gems: sql`${userCourseProgress.gems} + ${gems}`,
        updatedAt: new Date(),
      })
      .where(eq(userCourseProgress.id, courseProgress.id));
  } else {
    await db.insert(userCourseProgress).values({
      userId,
      courseId,
      points,
      gems,
      progressPercent: 0,
      streak: 0,
      longestStreak: 0,
      updatedAt: new Date(),
    });
  }

  await db
    .insert(userDailyStats)
    .values({
      userId,
      courseId,
      date: today,
      pointsEarned: points,
      gemsEarned: gems,
      challengesDone: 1,
      challengesRight: 1,
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userDailyStats.userId, userDailyStats.courseId, userDailyStats.date],
      set: {
        pointsEarned: sql`${userDailyStats.pointsEarned} + ${points}`,
        gemsEarned: sql`${userDailyStats.gemsEarned} + ${gems}`,
        challengesDone: sql`${userDailyStats.challengesDone} + 1`,
        challengesRight: sql`${userDailyStats.challengesRight} + 1`,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });
});

/**
 * Отметить выполнение HW
 */
export const completeHomework = cache(async (courseId: number) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) throw new Error('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.update(userDailyStats)
    .set({ 
      hwCompleted: true,
      updatedAt: new Date(),
    })
    .where(and(
      eq(userDailyStats.userId, userId),
      eq(userDailyStats.courseId, courseId),
      eq(userDailyStats.date, today)
    ));
});

// ============================================
// ========== ПРОГРЕСС ПО КУРСАМ ==============
// ============================================

/**
 * Получить прогресс пользователя по конкретному курсу
 */
export const getUserCourseProgress = cache(async (courseId: number) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return null;

  const data = await db.query.userCourseProgress.findFirst({
    where: and(
      eq(userCourseProgress.userId, userId),
      eq(userCourseProgress.courseId, courseId)
    ),
  });
  return data;
});

/**
 * Получить прогресс пользователя по всем курсам
 */
export const getAllUserCoursesProgress = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return [];

  const data = await db.query.userCourseProgress.findMany({
    where: eq(userCourseProgress.userId, userId),
    with: {
      course: true,
    },
  });
  return data;
});

/**
 * Обновить прогресс по курсу
 */
export const updateCourseProgress = cache(async (
  courseId: number,
  updates: { points?: number; gems?: number; progressPercent?: number; streak?: number }
) => {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) throw new Error('User not found');

  const existing = await getUserCourseProgress(courseId);

  if (existing) {
    await db.update(userCourseProgress)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userCourseProgress.id, existing.id));
  } else {
    await db.insert(userCourseProgress).values({
      userId,
      courseId,
      points: updates.points || 0,
      gems: updates.gems || 0,
      progressPercent: updates.progressPercent || 0,
      streak: updates.streak || 0,
      longestStreak: 0,
      updatedAt: new Date(),
    });
  }
});

// ============================================
// ========== СУЩЕСТВУЮЩИЕ ЗАПРОСЫ ============
// ============================================

export const getChallengeProgress = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const data = await db.query.challengeProgress.findMany({
    where: eq(challengeProgress.userId, userId),
  });
  return data;
});

export const getChallengeProgressAllUsers = cache(async () => {
  const data = await db.query.challengeProgress.findMany();
  return data;
});















export const getUnits = cache(async (courseId?: number) => {
  const session = await auth();
  const userId = session?.user?.id;

  // Если courseId не передан, используем активный курс пользователя
  let targetCourseId: number | undefined = courseId;
  
  if (!targetCourseId) {
    const userProgressData = await getUserProgress();
    // Преобразуем null в undefined
    targetCourseId = userProgressData?.activeCourseId ?? undefined;
  }
  
  if (!userId || !targetCourseId) return [];

  const data = await db.query.units.findMany({
    where: eq(units.courseId, targetCourseId),
    with: {
      lessons: {
        with: {
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId)
              }
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      if (lesson.challenges.length === 0) {
        return { ...lesson, completed: false };
      }

      const allChallengesCompleted = lesson.challenges.every((challenge) => {
        return challenge.challengeProgress && 
               challenge.challengeProgress.length > 0 &&
               challenge.challengeProgress[0]?.completed === true;
      });
      
      return { ...lesson, completed: allChallengesCompleted };
    });
    return { ...unit, lessons: lessonsWithCompletedStatus };
  });
  
  return normalizedData;
});











export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();
  return data;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });
  return data;
});

export const getCourseProgress = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  const userProgressData = await getUserProgress();

  if (!userId || !userProgressData?.activeCourseId) return null;

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgressData.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInActiveCourse
    .flatMap((unit) => unit.lessons)
    .find((lesson) => {
      return lesson.challenges.some((challenge) => {
        return !challenge.challengeProgress ||
               challenge.challengeProgress.length === 0 ||
               challenge.challengeProgress.some((progress) => progress.completed === false);
      });
    });

  return {
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});








// db/queries.ts

export const getLesson = cache(async (lessonId: number) => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return null;

    console.log('📚 getLesson вызван с ID:', lessonId);

    const data = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
            challenges: {
                orderBy: (challenges, { asc }) => [asc(challenges.order)],
                with: {
                    challengeOptions: true,
                    challengeProgress: {
                        where: eq(challengeProgress.userId, userId)
                    },
                },
            },
        },
    });

    if (!data || !data.challenges) return null;

    const normalizedChallenges = data.challenges.map((challenge) => {
        const completed = challenge.challengeProgress &&
                          challenge.challengeProgress.length > 0 &&
                          challenge.challengeProgress.every((progress) => progress.completed);
        return { ...challenge, completed };
    });

    return { ...data, challenges: normalizedChallenges };
});












export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeLessonId) return 0;

  const lesson = await getLesson(courseProgress.activeLessonId);

  if (!lesson) return 0;

  const completedChallenges = lesson.challenges.filter((challenge) => challenge.completed);
  const percentage = Math.round((completedChallenges.length / lesson.challenges.length) * 100);
  return percentage;
});

const DAY_IN_MS = 86_400_000;

export const getUserSubscription = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const data = await db.query.userSubscription.findFirst({
    where: eq(userSubscription.userId, userId),
  });

  if (!data) return null;

  const isActive = data.stripePriceId &&
    data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

  return { ...data, isActive: !!isActive };
});

export const getTopTenUsers = cache(async () => {
  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    }
  });
  return data;
});

export const getAllUsers = cache(async () => {
  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
      classId: true,
    }
  });
  return data;
});

export const getAllUsersProgress = cache(async () => {
  const data = await db.query.userProgress.findMany();
  return data;
});

export const getAllClasses = cache(async () => {
  const data = await db.query.classes.findMany();
  return data;
});

export const getAllClassHW = cache(async () => {
  const data = await db.query.classesHw.findMany();
  return data;
});

// ============================================
// ========== ТРЕНАЖЕР ========================
// ============================================

export const getTCourses = cache(async () => {
  const data = await db.query.t_courses.findMany();
  return data;
});



export const getTUnits = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  const data = await db.query.t_units.findMany({
    with: {
      t_lessons: {
        with: {
          t_challenges: {
            with: {
              t_challengeOptions: {},
            },
          },
        },
      },
    },
  });
  return data;
});






export const getTLesson = cache(async (t_lessonId: number) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const data = await db.query.t_lessons.findFirst({
    where: eq(t_lessons.id, t_lessonId),
    with: {
      t_challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        with: {
          t_challengeOptions: true,
        },
      },
    },
  });

  if (!data || !data.t_challenges) return null;
  return { ...data };
});

export const getTLessonProgress = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  const data = await db.query.t_lessonProgress.findMany({
    where: eq(t_lessonProgress.userId, userId),
    orderBy: (t_lessonProgress, { desc }) => [desc(t_lessonProgress.dateDone)],
  });
  return data;
});

export const getAllTLessonProgress = cache(async () => {
  const data = await db.query.t_lessonProgress.findMany({
    orderBy: (t_lessonProgress, { desc }) => [desc(t_lessonProgress.dateDone)],
  });
  return data;
});







// export const getUserHomework = cache(async (userId: string, courseId?: number) => {
//     if (!userId) return [];
    
//     const conditions = [eq(userHomework.userId, userId)];
//     if (courseId) {
//         conditions.push(eq(userHomework.courseId, courseId));
//     }
    
//     const homework = await db.query.userHomework.findMany({
//         where: and(...conditions),
//         orderBy: (homework, { desc }) => [desc(homework.dueDate)],
//     });
    
//     return homework.map(hw => ({
//         ...hw,
//         // Для задачника
//         challengeIdsList: hw.challengeIds ? hw.challengeIds.split(',').map(Number) : [],
//         // Для тренажера
//         tLessonIdsList: hw.tLessonIds ? hw.tLessonIds.split(',').map(Number) : [],
//         totalCount: hw.totalCount,
//     }));
// });

// db/queries.ts

export const getUserHomework = cache(async (userId: string, courseId?: number): Promise<HomeworkItem[]> => {
    if (!userId) return [];
    
    const conditions = [eq(userHomework.userId, userId)];
    if (courseId) {
        conditions.push(eq(userHomework.courseId, courseId));
    }
    
    const homework = await db.query.userHomework.findMany({
        where: and(...conditions),
        orderBy: (homework, { desc }) => [desc(homework.dueDate)],
    });
    
    // 🔥 Здесь уже будет поле type, если оно есть в схеме
    return homework.map(hw => ({
        ...hw,
        challengeIdsList: hw.challengeIds ? hw.challengeIds.split(',').map(Number) : [],
        tLessonIdsList: hw.tLessonIds ? hw.tLessonIds.split(',').map(Number) : [],
        totalCount: hw.totalCount,
        type: hw.type as 'teacher' | 'daily', // ← приводим тип
    }));
});





// Получить стрики пользователя
export const getUserStreaks = cache(async (userId: string) => {
    if (!userId) return { homeworkStreak: 0, trainerStreak: 0 };
    
    // Получаем последние выполненные ДЗ
    const recentHomework = await db.query.userHomework.findMany({
        where: eq(userHomework.userId, userId),
        orderBy: (homework, { desc }) => [desc(homework.dueDate)],
        limit: 30,
    });
    
    // Простой расчет стрика (можно улучшить)
    let homeworkStreak = 0;
    for (const hw of recentHomework) {
        if (hw.status === 'completed') {
            homeworkStreak++;
        } else {
            break;
        }
    }
    
    return {
        homeworkStreak,
        trainerStreak: 0, // TODO: добавить стрик для тренажера
    };
});









// db/queries.ts

// Получить сегодняшний квест тренажера
export const getTodayTrainerQuest = cache(async (userId: string, courseId: number) => {
    if (!userId) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const quest = await db.query.trainerQuests.findFirst({
        where: and(
            eq(trainerQuests.userId, userId),
            eq(trainerQuests.tCourseId, courseId),
            eq(trainerQuests.date, today)
        ),
    });
    
    return quest;
});








// ACHIEVEMENTS
//
// Получить все достижения пользователя
export const getUserAchievements = cache(async (userId: string) => {
    if (!userId) return [];
    
    const userAchievementsList = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
        with: {
            achievement: true,
        },
    });
    
    return userAchievementsList;
});

// Получить все достижения (список всех возможных)
export const getAllAchievements = cache(async () => {
    const allAchievements = await db.query.achievements.findMany({
        orderBy: (achievements, { asc }) => [asc(achievements.sortOrder)],
    });
    
    return allAchievements;
});

// Получить прогресс пользователя по достижениям
export const getUserAchievementsProgress = cache(async (userId: string) => {
    if (!userId) return [];
    
    const userAchievementsList = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
    });
    
    const allAchievements = await getAllAchievements();
    
    // Объединяем все достижения с прогрессом пользователя
    return allAchievements.map(ach => {
        const userAch = userAchievementsList.find(ua => ua.achievementId === ach.id);
        return {
            ...ach,
            progress: userAch?.progress || 0,
            isCompleted: userAch?.isCompleted || false,
            claimed: userAch?.claimed || false,
            completedAt: userAch?.completedAt || null,
        };
    });
});







export const getUserAchievementsWithDetails = cache(async (userId: string) => {
    if (!userId) return [];
    
    const allAchievements = await db.query.achievements.findMany({
        orderBy: (achievements, { asc }) => [asc(achievements.sortOrder)],
    });
    
    const userAchievementsList = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
    });
    
    return allAchievements.map(ach => {
        const userAch = userAchievementsList.find(ua => ua.achievementId === ach.id);
        return {
            id: ach.id,
            name: ach.name,
            description: ach.description,
            category: ach.category,
            requirement: ach.requirement,
            rewardPoints: ach.rewardPoints ?? 0,
            rewardGems: ach.rewardGems ?? 0,
            imageSrc: ach.imageSrc,
            sortOrder: ach.sortOrder ?? 0,
            progress: userAch?.progress || 0,
            isCompleted: userAch?.isCompleted || false,
            claimed: userAch?.claimed || false,
            completedAt: userAch?.completedAt || null,
        };
    });
});





// ШАХТЫ

export const getUserMines = cache(async (userId: string) => {
    if (!userId) return [];
    
    const mines = await db.query.userMines.findMany({
        where: eq(userMines.userId, userId),
        with: {
            mineType: true,
        },
    });
    
    return mines;
});






// Получить все типы шахт
export const getMineTypes = cache(async () => {
    const types = await db.query.mineTypes.findMany({
        orderBy: (mineTypes, { asc }) => [asc(mineTypes.priceGems)],
    });
    return types;
});











// db/queries.ts

// Получить все курсы пользователя (доступные)
export const getUserCourses = cache(async () => {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) return [];
    
    // Получаем все курсы из системы
    const allCourses = await db.query.courses.findMany();
    
    // Здесь можно отфильтровать по классу пользователя или подписке
    return allCourses;
});

// Получить стрик по конкретному курсу
export const getUserCourseStreak = cache(async (userId: string, courseId: number) => {
    if (!userId) return 0;
    
    const courseProgress = await db.query.userCourseProgress.findFirst({
        where: and(
            eq(userCourseProgress.userId, userId),
            eq(userCourseProgress.courseId, courseId)
        ),
    });
    
    return courseProgress?.streak || 0;
});

// Получить стрики для всех курсов
export const getAllUserCourseStreaks = cache(async (userId: string) => {
    if (!userId) return [];
    
    const allProgress = await db.query.userCourseProgress.findMany({
        where: eq(userCourseProgress.userId, userId),
    });
    
    return allProgress;
});


