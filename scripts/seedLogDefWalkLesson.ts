// scripts/seedLogDefWalkLesson.ts
//
// Новый тип LOGDEFWALK ("что такое логарифм", см. type-logdefwalk.tsx) —
// по прямой просьбе пользователя, тот же принцип, что и у LOGWALK
// (см. seedLogWalkLesson.ts): НОВЫЙ первый урок темы "Логарифмы" (t_unit
// id=16, t_course "Математика-11" id=5), остальные уроки темы —
// включая уже существующий LOGWALK "Как складывать логарифмы?" —
// сдвигаются на +1 по порядку.
//
// LOGDEFWALK — полностью самодостаточный тип (весь контент фиксирован
// внутри type-logdefwalk.tsx), единственная задача этого скрипта —
// создать сам урок с одним challenge этого типа и переставить порядок
// остальных. Идемпотентно (тот же приём, что и в seedLogWalkLesson.ts):
// перезапуск сначала убирает уже созданный ранее урок с этим названием,
// пересчитывает порядок оставшихся с 2 (по их ТЕКУЩЕМУ относительному
// порядку), и вставляет новый на order=1 — безопасно перезапускать
// сколько угодно раз.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const LOG_UNIT_ID = 16
const LESSON_TITLE = "Что такое логарифм?"

async function main() {
    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, LOG_UNIT_ID), eq(l.title, LESSON_TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок "${LESSON_TITLE}" (id=${existing.id}) удалён — пересоздаём`)
    }

    const rest = await db.query.t_lessons.findMany({
        where: (l, { eq }) => eq(l.t_unitId, LOG_UNIT_ID),
        orderBy: (l, { asc }) => asc(l.order),
    })
    for (let i = 0; i < rest.length; i++) {
        await db.update(t_lessons).set({ order: i + 2 }).where(eq(t_lessons.id, rest[i].id))
    }
    console.log(`Порядок ${rest.length} существующих уроков темы сдвинут на +1`)

    const [lesson] = await db.insert(t_lessons).values({
        title: LESSON_TITLE,
        t_unitId: LOG_UNIT_ID,
        order: 1,
    }).returning({ id: t_lessons.id })

    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'LOGDEFWALK' as any,
        question: LESSON_TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })

    console.log(`Урок "${LESSON_TITLE}" создан: id=${lesson.id}, order=1`)
    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
