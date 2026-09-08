// app/t-lesson/[t_lessonId]/type-unitcircle.tsx
//
// Тип UNITCIRCLE — тригонометрический круг с точками-"радиокнопками" (см.
// UnitCircleData в page.tsx). Два режима:
// - 'locate' — выбрать ОДНУ точку, соответствующую названному в вопросе
//   углу ("Где находится 3π?", угол может быть отрицательным или
//   больше 2π — нужно привести по модулю 2π).
// - 'select' — отметить ВСЕ точки, подходящие под уравнение ("отметь
//   все x, где sin x = 1/2") — те же радиокнопки, просто без взаимного
//   исключения (можно отметить несколько сразу).
//
// По прямой просьбе пользователя точки НЕ подписаны (иначе ответ просто
// вычитывается взглядом, а не вспоминается) — только маленькие кружки
// точно НА линии окружности; подписаны лишь оси (cos α вправо, sin α
// вверх, со стрелками) как единственные визуальные ориентиры.
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
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onOptionSelected: (answer: string | null) => void
    isAnswerChecked: boolean
    isAnswerCorrect: boolean
}

// Радиус окружности и точек в единицах viewBox 0..100 (проценты
// контейнера) — намеренно меньше половины (50), чтобы оставить запас по
// краям под подписи осей (cos α / sin α), не вылезающие за пределы
// контейнера (см. риск горизонтального переполнения на мобильном,
// многократно чинившийся в этом проекте — см. CLAUDE.md) — весь запас
// решается внутри тех же 0-100%, без overflow-трюков. R уменьшен (было
// 34) — при 34 наконечник стрелки (AXIS_END+ARROW) вылезал почти к
// самому краю контейнера и физически перекрывал подпись "cos α"/"sin α"
// (пользователь поймал живьём) — с R=26 между наконечником и подписью
// гарантированный зазор, проверено через getBoundingClientRect.
const CX = 50
const CY = 50
const R = 26

