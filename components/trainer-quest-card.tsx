// components/trainer-quest-card.tsx
//
// Сайдбар-карточка "Квест дня" (раньше "Ежедневный квест" — переименовано
// по просьбе пользователя, "квест" звучит суше "challenge"-подобного
// названия, которое сложилось у пользователя в голове). Показывается и
// на /trainer, и на /learn (один и тот же компонент, один и тот же
// смысл "позанимался сегодня и там, и там" — раньше существовал только
// на /trainer, пользователь справедливо заметил рассинхрон).
//
// Раньше требовала пройти КОНКРЕТНЫЙ список из 3-5 случайно выбранных
// уроков одной темы — пользователь счёл это запутанным ("что за номера,
// почему именно эти") и явно попросил заменить на два простых, общих
// пункта: любой урок тренажёра + любая задача курса.

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Flame, CheckCircle2, Circle, Dumbbell, PenLine } from 'lucide-react';
import { LOTTIE_QUEST_MASCOT_LIST, getRandomLottie } from '@/src/constants/lottieConstants';
import FlamyHwDone from '@/public/Lottie/hw/FlamyHwDone.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Props = {
    trainerDone: boolean;
    taskDone: boolean;
    isCompleted: boolean;
    streak: number;
};

const QuestRow = ({ icon: Icon, label, done }: { icon: typeof Dumbbell; label: string; done: boolean }) => (
    <div
        className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
            done ? 'bg-violet-500/10 border-violet-500/40' : 'bg-[#1A252B] border-[#3A464E]'
        }`}
    >
        <div className="flex items-center gap-2">
            {done ? (
                <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
            ) : (
                <Circle className="h-4 w-4 text-[#56646C] shrink-0" />
            )}
            <Icon className="h-4 w-4 text-[#9AA7B0] shrink-0" />
            <span className={`text-sm ${done ? 'text-violet-300 line-through' : 'text-[#F2F7FB]'}`}>
                {label}
            </span>
        </div>
        <span className={`text-xs font-bold ${done ? 'text-violet-400' : 'text-[#9AA7B0]'}`}>
            {done ? '1' : '0'}/1
        </span>
    </div>
);

export const TrainerQuestCard = ({ trainerDone, taskDone, isCompleted, streak }: Props) => {
    // Пока квест не выполнен — один из двух маскотов-приглашений
    // случайно (выбор один раз на монтирование, тот же паттерн
    // useState(() => ...), что уже применяется для похожих случайных
    // анимаций в проекте — SkillTagBadge/StreakCelebrationToast).
    const [inProgressMascot] = useState(() => getRandomLottie(LOTTIE_QUEST_MASCOT_LIST));

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 shrink-0 -my-1">
                        <Lottie animationData={isCompleted ? FlamyHwDone : inProgressMascot} loop autoplay />
                    </div>
                    <h3 className="font-bold text-[#F2F7FB]">Квест дня</h3>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500/15 px-2 py-1 rounded-full">
                        <Flame className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-bold text-amber-400">x{streak}</span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <QuestRow icon={Dumbbell} label="Пройди урок тренажёра" done={trainerDone} />
                <QuestRow icon={PenLine} label="Реши задачу курса" done={taskDone} />
            </div>

            {isCompleted && (
                <div className="bg-violet-500/10 border border-violet-500/40 rounded-lg p-2 text-center">
                    <p className="text-sm text-violet-300 font-bold">Умничка! Квест выполнен!</p>
                    <p className="text-xs text-violet-400/80">+1 к стрику</p>
                </div>
            )}
        </div>
    );
};
