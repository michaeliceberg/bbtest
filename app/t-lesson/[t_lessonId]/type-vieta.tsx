// app/t-lesson/[t_lessonId]/type-vieta.tsx
//
// Тип VIETA — тренажёр теоремы Виета (по прямой просьбе пользователя):
// "подбери два числа так, чтобы x1·x2 = P, x1+x2 = S". Клик по
// слот-кнопке x1/x2 делает её активной, клик по числу снизу заполняет
// АКТИВНЫЙ слот — значение сразу подставляется в ОБА уравнения разом
// (обе LaTeX-строки перегенерируются из состояния целиком на каждый
// рендер, а не собираются из отдельных сегментов формулы — та же
// осторожность, что и в type-insert.tsx: сегментирование одной LaTeX-
// строки на части ломает вложенные конструкции типа дробей/корней,
// здесь просто нет повода резать строку вообще, раз x1/x2 — не более
// чем текстовые токены внутри неё).
//
// Если question.vieta.quadratic задан — сначала короткий вводный экран
// "x²+bx+c=0 → a/b/c → формулы Виета → числа", и только затем те же
// интерактивные уравнения с уже готовыми product/sum.
//
// Тот же select-then-submit контракт, что у TRIGTABLE/UNITCIRCLE —
// компонент только СООБЩАЕТ наверх собранный ответ (отсортированная
// пара выбранных чисел через "|||"), проверка — по клику на общую
// кнопку "Ответить" внизу экрана.
//
// Дизайн-правки по прямой просьбе пользователя (2026-09-08):
// - x1/x2 стали постоянно цветными (x1 — синий, x2 — янтарный), одним и
//   тем же цветом и в верхних уравнениях, и в слот-кнопках, и в кнопках-
//   числах, куда они попадают — чтобы визуально было видно "это число
//   пошло в x1, а это в x2" без необходимости читать текст.
// - Все буквы (x, a, b, c) больше не курсивные — обёрнуты в \mathrm{}.
// - Больше отступ между блоком уравнений и слот-кнопками x1/x2 (было
//   мало места на "решить в уме", кнопки лепились сразу под формулами).
// - Крупнее шрифты/кнопки в целом.
// - Число при подстановке в слот "прилетает" с bounce (WAAPI-анимация
//   на DOM-узле KaTeX, найденном по инлайновому цвету \textcolor — тот
//   же приём, что уже использовался для INSERT, см. CLAUDE.md).

'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onOptionSelected: (answer: string | null) => void
    isAnswerChecked: boolean
    isAnswerCorrect: boolean
}

type Slot = 'x1' | 'x2'

const fmt = (n: number) => (n < 0 ? `(${n})` : `${n}`)
// Для места подстановки в "a + b" удобнее без скобок у отрицательного
// числа (люди привычнее видят "-3 + 2", чем "(-3) + 2") — скобки нужны
// только при УМНОЖЕНИИ отрицательных, где "- 3 \cdot 2" читалось бы как
// вычитание.
const fmtPlain = (n: number) => `${n}`

// Персональные цвета x1/x2 — используются одновременно в трёх местах
// (операнды уравнений, слот-кнопки, кнопки-числа) ради единого
// визуального языка "этот цвет = этот икс".
const COLOR_X1 = '#4A90D9' // синий — уже основной "выбрано"-акцент проекта
const COLOR_X2 = '#EF9F27' // янтарный — уже используется в этом же файле для 'b'
const slotColor = (slot: Slot) => (slot === 'x1' ? COLOR_X1 : COLOR_X2)

const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `rgb(${r}, ${g}, ${b})`
}

