
// app/api/telegram/webhook/route.ts

import { NextResponse } from 'next/server';
import { sendMessageToTelegram, generateBindCode, TelegramReplyKeyboard } from '@/utils/telegram';
import db from '@/db/drizzle';
import { parentLinks, userHomework, userProgress, classes, identities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Reply-клавиатура вместо ручного набора команд — нажатие кнопки
// присылает её подпись обычным текстовым сообщением, которое мы тут же
// сопоставляем с канонической командой.
const BUTTON_LABELS: Record<string, string> = {
    '📊 Статус классов': '/class_status',
    '📖 Отчёт': '/report',
    '🔓 Отвязать': '/unbind',
    '❓ Помощь': '/help',
};

const TEACHER_KEYBOARD: TelegramReplyKeyboard = {
    keyboard: [['📊 Статус классов', '📖 Отчёт'], ['❓ Помощь']],
    resize_keyboard: true,
};

const PARENT_KEYBOARD: TelegramReplyKeyboard = {
    keyboard: [['📖 Отчёт', '🔓 Отвязать'], ['❓ Помощь']],
    resize_keyboard: true,
};

async function isTeacherChat(chatId: string): Promise<boolean> {
    const teacherIdentity = await db.query.identities.findFirst({
        where: and(eq(identities.provider, 'telegram'), eq(identities.providerAccountId, chatId)),
    });
    if (!teacherIdentity) return false;

    const teacher = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, teacherIdentity.userId),
    });
    return !!teacher?.isAdmin;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = body.message;

        if (!message) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id.toString();
        const rawText = message.text || '';
        const text = BUTTON_LABELS[rawText] || rawText;
        const firstName = message.chat.first_name || 'Родитель';

        console.log('📨 Получено сообщение:', { chatId, text });

        const isTeacher = await isTeacherChat(chatId);
        const keyboard = isTeacher ? TEACHER_KEYBOARD : PARENT_KEYBOARD;

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
                `Пользуйтесь кнопками внизу — так быстрее, чем вводить команды.`,
                chatId,
                keyboard
            );
            return NextResponse.json({ ok: true });
        }

        // Команда /bind КОД
        if (rawText.startsWith('/bind')) {
            const parts = rawText.split(' ');
            const code = parts[1]?.trim().toUpperCase();

            if (!code) {
                await sendMessageToTelegram(
                    '❌ *Неверный формат*\n\nОтправьте код так: `/bind КОД`\nПример: `/bind ABC12345`',
                    chatId,
                    keyboard
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
                        chatId,
                        keyboard
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
                        `• Можно отслеживать прогресс в любое время`,
                        chatId,
                        keyboard
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
                    chatId,
                    keyboard
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
                    chatId,
                    keyboard
                );
            } else if (links.length === 1) {
                await db.delete(parentLinks).where(eq(parentLinks.id, links[0].id));
                await sendMessageToTelegram(
                    `✅ *Ученик успешно отвязан!*\n\n` +
                    `Вы больше не будете получать уведомления.\n` +
                    `Чтобы снова привязать ученика, используйте: /bind КОД`,
                    chatId,
                    keyboard
                );
            } else {
                // Если несколько учеников, предлагаем выбрать
                let unbindMessage = `👨‍👩‍👧 *У вас привязано несколько учеников:*\n\n`;
                for (let i = 0; i < links.length; i++) {
                    const student = await db.query.userProgress.findFirst({
                        where: eq(userProgress.userId, links[i].studentId),
                    });
                    unbindMessage += `${i + 1}. ${student?.userName}\n`;
                }
                unbindMessage += `\nОтправьте \`/unbind_1\`, \`/unbind_2\` и т.д. чтобы отвязать конкретного ученика.`;
                await sendMessageToTelegram(unbindMessage, chatId, keyboard);
            }

            return NextResponse.json({ ok: true });
        }

        // Команда /unbind_N
        if (rawText.startsWith('/unbind_')) {
            const index = parseInt(rawText.split('_')[1]) - 1;
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
                    chatId,
                    keyboard
                );
            } else {
                await sendMessageToTelegram(`❌ *Неверный номер*`, chatId, keyboard);
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
                    chatId,
                    keyboard
                );
                return NextResponse.json({ ok: true });
            }

            const reportTitle = links.length === 1 ? `📊 *Отчёт по вашему ученику*` : `📊 *Отчёт по вашим ученикам*`;
            let report = `${reportTitle}\n\n`;

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

            await sendMessageToTelegram(report, chatId, keyboard);
            return NextResponse.json({ ok: true });
        }

        // Команда /class_status — компактная сводка по классам, только для учителя (админа)
        if (text === '/class_status') {
            if (!isTeacher) {
                await sendMessageToTelegram(
                    `❌ *Эта команда только для учителя*`,
                    chatId,
                    keyboard
                );
                return NextResponse.json({ ok: true });
            }

            const allClasses = await db.query.classes.findMany();

            if (allClasses.length === 0) {
                await sendMessageToTelegram(`❌ *Классов пока нет*`, chatId, keyboard);
                return NextResponse.json({ ok: true });
            }

            let report = `📋 *Статус по классам*\n`;

            for (const cls of allClasses) {
                const students = await db.query.userProgress.findMany({
                    where: eq(userProgress.classId, cls.id),
                });

                if (students.length === 0) continue;

                report += `\n*${cls.title}*\n`;

                for (const student of students) {
                    const pendingHw = await db.query.userHomework.findMany({
                        where: and(
                            eq(userHomework.userId, student.userId),
                            eq(userHomework.status, 'pending'),
                            eq(userHomework.type, 'teacher'),
                        ),
                    });

                    if (pendingHw.length === 0) {
                        report += `⚪ ${student.userName} — нет активного ДЗ\n`;
                        continue;
                    }

                    const totalCount = pendingHw.reduce((sum, hw) => sum + hw.totalCount, 0);
                    const correctCount = pendingHw.reduce((sum, hw) => sum + hw.correctCount, 0);
                    const icon = correctCount >= totalCount && totalCount > 0 ? '✅' : correctCount > 0 ? '⏳' : '❌';

                    report += `${icon} ${student.userName} — ${correctCount}/${totalCount}\n`;
                }
            }

            await sendMessageToTelegram(report, chatId, keyboard);
            return NextResponse.json({ ok: true });
        }

        // Команда /help
        if (text === '/help') {
            const commandsList = isTeacher
                ? `🔹 /report - Отчёт по вашим привязанным ученикам\n` +
                  `🔹 \`/class_status\` - Сводка по классам\n` +
                  `🔹 /bind КОД - Привязать ученика\n` +
                  `🔹 /unbind - Отвязать ученика\n`
                : `🔹 /bind КОД - Привязать ученика\n` +
                  `🔹 /unbind - Отвязать ученика\n` +
                  `🔹 /report - Получить отчет о прогрессе\n`;

            await sendMessageToTelegram(
                `📖 *Список команд*\n\n` +
                `🔹 /start - Приветствие и инструкция\n` +
                commandsList +
                `🔹 /help - Показать эту справку\n\n` +
                `Или просто нажимайте кнопки внизу экрана 👇`,
                chatId,
                keyboard
            );
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('❌ Ошибка в webhook:', error);
        return NextResponse.json({ ok: true });
    }
}
