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
import { sendMessageToTelegram } from '@/utils/telegram';
import { unlockAchievements } from '@/lib/achievements';
import { grantRandomDdxPiece } from '@/lib/ddx';
import {
	pickWeightedReward,
	MAX_PIZZA_SLICES,
	type CaseReward,
} from '@/lib/caseRewards';

// Автовыдача промокода Додо Пиццы — по прямой просьбе пользователя,
// "как будто у нас есть список" (100 плейсхолдер-кодов, scripts/seed-dodo-
// codes.ts, заменяются на настоящие позже точечным UPDATE). Вешается на
// уже существующий сигнал justMaxedPizza (ниже) — единый хук для ВСЕХ
// путей начисления пиццы (обычный кейс, кейс за урок, гостевой claim,
// реферальный бонус — все сходятся в applyResolvedReward).
async function maybeAssignDodoPromoCode(userId: string, alreadyHasCode: string | null): Promise<string | null> {
	if (alreadyHasCode) return null;

	// Атомарный "забрать одну свободную строку" — FOR UPDATE SKIP LOCKED
	// защищает от гонки, если два ученика одновременно дошли до 8/8 и
	// одновременно претендуют на один и тот же код.
	const rows = await db.execute(sql`
		UPDATE dodo_promo_codes
		SET assigned_to_user_id = ${userId}, assigned_at = now()
		WHERE id = (
			SELECT id FROM dodo_promo_codes WHERE assigned_to_user_id IS NULL ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED
		)
		RETURNING code
	`);
	const code = (rows[0] as any)?.code as string | undefined;

	if (!code) {
		// Пул кодов кончился — не блокируем начисление пиццы из-за этого,
		// просто некому уведомлять; админ увидит в Telegram и досеет ещё.
		await sendMessageToTelegram(`⚠️ Пул промокодов Додо Пиццы закончился! Ученик ${userId} собрал 8/8, но код выдать нечего — досей scripts/seed-dodo-codes.ts.`);
		return null;
	}

	await db.update(userProgress).set({ dodoPromoCode: code }).where(eq(userProgress.userId, userId));

	const user = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
	await sendMessageToTelegram(`🍕 Ученик "${user?.userName ?? userId}" собрал 8/8 кусочков пиццы! Выдан код: \`${code}\``);

	return code;
}

export type OpenCaseResult =
	| { success: true; reward: CaseReward; pizzaSlicesNow: number; justMaxedPizza: boolean; ddx?: { piece: number; isNew: boolean } }
	| { success: false; error: string };

// Применяет УЖЕ РЕШЁННУЮ награду к userProgress конкретного userId — не
// выбирает награду сама (см. applyCaseReward ниже для этого), не читает
// сессию. Вынесена отдельно от applyCaseReward, т.к. нужна и для "переноса"
// уже показанного анонимному гостю приза на аккаунт после регистрации
// (actions/guest-lesson.ts, claimGuestLeadReward) — там награда была
// решена и показана РАНЬШЕ (на этапе, когда пользователь ещё был
// анонимен), её нельзя перевыбирать заново в момент claim.
export async function applyResolvedReward(userId: string, reward: CaseReward): Promise<{ pizzaSlicesNow: number; justMaxedPizza: boolean; ddx?: { piece: number; isNew: boolean } }> {
	const current = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
	const currentPizza = current?.pizzaSlices ?? 0;

	// Кусочков может быть больше 8 (9/8, 10/8…): это просто значит, что целая пицца
	// уже готова. Промокод Додо выдаётся один раз — при переходе через 8.
	const appliedReward = reward;

	let pizzaSlicesNow = currentPizza;
	let justMaxedPizza = false;
	let ddx: { piece: number; isNew: boolean } | undefined;

	if (appliedReward.kind === 'coins') {
		await db.update(userProgress)
			.set({ points: sql`${userProgress.points} + ${appliedReward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else if (appliedReward.kind === 'gems') {
		await db.update(userProgress)
			.set({ gems: sql`${userProgress.gems} + ${appliedReward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else if (appliedReward.kind === 'gg') {
		await db.update(userProgress)
			.set({ ggStickers: sql`${userProgress.ggStickers} + ${appliedReward.amount}` })
			.where(eq(userProgress.userId, userId));
	} else if (appliedReward.kind === 'ddx') {
		// Кусочек паззла «абонемент в спортзал» — случайный из 9, см. lib/ddx.ts
		for (let i = 0; i < appliedReward.amount; i++) {
			const g = await grantRandomDdxPiece(userId);
			ddx = { piece: g.piece, isNew: g.qty === 1 };
		}
	} else {
		// Атомарный инкремент в SQL: два начисления подряд (кейс + реферальная награда + ачивка)
		// не затирают друг друга, как при записи «прочитанное значение + N».
		const [updated] = await db.update(userProgress)
			.set({ pizzaSlices: sql`${userProgress.pizzaSlices} + ${appliedReward.amount}` })
			.where(eq(userProgress.userId, userId))
			.returning({ pizzaSlices: userProgress.pizzaSlices });
		pizzaSlicesNow = updated?.pizzaSlices ?? currentPizza + appliedReward.amount;
		justMaxedPizza = pizzaSlicesNow - appliedReward.amount < MAX_PIZZA_SLICES && pizzaSlicesNow >= MAX_PIZZA_SLICES;
		if (justMaxedPizza) {
			await maybeAssignDodoPromoCode(userId, current?.dodoPromoCode ?? null);
		}
	}

	// Ачивки за первый гем / gg-стикер / полную пиццу (тост подхватит клиент).
	const ach: string[] = [];
	if (appliedReward.kind === 'gems') ach.push('first_gem');
	if (appliedReward.kind === 'gg') ach.push('first_gg');
	if (justMaxedPizza) ach.push('pizza_full');
	if (ach.length) await unlockAchievements(userId, ach, { seen: false }).catch(() => {});

	revalidatePath('/trainer');

	return { pizzaSlicesNow, justMaxedPizza, ddx };
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
	const { pizzaSlicesNow, justMaxedPizza, ddx } = await applyResolvedReward(userId, reward);

	return { success: true, reward, pizzaSlicesNow, justMaxedPizza, ddx };
}

