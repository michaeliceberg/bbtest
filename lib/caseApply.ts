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

// Применяет УЖЕ РЕШЁННУЮ награду к userProgress конкретного userId — не
// выбирает награду сама (см. applyCaseReward ниже для этого), не читает
// сессию. Вынесена отдельно от applyCaseReward, т.к. нужна и для "переноса"
// уже показанного анонимному гостю приза на аккаунт после регистрации
// (actions/guest-lesson.ts, claimGuestLeadReward) — там награда была
// решена и показана РАНЬШЕ (на этапе, когда пользователь ещё был
// анонимен), её нельзя перевыбирать заново в момент claim.
export async function applyResolvedReward(userId: string, reward: CaseReward): Promise<{ pizzaSlicesNow: number; justMaxedPizza: boolean }> {
	const current = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
	const currentPizza = current?.pizzaSlices ?? 0;

	// Уже собраны все 8 кусочков — новый дроп пиццы конвертируется в
	// монеты, чтобы "лишний" выигрыш не пропадал впустую (см. MAX_PIZZA_SLICES).
	let appliedReward = reward;
	if (appliedReward.kind === 'pizza' && currentPizza >= MAX_PIZZA_SLICES) {
		appliedReward = { kind: 'coins', amount: MAXED_PIZZA_FALLBACK_COINS, weight: appliedReward.weight };
	}

	let pizzaSlicesNow = currentPizza;
	let justMaxedPizza = false;

	if (appliedReward.kind === 'coins') {
		await db.update(userProgress)
			.set({ points: sql`${userProgress.points} + ${appliedReward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else if (appliedReward.kind === 'gems') {
		await db.update(userProgress)
			.set({ gems: sql`${userProgress.gems} + ${appliedReward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else {
		pizzaSlicesNow = Math.min(MAX_PIZZA_SLICES, currentPizza + appliedReward.amount);
		justMaxedPizza = currentPizza < MAX_PIZZA_SLICES && pizzaSlicesNow >= MAX_PIZZA_SLICES;
		await db.update(userProgress)
			.set({ pizzaSlices: pizzaSlicesNow })
			.where(eq(userProgress.userId, userId));
	}

	revalidatePath('/trainer');

	return { pizzaSlicesNow, justMaxedPizza };
}

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

	const reward = pickWeightedReward(pool);
	const { pizzaSlicesNow, justMaxedPizza } = await applyResolvedReward(userId, reward);

	return { success: true, reward, pizzaSlicesNow, justMaxedPizza };
}

