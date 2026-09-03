// app/t-lesson/[t_lessonId]/type-check.tsx
//
// Тип задания CHECK: "Формула записана верно?" — показываем формулу
// (иногда с одной подменённой буквой, см. lib/formulaLetters.ts
// corruptFormulaLetter, либо явно авторское true/false-утверждение, см.
// page.tsx), ответ — два больших варианта: 🗑️ мусорный бак ("Неверно")
// или ✅ большая зелёная галочка ("Верно"). По прямой просьбе пользователя
// (2026-09-04) — мгновенный ответ по клику, без отдельной общей кнопки
// "Ответить" внизу (тот же паттерн прямого вызова onAnswer, что уже
// используют TypeHot/TypeSpeed, а не select-then-submit флоу ASSIST/INSERT).

import React, { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { QuestionType } from './page'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const RESULT_DELAY_MS = 700

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeCheck = ({ question, onAnswer }: Props) => {
    const [selected, setSelected] = useState<'CORRECT' | 'WRONG' | null>(null)
    const [phase, setPhase] = useState<'answering' | 'result'>('answering')
    const hasSubmittedRef = useRef(false)

    React.useEffect(() => {
        setSelected(null)
        setPhase('answering')
        hasSubmittedRef.current = false
    }, [question])

    const submit = useCallback((value: 'CORRECT' | 'WRONG') => {
        if (hasSubmittedRef.current) return
        hasSubmittedRef.current = true
        setSelected(value)
        setPhase('result')

        const isRight = value === question.correctAnswer
        setTimeout(() => onAnswer(isRight ? 'right' : 'wrong'), RESULT_DELAY_MS)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.correctAnswer, onAnswer])

    const handlePick = (value: 'CORRECT' | 'WRONG') => {
        if (phase !== 'answering') return
        submit(value)
    }

    // Красим только НАЖАТУЮ кнопку — зелёным, если выбор оказался верным,
    // красным, если неверным (не обе кнопки сразу, как раньше). Пользователь
    // сначала попросил красить по иконке (ведро=красный/галочка=зелёный
    // всегда), затем сам передумал в пользу обычной верно/неверно-раскраски.
    const getCardStyle = (value: 'CORRECT' | 'WRONG') => {
        const isPicked = selected === value
        if (phase === 'result' && isPicked) {
            return value === question.correctAnswer
                ? 'bg-[#A1D151]/15 border-[#A1D151] text-[#A1D151]'
                : 'bg-[#DC605B]/15 border-[#DC605B] text-[#DC605B]'
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
                    disabled={phase !== 'answering'}
                    className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-6 transition-colors',
                        phase !== 'answering' ? 'cursor-not-allowed' : 'cursor-pointer',
                        getCardStyle('WRONG')
                    )}
                >
                    <Trash2 className="w-10 h-10" strokeWidth={2.2} />
                    <span className="text-sm font-bold">Неверно</span>
                </button>

                <button
                    type="button"
                    onClick={() => handlePick('CORRECT')}
                    disabled={phase !== 'answering'}
                    className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-6 transition-colors',
                        phase !== 'answering' ? 'cursor-not-allowed' : 'cursor-pointer',
                        getCardStyle('CORRECT')
                    )}
                >
                    <CheckCircle2 className="w-10 h-10" strokeWidth={2.2} />
                    <span className="text-sm font-bold">Верно</span>
                </button>
            </motion.div>
        </div>
    )
}
