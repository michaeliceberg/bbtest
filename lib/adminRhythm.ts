import 'server-only'

// lib/adminRhythm.ts — «Ритм учеников» для /admin/funnel (2026-11-07):
// дни активности за неделю, доля закрывших норму сетов, возвращаемость по неделям, сеты начаты → закончены,
// часы занятий, рост прогноза ЕГЭ. Только ученики (не админы). Время — по Москве, неделя с понедельника.
// Занятие = верная задача задачника или пройденный урок тренажёра. Сет = 10 «задач»: задача — 1, урок (первый раз) — 5.

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'

type Row = Record<string, unknown>
const q = async (query: ReturnType<typeof sql>) => (await db.execute(query)) as unknown as Row[]
const n = (v: unknown) => Number(v ?? 0)

// Норму недели у каждого считать дорого (она от даты плана и карты баллов) — берём последнюю «Применить»,
// а если не нажимал — 3 сета. Это приближение, в карточке так и подписано.
const DEFAULT_NORM = 3
const WEEKS_BACK = 8

const msk = (col: string) => sql.raw(`((${col} AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Moscow')`)

// Все занятия учеников: (user_id, время по Москве, вклад в «задачах»).
const ACTS = sql`
    acts AS (
        SELECT cp.user_id, ${msk('cp.date_done')} AS ts, 1 AS eq
        FROM challenge_progress cp WHERE cp.done_right AND cp.completed AND cp.date_done IS NOT NULL
        UNION ALL
        SELECT p.user_id, ${msk('p.date_done')},
            CASE WHEN p.date_done = min(p.date_done) OVER (PARTITION BY p.user_id, p.t_lesson_id) THEN 5 ELSE 0 END
        FROM t_lesson_progress p WHERE p.training_pts > 0 AND p.date_done IS NOT NULL
    ),
    students AS (SELECT user_id, coalesce(ballometer_sets_week, ${DEFAULT_NORM}) AS norm FROM user_progress WHERE coalesce(is_admin, 0) = 0)`

export type RhythmWeek = { week: string; active: number; days: [number, number, number]; median: number; closed: number }
export type RhythmCohort = { week: string; size: number; back: (number | null)[] }
export type RhythmStats = {
    weeks: RhythmWeek[] // последние полные недели, от старой к новой; последняя — прошлая неделя
    cohorts: RhythmCohort[] // когорта = неделя первого занятия; back[k] — доля вернувшихся через k+1 недель (1, 2, 4)
    moves: { total: number; done: number; atTrainer: number; atTasks: number }
    hours: number[] // 24 числа — занятий по часам (Москва) за период
    growth: { users: number; avg: number } // прирост прогноза ЕГЭ за 4 недели у тех, у кого есть 2+ замера
}

