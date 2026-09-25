// lib/caseApply.ts
//
// Серверное ядро выдачи награды из кейса: выбор награды из пула + запись в
// userProgress. НЕ server action (нет 'use server') — чтобы клиент не мог
// вызвать его напрямую со своим пулом наград. Используется actions/open-case.ts
// и actions/quest-rewards.ts (кейсы за квесты дня).

import 'server-only';
import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
	pickWeightedReward,
	MAX_PIZZA_SLICES,
	MAXED_PIZZA_FALLBACK_COINS,
	type CaseReward,
} from '@/lib/caseRewards';

export type OpenCaseResult =
	| { success: true; reward: CaseReward; pizzaSlicesNow: number; justMaxedPizza: boolean }
	| { success: false; error: string };

// Общее ядро — выбор награды из пула + применение к userProgress.
// Переиспользуется openCase (позиция на карте скиллов) и openLessonCase
// (частый кейс за любой завершённый урок, см. caseRewards.ts) — раньше
// вся эта логика жила только внутри openCase(isMega), продублировать её
// один в один под новый вызов было бы риском рассинхронизации.
export async function applyCaseReward(pool: CaseReward[]): Promise<OpenCaseResult> {
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

