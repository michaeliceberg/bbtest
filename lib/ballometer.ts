import 'server-only'

// lib/ballometer.ts — данные Баллометра: реальная скорость ученика и его программа.
// Скорость = сколько первичных баллов дали НОВЫЕ верные задачи и НОВЫЕ уроки тренажёра за последние 14 дней
// (по тем же весам, что и lib/egeMap.ts). Диагностика в скорость не входит: это оценка, а не работа.

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { getEgeMap } from '@/lib/egeMap'
import { computeMeter, dateRu, EGE_DEFAULT_TARGET, formatScore, type MeterResult } from '@/lib/egeMeter'

type Row = Record<string, unknown>
const SPEED_WINDOW_DAYS = 14
const MIN_WINDOW_DAYS = 7 // новичка не штрафуем за короткую историю: считаем неделю
const COURSE_WEIGHT = 0.6
const DEFAULT_SET_GAIN = 0.2

export type BallometerData = {
    primary: number
    perWeek: number | null
    targetTest: number
    setGain: number
    goalDateIso: string | null
    setsGoal: number | null
    setsThisWeek: number
    nowIso: string
}

export const meterOf = (d: BallometerData): MeterResult => computeMeter({
    primary: d.primary, perWeek: d.perWeek, targetTest: d.targetTest, setGain: d.setGain,
    goalDate: d.goalDateIso ? new Date(d.goalDateIso) : null, now: new Date(d.nowIso),
})

export async function getBallometerData(userId: string): Promise<BallometerData> {
    const map = await getEgeMap(userId, 'math_profile')
    const [u] = (await db.execute(sql`SELECT ege_target, ballometer_goal_date, ballometer_sets_week FROM user_progress WHERE user_id = ${userId}`)) as unknown as Row[]

    const tasks = (await db.execute(sql`
        SELECT l.unit_id, count(*)::int AS n FROM challenge_progress cp
        JOIN challenges c ON c.id = cp.challenge_id JOIN lessons l ON l.id = c.lesson_id
        WHERE cp.user_id = ${userId} AND cp.completed AND cp.done_right AND cp.date_done >= now() - make_interval(days => ${SPEED_WINDOW_DAYS})
        GROUP BY 1`)) as unknown as Row[]
    const lessons = (await db.execute(sql`
        SELECT tl.t_unit_id, count(*)::int AS n FROM (
            SELECT t_lesson_id, min(date_done) AS first_done FROM t_lesson_progress
            WHERE user_id = ${userId} AND training_pts > 0 GROUP BY 1
        ) p JOIN t_lessons tl ON tl.id = p.t_lesson_id
        WHERE p.first_done >= now() - make_interval(days => ${SPEED_WINDOW_DAYS})
        GROUP BY 1`)) as unknown as Row[]
    const [first] = (await db.execute(sql`
        SELECT min(d) AS first_at FROM (
            SELECT min(date_done) AS d FROM t_lesson_progress WHERE user_id = ${userId} AND training_pts > 0
            UNION ALL SELECT min(date_done) FROM challenge_progress WHERE user_id = ${userId} AND done_right
        ) x`)) as unknown as Row[]

    const tasksByUnit = new Map(tasks.map((r) => [Number(r.unit_id), Number(r.n)]))
    const lessonsByUnit = new Map(lessons.map((r) => [Number(r.t_unit_id), Number(r.n)]))
    let gain = 0
    for (const st of map.stations) {
        const hasCourse = st.courseTarget > 0, hasTrainer = st.trainerTotal > 0
        const t = st.unitIds.reduce((s, id) => s + (tasksByUnit.get(id) ?? 0), 0)
        const l = st.tUnitIds.reduce((s, id) => s + (lessonsByUnit.get(id) ?? 0), 0)
        const fromTasks = hasCourse ? Math.min(1, t / st.courseTarget) * (hasTrainer ? COURSE_WEIGHT : 1) : 0
        const trainerWeight = hasCourse ? 1 - COURSE_WEIGHT : st.part === 2 ? 0.25 : 1
        const fromLessons = hasTrainer ? Math.min(1, l / st.trainerTotal) * trainerWeight : 0
        gain += st.points * (fromTasks + fromLessons)
    }

    let perWeek: number | null = null
    if (first?.first_at) {
        const days = (Date.now() - new Date(String(first.first_at)).getTime()) / 86400000
        const window = Math.max(MIN_WINDOW_DAYS, Math.min(SPEED_WINDOW_DAYS, days))
        perWeek = gain / (window / 7)
    }

    const [s] = (await db.execute(sql`
        SELECT count(*)::int AS n FROM ege_moves WHERE user_id = ${userId} AND step = 'done' AND finished_at IS NOT NULL
          AND finished_at + interval '3 hours' >= date_trunc('week', now() AT TIME ZONE 'Europe/Moscow')`)) as unknown as Row[]

    const mv = map.move
    const moveGain = mv ? mv.toPrimary - mv.fromPrimary : 0
    return {
        primary: map.primary,
        perWeek,
        targetTest: u?.ege_target ? Number(u.ege_target) : EGE_DEFAULT_TARGET,
        setGain: moveGain > 0.03 ? Math.min(0.6, moveGain) : DEFAULT_SET_GAIN,
        goalDateIso: u?.ballometer_goal_date ? new Date(String(u.ballometer_goal_date)).toISOString() : null,
        setsGoal: u?.ballometer_sets_week ? Number(u.ballometer_sets_week) : null,
        setsThisWeek: Number(s?.n ?? 0),
        nowIso: new Date().toISOString(),
    }
}

// Строка для отчёта родителям; null — ученик не на курсе с Баллометром.
export async function ballometerReportLine(userId: string): Promise<string | null> {
    const [c] = (await db.execute(sql`
        SELECT c.title FROM user_progress up JOIN courses c ON c.id = up.active_course_id WHERE up.user_id = ${userId}`)) as unknown as Row[]
    if (!String(c?.title ?? '').startsWith('ЕГЭ Математика')) return null
    const m = meterOf(await getBallometerData(userId))
    if (m.zone === 'new') return null
    const mark = m.zone === 'green' ? '🟢' : m.zone === 'yellow' ? '🟡' : '🔴'
    const when = m.needPrimary === 0 ? 'цель уже взята' : m.readyDate ? `цель ${m.targetTest} баллов будет взята к ${dateRu(m.readyDate)}` : 'на этой скорости цель не приближается'
    return `${mark} Баллометр: *${formatScore(m.score)} из 5*, ${when}`
}
