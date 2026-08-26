// app/lesson/challenge-nav.tsx
//
// Панель выбора номера задачи в уроке. По умолчанию — тонкая горизонтально
// прокручиваемая строка (активный номер всегда центрируется автоскроллом),
// чтобы не занимать экран в уроках с большим числом задач (30-40+). Кнопка
// "▾" справа разворачивает панель в полную сетку для обзора/дальнего прыжка.

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ThunderBadge } from "@/components/thunder-badge";
import { vibrate } from "@/lib/haptics";

type ChallengeItem = { id: number };

type Props = {
    challenges: ChallengeItem[];
    activeId: number;
    doneChallengesId: number[];
    wrongChallengesId: number[];
    dailyChallengeIds?: number[];
    hwChallengeIds?: number[];
    unitColor: { button: string; bottom: string };
    onClickNumber: (num: number) => void;
};

export const ChallengeNav = ({
    challenges,
    activeId,
    doneChallengesId,
    wrongChallengesId,
    dailyChallengeIds = [],
    hwChallengeIds = [],
    unitColor,
    onClickNumber,
}: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeButtonRef = useRef<HTMLButtonElement>(null);

    // Активный номер всегда по центру свёрнутой строки — и при первом
    // рендере, и при переходе на следующую/предыдущую задачу.
    useEffect(() => {
        if (isExpanded) return;
        activeButtonRef.current?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
        });
    }, [activeId, isExpanded]);

    const renderButton = (
        challengeItem: ChallengeItem,
        index: number,
        ref?: React.Ref<HTMLButtonElement>,
        fill?: boolean,
    ) => {
        const isDaily = dailyChallengeIds.includes(challengeItem.id);
        const isTeacherHW = !isDaily && hwChallengeIds.includes(challengeItem.id);
        const isDone = doneChallengesId.includes(challengeItem.id);
        const isWrong = wrongChallengesId.includes(challengeItem.id);
        const isActive = activeId === challengeItem.id;
        const showDonut = isTeacherHW && !isDone;
        const showThunder = isDaily && !isDone;

        const bg = isWrong ? 'rgba(244,63,94,0.14)' : isDone ? 'rgba(74,222,128,0.14)' : '#1A252B';
        const color = isWrong ? '#fb7185' : isDone ? '#4ade80' : '#9AA7B0';

        return (
            <button
                ref={ref}
                key={challengeItem.id}
                onClick={() => { vibrate('light'); onClickNumber(challengeItem.id + 1); }}
                className={`relative h-7 rounded-lg text-xs font-semibold transition-colors ${fill ? 'w-full' : 'w-7 flex-shrink-0'}`}
                style={{
                    backgroundColor: isActive ? unitColor.button : bg,
                    color: isActive ? '#151F23' : color,
                }}
            >
                {index + 1}

                {showDonut && (
                    <span className="absolute -top-1.5 -right-1 text-[10px]">🍩</span>
                )}
                {showThunder && (
                    <span className="absolute -top-2 -right-2">
                        <ThunderBadge size={16} />
                    </span>
                )}
            </button>
        );
    };

    if (isExpanded) {
        return (
            <div className="flex items-start gap-1.5">
                <div className="flex-1 grid grid-cols-7 sm:grid-cols-10 gap-1">
                    {challenges.map((challengeItem, index) => renderButton(challengeItem, index, undefined, true))}
                </div>
                <button
                    type="button"
                    onClick={() => { vibrate('light'); setIsExpanded(false); }}
                    aria-label="Свернуть список задач"
                    className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-[#1A252B] text-[#9AA7B0] hover:text-[#F2F7FB] transition-colors"
                >
                    <ChevronUp className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <div
                ref={scrollRef}
                className="flex-1 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {challenges.map((challengeItem, index) =>
                    renderButton(challengeItem, index, challengeItem.id === activeId ? activeButtonRef : undefined)
                )}
            </div>
            <button
                type="button"
                onClick={() => { vibrate('light'); setIsExpanded(true); }}
                aria-label="Показать все задачи урока"
                className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-[#1A252B] text-[#9AA7B0] hover:text-[#F2F7FB] transition-colors"
            >
                <ChevronDown className="h-4 w-4" />
            </button>
        </div>
    );
};
