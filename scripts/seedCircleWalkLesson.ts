// scripts/seedCircleWalkLesson.ts
//
// Идемпотентный сид: блок «Планиметрия» (t_course 5 «ЕГЭ Математика») → новый юнит «Треугольники»
// ПЕРВЫМ в блоке, в нём первый урок «Окружности» (CIRCLEWALK, см. type-circlewalk.tsx).
// Заодно добавляет значение CIRCLEWALK в enum "type" (прямым SQL, как и все схемные правки проекта).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const BLOCK = "Планиметрия"
const UNIT_TITLE = "Окружность"
const LESSON_TITLE = "Центр и Впис углы"

async function main() {
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'CIRCLEWALK'`))

    let unit = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)),
    })
    if (!unit) {
        const units = await db.query.t_units.findMany({
            where: (u, { eq }) => eq(u.t_courseId, T_COURSE),
            orderBy: (u, { asc }) => asc(u.order),
        })
        const firstInBlock = units.find((u) => (u as { blockTitle?: string | null }).blockTitle === BLOCK)
        const order = firstInBlock ? firstInBlock.order : units.length ? units[units.length - 1].order + 1 : 1
        // Сдвигаем всех, кто стоит на месте нового юнита и дальше
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
        .values({ title: LESSON_TITLE, t_unitId: unit!.id, order: 1, badge: "360° · 180° · 90°" } as any)
        .returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'CIRCLEWALK' as any,
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
