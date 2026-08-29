// app/t-lesson/[t_lessonId]/type-hot.tsx
//
// "Горячий вопрос" — редкий (10%, см. page.tsx) факультативный вопрос
// про реальную величину ("Сколько весит мышь?"), НЕ входит в счёт/
// сердечки/работу над ошибками (см. TQUIZ.tsx: отдельная ветка в
// handleAnswer). Свой собственный 7-секундный таймер (общий механизм
// timeLimit/onTimeout в trainer-question.tsx на практике мёртв — нигде
// не вызывается, — поэтому таймер целиком внутри этого компонента, не
// полагается на родителя) и свой собственный флоу "выбор → результат →
// onAnswer", тот же паттерн, что уже использует TypeSlider (прямой вызов
// onAnswer, без двухшагового select-then-submit через общую кнопку внизу).

import React, { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { Slider, SliderTrack, SliderRange, SliderThumb } from '@radix-ui/react-slider'
import { QuestionType } from './page'

import burn1 from '@/public/Lottie/numbers/burn1.json'
import burn2 from '@/public/Lottie/numbers/burn2.json'
import burn3 from '@/public/Lottie/numbers/burn3.json'
import burn4 from '@/public/Lottie/numbers/burn4.json'
import burn5 from '@/public/Lottie/numbers/burn5.json'
import burn6 from '@/public/Lottie/numbers/burn6.json'
import burn7 from '@/public/Lottie/numbers/burn7.json'
import burnDevil from '@/public/Lottie/numbers/burnDevil.json'

// lottie-react трогает document на импорте — без ssr:false падает на
// сервере (та же SSR-ловушка, что уже чинили у TrainerMascot/
// question-bubble, см. CLAUDE.md).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const BURN_DIGITS: Record<number, object> = {
    7: burn7, 6: burn6, 5: burn5, 4: burn4, 3: burn3, 2: burn2, 1: burn1,
}

const START_SECONDS = 7
const TOLERANCE = 0.5 // ±50% от правильного значения — засчитывается как "угадал"

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeHot = ({ question, onAnswer }: Props) => {
    const { width, height } = useWindowSize()
    const correctValue = parseInt(question.correctAnswer, 10) || 0
    const sliderMax = Math.max(question.hotSliderMax ?? correctValue * 5, 1)
    const unit = question.hotUnit ?? ''

    // Шаг слайдера — фиксированный "1" неудобен на шкале в миллионы (МГУ);
    // держим примерно 500 делений на весь диапазон независимо от масштаба
    // факта (мышь/здание), чтобы драг оставался одинаково отзывчивым.
    const step = Math.max(1, Math.round(sliderMax / 500))

    const [guess, setGuess] = useState<number>(Math.round(sliderMax / 2))
    const guessRef = useRef(guess)
    const updateGuess = useCallback((v: number) => {
        const clamped = Math.max(0, Math.min(sliderMax, Math.round(v)))
        guessRef.current = clamped
        setGuess(clamped)
    }, [sliderMax])

    const [timeLeft, setTimeLeft] = useState(START_SECONDS)
    const [phase, setPhase] = useState<'answering' | 'result'>('answering')
    const [wasClose, setWasClose] = useState(false)
    const hasSubmittedRef = useRef(false)

    const submit = useCallback(() => {
        if (hasSubmittedRef.current) return
        hasSubmittedRef.current = true

        const rel = correctValue > 0 ? Math.abs(guessRef.current - correctValue) / correctValue : 1
        const close = rel <= TOLERANCE
        setWasClose(close)
        setPhase('result')

        setTimeout(() => onAnswer(close ? 'right' : 'wrong'), 1800)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [correctValue, onAnswer])

    // Обратный отсчёт — свой, не полагается на общий (нерабочий) механизм
    // timeLimit/onTimeout в trainer-question.tsx.
    useEffect(() => {
        if (phase !== 'answering') return
        if (timeLeft <= 0) {
            submit()
            return
        }
        const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
        return () => clearTimeout(timer)
    }, [timeLeft, phase, submit])

    return (
        <div className="relative mt-6 mb-6 px-2 overflow-hidden rounded-2xl">
            {/* Горящий демон на фоне — приглушённый (серый, полупрозрачный),
                чисто декоративный флёр темы "горячего вопроса". */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 grayscale">
                <Lottie animationData={burnDevil} className="w-56 h-56" loop />
            </div>

            <div className="relative flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#EF9F27]">
                        🔥 Горячий вопрос
                    </span>
                </div>

                {phase === 'answering' && timeLeft in BURN_DIGITS && (
                    <Lottie
                        animationData={BURN_DIGITS[timeLeft]}
                        className="w-16 h-16 mb-2"
                        loop={false}
                    />
                )}

                {phase === 'answering' ? (
                    <>
                        <div className="flex items-center gap-2 mb-6">
                            <input
                                type="number"
                                inputMode="numeric"
                                step={1}
                                min={0}
                                max={sliderMax}
                                value={guess}
                                onChange={(e) => updateGuess(Number(e.target.value) || 0)}
                                className="w-32 text-center text-2xl font-bold bg-[#161F23] border-2 border-[#3A464E] rounded-lg py-2 text-[#F2F7FB] focus:outline-none focus:border-[#4A90D9]"
                            />
                            <span className="text-xl font-bold text-[#9AA7B0]">{unit}</span>
                        </div>

                        <div className="relative w-full max-w-sm h-6 mb-8">
                            <Slider
                                className="relative flex h-6 w-full touch-none select-none items-center"
                                value={[guess]}
                                min={0}
                                max={sliderMax}
                                step={step}
                                onValueChange={(val) => updateGuess(val[0])}
                            >
                                <SliderTrack className="relative h-[8px] grow rounded-full bg-[#3A464E]">
                                    <SliderRange className="absolute h-full rounded-full bg-[#EF9F27]" />
                                </SliderTrack>
                                <SliderThumb
                                    className="block size-6 rounded-full bg-[#F2F7FB] shadow-[0_4px_10px] shadow-black/40"
                                    aria-label="Твоя оценка"
                                />
                            </Slider>
                        </div>

                        <button
                            type="button"
                            onClick={submit}
                            className="w-full max-w-[200px] py-3 rounded-lg font-bold text-lg bg-[#EF9F27] text-[#151F24] shadow-[0_4px_0_#B9761A] active:translate-y-1 active:shadow-none transition-all"
                        >
                            Ответить!
                        </button>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        {wasClose && <Confetti width={width} height={height} numberOfPieces={250} />}
                        <p className={`text-2xl font-bold mb-2 ${wasClose ? 'text-[#A1D151]' : 'text-[#9AA7B0]'}`}>
                            {wasClose ? 'Ты почти угадал! 🎉' : 'Не в этот раз!'}
                        </p>
                        <p className="text-lg text-[#F2F7FB]">
                            Правильный ответ: <span className="font-bold">{correctValue} {unit}</span>
                        </p>
                        <p className="text-sm text-[#9AA7B0] mt-1">
                            Твой ответ: {guess} {unit}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
