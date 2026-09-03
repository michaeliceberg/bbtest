// components/geometry/TrapezoidWalkthrough.tsx
//
// Прототип "интерактивного видеоразбора" — вместо диктора на видео,
// пошаговое ведение ученика по методу решения конкретной задачи
// (курс "ЕГЭ Математика Профиль" → Планиметрия → Трапеция → challenge
// id=1679: "Основания равнобедренной трапеции равны 43 и 73. Косинус
// острого угла трапеции равен 5/7. Найдите боковую сторону."), с живой
// диаграммой (TrapezoidDiagram), которая подсвечивает/подписывает то, о
// чём идёт речь именно сейчас.
//
// По итогам обратной связи (после первой версии) — три доработки:
// 1) Исходный текст условия теперь показан ПОСТОЯННО отдельным блоком
//    сверху (не пропадает, пока рисуется/меняется диаграмма ниже).
// 2) Для самого первого шага — хореография вместо мгновенной подсветки:
//    сначала жёлтый маркер-текстовыделитель "проводится" под нужной
//    фразой прямо в этом верхнем блоке условия, и только ПОСЛЕ этого на
//    диаграмме ПОСЛЕДОВАТЕЛЬНО (не одновременно) появляются 43, затем 73.
//    Реализовано как автопроигрывающаяся таймер-последовательность
//    (introPhase), кнопка "Дальше" разблокируется только по её концу —
//    чтобы взгляд ученика физически не мог "перескочить" вперёд.
// 3) Перед вопросом про косинус — диаграмма зумится на получившийся
//    прямоугольный треугольник, подписывает "15" на его катете, и только
//    ПОСЛЕ этого показывается сам вопрос выбора формулы (choicePhase).
//
// Тот же принцип самодостаточного многошагового компонента со своей
// кнопкой, что и type-multistep.tsx (тренажёр) — onComplete зовётся
// ОДИН раз в конце, ошибка на промежуточном шаге не прерывает
// прохождение. 2 типа шагов вне общей модели MULTISTEP ('observe' и
// 'choice') — сознательно не обобщено, сперва проверяем эффект на одном
// живом примере.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { TrapezoidDiagram, TrapezoidVisual } from './TrapezoidDiagram'

type Props = {
    onComplete: (allCorrect: boolean) => void
}

type StepKind = 'observe' | 'input' | 'choice'

type Step = {
    kind: StepKind
    prompt: string
    formula?: string
    answer?: string       // 'input'
    options?: string[]    // 'choice'
}

const STEPS: Step[] = [
    {
        kind: 'observe',
        prompt: '',
    },
    {
        kind: 'observe',
        prompt: 'Проведём две высоты из вершин меньшего основания. У основания образовались два равных отрезка по краям.',
    },
    {
        kind: 'input',
        prompt: 'Найдём длину каждого отрезка:',
        formula: '$\\dfrac{73-43}{2} = ?$',
        answer: '15',
    },
    {
        kind: 'choice',
        prompt: 'В прямоугольном треугольнике известны прилежащий катет (15) и косинус угла ($\\cos = \\dfrac{5}{7}$). Как найти боковую сторону — гипотенузу?',
        options: ['15 · cos', '15 / cos'],
    },
    {
        kind: 'input',
        prompt: 'Подставим числа:',
        formula: '$\\dfrac{15}{\\tfrac{5}{7}} = ?$',
        answer: '21',
    },
]

const CORRECT_CHOICE = '15 / cos'

