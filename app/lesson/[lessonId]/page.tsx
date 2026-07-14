// app/lesson/[lessonId]/page.tsx

import { getLesson, getUserProgress, getChallengeProgress, getTodayStats, getUserHomework } from "@/db/queries"
import { redirect } from "next/navigation"
import { Quiz } from "../quiz"
import { auth } from "@/lib/auth"

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
    
    let hwChallengeIds: number[] = []
    for (const hw of activeHomework) {
        // 🔥 Проверяем challengeIds (задачник)
        if (hw.challengeIds) {
            const ids = hw.challengeIds.split(',').map(id => parseInt(id))
            hwChallengeIds.push(...ids)
        }
        // 🔥 Проверяем tLessonIds (тренажер)
        if (hw.tLessonIds) {
            const ids = hw.tLessonIds.split(',').map(id => parseInt(id))
            hwChallengeIds.push(...ids)
        }
    }
    hwChallengeIds = Array.from(new Set(hwChallengeIds))

    const initialHearts = userProgress.hearts
    const initialPercentage = lesson.challenges.filter(c => c.completed).length / lesson.challenges.length * 100
    const oldCourseProgress = userProgress.courseProgress

    console.log('📖 Открыт урок ID:', lessonId)
    console.log('📊 hwChallengeIds:', hwChallengeIds)

    return (
        <Quiz 
            initialLessonId={lesson.id}
            initialLessonChallenges={lesson.challenges}
            initialHearts={initialHearts}
            initialPercentage={initialPercentage}
            userSubscription={null}
            challengeProgress={challengeProgress}
            lessonTitle={lesson.title}
            oldCourseProgress={oldCourseProgress}
            activeCourseTitle={activeCourseTitle}
            hwChallengeIds={hwChallengeIds}
            courseId={activeCourseId}
        />
    )
}

export default LessonIdPage