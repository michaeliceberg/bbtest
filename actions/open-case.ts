// actions/open-case.ts
//
// Замена старой сундук/мегасундук механики (award-chest-reward.ts,
// мгновенное начисление гемов без взаимодействия) — CS:GO-style кейс:
// пользователь видит крутящийся барабан (components/CaseReel.tsx) и
// САМ жмёт кнопку "крутить", но что именно выпадет решает СЕРВЕР, ДО
// начала анимации — клиент только анимирует ленту так, чтобы она
// визуально остановилась на уже решённой награде (тот же принцип, что
// и в award-hot-question-reward.ts/award-chest-reward.ts: сервер решает
// сумму, клиент показывает то, что вернулось, не может подделать результат).

'use server';

import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
	getCasePool,
	getLessonCasePool,
	pickWeightedReward,
	MAX_PIZZA_SLICES,
	MAXED_PIZZA_FALLBACK_COINS,
	type CaseReward,
	type LessonCaseTier,
} from '@/lib/caseRewards';

export type OpenCaseResult =
	| { success: true; reward: CaseReward; pizzaSlicesNow: number; justMaxedPizza: boolean }
	| { success: false; error: string };

// Общее ядро — выбор награды из пула + применение к userProgress.
// Переиспользуется openCase (позиция на карте скиллов) и openLessonCase
// (частый кейс за любой завершённый урок, см. caseRewards.ts) — раньше
// вся эта логика жила только внутри openCase(isMega), продублировать её
// один в один под новый вызов было бы риском рассинхронизации.
async function applyCaseReward(pool: CaseReward[]): Promise<OpenCaseResult> {
	const session = await auth();
	if (!session?.user?.id) {
		return { success: false, error: 'Не авторизован' };
	}
	const userId = session.user.id;

	let reward = pickWeightedReward(pool);

	const current = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
	const currentPizza = current?.pizzaSlices ?? 0;

	// Уже собраны все 8 кусочков — новый дроп пиццы конвертируется в
	// монеты, чтобы "лишний" выигрыш не пропадал впустую (см. MAX_PIZZA_SLICES).
	if (reward.kind === 'pizza' && currentPizza >= MAX_PIZZA_SLICES) {
		reward = { kind: 'coins', amount: MAXED_PIZZA_FALLBACK_COINS, weight: reward.weight };
	}

	let pizzaSlicesNow = currentPizza;
	let justMaxedPizza = false;

	if (reward.kind === 'coins') {
		await db.update(userProgress)
			.set({ points: sql`${userProgress.points} + ${reward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else if (reward.kind === 'gems') {
		await db.update(userProgress)
			.set({ gems: sql`${userProgress.gems} + ${reward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else {
		pizzaSlicesNow = Math.min(MAX_PIZZA_SLICES, currentPizza + reward.amount);
		justMaxedPizza = currentPizza < MAX_PIZZA_SLICES && pizzaSlicesNow >= MAX_PIZZA_SLICES;
		await db.update(userProgress)
			.set({ pizzaSlices: pizzaSlicesNow })
			.where(eq(userProgress.userId, userId));
	}

	revalidatePath('/trainer');

	return { success: true, reward, pizzaSlicesNow, justMaxedPizza };
}

export async function openCase(isMega: boolean = false): Promise<OpenCaseResult> {
	return applyCaseReward(getCasePool(isMega));
}

// Кейс за любой завершённый урок тренажёра (см. actions/roll-lesson-
// case.ts — решает ДО этого вызова, выпадает ли кейс вообще и какой
// редкости; здесь только применяется уже решённая редкость).
export async function openLessonCase(tier: LessonCaseTier): Promise<OpenCaseResult> {
	return applyCaseReward(getLessonCasePool(tier));
}
