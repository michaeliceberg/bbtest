'use server';

import db from '@/db/drizzle';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/server-auth';
import { ACHIEVEMENT_BY_KEY, CLIENT_EVENT_KEYS, toDTO, type AchievementDTO, type ClientEventKey } from '@/lib/achievementsCatalog';
import { bumpCounter, syncAchievements, unlockAchievements } from '@/lib/achievements';

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

// Страница /achievements: сверка по данным (догоняет задним числом) и список разблокированных.
export async function getMyAchievements(): Promise<{ key: string; unlockedAt: string }[]> {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) return [];
	await syncAchievements(userId, { silent: true }).catch(() => {});
	const r = (await db.execute(sql`SELECT key, unlocked_at FROM achievement_unlocks WHERE user_id = ${userId}`)) as unknown as Row[];
	return r.map((x) => ({ key: String(x.key), unlockedAt: new Date(String(x.unlocked_at)).toISOString() }));
}
