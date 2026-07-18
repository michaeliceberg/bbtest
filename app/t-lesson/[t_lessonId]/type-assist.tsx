// app/t-lesson/[t_lessonId]/type-assist.tsx

import React, { useState } from 'react'
import { QuestionType } from './page'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { motion } from 'framer-motion'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerPending?: boolean
    selectedAnswer?: string | null
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

export const TypeAssist = ({
    question,
    onAnswer,
    onOptionSelected,
    isAnswerPending = false,
    selectedAnswer = null,
    isAnswerChecked = false,
    isAnswerCorrect = false
}: Props) => {
  const [localSelected, setLocalSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  // Когда ответ проверен, показываем результат
  React.useEffect(() => {
    if (isAnswerChecked) {
      setShowResult(true)
    }
  }, [isAnswerChecked])

  const handleOptionClick = (option: string) => {
    if (showResult) return

    setLocalSelected(option)
    onOptionSelected?.(option)
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {question.options.map((option, idx) => (
        <AnimatedOptionButton
          key={idx}
          option={option}
          onClick={() => handleOptionClick(option)}
          index={idx}
          isSelected={localSelected === option}
          isCorrect={showResult && localSelected === option && option === question.correctAnswer}
          isWrong={showResult && localSelected === option && option !== question.correctAnswer}
          disabled={showResult}
        />
      ))}
    </motion.div>
  )
}