// scripts/seedAreaLessons.ts
//
// Идемпотентно: урок «6 площадей» (AREA6WALK) в юните «Треугольник» разбит на 3 урока на одном типе (type-area6walk.tsx
// выбирает урок по тексту задания): «Площадь: основание и высота» (бывший 504, прогресс сохраняется),
// «Площадь: синус и Герон», «Площадь: окружности и Пик». Остальные уроки юнита идут после них.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT_TITLE = "Треугольник"
const LESSONS = [
    { title: "Площадь: основание и высота", old: "6 площадей", badge: "S = ½·a·h", hint: 'площадь треугольника S = ½·a·h: основание и высота, высота под 90°, в прямоугольном высота — катет, в тупоугольном высота падает вне треугольника; найти высоту по площади' },
    { title: "Площадь: синус и Герон", badge: "½ab·sin γ, Герон", hint: 'площадь треугольника через две стороны и угол между ними S = ½·a·b·sin γ; формула Герона S = √(p(p−a)(p−b)(p−c)), полупериметр p' },
    { title: "Площадь: окружности и Пик", badge: "p·r, abc/4R, Пик", hint: 'площадь треугольника через вписанную окружность S = p·r (p — полупериметр), через описанную S = abc/(4R), формула Пика S = В + Г/2 − 1 на клетчатой бумаге' },
]

async function main() {
    const unit = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)),
    })
    if (!unit) throw new Error(`Нет юнита «${UNIT_TITLE}»`)
    const ids: number[] = []
    for (const L of LESSONS) {
        let lesson = await db.query.t_lessons.findFirst({
            where: (l, { and, eq, or }) => and(eq(l.t_unitId, unit.id), L.old ? or(eq(l.title, L.title), eq(l.title, L.old)) : eq(l.title, L.title)),
        })
        if (lesson) {
            await db.update(t_lessons).set({ title: L.title, badge: L.badge } as any).where(eq(t_lessons.id, lesson.id))
            await db.update(t_challenges).set({ question: L.title }).where(eq(t_challenges.t_lessonId, lesson.id))
        } else {
            const [created] = await db.insert(t_lessons).values({ title: L.title, t_unitId: unit.id, order: 99, badge: L.badge } as any).returning()
            await db.insert(t_challenges).values({
                t_lessonId: created.id, type: 'AREA6WALK' as any, question: L.title, order: 1, points: 10,
                author: "ЕГЭ Математика", numRans: '1', difficulty: '', imageSrc: '',
            })
            lesson = created
        }
        await db.execute(sql`UPDATE t_lessons SET ai_hint = ${L.hint} WHERE id = ${lesson!.id}`)
        ids.push(lesson!.id)
    }
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, unit.id), orderBy: (l, { asc }) => asc(l.order) })
    const rest = all.filter((l) => !ids.includes(l.id))
    const ordered = [...ids, ...rest.map((l) => l.id)]
    for (let i = 0; i < ordered.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, ordered[i]))
    console.log('Порядок уроков юнита:', ordered.join(', '))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
