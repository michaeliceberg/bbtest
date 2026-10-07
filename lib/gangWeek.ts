// lib/gangWeek.ts
//
// Недельная битва банд. Очки банды за неделю = сумма по текущим участникам:
// +1 за каждый пройденный урок тренажёра (t_lesson_progress, training_pts > 0)
// +2 за каждый выполненный квест дня (quest_points).
// Считается за нужную неделю по времени БД (Europe/Moscow).
// Победитель прошлой недели — все участники получают редкий кейс
// (actions/gang-week.ts, claimGangWeekCase).

import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'

export const GANG_WEEK_POINTS = { lesson: 1, quest: 2 } as const

type Row = Record<string, unknown>
const q = async (query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as Row[]

export type GangWeekScore = { gangId: number; name: string; emoji: string; color: string | null; members: number; score: number }

// offsetWeeks: 0 — текущая неделя, -1 — прошлая.
export const getGangWeekScores = async (offsetWeeks = 0): Promise<GangWeekScore[]> => {
	const rows = await q(sql`
		WITH bounds AS (
			SELECT date_trunc('week', now()) + (${offsetWeeks} * interval '7 days') AS ws
		),
		member_scores AS (
			SELECT m.gang_id, m.user_id,
				(SELECT count(*) FROM t_lesson_progress p, bounds b
					WHERE p.user_id = m.user_id AND p.training_pts > 0
					AND p.date_done >= b.ws AND p.date_done < b.ws + interval '7 days') AS lessons,
				(SELECT count(*) FROM quest_points qp, bounds b
					WHERE qp.user_id = m.user_id
					AND qp.date >= b.ws AND qp.date < b.ws + interval '7 days') AS quests
			FROM gang_members m
		)
		SELECT g.id AS gang_id, g.name, g.emoji, g.color, count(ms.user_id) AS members,
			coalesce(sum(ms.lessons * ${GANG_WEEK_POINTS.lesson} + ms.quests * ${GANG_WEEK_POINTS.quest}), 0) AS score
		FROM gangs g LEFT JOIN member_scores ms ON ms.gang_id = g.id
		GROUP BY g.id ORDER BY score DESC, members DESC, g.id`)
	return rows.map((r) => ({
		gangId: Number(r.gang_id),
		name: String(r.name),
		emoji: String(r.emoji),
		color: r.color ? String(r.color) : null,
		members: Number(r.members),
		score: Number(r.score),
	}))
}

// Сколько осталось до конца текущей недели (мс) — для подписи "до конца битвы".
export const getWeekMsLeft = async (): Promise<number> => {
	const [r] = await q(sql`SELECT extract(epoch FROM (date_trunc('week', now()) + interval '7 days' - now())) * 1000 AS ms`)
	return Math.max(0, Number(r.ms))
}

// Подводит итоги прошлой недели, если ещё не подведены (идемпотентно, гонка
// двух одновременных заходов закрыта ON CONFLICT DO NOTHING на week_start).
export const settleLastGangWeek = async () => {
	const [exists] = await q(sql`SELECT 1 AS x FROM gang_week_winners WHERE week_start = date_trunc('week', now()) - interval '7 days'`)
	if (exists) return

	const scores = await getGangWeekScores(-1)
	const top = scores[0] && scores[0].score > 0 ? scores[0] : null

	const inserted = await q(sql`
		INSERT INTO gang_week_winners (week_start, gang_id, score)
		VALUES (date_trunc('week', now()) - interval '7 days', ${top?.gangId ?? null}, ${top?.score ?? 0})
		ON CONFLICT (week_start) DO NOTHING
		RETURNING week_start`)
	if (inserted.length === 0 || !top) return

	await db.execute(sql`
		INSERT INTO gang_week_rewards (week_start, user_id, gang_id)
		SELECT date_trunc('week', now()) - interval '7 days', m.user_id, m.gang_id
		FROM gang_members m WHERE m.gang_id = ${top.gangId}
		ON CONFLICT (week_start, user_id) DO NOTHING`)
}

export type LastWeekWinner = { gangId: number; name: string; emoji: string; color: string | null; score: number } | null

export const getLastWeekWinner = async (): Promise<LastWeekWinner> => {
	const [r] = await q(sql`
		SELECT w.gang_id, w.score, g.name, g.emoji, g.color FROM gang_week_winners w
		JOIN gangs g ON g.id = w.gang_id
		WHERE w.week_start = date_trunc('week', now()) - interval '7 days'`)
	if (!r) return null
	return { gangId: Number(r.gang_id), name: String(r.name), emoji: String(r.emoji), color: r.color ? String(r.color) : null, score: Number(r.score) }
}

export const hasUnclaimedGangWeekReward = async (userId: string): Promise<boolean> => {
	const [r] = await q(sql`SELECT 1 AS x FROM gang_week_rewards WHERE user_id = ${userId} AND NOT claimed LIMIT 1`)
	return Boolean(r)
}
