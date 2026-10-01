'use server';

// actions/lesson-rating.ts — оценка урока учеником (см. lessonRatings в схеме).
// Один ученик — одна оценка на урок (повторная перезаписывает). Любая оценка
// (с комментарием, если есть) сразу летит админу в Telegram.

import { and, eq } from 'drizzle-orm';
import db from '@/db/drizzle';
import { lessonRatings, t_lessons } from '@/db/schema';
import { auth } from '@/lib/server-auth';
import { sendMessageToTelegram } from '@/utils/telegram';
import { LESSON_RATING_OPTIONS } from '@/lib/lessonRating';

export async function submitLessonRating(tLessonId: number, score: number, comment?: string) {
	if (!Number.isInteger(score) || score < 1 || score > LESSON_RATING_OPTIONS.length) return { ok: false };
	const session = await auth();
	const userId = session?.user?.id ?? null;
	const cleanComment = comment?.trim().slice(0, 1000) || null;

	const existing = userId
		? await db.query.lessonRatings.findFirst({
			where: and(eq(lessonRatings.userId, userId), eq(lessonRatings.tLessonId, tLessonId)),
		})
		: null;
	if (existing) {
		await db.update(lessonRatings).set({ score, comment: cleanComment, createdAt: new Date() }).where(eq(lessonRatings.id, existing.id));
	} else {
		await db.insert(lessonRatings).values({ tLessonId, userId, score, comment: cleanComment });
	}

	{
		const lesson = await db.query.t_lessons.findFirst({ where: eq(t_lessons.id, tLessonId), columns: { title: true } });
		const opt = LESSON_RATING_OPTIONS[score - 1];
		await sendMessageToTelegram(
			`${opt.emoji} Урок «${lesson?.title ?? tLessonId}» (id ${tLessonId}) оценили: ${score + 1}/5 — ${opt.label}` +
			(cleanComment ? `\nНепонятно: ${cleanComment}` : '') +
			(userId ? `\nКто: ${session?.user?.name ?? userId}` : '\n(гость)'),
		).catch(() => null);
	}
	return { ok: true };
}
