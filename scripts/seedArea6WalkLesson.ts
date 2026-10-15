// scripts/seedArea6WalkLesson.ts
//
// Идемпотентный сид: блок «Планиметрия» (t_course 5 «ЕГЭ Математика») → юнит «Треугольник» СРАЗУ ПОСЛЕ «Окружность»,
// в нём первый урок «6 площадей» (AREA6WALK, см. type-area6walk.tsx). Добавляет значение AREA6WALK в enum "type".

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const BLOCK = "Планиметрия"
const AFTER_UNIT = "Окружность"
const UNIT_TITLE = "Треугольник"
const LESSON_TITLE = "6 площадей"

async function main() {
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'AREA6WALK'`))

    let unit = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)),
    })
    if (!unit) {
        const units = await db.query.t_units.findMany({
            where: (u, { eq }) => eq(u.t_courseId, T_COURSE),
            orderBy: (u, { asc }) => asc(u.order),
        })
        const after = units.find((u) => u.title === AFTER_UNIT)
        const order = after ? after.order + 1 : units.length ? units[units.length - 1].order + 1 : 1
        for (const u of units.filter((x) => x.order >= order).sort((a, b) => b.order - a.order)) {
            await db.update(t_units).set({ order: u.order + 1 }).where(eq(t_units.id, u.id))
        }
        const [created] = await db.insert(t_units).values({
            title: UNIT_TITLE, description: UNIT_TITLE, imageSrc: '', t_courseId: T_COURSE, order, blockTitle: BLOCK,
        } as any).returning()
        unit = created
        console.log(`Юнит «${UNIT_TITLE}» создан id=${created.id}, order=${order}`)
    }

    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, LESSON_TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок (id=${existing.id}) удалён`)
    }
    const all = await db.query.t_lessons.findMany({
        where: (l, { eq }) => eq(l.t_unitId, unit!.id),
        orderBy: (l, { asc }) => asc(l.order),
    })
    for (let i = 0; i < all.length; i++) {
        await db.update(t_lessons).set({ order: i + 2 }).where(eq(t_lessons.id, all[i].id))
    }
    const [lesson] = await db
        .insert(t_lessons)
        .values({ title: LESSON_TITLE, t_unitId: unit!.id, order: 1, badge: "6 формул площади" } as any)
        .returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'AREA6WALK' as any,
        question: LESSON_TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })
    console.log(`Юнит ${unit!.id}: урок «${LESSON_TITLE}» создан id=${lesson.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
