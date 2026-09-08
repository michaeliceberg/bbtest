// scripts/seedUnitCircleTrainer.ts
//
// Новый тип UNITCIRCLE (тригонометрический круг с точками-"магнитами",
// см. type-unitcircle.tsx) — по прямой просьбе пользователя: тренажёр на
// расположение корней тригонометрических уравнений на окружности, часть
// б) задания №13 ЕГЭ (примеры sdamgia problem?id=697375/697347/697406/
// 697407 — "изобразите на тригонометрической окружности корни уравнения
// и отберите те, что принадлежат отрезку"). Здесь — первый, более
// простой навык-фундамент, явно описанный пользователем: (1) найти на
// круге ОДНУ точку по названному углу (в т.ч. с приведением по модулю
// 2π — "где находится 3π?"), и (2) отметить ВСЕ точки, соответствующие
// простому тригонометрическому уравнению (sin/cos/tg x = a).
//
// Наполняем тот же t_course "Математика-11" (id=5, courseId=11 "ЕГЭ
// Математика Профиль") — новый юнит "Тригонометрический круг", order=4
// (следующий по порядку после уже существующих Тригонометрия/Логарифмы/
// Таблица значений, см. seedTrigLogTrainer.ts/seedTrigTableTrainer.ts).
//
// Тот же идемпотентный паттерн, что и у seedTrigTableTrainer.ts — если
// юнит с этим названием уже существует, пересоздаём его целиком
// (каскад снесёт t_lessons/t_challenges), а не патчим точечно.
//
// Корректность ответов НЕ вбивается руками — каждый target/equation
// проверяется программно против фиксированного набора 16 точек круга
// (findPointIndices ниже), скрипт падает с ошибкой, если для какого-то
// примера не нашлось ни одной подходящей точки — это гарантирует, что
// в БД не попадёт математически неверная задача.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const MATH11_TCOURSE_ID = 5
const UNIT_TITLE = "Тригонометрический круг"

// 16 стандартных точек тригонометрического круга — кратные 30° (12) +
// нечётные кратные 45° (4), тот же набор, что на любой классической
// таблице-круге. label — слитная (без \dfrac) запись угла через "/" —
// компактнее для кружка-магнита, чем "вертикальная" дробь (см.
// type-unitcircle.tsx).
const POINTS: { label: string; angle: number }[] = [
    { label: "0", angle: 0 },
    { label: "\\pi/6", angle: Math.PI / 6 },
    { label: "\\pi/4", angle: Math.PI / 4 },
    { label: "\\pi/3", angle: Math.PI / 3 },
    { label: "\\pi/2", angle: Math.PI / 2 },
    { label: "2\\pi/3", angle: (2 * Math.PI) / 3 },
    { label: "3\\pi/4", angle: (3 * Math.PI) / 4 },
    { label: "5\\pi/6", angle: (5 * Math.PI) / 6 },
    { label: "\\pi", angle: Math.PI },
    { label: "7\\pi/6", angle: (7 * Math.PI) / 6 },
    { label: "5\\pi/4", angle: (5 * Math.PI) / 4 },
    { label: "4\\pi/3", angle: (4 * Math.PI) / 3 },
    { label: "3\\pi/2", angle: (3 * Math.PI) / 2 },
    { label: "5\\pi/3", angle: (5 * Math.PI) / 3 },
    { label: "7\\pi/4", angle: (7 * Math.PI) / 4 },
    { label: "11\\pi/6", angle: (11 * Math.PI) / 6 },
]

const TWO_PI = 2 * Math.PI
const TOL = 1e-6

const normalizeAngle = (a: number): number => {
    let x = a % TWO_PI
    if (x < 0) x += TWO_PI
    return x
}

// 'locate' — ровно один угол, приведённый по модулю 2π, ДОЛЖЕН попасть
// точно в одну из 16 точек, иначе бросаем ошибку (защита от опечатки в
// значении угла).
function findSinglePointIndex(value: number): number {
    const norm = normalizeAngle(value)
    const idx = POINTS.findIndex((p) => Math.abs(p.angle - norm) < TOL || Math.abs(p.angle - norm - TWO_PI) < TOL)
    if (idx === -1) {
        throw new Error(`findSinglePointIndex: угол ${value} (норм. ${norm}) не совпал ни с одной из 16 точек`)
    }
    return idx
}

