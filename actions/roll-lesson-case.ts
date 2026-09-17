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
// Додо Пиццы). Сам факт auth() уже достаточен — здесь ничего не
// записывается в БД, только бросается кубик.

'use server';

import { auth } from '@/lib/auth';
import type { LessonCaseTier } from '@/lib/caseRewards';

// Общий шанс, что кейс выпадет вообще, после одного завершённого урока.
const LESSON_CASE_DROP_CHANCE = 0.55;

// Редкость самого выпавшего кейса (сумма весов — не обязательно 100).
const TIER_WEIGHTS: [LessonCaseTier, number][] = [
	['common', 80],
	['rare', 17],
	['mythic', 3],
];

export async function rollLessonCaseTier(): Promise<LessonCaseTier | null> {
	const session = await auth();
	if (!session?.user?.id) return null;

	if (Math.random() > LESSON_CASE_DROP_CHANCE) return null;

	const total = TIER_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
	let roll = Math.random() * total;
	for (const [tier, weight] of TIER_WEIGHTS) {
		if (roll < weight) return tier;
		roll -= weight;
	}
	return 'common';
}
