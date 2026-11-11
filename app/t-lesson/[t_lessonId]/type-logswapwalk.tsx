// app/t-lesson/[t_lessonId]/type-logswapwalk.tsx
//
// Тип LOGSWAPWALK — разбор «Логарифм в степени»: a^{log_b c} = c^{log_b a} (числа a и c можно менять местами, b остаётся).
// Два примера (8^{log₂3} и 25^{log₅4}), каждый — одна сцена с одной формулой, «текстовыделение 2.0»:
// 0: формула → маркером выделяются 8 и 3 → «числа 8 и 3 можно поменять местами» → двойная стрелка → кнопка «Давай поменяем местами»;
// 1: анимация обмена: тройка летит вниз-налево на место восьмёрки, восьмёрка огибает логарифм сверху и опускается на место
//    тройки (маркер к концу растворяется) → кнопка «Мы настоящие жонглеры!».
// После разбора — тренировочные задания (a^{log_b c} = ?), клик по верной формуле среди 4 вариантов.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, CORRECT_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

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
const INTRO_STEPS = 4
const TRIAL_COUNT = 4

// a — teal, c — фиолетовый: те же "свободные" роли палитры ggege, что уже
// закреплены в LOGWALK/LOGSUBWALK/LOGPOWWALK за двумя РАЗНЫМИ величинами
// одной формулы (не один общий цвет — иначе читалось бы как "одно и то же
// число"). b (основание лога) остаётся НЕподсвеченным — оно никуда не
// двигается, ему не нужен акцент.
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина, что
// и в LOGPOWWALK: короткая целочисленная запись не требует формульного
// рендера, а HTML избавляет от KaTeX-сегментирования). =====

