// scripts/seedPowZeroNegLesson.ts
//
// Идемпотентный сид: юнит «Степени и корни» (t_course 5) → третий урок «Нулевая и отрицательная степень»
// (тот же тип POWWALK — type-powwalk.tsx выбирает урок по тексту задания «Нулевая…»).
// Плюс описание для ИИ-помощника (ai_hint). Юнит и enum создаёт scripts/seedPowWalkUnit.ts.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT_TITLE = "Степени и корни"
const LESSON_TITLE = "Нулевая и отрицательная степень"
const ORDER = 3
const AI_HINT = 'нулевая степень: a⁰ = 1 (a ≠ 0), потому что 5² : 5² = 5⁰ = 1; отрицательная степень: a⁻ⁿ = 1/aⁿ, 5² : 5⁵ = 5⁻³ = 1/5³; 10⁻² = 0,01; 1/a⁻ⁿ = aⁿ; действия со степенями с отрицательными показателями'

async function main() {
    const unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)) })
    if (!unit) throw new Error('Нет юнита — сначала scripts/seedPowWalkUnit.ts')
    const existing = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, LESSON_TITLE)) })
    if (existing) { await db.delete(t_lessons).where(eq(t_lessons.id, existing.id)); console.log(`Старый урок ${existing.id} удалён`) }
    const after = await db.query.t_lessons.findMany({ where: (l, { and, eq, gte }) => and(eq(l.t_unitId, unit.id), gte(l.order, ORDER)) })
    for (const l of after) await db.update(t_lessons).set({ order: l.order + 1 }).where(eq(t_lessons.id, l.id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: ORDER, badge: "a⁰ = 1 · a⁻ⁿ" } as any).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'POWWALK' as any, question: 'Нулевая и отрицательная степень', order: 1, points: 10,
        author: "ЕГЭ Математика", numRans: '1', difficulty: '', imageSrc: '',
    })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${AI_HINT} WHERE id = ${lesson.id}`)
    console.log(`Урок «${LESSON_TITLE}» создан id=${lesson.id} в юните ${unit.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
