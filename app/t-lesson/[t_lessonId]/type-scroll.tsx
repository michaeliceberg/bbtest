// app/t-lesson/[t_lessonId]/type-scroll.tsx
//
// Тип задания SCROLL: горизонтальный бегунок (числовая ось) с 3
// делениями, над каждым — подпись-вариант ответа (одна верная). Тот же
// флоу ответа, что у ASSIST/INSERT (onOptionSelected/isAnswerChecked/
// isAnswerCorrect приходят сверху из trainer-question.tsx, кнопка
// "ответить" общая).

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { QuestionType } from './page'
import { Slider, SliderTrack, SliderRange, SliderThumb } from '@radix-ui/react-slider'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { isCorrectAnswer } from '@/usefulFunctions'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

// Бегунок (size-6 = 24px) — Radix держит его ЦЕНТР в диапазоне
// [радиус, 100% - радиус] трека, а не [0%, 100%], иначе он вылезал бы
// за пределы трека в крайних положениях. Подписи вариантов раньше стояли
// ровно на 0%/50%/100%, поэтому в крайних положениях бегунок и подпись
// над ним были не на одной вертикали — теперь подписи стоят на тех же
// точках, что и центр бегунка.
const THUMB_RADIUS_PX = 12
const TICK_POSITIONS = [`${THUMB_RADIUS_PX}px`, '50%', `calc(100% - ${THUMB_RADIUS_PX}px)`]

const EASE = [0.4, 0, 0.2, 1] as const // ease-in-out — разгон и торможение
const TRANSITION = { duration: 0.3, ease: EASE }

type ColorState = { bg: string; border: string; text: string }
const COLOR_NEUTRAL: ColorState = { bg: '#161F23', border: '#3A464E', text: 'rgba(242,247,251,0.8)' }
const COLOR_SELECTED: ColorState = { bg: '#1B2C3D', border: '#4A90D9', text: '#F2F7FB' }
const COLOR_RIGHT: ColorState = { bg: '#1F3A2A', border: '#A1D151', text: '#A1D151' }
const COLOR_WRONG: ColorState = { bg: '#3A1F22', border: '#DC605B', text: '#DC605B' }

