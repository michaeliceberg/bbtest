'use server'

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { getUserProgress } from '@/db/queries'
import { sendMessageToTelegram } from '@/utils/telegram'
import { PRO_PRICE_RUB } from '@/lib/pro'

// «Хочу PRO»: одна заявка на ученика, админу — сообщение в Telegram. Денег не берём.
export async function wantPro(source?: string): Promise<{ ok: boolean; already?: boolean }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    const rows = (await db.execute(sql`
        INSERT INTO pro_interest (user_id, event, source) VALUES (${userId}, 'want', ${source?.slice(0, 40) ?? null})
        ON CONFLICT (user_id) WHERE event = 'want' DO NOTHING RETURNING id`)) as unknown as unknown[]
    if (rows.length === 0) return { ok: true, already: true }

    const up = await getUserProgress()
    const [{ cnt }] = (await db.execute(sql`SELECT count(*) AS cnt FROM pro_interest WHERE event = 'want'`)) as unknown as { cnt: number }[]
    const name = up?.nickname || up?.userName || userId
    await sendMessageToTelegram(
        `🔥 *Хочет PRO* (${PRO_PRICE_RUB} ₽/мес)\n${name}\nКурс: ${up?.activeCourse?.title ?? '—'}, уровень XP: ${up?.xp ?? 0}\nВсего заявок: ${cnt}`,
    )
    return { ok: true }
}
