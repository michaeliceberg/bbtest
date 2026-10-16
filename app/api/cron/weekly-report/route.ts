// app/api/cron/weekly-report/route.ts — воскресная сводка недели: родителям (parent_links) и самому ученику
// (если входил через Telegram) уходит отчёт: уроки, задачи, серия, прогноз ЕГЭ «было → стало».
// Запуск — cron на сервере (вс 18:00 МСК) с заголовком Authorization: Bearer $CRON_SECRET.
// ?dry=1 — ничего не отправляет, только возвращает список, кому и что ушло бы.

import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { getWeeklySummary, parentReportText } from '@/lib/weeklyReport'
import { sendMessageToTelegram } from '@/utils/telegram'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Row = Record<string, unknown>

export async function GET(req: Request) {
    if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized', { status: 401 })
    const dry = new URL(req.url).searchParams.get('dry') === '1'
    // Ученики, у которых есть привязанный родитель или вход через Telegram, и была активность за 14 дней.
    const users = (await db.execute(sql`
        SELECT up.user_id, up.user_name,
          (SELECT array_agg(pl.parent_telegram_id) FROM parent_links pl WHERE pl.student_id = up.user_id AND pl.is_active) AS parents,
          (SELECT i.provider_account_id FROM identities i WHERE i.user_id = up.user_id AND i.provider = 'telegram' LIMIT 1) AS own_tg
        FROM user_progress up
        WHERE EXISTS (SELECT 1 FROM t_lesson_progress t WHERE t.user_id = up.user_id AND t.date_done >= now() - interval '14 days')
           OR EXISTS (SELECT 1 FROM user_daily_stats d WHERE d.user_id = up.user_id AND d.date >= now() - interval '14 days')`)) as unknown as Row[]
    const out: { user: string; to: string[] }[] = []
    for (const u of users) {
        const parents = ((u.parents as string[] | null) ?? []).filter(Boolean)
        const ownTg = u.own_tg ? String(u.own_tg) : null
        if (!parents.length && !ownTg) continue
        const userId = String(u.user_id)
        const w = await getWeeklySummary(userId, { withForecast: true })
        const name = String(u.user_name ?? 'ученика')
        const to: string[] = []
        for (const p of parents) {
            to.push(`parent:${p}`)
            if (!dry) await sendMessageToTelegram(parentReportText(name, w), p).catch(() => {})
        }
        if (ownTg && (w.lessons > 0 || w.tasks > 0)) {
            to.push(`self:${ownTg}`)
            const grow = w.testNow !== null && w.testBefore !== null && w.testNow > w.testBefore ? `\n🚀 Прогноз ЕГЭ: ${w.testBefore} → ${w.testNow}! Похвастайся в сторис: https://ggege.ru/path` : ''
            if (!dry) await sendMessageToTelegram(`📊 Твоя неделя: ${w.lessons} уроков, ${w.tasks} задач, серия ${w.streak} 🔥${grow}`, ownTg).catch(() => {})
        }
        out.push({ user: userId, to })
    }
    return NextResponse.json({ dry, sent: out.length, out })
}
