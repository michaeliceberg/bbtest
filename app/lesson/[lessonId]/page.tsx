// app/lesson/[lessonId]/page.tsx

import { getLesson, getUserProgress, getChallengeProgress, getTodayStats, getUserHomework, getTLessonProgress } from "@/db/queries"
import { redirect } from "next/navigation"
import { Quiz } from "../quiz"
import { auth } from "@/lib/auth"
import { getUnitButtonColor } from "@/src/constants/lessonButtonColors"
import { GetTLessonStat } from "@/usefulFunctions"

type Props = {
    params: {
        lessonId: string
    }
}

const LessonIdPage = async ({ params }: Props) => {
    const session = await auth()
    if (!session?.user) {
        redirect('/')
    }

    const userId = session.user.id
    const userProgress = await getUserProgress()
    
    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses')
    }

    // Используем ID из URL
    const lessonId = parseInt(params.lessonId)
    const lesson = await getLesson(lessonId)
    const challengeProgress = await getChallengeProgress()

    if (!lesson || !challengeProgress) {
        redirect('/learn')
    }

    const activeCourseId = userProgress.activeCourse.id
    const activeCourseTitle = userProgress.activeCourse.title || ''

    // Получаем HW
    const todayStats = await getTodayStats(activeCourseId)
    const allHomework = await getUserHomework(userId, activeCourseId)
    const activeHomework = allHomework.filter(h => h.status === 'pending')

    // Разделяем на ДЗ от учителя (🍩) и челлендж дня (⚡) — это разные вещи
    // визуально, хоть обе и попадают в этот список активных заданий.
    const collectChallengeIds = (list: typeof activeHomework) => {
        const ids: number[] = []
        for (const hw of list) {
            if (hw.challengeIds) ids.push(...hw.challengeIds.split(',').map(id => parseInt(id)))
            if (hw.tLessonIds) ids.push(...hw.tLessonIds.split(',').map(id => parseInt(id)))
        }
        return Array.from(new Set(ids))
    }

    const teacherHwChallengeIds = collectChallengeIds(activeHomework.filter(hw => hw.type === 'teacher'))
    const dailyChallengeIds = collectChallengeIds(activeHomework.filter(hw => hw.type === 'daily'))
    const hwChallengeIds = Array.from(new Set([...teacherHwChallengeIds, ...dailyChallengeIds]))

    const initialHearts = userProgress.hearts
    const initialPercentage = lesson.challenges.filter(c => c.completed).length / lesson.challenges.length * 100
    const oldCourseProgress = userProgress.courseProgress
    // Тот же индекс, что и на /learn (позиция юнита по order, 0-based) — чтобы
    // цвет карточки урока совпадал с цветом её же кнопки на /learn.
    const unitIndex = lesson.unit ? lesson.unit.order - 1 : 0
    const unitColor = getUnitButtonColor(unitIndex)

    // Бейджи скилов тренажёра на карточке задачи: у задачи может быть
    // несколько тэгов (t_lessons), процент — прогресс текущего юзера по
    // соответствующему уроку тренажёра (0%, если ещё не начинал).
    const tLessonProgress = await getTLessonProgress()
    const challengesWithSkillTags = lesson.challenges.map((challenge) => ({
        ...challenge,
        skillTags: challenge.skillTags.map((tag) => ({
            id: tag.t_lesson.id,
            title: tag.t_lesson.title,
            percentage: Math.round(GetTLessonStat(tLessonProgress, tag.t_lesson.id).totalPercentDR * 100),
        })),
    }))

    console.log('📖 Открыт урок ID:', lessonId)
    console.log('📊 hwChallengeIds:', hwChallengeIds)

    return (
        <Quiz
            initialLessonId={lesson.id}
            initialLessonChallenges={challengesWithSkillTags}
            initialHearts={initialHearts}
            initialPercentage={initialPercentage}
            userSubscription={null}
            challengeProgress={challengeProgress}
            lessonTitle={lesson.title}
            oldCourseProgress={oldCourseProgress}
            activeCourseTitle={activeCourseTitle}
            hwChallengeIds={hwChallengeIds}
            dailyChallengeIds={dailyChallengeIds}
            courseId={activeCourseId}
            unitColor={unitColor}
        />
    )
}

export default LessonIdPage