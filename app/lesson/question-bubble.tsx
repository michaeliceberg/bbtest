// app/lesson/question-bubble.tsx

import Lottie from "lottie-react";
import Latex from 'react-latex-next';
import { Skull, Home, User, Coins, CheckCircle, XCircle } from 'lucide-react';
import { differenceInHours, isPast } from 'date-fns';
import { motion } from "framer-motion";
import { NoRightAnswer } from "@/components/hover-card";
import { useState, useRef, useEffect } from "react";
import { PALETTE_RED } from "@/src/constants/lessonButtonColors";

import LottieRainbow from '@/public/LottieSelectRainbow.json'
import LottieCrown from '@/public/LottieSelectCrown.json'
import LottieDiamond from '@/public/LottieSelectDiamond.json'
import LottieSparks from '@/public/LottieSelectSparks.json'
import LottieStars from '@/public/LottieSelectStars.json'
import LottieButterfly from '@/public/LottieSelectButterfly.json'

const mascotAnimations = [
    { lottie: LottieRainbow, name: "rainbow" },
    { lottie: LottieCrown, name: "crown" },
    { lottie: LottieDiamond, name: "diamond" },
    { lottie: LottieSparks, name: "sparks" },
    { lottie: LottieStars, name: "stars" },
    { lottie: LottieButterfly, name: "butterfly" },
]

type Props = {
    unitColor: { button: string; bottom: string };
    question: string;
    pts: number;
    author: string;
    timesDoneWrong: number;
    timesDone: number;
    isHWChallenge: boolean;
    isCompleted?: boolean;
    homeworkStatus?: { status: string; dueDate: Date } | null;
    isCorrect?: boolean;
    isWrong?: boolean;
    challengeId: number;
}

export const QuestionBubble = ({
    unitColor,
    question,
    pts,
    author,
    timesDoneWrong,
    timesDone,
    isHWChallenge,
    isCompleted = false,
    homeworkStatus,
    isCorrect,
    isWrong,
    challengeId,
}: Props) => {
    const correctAttempts = timesDone - timesDoneWrong;

    // 🔥 Используем ref для хранения текущей анимации, чтобы она не менялась при ререндерах
    const [currentMascot, setCurrentMascot] = useState(() => {
        // Случайная анимация при первом рендере
        return mascotAnimations[Math.floor(Math.random() * mascotAnimations.length)];
    });

    // 🔥 Отслеживаем правильные/неправильные ответы и меняем анимацию только тогда
    const prevIsCorrect = useRef(isCorrect);
    const prevIsWrong = useRef(isWrong);

    useEffect(() => {
        // Когда приходит правильный ответ - меняем анимацию
        if (isCorrect && !prevIsCorrect.current) {
            const randomMascot = mascotAnimations[Math.floor(Math.random() * mascotAnimations.length)];
            setCurrentMascot(randomMascot);
        }

        prevIsCorrect.current = isCorrect;
        prevIsWrong.current = isWrong;
    }, [isCorrect, isWrong]);

    // Цвет и текст бейджа ДЗ — просрочено/срочно тревожным красным из палитры,
    // обычное ожидающее ДЗ — нейтрально, в цвете текущего юнита.
    const getHomeworkBadge = () => {
        if (isCompleted) return null;
        if (!isHWChallenge) return null;

        const isOverdue = homeworkStatus?.status === 'expired'
            || (homeworkStatus?.dueDate && isPast(new Date(homeworkStatus.dueDate)));
        if (isOverdue) {
            return { text: 'Просрочено', icon: Skull, color: PALETTE_RED.button };
        }

        if (homeworkStatus?.dueDate) {
            const hoursLeft = differenceInHours(new Date(homeworkStatus.dueDate), new Date());
            if (hoursLeft < 3) {
                return { text: 'Срочно', icon: Skull, color: PALETTE_RED.button };
            }
        }

        return { text: 'ДЗ', icon: Home, color: unitColor.button };
    };

    const badge = getHomeworkBadge();

    return (
        <div className="w-full p-3 md:p-4">
            {/* Персонаж и вопрос */}
            <div className="flex gap-3">
                <motion.div
                    className="flex-shrink-0"
                    animate={isCorrect ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                    } : isWrong ? {
                        scale: [1, 0.9, 1],
                        x: [0, -5, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-10 h-10 md:w-12 md:h-12">
                        <Lottie
                            animationData={currentMascot.lottie}
                            loop={true}
                            autoplay={true}
                        />
                    </div>
                </motion.div>

                <div className="flex-1 pt-0.5">
                    <div className="text-[#F2F7FB] text-sm md:text-base leading-relaxed">
                        <Latex>{question}</Latex>
                    </div>
                </div>
            </div>

            {/* Единая строка меты: статистика, ДЗ, "нет ответа", очки, автор */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
                {correctAttempts > 0 && (
                    <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{correctAttempts}</span>
                    </div>
                )}
                {timesDoneWrong > 0 && (
                    <div className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{timesDoneWrong}</span>
                    </div>
                )}
                {badge && (
                    <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${badge.color}1F`, color: badge.color }}
                    >
                        <badge.icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{badge.text}</span>
                    </div>
                )}

                <div className="scale-90">
                    <NoRightAnswer challengeId={challengeId} />
                </div>

                <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${unitColor.button}1F`, color: unitColor.button }}
                >
                    <Coins className="w-3.5 h-3.5" />
                    <span className="font-bold text-sm">+{pts}</span>
                </div>

                <div className="flex items-center gap-1 text-[#9AA7B0]/60 text-[11px] ml-auto">
                    <User className="w-3 h-3" />
                    <span>{author}</span>
                </div>
            </div>
        </div>
    );
};
