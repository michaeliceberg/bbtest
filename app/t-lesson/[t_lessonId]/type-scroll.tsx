// app/t-lesson/[t_lessonId]/type-scroll.tsx
//
// Тип задания SCROLL: горизонтальный бегунок (числовая ось) с 3
// делениями, над каждым — подпись-вариант ответа (одна верная). Тот же
// флоу ответа, что у ASSIST/INSERT (onOptionSelected/isAnswerChecked/
// isAnswerCorrect приходят сверху из trainer-question.tsx, кнопка
// "ответить" общая).

import React, { useState } from 'react'
import { QuestionType } from './page'
import { Slider, SliderTrack, SliderRange, SliderThumb } from '@radix-ui/react-slider'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

const TICK_POSITIONS = ['0%', '50%', '100%']

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

    return (
        <div className="mt-16 mb-6 px-2">
            <div className="relative h-24 mb-2">
                {question.options.map((option, idx) => {
                    const isSelected = selectedIndex === idx
                    const isCorrectOption = option === question.correctAnswer
                    const isRightHighlight = showResult && isCorrectOption
                    const isWrongHighlight = showResult && isSelected && !isCorrectOption

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={showResult}
                            onClick={() => handleSelect(idx)}
                            style={{ left: TICK_POSITIONS[idx] }}
                            className={`absolute top-0 -translate-x-1/2 flex flex-col items-center gap-2 ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <div
                                className={`
                                    px-3 py-2 rounded-lg border-2 text-base whitespace-nowrap transition-colors
                                    ${isRightHighlight
                                        ? 'bg-[#1F3A2A] border-[#A1D151] text-[#A1D151]'
                                        : isWrongHighlight
                                        ? 'bg-[#3A1F22] border-[#DC605B] text-[#DC605B]'
                                        : isSelected
                                        ? 'bg-[#1B2C3D] border-[#4A90D9] text-[#F2F7FB]'
                                        : 'bg-[#161F23] border-[#3A464E] text-[#F2F7FB]/80'
                                    }
                                `}
                            >
                                <Latex>{option}</Latex>
                            </div>
                            <div className={`w-[2px] h-4 ${isSelected ? 'bg-[#4A90D9]' : 'bg-[#3A464E]'}`} />
                        </button>
                    )
                })}
            </div>

            <Slider
                className="relative flex h-6 touch-none select-none items-center"
                value={[selectedIndex]}
                min={0}
                max={2}
                step={1}
                disabled={showResult}
                onValueChange={(val) => handleSelect(val[0])}
            >
                <SliderTrack className="relative h-[8px] grow rounded-full bg-[#3A464E]">
                    <SliderRange className="absolute h-full rounded-full bg-[#4A90D9]" />
                </SliderTrack>
                <SliderThumb
                    className="block size-6 rounded-full bg-[#F2F7FB] shadow-[0_4px_10px] shadow-black/40 focus:outline-none focus:shadow-[0_0_0_4px] focus:shadow-[#4A90D9]/40"
                    aria-label="Выбор варианта"
                />
            </Slider>
        </div>
    )
}
