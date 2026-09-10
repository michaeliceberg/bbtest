// lib/caseRewards.ts
//
// (declensionRu импортирован из usefulFunctions.ts — уже проверенная
// правильная русская словоформа "N ... форма", не изобретаем свою.)
//
// Общая таблица наград для CS:GO-style кейсов тренажёра (замена старой
// сундук/мегасундук механики, см. components/CaseReel.tsx и
// actions/open-case.ts). Один и тот же модуль используется и на
// сервере (взвешенный выбор награды), и на клиенте (построение ленты
// барабана — клиент не решает, что выпадет, только рисует одинаковый
// набор возможных исходов для визуального разнообразия).

import { declensionRu } from '@/usefulFunctions'

export type CaseRewardKind = 'coins' | 'gems' | 'pizza'

export type CaseReward = {
	kind: CaseRewardKind
	amount: number
	weight: number
}

// Собрал все 8 — открывается право заказать настоящую пиццу (сама заявка
// на заказ — отдельная, ещё не реализованная фича). Дроп сверх 8
// конвертируется в бонусные монеты, см. actions/open-case.ts.
export const MAX_PIZZA_SLICES = 8
export const MAXED_PIZZA_FALLBACK_COINS = 25

// Обычный кейс (🎁 на промежуточном этапе темы) — шанс пиццы ~3%.
export const REGULAR_CASE_POOL: CaseReward[] = [
	{ kind: 'coins', amount: 10, weight: 30 },
	{ kind: 'coins', amount: 20, weight: 22 },
	{ kind: 'coins', amount: 30, weight: 14 },
	{ kind: 'coins', amount: 50, weight: 6 },
	{ kind: 'gems', amount: 3, weight: 14 },
	{ kind: 'gems', amount: 5, weight: 8 },
	{ kind: 'gems', amount: 10, weight: 3 },
	{ kind: 'pizza', amount: 1, weight: 3 },
]

// Мегакейс (👑 финальный этап темы) — шанс пиццы ~6%, вдвое чаще, чем в
// обычном (мегакейс сам по себе реже встречается — по одному на тему).
export const MEGA_CASE_POOL: CaseReward[] = [
	{ kind: 'coins', amount: 50, weight: 26 },
	{ kind: 'coins', amount: 80, weight: 20 },
	{ kind: 'coins', amount: 120, weight: 12 },
	{ kind: 'coins', amount: 200, weight: 6 },
	{ kind: 'gems', amount: 15, weight: 16 },
	{ kind: 'gems', amount: 25, weight: 10 },
	{ kind: 'gems', amount: 40, weight: 4 },
	{ kind: 'pizza', amount: 1, weight: 5 },
	{ kind: 'pizza', amount: 2, weight: 1 },
]

export const getCasePool = (isMega: boolean): CaseReward[] => (isMega ? MEGA_CASE_POOL : REGULAR_CASE_POOL)

export const pickWeightedReward = (pool: CaseReward[]): CaseReward => {
	const total = pool.reduce((sum, r) => sum + r.weight, 0)
	let roll = Math.random() * total
	for (const reward of pool) {
		if (roll < reward.weight) return reward
		roll -= reward.weight
	}
	return pool[pool.length - 1]
}

// Текст+эмодзи для одной "ячейки" барабана/итогового баннера — общий
// источник для CaseReel (лента) и итоговой карточки результата.
export const rewardLabel = (reward: CaseReward): string => {
	if (reward.kind === 'coins') return `+${reward.amount} ${declensionRu(reward.amount, 'монета', 'монеты', 'монет')}`
	if (reward.kind === 'gems') return `+${reward.amount} ${declensionRu(reward.amount, 'гем', 'гема', 'гемов')}`
	return `+${reward.amount} ${declensionRu(reward.amount, 'кусочек', 'кусочка', 'кусочков')} пиццы`
}

export const rewardEmoji = (reward: CaseReward): string => {
	if (reward.kind === 'coins') return '🪙'
	if (reward.kind === 'gems') return '💎'
	return '🍕'
}
