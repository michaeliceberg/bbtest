"use client"

// Новая реализация SWIPE "с нуля" (по просьбе пользователя — та же идея,
// другой визуал). Вместо карточки-подсказки с текстом-вопросом сверху и
// стрелочек по бокам (старая swipe-component.tsx, не трогаем) — "дуэльная"
// арена: два больших цветных поля-мишени слева/справа ВСЕГДА видны с
// формулой-вариантом внутри, карточка вопроса поменьше летит к тому полю,
// куда её тащат, увеличивается и подсвечивает рамку поля рядом с собой.

import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent, animate } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { QuestionType } from "./page"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { isCorrectAnswer } from '@/usefulFunctions'

type Props = {
    onAnswer: (answer: string) => void
    question: QuestionType
    setLrAnswer: (lrAnswer: number) => void
}

const LEFT_COLOR = '#C8524E'
const RIGHT_COLOR = '#5FA12F'
const NEUTRAL_COLOR = '#5A6A72'

// Небольшая дуга-подсказка под карточкой со стрелками по концам — визуально
// намекает "потяни по этой дуге влево/вправо". Подсвечивается той же
// стороной, куда сейчас наклонена карточка (lean), нейтральная в покое.
const SwipeArcHint = ({ lean }: { lean: number }) => {
    const leftActive = lean < -0.12
    const rightActive = lean > 0.12
    const leftColor = leftActive ? LEFT_COLOR : NEUTRAL_COLOR
    const rightColor = rightActive ? RIGHT_COLOR : NEUTRAL_COLOR

    return (
        <svg
            viewBox="0 0 220 34"
            className="w-full max-w-[220px] h-auto mx-auto"
            fill="none"
        >
            <path
                d="M 18 8 Q 110 40 202 8"
                stroke="#3A464E"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Левая половина дуги + стрелка — красная при наклоне влево */}
            <motion.path
                d="M 18 8 Q 65 24 110 30"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                animate={{ stroke: leftColor, opacity: leftActive ? 1 : 0.55 }}
                transition={{ duration: 0.2 }}
            />
            <motion.path
                d="M 26 3 L 15 9 L 23 16"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                animate={{ stroke: leftColor, opacity: leftActive ? 1 : 0.55 }}
                transition={{ duration: 0.2 }}
            />
            {/* Правая половина + стрелка — зелёная при наклоне вправо */}
            <motion.path
                d="M 110 30 Q 155 24 202 8"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                animate={{ stroke: rightColor, opacity: rightActive ? 1 : 0.55 }}
                transition={{ duration: 0.2 }}
            />
            <motion.path
                d="M 194 3 L 205 9 L 197 16"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                animate={{ stroke: rightColor, opacity: rightActive ? 1 : 0.55 }}
                transition={{ duration: 0.2 }}
            />
        </svg>
    )
}

