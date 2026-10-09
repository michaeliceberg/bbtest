// lib/ddx.ts
//
// Паззл «абонемент в спортзал»: 9 разных кусочков (3×3). Выпадают из мифического и МЕГА кейса
// (caseRewards.ts, kind 'ddx'), случайный кусочек, могут быть повторы. 2 повтора можно слить
// в один недостающий. Все 9 вставлены на свои места в песочнице (/gym) — выдаётся промокод
// из ddx_promo_codes (как Додо: плейсхолдеры, потом заменить на настоящие) и уведомление в Telegram.

import 'server-only'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { sendMessageToTelegram } from '@/utils/telegram'
import { DDX_PIECES, DDX_MERGE_COST, type DdxPieceState } from '@/lib/ddxConst'

type Row = { piece: number; qty: number; placed: boolean }

export async function getDdxState(userId: string): Promise<{ pieces: DdxPieceState[]; promoCode: string | null }> {
    const rows = (await db.execute(sql`SELECT piece, qty, placed FROM ddx_pieces WHERE user_id = ${userId} AND qty > 0 ORDER BY piece`)) as unknown as Row[]
    const user = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId), columns: { ddxPromoCode: true } })
    return { pieces: rows.map((r) => ({ piece: Number(r.piece), qty: Number(r.qty), placed: !!r.placed })), promoCode: user?.ddxPromoCode ?? null }
}

// Выпал кусочек из кейса — случайный из 9 (может быть повтором).
export async function grantRandomDdxPiece(userId: string): Promise<number> {
    const piece = Math.floor(Math.random() * DDX_PIECES)
    await db.execute(sql`
        INSERT INTO ddx_pieces (user_id, piece, qty) VALUES (${userId}, ${piece}, 1)
        ON CONFLICT (user_id, piece) DO UPDATE SET qty = ddx_pieces.qty + 1, updated_at = now()`)
    return piece
}

// 2 повтора → 1 недостающий кусочек (случайный из недостающих). Всё в одной транзакции с блокировкой строк.
export async function mergeDdxDuplicates(userId: string): Promise<{ ok: true; piece: number } | { ok: false; error: string }> {
    return db.transaction(async (tx) => {
        const rows = (await tx.execute(sql`SELECT piece, qty FROM ddx_pieces WHERE user_id = ${userId} FOR UPDATE`)) as unknown as Row[]
        const owned = rows.filter((r) => Number(r.qty) > 0)
        const dups = owned.reduce((s, r) => s + Math.max(0, Number(r.qty) - 1), 0)
        const missing = Array.from({ length: DDX_PIECES }, (_, i) => i).filter((i) => !owned.some((r) => Number(r.piece) === i))
        if (missing.length === 0) return { ok: false as const, error: 'Все кусочки уже есть' }
        if (dups < DDX_MERGE_COST) return { ok: false as const, error: 'Нужно 2 повторки' }
        // Снимаем по одной копии с самых «толстых» стопок
        let left = DDX_MERGE_COST
        const sorted = [...owned].sort((a, b) => Number(b.qty) - Number(a.qty))
        for (const r of sorted) {
            while (left > 0 && Number(r.qty) > 1) {
                r.qty = Number(r.qty) - 1
                left--
            }
            await tx.execute(sql`UPDATE ddx_pieces SET qty = ${Number(r.qty)}, updated_at = now() WHERE user_id = ${userId} AND piece = ${Number(r.piece)}`)
            if (left === 0) break
        }
        const piece = missing[Math.floor(Math.random() * missing.length)]
        await tx.execute(sql`
            INSERT INTO ddx_pieces (user_id, piece, qty) VALUES (${userId}, ${piece}, 1)
            ON CONFLICT (user_id, piece) DO UPDATE SET qty = 1, placed = false, updated_at = now()`)
        return { ok: true as const, piece }
    })
}

export async function placeDdxPiece(userId: string, piece: number): Promise<boolean> {
    const rows = (await db.execute(sql`
        UPDATE ddx_pieces SET placed = true, updated_at = now()
        WHERE user_id = ${userId} AND piece = ${piece} AND qty > 0 RETURNING piece`)) as unknown as Row[]
    return rows.length > 0
}

// Все 9 на местах — выдаём промокод (один раз).
export async function claimDdxPromo(userId: string): Promise<string | null> {
    const user = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) })
    if (user?.ddxPromoCode) return user.ddxPromoCode
    const [{ n }] = (await db.execute(sql`SELECT count(*)::int AS n FROM ddx_pieces WHERE user_id = ${userId} AND placed AND qty > 0`)) as unknown as { n: number }[]
    if (Number(n) < DDX_PIECES) return null
    const rows = (await db.execute(sql`
        UPDATE ddx_promo_codes SET assigned_to_user_id = ${userId}, assigned_at = now()
        WHERE id = (SELECT id FROM ddx_promo_codes WHERE assigned_to_user_id IS NULL ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
        RETURNING code`)) as unknown as { code: string }[]
    const code = rows[0]?.code
    if (!code) {
        await sendMessageToTelegram(`⚠️ Пул промокодов на абонемент закончился! Ученик ${user?.userName ?? userId} собрал паззл, но код выдать нечего — досей scripts/seed-ddx.ts.`)
        return null
    }
    await db.update(userProgress).set({ ddxPromoCode: code }).where(eq(userProgress.userId, userId))
    await sendMessageToTelegram(`🏋️ Ученик "${user?.userName ?? userId}" собрал паззл абонемента в спортзал! Выдан код: \`${code}\``)
    return code
}
