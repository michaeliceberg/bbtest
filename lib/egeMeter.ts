// lib/egeMeter.ts — оценка скорости подготовки к ЕГЭ для прибора (пока только проба: /test-ege-meter).
// Идея: сколько первичных баллов в неделю ученик набирает сейчас и сколько нужно, чтобы взять цель
// за месяц до экзамена. Оценка = 5 × (скорость / нужная скорость), не больше 5.

import { testToPrimary } from '@/lib/egeScale'

export const EGE_EXAM_DATE = new Date(2027, 5, 1) // точная дата экзамена 2027 ещё не объявлена
export const EGE_BUFFER_DAYS = 30 // запас: цель взята за месяц до экзамена
export const EGE_DEFAULT_TARGET = 90 // пока ученик не выбрал вуз
export const METER_GREEN_FROM = 4.3 // примерно столько нужно, чтобы успеть к самому экзамену без запаса
export const METER_YELLOW_FROM = 3

export type MeterZone = 'green' | 'yellow' | 'red' | 'new'

export type MeterResult = {
    zone: MeterZone
    score: number | null // 0…5, null — данных пока мало
    targetPrimary: number
    needPrimary: number
    requiredPerWeek: number
    readyDate: Date | null // когда возьмёт цель с такой скоростью
    addSetsPerWeek: number // сколько сетов в неделю прибавить, чтобы идти по плану
}

const WEEK_MS = 7 * 86400000

export function computeMeter(p: { primary: number; perWeek: number | null; targetTest?: number; setGain?: number; now?: Date }): MeterResult {
    const now = p.now ?? new Date()
    const targetPrimary = testToPrimary(p.targetTest ?? EGE_DEFAULT_TARGET)
    const needPrimary = Math.max(0, targetPrimary - p.primary)
    const deadline = new Date(EGE_EXAM_DATE.getTime() - EGE_BUFFER_DAYS * 86400000)
    const weeksLeft = Math.max(1 / 7, (deadline.getTime() - now.getTime()) / WEEK_MS)
    const requiredPerWeek = needPrimary / weeksLeft

    if (needPrimary === 0) return { zone: 'green', score: 5, targetPrimary, needPrimary, requiredPerWeek: 0, readyDate: now, addSetsPerWeek: 0 }
    if (p.perWeek === null) return { zone: 'new', score: null, targetPrimary, needPrimary, requiredPerWeek, readyDate: null, addSetsPerWeek: 0 }

    const score = Math.round(Math.min(5, (5 * p.perWeek) / requiredPerWeek) * 10) / 10
    const zone: MeterZone = score >= METER_GREEN_FROM ? 'green' : score >= METER_YELLOW_FROM ? 'yellow' : 'red'
    const readyDate = p.perWeek > 0 ? new Date(now.getTime() + (needPrimary / p.perWeek) * WEEK_MS) : null
    const addSetsPerWeek = Math.max(0, Math.ceil((requiredPerWeek - p.perWeek) / (p.setGain ?? 0.2)))
    return { zone, score, targetPrimary, needPrimary, requiredPerWeek, readyDate, addSetsPerWeek }
}
