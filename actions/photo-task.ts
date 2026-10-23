'use server';

// actions/photo-task.ts — «Сфоткай задачу»: ученик присылает фото, получает уроки тренажёра (lib/photoTask.ts).
// Лимит: без PRO — FREE_AI_PHOTOS за всё время, с PRO — PHOTO_TASK_DAILY_LIMIT в день (админам без лимита). Неудачные разборы в лимит не идут.

import { sql } from 'drizzle-orm';
import db from '@/db/drizzle';
import { photoTaskRequests, userProgress } from '@/db/schema';
import { auth } from '@/lib/server-auth';
import { eq } from 'drizzle-orm';
import { getPhotoTaskCatalog, photoTaskConfigured, runPhotoTask, PHOTO_TASK_DAILY_LIMIT } from '@/lib/photoTask';
import { syncAchievements } from '@/lib/achievements';
import { sendMessageToTelegram } from '@/utils/telegram';
import { FREE_AI_PHOTOS, PREMIUM_PRICE_RUB, hasProFor } from '@/lib/pro';

export type PhotoTaskLesson = { id: number; course: string; unit: string; lesson: string }
export type PhotoTaskResult =
    | { ok: true; problemText: string; lessons: PhotoTaskLesson[]; bonusLessons: PhotoTaskLesson[]; missingTopics: string[]; hint: string; readable: boolean; left: number | null }
    | { ok: false; error: 'auth' | 'not_configured' | 'limit' | 'bad_image' | 'failed'; left?: number | null }

const MAX_B64 = 1_400_000 // ~1 МБ картинки; клиент ужимает фото до 1280 px, этого с запасом хватает

// Без PRO — FREE_AI_PHOTOS разборов за всё время (попробовать), с PRO — PHOTO_TASK_DAILY_LIMIT в день.
export type PhotoQuota = { left: number; limit: number; mode: 'free' | 'pro' } | null // null — без лимита (админ)

const quotaFor = async (userId: string, up: Parameters<typeof hasProFor>[0]): Promise<PhotoQuota> => {
    if (up?.isAdmin === 1) return null;
    if (hasProFor(up)) {
        const used = await usedToday(userId);
        return { left: Math.max(0, PHOTO_TASK_DAILY_LIMIT - used), limit: PHOTO_TASK_DAILY_LIMIT, mode: 'pro' };
    }
    const used = await usedEver(userId);
    return { left: Math.max(0, FREE_AI_PHOTOS - used), limit: FREE_AI_PHOTOS, mode: 'free' };
};

export async function getPhotoTasksLeft(): Promise<PhotoQuota> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { left: 0, limit: FREE_AI_PHOTOS, mode: 'free' };
    const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
    return quotaFor(userId, up);
}

const usedEver = async (userId: string) => {
    const r = await db.execute(sql`SELECT count(*)::int AS n FROM photo_task_requests WHERE user_id = ${userId} AND error IS NULL`);
    return (r as unknown as { n: number }[])[0]?.n ?? 0;
};

const usedToday = async (userId: string) => {
    const r = await db.execute(sql`SELECT count(*)::int AS n FROM photo_task_requests
        WHERE user_id = ${userId} AND error IS NULL AND created_at >= date_trunc('day', now())`);
    return (r as unknown as { n: number }[])[0]?.n ?? 0;
};