// 'select' — все точки, где sin/cos/tg совпадает с value (с допуском).
function findAllMatchingIndices(fn: (angle: number) => number, value: number): number[] {
    const out: number[] = []
    POINTS.forEach((p, idx) => {
        if (Math.abs(fn(p.angle) - value) < 1e-9) out.push(idx)
    })
    if (out.length === 0) {
        throw new Error(`findAllMatchingIndices: значение ${value} не совпало ни с одной из 16 точек`)
    }
    return out
}

type Challenge = {
    question: string
    mode: 'locate' | 'select'
    correctIndices: number[]
}

// ===== LOCATE — простые (угол уже в [0, 2π), другая запись той же
// величины, чем на магните — \dfrac вместо "/", чтобы не давать просто
// вычитывать ответ по совпадению текста) =====
const LOCATE_SIMPLE: { disp: string; val: number }[] = [
    { disp: "\\dfrac{\\pi}{6}", val: Math.PI / 6 },
    { disp: "\\dfrac{\\pi}{3}", val: Math.PI / 3 },
    { disp: "\\dfrac{\\pi}{2}", val: Math.PI / 2 },
    { disp: "\\dfrac{2\\pi}{3}", val: (2 * Math.PI) / 3 },
    { disp: "\\dfrac{5\\pi}{6}", val: (5 * Math.PI) / 6 },
    { disp: "\\pi", val: Math.PI },
    { disp: "\\dfrac{7\\pi}{6}", val: (7 * Math.PI) / 6 },
    { disp: "\\dfrac{5\\pi}{4}", val: (5 * Math.PI) / 4 },
    { disp: "\\dfrac{5\\pi}{3}", val: (5 * Math.PI) / 3 },
]

// ===== LOCATE — отрицательные/большие углы, нужно приведение по модулю
// 2π (val посчитан программно через Math.PI — сам факт, что скрипт
// успешно находит точку с допуском TOL, УЖЕ подтверждает арифметику). =====
const LOCATE_HARD: { disp: string; val: number }[] = [
    { disp: "3\\pi", val: 3 * Math.PI }, // → π
    { disp: "-\\dfrac{\\pi}{3}", val: -Math.PI / 3 }, // → 5π/3
    { disp: "\\dfrac{13\\pi}{6}", val: (13 * Math.PI) / 6 }, // → π/6
    { disp: "\\dfrac{9\\pi}{4}", val: (9 * Math.PI) / 4 }, // → π/4
    { disp: "-\\dfrac{7\\pi}{6}", val: (-7 * Math.PI) / 6 }, // → 5π/6
    { disp: "\\dfrac{15\\pi}{4}", val: (15 * Math.PI) / 4 }, // → 7π/4
    { disp: "4\\pi", val: 4 * Math.PI }, // → 0
    { disp: "-\\dfrac{5\\pi}{3}", val: (-5 * Math.PI) / 3 }, // → π/3
    { disp: "\\dfrac{17\\pi}{6}", val: (17 * Math.PI) / 6 }, // → 5π/6
    { disp: "-\\dfrac{13\\pi}{4}", val: (-13 * Math.PI) / 4 }, // → 3π/4
    { disp: "\\dfrac{23\\pi}{6}", val: (23 * Math.PI) / 6 }, // → 11π/6
    { disp: "-4\\pi", val: -4 * Math.PI }, // → 0
]

