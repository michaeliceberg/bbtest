// Тренировочные (обычные M_ASC) уроки между степбайстеп-разборами темы
// "Логарифмы" (t_unit 16) + мифическая контрольная. Идемпотентно.
// Порядок: def, [A], add, sub, [B], pow, swap, [C], [Контрольная], div,
// combo, flip, [D], затем все старые уроки темы.
// У каждой задачи — верный ответ + авторские неверные варианты (correct=false),
// похожие на верный (см. mergeWrongTexts в app/t-lesson/[t_lessonId]/page.tsx).

import db from "@/db/drizzle"
import { eq, asc } from "drizzle-orm"
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema"

const UNIT_ID = 16
const AUTHOR = "ЕГЭ Математика Профиль"
type Task = { q: string; ans: string; wrong: string[] }

const L = (base: number | string, arg: number | string) => `\\log_{${base}}{${arg}}`
const Q = (expr: string) => `$ \\large ${expr} = ? $`
const A = (expr: string) => `$ ${expr} $`
const uniq = (arr: string[], correct: string) => Array.from(new Set(arr)).filter((x) => x !== correct)

// --- определение ---
const DEF: [number, number, number][] = [[2,8,3],[3,81,4],[5,25,2],[2,32,5],[10,1,0],[7,7,1],[2,64,6],[3,27,3],[4,16,2],[5,125,3],[6,36,2],[9,9,1]]
const defTask = ([a, x, r]: [number, number, number]): Task => {
    const ans = A(`${r}`)
    const wrong = [r + 1, r - 1, r + 2, a, r * 2].filter((n) => n >= 0 && n !== r).map((n) => A(`${n}`))
    return { q: Q(L(a, x)), ans, wrong: uniq(wrong, ans) }
}
// --- сумма ---
const ADD: [number, number, number][] = [[2,3,5],[5,14,3],[9,20,5],[3,6,4],[7,2,11],[2,7,3],[6,4,9],[5,8,3]]
const addTask = ([a, x, y]: [number, number, number]): Task => {
    const ans = A(L(a, x * y))
    const wrong = [L(a, x + y), L(a, Math.abs(x - y)), L(x * y, a), L(a, x * y + a)].map((e) => A(e))
    return { q: Q(`${L(a, x)} + ${L(a, y)}`), ans, wrong: uniq(wrong, ans) }
}
// --- разность (a, y, k): x = y*k ---
const SUB: [number, number, number][] = [[2,5,3],[3,4,9],[5,6,4],[7,3,5],[10,4,25],[2,3,7],[4,5,6],[6,2,9]]
const subTask = ([a, y, k]: [number, number, number]): Task => {
    const x = y * k
    const ans = A(L(a, k))
    const wrong = [L(a, x - y), L(a, x * y), L(a, x + y), L(k, a), L(a, k + 1)].map((e) => A(e))
    return { q: Q(`${L(a, x)} - ${L(a, y)}`), ans, wrong: uniq(wrong, ans) }
}
// --- степень в основании и аргументе (a,n,b,m) ---
const POW: [number, number, number, number][] = [[3,5,8,2],[4,2,5,3],[5,3,9,4],[2,3,7,5],[6,4,11,3],[3,2,10,7],[5,4,6,3],[2,5,9,2]]
const powTask = ([a, n, b, m]: [number, number, number, number]): Task => {
    const ans = A(`\\frac{${m}}{${n}} ${L(a, b)}`)
    const wrong = [`\\frac{${n}}{${m}} ${L(a, b)}`, `${m * n} ${L(a, b)}`, `\\frac{${m}}{${n}} ${L(b, a)}`, `${Math.abs(m - n) || m + n} ${L(a, b)}`].map((e) => A(e))
    return { q: Q(`\\log_{${a}^{${n}}} {${b}^{${m}}}`), ans, wrong: uniq(wrong, ans) }
}
// --- a^{log_b c} = c^{log_b a} ---
const SWAP: [number, number, number][] = [[7,5,9],[11,3,8],[2,9,13],[4,7,10],[6,2,15],[5,3,12],[13,4,7],[3,8,11]]
const swapTask = ([a, b, c]: [number, number, number]): Task => {
    const ans = A(`${c}^{ \\log_{${b}}{${a}} }`)
    const wrong = [`${c}^{ \\log_{${a}}{${b}} }`, `${b}^{ \\log_{${c}}{${a}} }`, `${a}^{ \\log_{${c}}{${b}} }`].map((e) => A(e))
    return { q: Q(`${a}^{ \\log_{${b}}{${c}} }`), ans, wrong: uniq(wrong, ans) }
}
// --- частное (a,x,y) : log_a x / log_a y = log_y x ---
const DIV: [number, number, number][] = [[5,27,3],[2,125,5],[7,64,4],[3,49,7],[6,81,9],[4,32,2]]
const divTask = ([a, x, y]: [number, number, number]): Task => {
    const ans = A(L(y, x))
    const wrong = [L(a, `\\frac{${x}}{${y}}`), L(x, y), L(a, y), `\\frac{${x}}{${y}}`, `${L(a, x)} - ${L(a, y)}`].map((e) => A(e))
    return { q: Q(`\\frac{${L(a, x)}}{${L(a, y)}}`), ans, wrong: uniq(wrong, ans) }
}
// --- комбо (a,b,c) : log_a b * log_b c = log_a c ---
const COMBO: [number, number, number][] = [[3,8,11],[5,12,19],[6,14,23],[2,7,9],[4,9,13],[7,3,10]]
const comboTask = ([a, b, c]: [number, number, number]): Task => {
    const ans = A(L(a, c))
    const wrong = [L(a, `${b * c}`), L(c, a), L(a, b + c), L(b, c), L(b, a)].map((e) => A(e))
    return { q: Q(`${L(a, b)} \\cdot ${L(b, c)}`), ans, wrong: uniq(wrong, ans) }
}
// --- перевёртыш (a,b) : log_a b = 1 / log_b a ---
const FLIP: [number, number][] = [[3,10],[5,12],[8,15],[2,9],[7,4],[6,13]]
const flipTask = ([a, b]: [number, number]): Task => {
    const ans = A(`\\frac{1}{${L(b, a)}}`)
    const wrong = [L(b, a), `\\frac{1}{${L(a, b)}}`, `-${L(b, a)}`, `\\frac{${b}}{${a}}`].map((e) => A(e))
    return { q: Q(L(a, b)), ans, wrong: uniq(wrong, ans) }
}