export const TypeVieta = ({ question, onOptionSelected, isAnswerChecked }: Props) => {
    const data = question.vieta

    const [introDone, setIntroDone] = useState(false)
    const [values, setValues] = useState<Record<Slot, number | null>>({ x1: null, x2: null })
    const [activeSlot, setActiveSlot] = useState<Slot>('x1')

    const containerRef = useRef<HTMLDivElement>(null)
    const prevValuesRef = useRef<Record<Slot, number | null>>({ x1: null, x2: null })

    useEffect(() => {
        setIntroDone(!data?.quadratic)
        setValues({ x1: null, x2: null })
        prevValuesRef.current = { x1: null, x2: null }
        setActiveSlot('x1')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question])

    useEffect(() => {
        if (values.x1 === null || values.x2 === null) {
            onOptionSelected(null)
            return
        }
        onOptionSelected([values.x1, values.x2].sort((a, b) => a - b).join('|||'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values])

    // Число появилось в слоте (null → значение) — "прилёт" с bounce на
    // ВСЕХ его инлайн-цветных DOM-узлах разом (операнд в двух уравнениях
    // + слот-кнопка) — они специально помечены одним и тем же
    // \textcolor{slotColor}{...}, поэтому находятся одним поиском.
    useLayoutEffect(() => {
        const prev = prevValuesRef.current
        const container = containerRef.current
        if (container) {
            (['x1', 'x2'] as Slot[]).forEach((slot) => {
                if (prev[slot] === null && values[slot] !== null) {
                    const targetRgb = hexToRgb(slotColor(slot))
                    const nodes = Array.from(container.querySelectorAll<HTMLElement>('[style]')).filter(
                        (el) => el.style.color === targetRgb,
                    )
                    nodes.forEach((el) => {
                        el.animate(
                            [
                                { transform: 'scale(0.3)', opacity: 0 },
                                { transform: 'scale(1.25)', opacity: 1 },
                                { transform: 'scale(1)', opacity: 1 },
                            ],
                            { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
                        )
                    })
                }
            })
        }
        prevValuesRef.current = values
    }, [values])

    if (!data) return null

    const usedNumbers = new Set(Object.values(values).filter((v): v is number => v !== null))

    const handlePickNumber = (num: number) => {
        if (isAnswerChecked) return
        if (usedNumbers.has(num) && values[activeSlot] !== num) return
        setValues((prev) => {
            const next = { ...prev, [activeSlot]: num }
            return next
        })
        // Автопереход на другой (ещё не заполненный) слот — тот же приём,
        // что у INSERT/TRIGTABLE (round-robin), не заставляет пользователя
        // отдельно кликать по x2 после заполнения x1 в обычном случае.
        const other: Slot = activeSlot === 'x1' ? 'x2' : 'x1'
        if (values[other] === null) setActiveSlot(other)
    }

    const handleSlotClick = (slot: Slot) => {
        if (isAnswerChecked) return
        setActiveSlot(slot)
    }

    const x1Display = values.x1 !== null ? fmtPlain(values.x1) : '\\mathrm{x}_{1}'
    const x2Display = values.x2 !== null ? fmtPlain(values.x2) : '\\mathrm{x}_{2}'
    const x1DisplayMul = values.x1 !== null ? fmt(values.x1) : '\\mathrm{x}_{1}'
    const x2DisplayMul = values.x2 !== null ? fmt(values.x2) : '\\mathrm{x}_{2}'

    const bothFilled = values.x1 !== null && values.x2 !== null
    const productOk = bothFilled && values.x1! * values.x2! === data.product
    const sumOk = bothFilled && values.x1! + values.x2! === data.sum

    const eqColor = (ok: boolean) =>
        !isAnswerChecked ? '#4A90D9' : ok ? '#A1D151' : '#DC605B'

    // До проверки — операнд подсвечен ПОСТОЯННЫМ цветом своего слота
    // (видно, что куда попало); после проверки — оба операнда одного
    // уравнения красятся его вердиктом (зелёный/красный), как и раньше.
    const productColorX1 = isAnswerChecked ? eqColor(productOk) : COLOR_X1
    const productColorX2 = isAnswerChecked ? eqColor(productOk) : COLOR_X2
    const sumColorX1 = isAnswerChecked ? eqColor(sumOk) : COLOR_X1
    const sumColorX2 = isAnswerChecked ? eqColor(sumOk) : COLOR_X2

    const productEq = `\\textcolor{${productColorX1}}{${x1DisplayMul}} \\cdot \\textcolor{${productColorX2}}{${x2DisplayMul}} = ${fmt(data.product)}`
    const sumEq = `\\textcolor{${sumColorX1}}{${x1Display}} + \\textcolor{${sumColorX2}}{${x2Display}} = ${fmt(data.sum)}`

    if (!introDone && data.quadratic) {
        const { a, b, c } = data.quadratic
        const bTerm = b === 0 ? '' : b > 0 ? ` + ${b}\\mathrm{x}` : ` - ${Math.abs(b)}\\mathrm{x}`
        const cTerm = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`
        const quadraticLatex = `${a === 1 ? '' : a}\\mathrm{x}^2${bTerm}${cTerm} = 0`

        return (
            <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 mt-4">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-bold text-[#F2F7FB] bg-[#161F23] border-2 border-[#3A464E] rounded-2xl px-7 py-6"
                >
                    <Latex>{`$${quadraticLatex}$`}</Latex>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-4"
                >
                    {[
                        { label: 'a', value: a, color: COLOR_X1 },
                        { label: 'b', value: b, color: COLOR_X2 },
                        { label: 'c', value: c, color: '#A1D151' },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className="rounded-xl border-2 px-5 py-3 text-xl md:text-2xl font-bold"
                            style={{ borderColor: color, color }}
                        >
                            <Latex>{`$\\mathrm{${label}} = ${value}$`}</Latex>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col items-center gap-3 text-xl md:text-2xl text-[#F2F7FB]"
                >
                    <Latex>{`$\\mathrm{x}_{1} \\cdot \\mathrm{x}_{2} = \\mathrm{c} = ${fmt(c)}$`}</Latex>
                    <Latex>{`$\\mathrm{x}_{1} + \\mathrm{x}_{2} = -\\mathrm{b} = ${fmt(-b)}$`}</Latex>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    type="button"
                    onClick={() => setIntroDone(true)}
                    className="w-full max-w-xs py-3.5 rounded-xl font-bold text-xl bg-[#4A90D9] text-[#0D1519] active:translate-y-0.5 transition-transform"
                >
                    Понятно, дальше
                </motion.button>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="w-full max-w-md mx-auto flex flex-col items-center mt-6">
            {/* Уравнения */}
            <div className="flex flex-col items-center gap-3 text-2xl md:text-4xl font-bold text-[#F2F7FB]">
                <Latex>{`$${productEq}$`}</Latex>
                <Latex>{`$${sumEq}$`}</Latex>
            </div>

            {/* Заметно больше пространства перед слот-кнопками x1/x2 — по
                прямой просьбе пользователя (раньше кнопки лепились сразу
                под формулами). */}
            <div className="flex gap-5 mt-12 mb-8">
                {(['x1', 'x2'] as Slot[]).map((slot) => {
                    const val = values[slot]
                    const isActive = activeSlot === slot
                    const color = slotColor(slot)
                    return (
                        <button
                            key={slot}
                            type="button"
                            onClick={() => handleSlotClick(slot)}
                            disabled={isAnswerChecked}
                            className={cn(
                                'min-w-[88px] rounded-2xl border-2 px-6 py-3 text-xl md:text-2xl font-bold transition-all',
                                isAnswerChecked && 'opacity-60',
                            )}
                            style={{
                                borderColor: color,
                                backgroundColor: isActive && !isAnswerChecked ? `${color}26` : `${color}12`,
                                color,
                            }}
                        >
                            <Latex>{`$\\mathrm{x}_{${slot === 'x1' ? 1 : 2}}${val !== null ? ` = \\textcolor{${color}}{${val}}` : ''}$`}</Latex>
                        </button>
                    )
                })}
            </div>

            {/* Числа — цвет показывает, в какой слот число уже попало;
                свободные числа — нейтральные. */}
            <div className="flex flex-wrap justify-center gap-3">
                {data.options.map((num) => {
                    const assignedSlot: Slot | null = values.x1 === num ? 'x1' : values.x2 === num ? 'x2' : null
                    const isTakenByOther = assignedSlot !== null && assignedSlot !== activeSlot
                    const disabled = isAnswerChecked || isTakenByOther
                    const color = assignedSlot ? slotColor(assignedSlot) : null

                    return (
                        <motion.button
                            key={num}
                            type="button"
                            whileTap={!disabled ? { scale: 0.9 } : undefined}
                            onClick={() => handlePickNumber(num)}
                            disabled={disabled}
                            className={cn(
                                'min-w-[64px] py-3 px-4 rounded-xl border-2 text-lg md:text-xl font-bold transition-colors',
                                !color && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] cursor-pointer hover:border-[#4A90D9]',
                                color && disabled && 'opacity-50 cursor-not-allowed',
                                color && !disabled && 'cursor-pointer',
                            )}
                            style={
                                color
                                    ? { borderColor: color, backgroundColor: `${color}1F`, color }
                                    : undefined
                            }
                        >
                            {num}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
