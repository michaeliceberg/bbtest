// components/sidebar.tsx

'use client';

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { TransitionLink } from '@/utils/TransitionLink'
import { Button } from './ui/button'
import { useState, useTransition } from 'react'
import { switchCourse } from '@/actions/switch-course'
import { 
    BookOpen, Dumbbell, Trophy, TrendingUp, ShoppingBag, Award, Crown, 
    Gift, Flame, ChevronDown, ChevronUp, CheckCircle, GraduationCap 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Course = {
    id: number
    title: string
    imageSrc: string
    isActive: boolean
    streak?: number
    hasUnfinishedHomework?: boolean  // ← изменяем с homeworkCount на boolean
}

type Props = {
    className?: string
    courses?: Course[]
    activeCourseId?: number
    hasHomework?: boolean
    hasTrainerQuest?: boolean
    trainerQuestProgress?: string
}

export const Sidebar = ({ 
    className, 
    courses = [],
    activeCourseId,
    hasHomework = false,
    hasTrainerQuest = false,
    trainerQuestProgress
}: Props) => {
    const pathname = usePathname()
    const router = useRouter()
    const [isCoursesOpen, setIsCoursesOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const activeCourse = courses.find(c => c.id === activeCourseId)
    
    // const navItems = [
    //     { 
    //         label: 'Задачник',
    //         href: '/learn', 
    //         icon: BookOpen,
    //         badge: hasHomework,
    //         badgeColor: 'bg-orange-500',
    //         badgeIcon: <Gift className="h-3 w-3 text-white" />,
    //     },
    //     { 
    //         label: 'Тренажёр', 
    //         href: '/trainer', 
    //         icon: Dumbbell,
    //         badge: hasTrainerQuest,
    //         badgeColor: 'bg-red-500',
    //         badgeIcon: <Flame className="h-3 w-3 text-white" />,
    //     },
    //     { 
    //         label: 'Достижения', 
    //         href: '/achievements', 
    //         icon: Award,
    //     },
    //     { 
    //         label: 'Магазин', 
    //         href: '/shop', 
    //         icon: ShoppingBag,
    //     },
    //     { 
    //         label: 'Лидеры', 
    //         href: '/leaderboard', 
    //         icon: Trophy,
    //     },
    //     { 
    //         label: 'Прогресс', 
    //         href: '/progress', 
    //         icon: TrendingUp,
    //     },
    // ]

    const navItems = [
        { 
            label: 'Задачник',
            href: '/learn', 
            icon: BookOpen,
            badge: hasHomework,
            badgeColor: 'bg-red-500',
        },
        { 
            label: 'Тренажёр', 
            href: '/trainer', 
            icon: Dumbbell,
            badge: hasTrainerQuest,
            badgeColor: 'bg-red-500',
        },
        { 
            label: 'Достижения', 
            href: '/achievements', 
            icon: Award,
        },
        { 
            label: 'Магазин', 
            href: '/shop', 
            icon: ShoppingBag,
        },
        { 
            label: 'Лидеры', 
            href: '/leaderboard', 
            icon: Trophy,
        },
        { 
            label: 'Прогресс', 
            href: '/progress', 
            icon: TrendingUp,
        },
    ]
    
    const handleCourseChange = (courseId: number) => {
        setIsCoursesOpen(false)
        
        startTransition(async () => {
            await switchCourse(courseId)
            router.refresh()
        })
    }
    
    // Если нет курсов, показываем упрощенную версию
    if (courses.length === 0) {
        return (
            <div className={cn(
                'flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-gradient-to-b from-white to-gray-50',
                className
            )}>
                <div className='pt-8 pl-4 pb-7 flex items-center gap-x-3'>
                    <Image src='/mascot.svg' height={44} width={44} alt='Mascot' />
                    <div>
                        <h1 className='text-xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent'>
                            Korolev
                        </h1>
                        <p className="text-[10px] text-gray-400">Королевские знания</p>
                    </div>
                </div>
                
                <div className='flex flex-col gap-y-2 flex-1'>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        
                        return (
                            <TransitionLink key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? 'sidebarOutline' : 'sidebar'}
                                    className="justify-start h-[52px] w-full"
                                >
                                    <Icon className="mr-3 h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">{item.label}</span>
                                </Button>
                            </TransitionLink>
                        )
                    })}
                </div>
            </div>
        )
    }
    
    return (
        <div className={cn(
            'flex h-full lg:w-[280px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-gradient-to-b from-white to-gray-50',
            className
        )}>
            {/* Логотип */}
            <TransitionLink href='/learn' className="block">
                <div className='pt-8 pl-4 pb-4 flex items-center gap-x-3 cursor-pointer hover:opacity-80 transition-opacity'>
                    <div className="relative">
                        <Image src='/mascot.svg' height={44} width={44} alt='Mascot' />
                    </div>
                    <div>
                        <h1 className='text-xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent'>
                            Korolev
                        </h1>
                        <p className="text-[10px] text-gray-400">Королевские знания</p>
                    </div>
                </div>
            </TransitionLink>
            


            {/* Переключатель курсов */}
            {courses.length > 0 && (
                <div className="px-2 mb-4">
                    <button
                        onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                        disabled={isPending}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-700">{activeCourse?.title || 'Выберите курс'}</span>
                            {activeCourse?.streak && activeCourse.streak > 0 && (
                                <div className="flex items-center gap-1 bg-orange-100 px-2 py-0.5 rounded-full">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-600">{activeCourse.streak}</span>
                                </div>
                            )}
                            {activeCourse?.hasUnfinishedHomework && (
                                <div className="bg-red-500 rounded-full w-2.5 h-2.5 animate-pulse shadow-md" />
                            )}
                        </div>
                        {isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : isCoursesOpen ? (
                            <ChevronUp className="h-4 w-4 text-green-600" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-green-600" />
                        )}
                    </button>
                    
                    <AnimatePresence>
                        {isCoursesOpen && !isPending && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-2 space-y-1"
                            >
                                {courses.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => handleCourseChange(course.id)}
                                        disabled={isPending}
                                        className={cn(
                                            "w-full flex items-center justify-between p-2 rounded-lg transition-all",
                                            course.id === activeCourseId
                                                ? "bg-green-100 text-green-700"
                                                : "hover:bg-gray-100 text-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span className="text-sm">{course.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Стрик (огонь) */}
                                            {course.streak && course.streak > 0 && (
                                                <div className="flex items-center gap-0.5 bg-orange-100 px-1.5 py-0.5 rounded-full">
                                                    <Flame className="h-3 w-3 text-orange-500" />
                                                    <span className="text-xs text-orange-600">{course.streak}</span>
                                                </div>
                                            )}
                                            
                                            {/* Индикатор невыполненных ДЗ (пульсирующая точка) */}
                                            {course.hasUnfinishedHomework && (
                                                <div className="bg-red-500 rounded-full w-2.5 h-2.5 animate-pulse shadow-md" />
                                            )}
                                            
                                            {/* Активный курс */}
                                            {course.id === activeCourseId && (
                                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Основная навигация */}
            <div className='flex flex-col gap-y-2 flex-1'>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon
                    
                    return (
                        <TransitionLink key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? 'sidebarOutline' : 'sidebar'}
                                className={cn(
                                    'justify-start h-[52px] w-full transition-all duration-200 relative',
                                    isActive && 'shadow-md'
                                )}
                            >
                                <Icon className={cn('mr-3 h-5 w-5', isActive ? 'text-green-600' : 'text-gray-500')} />
                                
                                <div className="flex-1 text-left flex items-center">
                                    <span className={cn('text-sm', isActive ? 'font-semibold text-green-700' : 'text-gray-700')}>
                                        {item.label}
                                    </span>
                                    
                                    {/* Бейдж справа от текста с отступом */}
                                    {item.badge && (
                                        <div className={cn(
                                            "ml-2 rounded-full w-2.5 h-2.5",
                                            item.badgeColor,
                                            "animate-pulse shadow-md"
                                        )} />
                                    )}
                                    
                                    {item.label === 'Тренажёр' && trainerQuestProgress && (
                                        <span className="text-xs text-gray-400 ml-2">({trainerQuestProgress})</span>
                                    )}
                                </div>
                                
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-6 bg-green-500 rounded-full" />
                                )}
                            </Button>
                        </TransitionLink>
                    )
                })}
            </div>
            
            {/* Нижняя секция */}
            <div className="mt-auto pb-6 space-y-3">
                {hasHomework && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Gift className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-medium text-orange-700">Есть домашнее задание!</span>
                        </div>
                    </div>
                )}
                
                {hasTrainerQuest && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="h-4 w-4 text-purple-500" />
                            <span className="text-xs font-medium text-purple-700">Ежедневный квест!</span>
                        </div>
                    </div>
                )}
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-medium text-amber-700">Королевский бонус</span>
                    </div>
                </div>
            </div>
        </div>
    )
}