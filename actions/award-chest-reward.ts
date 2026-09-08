// actions/award-chest-reward.ts
//
// "Сундук" на карте скиллов тренажёра (components/trainer-grade-tree.tsx,
// иконка 🎁 с мигающей подсветкой вместо обычной яйцо/щит/меч) — по прямой
// просьбе пользователя, для дополнительной вовлечённости. Обычный
// сундук — на одном из промежуточных этапов темы; мегасундук — на
// последнем этапе темы (там же, где уже жил HP-босс). Награда —
// РАНДОМНОЕ количество монет (гемов), начисляется тем же путём, что уже
// проверенный HOT_QUESTION_BONUS_GEMS в award-hot-question-reward.ts —
// сервер сам решает сумму, клиент только показывает то, что вернулось.

'use server';

import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const CHEST_GEMS_MIN = 5;
const CHEST_GEMS_MAX = 25;
const MEGA_CHEST_GEMS_MIN = 50;
const MEGA_CHEST_GEMS_MAX = 150;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function awardChestReward(isMega: boolean = false) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }
    const userId = session.user.id;

    const gems = isMega ? randomInt(MEGA_CHEST_GEMS_MIN, MEGA_CHEST_GEMS_MAX) : randomInt(CHEST_GEMS_MIN, CHEST_GEMS_MAX);

    await db.update(userProgress)
        .set({ gems: sql`${userProgress.gems} + ${gems}` })
        .where(eq(userProgress.userId, userId));

    revalidatePath('/trainer');

    return { success: true, gems };
}
