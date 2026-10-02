// Объединение юнитов «Тригонометрическая окружность» (t_unit 30) и
// «Таблица 30, 45, 60» (t_unit 18) в один юнит (2026-10-03, просьба пользователя:
// «не разбивать тригонометрию на разобщённое количество упражнений»).
//
// Порядок уроков в юните 30:
//   1. 490 Знакомство с окружностью (разбор)
//   2. «Окружность — тренировка» (M_ASC по заданиям урока 490)
//   3. 488 Три волшебных угла (разбор)
//   4. 489 Тангенс (разбор)
//   5. «Таблица 30°, 45°, 60° — тренировка» (M_ASC по заданиям 488 и 489)
//   6. 454 Секторы, 7. 443 Точки на окружности: оси, 8. 449 Углы: sin/cos = дробь 2
// Остальные уроки обоих юнитов уезжают в скрытый архивный юнит (t_course 1 —
// скрыт в тренажёре), данные и прогресс не удаляются. Юнит 18 удаляется (пустой).
// «Геометрия: sin, cos, tg» открывается после 5-го урока юнита 30,
// «Как записать ответ» — после всего юнита 30. Идемпотентно.

import 'dotenv/config'
import db from '@/db/drizzle'
import { and, eq, inArray } from 'drizzle-orm'
import { t_units, t_lessons, t_challenges, t_challengeOptions } from '@/db/schema'

const UNIT = 30
const OLD_TABLE_UNIT = 18
const ARCHIVE_COURSE = 1
const ARCHIVE_TITLE = 'Архив: тригонометрия'
const AUTHOR = 'ЕГЭ Математика Профиль'
const CIRCLE_TRAIN = 'Окружность — тренировка'
const TABLE_TRAIN = 'Таблица 30°, 45°, 60° — тренировка'

type Task = { q: string; ans: string; wrong: string[] }
const V = ['$-1$', '$0$', '$1$']
const val = (q: string, ans: string): Task => ({ q, ans, wrong: V.filter((x) => x !== ans) })

const CIRCLE_TASKS: Task[] = [
    val('$\\sin \\dfrac{\\pi}{2} = ?$', '$1$'),
    val('$\\cos \\dfrac{\\pi}{2} = ?$', '$0$'),
    val('$\\sin \\pi = ?$', '$0$'),
    val('$\\cos \\pi = ?$', '$-1$'),
    val('$\\sin \\dfrac{3\\pi}{2} = ?$', '$-1$'),
    val('$\\cos 0 = ?$', '$1$'),
    val('$\\cos 2\\pi = ?$', '$1$'),
    val('$\\sin \\left(-\\dfrac{\\pi}{2}\\right) = ?$', '$-1$'),
    val('$\\cos \\left(-\\dfrac{\\pi}{2}\\right) = ?$', '$0$'),
    val('$\\sin \\dfrac{5\\pi}{2} = ?$', '$1$'),
    { q: '$\\pi$ это', ans: '$180°$', wrong: ['$90°$', '$360°$', '$\\pi°$'] },
    { q: '$\\dfrac{\\pi}{2}$ это', ans: '$90°$', wrong: ['$180°$', '$45°$', '$270°$'] },
    { q: '$2\\pi$ это', ans: '$360°$', wrong: ['$180°$', '$720°$', '$90°$'] },
]

const S1 = '$\\dfrac{1}{2}$', S2 = '$\\dfrac{\\sqrt{2}}{2}$', S3 = '$\\dfrac{\\sqrt{3}}{2}$'
const T1 = '$\\dfrac{1}{\\sqrt{3}}$', T2 = '$1$', T3 = '$\\sqrt{3}$'
const SC = [S1, S2, S3]
const TG = [T1, T2, T3]
const sc = (q: string, ans: string): Task => ({ q, ans, wrong: SC.filter((x) => x !== ans) })
const tg = (q: string, ans: string): Task => ({ q, ans, wrong: [...TG.filter((x) => x !== ans), S3] })

