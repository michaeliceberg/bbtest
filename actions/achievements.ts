'use server';

import db from '@/db/drizzle';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/server-auth';
import { ACHIEVEMENT_BY_KEY, CLIENT_EVENT_KEYS, REWARDS, toDTO, type AchievementDTO, type AchievementReward, type ClientEventKey } from '@/lib/achievementsCatalog';
import { bumpCounter, countUnclaimedAchievements, syncAchievements, unlockAchievements } from '@/lib/achievements';
import db2 from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { applyResolvedReward } from '@/lib/caseApply';
import { MAX_PIZZA_SLICES, MAXED_PIZZA_FALLBACK_COINS } from '@/lib/caseRewards';
import { revalidatePath } from 'next/cache';

type Row = Record<string, unknown>;

// Событие из браузера (ошибка в уроке, молния, справочник…). Возвращает НОВЫЕ ачивки для тоста
// (они сразу помечаются как показанные).
export async function reportAchievementEvent(event: ClientEventKey): Promise<AchievementDTO[]> {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId || !(CLIENT_EVENT_KEYS as readonly string[]).includes(event)) return [];
	return unlockAchievements(userId, [event], { seen: true });
}

// Открыт сундук (момент сцены с сундуком, до «Крутить»): первая ачивка по редкости + счётчик на 10.
export async function reportChestOpened(tier: 'common' | 'rare' | 'mythic' | 'mega'): Promise<AchievementDTO[]> {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId || !['common', 'rare', 'mythic', 'mega'].includes(tier)) return [];
	const total = await bumpCounter(userId, 'chests_opened', 1);
	const keys = [`chest_${tier}`];
	if (total >= 10) keys.push('chests_10');
	return unlockAchievements(userId, keys, { seen: true });
}

// Ачивки, выданные сервером «втихую» (друг зарегистрировался, пицца 8/8, гем из сундука…) и ещё не показанные.
export async function fetchUnseenAchievements(): Promise<AchievementDTO[]> {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) return [];
	// Первая сверка по данным — только пока у пользователя нет ни одной ачивки (выдаётся тихо,
	// без потока тостов). Дальше ачивки выдаются в момент событий, здесь лишь забираем непоказанные.
	const any = (await db.execute(sql`SELECT 1 FROM achievement_unlocks WHERE user_id = ${userId} LIMIT 1`)) as unknown as Row[];
	if (!any.length) await syncAchievements(userId).catch(() => {});
	const r = (await db.execute(sql`
		UPDATE achievement_unlocks SET seen = true WHERE user_id = ${userId} AND seen = false RETURNING key`)) as unknown as Row[];
	return r.map((x) => ACHIEVEMENT_BY_KEY[String(x.key)]).filter(Boolean).map(toDTO);
}

// Страница /achievements: сверка по данным (догоняет задним числом) и список полученных (с признаком «награда забрана»).
export async function getMyAchievements(): Promise<{ key: string; unlockedAt: string; claimed: boolean }[]> {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) return [];
	await syncAchievements(userId, { silent: true }).catch(() => {});
	const r = (await db.execute(sql`SELECT key, unlocked_at, claimed_at FROM achievement_unlocks WHERE user_id = ${userId}`)) as unknown as Row[];
	return r.map((x) => ({ key: String(x.key), unlockedAt: new Date(String(x.unlocked_at)).toISOString(), claimed: !!x.claimed_at }));
}

// Число ещё не забранных наград — для бейджа в меню.
export async function getUnclaimedAchievementsCount(): Promise<number> {
	const session = await auth();
	const userId = session?.user?.id;
	return userId ? countUnclaimedAchievements(userId) : 0;
}

// Забрать награду за полученную ачивку — один раз (клик на странице «Ачивки»).
export async function claimAchievementReward(key: string): Promise<{ success: true; reward: AchievementReward; unclaimed: number } | { success: false; error: string }> {
	const session = await auth();
	const userId = session?.user?.id;
	const reward = REWARDS[key];
	if (!userId || !reward || !ACHIEVEMENT_BY_KEY[key]) return { success: false, error: 'Не получилось' };

	// Атомарно «забираем» строку: второй клик (или гонка) ничего не вернёт.
	const claimed = (await db.execute(sql`
		UPDATE achievement_unlocks SET claimed_at = now(), seen = true
		WHERE user_id = ${userId} AND key = ${key} AND claimed_at IS NULL RETURNING key`)) as unknown as Row[];
	if (!claimed.length) return { success: false, error: 'Награда уже забрана или ачивка не получена' };

	let shown: AchievementReward = reward;
	if (reward.kind === 'coins') {
		await db2.update(userProgress).set({ points: sql`${userProgress.points} + ${reward.amount}` }).where(eq(userProgress.userId, userId));
	} else if (reward.kind === 'gems') {
		await db2.update(userProgress).set({ gems: sql`${userProgress.gems} + ${reward.amount}` }).where(eq(userProgress.userId, userId));
	} else {
		const before = await db2.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
		const alreadyFull = (before?.pizzaSlices ?? 0) >= MAX_PIZZA_SLICES;
		await applyResolvedReward(userId, { kind: 'pizza', amount: reward.amount, weight: 0 });
		// Пицца уже собрана целиком — кусочки превращаются в монеты (см. applyResolvedReward).
		if (alreadyFull) shown = { kind: 'coins', amount: MAXED_PIZZA_FALLBACK_COINS };
	}

	revalidatePath('/achievements');
	revalidatePath('/trainer');
	return { success: true, reward: shown, unclaimed: await countUnclaimedAchievements(userId) };
}
