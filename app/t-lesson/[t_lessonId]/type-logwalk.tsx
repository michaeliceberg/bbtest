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
// 1. Пишем крупно "log₂3 + log₂5 =" — просто условие, без текста-подписи.
// 2. Обводим ОБА основания (двойки) как "стикер" — заметим одинаковое
//    основание.
// 3. Дописываем справа "= log₂" — то же основание обведено тем же цветом.
// 4. Обводим аргументы 3 и 5 РАЗНЫМИ цветами (не один общий, как раньше) —
//    стрелка от "+" слева к "·" справа показывает "сумма превращается в
//    произведение". "= log₂(3·5)".
// 5. Считаем: "Ответ: log₂15".
//
// После разбора — несколько тренировочных заданий с НОВЫМИ случайными
// числами (log_a x + log_a y = log_a ?), нужно кликнуть на верное число
// среди вариантов — тот же формат, что и у SINWALK (клик = мгновенная
// проверка, ошибка на последнем по счёту задании не завершает попытку, а
// добавляет ещё одно, см. handleNextTrial).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedKeyPhraseLine, DiagramBlock,
    pickWalkthroughNextLabel, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, WRONG_COLOR, CORRECT_COLOR, ATTENTION_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
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
// закреплена за синим в палитре ggege). Аргументы 3 и 5 — РАЗНЫЕ цвета
// (по прямой просьбе пользователя — одинаковый цвет для обоих читался
// как "это одно и то же число"), взяты из двух ролей палитры, пока
// свободных для новой задачи ("Малиновый/бирюзовый — пока используются
// только на /learn... свободны для новой роли", см. CLAUDE.md).
const BASE_COLOR = GGEGE_PALETTE.blue.button
const ARG_COLOR_X = GGEGE_PALETTE.teal.button
const ARG_COLOR_Y = GGEGE_PALETTE.raspberry.button

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

// Один "токен" формулы — по прямой просьбе пользователя ("можно ли
// сделать так, чтобы формула тоже 'печаталась'?") каждый смысловой
// кусок формулы появляется по очереди с небольшой задержкой, а не весь
// разом. Настоящий Typewriter (по буквам) здесь не имеет смысла —
// формула это НЕ единая строка текста, а структура из под/над-строчных
// элементов и цветных стикеров (то же самое, из-за чего когда-то ушли от
// KaTeX, см. историю INSERT) — но каскадное появление ЦЕЛЫХ элементов
// слева направо визуально даёт тот же эффект "формула печатается", просто
// не по одному символу, а по "словам"/операндам.
const Token = ({ delay, children }: { delay: number; children: React.ReactNode }) => (
    <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay }}
        className="inline-flex items-baseline"
    >
        {children}
    </motion.span>
)

// "logₐ x" — базовый (левый) член суммы. Основание — subscript (тег
// <sub>, естественная позиция браузера, без ручных transform); аргумент —
// обычный размер сразу после. argColor не задан — аргумент показывается
// плоским текстом (см. FormulaState.arg1Color/arg2Color ниже).
const LogTerm = ({
    base, arg, baseHighlighted, argColor,
}: {
    base: number; arg: number; baseHighlighted: boolean; argColor?: string
}) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5">
            {baseHighlighted ? <NumSticker value={base} color={BASE_COLOR} small /> : <Plain>{base}</Plain>}
        </sub>
        <span className="ml-1">
            {argColor ? <NumSticker value={arg} color={argColor} /> : <Plain>{arg}</Plain>}
        </span>
    </span>
)

type FormulaState = {
    baseHighlighted: boolean
    // Цвет аргумента 3/5 — РАЗНЫЙ для каждого (см. ARG_COLOR_X/Y выше),
    // undefined до того, как аргументы вообще подсвечиваются (шаг 0-2).
    arg1Color?: string
    arg2Color?: string
    showRightSide: boolean
    showProduct: boolean
    showResult: boolean
}

