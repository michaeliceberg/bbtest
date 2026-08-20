// actions/manage-classes.ts
//
// Создание классов и назначение ученика в класс — раньше это можно было
// сделать только напрямую в БД, страница /class только показывала уже
// существующие классы.

'use server';

import db from "@/db/drizzle";
import { classes, userProgress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Вы не авторизованы!');

    const current = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, session.user.id),
    });
    if (!current?.isAdmin) throw new Error('Недостаточно прав!');
}

export const createClass = async (title: string) => {
    await requireAdmin();

    const trimmed = title.trim();
    if (!trimmed) throw new Error('Название класса не может быть пустым');

    await db.insert(classes).values({
        title: trimmed,
        imageSrc: '/class.svg',
    });

    revalidatePath('/class');
    return { success: true };
};

export const assignStudentToClass = async (studentUserId: string, classId: number | null) => {
    await requireAdmin();

    await db.update(userProgress)
        .set({ classId })
        .where(eq(userProgress.userId, studentUserId));

    revalidatePath('/class');
    return { success: true };
};
