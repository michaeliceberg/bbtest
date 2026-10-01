import 'server-only'

// lib/invite.ts
//
// Короткий код приглашения вместо userId в ссылках: userId у части учеников —
// "phone:7916…", то есть номер телефона в открытую. Ссылка вида
// ggege.ru/i/K7QX2M ничего личного не раскрывает. Код и позывной
// (ученику, а не только гостю) заводятся лениво при первом запросе.

import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { pickGuestNickname } from '@/lib/nickname'

// Без похожих символов (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const makeCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')

export const INVITE_CODE_RE = /^[A-Z0-9]{6}$/

export const getOrCreateInvite = async (userId: string): Promise<{ code: string; nickname: string } | null> => {
	const row = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
		columns: { inviteCode: true, nickname: true },
	})
	if (!row) return null
	let { inviteCode, nickname } = row
	if (inviteCode && nickname) return { code: inviteCode, nickname }

	nickname = nickname ?? pickGuestNickname()
	for (let attempt = 0; attempt < 5; attempt++) {
		const code = inviteCode ?? makeCode()
		try {
			await db.update(userProgress).set({ inviteCode: code, nickname }).where(eq(userProgress.userId, userId))
			return { code, nickname }
		} catch {
			// коллизия уникального кода — пробуем другой
			inviteCode = null
		}
	}
	return null
}

export const resolveInviteCode = async (code: string) => {
	if (!INVITE_CODE_RE.test(code)) return null
	return db.query.userProgress.findFirst({
		where: eq(userProgress.inviteCode, code),
		columns: { userId: true, nickname: true },
	}) ?? null
}
