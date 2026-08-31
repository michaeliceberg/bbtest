// app/lesson/question-bubble.tsx

import dynamic from "next/dynamic";
import Latex from 'react-latex-next';
import { Skull, Home, User, Coins, CheckCircle, XCircle, ZoomIn, GraduationCap } from 'lucide-react';
import { differenceInHours, isPast } from 'date-fns';
import { motion } from "framer-motion";
import { NoRightAnswer } from "@/components/hover-card";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import { PALETTE_RED } from "@/src/constants/lessonButtonColors";
import { findQuestionTarget } from "@/lib/highlight-question-target";

import LottieRainbow from '@/public/LottieSelectRainbow.json'
import LottieCrown from '@/public/LottieSelectCrown.json'
import LottieDiamond from '@/public/LottieSelectDiamond.json'
import LottieSparks from '@/public/LottieSelectSparks.json'
import LottieStars from '@/public/LottieSelectStars.json'
import LottieButterfly from '@/public/LottieSelectButterfly.json'
import { LOTTIE_SKILL_ASK_LIST, getRandomLottie } from "@/src/constants/lottieConstants";

// Рендерит условие задачи, подсвечивая цветом юнита фразу "что нужно найти"
// (если удалось её распознать эвристикой — иначе просто весь текст как есть).
const QuestionText = ({ question, color }: { question: string; color: string }) => {
    const highlight = findQuestionTarget(question);
    if (!highlight) return <Latex>{question}</Latex>;

    return (
        <>
            <Latex>{highlight.before}</Latex>
            <span className="font-semibold" style={{ color }}>
                <Latex>{highlight.target}</Latex>
            </span>
            <Latex>{highlight.after}</Latex>
        </>
    );
};

// Бейдж-ссылка на тему тренажёра под задачей курса. Если скилл ещё не
// начат (percentage === 0) — вместо скучной серой иконки-магистра
// показываем анимированного Lottie-персонажа (public/Lottie/tegs/) с
// эмоциональным призывом "Пройди тренажёр"; если прогресс уже есть —
// как раньше, компактный процент. Выбор Lottie — один раз на монтирование
// (не на каждый ре-рендер), тот же паттерн useState(() => ...), что уже
// применяется для похожих случайных анимаций в этом проекте.
const SkillTagBadge = ({ tag, unitColor }: { tag: { id: number; title: string; percentage: number }; unitColor: { button: string; bottom: string } }) => {
    const isLocked = tag.percentage === 0;
    const [askAnimation] = useState(() => getRandomLottie(LOTTIE_SKILL_ASK_LIST));

    if (isLocked) {
        return (
            <Link
                href={`/t-lesson/${tag.id}`}
                title={`Скилл тренажёра: ${tag.title}`}
                className="flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                style={{ backgroundColor: `${unitColor.button}1F`, color: unitColor.button }}
            >
                <Lottie className="w-6 h-6 shrink-0" animationData={askAnimation} loop />
                <span className="text-xs font-medium">Пройди тренажёр</span>
            </Link>
        );
    }

    return (
        <Link
            href={`/t-lesson/${tag.id}`}
            title={`Скилл тренажёра: ${tag.title}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: `${unitColor.button}1F`, color: unitColor.button }}
        >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{tag.percentage}%</span>
        </Link>
    );
};

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
    imageSrc?: string;
    isMultiSelect?: boolean;
    options?: { id: number; text: string }[];
    skillTags?: { id: number; title: string; percentage: number }[];
}

export const QuestionBubble = ({
    unitColor,
    question,
    imageSrc,
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
    isMultiSelect,
    options,
    skillTags,
}: Props) => {
    const correctAttempts = timesDone - timesDoneWrong;

    // Увеличенный просмотр картинки к задаче (график/рисунок часто мелкий)
    const [isImageZoomed, setIsImageZoomed] = useState(false);

    useEffect(() => {
        if (!isImageZoomed) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsImageZoomed(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isImageZoomed]);

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
                    } : {
                        // Лёгкое "дыхание" маскота, пока ученик читает условие —
                        // чтобы экран не выглядел статичным до ответа.
                        y: [0, -3, 0],
                        rotate: [-2, 2, -2],
                    }}
                    transition={isCorrect || isWrong
                        ? { duration: 0.5 }
                        : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
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
                    {imageSrc ? (
                        <div className="flex gap-3 items-start">
                            <div className="flex-1 min-w-0 text-[#F2F7FB] text-sm md:text-base leading-relaxed">
                                <QuestionText question={question} color={unitColor.button} />
                            </div>
                            <div className="relative flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44">
                                {/* Тихая "дышащая" подсветка по периметру — бесконечный,
                                    едва заметный пульс в цвет юнита. */}
                                <motion.div
                                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.94, 1.1, 0.94] }}
                                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -inset-4 rounded-full pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle, ${unitColor.button}90 0%, ${unitColor.button}00 65%)`,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsImageZoomed(true)}
                                    className="relative w-full h-full group cursor-zoom-in"
                                    aria-label="Увеличить изображение"
                                >
                                    <img
                                        src={imageSrc}
                                        alt=""
                                        className="w-full h-full rounded-lg object-contain bg-[#151F23] transition-transform group-hover:scale-[1.03] group-active:scale-95"
                                    />
                                    <span className="absolute bottom-1.5 right-1.5 flex items-center justify-center rounded-full bg-black/70 p-1.5 shadow group-hover:bg-black/85 transition-colors">
                                        <ZoomIn className="w-3.5 h-3.5 text-white" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[#F2F7FB] text-sm md:text-base leading-relaxed">
                            <QuestionText question={question} color={unitColor.button} />
                        </div>
                    )}
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

                {skillTags && skillTags.length > 0 && skillTags.map((tag) => (
                    <SkillTagBadge key={tag.id} tag={tag} unitColor={unitColor} />
                ))}

                <NoRightAnswer challengeId={challengeId} />

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

            {imageSrc && isImageZoomed && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
                    onClick={() => setIsImageZoomed(false)}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="w-[92vw] h-[92vh] flex flex-col gap-3 cursor-zoom-out"
                    >
                        {/* Текст продублирован здесь, чтобы не сворачивать картинку
                            туда-обратно, сверяя её с условием. Для SELECT (чекбоксы)
                            полезнее сами утверждения, а не общая формулировка задания —
                            их и сверяют с рисунком. Клик где угодно (включая этот текст)
                            должен закрывать зум — событие намеренно не гасим, чтобы
                            всплыло до onClick на фоне. */}
                        <div className="flex-shrink-0 max-h-[45%] overflow-y-auto rounded-xl bg-[#151F23] shadow-2xl px-4 py-3 text-[#F2F7FB] text-sm md:text-base leading-relaxed">
                            {isMultiSelect && options?.length ? (
                                <ul className="space-y-1.5 text-center">
                                    {options.map((o, i) => (
                                        <li key={o.id}>
                                            <span className="text-[#9AA7B0]">{i + 1}.</span>{' '}
                                            <Latex>{o.text}</Latex>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <QuestionText question={question} color={unitColor.button} />
                            )}
                        </div>
                        <img
                            src={imageSrc}
                            alt=""
                            className="flex-1 min-h-0 w-full object-contain rounded-xl bg-[#151F23] shadow-2xl cursor-zoom-out"
                            onClick={() => setIsImageZoomed(false)}
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
};
