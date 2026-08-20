// actions/user-profile.ts

'use server';

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
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

export const updateUserAvatar = async (avatarSrc: string) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Вы не авторизованы!');

    await db.update(userProgress)
        .set({ userImageSrc: avatarSrc })
        .where(eq(userProgress.userId, session.user.id));

    revalidatePath('/account');
    revalidatePath('/learn');
    revalidatePath('/leaderboard');

    return { success: true };
};
