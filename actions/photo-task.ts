'use server';

// actions/photo-task.ts — «Сфоткай задачу»: ученик присылает фото, получает уроки тренажёра (lib/photoTask.ts).
// Лимит PHOTO_TASK_DAILY_LIMIT разборов в день (админам без лимита). Неудачные разборы в лимит не идут.

import { sql } from 'drizzle-orm';
import db from '@/db/drizzle';
import { photoTaskRequests, userProgress } from '@/db/schema';
import { auth } from '@/lib/server-auth';
import { eq } from 'drizzle-orm';
import { getPhotoTaskCatalog, photoTaskConfigured, runPhotoTask, PHOTO_TASK_DAILY_LIMIT } from '@/lib/photoTask';

export type PhotoTaskLesson = { id: number; course: string; unit: string; lesson: string }
export type PhotoTaskResult =
    | { ok: true; problemText: string; lessons: PhotoTaskLesson[]; missingTopics: string[]; hint: string; readable: boolean; left: number | null }
    | { ok: false; error: 'auth' | 'not_configured' | 'limit' | 'bad_image' | 'failed'; left?: number | null }

const MAX_B64 = 1_400_000 // ~1 МБ картинки; клиент ужимает фото до 1280 px, этого с запасом хватает

export async function getPhotoTasksLeft(): Promise<number | null> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return 0;
    const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
    if (up?.isAdmin === 1) return null;
    const used = await usedToday(userId);
    return Math.max(0, PHOTO_TASK_DAILY_LIMIT - used);
}

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
    const isAdmin = up?.isAdmin === 1;
    const used = isAdmin ? 0 : await usedToday(userId);
    if (!isAdmin && used >= PHOTO_TASK_DAILY_LIMIT) return { ok: false, error: 'limit', left: 0 };

    try {
        const run = await runPhotoTask(imageB64, mediaType as 'image/jpeg' | 'image/png' | 'image/webp');
        const a = run.answer;
        await db.insert(photoTaskRequests).values({
            userId, model: run.model, escalated: run.escalated, readable: a.readable, confidence: a.confidence,
            problemText: a.problem_text.slice(0, 4000), topics: a.topics, lessonIds: a.lesson_ids, missingTopics: a.missing_topics,
            inputTokens: run.inputTokens, outputTokens: run.outputTokens,
        });
        const catalog = await getPhotoTaskCatalog();
        const lessons = a.lesson_ids
            .map((id) => catalog.find((l) => l.id === id))
            .filter((l): l is NonNullable<typeof l> => !!l)
            .map(({ id, course, unit, lesson }) => ({ id, course, unit, lesson }));
        return {
            ok: true, readable: a.readable, problemText: a.problem_text, lessons,
            missingTopics: a.missing_topics, hint: a.hint, left: isAdmin ? null : Math.max(0, PHOTO_TASK_DAILY_LIMIT - used - 1),
        };
    } catch (e) {
        console.error('analyzeTaskPhoto', e);
        await db.insert(photoTaskRequests).values({ userId, error: String((e as Error)?.message ?? e).slice(0, 500) }).catch(() => {});
        return { ok: false, error: 'failed', left: isAdmin ? null : Math.max(0, PHOTO_TASK_DAILY_LIMIT - used) };
    }
}
