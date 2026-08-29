// actions/award-hot-question-reward.ts
//
// "Горячий вопрос" (см. CLAUDE.md) — если пользователь угадал реальную
// величину с точностью до 50%, ему полагается отдельный подарок ПОСЛЕ
// всего урока (не сразу) — см. TQUIZ.tsx, экран "Завершено!". Награда
// фиксированная (не привязана к сложности факта — сама фича "для
// настроения", не часть основной системы очков).

'use server';

import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const HOT_QUESTION_BONUS_GEMS = 15;

export async function awardHotQuestionReward() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }
    const userId = session.user.id;

    await db.update(userProgress)
        .set({ gems: sql`${userProgress.gems} + ${HOT_QUESTION_BONUS_GEMS}` })
        .where(eq(userProgress.userId, userId));

    revalidatePath('/trainer');

    return { success: true, gems: HOT_QUESTION_BONUS_GEMS };
}
