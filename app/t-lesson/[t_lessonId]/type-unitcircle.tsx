// app/t-lesson/[t_lessonId]/type-unitcircle.tsx
//
// Тип UNITCIRCLE — тригонометрический круг с точками-"магнитами" (см.
// UnitCircleData в page.tsx). Два режима:
// - 'locate' — выбрать ОДНУ точку, соответствующую названному в вопросе
//   углу ("Где находится 3π?", угол может быть отрицательным или
//   больше 2π — нужно привести по модулю 2π).
// - 'select' — отметить ВСЕ точки, подходящие под уравнение ("отметь
//   все x, где sin x = 1/2") — чекбоксы, не радио.
//
// Тот же select-then-submit контракт, что у TRIGTABLE/ASSIST/INSERT —
// компонент только СООБЩАЕТ наверх собранный ответ (отсортированные по
// возрастанию индексы выбранных точек, склеенные через "|||" — тот же
// разделитель точного сравнения, что у TRIGTABLE/INSERT, см. TQUIZ.tsx),
// реальная проверка — по клику на общую кнопку "Ответить" внизу экрана.

'use client'

import { useEffect, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onOptionSelected: (answer: string | null) => void
    isAnswerChecked: boolean
    isAnswerCorrect: boolean
}

// Радиус окружности и точек в единицах viewBox 0..100 (проценты контейнера)
// — совпадает с координатами decorативного SVG-фона ниже, поэтому точки
// ложатся ровно на нарисованную окружность без отдельной синхронизации.
const CX = 50
const CY = 50
const R = 38

const pointPos = (angle: number) => ({
    left: CX + R * Math.cos(angle),
    top: CY - R * Math.sin(angle), // экранный Y растёт вниз — инвертируем
})

export const TypeUnitCircle = ({ question, onOptionSelected, isAnswerChecked }: Props) => {
    const data = question.unitCircle

    const [selected, setSelected] = useState<Set<number>>(new Set())

    useEffect(() => {
        setSelected(new Set())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question])

    useEffect(() => {
        if (selected.size === 0) {
            onOptionSelected(null)
            return
        }
        onOptionSelected([...selected].sort((a, b) => a - b).join('|||'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected])

    if (!data) return null

    const isSelect = data.mode === 'select'
    const correctSet = new Set(data.correctIndices)

    const handleClick = (idx: number) => {
        if (isAnswerChecked) return
        setSelected((prev) => {
            const next = new Set(prev)
            if (isSelect) {
                // Чекбоксы — просто переключаем эту точку.
                next.has(idx) ? next.delete(idx) : next.add(idx)
            } else {
                // Одна точка за раз — повторный клик по уже выбранной снимает
                // выбор (даёт исправить промах), клик по другой заменяет.
                if (next.has(idx)) {
                    next.clear()
                } else {
                    next.clear()
                    next.add(idx)
                }
            }
            return next
        })
    }

    return (
        <div className="w-full h-full max-w-[360px] mx-auto flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square select-none">
                {/* Декоративный фон — сама окружность + оси */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3A464E" strokeWidth="1" />
                    <line x1={CX - R - 6} y1={CY} x2={CX + R + 6} y2={CY} stroke="#2A363D" strokeWidth="1" />
                    <line x1={CX} y1={CY - R - 6} x2={CX} y2={CY + R + 6} stroke="#2A363D" strokeWidth="1" />
                    <circle cx={CX} cy={CY} r="1.2" fill="#3A464E" />
                </svg>

                {data.points.map((point, idx) => {
                    const { left, top } = pointPos(point.angle)
                    const isSelected = selected.has(idx)
                    const isCorrectPoint = correctSet.has(idx)

                    let stateClass = 'border-[#3A464E] bg-[#1B262C] text-[#8CA0AB]'
                    if (!isAnswerChecked && isSelected) {
                        stateClass = 'border-[#4A90D9] bg-[#20303E] text-[#7CB4EE]'
                    } else if (isAnswerChecked && isCorrectPoint) {
                        stateClass = 'border-[#A1D151] bg-[#22301E] text-[#A1D151]'
                    } else if (isAnswerChecked && isSelected && !isCorrectPoint) {
                        stateClass = 'border-[#DC605B] bg-[#332021] text-[#DC605B]'
                    } else if (isAnswerChecked) {
                        stateClass = 'border-[#26313A] bg-[#181F24] text-[#48575F] opacity-70'
                    }

                    return (
                        <motion.button
                            key={idx}
                            type="button"
                            onClick={() => handleClick(idx)}
                            disabled={isAnswerChecked}
                            className={cn(
                                'absolute flex items-center justify-center rounded-full border-2',
                                'w-9 h-9 sm:w-11 sm:h-11 text-[10px] sm:text-xs leading-none',
                                !isAnswerChecked && 'cursor-pointer',
                                stateClass,
                            )}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            animate={{ scale: !isAnswerChecked && isSelected ? 1.12 : 1 }}
                            whileTap={!isAnswerChecked ? { scale: 0.92 } : undefined}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        >
                            <Latex>{`$${point.label}$`}</Latex>

                            {isSelect && isSelected && !isAnswerChecked && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#4A90D9] flex items-center justify-center">
                                    <Check size={9} strokeWidth={3.5} className="text-[#0D1519]" />
                                </span>
                            )}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
