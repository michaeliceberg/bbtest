// scripts/seedProbabilityUnit.ts
//
// Идемпотентно: блок «Вероятность» → юнит «Вероятность» (t_course 5 «ЕГЭ Математика», в конец списка)
// с тремя уроками SCENEWALK (контент — lib/scene-lessons/probability.tsx), ai_hint, связи с заданиями ЕГЭ №4 и №5.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_units, t_lessons, t_challenges } from "@/db/schema"

const T_COURSE = 5
const UNIT = 'Вероятность'
const LESSONS = [
    { title: 'Вероятность: подходящие / все', badge: '№4 ЕГЭ',
        hint: 'классическая вероятность (ЕГЭ №4): P = подходящие исходы / все исходы, от 0 до 1; противоположное событие «не» = 1 − P; жребий и порядок выступлений (8 из 20 → 0,4); рейсы вертолёта (6 мест из 30 → 0,2); насосы, билеты, конфеты' },
    { title: 'Монетки и кубики', badge: '№4 ЕГЭ',
        hint: 'перебор исходов (ЕГЭ №4): 2 монеты — 4 исхода (ОО, ОР, РО, РР), 3 монеты — 8, n монет — 2^n; «ровно один орёл», «хотя бы две решки»; два кубика — таблица 6×6 = 36 исходов, сумма очков, округление до сотых' },
    { title: 'И — умножаем, ИЛИ — складываем', badge: '№5 ЕГЭ',
        hint: 'вероятности сложных событий (ЕГЭ №5): независимые события «и» — умножаем (стрелок 0,8³), несовместные «или» — складываем; «хотя бы один» = 1 − «ни одного» (два продавца, автоматы); шахматист выигрывает обе партии; телефонный номер с двумя чётными цифрами' },
]

async function main() {
    let unit = await db.query.t_units.findFirst({ where: (u, { and, eq }) => and(eq(u.t_courseId, T_COURSE), eq(u.title, UNIT)) })
    if (!unit) {
        const last = await db.execute(sql`SELECT COALESCE(MAX("order"), 0)::int AS m FROM t_units WHERE t_course_id = ${T_COURSE}`) as unknown as { m: number }[]
        const [u] = await db.insert(t_units).values({ title: UNIT, description: 'Вероятность для ЕГЭ', imageSrc: '/unit-pics/probability.svg', t_courseId: T_COURSE, order: (last[0]?.m ?? 0) + 1 } as any).returning()
        unit = u as any
    }
    await db.execute(sql`UPDATE t_units SET block_title = ${UNIT} WHERE id = ${unit!.id}`)

    for (let i = 0; i < LESSONS.length; i++) {
        const L = LESSONS[i]
        const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, unit!.id), eq(l.title, L.title)) })
        if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
        const [lesson] = await db.insert(t_lessons).values({ title: L.title, t_unitId: unit!.id, order: i + 1, badge: L.badge } as any).returning({ id: t_lessons.id })
        await db.execute(sql`UPDATE t_lessons SET ai_hint = ${L.hint}, ege_part = 1 WHERE id = ${lesson.id}`)
        await db.insert(t_challenges).values({
            t_lessonId: lesson.id, type: 'SCENEWALK' as any, question: L.title, order: 1, points: 10,
            author: 'ЕГЭ Математика', numRans: '1', difficulty: '', imageSrc: '',
        })
        console.log(`«${L.title}» id=${lesson.id}`)
    }

    // Связи с заданиями ЕГЭ №4 и №5
    for (const num of [4, 5]) {
        await db.execute(sql`
            INSERT INTO ege_task_links (task_id, kind, ref_id)
            SELECT t.id, 't_unit', ${unit!.id} FROM ege_tasks t
            WHERE t.subject = 'math_profile' AND t.num = ${num}
              AND NOT EXISTS (SELECT 1 FROM ege_task_links l WHERE l.task_id = t.id AND l.kind = 't_unit' AND l.ref_id = ${unit!.id})`)
    }
    console.log(`unit id=${unit!.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
