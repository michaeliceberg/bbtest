"use client"

// "Дуэльная" арена SWIPE: два поля-мишени слева/справа всегда видны с
// формулой-вариантом внутри, карточка вопроса летит к тому полю, куда её
// тащат.
//
// По итогам обратной связи (2026-08-28) убраны 3 элемента, которые
// вводили в заблуждение или получились визуально плохо:
// - Красная/зелёная подсветка мишеней при наклоне — читалась как
//   "влево неверно, вправо верно", хотя это просто выбор стороны, не
//   индикатор правильности. Заменена на нейтральное (синее, тот же
//   акцентный цвет, что уже используется как "выбрано" у SCROLL/CONNECT)
//   свечение-бордер с затухающим градиентом вокруг мишени, в которую
//   сейчас целится карточка.
// - Стрелка-указатель над карточкой — убрана целиком.
// - Дуга-подсказка со стрелками под карточкой — убрана целиком.
// Взамен — подсказка-жест: крупная иконка "палец" под карточкой,
// покачивается влево-вправо (пока карточку ни разу не потянули), плавно
// гаснет, как только пользователь начинает тащить карточку.

import { motion, useMotionValue, useTransform, PanInfo, useMotionValueEvent, animate } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { Pointer } from "lucide-react"
import { QuestionType } from "./page"
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { isCorrectAnswer } from '@/usefulFunctions'

type Props = {
    onAnswer: (answer: string) => void
    question: QuestionType
    setLrAnswer: (lrAnswer: number) => void
}

// Нейтральный акцентный синий — тот же, что уже используется как цвет
// "выбрано" у SCROLL/CONNECT (#4A90D9) — не про правильность, а про то,
// что мы сейчас целимся именно в эту мишень.
const SELECT_COLOR = '#4A90D9'
const NEUTRAL_BORDER = 'rgba(58,70,78,1)'

export default function SwipeArena({ onAnswer, question, setLrAnswer }: Props) {
    const x = useMotionValue(0)
    const [isAnswered, setIsAnswered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragProgress, setDragProgress] = useState(0)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [flyTo, setFlyTo] = useState<'left' | 'right' | null>(null)
    const constraintsRef = useRef<HTMLDivElement>(null)

    const leftOption = question.options[1] || question.options[0]
    const rightOption = question.options[0]

    useMotionValueEvent(x, "change", (latest) => {
        const normalized = Math.max(-1, Math.min(1, latest / 90))
        setDragProgress(normalized)
    })

    const rotate = useTransform(x, [-140, 0, 140], [-16, 0, 16])
    const cardScale = useTransform(x, [-140, 0, 140], [1.08, 1, 1.08])

    useEffect(() => {
        setIsAnswered(false)
        setFlyTo(null)
        setHasInteracted(false)
        setLrAnswer(0)
        x.set(0)
        setDragProgress(0)
    }, [question, setLrAnswer, x])

    const handleDragStart = () => {
        if (isAnswered) return
        setIsDragging(true)
        setHasInteracted(true)
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isAnswered) return

        const swipe = info.offset.x
        const velocity = info.velocity.x

        if (Math.abs(swipe) > 40 || Math.abs(velocity) > 350) {
            const isRightSwipe = swipe > 0 || velocity > 0
            const selectedOption = isRightSwipe ? rightOption : leftOption
            const isCorrect = isCorrectAnswer(selectedOption, question.correctAnswer)

            setIsAnswered(true)
            setFlyTo(isRightSwipe ? 'right' : 'left')
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
                <motion.div className="relative" animate={{ opacity: leaningRight ? 0.45 : 1 }} transition={{ duration: 0.2 }}>
                    {/* Затухающее градиентное свечение — просто "сюда целимся",
                        без намёка на правильность. Противоположная (не
                        выбранная) карточка тускнеет через opacity на
                        обёртке выше, а не собственным цветом. */}
                    <motion.div
                        className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                        style={{ background: `radial-gradient(closest-side, ${SELECT_COLOR}55, ${SELECT_COLOR}00 80%)` }}
                        animate={{ opacity: leaningLeft ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        className="relative rounded-2xl border-2 p-4 pb-10 min-h-[130px] flex items-center justify-center text-center"
                        animate={{
                            borderColor: leaningLeft ? SELECT_COLOR : NEUTRAL_BORDER,
                            scale: leaningLeft ? 1.03 : 1,
                        }}
                    >
                        <span className="text-base md:text-lg font-bold text-[#F2F7FB]">
                            <Latex>{leftOption}</Latex>
                        </span>
                    </motion.div>
                </motion.div>
                <motion.div className="relative" animate={{ opacity: leaningLeft ? 0.45 : 1 }} transition={{ duration: 0.2 }}>
                    <motion.div
                        className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                        style={{ background: `radial-gradient(closest-side, ${SELECT_COLOR}55, ${SELECT_COLOR}00 80%)` }}
                        animate={{ opacity: leaningRight ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        className="relative rounded-2xl border-2 p-4 pb-10 min-h-[130px] flex items-center justify-center text-center"
                        animate={{
                            borderColor: leaningRight ? SELECT_COLOR : NEUTRAL_BORDER,
                            scale: leaningRight ? 1.03 : 1,
                        }}
                    >
                        <span className="text-base md:text-lg font-bold text-[#F2F7FB]">
                            <Latex>{rightOption}</Latex>
                        </span>
                    </motion.div>
                </motion.div>
            </div>

            {/* Карточка-вопрос, летит поверх мишеней */}
            <div className="relative z-10 flex flex-col items-center px-8">
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
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="bg-[#1A252B] border-2 border-[#4897D1] shadow-2xl rounded-2xl px-6 py-8 w-full max-w-[220px] flex items-center justify-center text-center"
                >
                    <span className="text-xl md:text-2xl font-bold text-[#F2F7FB]">
                        <Latex>{question.question}</Latex>
                    </span>
                </motion.div>

                {/* Подсказка-жест: палец покачивается влево-вправо, пока
                    карточку ни разу не потянули — гаснет плавно (opacity),
                    без AnimatePresence/размонтирования, как только начали
                    тащить (см. handleDragStart). */}
                <motion.div
                    className="mt-3 text-[#5C6B73] pointer-events-none"
                    animate={
                        hasInteracted
                            ? { opacity: 0, rotate: 0 }
                            : { opacity: 1, rotate: [-22, 22, -22] }
                    }
                    transition={
                        hasInteracted
                            ? { duration: 0.4 }
                            : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                    }
                >
                    <Pointer className="w-8 h-8" strokeWidth={2} />
                </motion.div>
            </div>
        </div>
    )
}
