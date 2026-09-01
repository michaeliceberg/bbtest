// app/actions/generate-trainer-quest.ts

'use server';

import db from '@/db/drizzle';
import { trainerQuests, t_lessons, t_units, t_courses, trainerStreaks, userHomework, t_lessonProgress, userDailyStats } from '@/db/schema';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getCourseStreak } from '@/lib/streak';

// Дневной квест раньше требовал пройти КОНКРЕТНЫЙ список из 3-5 случайно
// выбранных уроков темы ("почему именно эти номера?" — пользователь счёл
// это запутанным). Теперь квест из двух простых, общих для любой темы
// пунктов: любой 1 урок тренажёра + любая 1 задача курса — тот же смысл
// "позанимался сегодня и там, и там", без привязки к конкретным id.
const DAILY_QUEST_TOTAL = 2;

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

    // tLessonIds — колонка NOT NULL с более ранней модели (конкретный
    // список уроков квеста), сейчас не несёт смысла — пустая строка.
    const [quest] = await db.insert(trainerQuests).values({
        userId,
        tCourseId: tCourseId,
        date: today,
        tLessonIds: '',
        totalCount: DAILY_QUEST_TOTAL,
        completedCount: 0,
        isCompleted: false,
    }).returning();

    return quest;
}

export type DailyQuestStatus = {
    trainerDone: boolean;
    taskDone: boolean;
    isCompleted: boolean;
    streak: number;
};

// Заменяет старую пару generateDailyTrainerQuest+completeTrainerQuestLesson
// (клиент явно "отмечал" урок частью квеста через ?fromQuest=true) — оба
// пункта вычисляются LIVE из уже существующих источников правды при
// каждом заходе на /trainer, а не накапливаются вручную с клиента:
// - "Тренажёр" — сегодня пройден хотя бы 1 урок ЛЮБОЙ темы этого
//   t_course (trainingPts>0 — тот же признак настоящего завершения
//   основного прохода, что уже используется для XP/ачивок тренажёра).
// - "Задача" — сегодня решена хотя бы 1 задача ОСНОВНОГО курса,
//   привязанного к этой теме тренажёра (t_courses.courseId), через
//   userDailyStats.challengesRight — тот же счётчик, что уже
//   инкрементируется на каждый верный ответ (db/queries.ts).
// Пересчёт при каждом вызове исключает рассинхрон между реальным
// прогрессом и счётчиком квеста (старая версия могла разойтись, если
// урок был пройден до первого визита на /trainer за день).
export async function getDailyQuestStatus(tCourseId: number): Promise<DailyQuestStatus | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const quest = await generateDailyTrainerQuest(tCourseId);
    if (!quest) return null;

    let trainerDone = false;
    const units = await db.query.t_units.findMany({ where: eq(t_units.t_courseId, tCourseId) });
    const unitIds = units.map((u) => u.id);
    if (unitIds.length > 0) {
        const lessons = await db.query.t_lessons.findMany({ where: inArray(t_lessons.t_unitId, unitIds) });
        const lessonIds = lessons.map((l) => l.id);
        if (lessonIds.length > 0) {
            const todayProgress = await db.query.t_lessonProgress.findFirst({
                where: and(
                    eq(t_lessonProgress.userId, userId),
                    inArray(t_lessonProgress.t_lessonId, lessonIds),
                    gte(t_lessonProgress.trainingPts, 1),
                    gte(t_lessonProgress.dateDone, today),
                ),
            });
            trainerDone = !!todayProgress;
        }
    }

    let taskDone = false;
    const tCourse = await db.query.t_courses.findFirst({ where: eq(t_courses.id, tCourseId) });
    if (tCourse?.courseId) {
        const stats = await db.query.userDailyStats.findFirst({
            where: and(
                eq(userDailyStats.userId, userId),
                eq(userDailyStats.courseId, tCourse.courseId),
                eq(userDailyStats.date, today),
            ),
        });
        taskDone = (stats?.challengesRight ?? 0) > 0;
    }

    const completedCount = (trainerDone ? 1 : 0) + (taskDone ? 1 : 0);
    const isCompleted = completedCount >= DAILY_QUEST_TOTAL;
    const wasCompleted = quest.isCompleted === true;

    if (completedCount !== quest.completedCount || isCompleted !== wasCompleted) {
        await db.update(trainerQuests)
            .set({
                completedCount,
                isCompleted,
                completedAt: isCompleted && !wasCompleted ? new Date() : quest.completedAt,
                updatedAt: new Date(),
            })
            .where(eq(trainerQuests.id, quest.id));
    }

    if (isCompleted && !wasCompleted) {
        await updateTrainerStreak(userId, tCourseId);
    }

    const streakRow = await db.query.trainerStreaks.findFirst({
        where: and(eq(trainerStreaks.userId, userId), eq(trainerStreaks.tCourseId, tCourseId)),
    });

    return {
        trainerDone,
        taskDone,
        isCompleted,
        streak: streakRow?.currentStreak ?? 0,
    };
}



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
    // "Продли серию дней" (первая карточка экрана наград) — реальный
    // курсовый стрик (lib/streak.ts), а не заглушка. Уже продлён на
    // сегодня к этому моменту: upsertTrainerLessonProgress этой же
    // попытки вызывается РАНЬШЕ (см. TQUIZ.tsx), поэтому здесь только
    // читаем, не бампаем повторно.
    let courseStreak: number | null = null;
    const tCourse = await db.query.t_courses.findFirst({ where: eq(t_courses.id, tCourseId) });
    if (tCourse?.courseId) {
        courseStreak = await getCourseStreak(userId, tCourse.courseId);

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
        courseStreak,
    };
}