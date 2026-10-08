// scripts/seedTtpWarmupLesson.ts
//
// Урок «ТТП: разминка» — ПЕРВЫЙ в юните «Теорема о Трёх Перпендикулярах (ТТП)»:
// мини-упражнения (наклонная/перпендикуляр/проекция/прямая) + 5 примеров из жизни +
// проверка. Тип TTPWALK, режим включается текстом вопроса «ТТП разминка…»
// (см. type-ttpwalk.tsx). Остальные уроки юнита сдвигаются ниже. Идемпотентно.

import db from "@/db/drizzle"
import { and, eq, ne } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE_ID = 5
const UNIT_TITLE = "Теорема о Трёх Перпендикулярах (ТТП)"
const LESSON_TITLE = "ТТП: разминка"

async function main() {
    const unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE_ID), eq(u.title, UNIT_TITLE)) })
    if (!unit) throw new Error('Нет юнита ТТП')
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, LESSON_TITLE)) })
    if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
    // остальные уроки юнита — по порядку, начиная со 2
    const rest = await db.select({ id: t_lessons.id }).from(t_lessons).where(and(eq(t_lessons.t_unitId, unit.id), ne(t_lessons.title, LESSON_TITLE))).orderBy(t_lessons.order, t_lessons.id)
    for (let i = 0; i < rest.length; i++) await db.update(t_lessons).set({ order: i + 2 }).where(eq(t_lessons.id, rest[i].id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: 1 }).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'TTPWALK' as any, question: 'ТТП разминка: наклонная, перпендикуляр, проекция', order: 1, points: 10,
        author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log("Урок", lesson.id, "; дальше:", rest.map((r) => r.id).join(', '))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