export async function analyzeTaskPhoto(imageB64: string, mediaType: string): Promise<PhotoTaskResult> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { ok: false, error: 'auth' };
    if (!photoTaskConfigured()) return { ok: false, error: 'not_configured' };
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType) || !imageB64 || imageB64.length > MAX_B64) {
        return { ok: false, error: 'bad_image' };
    }
    const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
    const quota = await quotaFor(userId, up);
    if (quota && quota.left <= 0) return { ok: false, error: 'limit', left: 0 };

    try {
        const run = await runPhotoTask(imageB64, mediaType as 'image/jpeg' | 'image/png' | 'image/webp');
        const a = run.answer;
        await db.insert(photoTaskRequests).values({
            userId, model: run.model, escalated: run.escalated, readable: a.readable, confidence: a.confidence,
            problemText: a.problem_text.slice(0, 4000), topics: a.topics, lessonIds: a.lesson_ids, missingTopics: a.missing_topics,
            inputTokens: run.inputTokens, outputTokens: run.outputTokens, bonusLessonIds: a.bonus_lesson_ids,
        });
        // Ачивки «Первый скан», «Первооткрыватель» и т.п. — тост клиент заберёт сам (checkAchievements).
        await syncAchievements(userId).catch(() => {});
        // Темы, под которые у нас нет уроков, — сразу админу: это список «какие тренажёры делать дальше».
        if (a.readable && a.missing_topics.length > 0) {
            const name = up?.nickname || up?.userName || userId;
            const covered = a.lesson_ids.length > 0 ? `уроки нашлись частично (${a.lesson_ids.length})` : '0 подходящих уроков';
            await sendMessageToTelegram(
                `📸 *Билд на задачу: не хватает тем*\n${a.missing_topics.map((t) => `• ${t}`).join('\n')}\n\n${covered}\nУченик: ${name}\nЗадача: ${a.problem_text.slice(0, 300)}\n\nВсе темы: ggege.ru/admin/build-topics`,
            ).catch(() => {});
        }
        const catalog = await getPhotoTaskCatalog();
        const pick = (ids: number[]) => ids
            .map((id) => catalog.find((l) => l.id === id))
            .filter((l): l is NonNullable<typeof l> => !!l)
            .map(({ id, course, unit, lesson }) => ({ id, course, unit, lesson }));
        const lessons = pick(a.lesson_ids);
        const bonusLessons = pick(a.bonus_lesson_ids);
        return {
            ok: true, readable: a.readable, problemText: a.problem_text, lessons, bonusLessons,
            missingTopics: a.missing_topics, hint: a.hint, left: quota ? quota.left - 1 : null,
        };
    } catch (e) {
        console.error('analyzeTaskPhoto', e);
        await db.insert(photoTaskRequests).values({ userId, error: String((e as Error)?.message ?? e).slice(0, 500) }).catch(() => {});
        return { ok: false, error: 'failed', left: quota ? quota.left : null };
    }
}

// Premium «Полное решение по шагам» — пока «фейковая дверь» (как PRO): считаем, сколько людей открыли
// экран цены и сколько нажали «Хочу». Денег не берём. События — в pro_interest ('premium_view' / 'premium_want').
export async function premiumInterest(event: 'view' | 'want', source = 'build'): Promise<{ ok: boolean; already?: boolean }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { ok: false };
    if (event === 'view') {
        await db.execute(sql`INSERT INTO pro_interest (user_id, event, source) VALUES (${userId}, 'premium_view', ${source})`);
        return { ok: true };
    }
    const had = (await db.execute(sql`SELECT 1 FROM pro_interest WHERE user_id = ${userId} AND event = 'premium_want' LIMIT 1`)) as unknown as unknown[];
    if (had.length) return { ok: true, already: true };
    await db.execute(sql`INSERT INTO pro_interest (user_id, event, source) VALUES (${userId}, 'premium_want', ${source})`);
    const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
    const cnt = (await db.execute(sql`SELECT count(*)::int AS n FROM pro_interest WHERE event = 'premium_want'`)) as unknown as { n: number }[];
    await sendMessageToTelegram(
        `💎 *Хочет Premium* (${PREMIUM_PRICE_RUB} ₽/мес, полное решение по шагам)\n${up?.nickname || up?.userName || userId}\nВсего заявок: ${cnt[0]?.n ?? '?'}`,
    ).catch(() => {});
    return { ok: true };
}

// Админ: «урок по теме сделан» → ученикам, у которых была эта тема в недостающих, — ачивка «Соавтор»
// (тост при следующем заходе) и сообщение в Telegram, если вход через Telegram.
export async function markBuildTopicCovered(formData: FormData): Promise<void> {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) return;
    const me = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, adminId) });
    if (me?.isAdmin !== 1) return;
    const topic = String(formData.get('topic') ?? '').trim();
    const lessonId = Number(formData.get('lessonId'));
    if (!topic || !Number.isInteger(lessonId) || lessonId <= 0) return;
    await db.execute(sql`INSERT INTO photo_topic_covered (topic, lesson_id) VALUES (${topic}, ${lessonId})`);
    const users = (await db.execute(sql`
        SELECT DISTINCT p.user_id, i.provider_account_id AS tg FROM photo_task_requests p
        LEFT JOIN identities i ON i.user_id = p.user_id AND i.provider = 'telegram'
        WHERE coalesce(p.missing_topics, '[]'::jsonb) ? ${topic}`)) as unknown as { user_id: string; tg: string | null }[];
    for (const u of users) {
        await syncAchievements(u.user_id).catch(() => {});
        if (u.tg) {
            await sendMessageToTelegram(
                `🎩 Ты — соавтор! Помнишь задачу, под которую у нас не было урока («${topic}»)? Мы его сделали: ggege.ru/t-lesson/${lessonId}\nЗа это тебе ачивка «Соавтор» и кусочек пиццы 🍕`,
                u.tg,
            ).catch(() => {});
        }
    }
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/build-topics');
}
