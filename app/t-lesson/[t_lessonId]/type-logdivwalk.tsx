// app/t-lesson/[t_lessonId]/type-logdivwalk.tsx
//
// Тип LOGDIVWALK — интерактивный разбор по шагам "деление логарифмов"
// (log_a x / log_a y = log_y x, при одинаковом основании a) — тот же
// самодостаточный принцип, что у SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK/
// LOGPOWWALK/LOGSWAPWALK: компонент сам ведёт хореографию, зовёт
// onAnswer/onComplete РОВНО один раз в конце; общая нижняя кнопка скрыта.
//
// Сюжет — прямая инструкция пользователя, на фиксированном примере
// log₂9 / log₂3 = log₃9:
// 0. "log₂9 / log₂3 = ?" — просто условие (дробь: log₂9 сверху, log₂3
//    снизу).
// 1. "Заметим — у числителя и знаменателя одинаковые основания." — обе
//    двойки (основания) становятся стикерами ОДНОГО цвета.
// 2. "Одинаковые основания сокращаются — вычёркиваем log₂ сверху и
//    снизу." — диагональная зачёркивающая линия ТОГО ЖЕ цвета поверх
//    "log₂" в числителе И в знаменателе (сами 9 и 3 остаются нетронуты).
// 3. "Получится: log₃9." — итоговое выражение (то, что осталось внизу —
//    3 — становится новым основанием; то, что осталось наверху — 9 —
//    новым аргументом).
//
// После разбора — тренировочные задания с НОВЫМИ случайными числами
// (log_a x / log_a y = ?), нужно кликнуть верную формулу-ответ среди 4
// вариантов (дистракторы — перепутанные числа местами, не применённое
// правило, ошибка на 1) — тот же формат клика по варианту, что у
// LOGPOWWALK/LOGSWAPWALK.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWalkthroughWrongLabel, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, CORRECT_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Фиксированный обучающий пример — ровно тот, что дал пользователь.
const EX = { a: 2, x: 9, y: 3 }

const INTRO_STEPS = 5
const TRIAL_COUNT = 4

// Основание (обе "2") и зачёркивающая линия — ОДИН цвет (та же роль, что
// у BASE_COLOR в LOGSUBWALK/LOGWALK — "основание" всегда синее).
const BASE_COLOR = GGEGE_PALETTE.blue.button
// Аргументы (9 — числитель, 3 — знаменатель) на сцене "сборки" нового
// логарифма (шаг 3) получают СВОИ цвета — тот же приём ARG_COLOR_X/
// ARG_COLOR_Y, что уже используется в LOGWALK для x/y — нужно, чтобы
// глазом прослеживалось, куда именно уезжает каждое число.
const ARG_COLOR_X = GGEGE_PALETTE.teal.button
const ARG_COLOR_Y = GGEGE_PALETTE.raspberry.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина,
// что и в LOGSUBWALK/LOGSWAPWALK). =====

