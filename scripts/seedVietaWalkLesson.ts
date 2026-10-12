// scripts/seedVietaWalkLesson.ts
//
// Идемпотентный сид урока «Как работает теорема Виета» (VIETAWALK, см.
// type-vietawalk.tsx) — ПЕРВЫМ уроком юнита «Теорема Виета» (t_course 5).
// Остальные уроки юнита сдвигаются на +1. Заодно добавляет значение VIETAWALK
// в enum "type" (прямым SQL, как и все схемные правки проекта).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const TITLE = "Как работает теорема Виета"

async function main() {
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'VIETAWALK'`))

    const unit = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, 5), eq(u.title, "Теорема Виета")),
    })
    if (!unit) throw new Error("Юнит «Теорема Виета» не найден")

    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок (id=${existing.id}) удалён`)
    }

    const all = await db.query.t_lessons.findMany({
        where: (l, { eq }) => eq(l.t_unitId, unit.id),
        orderBy: (l, { asc }) => asc(l.order),
    })
    // Сначала сдвигаем остальных, чтобы порядок был 2, 3, 4…
    for (let i = 0; i < all.length; i++) {
        await db.update(t_lessons).set({ order: i + 2 }).where(eq(t_lessons.id, all[i].id))
    }

    const [lesson] = await db
        .insert(t_lessons)
        .values({ title: TITLE, t_unitId: unit.id, order: 1, badge: "x₁·x₂ = c\nx₁+x₂ = −b" } as any)
        .returning({ id: t_lessons.id })

    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'VIETAWALK' as any,
        question: TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })

    console.log(`Юнит ${unit.id}: урок создан id=${lesson.id}, order=1`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
