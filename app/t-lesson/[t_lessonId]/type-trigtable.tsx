// app/t-lesson/[t_lessonId]/type-trigtable.tsx
//
// Тип TRIGTABLE — таблица значений тригонометрии (строки sin/cos/tg,
// столбцы 30°/45°/60°) с одним или несколькими пропусками, заполняемыми
// последовательно вариантами снизу (по прямой просьбе пользователя —
// "рисуется таблица но не полная... пользователь последовательно её
// заполняет вариантами которые внизу предлагаем").
//
// По просьбе пользователя переведён на СТАНДАРТНЫЙ для тренажёра дизайн
// (как у ASSIST/CONNECT/MULTISTEP) — своей кнопки внизу больше нет,
// используется общая фиксированная кнопка `TrainerQuestion`. Проверка
// срабатывает АВТОМАТИЧЕСКИ, как только заполнен последний пропуск
// (эффект ниже) — компонент сообщает результат через `onComplete`, тот же
// контракт, что уже у MULTISTEP/CONNECT (`onComplete`/`onAllPairsMatched`).
// Общая кнопка дальше сама берёт на себя "далее"/"понятно" и реальный
// вызов onAnswer — TRIGTABLE в этом смысле больше НЕ самодостаточный тип,
// как раньше был.
//
// Заполнение — round-robin по недостающим пропускам (тот же принцип, что
// уже применяется в INSERT для 2 пропусков): клик по варианту заполняет
// ТЕКУЩИЙ активный пропуск и переводит активность на следующий незаполненный;
// клик по уже заполненной (но ещё не проверенной) ячейке снимает с неё
// значение — вариант возвращается в пул, а сама ячейка снова становится
// активной.

'use client'

import { useEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onComplete: (isCorrect: boolean) => void
}

const wrap = (v: string) => `$${v}$`

