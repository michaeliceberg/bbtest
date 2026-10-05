// actions/open-key-case.ts
//
// Открытие кейса ТОЛЬКО по ключу, который выдал сервер (lib/caseKeys.ts).
// Раньше openCase/openLessonCase можно было вызвать с клиента с любой
// редкостью — теперь редкость берётся из самого ключа, ключ одноразовый.

'use server';

import { auth } from '@/lib/auth';
import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getLessonCasePool, type LessonCaseTier } from '@/lib/caseRewards';
import { applyCaseReward, type OpenCaseResult } from '@/lib/caseApply';
import { consumeCaseKey } from '@/lib/caseKeys';

export async function openKeyCase(keyId: number): Promise<OpenCaseResult> {
	const session = await auth();
	if (!session?.user?.id) return { success: false, error: 'Не авторизован' };
	const tier = await consumeCaseKey(session.user.id, Number(keyId));
	if (!tier) return { success: false, error: 'Ключ недействителен или уже использован' };
	return applyCaseReward(getLessonCasePool(tier));
}

// Только для админских тестовых страниц (/test-case-reel, /test-quests):
// открыть кейс заданной редкости без ключа.
export async function openTestCase(tier: LessonCaseTier): Promise<OpenCaseResult> {
	const session = await auth();
	if (!session?.user?.id) return { success: false, error: 'Не авторизован' };
	const me = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, session.user.id) });
	if (me?.isAdmin !== 1) return { success: false, error: 'Только для админа' };
	return applyCaseReward(getLessonCasePool(tier));
}
