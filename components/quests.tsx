// components/quests.tsx

'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
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
        <div className="relative rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-4 overflow-hidden">
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

            <div className="relative flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 shrink-0 -my-1">
                        {isHwCompleted ? (
                            <Lottie animationData={FlamyHwDone} loop autoplay />
                        ) : isPanicking ? (
                            <Lottie animationData={FlamyHwPanic} loop autoplay />
                        ) : (
                            <Image src='/points.svg' alt='Points' width={36} height={36} />
                        )}
                    </div>
                    <h3 className="font-bold text-lg text-[#F2F7FB] truncate">
                        Домашнее задание
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {isHwCompleted && (
                        <div className="flex items-center gap-1 bg-violet-500/15 px-2 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3 text-violet-400" />
                            <span className="text-xs font-bold text-violet-300 whitespace-nowrap">Выполнено</span>
                        </div>
                    )}
                    <Link href='/progress'>
                        <Button size='sm' variant='primaryOutline'>
                            Подробнее
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Тот же QuestRow-паттерн, что и в "Квест дня" (trainer-quest-card.tsx):
                иконка статуса + иконка типа + подпись слева, счётчик справа,
                фиолетовая рамка при выполнении вместо нейтральной. */}
            <div
                className={`relative flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isHwCompleted ? 'bg-violet-500/10 border-violet-500/40' : 'bg-[#1A252B] border-[#3A464E]'
                }`}
            >
                <div className="flex items-center gap-2">
                    {isHwCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                    ) : (
                        <Circle className="h-4 w-4 text-[#56646C] shrink-0" />
                    )}
                    <BookOpen className="h-4 w-4 text-[#9AA7B0] shrink-0" />
                    <span className={`text-sm ${isHwCompleted ? 'text-violet-300 line-through' : 'text-[#F2F7FB]'}`}>
                        Реши {hwAssigned} задач
                    </span>
                </div>
                <span
                    className={`text-xs font-bold ${
                        isHwCompleted ? 'text-violet-400' : isPanicking ? 'text-rose-400' : 'text-[#9AA7B0]'
                    }`}
                >
                    {hwDone}/{hwAssigned}
                </span>
            </div>

            {/* Кастомный прогресс бар без стороннего Progress — доп. деталь
                поверх бинарного QuestRow, т.к. hwAssigned обычно больше 1 */}
            <div className={`relative w-full rounded-full h-2 ${isHwCompleted ? 'bg-violet-500/15' : isPanicking ? 'bg-rose-500/15' : 'bg-[#1A252B]'}`}>
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isHwCompleted ? 'bg-violet-500' : isPanicking ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {!isHwCompleted && hwAssigned > 0 && (
                <p className={`relative text-xs font-medium text-center ${isPanicking ? 'text-rose-400' : 'text-amber-400'}`}>
                    {isPanicking ? '⏰' : '⚡'} Реши оставшиеся {hwAssigned - hwDone} задач для выполнения квеста
                </p>
            )}

            {isHwCompleted && (
                <p className="relative text-xs text-violet-300 font-medium text-center">
                    🎉 Молодец! Задание выполнено. +{hwAssigned * 5} очков зачислено
                </p>
            )}
        </div>
    );
};
