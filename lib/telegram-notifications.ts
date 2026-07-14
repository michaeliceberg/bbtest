// // lib/telegram-notifications.ts

// import { db } from '@/db/drizzle';
// import { userHomework, userProgress, parentLinks } from '@/db/schema';
// import { and, lt, eq } from 'drizzle-orm';

// // Функция для отправки уведомлений (запускать по cron каждый час)
// export async function sendHomeworkNotifications() {
//     const now = new Date();
    
//     // Находим все активные ДЗ, у которых:
//     // - срок истекает через < 3 часов
//     // - еще не отправляли уведомление
//     const expiringHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.status, 'pending'),
//             lt(userHomework.dueDate, new Date(now.getTime() + 3 * 60 * 60 * 1000)),
//             eq(userHomework.lastNotifiedAt, null)
//         ),
//     });

//     for (const hw of expiringHomework) {
//         const student = await db.query.userProgress.findFirst({
//             where: eq(userProgress.userId, hw.userId),
//         });
        
//         // Находим родителя ученика
//         const parentLink = await db.query.parentLinks.findFirst({
//             where: eq(parentLinks.studentId, hw.userId),
//         });
        
//         if (parentLink && parentLink.parentTelegramId && student) {
//             const completedPercent = (hw.completedCount / hw.totalCount) * 100;
//             const hoursLeft = Math.ceil((hw.dueDate.getTime() - now.getTime()) / (60 * 60 * 1000));
            
//             let message = '';
//             if (completedPercent === 0) {
//                 message = `⚠️ *${student.userName}* еще не начал(а) домашнее задание!\nОсталось ${hoursLeft} часов.`;
//             } else if (completedPercent < 100) {
//                 message = `⏰ *${student.userName}* выполнил(а) ${completedPercent}% домашнего задания!\nОсталось ${hoursLeft} часов.`;
//             }
            
//             if (message) {
//                 await sendTelegramMessage(parentLink.parentTelegramId, message);
                
//                 // Отмечаем, что уведомление отправлено
//                 await db.update(userHomework)
//                     .set({ lastNotifiedAt: new Date() })
//                     .where(eq(userHomework.id, hw.id));
//             }
//         }
//     }
    
//     // Отправка summary для родителей в конце дня
//     await sendDailySummary();
// }

// // Функция для отправки ежедневного отчета
// async function sendDailySummary() {
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     yesterday.setHours(0, 0, 0, 0);
    
//     const yesterdayEnd = new Date(yesterday);
//     yesterdayEnd.setHours(23, 59, 59, 999);
    
//     // Находим ДЗ за вчера
//     const yesterdayHomework = await db.query.userHomework.findMany({
//         where: and(
//             eq(userHomework.status, 'expired'),
//             lt(userHomework.dueDate, new Date())
//         ),
//     });
    
//     // Группируем по ученикам и отправляем родителям
//     // ... логика отправки отчета
// }

// async function sendTelegramMessage(chatId: number, message: string) {
//     const token = process.env.TELEGRAM_BOT_TOKEN;
//     const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
//     await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             chat_id: chatId,
//             text: message,
//             parse_mode: 'Markdown',
//         }),
//     });
// }