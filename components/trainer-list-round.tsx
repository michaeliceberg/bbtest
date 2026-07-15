// components/trainer-list-round.tsx

'use client'

import { t_challenges, t_lessonProgress } from '@/db/schema'
import React from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import 'katex/dist/katex.min.css';
import { Button } from './ui/button'
import Link from 'next/link'
import { 
    Cat, Gem, HandMetal, HandPlatter, Ham, Hammer,
    IceCreamCone, IceCreamBowl, Laugh, Landmark, Pickaxe,
    Pizza, Puzzle, Pyramid, Rat, Rabbit, Radiation,
    Sailboat, Salad, Sandwich, Sprout, SprayCan, Sword,
    Swords, Sun, Telescope, ThumbsUp, TreePalm, TreePine,
    Umbrella, Waves, Apple, Citrus, Lock, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CircularProgressbarWithChildren } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import Image from 'next/image'

type Props = {
    t_lesson: { 
        id: number; 
        title: string; 
        order: number; 
        t_unitId: number; 
        t_challenges: typeof t_challenges.$inferSelect[]
    },
    t_lessonProgress: typeof t_lessonProgress.$inferSelect[],
    TRatingUsers: {
        t_lesson_id: number;
        usersSortedStat: {
            DRP: number,
            DR_DRP: number;
            user_id: string | undefined;
            user_name: string | undefined;
        }[];
    }[],
    user_id: string,
    indexLesson: number,
    isDisabled: boolean,
    missedLIds: number[],
    isInQuest?: boolean,
}

