// Убирает старые обычные уроки темы "Логарифмы" (t_unit 16) и добавляет
// бесконечный босс-экзамен (задачи собираются случайно на каждый заход,
// см. isBossExamStage в lib/trainerStageFlags.ts и page.tsx). Идемпотентно.
import db from "@/db/drizzle"
import { and, eq, asc, inArray } from "drizzle-orm"
import { t_lessons } from "@/db/schema"

const UNIT_ID = 16
const TITLE = "Босс-экзамен: Логарифмы"

async function main() {
    const all = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, UNIT_ID), orderBy: asc(t_lessons.order), with: { t_challenges: true } })
    const keep = all.filter((l) => l.title === TITLE || l.t_challenges.some((c) => c.type !== 'M_ASC') || /тренировка|Контрольная: мифический/.test(l.title))
    const keepIds = new Set(keep.map((l) => l.id))
    const remove = all.filter((l) => !keepIds.has(l.id))
    if (remove.length) await db.delete(t_lessons).where(inArray(t_lessons.id, remove.map((l) => l.id)))
    console.log("Удалено старых уроков:", remove.length)
    let exam = keep.find((l) => l.title === TITLE)
    if (!exam) {
        const [row] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: 999 }).returning()
        exam = { ...row, t_challenges: [] }
    }
    const rest = keep.filter((l) => l.id !== exam!.id).sort((a, b) => a.order - b.order)
    const seq = [...rest, exam]
    for (let i = 0; i < seq.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, seq[i].id))
    console.log("Итого уроков:", seq.length)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
