import 'server-only'

// lib/egeDiagnostic.ts
//
// Диагностика «Мой путь» (2026-10-11): узнать балл за 15 минут.
// По одному вопросу на каждое задание ЕГЭ, у которого есть задачи в задачнике
// (ege_task_links kind='unit'). Ответил верно — второй вопрос того же задания, посложнее
// (из уроков второй половины юнита). Неверно / «не знаю» — следующее задание.
// Ответы — клавиатурой цифр (все ответы задачника по этим заданиям — числа).
// Оценка задания: верно+верно = 1, верно+неверно = 0,55, верно (без второго) = 0,7, иначе 0.
// В lib/egeMap.ts оценка входит в освоенность станции; её вес тает по мере реальных
// уроков и задач этого задания.

import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { primaryToTest } from '@/lib/egeScale'

type Row = Record<string, unknown>

export type DiagPlanItem = { num: number; easy: number; hard: number | null }
export type DiagQuestion = { num: number; title: string; level: 1 | 2; challengeId: number; question: string; imageSrc: string | null }
export type DiagAnswer = { num: number; level: number; result: 'right' | 'wrong' | 'skip' }
export type DiagResult = {
    primary: number
    primaryMax: number // сколько первичных можно набрать в проверенных заданиях
    test: number
    testLo: number
    testHi: number
    strong: { num: number; title: string }[]
    weak: { num: number; title: string }[]
    middle: { num: number; title: string }[]
    soon: { num: number; title: string }[]
}

const NUMERIC = '^-?[0-9]+([.,][0-9]+)?$'
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

export const normalizeAnswer = (s: string) => s.trim().replace(/\./g, ',').replace(/\s+/g, '').replace(/^-0$/, '0')

// Задания предмета с юнитами задачника: уроки по порядку и задачи с числовым ответом.
async function loadTaskPools(subject: string) {
    const rows = (await db.execute(sql`
        SELECT t.num, t.title, t.points, t.part, l.id AS lesson_id, l."order", lk.ref_id AS unit_id,
            coalesce(array_agg(c.id ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL), '{}') AS ids
        FROM ege_tasks t
        JOIN ege_task_links lk ON lk.task_id = t.id AND lk.kind = 'unit'
        JOIN lessons l ON l.unit_id = lk.ref_id
        LEFT JOIN challenges c ON c.lesson_id = l.id
            AND (SELECT count(*) FROM challenge_options o WHERE o.challenge_id = c.id AND o.correct) = 1
            AND (SELECT o.text FROM challenge_options o WHERE o.challenge_id = c.id AND o.correct LIMIT 1) ~ ${NUMERIC}
        WHERE t.subject = ${subject}
        GROUP BY t.num, t.title, t.points, t.part, lk.id, lk.ref_id, l.id, l."order"
        ORDER BY t.num, lk.id, l."order"`)) as unknown as Row[]
    const pools = new Map<number, number[][]>()
    for (const r of rows) {
        const ids = (r.ids as number[]).map(Number)
        if (!ids.length) continue
        const n = Number(r.num)
        pools.set(n, [...(pools.get(n) ?? []), ids])
    }
    return pools
}

export async function buildDiagnosticPlan(subject: string): Promise<DiagPlanItem[]> {
    const pools = await loadTaskPools(subject)
    const plan: DiagPlanItem[] = []
    for (const [num, lessons] of [...pools.entries()].sort((a, b) => a[0] - b[0])) {
        const half = Math.ceil(lessons.length / 2)
        const easy = pick(pick(lessons.slice(0, half)))
        const hardPool = (lessons.length > 1 ? lessons.slice(half) : lessons).flat().filter((id) => id !== easy)
        plan.push({ num, easy, hard: hardPool.length ? pick(hardPool) : null })
    }
    return plan
}

// Вопросы плана — без правильных ответов (их проверяет сервер).
export async function loadDiagQuestions(subject: string, plan: DiagPlanItem[]): Promise<DiagQuestion[]> {
    const ids = plan.flatMap((p) => (p.hard ? [p.easy, p.hard] : [p.easy]))
    if (!ids.length) return []
    const rows = (await db.execute(sql`SELECT id, question, image_src FROM challenges WHERE id IN ${sql.raw(`(${ids.join(',')})`)}`)) as unknown as Row[]
    const byId = new Map(rows.map((r) => [Number(r.id), r]))
    const titles = new Map(((await db.execute(sql`SELECT num, title FROM ege_tasks WHERE subject = ${subject}`)) as unknown as Row[]).map((r) => [Number(r.num), String(r.title)]))
    const out: DiagQuestion[] = []
    for (const p of plan) {
        for (const [level, id] of [[1, p.easy], [2, p.hard]] as const) {
            if (!id) continue
            const r = byId.get(id)
            if (!r) continue
            const img = String(r.image_src ?? '').trim()
            out.push({ num: p.num, title: titles.get(p.num) ?? '', level, challengeId: id, question: String(r.question), imageSrc: img || null })
        }
    }
    return out
}