export default function SwipeArena({ onAnswer, question, setLrAnswer }: Props) {
    const x = useMotionValue(0)
    const [isAnswered, setIsAnswered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragProgress, setDragProgress] = useState(0)
    const [flyTo, setFlyTo] = useState<'left' | 'right' | null>(null)
    const constraintsRef = useRef<HTMLDivElement>(null)

    const leftOption = question.options[1] || question.options[0]
    const rightOption = question.options[0]

    // Диапазон нормализации уменьшен (было /130) — тот же наклон/подсветка
    // мишени достигается заметно меньшим сдвигом, отзывчивее на маленький жест.
    useMotionValueEvent(x, "change", (latest) => {
        const normalized = Math.max(-1, Math.min(1, latest / 90))
        setDragProgress(normalized)
    })

    // Диапазон для поворота карточки тоже сужен (было [-220,220]) — тот же
    // угол наклона теперь достигается меньшим по факту перетаскиванием.
    const rotate = useTransform(x, [-140, 0, 140], [-16, 0, 16])
    const cardScale = useTransform(x, [-140, 0, 140], [1.08, 1, 1.08])

    useEffect(() => {
        setIsAnswered(false)
        setFlyTo(null)
        setLrAnswer(0)
        x.set(0)
        setDragProgress(0)
    }, [question, setLrAnswer, x])

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isAnswered) return

        const swipe = info.offset.x
        const velocity = info.velocity.x

        // Порог сильно снижен (было 80px / 500 velocity) — небольшого,
        // явного жеста в сторону теперь достаточно, чтобы карточка сама
        // докрутилась до конца, а не требовала дотащить её физически.
        if (Math.abs(swipe) > 40 || Math.abs(velocity) > 350) {
            const isRightSwipe = swipe > 0 || velocity > 0
            const selectedOption = isRightSwipe ? rightOption : leftOption
            const isCorrect = isCorrectAnswer(selectedOption, question.correctAnswer)

            setIsAnswered(true)
            setFlyTo(isRightSwipe ? 'right' : 'left')
            // animate() вместо x.set() — долёт до края плавный (докручивается
            // "чётко", с разгоном), а не мгновенный телепорт значения.
            animate(x, isRightSwipe ? 500 : -500, { type: 'spring', stiffness: 260, damping: 24 })

            setTimeout(() => {
                onAnswer(isCorrect ? 'right' : 'wrong')
                x.set(0)
            }, 320)
        } else {
            animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })
        }

        setIsDragging(false)
    }

    const leaningLeft = dragProgress < -0.12
    const leaningRight = dragProgress > 0.12

    return (
        <div className="relative w-full max-w-xl mx-auto select-none mt-6" ref={constraintsRef}>
            <div className="text-center text-[11px] text-[#9AA7B0] mb-3 font-bold uppercase tracking-wider">
                {isDragging ? 'Отпусти, чтобы выбрать' : 'Перетащи карточку к нужному полю'}
            </div>

            {/* Две мишени слева/справа — всегда видны */}
            <div className="grid grid-cols-2 gap-3 mb-[-1.5rem]">
                <motion.div
                    className="rounded-2xl border-2 p-4 pb-10 min-h-[130px] flex items-center justify-center text-center"
                    animate={{
                        borderColor: leaningLeft ? LEFT_COLOR : 'rgba(58,70,78,1)',
                        backgroundColor: leaningLeft ? 'rgba(200,82,78,0.14)' : 'rgba(22,31,35,1)',
                        scale: leaningLeft ? 1.03 : 1,
                    }}
                >
                    <span className="text-base md:text-lg font-bold text-[#F2F7FB]">
                        <Latex>{leftOption}</Latex>
                    </span>
                </motion.div>
                <motion.div
                    className="rounded-2xl border-2 p-4 pb-10 min-h-[130px] flex items-center justify-center text-center"
                    animate={{
                        borderColor: leaningRight ? RIGHT_COLOR : 'rgba(58,70,78,1)',
                        backgroundColor: leaningRight ? 'rgba(95,161,47,0.14)' : 'rgba(22,31,35,1)',
                        scale: leaningRight ? 1.03 : 1,
                    }}
                >
                    <span className="text-base md:text-lg font-bold text-[#F2F7FB]">
                        <Latex>{rightOption}</Latex>
                    </span>
                </motion.div>
            </div>

            {/* Карточка-вопрос, летит поверх мишеней */}
            <div className="relative z-10 flex flex-col items-center px-8">
                {/* Стрелка-указатель над карточкой — поворачивается вслед за
                    наклоном, показывая, к какому варианту сейчас "тянет". */}
                <motion.svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 mb-1"
                    fill="none"
                    style={{ rotate: useTransform(x, [-140, 0, 140], [-40, 0, 40]) }}
                >
                    <motion.path
                        d="M12 3 L12 19 M12 3 L6 9 M12 3 L18 9"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ stroke: leaningLeft ? LEFT_COLOR : leaningRight ? RIGHT_COLOR : NEUTRAL_COLOR }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.svg>

                <motion.div
                    style={{
                        x,
                        rotate,
                        scale: cardScale,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isAnswered ? 0 : 1,
                    }}
                    drag="x"
                    dragConstraints={constraintsRef}
                    dragElastic={0.6}
                    dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
                    onDragStart={() => !isAnswered && setIsDragging(true)}
                    onDragEnd={handleDragEnd}
                    className="bg-[#1A252B] border-2 border-[#4897D1] shadow-2xl rounded-2xl px-6 py-8 w-full max-w-[220px] flex items-center justify-center text-center"
                >
                    <span className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
                        <Latex>{question.question}</Latex>
                    </span>
                </motion.div>

                {/* Дуга-подсказка под карточкой */}
                <div className="mt-2">
                    <SwipeArcHint lean={dragProgress} />
                </div>
            </div>
        </div>
    )
}
