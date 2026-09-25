// app/actions/generate-trainer-quest.ts

'use server';

import db from '@/db/drizzle';
import { trainerQuests, t_lessons, t_units, t_courses, trainerStreaks, userHomework, t_lessonProgress, userDailyStats, userProgress, questPoints } from '@/db/schema';
import { getLessonCasePool, type LessonCaseTier } from '@/lib/caseRewards';
import { applyCaseReward, type OpenCaseResult } from '@/lib/caseApply';
import { and, eq, gte, inArray, lt, sql, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getCourseStreak } from '@/lib/streak';

// Дневной квест раньше требовал пройти КОНКРЕТНЫЙ список из 3-5 случайно
// выбранных уроков темы ("почему именно эти номера?" — пользователь счёл
// это запутанным). Теперь квест из двух простых, общих для любой темы
// пунктов: любой 1 урок тренажёра + любая 1 задача курса — тот же смысл
// "позанимался сегодня и там, и там", без привязки к конкретным id.
const DAILY_QUEST_TOTAL = 2;

// Замена старого "Челлендж дня" (components/homework-list.tsx,
// userHomework type='daily', см. actions/generate-homework.ts) — та же
// идея дедлайн-давления/очковых бонусов/истории, но БЕЗ жёстко
// зафиксированных id задач (пользователь явно попросил объединить два
// параллельных виджета в один, оставив гибкость "любая задача/любой
// урок" от "Квест дня"). Очковый бонус — того же порядка, что был у
// старого "Челлендж дня" (DAILY_HOMEWORK_SIZE=2 × 5 очков = 10).
const QUEST_POINT_REWARD = 10;

// Столько последних дней показываем в истории (свёрнутый список
// выполнено/просрочено под карточкой) — тот же смысл, что был у
// "Просроченные"/"Выполненные" в старом HomeworkList, не бесконечный
// архив.
const QUEST_HISTORY_DAYS = 10;

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
    // true ТОЛЬКО в тот самый вызов, где completedCount пересёк
    // DAILY_QUEST_TOTAL (переход false→true) — используется как триггер
    // модалки-поздравления (components/quest-complete-modal.tsx), а не
    // isCompleted напрямую, иначе модалка показывалась бы повторно на
    // КАЖДОМ следующем заходе/действии в тот же день, когда квест уже
    // давно выполнен.
    justCompleted: boolean;
    streak: number;
    // Конец дедлайна — не отдельная колонка в БД, а просто конец
    // календарного дня, которому принадлежит quest.date (тот же день,
    // что уже определяет "какой именно квест сегодняшний"). Сериализуется
    // в ISO-строку — проп клиентского компонента, Date через границу
    // Server→Client Component не проходит напрямую.
    dueDateIso: string;
    pointsReward: number;
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
        // Очковый бонус — ровно один раз, в момент самого перехода
        // false→true (тот же guard, что уже используется для стрика
        // чуть выше) — повторные вызовы getDailyQuestStatus в течение
        // того же дня (при каждом заходе на /trainer или /learn) не
        // начисляют его снова, wasCompleted уже true.
        await db.update(userProgress)
            .set({ points: sql`${userProgress.points} + ${QUEST_POINT_REWARD}` })
            .where(eq(userProgress.userId, userId));
    }

    const streakRow = await db.query.trainerStreaks.findFirst({
        where: and(eq(trainerStreaks.userId, userId), eq(trainerStreaks.tCourseId, tCourseId)),
    });

    const dueDate = new Date(quest.date);
    dueDate.setDate(dueDate.getDate() + 1);

    return {
        trainerDone,
        taskDone,
        isCompleted,
        justCompleted: isCompleted && !wasCompleted,
        streak: streakRow?.currentStreak ?? 0,
        dueDateIso: dueDate.toISOString(),
        pointsReward: QUEST_POINT_REWARD,
    };
}

export type QuestHistoryEntry = {
    date: string;
    isCompleted: boolean;
};

