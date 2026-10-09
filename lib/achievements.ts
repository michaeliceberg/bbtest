// lib/achievements.ts
//
// Серверное ядро ачиевок (Steam-стиль). НЕ server action (нет 'use server') — клиент не должен
// вызывать выдачу напрямую; публичные действия — actions/achievements.ts (по сессии).
// Каталог — lib/achievementsCatalog.ts.

import 'server-only';
import db from '@/db/drizzle';
import { sql } from 'drizzle-orm';
import { ACHIEVEMENT_BY_KEY, ACHIEVEMENTS, toDTO, type AchievementDTO } from '@/lib/achievementsCatalog';
import { HIDDEN_T_COURSE_IDS } from '@/lib/trainer-topic';
import { STEP_BY_STEP_CHALLENGE_TYPES } from '@/lib/trainerStageFlags';

type Row = Record<string, unknown>;
const rows = async (q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as Row[];
const num = (v: unknown) => Number(v ?? 0);

const hiddenList = sql.raw(HIDDEN_T_COURSE_IDS.join(','));
const stepTypes = sql.raw(Array.from(STEP_BY_STEP_CHALLENGE_TYPES).map((t) => `'${t}'`).join(','));

// Выдаёт ачивки (повторно не выдаётся). Возвращает только НОВЫЕ. seen=true — тост показывать не нужно
// (тихая выдача при первичной сверке), seen=false — клиент подхватит и покажет тост.
export async function unlockAchievements(userId: string, keys: string[], opts: { seen?: boolean } = {}): Promise<AchievementDTO[]> {
	const valid = Array.from(new Set(keys)).filter((k) => ACHIEVEMENT_BY_KEY[k]);
	if (!valid.length) return [];
	const seen = opts.seen ?? false;
	const out: AchievementDTO[] = [];
	for (const key of valid) {
		const r = await rows(sql`
			INSERT INTO achievement_unlocks (user_id, key, seen) VALUES (${userId}, ${key}, ${seen})
			ON CONFLICT (user_id, key) DO NOTHING RETURNING key`);
		if (r.length) out.push(toDTO(ACHIEVEMENT_BY_KEY[key]));
	}
	return out;
}

export async function bumpCounter(userId: string, key: string, delta = 1): Promise<number> {
	const r = await rows(sql`
		INSERT INTO achievement_counters (user_id, key, value) VALUES (${userId}, ${key}, ${delta})
		ON CONFLICT (user_id, key) DO UPDATE SET value = achievement_counters.value + ${delta} RETURNING value`);
	return num(r[0]?.value);
}

// Всё, что можно вывести из данных в базе (поэтому годится и для сверки задним числом).
export async function computeStateKeys(userId: string): Promise<string[]> {
	const keys: string[] = [];

	const up = await rows(sql`SELECT pizza_slices, dodo_promo_code FROM user_progress WHERE user_id = ${userId}`);
	if (up.length) {
		keys.push('hello_world');
		if (num(up[0].pizza_slices) >= 8 || up[0].dodo_promo_code) keys.push('pizza_full');
	}

	// Уроки тренажёра: каждая строка t_lesson_progress с training_pts>0 — завершённое прохождение.
	const lp = await rows(sql`
		SELECT count(DISTINCT p.t_lesson_id) AS lessons,
			count(DISTINCT p.t_lesson_id) FILTER (WHERE c.course_id = 11) AS math_lessons,
			count(DISTINCT p.t_lesson_id) FILTER (WHERE c.course_id = 12) AS phys_lessons,
			bool_or(p.done_wrong = 0) AS clean_any,
			bool_or(p.done_wrong > 0) AS any_mistake,
			bool_or(l.title ILIKE '%босс-экзамен%') AS boss,
			bool_or(extract(hour FROM (p.date_done AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow') >= 23) AS night,
			bool_or(extract(hour FROM (p.date_done AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow') < 7) AS early
		FROM t_lesson_progress p
		JOIN t_lessons l ON l.id = p.t_lesson_id
		JOIN t_units u ON u.id = l.t_unit_id
		JOIN t_courses c ON c.id = u.t_course_id
		WHERE p.user_id = ${userId} AND p.training_pts > 0`);
	const L = lp[0] ?? {};
	const lessons = num(L.lessons);
	if (num(L.math_lessons) > 0) keys.push('first_math');
	if (num(L.phys_lessons) > 0) keys.push('first_physics');
	if (lessons >= 10) keys.push('lessons_10');
	if (lessons >= 50) keys.push('lessons_50');
	if (lessons >= 100) keys.push('lessons_100');
	if (L.clean_any) keys.push('lesson_clean');
	if (L.any_mistake) keys.push('first_mistake');
	if (L.boss) keys.push('boss_first');
	if (L.night) keys.push('night_owl');
	if (L.early) keys.push('early_bird');

	// 5 последних завершённых прохождений подряд без ошибок.
	const last5 = await rows(sql`
		SELECT done_wrong FROM t_lesson_progress WHERE user_id = ${userId} AND training_pts > 0
		ORDER BY date_done DESC, id DESC LIMIT 5`);
	if (last5.length === 5 && last5.every((r) => num(r.done_wrong) === 0)) keys.push('clean_5');

	// Прошёл разбор «Урок» (степбайстеп) без ошибок.
	const sc = await rows(sql`
		SELECT 1 FROM t_lesson_progress p
		WHERE p.user_id = ${userId} AND p.training_pts > 0 AND p.done_wrong = 0
			AND EXISTS (SELECT 1 FROM t_challenges ch WHERE ch.lesson_id = p.t_lesson_id AND ch.type::text IN (${stepTypes}))
		LIMIT 1`);
	if (sc.length) keys.push('step_clean');

	// Целая тема / весь тренажёр: все уроки пройдены (видимые курсы).
	const done = sql`(SELECT DISTINCT t_lesson_id FROM t_lesson_progress WHERE user_id = ${userId} AND training_pts > 0)`;
	const units = await rows(sql`
		SELECT u.id, count(l.id) AS total, count(d.t_lesson_id) AS done
		FROM t_units u
		JOIN t_courses c ON c.id = u.t_course_id AND c.id NOT IN (${hiddenList})
		JOIN t_lessons l ON l.t_unit_id = u.id
		LEFT JOIN ${done} d ON d.t_lesson_id = l.id
		GROUP BY u.id`);
	if (units.some((r) => num(r.total) >= 2 && num(r.done) === num(r.total))) keys.push('unit_done');
	for (const [courseId, key] of [[11, 'all_math'], [12, 'all_physics']] as const) {
		const r = await rows(sql`
			SELECT count(l.id) AS total, count(d.t_lesson_id) AS done
			FROM t_courses c
			JOIN t_units u ON u.t_course_id = c.id
			JOIN t_lessons l ON l.t_unit_id = u.id
			LEFT JOIN ${done} d ON d.t_lesson_id = l.id
			WHERE c.course_id = ${courseId} AND c.id NOT IN (${hiddenList})`);
		if (num(r[0]?.total) > 0 && num(r[0]?.done) === num(r[0]?.total)) keys.push(key);
	}

	// Серия дней (рекордная).
	const st = await rows(sql`SELECT COALESCE(MAX(longest_streak), 0) AS best FROM user_course_progress WHERE user_id = ${userId}`);
	const best = num(st[0]?.best);
	if (best >= 3) keys.push('streak_3');
	if (best >= 7) keys.push('streak_7');
	if (best >= 30) keys.push('streak_30');

	// Домашние задания (completed).
	const hw = await rows(sql`SELECT count(*) AS n FROM user_homework WHERE user_id = ${userId} AND status = 'completed'`);
	const hwN = num(hw[0]?.n);
	if (hwN >= 1) keys.push('hw_first');
	if (hwN >= 10) keys.push('hw_10');
	if (hwN >= 50) keys.push('hw_50');

	// Друзья и банды.
	const inv = await rows(sql`SELECT count(*) AS n FROM user_progress WHERE invited_by_user_id = ${userId}`);
	if (num(inv[0]?.n) > 0) keys.push('invite_first');
	const fl = await rows(sql`
		SELECT 1 FROM user_progress f WHERE f.invited_by_user_id = ${userId}
			AND EXISTS (SELECT 1 FROM t_lesson_progress p WHERE p.user_id = f.user_id AND p.training_pts > 0) LIMIT 1`);
	if (fl.length) keys.push('friend_lesson');
	const g = await rows(sql`SELECT 1 FROM gangs WHERE creator_user_id = ${userId} LIMIT 1`);
	if (g.length) keys.push('gang_create');

	// Сундуки: история открытых кейсов — использованные ключи (case_keys, по редкости) и счётчик
	// chests_opened из барабана (там же кейсы квестов/хода/битвы банд, у которых ключей нет).
	const ck = await rows(sql`
		SELECT tier, count(*) AS n FROM case_keys WHERE user_id = ${userId} AND used_at IS NOT NULL GROUP BY tier`);
	let opened = 0;
	for (const r of ck) {
		opened += num(r.n);
		if (['common', 'rare', 'mythic', 'mega'].includes(String(r.tier))) keys.push(`chest_${r.tier}`);
	}
	const cc = await rows(sql`SELECT value FROM achievement_counters WHERE user_id = ${userId} AND key = 'chests_opened'`);
	if (Math.max(opened, num(cc[0]?.value)) >= 10) keys.push('chests_10');

	return keys;
}

// Сверка по данным: выдаёт то, что уже выполнено. Если у пользователя ещё нет ни одной ачивки
// (первый заход после появления системы) — выдаёт тихо, без потока тостов.
export async function syncAchievements(userId: string, opts: { silent?: boolean } = {}): Promise<AchievementDTO[]> {
	const existing = await rows(sql`SELECT 1 FROM achievement_unlocks WHERE user_id = ${userId} LIMIT 1`);
	const silent = opts.silent || existing.length === 0;
	let keys: string[] = [];
	try {
		keys = await computeStateKeys(userId);
	} catch (e) {
		console.error('[achievements] computeStateKeys failed', e);
		return [];
	}
	const fresh = await unlockAchievements(userId, keys, { seen: silent });
	// «Настоящий король» — когда получены все остальные.
	const cnt = await rows(sql`SELECT count(*) AS n FROM achievement_unlocks WHERE user_id = ${userId} AND key <> 'all_achievements'`);
	if (num(cnt[0]?.n) >= ACHIEVEMENTS.length - 1) {
		fresh.push(...(await unlockAchievements(userId, ['all_achievements'], { seen: silent })));
	}
	return fresh;
}

// Сколько наград за ачивки ещё не забрано (число на пункте меню «Ачивки»).
export async function countUnclaimedAchievements(userId: string): Promise<number> {
	const r = await rows(sql`SELECT count(*) AS n FROM achievement_unlocks WHERE user_id = ${userId} AND claimed_at IS NULL`);
	return num(r[0]?.n);
}

// Ачивка самого приглашающего, когда друг что-то сделал (тост покажется при его следующем заходе).
export async function syncInviterOf(userId: string): Promise<void> {
	const r = await rows(sql`SELECT invited_by_user_id AS inviter FROM user_progress WHERE user_id = ${userId}`);
	const inviter = r[0]?.inviter ? String(r[0].inviter) : null;
	if (inviter) await syncAchievements(inviter).catch(() => {});
}
