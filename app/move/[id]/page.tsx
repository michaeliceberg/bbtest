// app/move/[id]/page.tsx — «Ход» по башне ЕГЭ (lib/egeMove.ts):
// шаг 1 — урок тренажёра, шаг 2 — задачи задачника, финал — прирост копилки и редкий кейс.

import { redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { getEgeMove, moveTaskStatus } from '@/lib/egeMove'
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

    const [titleRows, status, map] = await Promise.all([
        m.tLessonId
            ? db.execute(sql`SELECT tl.title, tu.title AS unit FROM t_lessons tl JOIN t_units tu ON tu.id = tl.t_unit_id WHERE tl.id = ${m.tLessonId}`)
            : Promise.resolve([]),
        moveTaskStatus(m, userId),
        getEgeMap(userId),
    ])
    const t = (titleRows as unknown as Row[])[0]
    const station = map.stations.find((s) => s.num === m.taskNum)

    return (
        <MoveScreen
            theme={getUiTheme()}
            move={{
                id: m.id,
                taskNum: m.taskNum,
                taskTitle: station?.title ?? '',
                step: m.step as 'trainer' | 'tasks' | 'done',
                tLessonId: m.tLessonId,
                trainerTitle: t ? String(t.title) : null,
                trainerUnit: t ? String(t.unit) : null,
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
