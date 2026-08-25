'use client'

import { BookOpen, Flame, Home, Trophy, TrendingUp, Award, ShoppingBag, ChevronDown, ChevronUp, LogOut, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import Link from 'next/link'
import { TransitionLink } from '@/utils/TransitionLink'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { switchCourse } from '@/actions/switch-course'
import { useSession, signOut } from 'next-auth/react'
import { UnitCardLottie } from '@/components/unit-card-lottie'
import { CourseLogo } from '@/components/course-logo'
import { useCourseSwitchStore } from '@/store/course-switch-store'

// Форма курса, которую реально собирает и передаёт app/(main)/layout.tsx —
// это не сырая строка таблицы courses, а агрегированные данные для сайдбара.
export type SidebarCourse = {
  id: number
  title: string
  imageSrc?: string
  isActive?: boolean
  streak?: number
  hasUnfinishedHomework?: boolean
}

interface SidebarProps {
  courses?: SidebarCourse[]
  activeCourseId?: number | null
  hasTrainerQuest?: boolean
  hasHomework?: boolean
  trainerQuestProgress?: string
  className?: string
  // Профиль из userProgress — источник правды, в отличие от сессии
  // NextAuth, которая обновляется только при новом входе.
  userName?: string
  userImageSrc?: string
  // Вызывается сразу при переключении курса — нужен мобильному сайдбару,
  // чтобы плавно закрыться (redirect на /learn не всегда меняет pathname,
  // если пользователь уже был на /learn — тогда сайдбар сам не закрывался).
  onAfterCourseChange?: () => void
}

export const Sidebar = ({ courses = [], activeCourseId = null, hasTrainerQuest = false, className, userName, userImageSrc, onAfterCourseChange }: SidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [activeCourse, setActiveCourse] = useState<SidebarCourse | null>(null)
  // Оптимистично "выбранный" курс — обновляется мгновенно по клику, не
  // дожидаясь ответа сервера, чтобы переключение ощущалось мгновенным.
  // Сбрасывается, как только реальный activeCourseId догоняет его.
  const [optimisticCourseId, setOptimisticCourseId] = useState<number | null>(null)
  const displayedCourseId = optimisticCourseId ?? activeCourseId

  useEffect(() => {
    setOptimisticCourseId(null)
  }, [activeCourseId])

  useEffect(() => {
    if (displayedCourseId && courses.length > 0) {
      const course = courses.find(c => c.id === displayedCourseId)
      setActiveCourse(course || null)
    }
  }, [displayedCourseId, courses])

  const navItems = [
    { label: 'Задачник', href: '/learn', icon: Home },
    { label: 'Тренажёр', href: '/trainer', icon: BookOpen, badge: hasTrainerQuest },
    { label: 'Магазин', href: '/shop', icon: ShoppingBag },
    { label: 'Достижения', href: '/achievements', icon: Award },
    { label: 'Лидеры', href: '/leaderboard', icon: Trophy },
    { label: 'Прогресс', href: '/progress', icon: TrendingUp },
  ]
  
  const setPendingCourse = useCourseSwitchStore((s) => s.setPending)

  const handleCourseChange = (courseId: number) => {
    if (courseId === displayedCourseId) {
      setIsCoursesOpen(false)
      return
    }
    setIsCoursesOpen(false)
    setOptimisticCourseId(courseId)
    // Сигнал в LearnWrapper (сосед по layout, не потомок) — начать выезд
    // старого контента влево ПРЯМО СЕЙЧАС, не дожидаясь ответа сервера.
    setPendingCourse(courseId)
    onAfterCourseChange?.()
    startTransition(async () => {
      await switchCourse(courseId)
      router.refresh()
    })
  }

  // Иконка пользователя внизу сайдбара — клик открывает меню с выходом.
  const userMenu = session?.user && (
    <div className="px-2 pb-4 relative">
      {isUserMenuOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#1A252B] border border-[#3A464E] rounded-lg overflow-hidden shadow-lg">
          <TransitionLink href="/account">
            <button
              onClick={() => setIsUserMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#F2F7FB] hover:bg-[#232F34] transition-colors"
            >
              <Settings className="h-4 w-4" />
              Настройки
            </button>
          </TransitionLink>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-400 hover:bg-[#232F34] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      )}

      <button
        onClick={() => setIsUserMenuOpen((open) => !open)}
        className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-[#232F34] transition-colors"
      >
        {userImageSrc || session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImageSrc || session.user.image || ''}
            alt=""
            width={32}
            height={32}
            className="rounded-full flex-shrink-0 w-8 h-8 object-cover bg-[#232F34]"
          />
        ) : (
          <UnitCardLottie progress={0} size={32} className="rounded-full bg-[#232F34] flex-shrink-0" />
        )}
        <span className="text-sm text-[#F2F7FB] truncate flex-1 text-left">
          {userName || session.user.name || 'Ученик'}
        </span>
      </button>
    </div>
  )


  if (courses.length === 0) {
    return (
      <div className={cn('flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-[#151F23]', className)}>
        <div className='pt-8 pl-4 pb-7 flex items-center gap-x-3'>
          <Image src="/ggegelogo.svg" height={32} width={64} alt="ggege" className="h-auto w-auto" />
        </div>
        <div className='flex flex-col gap-y-2 flex-1 justify-center'>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <TransitionLink key={item.href} href={item.href}>
                <Button variant={isActive ? 'sidebarOutline' : 'sidebar'} className="justify-start h-[52px] w-full">
                  <Icon className="mr-3 h-5 w-5 text-[#9AA7B0]" />
                  <span className="text-sm text-[#F2F7FB]">{item.label}</span>
                </Button>
              </TransitionLink>
            )
          })}
        </div>

        {userMenu}
      </div>
    )
  }
  
  return (
    <div className={cn('flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-[#151F23]', className)}>
      <Link href='/learn'>
        <div className='pt-8 pl-4 pb-4 flex items-center gap-x-3 cursor-pointer hover:opacity-80 transition-opacity'>
          <Image src="/ggegelogo.svg" height={32} width={64} alt="ggege" className="h-auto w-auto" />
        </div>
      </Link>

      {courses.length > 0 && (
        <div className="px-2 mb-4">
          <div className="px-1 mb-1.5 text-[10px] font-bold tracking-widest text-[#5A6A72] uppercase">Курс</div>
          <button
            onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border',
              isCoursesOpen
                ? 'border-green-400/70 shadow-[0_0_16px_2px_rgba(74,222,128,0.4)] bg-[#1A2B22]'
                : 'border-green-400/25 shadow-[0_0_10px_1px_rgba(74,222,128,0.15)] hover:border-green-400/50 hover:shadow-[0_0_14px_2px_rgba(74,222,128,0.3)] bg-[#1A2B22]/50'
            )}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <CourseLogo courseId={displayedCourseId} size={28} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-green-300 block truncate">{activeCourse?.title || 'Выберите курс'}</span>
                {activeCourse?.streak && (
                  <div className="flex items-center gap-1 text-xs">
                    <Flame className="h-3 w-3 text-orange-400" />
                    <span className="text-orange-300">{activeCourse.streak}</span>
                  </div>
                )}
              </div>
            </div>
            {isCoursesOpen ? <ChevronUp className="h-4 w-4 text-green-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-green-400 flex-shrink-0" />}
          </button>

          <AnimatePresence initial={false}>
            {isCoursesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                  {courses.map((course) => (
                    <button key={course.id} onClick={() => handleCourseChange(course.id)}
                      className={cn('w-full text-left px-3 py-2 rounded-lg transition-colors text-sm active:scale-[0.98]',
                        displayedCourseId === course.id ? "bg-green-500/15 text-green-300" : "hover:bg-[#232F34] text-[#9AA7B0]")}>
                      <span>{course.title}</span>
                      {course.streak && (
                        <div className="flex items-center gap-1 mt-1">
                          <Flame className="h-3 w-3 text-orange-400" />
                          <span className="text-xs text-orange-300">{course.streak}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className='flex flex-col gap-y-2 flex-1 justify-center'>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <TransitionLink key={item.href} href={item.href}>
              <Button variant={isActive ? 'sidebarOutline' : 'sidebar'} className="justify-start h-[52px] w-full">
                <Icon className="mr-3 h-5 w-5 text-[#9AA7B0]" />
                <span className="text-sm text-[#F2F7FB]">{item.label}</span>
                {item.badge && <div className="ml-auto h-5 w-5 rounded-full bg-red-500"></div>}
              </Button>
            </TransitionLink>
          )
        })}
      </div>

      {userMenu}
    </div>
  )
}
