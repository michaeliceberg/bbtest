// components/geometry/FormulaAssemble.tsx
//
// Тренировочный ответ «собери формулу из кнопок» для *WALK-разборов (как в
// SINCOSDEFWALK, урок 486): формула с двумя пропусками — дробью
// («гипотенуза = ?/?») или произведением («катет = ? · ?») — и пул кнопок
// снизу. Клик по кнопке «прилетает» в активный пропуск (общий layoutId →
// FLIP-переход между пулом и пропуском), клик по уже вставленной кнопке
// возвращает её в пул. Как только заполнены оба пропуска — мгновенная
// проверка; неверно — пропуски краснеют, можно пробовать дальше («пробуй,
// пока не угадаешь»), верно — onSolved(solvedFirstTry).
// Стандарт проекта: ответы в тренировках любых step-by-step разборов — только
// так (в два этапа), а не выбором из готовых вариантов.

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type FormulaChip = { id: string; label: string }

type Props = {
    // Левая часть («гипотенуза =», «катет =»).
    prefix: React.ReactNode
    // 'single' — один пропуск (correct[0]), второй не используется.
    layout: 'fraction' | 'product' | 'single'
    chips: FormulaChip[]
    // Верные [первый пропуск, второй пропуск]: числитель/знаменатель или
    // левый/правый множитель.
    correct: [string, string]
    // Другие верные пары (например, пропорцию можно записать по-разному).
    alsoCorrect?: [string, string][]
    // Текст после формулы (например, «= 12»).
    suffix?: string
    // Подсказки в пустых пропусках (необязательно).
    slotHints?: [string, string]
    // Уже решённое/прошлое задание — застывший вид с верными кнопками.
    frozen?: boolean
    onWrong?: () => void
    onSolved?: (solvedFirstTry: boolean) => void
}

const CHIP_BASE = 'min-w-11 h-11 px-3 rounded-lg border-2 flex items-center justify-center text-lg font-black shrink-0 whitespace-nowrap'

export const FormulaAssemble = ({ prefix, layout, chips, correct, alsoCorrect, suffix, slotHints, frozen = false, onWrong, onSolved }: Props) => {
    const [slots, setSlots] = useState<(string | null)[]>([null, null])
    const [active, setActive] = useState<0 | 1>(0)
    const [wrong, setWrong] = useState(false)
    const [solved, setSolved] = useState(false)
    const [mistakes, setMistakes] = useState(0)

    useEffect(() => {
        if (!wrong) return
        const t = setTimeout(() => setWrong(false), 900)
        return () => clearTimeout(t)
    }, [wrong])

    const label = (id: string | null) => chips.find((c) => c.id === id)?.label ?? ''
    const done = frozen || solved

    const evaluate = (next: (string | null)[]) => {
        if (layout === 'single') {
            if (next[0] === null) return
        } else if (next[0] === null || next[1] === null) return
        const ok = layout === 'single'
            ? next[0] === correct[0]
            : [correct, ...(alsoCorrect ?? [])].some((c) => next[0] === c[0] && next[1] === c[1])
        if (ok) {
            setSolved(true)
            onSolved?.(mistakes === 0)
        } else {
            setWrong(true)
            setMistakes((m) => m + 1)
            onWrong?.()
        }
    }

    const handlePool = (id: string) => {
        if (done) return
        const next = [...slots]
        next[active] = id
        setSlots(next)
        setWrong(false)
        if (layout === 'single') return evaluate(next)
        const other: 0 | 1 = active === 0 ? 1 : 0
        if (next[other] === null) setActive(other)
        else evaluate(next)
    }

    const handleClear = (idx: 0 | 1) => {
        if (done) return
        const next = [...slots]
        next[idx] = null
        setSlots(next)
        setWrong(false)
        // Следующий клик по пулу идёт в первый пустой пропуск (сверху/слева).
        setActive(next[0] === null ? 0 : 1)
    }

    const renderSlot = (idx: 0 | 1) => {
        if (done) {
            // Верная пара, которую выбрал ученик (если пропуски заполнены), иначе — основная.
            const shown = slots[0] !== null && slots[1] !== null && layout !== 'single' ? slots[idx] : correct[idx]
            return <div className={cn(CHIP_BASE, 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]')}>{label(shown)}</div>
        }
        const id = slots[idx]
        if (id !== null) {
            return (
                <motion.button
                    layoutId={`fa-${id}`} layout type="button" onClick={() => handleClear(idx)}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    className={cn(CHIP_BASE, 'cursor-pointer', wrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#4A90D9] bg-[#1B2C3D] text-[#4A90D9]')}
                >
                    {label(id)}
                </motion.button>
            )
        }
        const isActive = active === idx
        return (
            <div className={cn(CHIP_BASE, 'border-dashed', isActive ? 'border-[#4A90D9] text-[#4A90D9] animate-pulse' : 'border-[#3A464E] text-[#5A6A72]')}>
                {slotHints?.[idx] ?? '?'}
            </div>
        )
    }

    const poolChips = chips.filter((c) => !slots.includes(c.id))
    const dividerColor = done ? '#A1D151' : wrong ? '#DC605B' : '#F2F7FB'

    return (
        <div className="flex flex-col items-center gap-5 w-full">
            <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-bold text-[#F2F7FB] flex-wrap">
                <span>{prefix}</span>
                {layout === 'single' ? (
                    renderSlot(0)
                ) : layout === 'fraction' ? (
                    <div className="inline-flex flex-col items-stretch">
                        {renderSlot(0)}
                        <div className="h-0.5 my-1 rounded" style={{ backgroundColor: dividerColor }} />
                        {renderSlot(1)}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2">
                        {renderSlot(0)}
                        <span>·</span>
                        {renderSlot(1)}
                    </div>
                )}
                {suffix && <span>{suffix}</span>}
            </div>
            {!done && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {poolChips.map((c) => (
                        <motion.button
                            key={c.id}
                            layoutId={`fa-${c.id}`} layout type="button" onClick={() => handlePool(c.id)}
                            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                            className={cn(CHIP_BASE, 'border-[#3A464E] bg-[#1B252B] text-[#F2F7FB] cursor-pointer hover:border-[#4A90D9]')}
                        >
                            {c.label}
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    )
}
