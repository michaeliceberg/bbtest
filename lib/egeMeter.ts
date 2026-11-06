// lib/egeMeter.ts — математика Баллометра (без обращения к базе, работает и в браузере).
// Сравниваем, сколько первичных баллов в неделю ученик набирает, со скоростью, нужной, чтобы взять цель к своей дате.
// Оценка = 5 × (скорость / нужная скорость), не больше 5. Данные ученика — lib/ballometer.ts.

import { testToPrimary } from '@/lib/egeScale'

export const EGE_EXAM_DATE = new Date(2027, 5, 1) // точная дата экзамена 2027 ещё не объявлена
export const EGE_DEADLINE = new Date(2027, 4, 1) // запас: цель взята за месяц до экзамена
export const EGE_DEFAULT_TARGET = 90 // пока ученик не выбрал вуз
export const METER_GREEN_FROM = 4.3 // примерно столько нужно, чтобы успеть к самому экзамену без запаса
export const METER_YELLOW_FROM = 3
// Сет = 1 урок тренажёра + 5 верных задач (через кнопку или самостоятельно). Урок приравнен к 5 задачам.
export const LESSON_EQ = 5
export const SET_EQ = 10
// «до следующего сета»: сколько ещё задач, или урок + задачи
export const nextSetLeft = (weekEq: number) => {
    const left = SET_EQ - (weekEq % SET_EQ)
    return left > LESSON_EQ ? { tasks: left, orLessonPlus: left - LESSON_EQ } : { tasks: left, orLessonPlus: 0 }
}
export const MAX_SETS_WEEK = 21 // больше трёх сетов в день не предлагаем

const WEEK_MS = 7 * 86400000
// Без этого ровно 3,001 сета округлялось бы до 4: время с момента настройки немного ушло.
const SETS_TOLERANCE = 0.05

export type MeterZone = 'green' | 'yellow' | 'red' | 'new'

export type MeterResult = {
    zone: MeterZone
    score: number | null // 0…5, null — данных пока мало
    targetTest: number
    targetPrimary: number
    needPrimary: number
    requiredPerWeek: number
    readyDate: Date | null // когда возьмёт цель с такой скоростью
    addSetsPerWeek: number // сколько сетов в неделю прибавить, чтобы идти по плану
    goalDate: Date
}

export const dateForSets = (needPrimary: number, setsPerWeek: number, setGain: number, now: Date) =>
    new Date(now.getTime() + (needPrimary / Math.max(0.01, setsPerWeek * setGain)) * WEEK_MS)

// Минимальное целое число сетов в неделю, чтобы успеть к дате.
export const setsForDate = (needPrimary: number, date: Date, setGain: number, now: Date) => {
    const weeks = Math.max(1 / 7, (date.getTime() - now.getTime()) / WEEK_MS)
    return Math.max(1, Math.min(MAX_SETS_WEEK, Math.ceil(needPrimary / weeks / setGain - SETS_TOLERANCE)))
}

// Сколько сетов нужно сегодня: остаток недельной нормы делим на оставшиеся дни недели (неделя с понедельника, по Москве).
// Сколько дней недели осталось, считая сегодня (неделя с понедельника, по Москве): в пятницу — 3.
export const daysLeftInWeek = (now: Date) => {
    const weekday = new Date(now.getTime() + 3 * 3600000).getUTCDay() // 0 — воскресенье
    return weekday === 0 ? 1 : 8 - weekday
}

export const setsTodayGoal = (setsPerWeek: number, doneThisWeek: number, doneToday: number, now: Date) => {
    const weekday = new Date(now.getTime() + 3 * 3600000).getUTCDay() // 0 — воскресенье
    const daysLeft = weekday === 0 ? 1 : 8 - weekday
    return Math.ceil(Math.max(0, setsPerWeek - (doneThisWeek - doneToday)) / daysLeft)
}

export function computeMeter(p: { primary: number; perWeek: number | null; targetTest?: number; setGain?: number; goalDate?: Date | null; now?: Date }): MeterResult {
    const now = p.now ?? new Date()
    const targetTest = p.targetTest ?? EGE_DEFAULT_TARGET
    const targetPrimary = testToPrimary(targetTest)
    const needPrimary = Math.max(0, targetPrimary - p.primary)
    const goalDate = p.goalDate ?? EGE_DEADLINE
    const weeksLeft = Math.max(1 / 7, (goalDate.getTime() - now.getTime()) / WEEK_MS)
    const requiredPerWeek = needPrimary / weeksLeft
    const base = { targetTest, targetPrimary, needPrimary, requiredPerWeek, goalDate }

    if (needPrimary === 0) return { ...base, zone: 'green', score: 5, readyDate: now, addSetsPerWeek: 0 }
    if (p.perWeek === null) return { ...base, zone: 'new', score: null, readyDate: null, addSetsPerWeek: 0 }

    const score = Math.round(Math.min(5, (5 * p.perWeek) / requiredPerWeek) * 10) / 10
    const zone: MeterZone = score >= METER_GREEN_FROM ? 'green' : score >= METER_YELLOW_FROM ? 'yellow' : 'red'
    const readyDate = p.perWeek > 0 ? new Date(now.getTime() + (needPrimary / p.perWeek) * WEEK_MS) : null
    const addSetsPerWeek = Math.max(0, Math.ceil((requiredPerWeek - p.perWeek) / (p.setGain ?? 0.2) - SETS_TOLERANCE))
    return { ...base, zone, score, readyDate, addSetsPerWeek }
}

export const formatScore = (s: number | null) => (s === null ? '–' : s.toFixed(1).replace('.', ','))
export const dateRu = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).replace(' г.', ' года')
export const dateShort = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })

// ——— Сетометр: прибор в сетах за календарную неделю (с понедельника, по Москве; решение пользователя 2026-11-06).
// Стрелка — сколько сетов сделано на этой неделе, белая засечка — недельная норма. Цветные зоны — «по графику на
// сегодня»: к концу вчерашнего дня должно быть сделано need × (прошло дней)/7, это начало зелёной зоны. В понедельник
// график ещё ноль — вся шкала зелёная, неделя только началась.
export const SET_YELLOW_FROM = 0.7 // от 70% «по графику» — жёлтая зона, ниже — красная

export type SetMeter = { pace: number | null; need: number; expected: number; max: number; zone: MeterZone }

export const daysPassedInWeek = (now: Date) => 7 - daysLeftInWeek(now) // полных дней с понедельника до сегодня

export function computeSetMeter(weekSets: number | null, need: number, now: Date): SetMeter {
    const pace = weekSets === null ? null : Math.round(weekSets * 10) / 10
    const expected = Math.round(need * daysPassedInWeek(now) / 7 * 10) / 10
    const max = Math.min(MAX_SETS_WEEK, Math.max(5, Math.ceil(Math.max(need * 1.25, (pace ?? 0) * 1.15))))
    const zone: MeterZone = pace === null ? 'new'
        : need === 0 || pace >= need - 0.05 || pace >= expected - 0.05 ? 'green'
        : pace >= expected * SET_YELLOW_FROM ? 'yellow' : 'red'
    return { pace, need, expected, max, zone }
}

// Нужно сетов в неделю: что ученик сам выбрал, иначе минимум, чтобы успеть к дате цели.
export const needSetsOf = (setsGoal: number | null, m: MeterResult, setGain: number, now: Date) =>
    m.needPrimary === 0 ? 0 : setsGoal ?? setsForDate(m.needPrimary, m.goalDate, setGain, now)
