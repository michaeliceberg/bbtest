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
import { advanceStorm, type StormState } from '@/lib/storm';
import { getSetBarData, isSetCourse } from '@/lib/setBar';
import { LESSON_CASE_TIER_ICON, LESSON_CASE_TIER_LABEL } from '@/lib/caseRewards';

// Подсказка про сет на экране итогов урока (вместо «Серия xN без остановки» в курсах с сетом).
export type SetFinishHint = { title: string; text: string; chest: string; chestLabel: string };

export type PlannedLessonCase = {
	key: GrantedKey | null;
	chainBonus: number | null;
	chainCount: number;
	chainAlive: boolean;
	// «Штурм»: начался после этого урока / урок засчитан в штурм (lib/storm.ts)
	storm: StormState | null;
	// true — ключ выдан за STORM_GOAL уроков в штурме (мифический)
	stormMythic?: boolean;
	setHint?: SetFinishHint | null;
};

const EMPTY: PlannedLessonCase = { key: null, chainBonus: null, chainCount: 0, chainAlive: false, storm: null };
const today = () => new Date().toISOString().slice(0, 10);

export async function planLessonCase(t_lessonId: number, mistakes: number): Promise<PlannedLessonCase> {
	const session = await auth();
	if (!session?.user?.id) return EMPTY;
	const userId = session.user.id;

	const lesson = await db.query.t_lessons.findFirst({
		where: eq(t_lessons.id, t_lessonId),
		with: { t_unit: { with: { t_course: true, t_lessons: { orderBy: (l, { asc }) => [asc(l.order)] } } } },
	});
	if (!lesson) return EMPTY;
	const siblings = lesson.t_unit.t_lessons;
	const idx = Math.max(siblings.findIndex((l) => l.id === lesson.id), 0);
	const flags = getStageFlags(idx, siblings.length, lesson.title);
	const ref = `lesson:${t_lessonId}:${today()}`;

	// «Штурм» считаем за любой урок. 3 урока за 10 минут — гарантированный мифический, вместо обычного кейса.
	const storm = await advanceStorm(userId);
	if (storm?.mythicNow) {
		const key = await grantCaseKey(userId, 'mythic', 'storm', `storm:${today()}`);
		if (key) return { ...EMPTY, key, storm, stormMythic: true };
	}
	const base = { ...EMPTY, storm };

	// Фиксированные кейс-позиции карты скиллов.
	if (flags.isChest || flags.isMegaChest) {
		const tier: LessonCaseTier = flags.isMegaChest ? 'rare' : 'common';
		return { ...base, key: await grantCaseKey(userId, tier, 'stage', ref) };
	}
	// Босс-экзамен: за каждые 3 победы — редкий.
	if (flags.isExam) {
		const wins = await db.select({ n: sql<number>`count(*)::int` }).from(t_lessonProgress)
			.where(and(eq(t_lessonProgress.userId, userId), eq(t_lessonProgress.t_lessonId, t_lessonId), sql`${t_lessonProgress.trainingPts} > 0`));
		const n = wins[0]?.n ?? 0;
		if (n > 0 && n % 3 === 0) return { ...base, key: await grantCaseKey(userId, 'rare', 'exam', `${ref}:${n}`) };
		return base;
	}
	if (flags.isMythic) {
		return { ...base, key: await grantCaseKey(userId, 'mythic', 'mythic-stage', ref) };
	}

	const setCourse = isSetCourse(lesson.t_unit.t_course?.title);
	const roll = await rollLessonCaseTier(userId, mistakes, !!storm?.counted, setCourse);
	const key = roll.tier ? await grantCaseKey(userId, roll.tier, roll.chainBonus ? 'chain' : 'lesson', ref) : null;
	return {
		...base,
		key,
		chainBonus: key ? (roll.chainBonus?.length ?? null) : null,
		chainCount: roll.chainCount,
		chainAlive: roll.chainAlive,
		setHint: setCourse ? await setFinishHint(userId, lesson.t_unit.t_course?.title) : null,
	};
}

async function setFinishHint(userId: string, courseTitle?: string | null): Promise<SetFinishHint | null> {
	const d = await getSetBarData(userId, courseTitle);
	if (!d) return null;
	const tier = LESSON_CASE_TIER_LABEL[d.tier].toLowerCase();
	const chest = LESSON_CASE_TIER_ICON[d.tier];
	const chestLabel = `${LESSON_CASE_TIER_LABEL[d.tier]} кейс`;
	if (d.step === 'none') return { title: 'Команданте накрыл сет!', text: `Три блюда — и ${tier} сундук. Жми полоску сета сверху`, chest, chestLabel };
	if (d.step === 'done') return d.caseClaimed ? null : { title: 'Сет съеден! 😋', text: `Забирай ${tier} сундук — он на полоске сета сверху`, chest, chestLabel };
	if (d.step === 'trainer') return { title: `Сет №${d.setNumber} ждёт`, text: `Закуска: «${d.trainerTitle ?? 'урок тренажёра'}» — и вперёд к ${d.tier === 'common' ? 'обычному' : d.tier === 'rare' ? 'редкому' : 'мифическому'} сундуку`, chest, chestLabel };
	if (d.step === 'trainer2') return { title: 'Закуска съедена! 🔥', text: `Основное — «${d.trainer2Title ?? 'урок тренажёра'}», и ${tier} сундук твой`, chest, chestLabel };
	const left = Math.max(0, d.tasksTotal - d.tasksDone);
	return { title: 'Закуска съедена! 🔥', text: `Основное — ${left} ${left === 1 ? 'задача' : left < 5 ? 'задачи' : 'задач'} задания №${d.taskNum}, и ${tier} сундук твой`, chest, chestLabel };
}

// Угадан «горячий вопрос» → ключ редкого кейса (не чаще раза на урок в день).
export async function grantHotQuestionKey(t_lessonId: number): Promise<GrantedKey | null> {
	const session = await auth();
	if (!session?.user?.id) return null;
	return grantCaseKey(session.user.id, 'rare', 'hot', `hot:${t_lessonId}:${today()}`);
}
