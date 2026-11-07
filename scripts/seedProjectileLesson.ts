// scripts/seedProjectileLesson.ts
//
// Идемпотентно: юнит «Кинематика» тренажёра «ЕГЭ Физика» (t_unit 5) → первым уроком пошаговый разбор
// «Бросок под углом к горизонту» (SCENEWALK, контент — lib/scene-lessons/projectile.tsx). Остальные уроки сдвигаются.

import db from "@/db/drizzle"
import { eq, sql } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 5
const TITLE = 'Бросок под углом к горизонту'
const HINT = 'бросок под углом к горизонту: скорость раскладывается на проекции vₓ = v₀cos α и vᵧ = v₀sin α; гравитация g действует только по оси y, поэтому vₓ не меняется, а vᵧ каждую секунду уменьшается на g (вверх), потом растёт вниз; в верхней точке vᵧ = 0, время подъёма v₀sin α / g, полёт вдвое дольше; x = v₀cos α · t, y = v₀sin α · t − gt²/2'

async function main() {
    const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, TITLE)) })
    if (old) await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
    else await db.execute(sql`UPDATE t_lessons SET "order" = "order" + 1 WHERE t_unit_id = ${UNIT_ID}`)
    const [lesson] = await db.insert(t_lessons).values({ title: TITLE, t_unitId: UNIT_ID, order: 1, badge: 'vₓ и vᵧ' } as any).returning({ id: t_lessons.id })
    await db.execute(sql`UPDATE t_lessons SET ai_hint = ${HINT}, ege_part = 1 WHERE id = ${lesson.id}`)
    await db.insert(t_challenges).values({
        t_lessonId: lesson.id, type: 'SCENEWALK' as any, question: TITLE, order: 1, points: 10,
        author: 'ЕГЭ Физика', numRans: '1', difficulty: '', imageSrc: '',
    })
    console.log(`«${TITLE}» id=${lesson.id}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
