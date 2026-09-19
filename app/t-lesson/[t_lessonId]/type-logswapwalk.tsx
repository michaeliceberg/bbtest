// app/t-lesson/[t_lessonId]/type-logswapwalk.tsx
//
// Тип LOGSWAPWALK — интерактивный разбор по шагам "логарифм в степени"
// (a^{log_b c} = c^{log_b a} — числа a и c можно менять местами, b —
// основание логарифма — остаётся на месте) — тот же архитектурный принцип,
// что у SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK/LOGPOWWALK: компонент сам
// ведёт хореографию и зовёт onAnswer/onComplete РОВНО один раз в конце;
// общая нижняя кнопка скрыта — своя кнопка "Дальше"/"Готово" на
// протяжении всего прохождения.
//
// Сюжет — прямая инструкция пользователя, на ДВУХ фиксированных примерах:
// 1. "8^(log₂3) = ?" — просто условие.
// 2. То же самое, но 8 и 3 — стикеры РАЗНЫХ цветов + угловая двусторонняя
//    стрелка между ними ("их можно менять местами").
// 3. "Получается: 3^(log₂8)." — те же цвета, просто на новых местах.
// 4-6. То же самое на примере "25^(log₅4) = ? → 4^(log₅25)".
//
// После разбора — тренировочные задания с НОВЫМИ случайными числами
// (a^{log_b c} = ?), нужно кликнуть верную формулу-ответ среди 4
// вариантов (дистракторы — не поменяли вообще, поменяли не ту пару,
// ошибка на 1) — тот же формат клика по варианту, что у LOGWALK/
// LOGSUBWALK/LOGPOWWALK.

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
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Тот же приём и то же значение, что у SINWALK/LOGWALK/LOGSUBWALK/
// LOGPOWWALK.
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Два фиксированных обучающих примера — a (основание степени) и c
// (аргумент лога) меняются местами, b (основание САМОГО логарифма)
// остаётся на месте. Ровно те числа, что дал пользователь.
const EX1 = { a: 8, b: 2, c: 3 }
const EX2 = { a: 25, b: 5, c: 4 }

// 3 сцены на каждый пример (условие → стикеры+стрелка → результат) × 2.
const INTRO_STEPS = 6
const TRIAL_COUNT = 4

// a — teal, c — фиолетовый: те же "свободные" роли палитры ggege, что уже
// закреплены в LOGWALK/LOGSUBWALK/LOGPOWWALK за двумя РАЗНЫМИ величинами
// одной формулы (не один общий цвет — иначе читалось бы как "одно и то же
// число"). b (основание лога) остаётся НЕподсвеченным — оно никуда не
// двигается, ему не нужен акцент.
const A_COLOR = GGEGE_PALETTE.teal.button
const C_COLOR = GGEGE_PALETTE.purple.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина, что
// и в LOGPOWWALK: короткая целочисленная запись не требует формульного
// рендера, а HTML избавляет от KaTeX-сегментирования). =====

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

// Показатель степени (весь "log_b c" целиком, как ОДИН показатель степени
// числа a) — тот же приём, что и Exp в LOGPOWWALK: явный
// position:relative+top+font-size вместо нативного <sup> (даёт
// предсказуемую, не зависящую от вложенности посадку).
const Exp = ({ children }: { children: React.ReactNode }) => (
    <span className="relative inline-block ml-px" style={{ fontSize: '0.78em', top: '-0.8em' }}>{children}</span>
)

// "a^{log_b c}" — вся формула. outerColor/argColor — по умолчанию
// undefined (обычный текст, без стикера); передаются явно на сценах со
// стикерами/стрелкой/результатом. data-marker="outer"/"arg" — точки для
// измерения стрелкой (см. DoubleArrow).
const PowLogExpr = ({
    a, b, c, outerColor, argColor,
}: { a: number; b: number; c: number; outerColor?: string; argColor?: string }) => (
    <div className="w-full flex items-center justify-center text-2xl md:text-3xl font-extrabold py-1">
        <span className="inline-flex items-baseline whitespace-nowrap">
            <span data-marker="outer">
                {outerColor ? <NumSticker value={a} color={outerColor} /> : <Plain>{a}</Plain>}
            </span>
            <Exp>
                <span className="inline-flex items-baseline whitespace-nowrap">
                    <Plain>log</Plain>
                    <sub className="ml-0.5"><Plain>{b}</Plain></sub>
                    <span className="ml-0.5" data-marker="arg">
                        {argColor ? <NumSticker value={c} color={argColor} /> : <Plain>{c}</Plain>}
                    </span>
                </span>
            </Exp>
        </span>
    </div>
)

// "Уголок" (elbow/orthogonal-connector) со скруглёнными углами — тот же
// приём, что и в LOGPOWWALK (см. там подробный комментарий): скругление —
// квадратичная кривая через САМУ угловую точку как control point.
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

