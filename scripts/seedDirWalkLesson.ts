// scripts/seedDirWalkLesson.ts
//
// Тип DIRWALK — интерактивный разбор "направление магнитного поля" вокруг
// прямого провода и кольца с током (правило буравчика/крышечки от колы,
// см. type-dirwalk.tsx). Урок вставляется в тему "Электродинамика"
// (t_unit id=8, "Физика-11") на order=5 — ПЕРЕД "Термины: сила Ампера и
// Лоренца" (формулы силы Ампера/Лоренца используют направление B, значит
// само направление поля логично объяснить раньше), уроки с order>=5
// сдвигаются на +1. Идемпотентно: перезапуск удаляет ранее созданный
// урок и пересобирает порядок.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 8
const TITLE = "Направление магнитного поля"
const INSERT_ORDER = 5

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
        t_lessonId: lesson.id, type: 'DIRWALK' as any, question: TITLE, order: 1,
        points: 10, author: "ЕГЭ Физика", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log(`Урок создан: id=${lesson.id}, order=${INSERT_ORDER}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