const take = <T,>(arr: T[], from: number, n: number) => arr.slice(from, from + n)

const LESSON_A = { title: "Определение логарифма — тренировка", tasks: take(DEF, 0, 8).map(defTask) }
const LESSON_B = { title: "Сумма и разность логарифмов — тренировка", tasks: [...take(ADD, 0, 5).map(addTask), ...take(SUB, 0, 5).map(subTask)] }
const LESSON_C = { title: "Степени и обмен местами — тренировка", tasks: [...take(POW, 0, 5).map(powTask), ...take(SWAP, 0, 5).map(swapTask)] }
const LESSON_K = {
    title: "Контрольная: мифический кейс",
    tasks: [
        ...take(DEF, 8, 4).map(defTask), ...take(ADD, 5, 3).map(addTask), ...take(SUB, 5, 3).map(subTask),
        ...take(POW, 5, 3).map(powTask), ...take(SWAP, 5, 3).map(swapTask), defTask(DEF[0]), powTask(POW[0]), swapTask(SWAP[0]), addTask(ADD[0]),
    ].slice(0, 20),
}
const LESSON_D = {
    title: "Частное, комбо и перевёртыш — тренировка",
    tasks: [...take(SWAP, 5, 3).map(swapTask), ...take(DIV, 0, 4).map(divTask), ...take(COMBO, 0, 4).map(comboTask), ...take(FLIP, 0, 4).map(flipTask)],
}

const WALK_ORDER = [466, 465, 467, 468, 469, 470, 471, 472] // def, add, sub, pow, swap, div, combo, flip

async function main() {
    const practice = [LESSON_A, LESSON_B, LESSON_C, LESSON_K, LESSON_D]
    for (const p of practice) {
        const ex = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, p.title)) })
        if (ex) await db.delete(t_lessons).where(eq(t_lessons.id, ex.id))
    }
    const created: Record<string, number> = {}
    for (const p of practice) {
        const [lesson] = await db.insert(t_lessons).values({ title: p.title, t_unitId: UNIT_ID, order: 999 }).returning({ id: t_lessons.id })
        created[p.title] = lesson.id
        for (let i = 0; i < p.tasks.length; i++) {
            const t = p.tasks[i]
            const [ch] = await db.insert(t_challenges).values({
                t_lessonId: lesson.id, type: 'M_ASC' as any, question: t.q, order: i + 1, points: 10,
                author: AUTHOR, numRans: '1', difficulty: '1', imageSrc: '0',
            }).returning({ id: t_challenges.id })
            // верный вариант вставляем ПЕРВЫМ — код рендера берёт [0] как верный
            await db.insert(t_challengeOptions).values({ t_challengeId: ch.id, text: t.ans, correct: true })
            for (const w of t.wrong) await db.insert(t_challengeOptions).values({ t_challengeId: ch.id, text: w, correct: false })
        }
        console.log(`${p.title}: id=${lesson.id}, задач=${p.tasks.length}`)
    }
    const seq = [
        WALK_ORDER[0], created[LESSON_A.title], WALK_ORDER[1], WALK_ORDER[2], created[LESSON_B.title],
        WALK_ORDER[3], WALK_ORDER[4], created[LESSON_C.title], created[LESSON_K.title],
        WALK_ORDER[5], WALK_ORDER[6], WALK_ORDER[7], created[LESSON_D.title],
    ]
    const all = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, UNIT_ID), orderBy: asc(t_lessons.order) })
    const rest = all.filter((l) => !seq.includes(l.id)).map((l) => l.id)
    const finalOrder = [...seq, ...rest]
    for (let i = 0; i < finalOrder.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, finalOrder[i]))
    console.log("Порядок обновлён:", finalOrder.length, "уроков")
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
