// actions/roll-lesson-case.ts
//
// По прямой просьбе пользователя — сундуки должны выпадать ГОРАЗДО чаще,
// чем раньше (раньше — ровно 1 обычный + 1 мега на ВСЮ тему, независимо
// от числа этапов). Теперь — после ЛЮБОГО завершённого этапа тренажёра
// (не только идеально пройденного, не только на позициях isChestStage/
// isMegaChestStage) есть шанс на кейс: высокая вероятность common, реже
// rare, совсем редко mythic (см. lib/caseRewards.ts).
//
// Решение "выпадает ли кейс вообще и какой редкости" — НАМЕРЕННО на
// сервере, отдельным вызовом ДО того, как реальная награда решается
// внутри openLessonCase/CaseReel — иначе скомпрометированный клиент мог
// бы просто всегда заявлять "выпал mythic" при каждом вызове CaseReel,
// подрывая именно ту частоту редких дропов (особенно пиццы), которую
// пользователь хочет контролировать вручную (см. идею с промокодами
// Додо Пиццы).
//
// "Ударный час" — по прямой просьбе пользователя: цепочка ПОДРЯД
// завершённых уроков тренажёра БЕЗ ОСТАНОВКИ (см. CHAIN_WINDOW_MS — окно
// между завершениями, не жёсткое "сразу же") и с ОГРАНИЧЕННЫМ суммарным
// числом ошибок по всей цепочке (CHAIN_MISTAKE_CAP) — на рубежах 3/4/5
// уроков подряд даёт ГАРАНТИРОВАННЫЙ mythic-кейс (переопределяет обычный
// вероятностный ролл на этом конкретном уроке). Состояние цепочки —
// на userProgress (см. db/schema.ts, trainerChain*), т.к. должно
// переживать переход между разными t_lesson/t_unit, а не сбрасываться
// при каждой новой загрузке страницы.
//
// Ошибки только НАКАПЛИВАЮТСЯ (никогда не уменьшаются) — если урок сам
// по себе даёт больше CHAIN_MISTAKE_CAP ошибок, цепочка "отравлена" и
// уже не сможет пройти следующий рубеж НИ ПРИ КАКОМ продолжении (мistakes
// не может уменьшиться) — это не баг, а естественное следствие модели,
// отдельный сброс по превышению не нужен: рубеж просто тихо не сработает.

'use server';

import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import type { LessonCaseTier } from '@/lib/caseRewards';

// Общий шанс, что кейс выпадет вообще, после одного завершённого урока
// (когда рубеж цепочки НЕ сработал — см. ниже).
const LESSON_CASE_DROP_CHANCE = 0.55;

// Редкость самого выпавшего кейса (сумма весов — не обязательно 100).
const TIER_WEIGHTS: [LessonCaseTier, number][] = [
	['common', 80],
	['rare', 17],
	['mythic', 3],
];

function pickWeightedTier(): LessonCaseTier {
	const total = TIER_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
	let roll = Math.random() * total;
	for (const [tier, weight] of TIER_WEIGHTS) {
		if (roll < weight) return tier;
		roll -= weight;
	}
	return 'common';
}

// Окно между завершениями уроков, в течение которого цепочка считается
// НЕПРЕРЫВНОЙ ("не останавливаться" — не обязательно сразу же, разумный
// перерыв допустим). Дольше — цепочка начинается заново.
const CHAIN_WINDOW_MS = 15 * 60 * 1000;
// Максимум ошибок суммарно по всей цепочке, чтобы рубежи ещё засчитывались.
const CHAIN_MISTAKE_CAP = 2;
// Рубежи цепочки — по прямой просьбе пользователя "3-4-5" — каждый даёт
// ОТДЕЛЬНЫЙ гарантированный mythic (не только первый достигнутый). За
// пределами 5 — цепочка продолжает жить (count растёт), но новых
// гарантий уже не даёт, дальше обычный вероятностный ролл.
const CHAIN_MILESTONES = [3, 4, 5];

export type LessonCaseRollResult = {
	tier: LessonCaseTier | null;
	// Заполнено, ТОЛЬКО если этот конкретный кейс — гарантированная
	// награда за рубеж цепочки (не обычный случайный ролл) — клиент
	// показывает отдельный заголовок/баннер ("🔥 Серия x3").
	chainBonus: { length: number } | null;
	// Состояние цепочки ПОСЛЕ этого урока — чтобы показать подсказку
	// "ещё N уроков без ошибок" на финальном экране, даже когда рубеж
	// ещё не достигнут (или кейс вовсе не выпал).
	chainCount: number;
	chainAlive: boolean;
};

const NO_SESSION_RESULT: LessonCaseRollResult = { tier: null, chainBonus: null, chainCount: 0, chainAlive: false };

export async function rollLessonCaseTier(mistakes: number): Promise<LessonCaseRollResult> {
	const session = await auth();
	if (!session?.user?.id) return NO_SESSION_RESULT;
	const userId = session.user.id;
	const safeMistakes = Number.isFinite(mistakes) ? Math.max(0, Math.floor(mistakes)) : 0;

	const current = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
	const now = new Date();
	const withinWindow = !!current?.trainerChainLastAt
		&& now.getTime() - new Date(current.trainerChainLastAt).getTime() <= CHAIN_WINDOW_MS;

	const nextCount = withinWindow ? (current!.trainerChainCount + 1) : 1;
	const nextMistakes = withinWindow ? (current!.trainerChainMistakes + safeMistakes) : safeMistakes;
	const prevMilestone = withinWindow ? current!.trainerChainMilestone : 0;

	const chainAlive = nextMistakes <= CHAIN_MISTAKE_CAP;
	// count растёт РОВНО на 1 за урок — рубежи не могут "перепрыгнуться",
	// поэтому достаточно проверить точное совпадение, без поиска ближайшего.
	const qualifyingMilestone = chainAlive && CHAIN_MILESTONES.includes(nextCount) && prevMilestone < nextCount
		? nextCount
		: null;

	await db.update(userProgress)
		.set({
			trainerChainCount: nextCount,
			trainerChainMistakes: nextMistakes,
			trainerChainLastAt: now,
			trainerChainMilestone: qualifyingMilestone ?? prevMilestone,
		})
		.where(eq(userProgress.userId, userId));

	if (qualifyingMilestone) {
		return { tier: 'mythic', chainBonus: { length: qualifyingMilestone }, chainCount: nextCount, chainAlive };
	}

	if (Math.random() > LESSON_CASE_DROP_CHANCE) {
		return { tier: null, chainBonus: null, chainCount: nextCount, chainAlive };
	}
	return { tier: pickWeightedTier(), chainBonus: null, chainCount: nextCount, chainAlive };
}
