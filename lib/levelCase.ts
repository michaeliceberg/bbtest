// lib/levelCase.ts
//
// Редкий кейс за уровни, кратные 5 (5, 10, 15…). Ключ выдаётся сервером в момент
// повышения уровня (actions/challenge-progress.ts, user-progress.ts, claim-achievement.ts),
// один на уровень (source='level', source_ref=номер уровня), без суточного потолка —
// иначе награду за уровень можно было бы потерять. Открывается из карточки уровня
// (components/level-card.tsx) — ключ лежит, пока ученик его не откроет.

import 'server-only';
import db from '@/db/drizzle';
import { sql } from 'drizzle-orm';
import { LEVEL_CASE_EVERY } from '@/lib/xp';

export type PendingLevelCase = { keyId: number; level: number };

export async function grantLevelCaseKeys(userId: string, newLevel: number, levelsGained: number) {
	if (levelsGained <= 0) return;
	const before = newLevel - levelsGained;
	for (let lvl = before + 1; lvl <= newLevel; lvl++) {
		if (lvl % LEVEL_CASE_EVERY !== 0) continue;
		const exists = await db.execute(sql`
			SELECT 1 FROM case_keys WHERE user_id = ${userId} AND source = 'level' AND source_ref = ${String(lvl)}
		`);
		if (exists.length) continue;
		await db.execute(sql`
			INSERT INTO case_keys (user_id, tier, source, source_ref) VALUES (${userId}, 'rare', 'level', ${String(lvl)})
		`);
	}
}

export async function getPendingLevelCase(userId: string): Promise<PendingLevelCase | null> {
	const rows = await db.execute(sql`
		SELECT id, source_ref FROM case_keys
		WHERE user_id = ${userId} AND source = 'level' AND used_at IS NULL
		ORDER BY created_at LIMIT 1
	`);
	const r = rows[0] as any;
	return r ? { keyId: Number(r.id), level: Number(r.source_ref) } : null;
}
