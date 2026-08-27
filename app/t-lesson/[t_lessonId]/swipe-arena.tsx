"use client"

// Новая реализация SWIPE "с нуля" (по просьбе пользователя — та же идея,
// другой визуал). Вместо карточки-подсказки с текстом-вопросом сверху и
// стрелочек по бокам (старая swipe-component.tsx, не трогаем) — "дуэльная"
// арена: два больших цветных поля-мишени слева/справа ВСЕГДА видны с
// формулой-вариантом внутри, карточка вопроса поменьше летит к тому полю,
// куда её тащат, увеличивается и подсвечивает рамку поля рядом с собой.

import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { QuestionType } from "./page"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';

type Props = {
    onAnswer: (answer: string) => void
    question: QuestionType
    setLrAnswer: (lrAnswer: number) => void
}

const LEFT_COLOR = '#C8524E'
const RIGHT_COLOR = '#5FA12F'

export default function SwipeArena({ onAnswer, question, setLrAnswer }: Props) {
    const x = useMotionValue(0)
    const [isAnswered, setIsAnswered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragProgress, setDragProgress] = useState(0)
    const [flyTo, setFlyTo] = useState<'left' | 'right' | null>(null)
    const constraintsRef = useRef<HTMLDivElement>(null)

    const leftOption = question.options[1] || question.options[0]
    const rightOption = question.options[0]

    useMotionValueEvent(x, "change", (latest) => {
        const normalized = Math.max(-1, Math.min(1, latest / 130))
        setDragProgress(normalized)
    })

    const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14])
    const cardScale = useTransform(x, [-220, 0, 220], [1.08, 1, 1.08])

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

        if (Math.abs(swipe) > 80 || Math.abs(velocity) > 500) {
            const isRightSwipe = swipe > 0 || velocity > 0
            const selectedOption = isRightSwipe ? rightOption : leftOption
            const isCorrect = selectedOption === question.correctAnswer

            setIsAnswered(true)
            setFlyTo(isRightSwipe ? 'right' : 'left')
            x.set(isRightSwipe ? 500 : -500)

            setTimeout(() => {
                onAnswer(isCorrect ? 'right' : 'wrong')
                x.set(0)
            }, 320)
        } else {
            x.set(0)
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
            <div className="relative z-10 flex justify-center px-8">
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
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="bg-[#1A252B] border-2 border-[#4897D1] shadow-2xl rounded-2xl px-6 py-8 w-full max-w-[220px] flex items-center justify-center text-center"
                >
                    <span className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
                        <Latex>{question.question}</Latex>
                    </span>
                </motion.div>
            </div>
        </div>
    )
}