export const TypeTrigTable = ({ question, onComplete }: Props) => {
    const table = question.trigTable

    // filledOptionIdx[i] — индекс варианта из table.options, занявшего i-й
    // пропуск (table.blanks[i]), либо null, если пропуск ещё пуст.
    const [filledOptionIdx, setFilledOptionIdx] = useState<(number | null)[]>([])
    const [activeBlank, setActiveBlank] = useState(0)
    const [checked, setChecked] = useState(false)
    const completedRef = useRef(false)

    useEffect(() => {
        setFilledOptionIdx(table ? table.blanks.map(() => null) : [])
        setActiveBlank(0)
        setChecked(false)
        completedRef.current = false
    }, [question, table])

    const blankIndexAt = (row: number, col: number) =>
        table ? table.blanks.findIndex((b) => b.row === row && b.col === col) : -1

    const usedOptionIndices = new Set(filledOptionIdx.filter((v): v is number => v !== null))

    const isBlankCorrect = (blankIdx: number) => {
        if (!table) return false
        const optIdx = filledOptionIdx[blankIdx]
        if (optIdx === null || optIdx === undefined) return false
        const { row, col } = table.blanks[blankIdx]
        return table.options[optIdx] === table.values[row][col]
    }

    const allFilled = filledOptionIdx.length > 0 && filledOptionIdx.every((v) => v !== null)

    // Автоматическая проверка — как только заполнен последний пропуск,
    // сразу решаем итог и сообщаем наверх (тот же принцип, что уже
    // использует MULTISTEP/CONNECT) — своей кнопки "Ответить" у типа
    // больше нет, за подтверждение и переход дальше отвечает общая
    // фиксированная кнопка внизу экрана.
    useEffect(() => {
        if (allFilled && !completedRef.current) {
            completedRef.current = true
            setChecked(true)
            const hadMistake = filledOptionIdx.some((_, i) => !isBlankCorrect(i))
            onComplete(!hadMistake)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allFilled])

    if (!table) return null

    const handlePickOption = (optionIdx: number) => {
        if (checked || usedOptionIndices.has(optionIdx)) return
        const target = activeBlank
        if (target >= 0 && target < filledOptionIdx.length) {
            const next = [...filledOptionIdx]
            next[target] = optionIdx
            setFilledOptionIdx(next)
            const nextEmpty = next.findIndex((v) => v === null)
            setActiveBlank(nextEmpty === -1 ? target : nextEmpty)
        }
    }

    const handleClearBlank = (blankIdx: number) => {
        if (checked) return
        const next = [...filledOptionIdx]
        next[blankIdx] = null
        setFilledOptionIdx(next)
        setActiveBlank(blankIdx)
    }

    // Чётное число вариантов (в т.ч. частый случай 4 — один пропуск + 3
    // обманки) — по просьбе пользователя раскладываем в 2 колонки на всю
    // ширину экрана вместо 3 (при 4 вариантах 3 колонки давали кривой
    // "3+1" ряд); нечётное — как раньше, 3 колонки.
    const optionsGridClass = table.options.length % 2 === 0 ? 'grid-cols-2' : 'grid-cols-3'

    return (
        // h-full — принципиально: родитель (trainer-question.tsx) кладёт
        // renderMainContent() в flex-контейнер с justify-center, который
        // ЦЕНТРИРУЕТ переданный блок по высоте, если тот меньше доступного
        // места — раньше это создавало большой отступ и над, и под
        // таблицей ("давай таблицу рисовать повыше"). h-full заставляет
        // корень занять ВСЮ доступную высоту, поэтому центрировать
        // нечего — контент прижимается к началу (сверху) сам, любое
        // лишнее место остаётся снизу, не расталкивая таблицу от облака.
        <div className="w-full h-full max-w-2xl mx-auto flex flex-col gap-3 sm:gap-4">
            <div className="w-full overflow-x-auto">
                <table className="mx-auto border-separate table-fixed" style={{ borderSpacing: '4px' }}>
                    <thead>
                        <tr>
                            <th className="w-8 sm:w-12" />
                            {table.colLabels.map((col, ci) => (
                                <th key={ci} className="w-[64px] sm:w-[74px] px-0.5 py-1 text-[#F2F7FB] text-sm sm:text-base font-bold">
                                    <Latex>{`$${col}$`}</Latex>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rowLabels.map((row, ri) => (
                            <tr key={ri}>
                                <th className="px-0.5 py-1 text-[#F2F7FB] text-sm sm:text-base font-bold text-right">
                                    {row}
                                </th>
                                {table.colLabels.map((_, ci) => {
                                    const bIdx = blankIndexAt(ri, ci)
                                    const isBlank = bIdx !== -1
                                    const optIdx = isBlank ? filledOptionIdx[bIdx] : null
                                    const filledValue = optIdx !== null && optIdx !== undefined ? table.options[optIdx] : null
                                    const isActive = isBlank && bIdx === activeBlank && !checked
                                    const correct = isBlank && checked ? isBlankCorrect(bIdx) : null

                                    return (
                                        <td key={ci} className="p-0">
                                            <motion.div
                                                onClick={() => isBlank && filledValue !== null && handleClearBlank(bIdx)}
                                                className={cn(
                                                    'flex items-center justify-center rounded-lg min-h-[38px] sm:min-h-[44px] px-1 py-0.5 text-base sm:text-lg',
                                                    // Уже вписанные (не-пропуск) значения — без рамки, приглушённым
                                                    // цветом: пользователь заметил, что яркая рамка на КАЖДОЙ ячейке
                                                    // (в т.ч. неактивной) только отвлекает от реальных пропусков, а
                                                    // яркий белый текст на них "рябит в глазах".
                                                    !isBlank && 'text-[#6B7A83]',
                                                    isBlank && !checked && filledValue === null && isActive && 'border-2 border-[#4A90D9] text-[#4A90D9] cursor-pointer',
                                                    isBlank && !checked && filledValue === null && !isActive && 'border-2 border-[#3A464E] text-[#5A6A72]',
                                                    isBlank && !checked && filledValue !== null && 'border-2 border-[#4A90D9] text-[#4A90D9] cursor-pointer',
                                                    isBlank && checked && correct && 'border-2 border-[#A1D151] bg-[#232F35] text-[#A1D151]',
                                                    isBlank && checked && !correct && 'border-2 border-[#DC605B] text-[#DC605B]'
                                                )}
                                            >
                                                {isBlank
                                                    ? (filledValue !== null ? <Latex>{wrap(filledValue)}</Latex> : '?')
                                                    : <Latex>{wrap(table.values[ri][ci])}</Latex>}
                                            </motion.div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={cn('w-full grid gap-2 sm:gap-3', optionsGridClass)}>
                {table.options.map((opt, idx) => {
                    const used = usedOptionIndices.has(idx)
                    return (
                        <AnimatedOptionButton
                            key={idx}
                            option={wrap(opt)}
                            index={idx}
                            onClick={() => handlePickOption(idx)}
                            isSelected={false}
                            disabled={checked || used}
                        />
                    )
                })}
            </div>
        </div>
    )
}
