'use client'

import React, { useEffect, useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ArrowRight } from 'lucide-react'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

type ConnectOption = {
    id: number
    pairId: number
    label: React.ReactNode
}

// Одна колонка карточек (термины слева / определения справа). Раньше эта
// разметка была продублирована дважды почти один в один — вынесли в общий
// подкомпонент, чтобы менять стили/анимации в одном месте.
const ConnectColumn = ({
    title,
    options,
    selectedId,
    isMatched,
    onSelect,
    delayOffset = 0,
}: {
    title: string
    options: ConnectOption[]
    selectedId: number | undefined
    isMatched: (id: number) => boolean
    onSelect: (id: number, pairId: number) => void
    delayOffset?: number
}) => (
    <div className="bg-[#1E2A2E] rounded-2xl p-4 border-2 border-[#2E3A40]">
        <h3 className="text-lg font-bold text-[#F2F7FB] mb-3 text-center">{title}</h3>
        <div className="space-y-3">
            {options.map((option, index) => {
                const matched = isMatched(option.id)
                return (
                    <motion.button
                        key={option.id}
                        onClick={() => onSelect(option.id, option.pairId)}
                        disabled={matched}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, scale: selectedId === option.id ? [1, 1.06, 1] : 1 }}
                        transition={{ delay: index * 0.05 + delayOffset, scale: { duration: 0.25, ease: 'easeInOut' } }}
                        whileHover={{ scale: matched ? 1 : 1.02, y: matched ? 0 : -2 }}
                        whileTap={{ scale: matched ? 1 : 0.98 }}
                        className={`
                            relative overflow-hidden w-full text-left
                            transition-colors duration-200 rounded-xl
                            font-bold
                            ${selectedId === option.id
                                ? 'bg-[#5183A4] text-white shadow-lg border-2 border-[#3E6883]'
                                : matched
                                    ? 'bg-[#678337] text-white border-2 border-[#53692C]'
                                    : 'bg-[#161F23] border-2 border-[#3A464E] hover:border-[#5183A4] hover:shadow-md text-[#F2F7FB]'
                            }
                            ${matched ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                        `}
                    >
                        <div className="py-4 px-6 pr-12">{option.label}</div>
                        {matched && (
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <div className="bg-white rounded-full p-1">
                                    <Check className="w-5 h-5 text-[#678337]" strokeWidth={3} />
                                </div>
                            </motion.div>
                        )}
                    </motion.button>
                )
            })}
        </div>
    </div>
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

            <div className="relative w-full max-w-4xl mx-auto p-4">
                {/* Прогресс-бар в стиле Duolingo */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-[#9AA7B0]">ПРОГРЕСС</span>
                        <span className="text-sm font-bold" style={{ color: '#F3AF4E' }}>
                            {completedPairs} / {totalPairs}
                        </span>
                    </div>
                    <div className="h-3 bg-[#2E3A40] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: '#F3AF4E' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedPairs / totalPairs) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-6">
                    {/* Левая колонка - Вопросы */}
                    <motion.div
                        className="col-span-3 space-y-3"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ConnectColumn
                            title="Термины"
                            options={optionsQ}
                            selectedId={selectedOptionQId}
                            isMatched={isOptionMatched}
                            onSelect={handleOptionQClick}
                        />
                    </motion.div>

                    {/* Центральная стрелка */}
                    <motion.div
                        className="col-span-1 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                    >
                        <div className="bg-orange-500 rounded-full p-3 shadow-lg">
                            <ArrowRight className="w-8 h-8 text-white md:w-10 md:h-10" strokeWidth={3} />
                        </div>
                    </motion.div>

                    {/* Правая колонка - Ответы */}
                    <motion.div
                        className="col-span-3 space-y-3"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ConnectColumn
                            title="Определения"
                            options={optionsA}
                            selectedId={selectedOptionAId}
                            isMatched={isOptionMatched}
                            onSelect={handleOptionAClick}
                            delayOffset={0.1}
                        />
                    </motion.div>
                </div>

                {/* Анимированная подсветка при успехе */}
                {completedPairs > 0 && completedPairs < totalPairs && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.05, 0] }}
                        transition={{ duration: 0.5 }}
                        style={{
                            background: "radial-gradient(circle, rgba(120,201,60,0.12) 0%, rgba(120,201,60,0) 100%)"
                        }}
                    />
                )}
            </div>
        </>
    )
}
