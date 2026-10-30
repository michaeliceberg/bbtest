// scripts/seedDerivativeUnit.ts
//
// Идемпотентно: блок «Производная» → юнит «Производная» (t_course 5 «ЕГЭ Математика», в конец списка)
// с уроками SCENEWALK (контент — lib/scene-lessons/derivative.tsx), ai_hint, связь с заданием ЕГЭ №9.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT = 'Производная'
const LESSONS = [
    { title: 'Как считать производную', badge: '№9 ЕГЭ',
        hint: 'формальное вычисление производной многочлена (ЕГЭ №9): (c·tⁿ)′ = n·c·tⁿ⁻¹ — степень спускается вниз и умножается на коэффициент, сама степень уменьшается на 1; (t⁴)′ = 4t³, (4t⁶)′ = 24t⁵, (5t²)′ = 10t, (kt)′ = k, производная числа = 0; производная суммы — по каждому слагаемому' },
]

async function main() {
    let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT)) })
    if (!unit) {
        const last = await db.execute(sql`SELECT COALESCE(MAX("order"), 0)::int AS m FROM t_units WHERE t_course_id = ${T_COURSE}`) as unknown as { m: number }[]
        const [u] = await db.insert(t_units).values({ title: UNIT, description: 'Производная для ЕГЭ', imageSrc: '/unit-pics/derivative.svg', t_courseId: T_COURSE, order: (last[0]?.m ?? 0) + 1 } as any).returning()
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

    // Связь с заданием ЕГЭ №9
    for (const num of [9]) {
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT t.id, 't_unit', ${unit!.id} FROM ege_tasks t
            WHERE t.subject = 'math_profile' AND t.num = ${num}
              AND NOT EXISTS (SELECT 1 FROM ege_task_links l WHERE l.task_id = t.id AND l.kind = 't_unit' AND l.ref_id = ${unit!.id})`)
    }
    console.log(`unit id=${unit!.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
