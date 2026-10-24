// scripts/seedLineWalkUnit.ts
//
// Идемпотентный сид: t_course 5 «ЕГЭ Математика» → новый блок «Графики», юнит «Прямая» (в конец курса),
// в нём первый урок «y = kx + b» (LINEWALK, см. type-linewalk.tsx): наклон вверх/вниз, b — пересечение с осью Y,
// k по клеточкам «вверх / вправо», составить уравнение прямой. Заодно: значение LINEWALK в enum "type",
// описание для ИИ-помощника (ai_hint) и связи темы с заданиями ЕГЭ №12 (графики) и №9 (производная = k касательной).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = Number(process.env.T_COURSE ?? 5)
const BLOCK = "Графики"
const UNIT_TITLE = "Прямая"
const LESSON_TITLE = "y = kx + b"
const EGE_TASKS = [12, 9]
const AI_HINT = 'линейная функция y = kx + b: прямая идёт вверх (k > 0) или вниз (k < 0), b — точка пересечения с осью Oy, наклон k = сколько клеток вверх / сколько вправо (k = 5/1, 3/2, −4/1), составить уравнение прямой по графику на клетках'

async function main() {
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'LINEWALK'`))

    let unit = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)),
    })
    if (!unit) {
        const units = await db.query.t_units.findMany({ where: (u, { eq }) => eq(u.t_courseId, T_COURSE), orderBy: (u, { asc }) => asc(u.order) })
        const order = units.length ? units[units.length - 1].order + 1 : 1
        const [created] = await db.insert(t_units).values({
            title: UNIT_TITLE, description: UNIT_TITLE, imageSrc: '', t_courseId: T_COURSE, order, blockTitle: BLOCK,
        } as any).returning()
        unit = created
        console.log(`Юнит «${UNIT_TITLE}» создан id=${created.id}, order=${order}`)
    }

    const existing = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, LESSON_TITLE)) })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок (id=${existing.id}) удалён`)
    }
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, unit!.id), orderBy: (l, { asc }) => asc(l.order) })
    for (let i = 0; i < all.length; i++) await db.update(t_lessons).set({ order: i + 2 }).where(eq(t_lessons.id, all[i].id))
    const [lesson] = await db.insert(t_lessons)
        .values({ title: LESSON_TITLE, t_unitId: unit!.id, order: 1, badge: "kx + b" } as any)
        .returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'LINEWALK' as any, question: LESSON_TITLE, order: 1, points: 10,
        author: "ЕГЭ Математика", numRans: '1', difficulty: '', imageSrc: '',
    })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${AI_HINT} WHERE id = ${lesson.id}`)

    for (const num of EGE_TASKS) {
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT t.id, 't_unit', ${unit!.id} FROM ege_tasks t
            WHERE t.subject = 'math_profile' AND t.num = ${num}
              AND NOT EXISTS (SELECT 1 FROM ege_task_links l WHERE l.task_id = t.id AND l.kind = 't_unit' AND l.ref_id = ${unit!.id})`)
    }
    console.log(`Юнит ${unit!.id}: урок «${LESSON_TITLE}» создан id=${lesson.id}, связан с №${EGE_TASKS.join(', №')}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
