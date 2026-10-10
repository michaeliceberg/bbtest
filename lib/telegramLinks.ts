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

// «Отправить в Telegram с картинкой»: диплинк в бота, бот присылает готовую карточку-приглашение
// (картинка + текст + кнопка «Пройти урок»), её пересылают другу. Нужно потому, что сервера
// Telegram не могут сами зайти на ggege.ru за превью ссылки (входящие из-за границы режутся).
// payload: share_<код>_<m|p>[_<урок>_<секунды>_<серия>] — до 64 символов.
export const getTelegramShareLink = (code: string, subject: 'math' | 'physics', extra?: { l?: number; t?: number; s?: number }) => {
    const tail = extra?.l ? `_${extra.l}_${extra.t ?? 0}_${extra.s ?? 0}` : ''
    return `https://t.me/${BOT_USERNAME}?start=share_${code}_${subject === 'math' ? 'm' : 'p'}${tail}`
}
