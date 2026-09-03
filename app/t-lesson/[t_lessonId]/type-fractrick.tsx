// app/t-lesson/[t_lessonId]/type-fractrick.tsx
//
// Тип FRACTRICK — "умножить/разделить на унитарную дробь" (0,5/0,25/
// 0,125): "N × 0,5 = N/?" рисуется НАСТОЯЩЕЙ дробью (не строкой "N/?"),
// оператор и горизонтальная черта дроби — белые (нейтральные), а N и
// пара "decimal/ответ" красятся каждый СВОИМ цветом, чтобы цвет сам
// показывал соответствие чисел (N — тот же везде, decimal слева
// соответствует подставляемому ответу справа).
//
// Флоу ответа — select-then-submit, тот же контракт, что у ASSIST/
// INSERT (onOptionSelected/isAnswerChecked приходят сверху из
// trainer-question.tsx, кнопка "Ответить" внизу общая — см.
// isSelectThenSubmitType в trainer-question.tsx/TQUIZ.tsx). По прямой
// просьбе пользователя подтверждение для FRACTRICK ОСТАЁТСЯ (в отличие
// от CHECK, где подтверждение убрано намеренно). Клик по варианту сразу
// морфит "?" в цифру — та же WAAPI-анимация, что и в type-insert.tsx —
// но сам ответ засчитывается только по нажатию общей кнопки.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

const hexToRgb = (hex: string): string => {
    const n = parseInt(hex.replace('#', ''), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

export const TypeFracTrick = ({ question, onAnswer, onOptionSelected, isAnswerChecked = false }: Props) => {
    const trick = question.fracTrick
    const containerRef = useRef<HTMLDivElement>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const prevSelectedRef = useRef<string | null>(null)

    useEffect(() => {
        setSelected(null)
        prevSelectedRef.current = null
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

    const glyph = selected ?? '?'
    const formula = trick.rightOp === '/'
        ? `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} = \\dfrac{\\textcolor{${trick.colorN}}{${trick.n}}}{\\textcolor{${trick.colorDecimal}}{${glyph}}}$`
        : `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} = \\textcolor{${trick.colorN}}{${trick.n}} \\times \\textcolor{${trick.colorDecimal}}{${glyph}}$`

    // Тот же WAAPI-вход, что у первого заполнения пропуска в type-insert.tsx
    // (падение сверху с лёгким пружинным перехлёстом) — играет на КАЖДЫЙ
    // выбор/смену варианта (в отличие от INSERT тут всего один пропуск,
    // отдельного "первое заполнение vs смена" различия не нужно).
    useLayoutEffect(() => {
        if (selected !== null && selected !== prevSelectedRef.current) {
            findGlyphNodes(selected).forEach((node) => {
                node.animate(
                    [
                        { opacity: 0, transform: 'translateY(-20px)' },
                        { opacity: 1, transform: 'translateY(0)' },
                    ],
                    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                )
            })
        }
        prevSelectedRef.current = selected
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected])

    const handlePick = (option: string) => {
        if (isAnswerChecked) return
        setSelected(option)
        onOptionSelected?.(option)
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
                        isSelected={selected === option}
                        isCorrect={isAnswerChecked && option === question.correctAnswer}
                        isWrong={isAnswerChecked && selected === option && option !== question.correctAnswer}
                        disabled={isAnswerChecked}
                    />
                ))}
            </motion.div>
        </div>
    )
}
