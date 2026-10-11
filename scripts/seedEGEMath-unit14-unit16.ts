// scripts/seedEGEMath-unit14-unit16.ts
//
// Курс «ЕГЭ Математика Профиль» (courseId=11): задания второй части №14 (уравнения) и №16
// (неравенства) с https://math-ege.sdamgia.ru (каталог по структуре 2027), 2026-10-11.
// Данные — scripts/data/ege1416.json (собраны скриптами сессии: скачивание задач по category_id,
// перевод словесных alt-формул sdamgia в LaTeX, отбор по 6–8 задач на подтему).
//   • №14: 36 задач, каждая — ДВА вопроса, как на экзамене: «а) реши уравнение» (серии/корни)
//     и «б) отбор корней на промежутке». 6 уроков.
//   • №16: 48 неравенств, ответ — объединение промежутков. 6 уроков.
// Ответ — поле «Ответ:» sdamgia (переведено в LaTeX). Неверные варианты: 3 типичные ошибки
// (строгое/нестрогое, потерянная ОДЗ/выколотая точка, «знак наоборот», лишний/потерянный корень,
// другой период серии) + ответы соседних задач урока. Для №14 каждый неверный вариант проверен
// численно: его множество корней не совпадает с правильным (−π/2+πk ≡ π/2+πk и т.п. отброшены);
// перевод формул проверен тем, что корни б) входят в корни а).
// Ответы не числовые — в диагностику «Мой путь» эти задачи не попадают (она берёт только числа).
// Идемпотентно: юнит с тем же названием удаляется и создаётся заново.

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq, sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'
import * as schema from '../db/schema'

const COURSE_ID = 11
const AUTHOR = 'ЕГЭ Математика Профиль'

type Item14 = { id: string; qa: string; qb: string; a: string; dA: string[]; b: string; dB: string[] }
type Item16 = { id: string; q: string; a: string; d: string[] }
type Data = { '14': { title: string; items: Item14[] }[]; '16': { title: string; items: Item16[] }[] }

const data: Data = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'ege1416.json'), 'utf8'))

const queryClient = postgres(process.env.DATABASE_URL!)
const db = drizzle(queryClient, { schema })

const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
}

type Q = { q: string; a: string; d: string[] }
const UNITS: { title: string; description: string; order: number; egeNum: number; lessons: { title: string; qs: Q[] }[] }[] = [
    {
        title: '14. Уравнения', order: 14, egeNum: 14,
        description: 'Вторая часть: а) решить уравнение, б) отобрать корни на промежутке',
        lessons: data['14'].map((l) => ({
            title: l.title,
            qs: l.items.flatMap((it) => [{ q: it.qa, a: it.a, d: it.dA }, { q: it.qb, a: it.b, d: it.dB }]),
        })),
    },
    {
        title: '16. Неравенства', order: 16, egeNum: 16,
        description: 'Вторая часть: рациональные, показательные, логарифмические, с модулем и корнями',
        lessons: data['16'].map((l) => ({ title: l.title, qs: l.items.map((it) => ({ q: it.q, a: it.a, d: it.d })) })),
    },
]

const main = async () => {
    try {
        for (const u of UNITS) {
            for (const l of u.lessons) for (const c of l.qs) {
                if (c.d.length !== 5 || c.d.includes(c.a) || new Set(c.d).size !== 5) throw new Error(`плохие варианты: ${c.q.slice(0, 80)}`)
            }
            const old = await db.query.units.findFirst({ where: and(eq(schema.units.courseId, COURSE_ID), eq(schema.units.title, u.title)) })
            if (old) {
                await db.execute(sql`DELETE FROM ege_task_links WHERE kind = 'unit' AND ref_id = ${old.id}`)
                await db.delete(schema.units).where(eq(schema.units.id, old.id))
            }
            const [unit] = await db.insert(schema.units).values({ title: u.title, description: u.description, imageSrc: '', courseId: COURSE_ID, order: u.order }).returning()
            let total = 0
            for (let li = 0; li < u.lessons.length; li++) {
                const l = u.lessons[li]
                const [lesson] = await db.insert(schema.lessons).values({ title: l.title, unitId: unit.id, order: li + 1 }).returning()
                for (let i = 0; i < l.qs.length; i++) {
                    const c = l.qs[i]
                    const [ch] = await db.insert(schema.challenges).values({
                        lessonId: lesson.id, type: 'ASSIST', question: c.q, order: i + 1, points: 10,
                        author: AUTHOR, difficulty: '', imageSrc: '',
                    }).returning()
                    await db.insert(schema.challengeOptions).values(shuffle([{ text: c.a, correct: true }, ...c.d.map((t) => ({ text: t, correct: false }))])
                        .map((o) => ({ challengeId: ch.id, text: o.text, correct: o.correct, imageSrc: '', audioSrc: '' })))
                    total++
                }
            }
            await db.execute(sql`
                INSERT INTO ege_task_links (task_id, kind, ref_id)
                SELECT id, 'unit', ${unit.id} FROM ege_tasks WHERE subject = 'math_profile' AND num = ${u.egeNum}`)
            console.log(`unit ${unit.id} «${unit.title}»: ${u.lessons.length} уроков, ${total} вопросов`)
        }
    } finally {
        await queryClient.end()
    }
}

main()
