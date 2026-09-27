// scripts/seedLenzWalkLesson.ts
//
// Тип LENZWALK — «Индукционный ток и правило Ленца» (см. type-lenzwalk.tsx).
// Урок вставляется в тему «Электродинамика» (t_unit id=8) сразу ПОСЛЕ урока
// FARADAYWALK («Закон Фарадея: двигай магнит»), следующие сдвигаются на +1.
// Идемпотентно: перезапуск удаляет ранее созданный урок и пересобирает порядок.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 8
const TITLE = "Индукционный ток и правило Ленца"
const AFTER_TITLE = "Закон Фарадея: двигай магнит"

async function main() {
    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        // закрываем дыру в порядке
        const rest = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID) })
        for (const l of rest.filter((x) => x.order > existing.order)) {
            await db.update(t_lessons).set({ order: l.order - 1 }).where(eq(t_lessons.id, l.id))
        }
        console.log(`Старый урок (id=${existing.id}) удалён`)
    }
    const after = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, AFTER_TITLE)),
    })
    if (!after) throw new Error(`Не найден урок «${AFTER_TITLE}»`)
    const insertOrder = after.order + 1
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID) })
    for (const l of all.filter((x) => x.order >= insertOrder)) {
        await db.update(t_lessons).set({ order: l.order + 1 }).where(eq(t_lessons.id, l.id))
    }
    const [lesson] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: insertOrder }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'LENZWALK' as any, question: TITLE, order: 1,
        points: 10, author: "ЕГЭ Физика", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log(`Урок создан: id=${lesson.id}, order=${insertOrder}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
