'use server';

// actions/referral.ts
//
// Фаза 2 реферальной воронки (2026-09-29) — ставит cookie referredBy при
// заходе по ссылке ?ref=<userId> (components/referral-catcher.tsx,
// смонтирован в app/(marketing)/layout.tsx). Сама атрибуция (кто кого
// пригласил + начисление бонуса рефереру) происходит позже, в момент
// первой РЕАЛЬНОЙ регистрации (actions/user-progress.ts, upsertUserProgress) —
// здесь только "запоминаем, что был переход по чьей-то ссылке".

import { cookies } from 'next/headers';
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from '@/lib/referral';
import { resolveInviteCode } from '@/lib/invite';
import { getUserProgressById } from '@/db/queries';
import { and, eq, inArray } from 'drizzle-orm';
import db from '@/db/drizzle';
import { referralRewards } from '@/db/schema';
import { auth } from '@/lib/auth';

// ref — короткий код приглашения (lib/invite.ts) или, по старым ссылкам,
// сам userId. В cookie кладём userId (httpOnly — в браузере друга не виден).
export async function setReferralCookie(ref: string) {
	const jar = cookies();
	if (jar.get(REFERRAL_COOKIE)) return;
	const byCode = await resolveInviteCode(ref);
	const referrerId = byCode?.userId ?? ((await getUserProgressById(ref)) ? ref : null);
	if (!referrerId) return;
	// First-touch атрибуция — не перезаписываем, если cookie уже стоит
	// (пользователь мог сначала перейти по одной ссылке, потом по другой).
	if (jar.get(REFERRAL_COOKIE)) return;

	jar.set(REFERRAL_COOKIE, referrerId, {
		maxAge: REFERRAL_COOKIE_MAX_AGE,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
	});
}

// Экран «Тебе кэшбэк от …» на /trainer закрыли — больше не показываем.
export async function markCashbackSeen(ids: number[]) {
	const session = await auth();
	if (!session?.user?.id || !ids.length) return;
	await db.update(referralRewards).set({ seenAt: new Date() })
		.where(and(eq(referralRewards.beneficiaryUserId, session.user.id), inArray(referralRewards.id, ids)));
}
