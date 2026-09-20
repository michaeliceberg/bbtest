// scripts/seedLogFlipWalkLesson.ts
//
// Новый тип LOGFLIPWALK ("перевёртыш" — log_a(b) = 1/log_b(a), см.
// type-logflipwalk.tsx) — по прямой просьбе пользователя, тот же приём,
// что и seedLogComboWalkLesson.ts: восьмой урок темы "Логарифмы"
// (t_unit id=16, t_course "Математика-11" id=5), СРАЗУ после LOGDEFWALK
// (order=1), LOGWALK (order=2), LOGSUBWALK (order=3), LOGPOWWALK
// (order=4), LOGSWAPWALK (order=5), LOGDIVWALK (order=6) и LOGCOMBOWALK
// (order=7) — остальные уроки темы (order 7+) сдвигаются на +1.
//
// LOGFLIPWALK — полностью самодостаточный тип (весь контент фиксирован
// внутри type-logflipwalk.tsx), единственная задача этого скрипта —
// создать сам урок с одним challenge этого типа и переставить порядок
// остальных. Идемпотентно — перезапуск сначала убирает уже созданный
// ранее урок с этим названием, пересчитывает порядок оставшихся с 8 (по
// их ТЕКУЩЕМУ относительному порядку среди уроков, идущих ПОСЛЕ
// LOGDEFWALK/LOGWALK/LOGSUBWALK/LOGPOWWALK/LOGSWAPWALK/LOGDIVWALK/
// LOGCOMBOWALK), и вставляет новый на order=8 — безопасно перезапускать
// сколько угодно раз.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const LOG_UNIT_ID = 16
const LESSON_TITLE = "Перевёртыш"
// Уроки с этими названиями всегда идут первыми (order 1-7) — новый урок
// вставляется СРАЗУ после них, всё остальное сдвигается.
const FIXED_LEADING_TITLES = [
    "Что такое логарифм?",
    "Как складывать логарифмы?",
    "Как вычитать логарифмы?",
    "Степень в основании и аргументе",
    "Логарифм в степени",
    "Деление логарифмов",
    "К-к-комбо логарифмов",
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
        await db.update(t_lessons).set({ order: i + 8 }).where(eq(t_lessons.id, following[i].id))
    }
    console.log(`Порядок ${following.length} уроков темы (после 7 фиксированных) сдвинут на +1`)

    const [lesson] = await db.insert(t_lessons).values({
        title: LESSON_TITLE,
        t_unitId: LOG_UNIT_ID,
        order: 8,
    }).returning({ id: t_lessons.id })

    await db.insert(t_challenges).values({
        t_lessonId: lesson.id,
        type: 'LOGFLIPWALK' as any,
        question: LESSON_TITLE,
        order: 1,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
    })

    console.log(`Урок "${LESSON_TITLE}" создан: id=${lesson.id}, order=8`)
    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
