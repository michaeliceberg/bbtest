// scripts/seedTtpQuickLesson.ts
//
// Второй урок юнита «Теорема о Трёх Перпендикулярах (ТТП)» — короткая версия без
// метафор («ТТП: коротко»). Тот же тип TTPWALK; короткий режим включается по тексту
// вопроса (начинается с «ТТП коротко», см. type-ttpwalk.tsx). Идемпотентно.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE_ID = 5
const UNIT_TITLE = "Теорема о Трёх Перпендикулярах (ТТП)"
const LESSON_TITLE = "ТТП: коротко"

async function main() {
    const unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE_ID), eq(u.title, UNIT_TITLE)) })
    if (!unit) throw new Error('Нет юнита ТТП')
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, LESSON_TITLE)) })
    if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: 2 }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'TTPWALK' as any, question: 'ТТП коротко: теорема о трёх перпендикулярах', order: 1, points: 10,
        author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log("Урок", lesson.id)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
