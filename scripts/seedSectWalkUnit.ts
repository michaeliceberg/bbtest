// scripts/seedSectWalkUnit.ts
//
// Идемпотентный сид: блок «Стереометрия» (t_course 5 «ЕГЭ Математика») → новый юнит «Сечение» В КОНЕЦ блока,
// в нём первый урок «Кубик» (SECTWALK, см. type-sectwalk.tsx). Заодно: значение SECTWALK в enum "type",
// описание для ИИ-помощника (ai_hint) и связь темы с заданием ЕГЭ №15 («Мой путь», ege_task_links).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const BLOCK = "Стереометрия"
const UNIT_TITLE = "Сечение"
const LESSON_TITLE = "Кубик"
const EGE_TASKS = [15]
const AI_HINT = 'сечение куба: куб как комната (потолок, пол, стены); шпаргалка 4 правила — соединить точки в одной плоскости, параллельный перенос на параллельную грань, продлить линию до пересечения с прямой ребра (точка вне куба лежит в двух плоскостях), проекция; идём по правилам сверху вниз'

async function main() {
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'SECTWALK'`))
    let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)) })
    if (!unit) {
        const units = await db.query.t_units.findMany({ where: (u, { eq }) => eq(u.t_courseId, T_COURSE), orderBy: (u, { asc }) => asc(u.order) })
        const inBlock = units.filter((u) => (u as { blockTitle?: string | null }).blockTitle === BLOCK)
        const order = inBlock.length ? inBlock[inBlock.length - 1].order + 1 : units.length ? units[units.length - 1].order + 1 : 1
        for (const u of units.filter((x) => x.order >= order).sort((a, b) => b.order - a.order)) {
            await db.update(t_units).set({ order: u.order + 1 }).where(eq(t_units.id, u.id))
        }
        const [created] = await db.insert(t_units).values({ title: UNIT_TITLE, description: UNIT_TITLE, imageSrc: '', t_courseId: T_COURSE, order, blockTitle: BLOCK } as any).returning()
        unit = created
        console.log(`Юнит «${UNIT_TITLE}» создан id=${created.id}, order=${order}`)
    }
    const existing = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, LESSON_TITLE)) })
    if (existing) { await db.delete(t_lessons).where(eq(t_lessons.id, existing.id)); console.log(`Старый урок ${existing.id} удалён`) }
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, unit!.id), orderBy: (l, { asc }) => asc(l.order) })
    for (let i = 0; i < all.length; i++) await db.update(t_lessons).set({ order: i + 2 }).where(eq(t_lessons.id, all[i].id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit!.id, order: 1, badge: "правила сечения" } as any).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({ t_lessonId: lesson.id, type: 'SECTWALK' as any, question: LESSON_TITLE, order: 1, points: 10, author: "ЕГЭ Математика", numRans: '1', difficulty: '', imageSrc: '' })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${AI_HINT} WHERE id = ${lesson.id}`)
    for (const num of EGE_TASKS) {
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT t.id, 't_unit', ${unit!.id} FROM ege_tasks t
            WHERE t.subject = 'math_profile' AND t.num = ${num}
              AND NOT EXISTS (SELECT 1 FROM ege_task_links l WHERE l.task_id = t.id AND l.kind = 't_unit' AND l.ref_id = ${unit!.id})`)
    }
    console.log(`Юнит ${unit!.id}: урок «${LESSON_TITLE}» создан id=${lesson.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
