// app/api/cron/send-notifications/route.ts

import { NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { parentLinks, userHomework, userProgress } from '@/db/schema';
import { and, eq, lt, gte } from 'drizzle-orm';
import { sendMessageToTelegram } from '@/utils/telegram';

// Тип для домашнего задания
type Homework = {
    id: number;
    userId: string;
    courseId: number | null;
    challengeIds: string;
    totalCount: number;
    assignedAt: Date;
    dueDate: Date;
    status: string;
    completedAt: Date | null;
    correctCount: number;
    wrongCount: number;
    lastNotifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function GET(req: Request) {
    // Проверка секретного ключа для безопасности
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    
    // 1. Находим просроченные ДЗ
    const expiredHomework = await db.query.userHomework.findMany({
        where: and(
            lt(userHomework.dueDate, now),
            eq(userHomework.status, 'pending')
        ),
    }) as Homework[];
    
    // 2. Находим ДЗ, срок которых истекает через 3 часа
    const expiringSoon = await db.query.userHomework.findMany({
        where: and(
            gte(userHomework.dueDate, now),
            lt(userHomework.dueDate, threeHoursLater),
            eq(userHomework.status, 'pending')
        ),
    }) as Homework[];
    
    // Группируем по ученикам
    const studentsWithExpired = new Map<string, Homework[]>();
    for (const hw of expiredHomework) {
        if (!studentsWithExpired.has(hw.userId)) {
            studentsWithExpired.set(hw.userId, []);
        }
        studentsWithExpired.get(hw.userId)!.push(hw);
    }
    
    const studentsWithExpiring = new Map<string, Homework[]>();
    for (const hw of expiringSoon) {
        if (!studentsWithExpiring.has(hw.userId)) {
            studentsWithExpiring.set(hw.userId, []);
        }
        studentsWithExpiring.get(hw.userId)!.push(hw);
    }
    
    // Отправляем уведомления о просроченных ДЗ
    //
    // так было неправильно for (const [studentId, homeworkList] of studentsWithExpired) {
    for (const [studentId, homeworkList] of Array.from(studentsWithExpired.entries())) {
    // for (const [studentId, homeworkList] of studentsWithExpired.entries()) {
        const parent = await db.query.parentLinks.findFirst({
            where: and(
                eq(parentLinks.studentId, studentId),
                eq(parentLinks.isActive, true)
            ),
        });
        
        if (parent) {
            const student = await db.query.userProgress.findFirst({
                where: eq(userProgress.userId, studentId),
            });
            
            const totalExpired = homeworkList.length;
            // 🔥 ИСПРАВЛЕНО: добавлены типы для параметров reduce
            const totalTasks = homeworkList.reduce((sum: number, hw: Homework) => {
                return sum + (hw.totalCount - (hw.correctCount || 0));
            }, 0);
            
            const message = `⚠️ *ВНИМАНИЕ! ПРОСРОЧЕННЫЕ ДЗ!*\n\n` +
                `У вашего ребенка *${student?.userName}* есть просроченные домашние задания!\n\n` +
                `📚 *Просрочено ДЗ:* ${totalExpired}\n` +
                `❌ *Невыполненных задач:* ${totalTasks}\n\n` +
                `Зайдите в приложение, чтобы увидеть подробности.\n` +
                `Используйте команду /report для полного отчета.`;
            
            await sendMessageToTelegram(message, parent.parentTelegramId);
            
            // Обновляем время последнего уведомления
            await db.update(parentLinks)
                .set({ lastNotifiedAt: new Date() })
                .where(eq(parentLinks.id, parent.id));
        }
    }
    
    // Отправляем уведомления о ДЗ, срок которых истекает
    // for (const [studentId, homeworkList] of studentsWithExpiring) {
        for (const [studentId, homeworkList] of Array.from(studentsWithExpired)) {
        const parent = await db.query.parentLinks.findFirst({
            where: and(
                eq(parentLinks.studentId, studentId),
                eq(parentLinks.isActive, true)
            ),
        });
        
        // Проверяем, не отправляли ли уведомление за последние 24 часа
        if (parent && (!parent.lastNotifiedAt || parent.lastNotifiedAt < new Date(now.getTime() - 24 * 60 * 60 * 1000))) {
            const student = await db.query.userProgress.findFirst({
                where: eq(userProgress.userId, studentId),
            });
            
            // 🔥 ИСПРАВЛЕНО: добавлены типы для параметров reduce
            const totalTasks = homeworkList.reduce((sum: number, hw: Homework) => {
                return sum + (hw.totalCount - (hw.correctCount || 0));
            }, 0);
            
            const message = `⏰ *ВНИМАНИЕ! ДЗ СКОРО СДАВАТЬ!*\n\n` +
                `У вашего ребенка *${student?.userName}* осталось менее 3 часов до срока сдачи!\n\n` +
                `❌ *Осталось решить задач:* ${totalTasks}\n\n` +
                `Поторопитесь, чтобы не получить просрочку!`;
            
            await sendMessageToTelegram(message, parent.parentTelegramId);
            
            await db.update(parentLinks)
                .set({ lastNotifiedAt: new Date() })
                .where(eq(parentLinks.id, parent.id));
        }
    }
    
    return NextResponse.json({ 
        success: true, 
        expired: studentsWithExpired.size,
        expiringSoon: studentsWithExpiring.size
    });
}