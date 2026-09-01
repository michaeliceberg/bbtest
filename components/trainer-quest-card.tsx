// components/trainer-quest-card.tsx
//
// Сайдбар-карточка "Квест дня" — единственный оставшийся дневной квест
// (раньше на /learn параллельно жил ещё "Челлендж дня" в
// components/homework-list.tsx с конкретными фиксированными задачами;
// пользователь явно попросил объединить оба в один: дедлайн-давление и
// очковый бонус и историю от старого "Челлендж дня", но с гибкой целью
// "любая задача/любой урок" от этого компонента — см. actions/
// generate-trainer-quest.ts). Показывается и на /trainer, и на /learn —
// один и тот же компонент, один и тот же смысл "позанимался сегодня и
// там, и там".

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Flame, CheckCircle2, Circle, Dumbbell, PenLine, Clock, History, Gift, X } from 'lucide-react';
import { LOTTIE_QUEST_MASCOT_LIST, getRandomLottie } from '@/src/constants/lottieConstants';
import FlamyHwDone from '@/public/Lottie/hw/FlamyHwDone.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type QuestHistoryEntry = {
    date: string;
    isCompleted: boolean;
};

type Props = {
    trainerDone: boolean;
    taskDone: boolean;
    isCompleted: boolean;
    streak: number;
    dueDateIso: string;
    pointsReward: number;
    history: QuestHistoryEntry[];
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

export const TrainerQuestCard = ({ trainerDone, taskDone, isCompleted, streak, dueDateIso, pointsReward, history }: Props) => {
    // Пока квест не выполнен — один из двух маскотов-приглашений
    // случайно (выбор один раз на монтирование, тот же паттерн
    // useState(() => ...), что уже применяется для похожих случайных
    // анимаций в проекте — SkillTagBadge/StreakCelebrationToast).
    const [inProgressMascot] = useState(() => getRandomLottie(LOTTIE_QUEST_MASCOT_LIST));

    // Обратный отсчёт до дедлайна — тот же принцип, что уже применяется
    // в streak-risk-banner.tsx/quests.tsx: время суток считается ТОЛЬКО
    // на клиенте, после монтирования, чтобы не ловить SSR/часовой-пояс
    // рассинхрон.
    const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
    useEffect(() => {
        setMinutesLeft(differenceInMinutes(new Date(dueDateIso), new Date()));
    }, [dueDateIso]);

    const isUrgent = minutesLeft !== null && minutesLeft < 180;
    const deadlineText = minutesLeft === null
        ? null
        : minutesLeft < 60
            ? `${Math.max(minutesLeft, 0)} мин`
            : `${Math.floor(minutesLeft / 60)} ч`;

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

            {!isCompleted && deadlineText && (
                <div className={`flex items-center gap-1.5 text-xs ${isUrgent ? 'text-rose-400' : 'text-[#9AA7B0]'}`}>
                    <Clock className={`h-3.5 w-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
                    <span>Успей за {deadlineText}</span>
                    <span className="flex items-center gap-1 ml-auto text-amber-400">
                        <Gift className="h-3.5 w-3.5" />+{pointsReward}
                    </span>
                </div>
            )}

            <div className="space-y-2">
                <QuestRow icon={Dumbbell} label="Пройди урок тренажёра" done={trainerDone} />
                <QuestRow icon={PenLine} label="Реши задачу курса" done={taskDone} />
            </div>

            {isCompleted && (
                <div className="bg-violet-500/10 border border-violet-500/40 rounded-lg p-2 text-center">
                    <p className="text-sm text-violet-300 font-bold">Умничка! Квест выполнен!</p>
                    <p className="text-xs text-violet-400/80">+1 к стрику · +{pointsReward} очков</p>
                </div>
            )}

            {history.length > 0 && (
                <details className="pt-1">
                    <summary className="cursor-pointer text-xs text-[#9AA7B0] hover:text-[#F2F7FB] flex items-center gap-2 select-none">
                        <History className="h-3.5 w-3.5" />
                        <span className="font-medium">История ({history.length})</span>
                    </summary>
                    <div className="mt-2 space-y-1.5">
                        {history.map((entry) => (
                            <div
                                key={entry.date}
                                className="flex items-center justify-between text-xs bg-[#1A252B] rounded-lg px-2.5 py-1.5"
                            >
                                <span className="text-[#9AA7B0]">
                                    {format(new Date(entry.date), 'd MMM', { locale: ru })}
                                </span>
                                {entry.isCompleted ? (
                                    <span className="flex items-center gap-1 text-violet-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> выполнен
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[#56646C]">
                                        <X className="h-3.5 w-3.5" /> пропущен
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
};