// Полная строка примера "log₂3 + log₂5 [= log₂(3·5) [= 15]]" — на каждом
// шаге разбора рисуется НОВЫЙ (не мутирующий предыдущий) экземпляр с
// накопленными флагами — тот же "накопительный лог", что у SINWALK: все
// уже пройденные шаги остаются на экране, новый дописывается ниже.
// data-marker="plus"/"multiply" — точки, между которыми на шаге 3 рисуется
// стрелка (см. ArgumentsArrow) — присутствуют всегда, безвредны там, где
// стрелка не рисуется.
const ExampleFormula = ({ baseHighlighted, arg1Color, arg2Color, showRightSide, showProduct, showResult }: FormulaState) => {
    let tokenCount = 0
    const nextDelay = () => (tokenCount++) * 0.13
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={3} baseHighlighted={baseHighlighted} argColor={arg1Color} />
            </Token>
            <Token delay={nextDelay()}>
                <span data-marker="plus" className="text-[#F2F7FB]">+</span>
            </Token>
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={5} baseHighlighted={baseHighlighted} argColor={arg2Color} />
            </Token>
            {showRightSide && (
                <>
                    <Token delay={nextDelay()}><Plain>=</Plain></Token>
                    <Token delay={nextDelay()}>
                        <span className="inline-flex items-baseline whitespace-nowrap">
                            <Plain>log</Plain>
                            <sub className="ml-0.5">
                                <NumSticker value={2} color={BASE_COLOR} small />
                            </sub>
                            {showProduct && (
                                <span className="ml-1 inline-flex items-baseline gap-1 whitespace-nowrap">
                                    <Plain>(</Plain>
                                    {arg1Color ? <NumSticker value={3} color={arg1Color} /> : <Plain>3</Plain>}
                                    <span data-marker="multiply" className="text-[#F2F7FB]">·</span>
                                    {arg2Color ? <NumSticker value={5} color={arg2Color} /> : <Plain>5</Plain>}
                                    <Plain>)</Plain>
                                </span>
                            )}
                        </span>
                    </Token>
                </>
            )}
            {showResult && (
                <>
                    <Token delay={nextDelay()}><Plain>=</Plain></Token>
                    <Token delay={nextDelay()}>
                        <motion.span
                            initial={{ scale: 2.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                            style={{ color: CORRECT_COLOR }}
                        >
                            15
                        </motion.span>
                    </Token>
                </>
            )}
        </div>
    )
}

// Печатаемая строка объяснения, где в конце — не цветное слово, а
// НАСТОЯЩИЙ числовой стикер (тот же NumSticker, что и в самой формуле) —
// по прямой просьбе пользователя ("эту 2 надо сделать в виде стикера").
// Структура — та же, что у TypedKeyPhraseLine (WalkthroughLog.tsx): типим
// целиком обычным текстом, после завершения печати заменяем число на
// стикер.
const TypedLineWithSticker = ({
    before, stickerValue, stickerColor, after = '', onSettled,
}: {
    before: string; stickerValue: number; stickerColor: string; after?: string; onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={`${before}${stickerValue}${after}`}
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {before}
                    <NumSticker value={stickerValue} color={stickerColor} />
                    {after}
                </>
            )}
        </div>
    )
}

// Финальная строка "Ответ: log₂15" — по прямой просьбе пользователя
// вместо арифметического пересказа ("3·5=15, поэтому..."). "Ответ:"
// печатается как обычный текст, сама формула справа — статичная (без
// анимации подстановки, результат уже показан построчно выше в самой
// диаграмме) зелёным (цвет "верно" по всему проекту).
const AnswerLine = ({ onSettled }: { onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB] flex items-baseline gap-2 flex-wrap">
            {!typed ? (
                <Typewriter text="Ответ:" onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 400) }} />
            ) : (
                <>
                    <span>Ответ:</span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                        className="inline-flex items-baseline font-extrabold text-lg md:text-xl"
                        style={{ color: CORRECT_COLOR }}
                    >
                        log<sub className="ml-0.5">2</sub><span className="ml-0.5">15</span>
                    </motion.span>
                </>
            )}
        </div>
    )
}