// Жёлтый маркер-текстовыделитель под словом/фразой — растёт слева
// направо (scaleX), как будто его проводят фломастером. Полупрозрачный
// прямоугольник ПОД текстом (не заливка самого текста), чтобы буквы
// оставались чётко читаемы поверх него.
const HighlightWord = ({ children, active }: { children: React.ReactNode; active: boolean }) => (
    <span className="relative inline-block whitespace-nowrap">
        <motion.span
            className="absolute inset-x-0 bottom-[0.05em] h-[0.62em] rounded-[2px]"
            style={{ backgroundColor: '#facc15', transformOrigin: 'left center' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        <span className="relative">{children}</span>
    </span>
)

export const TrapezoidWalkthrough = ({ onComplete }: Props) => {
    const [stepIndex, setStepIndex] = useState(0)
    const [typedAnswer, setTypedAnswer] = useState('')
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
    const [checked, setChecked] = useState(false)
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
    const [hadMistake, setHadMistake] = useState(false)

    // Таймер-хореография шага 0: 0=ничего, 1=маркер+подсветка боковых
    // сторон, 2=маркер под "43 и 73", 3=появилась 43, 4=появилась 73
    // (конец — можно жать "Дальше").
    const [introPhase, setIntroPhase] = useState(0)
    // Таймер-хореография шага "choice" (индекс 3): 0=не зумлено,
    // 1=идёт зум, 2=подпись "15" появилась и вопрос можно показывать.
    const [choicePhase, setChoicePhase] = useState(0)

    useEffect(() => {
        if (stepIndex !== 0) return
        setIntroPhase(0)
        const timers = [
            setTimeout(() => setIntroPhase(1), 350),
            setTimeout(() => setIntroPhase(2), 1250),
            setTimeout(() => setIntroPhase(3), 1950),
            setTimeout(() => setIntroPhase(4), 2550),
        ]
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    useEffect(() => {
        if (stepIndex !== 3) return
        setChoicePhase(0)
        const timers = [
            setTimeout(() => setChoicePhase(1), 250),
            setTimeout(() => setChoicePhase(2), 1050),
        ]
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    const step = STEPS[stepIndex]
    const isLastStep = stepIndex === STEPS.length - 1

    const segmentValue = stepIndex >= 2 && (stepIndex > 2 || checked) ? '15' : null
    const legValue = stepIndex >= 4 && checked && lastCorrect !== null ? '21' : null

    const legsHighlighted = stepIndex > 0 || introPhase >= 1
    const base43Shown = stepIndex > 0 || introPhase >= 3
    const base73Shown = stepIndex > 0 || introPhase >= 4
    const zoomTriangle = (stepIndex === 3 && choicePhase >= 1) || (stepIndex === 4 && !checked)

    const visual: TrapezoidVisual = {
        legsHighlighted,
        base43Shown,
        base73Shown,
        altitudesDrawn: stepIndex >= 1,
        segmentsHighlighted: stepIndex >= 1,
        segmentValue,
        triangleHighlighted: stepIndex >= 3,
        zoomTriangle,
        legValue,
    }

    // choice-шаг: сам вопрос/варианты показываем только ПОСЛЕ того, как
    // зум и подпись "15" на треугольнике доиграли (choicePhase>=2).
    const choiceContentReady = stepIndex !== 3 || choicePhase >= 2

    const handleCheck = () => {
        if (step.kind === 'observe') return
        let correct = false
        if (step.kind === 'input') {
            correct = typedAnswer.trim().replace('.', ',') === (step.answer ?? '').replace('.', ',')
        } else if (step.kind === 'choice') {
            correct = selectedChoice === CORRECT_CHOICE
        }
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
        setSelectedChoice(null)
        setChecked(false)
        setLastCorrect(null)
    }

    const introBusy = stepIndex === 0 && introPhase < 4

    const primaryLabel = step.kind === 'observe'
        ? 'Дальше'
        : !checked
            ? 'Проверить'
            : isLastStep
                ? 'Готово'
                : 'Дальше'

    const primaryDisabled = step.kind === 'observe'
        ? introBusy
        : step.kind === 'input'
            ? !checked && typedAnswer.trim().length === 0
            : step.kind === 'choice'
                ? (!choiceContentReady || (!checked && selectedChoice === null))
                : false

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

            {/* Исходное условие задачи — показывается ПОСТОЯННО, не
                прячется под диаграммой на последующих шагах; фразы
                подсвечиваются маркером синхронно с разбором. */}
            <div className="w-full rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-3 text-center text-sm md:text-base text-[#F2F7FB] leading-relaxed">
                Основания <HighlightWord active={legsHighlighted}>равнобедренной</HighlightWord> трапеции{' '}
                <HighlightWord active={base43Shown || base73Shown || introPhase >= 2}>равны 43 и 73</HighlightWord>.
                {' '}Косинус острого угла трапеции равен <Latex>{'$\\dfrac{5}{7}$'}</Latex>. Найдите боковую сторону.
            </div>

            <TrapezoidDiagram {...visual} />

            {step.prompt && (
                <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                >
                    <Latex>{step.prompt}</Latex>
                </motion.div>
            )}

            {step.kind === 'choice' && !choiceContentReady && (
                <div className="text-sm text-[#7dd3fc] font-medium py-1">Смотрим на получившийся треугольник…</div>
            )}

            {step.formula && (
                <div className="text-2xl md:text-3xl font-bold text-[#F2F7FB] py-1">
                    <Latex>{step.formula}</Latex>
                </div>
            )}

            {step.kind === 'input' && (
                <KeyboardInput value={typedAnswer} onChange={setTypedAnswer} disabled={checked} />
            )}

            {step.kind === 'choice' && choiceContentReady && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 gap-3 w-full"
                >
                    {(step.options ?? []).map((option, idx) => (
                        <AnimatedOptionButton
                            key={idx}
                            option={option}
                            index={idx}
                            onClick={() => !checked && setSelectedChoice(option)}
                            isSelected={selectedChoice === option}
                            isCorrect={checked && option === CORRECT_CHOICE}
                            isWrong={checked && selectedChoice === option && option !== CORRECT_CHOICE}
                            disabled={checked}
                        />
                    ))}
                </motion.div>
            )}

            {checked && step.kind !== 'observe' && (
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                        lastCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                    )}
                >
                    {lastCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {lastCorrect ? 'Верно!' : `Правильный ответ: ${step.kind === 'input' ? step.answer : CORRECT_CHOICE}`}
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
