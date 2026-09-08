// app/t-lesson/[t_lessonId]/type-trigtable.tsx
//
// Тип TRIGTABLE — таблица значений тригонометрии (строки sin/cos/tg/ctg,
// столбцы 30°/45°/60°) с одним или несколькими пропусками, заполняемыми
// последовательно вариантами снизу (по прямой просьбе пользователя —
// "рисуется таблица но не полная... пользователь последовательно её
// заполняет вариантами которые внизу предлагаем").
//
// Самодостаточный тип (как FRACTRICK/CHECK) — свой собственный флоу и
// своя кнопка внизу, общая кнопка компонента TrainerQuestion не
// участвует (см. trainer-question.tsx — TRIGTABLE добавлен в тот же
// список исключений, что и CHECK/FRACTRICK).
//
// Заполнение — round-robin по недостающим пропускам (тот же принцип, что
// уже применяется в INSERT для 2 пропусков): клик по варианту заполняет
// ТЕКУЩИЙ активный пропуск и переводит активность на следующий незаполненный;
// клик по уже заполненной (но ещё не проверенной) ячейке снимает с неё
// значение — вариант возвращается в пул, а сама ячейка снова становится
// активной. Проверка — одной кнопкой "Ответить" сразу по ВСЕМ пропускам
// (как FRACTRICK — итог всего задания зависит от каждого пропуска), после
// чего кнопка становится "Готово" и вызывает onAnswer один раз.

'use client'

import { useEffect, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

const wrap = (v: string) => `$${v}$`

export const TypeTrigTable = ({ question, onAnswer }: Props) => {
    const table = question.trigTable

    // filledOptionIdx[i] — индекс варианта из table.options, занявшего i-й
    // пропуск (table.blanks[i]), либо null, если пропуск ещё пуст.
    const [filledOptionIdx, setFilledOptionIdx] = useState<(number | null)[]>([])
    const [activeBlank, setActiveBlank] = useState(0)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        setFilledOptionIdx(table ? table.blanks.map(() => null) : [])
        setActiveBlank(0)
        setChecked(false)
    }, [question, table])

    if (!table) return null

    const blankIndexAt = (row: number, col: number) =>
        table.blanks.findIndex((b) => b.row === row && b.col === col)

    const usedOptionIndices = new Set(filledOptionIdx.filter((v): v is number => v !== null))

    const firstUnfilled = () => filledOptionIdx.findIndex((v) => v === null)

    const handlePickOption = (optionIdx: number) => {
        if (checked || usedOptionIndices.has(optionIdx)) return
        const target = activeBlank
        if (filledOptionIdx[target] !== undefined && target >= 0 && target < filledOptionIdx.length) {
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

    const allFilled = filledOptionIdx.length > 0 && filledOptionIdx.every((v) => v !== null)

    const isBlankCorrect = (blankIdx: number) => {
        const optIdx = filledOptionIdx[blankIdx]
        if (optIdx === null || optIdx === undefined) return false
        const { row, col } = table.blanks[blankIdx]
        return table.options[optIdx] === table.values[row][col]
    }

    const hadMistake = checked && filledOptionIdx.some((_, i) => !isBlankCorrect(i))

    const handleButtonClick = () => {
        if (!checked) {
            if (!allFilled) return
            setChecked(true)
            return
        }
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
            <div className="w-full overflow-x-auto">
                <table className="mx-auto border-separate" style={{ borderSpacing: '6px' }}>
                    <thead>
                        <tr>
                            <th className="w-16" />
                            {table.colLabels.map((col, ci) => (
                                <th key={ci} className="px-3 py-2 text-[#F2F7FB] text-base md:text-lg font-bold">
                                    <Latex>{`$${col}$`}</Latex>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rowLabels.map((row, ri) => (
                            <tr key={ri}>
                                <th className="px-3 py-2 text-[#F2F7FB] text-base md:text-lg font-bold text-right">
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
                                        <td key={ci} className="px-1 py-1">
                                            <motion.div
                                                onClick={() => isBlank && filledValue !== null && handleClearBlank(bIdx)}
                                                className={cn(
                                                    'flex items-center justify-center rounded-xl border-2 min-w-[64px] min-h-[52px] px-2 py-1 text-lg md:text-xl',
                                                    !isBlank && 'bg-[#161F23] border-[#232F35] text-[#F2F7FB]',
                                                    isBlank && !checked && filledValue === null && isActive && 'bg-[#161F23] border-[#4A90D9] text-[#4A90D9] cursor-pointer',
                                                    isBlank && !checked && filledValue === null && !isActive && 'bg-[#161F23] border-[#3A464E] text-[#5A6A72]',
                                                    isBlank && !checked && filledValue !== null && 'bg-[#161F2377] border-[#4A90D9] text-[#4A90D9] cursor-pointer',
                                                    isBlank && checked && correct && 'bg-[#232F35] border-[#A1D151] text-[#A1D151]',
                                                    isBlank && checked && !correct && 'bg-[#161F23] border-[#DC605B] text-[#DC605B]'
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

            <div className="w-full grid grid-cols-3 gap-3">
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

            {checked && (
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold',
                        !hadMistake ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                    )}
                >
                    {!hadMistake ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {!hadMistake ? 'Верно!' : 'Есть ошибки — сверься с таблицей'}
                </div>
            )}

            <button
                type="button"
                onClick={handleButtonClick}
                disabled={!checked && !allFilled}
                className={cn(
                    'w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                    !checked && !allFilled
                        ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
                        : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                )}
            >
                {checked ? 'Готово' : 'Ответить'}
            </button>
        </div>
    )
}
