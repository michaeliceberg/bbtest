// components/trainer-quest-card.tsx
//
// Сайдбар-карточка "Ежедневный квест" на /trainer. Раньше требовала
// пройти КОНКРЕТНЫЙ список из 3-5 случайно выбранных уроков одной темы —
// пользователь счёл это запутанным ("что за номера, почему именно эти")
// и явно попросил заменить на два простых, общих пункта: любой урок
// тренажёра + любая задача курса. Заодно приведена к единому тёмному
// визуальному языку остальных карточек сайдбара (LevelCard/
// TrainerQuestRewardsScreen) — раньше здесь были остатки светлой темы
// (bg-emerald-50/text-emerald-600 на тёмном фоне), тоже отмечено
// пользователем как несогласованное.

import { Flame, CheckCircle2, Circle, Target, Dumbbell, PenLine } from 'lucide-react';

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
    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-[#F2F7FB]">Ежедневный квест</h3>
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
                <div className="bg-violet-500/10 border border-violet-500/40 rounded-lg p-2 text-center text-sm text-violet-300 font-medium">
                    Квест выполнен! +1 к стрику
                </div>
            )}
        </div>
    );
};
