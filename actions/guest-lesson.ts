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
import { and, eq } from 'drizzle-orm';
import db from '@/db/drizzle';
import { guestLessonLeads, t_lessonProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { DIAGNOSTIC_CASE_POOL, pickWeightedReward, type CaseReward } from '@/lib/caseRewards';
import { applyResolvedReward } from '@/lib/caseApply';
import type { OpenCaseResult } from '@/actions/open-case';

const GUEST_LEAD_COOKIE = 'guestLeadId';
const GUEST_PENDING_COOKIE = 'guestLeadPending';
// Неделя — достаточно, чтобы гость успел закончить урок и решиться
// зарегистрироваться, не бессрочно.
const GUEST_LEAD_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// Создаётся один раз на маунте гостевого экрана приза (см.
// components/guest-reward-screen.tsx) — не по клику, тот же приём, что и
// у startDiagnosticTelegramLead (actions/diagnostic.ts), чтобы к моменту
// клика по "Крутить" лид уже существовал.
export async function createGuestLead(tLessonId: number, nickname: string, vibes: string[] = []) {
	const [row] = await db.insert(guestLessonLeads).values({
		tLessonId,
		nickname,
		vibes: vibes.slice(0, 30).join(',') || null,
	}).returning({ id: guestLessonLeads.id });

	const jar = await cookies();
	jar.set(GUEST_LEAD_COOKIE, String(row.id), {
		httpOnly: true,
		maxAge: GUEST_LEAD_COOKIE_MAX_AGE,
		sameSite: 'lax',
		path: '/',
	});
	// Метка для клиента (httpOnly-куку он прочитать не может): «у гостя есть что переносить на аккаунт».
	jar.set(GUEST_PENDING_COOKIE, '1', { maxAge: GUEST_LEAD_COOKIE_MAX_AGE, sameSite: 'lax', path: '/' });

	return { leadId: row.id };
}

// Экран "Что тебе заходит?" показывается ПОСЛЕ открытия кейса — выбор и
// новый позывной дописываем в уже созданный лид (лид — из cookie, не с
// клиента, чтобы нельзя было переписать чужой).
export async function updateGuestLeadVibes(nickname: string, vibes: string[]) {
	const jar = await cookies();
	const leadId = Number(jar.get(GUEST_LEAD_COOKIE)?.value);
	if (!Number.isFinite(leadId) || leadId <= 0) return { ok: false };
	await db.update(guestLessonLeads)
		.set({ nickname: nickname.slice(0, 80), vibes: vibes.slice(0, 30).join(',') || null })
		.where(eq(guestLessonLeads.id, leadId));
	return { ok: true };
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

function clearGuestCookies(jar: Awaited<ReturnType<typeof cookies>>) {
	jar.delete(GUEST_LEAD_COOKIE);
	jar.delete(GUEST_PENDING_COOKIE);
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
	if (!lead) {
		clearGuestCookies(jar);
		return { success: false, error: 'Нет приза для переноса' };
	}

	// Урок, пройденный гостем, засчитываем аккаунту ВСЕГДА (даже если кейс он не открыл) — иначе
	// после регистрации придётся проходить тот же урок заново. Он входит в «3 урока трека»
	// для реферальной пиццы (lib/referralRewards.ts) и открытия задачника.
	const already = await db.query.t_lessonProgress.findFirst({
		where: and(eq(t_lessonProgress.userId, session.user.id), eq(t_lessonProgress.t_lessonId, lead.tLessonId)),
	});
	if (!already) {
		await db.insert(t_lessonProgress).values({
			userId: session.user.id,
			t_lessonId: lead.tLessonId,
			doneRightPercent: 100,
			trainingPts: 50,
			doneRight: 0,
			doneWrong: 0,
		}).catch(() => null);
	}

	if (!lead.caseOpened || !lead.rewardKind || lead.rewardAmount == null) {
		clearGuestCookies(jar);
		return { success: false, error: 'Нет приза для переноса' };
	}
	if (lead.claimedByUserId) {
		// Уже перенесён раньше (например повторный маунт) — не начисляем повторно.
		clearGuestCookies(jar);
		return { success: true, reward: { kind: lead.rewardKind as CaseReward['kind'], amount: lead.rewardAmount, weight: 0 } };
	}

	const reward: CaseReward = { kind: lead.rewardKind as CaseReward['kind'], amount: lead.rewardAmount, weight: 0 };
	await applyResolvedReward(session.user.id, reward);

	await db.update(guestLessonLeads).set({
		claimedByUserId: session.user.id,
		claimedAt: new Date(),
	}).where(eq(guestLessonLeads.id, leadId));

	clearGuestCookies(jar);

	return { success: true, reward };
}