const NumSticker = ({ value, color, small = false }: { value: number | string; color: string; small?: boolean }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className={cn(
            'inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle',
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

const QuestionMark = () => <span style={{ color: ACTIVE_COLOR }} className="font-black">?</span>

// "log_base(arg)" — базовое слагаемое. baseColor задаёт цвет стикера
// основания (undefined = обычный текст). strikeMarker, если задан, вешает
// data-marker НА ОБЁРТКУ "log"+основание (не на аргумент — он должен
// остаться нетронутым) для последующего измерения StrikeThrough.
const LogTerm = ({
    base, arg, baseColor, strikeMarker,
}: { base: number; arg: number; baseColor?: string; strikeMarker?: string }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <span data-marker={strikeMarker} className="inline-flex items-baseline">
            <Plain>log</Plain>
            <sub className="ml-0.5">
                {baseColor ? <NumSticker value={base} color={baseColor} small /> : <Plain>{base}</Plain>}
            </sub>
        </span>
        <span className="ml-1"><Plain>{arg}</Plain></span>
    </span>
)

// Диагональная зачёркивающая линия поверх элемента с data-marker=marker —
// та же техника измерения по факту отрисовки (containerRef+querySelector),
// что и у TravelArrow/ArgumentsArrow в LOGPOWWALK/LOGSUBWALK.
const StrikeThrough = ({
    containerRef, marker, color,
}: { containerRef: React.RefObject<HTMLDivElement | null>; marker: string; color: string }) => {
    const [d, setD] = useState<string | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const el = container.querySelector<HTMLElement>(`[data-marker="${marker}"]`)
            if (!el) return
            const cRect = container.getBoundingClientRect()
            const eRect = el.getBoundingClientRect()
            const pad = 3
            const x1 = eRect.left - cRect.left - pad
            const y1 = eRect.bottom - cRect.top + pad
            const x2 = eRect.right - cRect.left + pad
            const y2 = eRect.top - cRect.top - pad
            setD(`M ${x1} ${y1} L ${x2} ${y2}`)
        }
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <motion.path
                d={d}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

// "Уголок" (elbow/orthogonal-connector) со скруглёнными углами — та же
// функция, что уже используется в LOGPOWWALK/LOGSWAPWALK (копия, у этого
// семейства файлов нет общего экспорта — каждый несёт свою).
function buildElbowPath(x1: number, y1: number, x2: number, y2: number, bridgeY: number, radius = 10): string {
    const vDir1 = bridgeY < y1 ? -1 : 1
    const vDir2 = y2 < bridgeY ? -1 : 1
    const hDir = x2 >= x1 ? 1 : -1
    const rV1 = Math.min(radius, Math.abs(bridgeY - y1))
    const rH = Math.min(radius, Math.abs(x2 - x1) / 2)
    const rV2 = Math.min(radius, Math.abs(y2 - bridgeY))

    const p2 = `${x1} ${bridgeY - vDir1 * rV1}`
    const p3 = `${x1 + hDir * rH} ${bridgeY}`
    const p4 = `${x2 - hDir * rH} ${bridgeY}`
    const p5 = `${x2} ${bridgeY + vDir2 * rV2}`

    return `M ${x1} ${y1} L ${p2} Q ${x1} ${bridgeY} ${p3} L ${p4} Q ${x2} ${bridgeY} ${p5} L ${x2} ${y2}`
}

// Однонаправленная стрелка между data-marker'ами — та же техника
// (measure-by-DOM + якорь по грани, откуда линия реально уходит/приходит,
// не всегда верх), что уже применена в LOGPOWWALK. curve='up' — мост выше
// обоих концов (пара "числитель", физически выше строки), curve='down' —
// мост ниже обоих концов (пара "знаменатель").
const TravelArrow = ({
    containerRef, fromMarker, toMarker, color, curve,
}: { containerRef: React.RefObject<HTMLDivElement | null>; fromMarker: string; toMarker: string; color: string; curve: 'up' | 'down' }) => {
    const [d, setD] = useState<string | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const fromEl = container.querySelector<HTMLElement>(`[data-marker="${fromMarker}"]`)
            const toEl = container.querySelector<HTMLElement>(`[data-marker="${toMarker}"]`)
            if (!fromEl || !toEl) return
            const cRect = container.getBoundingClientRect()
            const fRect = fromEl.getBoundingClientRect()
            const tRect = toEl.getBoundingClientRect()
            const x1 = fRect.left + fRect.width / 2 - cRect.left
            const x2 = tRect.left + tRect.width / 2 - cRect.left
            const y1 = (curve === 'up' ? fRect.top : fRect.bottom) - cRect.top
            const y2 = (curve === 'up' ? tRect.top : tRect.bottom) - cRect.top
            const bridgeY = curve === 'up' ? Math.min(y1, y2) - 26 : Math.max(y1, y2) + 26
            setD(buildElbowPath(x1, y1, x2, y2, bridgeY))
        }
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    const markerId = `logdivwalk-arrowhead-${fromMarker}`
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                </marker>
            </defs>
            <motion.path
                d={d}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#${markerId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

// Дробь "log_a x / log_a y = ?" — основной вид условия на шагах 0-2.
// baseColor/strike применяются к ОБОИМ основаниям сразу (они всегда
// подсвечиваются/зачёркиваются парой, не по отдельности).
const FullExpression = ({
    baseColor, strike, containerRef,
}: { baseColor?: string; strike?: boolean; containerRef: React.RefObject<HTMLDivElement> }) => (
    <div ref={containerRef} className="relative w-full flex items-center justify-center gap-3 flex-wrap text-2xl md:text-3xl font-extrabold py-2">
        <span className="inline-flex flex-col items-center leading-none">
            <span className="pb-2 border-b-2 border-[#F2F7FB]/70 px-2">
                <LogTerm base={EX.a} arg={EX.x} baseColor={baseColor} strikeMarker={strike ? 'log-num' : undefined} />
            </span>
            <span className="pt-2 px-2">
                <LogTerm base={EX.a} arg={EX.y} baseColor={baseColor} strikeMarker={strike ? 'log-den' : undefined} />
            </span>
        </span>
        <Plain>=</Plain>
        <QuestionMark />
        {strike && (
            <>
                <StrikeThrough containerRef={containerRef} marker="log-num" color={baseColor ?? BASE_COLOR} />
                <StrikeThrough containerRef={containerRef} marker="log-den" color={baseColor ?? BASE_COLOR} />
            </>
        )}
    </div>
)

// Шаг "сборки" нового логарифма — повторяет ЗАЧЁРКНУТУЮ дробь (log₂
// сверху и снизу, как на шаге 2), но теперь числа-аргументы (9 и 3) ТОЖЕ
// стикеры, и правее рисуется "= log₃(9)" стикерами тех же цветов. Угловые
// стрелки 9→9 и 3→3 показывают, что новый логарифм СОБРАН из тех же
// самых чисел, просто в новой роли — по прямой просьбе пользователя
// ("чтобы понятно было, как собрался новый логарифм").
const AssembleExpression = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => (
    <div ref={containerRef} className="relative w-full flex items-center justify-center gap-3 flex-wrap text-2xl md:text-3xl font-extrabold py-2 pt-10 pb-12">
        <span className="inline-flex flex-col items-center leading-none">
            <span className="pb-2 border-b-2 border-[#F2F7FB]/70 px-2">
                <span data-marker="log-num" className="inline-flex items-baseline">
                    <Plain>log</Plain>
                    <sub className="ml-0.5"><NumSticker value={EX.a} color={BASE_COLOR} small /></sub>
                </span>
                <span className="ml-1" data-marker="left-x"><NumSticker value={EX.x} color={ARG_COLOR_X} small /></span>
            </span>
            <span className="pt-2 px-2">
                <span data-marker="log-den" className="inline-flex items-baseline">
                    <Plain>log</Plain>
                    <sub className="ml-0.5"><NumSticker value={EX.a} color={BASE_COLOR} small /></sub>
                </span>
                <span className="ml-1" data-marker="left-y"><NumSticker value={EX.y} color={ARG_COLOR_Y} small /></span>
            </span>
        </span>
        <Plain>=</Plain>
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain>
            <sub className="ml-0.5" data-marker="right-y"><NumSticker value={EX.y} color={ARG_COLOR_Y} small /></sub>
            <span className="ml-1" data-marker="right-x"><NumSticker value={EX.x} color={ARG_COLOR_X} small /></span>
        </span>
        <StrikeThrough containerRef={containerRef} marker="log-num" color={BASE_COLOR} />
        <StrikeThrough containerRef={containerRef} marker="log-den" color={BASE_COLOR} />
        <TravelArrow containerRef={containerRef} fromMarker="left-x" toMarker="right-x" color={ARG_COLOR_X} curve="up" />
        <TravelArrow containerRef={containerRef} fromMarker="left-y" toMarker="right-y" color={ARG_COLOR_Y} curve="down" />
    </div>
)

// Финальная строка "Получится: log₃9" — та же структура, что у AnswerLine
// в LOGSUBWALK/LOGWALK.
const ResultLine = ({ onSettled }: { onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB] flex items-baseline gap-2 flex-wrap">
            {!typed ? (
                <Typewriter text="Получится:" onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 400) }} />
            ) : (
                <>
                    <span>Получится:</span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                        className="inline-flex items-baseline font-extrabold text-lg md:text-xl"
                        style={{ color: CORRECT_COLOR }}
                    >
                        log<sub className="ml-0.5">{EX.y}</sub><span className="ml-0.5">{EX.x}</span>
                    </motion.span>
                </>
            )}
        </div>
    )
}

