import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { PRO_PRICE_RUB } from '@/lib/pro'
import { sendMessageToTelegram } from '@/utils/telegram'

// Скидки на PRO по приглашению (одноуровневые):
// • приглашённый (user_progress.invited_by_user_id) — REFERRAL_DISCOUNT_PERCENT на первую оплату;
// • пригласивший — такую же скидку на продление, когда приглашённый впервые оплатил PRO (не за регистрацию:
//   иначе скидки набивались бы фейковыми аккаунтами). Одна скидка на одну оплату, копятся по одной на друга.
// Таблица pro_discounts (прямой SQL): payment_id — скидка зарезервирована под платёж, used_at — потрачена.

export const REFERRAL_DISCOUNT_PERCENT = 20

export type ProOffer = { amountRub: number; percent: number; reason: 'friend' | 'invited' | null; creditId: number | null }

type Row = Record<string, unknown>
const discounted = (p: number) => Math.round((PRO_PRICE_RUB * (100 - p)) / 100)

/** Цена PRO для ученика с учётом скидки по приглашению. */
export async function getProOffer(userId: string): Promise<ProOffer> {
    // Брошенные оплаты (больше часа без успеха) не держат скидку.
    await db.execute(sql`
        UPDATE pro_discounts d SET payment_id = NULL
        FROM pro_payments p
        WHERE d.payment_id = p.id AND d.used_at IS NULL AND d.user_id = ${userId}
          AND p.applied_at IS NULL AND p.created_at < now() - interval '1 hour'`)
    const credit = (await db.execute(sql`
        SELECT id, percent FROM pro_discounts WHERE user_id = ${userId} AND used_at IS NULL AND payment_id IS NULL
        ORDER BY id LIMIT 1`)) as unknown as Row[]
    if (credit.length) {
        const percent = Number(credit[0].percent)
        return { amountRub: discounted(percent), percent, reason: 'friend', creditId: Number(credit[0].id) }
    }
    const invited = (await db.execute(sql`
        SELECT 1 FROM user_progress up WHERE up.user_id = ${userId} AND up.invited_by_user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pro_payments p WHERE p.user_id = up.user_id AND p.applied_at IS NOT NULL AND NOT p.test)`)) as unknown as Row[]
    if (invited.length) return { amountRub: discounted(REFERRAL_DISCOUNT_PERCENT), percent: REFERRAL_DISCOUNT_PERCENT, reason: 'invited', creditId: null }
    return { amountRub: PRO_PRICE_RUB, percent: 0, reason: null, creditId: null }
}

/** Зарезервировать скидку пригласившего под конкретный платёж (атомарно; false — её уже забрали). */
export async function reserveCredit(creditId: number, paymentId: number): Promise<boolean> {
    const r = (await db.execute(sql`UPDATE pro_discounts SET payment_id = ${paymentId} WHERE id = ${creditId} AND payment_id IS NULL AND used_at IS NULL RETURNING id`)) as unknown as Row[]
    return r.length > 0
}

export async function releaseCredit(paymentId: number) {
    await db.execute(sql`UPDATE pro_discounts SET payment_id = NULL WHERE payment_id = ${paymentId} AND used_at IS NULL`)
}

/**
 * Платёж прошёл: потратить зарезервированную скидку и, если это первая настоящая оплата приглашённого,
 * выдать скидку пригласившему и сообщить ему (и его родителям) в Telegram.
 */
export async function onProPaid(paymentId: number, userId: string, test: boolean) {
    await db.execute(sql`UPDATE pro_discounts SET used_at = now() WHERE payment_id = ${paymentId} AND used_at IS NULL`)
    if (test) return
    const rows = (await db.execute(sql`
        SELECT up.invited_by_user_id AS inviter, coalesce(up.nickname, up.user_name) AS name,
            (SELECT count(*) FROM pro_payments p WHERE p.user_id = up.user_id AND p.applied_at IS NOT NULL AND NOT p.test) AS paid
        FROM user_progress up WHERE up.user_id = ${userId}`)) as unknown as Row[]
    const inviter = rows[0]?.inviter ? String(rows[0].inviter) : null
    if (!inviter || Number(rows[0].paid) !== 1) return
    const granted = (await db.execute(sql`
        INSERT INTO pro_discounts (user_id, percent, source_user_id) VALUES (${inviter}, ${REFERRAL_DISCOUNT_PERCENT}, ${userId})
        ON CONFLICT (user_id, source_user_id) DO NOTHING RETURNING id`)) as unknown as Row[]
    if (!granted.length) return
    const friend = String(rows[0].name ?? 'Твой друг')
    const text = `🎁 *${friend}* оформил ggege PRO по вашей ссылке!\nДарим скидку ${REFERRAL_DISCOUNT_PERCENT}% на следующее продление PRO — она уже ждёт на странице оплаты: https://ggege.ru/pro`
    const to = (await db.execute(sql`
        SELECT parent_telegram_id AS chat FROM parent_links WHERE student_id = ${inviter} AND is_active
        UNION SELECT provider_account_id FROM identities WHERE user_id = ${inviter} AND provider = 'telegram'`)) as unknown as Row[]
    await Promise.all(to.map((r) => sendMessageToTelegram(text, String(r.chat)).catch(() => null)))
    await sendMessageToTelegram(`🎁 Реферальная скидка ${REFERRAL_DISCOUNT_PERCENT}% выдана: ${inviter} (пригласил ${friend})`).catch(() => null)
}
