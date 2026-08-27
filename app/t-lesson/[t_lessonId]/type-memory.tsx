// app/t-lesson/[t_lessonId]/type-memory.tsx
//
// Тип задания MEMORY ("Concentration"): поле перевёрнутых карточек,
// пары — (подпись переменной M_ASC-задачи) ↔ (её формула). Клик на две
// карточки подряд: совпало — обе остаются открытыми, не совпало —
// переворачиваются обратно. Без штрафа сердечком за промах — это
// механика на запоминание, а не на проверку знания.

import React, { useState } from 'react'
import { QuestionType } from './page'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Check } from 'lucide-react'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onAllPairsMatched?: () => void
}

export const TypeMemory = ({ question, onAllPairsMatched }: Props) => {
    const cards = question.memoryCards || []
    const totalPairs = new Set(cards.map((c) => c.pairId)).size

    const [flippedIds, setFlippedIds] = useState<number[]>([])
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([])
    const [isChecking, setIsChecking] = useState(false)

    const matchedCount = matchedPairIds.length

    React.useEffect(() => {
        if (totalPairs > 0 && matchedCount === totalPairs) {
            onAllPairsMatched?.()
        }
    }, [matchedCount, totalPairs, onAllPairsMatched])

    const handleFlip = (card: (typeof cards)[number]) => {
        if (isChecking || flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId)) return

        const newFlipped = [...flippedIds, card.id]
        setFlippedIds(newFlipped)

        if (newFlipped.length === 2) {
            setIsChecking(true)
            const first = cards.find((c) => c.id === newFlipped[0])!
            const second = cards.find((c) => c.id === newFlipped[1])!

            if (first.pairId === second.pairId) {
                setTimeout(() => {
                    setMatchedPairIds((prev) => [...prev, first.pairId])
                    setFlippedIds([])
                    setIsChecking(false)
                }, 400)
            } else {
                setTimeout(() => {
                    setFlippedIds([])
                    setIsChecking(false)
                }, 700)
            }
        }
    }

    return (
        <div className="grid grid-cols-2 gap-3 mt-6">
            {cards.map((card, idx) => {
                const isFlipped = flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId)
                const isMatched = matchedPairIds.includes(card.pairId)

                return (
                    <motion.button
                        key={card.id}
                        onClick={() => handleFlip(card)}
                        disabled={isFlipped}
                        className="relative h-24 md:h-28"
                        style={{ perspective: 800 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                    >
                        <motion.div
                            className="absolute inset-0"
                            style={{ transformStyle: 'preserve-3d' }}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.35 }}
                        >
                            {/* Рубашка */}
                            <div
                                className="absolute inset-0 rounded-xl border-2 border-[#3A464E] bg-[#1A252B] flex items-center justify-center"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <span className="text-2xl text-[#4897D1]">?</span>
                            </div>
                            {/* Лицо карточки */}
                            <div
                                className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center px-2 text-center ${isMatched ? 'border-[#A1D151] bg-[#232F35]' : 'border-[#4897D1] bg-[#161F23]'
                                    }`}
                                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                            >
                                <span className="text-xs md:text-sm font-bold text-[#F2F7FB]">
                                    <Latex>{card.text}</Latex>
                                </span>
                                {isMatched && (
                                    <span className="absolute top-1 right-1">
                                        <Check className="w-3.5 h-3.5 text-[#A1D151]" strokeWidth={3} />
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </motion.button>
                )
            })}
        </div>
    )
}
