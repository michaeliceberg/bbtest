'use client'

import { useAchievementClaimStore } from '@/store/use-achievement-claim-store'
import { Dumbbell, Lock, BadgeCheck, Shield, BarChart3, Trophy, Route, Rocket, Sparkles, Siren } from 'lucide-react'
import { ProSidebarButton } from '@/components/pro-sidebar-button'
import { CoursePickerButton, CoursePickerSheet } from '@/components/course-picker-sheet'
import { Button } from './ui/button'
import Link from 'next/link'
import { TransitionLink } from '@/utils/TransitionLink'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { switchCourse } from '@/actions/switch-course'
import { useSession } from 'next-auth/react'
import { UnitCardLottie } from '@/components/unit-card-lottie'
import { PRO_ENABLED } from '@/lib/pro'
import { AnimatedLogo } from '@/components/animated-logo'
import { useCourseSwitchStore } from '@/store/course-switch-store'
import { COZY, COZY_WOOD_TILE, type UiTheme } from '@/lib/cozyTheme'
import { useUiThemeLive } from '@/lib/uiTheme'

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
  // Стиль оформления с сервера (cookie uiTheme); после монтирования — живое значение.
  theme?: UiTheme
  courses?: SidebarCourse[]
  activeCourseId?: number | null
  /** Котик в ангаре (lib/catMice.ts): мыши грабят сундук — пункт «Задачник / Ангар» красный и дрожит; голодный — плачущий котик. */
  catAlert?: 'raid' | 'hungry' | null
  hasHomework?: boolean
  className?: string
  // Профиль из userProgress — источник правды, в отличие от сессии
  // NextAuth, которая обновляется только при новом входе.
  userName?: string
  userImageSrc?: string
  // Вызывается сразу при переключении курса — нужен мобильному сайдбару,
  // чтобы плавно закрыться (redirect на /learn не всегда меняет pathname,
  // если пользователь уже был на /learn — тогда сайдбар сам не закрывался).
  onAfterCourseChange?: () => void
  // Задачник закрыт, пока не пройдены 3 разбора электродинамики (lib/learn-unlock.ts)
  learnLocked?: boolean
  learnSubject?: 'math' | 'physics'
  isAdmin?: boolean
  // Бейдж-галочка "амбассадор" (userProgress.isAmbassador) — реальные
  // ученики-евангелисты, продвигающие приложение среди одноклассников,
  // включается вручную точечным SQL, не автоматически.
  isAmbassador?: boolean
  isPro?: boolean // купленная подписка: кнопка PRO спокойная
}

