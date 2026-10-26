// scripts/seedSceneLogLessons.ts
//
// Идемпотентно:
//  1) колонка t_lessons.ege_part (1 — база, 2 — вторая часть ЕГЭ) + enum SCENEWALK;
//  2) в тему «Логарифмы» (t_unit 16) два урока SCENEWALK (контент — lib/scene-lessons):
//     «Отрицательные степени в логарифмах» — сразу после первого урока-тренировки,
//     «Логарифмические неравенства» — перед босс-экзаменом (вторая часть ЕГЭ);
//  3) разметка частей: в курсе «ЕГЭ Математика» (t_course 5) все пошаговые уроки — база, кроме неравенств,
//     Менелая и блока «Стереометрия» (задания 15–18 — вторая часть).

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const LOG_UNIT = 16
const NEW = [
    { title: 'Отрицательные степени в логарифмах', badge: 'log₂ ⅛ = −3', part: 1,
        hint: 'логарифмы с отрицательными степенями и дробями: a⁻ⁿ = 1/aⁿ, log₂(1/8) = −3, log₈(1/2) = −1/3, log_{1/2} 16 = −4, приведение к одному основанию', place: 'afterFirstTraining' },
    { title: 'Логарифмические неравенства', badge: '№16 ЕГЭ', part: 2,
        hint: 'логарифмические неравенства (ЕГЭ №16): знак log_a b по правилу единицы (a и b по одну сторону от 1 — плюс), метод рационализации: log_{f} g ∨ 0 ⇔ f > 0, g > 0, f ≠ 1, (f − 1)(g − 1) ∨ 0', place: 'beforeBoss' },
]
const STEP_TYPES = ['SINWALK','LOGWALK','LOGDEFWALK','LOGSUBWALK','LOGPOWWALK','LOGSWAPWALK','LOGDIVWALK','LOGCOMBOWALK','LOGFLIPWALK','SINCOSDEFWALK','LEGFINDWALK','HYPFINDWALK','SIMWALK','TRIGSCWALK','TRIGTGWALK','TRIGCIRCWALK','REDFORMWALK','TTPWALK','STEREOWALK','TRIGANSWALK','VIETAWALK','CIRCLEWALK','AREA6WALK','POWWALK','SECTWALK','PROPWALK','LINEWALK','MENELAUSWALK','SCENEWALK']

async function main() {
    await db.execute(sql.raw(`ALTER TABLE t_lessons ADD COLUMN IF NOT EXISTS ege_part integer`))
    await db.execute(sql.raw(`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'SCENEWALK'`))

    for (const L of NEW) {
        const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, LOG_UNIT), eq(l.title, L.title)) })
        if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
        const all = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, LOG_UNIT), orderBy: (l, { asc }) => asc(l.order) })
        let pos = all.length
        if (L.place === 'afterFirstTraining') { const i = all.findIndex((l) => /тренировка/i.test(l.title)); pos = i >= 0 ? i + 1 : 1 }
        if (L.place === 'beforeBoss') { const i = all.findIndex((l) => /босс-экзамен/i.test(l.title)); pos = i >= 0 ? i : all.length }
        const [lesson] = await db.insert(t_lessons).values({ title: L.title, t_unitId: LOG_UNIT, order: 999, badge: L.badge } as any).returning({ id: t_lessons.id })
        await db.execute(sql`UPDATE t_lessons SET ai_hint = ${L.hint}, ege_part = ${L.part} WHERE id = ${lesson.id}`)
        await db.insert(t_challenges).values({
            t_lessonId: lesson.id, type: 'SCENEWALK' as any, question: L.title, order: 1, points: 10,
            author: 'ЕГЭ Математика', numRans: '1', difficulty: '', imageSrc: '',
        })
        const ordered = [...all.slice(0, pos).map((l) => l.id), lesson.id, ...all.slice(pos).map((l) => l.id)]
        for (let i = 0; i < ordered.length; i++) await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, ordered[i]))
        console.log(`«${L.title}» id=${lesson.id}, order=${pos + 1}`)
    }

    // Разметка частей ЕГЭ для пошаговых уроков курса «ЕГЭ Математика»
    const typeList = sql.join(STEP_TYPES.map((t) => sql`${t}`), sql`, `)
    await db.execute(sql`
        UPDATE t_lessons l SET ege_part = CASE
            WHEN u.block_title = 'Стереометрия' OR l.title IN ('Теорема Менелая', 'Логарифмические неравенства') THEN 2 ELSE 1 END
        FROM t_units u
        WHERE l.t_unit_id = u.id AND u.t_course_id = ${T_COURSE}
          AND EXISTS (SELECT 1 FROM t_challenges c WHERE c.lesson_id = l.id AND c.type::text IN (${typeList}))`)
    const res = await db.execute(sql`SELECT l.ege_part, count(*)::int AS n FROM t_lessons l JOIN t_units u ON u.id = l.t_unit_id WHERE u.t_course_id = ${T_COURSE} AND l.ege_part IS NOT NULL GROUP BY 1 ORDER BY 1`)
    console.log('ege_part:', JSON.stringify(res))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
