// scripts/seedTrigAnsWalkLesson.ts
//
// Разбор «Как записать ответ: синус» (TRIGANSWALK, sin α = a → α = … + 2πk;
// app/t-lesson/[t_lessonId]/type-triganswalk.tsx) — первым уроком юнита
// «Как записать ответ» (t_unit id=15).
// Идемпотентно: старая копия удаляется, порядок юнита пересчитывается.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 15
const TITLE = "Как записать ответ: синус"

async function main() {
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, TITLE)) })
    if (old) {
        await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
        console.log(`Удалён старый «${TITLE}» (id=${old.id})`)
    }
    const [lesson] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: 0 }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'TRIGANSWALK', question: 'Как записать ответ: синус', order: 1, points: 10,
        author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
    })
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID), orderBy: (l, { asc }) => asc(l.order) })
    const ordered = [lesson.id, ...all.map((l) => l.id).filter((id) => id !== lesson.id)]
    for (let i = 0; i < ordered.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, ordered[i]))
    const final = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID), orderBy: (l, { asc }) => asc(l.order) })
    final.forEach((l) => console.log(l.order, l.id, l.title))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
