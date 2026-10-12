// lib/diagBase.ts
//
// Диагностика «база в уме» (version 2 в ege_diagnostics, компонент components/ege-diagnostic-v2.tsx):
// пункты — не задачи ЕГЭ, а базовые умения. Каждый пункт «подпирает» одно задание ЕГЭ (BASE_ITEM_EGE);
// оценка задания = доля верно отвеченных его пунктов. «Пока не знаю» и «не успел» — 0.
// Ответы — таблица ege_base_answers (одна строка на пункт). Старая диагностика (version 1) не тронута.

import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { primaryToTest } from '@/lib/egeScale'
import type { DiagResult } from '@/lib/egeDiagnostic'

export type BaseStatus = 'right' | 'wrong' | 'unknown' | 'timeout'
export type BaseRow = { id: string; status: BaseStatus }

// Пункт диагностики → номер задания ЕГЭ (профильная математика 2027).
export const BASE_ITEM_EGE: Record<string, number> = {
    '1': 8, '2': 8,                       // устный счёт, отрицательные числа → вычисления
    '3': 2,                               // длина вектора → векторы
    '4': 1, '5a': 1, '5b': 1, '5c': 1,    // Пифагор, sin/cos/tg → планиметрия
    '14': 1, '17': 1,                     // медиана, вписанная окружность → планиметрия
    '6': 8, '8': 8, '9': 8, '10': 8,      // cos 2α, логарифмы → вычисления и преобразования
    '7': 7,                               // логарифмическое уравнение → уравнения
    '11.1': 16, '11.2': 16, '11.3': 16, '11.4': 16, // знак логарифма → неравенства
    '12': 3,                              // подобие кубов → стереометрия
    '13': 4,                              // перестановки → вероятность
    '15': 9, '16': 9,                     // производная, точка минимума → производная
}

type Row = Record<string, unknown>

export async function saveBaseDiagnostic(userId: string, subject: string, rows: BaseRow[]): Promise<number> {
    const now = new Date().toISOString()
    const ins = (await db.execute(sql`
        INSERT INTO ege_diagnostics (user_id, subject, status, plan, version, created_at, finished_at)
        VALUES (${userId}, ${subject}, 'done', '[]'::jsonb, 2, ${now}, ${now}) RETURNING id`)) as unknown as Row[]
    const id = Number(ins[0].id)
    const valid = rows.filter((r) => r.id in BASE_ITEM_EGE && ['right', 'wrong', 'unknown', 'timeout'].includes(r.status))
    for (const r of valid) {
        await db.execute(sql`
            INSERT INTO ege_base_answers (diagnostic_id, item_id, ege_num, result)
            VALUES (${id}, ${r.id}, ${BASE_ITEM_EGE[r.id]}, ${r.status})
            ON CONFLICT (diagnostic_id, item_id) DO NOTHING`)
    }
    return id
}

// Оценки задания ЕГЭ 0..1 по ответам «базы».
export async function getBaseScores(diagnosticId: number): Promise<Map<number, number>> {
    const rows = (await db.execute(sql`
        SELECT ege_num, count(*) AS total, count(*) FILTER (WHERE result = 'right') AS ok
        FROM ege_base_answers WHERE diagnostic_id = ${diagnosticId} GROUP BY ege_num`)) as unknown as Row[]
    return new Map(rows.map((r) => [Number(r.ege_num), Number(r.ok) / Math.max(1, Number(r.total))]))
}

export async function getBaseRows(diagnosticId: number): Promise<BaseRow[]> {
    const rows = (await db.execute(sql`SELECT item_id, result FROM ege_base_answers WHERE diagnostic_id = ${diagnosticId}`)) as unknown as Row[]
    return rows.map((r) => ({ id: String(r.item_id), status: String(r.result) as BaseStatus }))
}

// Итог для экрана «Строим твой путь» (тот же DiagResult, что у старой диагностики).
export async function buildBaseResult(diagnosticId: number, subject: string): Promise<DiagResult> {
    const [scores, tasks] = await Promise.all([
        getBaseScores(diagnosticId),
        db.execute(sql`SELECT num, title, points FROM ege_tasks WHERE subject = ${subject} ORDER BY num`) as unknown as Promise<Row[]>,
    ])
    let primary = 0, primaryMax = 0, unsure = 0
    const strong: DiagResult['strong'] = [], weak: DiagResult['weak'] = [], middle: DiagResult['middle'] = [], soon: DiagResult['soon'] = []
    for (const t of tasks) {
        const num = Number(t.num), title = String(t.title), points = Number(t.points)
        const s = scores.get(num)
        if (s === undefined) { soon.push({ num, title }); continue }
        primary += points * s
        primaryMax += points
        if (s >= 0.99) strong.push({ num, title })
        else if (s > 0) { middle.push({ num, title }); unsure++ }
        else weak.push({ num, title })
    }
    // Базовые вопросы — оценка грубая, показываем диапазон.
    const u = 0.8 + 0.3 * unsure
    return {
        primary, primaryMax,
        test: primaryToTest(primary),
        testLo: primaryToTest(Math.max(0, primary - u)),
        testHi: primaryToTest(primary + u),
        strong, weak, middle, soon,
    }
}
