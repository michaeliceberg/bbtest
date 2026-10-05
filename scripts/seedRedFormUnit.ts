// scripts/seedRedFormUnit.ts
//
// Юнит «Формулы приведения» (курс «ЕГЭ Математика», t_course 5) + первый
// пошаговый разбор REDFORMWALK (app/t-lesson/[t_lessonId]/type-redformwalk.tsx).
// Юнит встаёт в блок «Тригонометрия» после «Как записать ответ» (order 5),
// остальные юниты с order>=5 сдвигаются на +1. Открывается после юнита
// «Тригонометрическая окружность» (id=30). Идемпотентно.

import db from "@/db/drizzle"
import { and, eq, gte, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE_ID = 5
const UNIT_TITLE = "Формулы приведения"
const CIRCLE_UNIT_ID = 30
const LESSON_TITLE = "sin(x + π/2)"
const INSERT_ORDER = 5

async function main() {
    let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE_ID), eq(u.title, UNIT_TITLE)) })
    if (!unit) {
        await db.update(t_units).set({ order: sql`${t_units.order} + 1` }).where(and(eq(t_units.t_courseId, T_COURSE_ID), gte(t_units.order, INSERT_ORDER)))
        const [created] = await db.insert(t_units).values({
            title: UNIT_TITLE, description: "Как свести sin(x + π/2) и подобные к простым выражениям",
            imageSrc: "", t_courseId: T_COURSE_ID, order: INSERT_ORDER,
            unlockAfterTUnitId: CIRCLE_UNIT_ID, blockTitle: "Тригонометрия",
        }).returning()
        unit = created
        console.log("Создан юнит", unit.id)
    }
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, LESSON_TITLE)) })
    if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: 1 }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'REDFORMWALK', question: 'Формулы приведения', order: 1, points: 10,
        author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log("Урок", lesson.id)
    const units = await db.query.t_units.findMany({ where: (u, { eq }) => eq(u.t_courseId, T_COURSE_ID), orderBy: (u, { asc }) => asc(u.order) })
    units.forEach((u) => console.log(u.order, u.id, u.title, u.blockTitle))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
