// scripts/seedEgeMapMath2027.ts
//
// Карта ЕГЭ («Мой путь») для профильной математики по структуре 2027: 20 заданий,
// 33 первичных балла. Связи «задание → юнит задачника / тема тренажёра».
// Задания без связей (№17, №19, №20) на экране показываются «скоро».
// №6 и №13 — юниты 128/129 (scripts/seedEGEMath-unit6-unit13.ts, 2026-10-11).
// Идемпотентно: пересоздаёт задания и связи предмета.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { egeTasks, egeTaskLinks } from "@/db/schema"

const SUBJECT = 'math_profile'

// [номер, название, баллы, часть, юниты задачника, темы тренажёра]
const TASKS: [number, string, number, number, number[], number[]][] = [
    [1, 'Планиметрия', 1, 1, [92], [14, 34]],
    [2, 'Векторы', 1, 1, [99], []],
    [3, 'Стереометрия', 1, 1, [125], [35]],
    [4, 'Вероятность', 1, 1, [93], []],
    [5, 'Вероятность сложных событий', 1, 1, [100], []],
    [6, 'Случайная величина, мат. ожидание', 1, 1, [128], []],
    [7, 'Уравнения', 1, 1, [91], [16, 31, 30]],
    [8, 'Вычисления и преобразования', 1, 1, [94], [16, 30, 33]],
    [9, 'Производная', 1, 1, [95, 98], []],
    [10, 'Прикладные задачи', 1, 1, [101], []],
    [11, 'Текстовые задачи', 1, 1, [96], []],
    [12, 'Графики функций', 1, 1, [97], []],
    [13, 'Финансовая задача', 1, 1, [129], []],
    [14, 'Уравнения (развёрнутый ответ)', 2, 2, [], [30, 33, 15]],
    [15, 'Стереометрия (развёрнутый ответ)', 3, 2, [], [35]],
    [16, 'Неравенства', 2, 2, [], [16]],
    [17, 'Моделирование', 2, 2, [], []],
    [18, 'Планиметрия (развёрнутый ответ)', 3, 2, [], [34]],
    [19, 'Параметр', 4, 2, [], []],
    [20, 'Теория чисел', 4, 2, [], []],
]

async function main() {
    await db.delete(egeTasks).where(eq(egeTasks.subject, SUBJECT))
    for (const [num, title, points, part, units, tunits] of TASKS) {
        const [t] = await db.insert(egeTasks).values({ subject: SUBJECT, num, title, points, part }).returning({ id: egeTasks.id })
        const links = [...units.map((r) => ({ taskId: t.id, kind: 'unit', refId: r })), ...tunits.map((r) => ({ taskId: t.id, kind: 't_unit', refId: r }))]
        if (links.length) await db.insert(egeTaskLinks).values(links)
    }
    console.log('Карта:', TASKS.length, 'заданий, всего баллов', TASKS.reduce((s, t) => s + t[2], 0))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