// ===== Тренировочные задания — новые случайные (a, x, y) — нужно
// кликнуть верную формулу log_y(x) среди 4 вариантов. =====

type LogOption = { base: number; arg: number }
type DivTrial = { a: number; x: number; y: number; options: LogOption[] }

const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (p: LogOption, q: LogOption) => p.base === q.base && p.arg === q.arg

// Дистракторы — правдоподобные ошибки школьника: (1) перепутал местами
// (принял числитель/знаменатель не за те роли), (2) не применил правило
// вообще — оставил как в числителе, (3) ошибся на 1 в аргументе.
function makeOptions(a: number, x: number, y: number): LogOption[] {
    const correct: LogOption = { base: y, arg: x }
    const candidates: LogOption[] = [
        { base: x, arg: y },
        { base: a, arg: x },
        { base: y, arg: x + 1 },
    ]
    const chosen: LogOption[] = [correct]
    for (const cand of candidates) {
        if (!chosen.some((c) => sameOption(c, cand))) chosen.push(cand)
    }
    let extraShift = 2
    while (chosen.length < 4) {
        const extra: LogOption = { base: y, arg: x + extraShift }
        if (!chosen.some((c) => sameOption(c, extra))) chosen.push(extra)
        extraShift++
    }
    return shuffle(chosen)
}

