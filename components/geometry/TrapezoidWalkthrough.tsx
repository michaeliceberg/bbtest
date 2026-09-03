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
// По итогам двух раундов обратной связи хореография построена как
// цепочка ИМЕННОВАННЫХ таймер-фаз с явными паузами (≥800мс) между
// бит?ами — по прямой просьбе пользователя: "сейчас всё очень быстро и
// глаз не успевает следить" / "ученик должен логику понять
// последовательность действий". Каждый шаг с автопроигрышем не даёт
// нажать "Дальше", пока его хореография не доиграна целиком.
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
import { HighlightedNumbersText } from '@/components/HighlightedNumbersText'
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

// Таймлайны хореографии — абсолютное время (мс) от входа на шаг для
// каждой именованной фазы. Между фазами всегда пауза ≥800мс сверх
// длительности самой предыдущей анимации — чтобы взгляд ученика успевал
// заметить каждую отдельную деталь, а не терял их в общем потоке.
const INTRO_TIMELINE = [400, 2100, 3800, 5400]   // шаг 0: маркер "равнобедренной"+ноги → маркер "43 и 73" → 43 → 73
const HEIGHTS_TIMELINE = [200, 1800]              // шаг 1: высоты → пауза → оранжевые отрезки
const CHOICE_TIMELINE = [250, 1950, 3550, 5250]   // шаг 3: зум → подпись 15 → маркер "косинус" → вопрос

// Тёмно-фиолетовый маркер первой версии сливался с фоном; розово-красный
// второй версии читался как "ошибка" (красный = плохо). Итог — яркий
// фиолетовый (тот же HYPOTENUSE_COLOR в TrapezoidDiagram — единый "вот на
// чём фокус сейчас" язык между текстом и диаграммой, и тот же акцент,
// что и у бейджа "разбор по шагам" в ChallengeNav): не сливается с тёмным
// фоном, не ассоциируется с ошибкой/предупреждением, белые буквы поверх
// остаются контрастными. Верхний край не трогаем (пользователь
// подтвердил "верхний край идёт отлично") — расширяем ТОЛЬКО вниз, чтобы
// под маркер попадали нижние выносные элементы букв (р, у, б...).
const MARKER_COLOR = 'rgba(139, 92, 246, 0.85)' // violet-500 @ 85%

const HighlightWord = ({ children, active }: { children: React.ReactNode; active: boolean }) => (
    <span className="relative inline-block whitespace-nowrap">
        <motion.span
            className="absolute -inset-x-1.5 top-[0.03em] h-[1.25em] rounded-[3px]"
            style={{ backgroundColor: MARKER_COLOR, transformOrigin: 'left center' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
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

    // Хореография шага 0 (0=ничего, 1=маркер+ноги, 2=маркер 43/73, 3=43, 4=73)
    const [introPhase, setIntroPhase] = useState(0)
    // Хореография шага 1 (0=ничего, 1=высоты, 2=оранжевые отрезки)
    const [heightsPhase, setHeightsPhase] = useState(0)
    // Хореография шага "choice" (0=не зумлено, 1=зум, 2=подпись 15, 3=маркер "косинус", 4=вопрос)
    const [choicePhase, setChoicePhase] = useState(0)

    useEffect(() => {
        if (stepIndex !== 0) return
        setIntroPhase(0)
        const timers = INTRO_TIMELINE.map((t, i) => setTimeout(() => setIntroPhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    useEffect(() => {
        if (stepIndex !== 1) return
        setHeightsPhase(0)
        const timers = HEIGHTS_TIMELINE.map((t, i) => setTimeout(() => setHeightsPhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    useEffect(() => {
        if (stepIndex !== 3) return
        setChoicePhase(0)
        const timers = CHOICE_TIMELINE.map((t, i) => setTimeout(() => setChoicePhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    const step = STEPS[stepIndex]
    const isLastStep = stepIndex === STEPS.length - 1

    const segmentValue = stepIndex >= 2 && (stepIndex > 2 || checked) ? '15' : null
    const legValue = stepIndex >= 4 && checked && lastCorrect !== null ? '21' : null

    const legsHighlighted = stepIndex > 0 || introPhase >= 1
    const base43Shown = stepIndex > 0 || introPhase >= 3
    const base73Shown = stepIndex > 0 || introPhase >= 4
    const altitudesDrawn = stepIndex > 1 || (stepIndex === 1 && heightsPhase >= 1)
    const segmentsHighlighted = stepIndex > 1 || (stepIndex === 1 && heightsPhase >= 2)
    const zoomTriangle = (stepIndex === 3 && choicePhase >= 1) || (stepIndex === 4 && !checked)
    // Гипотенуза перекрашивается + "?" выезжает из неё, пока идёт зум и
    // ответ ещё не найден — по просьбе пользователя, гаснет одновременно
    // с самим зумом (тем же условием, `&& !checked`) как только появляется
    // финальное число.
    const hypotenuseFocused = zoomTriangle

    const visual: TrapezoidVisual = {
        legsHighlighted,
        base43Shown,
        base73Shown,
        altitudesDrawn,
        segmentsHighlighted,
        segmentValue,
        triangleHighlighted: stepIndex >= 3,
        zoomTriangle,
        hypotenuseFocused,
        legValue,
    }

    // Текст-маркер в шапке условия — отдельно от диаграммы: подсвечивает
    // ТЕКУЩИЙ фокус разбора, а не накопленное состояние диаграммы. По шагам
    // 0-2 это "равнобедренной"/"43 и 73", а после увеличения треугольника
    // (шаг 3) старые подсветки убираются и включается "космнус..." — по
    // прямой просьбе пользователя.
    const legsMarkerActive = stepIndex < 3 && (stepIndex > 0 || introPhase >= 1)
    const basesMarkerActive = stepIndex < 3 && (stepIndex > 0 || introPhase >= 2)
    const cosineMarkerActive = stepIndex >= 3 && (stepIndex > 3 || choicePhase >= 3)

    // choice-шаг: сам вопрос/варианты показываем только ПОСЛЕ полной
    // хореографии (зум → подпись 15 → маркер "косинус").
    const choiceContentReady = stepIndex !== 3 || choicePhase >= 4

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

    const introBusy = stepIndex === 0 && introPhase < INTRO_TIMELINE.length
    const heightsBusy = stepIndex === 1 && heightsPhase < HEIGHTS_TIMELINE.length

    const primaryLabel = step.kind === 'observe'
        ? 'Дальше'
        : !checked
            ? 'Проверить'
            : isLastStep
                ? 'Готово'
                : 'Дальше'

    const primaryDisabled = step.kind === 'observe'
        ? (introBusy || heightsBusy)
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
                Основания <HighlightWord active={legsMarkerActive}>равнобедренной</HighlightWord> трапеции{' '}
                <HighlightWord active={basesMarkerActive}><HighlightedNumbersText text="равны 43 и 73" /></HighlightWord>.
                {' '}<HighlightWord active={cosineMarkerActive}>Косинус острого угла трапеции равен</HighlightWord> <Latex>{'$\\dfrac{5}{7}$'}</Latex>. Найдите боковую сторону.
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
                    <HighlightedNumbersText text={step.prompt} />
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
