// scripts/seedEGEMath-unit15-unit19.ts
//
// Курс «ЕГЭ Математика Профиль» (courseId=11): вторая часть — №15 (стереометрия), №17 (моделирование,
// у sdamgia «задачи на оптимальный выбор»), №18 (планиметрия), №19 (параметр). 2026-10-12.
// Данные — scripts/data/ege1519.json (тот же конвейер, что у scripts/seedEGEMath-unit14-unit16.ts).
//   • №15, №18: «а) докажите, б) найдите» — спрашиваем пункт б) (число/угол/отношение).
//   • №17: только задачи с числовым ответом (единицы измерения убраны из ответа).
//   • №19: ответ — множество значений параметра (промежутки), варианты — как в №16.
// Неверные варианты числовых ответов — правдоподобные ошибки под форму ответа (обратная дробь,
// другой корень/без корня, arctg вместо arccos, 90°−α, ×2/÷2…) + ответы соседних задач урока;
// каждый проверен численно: значение не совпадает с правильным. №20 не взят — там почти везде
// «да/нет» и примеры наборов чисел.
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

type Item = { id: string; q: string; a: string; d: string[] }
type Data = Record<'15' | '17' | '18' | '19', { title: string; items: Item[] }[]>

const data: Data = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'ege1519.json'), 'utf8'))

const queryClient = postgres(process.env.DATABASE_URL!)
const db = drizzle(queryClient, { schema })

const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
}

type Q = { q: string; a: string; d: string[] }
const lessonsOf = (k: keyof Data) => data[k].map((l) => ({ title: l.title, qs: l.items.map((it) => ({ q: it.q, a: it.a, d: it.d })) }))
const UNITS: { title: string; description: string; order: number; egeNum: number; lessons: { title: string; qs: Q[] }[] }[] = [
    { title: '15. Стереометрия (развёрнутый ответ)', order: 15, egeNum: 15, description: 'Расстояния, сечения, углы, объёмы — ответ на пункт б)', lessons: lessonsOf('15') },
    { title: '17. Моделирование', order: 17, egeNum: 17, description: 'Задачи на оптимальный выбор: производство, перевозки, смеси', lessons: lessonsOf('17') },
    { title: '18. Планиметрия (развёрнутый ответ)', order: 18, egeNum: 18, description: 'Треугольники, четырёхугольники, окружности — ответ на пункт б)', lessons: lessonsOf('18') },
    { title: '19. Параметр', order: 19, egeNum: 19, description: 'Уравнения, неравенства и системы с параметром', lessons: lessonsOf('19') },
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