export async function getCorrectText(challengeId: number): Promise<string | null> {
    const r = (await db.execute(sql`SELECT text FROM challenge_options WHERE challenge_id = ${challengeId} AND correct LIMIT 1`)) as unknown as Row[]
    return r[0] ? String(r[0].text) : null
}

// Оценка задания по ответам (0..1).
export function taskScore(answers: DiagAnswer[], num: number, hasHard: boolean): number | null {
    const a1 = answers.find((a) => a.num === num && a.level === 1)
    if (!a1) return null
    if (a1.result !== 'right') return 0
    const a2 = answers.find((a) => a.num === num && a.level === 2)
    if (!a2) return hasHard ? null : 0.7
    return a2.result === 'right' ? 1 : 0.55
}

export type DiagRow = { id: number; status: string; plan: DiagPlanItem[]; createdAt: Date; finishedAt: Date | null }

export async function getLatestDiagnostic(userId: string, subject: string, status?: string): Promise<DiagRow | null> {
    const rows = (await db.execute(sql`
        SELECT id, status, plan, created_at, finished_at FROM ege_diagnostics
        WHERE user_id = ${userId} AND subject = ${subject} ${status ? sql`AND status = ${status}` : sql``}
        ORDER BY id DESC LIMIT 1`)) as unknown as Row[]
    const r = rows[0]
    if (!r) return null
    // plan может прийти строкой (postgres-js кладёт строку-параметр в jsonb как JSON-строку)
    const raw = typeof r.plan === 'string' ? JSON.parse(r.plan) : r.plan
    return { id: Number(r.id), status: String(r.status), plan: (Array.isArray(raw) ? raw : []) as DiagPlanItem[], createdAt: r.created_at as Date, finishedAt: (r.finished_at as Date) ?? null }
}

export async function getDiagAnswers(diagnosticId: number): Promise<DiagAnswer[]> {
    const rows = (await db.execute(sql`SELECT task_num, level, result FROM ege_diagnostic_answers WHERE diagnostic_id = ${diagnosticId}`)) as unknown as Row[]
    return rows.map((r) => ({ num: Number(r.task_num), level: Number(r.level), result: String(r.result) as DiagAnswer['result'] }))
}

// Оценки последней законченной диагностики: номер задания → 0..1 (для lib/egeMap.ts).
export async function getDiagScores(userId: string, subject: string): Promise<Map<number, number>> {
    const d = await getLatestDiagnostic(userId, subject, 'done')
    const out = new Map<number, number>()
    if (!d) return out
    const answers = await getDiagAnswers(d.id)
    for (const p of d.plan) {
        const s = taskScore(answers, p.num, !!p.hard)
        // вопрос посложнее не успели — засчитываем как «верно без второго»
        out.set(p.num, s ?? (answers.some((a) => a.num === p.num && a.level === 1 && a.result === 'right') ? 0.7 : 0))
    }
    return out
}

export async function buildDiagResult(userId: string, subject: string, d: DiagRow): Promise<DiagResult> {
    const [answers, tasks] = await Promise.all([
        getDiagAnswers(d.id),
        db.execute(sql`SELECT num, title, points FROM ege_tasks WHERE subject = ${subject} ORDER BY num`) as unknown as Promise<Row[]>,
    ])
    const planned = new Map(d.plan.map((p) => [p.num, p]))
    let primary = 0, primaryMax = 0, unsure = 0
    const strong: DiagResult['strong'] = [], weak: DiagResult['weak'] = [], middle: DiagResult['middle'] = [], soon: DiagResult['soon'] = []
    for (const t of tasks) {
        const num = Number(t.num), title = String(t.title), points = Number(t.points)
        const p = planned.get(num)
        if (!p) { soon.push({ num, title }); continue }
        const s = taskScore(answers, num, !!p.hard) ?? 0.7
        primary += points * s
        primaryMax += points
        if (s >= 0.7) strong.push({ num, title })
        else if (s > 0) { middle.push({ num, title }); unsure++ }
        else weak.push({ num, title })
        if (s === 0.7) unsure++
    }
    // Один-два вопроса на задание — оценка грубая, показываем диапазон.
    const u = 0.6 + 0.2 * unsure
    return {
        primary, primaryMax,
        test: primaryToTest(primary),
        testLo: primaryToTest(Math.max(0, primary - u)),
        testHi: primaryToTest(primary + u),
        strong, weak, middle, soon,
    }
}
