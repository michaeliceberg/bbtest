// Урок «Как в ЕГЭ: примеры» в юните «8 свойств логарифмов» (t_unit 16): числовые задания в духе ЕГЭ №7 (по картинкам заказчика
// и в том же стиле). Ставится перед «Босс-экзаменом»; босс берёт задачи из M_ASC-уроков юнита, так что примеры попадают и туда. Идемпотентно.
// Верный ответ считаем сами (не из sdamgia), проверка — scripts-проверка ниже: каждый ответ пересчитан в коде.
import db from "@/db/drizzle"
import { eq, asc } from "drizzle-orm"
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema"

const UNIT_ID = 16
const TITLE = "Как в ЕГЭ: примеры"
const BOSS = "Босс-экзамен: Логарифмы"
const AUTHOR = "ЕГЭ Математика Профиль"
type Task = { expr: string; ans: string; wrong: string[]; check: number }
const lg = (b: number, x: number) => Math.log(x) / Math.log(b)

const TASKS: Task[] = [
    { expr: '\\log_{2}{224} - \\log_{2}{3{,}5}', ans: '6', wrong: ['5', '7', '64', '220{,}5', '3'], check: lg(2, 224) - lg(2, 3.5) },
    { expr: '\\log_{0{,}3}{10} - \\log_{0{,}3}{3}', ans: '-1', wrong: ['1', '-3', '0{,}3', '7', '-7'], check: lg(0.3, 10) - lg(0.3, 3) },
    { expr: '\\log_{9}{16{,}2} + \\log_{9}{5}', ans: '2', wrong: ['1', '3', '9', '21{,}2', '81'], check: lg(9, 16.2) + lg(9, 5) },
    { expr: '\\frac{\\log_{3}{625}}{\\log_{3}{5}}', ans: '4', wrong: ['5', '125', '3', '25', '120'], check: lg(3, 625) / lg(3, 5) },
    { expr: '\\frac{\\log_{7}{13}}{\\log_{49}{13}}', ans: '2', wrong: ['\\frac{1}{2}', '7', '13', '49', '1'], check: lg(7, 13) / lg(49, 13) },
    { expr: '5 \\log_{\\sqrt{6}}{36}', ans: '20', wrong: ['10', '5', '4', '30', '40'], check: 5 * lg(Math.sqrt(6), 36) },
    { expr: '\\log_{\\sqrt{7}}^{2}{49}', ans: '16', wrong: ['4', '8', '2', '7', '32'], check: lg(Math.sqrt(7), 49) ** 2 },
    { expr: '64^{\\log_{8}{\\sqrt{3}}}', ans: '3', wrong: ['9', '8', '2', '\\sqrt{3}', '64'], check: 64 ** lg(8, Math.sqrt(3)) },
    { expr: '\\frac{\\log_{11}{5}}{\\log_{11}{12}} + \\log_{12}{2{,}4}', ans: '1', wrong: ['0', '2', '12', '5', '2{,}4'], check: lg(11, 5) / lg(11, 12) + lg(12, 2.4) },
    { expr: '\\log_{5}{12} \\cdot \\log_{12}{25}', ans: '2', wrong: ['12', '25', '5', '300', '1'], check: lg(5, 12) * lg(12, 25) },
    { expr: '\\log_{12}{4} + \\log_{12}{36}', ans: '2', wrong: ['40', '144', '12', '4', '1'], check: lg(12, 4) + lg(12, 36) },
    { expr: '27^{\\log_{3}{2}}', ans: '8', wrong: ['6', '9', '54', '3', '2'], check: 27 ** lg(3, 2) },
    { expr: '\\log_{3}{54} - \\log_{3}{2}', ans: '3', wrong: ['52', '27', '9', '2', '4'], check: lg(3, 54) - lg(3, 2) },
]

const num = (s: string) => s === '\\frac{1}{2}' ? 0.5 : s === '\\sqrt{3}' ? Math.sqrt(3) : Number(s.replace('{,}', '.'))
const A = (s: string) => `$ ${s} $`
const Q = (e: string) => `$ \\large ${e} = ? $`

async function main() {
    for (const t of TASKS) {
        if (Math.abs(t.check - num(t.ans)) > 1e-9) throw new Error(`Ответ не сходится: ${t.expr} → ${t.ans}, а по счёту ${t.check}`)
        if (t.wrong.length !== 5 || t.wrong.includes(t.ans) || new Set(t.wrong).size !== 5) throw new Error(`Плохие варианты: ${t.expr}`)
    }
    const ex = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, TITLE)) })
    if (ex) await db.delete(t_lessons).where(eq(t_lessons.id, ex.id))
    const [lesson] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: 999 }).returning({ id: t_lessons.id })
    for (let i = 0; i < TASKS.length; i++) {
        const t = TASKS[i]
        const [ch] = await db.insert(t_challenges).values({
            t_lessonId: lesson.id, type: 'M_ASC' as any, question: Q(t.expr), order: i + 1, points: 10,
            author: AUTHOR, numRans: '1', difficulty: '1', imageSrc: '0',
        }).returning({ id: t_challenges.id })
        // верный вариант вставляем ПЕРВЫМ — код рендера берёт [0] как верный
        await db.insert(t_challengeOptions).values({ t_challengeId: ch.id, text: A(t.ans), correct: true })
        for (const w of t.wrong) await db.insert(t_challengeOptions).values({ t_challengeId: ch.id, text: A(w), correct: false })
    }
    const all = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, UNIT_ID), orderBy: asc(t_lessons.order) })
    const boss = all.find((l) => l.title === BOSS)
    const rest = all.filter((l) => l.id !== lesson.id && l.id !== boss?.id).map((l) => l.id)
    const finalOrder = [...rest, lesson.id, ...(boss ? [boss.id] : [])]
    for (let i = 0; i < finalOrder.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, finalOrder[i]))
    console.log(`Урок «${TITLE}»: id=${lesson.id}, задач=${TASKS.length}; уроков в юните: ${finalOrder.length}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
