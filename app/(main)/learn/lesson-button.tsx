// app/learn/lesson-button.tsx

"use client";

import Link from "next/link";
import { Cake, CircleCheckBig, CircleX, Crown, Layers, Skull, Star, Lock, Target, Zap, Flame, Gift } from "lucide-react";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css'
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { differenceInHours, isPast } from "date-fns";

interface lessonDone {
    lesson: number;
    done: number[];
}

type Props = {
    id: number;
    index: number;
    totalCount: number;
    locked?: boolean;
    current?: boolean;
    title: string;
    lessonStat: Array<lessonDone>;
    missedCIds: number[];
    challengeIdsInLesson: number[];
    homeworkStatus?: { homeworkId: number; status: string; dueDate: Date } | null;
    completed?: boolean;
    // Новые пропсы для системы открытия уроков
    isUnlocked?: boolean;
    isCompleted?: boolean;
    progress?: number;
    needMore?: number;
    totalChallenges?: number;
    correctChallenges?: number;
    challengesNeeded?: number;
}

export const LessonButton = ({
    id,
    index,
    totalCount,
    locked,
    current,
    title,
    lessonStat,
    missedCIds,
    challengeIdsInLesson,
    homeworkStatus,
    completed,
    // Новые пропсы со значениями по умолчанию
    isUnlocked = true,
    isCompleted: isMasteryCompleted = false,
    progress = 0,
    needMore = 0,
    totalChallenges = 0,
    correctChallenges = 0,
    challengesNeeded = 4,
}: Props) => {

    // Проверяем, есть ли в этом уроке нерешенные задачи из HW
    let isHwNumber = 0;
    missedCIds.forEach(missChalId => {
        if (challengeIdsInLesson.includes(missChalId)) {
            isHwNumber += 1;
        }
    });

    const cycleLength = 8;
    const cycleIndex = index % cycleLength;
    let indentationLevel;

    if (cycleIndex <= 2) {
        indentationLevel = cycleIndex;
    } else if (cycleIndex <= 4) {
        indentationLevel = 4 - cycleIndex;
    } else if (cycleIndex <= 6) {
        indentationLevel = 4 - cycleIndex;
    } else {
        indentationLevel = cycleIndex - 8;
    }
    const rightPosition = indentationLevel * 40;

    const isFirst = index === 0;
    const isLast = index === totalCount;
    const isLessonCompleted = completed || isMasteryCompleted;

    const Icon = title.slice(-1) === '3' ? Skull 
        : title.slice(-1) === '4' ? Cake 
        : isLast ? Crown 
        : Star;

    const href = `/lesson/${id}`;

    const currentLessonStat = lessonStat.filter((el) => el.lesson === id);
    const oldPercentage = (currentLessonStat[0]?.done[1] + currentLessonStat[0]?.done[2]) / currentLessonStat[0]?.done[0] * 100 || 0;
    const displayProgress = progress > 0 ? progress * 100 : oldPercentage;
    const progressPercent = Math.round(displayProgress);

    const isNextUnlocked = correctChallenges >= challengesNeeded;
    const showNeedMore = needMore > 0 && !isNextUnlocked && !isLessonCompleted;

    // Получаем иконку статуса ДЗ
    const getHomeworkIcon = () => {
        if (!homeworkStatus) return null;
        
        if (homeworkStatus.status === 'expired' || isPast(new Date(homeworkStatus.dueDate))) {
            return (
                <div className="absolute -top-2 -right-2 z-10">
                    <Skull className="h-5 w-5 text-red-500 fill-red-500" />
                </div>
            );
        }
        
        const hoursLeft = differenceInHours(new Date(homeworkStatus.dueDate), new Date());
        if (hoursLeft < 3) {
            return (
                <div className="absolute -top-2 -right-2 z-10 animate-pulse">
                    <div className="bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                        ⚡
                    </div>
                </div>
            );
        }
        
        return (
            <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    ДЗ
                </div>
            </div>
        );
    };

    // Если урок заблокирован
    if (!isUnlocked && !isLessonCompleted) {
        return (
            <div className="relative flex flex-1 opacity-60" style={{
                right: `${-20 + rightPosition}px`,
                marginTop: isFirst ? 60 : 24,
            }}>
                <div className="h-[102px] w-[102px]">
                    <div className="h-[70px] w-[70px] rounded-full bg-[#2E3A40] flex items-center justify-center">
                        <Lock className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="pt-8 ml-4">
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    {needMore > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                            🔒 Решите {needMore} задач в предыдущем уроке
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Если урок полностью пройден (мастерство)
    if (isLessonCompleted) {
        return (
            <Link href={href} aria-disabled={locked} style={{ pointerEvents: locked ? "none" : "auto" }}>
                <div className="relative flex flex-1" style={{
                    right: `${-20 + rightPosition}px`,
                    marginTop: isFirst ? 60 : 24,
                }}>
                    <div className="h-[102px] w-[102px]">
                        <div className="h-[70px] w-[70px] rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div className="pt-8 ml-4">
                        <p className="text-[#F2F7FB] font-medium line-through">{title}</p>
                        <p className="text-xs text-green-600 mt-1">Мастер! 🎓</p>
                    </div>
                </div>
            </Link>
        );
    }

    // Обычный доступный урок
    return (
        <Link href={href} aria-disabled={locked} style={{ pointerEvents: locked ? "none" : "auto" }}>
            <div className="relative flex flex-1 group" style={{
                right: `${-20 + rightPosition}px`,
                marginTop: isFirst ? 60 : 24,
            }}>
                <div className="h-[102px] w-[102px] relative">
                    <CircularProgressbarWithChildren
                        value={progressPercent}
                        styles={{
                            path: { stroke: isNextUnlocked ? "#22c55e" : "#eab308" },
                            trail: { stroke: "#e5e7eb" },
                        }}
                    >
                        <Button
                            size='rounded'
                            variant={locked ? "locked" : "secondary"}
                            className="h-[70px] w-[70px] border-b-8 relative"
                        >
                            <Icon
                                className={cn(
                                    "h-10 w-10",
                                    locked
                                        ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
                                        : "fill-primary-foreground text-primary-foreground"
                                )}
                            />

                            {isHwNumber > 0 && (
                                <Image 
                                    src='/hwSvgs/donut.svg' 
                                    height={40} 
                                    width={40} 
                                    alt='Mascot' 
                                    className="absolute top-0 left-0 animate-bounce bg-[#151F23] rounded-2xl"
                                />           
                            )}
                        </Button>
                    </CircularProgressbarWithChildren>
                    {getHomeworkIcon()}
                </div>

                <div className="pt-8 ml-4">
                    <div>
                        <h1 className="px-3 py-0.5 border-2 font-bold text-green-500 bg-[#151F23] rounded-xl tracking-white z-10">
                            {title}                
                        </h1>
                    </div>    
                    <div className="mt-1">
                        <div className="flex flex-1 gap-2">
                            {currentLessonStat[0]?.done[1] > 0 && (
                                <div className="flex mr-1 items-center">
                                    <CircleCheckBig className='h-4 w-4 stroke-2 text-green-500 mr-1' />
                                    <p className='text-xs text-green-500 font-bold'>{currentLessonStat[0].done[1]}</p>
                                </div>
                            )}

                            {currentLessonStat[0]?.done[2] > 0 && (
                                <div className="flex mr-1 items-center">
                                    <CircleX className='h-4 w-4 stroke-2 text-rose-500 mr-1' />
                                    <p className='text-xs text-rose-500 font-bold'>{currentLessonStat[0].done[2]}</p>
                                </div>
                            )}

                            {currentLessonStat[0]?.done[0] > 0 && (
                                <div className="flex mr-1 items-center">
                                    <Layers className='h-4 w-4 stroke-2 text-neutral-400 mr-1' />
                                    <p className='text-xs text-neutral-400 font-bold'>{currentLessonStat[0].done[0]}</p>
                                </div>
                            )}
                        </div>

                        {showNeedMore && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Решите ещё {needMore} {declension(needMore, "задачу", "задачи", "задач")}
                            </p>
                        )}
                        {isNextUnlocked && !isLessonCompleted && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                ✅ Следующий урок открыт!
                            </p>
                        )}
                    </div>    
                </div>
            </div>
        </Link>
    );
};

function declension(n: number, one: string, two: string, five: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod100 >= 11 && mod100 <= 19) return five;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return two;
    return five;
}

