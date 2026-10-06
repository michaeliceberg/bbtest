// scripts/seedSimWalkUnit.ts
//
// Юнит «Планиметрия ЕГЭ» (курс «ЕГЭ Математика», t_course 5) + первый разбор
// SIMWALK «Подобие треугольников» (type-simwalk.tsx). Юнит добавляется в конец
// списка юнитов курса. Анализ темы 276 sdamgia (задание №17): подобие — самый
// частый приём (~50% задач); дальше по плану — параллельность/Фалес,
// равнобедренный и прямоугольный, биссектриса, медианы, площади, теоремы
// синусов и косинусов, вписанность, Менелай, босс-экзамен. Идемпотентно.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE_ID = 5
const UNIT_TITLE = "Планиметрия ЕГЭ"
const LESSON_TITLE = "Подобие треугольников"

async function main() {
    let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE_ID), eq(u.title, UNIT_TITLE)) })
    if (!unit) {
        const [mx] = await db.select({ m: sql<number>`coalesce(max(${t_units.order}), 0)` }).from(t_units).where(eq(t_units.t_courseId, T_COURSE_ID))
        const [created] = await db.insert(t_units).values({
            title: UNIT_TITLE, description: "Задание №17: подобие, площади, теоремы — шаг за шагом",
            imageSrc: "", t_courseId: T_COURSE_ID, order: Number(mx.m) + 1, blockTitle: "Планиметрия",
        }).returning()
        unit = created
        console.log("Создан юнит", unit.id)
    }
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, LESSON_TITLE)) })
    if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: 1 }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'SIMWALK' as any, question: 'Подобие треугольников', order: 1, points: 10,
        author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log("Урок", lesson.id)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
