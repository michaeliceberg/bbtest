import 'server-only'

// lib/setBar.ts — данные для полоски «Сета» в шапке /trainer и /learn (components/set-bar.tsx).
// Сет = «ход» из «Моего пути» (lib/egeMove.ts): закуска — урок тренажёра, основное — задачи задачника,
// десерт — кейс. Пока только для курсов «ЕГЭ Математика…» (ход строится по карте профильной математики).
//
// Урок/задачи, решённые не по ссылке сета, тоже засчитываются: шаг продвигается здесь лениво.

import { sql, and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { egeMoves } from '@/db/schema'
import { getActiveEgeMove, getUnclaimedMoveCase, getEgeMove, moveTaskStatus, nextStepAfter, type EgeMoveRow } from '@/lib/egeMove'

export type SetBarData = {
    moveId: number | null // null — сета нет, по кнопке соберём новый
    taskNum: number | null
    taskTitle: string | null
    step: 'trainer' | 'tasks' | 'done' | 'none'
    hasTrainer: boolean
    tLessonId: number | null
    trainerTitle: string | null
    tasksDone: number
    tasksTotal: number
    caseClaimed: boolean
}

type Row = Record<string, unknown>

export const isSetCourse = (courseTitle?: string | null) => !!courseTitle?.startsWith('ЕГЭ Математика')

async function catchUp(m: EgeMoveRow, userId: string): Promise<EgeMoveRow> {
    let cur = m
    if (cur.step === 'trainer' && cur.tLessonId) {
        const r = (await db.execute(sql`
            SELECT 1 FROM t_lesson_progress
            WHERE user_id = ${userId} AND t_lesson_id = ${cur.tLessonId} AND training_pts > 0
              AND date_done >= ${cur.createdAt.toISOString()} LIMIT 1`)) as unknown as Row[]
        if (r.length) {
            const next = nextStepAfter(cur, 'trainer')
            await db.update(egeMoves).set({ step: next, finishedAt: next === 'done' ? new Date() : null })
                .where(and(eq(egeMoves.id, cur.id), eq(egeMoves.step, 'trainer')))
            cur = { ...cur, step: next }
        }
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
            return { moveId: null, taskNum: null, taskTitle: null, step: 'none', hasTrainer: false, tLessonId: null, trainerTitle: null, tasksDone: 0, tasksTotal: 0, caseClaimed: false }
        }
        m = await catchUp(m, userId)
        const [titleRows, taskRows, st] = await Promise.all([
            m.tLessonId ? db.execute(sql`SELECT title FROM t_lessons WHERE id = ${m.tLessonId}`) : Promise.resolve([]),
            db.execute(sql`SELECT title FROM ege_tasks WHERE subject = 'math_profile' AND num = ${m.taskNum} LIMIT 1`),
            moveTaskStatus(m, userId),
        ])
        const t = (titleRows as unknown as Row[])[0]
        const task = (taskRows as unknown as Row[])[0]
        return {
            moveId: m.id,
            taskNum: m.taskNum,
            taskTitle: task ? String(task.title) : null,
            step: m.step as 'trainer' | 'tasks' | 'done',
            hasTrainer: !!m.tLessonId,
            tLessonId: m.tLessonId,
            trainerTitle: t ? String(t.title) : null,
            tasksDone: Math.min(st.correct, st.target),
            tasksTotal: st.target,
            caseClaimed: m.caseClaimed,
        }
    } catch (e) {
        console.error('getSetBarData', e)
        return null
    }
}
