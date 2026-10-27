// lib/legal.ts — реквизиты продавца и даты редакций для оферты (/offer) и политики данных (/privacy).
// Продавец — самозанятый (налог на профессиональный доход). Меняем здесь — меняется на обеих страницах.
import { BOT_USERNAME } from '@/lib/telegramLinks'
import { PRO_PRICE_RUB } from '@/lib/pro'

export const SELLER = {
    name: 'Королев Михаил Сергеевич',
    inn: '501851038685',
    status: 'плательщик налога на профессиональный доход (самозанятый)',
    site: 'https://ggege.ru',
    // Почта для связи — показывается на /pricing, /offer, /privacy (пустая строка — не показываем).
    email: 'fiztehmisha@gmail.com',
    telegram: `@${BOT_USERNAME}`,
    telegramUrl: `https://t.me/${BOT_USERNAME}`,
}

export const OFFER_UPDATED_AT = '23 октября 2026 г.'
export const PRIVACY_UPDATED_AT = '23 октября 2026 г.'

// Возврат: полный, если оплатили недавно и не пользовались платными функциями.
export const REFUND_DAYS = 7

export const PRO_PRICE = PRO_PRICE_RUB
