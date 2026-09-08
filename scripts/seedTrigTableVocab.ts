// scripts/seedTrigTableVocab.ts
//
// По прямой просьбе пользователя — юнит "Таблица значений" (t_unit id=18,
// t_course "Математика-11") не должен ограничиваться только TRIGTABLE
// (заполнение пропусков в самой таблице) — нужно "разнообразить задание
// прежними типами" (ASSIST/CONNECT/INSERT/SWIPE/SCROLL). TRIGTABLE — тип
// со своим фиксированным флоу, в общий ACStype/isMAscLike-пул не входит
// (см. CLAUDE.md) — поэтому вариативность добавляется НЕ переделкой самого
// TRIGTABLE, а ОТДЕЛЬНЫМ набором задач типа M_ASC "вспомни значение"
// (`$\sin 30°=?$` → `$\dfrac{1}{2}$` и т.п.), которые уже штатно
// рендерятся случайным стилем из WEIGHTED_ASC_POOL (page.tsx) — тот же
// приём, что и словарный слой формул физики (см. `seedDynamicsVocabPilot.ts`
// и наследники).
//
// Идемпотентно — если урок с этим названием в юните уже существует,
// удаляет и пересоздаёт (тот же принцип, что и в seedTrigTableTrainer.ts).

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema"

const TRIGTABLE_UNIT_ID = 18 // "Таблица значений", см. seedTrigTableTrainer.ts
const LESSON_TITLE = "Значения — тренировка"
const AUTHOR = "ЕГЭ Математика Профиль"

// Те же 9 ячеек 3×3, что и в самой TRIGTABLE-сетке (sin/cos/tg × 30°/45°/60°),
// см. GRID в seedTrigTableTrainer.ts — держим значения синхронно вручную,
// а не через общий модуль: это разные типы контента (одна задача = один
// пропуск таблицы vs один вопрос-факт), общая структура не оправдана.
const CELLS: { question: string; answer: string }[] = [
    { question: "$\\sin 30^\\circ = ?$", answer: "$\\dfrac{1}{2}$" },
    { question: "$\\sin 45^\\circ = ?$", answer: "$\\dfrac{\\sqrt{2}}{2}$" },
    { question: "$\\sin 60^\\circ = ?$", answer: "$\\dfrac{\\sqrt{3}}{2}$" },
    { question: "$\\cos 30^\\circ = ?$", answer: "$\\dfrac{\\sqrt{3}}{2}$" },
    { question: "$\\cos 45^\\circ = ?$", answer: "$\\dfrac{\\sqrt{2}}{2}$" },
    { question: "$\\cos 60^\\circ = ?$", answer: "$\\dfrac{1}{2}$" },
    { question: "$tg\\ 30^\\circ = ?$", answer: "$\\dfrac{\\sqrt{3}}{3}$" },
    { question: "$tg\\ 45^\\circ = ?$", answer: "$1$" },
    { question: "$tg\\ 60^\\circ = ?$", answer: "$\\sqrt{3}$" },
]

async function main() {
    const existing = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, TRIGTABLE_UNIT_ID), eq(l.title, LESSON_TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок "${LESSON_TITLE}" (id=${existing.id}) удалён — пересоздаём`)
    }

    const [lesson] = await db.insert(t_lessons).values({
        title: LESSON_TITLE,
        t_unitId: TRIGTABLE_UNIT_ID,
        order: 5,
    }).returning({ id: t_lessons.id })

    for (let i = 0; i < CELLS.length; i++) {
        const cell = CELLS[i]
        const [ch] = await db.insert(t_challenges).values({
            t_lessonId: lesson.id,
            type: 'M_ASC' as any,
            question: cell.question,
            order: i + 1,
            points: 10,
            author: AUTHOR,
            numRans: '1',
            difficulty: '1',
            imageSrc: '0',
        }).returning({ id: t_challenges.id })

        await db.insert(t_challengeOptions).values({
            t_challengeId: ch.id,
            text: cell.answer,
            correct: true,
        })
    }

    console.log(`Урок "${LESSON_TITLE}" создан: id=${lesson.id}, задач=${CELLS.length}`)
    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
