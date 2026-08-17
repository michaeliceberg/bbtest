'use client'

import { BarChart4, BookOpen, Flame, Gift, Home, Search, Trophy, TrendingUp, Award, ShoppingBag, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'
import { TransitionLink } from '@/utils/TransitionLink'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { switchCourse } from '@/actions/switch-course'

// Форма курса, которую реально собирает и передаёт app/(main)/layout.tsx —
// это не сырая строка таблицы courses, а агрегированные данные для сайдбара.
type SidebarCourse = {
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
}

export const Sidebar = ({ courses = [], activeCourseId = null, hasTrainerQuest = false, className }: SidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [activeCourse, setActiveCourse] = useState<SidebarCourse | null>(null)

  useEffect(() => {
    if (activeCourseId && courses.length > 0) {
      const course = courses.find(c => c.id === activeCourseId)
      setActiveCourse(course || null)
    }
  }, [activeCourseId, courses])

  const navItems = [
    { label: 'Главная', href: '/learn', icon: Home },
    { label: 'Обучение', href: '/trainer', icon: BookOpen },
    { label: 'Задачи', href: '/lesson', icon: BarChart4 },
    { label: 'Тренировка', href: '/practice', icon: Flame, badge: hasTrainerQuest },
    { label: 'Достижения', href: '/achievements', icon: Award },
    { label: 'Магазин', href: '/shop', icon: ShoppingBag },
    { label: 'Лидеры', href: '/leaderboard', icon: Trophy },
    { label: 'Прогресс', href: '/progress', icon: TrendingUp },
  ]
  
  const handleCourseChange = (courseId: number) => {
    setIsCoursesOpen(false)
    startTransition(async () => {
      await switchCourse(courseId)
      router.refresh()
    })
  }
  
  if (courses.length === 0) {
    return (
      <div className={cn('flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-[#151F23]', className)}>
        <div className='pt-8 pl-4 pb-7 flex items-center gap-x-3'>
          <Image src="/ggegelogo.svg" height={35} width={119} alt="ggege" className="h-auto" />
        </div>
        <div className='flex flex-col gap-y-2 flex-1'>
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
      </div>
    )
  }
  
  return (
    <div className={cn('flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-[#151F23]', className)}>
      <Link href='/learn'>
        <div className='pt-8 pl-4 pb-4 flex items-center gap-x-3 cursor-pointer hover:opacity-80 transition-opacity'>
          <Image src="/ggegelogo.svg" height={35} width={119} alt="ggege" className="h-auto" />
        </div>
      </Link>

      {courses.length > 0 && (
        <div className="px-2 mb-4">
          <button onClick={() => setIsCoursesOpen(!isCoursesOpen)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#232F34] transition-colors">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GraduationCap className="h-5 w-5 text-green-400" />
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
            {isCoursesOpen ? <ChevronUp className="h-4 w-4 text-green-400" /> : <ChevronDown className="h-4 w-4 text-green-400" />}
          </button>

          {isCoursesOpen && (
            <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
              {courses.map((course) => (
                <button key={course.id} onClick={() => handleCourseChange(course.id)} disabled={isPending}
                  className={cn('w-full text-left px-3 py-2 rounded-lg transition-colors text-sm',
                    activeCourseId === course.id ? "bg-green-500/15 text-green-300" : "hover:bg-[#232F34] text-[#9AA7B0]")}>
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
          )}
        </div>
      )}

      <div className='flex flex-col gap-y-2 flex-1'>
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
    </div>
  )
}