export const Sidebar = ({ courses = [], activeCourseId = null, className, userName, userImageSrc, onAfterCourseChange, theme, learnLocked = false, learnSubject = 'physics', isAmbassador = false, isAdmin = false, isPro = false, catAlert = null }: SidebarProps) => {
  const claimCount = useAchievementClaimStore((st) => st.count)
  const liveTheme = useUiThemeLive()
  const cozy = (liveTheme ?? theme ?? 'metal') === 'cozy'
  // Тёплый стиль: фон/рамка сайдбара, пункты меню (активный — карточка-блок).
  const rootStyle = cozy ? { background: COZY.bg, borderColor: COZY.cardBorder } : undefined
  const navButtonClass = (isActive: boolean) =>
    cozy
      ? cn('justify-start h-[52px] w-full rounded-xl border-2 transition-none', isActive ? '' : 'border-transparent hover:bg-[#2D2A27]')
      : 'justify-start h-[52px] w-full'
  const navButtonStyle = (isActive: boolean) =>
    cozy && isActive ? { background: COZY.card, borderColor: COZY_WOOD_TILE.button, boxShadow: `0 4px 0 ${COZY.cardEdge}` } : undefined
  const navText = cozy ? { color: COZY.title } : undefined
  const navIcon = (isActive: boolean) => (cozy ? { color: isActive ? '#E2C7A5' : COZY.textSoft } : undefined)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
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
    // Порядок (2026-11-05): Задачник, Тренажёр, Мой путь. disabled: true —
    // сделать пункт неактивным (приглушён, замок, не ссылка).
    // У задачника — ракета (как на пульте ангара), но тем же серым значком, что остальные пункты.
    // У ЕГЭ Математики задачник открывается ангаром (предмет = задание ЕГЭ) — так и подписываем, чтобы было понятно, куда ведёт.
    { label: courses.find((c) => c.id === displayedCourseId)?.title.includes('ЕГЭ Математика') ? 'Задачник / Ангар' : 'Задачник', href: '/learn', icon: Rocket, disabled: learnLocked },
    { label: 'Тренажёр', href: '/trainer', icon: Dumbbell },
    { label: 'Мой путь', href: '/path', icon: Route },
    // Справочник временно убран (2026-10-29): будет премиальной страницей с теорией из пройденных step-by-step.
    // { label: 'Справочник', href: '/reference', icon: Library },
    { label: 'Банда', href: '/gang', icon: Shield },
    { label: 'Ачивки', href: '/achievements', icon: Trophy },
    // «Билд на задачу»: фото задачи → какие уроки пройти (lib/photoTask.ts)
    { label: 'ИИ-помощник', href: '/photo-task', icon: Sparkles },
    // PRO — не пункт меню, а кнопка справа от аккаунта внизу (components/pro-sidebar-button.tsx)
    // Только админам — статистика (воронка) с телефона.
    ...(isAdmin ? [{ label: 'Админка', href: '/admin/funnel', icon: BarChart3 }] : []),
    // Временно скрыты по прямой просьбе пользователя (2026-09-23) —
    // оставлены в коде закомментированными, не удалены.
    // { label: 'Магазин', href: '/shop', icon: ShoppingBag },
    // { label: 'Достижения', href: '/achievements', icon: Award },
    // { label: 'Лидеры', href: '/leaderboard', icon: Trophy },
    // { label: 'Прогресс', href: '/progress', icon: TrendingUp },
  ]
  
  const navIconEl = (item: (typeof navItems)[number], active: boolean) => {
    // мыши грабят — мышка вместо ракеты; котик голодный — котик со слезой
    if (item.href === '/learn' && catAlert === 'raid') return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/hangar/life/mouse-peek.webp" alt="" className="mr-3 h-6 w-auto" />
    )
    if (item.href === '/learn' && catAlert === 'hungry') return (
      <span className="relative mr-3 inline-flex" title="Котик голодный — покорми его в ангаре">
        {/* голова нашего котика (вырезана из cat-sit) и слеза под левым глазом */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hangar/life/cat-head.webp" alt="" className="h-7 w-7" />
        <span className="absolute left-[7px] top-[17px] h-[7px] w-[5px] animate-bounce bg-[#53ADEF]" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', boxShadow: '0 0 0 1px #1E3A5F' }} />
      </span>
    )
    const Icon = item.icon
    return <Icon className="mr-3 h-5 w-5 text-[#9AA7B0]" style={navIcon(active)} />
  }

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
      await switchCourse(courseId, pathname.startsWith('/trainer') ? '/trainer' : undefined)
      router.refresh()
    })
  }


  // Иконка пользователя внизу сайдбара — клик сразу ведёт в /account
  // (выход из аккаунта — красной кнопкой внизу той страницы).
  const userMenu = session?.user && (
    <div className="px-2 pb-4 flex items-center gap-2">
      <TransitionLink href="/account" className="block min-w-0 flex-1">
        <div className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-[#232F34] transition-colors cursor-pointer">
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
          <span className="text-sm text-[#F2F7FB] truncate flex-1 text-left flex items-center gap-1">
            <span className="truncate">{userName || session.user.name || 'Ученик'}</span>
            {isAmbassador && <BadgeCheck className="h-4 w-4 text-sky-400 shrink-0" aria-label="Амбассадор" />}
          </span>
        </div>
      </TransitionLink>
      {PRO_ENABLED && <ProSidebarButton bought={isPro} />}
    </div>
  )


  if (courses.length === 0) {
    return (
      <div className={cn('flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-[#151F23]', className)} style={rootStyle}>
        <div className='pt-8 pb-7 flex items-center justify-center'>
          <AnimatedLogo className="w-[140px] lg:w-[210px]" />
        </div>
        <div className='flex flex-col gap-y-2 flex-1 justify-center'>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            if (item.disabled) return (
              <Button key={item.href} variant='sidebar' disabled title={item.href === '/pro' ? 'Скоро' : learnSubject === 'math' ? 'Откроется после 3 первых разборов тригонометрии' : 'Откроется после 3 разборов электродинамики'} className={cn(navButtonClass(false), 'opacity-40 cursor-not-allowed')} style={navButtonStyle(false)}>
                {navIconEl(item, false)}
                <span className="text-sm text-[#F2F7FB]" style={navText}>{item.label}</span>
                <Lock className="ml-auto h-4 w-4 text-[#9AA7B0]" />
              </Button>
            )
            return (
              <TransitionLink key={item.href} href={item.href}>
                <Button variant={cozy ? 'sidebar' : isActive ? 'sidebarOutline' : 'sidebar'} className={navButtonClass(isActive)} style={navButtonStyle(isActive)}>
                  {navIconEl(item, isActive)}
                  <span className="text-sm text-[#F2F7FB]" style={navText}>{item.label}</span>
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
    <div className={cn('flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-[#151F23]', className)} style={rootStyle}>
      <Link href='/trainer'>
        <div className='pt-8 pb-4 flex items-center justify-center cursor-pointer'>
          <AnimatedLogo className="w-[140px] lg:w-[210px]" />
        </div>
      </Link>

      {/* Простая тонкая линия: отделяет логотип от выбора курса. */}
      <div className='px-4 pb-4'>
        <div className='h-px w-full' style={{ backgroundColor: cozy ? COZY.cardBorder : '#2A363C' }} />
      </div>

      {courses.length > 0 && (
        <div className="px-2 mb-4">
          <CoursePickerButton course={activeCourse} onClick={() => setIsCoursesOpen(true)} />
          <CoursePickerSheet open={isCoursesOpen} onOpenChange={setIsCoursesOpen} courses={courses} activeId={displayedCourseId} onPick={handleCourseChange} />
        </div>
      )}

      <div className='flex flex-col gap-y-2 flex-1 justify-center'>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          if (item.disabled) return (
            <Button key={item.href} variant='sidebar' disabled title={item.href === '/pro' ? 'Скоро' : learnSubject === 'math' ? 'Откроется после 3 первых разборов тригонометрии' : 'Откроется после 3 разборов электродинамики'} className={cn(navButtonClass(false), 'opacity-40 cursor-not-allowed')} style={navButtonStyle(false)}>
              {navIconEl(item, false)}
              <span className="text-sm text-[#F2F7FB]" style={navText}>{item.label}</span>
              <Lock className="ml-auto h-4 w-4 text-[#9AA7B0]" />
            </Button>
          )
          return (
            <TransitionLink key={item.href} href={item.href}>
              <Button variant={cozy ? 'sidebar' : isActive ? 'sidebarOutline' : 'sidebar'}
                className={cn(navButtonClass(isActive), item.href === '/learn' && catAlert === 'raid' && 'animate-nav-alarm')}
                style={item.href === '/learn' && catAlert === 'raid' ? { ...navButtonStyle(isActive), background: '#6B1717', borderColor: '#E5534B' } : navButtonStyle(isActive)}
                title={item.href === '/learn' && catAlert === 'raid' ? 'Мыши грабят сундук в ангаре!' : undefined}>
                {navIconEl(item, isActive)}
                <span className="text-sm text-[#F2F7FB]" style={navText}>{item.label}</span>
                {item.href === '/learn' && catAlert === 'raid' && <Siren className="ml-auto h-5 w-5 animate-pulse text-[#FF6B6B]" />}
                {item.href === '/achievements' && claimCount > 0 && (
                  <span className="ml-auto flex h-[22px] min-w-[22px] animate-pulse items-center justify-center rounded-full bg-[#FFC53D] px-1.5 text-xs font-black text-[#4A3206] shadow-[0_0_12px_rgba(255,197,61,0.7)]" title="Есть награды за ачивки">{claimCount}</span>
                )}
              </Button>
            </TransitionLink>
          )
        })}
      </div>

      {userMenu}
    </div>
  )
}
