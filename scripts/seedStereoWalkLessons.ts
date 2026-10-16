// Стереометрия после ТТП (блок «Стереометрия», t_course 5): два юнита с пошаговыми разборами STEREOWALK
// (app/t-lesson/[t_lessonId]/type-stereowalk.tsx, режим по тексту вопроса).
// Идемпотентно: добавляет enum, юниты и уроки, если их ещё нет; описания ai_hint для «ИИ-помощника».
import 'dotenv/config'
import db from '../db/drizzle'
import { sql } from 'drizzle-orm'

const T_COURSE = 5
const UNITS = [
    { title: 'Угол между прямой и плоскостью', order: 12, lesson: 'Угол прямой и плоскости', question: 'Угол между прямой и плоскостью',
      hint: 'угол между прямой и плоскостью = угол между прямой и её проекцией; перпендикуляр из точки прямой на плоскость, проекция OH, sin φ = AH/AO; пример: угол диагонали грани куба с основанием = 45°' },
    { title: 'Расстояние от точки до плоскости', order: 13, lesson: 'Расстояние до плоскости', question: 'Расстояние от точки до плоскости',
      hint: 'расстояние от точки до плоскости = длина перпендикуляра; перпендикуляр короче любой наклонной; через наклонную и проекцию по теореме Пифагора; в кубе — ребро' },
]

;(async () => {
    await db.execute(sql`ALTER TYPE "type" ADD VALUE IF NOT EXISTS 'STEREOWALK'`)
    for (const u of UNITS) {
        let [unit] = (await db.execute(sql`SELECT id FROM t_units WHERE t_course_id = ${T_COURSE} AND title = ${u.title}`)) as unknown as { id: number }[]
        if (!unit) {
            ;[unit] = (await db.execute(sql`INSERT INTO t_units (title, description, image_src, t_course_id, "order", block_title)
                VALUES (${u.title}, ${u.title}, '', ${T_COURSE}, ${u.order}, 'Стереометрия') RETURNING id`)) as unknown as { id: number }[]
        }
        let [lesson] = (await db.execute(sql`SELECT id FROM t_lessons WHERE t_unit_id = ${unit.id} AND title = ${u.lesson}`)) as unknown as { id: number }[]
        if (!lesson) {
            ;[lesson] = (await db.execute(sql`INSERT INTO t_lessons (title, t_unit_id, "order", ai_hint) VALUES (${u.lesson}, ${unit.id}, 1, ${u.hint}) RETURNING id`)) as unknown as { id: number }[]
            await db.execute(sql`INSERT INTO t_challenges (lesson_id, type, question, "order", points, author, num_r_ans, difficulty, image_src, stage)
                VALUES (${lesson.id}, 'STEREOWALK', ${u.question}, 1, 10, 'ЕГЭ Математика Профиль', '1', '', '', 1)`)
        } else {
            await db.execute(sql`UPDATE t_lessons SET ai_hint = ${u.hint} WHERE id = ${lesson.id}`)
        }
        console.log(u.title, 'unit', unit.id, 'lesson', lesson.id)
    }
    process.exit(0)
})()
