// scripts/seedLogWalkLesson.ts
//
// Новый тип LOGWALK (интерактивный разбор "как складывать логарифмы", см.
// type-logwalk.tsx) — по прямой просьбе пользователя, тот же принцип, что
// уже применён для SINWALK в теме "Геометрия: sin, cos, tg": НОВЫЙ первый
// урок темы "Логарифмы" (t_unit id=16, t_course "Математика-11" id=5),
// остальные существующие уроки сдвигаются на +1 по порядку.
//
// LOGWALK — полностью самодостаточный тип (вся хореография и тренировочные
// задания генерируются на лету внутри type-logwalk.tsx) — единственная
// задача этого скрипта — создать САМ урок с одним challenge этого типа
// (question — текст в облаке маскота) и переставить порядок остальных
// уроков темы. Идемпотентно: перезапуск сначала убирает уже созданный
// ранее LOGWALK-урок (по точному совпадению названия), пересчитывает
// порядок оставшихся с 2 (по их ТЕКУЩЕМУ относительному порядку — не
// зависит от того, сколько раз скрипт уже запускался), и вставляет новый
// урок на order=1 — безопасно перезапускать сколько угодно раз.

import db from "@/db/drizzle"
import { eq, asc } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const LOG_UNIT_ID = 16
const LESSON_TITLE = "Как складывать логарифмы?"

async function main() {
    // Убираем уже созданный ранее LOGWALK-урок (если скрипт перезапускают)
    // — cascade сам удалит его единственный challenge.
    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, LOG_UNIT_ID), eq(l.title, LESSON_TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок "${LESSON_TITLE}" (id=${existing.id}) удалён — пересоздаём`)
    }

    // Пересчитываем порядок оставшихся уроков темы с 2 (по их текущему
    // относительному порядку) — фиксирует возможный разрыв после удаления
    // выше и делает повторные прогоны безопасными.
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
        type: 'LOGWALK' as any,
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
