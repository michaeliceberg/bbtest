// utils/telegram.ts

import axios from "axios";

const TELEGRAM_BOT_TOKEN = "7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8";
const BOT_USERNAME = "brickbrain007_bot";

export const sendMessageToTelegram = async (message: string, chatId?: string): Promise<void> => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const targetChatId = chatId || "1005641275";

    try {
        await axios.post(url, {
            chat_id: targetChatId,
            text: message,
            parse_mode: "Markdown",
        });
        console.log("✅ Сообщение отправлено в Telegram");
    } catch (error) {
        console.error("❌ Ошибка при отправке сообщения в Telegram:", error);
    }
};

// Генерация кода для привязки
export const generateBindCode = (userId: string): string => {
    return userId.slice(-8).toUpperCase();
};

// Получить ссылку для привязки через QR-код
export const getBindLink = (bindCode: string): string => {
    return `https://t.me/${BOT_USERNAME}?start=bind_${bindCode}`;
};





















// import axios from "axios";

// const TELEGRAM_BOT_TOKEN = "7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8";

// interface TelegramMessageParams {
//     chat_id: string;
//     text: string;
//     parse_mode?: string;
// }

// export const sendMessageToTelegram = async (message: string, chatId?: string): Promise<void> => {
//     const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
//     const targetChatId = chatId || "1005641275"; // твой ID по умолчанию

//     try {
//         await axios.post<TelegramMessageParams>(url, {
//             chat_id: targetChatId,
//             text: message,
//             parse_mode: "Markdown",
//         });
//         console.log("✅ Сообщение отправлено в Telegram");
//     } catch (error) {
//         console.error("❌ Ошибка при отправке сообщения в Telegram:", error);
//     }
// };

// // Генерация кода для привязки (последние 8 символов userId)
// export const generateBindCode = (userId: string): string => {
//     return userId.slice(-8).toUpperCase();
// };



// // utils/telegram.ts
// import axios from "axios";


// // Тип для параметров отправки сообщения
// interface TelegramMessageParams {
//   chat_id: string;
//   text: string;
// }

// // Функция для отправки сообщения в Telegram
// export const sendMessageToTelegram = async (message: string): Promise<void> => {
//     // const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
//     const url = `https://api.telegram.org/bot7675525540:AAGy9BBsi54zeaFFs2Jt9k_PR2ofrRnGUQ8/sendMessage`;

//   try {
//     await axios.post<TelegramMessageParams>(url, {
//         // chat_id: CHAT_ID,
//         chat_id: 1005641275,

//       text: message,
//     });
//     // console.log("Сообщение отправлено в Telegram");
//   } catch (error) {
//     console.error("Ошибка при отправке сообщения в Telegram:", error);
//   }
// };
