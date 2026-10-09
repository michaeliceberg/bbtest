import 'server-only'

// lib/bandStickersServer.ts — коллекция банд-стикеров ученика (таблица band_stickers, создана прямым SQL)
// и мегакейс главы банды (gang_band_rewards).

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'

type Row = Record<string, unknown>
const q = async (query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as Row[]

/** id стикера → уровень (сколько раз выпал). */
export const getMyBandStickers = async (userId: string): Promise<Record<number, number>> => {
    const rows = await q(sql`SELECT sticker_id, level FROM band_stickers WHERE user_id = ${userId}`)
    return Object.fromEntries(rows.map((r) => [Number(r.sticker_id), Number(r.level)]))
}

/** Выдать стикер (повтор — уровень +1). Возвращает новый уровень. */
export const grantBandSticker = async (userId: string, stickerId: number): Promise<number> => {
    const [r] = await q(sql`
        INSERT INTO band_stickers (user_id, sticker_id) VALUES (${userId}, ${stickerId})
        ON CONFLICT (user_id, sticker_id) DO UPDATE SET level = band_stickers.level + 1
        RETURNING level`)
    return Number(r?.level ?? 1)
}

export const hasUnclaimedBandReward = async (userId: string): Promise<boolean> => {
    const [r] = await q(sql`SELECT 1 AS x FROM gang_band_rewards WHERE user_id = ${userId} AND NOT claimed LIMIT 1`)
    return Boolean(r)
}

/** Сколько раз банда выигрывала недельную битву. */
export const getGangWins = async (gangIds: number[]): Promise<Record<number, number>> => {
    if (!gangIds.length) return {}
    const rows = await q(sql`
        SELECT gang_id, count(*) AS n FROM gang_week_winners
        WHERE gang_id IN ${sql.raw(`(${gangIds.join(',')})`)} GROUP BY gang_id`)
    return Object.fromEntries(rows.map((r) => [Number(r.gang_id), Number(r.n)]))
}
