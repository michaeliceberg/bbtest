'use server';

// actions/guest-lesson.ts
//
// Анонимный доступ к одному бесплатному пробному уроку тренажёра (см.
// PUBLIC_TRIAL_T_LESSON_ID в app/t-lesson/[t_lessonId]/page.tsx). Тот же
// принцип, что и у actions/open-diagnostic-case.ts (никакой сессии,
// идентичность по числовому leadId), но с ключевым отличием: кейс
// открывается и показывает приз СРАЗУ по завершении урока, без Telegram-
// гейта, а зарегистрироваться предлагается уже ПОСЛЕ показа приза — чтобы
// его "забрать" (эффект неприятия потери). Приз сохраняется на самом лиде
// (не перевыпадает при рефреше) — claimGuestLeadReward переносит именно
// его на реальный аккаунт после регистрации.

import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import db from '@/db/drizzle';
import { guestLessonLeads } from '@/db/schema';
import { auth } from '@/lib/auth';
import { DIAGNOSTIC_CASE_POOL, pickWeightedReward, type CaseReward } from '@/lib/caseRewards';
import { applyResolvedReward } from '@/lib/caseApply';
import type { OpenCaseResult } from '@/actions/open-case';

const GUEST_LEAD_COOKIE = 'guestLeadId';
// Неделя — достаточно, чтобы гость успел закончить урок и решиться
// зарегистрироваться, не бессрочно.
const GUEST_LEAD_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// Создаётся один раз на маунте гостевого экрана приза (см.
// components/guest-reward-screen.tsx) — не по клику, тот же приём, что и
// у startDiagnosticTelegramLead (actions/diagnostic.ts), чтобы к моменту
// клика по "Крутить" лид уже существовал.
export async function createGuestLead(tLessonId: number, nickname: string) {
	const [row] = await db.insert(guestLessonLeads).values({
		tLessonId,
		nickname,
	}).returning({ id: guestLessonLeads.id });

	const jar = await cookies();
	jar.set(GUEST_LEAD_COOKIE, String(row.id), {
		httpOnly: true,
		maxAge: GUEST_LEAD_COOKIE_MAX_AGE,
		sameSite: 'lax',
		path: '/',
	});

	return { leadId: row.id };
}

// spinAction для CaseReel — без auth(), как и openDiagnosticCase. Приз
// пишется прямо в строку лида (reward_kind/reward_amount), не в
// userProgress — реального аккаунта ещё нет.
export async function openGuestLeadCase(leadId: number): Promise<OpenCaseResult> {
	const lead = await db.query.guestLessonLeads.findFirst({ where: eq(guestLessonLeads.id, leadId) });
	if (!lead) return { success: false, error: 'Лид не найден' };
	if (lead.caseOpened) return { success: false, error: 'Кейс уже открыт' };

	const reward = pickWeightedReward(DIAGNOSTIC_CASE_POOL);

	await db.update(guestLessonLeads).set({
		caseOpened: true,
		rewardKind: reward.kind,
		rewardAmount: reward.amount,
	}).where(eq(guestLessonLeads.id, leadId));

	return { success: true, reward, pizzaSlicesNow: 0, justMaxedPizza: false };
}

export type ClaimGuestRewardResult =
	| { success: true; reward: CaseReward }
	| { success: false; error: string };

// Вызывается ПОСЛЕ регистрации (см. components/guest-reward-claimer.tsx,
// смонтирован на /trainer) — требует сессию, читает leadId из cookie,
// переносит УЖЕ показанный гостю приз на новый аккаунт. Идемпотентно:
// повторный вызов (например двойной рендер) не начислит награду дважды,
// т.к. claimedByUserId проставляется в том же UPDATE, что и гвардится.
export async function claimGuestLeadReward(): Promise<ClaimGuestRewardResult> {
	const session = await auth();
	if (!session?.user?.id) {
		return { success: false, error: 'Не авторизован' };
	}

	const jar = await cookies();
	const leadIdRaw = jar.get(GUEST_LEAD_COOKIE)?.value;
	if (!leadIdRaw) return { success: false, error: 'Нет приза для переноса' };
	const leadId = Number(leadIdRaw);

	const lead = await db.query.guestLessonLeads.findFirst({ where: eq(guestLessonLeads.id, leadId) });
	if (!lead || !lead.caseOpened || !lead.rewardKind || lead.rewardAmount == null) {
		jar.delete(GUEST_LEAD_COOKIE);
		return { success: false, error: 'Нет приза для переноса' };
	}
	if (lead.claimedByUserId) {
		// Уже перенесён раньше (например повторный маунт) — не начисляем
		// повторно, просто молча подтверждаем сам факт приза.
		jar.delete(GUEST_LEAD_COOKIE);
		return { success: true, reward: { kind: lead.rewardKind as CaseReward['kind'], amount: lead.rewardAmount, weight: 0 } };
	}

	const reward: CaseReward = { kind: lead.rewardKind as CaseReward['kind'], amount: lead.rewardAmount, weight: 0 };
	await applyResolvedReward(session.user.id, reward);

	await db.update(guestLessonLeads).set({
		claimedByUserId: session.user.id,
		claimedAt: new Date(),
	}).where(eq(guestLessonLeads.id, leadId));

	jar.delete(GUEST_LEAD_COOKIE);

	return { success: true, reward };
}
