// actions/plan-lesson-case.ts
//
// Конец урока тренажёра: СЕРВЕР решает, какой кейс (если вообще) положен, и
// выдаёт ключ нужной редкости. Тип этапа (сундук/мегасундук/мифический/экзамен)
// сервер считает сам по позиции и названию урока — клиент ничего не заявляет,
// кроме числа ошибок. Сам кейс открывается по ключу (actions/open-key-case.ts).

'use server';

import db from '@/db/drizzle';
import { t_lessons, t_lessonProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, sql } from 'drizzle-orm';
import { getStageFlags } from '@/lib/trainerStageFlags';
import { grantCaseKey, type GrantedKey } from '@/lib/caseKeys';
import { rollLessonCaseTier } from '@/lib/lessonCaseRoll';
import type { LessonCaseTier } from '@/lib/caseRewards';

export type PlannedLessonCase = {
	key: GrantedKey | null;
	chainBonus: number | null;
	chainCount: number;
	chainAlive: boolean;
};

const EMPTY: PlannedLessonCase = { key: null, chainBonus: null, chainCount: 0, chainAlive: false };
const today = () => new Date().toISOString().slice(0, 10);

export async function planLessonCase(t_lessonId: number, mistakes: number): Promise<PlannedLessonCase> {
	const session = await auth();
	if (!session?.user?.id) return EMPTY;
	const userId = session.user.id;

	const lesson = await db.query.t_lessons.findFirst({
		where: eq(t_lessons.id, t_lessonId),
		with: { t_unit: { with: { t_lessons: { orderBy: (l, { asc }) => [asc(l.order)] } } } },
	});
	if (!lesson) return EMPTY;
	const siblings = lesson.t_unit.t_lessons;
	const idx = Math.max(siblings.findIndex((l) => l.id === lesson.id), 0);
	const flags = getStageFlags(idx, siblings.length, lesson.title);
	const ref = `lesson:${t_lessonId}:${today()}`;

	// Фиксированные кейс-позиции карты скиллов.
	if (flags.isChest || flags.isMegaChest) {
		const tier: LessonCaseTier = flags.isMegaChest ? 'rare' : 'common';
		return { ...EMPTY, key: await grantCaseKey(userId, tier, 'stage', ref) };
	}
	// Босс-экзамен: за каждые 3 победы — редкий.
	if (flags.isExam) {
		const wins = await db.select({ n: sql<number>`count(*)::int` }).from(t_lessonProgress)
			.where(and(eq(t_lessonProgress.userId, userId), eq(t_lessonProgress.t_lessonId, t_lessonId), sql`${t_lessonProgress.trainingPts} > 0`));
		const n = wins[0]?.n ?? 0;
		if (n > 0 && n % 3 === 0) return { ...EMPTY, key: await grantCaseKey(userId, 'rare', 'exam', `${ref}:${n}`) };
		return EMPTY;
	}
	if (flags.isMythic) {
		return { ...EMPTY, key: await grantCaseKey(userId, 'mythic', 'mythic-stage', ref) };
	}

	const roll = await rollLessonCaseTier(userId, mistakes);
	const key = roll.tier ? await grantCaseKey(userId, roll.tier, roll.chainBonus ? 'chain' : 'lesson', ref) : null;
	return {
		key,
		chainBonus: key ? (roll.chainBonus?.length ?? null) : null,
		chainCount: roll.chainCount,
		chainAlive: roll.chainAlive,
	};
}

// Угадан «горячий вопрос» → ключ редкого кейса (не чаще раза на урок в день).
export async function grantHotQuestionKey(t_lessonId: number): Promise<GrantedKey | null> {
	const session = await auth();
	if (!session?.user?.id) return null;
	return grantCaseKey(session.user.id, 'rare', 'hot', `hot:${t_lessonId}:${today()}`);
}
