// app/t-lesson/[t_lessonId]/type-speed.tsx
//
// Тип SPEED — тренировка на скорость (таблица умножения, квадраты чисел):
// свой обратный отсчёт с горящими цифрами (те же ассеты, что уже
// использует "горячий вопрос", см. type-hot.tsx) и мгновенный ответ по
// клику на вариант — без отдельного подтверждения общей кнопкой "Ответить"
// внизу (тот же паттерн прямого вызова onAnswer, что уже используют
// TypeHot/TypeSwipeV2, а не select-then-submit флоу ASSIST/INSERT).
// Не истёк таймер и не кликнули — таймаут засчитывается как неверный
// ответ, но верный вариант всё равно подсвечивается, чтобы видеть ответ.

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Latex from 'react-latex-next'
import { isCorrectAnswer } from '@/usefulFunctions'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

import burn5 from '@/public/Lottie/numbers/burn5.json'
import burn4 from '@/public/Lottie/numbers/burn4.json'
import burn3 from '@/public/Lottie/numbers/burn3.json'
import burn2 from '@/public/Lottie/numbers/burn2.json'
import burn1 from '@/public/Lottie/numbers/burn1.json'

// lottie-react трогает document на импорте — без ssr:false падает на
// сервере (та же SSR-ловушка, что уже чинили у TrainerMascot/TypeHot).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const BURN_DIGITS: Record<number, object> = { 5: burn5, 4: burn4, 3: burn3, 2: burn2, 1: burn1 }
const START_SECONDS = 5
const RESULT_DELAY_MS = 700

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeSpeed = ({ question, onAnswer }: Props) => {
    const [timeLeft, setTimeLeft] = useState(START_SECONDS)
    const [selected, setSelected] = useState<string | null>(null)
    const [phase, setPhase] = useState<'answering' | 'result'>('answering')
    const hasSubmittedRef = useRef(false)

    useEffect(() => {
        setTimeLeft(START_SECONDS)
        setSelected(null)
        setPhase('answering')
        hasSubmittedRef.current = false
    }, [question])

    const submit = useCallback((answer: string | null) => {
        if (hasSubmittedRef.current) return
        hasSubmittedRef.current = true
        setSelected(answer)
        setPhase('result')

        const isRight = isCorrectAnswer(answer, question.correctAnswer)
        setTimeout(() => onAnswer(isRight ? 'right' : 'wrong'), RESULT_DELAY_MS)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.correctAnswer, onAnswer])

    // Свой обратный отсчёт — не полагается на общий (нерабочий) механизм
    // timeLimit/onTimeout в trainer-question.tsx (тот же приём, что уже
    // применён в TypeHot).
    useEffect(() => {
        if (phase !== 'answering') return
        if (timeLeft <= 0) {
            submit(null)
            return
        }
        const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
        return () => clearTimeout(timer)
    }, [timeLeft, phase, submit])

    const handleClick = (option: string) => {
        if (phase !== 'answering') return
        submit(option)
    }

    const isOddCount = question.options.length % 2 === 1

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="h-14 flex items-center justify-center">
                {phase === 'answering' && timeLeft in BURN_DIGITS && (
                    <Lottie animationData={BURN_DIGITS[timeLeft]} className="w-14 h-14" loop={false} />
                )}
            </div>

            <div className={cn('grid gap-3 w-full', isOddCount ? 'grid-cols-1' : 'grid-cols-2')}>
                {question.options.map((option, i) => {
                    const isSelected = selected === option
                    const isCorrectOption = phase === 'result' && isCorrectAnswer(option, question.correctAnswer)

                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handleClick(option)}
                            disabled={phase !== 'answering'}
                            className={cn(
                                'py-3 px-3 rounded-xl border-2 border-b-4 font-bold text-lg transition-colors',
                                phase === 'result'
                                    ? isCorrectOption
                                        ? 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                                        : isSelected
                                            ? 'bg-[#DC605B] border-[#B94944] text-white'
                                            : 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] opacity-60'
                                    : 'bg-[#161F23] border-[#3A464E] text-[#F2F7FB] hover:bg-[#232F34] active:border-b-2'
                            )}
                        >
                            <Latex>{option}</Latex>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
