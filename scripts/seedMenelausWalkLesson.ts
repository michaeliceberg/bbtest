// scripts/seedMenelausWalkLesson.ts
//
// Идемпотентный сид: блок «Планиметрия» (t_course 5) → юнит «Треугольник» → урок «Теорема Менелая»
// (MENELAUSWALK, см. type-menelauswalk.tsx), сразу после «6 площадей». Добавляет значение в enum "type" и ai_hint.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT_TITLE = "Треугольник"
const AFTER_LESSON = "6 площадей"
const LESSON_TITLE = "Теорема Менелая"
const AI_HINT = 'теорема Менелая: треугольник и секущая прямая; выбираем треугольник (3 вершины), остальные 3 точки на прямых сторон; путь вершина → точка → вершина: (AD/DB)·(BF/FC)·(CE/EA) = 1; составить соотношение отрезков, отношения отрезков на сторонах, точка на продолжении стороны'

async function main() {
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'MENELAUSWALK'`))
    const unit = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)),
    })
    if (!unit) throw new Error(`Нет юнита «${UNIT_TITLE}»`)

    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, LESSON_TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок (id=${existing.id}) удалён`)
    }
    const all = await db.query.t_lessons.findMany({
        where: (l, { eq }) => eq(l.t_unitId, unit.id),
        orderBy: (l, { asc }) => asc(l.order),
    })
    const afterIdx = all.findIndex((l) => l.title === AFTER_LESSON)
    const pos = afterIdx >= 0 ? afterIdx + 1 : all.length
    const ordered = [...all.slice(0, pos), null, ...all.slice(pos)]
    for (let i = 0; i < ordered.length; i++) {
        const l = ordered[i]
        if (l) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, l.id))
    }
    const [lesson] = await db
        .insert(t_lessons)
        .values({ title: LESSON_TITLE, t_unitId: unit.id, order: pos + 1, badge: "Вершина → точка" } as any)
        .returning({ id: t_lessons.id })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${AI_HINT} WHERE id = ${lesson.id}`)
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'MENELAUSWALK' as any,
        question: LESSON_TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })
    console.log(`Юнит ${unit.id}: урок «${LESSON_TITLE}» создан id=${lesson.id}, order=${pos + 1}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