// Кривая стрелка от "+" (левая часть — складываем логарифмы) к "·"
// (правая часть — аргументы перемножаются) — по прямой просьбе
// пользователя, показывает "сумма превращается в умножение" наглядно, не
// только словами. Позиции обоих концов измеряются по факту отрисовки
// (data-marker), а не считаются аналитически — формула это обычный HTML
// в потоке текста, не SVG с известной геометрией, поэтому живое измерение
// здесь единственный вариант (в отличие от зум-эффектов SVG-диаграмм, где
// проект принципиально требует аналитический расчёт, см. CLAUDE.md, —
// там причина не работать с getBBox была в ИСКАЖЕНИИ от bounce-анимации
// детей; здесь измеряем ПОСЛЕ того, как токены/стикеры уже осели).
const ArgumentsArrow = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const [d, setD] = useState<string | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const plusEl = container.querySelector<HTMLElement>('[data-marker="plus"]')
            const mulEl = container.querySelector<HTMLElement>('[data-marker="multiply"]')
            if (!plusEl || !mulEl) return
            const cRect = container.getBoundingClientRect()
            const pRect = plusEl.getBoundingClientRect()
            const mRect = mulEl.getBoundingClientRect()
            const x1 = pRect.left + pRect.width / 2 - cRect.left
            const y1 = pRect.top - cRect.top
            const x2 = mRect.left + mRect.width / 2 - cRect.left
            const y2 = mRect.top - cRect.top
            const midX = (x1 + x2) / 2
            const midY = Math.min(y1, y2) - 34
            setD(`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`)
        }
        // Ждём, пока каскад токенов (Token, ~0.13с шаг) и bounce стикеров
        // осядут, прежде чем измерять реальные позиции.
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id="logwalk-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={ATTENTION_COLOR} />
                </marker>
            </defs>
            <motion.path
                d={d}
                stroke={ATTENTION_COLOR}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                markerEnd="url(#logwalk-arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

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
    // Конфетти на финальный "Ответ: log₂15" (шаг 4 обучающей части) — по
    // прямой просьбе пользователя, во ВСЕХ таких "локальных ответах"
    // разбора (см. LocalAnswerConfetti). Отдельная конфетти на верный
    // ответ ТРЕНИРОВОЧНОГО задания — см. handleOptionClick ниже.
    const [showAnswerConfetti, setShowAnswerConfetti] = useState(false)

    // Контейнер шага 3 (аргументы 3/5) — нужен ArgumentsArrow, чтобы
    // измерить реальные позиции "+" и "·" внутри него (см. компонент выше).
    const step3Ref = useRef<HTMLDivElement>(null)

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

    // Счётчики "повторов" — нужны, чтобы "назад" (см. handleBack ниже)
    // мог ПЕРЕМОНТИРОВАТЬ содержимое целевой сцены (Typewriter/
    // DiagramBlock/NumSticker заново проигрывают анимацию), не трогая
    // остальные — тот же общий хук, что и в SINWALK.
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — та же схема ключей, что и в SINWALK.
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            return idx > 0 ? `trial-${idx - 1}` : `step-${INTRO_STEPS - 1}`
        }
        if (key.startsWith('step-')) {
            const idx = Number(key.slice('step-'.length))
            return idx > 0 ? `step-${idx - 1}` : null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null

    // "Назад" — реальный откат на предыдущую сцену (не просто "полистать
    // взглядом"): состояние step/trialIndex/phase откатывается на target,
    // answer этой сцены сбрасывается, nonce цели бампается (её содержимое
    // ПЕРЕМОНТИРУЕТСЯ). Сцены ПОСЛЕ target сами исчезают из DOM.
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setTrialAnswers((prev) => { const next = [...prev]; next[idx] = null; return next })
        } else if (target.startsWith('step-')) {
            const idx = Number(target.slice('step-'.length))
            setPhase('intro')
            setStep(idx)
            setStepReady(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто условие, без текстовой подписи (по прямой
                    просьбе пользователя убрана целиком). stepReady включает
                    сама диаграмма (DiagramBlock.onSettled), раз текста
                    печатать больше не нужно. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <ExampleFormula baseHighlighted={false} showRightSide={false} showProduct={false} showResult={false} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — основания (двойки) становятся стикерами;
                    "2" в тексте объяснения — тоже настоящий стикер. */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock><ExampleFormula baseHighlighted showRightSide={false} showProduct={false} showResult={false} /></DiagramBlock>
                            <TypedLineWithSticker
                                before="Заметим что у них одинаковое основание - это "
                                stickerValue={2}
                                stickerColor={BASE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — справа дописывается "= log₂", то же основание. */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock><ExampleFormula baseHighlighted showRightSide showProduct={false} showResult={false} /></DiagramBlock>
                            <TypedLineWithSticker
                                before="Поэтому получится логарифм с тем же основанием "
                                stickerValue={2}
                                stickerColor={BASE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — аргументы 3 и 5 РАЗНЫМИ цветами, стрелка от "+"
                    к "·" (сумма превращается в произведение). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                <div ref={step3Ref} className="relative w-full">
                                    <ExampleFormula baseHighlighted arg1Color={ARG_COLOR_X} arg2Color={ARG_COLOR_Y} showRightSide showProduct showResult={false} />
                                    <ArgumentsArrow containerRef={step3Ref} />
                                </div>
                            </DiagramBlock>
                            <TypedKeyPhraseLine
                                before="Так как логарифмы складываются, то аргументы надо "
                                phrase="перемножить"
                                color={ATTENTION_COLOR}
                                highlight
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — итог. По прямой просьбе пользователя ВСЯ формула
                    здесь больше НЕ перерисовывается заново (это уже
                    показано в шаге 3 выше) — просто короткий "Ответ:
                    log₂15", с конфетти в момент появления. */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <AnswerLine onSettled={() => { setStepReady(true); setShowAnswerConfetti(true) }} />
                            {showAnswerConfetti && <LocalAnswerConfetti />}
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const answer = trialAnswers[i]
                    const correctValue = t.x * t.y
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
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
                                    Выбери правильный ответ:
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
                            {/* Конфетти на верный ответ ТРЕНИРОВОЧНОГО
                                задания — только пока это ТЕКУЩЕЕ задание
                                (isCurrent), поэтому естественно
                                размонтируется, как только переходим к
                                следующему (см. LocalAnswerConfetti). */}
                            {isCurrent && isDone && answer === correctValue && <LocalAnswerConfetti />}
                        </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= trials.length && trialAnswers[trialIndex] === currentCorrectValue ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни на число выше</p>
            )}
        </div>
    )
}
