import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { getTrainerKeysByTask } from '@/lib/egeTrainerLinks'
import { getEgeMap } from '@/lib/egeMap'
import { getRamboStatus, type RamboCell } from '@/lib/rambo'

// Данные «Линейки ЕГЭ» (components/ege-ruler.tsx): на каждое задание 1–20 — подразделы задачника
// (уроки юнитов, привязанных к заданию через ege_task_links kind='unit') с долей решённых задач
// и темы тренажёра (kind='t_unit') с процентом как у медали. proLocked — подраздел закрыт без PRO.

export type RulerLesson = { id: number; title: string; total: number; solved: number; proLocked: boolean }
export type RulerTrainer = { tUnitId: number; title: string; percent: number; proLocked: boolean }
// rambo — 4 клетки режима «Рэмбо» (lib/rambo.ts), ramboAvailable — есть ли задания для смеси.
export type RulerTask = { num: number; title: string; part: number; lessons: RulerLesson[]; trainers: RulerTrainer[]; rambo: RamboCell[]; ramboAvailable: boolean }
// test — прогноз ЕГЭ в тестовых баллах (как в «Моём пути»), currentTaskNum — задание, где ученик сейчас (стрелка).
export type RulerData = { tasks: RulerTask[]; setTaskNum: number | null; test: number; currentTaskNum: number | null }

type Row = Record<string, unknown>

export async function getEgeRulerData(userId: string, opts: { hasPro: boolean; setTaskNum?: number | null; currentTaskNum?: number | null }): Promise<RulerData> {
    const [taskRows, lessonRows, tLessonCounts, trainerKeys, egeMap] = await Promise.all([
        db.execute(sql`SELECT num, title, part FROM ege_tasks WHERE subject = 'math_profile' ORDER BY num`),
        db.execute(sql`
            SELECT t.num, l.id, l.title, l."order", u."order" AS unit_order,
                (SELECT count(*) FROM challenges c WHERE c.lesson_id = l.id) AS total,
                (SELECT count(DISTINCT c.id) FROM challenges c JOIN challenge_progress p ON p.challenge_id = c.id
                    WHERE c.lesson_id = l.id AND p.user_id = ${userId} AND p.completed) AS solved
            FROM ege_task_links k
            JOIN ege_tasks t ON t.id = k.task_id
            JOIN units u ON u.id = k.ref_id
            JOIN lessons l ON l.unit_id = u.id
            WHERE k.kind = 'unit' AND t.subject = 'math_profile'
            ORDER BY t.num, u."order", l."order"`),
        db.execute(sql`SELECT t_unit_id, count(*) AS n FROM t_lessons GROUP BY t_unit_id`),
        getTrainerKeysByTask(userId),
        getEgeMap(userId, 'math_profile').catch(() => null),
    ])
    const rambo = await getRamboStatus(userId, opts.hasPro, trainerKeys).catch(() => ({} as Awaited<ReturnType<typeof getRamboStatus>>))
    const lessonCount = new Map((tLessonCounts as unknown as Row[]).map((r) => [Number(r.t_unit_id), Number(r.n)]))
    const byNum = new Map<number, RulerLesson[]>()
    for (const r of lessonRows as unknown as Row[]) {
        const num = Number(r.num)
        const arr = byNum.get(num) ?? []
        // Вторая часть задачника (14–20) — только PRO.
        arr.push({ id: Number(r.id), title: String(r.title), total: Number(r.total), solved: Number(r.solved), proLocked: !opts.hasPro && num >= 14 })
        byNum.set(num, arr)
    }
    const tasks = (taskRows as unknown as Row[]).map((r) => {
        const num = Number(r.num)
        return {
            num,
            title: String(r.title),
            part: Number(r.part),
            lessons: byNum.get(num) ?? [],
            // Бесплатно — первый урок темы; если уроков больше одного, тема без PRO целиком не пройти.
            trainers: (trainerKeys[num] ?? []).map((k) => ({ ...k, proLocked: !opts.hasPro && (lessonCount.get(k.tUnitId) ?? 0) > 1 })),
            rambo: rambo[num]?.cells ?? [],
            ramboAvailable: !!rambo[num]?.available,
        }
    })
    return { tasks, setTaskNum: opts.setTaskNum ?? null, test: egeMap?.test ?? 0, currentTaskNum: opts.currentTaskNum ?? null }
}
