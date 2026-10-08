// app/move/[id]/tasks/page.tsx — шаг «задачи» хода по башне ЕГЭ (lib/egeMove.ts).
// Тот же экран урока задачника (app/lesson/quiz.tsx), только задачи — из хода.

import { redirect } from 'next/navigation'
import 'katex/dist/katex.min.css'
import { auth } from '@/lib/auth'
import { getUserProgress, getTLessonProgress } from '@/db/queries'
import { getEgeMove, getMoveChallenges, moveHasTwins, moveTaskStatus } from '@/lib/egeMove'
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
    let progress = raw.flatMap((c) => c.challengeProgress).filter((p) => p.dateDone.getTime() >= startedAt)
    // Нужное число верных набрано (например, вернулись по старой ссылке) — сразу к финалу хода.
    const st = await moveTaskStatus(m, userId)
    if (st.correct >= st.target) {
        await db.update(egeMoves).set({ step: 'done', finishedAt: new Date() })
            .where(and(eq(egeMoves.id, m.id), eq(egeMoves.step, 'tasks')))
        redirect(`/move/${m.id}`)
    }
    // Всё отвечено, верных не хватает, а задач-близнецов в задании больше нет —
    // ошибки перерешиваем прямо в ходе: прячем неверные ответы, задача снова открыта (без суточной блокировки).
    const rightIds = new Set(progress.filter((p) => p.doneRight).map((p) => p.challengeId))
    const retry = st.pending === 0 && !(await moveHasTwins(m, userId))
    if (retry) progress = progress.filter((p) => rightIds.has(p.challengeId))
    // Задачи на замену (всё после первых target) и перерешивание ошибок — клавиатурой цифр, без вариантов.
    const allIds = challenges.map((c) => c.id)
    const forceKeyboardIds = [
        ...allIds.slice(st.target),
        ...(retry ? allIds.filter((id) => !rightIds.has(id)) : []),
    ]
    const answered = new Set(progress.map((p) => p.challengeId))
    const challengesForQuiz = challenges.map((c) => ({ ...c, completed: answered.has(c.id) }))

    return (
        <Quiz
            key={m.challengeIds}
            moveId={m.id}
            moveTarget={st.target}
            forceKeyboardIds={forceKeyboardIds}
            initialLessonId={challenges[0].lessonId}
            initialLessonChallenges={challengesForQuiz}
            initialHearts={userProgress.hearts}
            initialPercentage={Math.min(99, (answered.size / challenges.length) * 100)}
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
