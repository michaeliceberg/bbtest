// app/(main)/layout.tsx

import { pickActiveCourseId } from '@/lib/trainer-topic'
import { MobileHeader } from '@/components/mobile-header'
import { Sidebar } from '@/components/sidebar'
import { auth } from '@/lib/server-auth'
import { getUserCourses, getUserCourseStreak, getUserHomework, getUserProgress } from '@/db/queries'
import { cookies } from 'next/headers'
import { getUiTheme } from '@/lib/uiThemeServer'
import { isLearnUnlocked, learnSubjectOf } from '@/lib/learn-unlock'
import { LearnUnlockCelebration } from '@/components/learn-unlock-celebration'
import { AchievementClaimInit } from '@/components/achievement-claim-init'
import { countUnclaimedAchievements } from '@/lib/achievements'

import 'katex/dist/katex.min.css'

type Props = { children: React.ReactNode }

const MainLayout = async ({ children }: Props) => {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
        return (
            <>
                <MobileHeader />
                <Sidebar className='hidden lg:flex' theme={getUiTheme()} />
                <main className='lg:pl-[280px] h-full pt-[50px] lg:pt-0'>
                    <div className='max-w-[1056px] mx-auto pt-6 h-full'>{children}</div>
                </main>
            </>
        )
    }

    // Профиль (имя/аватар) — источник правды для сайдбара, а не сессия
    // NextAuth, которая обновляется только при новом входе.
    const userProgressRow = await getUserProgress()
    // кнопка PRO в сайдбаре: купленная подписка — спокойная, иначе переливается (админ без подписки видит призывную)
    const proBought = !!userProgressRow?.proUntil && new Date(userProgressRow.proUntil).getTime() > Date.now()

    // Получаем доступные курсы пользователя
    const allCourses = await getUserCourses()

    if (!allCourses.length) {
        return (
            <>
                <MobileHeader userName={userProgressRow?.userName} userImageSrc={userProgressRow?.userImageSrc} isAdmin={userProgressRow?.isAdmin === 1} isPro={proBought} />
                <Sidebar className='hidden lg:flex' theme={getUiTheme()} userName={userProgressRow?.userName} userImageSrc={userProgressRow?.userImageSrc} isAmbassador={userProgressRow?.isAmbassador} isAdmin={userProgressRow?.isAdmin === 1} isPro={proBought} />
                <main className='lg:pl-[280px] h-full pt-[50px] lg:pt-0'>
                    <div className='max-w-[1056px] mx-auto pt-6 h-full'>{children}</div>
                </main>
            </>
        )
    }
    
    // Получаем активный курс из cookies
    const cookieStore = cookies()
    const savedCourseId = cookieStore.get('activeCourseId')?.value
    // Общая логика с /trainer и /learn (lib/trainer-topic.ts → pickActiveCourseId)
    // allCourses здесь не пуст (пустой список обработан выше)
    const activeCourseId = pickActiveCourseId(savedCourseId, allCourses.map(c => c.id), userProgressRow?.activeCourseId) ?? allCourses[0].id
    
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
            
            // Объединяем все уведомления для этого курса
            const hasNotification = hasUnfinishedHomework || hasUnfinishedTrainerHomework

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
    
    



    
    const activeCourseTitle = coursesWithData.find(c => c.id === activeCourseId)?.title

    // Задачник курса открывается после 3 вводных разборов его предмета (lib/learn-unlock.ts).
    const learnDone = await isLearnUnlocked(userId, false, activeCourseTitle)
    const learnLocked = !learnDone && userProgressRow?.isAdmin !== 1
    const learnSubject = learnSubjectOf(activeCourseTitle)

    const achievementsToClaim = await countUnclaimedAchievements(userId).catch(() => 0)

    return (
        <>
            <MobileHeader
                courseTitle={activeCourseTitle}
                courses={coursesWithData}
                activeCourseId={activeCourseId}
                userName={userProgressRow?.userName}
                userImageSrc={userProgressRow?.userImageSrc}
                learnLocked={learnLocked}
                learnSubject={learnSubject}
                isAdmin={userProgressRow?.isAdmin === 1} isPro={proBought}
            />
            <Sidebar
                className='hidden lg:flex'
                theme={getUiTheme()}
                courses={coursesWithData}
                activeCourseId={activeCourseId}
                hasHomework={hasHomework}
                userName={userProgressRow?.userName}
                userImageSrc={userProgressRow?.userImageSrc}
                learnLocked={learnLocked}
                learnSubject={learnSubject}
                isAmbassador={userProgressRow?.isAmbassador}
                isAdmin={userProgressRow?.isAdmin === 1} isPro={proBought}
            />
            <main className='lg:pl-[280px] h-full pt-[50px] lg:pt-0'>
                <div className='max-w-[1056px] mx-auto pt-6 h-full'>{children}</div>
            </main>
            <AchievementClaimInit count={achievementsToClaim} />
            {learnDone && <LearnUnlockCelebration subject={learnSubject} />}
        </>
    )
}

export default MainLayout