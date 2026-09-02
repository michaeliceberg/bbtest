// app/t-lesson/[t_lessonId]/type-multistep.tsx
//
// Тип MULTISTEP — задание разбито на несколько шагов (обычно 2-3): на
// каждом шаге своя подсказка/формула и свой числовой ответ, вводимый той
// же цифровой клавиатурой, что уже используется в задачнике (см.
// app/lesson/keyboard-input.tsx). Шаг с cancelVisual — особый: рисует
// две дроби рядом и анимированно зачёркивает сокращаемые числа (denominator
// первой дроби и numerator второй), прежде чем спросить, что от них
// осталось после сокращения.
//
// Ошибка на промежуточном шаге не прерывает прохождение (показываем
// верный ответ и идём дальше, чтобы пользователь всё равно увидел весь
// метод целиком) — но всё задание в целом засчитывается неверным, если
// хоть один шаг был с ошибкой (см. onComplete(!hadMistake)).

'use client'

import { useEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const CancelFraction = ({
    leftNum,
    leftDen,
    rightNum,
    rightDen,
    struck,
}: {
    leftNum: string
    leftDen: string
    rightNum: string
    rightDen: string
    struck: boolean
}) => {
    const StrikeNum = ({ text }: { text: string }) => (
        <span className="relative inline-block px-0.5">
            {text}
            <motion.span
                className="absolute left-0 top-1/2 h-[2px] bg-[#DC605B]"
                initial={{ width: 0 }}
                animate={{ width: struck ? '100%' : 0 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                style={{ transform: 'translateY(-50%) rotate(-12deg)', transformOrigin: 'left center' }}
            />
        </span>
    )

    const Frac = ({ num, den, strikeDen, strikeNum }: { num: string; den: string; strikeDen?: boolean; strikeNum?: boolean }) => (
        <span className="inline-flex flex-col items-center text-2xl md:text-3xl font-bold leading-none mx-2">
            <span>{strikeNum ? <StrikeNum text={num} /> : num}</span>
            <span className="w-full border-t-2 border-[#F2F7FB] my-1" />
            <span>{strikeDen ? <StrikeNum text={den} /> : den}</span>
        </span>
    )

    return (
        <div className="flex items-center justify-center py-4">
            <Frac num={leftNum} den={leftDen} strikeDen />
            <span className="text-2xl md:text-3xl font-bold mx-1">×</span>
            <Frac num={rightNum} den={rightDen} strikeNum />
        </div>
    )
}

export const TypeMultistep = ({ question, onComplete }: Props) => {
    const steps = question.multistepSteps ?? []

    const [stepIndex, setStepIndex] = useState(0)
    const [input, setInput] = useState('')
    const [checked, setChecked] = useState(false)
    const [isStepCorrect, setIsStepCorrect] = useState<boolean | null>(null)
    const [struck, setStruck] = useState(false)
    const hadMistakeRef = useRef(false)

    useEffect(() => {
        setStepIndex(0)
        setInput('')
        setChecked(false)
        setIsStepCorrect(null)
        setStruck(false)
        hadMistakeRef.current = false
    }, [question])

    const step = steps[stepIndex]
    if (!step) return null

    const isLastStep = stepIndex === steps.length - 1

    const handleCheck = () => {
        const correct = input.trim().replace('.', ',') === step.answer.trim().replace('.', ',')
        setIsStepCorrect(correct)
        setChecked(true)
        if (!correct) hadMistakeRef.current = true
        if (step.cancelVisual) setStruck(true)
    }

    const handleNext = () => {
        if (isLastStep) {
            onComplete(!hadMistakeRef.current)
            return
        }
        setStepIndex((i) => i + 1)
        setInput('')
        setChecked(false)
        setIsStepCorrect(null)
        setStruck(false)
    }

    return (
        <div className="w-full max-w-xl mx-auto text-center flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-1.5">
                {steps.map((_, i) => (
                    <span
                        key={i}
                        className={cn(
                            'h-2 rounded-full transition-all',
                            i < stepIndex ? 'w-6 bg-[#A1D151]' : i === stepIndex ? 'w-6 bg-[#4A90D9]' : 'w-2 bg-[#3A464E]'
                        )}
                    />
                ))}
            </div>

            <div className="text-base md:text-lg text-[#F2F7FB]">
                <Latex>{step.prompt}</Latex>
            </div>

            {step.cancelVisual ? (
                <CancelFraction {...step.cancelVisual} struck={struck} />
            ) : step.formula ? (
                <div className="text-2xl md:text-3xl font-bold text-[#F2F7FB] py-2">
                    <Latex>{`$${step.formula}$`}</Latex>
                </div>
            ) : null}

            <KeyboardInput value={input} onChange={setInput} disabled={checked} />

            {checked && (
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold',
                        isStepCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                    )}
                >
                    {isStepCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {isStepCorrect ? 'Верно!' : `Правильный ответ: ${step.answer}`}
                </div>
            )}

            <button
                type="button"
                onClick={checked ? handleNext : handleCheck}
                disabled={!checked && input.trim().length === 0}
                className={cn(
                    'w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                    !checked && input.trim().length === 0
                        ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
                        : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                )}
            >
                {checked ? (isLastStep ? 'Готово' : 'Дальше') : 'Проверить'}
            </button>
        </div>
    )
}
