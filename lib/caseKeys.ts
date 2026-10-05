// lib/caseKeys.ts
//
// Ключи от кейсов (серверная часть). НЕ server action (нет 'use server') —
// клиент не может выдать себе ключ напрямую. Ключ выдаётся только из других
// серверных действий (завершение урока, горячий вопрос, ударный час).
// Ограничения: один ключ на (пользователь, источник, ссылка) — например на
// урок за день; суточный потолок ключей на пользователя.

import 'server-only';
import db from '@/db/drizzle';
import { sql } from 'drizzle-orm';
import type { LessonCaseTier } from '@/lib/caseRewards';

export const DAILY_KEY_CAP = 15;

export type GrantedKey = { keyId: number; tier: LessonCaseTier };

// Выдаёт ключ. Если по этой же ссылке ключ уже выдавали и он ещё не использован —
// возвращает его (перезагрузка страницы не теряет ключ). Использован или превышен
// суточный потолок — null.
export async function grantCaseKey(
	userId: string,
	tier: LessonCaseTier,
	source: string,
	sourceRef: string | null,
): Promise<GrantedKey | null> {
	if (sourceRef) {
		const existing = await db.execute(sql`
			SELECT id, tier, used_at FROM case_keys
			WHERE user_id = ${userId} AND source = ${source} AND source_ref = ${sourceRef}
		`);
		const row = existing[0] as any;
		if (row) return row.used_at ? null : { keyId: Number(row.id), tier: row.tier as LessonCaseTier };
	}

	const cnt = await db.execute(sql`
		SELECT count(*)::int AS n FROM case_keys
		WHERE user_id = ${userId} AND created_at >= date_trunc('day', now())
	`);
	if (Number((cnt[0] as any)?.n ?? 0) >= DAILY_KEY_CAP) return null;

	const inserted = await db.execute(sql`
		INSERT INTO case_keys (user_id, tier, source, source_ref)
		VALUES (${userId}, ${tier}, ${source}, ${sourceRef})
		ON CONFLICT DO NOTHING
		RETURNING id
	`);
	const id = (inserted[0] as any)?.id;
	return id ? { keyId: Number(id), tier } : null;
}

// Атомарно "сжигает" ключ пользователя; возвращает его редкость или null.
export async function consumeCaseKey(userId: string, keyId: number): Promise<LessonCaseTier | null> {
	const rows = await db.execute(sql`
		UPDATE case_keys SET used_at = now()
		WHERE id = ${keyId} AND user_id = ${userId} AND used_at IS NULL
		RETURNING tier
	`);
	const tier = (rows[0] as any)?.tier as LessonCaseTier | undefined;
	return tier ?? null;
}