export const TrainerLessonItemRound = ({
    t_lesson,
    t_lessonProgress,
    TRatingUsers,
    user_id,
    indexLesson,
    isDisabled,
    missedLIds,
    isInQuest = false,
}: Props) => {
    const cycleLength = 8
    const cycleIndex = indexLesson % cycleLength

    let indentationLevel
    if (cycleIndex <= 2) {
        indentationLevel = cycleIndex
    } else if (cycleIndex <= 4) {
        indentationLevel = 4 - cycleIndex
    } else if (cycleIndex <= 6) {
        indentationLevel = 4 - cycleIndex
    } else {
        indentationLevel = cycleIndex - 8
    }
    const rightPosition = indentationLevel * 40

    const isFirst = indexLesson === 0
    const isCompleted = false

    const href = `/t-lesson/${t_lesson.id}`

    let ratingPosition_inThisLesson = -1
    let DR_thisL_thisU = 0

    if (TRatingUsers?.filter(el => el.t_lesson_id == t_lesson.id)[0]) {
        let usersSortedStat_inThisLesson = TRatingUsers.filter(el => el.t_lesson_id == t_lesson.id)[0].usersSortedStat.filter(el => el.user_id == user_id)
        ratingPosition_inThisLesson = usersSortedStat_inThisLesson.findIndex(x => x.user_id === user_id) + 1;

        usersSortedStat_inThisLesson.filter(x => x.user_id === user_id) instanceof Array 
            ? DR_thisL_thisU = usersSortedStat_inThisLesson.filter(x => x.user_id === user_id)[0]?.DRP
            : DR_thisL_thisU = 0
    }

    const percentage = DR_thisL_thisU

    const color = percentage > 90 ? "#f8E164"
        : percentage > 60 ? "#4ade80"
        : percentage > 1 ? "#e77975"
        : "#fff"

    const locked = isDisabled

    const randomIconList = [
        Cat, Gem, HandMetal, HandPlatter, Ham, Hammer,
        IceCreamCone, IceCreamBowl, Laugh, Landmark, Pickaxe,
        Pizza, Puzzle, Pyramid, Rat, Rabbit, Radiation,
        Sailboat, Salad, Sandwich, Sprout, SprayCan, Sword,
        Swords, Sun, Telescope, ThumbsUp, TreePalm, TreePine,
        Umbrella, Waves, Apple, Citrus
    ]

    // Детерминированный выбор (стабильный между сервером и клиентом) —
    // раньше был Math.random(), что вызывало hydration mismatch (React #418/#423)
    // и приводило к падению страницы на мобильных устройствах.
    const randomIndex = t_lesson.id % randomIconList.length;
    const RandomIcon = randomIconList[randomIndex];

    const showQuestDonut = isInQuest && percentage < 100;
    const showHwIcon = missedLIds?.includes(t_lesson.id) || false;

    // Если урок заблокирован - не кликабелен
    if (locked) {
        return (
            <div className="relative flex flex-1 ml-12 opacity-50" style={{
                right: `${-30 + rightPosition}px`,
                marginTop: isFirst ? 60 : 24,
            }}>
                <div className="h-[102px] w-[102px] relative">
                    <CircularProgressbarWithChildren
                        value={0}
                        styles={{
                            path: { stroke: "#e5e7eb" },
                            trail: { stroke: "#e5e7eb" },
                        }}
                    >
                        <Button
                            size='rounded'
                            variant='locked'
                            className="h-[70px] w-[70px] border-b-8"
                            disabled
                        >
                            <Lock className="h-10 w-10 text-neutral-400" />
                        </Button>
                    </CircularProgressbarWithChildren>
                </div>
                <button className="ml-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-[#232F34]
                    px-6 py-3 uppercase text-sm font-semibold text-neutral-400">
                    {t_lesson.title}
                </button>
            </div>
        );
    }

    return (
        <Link href={href} className="block">
            <div className="relative flex flex-1 ml-12 hover:opacity-80 transition-opacity" style={{
                right: `${-30 + rightPosition}px`,
                marginTop: isFirst ? 60 : 24,
            }}>
                <div className="h-[102px] w-[102px] relative">
                    <CircularProgressbarWithChildren
                        value={Number.isNaN(percentage) ? 0 : percentage}
                        styles={{
                            path: { stroke: color },
                            trail: { stroke: "#e5e7eb" },
                        }}
                    >
                        <Button
                            size='rounded'
                            variant={
                                percentage > 90 ? 'trainer_best'
                                    : percentage > 60 ? 'trainer_better'
                                    : percentage > 1 ? 'trainer_bad'
                                    : 'default'
                            }
                            className="h-[70px] w-[70px] border-b-8 group relative overflow-hidden px-4 py-2 transition-colors cursor-pointer"
                        >
                            {percentage > 90 && (
                                <motion.span
                                    initial={{ y: "100%" }}
                                    animate={{ y: "-100%" }}
                                    transition={{
                                        repeat: Infinity,
                                        repeatType: "mirror",
                                        duration: 1,
                                        ease: "linear",
                                    }}
                                    className="duration-300 absolute inset-0 z-0 scale-125 bg-gradient-to-t 
                                        from-yellow-400/0 from-40% via-white/100 to-indigo-400/0 to-60% transition-opacity"
                                />
                            )}

                            <RandomIcon
                                className={cn(
                                    "h-10 w-10",
                                    percentage > 1 ? 'text-primary-foreground' : 'text-slate-200'
                                )}
                            />
                        </Button>
                    </CircularProgressbarWithChildren>

                    {/* 🍩 ПОНЧИК ДЛЯ КВЕСТА */}
                    {showQuestDonut && !showHwIcon && (
                        <Image 
                            src={'/hwSvgs/donut.svg'}
                            height={32}
                            width={32}
                            alt='Квест'
                            className="absolute -top-2 -right-2 z-10 animate-bounce"
                        />
                    )}

                    {/* 🍟 HW ИКОНКА */}
                    {showHwIcon && (
                        <Image 
                            src={'/hwSvgs/friesW.svg'}
                            height={36}
                            width={36}
                            alt='ДЗ'
                            className="absolute -top-2 -left-2 z-10 animate-bounce"
                        />
                    )}
                </div>

                <button className="ml-4 rounded-2xl border-2 border-dashed border-neutral-400 bg-[#151F23]
                    px-6 py-3 uppercase text-sm font-semibold text-neutral-400 transition-all duration-300
                    hover:translate-x-[-4px] hover:translate-y-[-4px] hover:rounded-md
                    hover:shadow-[4px_4px_0px_gray]
                    active:translate-x-[0px] active:translate-y-[0px] active:rounded-2xl active:shadow-none cursor-pointer">
                    {t_lesson.title}
                </button>
            </div>
        </Link>
    );
};
