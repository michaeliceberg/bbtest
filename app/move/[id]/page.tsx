// app/move/[id]/page.tsx — «Ход» по башне ЕГЭ (lib/egeMove.ts):
// шаг 1 — урок тренажёра, шаг 2 — задачи задачника, финал — прирост копилки и редкий кейс.

import { redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { getEgeMove, moveTaskStatus, setNumberToday, setTierOf } from '@/lib/egeMove'
import { getEgeMap } from '@/lib/egeMap'
import { getUiTheme } from '@/lib/uiThemeServer'
import { MoveScreen } from '@/components/ege-move-screen'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>

const MovePage = async ({ params }: { params: { id: string } }) => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userId = session.user.id
    const m = await getEgeMove(Number(params.id), userId)
    if (!m) redirect('/path')

    const [titleRows, title2Rows, status, map, setNumber] = await Promise.all([
        m.tLessonId
            ? db.execute(sql`SELECT tl.title, tu.title AS unit FROM t_lessons tl JOIN t_units tu ON tu.id = tl.t_unit_id WHERE tl.id = ${m.tLessonId}`)
            : Promise.resolve([]),
        m.tLessonId2
            ? db.execute(sql`SELECT tl.title, tu.title AS unit FROM t_lessons tl JOIN t_units tu ON tu.id = tl.t_unit_id WHERE tl.id = ${m.tLessonId2}`)
            : Promise.resolve([]),
        moveTaskStatus(m, userId),
        getEgeMap(userId),
        setNumberToday(userId, m),
    ])
    const t = (titleRows as unknown as Row[])[0]
    const t2 = (title2Rows as unknown as Row[])[0]
    const station = map.stations.find((s) => s.num === m.taskNum)

    return (
        <MoveScreen
            theme={getUiTheme()}
            move={{
                id: m.id,
                taskNum: m.taskNum,
                taskTitle: station?.title ?? '',
                step: m.step as 'trainer' | 'trainer2' | 'tasks' | 'done',
                tLessonId: m.tLessonId,
                trainerTitle: t ? String(t.title) : null,
                trainerUnit: t ? String(t.unit) : null,
                tLessonId2: m.tLessonId2,
                trainer2Title: t2 ? String(t2.title) : null,
                trainer2Unit: t2 ? String(t2.unit) : null,
                tier: setTierOf(setNumber),
                tasksTotal: status.target,
                tasksDone: status.correct,
                caseClaimed: m.caseClaimed,
                fromPrimary: m.fromPrimary,
                nowPrimary: map.primary,
                nowTest: map.test,
                primaryMax: map.primaryMax,
            }}
        />
    )
}

export default MovePage
