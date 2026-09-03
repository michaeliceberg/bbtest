// app/t-lesson/[t_lessonId]/type-fractrick.tsx
//
// Тип FRACTRICK — "умножить/разделить на унитарную дробь" (0,5/0,25/
// 0,125), теперь ДВУХЭТАПНЫЙ (по прямой просьбе пользователя):
//
// Этап 1 — переписать decimal дробью: "N × 0,25 = N × 1/?" (rightOp='/')
// или "N ÷ 0,5 = N × ?" (rightOp='times') — выбираем знаменатель,
// подтверждаем своей кнопкой "Ответить".
// Этап 2 — условие "сдвигается влево" (старая левая часть "N op decimal ="
// отбрасывается), остаётся уже готовое умножение "N × 1/4 = ?" (или
// "N × 2 = ?") — считаем РЕАЛЬНЫЙ числовой результат, снова подтверждаем.
// Только после второго подтверждения onAnswer('right'/'wrong') вызывается
// ОДИН раз на весь t_challenge — тот же принцип "самодостаточный
// многошаговый тип со своей кнопкой", что уже используется в
// type-multistep.tsx (см. его же комментарий про hadMistake — ошибка на
// этапе 1 не прерывает прохождение, пользователь всё равно доходит до
// конца и видит верный ответ, но итог всего задания зависит от ОБОИХ
// этапов).
//
// Оператор/черта дроби — белые (нейтральные), N и пара decimal/ответ
// красятся по цветовому соответствию (см. FracTrickVisual в page.tsx),
// палитра варьируется между примерами. Клик по варианту мгновенно морфит
// "?" в цифру — та же WAAPI-анимация, что и у INSERT.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

// Отдельный, фиксированный цвет для пропуска этапа 2 — там уже только
// ОДНО число без "парного" соответствия (в отличие от colorN/colorDecimal
// этапа 1), поэтому берём общий "активный" акцент, уже используемый в
// проекте для текущего выбора (INSERT/SCROLL).
const STAGE2_COLOR = '#4A90D9'
const CORRECT_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'