export const TypeScroll = ({
    question,
    onOptionSelected,
    isAnswerChecked = false,
}: Props) => {
    // Бегунок всегда стоит на какой-то позиции — стартуем со случайного
    // деления (как уже делает числовой TypeSlider), а не с "ничего не
    // выбрано", иначе thumb нечего было бы показывать до первого клика.
    const [selectedIndex, setSelectedIndex] = useState(() => Math.floor(Math.random() * 3))
    const [showResult, setShowResult] = useState(false)

    // Тот же паттерн, что в type-assist.tsx/type-insert.tsx: эффект
    // двунаправленный, иначе showResult может залипнуть true при
    // key-ремаунте на новый вопрос.
    React.useEffect(() => {
        setShowResult(isAnswerChecked)
    }, [isAnswerChecked])

    // Сообщаем родителю о стартовой позиции сразу при монтировании — иначе
    // общая кнопка "Ответить" в trainer-question.tsx останется disabled,
    // пока бегунок не тронут явно.
    React.useEffect(() => {
        onOptionSelected?.(question.options[selectedIndex])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSelect = (idx: number) => {
        if (showResult) return
        setSelectedIndex(idx)
        onOptionSelected?.(question.options[idx])
    }

    // Подписи закреплены сверху (фиксированная высота LABEL_HEIGHT — под
    // 2 строки текста), трек закреплён снизу (TRACK_HEIGHT). Раньше между
    // ними шла длинная соединительная линия от подписи до центра трека —
    // по просьбе пользователя убрана: вместо неё короткие риски-отметки
    // прямо НА треке (см. ниже), а лишний зазор под длинную линию (был
    // "+28" в высоте контейнера) больше не нужен.
    const LABEL_HEIGHT = 44
    const LABEL_GAP = 8
    const TRACK_HEIGHT = 24

    // Цвет одной опции (подписи И её риски на треке — единая логика, чтобы
    // не дублировать и не рассинхронизировать между двумя местами рендера).
    const colorsFor = (idx: number): ColorState => {
        const isSelected = selectedIndex === idx
        const isCorrectOption = isCorrectAnswer(question.options[idx], question.correctAnswer)
        const isRightHighlight = showResult && isCorrectOption
        const isWrongHighlight = showResult && isSelected && !isCorrectOption
        return isRightHighlight
            ? COLOR_RIGHT
            : isWrongHighlight
            ? COLOR_WRONG
            : isSelected
            ? COLOR_SELECTED
            : COLOR_NEUTRAL
    }

    return (
        <div className="mt-16 mb-6 px-3">
            <div className="relative" style={{ height: LABEL_HEIGHT + LABEL_GAP + TRACK_HEIGHT }}>
                {question.options.map((option, idx) => {
                    const isSelected = selectedIndex === idx
                    const colors = colorsFor(idx)

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={showResult}
                            onClick={() => handleSelect(idx)}
                            style={{ left: TICK_POSITIONS[idx], top: 0, height: LABEL_HEIGHT }}
                            className={`absolute -translate-x-1/2 flex items-center max-w-[92px] ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <motion.div
                                animate={{
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                    color: colors.text,
                                    scale: isSelected ? 1.05 : 1,
                                }}
                                transition={TRANSITION}
                                className="px-2 py-1.5 rounded-lg border-2 text-xs leading-tight text-center break-words"
                            >
                                <Latex>{option}</Latex>
                            </motion.div>
                        </button>
                    )
                })}

                {/* Позиция бегунка у Radix задаётся через inline-style на его
                    собственном узле, и на практике (проверено вживую) обычный
                    CSS transition на className к нему не подхватывается —
                    бегунок всё равно телепортируется, а не едет. Поэтому
                    визуал бегунка полностью свой: motion.div поверх,
                    анимируется через framer-motion (гарантированно плавно,
                    ease-in-out 300ms). Сам Radix Slider ниже оставлен только
                    как интерактивный слой (клик по треку/драг/клавиатура) —
                    его собственная отрисовка скрыта через opacity-0, но он
                    по-прежнему реально управляет selectedIndex через
                    onValueChange. */}
                <div className="absolute bottom-0 left-0 right-0" style={{ height: TRACK_HEIGHT }}>
                    <div className="absolute top-1/2 left-0 right-0 h-[8px] -translate-y-1/2 rounded-full bg-[#3A464E]" />
                    <motion.div
                        className="absolute top-1/2 left-0 h-[8px] -translate-y-1/2 rounded-full bg-[#4A90D9]"
                        animate={{ width: TICK_POSITIONS[selectedIndex] }}
                        transition={TRANSITION}
                    />

                    {/* Короткие вертикальные риски-деления прямо на треке —
                        заменяют прежние длинные линии от подписи до трека.
                        Рисуются ПОСЛЕ полосы прогресса, но ДО бегунка, чтобы
                        бегунок в своей позиции всегда был поверх своей же
                        риски. */}
                    {question.options.map((_, idx) => (
                        <motion.div
                            key={idx}
                            style={{ left: TICK_POSITIONS[idx], top: '50%' }}
                            animate={{ backgroundColor: colorsFor(idx).border }}
                            transition={TRANSITION}
                            className="absolute w-[3px] h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                        />
                    ))}

                    <motion.div
                        className="absolute top-1/2 size-6 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[#F2F7FB] shadow-[0_4px_10px] shadow-black/40"
                        animate={{ left: TICK_POSITIONS[selectedIndex] }}
                        transition={TRANSITION}
                    />

                    <Slider
                        className="absolute inset-0 flex touch-none select-none items-center opacity-0"
                        value={[selectedIndex]}
                        min={0}
                        max={2}
                        step={1}
                        disabled={showResult}
                        onValueChange={(val) => handleSelect(val[0])}
                    >
                        <SliderTrack className="relative h-[8px] grow rounded-full">
                            <SliderRange className="absolute h-full rounded-full" />
                        </SliderTrack>
                        <SliderThumb className="block size-6 rounded-full" aria-label="Выбор варианта" />
                    </Slider>
                </div>
            </div>
        </div>
    )
}
