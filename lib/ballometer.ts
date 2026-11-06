import 'server-only'

// lib/ballometer.ts — данные Сетометра (бывший Баллометр): темп ученика и его программа.
// Темп для прогноза — в сетах в неделю за последние 14 дней: сет = 1 урок тренажёра + 5 верных задач задачника (урок = 5 задач),
// через кнопку «Начать сет» или самостоятельно — без разницы. Диагностика в темп не входит: это оценка, а не работа.

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { getEgeMap } from '@/lib/egeMap'
import { setNumberToday } from '@/lib/egeMove'
import { computeMeter, computeSetMeter, dateRu, LESSON_EQ, SET_EQ, EGE_DEFAULT_TARGET, formatScore, needSetsOf, type MeterResult } from '@/lib/egeMeter'

type Row = Record<string, unknown>
// Средний темп за 14 дней — только для прогноза даты и настроения Команданте (не скачет от одного пропуска).
// Стрелка прибора и сетка дней — календарные недели (weekEq, days).
const SPEED_WINDOW_DAYS = 14
const MIN_WINDOW_DAYS = 7 // новичка не штрафуем за короткую историю: считаем неделю
const DEFAULT_SET_GAIN = 0.2

export type BallometerData = {
    primary: number
    perWeek: number | null
    targetTest: number
    setGain: number
    goalDateIso: string | null
    setsGoal: number | null
    setsThisWeek: number // целых сетов на этой неделе (сет = 1 урок + 5 задач, как бы ни решал)
    weekEq: number // то же в «задачах»: урок = 5, сет = 10 — для «до следующего сета ещё …»
    days: number[] // 14 чисел в сетах по дням: пн прошлой недели … вс этой (по Москве)
    setsToday: number
    nowIso: string
}

export const meterOf = (d: BallometerData): MeterResult => computeMeter({
    primary: d.primary, perWeek: d.perWeek, targetTest: d.targetTest, setGain: d.setGain,
    goalDate: d.goalDateIso ? new Date(d.goalDateIso) : null, now: new Date(d.nowIso),
})

