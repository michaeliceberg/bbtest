// components/geometry/TrapezoidWalkthrough.tsx
//
// Прототип "интерактивного видеоразбора" — вместо диктора на видео,
// пошаговое ведение ученика по методу решения конкретной задачи
// (курс "ЕГЭ Математика Профиль" → Планиметрия → Трапеция → challenge
// id=1679: "Основания равнобедренной трапеции равны 43 и 73. Косинус
// острого угла трапеции равен 5/7. Найдите боковую сторону."), с живой
// диаграммой (TrapezoidDiagram), которая подсвечивает/подписывает то, о
// чём идёт речь именно сейчас — см. обсуждение с пользователем "как если
// бы репетитор сидел рядом".
//
// Тот же принцип самодостаточного многошагового компонента со своей
// кнопкой, что и type-multistep.tsx (тренажёр) — onComplete зовётся
// ОДИН раз в конце, ошибка на промежуточном шаге не прерывает
// прохождение (показываем верный ответ и идём дальше — сам разбор всё
// равно должен быть пройден целиком), но у ЭТОГО прототипа (в отличие от
// MULTISTEP) добавлены 2 новых типа шагов, которых там ещё нет:
// 'observe' (просто посмотреть/понять, без ввода — кнопка "Дальше") и
// 'choice' (выбор из 2-3 вариантов, не только числовой ввод). Это
// сознательно НЕ обобщено в общий тип данных прямо сейчас — сперва
// проверяем сам эффект на одном живом примере, обобщение до
// переиспользуемой модели (как MULTISTEP) — следующий шаг, если эффект
// понравится.

import { useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { TrapezoidDiagram, TrapezoidStage } from './TrapezoidDiagram'

type Props = {
    onComplete: (allCorrect: boolean) => void
}

type StepKind = 'observe' | 'input' | 'choice'

type Step = {
    kind: StepKind
    stage: TrapezoidStage
    prompt: string
    formula?: string
    answer?: string       // 'input'
    options?: string[]    // 'choice'
}

const STEPS: Step[] = [
    {
        kind: 'observe',
        stage: 1,
        prompt: 'Трапеция равнобедренная — значит, боковые стороны равны. Основания известны: 43 и 73.',
    },
    {
        kind: 'observe',
        stage: 2,
        prompt: 'Проведём две высоты из вершин меньшего основания. У основания образовались два равных отрезка по краям.',
    },
    {
        kind: 'input',
        stage: 2,
        prompt: 'Найдём длину каждого отрезка:',
        formula: '$\\dfrac{73-43}{2} = ?$',
        answer: '15',
    },
    {
        kind: 'choice',
        stage: 4,
        prompt: 'В прямоугольном треугольнике известны прилежащий катет (15) и косинус угла ($\\cos = \\dfrac{5}{7}$). Как найти боковую сторону — гипотенузу?',
        options: ['15 · cos', '15 / cos'],
    },
    {
        kind: 'input',
        stage: 4,
        prompt: 'Подставим числа:',
        formula: '$\\dfrac{15}{\\tfrac{5}{7}} = ?$',
        answer: '21',
    },
]

const CORRECT_CHOICE = '15 / cos'

export const TrapezoidWalkthrough = ({ onComplete }: Props) => {
    const [stepIndex, setStepIndex] = useState(0)
    const [typedAnswer, setTypedAnswer] = useState('')
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
    const [checked, setChecked] = useState(false)
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
    const [hadMistake, setHadMistake] = useState(false)

    const step = STEPS[stepIndex]
    const isLastStep = stepIndex === STEPS.length - 1

    // Визуальное состояние диаграммы — этап текущего шага, но подписи
    // отрезка/боковой стороны показываем только ПОСЛЕ верной проверки
    // соответствующего шага (не раньше — иначе выдаём ответ до того, как
    // ученик сам его ввёл).
    const segmentValue = stepIndex >= 2 && (stepIndex > 2 || checked) ? '15' : null
    const legValue = stepIndex >= 4 && checked && lastCorrect !== null ? '21' : null
    const diagramStage: TrapezoidStage = step.stage

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

    const primaryLabel = step.kind === 'observe'
        ? 'Дальше'
        : !checked
            ? 'Проверить'
            : isLastStep
                ? 'Готово'
                : 'Дальше'

    const primaryDisabled = step.kind === 'input'
        ? !checked && typedAnswer.trim().length === 0
        : step.kind === 'choice'
            ? !checked && selectedChoice === null
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

            <TrapezoidDiagram stage={diagramStage} segmentValue={segmentValue} legValue={legValue} />

            <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
            >
                <Latex>{step.prompt}</Latex>
            </motion.div>

            {step.formula && (
                <div className="text-2xl md:text-3xl font-bold text-[#F2F7FB] py-1">
                    <Latex>{step.formula}</Latex>
                </div>
            )}

            {step.kind === 'input' && (
                <KeyboardInput value={typedAnswer} onChange={setTypedAnswer} disabled={checked} />
            )}

            {step.kind === 'choice' && (
                <div className="grid grid-cols-2 gap-3 w-full">
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
                </div>
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
