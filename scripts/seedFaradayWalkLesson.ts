// scripts/seedFaradayWalkLesson.ts
//
// Тип FARADAYWALK — интерактивная песочница "магнит + кольцо" (закон
// Фарадея, см. type-faradaywalk.tsx). Урок вставляется в тему
// "Электродинамика" (t_unit id=8, "Физика-11") на order=6 — прямо перед
// "Термины: ЭДС индукции, ..." (уроки с order>=6 сдвигаются на +1).
// Идемпотентно: перезапуск удаляет ранее созданный урок и пересобирает порядок.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 8
const TITLE = "Закон Фарадея: двигай магнит"
const INSERT_ORDER = 6

async function main() {
    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок (id=${existing.id}) удалён`)
    }
    const all = await db.query.t_lessons.findMany({
        where: (l, { eq }) => eq(l.t_unitId, UNIT_ID),
        orderBy: (l, { asc }) => asc(l.order),
    })
    for (const l of all.filter((x) => x.order >= INSERT_ORDER)) {
        await db.update(t_lessons).set({ order: l.order + 1 }).where(eq(t_lessons.id, l.id))
    }
    const [lesson] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: INSERT_ORDER }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'FARADAYWALK' as any, question: TITLE, order: 1,
        points: 10, author: "ЕГЭ Физика", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log(`Урок создан: id=${lesson.id}, order=${INSERT_ORDER}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
