// app/t-lesson/[t_lessonId]/type-insert.tsx
//
// Тип задания INSERT: формула с пропущенной буквой-переменной (см.
// lib/formulaLetters.ts), под ней — кнопки-буквы на выбор. Тот же флоу
// ответа, что у ASSIST (onOptionSelected/isAnswerChecked/isAnswerCorrect
// приходят сверху из trainer-question.tsx, кнопка "ответить" общая).

import React, { useState } from 'react'
import { QuestionType } from './page'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

export const TypeInsert = ({
    question,
    onAnswer,
    onOptionSelected,
    isAnswerChecked = false,
    isAnswerCorrect = false,
}: Props) => {
    const [localSelected, setLocalSelected] = useState<string | null>(null)
    const [showResult, setShowResult] = useState(false)

    // Тот же паттерн, что в type-assist.tsx: эффект двунаправленный, иначе
    // showResult может залипнуть true при key-ремаунте на новый вопрос.
    React.useEffect(() => {
        setShowResult(isAnswerChecked)
    }, [isAnswerChecked])

    const handleOptionClick = (option: string) => {
        if (showResult) return
        setLocalSelected(option)
        onOptionSelected?.(option)
    }

    // Подставляем выбранную букву внутрь плейсхолдера \boxed{\phantom{X}},
    // чтобы пользователь видел, что именно он выбрал, ДО проверки ответа.
    const displayedFormula = localSelected
        ? question.blankedFormula?.replace('\\boxed{\\phantom{X}}', `\\boxed{${localSelected}}`)
        : question.blankedFormula

    return (
        <div className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center py-6 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-2xl md:text-3xl text-[#F2F7FB]"
            >
                <Latex>{displayedFormula || ''}</Latex>
            </motion.div>

            <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
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
        </div>
    )
}