export async function getBallometerData(userId: string): Promise<BallometerData> {
    const map = await getEgeMap(userId, 'math_profile')
    const [u] = (await db.execute(sql`SELECT ege_target, ballometer_goal_date FROM user_progress WHERE user_id = ${userId}`)) as unknown as Row[]

    // Счёт в «сетах» (решение пользователя): сет = 1 урок тренажёра + 5 задач, неважно — через кнопку «Начать сет» или сам.
    // Урок приравнен к 5 задачам, сет = 10 «задач». Считаем только то, что относится к заданиям ЕГЭ (станции карты):
    // новые верные задачи задачника и впервые пройденные уроки тренажёра.
    const unitIds = [...new Set(map.stations.flatMap((st) => st.unitIds))]
    const tUnitIds = [...new Set(map.stations.flatMap((st) => st.tUnitIds))]
    const inList = (ids: number[]) => (ids.length ? sql.join(ids.map((x) => sql`${x}`), sql`, `) : sql`NULL`)
    // даты в базе пишутся без пояса (UTC), неделя — с понедельника по Москве
    const weekStart = sql`date_trunc('week', now() AT TIME ZONE 'Europe/Moscow')`
    const [tk] = (await db.execute(sql`
        SELECT count(*) FILTER (WHERE cp.date_done >= now() - make_interval(days => ${SPEED_WINDOW_DAYS}))::int AS win,
               count(*) FILTER (WHERE cp.date_done + interval '3 hours' >= ${weekStart})::int AS wk
        FROM challenge_progress cp JOIN challenges c ON c.id = cp.challenge_id JOIN lessons l ON l.id = c.lesson_id
        WHERE cp.user_id = ${userId} AND cp.completed AND cp.done_right AND l.unit_id IN (${inList(unitIds)})`)) as unknown as Row[]
    const [ls] = (await db.execute(sql`
        SELECT count(*) FILTER (WHERE p.first_done >= now() - make_interval(days => ${SPEED_WINDOW_DAYS}))::int AS win,
               count(*) FILTER (WHERE p.first_done + interval '3 hours' >= ${weekStart})::int AS wk
        FROM (SELECT t_lesson_id, min(date_done) AS first_done FROM t_lesson_progress
              WHERE user_id = ${userId} AND training_pts > 0 GROUP BY 1) p
        JOIN t_lessons tl ON tl.id = p.t_lesson_id WHERE tl.t_unit_id IN (${inList(tUnitIds)})`)) as unknown as Row[]
    const [first] = (await db.execute(sql`
        SELECT min(d) AS first_at FROM (
            SELECT min(date_done) AS d FROM t_lesson_progress WHERE user_id = ${userId} AND training_pts > 0
            UNION ALL SELECT min(date_done) FROM challenge_progress WHERE user_id = ${userId} AND done_right
        ) x`)) as unknown as Row[]

    // По дням с понедельника прошлой недели (по Москве): 14 чисел в «задачах» (урок = 5), для сетки на Сетометре.
    const gridStart = sql`(${weekStart} - interval '7 days')`
    const dayRows = (await db.execute(sql`
        SELECT to_char(d, 'YYYY-MM-DD') AS day, sum(n)::int AS eq FROM (
            SELECT (cp.date_done + interval '3 hours')::date AS d, 1 AS n
            FROM challenge_progress cp JOIN challenges c ON c.id = cp.challenge_id JOIN lessons l ON l.id = c.lesson_id
            WHERE cp.user_id = ${userId} AND cp.completed AND cp.done_right AND l.unit_id IN (${inList(unitIds)})
              AND cp.date_done + interval '3 hours' >= ${gridStart}
            UNION ALL
            SELECT (p.first_done + interval '3 hours')::date, ${LESSON_EQ}
            FROM (SELECT t_lesson_id, min(date_done) AS first_done FROM t_lesson_progress
                  WHERE user_id = ${userId} AND training_pts > 0 GROUP BY 1) p
            JOIN t_lessons tl ON tl.id = p.t_lesson_id
            WHERE tl.t_unit_id IN (${inList(tUnitIds)}) AND p.first_done + interval '3 hours' >= ${gridStart}
        ) x GROUP BY d`)) as unknown as Row[]
    const [gs] = (await db.execute(sql`SELECT to_char(${gridStart}, 'YYYY-MM-DD') AS start`)) as unknown as Row[]
    const startMs = Date.parse(String(gs?.start) + 'T00:00:00Z')
    const days = Array.from({ length: 14 }, () => 0)
    for (const r of dayRows) {
        const i = Math.round((Date.parse(String(r.day) + 'T00:00:00Z') - startMs) / 86400000)
        if (i >= 0 && i < 14) days[i] += Number(r.eq) / SET_EQ
    }

    const eqWin = Number(tk?.win ?? 0) + LESSON_EQ * Number(ls?.win ?? 0)
    const weekEq = Number(tk?.wk ?? 0) + LESSON_EQ * Number(ls?.wk ?? 0)

    // темп в сетах в неделю; perWeek (первичные в неделю) = сеты × сколько первичных даёт один сет — для прогноза дат
    const mv = map.move
    const moveGain = mv ? mv.toPrimary - mv.fromPrimary : 0
    const setGain = moveGain > 0.03 ? Math.min(0.6, moveGain) : DEFAULT_SET_GAIN
    let perWeek: number | null = null
    if (first?.first_at) {
        const span = (Date.now() - new Date(String(first.first_at)).getTime()) / 86400000
        const window = Math.max(MIN_WINDOW_DAYS, Math.min(SPEED_WINDOW_DAYS, span))
        perWeek = (eqWin / SET_EQ / (window / 7)) * setGain
    }
    const setsToday = await setNumberToday(userId, null) - 1

    return {
        primary: map.primary,
        perWeek,
        targetTest: u?.ege_target ? Number(u.ege_target) : EGE_DEFAULT_TARGET,
        setGain,
        goalDateIso: u?.ballometer_goal_date ? new Date(String(u.ballometer_goal_date)).toISOString() : null,
        // Норма в неделю не хранится: каждый раз считается от даты плана — сколько баллов осталось и сколько недель
        // до даты (решение пользователя 2026-11-06). Отстал — норма растёт, опередил — падает, перенастраивать не нужно.
        // ballometer_sets_week в базе остаётся только историей последнего «Применить».
        setsGoal: null,
        setsThisWeek: Math.floor(weekEq / SET_EQ),
        weekEq,
        days,
        setsToday,
        nowIso: new Date().toISOString(),
    }
}

// Строка для отчёта родителям; null — ученик не на курсе с Баллометром.
export async function ballometerReportLine(userId: string): Promise<string | null> {
    const [c] = (await db.execute(sql`
        SELECT c.title FROM user_progress up JOIN courses c ON c.id = up.active_course_id WHERE up.user_id = ${userId}`)) as unknown as Row[]
    if (!String(c?.title ?? '').startsWith('ЕГЭ Математика')) return null
    const d = await getBallometerData(userId)
    const m = meterOf(d)
    if (m.zone === 'new') return null
    const s = computeSetMeter(d.perWeek === null ? null : d.weekEq / SET_EQ, needSetsOf(d.setsGoal, m, d.setGain, new Date()), new Date())
    const mark = s.zone === 'green' ? '🟢' : s.zone === 'yellow' ? '🟡' : '🔴'
    const when = m.needPrimary === 0 ? 'цель уже взята' : m.readyDate ? `цель ${m.targetTest} баллов будет взята к ${dateRu(m.readyDate)}` : 'на этой скорости цель не приближается'
    return `${mark} Сетометр: на этой неделе *${formatScore(s.pace)} из ${s.need} сетов*, ${when}`
}
