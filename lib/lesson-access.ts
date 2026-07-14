// lib/lesson-access.ts

import db from "@/db/drizzle";
import { challengeProgress, challenges, lessons, units } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";

const CONFIG = {
    // Для открытия следующего урока: нужно решить N challenge
    CHALLENGES_TO_UNLOCK_NEXT_LESSON: 4,
    
    // Для открытия следующего юнита: нужно, чтобы % уроков имели открытый следующий урок
    LESSONS_THRESHOLD_FOR_NEXT_UNIT: 0.5,
    
    // Для получения мастерства: нужно решить все challenge
    MASTERY_PERCENT: 1.0,
};

// ========== ТИПЫ ==========



export type LessonProgress = {
    total: number;
    correct: number;
    isEnoughToUnlockNext: boolean;
    isMastery: boolean;
    needMore: number;
    challengesNeeded: number;
};

export type UnitProgress = {
    totalLessons: number;
    lessonsWithNextUnlocked: number;
    fullyMasteredLessons: number;
    percent: number;
    isEnoughToUnlockNextUnit: boolean;
    isUnitCompleted: boolean;
    needMoreLessons: number;
};

export type LessonAccess = {
    isUnlocked: boolean;
    isCompleted: boolean;
    progress: number;
    totalChallenges: number;
    correctChallenges: number;
    needMore: number;
    challengesNeeded: number;
};

// export type UnitWithProgress = {
//     id: number;
//     title: string;
//     description: string;
//     imageSrc: string;
//     courseId: number;
//     order: number;
//     totalLessons: number;
//     lessonsWithNextUnlocked: number;
//     fullyMasteredLessons: number;
//     percent: number;
//     isEnoughToUnlockNextUnit: boolean;
//     isUnitCompleted: boolean;
//     needMoreLessons: number;
//     isUnlocked: boolean;
//     isNextUnitUnlocked: boolean;
//     isCompleted: boolean;
// };



export type UnitWithProgress = {
    id: number;
    title: string;
    description: string;
    imageSrc: string;
    courseId: number;
    order: number;
    totalLessons: number;
    lessonsWithNextUnlocked: number;
    fullyMasteredLessons: number;
    percent: number;
    isEnoughToUnlockNextUnit: boolean;
    isUnitCompleted: boolean;
    needMoreLessons: number;
    isUnlocked: boolean;
    isNextUnitUnlocked: boolean;
    isCompleted: boolean;
    // 🔥 Добавляем недостающее поле
    lessons: {
        id: number;
        title: string;
        order: number;
        unitId: number;
        completed: boolean;
        challenges: {
            id: number;
            type: string;
            question: string;
            order: number;
            points: number;
            author: string;
            difficulty: string;
            imageSrc: string;
            lessonId: number;
            challengeProgress?: {
                completed: boolean;
                doneRight: boolean;
            }[];
        }[];
    }[];
};


// ========== ФУНКЦИИ ==========

/**
 * Получить прогресс урока
 */
export async function getLessonProgress(userId: string, lessonId: number): Promise<LessonProgress> {
    noStore();
    
    const challengesInLesson = await db.query.challenges.findMany({
        where: eq(challenges.lessonId, lessonId),
    });
    
    const total = challengesInLesson.length;
    if (total === 0) {
        return {
            total: 0,
            correct: 0,
            isEnoughToUnlockNext: true,
            isMastery: true,
            needMore: 0,
            challengesNeeded: 0,
        };
    }
    
    const progressList = await db.query.challengeProgress.findMany({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.completed, true),
            eq(challengeProgress.doneRight, true)
        ),
    });
    
    const correct = progressList.filter((cp) =>
        challengesInLesson.some((c) => c.id === cp.challengeId)
    ).length;
    
    const challengesNeeded = Math.min(CONFIG.CHALLENGES_TO_UNLOCK_NEXT_LESSON, total);
    const isEnoughToUnlockNext = correct >= challengesNeeded;
    const isMastery = correct >= total;
    
    return {
        total,
        correct,
        isEnoughToUnlockNext,
        isMastery,
        needMore: Math.max(0, challengesNeeded - correct),
        challengesNeeded,
    };
}

/**
 * Получить прогресс юнита
 */
