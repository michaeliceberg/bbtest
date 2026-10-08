// app/move/[id]/tasks/page.tsx — шаг «задачи» хода по башне ЕГЭ (lib/egeMove.ts).
// Тот же экран урока задачника (app/lesson/quiz.tsx), только задачи — из хода.

import { redirect } from 'next/navigation'
import 'katex/dist/katex.min.css'
import { auth } from '@/lib/auth'
import { getUserProgress, getTLessonProgress } from '@/db/queries'
import { getEgeMove, getMoveChallenges } from '@/lib/egeMove'
import db from '@/db/drizzle'
import { egeMoves } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { Quiz } from '@/app/lesson/quiz'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { GetTUnitStat } from '@/usefulFunctions'

export const dynamic = 'force-dynamic'

const MoveTasksPage = async ({ params }: { params: { id: string } }) => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userId = session.user.id
    const m = await getEgeMove(Number(params.id), userId)
    if (!m) redirect('/path')
    if (m.step !== 'tasks') redirect(`/move/${m.id}`)
    const userProgress = await getUserProgress()
    if (!userProgress) redirect('/courses')

    const raw = await getMoveChallenges(m, userId)
    if (!raw.length) redirect(`/move/${m.id}`)

    // В ходе задача «сделана», когда на неё ответили ПОСЛЕ начала хода (старый
    // неверный ответ, которому больше суток, ход не закрывает).
    const startedAt = m.createdAt.getTime()
    const tLessonProgress = await getTLessonProgress()
    const challenges = raw.map((c) => {
        const fresh = c.challengeProgress.filter((p) => p.dateDone.getTime() >= startedAt)
        return {
            ...c,
            completed: fresh.length > 0 && fresh.every((p) => p.completed),
            skillTags: c.skillTags.map((tag) => ({
                id: tag.t_unit.t_lessons[0]?.id ?? tag.t_unit.id,
                title: tag.t_unit.title,
                percentage: Math.round(GetTUnitStat(tLessonProgress, tag.t_unit.t_lessons.map((l) => l.id)).totalPercentDR * 100),
            })),
        }
    })
    const progress = raw.flatMap((c) => c.challengeProgress).filter((p) => p.dateDone.getTime() >= startedAt)
    // Все задачи хода уже решены (например, вернулись по старой ссылке) — сразу к финалу хода.
    const answered = new Set(progress.map((p) => p.challengeId))
    if (challenges.every((c) => answered.has(c.id))) {
        await db.update(egeMoves).set({ step: 'done', finishedAt: new Date() })
            .where(and(eq(egeMoves.id, m.id), eq(egeMoves.step, 'tasks')))
        redirect(`/move/${m.id}`)
    }

    return (
        <Quiz
            moveId={m.id}
            initialLessonId={challenges[0].lessonId}
            initialLessonChallenges={challenges}
            initialHearts={userProgress.hearts}
            initialPercentage={(answered.size / challenges.length) * 100}
            userSubscription={null}
            challengeProgress={progress}
            lessonTitle={`Ход · задание №${m.taskNum}`}
            oldCourseProgress={userProgress.courseProgress}
            activeCourseTitle={userProgress.activeCourse?.title ?? ''}
            hwChallengeIds={[]}
            dailyChallengeIds={[]}
            courseId={userProgress.activeCourse?.id ?? 11}
            unitColor={GGEGE_PALETTE.orange}
        />
    )
}

export default MoveTasksPage