// История последних дней — тот же смысл, что был у "Просроченные"/
// "Выполненные" в старом HomeworkList (components/homework-list.tsx),
// но по квестам, а не по конкретным задачам. Сегодняшний день намеренно
// исключён (`lt`, не `lte`) — статус "сегодня" уже полностью покрыт
// основной карточкой, дублировать его в истории незачем.
export async function getRecentQuestHistory(tCourseId: number): Promise<QuestHistoryEntry[]> {
    const session = await auth();
    if (!session?.user?.id) return [];
    const userId = session.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await db.query.trainerQuests.findMany({
        where: and(
            eq(trainerQuests.userId, userId),
            eq(trainerQuests.tCourseId, tCourseId),
            lt(trainerQuests.date, today),
        ),
        orderBy: [desc(trainerQuests.date)],
        limit: QUEST_HISTORY_DAYS,
    });

    return rows.map((r) => ({
        date: r.date.toISOString(),
        isCompleted: r.isCompleted === true,
    }));
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
// Квесты дня экрана квестов тренажёра (2026-09-25). Каждый — со своей
// наградой-кейсом (tier) и +1 квест-поинт при выполнении (questPoints, для
// аналитики по месяцам). Кейс забирается кнопкой на экране (claimQuestCase).
export type DailyQuestKey = 'streak' | 'perfect' | 'combo8' | 'hw';
export type DailyQuest = {
    key: DailyQuestKey;
    progress: number;
    target: number;
    done: boolean;
    claimed: boolean;
    tier: LessonCaseTier;
    streakDays?: number | null;
};
export type DailyQuestsData = { quests: DailyQuest[]; monthPoints: number; monthIndex: number };

const COMBO8_TARGET = 3;
const QUEST_TIER: Record<DailyQuestKey, LessonCaseTier> = { streak: 'common', perfect: 'rare', combo8: 'mythic', hw: 'mega' };

// Состояние квестов дня для пользователя/темы: считает прогресс, начисляет
// квест-поинты за выполненные (уникально user+key+date — повтор игнорируется).
async function buildDailyQuests(userId: string, tCourseId: number, quest: typeof trainerQuests.$inferSelect, today: Date): Promise<DailyQuestsData> {
    const claimed = new Set((quest.claimedQuests ?? '').split(',').filter(Boolean));
    const tCourse = await db.query.t_courses.findFirst({ where: eq(t_courses.id, tCourseId) });

    let courseStreak: number | null = null;
    let hw: { done: number; total: number } | null = null;
    if (tCourse?.courseId) {
        courseStreak = await getCourseStreak(userId, tCourse.courseId);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const rows = await db.select({ status: userHomework.status })
            .from(userHomework)
            .where(and(
                eq(userHomework.userId, userId),
                eq(userHomework.courseId, tCourse.courseId),
                gte(userHomework.dueDate, today),
                lt(userHomework.dueDate, tomorrow),
            ));
        if (rows.length > 0) hw = { total: rows.length, done: rows.filter((r) => r.status === 'completed').length };
    }

    const perfect = quest.perfectLessonCount ?? 0;
    const combo8 = quest.combo8Count ?? 0;
    const list: DailyQuest[] = [
        // Урок тренажёра завершён сегодня — день серии уже засчитан.
        { key: 'streak', progress: 1, target: 1, done: true, claimed: claimed.has('streak'), tier: QUEST_TIER.streak, streakDays: courseStreak },
        { key: 'perfect', progress: Math.min(perfect, PERFECT_TARGET), target: PERFECT_TARGET, done: perfect >= PERFECT_TARGET, claimed: claimed.has('perfect'), tier: QUEST_TIER.perfect },
        { key: 'combo8', progress: Math.min(combo8, COMBO8_TARGET), target: COMBO8_TARGET, done: combo8 >= COMBO8_TARGET, claimed: claimed.has('combo8'), tier: QUEST_TIER.combo8 },
    ];
    // Квест ДЗ — только если на сегодня есть домашние задания.
    if (hw) list.push({ key: 'hw', progress: hw.done, target: hw.total, done: hw.done >= hw.total, claimed: claimed.has('hw'), tier: QUEST_TIER.hw });

    // +1 квест-поинт за каждый выполненный квест (повтор в тот же день — игнор).
    const done = list.filter((q) => q.done);
    if (done.length > 0) {
        await db.insert(questPoints)
            .values(done.map((q) => ({ userId, questKey: q.key, date: today })))
            .onConflictDoNothing();
    }

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(questPoints)
        .where(and(eq(questPoints.userId, userId), gte(questPoints.date, monthStart)));

    return { quests: list, monthPoints: count, monthIndex: today.getMonth() };
}

async function getOrCreateTodayQuest(userId: string, t_lessonId: number) {
    const lesson = await db.query.t_lessons.findFirst({
        where: eq(t_lessons.id, t_lessonId),
        with: { t_unit: true },
    });
    const tCourseId = lesson?.t_unit?.t_courseId;
    if (!tCourseId) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let quest = (await db.query.trainerQuests.findFirst({
        where: and(eq(trainerQuests.userId, userId), eq(trainerQuests.tCourseId, tCourseId), eq(trainerQuests.date, today)),
    })) ?? null;
    // Урок мог быть пройден раньше первого визита на /trainer сегодня.
    if (!quest) quest = (await generateDailyTrainerQuest(tCourseId)) ?? null;
    if (!quest) return null;
    return { quest, tCourseId, today };
}

// Вызывается в конце урока тренажёра (после основного прохода и работы над
// ошибками): учитывает урок в квестах дня и возвращает их состояние.
export async function reportLessonQuestSignals(t_lessonId: number, maxStreak: number, isPerfect: boolean): Promise<DailyQuestsData | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    const userId = session.user.id;
    const ctx = await getOrCreateTodayQuest(userId, t_lessonId);
    if (!ctx) return null;
    const { quest, tCourseId, today } = ctx;

    const [updated] = await db.update(trainerQuests)
        .set({
            perfectLessonCount: Math.min((quest.perfectLessonCount ?? 0) + (isPerfect ? 1 : 0), PERFECT_TARGET),
            combo8Count: Math.min((quest.combo8Count ?? 0) + (maxStreak >= 8 ? 1 : 0), COMBO8_TARGET),
            updatedAt: new Date(),
        })
        .where(eq(trainerQuests.id, quest.id))
        .returning();

    return buildDailyQuests(userId, tCourseId, updated ?? quest, today);
}