export async function getUnitProgress(userId: string, unitId: number): Promise<UnitProgress> {
    noStore();
    
    const lessonsInUnit = await db.query.lessons.findMany({
        where: eq(lessons.unitId, unitId),
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
    });
    
    let totalLessons = lessonsInUnit.length;
    let lessonsWithNextUnlocked = 0;
    let fullyMasteredLessons = 0;
    
    for (const lesson of lessonsInUnit) {
        const progress = await getLessonProgress(userId, lesson.id);
        if (progress.isEnoughToUnlockNext) {
            lessonsWithNextUnlocked++;
        }
        if (progress.isMastery) {
            fullyMasteredLessons++;
        }
    }
    
    const percent = totalLessons > 0 ? lessonsWithNextUnlocked / totalLessons : 0;
    const isEnoughToUnlockNextUnit = percent >= CONFIG.LESSONS_THRESHOLD_FOR_NEXT_UNIT;
    const isUnitCompleted = percent >= 1.0;
    
    return {
        totalLessons,
        lessonsWithNextUnlocked,
        fullyMasteredLessons,
        percent,
        isEnoughToUnlockNextUnit,
        isUnitCompleted,
        needMoreLessons: Math.max(
            0,
            Math.ceil(totalLessons * CONFIG.LESSONS_THRESHOLD_FOR_NEXT_UNIT) - lessonsWithNextUnlocked
        ),
    };
}

/**
 * Получить статус доступа к уроку (учитывая иерархию уроков и юнитов)
 */
export async function getLessonAccess(userId: string, lessonId: number): Promise<LessonAccess> {
    noStore();
    
    const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: { unit: true },
    });
    
    if (!lesson) {
        return {
            isUnlocked: false,
            isCompleted: false,
            progress: 0,
            needMore: 0,
            correctChallenges: 0,
            totalChallenges: 0,
            challengesNeeded: 0,
        };
    }
    
    const currentProgress = await getLessonProgress(userId, lessonId);
    
    // Проверяем предыдущий урок в этом же юните
    const prevLesson = await db.query.lessons.findFirst({
        where: and(
            eq(lessons.unitId, lesson.unitId),
            eq(lessons.order, lesson.order - 1)
        ),
    });
    
    let isPrevLessonUnlocked = true;
    if (prevLesson) {
        const prevProgress = await getLessonProgress(userId, prevLesson.id);
        isPrevLessonUnlocked = prevProgress.isEnoughToUnlockNext;
    }
    
    // Проверяем, открыт ли текущий юнит
    const isFirstUnit = lesson.unit.order === 1;
    let isUnitUnlocked = true;
    
    if (!isFirstUnit) {
        const prevUnit = await db.query.units.findFirst({
            where: and(
                eq(units.courseId, lesson.unit.courseId),
                eq(units.order, lesson.unit.order - 1)
            ),
        });
        
        if (prevUnit) {
            const prevUnitProgress = await getUnitProgress(userId, prevUnit.id);
            isUnitUnlocked = prevUnitProgress.isEnoughToUnlockNextUnit;
        }
    }
    
    const isUnlocked = isUnitUnlocked && isPrevLessonUnlocked;
    
    return {
        isUnlocked,
        isCompleted: currentProgress.isMastery,
        progress: currentProgress.total > 0 ? currentProgress.correct / currentProgress.total : 0,
        totalChallenges: currentProgress.total,
        correctChallenges: currentProgress.correct,
        needMore: currentProgress.needMore,
        challengesNeeded: currentProgress.challengesNeeded,
    };
}

/**
 * Получить все уроки юнита с их статусами (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
 */
export async function getUnitLessonsWithAccess(userId: string, unitId: number) {
    noStore();
    
    // Получаем все уроки юнита с их challenges и прогрессом
    const lessonsWithData = await db.query.lessons.findMany({
        where: eq(lessons.unitId, unitId),
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
            challenges: {
                with: {
                    challengeProgress: {
                        where: eq(challengeProgress.userId, userId),
                    },
                },
            },
        },
    });
    
    // Обрабатываем каждый урок
    return lessonsWithData.map(lesson => {
        const challenges = lesson.challenges;
        const totalChallenges = challenges.length;
        
        // Считаем правильно решенные задачи
        const correctChallenges = challenges.filter(c => 
            c.challengeProgress && c.challengeProgress.length > 0 && c.challengeProgress[0]?.doneRight
        ).length;
        
        const challengesNeeded = Math.min(CONFIG.CHALLENGES_TO_UNLOCK_NEXT_LESSON, totalChallenges);
        const isEnoughToUnlockNext = correctChallenges >= challengesNeeded;
        const isMastery = correctChallenges >= totalChallenges;
        
        return {
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            unitId: lesson.unitId,
            challenges: lesson.challenges,
            isUnlocked: true, // Будет обновлено позже на основе юнита
            isCompleted: isMastery,
            progress: totalChallenges > 0 ? correctChallenges / totalChallenges : 0,
            totalChallenges,
            correctChallenges,
            needMore: Math.max(0, challengesNeeded - correctChallenges),
            challengesNeeded,
            isEnoughToUnlockNext,
        };
    });
}





