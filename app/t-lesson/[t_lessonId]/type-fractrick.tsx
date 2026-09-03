// app/t-lesson/[t_lessonId]/type-fractrick.tsx
//
// Тип FRACTRICK — "умножить/разделить на унитарную дробь" (0,5/0,25/
// 0,125): "N × 0,5 = N/?" рисуется НАСТОЯЩЕЙ дробью (не строкой "N/?"),
// оператор и горизонтальная черта дроби — белые (нейтральные), а N и
// пара "decimal/ответ" красятся каждый СВОИМ цветом, чтобы цвет сам
// показывал соответствие чисел (N — тот же везде, decimal слева
// соответствует подставляемому ответу справа). Мгновенный клик по
// варианту сразу же засчитывает ответ (без отдельной кнопки "Ответить",
// тот же принцип, что и у TypeSpeed/TypeCheck) — но сам "?" при этом
// проигрывает ТОЧНО ТАКУЮ ЖЕ анимацию появления буквы, что и в
// type-insert.tsx (тот же WAAPI-приём поиска узла по цвету+тексту,
// та же кривая/длительность входа).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

const RESULT_DELAY_MS = 900

const hexToRgb = (hex: string): string => {
    const n = parseInt(hex.replace('#', ''), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

export const TypeFracTrick = ({ question, onAnswer }: Props) => {
    const trick = question.fracTrick
    const containerRef = useRef<HTMLDivElement>(null)
    const [filled, setFilled] = useState<string | null>(null)
    const [phase, setPhase] = useState<'answering' | 'result'>('answering')
    const hasSubmittedRef = useRef(false)
    const prevFilledRef = useRef<string | null>(null)

    useEffect(() => {
        setFilled(null)
        setPhase('answering')
        hasSubmittedRef.current = false
        prevFilledRef.current = null
    }, [question])

    if (!trick) return null

    const blankColorRgb = hexToRgb(trick.colorDecimal)

    // Тот же приём, что в type-insert.tsx: находим узел(ы) формулы по
    // ТОЧНОМУ тексту глифа среди тех, что покрашены цветом пропуска — не
    // по позиции (KaTeX иногда рендерит один и тот же глиф несколькими
    // соседними DOM-узлами).
    const findGlyphNodes = (text: string): HTMLElement[] => {
        const container = containerRef.current
        if (!container) return []
        return Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => el.style.color === blankColorRgb && el.textContent === text)
    }

    const glyph = filled ?? '?'
    const formula = trick.rightOp === '/'
        ? `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} = \\dfrac{\\textcolor{${trick.colorN}}{${trick.n}}}{\\textcolor{${trick.colorDecimal}}{${glyph}}}$`
        : `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} = \\textcolor{${trick.colorN}}{${trick.n}} \\times \\textcolor{${trick.colorDecimal}}{${glyph}}$`

    // Тот же WAAPI-вход, что у первого заполнения пропуска в type-insert.tsx
    // (падение сверху с лёгким пружинным перехлёстом) — по прямой просьбе
    // пользователя "оформление сделай точно таким же".
    useLayoutEffect(() => {
        if (filled !== null && filled !== prevFilledRef.current) {
            findGlyphNodes(filled).forEach((node) => {
                node.animate(
                    [
                        { opacity: 0, transform: 'translateY(-20px)' },
                        { opacity: 1, transform: 'translateY(0)' },
                    ],
                    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                )
            })
        }
        prevFilledRef.current = filled
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filled])

    const handlePick = (option: string) => {
        if (phase !== 'answering' || hasSubmittedRef.current) return
        hasSubmittedRef.current = true
        setFilled(option)
        setPhase('result')

        const isRight = option === question.correctAnswer
        setTimeout(() => onAnswer(isRight ? 'right' : 'wrong'), RESULT_DELAY_MS)
    }

    return (
        <div className="mt-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                ref={containerRef}
                className="flex items-center justify-center py-8 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-[#F2F7FB]"
            >
                <Latex>{formula}</Latex>
            </motion.div>

            <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                {question.options.map((option, idx) => (
                    <AnimatedOptionButton
                        key={idx}
                        option={option}
                        onClick={() => handlePick(option)}
                        index={idx}
                        isSelected={filled === option}
                        isCorrect={phase === 'result' && option === question.correctAnswer}
                        isWrong={phase === 'result' && filled === option && option !== question.correctAnswer}
                        disabled={phase !== 'answering'}
                    />
                ))}
            </motion.div>
        </div>
    )
}
