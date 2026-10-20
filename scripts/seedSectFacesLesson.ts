// scripts/seedSectFacesLesson.ts
//
// Идемпотентный сид: юнит «Сечение» (блок «Стереометрия», t_course 5) → третий урок «Точки на гранях» (SECTWALK).
// Режим урока выбирается по тексту задания («Точки на гранях»), см. type-sectwalk.tsx (FACES_SCENES).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT_TITLE = "Сечение"
const LESSON_TITLE = "Точки на гранях"
const AI_HINT = 'сечение куба, когда точки лежат не на рёбрах, а на гранях (точка на невидимой грани пишется в круглых скобках); одна точка на верхней грани — проецируем две другие на верхнюю грань, прямая через них и её проекция пересекаются в X на плоскости верхней грани, X и точка на верхней грани дают след сечения, дальше достраиваем'

async function main() {
    const unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT_TITLE)) })
    if (!unit) throw new Error('Нет юнита «Сечение»')
    const existing = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, LESSON_TITLE)) })
    if (existing) { await db.delete(t_lessons).where(eq(t_lessons.id, existing.id)); console.log(`Старый урок ${existing.id} удалён`) }
    const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, unit.id), orderBy: (l, { asc }) => asc(l.order) })
    // порядок: «Кубик: 3 правила» → «Кубик: 4 правило» → «Точки на гранях» → остальные
    const lead = ['Кубик: 3 правила', 'Кубик: 4 правило'].map((t) => all.find((l) => l.title === t)).filter(Boolean) as typeof all
    const rest = all.filter((l) => !lead.includes(l))
    for (let i = 0; i < lead.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, lead[i].id))
    for (let i = 0; i < rest.length; i++) await db.update(t_lessons).set({ order: lead.length + 2 + i }).where(eq(t_lessons.id, rest[i].id))
    const [lesson] = await db.insert(t_lessons).values({ title: LESSON_TITLE, t_unitId: unit.id, order: lead.length + 1, badge: "грани" } as any).returning({ id: t_lessons.id })
    await db.insert(t_challenges).values({ t_lessonId: lesson.id, type: 'SECTWALK' as any, question: LESSON_TITLE, order: 1, points: 10, author: "ЕГЭ Математика", numRans: '1', difficulty: '', imageSrc: '' })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${AI_HINT} WHERE id = ${lesson.id}`)
    console.log(`Юнит ${unit.id}: урок «${LESSON_TITLE}» создан id=${lesson.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
