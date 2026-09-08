// scripts/seedVietaTrainer.ts
//
// Новый тип VIETA (тренажёр теоремы Виета, см. type-vieta.tsx) — по
// прямой просьбе пользователя: "подбери два числа так, чтобы x1·x2 = P,
// x1+x2 = S", прогрессия сложности —
//   1. целые положительные корни,
//   2. отрицательные/смешанные знаки,
//   3. из полного квадратного уравнения (x²+bx+c=0 → a/b/c → формулы
//      Виета → числа, см. вводный экран в type-vieta.tsx),
// плюс "Контрольная" (мини-босс, isReviewStage по слову "контрольн").
//
// Наполняем тот же t_course "Математика-11" (id=5) — новый юнит "Теорема
// Виета", order=5 (следующий по порядку после уже существующих
// Тригонометрия/Логарифмы/Таблица значений/Тригонометрический круг).
//
// Правильность НЕ вбивается руками — каждая пара корней проверяется
// программно (product===r1*r2, sum===r1+r2, а для квадратных — ещё и
// product===c, sum===-b), скрипт падает с ошибкой при малейшем
// расхождении, до того как это попадёт в БД.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const MATH11_TCOURSE_ID = 5
const UNIT_TITLE = "Теорема Виета"

const INSTRUCTION = "Подбери два числа так, чтобы выполнялись оба равенства"
const INSTRUCTION_QUADRATIC = "Реши уравнение через теорему Виета — подбери корни"

type Quadratic = { a: number; b: number; c: number }
type Item = { r1: number; r2: number; distractorPool: number[]; quadratic?: Quadratic }

function verify(item: Item) {
    const { r1, r2, quadratic } = item
    const product = r1 * r2
    const sum = r1 + r2
    if (quadratic) {
        if (quadratic.a !== 1) {
            throw new Error(`verify: ожидался приведённый квадратный трёхчлен (a=1), получено a=${quadratic.a}`)
        }
        if (product !== quadratic.c) {
            throw new Error(`verify: x1*x2=${product} не совпадает с c=${quadratic.c} (${JSON.stringify(item)})`)
        }
        if (sum !== -quadratic.b) {
            throw new Error(`verify: x1+x2=${sum} не совпадает с -b=${-quadratic.b} (${JSON.stringify(item)})`)
        }
    }
    return { product, sum }
}

