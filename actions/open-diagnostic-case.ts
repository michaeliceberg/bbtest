'use server';

// actions/open-diagnostic-case.ts
//
// Кейс за номер телефона на анонимном диагностическом тесте — визуально
// та же механика, что и в actions/open-case.ts (сервер решает награду ДО
// анимации), но НЕ привязана к реальному аккаунту (openCase требует
// auth() — на этом этапе воронки пользователь ещё анонимен, аккаунта
// нет). Награда — чисто "витринная" (дофаминовый момент открытия,
// см. обсуждение с пользователем), реального баланса не существует, пока
// человек не зарегистрируется — начислить туда пока нечего.
// leadId привязывает кейс к конкретному отправленному номеру и не даёт
// открыть его повторно на одном и том же лиде.

import db from '@/db/drizzle';
import { diagnosticLeads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DIAGNOSTIC_CASE_POOL, pickWeightedReward } from '@/lib/caseRewards';
import type { OpenCaseResult } from '@/actions/open-case';

export async function openDiagnosticCase(leadId: number): Promise<OpenCaseResult> {
	const lead = await db.query.diagnosticLeads.findFirst({ where: eq(diagnosticLeads.id, leadId) });
	if (!lead) return { success: false, error: 'Лид не найден' };
	if (lead.caseOpened) return { success: false, error: 'Кейс уже открыт' };

	const reward = pickWeightedReward(DIAGNOSTIC_CASE_POOL);

	await db.update(diagnosticLeads).set({ caseOpened: true }).where(eq(diagnosticLeads.id, leadId));

	return { success: true, reward, pizzaSlicesNow: 0, justMaxedPizza: false };
}