const makeTrial = (prev: DivTrial | null): DivTrial => {
    let t: DivTrial
    let guard = 0
    do {
        const a = pick(NUM_POOL)
        let x = pick(NUM_POOL)
        while (x === a) x = pick(NUM_POOL)
        let y = pick(NUM_POOL)
        while (y === a || y === x) y = pick(NUM_POOL)
        t = { a, x, y, options: makeOptions(a, x, y) }
        guard++
    } while (prev && t.a === prev.a && t.x === prev.x && t.y === prev.y && guard < 8)
    return t
}

const makeTrials = (n: number): DivTrial[] => {
    const out: DivTrial[] = []
    let prev: DivTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

const pickTrialFeedback = (t: DivTrial): string => {
    const seed = t.a * 7 + t.x * 5 + t.y * 3
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Дробь тренировочного задания — без стикеров/зачёркивания, только числа.
const TrialFraction = ({ a, x, y }: { a: number; x: number; y: number }) => (
    <div className="w-full flex items-center justify-center gap-3 flex-wrap text-2xl md:text-3xl font-extrabold py-2">
        <span className="inline-flex flex-col items-center leading-none">
            <span className="pb-2 border-b-2 border-[#F2F7FB]/70 px-2">
                <LogTerm base={a} arg={x} />
            </span>
            <span className="pt-2 px-2">
                <LogTerm base={a} arg={y} />
            </span>
        </span>
        <Plain>=</Plain>
        <QuestionMark />
    </div>
)

// Кнопка-вариант — компактная формула "log_base(arg)". Нативные sub —
// статичная кнопка, не анимированная сцена, лишний измерительный
// компонент не нужен.
const MiniAnswerButton = ({
    option, onClick, disabled, state,
}: { option: LogOption; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex items-center justify-center py-3 px-3 rounded-xl border-2 text-base md:text-lg font-bold transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        <span className="inline-flex items-baseline whitespace-nowrap">
            log<sub className="ml-0.5">{option.base}</sub><span className="ml-0.5">{option.arg}</span>
        </span>
    </button>
)

export const TypeLogDivWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<DivTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [trialAnswers, setTrialAnswers] = useState<(LogOption | null)[]>(Array(TRIAL_COUNT).fill(null))
    const [checked, setChecked] = useState(false)

    // Контейнеры каждой сцены с формулой — FullExpression сама решает,
    // нужно ли что-то измерять внутри (зачёркивание — только на шаге 2).
    const step0Ref = useRef<HTMLDivElement>(null)
    const step1Ref = useRef<HTMLDivElement>(null)
    const step2Ref = useRef<HTMLDivElement>(null)
    const step3Ref = useRef<HTMLDivElement>(null)

    const currentCorrectOption: LogOption = { base: trials[trialIndex].y, arg: trials[trialIndex].x }

    const handleOptionClick = (option: LogOption) => {
        if (checked) return
        const next = [...trialAnswers]
        next[trialIndex] = option
        setTrialAnswers(next)
        setChecked(true)
        if (sameOption(option, currentCorrectOption)) {
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            setHadMistake(true)
            setTrialNextLabel(pickWalkthroughWrongLabel('Дальше'))
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const answer = trialAnswers[trialIndex]
            const wasLastCorrect = !!answer && sameOption(answer, currentCorrectOption)
            const isLastInList = trialIndex + 1 >= trials.length
            if (isLastInList) {
                if (wasLastCorrect) {
                    setAdvancing(false)
                    const isFullyCorrect = !hadMistake
                    onComplete(isFullyCorrect)
                    onAnswer(isFullyCorrect ? 'right' : 'wrong')
                    return
                }
                // Ошибка на последнем по счёту задании — добавляем ещё
                // одно (тот же приём, что у LOGSUBWALK/LOGPOWWALK).
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

    // trialNextLabel выставляется ПРЯМО в handleOptionClick (не эффектом
    // на trialIndex) — её тон зависит от того, верно ли ответили сейчас.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const { bump: bumpNonce, nonceFor } = useReplayNonces()

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
                {/* Шаг 0 — просто условие, без текста. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <FullExpression containerRef={step0Ref} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — оба основания (двойки) становятся стикерами
                    ОДНОГО цвета. */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                <FullExpression baseColor={BASE_COLOR} containerRef={step1Ref} />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Заметим — у числителя и знаменателя одинаковые основания."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — одинаковые основания сокращаются: log₂
                    зачёркивается и сверху, и снизу (9 и 3 остаются). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                <FullExpression baseColor={BASE_COLOR} strike containerRef={step2Ref} />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Одинаковые основания сокращаются — вычёркиваем log₂ сверху и снизу."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — сборка нового логарифма: та же зачёркнутая дробь,
                    но 9 и 3 теперь тоже стикеры, справа "= log₃(9)", и
                    угловые стрелки 9→9, 3→3 показывают, откуда взялись
                    аргумент и основание нового логарифма. */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                <AssembleExpression containerRef={step3Ref} />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Оставшееся наверху число становится новым аргументом, оставшееся внизу — новым основанием."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — итог: "Получится: log₃9." */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <ResultLine onSettled={() => setStepReady(true)} />
                            <LocalAnswerConfetti />
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const answer = trialAnswers[i]
                    const correctOption: LogOption = { base: t.y, arg: t.x }
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                            {i === 0 && (
                                <div className="w-full flex items-center gap-3" aria-hidden>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                </div>
                            )}
                            <div className="relative w-full flex items-center justify-center">
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
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
                                <p className="text-base md:text-lg text-[#F2F7FB] text-center">
                                    Выбери правильный ответ:
                                </p>
                            </div>
                            <DiagramBlock>
                                <TrialFraction a={t.a} x={t.x} y={t.y} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <div className="grid grid-cols-2 gap-3">
                                    {t.options.map((opt, oi) => (
                                        <MiniAnswerButton key={oi} option={opt} state="idle" onClick={() => handleOptionClick(opt)} />
                                    ))}
                                </div>
                            )}
                            {isDone && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => (
                                            <MiniAnswerButton
                                                key={oi}
                                                option={opt}
                                                disabled
                                                state={sameOption(opt, correctOption) ? 'correct' : (answer && sameOption(answer, opt) ? 'wrong' : 'idle')}
                                            />
                                        ))}
                                    </div>
                                    <div
                                        className={cn(
                                            'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                            (answer && sameOption(answer, correctOption)) ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                        )}
                                    >
                                        {(answer && sameOption(answer, correctOption)) ? pickTrialFeedback(t) : `Неверно — правильный ответ log${correctOption.base}(${correctOption.arg}).`}
                                    </div>
                                </>
                            )}
                            {isCurrent && isDone && answer && sameOption(answer, correctOption) && <LocalAnswerConfetti />}
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
                        {trialIndex + 1 >= trials.length && trialAnswers[trialIndex] && sameOption(trialAnswers[trialIndex]!, currentCorrectOption) ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант выше</p>
            )}
        </div>
    )
}
