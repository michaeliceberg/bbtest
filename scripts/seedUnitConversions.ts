// scripts/seedUnitConversions.ts
//
// Перевод единиц измерения — по прямой просьбе пользователя ("хочется
// добавить в тренажер дополнительно переводы единиц измерения!"), с
// конкретными примерами: км/ч→м/с (Кинематика), атмосферы→Па,
// градусы Цельсия→К, литры→м³, г/см³→кг/м³ (Газ и нагрев).
//
// Тот же паттерн, что и во всех предыдущих словарных слоях этой сессии
// (insertVocabChallenge-style: M_ASC-задача, ОДИН правильный ответ, без
// хранимых "неверных" вариантов — дистракторы собираются динамически из
// соседей урока в page.tsx) — новый урок в конце уже существующего юнита,
// идемпотентно (если урок с таким названием уже есть — удаляет и
// пересоздаёт, тот же принцип, что и в seedTrigTableTrainer.ts).

import db from "@/db/drizzle"
import { eq, and } from "drizzle-orm"
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema"

const AUTHOR = "Ф10 ФИЗИКА-10"
const LESSON_TITLE = "Единицы измерения — переводы"

type Item = { question: string; answer: string }

async function seedLesson(unitId: number, order: number, items: Item[]) {
    const existing = await db.query.t_lessons.findFirst({
        where: and(eq(t_lessons.t_unitId, unitId), eq(t_lessons.title, LESSON_TITLE)),
    })
    if (existing) {
        await db.delete(t_lessons).where(eq(t_lessons.id, existing.id))
        console.log(`Старый урок "${LESSON_TITLE}" (unit=${unitId}, id=${existing.id}) удалён — пересоздаём`)
    }

    const [lesson] = await db.insert(t_lessons).values({
        title: LESSON_TITLE,
        t_unitId: unitId,
        order,
    }).returning({ id: t_lessons.id })

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const [ch] = await db.insert(t_challenges).values({
            t_lessonId: lesson.id,
            type: 'M_ASC' as any,
            question: item.question,
            order: i + 1,
            points: 10,
            author: AUTHOR,
            numRans: '1',
            difficulty: '1',
            imageSrc: '0',
        }).returning({ id: t_challenges.id })

        await db.insert(t_challengeOptions).values({
            t_challengeId: ch.id,
            text: item.answer,
            correct: true,
        })
    }

    console.log(`Урок "${LESSON_TITLE}" (unit=${unitId}) создан: id=${lesson.id}, задач=${items.length}`)
    return lesson.id
}

const KINEMATICS_UNIT_ID = 5
const GAS_UNIT_ID = 6

// Единица измерения ВСЕГДА обёрнута в "$...$" (даже когда в ней нет
// ничего специфически "формульного", например голое "$К$") — не ради
// KaTeX-рендера как такового, а чтобы looksLikeFormula()/sameAnswerGenre
// в page.tsx (проверяет ровно наличие "$" в тексте ответа) относили ВСЕ
// ответы этого урока к одному жанру и брали друг друга в пул обманок.
// Без этого единственный "текстовый" (без "$") ответ среди остальных
// "формульных" получил бы ноль обманок и рендерился одной кнопкой —
// ровно тот баг, что уже не раз ловили для маленьких словарных уроков
// (см. CLAUDE.md, "1 формула на урок").
const kinematicsItems: Item[] = [
    { question: "72 км/ч — это сколько м/с?", answer: "20 $м/с$" },
    { question: "36 км/ч — это сколько м/с?", answer: "10 $м/с$" },
    { question: "108 км/ч — это сколько м/с?", answer: "30 $м/с$" },
    { question: "15 м/с — это сколько км/ч?", answer: "54 $км/ч$" },
    { question: "5 м/с — это сколько км/ч?", answer: "18 $км/ч$" },
    { question: "25 м/с — это сколько км/ч?", answer: "90 $км/ч$" },
]

const gasItems: Item[] = [
    { question: "1 атмосфера — это сколько паскалей?", answer: "$10^5$ Па" },
    { question: "$27^\\circ C$ — это сколько кельвинов?", answer: "300 $К$" },
    { question: "5 л — это сколько $м^3$?", answer: "0,005 $м^3$" },
    { question: "1 $г/см^3$ — это сколько $кг/м^3$?", answer: "1000 $кг/м^3$" },
]

async function main() {
    await seedLesson(KINEMATICS_UNIT_ID, 9, kinematicsItems)
    await seedLesson(GAS_UNIT_ID, 10, gasItems)
    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
