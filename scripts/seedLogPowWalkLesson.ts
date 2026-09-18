// scripts/seedLogPowWalkLesson.ts
//
// Новый тип LOGPOWWALK ("степень в основании и аргументе", см.
// type-logpowwalk.tsx) — по прямой просьбе пользователя, тот же приём,
// что и seedLogSubWalkLesson.ts: четвёртый урок темы "Логарифмы" (t_unit
// id=16, t_course "Математика-11" id=5), СРАЗУ после LOGDEFWALK (order=1),
// LOGWALK (order=2) и LOGSUBWALK (order=3) — остальные уроки темы (order
// 4+) сдвигаются на +1.
//
// LOGPOWWALK — полностью самодостаточный тип (весь контент фиксирован
// внутри type-logpowwalk.tsx), единственная задача этого скрипта —
// создать сам урок с одним challenge этого типа и переставить порядок
// остальных. Идемпотентно — перезапуск сначала убирает уже созданный
// ранее урок с этим названием, пересчитывает порядок оставшихся с 4 (по
// их ТЕКУЩЕМУ относительному порядку среди уроков, идущих ПОСЛЕ
// LOGDEFWALK/LOGWALK/LOGSUBWALK), и вставляет новый на order=4 — безопасно
// перезапускать сколько угодно раз.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const LOG_UNIT_ID = 16
const LESSON_TITLE = "Степень в основании и аргументе"
// Уроки с этими названиями всегда идут первыми (order 1-3) — новый урок
// вставляется СРАЗУ после них, всё остальное сдвигается.
const FIXED_LEADING_TITLES = ["Что такое логарифм?", "Как складывать логарифмы?", "Как вычитать логарифмы?"]

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
    const following = rest.filter((l) => !FIXED_LEADING_TITLES.includes(l.title))
    for (let i = 0; i < following.length; i++) {
        await db.update(t_lessons).set({ order: i + 4 }).where(eq(t_lessons.id, following[i].id))
    }
    console.log(`Порядок ${following.length} уроков темы (после LOGDEFWALK/LOGWALK/LOGSUBWALK) сдвинут на +1`)

    const [lesson] = await db.insert(t_lessons).values({
        title: LESSON_TITLE,
        t_unitId: LOG_UNIT_ID,
        order: 4,
    }).returning({ id: t_lessons.id })

    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'LOGPOWWALK' as any,
        question: LESSON_TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })

    console.log(`Урок "${LESSON_TITLE}" создан: id=${lesson.id}, order=4`)
    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