// Забрать кейс за выполненный квест дня: сервер сам проверяет, что квест
// выполнен и кейс ещё не забран сегодня, отмечает его и выдаёт награду
// (редкость — по квесту, см. QUEST_TIER). Клиент только крутит барабан.
export async function claimQuestCase(t_lessonId: number, key: DailyQuestKey): Promise<OpenCaseResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Не авторизован' };
    const userId = session.user.id;
    const ctx = await getOrCreateTodayQuest(userId, t_lessonId);
    if (!ctx) return { success: false, error: 'Квест не найден' };
    const { quest, tCourseId, today } = ctx;

    const data = await buildDailyQuests(userId, tCourseId, quest, today);
    const q = data.quests.find((x) => x.key === key);
    if (!q || !q.done) return { success: false, error: 'Квест ещё не выполнен' };
    if (q.claimed) return { success: false, error: 'Кейс уже получен' };

    // Отмечаем, только если ключа ещё нет (защита от двойного клика).
    const marked = await db.update(trainerQuests)
        .set({ claimedQuests: sql`CASE WHEN ${trainerQuests.claimedQuests} = '' THEN ${key} ELSE ${trainerQuests.claimedQuests} || ',' || ${key} END` })
        .where(and(
            eq(trainerQuests.id, quest.id),
            sql`NOT (',' || ${trainerQuests.claimedQuests} || ',' LIKE ${'%,' + key + ',%'})`,
        ))
        .returning({ id: trainerQuests.id });
    if (marked.length === 0) return { success: false, error: 'Кейс уже получен' };

    return applyCaseReward(getLessonCasePool(q.tier));
}
