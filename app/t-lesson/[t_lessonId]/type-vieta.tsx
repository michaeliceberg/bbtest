// app/t-lesson/[t_lessonId]/type-vieta.tsx
//
// Тип VIETA — тренажёр теоремы Виета (по прямой просьбе пользователя):
// "подбери два числа так, чтобы x1·x2 = P, x1+x2 = S".
//
// x1 и x2 — НАСТОЯЩИЕ кнопки (стандартный для проекта псевдо-3D стиль,
// border-2 border-b-4 active:border-b-2 — тот же язык, что у "Нет
// правильного ответа?"/KEYBOARD), стоящие прямо ВНУТРИ обоих уравнений
// (по прямой просьбе пользователя, 2026-09-08 — "давай упростим": раньше
// x1/x2 были куском общей LaTeX-строки, а под уравнениями дублировался
// отдельный ряд слот-кнопок — теперь кнопки САМИ являются этой частью
// уравнения, отдельный ряд не нужен). Клик по ЛЮБОМУ вхождению x1 (их
// два — по одному на каждое уравнение) делает слот x1 активным — оба
// вхождения всегда показывают одно и то же значение, т.к. это один и
// тот же React-стейт. Клик по числу снизу заполняет АКТИВНЫЙ слот.
//
// Поскольку x1/x2 теперь отдельные HTML-кнопки, а не токены внутри одной
// KaTeX-строки, никакого сегментирования LaTeX не требуется вообще —
// операторы (·, +, =) и итоговое число справа — обычный текст, без
// KaTeX (у "x1 · x2 = 6" не осталось ни одного места, где реально нужен
// формульный рендер). Раз каждый операнд — визуально обособленная
// кнопка, отрицательное число внутри неё уже не может слиться с
// соседним оператором ("3 · [-2]" читается однозначно даже без скобок).
//
// Если question.vieta.quadratic задан — сначала короткий вводный экран
// "x²+bx+c=0 → a/b/c → формулы Виета → числа" (там x1/x2 ещё не
// интерактивны, обычный статичный LaTeX), и только затем переход на
// интерактивные уравнения с уже готовыми product/sum.
//
// Тот же select-then-submit контракт, что у TRIGTABLE/UNITCIRCLE —
// компонент только СООБЩАЕТ наверх собранный ответ (отсортированная
// пара выбранных чисел через "|||"), проверка — по клику на общую
// кнопку "Ответить" внизу экрана.

'use client'

import { useEffect, useState } from 'react'
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

const fmtPlain = (n: number) => `${n}`

// Персональные цвета x1/x2 — используются одновременно в двух местах
// (кнопки x1/x2 внутри уравнений + кнопки-числа, куда они попадают) ради
// единого визуального языка "этот цвет = этот икс".
const COLOR_X1 = '#4A90D9' // синий — уже основной "выбрано"-акцент проекта
const COLOR_X2 = '#EF9F27' // янтарный — уже используется в этом же файле для 'b'
const slotColor = (slot: Slot) => (slot === 'x1' ? COLOR_X1 : COLOR_X2)

export const TypeVieta = ({ question, onOptionSelected, isAnswerChecked }: Props) => {
    const data = question.vieta

    const [introDone, setIntroDone] = useState(false)
    const [values, setValues] = useState<Record<Slot, number | null>>({ x1: null, x2: null })
    const [activeSlot, setActiveSlot] = useState<Slot>('x1')

    useEffect(() => {
        setIntroDone(!data?.quadratic)
        setValues({ x1: null, x2: null })
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

    if (!data) return null

    const usedNumbers = new Set(Object.values(values).filter((v): v is number => v !== null))

    const handlePickNumber = (num: number) => {
        if (isAnswerChecked) return
        if (usedNumbers.has(num) && values[activeSlot] !== num) return
        setValues((prev) => ({ ...prev, [activeSlot]: num }))
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

    const bothFilled = values.x1 !== null && values.x2 !== null
    const productOk = bothFilled && values.x1! * values.x2! === data.product
    const sumOk = bothFilled && values.x1! + values.x2! === data.sum

    const eqColor = (ok: boolean) => (!isAnswerChecked ? null : ok ? '#A1D151' : '#DC605B')

    // Кнопка x1 или x2 — рендерится ДВАЖДЫ (по разу на каждое уравнение),
    // всегда с одним и тем же values[slot]/activeSlot, поэтому оба
    // вхождения всегда синхронны. checkedColor — вердикт КОНКРЕТНО того
    // уравнения, в котором эта кнопка сейчас стоит (до проверки — null,
    // тогда используется постоянный цвет слота).
    const SlotButton = ({ slot, checkedColor }: { slot: Slot; checkedColor: string | null }) => {
        const val = values[slot]
        const isActive = activeSlot === slot
        const color = checkedColor ?? slotColor(slot)
        return (
            <button
                type="button"
                onClick={() => handleSlotClick(slot)}
                disabled={isAnswerChecked}
                className={cn(
                    'min-w-[52px] px-3 py-1 rounded-lg border-2 border-b-4 active:border-b-2 active:translate-y-0.5 font-bold transition-colors',
                    isAnswerChecked ? 'opacity-80 cursor-default' : 'cursor-pointer',
                )}
                style={{
                    borderColor: color,
                    backgroundColor: isActive && !isAnswerChecked ? `${color}26` : `${color}12`,
                    color,
                }}
            >
                <motion.span
                    key={val ?? 'empty'}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    className="inline-block"
                >
                    {val !== null ? val : (slot === 'x1' ? 'x₁' : 'x₂')}
                </motion.span>
            </button>
        )
    }

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
                    <Latex>{`$\\mathrm{x}_{1} \\cdot \\mathrm{x}_{2} = \\mathrm{c} = ${fmtPlain(c)}$`}</Latex>
                    <Latex>{`$\\mathrm{x}_{1} + \\mathrm{x}_{2} = -\\mathrm{b} = ${fmtPlain(-b)}$`}</Latex>
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
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-10 mt-6">
            {/* Уравнения — x1/x2 настоящие кнопки прямо внутри, операторы и
                итоговое число справа — обычный текст (не LaTeX, тут нет ни
                одной формульной конструкции, которая бы его требовала). */}
            <div className="flex flex-col items-center gap-5 text-2xl md:text-3xl font-bold text-[#F2F7FB]">
                <div className="flex items-center gap-3">
                    <SlotButton slot="x1" checkedColor={eqColor(productOk)} />
                    <span>·</span>
                    <SlotButton slot="x2" checkedColor={eqColor(productOk)} />
                    <span>=</span>
                    <span style={{ color: eqColor(productOk) ?? undefined }}>{fmtPlain(data.product)}</span>
                </div>
                <div className="flex items-center gap-3">
                    <SlotButton slot="x1" checkedColor={eqColor(sumOk)} />
                    <span>+</span>
                    <SlotButton slot="x2" checkedColor={eqColor(sumOk)} />
                    <span>=</span>
                    <span style={{ color: eqColor(sumOk) ?? undefined }}>{fmtPlain(data.sum)}</span>
                </div>
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
