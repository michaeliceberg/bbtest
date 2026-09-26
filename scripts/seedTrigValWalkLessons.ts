// scripts/seedTrigValWalkLessons.ts
//
// Два разбора по шагам в юнит «Таблица 30, 45, 60» (t_unit id=18, курс
// «ЕГЭ Математика»), см. app/t-lesson/[t_lessonId]/type-trigvalwalk.tsx:
//   «Три волшебных угла»          (TRIGSCWALK) — первым уроком юнита;
//   «Тангенс из синуса и косинуса» (TRIGTGWALK) — прямо перед уроком «Тангенс».
// Идемпотентно: при перезапуске старые копии этих уроков удаляются, порядок
// юнита пересчитывается заново.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_lessons, t_challenges } from "@/db/schema"

const UNIT_ID = 18
const SC_TITLE = "Три волшебных угла"
const TG_TITLE = "Тангенс из синуса и косинуса"
const TG_BEFORE = "Тангенс"

async function main() {
    for (const title of [SC_TITLE, TG_TITLE]) {
        const old = await db.query.t_lessons.findFirst({ where: (l, { and, eq }) => and(eq(l.t_unitId, UNIT_ID), eq(l.title, title)) })
        if (old) {
            await db.delete(t_lessons).where(eq(t_lessons.id, old.id))
            console.log(`Удалён старый «${title}» (id=${old.id})`)
        }
    }

    const create = async (title: string, type: string) => {
        const [lesson] = await db.insert(t_lessons).values({ title, t_unitId: UNIT_ID, order: 999 }).returning({ id: t_lessons.id })
        await db.insert(t_challenges).values({
            t_lessonId: lesson.id, type: type as any, question: title, order: 1, points: 10,
            author: "ЕГЭ Математика Профиль", numRans: '1', difficulty: '', imageSrc: '',
        })
        return lesson.id
    }
    const scId = await create(SC_TITLE, 'TRIGSCWALK')
    const tgId = await create(TG_TITLE, 'TRIGTGWALK')

    // Новый порядок: SC первым, TG перед «Тангенс», остальные — как были.
    const rest = (await db.query.t_lessons.findMany({
        where: (l, { eq }) => eq(l.t_unitId, UNIT_ID),
        orderBy: (l, { asc }) => asc(l.order),
    })).filter((l) => l.id !== scId && l.id !== tgId)
    const ordered: number[] = [scId]
    for (const l of rest) {
        if (l.title === TG_BEFORE) ordered.push(tgId)
        ordered.push(l.id)
    }
    if (!ordered.includes(tgId)) ordered.push(tgId)
    for (let i = 0; i < ordered.length; i++) {
        await db.update(t_lessons).set({ order: i + 1 }).where(eq(t_lessons.id, ordered[i]))
    }
    const final = await db.query.t_lessons.findMany({ where: (l, { eq }) => eq(l.t_unitId, UNIT_ID), orderBy: (l, { asc }) => asc(l.order) })
    final.forEach((l) => console.log(l.order, l.id, l.title))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