// Пул отвлекающих чисел — берём из diapазона, исключаем сами корни и
// дубликаты, детерминированно (без Math.random) через простой сдвиг по
// пулу, чтобы прогон скрипта был воспроизводим.
function pickDistractors(correctRoots: number[], pool: number[], count: number): number[] {
    const out: number[] = []
    for (const n of pool) {
        if (out.length >= count) break
        if (correctRoots.includes(n) || out.includes(n)) continue
        out.push(n)
    }
    if (out.length < count) {
        throw new Error(`pickDistractors: пула не хватило (нужно ${count}, нашлось ${out.length}) для корней ${correctRoots}`)
    }
    return out
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

type Challenge = {
    question: string
    product: number
    sum: number
    options: number[]
    correctRoots: [number, number]
    quadratic?: Quadratic
}

function buildChallenge(item: Item): Challenge {
    const { product, sum } = verify(item)
    const distractors = pickDistractors([item.r1, item.r2], item.distractorPool, 3)
    const options = shuffle([item.r1, item.r2, ...distractors])
    return {
        question: item.quadratic ? INSTRUCTION_QUADRATIC : INSTRUCTION,
        product,
        sum,
        options,
        correctRoots: [item.r1, item.r2],
        quadratic: item.quadratic,
    }
}

// ===== Этап 1 — целые положительные корни =====
const STAGE1_ITEMS: Item[] = [
    { r1: 2, r2: 3, distractorPool: [1, 4, 5, 6, 7] },
    { r1: 3, r2: 8, distractorPool: [2, 4, 6, 9, 12] },
    { r1: 3, r2: 4, distractorPool: [2, 5, 6, 7, 8] },
    { r1: 2, r2: 5, distractorPool: [1, 3, 4, 6, 10] },
    { r1: 3, r2: 6, distractorPool: [2, 4, 5, 9, 18] },
    { r1: 3, r2: 5, distractorPool: [2, 4, 6, 7, 15] },
    { r1: 2, r2: 4, distractorPool: [1, 3, 5, 6, 8] },
]

// ===== Этап 2 — отрицательные/смешанные знаки =====
const STAGE2_ITEMS: Item[] = [
    { r1: -2, r2: -3, distractorPool: [2, 3, -1, -4, -6] },
    { r1: -2, r2: -4, distractorPool: [2, 4, -1, -3, -8] },
    { r1: -2, r2: 3, distractorPool: [2, -3, 1, -1, 6] },
    { r1: -3, r2: 5, distractorPool: [3, -5, 1, -1, 15] },
    { r1: 1, r2: -4, distractorPool: [-1, 4, 2, -2, -3] },
    { r1: 3, r2: -4, distractorPool: [-3, 4, 1, -1, 12] },
    { r1: -1, r2: -4, distractorPool: [1, 4, -2, -3, 2] },
]

// ===== Этап 3 — из полного квадратного уравнения (a=1) =====
const STAGE3_ITEMS: Item[] = [
    { r1: 3, r2: 4, distractorPool: [2, 5, 6, 12, -3], quadratic: { a: 1, b: -7, c: 12 } },
    { r1: 2, r2: 3, distractorPool: [1, 4, 6, -2, 5], quadratic: { a: 1, b: -5, c: 6 } },
    { r1: 2, r2: -5, distractorPool: [-2, 5, 1, -10, 3], quadratic: { a: 1, b: 3, c: -10 } },
    { r1: 3, r2: -2, distractorPool: [-3, 2, 1, -6, 6], quadratic: { a: 1, b: -1, c: -6 } },
    { r1: -3, r2: -5, distractorPool: [3, 5, -1, -15, 15], quadratic: { a: 1, b: 8, c: 15 } },
    { r1: 4, r2: 5, distractorPool: [-4, -5, 2, 10, 20], quadratic: { a: 1, b: -9, c: 20 } },
]

// Сбалансированное деление по 3 (тот же приём, что и в остальных
// seed-скриптах этой сессии — не даёт "огрызок" из 1 задачи).
function chunkBalanced<T>(items: T[], targetSize: number): T[][] {
    if (items.length === 0) return []
    const numGroups = Math.max(1, Math.ceil(items.length / targetSize))
    const baseSize = Math.floor(items.length / numGroups)
    const remainder = items.length % numGroups
    const out: T[][] = []
    let idx = 0
    for (let g = 0; g < numGroups; g++) {
        const size = baseSize + (g < remainder ? 1 : 0)
        out.push(items.slice(idx, idx + size))
        idx += size
    }
    return out
}

type LessonSpec = { title: string; challenges: Challenge[] }

function buildLessons(): LessonSpec[] {
    const lessons: LessonSpec[] = []

    chunkBalanced(STAGE1_ITEMS.map(buildChallenge), 3).forEach((group, i) => {
        lessons.push({ title: `Подбери корни — целые положительные ${i + 1}`, challenges: group })
    })
    chunkBalanced(STAGE2_ITEMS.map(buildChallenge), 3).forEach((group, i) => {
        lessons.push({ title: `Подбери корни — отрицательные числа ${i + 1}`, challenges: group })
    })
    chunkBalanced(STAGE3_ITEMS.map(buildChallenge), 3).forEach((group, i) => {
        lessons.push({ title: `Из квадратного уравнения ${i + 1}`, challenges: group })
    })

    // Контрольная — мини-босс (isReviewStage по слову "контрольн", см.
    // trainer-grade-tree.tsx), микс всех трёх этапов.
    lessons.push({
        title: "Контрольная — теорема Виета",
        challenges: [
            buildChallenge({ r1: 4, r2: 6, distractorPool: [2, 3, 5, 8, 24] }),
            buildChallenge({ r1: -3, r2: 2, distractorPool: [3, -2, 1, -6, 6] }),
            buildChallenge({ r1: 5, r2: -3, distractorPool: [-5, 3, 1, -15, 15], quadratic: { a: 1, b: -2, c: -15 } }),
            buildChallenge({ r1: -4, r2: -5, distractorPool: [4, 5, -1, -20, 20], quadratic: { a: 1, b: 9, c: 20 } }),
        ],
    })

    return lessons
}

async function main() {
    const existing = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, MATH11_TCOURSE_ID), eq(u.title, UNIT_TITLE)),
    })
    if (existing) {
        await db.delete(t_units).where(eq(t_units.id, existing.id))
        console.log(`Старый юнит "${UNIT_TITLE}" (id=${existing.id}) удалён — пересоздаём`)
    }

    const [unit] = await db.insert(t_units).values({
        title: UNIT_TITLE,
        t_courseId: MATH11_TCOURSE_ID,
        order: 5,
        description: "",
        imageSrc: "",
    }).returning({ id: t_units.id })
    console.log(`Юнит "${UNIT_TITLE}" создан: id=${unit.id}`)

    const lessons = buildLessons()

    for (let li = 0; li < lessons.length; li++) {
        const lessonSpec = lessons[li]
        const [lesson] = await db.insert(t_lessons).values({
            title: lessonSpec.title,
            t_unitId: unit.id,
            order: li + 1,
        }).returning({ id: t_lessons.id })

        for (let i = 0; i < lessonSpec.challenges.length; i++) {
            const ch = lessonSpec.challenges[i]
            await db.insert(t_challenges).values({
                t_lessonId: lesson.id,
                type: 'VIETA' as any,
                question: ch.question,
                order: i + 1,
                points: 10,
                author: "ЕГЭ Математика Профиль",
                numRans: '1',
                difficulty: '',
                imageSrc: '',
                vietaData: JSON.stringify({
                    product: ch.product,
                    sum: ch.sum,
                    options: ch.options,
                    correctRoots: ch.correctRoots,
                    quadratic: ch.quadratic,
                }),
            })
        }
        console.log(`Урок "${lessonSpec.title}" создан: id=${lesson.id}, задач=${lessonSpec.challenges.length}`)
    }

    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