// Выделение маркером («текстовыделение 2.0», /test-base-marker): сплошная заливка, тёмная цифра, без рамки и второго уменьшения.
const MARK_COLOR = GGEGE_PALETTE.blue.button
const markStyle = { background: MARK_COLOR, color: '#10181C', lineHeight: 1.15 } as const
const BaseMark = ({ value }: { value: number | string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-block rounded-[3px] px-[3px] font-extrabold"
        style={markStyle}
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

// «a^{log_b c}» — вся формула. marked — 8 и 3 выделены маркером; hideOuter/hideArg — число улетело (место остаётся).
// data-marker="outer"/"arg" — точки для стрелки и перелёта.
const PowLogExpr = ({
    a, b, c, marked = false, hideOuter = false, hideArg = false,
}: { a: number; b: number; c: number; marked?: boolean; hideOuter?: boolean; hideArg?: boolean }) => (
    <div className="w-full flex items-center justify-center text-2xl md:text-3xl font-extrabold py-1">
        <span className="inline-flex items-baseline whitespace-nowrap">
            <span data-marker="outer" className="inline-block" style={{ opacity: hideOuter ? 0 : 1 }}>
                {marked ? <BaseMark value={a} /> : <Plain>{a}</Plain>}
            </span>
            <Exp>
                <span className="inline-flex items-baseline whitespace-nowrap">
                    <Plain>log</Plain>
                    <sub className="ml-0.5"><Plain>{b}</Plain></sub>
                    <span data-marker="arg" className="ml-0.5 inline-block" style={{ opacity: hideArg ? 0 : 1 }}>
                        {marked ? <BaseMark value={c} /> : <Plain>{c}</Plain>}
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
// Зазор между якорной точкой стрелки и реальным краем элемента — SVG-
// маркер наконечника (markerWidth=8, refX=6) физически выступает за
// path-координату конца линии на ~5-6px В НАПРАВЛЕНИИ движения; без
// отступа наконечник залезает НА маркер (класс бага, найденный
// пользователем в LOGWALK — "стрелка залезает на цифры со стикерами").
const ARROW_TIP_GAP = 8
const ARROW_MEASURE_MS = 400
const ARROW_DRAW_MS = ARROW_MEASURE_MS + 1000

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
            const y1 = fRect.top - cRect.top - ARROW_TIP_GAP
            const x2 = tRect.left + tRect.width / 2 - cRect.left
            const y2 = tRect.top - cRect.top - ARROW_TIP_GAP
            const bridgeY = Math.min(y1, y2) - 26
            setD(buildElbowPath(x1, y1, x2, y2, bridgeY))
        }
        // Ждём, пока bounce-стикеры и раскладка осядут, прежде чем мерить
        // реальные позиции (тот же таймаут, что и в LOGPOWWALK).
        const t = setTimeout(measure, ARROW_MEASURE_MS)
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

type SwapFlyer = { n: number; left: number; top: number; fs: number; dx: number; dy: number; arc: number; scale: number }
const FLIGHT_MS = 2400

// Летящее число: один плавный прогресс p (разгон и торможение одной кривой), движение по параболе (прямая + дуга 4·p·(1−p)),
// в конце маркер растворяется и число становится обычным белым.
const SwapFlyerView = ({ f }: { f: SwapFlyer }) => {
    const p = useMotionValue(0)
    useEffect(() => {
        const c = animate(p, 1, { duration: FLIGHT_MS / 1000, ease: [0.45, 0, 0.25, 1] })
        return () => c.stop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const x = useTransform(p, (v) => f.dx * v)
    const y = useTransform(p, (v) => f.dy * v + f.arc * 4 * v * (1 - v))
    const scale = useTransform(p, (v) => 1 + (f.scale - 1) * v)
    const bg = useTransform(p, [0.7, 1], [hexToRgba(MARK_COLOR, 1), hexToRgba(MARK_COLOR, 0)])
    const color = useTransform(p, [0.7, 1], ['rgb(16, 24, 28)', 'rgb(242, 247, 251)'])
    return (
        <motion.span
            className="absolute inline-block rounded-[3px] px-[3px] font-extrabold"
            style={{ left: f.left, top: f.top, fontSize: f.fs, lineHeight: 1.15, x, y, scale, backgroundColor: bg, color, zIndex: 5 }}
        >
            {f.n}
        </motion.span>
    )
}

// Сцена одного примера: phase 0 — выделение, текст, двойная стрелка; phase 1 — обмен местами.
const SwapScene = ({ ex, text, phase, onSettled }: { ex: { a: number; b: number; c: number }; text: string; phase: number; onSettled: () => void }) => {
    const [marked, setMarked] = useState(false)
    const [textOn, setTextOn] = useState(false)
    const [arrow, setArrow] = useState(false)
    const [swapped, setSwapped] = useState(false)
    const [hidden, setHidden] = useState(false)
    const [flyers, setFlyers] = useState<SwapFlyer[] | null>(null)
    const ref = useRef<HTMLDivElement>(null)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }

    useEffect(() => {
        const list = timers.current
        if (phase === 0) {
            later(() => setMarked(true), 1100)
            later(() => setTextOn(true), 2200)
        } else {
            // обмен: тройка вниз-налево на место восьмёрки, восьмёрка огибает логарифм сверху на место тройки
            setArrow(false)
            const c = ref.current
            const outer = c?.querySelector<HTMLElement>('[data-marker="outer"]')
            const arg = c?.querySelector<HTMLElement>('[data-marker="arg"]')
            if (c && outer && arg) {
                const cr = c.getBoundingClientRect(), or = outer.getBoundingClientRect(), ar = arg.getBoundingClientRect()
                const fsO = parseFloat(getComputedStyle(outer).fontSize), fsA = parseFloat(getComputedStyle(arg).fontSize)
                const oc = { x: or.left + or.width / 2, y: or.top + or.height / 2 }, ac = { x: ar.left + ar.width / 2, y: ar.top + ar.height / 2 }
                setFlyers([
                    { n: ex.c, left: ar.left - cr.left, top: ar.top - cr.top, fs: fsA, dx: oc.x - ac.x, dy: oc.y - ac.y, arc: 34, scale: fsO / fsA },
                    { n: ex.a, left: or.left - cr.left, top: or.top - cr.top, fs: fsO, dx: ac.x - oc.x, dy: ac.y - oc.y, arc: -96, scale: fsA / fsO },
                ])
                setHidden(true)
                later(() => { setFlyers(null); setSwapped(true); setHidden(false); setMarked(false) }, FLIGHT_MS)
                later(onSettled, FLIGHT_MS + 900)
            } else { setSwapped(true); later(onSettled, 500) }
        }
        return () => { list.forEach(clearTimeout); list.length = 0 }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    return (
        <>
            <DiagramBlock>
                <div ref={ref} className="relative w-full pt-12 pb-6">
                    <PowLogExpr
                        a={swapped ? ex.c : ex.a} b={ex.b} c={swapped ? ex.a : ex.c}
                        marked={marked} hideOuter={hidden} hideArg={hidden}
                    />
                    {arrow && <DoubleArrow containerRef={ref} fromMarker="outer" toMarker="arg" color={ACTIVE_COLOR} />}
                    {flyers?.map((f) => <SwapFlyerView key={`${f.n}-${f.left}`} f={f} />)}
                </div>
            </DiagramBlock>
            {textOn && (
                <div style={phase >= 1 ? { opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 0.4s' } : undefined}>
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text={text}
                        onSettled={() => { setArrow(true); later(onSettled, ARROW_DRAW_MS + 300) }}
                    />
                </div>
            )}
        </>
    )
}

// ===== Тренировочные задания — новые случайные (a, b, c) из РАЗНЫХ цифр. Условие «a^{log_b c}», ответ «c^{log_b a}» ученик
// собирает сам в три этапа: число снаружи (c) → основание логарифма (b) → число под логарифмом (a). На каждом этапе четыре
// варианта: три цифры условия и одна лишняя, вперемешку. =====

type SwapTrial = { a: number; b: number; c: number; options: number[][] }
const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const
const SWAP_STAGE_PROMPTS = ['Что снаружи?', 'Какое основание?', 'Что под логарифмом?']
const swapAnswer = (t: SwapTrial) => [t.c, t.b, t.a]

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const makeTrial = (prev: SwapTrial | null): SwapTrial => {
    let t: SwapTrial
    let guard = 0
    do {
        const [a, b, c, extra] = shuffle([...NUM_POOL]).slice(0, 4)
        t = { a, b, c, options: [0, 1, 2].map(() => shuffle([a, b, c, extra])) }
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

// Похвала за верный ответ — детерминированно из полей задания (не Math.random() в рендере).
const pickTrialFeedback = (t: SwapTrial): string => {
    const seed = t.a * 7 + t.b * 3 + t.c
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Пропуск-квадратик: пунктирный, активный цветной и «дышит» (animate-slot-breathe), заполненный — число влетает пружиной.
const SwapSlot = ({ value, active, color, done, small = false }: { value: number | null; active: boolean; color: string; done: boolean; small?: boolean }) => (
    value === null ? (
        <span
            className={cn('inline-block align-middle rounded-md border-2 border-dashed', active && 'animate-slot-breathe')}
            style={{
                width: small ? '1.1em' : '0.95em', height: small ? '1.2em' : '1.05em',
                borderColor: active ? color : '#3A464E',
                backgroundColor: active ? hexToRgba(color, 0.18) : 'transparent',
            }}
        />
    ) : (
        <motion.span
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 15 }}
            className="inline-block"
            style={{ color: done ? CORRECT_COLOR : '#F2F7FB' }}
        >
            {value}
        </motion.span>
    )
)

// Строка ответа «= □^{log_□ □}»: filled — сколько этапов заполнено (0..3), активный пропуск — filled-й.
const SwapAnswer = ({ t, filled, done }: { t: SwapTrial; filled: number; done: boolean }) => {
    const ans = swapAnswer(t)
    const slot = (i: number, color: string, small = false) => (
        <SwapSlot value={filled > i ? ans[i] : null} active={filled === i} color={color} done={done} small={small} />
    )
    return (
        <div className="w-full flex items-center justify-center gap-x-2 text-2xl md:text-3xl font-extrabold py-1">
            <Plain>=</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                {slot(0, MARK_COLOR)}
                <Exp>
                    <span className="inline-flex items-baseline whitespace-nowrap">
                        <Plain>log</Plain>
                        <sub className="ml-0.5" style={{ lineHeight: 0 }}>{slot(1, GGEGE_PALETTE.purple.button, true)}</sub>
                        <span className="ml-1">{slot(2, GGEGE_PALETTE.purple.button)}</span>
                    </span>
                </Exp>
            </span>
        </div>
    )
}

export const TypeLogSwapWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<SwapTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" (та же механика, что и у
    // LOGCOMBOWALK/LOGDEFWALK/SINWALK/LOGWALK/LOGSUBWALK/LOGPOWWALK) —
    // неверно нажатые формулы ТЕКУЩЕГО задания красятся красным и
    // блокируются, wrongFlash — ПЕРСИСТЕНТНОЕ сообщение под вариантами.
    const [wrongTried, setWrongTried] = useState<number[]>([])
    // этап сборки ответа в текущем задании: 0 снаружи, 1 основание, 2 под логарифмом
    const [stage, setStage] = useState(0)
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const handleOptionClick = (n: number) => {
        if (checked) return
        if (wrongTried.includes(n)) return
        const correct = swapAnswer(trials[trialIndex])[stage]
        if (n === correct) {
            registerCombo(wrongTried.length === 0)
            if (stage < 2) {
                setStage(stage + 1)
                setWrongTried([])
                setWrongFlash(null)
                return
            }
            showAnswerMeme(true)
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
            setWrongTried((prev) => [...prev, n])
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
            setStage(0)
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

    // trialNextLabel выставляется ПРЯМО в handleOptionClick (не эффектом
    // на trialIndex) — её тон зависит от того, верно ли ответили сейчас.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])
    const stepLabel = ['Давай поменяем местами', 'Мы настоящие жонглеры!', 'Давай ещё раз поменяем', 'Цирк уехал, жонглёры остались!'][step] ?? introNextLabel

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевой сцены (см. type-sinwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой — та же схема ключей,
    // что и в LOGWALK/LOGSUBWALK/LOGDEFWALK/LOGPOWWALK.
    const latestSceneKey = phase === 'intro' ? (step <= 1 ? 'step-0' : 'step-2') : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            return idx > 0 ? `trial-${idx - 1}` : 'step-2'
        }
        if (key.startsWith('step-')) {
            return key === 'step-2' ? 'step-0' : null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null || (phase === 'intro' && step > 0)
    // "Повторить" — переигрывает анимацию ТЕКУЩЕЙ сцены заново, не трогая
    // состояние (в отличие от handleBack ниже) — та же пара useReplayNonces,
    // что уже используется для отката.
    const handleReplay = () => {
        // сцена примера проигрывается с самого начала
        if (phase === 'intro') { const t = step <= 1 ? 0 : 2; setStep(t); setStepReady(false) }
        else { setChecked(false); setStage(0); setWrongTried([]); setWrongFlash(null) }
        bumpNonce(latestSceneKey)
    }

    // "Назад" — реальный откат состояния на предыдущую сцену (см.
    // type-logpowwalk.tsx для подробного комментария).
    const handleBack = () => {
        if (advancing) return
        if (phase === 'intro' && step > 0) {
            // шаг 1 → начало примера 1; шаг 2 → пример 1 с начала; шаг 3 → начало примера 2
            const t = step === 3 ? 2 : 0
            bumpNonce(`step-${t}`); setStep(t); setStepReady(false)
            return
        }
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setStage(0)
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
                {/* Пример 1: шаги 0 (выделение, стрелка) и 1 (обмен). */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <SwapScene ex={EX1} text="Числа 8 и 3 можно поменять местами." phase={Math.min(step, 1)} onSettled={() => setStepReady(true)} />
                    </Fragment>
                </SceneWrapper>

                {/* Пример 2: шаги 2 и 3. */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <SwapScene ex={EX2} text="Аналогично можно поменять местами 25 и 4." phase={step - 2} onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
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
                                    {isDone || !isCurrent ? 'Собрали ответ' : SWAP_STAGE_PROMPTS[stage]}
                                </p>
                            </div>
                            <DiagramBlock>
                                <PowLogExpr a={t.a} b={t.b} c={t.c} />
                                <SwapAnswer t={t} filled={isDone ? 3 : (isCurrent ? stage : 3)} done={isDone} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div key={stage} className="drop-in-options flex flex-wrap justify-center gap-3">
                                        {t.options[stage].map((n) => {
                                            const isWrongTriedOpt = wrongTried.includes(n)
                                            return (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => handleOptionClick(n)}
                                                    disabled={isWrongTriedOpt}
                                                    className={cn(
                                                        'min-w-[72px] py-3 px-4 rounded-xl border-2 text-xl md:text-2xl font-extrabold transition-colors inline-flex items-center justify-center',
                                                        isWrongTriedOpt
                                                            ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                            : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        null
                                    )}
                                </>
                            )}
                            {isDone && (
                                <>
                                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                        {pickTrialFeedback(t)}
                                    </FieryFeedbackBanner>
                                </>
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
                        {stepLabel}
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
