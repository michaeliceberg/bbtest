// scripts/seedCircleTraining492.ts
//
// Тренировка после разбора «Знакомство с окружностью» (урок 490) — урок 492
// «Окружность — тренировка». Переделан (2026-10-10) по просьбе пользователя:
// было 13 однотипных M_ASC «sin/cos главных углов», стало ~24 задания с разных
// сторон темы урока 490: градусы ↔ радианы, «где на окружности угол» (только 4
// главные точки — домик, верх, лево, низ), «какой это угол?» по сектору,
// «нарисуй угол», sin/cos главных точек, в т.ч. отрицательных и больше 2π.
//
// Идемпотентный: удаляет все задания урока 492 и вставляет заново (сам урок и
// прогресс учеников не трогает).

import 'dotenv/config'
import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_challenges, t_challengeOptions } from "@/db/schema"

const LESSON_ID = 492
const AUTHOR = "ЕГЭ Математика"
const PI = Math.PI

// 4 главные точки окружности (то, что разбирали в уроке 490)
const AXIS_POINTS = [
    { label: "0", angle: 0 },
    { label: "\\pi/2", angle: PI / 2 },
    { label: "\\pi", angle: PI },
    { label: "3\\pi/2", angle: (3 * PI) / 2 },
]

const norm = (a: number) => {
    let x = a % (2 * PI)
    if (x < 0) x += 2 * PI
    return x
}
const axisIndex = (angle: number) => {
    const i = AXIS_POINTS.findIndex((p) => Math.abs(p.angle - norm(angle)) < 1e-6)
    if (i < 0) throw new Error(`Угол ${angle} не попадает в главную точку`)
    return i
}

// ---- M_ASC: верный ответ первым, потом авторские неверные ----
type Masc = { q: string; right: string; wrong: string[] }

const DEGREES: Masc[] = [
    { q: "$\\pi$ это", right: "$180°$", wrong: ["$90°$", "$360°$", "$\\pi°$"] },
    { q: "$\\dfrac{\\pi}{2}$ это", right: "$90°$", wrong: ["$180°$", "$45°$", "$270°$"] },
    { q: "$2\\pi$ это", right: "$360°$", wrong: ["$180°$", "$720°$", "$90°$"] },
    { q: "$\\dfrac{3\\pi}{2}$ это", right: "$270°$", wrong: ["$180°$", "$540°$", "$90°$"] },
    { q: "$-\\dfrac{\\pi}{2}$ это", right: "$-90°$", wrong: ["$90°$", "$-180°$", "$270°$"] },
    { q: "$90°$ это", right: "$\\dfrac{\\pi}{2}$", wrong: ["$\\pi$", "$2\\pi$", "$\\dfrac{3\\pi}{2}$"] },
]

const STEPS: Masc[] = [
    { q: "$\\dfrac{3\\pi}{2}$: сколько шагов по $\\dfrac{\\pi}{2}$?", right: "$3$", wrong: ["$2$", "$4$", "$6$"] },
    { q: "$2\\pi$: сколько шагов по $\\dfrac{\\pi}{2}$?", right: "$4$", wrong: ["$2$", "$3$", "$8$"] },
]

const SIN_COS: Masc[] = [
    { q: "$\\sin \\dfrac{\\pi}{2} = ?$", right: "$1$", wrong: ["$-1$", "$0$"] },
    { q: "$\\cos \\pi = ?$", right: "$-1$", wrong: ["$0$", "$1$"] },
    { q: "$\\sin \\pi = ?$", right: "$0$", wrong: ["$-1$", "$1$"] },
    { q: "$\\cos \\dfrac{\\pi}{2} = ?$", right: "$0$", wrong: ["$-1$", "$1$"] },
    { q: "$\\sin \\dfrac{3\\pi}{2} = ?$", right: "$-1$", wrong: ["$0$", "$1$"] },
    { q: "$\\cos 2\\pi = ?$", right: "$1$", wrong: ["$-1$", "$0$"] },
    { q: "$\\sin \\left(-\\dfrac{\\pi}{2}\\right) = ?$", right: "$-1$", wrong: ["$0$", "$1$"] },
    { q: "$\\cos (-\\pi) = ?$", right: "$-1$", wrong: ["$0$", "$1$"] },
    { q: "$\\sin 3\\pi = ?$", right: "$0$", wrong: ["$-1$", "$1$"] },
    { q: "$\\cos \\dfrac{5\\pi}{2} = ?$", right: "$0$", wrong: ["$-1$", "$1$"] },
]

