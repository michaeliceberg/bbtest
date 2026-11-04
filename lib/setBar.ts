import 'server-only'

// lib/setBar.ts — данные для полоски «Сета» в шапке /trainer и /learn (components/set-bar.tsx).
// Сет = «ход» из «Моего пути» (lib/egeMove.ts): закуска — урок тренажёра, основное — задачи задачника,
// десерт — кейс. Пока только для курсов «ЕГЭ Математика…» (ход строится по карте профильной математики).
//
// Урок/задачи, решённые не по ссылке сета, тоже засчитываются: шаг продвигается здесь лениво.

import { sql, and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { egeMoves } from '@/db/schema'
import { getActiveEgeMove, getUnclaimedMoveCase, getEgeMove, moveTaskStatus, nextStepAfter, setNumberToday, setTierOf, type EgeMoveRow } from '@/lib/egeMove'
import type { LessonCaseTier } from '@/lib/caseRewards'

export type SetBarData = {
    moveId: number | null // null — сета нет, по кнопке соберём новый
    taskNum: number | null
    taskTitle: string | null
    step: 'trainer' | 'trainer2' | 'tasks' | 'done' | 'none'
    hasTrainer: boolean
    tLessonId: number | null
    trainerTitle: string | null
    tLessonId2: number | null // «2 тренажёра»: основное блюдо — второй урок тренажёра, а не задачи
    trainer2Title: string | null
    tier: LessonCaseTier // какой сундук в десерте этого сета (растёт с числом сетов за день)
    setNumber: number // какой это сет сегодня по счёту
    tasksDone: number
    tasksTotal: number
    caseClaimed: boolean
}

type Row = Record<string, unknown>

export const isSetCourse = (courseTitle?: string | null) => !!courseTitle?.startsWith('ЕГЭ Математика')

async function lessonDoneSince(userId: string, tLessonId: number, since: Date) {
    const r = (await db.execute(sql`
        SELECT 1 FROM t_lesson_progress
        WHERE user_id = ${userId} AND t_lesson_id = ${tLessonId} AND training_pts > 0
          AND date_done >= ${since.toISOString()} LIMIT 1`)) as unknown as Row[]
    return r.length > 0
}

async function catchUp(m: EgeMoveRow, userId: string): Promise<EgeMoveRow> {
    let cur = m
    for (const [step, lessonId] of [['trainer', cur.tLessonId], ['trainer2', cur.tLessonId2]] as const) {
        if (cur.step !== step || !lessonId) continue
        if (!(await lessonDoneSince(userId, lessonId, cur.createdAt))) continue
        const next = nextStepAfter(cur, step)
        await db.update(egeMoves).set({ step: next, finishedAt: next === 'done' ? new Date() : null })
            .where(and(eq(egeMoves.id, cur.id), eq(egeMoves.step, step)))
        cur = { ...cur, step: next, finishedAt: next === 'done' ? new Date() : null }
    }
    if (cur.step === 'tasks') {
        const st = await moveTaskStatus(cur, userId)
        if (st.target > 0 && st.correct >= st.target) {
            await db.update(egeMoves).set({ step: 'done', finishedAt: new Date() })
                .where(and(eq(egeMoves.id, cur.id), eq(egeMoves.step, 'tasks')))
            cur = { ...cur, step: 'done' }
        }
    }
    return cur
}

export async function getSetBarData(userId: string, courseTitle?: string | null): Promise<SetBarData | null> {
    if (!isSetCourse(courseTitle)) return null
    try {
        let m = await getActiveEgeMove(userId)
        if (!m) {
            // законченный сет с неоткрытым кейсом — показываем десерт
            const unclaimed = await getUnclaimedMoveCase(userId)
            if (unclaimed) m = await getEgeMove(unclaimed.id, userId)
        }
        if (!m) {
            const n = await setNumberToday(userId, null)
            return { moveId: null, taskNum: null, taskTitle: null, step: 'none', hasTrainer: false, tLessonId: null, trainerTitle: null, tLessonId2: null, trainer2Title: null, tier: setTierOf(n), setNumber: n, tasksDone: 0, tasksTotal: 0, caseClaimed: false }
        }
        m = await catchUp(m, userId)
        const [titleRows, title2Rows, taskRows, st, n] = await Promise.all([
            m.tLessonId ? db.execute(sql`SELECT title FROM t_lessons WHERE id = ${m.tLessonId}`) : Promise.resolve([]),
            m.tLessonId2 ? db.execute(sql`SELECT title FROM t_lessons WHERE id = ${m.tLessonId2}`) : Promise.resolve([]),
            db.execute(sql`SELECT title FROM ege_tasks WHERE subject = 'math_profile' AND num = ${m.taskNum} LIMIT 1`),
            moveTaskStatus(m, userId),
            setNumberToday(userId, m),
        ])
        const t = (titleRows as unknown as Row[])[0]
        const t2 = (title2Rows as unknown as Row[])[0]
        const task = (taskRows as unknown as Row[])[0]
        return {
            moveId: m.id,
            taskNum: m.taskNum,
            taskTitle: task ? String(task.title) : null,
            step: m.step as 'trainer' | 'trainer2' | 'tasks' | 'done',
            hasTrainer: !!m.tLessonId,
            tLessonId: m.tLessonId,
            trainerTitle: t ? String(t.title) : null,
            tLessonId2: m.tLessonId2,
            trainer2Title: t2 ? String(t2.title) : null,
            tier: setTierOf(n),
            setNumber: n,
            tasksDone: Math.min(st.correct, st.target),
            tasksTotal: st.target,
            caseClaimed: m.caseClaimed,
        }
    } catch (e) {
        console.error('getSetBarData', e)
        return null
    }
}
