// components/geometry/TangentialQuadWalkthrough.tsx
//
// Второй интерактивный разбор по шагам (после трапеции) — курс "ЕГЭ
// Математика Профиль" → Планиметрия → "Вписанная окружность" →
// challenge id=4594: "В четырёхугольник ABCD вписана окружность,
// AB=10, CD=16. Найдите периметр четырёхугольника ABCD."
//
// Задача проще трапеции (это реальное задание №1 ЕГЭ — самое лёгкое во
// всём экзамене), поэтому и разбор короче: 3 шага вместо 5, без
// choice-развилки и без зума — только сам факт (касательные из одной
// точки равны) → вывод равенства сумм противоположных сторон →
// подстановка чисел. Тот же принцип самодостаточного компонента, что и
// TrapezoidWalkthrough (onComplete один раз в конце), тот же общий
// маркер-текстовыделитель (WalkthroughMarker.tsx — вынесен туда именно
// при появлении этого, второго разбора).

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { HighlightedNumbersText } from '@/components/HighlightedNumbersText'
import { HighlightWord } from './WalkthroughMarker'
import { TangentialQuadDiagram, TangentialQuadVisual } from './TangentialQuadDiagram'

type Props = {
    onComplete: (allCorrect: boolean) => void
}

type Step = {
    kind: 'observe' | 'input'
    prompt: string
    formula?: string
    answer?: string
}

const STEPS: Step[] = [
    {
        kind: 'observe',
        prompt: '',
    },
    {
        kind: 'observe',
        prompt: 'Значит: AB = a+b, CD = c+d — а BC = b+c, DA = d+a. Сложим стороны по-другому:',
        formula: '$AB+CD=(a{+}b){+}(c{+}d)=(b{+}c){+}(d{+}a)=BC+DA$',
    },
    {
        kind: 'input',
        prompt: 'Значит периметр = 2·(AB+CD). Подставим числа:',
        formula: '$2\\times(10+16) = ?$',
        answer: '52',
    },
]

// Хореография с паузами ≥800мс между фазами — тот же принцип, что и в
// TrapezoidWalkthrough (см. его комментарий про "глаз не успевает
// следить"), только короче — сама задача проще.
const INTRO_TIMELINE = [350, 1750]        // шаг 0: точки касания → буквы a/b/c/d
const DERIVE_TIMELINE = [300, 1500]       // шаг 1: подсветка AB+CD синим → BC+DA оранжевым

