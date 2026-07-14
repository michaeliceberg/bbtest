// app/(main)/layout.tsx

import { MobileHeader } from '@/components/mobile-header'
import { Sidebar } from '@/components/sidebar'
import { auth } from '@/lib/server-auth'
import { getUserCourses, getUserCourseStreak, getUserHomework, getTodayTrainerQuest } from '@/db/queries'
import { cookies } from 'next/headers'

import 'katex/dist/katex.min.css'

type Props = { children: React.ReactNode }

const MainLayout = async ({ children }: Props) => {
    const session = await auth()
    const userId = session?.user?.id
    
    if (!userId) {
        return (
            <>
                <MobileHeader />
                <Sidebar className='hidden lg:flex' />
                <main className='lg:pl-[280px] h-full pt-[50px] lg:pt-0'>
                    <div className='max-w-[1056px] mx-auto pt-6 h-full'>{children}</div>
                </main>
            </>
        )
    }
    
    // Получаем доступные курсы пользователя
    const allCourses = await getUserCourses()
    
    if (!allCourses.length) {
        return (
            <>
                <MobileHeader />
                <Sidebar className='hidden lg:flex' />
                <main className='lg:pl-[280px] h-full pt-[50px] lg:pt-0'>
                    <div className='max-w-[1056px] mx-auto pt-6 h-full'>{children}</div>
                </main>
            </>
        )
    }
    
    // Получаем активный курс из cookies
    const cookieStore = cookies()
    const savedCourseId = cookieStore.get('activeCourseId')?.value
    let activeCourseId = savedCourseId ? parseInt(savedCourseId) : allCourses[0]?.id
    
    // Проверяем существование курса
    const courseExists = allCourses.some(c => c.id === activeCourseId)
    if (!courseExists) {
        activeCourseId = allCourses[0]?.id
    }
    
    // Получаем данные для всех курсов
    const coursesWithData = await Promise.all(
        allCourses.map(async (course) => {
            // Получаем стрик для курса
            const streak = await getUserCourseStreak(userId, course.id)
            
            // Получаем ВСЕ невыполненные ДЗ задачника (активные + просроченные)
            const allHomework = await getUserHomework(userId, course.id)
            const pendingHomework = allHomework.filter(h => h.challengeIds && (h.status === 'pending' || h.status === 'expired'))
            const hasUnfinishedHomework = pendingHomework.length > 0
            
            // Получаем ВСЕ невыполненные ДЗ тренажера (активные + просроченные)
            const pendingTrainerHomework = allHomework.filter(h => h.tLessonIds && (h.status === 'pending' || h.status === 'expired'))
            const hasUnfinishedTrainerHomework = pendingTrainerHomework.length > 0
            
            // Получаем статус квеста тренажера
            const trainerQuest = await getTodayTrainerQuest(userId, course.id)
            const hasUnfinishedTrainerQuest = trainerQuest ? !trainerQuest.isCompleted : false
            
            // Объединяем все уведомления для этого курса
            const hasNotification = hasUnfinishedHomework || hasUnfinishedTrainerHomework || hasUnfinishedTrainerQuest
            
            console.log(`📊 Курс ${course.title}: homework=${hasUnfinishedHomework}, trainerHomework=${hasUnfinishedTrainerHomework}, quest=${hasUnfinishedTrainerQuest}`)
            
            return {
                id: course.id,
                title: course.title,
                imageSrc: course.imageSrc,
                isActive: course.id === activeCourseId,
                streak: streak > 0 ? streak : undefined,
                hasUnfinishedHomework: hasNotification,
            }
        })
    )
    
    // Статусы для активного курса (для уведомлений внизу сайдбара)
    const activeAllHomework = await getUserHomework(userId, activeCourseId)
    const activePendingHomework = activeAllHomework.filter(h => h.challengeIds && (h.status === 'pending' || h.status === 'expired'))
    const activePendingTrainerHomework = activeAllHomework.filter(h => h.tLessonIds && (h.status === 'pending' || h.status === 'expired'))
    const hasHomework = activePendingHomework.length > 0 || activePendingTrainerHomework.length > 0
    
    const activeTrainerQuest = await getTodayTrainerQuest(userId, activeCourseId)
    const hasTrainerQuest = activeTrainerQuest ? !activeTrainerQuest.isCompleted : false
    const trainerQuestProgress = activeTrainerQuest ? `${activeTrainerQuest.completedCount}/${activeTrainerQuest.totalCount}` : ''
    


    console.log(`🔴 Активный курс ${activeCourseId}: hasTrainerQuest=${hasTrainerQuest}, trainerQuest=${activeTrainerQuest}`)

    
    return (
        <>
            <MobileHeader />
            <Sidebar 
                className='hidden lg:flex'
                courses={coursesWithData}
                activeCourseId={activeCourseId}
                hasHomework={hasHomework}
                hasTrainerQuest={hasTrainerQuest}
                trainerQuestProgress={trainerQuestProgress}
            />
            <main className='lg:pl-[280px] h-full pt-[50px] lg:pt-0'>
                <div className='max-w-[1056px] mx-auto pt-6 h-full'>{children}</div>
            </main>
        </>
    )
}

export default MainLayout