export async function getRhythmStats(sinceIso: string): Promise<RhythmStats> {
    const weekly = await q(sql`
        WITH ${ACTS}
        SELECT a.user_id, to_char(date_trunc('week', a.ts), 'YYYY-MM-DD') AS wk,
            count(DISTINCT a.ts::date)::int AS days, sum(a.eq)::int AS eq, max(s.norm)::int AS norm
        FROM acts a JOIN students s ON s.user_id = a.user_id
        WHERE a.ts >= date_trunc('week', now() AT TIME ZONE 'Europe/Moscow') - make_interval(days => ${WEEKS_BACK * 7})
        GROUP BY 1, 2`)
    const firsts = await q(sql`
        WITH ${ACTS}
        SELECT a.user_id, to_char(date_trunc('week', min(a.ts)), 'YYYY-MM-DD') AS wk
        FROM acts a JOIN students s ON s.user_id = a.user_id GROUP BY 1`)
    const [cur] = await q(sql`SELECT to_char(date_trunc('week', now() AT TIME ZONE 'Europe/Moscow'), 'YYYY-MM-DD') AS wk`)

    // Недели от старой к новой; текущая неделя ещё идёт — в «дни» и «норму» не берём.
    const weekKey = (back: number) => {
        const d = new Date(Date.parse(String(cur.wk) + 'T00:00:00Z') - back * 7 * 86400000)
        return d.toISOString().slice(0, 10)
    }
    const fullWeeks = Array.from({ length: 4 }, (_, i) => weekKey(4 - i))
    const byWeek = new Map<string, Row[]>()
    for (const r of weekly) byWeek.set(String(r.wk), [...(byWeek.get(String(r.wk)) ?? []), r])

    const weeks: RhythmWeek[] = fullWeeks.map((wk) => {
        const rs = byWeek.get(wk) ?? []
        const ds = rs.map((r) => n(r.days)).sort((a, b) => a - b)
        return {
            week: wk,
            active: rs.length,
            days: [ds.filter((d) => d <= 2).length, ds.filter((d) => d >= 3 && d <= 4).length, ds.filter((d) => d >= 5).length],
            median: ds.length ? ds[Math.floor(ds.length / 2)] : 0,
            closed: rs.filter((r) => n(r.eq) / 10 >= n(r.norm) - 0.05).length,
        }
    })

    // Возвращаемость: когорты последних 6 полных недель; вернулся через k недель = было занятие на неделе wk + k.
    const activeWeeks = new Map<string, Set<string>>()
    for (const r of weekly) {
        const set = activeWeeks.get(String(r.user_id)) ?? new Set<string>()
        set.add(String(r.wk))
        activeWeeks.set(String(r.user_id), set)
    }
    const plusWeeks = (wk: string, k: number) => new Date(Date.parse(wk + 'T00:00:00Z') + k * 7 * 86400000).toISOString().slice(0, 10)
    const cohorts: RhythmCohort[] = Array.from({ length: 6 }, (_, i) => weekKey(6 - i)).map((wk) => {
        const users = firsts.filter((f) => String(f.wk) === wk).map((f) => String(f.user_id))
        const back = [1, 2, 4].map((k) => {
            const target = plusWeeks(wk, k)
            if (target > String(cur.wk)) return null // эта неделя ещё не наступила или идёт — рано считать
            return users.length ? users.filter((u) => activeWeeks.get(u)?.has(target)).length / users.length : null
        })
        return { week: wk, size: users.length, back }
    })

    const [mv] = await q(sql`
        SELECT count(*)::int AS total,
            count(*) FILTER (WHERE m.step = 'done')::int AS done,
            count(*) FILTER (WHERE m.step IN ('trainer', 'trainer2'))::int AS at_trainer,
            count(*) FILTER (WHERE m.step = 'tasks')::int AS at_tasks
        FROM ege_moves m JOIN user_progress u ON u.user_id = m.user_id
        WHERE coalesce(u.is_admin, 0) = 0 AND m.created_at >= ${sinceIso}`)

    const hourRows = await q(sql`
        WITH ${ACTS}
        SELECT extract(hour FROM a.ts)::int AS h, count(*)::int AS cnt
        FROM acts a JOIN students s ON s.user_id = a.user_id
        WHERE a.ts >= ${sinceIso}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow'
        GROUP BY 1`)
    const hours = Array.from({ length: 24 }, () => 0)
    for (const r of hourRows) hours[n(r.h)] = n(r.cnt)

    const [gr] = await q(sql`
        SELECT count(*)::int AS users, coalesce(avg(delta), 0)::float AS avg FROM (
            SELECT f.user_id,
                (array_agg(f.last_test ORDER BY f.week_start DESC))[1] - (array_agg(f.first_test ORDER BY f.week_start))[1] AS delta
            FROM ege_forecast_weekly f JOIN user_progress u ON u.user_id = f.user_id
            WHERE coalesce(u.is_admin, 0) = 0 AND f.week_start >= (date_trunc('week', now() AT TIME ZONE 'Europe/Moscow') - interval '28 days')::date
            GROUP BY f.user_id HAVING count(*) >= 2
        ) x`)

    return {
        weeks,
        cohorts,
        moves: { total: n(mv?.total), done: n(mv?.done), atTrainer: n(mv?.at_trainer), atTasks: n(mv?.at_tasks) },
        hours,
        growth: { users: n(gr?.users), avg: Math.round(Number(gr?.avg ?? 0) * 10) / 10 },
    }
}
