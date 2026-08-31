// app/learn/lesson-button.tsx

"use client";

import { TransitionLink } from "@/utils/TransitionLink";
import { motion } from "framer-motion";
import { useState } from "react";
import { Cake, CircleCheckBig, CircleX, Crown, Layers, Skull, Star, Lock, Zap, Flame, Gift } from "lucide-react";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css'
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { differenceInHours, isPast } from "date-fns";
import { ThunderBadge } from "@/components/thunder-badge";
import { LessonZigzagMascot } from "@/components/lesson-zigzag-mascot";
import {
    getUnitButtonColor,
    LOCKED_BUTTON_COLOR,
    LOCKED_BUTTON_BOTTOM_COLOR,
    LOCKED_ICON_COLOR,
    ACTIVE_ICON_COLOR,
    PALETTE_MINT,
} from "@/src/constants/lessonButtonColors";

const CONTINUE_EMOJIS = ["🥹", "🙃", "😇", "😎", "🤓", "🫡", "🤠", "💩"];

// Плашка "Продолжить" над уроком, где ученик последний раз решал задачи —
// очень медленный, еле заметный bounce вверх-вниз, чтобы притягивать взгляд,
// но не раздражать. Смайлик рядом со словом каждый раз случайный.
const ContinueBadge = ({ color }: { color: string }) => {
    const [emoji] = useState(() => CONTINUE_EMOJIS[Math.floor(Math.random() * CONTINUE_EMOJIS.length)]);

    return (
    <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-3 left-0 w-[102px] flex justify-center pointer-events-none z-10"
    >
        <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap border"
            style={{ backgroundColor: color, color: '#F2F7FB', borderColor: '#F2F7FB' }}
        >
            ПРОДОЛЖИТЬ {emoji}
        </span>
    </motion.div>
    );
};

interface lessonDone {
    lesson: number;
    done: number[];
}

type Props = {
    id: number;
    unitIndex: number;
    index: number;
    totalCount: number;
    locked?: boolean;
    current?: boolean;
    title: string;
    lessonStat: Array<lessonDone>;
    missedCIds: number[];
    dailyMissedCIds?: number[];
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
    // Урок, в котором пользователь последний раз решал задачи в этом курсе —
    // над ним показываем плашку "Продолжить".
    isLastTouched?: boolean;
}

