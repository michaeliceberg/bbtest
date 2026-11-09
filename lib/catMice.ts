// lib/catMice.ts
//
// Мыши и сытость котика в ангаре (components/hangar-mice.tsx). Одно событие в день по Москве (таблица cat_mice_events):
// • raid — котика вчера весь день не кормили: мышка крадёт из сундука. Пицца, если есть кусочек, иначе монеты, иначе гем.
//   Кража списывается сразу при создании события; сцену ученик увидит, когда зайдёт в ангар (котик спит, сирена).
// • catch — котика кормили вчера или сегодня: с шансом CATCH_CHANCE котик ловит мышку и держит, пока ученик не нажмёт.
// • none — в этот день ничего (чтобы не перекидывать кубик на каждом заходе).
// Сытость убывает за сутки от последнего кормления (cat_fed_at).

import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { moscowToday } from '@/lib/catFood'

export type MiceEventKind = 'raid' | 'catch'
export type MiceLoot = 'pizza' | 'coins' | 'gems' | null
export type MiceEvent = { id: number; kind: MiceEventKind; lootKind: MiceLoot; lootAmount: number; resolved: boolean; resolvedAt: string | null }
export type CatStatus = { hasCat: boolean; event: MiceEvent | null; fedAt: string | null }

const CATCH_CHANCE = 0.7
const RAID_COINS = 30

type Row = Record<string, unknown>
const rows = async (q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as Row[]

const dayBefore = (d: string) => {
    const t = new Date(`${d}T12:00:00Z`)
    t.setUTCDate(t.getUTCDate() - 1)
    return t.toISOString().slice(0, 10)
}
const toEvent = (r: Row): MiceEvent | null =>
    r.kind === 'raid' || r.kind === 'catch'
        ? { id: Number(r.id), kind: r.kind, lootKind: (r.loot_kind as MiceLoot) ?? null, lootAmount: Number(r.loot_amount ?? 0), resolved: !!r.resolved_at, resolvedAt: r.resolved_at ? new Date(r.resolved_at as string).toISOString() : null }
        : null

/** Событие с мышами на сегодня (создаётся при первом заходе за день) и время последнего кормления. */
export async function getCatStatus(userId: string): Promise<CatStatus> {
    const up = (await rows(sql`SELECT cat_stage, cat_fed_date::text AS fed_date, cat_fed_at, pizza_slices, points, gems
        FROM user_progress WHERE user_id = ${userId}`))[0]
    if (!up || Number(up.cat_stage) < 2) return { hasCat: false, event: null, fedAt: null }
    const fedAt = up.cat_fed_at ? new Date(up.cat_fed_at as string).toISOString() : null
    const today = moscowToday()
    const yesterday = dayBefore(today)
    const have = (await rows(sql`SELECT * FROM cat_mice_events WHERE user_id = ${userId} AND day = ${today}`))[0]
    if (have) return { hasCat: true, event: toEvent(have), fedAt }

    // голодал весь вчерашний день: кормили раньше вчера; никогда не кормили — если котик живёт в ангаре с позавчера
    const fedDate = (up.fed_date as string | null) ?? null
    let hungry = fedDate !== null && fedDate < yesterday
    if (fedDate === null) {
        const home = (await rows(sql`SELECT (unlocked_at AT TIME ZONE 'Europe/Moscow')::date::text AS d FROM achievement_unlocks
            WHERE user_id = ${userId} AND key = 'cat_home'`))[0]
        hungry = !!home && (home.d as string) < yesterday
    }

    let kind: 'raid' | 'catch' | 'none' = 'none'
    let loot: MiceLoot = null
    let amount = 0
    if (hungry) {
        kind = 'raid'
        if (Number(up.pizza_slices) > 0) { loot = 'pizza'; amount = 1 }
        else if (Number(up.points) > 0) { loot = 'coins'; amount = Math.min(RAID_COINS, Number(up.points)) }
        else if (Number(up.gems) > 0) { loot = 'gems'; amount = 1 }
    } else if (fedDate !== null && Math.random() < CATCH_CHANCE) kind = 'catch'

    const ins = await rows(sql`INSERT INTO cat_mice_events (user_id, day, kind, loot_kind, loot_amount)
        VALUES (${userId}, ${today}, ${kind}, ${loot}, ${amount}) ON CONFLICT (user_id, day) DO NOTHING RETURNING *`)
    if (!ins.length) {
        // параллельный заход уже создал событие — берём его
        const again = (await rows(sql`SELECT * FROM cat_mice_events WHERE user_id = ${userId} AND day = ${today}`))[0]
        return { hasCat: true, event: again ? toEvent(again) : null, fedAt }
    }
    // кража — сразу (не больше, чем есть)
    if (loot === 'pizza') await db.execute(sql`UPDATE user_progress SET pizza_slices = pizza_slices - 1 WHERE user_id = ${userId} AND pizza_slices > 0`)
    if (loot === 'coins') await db.execute(sql`UPDATE user_progress SET points = GREATEST(0, points - ${amount}) WHERE user_id = ${userId}`)
    if (loot === 'gems') await db.execute(sql`UPDATE user_progress SET gems = GREATEST(0, gems - 1) WHERE user_id = ${userId}`)
    return { hasCat: true, event: toEvent(ins[0]), fedAt }
}

/** Сытость 0…1: полная сразу после кормления, за сутки убывает до нуля. */
export function satietyOf(fedAt: string | null, now = Date.now()): number {
    if (!fedAt) return 0
    return Math.max(0, Math.min(1, 1 - (now - new Date(fedAt).getTime()) / 86_400_000))
}
export const HUNGRY_BELOW = 0.35

/** Что показать на пункте «Задачник / Ангар»: мыши крадут (сцена ещё не досмотрена) или котик голодный. */
export function catAlertOf(s: CatStatus): 'raid' | 'hungry' | null {
    if (s.event?.kind === 'raid' && !s.event.resolved) return 'raid'
    return s.hasCat && satietyOf(s.fedAt) < HUNGRY_BELOW ? 'hungry' : null
}
