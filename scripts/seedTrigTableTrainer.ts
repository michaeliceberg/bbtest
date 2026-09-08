// scripts/seedTrigTableTrainer.ts
//
// Новый тип TRIGTABLE (таблица значений тригонометрии с пропусками,
// заполняемыми вариантами снизу — см. type-trigtable.tsx) — по прямой
// просьбе пользователя. Наполняем тот же t_course "Математика-11"
// (id=5, courseId=11 "ЕГЭ Математика Профиль"), созданный ранее в этой
// же сессии для тем "Тригонометрия"/"Логарифмы" (см. seedTrigLogTrainer.ts)
// — новый юнит "Таблица значений", order=3, следующим по порядку.
//
// 4 маленьких урока по 3 задачи (та же логика "2-3 на этап", что и у
// остальных тренажёров этого проекта): от простого (1 пропуск в sin/cos)
// к сложному (2-3 пропуска across все 4 строки).

import db from "@/db/drizzle"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const MATH11_TCOURSE_ID = 5 // t_courses.id, "Математика-11" (см. seedTrigLogTrainer.ts)

const ROW_LABELS = ["sin", "cos", "tg", "ctg"]
const COL_LABELS = ["30°", "45°", "60°"]

// values[row][col] — LaTeX-фрагмент БЕЗ "$" (обёртка добавляется в
// type-trigtable.tsx). Строки: sin, cos, tg, ctg; столбцы: 30°, 45°, 60°.
const GRID: string[][] = [
    ["\\dfrac{1}{2}", "\\dfrac{\\sqrt{2}}{2}", "\\dfrac{\\sqrt{3}}{2}"],
    ["\\dfrac{\\sqrt{3}}{2}", "\\dfrac{\\sqrt{2}}{2}", "\\dfrac{1}{2}"],
    ["\\dfrac{\\sqrt{3}}{3}", "1", "\\sqrt{3}"],
    ["\\sqrt{3}", "1", "\\dfrac{\\sqrt{3}}{3}"],
]

// Все 6 различных значений таблицы (каждое встречается ровно дважды в
// сетке) — источник "отвлекающих" вариантов.
const DISTINCT_VALUES = [
    "\\dfrac{1}{2}",
    "\\dfrac{\\sqrt{2}}{2}",
    "\\dfrac{\\sqrt{3}}{2}",
    "\\dfrac{\\sqrt{3}}{3}",
    "1",
    "\\sqrt{3}",
]

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

type Blank = { row: number; col: number }

function buildTrigTableData(blanks: Blank[], decoyCount: number) {
    const correctValues = blanks.map((b) => GRID[b.row][b.col])
    const decoyPool = shuffle(DISTINCT_VALUES.filter((v) => !correctValues.includes(v)))
    const decoys = decoyPool.slice(0, decoyCount)
    const options = shuffle([...correctValues, ...decoys])
    return {
        rowLabels: ROW_LABELS,
        colLabels: COL_LABELS,
        values: GRID,
        blanks,
        options,
    }
}

const QUESTION_TEXT = "Заполни пропуски в таблице значений тригонометрии"

type LessonSpec = {
    title: string
    order: number
    challenges: { blanks: Blank[]; decoyCount: number }[]
}

const LESSONS: LessonSpec[] = [
    {
        title: "Синус и косинус — 1 пропуск",
        order: 1,
        challenges: [
            { blanks: [{ row: 0, col: 0 }], decoyCount: 3 },
            { blanks: [{ row: 1, col: 1 }], decoyCount: 3 },
            { blanks: [{ row: 0, col: 2 }], decoyCount: 3 },
        ],
    },
    {
        title: "Синус и косинус — 2 пропуска",
        order: 2,
        challenges: [
            { blanks: [{ row: 0, col: 0 }, { row: 1, col: 2 }], decoyCount: 3 },
            { blanks: [{ row: 0, col: 1 }, { row: 1, col: 1 }], decoyCount: 3 },
            { blanks: [{ row: 1, col: 0 }, { row: 0, col: 2 }], decoyCount: 3 },
        ],
    },
    {
        title: "Тангенс и котангенс",
        order: 3,
        challenges: [
            { blanks: [{ row: 2, col: 1 }], decoyCount: 3 },
            { blanks: [{ row: 3, col: 0 }], decoyCount: 3 },
            { blanks: [{ row: 2, col: 0 }, { row: 3, col: 2 }], decoyCount: 3 },
        ],
    },
    {
        title: "Вся таблица",
        order: 4,
        challenges: [
            { blanks: [{ row: 0, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 0 }], decoyCount: 3 },
            { blanks: [{ row: 1, col: 0 }, { row: 2, col: 0 }, { row: 0, col: 2 }], decoyCount: 3 },
            { blanks: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 3, col: 2 }], decoyCount: 2 },
        ],
    },
]

async function main() {
    const [unit] = await db.insert(t_units).values({
        title: "Таблица значений",
        t_courseId: MATH11_TCOURSE_ID,
        order: 3,
        description: "",
        imageSrc: "",
    }).returning({ id: t_units.id })
    console.log(`Юнит "Таблица значений" создан: id=${unit.id}`)

    for (const lessonSpec of LESSONS) {
        const [lesson] = await db.insert(t_lessons).values({
            title: lessonSpec.title,
            t_unitId: unit.id,
            order: lessonSpec.order,
        }).returning({ id: t_lessons.id })

        for (let i = 0; i < lessonSpec.challenges.length; i++) {
            const spec = lessonSpec.challenges[i]
            const trigTableData = buildTrigTableData(spec.blanks, spec.decoyCount)
            await db.insert(t_challenges).values({
                t_lessonId: lesson.id,
                type: 'TRIGTABLE' as any,
                question: QUESTION_TEXT,
                order: i + 1,
                points: 10,
                author: "ЕГЭ Математика Профиль",
                numRans: '1',
                difficulty: '',
                imageSrc: '',
                trigTableData: JSON.stringify(trigTableData),
            })
        }
        console.log(`Урок "${lessonSpec.title}" создан: id=${lesson.id}, задач=${lessonSpec.challenges.length}`)
    }

    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
