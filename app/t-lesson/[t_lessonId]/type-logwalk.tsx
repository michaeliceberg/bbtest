// app/t-lesson/[t_lessonId]/type-logwalk.tsx
//
// Тип LOGWALK — интерактивный разбор по шагам "как складывать логарифмы"
// (тренажёр "Логарифмы", урок ПЕРЕД остальными этапами темы) — по прямой
// просьбе пользователя, тот же архитектурный принцип, что уже у SINWALK
// (см. type-sinwalk.tsx): самодостаточный тип, компонент сам ведёт свою
// внутреннюю хореографию и зовёт onAnswer/onComplete РОВНО один раз в
// конце; общая нижняя кнопка (components/trainer-question.tsx) скрыта —
// у LOGWALK своя кнопка "Дальше"/"Готово" на протяжении всего прохождения.
//
// Сюжет — прямая инструкция пользователя, по шагам, на ОДНОМ фиксированном
// примере (log₂3 + log₂5 = log₂15):
// 1. Пишем крупно "log₂3 + log₂5 =" — просто условие.
// 2. Обводим ОБА основания (двойки) как "стикер" — у логарифмов одинаковое
//    основание.
// 3. Дописываем справа "= log₂" — то же основание обведено тем же цветом
//    (переносится в ответ).
// 4. Обводим аргументы 3 и 5 (другой цвет) — раз логарифмы складываем,
//    аргументы перемножаются: "= log₂(3·5)".
// 5. Считаем: "= log₂15".
//
// После разбора — несколько тренировочных заданий с НОВЫМИ случайными
// числами (log_a x + log_a y = log_a ?), нужно кликнуть на верное число
// среди вариантов — тот же формат, что и у SINWALK (клик = мгновенная
// проверка, ошибка на последнем по счёту задании не завершает попытку, а
// добавляет ещё одно, см. handleNextTrial).

'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, TypedKeyPhraseLine, DiagramBlock, useStickToBottom,
    pickWalkthroughNextLabel, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, WRONG_COLOR, CORRECT_COLOR,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Пауза ПОСЛЕ клика "Дальше", ДО начала новой сцены — тот же приём и то
// же значение, что у SINWALK (см. там же комментарий).
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const INTRO_STEPS = 5
const TRIAL_COUNT = 4

// Основание — синий (та же роль "величина, вводимая отдельно", что уже
// закреплена за синим в палитре ggege); аргументы — зелёный (второй по
// частоте ключевой термин разбора). См. CLAUDE.md «Палитра ggege».
const BASE_COLOR = GGEGE_PALETTE.blue.button
const ARG_COLOR = GGEGE_PALETTE.green.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки формулы (HTML+CSS, без KaTeX — короткая
// целочисленная запись log_a(x) не содержит ни одной конструкции, которая
// требовала бы формульного рендера, а обычные HTML-элементы избавляют от
// всех уже известных в проекте KaTeX-сегментирования/цвет-протечка гэтч
// (см. историю INSERT в CLAUDE.md) — тот же вывод, что уже сделан для
// x1/x2 в type-vieta.tsx). =====

// "Стикер" числа — HTML-версия того же приёма, что уже используют
// HtmlLetterSticker (reference-browser.tsx) и LetterSticker
// (RightTriangleRefDiagram.tsx): скруглённый цветной бокс с полупрозрачной
// заливкой того же цвета. Bounce-появление — числа начинают крупнее
// финального размера и с пружинным отскоком уменьшаются (тот же паттерн,
// что уже применяется в проекте для чисел/букв, см. numberBounce в
// CLAUDE.md).
const NumSticker = ({ value, color, small = false }: { value: number; color: string; small?: boolean }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className={cn(
            'inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle',
            // leading-none ПОСЛЕ text-[...] — tailwind-merge относит
            // произвольный text-[size] и leading-* к одной "font-size"
            // конфликт-группе (кто later, тот и остаётся), при обратном
            // порядке leading-none тихо вырезался бы (найдено живьём —
            // sticker коллапсировал до 4px по высоте).
            small ? 'px-1 text-[0.6em]' : 'px-1.5 py-0.5',
            'leading-none',
        )}
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

const Plain = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#F2F7FB]">{children}</span>
)

// "logₐ x" — базовый (левый) член суммы. Основание — subscript (тег
// <sub>, естественная позиция браузера, без ручных transform); аргумент —
// обычный размер сразу после.
const LogTerm = ({
    base, arg, baseHighlighted, argHighlighted,
}: {
    base: number; arg: number; baseHighlighted: boolean; argHighlighted: boolean
}) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5">
            {baseHighlighted ? <NumSticker value={base} color={BASE_COLOR} small /> : <Plain>{base}</Plain>}
        </sub>
        <span className="ml-1">
            {argHighlighted ? <NumSticker value={arg} color={ARG_COLOR} /> : <Plain>{arg}</Plain>}
        </span>
    </span>
)

