// scripts/seedEGEMath-real2026.ts
//
// Курс «ЕГЭ Математика» (courseId=11): задачи реальных вариантов ЕГЭ-2026 (sdamgia, варианты 89894899…89894916),
// разложенные по разделам структуры ЕГЭ-2027. В каждом целевом юните — урок «Реальные варианты 2026» в конце;
// у всех задач author = 'Реальные варианты 2026'. 2026-10-13.
//   • №13 (финансовая), №14 (а и б отдельными вопросами), №15/№18 (пункт б), №16, №19 — в существующие юниты.
//   • Старые экономические задачи «Д21 C8» (кредит/вклад повышенной сложности) — в «17. Моделирование».
//   • №20 — новый юнит «20. Числа и их свойства» (а, б — да/нет; в — число) + ege_task_links на задание 20.
// Данные — scripts/data/real2026.json; ответы буквально с sdamgia, неверные варианты придуманы под каждую задачу.
// Идемпотентно: урок с тем же названием удаляется и создаётся заново; юнит 20 пересоздаётся.

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, eq, like, sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'
import * as schema from '../db/schema'

const COURSE_ID = 11
const AUTHOR = 'Реальные варианты 2026'
const LESSON_TITLE = 'Реальные варианты 2026'
const UNIT20_TITLE = '20. Числа и их свойства'

type Item = { id: string; q: string; a: string; d: string[] }
type Item14 = { id: string; qa: string; qb: string; a: string; dA: string[]; b: string; dB: string[] }
type Data = { '13': Item[]; '14': Item14[]; '15': Item[]; '16': Item[]; '17': Item[]; '18': Item[]; '19': Item[]; '20': Item[] }
type Q = { q: string; a: string; d: string[] }

const data: Data = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'real2026.json'), 'utf8'))

const queryClient = postgres(process.env.DATABASE_URL!)
const db = drizzle(queryClient, { schema })

const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
}

const plain = (items: Item[]): Q[] => items.map(({ q, a, d }) => ({ q, a, d }))
const TARGETS: { prefix: string; qs: Q[] }[] = [
    { prefix: '13.', qs: plain(data['13']) },
    { prefix: '14.', qs: data['14'].flatMap((t) => [{ q: t.qa, a: t.a, d: t.dA }, { q: t.qb, a: t.b, d: t.dB }]) },
    { prefix: '15.', qs: plain(data['15']) },
    { prefix: '16.', qs: plain(data['16']) },
    { prefix: '17.', qs: plain(data['17']) },
    { prefix: '18.', qs: plain(data['18']) },
    { prefix: '19.', qs: plain(data['19']) },
]

const check = (c: Q) => {
    const yesNo = c.a === 'да' || c.a === 'нет'
    const need = yesNo ? 1 : 5
    if (c.d.length !== need || c.d.includes(c.a) || new Set(c.d).size !== c.d.length) throw new Error(`плохие варианты: ${c.q.slice(0, 80)}`)
}

const insertLesson = async (unitId: number, order: number, qs: Q[]) => {
    const [lesson] = await db.insert(schema.lessons).values({ title: LESSON_TITLE, unitId, order }).returning()
    for (let i = 0; i < qs.length; i++) {
        const c = qs[i]
        const [ch] = await db.insert(schema.challenges).values({
            lessonId: lesson.id, type: 'ASSIST', question: c.q, order: i + 1, points: 10,
            author: AUTHOR, difficulty: '', imageSrc: '',
        }).returning()
        await db.insert(schema.challengeOptions).values(shuffle([{ text: c.a, correct: true }, ...c.d.map((t) => ({ text: t, correct: false }))])
            .map((o) => ({ challengeId: ch.id, text: o.text, correct: o.correct, imageSrc: '', audioSrc: '' })))
    }
    return lesson.id
}

const main = async () => {
    try {
        for (const t of TARGETS) t.qs.forEach(check)
        data['20'].forEach(check)

        for (const t of TARGETS) {
            const unit = await db.query.units.findFirst({ where: and(eq(schema.units.courseId, COURSE_ID), like(schema.units.title, `${t.prefix}%`)) })
            if (!unit) throw new Error(`нет юнита ${t.prefix}`)
            await db.delete(schema.lessons).where(and(eq(schema.lessons.unitId, unit.id), eq(schema.lessons.title, LESSON_TITLE)))
            const rows = (await db.execute(sql`SELECT coalesce(max("order"), 0) AS m FROM lessons WHERE unit_id = ${unit.id}`)) as unknown as { m: number }[]
            const id = await insertLesson(unit.id, Number(rows[0].m) + 1, t.qs)
            console.log(`«${unit.title}» → урок ${id}: ${t.qs.length} вопросов`)
        }

        const old = await db.query.units.findFirst({ where: and(eq(schema.units.courseId, COURSE_ID), eq(schema.units.title, UNIT20_TITLE)) })
        if (old) {
            await db.execute(sql`DELETE FROM ege_task_links WHERE kind = 'unit' AND ref_id = ${old.id}`)
            await db.delete(schema.units).where(eq(schema.units.id, old.id))
        }
        const [unit] = await db.insert(schema.units).values({
            title: UNIT20_TITLE, description: 'Задачи на числа: делимость, суммы цифр, оценка и пример', imageSrc: '', courseId: COURSE_ID, order: 20,
        }).returning()
        const id = await insertLesson(unit.id, 1, plain(data['20']))
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT id, 'unit', ${unit.id} FROM ege_tasks WHERE subject = 'math_profile' AND num = 20`)
        console.log(`unit ${unit.id} «${UNIT20_TITLE}» → урок ${id}: ${data['20'].length} вопросов`)
    } finally {
        await queryClient.end()
    }
}

main()
