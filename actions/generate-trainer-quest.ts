// app/actions/generate-trainer-quest.ts

'use server';

import db from '@/db/drizzle';
import { trainerQuests, t_lessons, t_courses, userHomework, questPoints } from '@/db/schema';
import { getLessonCasePool, type LessonCaseTier } from '@/lib/caseRewards';
import { applyCaseReward, type OpenCaseResult } from '@/lib/caseApply';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// «Испытания дня» — награды за качество на экране после урока (components/trainer-quest-rewards-screen.tsx).
// Сама ежедневная цель теперь сет (lib/egeMove.ts), а огонёк — закуска (lib/streak.ts). Таблица trainer_quests —
// дневные счётчики испытаний; старый «Квест дня» с серией «x1» убран 2026-11-06.
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
// Испытания дня (2026-09-25). Каждый — со своей
// наградой-кейсом (tier) и +1 квест-поинт при выполнении (questPoints, для
// аналитики по месяцам). Кейс забирается кнопкой на экране (claimQuestCase).
export type DailyQuestKey = 'perfect' | 'combo8' | 'hw';
export type DailyQuest = {
    key: DailyQuestKey;
    progress: number;
    target: number;
    done: boolean;
    claimed: boolean;
    tier: LessonCaseTier;
    // Прогресс ДО этого урока — экран анимирует заполнение только у квестов,
    // где он изменился (от prevProgress до progress); нет поля — без анимации.
    prevProgress?: number;
    // Квест принёс квест-поинт именно сейчас (для «+1» на карточке).
    pointNow?: boolean;
};
// earnedNow — сколько квест-поинтов начислено именно этим вызовом (для «+N квест-поинт!»).
export type DailyQuestsData = { quests: DailyQuest[]; monthPoints: number; monthIndex: number; earnedNow: number };

const COMBO8_TARGET = 3;
const QUEST_TIER: Record<DailyQuestKey, LessonCaseTier> = { perfect: 'rare', combo8: 'mythic', hw: 'mega' };

// Состояние квестов дня для пользователя/темы: считает прогресс, начисляет
// квест-поинты за выполненные (уникально user+key+date — повтор игнорируется).
async function buildDailyQuests(userId: string, tCourseId: number, quest: typeof trainerQuests.$inferSelect, today: Date, prev?: { perfect: number; combo8: number }): Promise<DailyQuestsData> {
    const claimed = new Set((quest.claimedQuests ?? '').split(',').filter(Boolean));
    const tCourse = await db.query.t_courses.findFirst({ where: eq(t_courses.id, tCourseId) });

    let hw: { done: number; total: number } | null = null;
    if (tCourse?.courseId) {
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
        { key: 'perfect', progress: Math.min(perfect, PERFECT_TARGET), target: PERFECT_TARGET, done: perfect >= PERFECT_TARGET, claimed: claimed.has('perfect'), tier: QUEST_TIER.perfect },
        { key: 'combo8', progress: Math.min(combo8, COMBO8_TARGET), target: COMBO8_TARGET, done: combo8 >= COMBO8_TARGET, claimed: claimed.has('combo8'), tier: QUEST_TIER.combo8 },
    ];
    // Квест ДЗ — только если на сегодня есть домашние задания.
    if (hw) list.push({ key: 'hw', progress: hw.done, target: hw.total, done: hw.done >= hw.total, claimed: claimed.has('hw'), tier: QUEST_TIER.hw });

    // +1 квест-поинт за каждый выполненный квест (повтор в тот же день — игнор).
    const done = list.filter((q) => q.done);
    let earnedNow = 0;
    const pointKeys = new Set<string>();
    if (done.length > 0) {
        const inserted = await db.insert(questPoints)
            .values(done.map((q) => ({ userId, questKey: q.key, date: today })))
            .onConflictDoNothing()
            .returning({ questKey: questPoints.questKey });
        earnedNow = inserted.length;
        inserted.forEach((r) => pointKeys.add(r.questKey));
    }
    // Прогресс до урока (только когда вызов — из конца урока, prev передан):
    // perfect/combo8 — значения счётчиков до обновления; ДЗ — если квест
    // выполнился именно сейчас (поинт начислен сейчас), значит шаг был последним.
    if (prev) {
        for (const q of list) {
            q.pointNow = pointKeys.has(q.key);
            if (q.key === 'perfect') q.prevProgress = Math.min(prev.perfect, q.target);
            else if (q.key === 'combo8') q.prevProgress = Math.min(prev.combo8, q.target);
            else q.prevProgress = q.pointNow ? q.target - 1 : q.progress;
        }
    }

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
        .from(questPoints)
        .where(and(eq(questPoints.userId, userId), gte(questPoints.date, monthStart)));

    return { quests: list, monthPoints: count, monthIndex: today.getMonth(), earnedNow };
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

    return buildDailyQuests(userId, tCourseId, updated ?? quest, today, {
        perfect: quest.perfectLessonCount ?? 0,
        combo8: quest.combo8Count ?? 0,
    });
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
