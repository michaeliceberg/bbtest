import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import { hasProFor } from '@/lib/pro'
import { getTrainerKeysByTask } from '@/lib/egeTrainerLinks'
import { buildRamboSession, getRamboStatus, RAMBO_LEVELS } from '@/lib/rambo'
import { RamboRun } from '@/components/rambo-run'
import db from '@/db/drizzle'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// «Рэмбо» (lib/rambo.ts): смесь заданий тренажёра и задачника к заданию ЕГЭ №task, клетка-уровень level.
export default async function RamboPage({ params }: { params: { task: string; level: string } }) {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) redirect('/trainer')
    const taskNum = Number(params.task), level = Number(params.level)
    if (!(taskNum >= 1 && taskNum <= 20 && level >= 1 && level <= RAMBO_LEVELS)) redirect('/trainer')
    const up = await getUserProgress()
    const keys = await getTrainerKeysByTask(userId)
    const status = await getRamboStatus(userId, hasProFor(up), keys)
    const cell = status[taskNum]?.cells[level - 1]
    if (!cell?.open) redirect(`/learn?task=${taskNum}`)
    const [questions, titleRows] = await Promise.all([
        buildRamboSession(taskNum, level),
        db.execute(sql`SELECT title FROM ege_tasks WHERE subject = 'math_profile' AND num = ${taskNum}`),
    ])
    const title = String((titleRows as unknown as { title: string }[])[0]?.title ?? '')
    return <RamboRun taskNum={taskNum} taskTitle={title} level={level} questions={questions} />
}
