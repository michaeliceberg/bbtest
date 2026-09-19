// scripts/seedLogDivWalkLesson.ts
//
// Новый тип LOGDIVWALK ("деление логарифмов" — log_a x / log_a y = log_y x,
// см. type-logdivwalk.tsx) — по прямой просьбе пользователя, тот же
// приём, что и seedLogSwapWalkLesson.ts: шестой урок темы "Логарифмы"
// (t_unit id=16, t_course "Математика-11" id=5), СРАЗУ после LOGDEFWALK
// (order=1), LOGWALK (order=2), LOGSUBWALK (order=3), LOGPOWWALK
// (order=4) и LOGSWAPWALK (order=5) — остальные уроки темы (order 6+)
// сдвигаются на +1.
//
// LOGDIVWALK — полностью самодостаточный тип (весь контент фиксирован
// внутри type-logdivwalk.tsx), единственная задача этого скрипта —
// создать сам урок с одним challenge этого типа и переставить порядок
// остальных. Идемпотентно — перезапуск сначала убирает уже созданный
// ранее урок с этим названием, пересчитывает порядок оставшихся с 6 (по
// их ТЕКУЩЕМУ относительному порядку среди уроков, идущих ПОСЛЕ
// LOGDEFWALK/LOGWALK/LOGSUBWALK/LOGPOWWALK/LOGSWAPWALK), и вставляет
// новый на order=6 — безопасно перезапускать сколько угодно раз.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const LOG_UNIT_ID = 16
const LESSON_TITLE = "Деление логарифмов"
// Уроки с этими названиями всегда идут первыми (order 1-5) — новый урок
// вставляется СРАЗУ после них, всё остальное сдвигается.
const FIXED_LEADING_TITLES = [
    "Что такое логарифм?",
    "Как складывать логарифмы?",
    "Как вычитать логарифмы?",
    "Степень в основании и аргументе",
    "Логарифм в степени",
]

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
        await db.update(t_lessons).set({ order: i + 6 }).where(eq(t_lessons.id, following[i].id))
    }
    console.log(`Порядок ${following.length} уроков темы (после LOGDEFWALK/LOGWALK/LOGSUBWALK/LOGPOWWALK/LOGSWAPWALK) сдвинут на +1`)

    const [lesson] = await db.insert(t_lessons).values({
        title: LESSON_TITLE,
        t_unitId: LOG_UNIT_ID,
        order: 6,
    }).returning({ id: t_lessons.id })

    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'LOGDIVWALK' as any,
        question: LESSON_TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })

    console.log(`Урок "${LESSON_TITLE}" создан: id=${lesson.id}, order=6`)
    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
