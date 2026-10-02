import 'server-only'

// lib/referralRewards.ts
//
// Реферальная пицца (2026-10-01). Ничего не начисляется при регистрации —
// только когда приглашённый прошёл все 3 разбора электродинамики
// (LEARN_UNLOCK_T_LESSONS). Тогда:
//   • сам приглашённый — 1 кусочек (80%) или 2 (20%, «Фига ты счастливчик!»);
//   • вверх по ветке приглашений: пригласивший — 1 кусочек, его пригласивший — ½,
//     следующий — ¼. Глубже — ничего (иначе похоже на пирамиду и раздувает бюджет).
// Доли копятся в user_progress.pizza_eighths; 8/8 превращаются в целый кусочек
// через applyResolvedReward (там же кап 8 и выдача промокода Додо).

import { and, eq, isNull, sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { identities, referralRewards, userProgress } from '@/db/schema'
import { applyResolvedReward } from '@/lib/caseApply'
import { referralLessonsLeft } from '@/lib/learn-unlock'
import { getOrCreateInvite } from '@/lib/invite'
import { sendMessageToTelegram } from '@/utils/telegram'

// Восьмые доли кусочка по уровню ветки: 1 → 1 кусочек, 2 → ½, 3 → ¼.
export const REFERRAL_LADDER_EIGHTHS = [8, 4, 2]
export const LUCKY_CHANCE = 0.2

export const eighthsLabel = (e: number): string => {
	const whole = Math.floor(e / 8)
	const frac = e % 8
	const fracLabel = frac === 4 ? '½' : frac === 2 ? '¼' : frac === 6 ? '¾' : frac ? `${frac}/8` : ''
	if (!whole) return `${fracLabel} кусочка`
	const w = whole === 1 ? '1 кусочек' : `${whole} кусочка`
	return fracLabel ? `${whole}${fracLabel} кусочка` : w
}

// Начисляет пиццу в восьмых долях. Целые кусочки — через applyResolvedReward.
export async function creditPizzaEighths(userId: string, eighths: number): Promise<number> {
	const row = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
		columns: { pizzaEighths: true, pizzaSlices: true },
	})
	if (!row) return 0
	const total = (row.pizzaEighths ?? 0) + eighths
	const whole = Math.floor(total / 8)
	await db.update(userProgress).set({ pizzaEighths: total % 8 }).where(eq(userProgress.userId, userId))
	if (whole > 0) {
		const r = await applyResolvedReward(userId, { kind: 'pizza', amount: whole, weight: 0 })
		return r.pizzaSlicesNow
	}
	return row.pizzaSlices
}

async function notifyTelegram(userId: string, text: string) {
	const tg = await db.query.identities.findFirst({
		where: and(eq(identities.userId, userId), eq(identities.provider, 'telegram')),
		columns: { providerAccountId: true },
	})
	if (tg?.providerAccountId) await sendMessageToTelegram(text, tg.providerAccountId).catch(() => null)
}

export type ReferralWelcomeGift = { slices: number; lucky: boolean; nickname: string; pizzaNow: number }

// Вызывается после каждого завершённого урока из ALL_TRACK_LESSONS (lib/trialTracks.ts).
// Раздаёт пиццу по ветке ровно один раз (атомарно метит referral_rewarded_at).
export async function grantReferralChainRewards(userId: string): Promise<ReferralWelcomeGift | null> {
	const me = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
		columns: { invitedByUserId: true, referralRewardedAt: true },
	})
	if (!me?.invitedByUserId || me.referralRewardedAt) return null
	if ((await referralLessonsLeft(userId)) > 0) return null

	const claimed = await db.update(userProgress)
		.set({ referralRewardedAt: new Date() })
		.where(and(eq(userProgress.userId, userId), isNull(userProgress.referralRewardedAt)))
		.returning({ invitedBy: userProgress.invitedByUserId })
	if (!claimed.length) return null

	const invite = await getOrCreateInvite(userId)
	const nickname = invite?.nickname ?? 'Новичок'

	// Сам приглашённый.
	const lucky = Math.random() < LUCKY_CHANCE
	const slices = lucky ? 2 : 1
	const pizzaNow = await creditPizzaEighths(userId, slices * 8)
	await db.insert(referralRewards).values({ beneficiaryUserId: userId, sourceUserId: userId, level: 0, eighths: slices * 8 })

	// Вверх по ветке.
	const visited = new Set<string>([userId])
	let current = claimed[0].invitedBy
	for (let level = 1; level <= REFERRAL_LADDER_EIGHTHS.length && current && !visited.has(current); level++) {
		visited.add(current)
		const up = await db.query.userProgress.findFirst({
			where: eq(userProgress.userId, current),
			columns: { userId: true, invitedByUserId: true },
		})
		if (!up) break
		const eighths = REFERRAL_LADDER_EIGHTHS[level - 1]
		await creditPizzaEighths(up.userId, eighths)
		await db.insert(referralRewards).values({ beneficiaryUserId: up.userId, sourceUserId: userId, level, eighths })
		const who = level === 1 ? nickname : `${nickname} (друг твоего друга)`
		await notifyTelegram(up.userId, `🍕 Тебе кэшбэк от ${who}: +${eighthsLabel(eighths)} пиццы! Заходи: https://ggege.ru/trainer`)
		current = up.invitedByUserId
	}

	await sendMessageToTelegram(`🍕 Реферал дошёл до конца: "${nickname}" прошёл 3 урока (физика или тригонометрия) (+${slices}${lucky ? ', счастливчик' : ''}), пицца раздана по ветке.`).catch(() => null)

	return { slices, lucky, nickname, pizzaNow }
}

export type CashbackItem = { id: number; level: number; eighths: number; nickname: string }

export async function getUnseenCashback(userId: string): Promise<CashbackItem[]> {
	const rows = (await db.execute(sql`
		SELECT r.id, r.level, r.eighths, coalesce(u.nickname, u.user_name, 'Друг') AS nickname
		FROM referral_rewards r LEFT JOIN user_progress u ON u.user_id = r.source_user_id
		WHERE r.beneficiary_user_id = ${userId} AND r.level >= 1 AND r.seen_at IS NULL
		ORDER BY r.id`)) as unknown as { id: number; level: number; eighths: number; nickname: string }[]
	return rows.map((r) => ({ id: Number(r.id), level: Number(r.level), eighths: Number(r.eighths), nickname: String(r.nickname) }))
}
