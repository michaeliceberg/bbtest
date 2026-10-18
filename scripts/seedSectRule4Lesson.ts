// scripts/seedSectRule4Lesson.ts
//
// Идемпотентный сид: юнит «Сечение» (блок «Стереометрия», t_course 5) → второй урок «Кубик: 4 правило» (SECTWALK).
// Режим урока выбирается по тексту задания («4 правило»), см. type-sectwalk.tsx (R4_SCENES).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT_TITLE = "Сечение"
const LESSON_TITLE = "Кубик: 4 правило"
const AI_HINT = 'сечение куба методом проекций (правило 4): никакие две точки не на одной грани, линий нет — берём две точки не на полу, проводим через них вспомогательную прямую, опускаем точки на пол, соединяем проекции, продлеваем прямую и её проекцию до пересечения X на плоскости основания; X и точка на основании дают след сечения, дальше достраиваем шестиугольник'

async function main() {
    const unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)) })
    if (!unit) throw new Error('Нет юнита «Сечение» — сначала scripts/seedSectWalkUnit.ts')
    const existing = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, LESSON_TITLE)) })
    if (existing) { await db.delete(t_lessons).where(eq(t_lessons.id, existing.id)); console.log(`Старый урок ${existing.id} удалён`) }
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, unit.id), orderBy: (l, { asc }) => asc(l.order) })
    // «Кубик» остаётся первым, новый — вторым, остальные (если есть) сдвигаются
    const first = all.find((l) => l.title === 'Кубик')
    const rest = all.filter((l) => l !== first)
    if (first) await db.update(t_lessons).set({ order: 1 }).where(eq(t_lessons.id, first.id))
    for (let i = 0; i < rest.length; i++) await db.update(t_lessons).set({ order: i + 3 }).where(eq(t_lessons.id, rest[i].id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: 2, badge: "проекция" } as any).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({ t_lessonId: lesson.id, type: 'SECTWALK' as any, question: LESSON_TITLE, order: 1, points: 10, author: "ЕГЭ Математика", numRans: '1', difficulty: '', imageSrc: '' })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${AI_HINT} WHERE id = ${lesson.id}`)
    console.log(`Юнит ${unit.id}: урок «${LESSON_TITLE}» создан id=${lesson.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