export const getAllUnitsLessonsWithAccess = cache(async (userId: string, courseId: number) => {
    noStore();
    
    // 1. Получаем все юниты курса с lessons и challenges
    const courseUnits = await db.query.units.findMany({
        where: eq(units.courseId, courseId),
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
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
    
    // 2. Вычисляем прогресс для каждого юнита
    const result: UnitWithProgress[] = [];
    
    for (let i = 0; i < courseUnits.length; i++) {
        const unit = courseUnits[i];
        const unitLessons = unit.lessons;
        
        // Вычисляем прогресс на основе уже загруженных данных (БЕЗ дополнительных запросов!)
        let lessonsWithNextUnlocked = 0;
        let fullyMasteredLessons = 0;
        
        for (const lesson of unitLessons) {
            const challenges = lesson.challenges;
            const correctCount = challenges.filter(c => 
                c.challengeProgress && c.challengeProgress.length > 0 && c.challengeProgress[0]?.doneRight
            ).length;
            
            const isEnoughToUnlockNext = correctCount >= 4;
            const isMastery = correctCount >= challenges.length;
            
            if (isEnoughToUnlockNext) lessonsWithNextUnlocked++;
            if (isMastery) fullyMasteredLessons++;
        }
        
        const totalLessons = unitLessons.length;
        const percent = totalLessons > 0 ? lessonsWithNextUnlocked / totalLessons : 0;
        const isPrevUnitUnlocked = i === 0 || result[i - 1]?.isNextUnitUnlocked;
        
        
result.push({
    id: unit.id,
    title: unit.title,
    description: unit.description,
    imageSrc: unit.imageSrc,
    courseId: unit.courseId,
    order: unit.order,
    lessons: unitLessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        unitId: lesson.unitId,
        completed: false,
        challenges: lesson.challenges.map(challenge => ({
            id: challenge.id,
            type: challenge.type,
            question: challenge.question,
            order: challenge.order,
            points: challenge.points,
            author: challenge.author,
            difficulty: challenge.difficulty,
            imageSrc: challenge.imageSrc,
            lessonId: challenge.lessonId,
            challengeProgress: challenge.challengeProgress,
        })),
    })),
    totalLessons,
    lessonsWithNextUnlocked,
    fullyMasteredLessons,
    percent,
    isEnoughToUnlockNextUnit: percent >= 0.5,
    isUnitCompleted: percent >= 1.0,
    needMoreLessons: Math.max(0, Math.ceil(totalLessons * 0.5) - lessonsWithNextUnlocked),
    isUnlocked: isPrevUnitUnlocked,
    isNextUnitUnlocked: percent >= 0.5,
    isCompleted: percent >= 1.0,
});
    }
    
    return result;
});




/**
 * Получить все уроки курса с их статусами (использует оптимизированную версию)
 */
export async function getCourseUnitsWithProgress(userId: string, courseId: number): Promise<UnitWithProgress[]> {
    noStore();
    return getAllUnitsLessonsWithAccess(userId, courseId);
}

/**
 * Проверить, открыт ли урок для пользователя
 */
export async function isLessonUnlocked(userId: string, lessonId: number): Promise<boolean> {
    noStore();
    const access = await getLessonAccess(userId, lessonId);
    return access.isUnlocked;
}

/**
 * Получить следующий незаблокированный урок для пользователя
 */
export async function getNextUnlockedLesson(userId: string, courseId: number): Promise<number | null> {
    noStore();
    
    const unitsWithProgress = await getCourseUnitsWithProgress(userId, courseId);
    
    for (const unit of unitsWithProgress) {
        if (!unit.isUnlocked && !unit.isCompleted) continue;
        
        const lessonsWithAccess = await getUnitLessonsWithAccess(userId, unit.id);
        
        for (const lesson of lessonsWithAccess) {
            if (lesson.isUnlocked && !lesson.isCompleted) {
                return lesson.id;
            }
        }
    }
    
    return null;
}

