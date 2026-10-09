// utils/telegram.ts

import axios from "axios";

// Токен — только из .env на сервере (раньше был прямо в коде, а репозиторий публичный).
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
// Ссылки и имя бота — в lib/telegramLinks.ts (их можно и в браузере); здесь — для старых импортов.
export { BOT_USERNAME, generateBindCode, getBindLink, getDiagnosticBotLink } from "@/lib/telegramLinks";

// На сервере api.telegram.org недоступен напрямую (заблокирован у хостера) —
// TELEGRAM_API_BASE указывает на прокси (Cloudflare Worker), который просто
// пересылает запрос дальше. В браузере эта переменная всегда пустая (не
// NEXT_PUBLIC_), так что клиентские вызовы (см. tg-send-msg-com.tsx) как и
// раньше идут напрямую в Telegram — там блокировки нет.
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";

// Reply-клавиатура — постоянные кнопки внизу чата вместо ручного ввода
// команд. Нажатие кнопки присылает её текст обычным сообщением — см.
// сопоставление BUTTON_LABELS в webhook/route.ts.
export type TelegramReplyKeyboard = {
    keyboard: string[][];
    resize_keyboard?: boolean;
};

export const sendMessageToTelegram = async (
    message: string,
    chatId?: string,
    replyMarkup?: TelegramReplyKeyboard
): Promise<void> => {
    if (!TELEGRAM_BOT_TOKEN) { console.error("❌ TELEGRAM_BOT_TOKEN не задан в .env"); return; }
    const url = `${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const targetChatId = chatId || "1005641275";
    const base = {
        chat_id: targetChatId,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    };

    try {
        await axios.post(url, { ...base, text: message, parse_mode: "Markdown" });
        console.log("✅ Сообщение отправлено в Telegram");
    } catch (error) {
        // Если сломался разбор Markdown (например, "_" в тексте команды или
        // в чьём-то имени) — Telegram не шлёт вообще ничего. Пробуем ещё раз
        // простым текстом, чтобы сообщение всё равно дошло.
        const isMarkdownError = axios.isAxiosError(error) && error.response?.data?.description?.includes("can't parse entities");
        if (isMarkdownError) {
            try {
                await axios.post(url, { ...base, text: message.replace(/[*_`]/g, "") });
                console.log("✅ Сообщение отправлено в Telegram (без Markdown, после ошибки разметки)");
                return;
            } catch (fallbackError) {
                console.error("❌ Не удалось отправить даже без Markdown:", fallbackError);
                return;
            }
        }
        console.error("❌ Ошибка при отправке сообщения в Telegram:", error);
    }
};
