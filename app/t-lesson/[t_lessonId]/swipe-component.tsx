"use client"

// Карточка для вопросов типа "свайп влево/вправо". Премиальный, простой
// дизайн: сама карточка явно выглядит как объект, который нужно сдвинуть
// в сторону (эффект колоды карт под ней + стрелки-подсказки по бокам,
// которые оживают по мере перетаскивания), без отвлекающего смайлика и
// индикатора-грипа сверху.

import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { QuestionType } from "./page"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';

type Props = {
    onAnswer: (answer: string) => void
    question: QuestionType
    setLrAnswer: (lrAnswer: number) => void
}

const LEFT_COLOR = '#C8524E'
const RIGHT_COLOR = '#678337'

export default function SwipeCard({ onAnswer, question, setLrAnswer }: Props) {
    const x = useMotionValue(0)
    const [isAnswered, setIsAnswered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragProgress, setDragProgress] = useState(0)
    const constraintsRef = useRef<HTMLDivElement>(null)

    // Определяем варианты ответов
    const leftOption = question.options[1] || question.options[0]
    const rightOption = question.options[0]

    // Следим за прогрессом свайпа
    useMotionValueEvent(x, "change", (latest) => {
        const normalized = Math.max(-1, Math.min(1, latest / 120))
        setDragProgress(normalized)
    })

    // Анимации карточки
    const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10])
    const scale = useTransform(x, [-200, 0, 200], [0.96, 1, 0.96])

    // Цветовая подсветка краёв карточки — намекает, к какому варианту тянет
    const leftWashOpacity = useTransform(x, [-150, -10, 0], [0.35, 0, 0])
    const rightWashOpacity = useTransform(x, [0, 10, 150], [0, 0, 0.35])

    useEffect(() => {
        setIsAnswered(false)
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

            const targetX = isRightSwipe ? 600 : -600
            x.set(targetX)

            setIsAnswered(true)

            setTimeout(() => {
                onAnswer(isCorrect ? 'right' : 'wrong')
                x.set(0)
            }, 250)
        } else {
            x.set(0)
        }

        setIsDragging(false)
    }

    const handleDragStart = () => {
        if (!isAnswered) {
            setIsDragging(true)
        }
    }

    // Определяем, в какую сторону свайпают
    const isSwipingLeft = dragProgress < -0.15
    const isSwipingRight = dragProgress > 0.15

    return (
        <div className="relative w-full max-w-xl mx-auto select-none" ref={constraintsRef}>
            {/* Постоянные стрелки-подсказки по бокам — видно сразу, что карточку можно сдвинуть влево/вправо */}
            <div className="absolute inset-y-0 -left-1 md:-left-5 flex items-center z-0 pointer-events-none">
                <motion.div
                    className="rounded-full p-2 border-2"
                    animate={{
                        opacity: isSwipingLeft ? 1 : 0.4,
                        scale: isSwipingLeft ? 1.15 : 1,
                        borderColor: LEFT_COLOR,
                        backgroundColor: isSwipingLeft ? LEFT_COLOR : 'transparent',
                    }}
                >
                    <ChevronLeft className="w-5 h-5" style={{ color: isSwipingLeft ? '#fff' : LEFT_COLOR }} strokeWidth={3} />
                </motion.div>
            </div>
            <div className="absolute inset-y-0 -right-1 md:-right-5 flex items-center z-0 pointer-events-none">
                <motion.div
                    className="rounded-full p-2 border-2"
                    animate={{
                        opacity: isSwipingRight ? 1 : 0.4,
                        scale: isSwipingRight ? 1.15 : 1,
                        borderColor: RIGHT_COLOR,
                        backgroundColor: isSwipingRight ? RIGHT_COLOR : 'transparent',
                    }}
                >
                    <ChevronRight className="w-5 h-5" style={{ color: isSwipingRight ? '#fff' : RIGHT_COLOR }} strokeWidth={3} />
                </motion.div>
            </div>

            {/* Тень-карточка под основной — эффект колоды, сама форма подсказывает "потяни" */}
            <div className="absolute inset-0 top-2 mx-4 rounded-[28px] bg-[#1A252B] border border-[#2E3A40] -z-10" />

            {/* Перетаскиваемая карточка */}
            <motion.div
                style={{
                    x,
                    rotate,
                    scale,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                drag="x"
                dragConstraints={constraintsRef}
                dragElastic={0.5}
                dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="relative z-10 bg-[#161F23] rounded-[28px] min-h-[260px] w-full cursor-grab active:cursor-grabbing border-2 border-[#3A464E] shadow-2xl overflow-hidden"
            >
                {/* Подсветка краёв цветом варианта во время перетаскивания */}
                <motion.div
                    className="absolute inset-y-0 left-0 w-2/3 pointer-events-none"
                    style={{ opacity: leftWashOpacity, background: `linear-gradient(to right, ${LEFT_COLOR}, transparent)` }}
                />
                <motion.div
                    className="absolute inset-y-0 right-0 w-2/3 pointer-events-none"
                    style={{ opacity: rightWashOpacity, background: `linear-gradient(to left, ${RIGHT_COLOR}, transparent)` }}
                />

                <div className="relative flex flex-col items-center justify-center min-h-[260px] p-8">
                    <div className="text-[11px] text-[#9AA7B0] mb-3 font-bold uppercase tracking-wider">
                        {isDragging ? 'Отпусти, чтобы выбрать' : 'Свайпни влево или вправо'}
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-[#F2F7FB] text-center">
                        <Latex>{question.question}</Latex>
                    </div>
                </div>
            </motion.div>

            {/* Подписи вариантов под карточкой — явно левый и правый выбор */}
            <div className="flex items-center justify-between mt-4 px-2">
                <motion.div
                    className="flex items-center gap-1.5"
                    animate={{ opacity: isSwipingLeft ? 1 : 0.65 }}
                >
                    <ChevronLeft className="w-4 h-4 shrink-0" style={{ color: LEFT_COLOR }} strokeWidth={3} />
                    <span className="text-sm font-bold" style={{ color: isSwipingLeft ? LEFT_COLOR : '#9AA7B0' }}>
                        <Latex>{leftOption}</Latex>
                    </span>
                </motion.div>
                <motion.div
                    className="flex items-center gap-1.5"
                    animate={{ opacity: isSwipingRight ? 1 : 0.65 }}
                >
                    <span className="text-sm font-bold" style={{ color: isSwipingRight ? RIGHT_COLOR : '#9AA7B0' }}>
                        <Latex>{rightOption}</Latex>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: RIGHT_COLOR }} strokeWidth={3} />
                </motion.div>
            </div>
        </div>
    )
}
