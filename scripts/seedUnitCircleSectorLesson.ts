// scripts/seedUnitCircleSectorLesson.ts
//
// Новый урок 2 в юните "Тригонометрический круг" (t_course "Математика-11",
// id=5) — по прямой просьбе пользователя, ДВА новых режима UNITCIRCLE
// (см. UnitCircleData в app/t-lesson/[t_lessonId]/page.tsx и рендер в
// type-unitcircle.tsx):
//
// 1) 'sector' — статический вопрос "Какой это угол?": уже нарисован
//    закрашенный сектор от 0 (справа, cos-направление) до целевого угла,
//    положительный крутится против часовой, отрицательный по часовой
//    (с явной подписью "0" у начала отсчёта — по просьбе пользователя,
//    чтобы направление отрицательных углов читалось однозначно). Внизу —
//    4 MC-варианта.
// 2) 'draw' — интерактив "Нарисуй этот угол": пользователь тащит мигающую
//    ручку по кругу (стартует на демо-позиции π/4, НЕ на цели), сектор
//    перерисовывается вживую, с магнитными точками на 16 стандартных
//    углах круга (кратные 30°/45°) — та же логика snap, что уже
//    используется у остальных UNITCIRCLE-режимов для recognitON точек.
//
// ВАЖНО: в отличие от scripts/seedUnitCircleTrainer.ts (тот делает
// БЕЗУСЛОВНЫЙ delete+recreate ВСЕГО юнита при каждом запуске) — этот
// скрипт АДДИТИВНЫЙ. На юните уже есть реальный прогресс пользователя
// (t_lesson_progress, phone:79160991997) — удалять/пересоздавать юнит
// нельзя. Вместо этого: order существующих уроков >=2 сдвигается на +1
// (по убыванию, без риска временных коллизий), и вставляется НОВЫЙ урок с
// order=2 — старый урок 2 и все следующие просто съезжают на одну позицию
// вперёд, их id/прогресс не трогаются вообще.

import db from "@/db/drizzle"
import { eq, gte, and } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const UNIT_TITLE = "Тригонометрический круг"
const NEW_LESSON_TITLE = "Секторы: узнай и нарисуй угол"
const NEW_LESSON_ORDER = 2

const TWO_PI = Math.PI * 2

// Целевые углы задания — ровно те, что попросил пользователь: четверть,
// половина, три четверти и полный оборот, в обеих формах (против часовой
// и по часовой).
const TARGETS: { angle: number; latex: string }[] = [
    { angle: Math.PI / 2, latex: "\\dfrac{\\pi}{2}" },
    { angle: -Math.PI / 2, latex: "-\\dfrac{\\pi}{2}" },
    { angle: Math.PI, latex: "\\pi" },
    { angle: -Math.PI, latex: "-\\pi" },
    { angle: (3 * Math.PI) / 2, latex: "\\dfrac{3\\pi}{2}" },
    { angle: (-3 * Math.PI) / 2, latex: "-\\dfrac{3\\pi}{2}" },
    { angle: TWO_PI, latex: "2\\pi" },
    { angle: -TWO_PI, latex: "-2\\pi" },
]

const POSITIVE_OPTIONS = ["\\dfrac{\\pi}{2}", "\\pi", "\\dfrac{3\\pi}{2}", "2\\pi"]
const NEGATIVE_OPTIONS = ["-\\dfrac{\\pi}{2}", "-\\pi", "-\\dfrac{3\\pi}{2}", "-2\\pi"]

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

async function insertSectorChallenge(lessonId: number, order: number, target: { angle: number; latex: string }) {
    const isPositive = target.angle > 0
    const options = shuffle(isPositive ? POSITIVE_OPTIONS : NEGATIVE_OPTIONS)

    await db.insert(t_challenges).values({
        t_lessonId: lessonId,
        type: 'UNITCIRCLE' as any,
        question: "Какой это угол?",
        order,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
        unitCircleData: JSON.stringify({
            mode: 'sector',
            points: [],
            correctIndices: [],
            sectorAngle: target.angle,
            sectorOptions: options,
            sectorCorrectOption: target.latex,
        }),
    })
}

async function insertDrawChallenge(lessonId: number, order: number, target: { angle: number; latex: string }) {
    await db.insert(t_challenges).values({
        t_lessonId: lessonId,
        type: 'UNITCIRCLE' as any,
        // "угол" + \quad (не обычные пробелы — они схлопнутся и в HTML, и
        // в самой math-моде KaTeX) — по прямой просьбе пользователя, иначе
        // слово и значение угла визуально сливались.
        question: `Нарисуй угол $\\quad ${target.latex}$`,
        order,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '',
        imageSrc: '',
        unitCircleData: JSON.stringify({
            mode: 'draw',
            points: [],
            correctIndices: [],
            drawTargetAngle: target.angle,
        }),
    })
}

async function main() {
    const unit = await db.query.t_units.findFirst({
        where: (u, { eq }) => eq(u.title, UNIT_TITLE),
    })
    if (!unit) {
        throw new Error(`Юнит "${UNIT_TITLE}" не найден — ожидался уже существующим (scripts/seedUnitCircleTrainer.ts)`)
    }

    const existingNewLesson = await db.query.t_lessons.findFirst({
        where: (l, { and, eq }) => and(eq(l.t_unitId, unit.id), eq(l.title, NEW_LESSON_TITLE)),
    })
    if (existingNewLesson) {
        throw new Error(`Урок "${NEW_LESSON_TITLE}" уже существует (id=${existingNewLesson.id}) — скрипт не рассчитан на повторный запуск, чтобы не задвоить сдвиг order. Удалите урок вручную, если нужно пересоздать.`)
    }

    const existingLessons = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, unit.id) })
    const toShift = existingLessons.filter((l) => l.order >= NEW_LESSON_ORDER).sort((a, b) => b.order - a.order)

    // По убыванию order — на каждом шаге целевое значение гарантированно
    // свободно (выше любого ещё не сдвинутого урока), коллизий не будет
    // даже если бы на (t_unitId, order) была уникальность (её нет, но
    // порядок дешёвый и безопасный в любом случае).
    for (const lesson of toShift) {
        await db.update(t_lessons).set({ order: lesson.order + 1 }).where(eq(t_lessons.id, lesson.id))
        console.log(`Урок "${lesson.title}" (id=${lesson.id}): order ${lesson.order} → ${lesson.order + 1}`)
    }

    const [newLesson] = await db.insert(t_lessons).values({
        title: NEW_LESSON_TITLE,
        t_unitId: unit.id,
        order: NEW_LESSON_ORDER,
    }).returning({ id: t_lessons.id })
    console.log(`Урок "${NEW_LESSON_TITLE}" создан: id=${newLesson.id}, order=${NEW_LESSON_ORDER}`)

    let order = 1
    for (const target of TARGETS) {
        await insertSectorChallenge(newLesson.id, order++, target)
    }
    for (const target of TARGETS) {
        await insertDrawChallenge(newLesson.id, order++, target)
    }
    console.log(`Задач добавлено: ${order - 1} (8 sector + 8 draw)`)

    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