// ===== SELECT — sin/cos/tg x = a =====
const SIN_EQUATIONS: { disp: string; val: number }[] = [
    { disp: "\\sin x = \\dfrac{1}{2}", val: 0.5 },
    { disp: "\\sin x = -\\dfrac{1}{2}", val: -0.5 },
    { disp: "\\sin x = \\dfrac{\\sqrt{2}}{2}", val: Math.SQRT1_2 },
    { disp: "\\sin x = -\\dfrac{\\sqrt{2}}{2}", val: -Math.SQRT1_2 },
    { disp: "\\sin x = \\dfrac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 },
    { disp: "\\sin x = -\\dfrac{\\sqrt{3}}{2}", val: -Math.sqrt(3) / 2 },
    { disp: "\\sin x = 0", val: 0 },
    { disp: "\\sin x = 1", val: 1 },
    { disp: "\\sin x = -1", val: -1 },
]
const COS_EQUATIONS: { disp: string; val: number }[] = [
    { disp: "\\cos x = \\dfrac{1}{2}", val: 0.5 },
    { disp: "\\cos x = -\\dfrac{1}{2}", val: -0.5 },
    { disp: "\\cos x = \\dfrac{\\sqrt{2}}{2}", val: Math.SQRT1_2 },
    { disp: "\\cos x = -\\dfrac{\\sqrt{2}}{2}", val: -Math.SQRT1_2 },
    { disp: "\\cos x = \\dfrac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 },
    { disp: "\\cos x = -\\dfrac{\\sqrt{3}}{2}", val: -Math.sqrt(3) / 2 },
    { disp: "\\cos x = 0", val: 0 },
    { disp: "\\cos x = 1", val: 1 },
    { disp: "\\cos x = -1", val: -1 },
]
const TG_EQUATIONS: { disp: string; val: number }[] = [
    { disp: "tg(x) = 1", val: 1 },
    { disp: "tg(x) = -1", val: -1 },
    { disp: "tg(x) = \\sqrt{3}", val: Math.sqrt(3) },
    { disp: "tg(x) = -\\sqrt{3}", val: -Math.sqrt(3) },
    { disp: "tg(x) = \\dfrac{\\sqrt{3}}{3}", val: Math.sqrt(3) / 3 },
    { disp: "tg(x) = -\\dfrac{\\sqrt{3}}{3}", val: -Math.sqrt(3) / 3 },
    { disp: "tg(x) = 0", val: 0 },
]

const locateQuestion = (disp: string) => `Где находится $${disp}$?`
const selectQuestion = (disp: string) => `Отметь все точки, где $${disp}$`

function buildLocate(items: { disp: string; val: number }[]): Challenge[] {
    return items.map(({ disp, val }) => ({
        question: locateQuestion(disp),
        mode: 'locate' as const,
        correctIndices: [findSinglePointIndex(val)],
    }))
}

function buildSelect(items: { disp: string; val: number }[], fn: (a: number) => number): Challenge[] {
    return items.map(({ disp, val }) => ({
        question: selectQuestion(disp),
        mode: 'select' as const,
        correctIndices: findAllMatchingIndices(fn, val),
    }))
}

// Сбалансированное деление — см. общий приём в seedTrigLogTrainer.ts/
// seedTrigTableTrainer.ts (не даёт "огрызок" из 1 задачи; для UNITCIRCLE
// это не критично, т.к. у типа нет обманок-соседей, но сохраняем
// единообразие уроков по 2-3 задачи).
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

    chunkBalanced(buildLocate(LOCATE_SIMPLE), 3).forEach((group, i) => {
        lessons.push({ title: `Найди точку — простые углы ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildLocate(LOCATE_HARD), 3).forEach((group, i) => {
        lessons.push({ title: `Найди точку — отрицательные и большие углы ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildSelect(SIN_EQUATIONS, Math.sin), 3).forEach((group, i) => {
        lessons.push({ title: `sin x = a — отметь корни ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildSelect(COS_EQUATIONS, Math.cos), 3).forEach((group, i) => {
        lessons.push({ title: `cos x = a — отметь корни ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildSelect(TG_EQUATIONS, Math.tan), 3).forEach((group, i) => {
        lessons.push({ title: `tg x = a — отметь корни ${i + 1}`, challenges: group })
    })

    // Контрольная — мини-босс (isReviewStage триггерится по слову
    // "контрольн" в названии, см. trainer-grade-tree.tsx) — микс locate
    // (сложный угол) и всех трёх уравнений.
    lessons.push({
        title: "Контрольная — весь круг",
        challenges: [
            ...buildLocate([{ disp: "\\dfrac{11\\pi}{4}", val: (11 * Math.PI) / 4 }]), // → 3π/4
            ...buildSelect([{ disp: "\\sin x = \\dfrac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 }], Math.sin),
            ...buildSelect([{ disp: "\\cos x = -\\dfrac{1}{2}", val: -0.5 }], Math.cos),
            ...buildSelect([{ disp: "tg(x) = -1", val: -1 }], Math.tan),
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
        order: 4,
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
                type: 'UNITCIRCLE' as any,
                question: ch.question,
                order: i + 1,
                points: 10,
                author: "ЕГЭ Математика Профиль",
                numRans: String(ch.correctIndices.length),
                difficulty: '',
                imageSrc: '',
                unitCircleData: JSON.stringify({
                    mode: ch.mode,
                    points: POINTS,
                    correctIndices: ch.correctIndices,
                }),
            })
        }
        console.log(`Урок "${lessonSpec.title}" создан: id=${lesson.id}, задач=${lessonSpec.challenges.length}`)
    }

    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
