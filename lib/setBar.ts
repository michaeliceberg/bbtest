import 'server-only'

// lib/setBar.ts — данные для полоски «Сета» в шапке /trainer и /learn (components/set-bar.tsx).
// Сет = «ход» из «Моего пути» (lib/egeMove.ts): закуска — урок тренажёра, основное — задачи задачника,
// десерт — кейс. Пока только для курсов «ЕГЭ Математика…» (ход строится по карте профильной математики).
//
// Урок/задачи, решённые не по ссылке сета, тоже засчитываются: шаг продвигается здесь лениво.

import { sql, and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { egeMoves } from '@/db/schema'
import { getActiveEgeMove, getUnclaimedMoveCase, getEgeMove, moveChallengeIds, moveTaskStatus, nextStepAfter, setNumberToday, setTierOf, type EgeMoveRow } from '@/lib/egeMove'
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
    preview: SetPreview | null // что ждёт в текущем блюде — показываем под Мигелем в панели
}

// Превью текущего блюда — без текста, чтобы с одного взгляда было понятно, о чём урок:
// урок тренажёра — своя картинка (t_lessons.preview_src) → рисунок из последнего задания с рисунком →
// крупная формула-ответ последнего задания → картинка темы; задачи — первая задача сета из задачника
export type SetPreview =
    | { kind: 'image'; src: string }
    | { kind: 'formula'; tex: string }
    | { kind: 'task'; question: string; image: string | null }

async function lessonPreview(tLessonId: number): Promise<SetPreview | null> {
    const r = (await db.execute(sql`
        SELECT l.preview_src, u.image_src AS unit_img,
            (SELECT c.image_src FROM t_challenges c WHERE c.lesson_id = l.id AND c.image_src NOT IN ('', '0')
             ORDER BY c."order" DESC LIMIT 1) AS ch_img,
            (SELECT o.text FROM t_challenges c JOIN t_challenge_options o ON o.t_challenge_id = c.id
             WHERE c.lesson_id = l.id AND o.correct AND o.text LIKE '%$%' AND length(o.text) >= 8
             ORDER BY c."order" DESC, o.id LIMIT 1) AS formula
        FROM t_lessons l JOIN t_units u ON u.id = l.t_unit_id
        WHERE l.id = ${tLessonId}`)) as unknown as Row[]
    const row = r[0]
    if (!row) return null
    const str = (v: unknown) => (v ? String(v) : '')
    if (str(row.preview_src)) return { kind: 'image', src: str(row.preview_src) }
    if (str(row.ch_img)) return { kind: 'image', src: `/trainer-images/${str(row.ch_img)}` }
    if (str(row.formula)) return { kind: 'formula', tex: str(row.formula) }
    if (str(row.unit_img).startsWith('/')) return { kind: 'image', src: str(row.unit_img) }
    return null
}

async function taskPreview(m: EgeMoveRow): Promise<SetPreview | null> {
    const id = moveChallengeIds(m)[0]
    if (!id) return null
    const r = (await db.execute(sql`SELECT question, image_src FROM challenges WHERE id = ${id}`)) as unknown as Row[]
    if (!r[0]?.question) return null
    const img = r[0].image_src ? String(r[0].image_src) : ''
    return { kind: 'task', question: String(r[0].question), image: img.startsWith('/') ? img : null }
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
            return { moveId: null, taskNum: null, taskTitle: null, step: 'none', hasTrainer: false, tLessonId: null, trainerTitle: null, tLessonId2: null, trainer2Title: null, tier: setTierOf(n), setNumber: n, tasksDone: 0, tasksTotal: 0, caseClaimed: false, preview: null }
        }
        m = await catchUp(m, userId)
        const [titleRows, title2Rows, taskRows, st, n] = await Promise.all([
            m.tLessonId ? db.execute(sql`SELECT title FROM t_lessons WHERE id = ${m.tLessonId}`) : Promise.resolve([]),
            m.tLessonId2 ? db.execute(sql`SELECT title FROM t_lessons WHERE id = ${m.tLessonId2}`) : Promise.resolve([]),
            db.execute(sql`SELECT title FROM ege_tasks WHERE subject = 'math_profile' AND num = ${m.taskNum} LIMIT 1`),
            moveTaskStatus(m, userId),
            setNumberToday(userId, m),
        ])
        const preview = await (m.step === 'trainer' && m.tLessonId ? lessonPreview(m.tLessonId)
            : m.step === 'trainer2' && m.tLessonId2 ? lessonPreview(m.tLessonId2)
                : m.step === 'tasks' ? taskPreview(m) : Promise.resolve(null)).catch(() => null)
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
            preview,
        }
    } catch (e) {
        console.error('getSetBarData', e)
        return null
    }
}
