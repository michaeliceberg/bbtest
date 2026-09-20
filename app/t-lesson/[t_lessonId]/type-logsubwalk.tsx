// app/t-lesson/[t_lessonId]/type-logsubwalk.tsx
//
// Тип LOGSUBWALK — интерактивный разбор по шагам "как вычитать логарифмы"
// (тренажёр "Логарифмы", урок 3 темы) — буквальная копия LOGWALK (см.
// type-logwalk.tsx, "как складывать логарифмы"), переделанная под
// разность: те же шаги, тот же визуальный язык (стикеры/каскадные
// токены/стрелка/накопительный лог), только операция и пример другие —
// по прямой просьбе пользователя. Тот же самодостаточный принцип, что у
// SINWALK/LOGWALK/LOGDEFWALK: компонент сам ведёт хореографию, зовёт
// onAnswer/onComplete РОВНО один раз в конце; общая нижняя кнопка скрыта.
//
// Сюжет — тот же порядок шагов, что у LOGWALK, на ОБРАТНОМ примере
// (log₂15 - log₂5 = log₂3 — та же тройка чисел 2/3/5/15, что и в LOGWALK,
// просто в обратную сторону: 3·5=15 там, 15÷5=3 здесь):
// 1. Пишем крупно "log₂15 - log₂5 =" — просто условие.
// 2. Обводим ОБА основания (двойки) как стикер — одинаковое основание.
// 3. Дописываем справа "= log₂" — то же основание.
// 4. Обводим аргументы 15 и 5 РАЗНЫМИ цветами — стрелка от "-" слева к
//    "÷" справа показывает "разность превращается в частное".
//    "= log₂(15÷5)".
// 5. Считаем: "Ответ: log₂3".
//
// После разбора — тренировочные задания с НОВЫМИ случайными числами
// (log_a x - log_a y = log_a ?, x кратно y), нужно кликнуть верное число
// среди вариантов — тот же формат, что у LOGWALK.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedKeyPhraseLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, WRONG_COLOR, CORRECT_COLOR, ATTENTION_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Пауза ПОСЛЕ клика "Дальше", ДО начала новой сцены — тот же приём и то
// же значение, что у LOGWALK/SINWALK.
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const INTRO_STEPS = 5
const TRIAL_COUNT = 4