export const TangentialQuadWalkthrough = ({ onComplete }: Props) => {
    const [stepIndex, setStepIndex] = useState(0)
    const [typedAnswer, setTypedAnswer] = useState('')
    const [checked, setChecked] = useState(false)
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
    const [hadMistake, setHadMistake] = useState(false)

    // Шаг 0: 0=ничего, 1=точки касания видны, 2=буквы a/b/c/d видны
    const [introPhase, setIntroPhase] = useState(0)
    // Шаг 1: 0=ничего, 1=AB+CD синим, 2=BC+DA оранжевым
    const [derivePhase, setDerivePhase] = useState(0)

    useEffect(() => {
        if (stepIndex !== 0) return
        setIntroPhase(0)
        const timers = INTRO_TIMELINE.map((t, i) => setTimeout(() => setIntroPhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    useEffect(() => {
        if (stepIndex !== 1) return
        setDerivePhase(0)
        const timers = DERIVE_TIMELINE.map((t, i) => setTimeout(() => setDerivePhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    const step = STEPS[stepIndex]
    const isLastStep = stepIndex === STEPS.length - 1

    const tangentPointsShown = stepIndex > 0 || introPhase >= 1
    const tangentLabelsShown = stepIndex > 0 || introPhase >= 2
    const abcdHighlighted = stepIndex > 1 || (stepIndex === 1 && derivePhase >= 1)
    const bcdaHighlighted = stepIndex > 1 || (stepIndex === 1 && derivePhase >= 2)
    const perimeterValue = stepIndex >= 2 && checked && lastCorrect !== null ? '52' : null

    const visual: TangentialQuadVisual = {
        tangentPointsShown,
        tangentLabelsShown,
        abcdHighlighted,
        bcdaHighlighted,
        perimeterValue,
    }

    // Маркер в шапке условия — подсвечивает "AB=10, CD=16" на протяжении
    // всего разбора (в отличие от трапеции, тут не нужно переключать фокус
    // между несколькими фразами — вся задача крутится вокруг этих двух
    // данных чисел от начала до конца).
    const givenMarkerActive = stepIndex > 0 || introPhase >= 1

    const handleCheck = () => {
        if (step.kind === 'observe') return
        const correct = typedAnswer.trim().replace('.', ',') === (step.answer ?? '').replace('.', ',')
        setLastCorrect(correct)
        setChecked(true)
        if (!correct) setHadMistake(true)
    }

    const handleNext = () => {
        if (isLastStep) {
            onComplete(!hadMistake)
            return
        }
        setStepIndex((i) => i + 1)
        setTypedAnswer('')
        setChecked(false)
        setLastCorrect(null)
    }

    const introBusy = stepIndex === 0 && introPhase < INTRO_TIMELINE.length
    const deriveBusy = stepIndex === 1 && derivePhase < DERIVE_TIMELINE.length

    const primaryLabel = step.kind === 'observe'
        ? 'Дальше'
        : !checked
            ? 'Проверить'
            : isLastStep
                ? 'Готово'
                : 'Дальше'

    const primaryDisabled = step.kind === 'observe'
        ? (introBusy || deriveBusy)
        : !checked && typedAnswer.trim().length === 0

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-1.5">
                {STEPS.map((_, i) => (
                    <span
                        key={i}
                        className={cn(
                            'h-2 rounded-full transition-all',
                            i < stepIndex ? 'w-6 bg-[#A1D151]' : i === stepIndex ? 'w-6 bg-[#4A90D9]' : 'w-2 bg-[#3A464E]'
                        )}
                    />
                ))}
            </div>

            {/* Исходное условие — постоянно видно, как и у трапеции */}
            <div className="w-full rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-3 text-center text-sm md:text-base text-[#F2F7FB] leading-relaxed">
                В четырёхугольник <Latex>{'$ABCD$'}</Latex> вписана окружность,{' '}
                <HighlightWord active={givenMarkerActive}><HighlightedNumbersText text="AB=10, CD=16" /></HighlightWord>.
                {' '}Найдите периметр четырёхугольника <Latex>{'$ABCD$'}</Latex>.
            </div>

            <TangentialQuadDiagram {...visual} />

            {step.prompt && (
                <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                >
                    <HighlightedNumbersText text={step.prompt} />
                </motion.div>
            )}

            {step.kind === 'observe' && stepIndex === 0 && (
                <div className="text-sm text-[#9AA7B0] text-center">
                    Касательные к окружности, проведённые из одной точки, всегда равны.
                </div>
            )}

            {step.formula && (
                <div className="text-xl md:text-2xl font-bold text-[#F2F7FB] py-1 text-center">
                    <Latex>{step.formula}</Latex>
                </div>
            )}

            {step.kind === 'input' && (
                <KeyboardInput value={typedAnswer} onChange={setTypedAnswer} disabled={checked} />
            )}

            {checked && step.kind !== 'observe' && (
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                        lastCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                    )}
                >
                    {lastCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {lastCorrect ? 'Верно!' : `Правильный ответ: ${step.answer}`}
                </div>
            )}

            <button
                type="button"
                onClick={step.kind === 'observe' ? handleNext : (checked ? handleNext : handleCheck)}
                disabled={primaryDisabled}
                className={cn(
                    'w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                    primaryDisabled
                        ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
                        : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                )}
            >
                {primaryLabel}
            </button>
        </div>
    )
}
