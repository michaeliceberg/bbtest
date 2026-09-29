// actions/gang-week.ts
//
// Открыть редкий кейс за победу банды в недельной битве (lib/gangWeek.ts).
// Сервер сам проверяет, что у пользователя есть неоткрытая награда, и
// атомарно помечает её открытой — повторно открыть нельзя.

'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { getLessonCasePool } from '@/lib/caseRewards'
import { applyCaseReward, type OpenCaseResult } from '@/lib/caseApply'

export async function claimGangWeekCase(): Promise<OpenCaseResult> {
	const session = await auth()
	const userId = session?.user?.id
	if (!userId) return { success: false, error: 'Нужно войти' }

	const claimed = (await db.execute(sql`
		UPDATE gang_week_rewards SET claimed = true, claimed_at = now()
		WHERE id = (SELECT id FROM gang_week_rewards WHERE user_id = ${userId} AND NOT claimed ORDER BY week_start LIMIT 1 FOR UPDATE SKIP LOCKED)
		RETURNING id`)) as unknown as unknown[]
	if (claimed.length === 0) return { success: false, error: 'Приза нет или он уже открыт' }

	return applyCaseReward(getLessonCasePool('rare'))
}
