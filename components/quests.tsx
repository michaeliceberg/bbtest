// components/quests.tsx

import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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

    return (
        <div className="border-2 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between w-full">
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

            <div className="flex items-center w-full gap-x-3">
                {isHwCompleted ? (
                    <div className="rounded-full p-2 bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
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
                        <p className={`text-sm font-bold ${isHwCompleted ? 'text-green-600' : 'text-neutral-700'}`}>
                            {hwDone}/{hwAssigned}
                        </p>
                    </div>

                    {/* Кастомный прогресс бар без стороннего Progress */}
                    <div className={`w-full rounded-full h-2 ${isHwCompleted ? 'bg-green-100' : 'bg-neutral-100'}`}>
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${isHwCompleted ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {!isHwCompleted && hwAssigned > 0 && (
                <p className="text-xs text-amber-600 font-medium text-center">
                    ⚡ Реши оставшиеся {hwAssigned - hwDone} задач для выполнения квеста
                </p>
            )}

            {isHwCompleted && (
                <p className="text-xs text-green-600 font-medium text-center">
                    🎉 Молодец! Задание выполнено. +{hwAssigned * 5} очков зачислено
                </p>
            )}
        </div>
    );
};