type FormulaState = {
    baseHighlighted: boolean
    argsHighlighted: boolean
    showRightSide: boolean
    showProduct: boolean
    showResult: boolean
}

// Полная строка примера "log₂3 + log₂5 [= log₂(3·5) [= 15]]" — на каждом
// шаге разбора рисуется НОВЫЙ (не мутирующий предыдущий) экземпляр с
// накопленными флагами — тот же "накопительный лог", что у SINWALK: все
// уже пройденные шаги остаются на экране, новый дописывается ниже.
const ExampleFormula = ({ baseHighlighted, argsHighlighted, showRightSide, showProduct, showResult }: FormulaState) => (
    <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
        <LogTerm base={2} arg={3} baseHighlighted={baseHighlighted} argHighlighted={argsHighlighted} />
        <Plain>+</Plain>
        <LogTerm base={2} arg={5} baseHighlighted={baseHighlighted} argHighlighted={argsHighlighted} />
        {showRightSide && (
            <>
                <Plain>=</Plain>
                <span className="inline-flex items-baseline whitespace-nowrap">
                    <Plain>log</Plain>
                    <sub className="ml-0.5">
                        <NumSticker value={2} color={BASE_COLOR} small />
                    </sub>
                    {showProduct && (
                        <span className="ml-1 inline-flex items-baseline gap-1 whitespace-nowrap">
                            <Plain>(</Plain>
                            <NumSticker value={3} color={ARG_COLOR} />
                            <Plain>·</Plain>
                            <NumSticker value={5} color={ARG_COLOR} />
                            <Plain>)</Plain>
                        </span>
                    )}
                </span>
            </>
        )}
        {showResult && (
            <>
                <Plain>=</Plain>
                <motion.span
                    initial={{ scale: 2.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                    style={{ color: CORRECT_COLOR }}
                >
                    15
                </motion.span>
            </>
        )}
    </div>
)

// ===== Тренировочные задания — новые случайные (a, x, y), нужно кликнуть
// верное число (x·y) среди вариантов. =====

type LogTrial = { a: number; x: number; y: number; options: number[] }

const A_POOL = [2, 3, 5, 7, 9] as const
const XY_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Дистракторы — правдоподобные ошибки школьника (сложил вместо того,
// чтобы умножить; ошибся на 1 в одном из множителей), а не случайный шум.
function makeOptions(x: number, y: number): number[] {
    const correct = x * y
    const candidates = new Set<number>()
    candidates.add(x + y)
    candidates.add(x * (y + 1))
    candidates.add((x + 1) * y)
    candidates.delete(correct)
    let out = Array.from(candidates).filter((n) => n > 0 && n !== correct)
    let extra = correct + 6
    while (out.length < 3) {
        if (extra !== correct && !out.includes(extra)) out.push(extra)
        extra++
    }
    return shuffle([correct, ...out.slice(0, 3)])
}

const makeTrial = (prev: LogTrial | null): LogTrial => {
    let t: LogTrial
    let guard = 0
    do {
        const a = pick(A_POOL)
        const x = pick(XY_POOL)
        let y = pick(XY_POOL)
        while (y === x) y = pick(XY_POOL)
        t = { a, x, y, options: makeOptions(x, y) }
        guard++
    } while (prev && t.a === prev.a && t.x === prev.x && t.y === prev.y && guard < 8)
    return t
}

const makeTrials = (n: number): LogTrial[] => {
    const out: LogTrial[] = []
    let prev: LogTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

// Похвала за верный ответ — детерминированно из полей самого задания (не
// Math.random() прямо в JSX внутри .map(), см. тот же приём и его причину
// в type-sinwalk.tsx).
const pickTrialFeedback = (t: LogTrial): string => {
    const seed = t.a * 7 + t.x * 3 + t.y
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

const LogTrialFormula = ({
    trial, selected, checked, isCorrect,
}: {
    trial: LogTrial; selected: number | null; checked: boolean; isCorrect: boolean
}) => {
    const { a, x, y } = trial
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{x}</Plain></span>
            </span>
            <Plain>+</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{y}</Plain></span>
            </span>
            <Plain>=</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1">
                    {selected === null ? (
                        <span style={{ color: ACTIVE_COLOR }} className="font-black">?</span>
                    ) : (
                        <motion.span
                            key={selected}
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 15 }}
                            style={{ color: checked ? (isCorrect ? CORRECT_COLOR : WRONG_COLOR) : '#F2F7FB' }}
                        >
                            {selected}
                        </motion.span>
                    )}
                </span>
            </span>
        </div>
    )
}

const nextButtonClass = (enabled: boolean) => cn(
    'flex-1 py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
    enabled ? 'bg-[#A1D151] border-[#78C93C] text-[#151F24]' : 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
)

export const TypeLogWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<LogTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [trialAnswers, setTrialAnswers] = useState<(number | null)[]>(Array(TRIAL_COUNT).fill(null))
    const [checked, setChecked] = useState(false)

    const currentCorrectValue = trials[trialIndex].x * trials[trialIndex].y

    const handleOptionClick = (value: number) => {
        if (checked) return
        const next = [...trialAnswers]
        next[trialIndex] = value
        setTrialAnswers(next)
        setChecked(true)
        if (value !== currentCorrectValue) setHadMistake(true)
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const wasLastCorrect = trialAnswers[trialIndex] === currentCorrectValue
            const isLastInList = trialIndex + 1 >= trials.length
            if (isLastInList) {
                if (wasLastCorrect) {
                    setAdvancing(false)
                    // onComplete — только красит маскота/локальный статус,
                    // настоящее завершение вопроса — через onAnswer, как у
                    // SINWALK/CHECK/FRACTRICK (те же самодостаточные типы).
                    const isFullyCorrect = !hadMistake
                    onComplete(isFullyCorrect)
                    onAnswer(isFullyCorrect ? 'right' : 'wrong')
                    return
                }
                // Ошибка на последнем по счёту задании — не завершаем
                // попытку, добавляем ещё одно (тот же приём, что и у
                // SINWALK).
                const [extra] = makeTrials(1)
                setTrials((prev) => [...prev, extra])
                setTrialAnswers((prev) => [...prev, null])
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_STEPS) {
                setPhase('practice')
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // Подпись кнопки "Дальше" — та же случайная вариативность, что и у
    // SINWALK, только после монтирования (не в рендере/useMemo — избегает
    // SSR/клиент-рассинхрона Math.random(), см. тот же комментарий там).
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])
    useEffect(() => { setTrialNextLabel(pickWalkthroughNextLabel('Дальше')) }, [trialIndex])

    const endRef = useStickToBottom([step, stepReady, phase, trialIndex, checked, advancing])

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто условие, без подсветки. */}
                <Fragment key="step-0">
                    <DiagramBlock><ExampleFormula baseHighlighted={false} argsHighlighted={false} showRightSide={false} showProduct={false} showResult={false} /></DiagramBlock>
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Нужно сложить два логарифма: log₂3 и log₂5."
                        onSettled={() => setStepReady(true)}
                    />
                </Fragment>

                {/* Шаг 1 — основания (двойки) становятся стикерами. */}
                {step >= 1 && (
                    <Fragment key="step-1">
                        <DiagramBlock><ExampleFormula baseHighlighted argsHighlighted={false} showRightSide={false} showProduct={false} showResult={false} /></DiagramBlock>
                        <TypedKeyPhraseLine
                            before="Присмотримся к основаниям — у обоих логарифмов оно "
                            phrase="одинаковое"
                            after=" — это 2."
                            color={BASE_COLOR}
                            highlight
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                )}

                {/* Шаг 2 — справа дописывается "= log₂", то же основание. */}
                {step >= 2 && (
                    <Fragment key="step-2">
                        <DiagramBlock><ExampleFormula baseHighlighted argsHighlighted={false} showRightSide showProduct={false} showResult={false} /></DiagramBlock>
                        <TypedKeyPhraseLine
                            before="Раз основания совпадают, у результата будет "
                            phrase="то же самое основание"
                            after=" — 2."
                            color={BASE_COLOR}
                            highlight
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                )}

                {/* Шаг 3 — аргументы (3 и 5) становятся стикерами, справа
                    появляется "(3·5)". */}
                {step >= 3 && (
                    <Fragment key="step-3">
                        <DiagramBlock><ExampleFormula baseHighlighted argsHighlighted showRightSide showProduct showResult={false} /></DiagramBlock>
                        <TypedKeyPhraseLine
                            before="Когда складываем логарифмы с одинаковым основанием, аргументы "
                            phrase="перемножаются"
                            after=" — 3 и 5 попадают внутрь одного логарифма."
                            color={ARG_COLOR}
                            highlight
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                )}

                {/* Шаг 4 — считаем результат. */}
                {step >= 4 && (
                    <Fragment key="step-4">
                        <DiagramBlock><ExampleFormula baseHighlighted argsHighlighted showRightSide showProduct showResult /></DiagramBlock>
                        <TypedLine
                            className="w-full text-base md:text-lg text-[#F2F7FB]"
                            text="3 · 5 = 15, поэтому log₂3 + log₂5 = log₂15."
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const answer = trialAnswers[i]
                    const correctValue = t.x * t.y
                    return (
                        <div key={`trial-${i}`} className="w-full flex flex-col gap-3">
                            <div className="flex items-start gap-3 w-full">
                                <div
                                    className="shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                    style={{
                                        borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                        backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                        color: GGEGE_PALETTE.purple.button,
                                    }}
                                >
                                    <span>{i + 1}</span>
                                    <span className="opacity-50 font-normal">/</span>
                                    <span>{trials.length}</span>
                                </div>
                                <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">
                                    Кликни на число, которое должно стоять под логарифмом справа.
                                </p>
                            </div>
                            <DiagramBlock>
                                <LogTrialFormula trial={t} selected={answer} checked={isDone} isCorrect={answer === correctValue} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <div className="flex flex-wrap justify-center gap-3">
                                    {t.options.map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => handleOptionClick(num)}
                                            className="min-w-[64px] py-3 px-4 rounded-xl border-2 border-[#3A464E] bg-[#161F23] text-[#F2F7FB] text-lg md:text-xl font-bold hover:border-[#4A90D9] transition-colors"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {isDone && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                        answer === correctValue ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                    )}
                                >
                                    {answer === correctValue ? pickTrialFeedback(t) : `Неверно — правильный ответ ${correctValue} (${t.x}·${t.y}).`}
                                </div>
                            )}
                        </div>
                    )
                })}

                <div ref={endRef} />
            </div>

            {phase === 'intro' ? (
                <div className="w-full max-w-xs">
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={nextButtonClass(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full max-w-xs">
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={nextButtonClass(!advancing)}>
                        {trialIndex + 1 >= trials.length && trialAnswers[trialIndex] === currentCorrectValue ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни на число выше</p>
            )}
        </div>
    )
}
