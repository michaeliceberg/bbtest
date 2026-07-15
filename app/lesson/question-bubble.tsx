// app/lesson/question-bubble.tsx

import Lottie from "lottie-react";
import Latex from 'react-latex-next';
import { Skull, AlertCircle, HelpCircle, User, Coins, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { differenceInHours, isPast } from 'date-fns';
import { motion } from "framer-motion";
import { NoRightAnswer } from "@/components/hover-card";
import { useState, useRef, useEffect } from "react";

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
    const [showHint, setShowHint] = useState(false);
    
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
        // Когда приходит неправильный ответ - показываем грустную анимацию или оставляем текущую
        if (isWrong && !prevIsWrong.current) {
            // Можно установить специальную анимацию для ошибки, или оставить текущую
            // setCurrentMascot(mascotAnimations[0]); // раскомментировать если нужна анимация при ошибке
        }
        
        prevIsCorrect.current = isCorrect;
        prevIsWrong.current = isWrong;
    }, [isCorrect, isWrong]);

    const getHomeworkBadge = () => {
        if (isCompleted) return null;
        if (!isHWChallenge) return null;
        
        if (homeworkStatus?.status === 'expired' || (homeworkStatus?.dueDate && isPast(new Date(homeworkStatus.dueDate)))) {
            return { text: 'Просрочено', icon: Skull, color: 'red' };
        }
        
        if (homeworkStatus?.dueDate) {
            const hoursLeft = differenceInHours(new Date(homeworkStatus.dueDate), new Date());
            if (hoursLeft < 3) {
                return { text: 'Срочно!', icon: AlertCircle, color: 'orange' };
            }
        }
        
        return { text: 'ДЗ', icon: HelpCircle, color: 'amber' };
    };

    const badge = getHomeworkBadge();
    const hintText = "Подсказка: попробуй вспомнить формулу из предыдущего урока";

    return (
        <div className="w-full">
            <div className="bg-[#151F23] rounded-xl shadow-md border border-[#3A464E] p-3 md:p-4">
                {/* Персонаж и вопрос */}
                <div className="flex gap-3">
                    <motion.div 
                        className="flex-shrink-0 relative"
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
                        {badge && (
                            <div className={`absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-bold text-white bg-${badge.color}-500 shadow-md`}>
                                <badge.icon className="w-2 h-2" />
                                <span>{badge.text}</span>
                            </div>
                        )}
                    </motion.div>

                    <div className="flex-1 pt-0.5">
                        <div className="text-[#F2F7FB] text-sm md:text-base leading-relaxed">
                            <Latex>{question}</Latex>
                        </div>
                    </div>
                </div>

                {/* Статистика (✅❌) */}
                {(correctAttempts > 0 || timesDoneWrong > 0) && (
                    <div className="flex items-center gap-2 mt-2">
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
                    </div>
                )}

                {/* Нижняя строка: Author | Нет правильного ответа | Bulb | Pts */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-[#3A464E]">
                    {/* Левая часть - Author */}
                    <div className="flex items-center gap-1 text-[#9AA7B0] text-xs">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium">{author}</span>
                    </div>

                    {/* Правая часть - кнопки и очки */}
                    <div className="flex items-center gap-3">
                        {/* Нет правильного ответа */}
                        <div className="scale-90">
                            <NoRightAnswer challengeId={challengeId} />
                        </div>

                        {/* Подсказка (лампочка) */}
                        <div className="relative">
                            <button
                                onMouseEnter={() => setShowHint(true)}
                                onMouseLeave={() => setShowHint(false)}
                                className="flex items-center justify-center w-7 h-7 rounded-full text-[#9AA7B0] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                                <Lightbulb className="w-4 h-4" />
                            </button>

                            {showHint && (
                                <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-[#0E1518] text-white text-xs rounded-lg shadow-lg z-20 pointer-events-none">
                                    {hintText}
                                    <div className="absolute -bottom-1 right-2 w-2 h-2 bg-[#0E1518] rotate-45"></div>
                                </div>
                            )}
                        </div>

                        {/* Очки */}
                        <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                            <Coins className="w-3.5 h-3.5" />
                            <span className="font-bold text-sm">+{pts}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
