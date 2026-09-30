// lib/referral.ts
//
// Базовая реферальная ссылка (Фаза 2, 2026-09-29, один уровень — без
// банд/ролей, это Фаза 3). Ссылка несёт ПОЛНЫЙ userId (не короткий
// производный код, как в utils/telegram.ts's generateBindCode) —
// ошибочная атрибуция здесь означает ложное начисление приза, поэтому
// не рискуем неоднозначным суффиксным совпадением ради красоты URL.

export const REFERRAL_COOKIE = 'referredBy'
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

export const getReferralLink = (userId: string): string => `https://ggege.ru/?ref=${userId}`

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

// Приглашение друга ведёт не на главную, а сразу в пробный урок (id=485,
// открыт без регистрации — см. app/t-lesson/[t_lessonId]/page.tsx): друг
// сразу играет, в конце кейс и «зарегистрируйся — забери приз». ?ref= ловит
// ReferralCatcher на странице урока, атрибуция та же, что у getReferralLink.
export const TRIAL_T_LESSON_ID = 485
export const getTrialInviteLink = (userId?: string | null): string =>
	`https://ggege.ru/t-lesson/${TRIAL_T_LESSON_ID}${userId ? `?ref=${encodeURIComponent(userId)}` : ''}`
