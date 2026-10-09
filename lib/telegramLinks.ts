// lib/telegramLinks.ts — то, что можно использовать и в браузере: имя бота и ссылки на него.
// Токен бота здесь НЕ лежит — он только на сервере (TELEGRAM_BOT_TOKEN в .env, utils/telegram.ts).
// Имя бота — NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в .env (подставляется при сборке), иначе старое.
export const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'brickbrain007_bot'

// Код для привязки родителя/учителя
export const generateBindCode = (userId: string): string => userId.slice(-8).toUpperCase()

// Ссылка для привязки через QR-код
export const getBindLink = (bindCode: string): string => `https://t.me/${BOT_USERNAME}?start=bind_${bindCode}`

// Диплинк «вступи в бота» для лида диагностического теста (payload diag_)
export const getDiagnosticBotLink = (token: string): string => `https://t.me/${BOT_USERNAME}?start=diag_${token}`
