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

// Цветовая раскладка условия — по прямой просьбе пользователя ("8
// зелёное × 2 красное"): первый операнд зелёный, второй — красный (та же
// пара, что уже используют "верно"/"неверно" в приложении, но здесь это
// чисто декоративная раскраска условия, не индикатор правильности — по
// контексту, ДО выбора ответа, спутать не с чем). Оператор/степень —
// нейтральный светлый, чтобы не перегружать цветом. Варианты ответа —
// фиолетовый акцент (тот же, что уже красит заголовки вопросов в
// trainer-question.tsx).
const GREEN = '#A1D151'
const RED = '#DC605B'
const PURPLE = '#C386F8'

function buildColoredQuestion(raw: string): string {
    const stripped = raw.trim().replace(/^\$/, '').replace(/\$$/, '')

    const timesMatch = stripped.match(/^(\d+)\s*\\times\s*(\d+)$/)
    if (timesMatch) {
        const [, a, b] = timesMatch
        return `$\\textcolor{${GREEN}}{${a}} \\times \\textcolor{${RED}}{${b}}$`
    }

    const squareMatch = stripped.match(/^(\d+)\^(\d+)$/)
    if (squareMatch) {
        const [, base, exp] = squareMatch
        return `$\\textcolor{${GREEN}}{${base}}^{\\textcolor{${RED}}{${exp}}}$`
    }

    // Незнакомый формат условия — показываем как есть, без раскраски,
    // а не пытаемся угадать структуру.
    return raw
}

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
    const coloredQuestion = buildColoredQuestion(question.question)

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="h-14 flex items-center justify-center">
                {phase === 'answering' && timeLeft in BURN_DIGITS && (
                    <Lottie animationData={BURN_DIGITS[timeLeft]} className="w-14 h-14" loop={false} />
                )}
            </div>

            <div className="text-5xl md:text-6xl font-black tracking-wide">
                <Latex>{coloredQuestion}</Latex>
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
                                'py-4 px-3 rounded-xl border-2 border-b-4 font-black text-2xl md:text-3xl transition-colors',
                                phase === 'result'
                                    ? isCorrectOption
                                        ? 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                                        : isSelected
                                            ? 'bg-[#DC605B] border-[#B94944] text-white'
                                            : 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] opacity-60'
                                    : 'bg-[#161F23] border-[#3A464E] hover:bg-[#232F34] active:border-b-2'
                            )}
                            style={phase !== 'result' ? { color: PURPLE } : undefined}
                        >
                            <Latex>{option}</Latex>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