const TABLE_TASKS: Task[] = [
    sc('$\\sin 30° = ?$', S1),
    sc('$\\sin 45° = ?$', S2),
    sc('$\\sin 60° = ?$', S3),
    sc('$\\cos 30° = ?$', S3),
    sc('$\\cos 45° = ?$', S2),
    sc('$\\cos 60° = ?$', S1),
    tg('$tg\\ 30° = ?$', T1),
    tg('$tg\\ 45° = ?$', T2),
    tg('$tg\\ 60° = ?$', T3),
    { q: '$tg\\ 30° = \\dfrac{\\sin 30°}{\\cos 30°} = ?$', ans: T1, wrong: [T3, '$\\dfrac{\\sqrt{3}}{4}$', T2] },
]

const ensureLesson = async (title: string, tasks: Task[]) => {
    const existing = await db.query.t_lessons.findFirst({ where: and(eq(t_lessons.t_unitId, UNIT), eq(t_lessons.title, title)) })
    const lessonId = existing
        ? existing.id
        : (await db.insert(t_lessons).values({ title, t_unitId: UNIT, order: 999 }).returning({ id: t_lessons.id }))[0].id
    await db.delete(t_challenges).where(eq(t_challenges.t_lessonId, lessonId))
    for (const [i, t] of tasks.entries()) {
        const [c] = await db.insert(t_challenges).values({
            t_lessonId: lessonId, type: 'M_ASC', question: t.q, order: i + 1, points: 10, author: AUTHOR, numRans: '1', difficulty: '1', imageSrc: '0',
        }).returning({ id: t_challenges.id })
        // Верный — первым (рендер берёт [0] как верный), затем авторские неверные.
        await db.insert(t_challengeOptions).values([
            { t_challengeId: c.id, text: t.ans, correct: true },
            ...t.wrong.map((w) => ({ t_challengeId: c.id, text: w, correct: false })),
        ])
    }
    return lessonId
}

const main = async () => {
    const circleTrain = await ensureLesson(CIRCLE_TRAIN, CIRCLE_TASKS)
    const tableTrain = await ensureLesson(TABLE_TRAIN, TABLE_TASKS)
    const ORDER = [490, circleTrain, 488, 489, tableTrain, 454, 443, 449]

    // Архивный юнит в скрытом курсе.
    let archive = await db.query.t_units.findFirst({ where: and(eq(t_units.t_courseId, ARCHIVE_COURSE), eq(t_units.title, ARCHIVE_TITLE)) })
    if (!archive) {
        ;[archive] = await db.insert(t_units).values({
            title: ARCHIVE_TITLE, description: 'Старые уроки тригонометрии (не показываются)', imageSrc: '', t_courseId: ARCHIVE_COURSE, order: 990,
        }).returning()
    }

    // Все уроки обоих юнитов: нужные — по порядку в юнит 30, прочие — в архив.
    const all = await db.query.t_lessons.findMany({ where: inArray(t_lessons.t_unitId, [UNIT, OLD_TABLE_UNIT]) })
    let archiveOrder = 1
    for (const l of all.sort((a, b) => a.t_unitId - b.t_unitId || a.order - b.order)) {
        const idx = ORDER.indexOf(l.id)
        if (idx >= 0) {
            await db.update(t_lessons).set({ t_unitId: UNIT, order: idx + 1, extraUnlockAfterTUnitId: null }).where(eq(t_lessons.id, l.id))
        } else {
            await db.update(t_lessons).set({ t_unitId: archive!.id, order: archiveOrder++, extraUnlockAfterTUnitId: null }).where(eq(t_lessons.id, l.id))
        }
    }

    // Зависимости юнитов: геометрия — после таблицы (урок 5), «Как записать ответ» — после всего юнита.
    await db.update(t_units).set({ unlockAfterTUnitId: UNIT, unlockAfterLessonOrder: 5 }).where(eq(t_units.id, 14))
    await db.update(t_units).set({ unlockAfterTUnitId: UNIT, unlockAfterLessonOrder: null }).where(eq(t_units.id, 15))

    const left = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, OLD_TABLE_UNIT) })
    if (left.length === 0) await db.delete(t_units).where(eq(t_units.id, OLD_TABLE_UNIT))

    const res = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, UNIT) })
    console.log(res.sort((a, b) => a.order - b.order).map((l) => `${l.order}. ${l.id} ${l.title}`).join('\n'))
    process.exit(0)
}
main()
