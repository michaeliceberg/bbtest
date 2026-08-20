// lib/notify-homework-assigned.ts
//
// При выдаче ДЗ классу — сразу уведомляем ученика (если у него привязан
// Telegram) и его родителя (если есть активная привязка parentLinks).
// Молчит при ошибках отправки — не должно ломать саму выдачу ДЗ.

import db from '@/db/drizzle';
import { identities, parentLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendMessageToTelegram } from '@/utils/telegram';

function declension(n: number, one: string, two: string, five: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return five;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return two;
    return five;
}

function buildSummary(challengeCount: number, trainerLessonCount: number): string {
    const parts: string[] = [];
    if (challengeCount > 0) {
        parts.push(`${challengeCount} ${declension(challengeCount, 'задание', 'задания', 'заданий')} из задачника`);
    }
    if (trainerLessonCount > 0) {
        parts.push(`${trainerLessonCount} ${declension(trainerLessonCount, 'урок', 'урока', 'уроков')} тренажёра`);
    }
    return parts.join(' и ');
}

export async function notifyHomeworkAssigned(
    studentUserId: string,
    studentName: string,
    challengeCount: number,
    trainerLessonCount: number,
    dueDate: Date,
) {
    if (challengeCount === 0 && trainerLessonCount === 0) return;

    const summary = buildSummary(challengeCount, trainerLessonCount);
    const dueDateStr = dueDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

    const studentTelegram = await db.query.identities.findFirst({
        where: and(eq(identities.provider, 'telegram'), eq(identities.userId, studentUserId)),
    });
    if (studentTelegram) {
        await sendMessageToTelegram(
            `📚 *Новое домашнее задание!*\n\n${summary}.\n\nСрок сдачи: до ${dueDateStr}.\nЗаходи в приложение и решай!`,
            studentTelegram.providerAccountId
        );
    }

    const parents = await db.query.parentLinks.findMany({
        where: and(eq(parentLinks.studentId, studentUserId), eq(parentLinks.isActive, true)),
    });
    for (const parent of parents) {
        await sendMessageToTelegram(
            `📚 *Новое домашнее задание у ${studentName}*\n\n${summary}.\n\nСрок сдачи: до ${dueDateStr}.`,
            parent.parentTelegramId
        );
    }
}
