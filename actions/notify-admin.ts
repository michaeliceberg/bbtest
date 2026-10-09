'use server'

// Сообщение админу в Telegram из браузера (итоги урока и т.п.) — отправляет сервер,
// токен бота в браузер не попадает. Длина ограничена, чтобы через это нельзя было спамить.
import { sendMessageToTelegram } from '@/utils/telegram'

export async function notifyAdmin(message: string) {
    if (typeof message !== 'string' || !message.trim()) return
    await sendMessageToTelegram(message.slice(0, 1500))
}
