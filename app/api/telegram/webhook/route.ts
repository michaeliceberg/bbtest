
// app/api/telegram/webhook/route.ts

import { NextResponse } from 'next/server';
import { sendMessageToTelegram, generateBindCode } from '@/utils/telegram';
import db from '@/db/drizzle';
import { parentLinks, userHomework, userProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = body.message;
        
        if (!message) {
            return NextResponse.json({ ok: true });
        }
        
        const chatId = message.chat.id.toString();
        const text = message.text || '';
        const firstName = message.chat.first_name || 'Родитель';
        
        console.log('📨 Получено сообщение:', { chatId, text });
        
        // Команда /start
        if (text === '/start') {
            await sendMessageToTelegram(
                `👨‍👩‍👧 *Добро пожаловать в систему родительского контроля!*\n\n` +
                `Я буду присылать уведомления о прогрессе вашего ребенка.\n\n` +
                `🔑 *Как привязать ученика:*\n` +
                `1. Попросите ребенка показать код в приложении\n` +
                `2. Отправьте команду: /bind КОД\n` +
                `3. Пример: /bind ABC12345\n\n` +
                `📊 *Что вы будете получать:*\n` +
                `• Уведомления о просроченных ДЗ\n` +
                `• Отчеты о прогрессе\n` +
                `• Напоминания о дедлайнах\n\n` +
                `🔗 *Отвязать ученика:* /unbind`,
                chatId
            );
            return NextResponse.json({ ok: true });
        }
        
        // Команда /bind КОД
        if (text.startsWith('/bind')) {
            const parts = text.split(' ');
            const code = parts[1]?.trim().toUpperCase();
            
            if (!code) {
                await sendMessageToTelegram(
                    '❌ *Неверный формат*\n\nОтправьте код так: `/bind КОД`\nПример: `/bind ABC12345`',
                    chatId
                );
                return NextResponse.json({ ok: true });
            }
            
            // Ищем ученика по коду (последние 8 символов userId)
            const students = await db.query.userProgress.findMany();
            const student = students.find(s => generateBindCode(s.userId) === code);
            
            if (student) {
                // Проверяем, не привязан ли уже этот родитель
                const existingLink = await db.query.parentLinks.findFirst({
                    where: and(
                        eq(parentLinks.studentId, student.userId),
                        eq(parentLinks.parentTelegramId, chatId)
                    ),
                });
                
                if (existingLink) {
                    await sendMessageToTelegram(
                        `✅ *Ученик "${student.userName}" уже привязан к вашему аккаунту!*\n\n` +
                        `Вы будете получать уведомления о его прогрессе.`,
                        chatId
                    );
                } else {
                    // Сохраняем связь
                    await db.insert(parentLinks).values({
                        studentId: student.userId,
                        parentTelegramId: chatId,
                        parentName: firstName,
                        isActive: true,
                    });
                    
                    await sendMessageToTelegram(
                        `✅ *Ученик "${student.userName}" успешно привязан!*\n\n` +
                        `📊 *Что дальше?*\n` +
                        `• Вы будете получать уведомления о просроченных ДЗ\n` +
                        `• Можно отслеживать прогресс в любое время\n\n` +
                        `🔗 *Отвязать ученика:* /unbind`,
                        chatId
                    );
                    
                    // Уведомляем ученика (опционально)
                    console.log(`📢 Родитель ${firstName} привязан к ученику ${student.userName}`);
                }
            } else {
                await sendMessageToTelegram(
                    `❌ *Неверный код*\n\n` +
                    `Проверьте код у ребенка и попробуйте снова.\n` +
                    `Код должен состоять из 8 символов.\n\n` +
                    `Пример: /bind ABC12345`,
                    chatId
                );
            }
            
            return NextResponse.json({ ok: true });
        }
        
        // Команда /unbind
        if (text === '/unbind') {
            // Находим все связи этого родителя
            const links = await db.query.parentLinks.findMany({
                where: eq(parentLinks.parentTelegramId, chatId),
            });
            
            if (links.length === 0) {
                await sendMessageToTelegram(
                    `❌ *У вас нет привязанных учеников*\n\n` +
                    `Чтобы привязать ученика, используйте команду: /bind КОД`,
                    chatId
                );
            } else if (links.length === 1) {
                await db.delete(parentLinks).where(eq(parentLinks.id, links[0].id));
                await sendMessageToTelegram(
                    `✅ *Ученик успешно отвязан!*\n\n` +
                    `Вы больше не будете получать уведомления.\n` +
                    `Чтобы снова привязать ученика, используйте: /bind КОД`,
                    chatId
                );
            } else {
                // Если несколько учеников, предлагаем выбрать
                let message = `👨‍👩‍👧 *У вас привязано несколько учеников:*\n\n`;
                for (let i = 0; i < links.length; i++) {
                    const student = await db.query.userProgress.findFirst({
                        where: eq(userProgress.userId, links[i].studentId),
                    });
                    message += `${i + 1}. ${student?.userName}\n`;
                }
                message += `\nОтправьте /unbind_1, /unbind_2 и т.д. чтобы отвязать конкретного ученика.`;
                await sendMessageToTelegram(message, chatId);
            }
            
            return NextResponse.json({ ok: true });
        }
        
        // Команда /unbind_N
        if (text.startsWith('/unbind_')) {
            const index = parseInt(text.split('_')[1]) - 1;
            const links = await db.query.parentLinks.findMany({
                where: eq(parentLinks.parentTelegramId, chatId),
            });
            
            if (links[index]) {
                const student = await db.query.userProgress.findFirst({
                    where: eq(userProgress.userId, links[index].studentId),
                });
                await db.delete(parentLinks).where(eq(parentLinks.id, links[index].id));
                await sendMessageToTelegram(
                    `✅ *Ученик "${student?.userName}" отвязан!*`,
                    chatId
                );
            } else {
                await sendMessageToTelegram(`❌ *Неверный номер*`, chatId);
            }
            
            return NextResponse.json({ ok: true });
        }
        
        // Команда /report - получить отчет по всем ученикам
        if (text === '/report') {
            const links = await db.query.parentLinks.findMany({
                where: eq(parentLinks.parentTelegramId, chatId),
            });
            
            if (links.length === 0) {
                await sendMessageToTelegram(
                    `❌ *У вас нет привязанных учеников*\n\n` +
                    `Используйте команду: /bind КОД`,
                    chatId
                );
                return NextResponse.json({ ok: true });
            }
            
            let report = `📊 *Отчет о прогрессе*\n\n`;
            
            for (const link of links) {
                const student = await db.query.userProgress.findFirst({
                    where: eq(userProgress.userId, link.studentId),
                });
                
                if (student) {
                    const activeHomework = await db.query.userHomework.findMany({
                        where: and(
                            eq(userHomework.userId, student.userId),
                            eq(userHomework.status, 'pending')
                        ),
                    });
                    
                    const totalTasks = activeHomework.reduce((sum, hw) => sum + (hw.totalCount - (hw.correctCount || 0)), 0);
                    const totalHomework = activeHomework.length;
                    
                    report += `👤 *${student.userName}*\n`;
                    report += `   📚 Активных ДЗ: ${totalHomework}\n`;
                    report += `   ❌ Осталось задач: ${totalTasks}\n`;
                    report += `   🎯 Всего очков: ${student.points}\n\n`;
                }
            }
            
            await sendMessageToTelegram(report, chatId);
            return NextResponse.json({ ok: true });
        }
        
        // Команда /help
        if (text === '/help') {
            await sendMessageToTelegram(
                `📖 *Список команд*\n\n` +
                `🔹 /start - Приветствие и инструкция\n` +
                `🔹 /bind КОД - Привязать ученика\n` +
                `🔹 /unbind - Отвязать ученика\n` +
                `🔹 /report - Получить отчет о прогрессе\n` +
                `🔹 /help - Показать эту справку`,
                chatId
            );
            return NextResponse.json({ ok: true });
        }
        
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Ошибка в webhook:', error);
        return NextResponse.json({ ok: true });
    }
}