const hexToRgb = (hex: string): string => {
    const n = parseInt(hex.replace('#', ''), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

export const TypeFracTrick = ({ question, onAnswer }: Props) => {
    const trick = question.fracTrick
    const containerRef = useRef<HTMLDivElement>(null)

    const [stage, setStage] = useState<1 | 2>(1)
    const [stage1Selected, setStage1Selected] = useState<string | null>(null)
    const [stage1Checked, setStage1Checked] = useState(false)
    const [stage2Selected, setStage2Selected] = useState<string | null>(null)
    const [stage2Checked, setStage2Checked] = useState(false)
    const hadMistakeRef = useRef(false)
    const prevGlyphRef = useRef<string | null>(null)

    useEffect(() => {
        setStage(1)
        setStage1Selected(null)
        setStage1Checked(false)
        setStage2Selected(null)
        setStage2Checked(false)
        hadMistakeRef.current = false
        prevGlyphRef.current = null
    }, [question])

    if (!trick) return null

    const stage1Color = trick.colorDecimal
    const blankColor = stage === 1
        ? (stage1Checked ? (stage1Selected === question.correctAnswer ? CORRECT_COLOR : WRONG_COLOR) : stage1Color)
        : (stage2Checked ? (stage2Selected === trick.stage2Answer ? CORRECT_COLOR : WRONG_COLOR) : STAGE2_COLOR)
    const blankColorRgb = hexToRgb(blankColor)

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

    const glyph = stage === 1 ? (stage1Selected ?? '?') : (stage2Selected ?? '?')
    // stage2Answer иногда дробный ("3,5") — голая запятая в KaTeX-формуле
    // (в отличие от plain-text кнопок-вариантов ниже, которые НЕ проходят
    // через реальный KaTeX, см. AnimatedOptionButton) получает лишний
    // TeX-отступ после себя; {,} — та же самая конвенция, что уже
    // используется у trick.decimal (см. DecimalDef.tex в rebuildFractionsUnit.ts).
    const glyphForKatex = glyph.replace(',', '{,}')

    // Этап 1 — правая часть переписывает decimal дробью (не готовым
    // числом): rightOp='/' → N × 1/blank (умножение на унитарную дробь),
    // rightOp='times' → N × blank (деление уже переписано как умножение
    // на знаменатель). Этап 2 — старая левая часть "N op decimal =" уже
    // отброшена ("сдвиг влево"), остаётся готовое умножение из ПРАВИЛЬНОГО
    // (не обязательно выбранного пользователем) знаменателя этапа 1, плюс
    // новый пропуск под РЕАЛЬНЫЙ числовой результат.
    const formula = stage === 1
        ? (trick.rightOp === '/'
            ? `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} = \\textcolor{${trick.colorN}}{${trick.n}} \\times \\dfrac{1}{\\textcolor{${blankColor}}{${glyphForKatex}}}$`
            : `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} = \\textcolor{${trick.colorN}}{${trick.n}} \\times \\textcolor{${blankColor}}{${glyphForKatex}}$`)
        : (trick.rightOp === '/'
            ? `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} \\times \\dfrac{1}{\\textcolor{${trick.colorDecimal}}{${trick.answer}}} = \\textcolor{${blankColor}}{${glyphForKatex}}$`
            : `$\\huge \\textcolor{${trick.colorN}}{${trick.n}} \\times \\textcolor{${trick.colorDecimal}}{${trick.answer}} = \\textcolor{${blankColor}}{${glyphForKatex}}$`)

    // Тот же WAAPI-вход, что у первого заполнения пропуска в type-insert.tsx
    // (падение сверху с лёгким пружинным перехлёстом).
    useLayoutEffect(() => {
        if (glyph !== '?' && glyph !== prevGlyphRef.current) {
            findGlyphNodes(glyph).forEach((node) => {
                node.animate(
                    [
                        { opacity: 0, transform: 'translateY(-20px)' },
                        { opacity: 1, transform: 'translateY(0)' },
                    ],
                    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                )
            })
        }
        prevGlyphRef.current = glyph
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [glyph])

    const handlePick = (option: string) => {
        if (stage === 1) {
            if (stage1Checked) return
            setStage1Selected(option)
        } else {
            if (stage2Checked) return
            setStage2Selected(option)
        }
    }

    const handleButtonClick = () => {
        if (stage === 1) {
            if (!stage1Checked) {
                if (stage1Selected === null) return
                if (stage1Selected !== question.correctAnswer) hadMistakeRef.current = true
                setStage1Checked(true)
                return
            }
            // "Далее" — сдвигаем условие влево, переходим ко второму этапу.
            setStage(2)
            setStage2Selected(null)
            setStage2Checked(false)
            prevGlyphRef.current = null
            return
        }

        if (!stage2Checked) {
            if (stage2Selected === null) return
            if (stage2Selected !== trick.stage2Answer) hadMistakeRef.current = true
            setStage2Checked(true)
            return
        }

        // "Готово" — итог всего задания зависит от ОБОИХ этапов (тот же
        // принцип hadMistake, что уже используется в type-multistep.tsx).
        onAnswer(hadMistakeRef.current ? 'wrong' : 'right')
    }

    const options = stage === 1 ? question.options : trick.stage2Options
    const checked = stage === 1 ? stage1Checked : stage2Checked
    const selected = stage === 1 ? stage1Selected : stage2Selected
    const correctValue = stage === 1 ? question.correctAnswer : trick.stage2Answer
    const isStepCorrect = checked ? selected === correctValue : null

    const buttonDisabled = !checked && selected === null
    const buttonLabel = !checked
        ? 'Ответить'
        : stage === 1
            ? 'Далее'
            : 'Готово'

    return (
        <div className="mt-6">
            <div className="flex items-center justify-center gap-1.5 mb-4">
                <span className={cn('h-2 w-6 rounded-full transition-all', stage >= 1 ? 'bg-[#4A90D9]' : 'bg-[#3A464E]')} />
                <span className={cn('h-2 w-6 rounded-full transition-all', stage >= 2 ? 'bg-[#4A90D9]' : 'bg-[#3A464E]')} />
            </div>

            <motion.div
                key={stage}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                ref={containerRef}
                className="flex items-center justify-center py-8 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-[#F2F7FB]"
            >
                <Latex>{formula}</Latex>
            </motion.div>

            <motion.div
                key={`${stage}-options`}
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {options.map((option, idx) => (
                    <AnimatedOptionButton
                        key={idx}
                        option={option}
                        onClick={() => handlePick(option)}
                        index={idx}
                        isSelected={selected === option}
                        isCorrect={checked && option === correctValue}
                        isWrong={checked && selected === option && option !== correctValue}
                        disabled={checked}
                    />
                ))}
            </motion.div>

            {checked && (
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold mt-4',
                        isStepCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                    )}
                >
                    {isStepCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {isStepCorrect ? 'Верно!' : `Правильный ответ: ${correctValue}`}
                </div>
            )}

            <button
                type="button"
                onClick={handleButtonClick}
                disabled={buttonDisabled}
                className={cn(
                    'w-full py-3 mt-4 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                    buttonDisabled
                        ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
                        : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                )}
            >
                {buttonLabel}
            </button>
        </div>
    )
}
