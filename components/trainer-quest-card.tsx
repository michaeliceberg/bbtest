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
import { Flame, CheckCircle2, Circle, Dumbbell, PenLine, Clock, History, Gift, X, PartyPopper } from 'lucide-react';
import { LOTTIE_QUEST_MASCOT_LIST, getRandomLottie } from '@/src/constants/lottieConstants';
import FlamyHwDone from '@/public/Lottie/hw/FlamyHwDone.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Раньше поздравление ("Умничка! Квест выполнен! +1 к стрику · +N очков")
// жило отдельным блоком внизу карточки — пользователь попросил убрать его
// оттуда и перенести смысл в шапку (рядом с "Квест дня"), плашкой в цвет
// огонька стрика, с рандомным словом на каждое монтирование.
const DONE_WORDS = ['Умничка!', 'Молодец!', 'Красава!'];

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
    // Слово выбирается ДЕТЕРМИНИРОВАННО хэшем сырой строки dueDateIso (тот
    // же пропс, что и дедлайн — идентичен на сервере и клиенте as-is), а
    // не через Math.random()/useState — карточка сперва рендерится на
    // сервере (SSR), и если бы каждая сторона выбирала своё случайное
    // слово независимо, текст почти всегда не совпал бы при гидратации
    // (React ругается "Text content did not match" — воспроизведено
    // живьём при первой версии на Math.random()). В отличие от
    // inProgressMascot, который никогда не попадает в SSR-HTML вообще
    // (Lottie смонтирован с `dynamic(..., {ssr:false})`), doneWord — это
    // обычный текст в JSX, обязан совпадать 1-в-1 на обеих сторонах.
    // Хэш строки, а не `new Date(dueDateIso).getDate()` — важно: тот же
    // класс SSR/клиент-рассинхрона по часовому поясу, что уже отдельно
    // обходится чуть ниже для minutesLeft (сервер и браузер пользователя
    // могут быть в разных TZ, `.getDate()` от одного и того же момента
    // времени может дать РАЗНЫЙ календарный день) — хэш сырых символов
    // строки такого разночтения в принципе не допускает.
    const doneWord = DONE_WORDS[
        dueDateIso.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % DONE_WORDS.length
    ];

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

    // Подпись "сегодня" для золотой строки истории (см. ниже) — тот же
    // принцип "дата только на клиенте, после монтирования", что уже
    // применяется для minutesLeft чуть выше: date-fns/`format()` читает
    // ЛОКАЛЬНЫЕ календарные поля раннтайма, сервер и браузер пользователя
    // могут быть в разных часовых поясах и дать РАЗНЫЙ день для одного и
    // того же момента — вычислять на сервере (и тем более использовать
    // прямо в SSR-разметке) нельзя, иначе тот же класс hydration-мисматча,
    // что уже пойман и исправлен для doneWord выше.
    const [todayLabel, setTodayLabel] = useState<string | null>(null);
    useEffect(() => {
        setTodayLabel(format(new Date(), 'd MMM', { locale: ru }));
    }, []);

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 shrink-0 -my-1">
                        <Lottie animationData={isCompleted ? FlamyHwDone : inProgressMascot} loop autoplay />
                    </div>
                    <h3 className="font-bold text-lg text-[#F2F7FB] truncate">Квест дня</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {isCompleted && (
                        <div className="flex items-center gap-1 bg-amber-500/15 px-2 py-1 rounded-full">
                            <PartyPopper className="h-3 w-3 text-amber-500" />
                            <span className="text-xs font-bold text-amber-400 whitespace-nowrap">Выполнен! {doneWord}</span>
                        </div>
                    )}
                    {streak > 0 && (
                        <div className="flex items-center gap-1 bg-amber-500/15 px-2 py-1 rounded-full">
                            <Flame className="h-3 w-3 text-amber-500" />
                            <span className="text-xs font-bold text-amber-400">x{streak}</span>
                        </div>
                    )}
                </div>
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

            {!isCompleted && (
                <div className="space-y-2">
                    <QuestRow icon={Dumbbell} label="Пройди урок тренажёра" done={trainerDone} />
                    <QuestRow icon={PenLine} label="Реши задачу курса" done={taskDone} />
                </div>
            )}

            {(history.length > 0 || isCompleted) && (
                <details className="pt-1">
                    <summary className="cursor-pointer text-xs text-[#9AA7B0] hover:text-[#F2F7FB] flex items-center gap-2 select-none">
                        <History className="h-3.5 w-3.5" />
                        <span className="font-medium">
                            История ({history.length + (isCompleted ? 1 : 0)})
                        </span>
                    </summary>
                    <div className="mt-2 space-y-1.5">
                        {/* Сегодняшняя строка — золотая, отдельно от обычной
                            истории прошлых дней (getRecentQuestHistory нарочно
                            исключает сегодня, см. actions/generate-trainer-
                            quest.ts) — раньше сегодняшний статус показывали
                            зачёркнутые QuestRow выше, теперь при isCompleted
                            они скрыты, и результат дня виден только здесь. */}
                        {isCompleted && todayLabel && (
                            <div className="flex items-center justify-between text-xs bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 rounded-lg px-2.5 py-1.5">
                                <span className="text-amber-200 font-medium">{todayLabel}</span>
                                <span className="flex items-center gap-1 text-amber-300 font-bold">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> выполнен
                                </span>
                            </div>
                        )}
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
