// type-assist.tsx
import React, { useState } from 'react'
import { QuestionType } from './page'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { motion } from 'framer-motion'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    isAnswerPending?: boolean
    selectedAnswer?: string | null
}

export const TypeAssist = ({
    question,
    onAnswer,
    isAnswerPending = false,
    selectedAnswer = null
}: Props) => {
  const [localSelected, setLocalSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleAnswer = (option: string) => {
    if (isAnswerPending || showResult) return
    
    setLocalSelected(option)
    setShowResult(true)
    
    const isCorrect = option === question.correctAnswer
    
    setTimeout(() => {
      onAnswer(option)
      setTimeout(() => {
        setLocalSelected(null)
        setShowResult(false)
      }, 500)
    }, 400)
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {question.options.map((option, idx) => (
        <AnimatedOptionButton
          key={idx}
          option={option}
          onClick={() => handleAnswer(option)}
          index={idx}
          isSelected={localSelected === option}
          isCorrect={showResult && localSelected === option && option === question.correctAnswer}
          isWrong={showResult && localSelected === option && option !== question.correctAnswer}
          disabled={isAnswerPending || showResult}
        />
      ))}
    </motion.div>
  )
}