// Те же роли/цвета, что и в LOGWALK — основание синим, оба аргумента
// РАЗНЫМИ цветами (не один общий).
const BASE_COLOR = GGEGE_PALETTE.blue.button
const ARG_COLOR_X = GGEGE_PALETTE.teal.button
const ARG_COLOR_Y = GGEGE_PALETTE.raspberry.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки формулы (HTML+CSS, без KaTeX — та же
// причина, что и в LOGWALK). =====

const NumSticker = ({ value, color, small = false }: { value: number; color: string; small?: boolean }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className={cn(
            'inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle',
            // leading-none ПОСЛЕ text-[...] — см. тот же комментарий в
            // type-logwalk.tsx про tailwind-merge конфликт-группу.
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

// Каскадное появление токенов формулы — тот же приём, что и в LOGWALK.
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

// baseMarker — data-marker на <sub>, нужен BaseMatchArrow (см. ниже) для
// измерения реальной позиции этого основания — тот же приём, что в
// LOGWALK.
const LogTerm = ({
    base, arg, baseHighlighted, argColor, baseMarker,
}: {
    base: number; arg: number; baseHighlighted: boolean; argColor?: string; baseMarker?: string
}) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5" data-marker={baseMarker}>
            {baseHighlighted ? <NumSticker value={base} color={BASE_COLOR} small /> : <Plain>{base}</Plain>}
        </sub>
        <span className="ml-1">
            {argColor ? <NumSticker value={arg} color={argColor} /> : <Plain>{arg}</Plain>}
        </span>
    </span>
)

type FormulaState = {
    baseHighlighted: boolean
    // Цвет аргумента 15/5 — РАЗНЫЙ для каждого, undefined до подсветки.
    arg1Color?: string
    arg2Color?: string
    showRightSide: boolean
    showQuotient: boolean
    showResult: boolean
}

// Полная строка примера "log₂15 - log₂5 [= log₂(15÷5) [= 3]]" — тот же
// накопительный приём, что у LOGWALK. data-marker="minus"/"divide" —
// точки для стрелки на шаге 3 (см. ArgumentsArrow).
const ExampleFormula = ({ baseHighlighted, arg1Color, arg2Color, showRightSide, showQuotient, showResult }: FormulaState) => {
    let tokenCount = 0
    const nextDelay = () => (tokenCount++) * 0.13
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={15} baseHighlighted={baseHighlighted} argColor={arg1Color} baseMarker="base1" />
            </Token>
            <Token delay={nextDelay()}>
                <span data-marker="minus" className="text-[#F2F7FB]">−</span>
            </Token>
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={5} baseHighlighted={baseHighlighted} argColor={arg2Color} baseMarker="base2" />
            </Token>
            {showRightSide && (
                <>
                    <Token delay={nextDelay()}><Plain>=</Plain></Token>
                    <Token delay={nextDelay()}>
                        <span className="inline-flex items-baseline whitespace-nowrap">
                            <Plain>log</Plain>
                            <sub className="ml-0.5" data-marker="base3">
                                <NumSticker value={2} color={BASE_COLOR} small />
                            </sub>
                            {showQuotient && (
                                <span className="ml-1 inline-flex items-baseline gap-1 whitespace-nowrap">
                                    <Plain>(</Plain>
                                    {arg1Color ? <NumSticker value={15} color={arg1Color} /> : <Plain>15</Plain>}
                                    <span data-marker="divide" className="text-[#F2F7FB]">÷</span>
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
                            3
                        </motion.span>
                    </Token>
                </>
            )}
        </div>
    )
}

// Печатаемая строка с числовым стикером в конце — та же структура, что в
// LOGWALK.
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

// Финальная строка "Ответ: log₂3" — та же структура, что у LOGWALK.
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
                        log<sub className="ml-0.5">2</sub><span className="ml-0.5">3</span>
                    </motion.span>
                </>
            )}
        </div>
    )
}

// Зазор между якорной точкой стрелки и реальным краем элемента — SVG-
// маркер наконечника (markerWidth=8, refX=6) физически выступает за
// path-координату конца линии на ~5-6px В НАПРАВЛЕНИИ движения; без
// отступа наконечник залезает НА элемент (класс бага, найденный
// пользователем — "стрелка залезает на цифры со стикерами").
const ARROW_TIP_GAP = 8

// Кривая стрелка от "-" (левая часть — вычитаем логарифмы) к "÷" (правая
// часть — аргументы делятся) — та же техника измерения по факту отрисовки
// (data-marker), что и в LOGWALK, только markers "minus"/"divide".
const ArgumentsArrow = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const [d, setD] = useState<string | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const minusEl = container.querySelector<HTMLElement>('[data-marker="minus"]')
            const divideEl = container.querySelector<HTMLElement>('[data-marker="divide"]')
            if (!minusEl || !divideEl) return
            const cRect = container.getBoundingClientRect()
            const pRect = minusEl.getBoundingClientRect()
            const mRect = divideEl.getBoundingClientRect()
            const x1 = pRect.left + pRect.width / 2 - cRect.left
            const y1 = pRect.top - cRect.top - ARROW_TIP_GAP
            const x2 = mRect.left + mRect.width / 2 - cRect.left
            const y2 = mRect.top - cRect.top - ARROW_TIP_GAP
            const midX = (x1 + x2) / 2
            const midY = Math.min(y1, y2) - 34
            setD(`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`)
        }
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id="logsubwalk-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={ATTENTION_COLOR} />
                </marker>
            </defs>
            <motion.path
                d={d}
                stroke={ATTENTION_COLOR}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                markerEnd="url(#logsubwalk-arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

// "Уголок" (elbow/orthogonal-connector) со скруглёнными углами — та же
// техника, что уже применена в LOGPOWWALK/LOGSWAPWALK/LOGDIVWALK/LOGWALK
// (buildElbowPath, скругление — квадратичная кривая через саму угловую
// точку как control point).
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