// Двусторонняя (оба конца со стрелкой) угловая линия между data-marker
// "outer" (a, слева, на главной строке) и "arg" (c, справа, внутри
// показателя степени — заметно выше) — показывает, что числа МЕНЯЮТСЯ
// МЕСТАМИ друг с другом (не "куда-то переносятся", как однонаправленные
// стрелки в LOGPOWWALK). Мост ВСЕГДА выше обоих концов (оба маркера и так
// у верхней части формулы, "arg" даже выше "outer" — бридж-вверх не
// пересекает "log_b" текст между ними). Якорные точки — ВЕРХНИЙ край
// каждого маркера (линия уходит/приходит СВЕРХУ, минуя тело стикера, тот
// же фикс, что уже применён в LOGPOWWALK против "стрелка налезает на
// цифры"). markerStart с orient="auto-start-reverse" — стандартный SVG2-
// приём для стрелки на НАЧАЛЕ пути (разворачивает касательную начала на
// 180°, отсюда наконечник смотрит НАЗАД вдоль пути, то есть вниз-в-маркер,
// а не вверх-от-него).
const DoubleArrow = ({
    containerRef, fromMarker, toMarker, color,
}: { containerRef: React.RefObject<HTMLDivElement | null>; fromMarker: string; toMarker: string; color: string }) => {
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
            const y1 = fRect.top - cRect.top
            const x2 = tRect.left + tRect.width / 2 - cRect.left
            const y2 = tRect.top - cRect.top
            const bridgeY = Math.min(y1, y2) - 26
            setD(buildElbowPath(x1, y1, x2, y2, bridgeY))
        }
        // Ждём, пока bounce-стикеры и раскладка осядут, прежде чем мерить
        // реальные позиции (тот же таймаут, что и в LOGPOWWALK).
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    const startId = `logswapwalk-arrowhead-start-${fromMarker}`
    const endId = `logswapwalk-arrowhead-end-${toMarker}`
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
                d={d}
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
        </svg>
    )
}

// ===== Тренировочные задания — новые случайные (a, b, c), нужно кликнуть
// верную формулу-ответ (c^{log_b a}) среди 4 вариантов. =====

type SwapOption = { outer: number; base: number; arg: number }
type SwapTrial = { a: number; b: number; c: number; options: SwapOption[] }

const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (x: SwapOption, y: SwapOption) => x.outer === y.outer && x.base === y.base && x.arg === y.arg

// Дистракторы — правдоподобные ошибки школьника, не случайный шум: (1) не
// поменял числа вообще, (2) поменял НЕ ТУ пару (спутал b с одним из
// чисел), (3) ошибся на 1 в результате.
function makeOptions(a: number, b: number, c: number): SwapOption[] {
    const correct: SwapOption = { outer: c, base: b, arg: a }
    const candidates: SwapOption[] = [
        { outer: a, base: b, arg: c },
        { outer: b, base: a, arg: c },
        { outer: c, base: b, arg: a + 1 },
    ]
    const chosen: SwapOption[] = [correct]
    for (const cand of candidates) {
        if (!chosen.some((x) => sameOption(x, cand))) chosen.push(cand)
    }
    let extraShift = 2
    while (chosen.length < 4) {
        const extra: SwapOption = { outer: c, base: b, arg: a + extraShift }
        if (!chosen.some((x) => sameOption(x, extra))) chosen.push(extra)
        extraShift++
    }
    return shuffle(chosen)
}

const makeTrial = (prev: SwapTrial | null): SwapTrial => {
    let t: SwapTrial
    let guard = 0
    do {
        const a = pick(NUM_POOL)
        let b = pick(NUM_POOL)
        while (b === a) b = pick(NUM_POOL)
        let c = pick(NUM_POOL)
        while (c === a || c === b) c = pick(NUM_POOL)
        t = { a, b, c, options: makeOptions(a, b, c) }
        guard++
    } while (prev && t.a === prev.a && t.b === prev.b && t.c === prev.c && guard < 8)
    return t
}

