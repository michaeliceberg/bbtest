// app/t-lesson/[t_lessonId]/type-check.tsx
//
// Тип задания CHECK: "Формула записана верно?" — показываем формулу
// (иногда с одной подменённой буквой, см. lib/formulaLetters.ts
// corruptFormulaLetter), ответ — два больших варианта: 🗑️ мусорный бак
// ("Неверно") или ✅ большая зелёная галочка ("Верно"). Тот же
// select-then-submit флоу, что у ASSIST/INSERT/SCROLL (onOptionSelected/
// isAnswerChecked/isAnswerCorrect приходят сверху из trainer-question.tsx,
// кнопка "ответить" общая).

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { QuestionType } from './page'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Trash2, CheckCircle2 } from 'lucide-react'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

export const TypeCheck = ({
    question,
    onOptionSelected,
    isAnswerChecked = false,
}: Props) => {
    const [localSelected, setLocalSelected] = useState<'CORRECT' | 'WRONG' | null>(null)
    const [showResult, setShowResult] = useState(false)

    // Тот же двунаправленный синк, что и в TypeAssist — иначе свежий
    // компонент (после key-ремаунта на новый вопрос) может смонтироваться,
    // пока родительский answerState ещё не сбросился с прошлого вопроса,
    // и showResult залипнет в true навсегда (кнопки будут disabled).
    React.useEffect(() => {
        setShowResult(isAnswerChecked)
    }, [isAnswerChecked])

    const handlePick = (value: 'CORRECT' | 'WRONG') => {
        if (showResult) return
        setLocalSelected(value)
        onOptionSelected?.(value)
    }

    const getCardStyle = (value: 'CORRECT' | 'WRONG') => {
        const isPicked = localSelected === value
        if (showResult && isPicked) {
            return value === question.correctAnswer
                ? 'bg-[#232F35] border-[#A1D151] text-[#A1D151]'
                : 'bg-[#161F23] border-[#DC605B] text-[#DC605B]'
        }
        // После проверки — независимо от выбора подсвечиваем верный
        // вариант зелёным, чтобы было видно правильный ответ, даже если
        // ученик выбрал другой.
        if (showResult && value === question.correctAnswer) {
            return 'bg-[#232F35] border-[#A1D151] text-[#A1D151]'
        }
        if (isPicked) {
            return 'bg-[#161F23] border-[#4897D1] text-[#4897D1]'
        }
        return 'bg-[#161F23] border-[#3A464E] text-[#F2F7FB]'
    }

    return (
        <div className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-8 text-center"
            >
                <span className="text-2xl md:text-3xl font-bold text-[#F2F7FB]">
                    <Latex>{question.checkFormula || ''}</Latex>
                </span>
            </motion.div>

            <motion.div
                className="grid grid-cols-2 gap-3 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                <button
                    type="button"
                    onClick={() => handlePick('WRONG')}
                    disabled={showResult}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-6 transition-colors ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'} ${getCardStyle('WRONG')}`}
                >
                    <Trash2 className="w-10 h-10" strokeWidth={2.2} />
                    <span className="text-sm font-bold">Неверно</span>
                </button>

                <button
                    type="button"
                    onClick={() => handlePick('CORRECT')}
                    disabled={showResult}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-6 transition-colors ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'} ${getCardStyle('CORRECT')}`}
                >
                    <CheckCircle2 className="w-10 h-10" strokeWidth={2.2} />
                    <span className="text-sm font-bold">Верно</span>
                </button>
            </motion.div>
        </div>
    )
}
