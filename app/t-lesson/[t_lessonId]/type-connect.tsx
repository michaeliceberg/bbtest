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
            relative w-full text-left rounded-lg border
            px-3 py-2.5 text-sm font-medium leading-snug
            transition-colors duration-200
            ${isSelected
                ? 'bg-[#5183A4] border-[#5183A4] text-white'
                : isMatched
                    ? 'bg-[#678337] border-[#678337] text-white'
                    : 'bg-[#161F23] border-[#3A464E] hover:border-[#5183A4] text-[#F2F7FB]'
            }
            ${isMatched ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        `}
    >
        <span className={isMatched ? 'pr-5' : ''}>{option.label}</span>
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

export const TypeConnect = ({ question, onAnswer }: Props) => {
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
            setTimeout(() => {
                setListOptionsIdDoneRight([])
                setShowSuccess(false)
                onAnswer("right")
            }, 500)
        }
    }, [completedPairs, totalPairs, onAnswer])

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
                // Неправильный ответ
                setShowError(true)
                setTimeout(() => setShowError(false), 500)

                setListOptionsIdDoneRight([])
                onAnswer("wrong")
            }

            // Сброс выбранных опций
            setSelectedOptionAId(-1)
            setSelectedOptionQId(-2)
            setSelectedOptionAPair(-3)
            setSelectedOptionQPair(-4)
        }
    }, [selectedOptionAId, selectedOptionQId, selectedOptionAPair, selectedOptionQPair, listOptionsIdDoneRight, onAnswer])

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
        <>
            {/* Эффекты успеха/ошибки */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-[#678337] rounded-full p-4 shadow-2xl">
                            <Check className="w-16 h-16 text-white" />
                        </div>
                    </motion.div>
                )}

                {showError && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            x: [-10, 10, -10, 10, 0]
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        transition={{ x: { duration: 0.2 } }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className="bg-[#C8524E] rounded-full p-4 shadow-2xl">
                            <X className="w-16 h-16 text-white" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative w-full max-w-lg mx-auto p-3">
                {/* Прогресс-бар */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#2E3A40] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: '#F3AF4E' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedPairs / totalPairs) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span className="text-xs font-bold text-[#9AA7B0] shrink-0">
                        {completedPairs} / {totalPairs}
                    </span>
                </div>

                {/* Короткая подсказка вместо заголовков колонок */}
                <p className="text-center text-xs text-[#9AA7B0] mb-3">
                    Соедини пары — выбери элемент слева и подходящий справа
                </p>

                {/* Две колонки в любом размере экрана + тонкая разделительная линия */}
                <div className="relative grid grid-cols-2 gap-x-3 gap-y-2">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-[#2E3A40] -translate-x-1/2" />

                    <div className="space-y-2">
                        {optionsQ.map((option, index) => (
                            <ConnectItem
                                key={option.id}
                                option={option}
                                index={index}
                                isSelected={selectedOptionQId === option.id}
                                isMatched={isOptionMatched(option.id)}
                                onSelect={handleOptionQClick}
                            />
                        ))}
                    </div>

                    <div className="space-y-2">
                        {optionsA.map((option, index) => (
                            <ConnectItem
                                key={option.id}
                                option={option}
                                index={index}
                                isSelected={selectedOptionAId === option.id}
                                isMatched={isOptionMatched(option.id)}
                                onSelect={handleOptionAClick}
                                delayOffset={0.08}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
