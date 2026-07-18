// app/t-lesson/[t_lessonId]/type-connect.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onAllPairsMatched?: () => void
}

type ConnectOption = {
    id: number
    pairId: number
    label: React.ReactNode
}

// Одна карточка варианта. Раньше левая и правая колонка рисовались двумя
// отдельными кусками разметки почти один в один — вынесли в общий
// подкомпонент, чтобы менять стили/анимации в одном месте.
const ConnectItem = ({
    option,
    index,
    isSelected,
    isMatched,
    onSelect,
    delayOffset = 0,
}: {
    option: ConnectOption
    index: number
    isSelected: boolean
    isMatched: boolean
    onSelect: (id: number, pairId: number) => void
    delayOffset?: number
}) => (
    <motion.button
        onClick={() => onSelect(option.id, option.pairId)}
        disabled={isMatched}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, scale: isSelected ? [1, 1.06, 1] : 1 }}
        transition={{ delay: index * 0.04 + delayOffset, scale: { duration: 0.25, ease: 'easeInOut' } }}
        whileHover={{ scale: isMatched ? 1 : 1.02 }}
        whileTap={{ scale: isMatched ? 1 : 0.97 }}
        className={`
            relative w-full h-full flex items-center justify-center text-center rounded-lg
            border-2 border-b-4 active:border-b-2
            px-3 py-2 text-sm font-medium leading-snug
            transition-[border-width,background-color,color,border-color] duration-100
            ${isSelected
                ? 'bg-[#5183A4] border-[#3E6883] text-white'
                : isMatched
                    ? 'bg-[#678337] border-[#53692C] text-white'
                    : 'bg-[#161F23] border-[#3A464E] hover:border-[#5183A4] text-[#F2F7FB]'
            }
            ${isMatched ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        `}
    >
        <span className={isMatched ? 'px-4' : ''}>{option.label}</span>
        {isMatched && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
            >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </motion.div>
        )}
    </motion.button>
)

export const TypeConnect = ({ question, onAnswer, onAllPairsMatched }: Props) => {
    const [selectedOptionAId, setSelectedOptionAId] = useState<number>()
    const [selectedOptionQId, setSelectedOptionQId] = useState<number>()
    const [selectedOptionAPair, setSelectedOptionAPair] = useState<number>()
    const [selectedOptionQPair, setSelectedOptionQPair] = useState<number>()
    const [listOptionsIdDoneRight, setListOptionsIdDoneRight] = useState<number[]>([])
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)

    // Правильное количество пар - это длина optionsQ (или optionsA)
    const totalPairs = question.optionsQ.length
    const completedPairs = listOptionsIdDoneRight.length / 2

    useEffect(() => {
        // Проверяем, собрали ли все пары
        if (completedPairs === totalPairs && totalPairs > 0) {
            setShowSuccess(true)
            // Вызываем callback что все пары правильны
            onAllPairsMatched?.()
            // Не отправляем onAnswer сразу - ждем пока пользователь нажмет кнопку
            // setTimeout(() => {
            //     setListOptionsIdDoneRight([])
            //     setShowSuccess(false)
            //     onAnswer("right")
            // }, 500)
        }
    }, [completedPairs, totalPairs, onAllPairsMatched])

    useEffect(() => {
        if (selectedOptionAId && selectedOptionQId && selectedOptionAId > 0 && selectedOptionQId > 0) {
            if (selectedOptionAPair === selectedOptionQPair) {
                // Правильный ответ
                const newList = [...listOptionsIdDoneRight, selectedOptionAId, selectedOptionQId]
                setListOptionsIdDoneRight(newList)

                // Анимация успеха
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 300)
            } else {
                // Неправильный ответ - просто показываем ошибку и сбрасываем выбор
                setShowError(true)
                setTimeout(() => setShowError(false), 500)
            }

            // Сброс выбранных опций (независимо от правильности)
            setSelectedOptionAId(-1)
            setSelectedOptionQId(-2)
            setSelectedOptionAPair(-3)
            setSelectedOptionQPair(-4)
        }
    }, [selectedOptionAId, selectedOptionQId, selectedOptionAPair, selectedOptionQPair, listOptionsIdDoneRight, onAllPairsMatched])

    const handleOptionQClick = (id: number, pair: number) => {
        if (listOptionsIdDoneRight.includes(id)) return
        setSelectedOptionQId(id)
        setSelectedOptionQPair(pair)
    }

    const handleOptionAClick = (id: number, pair: number) => {
        if (listOptionsIdDoneRight.includes(id)) return
        setSelectedOptionAId(id)
        setSelectedOptionAPair(pair)
    }

    const isOptionMatched = (id: number) => listOptionsIdDoneRight.includes(id)

    const optionsQ: ConnectOption[] = question.optionsQ.map((option) => ({
        id: option.id,
        pairId: option.pairId,
        label: <Latex>{option.optQ}</Latex>,
    }))

    const optionsA: ConnectOption[] = question.optionsA.map((option) => ({
        id: option.id,
        pairId: option.pairId,
        label: <Latex>{option.optA}</Latex>,
    }))

    return (
        <div className="relative w-full max-w-lg mx-auto p-3">
                {/* Две колонки в любом размере экрана + тонкая разделительная линия.
                    Элементы левой и правой колонки идут парами по строкам —
                    CSS grid растягивает обе ячейки строки до высоты большей
                    из них, поэтому прямоугольники в ряд получаются соразмерными. */}
                <div className="relative grid grid-cols-2 grid-flow-row gap-x-3 gap-y-2 items-stretch">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-[#2E3A40] -translate-x-1/2" />

                    {Array.from({ length: Math.max(optionsQ.length, optionsA.length) }).map((_, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            {optionsQ[rowIndex] && (
                                <ConnectItem
                                    option={optionsQ[rowIndex]}
                                    index={rowIndex}
                                    isSelected={selectedOptionQId === optionsQ[rowIndex].id}
                                    isMatched={isOptionMatched(optionsQ[rowIndex].id)}
                                    onSelect={handleOptionQClick}
                                />
                            )}
                            {optionsA[rowIndex] && (
                                <ConnectItem
                                    option={optionsA[rowIndex]}
                                    index={rowIndex}
                                    isSelected={selectedOptionAId === optionsA[rowIndex].id}
                                    isMatched={isOptionMatched(optionsA[rowIndex].id)}
                                    onSelect={handleOptionAClick}
                                    delayOffset={0.08}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
        </div>
    )
}