// ---- UNITCIRCLE ----
const LOCATE: { latex: string; angle: number }[] = [
    { latex: "\\pi", angle: PI },
    { latex: "-\\dfrac{\\pi}{2}", angle: -PI / 2 },
    { latex: "2\\pi", angle: 2 * PI },
    { latex: "\\dfrac{5\\pi}{2}", angle: (5 * PI) / 2 },
    { latex: "-\\pi", angle: -PI },
]

const SECTOR: { latex: string; angle: number; options: string[] }[] = [
    { latex: "\\dfrac{3\\pi}{2}", angle: (3 * PI) / 2, options: ["\\dfrac{\\pi}{2}", "\\pi", "\\dfrac{3\\pi}{2}", "2\\pi"] },
    { latex: "-\\dfrac{\\pi}{2}", angle: -PI / 2, options: ["-\\dfrac{\\pi}{2}", "\\dfrac{\\pi}{2}", "-\\pi", "\\dfrac{3\\pi}{2}"] },
]

const DRAW: { latex: string; angle: number }[] = [
    { latex: "\\pi", angle: PI },
    { latex: "-\\dfrac{\\pi}{2}", angle: -PI / 2 },
]

async function insertMasc(order: number, m: Masc) {
    const [c] = await db.insert(t_challenges).values({
        t_lessonId: LESSON_ID, type: 'M_ASC' as any, question: m.q, order,
        points: 10, author: AUTHOR, numRans: '1', difficulty: '', imageSrc: '',
    }).returning({ id: t_challenges.id })
    await db.insert(t_challengeOptions).values([
        { t_challengeId: c.id, text: m.right, correct: true, imageSrc: '', audioSrc: '' },
        ...m.wrong.map((w) => ({ t_challengeId: c.id, text: w, correct: false, imageSrc: '', audioSrc: '' })),
    ] as any)
}

async function insertCircle(order: number, question: string, data: object) {
    await db.insert(t_challenges).values({
        t_lessonId: LESSON_ID, type: 'UNITCIRCLE' as any, question, order,
        points: 10, author: AUTHOR, numRans: '1', difficulty: '', imageSrc: '',
        unitCircleData: JSON.stringify(data),
    } as any)
}

async function main() {
    const lesson = await db.query.t_lessons.findFirst({ where: (l, { eq }) => eq(l.id, LESSON_ID) })
    if (!lesson) throw new Error(`Урок ${LESSON_ID} не найден`)

    const deleted = await db.delete(t_challenges).where(eq(t_challenges.t_lessonId, LESSON_ID)).returning({ id: t_challenges.id })
    console.log(`Удалено старых заданий: ${deleted.length}`)

    let order = 1
    for (const m of DEGREES) await insertMasc(order++, m)
    for (const m of STEPS) await insertMasc(order++, m)
    for (const l of LOCATE) {
        await insertCircle(order++, `Где на окружности угол $\\quad ${l.latex}$?`, {
            mode: 'locate', points: AXIS_POINTS, correctIndices: [axisIndex(l.angle)],
        })
    }
    for (const s of SECTOR) {
        if (!s.options.includes(s.latex)) throw new Error(`Нет верного варианта для ${s.latex}`)
        await insertCircle(order++, "Какой это угол?", {
            mode: 'sector', points: [], correctIndices: [],
            sectorAngle: s.angle, sectorOptions: s.options, sectorCorrectOption: s.latex,
        })
    }
    for (const d of DRAW) {
        await insertCircle(order++, `Нарисуй угол $\\quad ${d.latex}$`, {
            mode: 'draw', points: [], correctIndices: [], drawTargetAngle: d.angle,
        })
    }
    for (const m of SIN_COS) await insertMasc(order++, m)

    console.log(`Готово, заданий: ${order - 1}`)
    process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
