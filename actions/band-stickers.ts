'use server'

// actions/band-stickers.ts — мегакейс главы банды (банд-стикеры) и выбор картинки банды.

import { sql, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { gangs, userProgress } from '@/db/schema'
import { auth } from '@/lib/server-auth'
import { getGangMembership } from '@/db/queries'
import { BAND_PREFIX, BAND_STICKER_BY_ID, pickBandSticker } from '@/lib/bandStickers'
import { getMyBandStickers, grantBandSticker } from '@/lib/bandStickersServer'

export type BandCaseResult = { success: true; stickerId: number; level: number } | { success: false; error: string }

// Открыть мегакейс за победу банды (только глава, один раз за неделю — сервер атомарно помечает).
export async function claimBandMegaCase(): Promise<BandCaseResult> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { success: false, error: 'Нужно войти' }
    const sticker = pickBandSticker()
    const claimed = (await db.execute(sql`
        UPDATE gang_band_rewards SET claimed = true, claimed_at = now(), sticker_id = ${sticker.id}
        WHERE id = (SELECT id FROM gang_band_rewards WHERE user_id = ${userId} AND NOT claimed ORDER BY week_start LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING id`)) as unknown as unknown[]
    if (claimed.length === 0) return { success: false, error: 'Мегакейса нет или он уже открыт' }
    // Без revalidatePath: иначе карточка мегакейса исчезнет посреди прокрутки — обновит «Забрать».
    const level = await grantBandSticker(userId, sticker.id)
    return { success: true, stickerId: sticker.id, level }
}

// Только для админа: открыть мегакейс без победы (проверка барабана).
export async function openTestBandCase(): Promise<BandCaseResult> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { success: false, error: 'Нужно войти' }
    const me = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) })
    if (me?.isAdmin !== 1) return { success: false, error: 'Только для админа' }
    const sticker = pickBandSticker()
    // Без revalidatePath: иначе карточка мегакейса исчезнет посреди прокрутки — обновит «Забрать».
    const level = await grantBandSticker(userId, sticker.id)
    return { success: true, stickerId: sticker.id, level }
}

// Глава ставит открытый у него банд-стикер картинкой банды.
export async function setGangBandImage(stickerId: number): Promise<{ ok: true } | { error: string }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { error: 'Нужно войти' }
    if (!BAND_STICKER_BY_ID[stickerId]) return { error: 'Нет такого стикера' }
    const m = await getGangMembership(userId)
    if (!m || m.role !== 'leader') return { error: 'Картинку банды меняет только глава' }
    const mine = await getMyBandStickers(userId)
    if (!mine[stickerId]) return { error: 'Этот стикер ещё не открыт' }
    await db.update(gangs).set({ emoji: `${BAND_PREFIX}${stickerId}` }).where(eq(gangs.id, m.gangId))
    revalidatePath('/gang')
    revalidatePath('/gangs')
    return { ok: true }
}
