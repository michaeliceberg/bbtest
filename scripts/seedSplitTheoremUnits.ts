// scripts/seedSplitTheoremUnits.ts
//
// Идемпотентно: уроки «Теорема Менелая» и «Логарифмические неравенства» выносятся в отдельные юниты (тот же блок),
// чтобы их было видно в навигации по юнитам на /trainer. Прогресс уроков не трогается (меняется только t_unit_id).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons } from "@/db/schema"

const T_COURSE = 5
const MOVES = [
    { lesson: 'Теорема Менелая', unit: 'Теорема Менелая', block: 'Планиметрия', after: 'Треугольник' },
    { lesson: 'Логарифмические неравенства', unit: 'Логарифмические неравенства', block: 'Логарифмы', after: '8 свойств логарифмов' },
]

async function main() {
    for (const m of MOVES) {
        let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, m.unit)) })
        if (!unit) {
            const units = await db.query.t_units.findMany({ where: (u, { eq }) => eq(u.t_courseId, T_COURSE), orderBy: (u, { asc }) => asc(u.order) })
            const after = units.find((u) => u.title === m.after)
            const order = after ? after.order + 1 : units[units.length - 1].order + 1
            for (const u of units.filter((x) => x.order >= order).sort((a, b) => b.order - a.order)) {
                await db.update(t_units).set({ order: u.order + 1 }).where(eq(t_units.id, u.id))
            }
            const [created] = await db.insert(t_units).values({ title: m.unit, description: m.unit, imageSrc: '', t_courseId: T_COURSE, order, blockTitle: m.block } as any).returning()
            unit = created
            console.log(`Юнит «${m.unit}» создан id=${created.id}, order=${order}`)
        }
        const lessons = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.title, m.lesson) })
        for (const l of lessons) {
            if (l.t_unitId === unit!.id) continue
            const src = await db.query.t_units.findFirst({ where: (u, { eq }) => eq(u.id, l.t_unitId) })
            if (src?.t_courseId !== T_COURSE) continue
            await db.update(t_lessons).set({ t_unitId: unit!.id, order: 1 }).where(eq(t_lessons.id, l.id))
            const rest = await db.query.t_lessons.findMany({ where: (x, { eq }) => eq(x.t_unitId, l.t_unitId), orderBy: (x, { asc }) => asc(x.order) })
            for (let i = 0; i < rest.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, rest[i].id))
            console.log(`Урок «${m.lesson}» (id=${l.id}) перенесён в юнит ${unit!.id}`)
        }
    }
}


// Связь новых юнитов с заданиями ЕГЭ (для «Мой путь»): Менелай → №18, неравенства → №16.
export async function linkEge() {
    for (const [unit, num] of [['Теорема Менелая', 18], ['Логарифмические неравенства', 16]] as const) {
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT t.id, 't_unit', u.id FROM ege_tasks t, t_units u
            WHERE t.subject = 'math_profile' AND t.num = ${num} AND u.title = ${unit} AND u.t_course_id = ${T_COURSE}
              AND NOT EXISTS (SELECT 1 FROM ege_task_links l WHERE l.task_id = t.id AND l.kind = 't_unit' AND l.ref_id = u.id)`)
    }
    const r = await db.execute(sql`SELECT t.num, l.ref_id FROM ege_task_links l JOIN ege_tasks t ON t.id = l.task_id WHERE l.kind = 't_unit' AND l.ref_id IN (44, 45)`)
    console.log('ege links:', JSON.stringify(r))
}
main().then(linkEge).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
