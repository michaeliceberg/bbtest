// scripts/seedPercentUnit.ts
//
// Идемпотентно: блок «Проценты» → юнит «Проценты» (t_course 5 «ЕГЭ Математика», в конец списка)
// с уроками SCENEWALK (контент — lib/scene-lessons/percent.tsx), ai_hint, связь с заданием ЕГЭ №10, №11, №13.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT = 'Проценты'
const LESSONS = [
    { title: 'Кредиты, банки, проценты', badge: '№11 · №13',
        hint: 'проценты как множитель (ЕГЭ №10, №11, №13): цена выросла на 30% → умножаем на 1,3, упала на 20% → умножаем на 0,8; +p% → ×(1 + p/100), −p% → ×(1 − p/100); +20% и −20% подряд = ×0,96 (не возвращается); вклад и сложные проценты S·1,1ⁿ; кредит: долг ×1,2 минус выплата; обратная задача — делим на множитель; на сколько процентов изменилась цена — новая/старая' },
]

async function main() {
    let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT)) })
    if (!unit) {
        const last = await db.execute(sql`SELECT COALESCE(MAX("order"), 0)::int AS m FROM t_units WHERE t_course_id = ${T_COURSE}`) as unknown as { m: number }[]
        const [u] = await db.insert(t_units).values({ title: UNIT, description: 'Проценты, банки, кредиты для ЕГЭ', imageSrc: '/unit-pics/percent.svg', t_courseId: T_COURSE, order: (last[0]?.m ?? 0) + 1 } as any).returning()
        unit = u as any
    }
    await db.execute(sql`UPDATE t_units SET block_title = ${UNIT} WHERE id = ${unit!.id}`)

    for (let i = 0; i < LESSONS.length; i++) {
        const L = LESSONS[i]
        const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, L.title)) })
        if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
        const [lesson] = await db.insert(t_lessons).values({ title: L.title, t_unitId: unit!.id, order: i + 1, badge: L.badge } as any).returning({ id: t_lessons.id })
        await db.execute(sql`UPDATE t_lessons SET ai_hint = ${L.hint}, ege_part = 1 WHERE id = ${lesson.id}`)
        await db.insert(t_challenges).values({
            t_lessonId: lesson.id, type: 'SCENEWALK' as any, question: L.title, order: 1, points: 10,
            author: 'ЕГЭ Математика', numRans: '1', difficulty: '', imageSrc: '',
        })
        console.log(`«${L.title}» id=${lesson.id}`)
    }

    // Связь с заданиями ЕГЭ №10, №11, №13
    for (const num of [10, 11, 13]) {
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT t.id, 't_unit', ${unit!.id} FROM ege_tasks t
            WHERE t.subject = 'math_profile' AND t.num = ${num}
              AND NOT EXISTS (SELECT 1 FROM ege_task_links l WHERE l.task_id = t.id AND l.kind = 't_unit' AND l.ref_id = ${unit!.id})`)
    }
    console.log(`unit id=${unit!.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
