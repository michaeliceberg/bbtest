// lib/referral.ts
//
// Базовая реферальная ссылка (Фаза 2, 2026-09-29, один уровень — без
// банд/ролей, это Фаза 3). Ссылка несёт ПОЛНЫЙ userId (не короткий
// производный код, как в utils/telegram.ts's generateBindCode) —
// ошибочная атрибуция здесь означает ложное начисление приза, поэтому
// не рискуем неоднозначным суффиксным совпадением ради красоты URL.

export const REFERRAL_COOKIE = 'referredBy'
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

// code — короткий код приглашения (lib/invite.ts), НЕ userId: в userId бывает
// телефон.
export const getReferralLink = (code: string): string => `https://ggege.ru/?ref=${code}`

// Бонус рефереру за нового ученика — пицца (по прямой просьбе
// пользователя, "ощутимая награда"): база 1 кусочек, +1 при уровне ≥5,
// +1 при ≥15 выполненных квестов дня за всё время, потолок 3 — ровно
// диапазон "1-3 кусочка", который пользователь выбрал при обсуждении.
export const REFERRAL_BONUS_LEVEL_THRESHOLD = 5
export const REFERRAL_BONUS_QUESTS_THRESHOLD = 15

export const computeReferralBonus = (referrerLevel: number, referrerQuestsTotal: number): number => {
	let bonus = 1
	if (referrerLevel >= REFERRAL_BONUS_LEVEL_THRESHOLD) bonus += 1
	if (referrerQuestsTotal >= REFERRAL_BONUS_QUESTS_THRESHOLD) bonus += 1
	return Math.min(3, bonus)
}

// Приглашение друга после урока: ggege.ru/i/КОД — страница с картинкой-превью
// для мессенджеров (app/i/[code]), сама переводит в пробный урок 485.
// l/t/s — урок, время (сек), серия: попадают в картинку-превью.
export const TRIAL_T_LESSON_ID = 485
export const getInviteLink = (code: string | null | undefined, extra?: { l?: number; t?: number; s?: number }): string => {
	if (!code) return `https://ggege.ru/t-lesson/${TRIAL_T_LESSON_ID}`
	const q = new URLSearchParams()
	if (extra?.l) q.set('l', String(extra.l))
	if (extra?.t) q.set('t', String(extra.t))
	if (extra?.s && extra.s >= 3) q.set('s', String(extra.s))
	const qs = q.toString()
	return `https://ggege.ru/i/${code}${qs ? `?${qs}` : ''}`
}
