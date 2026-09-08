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

const fmt = (n: number) => (n < 0 ? `(${n})` : `${n}`)
// Для места подстановки в "a + b" удобнее без скобок у отрицательного
// числа (люди привычнее видят "-3 + 2", чем "(-3) + 2") — скобки нужны
// только при УМНОЖЕНИИ отрицательных, где "- 3 \cdot 2" читалось бы как
// вычитание.
const fmtPlain = (n: number) => `${n}`

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

    const x1Display = values.x1 !== null ? fmtPlain(values.x1) : 'x_1'
    const x2Display = values.x2 !== null ? fmtPlain(values.x2) : 'x_2'
    const x1DisplayMul = values.x1 !== null ? fmt(values.x1) : 'x_1'
    const x2DisplayMul = values.x2 !== null ? fmt(values.x2) : 'x_2'

    const bothFilled = values.x1 !== null && values.x2 !== null
    const productOk = bothFilled && values.x1! * values.x2! === data.product
    const sumOk = bothFilled && values.x1! + values.x2! === data.sum

    const eqColor = (ok: boolean) =>
        !isAnswerChecked ? '#4A90D9' : ok ? '#A1D151' : '#DC605B'

    const productEq = `\\textcolor{${eqColor(productOk)}}{${x1DisplayMul} \\cdot ${x2DisplayMul}} = ${fmt(data.product)}`
    const sumEq = `\\textcolor{${eqColor(sumOk)}}{${x1Display} + ${x2Display}} = ${fmt(data.sum)}`

    if (!introDone && data.quadratic) {
        const { a, b, c } = data.quadratic
        const bTerm = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`
        const cTerm = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`
        const quadraticLatex = `${a === 1 ? '' : a}x^2${bTerm}${cTerm} = 0`

        return (
            <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 mt-4">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-bold text-[#F2F7FB] bg-[#161F23] border-2 border-[#3A464E] rounded-2xl px-6 py-5"
                >
                    <Latex>{`$${quadraticLatex}$`}</Latex>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3"
                >
                    {[
                        { label: 'a', value: a, color: '#4A90D9' },
                        { label: 'b', value: b, color: '#EF9F27' },
                        { label: 'c', value: c, color: '#A1D151' },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className="rounded-xl border-2 px-4 py-2 text-lg font-bold"
                            style={{ borderColor: color, color }}
                        >
                            <Latex>{`$${label} = ${value}$`}</Latex>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col items-center gap-2 text-lg md:text-xl text-[#F2F7FB]"
                >
                    <Latex>{`$x_1 \\cdot x_2 = c = ${fmt(c)}$`}</Latex>
                    <Latex>{`$x_1 + x_2 = -b = ${fmt(-b)}$`}</Latex>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    type="button"
                    onClick={() => setIntroDone(true)}
                    className="w-full max-w-xs py-3 rounded-xl font-bold text-lg bg-[#4A90D9] text-[#0D1519] active:translate-y-0.5 transition-transform"
                >
                    Понятно, дальше
                </motion.button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 mt-6">
            <div className="flex flex-col items-center gap-2 text-xl md:text-2xl font-bold text-[#F2F7FB]">
                <Latex>{`$${productEq}$`}</Latex>
                <Latex>{`$${sumEq}$`}</Latex>
            </div>

            <div className="flex gap-4">
                {(['x1', 'x2'] as Slot[]).map((slot) => {
                    const val = values[slot]
                    const isActive = activeSlot === slot
                    return (
                        <button
                            key={slot}
                            type="button"
                            onClick={() => handleSlotClick(slot)}
                            disabled={isAnswerChecked}
                            className={cn(
                                'min-w-[64px] rounded-xl border-2 px-4 py-2 text-base font-bold transition-colors',
                                isActive && !isAnswerChecked
                                    ? 'border-[#4A90D9] bg-[#1B2C3D] text-[#4A90D9]'
                                    : 'border-[#3A464E] bg-[#161F23] text-[#9AA7B0]',
                            )}
                        >
                            <Latex>{`$x_{${slot === 'x1' ? 1 : 2}}${val !== null ? ` = ${val}` : ''}$`}</Latex>
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {data.options.map((num) => {
                    const isUsedElsewhere = usedNumbers.has(num) && values[activeSlot] !== num
                    return (
                        <motion.button
                            key={num}
                            type="button"
                            whileTap={!isAnswerChecked && !isUsedElsewhere ? { scale: 0.9 } : undefined}
                            onClick={() => handlePickNumber(num)}
                            disabled={isAnswerChecked || isUsedElsewhere}
                            className={cn(
                                'min-w-[52px] py-2 px-3 rounded-lg border-2 text-base font-bold transition-colors',
                                isUsedElsewhere
                                    ? 'border-[#26313A] text-[#3A464E] cursor-not-allowed'
                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] cursor-pointer hover:border-[#4A90D9]',
                            )}
                        >
                            {num}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
