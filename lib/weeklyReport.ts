// lib/weeklyReport.ts — недельная сводка ученика: сколько уроков/задач за 7 дней, серия и рост прогноза ЕГЭ.
// Прогноз раз в неделю сохраняется в ege_forecast_weekly (первое и последнее значение за неделю, неделя —
// с понедельника по Москве). Рост за неделю = текущий прогноз − прогноз в конце прошлой недели (если записи нет —
// первое значение этой недели). Пишут снимок: страница /path при каждом заходе и воскресная рассылка
// (app/api/cron/weekly-report). Таблица создана прямым SQL.

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { getEgeMap } from '@/lib/egeMap'

type Row = Record<string, unknown>
const SUBJECT = 'math_profile'

export async function snapshotForecast(userId: string, primary: number, test: number, subject = SUBJECT) {
    await db.execute(sql`
        INSERT INTO ege_forecast_weekly (user_id, subject, week_start, first_primary, first_test, last_primary, last_test)
        VALUES (${userId}, ${subject}, date_trunc('week', now() AT TIME ZONE 'Europe/Moscow')::date, ${primary}, ${test}, ${primary}, ${test})
        ON CONFLICT (user_id, subject, week_start) DO UPDATE SET last_primary = EXCLUDED.last_primary, last_test = EXCLUDED.last_test, updated_at = now()`)
}

export type WeeklySummary = {
    lessons: number
    tasks: number
    streak: number
    testNow: number | null
    testBefore: number | null // прогноз неделю назад (или в начале этой недели)
}

export async function getWeeklySummary(userId: string, opts?: { withForecast?: boolean }): Promise<WeeklySummary> {
    const [l] = (await db.execute(sql`
        SELECT count(DISTINCT t_lesson_id)::int AS n FROM t_lesson_progress
        WHERE user_id = ${userId} AND training_pts > 0 AND date_done >= now() - interval '7 days'`)) as unknown as Row[]
    const [t] = (await db.execute(sql`
        SELECT coalesce(sum(challenges_right), 0)::int AS n FROM user_daily_stats
        WHERE user_id = ${userId} AND date >= now() - interval '7 days'`)) as unknown as Row[]
    const [s] = (await db.execute(sql`
        SELECT coalesce(max(streak), 0)::int AS n FROM user_course_progress
        WHERE user_id = ${userId} AND last_active_date >= (now() - interval '1 day')::date`)) as unknown as Row[]
    let testNow: number | null = null
    if (opts?.withForecast) {
        const map = await getEgeMap(userId, SUBJECT)
        if (map.primary > 0) { testNow = map.test; await snapshotForecast(userId, map.primary, map.test) }
    } else {
        const [cur] = (await db.execute(sql`
            SELECT last_test FROM ege_forecast_weekly WHERE user_id = ${userId} AND subject = ${SUBJECT}
            ORDER BY week_start DESC LIMIT 1`)) as unknown as Row[]
        testNow = cur ? Number(cur.last_test) : null
    }
    const [prev] = (await db.execute(sql`
        SELECT last_test FROM ege_forecast_weekly WHERE user_id = ${userId} AND subject = ${SUBJECT}
          AND week_start < date_trunc('week', now() AT TIME ZONE 'Europe/Moscow')::date
        ORDER BY week_start DESC LIMIT 1`)) as unknown as Row[]
    const [first] = (await db.execute(sql`
        SELECT first_test FROM ege_forecast_weekly WHERE user_id = ${userId} AND subject = ${SUBJECT}
          AND week_start = date_trunc('week', now() AT TIME ZONE 'Europe/Moscow')::date`)) as unknown as Row[]
    const testBefore = prev ? Number(prev.last_test) : first ? Number(first.first_test) : null
    return { lessons: Number(l?.n ?? 0), tasks: Number(t?.n ?? 0), streak: Number(s?.n ?? 0), testNow, testBefore }
}

const plural = (n: number, a: string, b: string, c: string) => {
    const m10 = n % 10, m100 = n % 100
    return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c
}

// Текст отчёта родителю (Telegram, обычный Markdown). name — имя ученика.
export function parentReportText(name: string, w: WeeklySummary): string {
    const lines = [`📊 *Неделя ученика ${name} в ggege*`, '']
    lines.push(`📚 Уроков тренажёра: *${w.lessons}*`)
    lines.push(`✅ Верно решённых задач: *${w.tasks}*`)
    if (w.streak > 0) lines.push(`🔥 Серия: *${w.streak}* ${plural(w.streak, 'день', 'дня', 'дней')} подряд`)
    if (w.testNow !== null) {
        if (w.testBefore !== null && w.testNow !== w.testBefore) {
            const d = w.testNow - w.testBefore
            lines.push(`🎯 Прогноз ЕГЭ: *${w.testBefore} → ${w.testNow}* (${d > 0 ? '+' : ''}${d})`)
        } else lines.push(`🎯 Прогноз ЕГЭ: *≈${w.testNow}* баллов`)
    }
    if (w.lessons === 0 && w.tasks === 0) lines.push('', 'На этой неделе занятий не было — самое время вернуться 💪')
    else lines.push('', 'Так держать! 💪')
    return lines.join('\n')
}