export const LessonButton = ({
    id,
    unitIndex,
    index,
    totalCount,
    locked,
    current,
    title,
    lessonStat,
    missedCIds,
    dailyMissedCIds = [],
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
    isLastTouched = false,
}: Props) => {

    // Проверяем, есть ли в этом уроке нерешенные задачи из ДЗ и/или челленджа дня
    let isHwNumber = 0;
    missedCIds.forEach(missChalId => {
        if (challengeIdsInLesson.includes(missChalId)) {
            isHwNumber += 1;
        }
    });

    let isDailyNumber = 0;
    dailyMissedCIds.forEach(missChalId => {
        if (challengeIdsInLesson.includes(missChalId)) {
            isDailyNumber += 1;
        }
    });

    const cycleLength = 8;
    const cycleIndex = index % cycleLength;
    let baseIndentationLevel;

    if (cycleIndex <= 2) {
        baseIndentationLevel = cycleIndex;
    } else if (cycleIndex <= 4) {
        baseIndentationLevel = 4 - cycleIndex;
    } else if (cycleIndex <= 6) {
        baseIndentationLevel = 4 - cycleIndex;
    } else {
        baseIndentationLevel = cycleIndex - 8;
    }
    // Чётные юниты изгибаются влево первыми (как раньше), нечётные —
    // зеркально, вправо: просто инвертируем знак изгиба.
    const directionSign = unitIndex % 2 === 0 ? 1 : -1;
    const indentationLevel = directionSign * baseIndentationLevel;
    // На узких экранах амплитуда змейки уменьшается (min с vw), чтобы кружок
    // с прогресс-баром не вылезал за левый/правый край экрана телефона.
    const rightPosition = `calc(${indentationLevel} * min(40px, 7vw))`;

    // На экстремумах изгиба змейки (кружок максимально сдвинут в одну
    // сторону) с противоположной стороны остаётся самое пустое место —
    // туда и ставим декоративного маскота. Сторона зависит от направления
    // изгиба этого юнита (см. directionSign выше).
    const zigzagMascotSide: 'left' | 'right' | null =
        cycleIndex !== 2 && cycleIndex !== 6
            ? null
            : (cycleIndex === 2) === (directionSign > 0)
                ? 'right'
                : 'left';

    const isFirst = index === 0;
    const isLast = index === totalCount;
    const isLessonCompleted = completed || isMasteryCompleted;
    const unitColor = getUnitButtonColor(unitIndex);

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
    const showNeedMore = needMore > 0 && !isNextUnlocked && !isLessonCompleted && !locked;

    // Просроченное ДЗ рисуем не тут, а в бейдж-строке над названием урока
    // (см. isHomeworkExpired ниже) — вместе с пончиком и молнией.
    const isHomeworkExpired = !!homeworkStatus &&
        (homeworkStatus.status === 'expired' || isPast(new Date(homeworkStatus.dueDate)));

    // Получаем иконку статуса ДЗ
    const getHomeworkIcon = () => {
        if (!homeworkStatus || isHomeworkExpired) return null;

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
            <div id={`lesson-${id}`} className="relative flex flex-1 opacity-60" style={{
                right: `calc(-20px + ${rightPosition})`,
                marginTop: isFirst ? 28 : 24,
            }}>
                {zigzagMascotSide && <LessonZigzagMascot side={zigzagMascotSide} />}
                <div className="h-[102px] w-[102px]">
                    <div
                        className="h-[70px] w-[70px] rounded-full border-b-4 flex items-center justify-center"
                        style={{ backgroundColor: LOCKED_BUTTON_COLOR, borderColor: LOCKED_BUTTON_BOTTOM_COLOR }}
                    >
                        <Lock className="h-8 w-8" style={{ color: LOCKED_ICON_COLOR }} />
                    </div>
                </div>
                <div className="pt-8 ml-4 max-w-[150px] sm:max-w-[220px]">
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
            <TransitionLink href={href} aria-disabled={locked} style={{ pointerEvents: locked ? "none" : "auto" }}>
                <div id={`lesson-${id}`} className="relative flex flex-1" style={{
                    right: `calc(-20px + ${rightPosition})`,
                    marginTop: isFirst ? 28 : 24,
                }}>
                    {zigzagMascotSide && <LessonZigzagMascot side={zigzagMascotSide} />}
                    <div className="h-[102px] w-[102px] relative">
                        {isLastTouched && <ContinueBadge color={unitColor.button} />}
                        <div className="h-[70px] w-[70px] rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div className="pt-8 ml-4 max-w-[150px] sm:max-w-[220px]">
                        <p className="text-[#F2F7FB] font-medium line-through">{title}</p>
                        <p className="text-xs text-green-600 mt-1">Мастер! 🎓</p>
                    </div>
                </div>
            </TransitionLink>
        );
    }

    // Обычный доступный урок
    return (
        <TransitionLink href={href} aria-disabled={locked} style={{ pointerEvents: locked ? "none" : "auto" }}>
            <div id={`lesson-${id}`} className="relative flex flex-1 items-center group" style={{
                right: `calc(-20px + ${rightPosition})`,
                marginTop: isFirst ? 28 : 24,
            }}>
                {zigzagMascotSide && <LessonZigzagMascot side={zigzagMascotSide} />}
                <div className="h-[102px] w-[102px] relative flex-shrink-0">
                    {isLastTouched && <ContinueBadge color={unitColor.button} />}
                    <CircularProgressbarWithChildren
                        value={progressPercent}
                        styles={{
                            path: { stroke: isNextUnlocked ? "#22c55e" : "#eab308" },
                            trail: { stroke: LOCKED_BUTTON_COLOR },
                        }}
                    >
                        <Button
                            size='rounded'
                            variant={locked ? "locked" : "secondary"}
                            className="h-[70px] w-[70px] border-b-8 relative"
                            style={{
                                backgroundColor: locked ? LOCKED_BUTTON_COLOR : unitColor.button,
                                borderColor: locked ? LOCKED_BUTTON_BOTTOM_COLOR : unitColor.bottom,
                            }}
                        >
                            <Icon
                                className="h-10 w-10 fill-current stroke-current"
                                style={{ color: locked ? LOCKED_ICON_COLOR : ACTIVE_ICON_COLOR }}
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

                <div className="ml-4 max-w-[150px] sm:max-w-[220px]">
                    {(isHomeworkExpired || isHwNumber > 0 || isDailyNumber > 0) && (
                        <div className="mb-1.5 flex items-center gap-3">
                            {isHomeworkExpired && (
                                <Skull className="h-4 w-4 text-red-500" />
                            )}
                            {isHwNumber > 0 && (
                                <div className="flex items-center gap-1">
                                    <Image src="/hwSvgs/donut.svg" height={18} width={18} alt="ДЗ" />
                                    <span className="text-xs font-bold text-amber-400">{isHwNumber}</span>
                                </div>
                            )}
                            {isDailyNumber > 0 && (
                                <div className="flex items-center gap-1">
                                    <ThunderBadge size={18} />
                                    <span className="text-xs font-bold" style={{ color: PALETTE_MINT.button }}>{isDailyNumber}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <h1
                        className="inline-block px-3 py-1 rounded-full text-sm font-bold leading-none"
                        style={{
                            backgroundColor: `${locked ? LOCKED_ICON_COLOR : unitColor.button}1F`,
                            color: locked ? LOCKED_ICON_COLOR : unitColor.button,
                            border: `1.5px solid ${locked ? LOCKED_ICON_COLOR : unitColor.button}4D`,
                        }}
                    >
                        {title}
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {currentLessonStat[0]?.done[1] > 0 && (
                            <div className="flex items-center gap-1 bg-green-500/10 text-green-400 rounded-full px-2 py-0.5">
                                <CircleCheckBig className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">{currentLessonStat[0].done[1]}</span>
                            </div>
                        )}

                        {currentLessonStat[0]?.done[2] > 0 && (
                            <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 rounded-full px-2 py-0.5">
                                <CircleX className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">{currentLessonStat[0].done[2]}</span>
                            </div>
                        )}

                        {currentLessonStat[0]?.done[0] > 0 && (
                            <div className="flex items-center gap-1 bg-white/5 text-[#9AA7B0] rounded-full px-2 py-0.5">
                                <Layers className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">{currentLessonStat[0].done[0]}</span>
                            </div>
                        )}
                    </div>

                    {showNeedMore && (
                        <div
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                            style={{ backgroundColor: `${LOCKED_ICON_COLOR}26`, color: LOCKED_ICON_COLOR }}
                        >
                            <Lock className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">
                                Решите ещё {needMore} {declension(needMore, "задачу", "задачи", "задач")}
                            </span>
                        </div>
                    )}
                    {isNextUnlocked && !isLessonCompleted && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 rounded-full px-2.5 py-1">
                            <Zap className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">Следующий урок открыт</span>
                        </div>
                    )}
                </div>
            </div>
        </TransitionLink>
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