// Угловая стрелка(и) ПОД формулой, показывающая, что 2 (или 3) основания —
// ОДНО И ТО ЖЕ число — та же техника, что у BaseMatchArrow в type-logwalk.tsx
// (см. там подробный комментарий), только markers "base1"/"base2"/"base3"
// здесь принадлежат "log₂15 − log₂5 [= log₂...]". Один общий мост НИЖЕ
// всех оснований, наконечник на ОБОИХ концах основного пути (markerStart
// с orient="auto-start-reverse", тот же приём, что у DoubleArrow в
// LOGSWAPWALK); для СРЕДНЕЙ (не крайней) точки — отдельный прямой
// вертикальный "отвод" от моста со своим наконечником. Якорь на каждом
// основании — НИЖНИЙ край (мост идёт СНИЗУ формулы).
const BaseMatchArrow = ({
    containerRef, markers, color,
}: { containerRef: React.RefObject<HTMLDivElement | null>; markers: string[]; color: string }) => {
    const [paths, setPaths] = useState<{ main: string; branches: string[] } | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const cRect = container.getBoundingClientRect()
            const points = markers
                .map((m) => {
                    const el = container.querySelector<HTMLElement>(`[data-marker="${m}"]`)
                    if (!el) return null
                    const r = el.getBoundingClientRect()
                    return { x: r.left + r.width / 2 - cRect.left, y: r.bottom - cRect.top + ARROW_TIP_GAP }
                })
                .filter((p): p is { x: number; y: number } => p !== null)
                .sort((a, b) => a.x - b.x)
            if (points.length < 2) return
            const bridgeY = Math.max(...points.map((p) => p.y)) + 26
            const first = points[0]
            const last = points[points.length - 1]
            const main = buildElbowPath(first.x, first.y, last.x, last.y, bridgeY)
            const branches = points.slice(1, -1).map((p) => `M ${p.x} ${bridgeY} L ${p.x} ${p.y}`)
            setPaths({ main, branches })
        }
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!paths) return null
    const startId = `logsubwalk-base-arrow-start-${markers.join('-')}`
    const endId = `logsubwalk-base-arrow-end-${markers.join('-')}`
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id={startId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse">
                    <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                </marker>
                <marker id={endId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                </marker>
            </defs>
            <motion.path
                d={paths.main}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerStart={`url(#${startId})`}
                markerEnd={`url(#${endId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
            {paths.branches.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    stroke={color}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    markerEnd={`url(#${endId})`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
                />
            ))}
        </svg>
    )
}

// ===== Тренировочные задания — новые случайные (a, x, y), x КРАТНО y —
// нужно кликнуть верное число (x÷y) среди вариантов. =====

type LogTrial = { a: number; x: number; y: number; q: number; options: number[] }

const A_POOL = [2, 3, 5, 7, 9] as const
const Y_POOL = [2, 3, 4, 5, 6] as const
const Q_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Дистракторы — правдоподобные ошибки школьника (вычел аргументы вместо
// того, чтобы разделить; ошибся на 1 в частном), не случайный шум.
function makeOptions(x: number, y: number, q: number): number[] {
    const correct = q
    const candidates = new Set<number>()
    candidates.add(x - y) // вычел вместо разделил
    candidates.add(q + 1) // ошибся на 1
    candidates.add(q - 1)
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
        const y = pick(Y_POOL)
        const q = pick(Q_POOL)
        const x = y * q
        t = { a, x, y, q, options: makeOptions(x, y, q) }
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

// Похвала за верный ответ — детерминированно из полей задания, та же
// причина, что в LOGWALK.
const pickTrialFeedback = (t: LogTrial): string => {
    const seed = t.a * 7 + t.x * 3 + t.y
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// selected заполняется ТОЛЬКО когда пользователь нашёл верный ответ
// (режим "пробуй, пока не угадаешь"), поэтому цвет при checked=true
// всегда "верно".
const LogTrialFormula = ({
    trial, selected, checked,
}: {
    trial: LogTrial; selected: number | null; checked: boolean
}) => {
    const { a, x, y } = trial
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{x}</Plain></span>
            </span>
            <Plain>−</Plain>
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
                            style={{ color: checked ? CORRECT_COLOR : '#F2F7FB' }}
                        >
                            {selected}
                        </motion.span>
                    )}
                </span>
            </span>
        </div>
    )
}