// toFixed(4) — не про визуальную точность (0.0001% контейнера ничтожна),
// а про гидратацию: Math.cos/Math.sin теоретически могут дать чуть разный
// float на последнем разряде между серверным (Node/V8) и клиентским
// (Chromium/V8) рантаймом на одном и том же угле — без округления это
// приводило к предупреждению "Prop style did not match" в консоли
// (несовпадение inline style между SSR и гидратацией). Фиксированная
// строка одинаковой длины гарантированно совпадает на обеих сторонах.
const pointPos = (angle: number) => ({
    left: (CX + R * Math.cos(angle)).toFixed(4),
    top: (CY - R * Math.sin(angle)).toFixed(4), // экранный Y растёт вниз — инвертируем
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
                // Несколько радиокнопок сразу — просто переключаем эту точку.
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

    // Конец стрелки-оси (за пределом окружности, но внутри 0-100%) —
    // общий отступ от края круга до наконечника стрелки. Наконечник
    // (AXIS_END+ARROW) оказывается на 50+36=86% / 50-36=14% — подписи
    // осей начинаются заметно дальше (89% / у верхнего края 3%), с
    // явным зазором, а не впритык к остриям (см. LABEL_* ниже).
    const AXIS_END = R + 7 // 33
    const ARROW = 3
    const LABEL_RIGHT = 89 // % — левый край подписи "cos α"
    const LABEL_TOP = 3 // % — верхний край подписи "sin α"

    return (
        <div className="w-full h-full max-w-[360px] mx-auto flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square select-none">
                {/* Декоративный фон — сама окружность + оси со стрелками */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3A464E" strokeWidth="1" />

                    {/* Ось X — стрелка вправо (cos α) */}
                    <line x1={CX - AXIS_END} y1={CY} x2={CX + AXIS_END} y2={CY} stroke="#2A363D" strokeWidth="1" />
                    <polygon
                        points={`${CX + AXIS_END + ARROW},${CY} ${CX + AXIS_END - ARROW},${CY - ARROW * 0.7} ${CX + AXIS_END - ARROW},${CY + ARROW * 0.7}`}
                        fill="#4A5560"
                    />

                    {/* Ось Y — стрелка вверх (sin α) */}
                    <line x1={CX} y1={CY + AXIS_END} x2={CX} y2={CY - AXIS_END} stroke="#2A363D" strokeWidth="1" />
                    <polygon
                        points={`${CX},${CY - AXIS_END - ARROW} ${CX - ARROW * 0.7},${CY - AXIS_END + ARROW} ${CX + ARROW * 0.7},${CY - AXIS_END + ARROW}`}
                        fill="#4A5560"
                    />

                    <circle cx={CX} cy={CY} r="1.2" fill="#3A464E" />
                </svg>

                {/* Подписи осей — обычный HTML (не SVG-text), чтобы размер
                    шрифта был предсказуем в rem/px и не зависел от масштаба
                    viewBox. Раньше подписи были прижаты к самому краю
                    контейнера (right-0/top-0) — при более длинной стрелке
                    это давало физическое наложение наконечника на текст
                    (поймано пользователем живьём); теперь якорь — заранее
                    вычисленный отступ (LABEL_RIGHT/LABEL_TOP), гарантированно
                    дальше острия стрелки с явным зазором. */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[#8CA0AB] text-xs sm:text-sm"
                    style={{ left: `${LABEL_RIGHT}%` }}
                >
                    <Latex>{'$\\cos\\alpha$'}</Latex>
                </div>
                <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[#8CA0AB] text-xs sm:text-sm"
                    style={{ top: `${LABEL_TOP}%` }}
                >
                    <Latex>{'$\\sin\\alpha$'}</Latex>
                </div>

                {data.points.map((point, idx) => {
                    const { left, top } = pointPos(point.angle)
                    const isSelected = selected.has(idx)
                    const isCorrectPoint = correctSet.has(idx)

                    // Радиокnopка — маленький кружок ТОЧНО на линии окружности:
                    // невидимая (прозрачная) внешняя кнопка даёт удобную зону
                    // клика (особенно на телефоне), а видимый кружок внутри —
                    // фиксированного маленького размера, не растущего с зоной
                    // клика, чтобы визуально не съезжать с линии.
                    //
                    // Правильная точка ПОСЛЕ проверки — не просто зелёный
                    // цвет (при 12-14px размере это легко не заметить среди
                    // 16 точек, пользователь пожаловался, что "не видно, где
                    // правильный ответ") — дополнительно крупнее (scale) и со
                    // свечением (glow), чтобы бросалось в глаза даже беглым
                    // взглядом, независимо от того, выбрал её пользователь или
                    // нет.
                    let dotClass = 'border-2 border-[#4A5560] bg-[#151F24]'
                    let glowClass = ''
                    let correctScale = 1
                    if (!isAnswerChecked && isSelected) {
                        dotClass = 'border-2 border-[#4A90D9] bg-[#4A90D9]'
                    } else if (isAnswerChecked && isCorrectPoint) {
                        dotClass = 'border-2 border-[#A1D151] bg-[#A1D151]'
                        glowClass = 'shadow-[0_0_0_5px_rgba(161,209,81,0.35)]'
                        correctScale = 1.5
                    } else if (isAnswerChecked && isSelected && !isCorrectPoint) {
                        dotClass = 'border-2 border-[#DC605B] bg-[#DC605B]'
                    } else if (isAnswerChecked) {
                        dotClass = 'border-2 border-[#333F47] bg-[#181F24] opacity-60'
                    }

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleClick(idx)}
                            disabled={isAnswerChecked}
                            aria-label={point.label}
                            className={cn(
                                'absolute flex items-center justify-center rounded-full',
                                'w-7 h-7 sm:w-8 sm:h-8', // зона клика
                                !isAnswerChecked && 'cursor-pointer',
                            )}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <motion.span
                                className={cn('block rounded-full w-3 h-3 sm:w-3.5 sm:h-3.5', dotClass, glowClass)}
                                animate={{ scale: !isAnswerChecked && isSelected ? 1.25 : correctScale }}
                                whileTap={!isAnswerChecked ? { scale: 0.85 } : undefined}
                                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                            />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
