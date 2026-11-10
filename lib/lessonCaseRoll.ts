// lib/lessonCaseRoll.ts (раньше actions/roll-lesson-case.ts — теперь не server action:
// кейс/ключ выдаётся только из actions/plan-lesson-case.ts)
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
// «Ударный час» (мифический за 3/4/5 уроков подряд) убран 2026-11-06: в математике его заменил сет, в физике
// остаются штурм и обычные кейсы. Колонки user_progress.trainer_chain_* в базе остались, код их не читает.

import 'server-only';

import type { LessonCaseTier } from '@/lib/caseRewards';

// Шанс, что кейс выпадет после одного завершённого урока.
// Сундук должен быть долгожданным (2026-11-11): раньше 0.55 — кейсы сыпались после каждого второго урока.
const LESSON_CASE_DROP_CHANCE = 0.15;

// Редкость самого выпавшего кейса (сумма весов — не обязательно 100).
const TIER_WEIGHTS: [LessonCaseTier, number][] = [
	['common', 80],
	['rare', 17],
	['mythic', 3],
	// МЕГА — в 3 раза реже mythic.
	['mega', 1],
];

// Во время «Штурма» (lib/storm.ts) кейс выпадает всегда и чаще редкий.
const STORM_TIER_WEIGHTS: [LessonCaseTier, number][] = [
	['common', 50],
	['rare', 38],
	['mythic', 9],
	['mega', 3],
];

function pickWeightedTier(weights = TIER_WEIGHTS): LessonCaseTier {
	const total = weights.reduce((sum, [, w]) => sum + w, 0);
	let roll = Math.random() * total;
	for (const [tier, weight] of weights) {
		if (roll < weight) return tier;
		roll -= weight;
	}
	return 'common';
}

// Во время «Штурма» кейс выпадает всегда и чаще редкий; иначе — с шансом LESSON_CASE_DROP_CHANCE.
export function rollLessonCaseTier(storm = false): LessonCaseTier | null {
	if (!storm && Math.random() > LESSON_CASE_DROP_CHANCE) return null;
	return pickWeightedTier(storm ? STORM_TIER_WEIGHTS : TIER_WEIGHTS);
}
