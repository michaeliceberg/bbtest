// components/quests.tsx

'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import FlamyHwDoIt from "@/public/Lottie/hw/FlamyHwDoIt.json";
import FlamyHwDone from "@/public/Lottie/hw/FlamyHwDone.json";
import FlamyHwPanic from "@/public/Lottie/hw/FlamyHwPanic.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// "Осталось мало времени [до конца дня]" — тот же клиентский час-порог и
// тот же принцип (проверка ПОСЛЕ монтирования, не в самом рендере —
// избегает SSR/часовой-пояс рассинхрона), что уже применяется в
// components/streak-risk-banner.tsx для похожей идеи "поздно".
const PANIC_HOUR = 20 // 20:00 по локальному времени пользователя

type Props = {
    points: number;
    hwList: number[];
    isCompleted?: boolean;
    // isCompleted?: boolean | null;  // 👈 добавили null
};

export const Quests = ({ points, hwList, isCompleted = false }: Props) => {
    const hwAssigned = hwList[0] || 0;
    const hwDone = hwList[1] || 0;
    const progress = hwAssigned > 0 ? (hwDone / hwAssigned) * 100 : 0;
    const isHwCompleted = isCompleted || (hwAssigned > 0 && hwDone >= hwAssigned);

    const [isLate, setIsLate] = useState(false);
    useEffect(() => {
        setIsLate(new Date().getHours() >= PANIC_HOUR);
    }, []);

    // Паника — только пока реально есть что доделывать и время поджимает;
    // выполненное или ещё не назначенное ДЗ никогда не "паникует".
    const isPanicking = !isHwCompleted && hwAssigned > 0 && isLate;

    return (
        <div className="relative border-2 rounded-xl p-4 space-y-4 overflow-hidden">
            {/* Приглушённый маскот-подсказка "пора делать" на заднем плане
                таблички, пока ДЗ не выполнено (и ещё не наступила паника) —
                просьба пользователя "серым цветом нарисовать FlamyHwDoIt". */}
            {!isHwCompleted && !isPanicking && hwAssigned > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none grayscale opacity-10">
                    <div className="w-28 h-28">
                        <Lottie animationData={FlamyHwDoIt} loop autoplay />
                    </div>
                </div>
            )}

            <div className="relative flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">
                        Домашнее задание
                    </h3>
                    {isHwCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Выполнено
                        </span>
                    )}
                </div>
                <Link href='/progress'>
                    <Button size='sm' variant='primaryOutline'>
                        Подробнее
                    </Button>
                </Link>
            </div>

            <div className="relative flex items-center w-full gap-x-3">
                {isHwCompleted ? (
                    <div className="w-10 h-10 shrink-0">
                        <Lottie animationData={FlamyHwDone} loop autoplay />
                    </div>
                ) : isPanicking ? (
                    <div className="w-10 h-10 shrink-0">
                        <Lottie animationData={FlamyHwPanic} loop autoplay />
                    </div>
                ) : (
                    <Image
                        src='/points.svg'
                        alt='Points'
                        width={40}
                        height={40}
                    />
                )}

                <div className="flex flex-col gap-y-2 w-full">
                    <div className="flex flex-1 justify-between">
                        <p className="text-neutral-700 text-sm font-bold">
                            Реши {hwAssigned} задач
                        </p>
                        <p className={`text-sm font-bold ${isHwCompleted ? 'text-green-600' : isPanicking ? 'text-rose-600' : 'text-neutral-700'}`}>
                            {hwDone}/{hwAssigned}
                        </p>
                    </div>

                    {/* Кастомный прогресс бар без стороннего Progress */}
                    <div className={`w-full rounded-full h-2 ${isHwCompleted ? 'bg-green-100' : isPanicking ? 'bg-rose-100' : 'bg-neutral-100'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isHwCompleted ? 'bg-green-500' : isPanicking ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {!isHwCompleted && hwAssigned > 0 && (
                <p className={`relative text-xs font-medium text-center ${isPanicking ? 'text-rose-600' : 'text-amber-600'}`}>
                    {isPanicking ? '⏰' : '⚡'} Реши оставшиеся {hwAssigned - hwDone} задач для выполнения квеста
                </p>
            )}

            {isHwCompleted && (
                <p className="relative text-xs text-green-600 font-medium text-center">
                    🎉 Молодец! Задание выполнено. +{hwAssigned * 5} очков зачислено
                </p>
            )}
        </div>
    );
};