const makeTrials = (n: number): SwapTrial[] => {
    const out: SwapTrial[] = []
    let prev: SwapTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

const pickTrialFeedback = (t: SwapTrial): string => {
    const seed = t.a * 7 + t.b * 5 + t.c * 3
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Кнопка-вариант — компактная формула "outer^(log_base arg)". Нативные
// sup/sub — тут это статичная кнопка, не анимированная сцена, лишний
// измерительный Exp не нужен.
const MiniAnswerButton = ({
    option, onClick, disabled, state,
}: { option: SwapOption; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
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
            <span>{option.outer}</span>
            <sup className="ml-0.5 text-[0.62em] inline-flex items-baseline whitespace-nowrap">
                log<sub className="ml-px">{option.base}</sub><span className="ml-px">{option.arg}</span>
            </sup>
        </span>
    </button>
)

export const TypeLogSwapWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<SwapTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [trialAnswers, setTrialAnswers] = useState<(SwapOption | null)[]>(Array(TRIAL_COUNT).fill(null))
    const [checked, setChecked] = useState(false)

    // Контейнеры сцен со стрелкой (шаг 1 — пример 1, шаг 4 — пример 2).
    const arrow1Ref = useRef<HTMLDivElement>(null)
    const arrow2Ref = useRef<HTMLDivElement>(null)

    const currentCorrectOption = trials[trialIndex].options.find(
        (o) => sameOption(o, { outer: trials[trialIndex].c, base: trials[trialIndex].b, arg: trials[trialIndex].a })
    )!

    const handleOptionClick = (option: SwapOption) => {
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
                // Ошибка на последнем по счёту задании — не завершаем
                // попытку, добавляем ещё одно (тот же приём, что у LOGWALK).
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

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевой сцены (см. type-sinwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой — та же схема ключей,
    // что и в LOGWALK/LOGSUBWALK/LOGDEFWALK/LOGPOWWALK.
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

    // "Назад" — реальный откат состояния на предыдущую сцену (см.
    // type-logpowwalk.tsx для подробного комментария).
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
                {/* Шаг 0 — условие примера 1: "8^(log₂3) = ?", без текста. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <PowLogExpr a={EX1.a} b={EX1.b} c={EX1.c} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — 8 и 3 становятся стикерами, двусторонняя стрелка,
                    объяснение "можно менять местами". */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                {/* pt-10 — запас сверху, чтобы дуга стрелки
                                    (мост выше обоих концов) не налезала на
                                    условие ШАГА 0 над этой сценой (тот же
                                    фикс, что уже применён в LOGPOWWALK). */}
                                <div ref={arrow1Ref} className="relative w-full pt-10">
                                    <PowLogExpr a={EX1.a} b={EX1.b} c={EX1.c} outerColor={A_COLOR} argColor={C_COLOR} />
                                    <DoubleArrow containerRef={arrow1Ref} fromMarker="outer" toMarker="arg" color={ACTIVE_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Числа 8 и 3 можно поменять местами."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — результат: "3^(log₂8)", те же цвета на новых
                    местах (3 теперь снаружи фиолетовым, 8 теперь в
                    показателе теал-цветом). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                <PowLogExpr a={EX1.c} b={EX1.b} c={EX1.a} outerColor={C_COLOR} argColor={A_COLOR} />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Хоп — 8 и 3 поменялись местами (и это законно)."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — условие примера 2: "25^(log₅4) = ?". */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock onSettled={() => setStepReady(true)}>
                                <PowLogExpr a={EX2.a} b={EX2.b} c={EX2.c} />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — 25 и 4 становятся стикерами, двусторонняя
                    стрелка, то же объяснение. */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <DiagramBlock>
                                <div ref={arrow2Ref} className="relative w-full pt-10">
                                    <PowLogExpr a={EX2.a} b={EX2.b} c={EX2.c} outerColor={A_COLOR} argColor={C_COLOR} />
                                    <DoubleArrow containerRef={arrow2Ref} fromMarker="outer" toMarker="arg" color={ACTIVE_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Аналогично можно поменять местами 25 и 4."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 5 — результат: "4^(log₅25)". */}
                {step >= 5 && (
                    <SceneWrapper key="step-5" innerRef={sceneRef('step-5')} active={isSceneActive('step-5')}>
                        <Fragment key={`step-5-${nonceFor('step-5')}`}>
                            <DiagramBlock>
                                <PowLogExpr a={EX2.c} b={EX2.b} c={EX2.a} outerColor={C_COLOR} argColor={A_COLOR} />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Хоба! И так можно делать."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const answer = trialAnswers[i]
                    const correctOption = t.options.find(
                        (o) => sameOption(o, { outer: t.c, base: t.b, arg: t.a })
                    )!
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                            {/* Разделитель перед ПЕРВЫМ тренировочным заданием
                                — отделяет практику от предшествующего
                                разбора по шагам (тот же приём, что в
                                LOGPOWWALK). */}
                            {i === 0 && (
                                <div className="w-full flex items-center gap-3" aria-hidden>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                </div>
                            )}
                            {/* Бейдж "N/M" вынесен из потока (absolute), иначе
                                текст "Выбери правильный ответ:" центрировался
                                бы относительно ОСТАВШЕГОСЯ места (после
                                бейджа), а не всей строки. */}
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
                                <PowLogExpr a={t.a} b={t.b} c={t.c} />
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
                                        {(answer && sameOption(answer, correctOption)) ? pickTrialFeedback(t) : `Неверно — правильный ответ ${correctOption.outer}log${correctOption.base}(${correctOption.arg}).`}
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
