// scripts/seedTrigCircleWalkLesson.ts
//
// Разбор по шагам «Тригонометрическая окружность: знакомство» (TRIGCIRCWALK,
// app/t-lesson/[t_lessonId]/type-trigcirclewalk.tsx) — первым уроком юнита
// «Тригонометрическая окружность» (t_unit id=30), перед «Радианы и градусы».
// Идемпотентно: старая копия удаляется, порядок юнита пересчитывается.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 30
const TITLE = "Знакомство с окружностью"

async function main() {
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, TITLE)) })
    if (old) {
        await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
        console.log(`Удалён старый «${TITLE}» (id=${old.id})`)
    }
    const [lesson] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: 0 }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'TRIGCIRCWALK', question: 'Тригонометрическая окружность', order: 1, points: 10,
        author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
    })
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID), orderBy: (l, { asc }) => asc(l.order) })
    const ordered = [lesson.id, ...all.map((l) => l.id).filter((id) => id !== lesson.id)]
    for (let i = 0; i < ordered.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, ordered[i]))
    const final = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID), orderBy: (l, { asc }) => asc(l.order) })
    final.forEach((l) => console.log(l.order, l.id, l.title))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
