// actions/user-profile.ts

'use server';

import db from "@/db/drizzle";
import { unlockAchievements } from '@/lib/achievements';
import { userProgress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq, gte, sql } from "drizzle-orm";
import { AVATAR_REROLL_COST, newAvatarUrl } from "@/lib/avatar";
import { revalidatePath } from "next/cache";

export const updateUserName = async (name: string) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Вы не авторизованы!');

    const trimmed = name.trim();
    if (!trimmed) throw new Error('Имя не может быть пустым');
    if (trimmed.length > 40) throw new Error('Слишком длинное имя');

    await db.update(userProgress)
        .set({ userName: trimmed })
        .where(eq(userProgress.userId, session.user.id));

    revalidatePath('/account');
    revalidatePath('/learn');

    return { success: true };
};

// Платная перегенерация аватарки (/account): списываем AVATAR_REROLL_COST
// монет и выдаём новый случайный образ. Списание — одним атомарным UPDATE с
// проверкой остатка, чтобы два одновременных клика не увели баланс в минус.
export const rerollUserAvatar = async (): Promise<{ success: boolean; error?: string; imageSrc?: string }> => {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Вы не авторизованы!');

    const imageSrc = newAvatarUrl();
    const updated = await db.update(userProgress)
        .set({ points: sql`${userProgress.points} - ${AVATAR_REROLL_COST}`, userImageSrc: imageSrc })
        .where(and(eq(userProgress.userId, session.user.id), gte(userProgress.points, AVATAR_REROLL_COST)))
        .returning({ userId: userProgress.userId });

    if (updated.length === 0) return { success: false, error: 'Не хватает монет' };

    revalidatePath('/account');
    revalidatePath('/learn');
    revalidatePath('/trainer');
    revalidatePath('/leaderboard');

    await unlockAchievements(session.user.id, ['avatar_change'], { seen: false }).catch(() => {});
    return { success: true, imageSrc };
};
