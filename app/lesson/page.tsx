// // app/lesson/[lessonId]/page.tsx (или app/lesson/page.tsx - смотри по своей структуре)

// import { getLesson, getUserProgress, getChallengeProgress, getTodayStats } from "@/db/queries"
// import { redirect } from "next/navigation"
// import { Quiz } from "./quiz"
// import { auth } from "@/lib/auth"
// import db from "@/db/drizzle"
// import { and, eq } from "drizzle-orm"
// import { userDailyStats, userCourseProgress } from "@/db/schema"

// interface LessonPageProps {
//     params: {
//         lessonId: string
//     }
// }

// const LessonPage = async ({ params }: LessonPageProps) => {
//     const session = await auth()
//     if (!session?.user) {
//         redirect('/')
//     }

//     const userId = session.user.id
//     const lessonId = parseInt(params.lessonId)

//     // Получаем данные
//     const lesson = await getLesson(lessonId)
//     const userProgress = await getUserProgress()
//     const challengeProgress = await getChallengeProgress()

//     if (!lesson || !userProgress || !challengeProgress) {
//         redirect('/learn')
//     }

//     const activeCourseId = userProgress.activeCourseId
//     if (!activeCourseId) {
//         redirect('/learn')
//     }

//     // ===== НОВЫЕ ЗАПРОСЫ =====
//     // Получаем сегодняшнюю статистику для проверки HW
//     const todayStats = await getTodayStats(activeCourseId)
    
//     // Получаем прогресс пользователя по курсу
//     const courseProgress = await db.query.userCourseProgress.findFirst({
//         where: and(
//             eq(userCourseProgress.userId, userId),
//             eq(userCourseProgress.courseId, activeCourseId)
//         ),
//     })

//     // ===== РАСЧЕТ ПРОЦЕНТА ВЫПОЛНЕНИЯ УРОКА =====
//     const completedChallenges = lesson.challenges.filter(challenge => challenge.completed)
//     const initialPercentage = (completedChallenges.length / lesson.challenges.length) * 100

//     // ===== ОПРЕДЕЛЯЕМ, КАКИЕ ЗАДАЧИ ВХОДЯТ В HW =====
//     // const hwChallengeIds = todayStats?.hwChallengeIds 
//     //     ? todayStats.hwChallengeIds.split(',').map(id => parseInt(id))
//     //     : []

//     const hwChallengeIds = todayStats?.hwChallengeIds 
//         ? todayStats.hwChallengeIds.split(',').map(id => parseInt(id))
//         : [];  // ← важно: всегда массив, даже если пустой


//     // Текущие значения (из userProgress)
//     const initialPoints = userProgress.points
//     const initialHearts = userProgress.hearts
//     const initialGems = userProgress.gems

//     // Получаем активный курс
//     const activeCourseTitle = userProgress.activeCourse?.title || ''

//     // return (
//     //     <Quiz 
//     //         initialLessonId={lesson.id}
//     //         initialLessonChallenges={lesson.challenges}
//     //         initialHearts={initialHearts}
//     //         initialPoints={initialPoints}
//     //         initialGems={initialGems}
//     //         initialPercentage={initialPercentage}
//     //         userSubscription={null}
//     //         challengeProgress={challengeProgress}
//     //         lessonTitle={lesson.title}
            
//     //         // Для обратной совместимости (постепенно убирать)
//     //         oldCourseProgress={[]} // больше не используем
//     //         activeCourseTitle={activeCourseTitle}
            
//     //         // HW данные
//     //         hwChallengeIds={hwChallengeIds}
//     //         courseId={activeCourseId}
//     //     />
//     // )

//     console.log('📊 todayStats.hwChallengeIds:', todayStats?.hwChallengeIds);


//     return (
//     <Quiz 
//         initialLessonId={lesson.id}
//         initialLessonChallenges={lesson.challenges}
//         initialHearts={initialHearts}
//         initialPercentage={initialPercentage}
//         userSubscription={null}
//         challengeProgress={challengeProgress}
//         lessonTitle={lesson.title}
//         oldCourseProgress={[]}
//         activeCourseTitle={activeCourseTitle}
//         hwChallengeIds={hwChallengeIds}  // 🔥 новое поле
//         courseId={activeCourseId}        // 🔥 новое поле
//     />
// )

// }

// export default LessonPage



// app/lesson/page.tsx

import { getCourseProgress } from "@/db/queries"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

const LessonPage = async () => {
    const session = await auth()
    if (!session?.user) {
        redirect('/')
    }

    // Получаем первый незавершенный урок
    const courseProgress = await getCourseProgress()
    const activeLessonId = courseProgress?.activeLessonId
    
    if (!activeLessonId) {
        redirect('/learn')
    }

    // Редирект на конкретный урок
    redirect(`/lesson/${activeLessonId}`)
}

export default LessonPage