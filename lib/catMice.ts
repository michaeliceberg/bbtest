// lib/catMice.ts
//
// Мыши и сытость котика в ангаре (components/hangar-mice.tsx). Одно событие в день по Москве (таблица cat_mice_events):
// • raid — котика вчера весь день не кормили: мышка крадёт ЕДУ КОТИКА (одну порцию случайного вида из холодильника),
//   а если еды нет — случайное число монет от 90 до 250.
//   Кража списывается сразу при создании события; сцену ученик увидит, когда зайдёт в ангар (котик спит, сирена).
// • catch — котика кормили вчера или сегодня: с шансом CATCH_CHANCE котик ловит мышку и держит, пока ученик не нажмёт.
// • none — в этот день ничего (чтобы не перекидывать кубик на каждом заходе).
// Сытость убывает за CAT_SATIETY_DAYS суток от последнего кормления (cat_fed_at).

import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { CAT_FOOD, CAT_SATIETY_MS, CAT_FOODS, moscowToday, type CatFood } from '@/lib/catFood'

export type MiceEventKind = 'raid' | 'catch'
// pizza и gems — старые события (до 2026-11-26), теперь мышь ворует еду котика или монеты
export type MiceLoot = CatFood | 'coins' | 'pizza' | 'gems' | null
export type MiceEvent = { id: number; kind: MiceEventKind; lootKind: MiceLoot; lootAmount: number; resolved: boolean; resolvedAt: string | null }
export type CatStatus = { hasCat: boolean; event: MiceEvent | null; fedAt: string | null }

const CATCH_CHANCE = 0.7
const RAID_COINS: [number, number] = [90, 250] // нет еды у котика — случайное число монет
const FOOD_COLUMN: Record<CatFood, string> = { milk: 'cat_milk', sausage: 'cat_sausage', sourcream: 'cat_sourcream', fish: 'cat_fish' }

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
        const stock = (await rows(sql`SELECT cat_milk, cat_sausage, cat_sourcream, cat_fish FROM user_progress WHERE user_id = ${userId}`))[0]
        const have = CAT_FOODS.filter((f) => Number(stock?.[FOOD_COLUMN[f]] ?? 0) > 0)
        if (have.length) { loot = have[Math.floor(Math.random() * have.length)]; amount = 1 }
        else if (Number(up.points) > 0) {
            loot = 'coins'
            amount = Math.min(Number(up.points), RAID_COINS[0] + Math.floor(Math.random() * (RAID_COINS[1] - RAID_COINS[0] + 1)))
        }
    } else if (fedDate !== null && Math.random() < CATCH_CHANCE) kind = 'catch'

    const ins = await rows(sql`INSERT INTO cat_mice_events (user_id, day, kind, loot_kind, loot_amount)
        VALUES (${userId}, ${today}, ${kind}, ${loot}, ${amount}) ON CONFLICT (user_id, day) DO NOTHING RETURNING *`)
    if (!ins.length) {
        // параллельный заход уже создал событие — берём его
        const again = (await rows(sql`SELECT * FROM cat_mice_events WHERE user_id = ${userId} AND day = ${today}`))[0]
        return { hasCat: true, event: again ? toEvent(again) : null, fedAt }
    }
    // кража — сразу (не больше, чем есть)
    if (loot && loot in CAT_FOOD) {
        const col = sql.raw(FOOD_COLUMN[loot as CatFood])
        await db.execute(sql`UPDATE user_progress SET ${col} = GREATEST(0, ${col} - 1) WHERE user_id = ${userId}`)
    }
    if (loot === 'coins') await db.execute(sql`UPDATE user_progress SET points = GREATEST(0, points - ${amount}) WHERE user_id = ${userId}`)
    return { hasCat: true, event: toEvent(ins[0]), fedAt }
}

/** Сытость 0…1: полная сразу после кормления, за CAT_SATIETY_DAYS суток убывает до нуля. */
export function satietyOf(fedAt: string | null, now = Date.now()): number {
    if (!fedAt) return 0
    return Math.max(0, Math.min(1, 1 - (now - new Date(fedAt).getTime()) / CAT_SATIETY_MS))
}
export const HUNGRY_BELOW = 0.35

/** Что показать на пункте «Задачник / Ангар»: мыши крадут (сцена ещё не досмотрена) или котик голодный. */
export function catAlertOf(s: CatStatus): 'raid' | 'hungry' | null {
    if (s.event?.kind === 'raid' && !s.event.resolved) return 'raid'
    return s.hasCat && satietyOf(s.fedAt) < HUNGRY_BELOW ? 'hungry' : null
}