export const TypeLogSubWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<LogTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" (та же механика, что и у
    // LOGCOMBOWALK/LOGDEFWALK/SINWALK/LOGWALK) — неверно нажатые числа
    // ТЕКУЩЕГО задания красятся красным и блокируются, wrongFlash —
    // ПЕРСИСТЕНТНОЕ сообщение под вариантами (не гаснет по таймеру).
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    // Конфетти на финальный "Ответ: log₂3" — та же причина, что в LOGWALK.
    const [showAnswerConfetti, setShowAnswerConfetti] = useState(false)

    // Контейнеры шагов 1/2 — нужны BaseMatchArrow (см. там же комментарий);
    // шаг 3 (аргументы 15/5) — ArgumentsArrow.
    const step1Ref = useRef<HTMLDivElement>(null)
    const step2Ref = useRef<HTMLDivElement>(null)
    const step3Ref = useRef<HTMLDivElement>(null)

    const currentCorrectValue = trials[trialIndex].q

    const handleOptionClick = (value: number) => {
        if (checked) return
        if (wrongTried.includes(value)) return
        if (value === currentCorrectValue) {
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            setHadMistake(true)
            setWrongTried((prev) => [...prev, value])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isLastInList = trialIndex + 1 >= trials.length
            if (isLastInList) {
                setAdvancing(false)
                const isFullyCorrect = !hadMistake
                onComplete(isFullyCorrect)
                onAnswer(isFullyCorrect ? 'right' : 'wrong')
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
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

    // Подпись кнопки "Дальше" — та же случайная вариативность, после
    // монтирования (не в рендере — избегает SSR/клиент-рассинхрона).
    // trialNextLabel выставляется ПРЯМО в handleOptionClick (не эффектом
    // на trialIndex) — её тон зависит от того, верно ли ответили сейчас.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевой сцены (см. type-sinwalk.tsx/type-logwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — та же схема ключей, что и в LOGWALK/SINWALK.
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
    // "Повторить" — переигрывает анимацию ТЕКУЩЕЙ сцены заново, не трогая
    // состояние (в отличие от handleBack ниже) — та же пара useReplayNonces,
    // что уже используется для отката.
    const handleReplay = () => bumpNonce(latestSceneKey)

    // "Назад" — реальный откат состояния на предыдущую сцену (см.
    // type-logwalk.tsx для подробного комментария).
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
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
                {/* Шаг 0 — просто условие, без текстовой подписи. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <ExampleFormula baseHighlighted={false} showRightSide={false} showQuotient={false} showResult={false} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — основания (двойки) становятся стикерами; угловая
                    стрелка снизу с обоими концами на левую и правую двойку. */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                <div ref={step1Ref} className="relative w-full pb-9">
                                    <ExampleFormula baseHighlighted showRightSide={false} showQuotient={false} showResult={false} />
                                    <BaseMatchArrow containerRef={step1Ref} markers={['base1', 'base2']} color={BASE_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="Заметим что у них одинаковое основание - это "
                                stickerValue={2}
                                stickerColor={BASE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — справа дописывается "= log₂", то же основание;
                    угловая стрелка снизу теперь ДЛИННАЯ, с ТРЕМЯ указателями
                    — на обе левые двойки и на новую третью справа. */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                <div ref={step2Ref} className="relative w-full pb-9">
                                    <ExampleFormula baseHighlighted showRightSide showQuotient={false} showResult={false} />
                                    <BaseMatchArrow containerRef={step2Ref} markers={['base1', 'base2', 'base3']} color={BASE_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="Поэтому получится логарифм с тем же основанием "
                                stickerValue={2}
                                stickerColor={BASE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — аргументы 15 и 5 РАЗНЫМИ цветами, стрелка от "-"
                    к "÷" (разность превращается в частное). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                <div ref={step3Ref} className="relative w-full">
                                    <ExampleFormula baseHighlighted arg1Color={ARG_COLOR_X} arg2Color={ARG_COLOR_Y} showRightSide showQuotient showResult={false} />
                                    <ArgumentsArrow containerRef={step3Ref} />
                                </div>
                            </DiagramBlock>
                            <TypedKeyPhraseLine
                                before="Так как логарифмы вычитаются, то аргументы надо "
                                phrase="разделить"
                                color={ATTENTION_COLOR}
                                highlight
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — итог, короткий "Ответ: log₂3" с конфетти. */}
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
                    const correctValue = t.q
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
                                <LogTrialFormula trial={t} selected={isDone ? correctValue : null} checked={isDone} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {t.options.map((num) => {
                                            const isWrongTriedOpt = wrongTried.includes(num)
                                            return (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => handleOptionClick(num)}
                                                    disabled={isWrongTriedOpt}
                                                    className={cn(
                                                        'min-w-[64px] py-3 px-4 rounded-xl border-2 text-lg md:text-xl font-bold transition-colors',
                                                        isWrongTriedOpt
                                                            ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                            : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                                    )}
                                                >
                                                    {num}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#9AA7B0] text-center">Кликни на число выше</p>
                                    )}
                                </>
                            )}
                            {isDone && (
                                <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                    {pickTrialFeedback(t)}
                                </FieryFeedbackBanner>
                            )}
                            {isCurrent && isDone && <LocalAnswerConfetti />}
                        </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= trials.length ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
