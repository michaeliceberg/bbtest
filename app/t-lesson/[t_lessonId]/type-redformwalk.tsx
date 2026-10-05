// app/t-lesson/[t_lessonId]/type-redformwalk.tsx
//
// REDFORMWALK — «Формулы приведения», первый разбор (юнит «Формулы приведения»).
// Сценарий пользователя (2026-10-05): sin(x + π/2).
//   0. Крупно sin(x + π/2) — «Это и есть формула приведения»; маркером обводим π/2:
//      именно этот кусочек и есть формула приведения.
//   1. Чтобы понять, чему равен sin(x + π/2), сначала поймём, где мы окажемся,
//      придя в x + π/2. Окружность с осями cos/sin и домиком справа:
//      «Сначала пройдём в ПЛЮС π/2» — едем от домика вверх. «Ок, мы НАВЕРХУ».
//   2. Маркером обводим x: «А x — это маленький шаг в направлении ПЛЮС» —
//      делаем ещё маленький шаг (30°) и оказываемся во второй четверти.
//      «И мы оказались в ЭТОЙ точке» — стрелка на точку.
//   3. «Наша исходная функция — СИНУС» (обводим sin). «Так как ось sin направлена
//      ВВЕРХ» (выделяем ось), «наша точка в верхней ПОЛУПЛОСКОСТИ» (маркером 1-я и
//      2-я четверти) — «то получится ПОЛОЖИТЕЛЬНЫЙ косинус».

'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { LottieRefCurrentProps } from 'lottie-react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickFunNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, useWalkthroughCombo, MarkerLoop,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const COS_COLOR = GGEGE_PALETTE.green.button
const SIN_COLOR = GGEGE_PALETTE.blue.button
const PI_COLOR = GGEGE_PALETTE.purple.button
const STEP_COLOR = GGEGE_PALETTE.orange.button
const TG_COLOR = GGEGE_PALETTE.raspberry.button
const CTG_COLOR = GGEGE_PALETTE.teal.button
const TEAL_COLOR = GGEGE_PALETTE.teal.button
const PLUS_COLOR = '#A1D151'
const HOUSE_STICKER = '/lesson-pics/house-sticker.webp'
const PI = Math.PI

// ===== Крупный печатаемый текст (части: цвет / стикер) =====
type BigPart = { text: string; color?: string; sticker?: boolean; circle?: boolean; before?: string; after?: string }
const TypedBig = ({ parts, onDone, readMs = 500, small = false }: { parts: BigPart[]; onDone?: () => void; readMs?: number; small?: boolean }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className={`w-full text-center font-black text-[#F2F7FB] ${small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>
            {!typed ? (
                <Typewriter text={parts.map((p) => (p.before ?? '') + p.text + (p.after ?? '')).join('')} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }} />
            ) : (
                parts.map((p, i) => p.circle && p.color ? (
                    <span key={i} className="whitespace-nowrap">
                        {p.before}
                        <span className="inline-flex items-center justify-center w-[1.5em] h-[1.5em] rounded-full border-2 mx-0.5 text-[0.8em]"
                            style={{ color: p.color, borderColor: p.color, backgroundColor: hexToRgba(p.color, 0.22) }}>{p.text}</span>
                        {p.after}
                    </span>
                ) : p.sticker && p.color ? (
                    <span key={i} className="inline-block rounded-lg px-2 mx-0.5 border-2"
                        style={{ color: p.color, borderColor: p.color, backgroundColor: hexToRgba(p.color, 0.18) }}>{p.text}</span>
                ) : (
                    <span key={i} style={p.color ? { color: p.color } : undefined}>{p.text}</span>
                ))
            )}
        </div>
    )
}

// ===== Формула sin(x + π/2) с маркерами =====
const Frac = ({ num, den }: { num: string; den: string }) => (
    <span className="inline-flex flex-col leading-none align-middle mx-0.5">
        <span className="pb-1 border-b-[3px] border-current px-1 text-center">{num}</span>
        <span className="pt-1 px-1 text-center">{den}</span>
    </span>
)

// Эталонная обводка-«фломастер» (MarkerLoop) вокруг куска формулы.
const Marked = ({ children, active, color }: { children: React.ReactNode; active: boolean; color?: string }) => (
    <span className="relative inline-block px-1">
        {children}
        {active && <MarkerLoop color={color} />}
    </span>
)

// Ответ «cos x» / «−cos x» (или «sin x» / «−sin x»).
const AnsX = ({ fn, neg = false }: { fn: Fn; neg?: boolean }) => (
    <span className="inline-flex items-center">
        {neg && <span className="mr-0.5">−</span>}
        <span style={{ color: FN_COLOR[fn] }}>{fn}</span><span className="ml-1.5">x</span>
    </span>
)

// Формула: variant 'sin' — sin(x + π/2); 'cos' — cos(3π/2 + x). after — что дописать после «=».
const Formula = ({ variant = 'sin', markPi = false, markX = false, markSin = false, plain = false, eq = false, after, className = 'text-5xl md:text-6xl' }: {
    variant?: 'sin' | 'cos'; markPi?: boolean; markX?: boolean; markSin?: boolean; plain?: boolean; eq?: boolean; after?: React.ReactNode; className?: string
}) => (
    <motion.div
        initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className={`w-full flex items-center justify-center font-black text-[#F2F7FB] py-3 ${className}`}
    >
        <Marked active={markSin}><span style={{ color: plain ? '#F2F7FB' : FN_COLOR[variant] }}>{variant}</span></Marked>
        <span>(</span>
        {variant === 'sin' ? (
            <>
                <Marked active={markX}><span style={{ color: plain ? '#F2F7FB' : STEP_COLOR }}>x</span></Marked>
                <Marked active={markPi} color={PI_COLOR}>
                    <span className="mr-1">+</span>
                    <span style={{ color: PI_COLOR }}><Frac num="π" den="2" /></span>
                </Marked>
            </>
        ) : (
            <>
                <Marked active={markPi} color={PI_COLOR}>
                    <span style={{ color: PI_COLOR }}><Frac num="3π" den="2" /></span>
                </Marked>
                <span className="mx-1">+</span>
                <Marked active={markX}><span style={{ color: plain ? '#F2F7FB' : STEP_COLOR }}>x</span></Marked>
            </>
        )}
        <span>)</span>
        {eq && <span className="mx-2">=</span>}
        {after}
    </motion.div>
)

// ===== Окружность (SVG) =====
const C = 150
const R = 92
const AX = 128
const pt = (a: number, r = R) => ({ x: C + r * Math.cos(a), y: C - r * Math.sin(a) })
const LABEL_STYLE = { fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 } as const

// Дуга против часовой от a0 до a1 (a1 > a0).
const arcSeg = (a0: number, a1: number, r = R) => {
    const p0 = pt(a0, r)
    const p1 = pt(a1, r)
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${a1 - a0 > PI ? 1 : 0} 0 ${p1.x} ${p1.y}`
}

const Arrowhead = ({ x, y, dx, dy, color, size = 9 }: { x: number; y: number; dx: number; dy: number; color: string; size?: number }) => {
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const bx = x - ux * size
    const by = y - uy * size
    return <polygon points={`${x},${y} ${bx - uy * size * 0.6},${by + ux * size * 0.6} ${bx + uy * size * 0.6},${by - ux * size * 0.6}`} fill={color} />
}

// Дуга из `from` в `to` с едущей по ней точкой: один прогресс (0→1) ведёт и
// длину дуги, и положение точки — они всегда совпадают.
const TravelSegment = ({
    from, to, color, play = false, instant = false, dot = false, width = 7, onDone,
}: { from: number; to: number; color: string; play?: boolean; instant?: boolean; dot?: boolean; width?: number; onDone?: () => void }) => {
    const prog = useMotionValue(instant ? 1 : 0)
    useEffect(() => {
        if (instant || !play) return
        const ctrl = animate(prog, 1, { duration: 1.1, ease: [0.45, 0, 0.55, 1], onComplete: () => onDone?.() })
        return () => ctrl.stop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [play, instant])
    const cx = useTransform(prog, (p) => C + R * Math.cos(from + (to - from) * p))
    const cy = useTransform(prog, (p) => C - R * Math.sin(from + (to - from) * p))
    return (
        <>
            <motion.path d={arcSeg(from, to)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" style={{ pathLength: prog }} />
            {dot && <motion.circle cx={cx} cy={cy} r={9} fill={color} stroke="#F2F7FB" strokeWidth={2} />}
        </>
    )
}

type CircleProps = {
    base?: number                             // конец первой дуги: π/2 (sin) или 3π/2 (cos)
    plusArc?: 'instant' | 'play' | null      // дуга от домика до base
    stepArc?: 'play' | 'instant' | null      // маленький шаг base → base + STEP
    onPlusDone?: () => void
    onStepDone?: () => void
    pointer?: boolean                         // белая стрелка на точку
    axisBold?: 'sin' | 'cos' | null           // положительная полуось крупно ещё раз
    half?: 'upper' | 'right' | null           // две четверти маркером (верхняя / правая полуплоскость)
    stepLabel?: boolean                       // стикер «x» у маленького шага
    blink?: boolean                           // мигающая итоговая точка
}
const STEP = PI / 6 // 30°

const RedCircle = ({ base = PI / 2, plusArc = null, stepArc = null, onPlusDone, onStepDone, pointer = false, axisBold = null, half = null, stepLabel = false, blink = false }: CircleProps) => {
    const target = base + STEP
    const p = pt(target)
    const tail = pt(target + 0.22, R + 62)
    const head = pt(target + 0.04, R + 14)
    const lp = pt(base + STEP / 2, R + 30)
    const halfColor = half === 'right' ? COS_COLOR : SIN_COLOR
    return (
        <svg viewBox="-30 0 360 300" className="w-full max-w-[360px] h-auto mx-auto block select-none overflow-visible">
            {/* две четверти — крупный маркер по полуокружности */}
            {half && (
                <>
                    <motion.path d={half === 'upper' ? arcSeg(0, PI) : arcSeg(-PI / 2, PI / 2)} fill="none" stroke={hexToRgba(halfColor, 0.4)} strokeWidth={26} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
                    {(half === 'upper'
                        ? [{ a: PI / 4, n: '1' }, { a: (3 * PI) / 4, n: '2' }]
                        : [{ a: PI / 4, n: '1' }, { a: -PI / 4, n: '4' }]
                    ).map(({ a, n }, i) => {
                        const q = pt(a, 50)
                        return (
                            <g key={n} transform={`translate(${q.x} ${q.y})`}>
                                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8, delay: 1 + i * 0.3 }}>
                                    <circle r={17} fill={hexToRgba(halfColor, 0.25)} stroke={halfColor} strokeWidth={2.5} />
                                    <text textAnchor="middle" dominantBaseline="central" fontSize={22} fill={halfColor} style={LABEL_STYLE}>{n}</text>
                                </motion.g>
                            </g>
                        )
                    })}
                </>
            )}
            <circle cx={C} cy={C} r={R} fill="none" stroke="#F2F7FB" strokeWidth={3} />
            {/* оси */}
            <line x1={C - AX} y1={C} x2={C + AX - 4} y2={C} stroke={COS_COLOR} strokeWidth={4} />
            <Arrowhead x={C + AX + 4} y={C} dx={1} dy={0} color={COS_COLOR} size={14} />
            <line x1={C} y1={C + AX} x2={C} y2={C - AX + 4} stroke={SIN_COLOR} strokeWidth={4} />
            <Arrowhead x={C} y={C - AX - 4} dx={0} dy={-1} color={SIN_COLOR} size={14} />
            <text x={C + AX + 12} y={C} textAnchor="start" dominantBaseline="central" fontSize={22} fill={COS_COLOR} style={LABEL_STYLE}>cos</text>
            <text x={C + 28} y={C - AX + 6} textAnchor="middle" dominantBaseline="central" fontSize={22} fill={SIN_COLOR} style={LABEL_STYLE}>sin</text>
            {/* положительная полуось ещё раз — крупно */}
            {axisBold && (
                <motion.line
                    x1={C} y1={C} x2={axisBold === 'sin' ? C : C + AX - 4} y2={axisBold === 'sin' ? C - AX + 4 : C}
                    stroke={axisBold === 'sin' ? SIN_COLOR : COS_COLOR} strokeWidth={12} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            )}
            {/* дуги пути */}
            {plusArc && <TravelSegment from={0} to={base} color={PLUS_COLOR} play={plusArc === 'play'} instant={plusArc === 'instant'} dot={stepArc === null} onDone={onPlusDone} />}
            {stepArc && <TravelSegment from={base} to={target} color={STEP_COLOR} play={stepArc === 'play'} instant={stepArc === 'instant'} dot width={8} onDone={onStepDone} />}
            {/* подпись «x» у маленького шага */}
            {stepLabel && (
                <g transform={`translate(${lp.x} ${lp.y})`}>
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>
                        <rect x={-14} y={-15} width={28} height={30} rx={8} fill={hexToRgba(STEP_COLOR, 0.2)} stroke={STEP_COLOR} strokeWidth={2.5} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={20} fill={STEP_COLOR} style={LABEL_STYLE}>x</text>
                    </motion.g>
                </g>
            )}
            {/* мигающая итоговая точка */}
            {blink && (
                <>
                    <circle cx={p.x} cy={p.y} r={16} fill={hexToRgba(STEP_COLOR, 0.4)} className="animate-ping" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                    <circle cx={p.x} cy={p.y} r={9} fill={STEP_COLOR} stroke="#F2F7FB" strokeWidth={2} className="animate-pulse" />
                </>
            )}
            {/* белая стрелка на точку */}
            {pointer && (
                <>
                    <circle cx={p.x} cy={p.y} r={14} fill={hexToRgba(STEP_COLOR, 0.35)} className="animate-ping" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                    <circle cx={p.x} cy={p.y} r={9} fill={STEP_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                    <motion.line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke="#F2F7FB" strokeWidth={6} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Arrowhead x={head.x} y={head.y} dx={head.x - tail.x} dy={head.y - tail.y} color="#F2F7FB" size={16} />
                    </motion.g>
                </>
            )}
            {/* домик справа */}
            <image href={HOUSE_STICKER} x={C + R - 18} y={C - 16} width={36} height={31} />
            <circle cx={C} cy={C} r={4} fill="#F2F7FB" />
        </svg>
    )
}

// ===== Сцены =====
type SceneProps = { onSettled?: () => void }

// 0. Что такое формула приведения: всё белое, кроме π/2. Сначала текст,
// потом маркером обводим π/2.
const FormulaScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setPhase(1), 900)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        if (phase !== 2) return
        const t = setTimeout(() => onSettled?.(), 1100)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <Formula plain markPi={phase >= 2} />
            {phase >= 1 && (
                <TypedBig
                    small
                    parts={[{ text: 'Именно такой кусочек ' }, { text: '+π/2', color: PI_COLOR, sticker: true }, { text: ' и есть формула приведения' }]}
                    onDone={() => setPhase(2)} readMs={400}
                />
            )}
        </>
    )
}

// 0б/0в. Правило — по шагам на двух примерах (с sin), потом «так же и у остальных».
//   change: sin(x + π/2) и sin(x − 3π/2): видим π/2 → обводим → МЕНЯЕМ → стрелка от sin
//           направо, справа с отскоком появляется cos x;
//   keep:   sin(x + π) и sin(x − 2π): видим π → обводим → НЕ МЕНЯЕМ → справа sin x.
const Appear = ({ when, children, className, delay = 0 }: { when: boolean; children: React.ReactNode; className?: string; delay?: number }) => (
    <motion.span
        className={cn('inline-flex', className)}
        initial={false}
        animate={when ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 14, delay: when ? delay : 0 }}
    >
        {children}
    </motion.span>
)
const Fn2 = ({ f }: { f: Fn }) => <span style={{ color: FN_COLOR[f] }}>{f}</span>

// Наклонная обводка вокруг «π» (в числителе) и «2» (в знаменателе) — чтобы не задеть множитель
// слева в числителе («3» в 3π/2): эллипс вытянут вдоль линии π → 2 и повёрнут под тот же угол.
const TiltedMarker = ({ wrapRef, aRef, bRef, active, roomy }: {
    wrapRef: React.RefObject<HTMLSpanElement>
    aRef: React.RefObject<HTMLSpanElement>
    bRef: React.RefObject<HTMLSpanElement>
    active: boolean
    roomy: boolean // нет множителя слева — можно обвести пошире
}) => {
    const [g, setG] = useState<{ cx: number; cy: number; w: number; h: number; rot: number } | null>(null)
    useLayoutEffect(() => {
        if (!active) return
        const wr = wrapRef.current?.getBoundingClientRect()
        const ar = aRef.current?.getBoundingClientRect()
        const br = bRef.current?.getBoundingClientRect()
        if (!wr || !ar || !br) return
        const ax = ar.left - wr.left + ar.width / 2
        const ay = ar.top - wr.top + ar.height / 2
        const bx = br.left - wr.left + br.width / 2
        const by = br.top - wr.top + br.height / 2
        setG({
            cx: roomy ? (ax + bx) / 2 : ax + (bx - ax) * 0.4, cy: (ay + by) / 2,
            w: Math.max(ar.width, br.width) + (roomy ? 8 : -2),
            h: Math.hypot(bx - ax, by - ay) + Math.max(ar.height, br.height) - 6,
            rot: (Math.atan2(ax - bx, by - ay) * 180) / Math.PI,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active])
    if (!g || !active) return null
    return (
        <div className="pointer-events-none absolute" style={{ left: g.cx - g.w / 2, top: g.cy - g.h / 2, width: g.w, height: g.h, transform: `rotate(${g.rot}deg)` }}>
            <MarkerLoop color={PI_COLOR} pad={5} />
        </div>
    )
}

// Дробь «cπ/2»: множитель c — в числителе рядом с π.
const FracMarked = ({ c, marked }: { c: number; marked: boolean }) => {
    const wrapRef = useRef<HTMLSpanElement>(null)
    const piRef = useRef<HTMLSpanElement>(null)
    const denRef = useRef<HTMLSpanElement>(null)
    return (
        <span ref={wrapRef} className="relative inline-flex flex-col leading-none align-middle mx-1" style={{ color: PI_COLOR }}>
            <span className="pb-1 border-b-[3px] border-current px-1 inline-flex items-end justify-center gap-3">
                {c > 1 && <span>{c}</span>}
                <span ref={piRef}>π</span>
            </span>
            <span className="pt-1 px-1 text-center"><span ref={denRef}>2</span></span>
            <TiltedMarker wrapRef={wrapRef} aRef={piRef} bRef={denRef} active={marked} roomy={c <= 1} />
        </span>
    )
}

// Сдвиг «± c·π/2» (change) или «± c·π» (keep).
const ShiftMarked = ({ k, half, marked }: { k: number; half: boolean; marked: boolean }) => {
    const m = Math.abs(k)
    const c = half ? m : m / 2
    return (
        <>
            <span className="mx-1">{k < 0 ? '−' : '+'}</span>
            {half ? (
                <FracMarked c={c} marked={marked} />
            ) : (
                <>
                    {c > 1 && <span className="mr-3" style={{ color: PI_COLOR }}>{c}</span>}
                    <Marked active={marked} color={PI_COLOR}>
                        <span style={{ color: PI_COLOR }}>π</span>
                    </Marked>
                </>
            )}
        </>
    )
}

// Стрелка поверху: от верхней точки sin вверх, вправо и вниз к правой части равенства.
const LoopArrow = ({ containerRef, fromRef, toRef, color, label, onDone }: {
    containerRef: React.RefObject<HTMLDivElement>
    fromRef: React.RefObject<HTMLSpanElement>
    toRef: React.RefObject<HTMLSpanElement>
    color: string
    label?: string
    onDone: () => void
}) => {
    const [geo, setGeo] = useState<{ d: string; tx: number; ty: number; mx: number; ly: number; w: number; h: number } | null>(null)
    useLayoutEffect(() => {
        const c = containerRef.current
        const f = fromRef.current
        const t = toRef.current
        if (!c || !f || !t) return
        const cr = c.getBoundingClientRect()
        const fr = f.getBoundingClientRect()
        const tr = t.getBoundingClientRect()
        const sx = fr.left - cr.left + fr.width / 2
        const sy = fr.top - cr.top
        const tx = tr.left - cr.left + tr.width / 2
        const ty = tr.top - cr.top
        const by = Math.min(sy, ty) - 34
        const r = 14
        setGeo({
            d: `M ${sx} ${sy - 4} L ${sx} ${by + r} Q ${sx} ${by} ${sx + r} ${by} L ${tx - r} ${by} Q ${tx} ${by} ${tx} ${by + r} L ${tx} ${ty - 12}`,
            tx, ty: ty - 4, mx: (sx + tx) / 2, ly: by - 9, w: cr.width, h: cr.height,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    if (!geo) return null
    return (
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={geo.w} height={geo.h}>
            <motion.path d={geo.d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }}
                onAnimationComplete={onDone} />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <Arrowhead x={geo.tx} y={geo.ty} dx={0} dy={1} color={color} size={14} />
            </motion.g>
            {label && (
                <motion.text x={geo.mx} y={geo.ly} textAnchor="middle" fontSize={17} fill={color} style={LABEL_STYLE}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                    {label}
                </motion.text>
            )}
        </svg>
    )
}

type RuleKind = 'change' | 'keep'
const RuleExample = ({ k, fn, kind, lead, ack, onDone }: { k: number; fn: Fn; kind: RuleKind; lead: 'first' | 'simple' | 'again' | 'plain'; ack: boolean; onDone: () => void }) => {
    const half = kind === 'change'
    const result: Fn = half ? SWAP[fn] : fn
    const accent = TEAL_COLOR
    const [phase, setPhase] = useState(0) // 1 «видим…», 2 обводка, 3 «то/тоже/опять…», 4 стрелка, 5 результат
    const [acked, setAcked] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fnRef = useRef<HTMLSpanElement>(null)
    const slotRef = useRef<HTMLSpanElement>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const word = half ? 'π/2' : 'π'
    useEffect(() => {
        const t = setTimeout(() => setPhase(1), 800)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        const delay: Record<number, [number, number]> = { 2: [3, 1000] }
        if (phase === 5 && !ack) { const t = setTimeout(onDone, 1000); return () => clearTimeout(t) }
        const step = delay[phase]
        if (!step) return
        const t = setTimeout(() => setPhase(step[0]), step[1])
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <div className="w-full flex flex-col gap-3">
            <div ref={containerRef} className="relative w-full flex items-center justify-center pt-10 text-3xl sm:text-4xl md:text-5xl font-black text-[#F2F7FB]" style={LABEL_STYLE}>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center">
                    <span ref={fnRef} style={{ color: FN_COLOR[fn] }}>{fn}</span>
                    <span>(</span><span>x</span>
                    <ShiftMarked k={k} half={half} marked={phase >= 2} />
                    <span>)</span>
                    <span className="mx-2">=</span>
                    <span ref={slotRef} className="inline-flex">
                        <Appear when={phase >= 5}><span className="inline-flex items-center gap-1.5"><Fn2 f={result} /><span>x</span></span></Appear>
                    </span>
                </motion.span>
                {phase >= 4 && <LoopArrow containerRef={containerRef} fromRef={fnRef} toRef={slotRef} color={accent} label={half ? 'меняем' : 'не меняем'} onDone={() => setTimeout(() => setPhase((p) => (p < 5 ? 5 : p)), 1100)} />}
            </div>
            {phase >= 1 && (
                <TypedBig small onDone={() => setPhase(2)} readMs={300}
                    parts={[{ text: lead === 'again' ? 'видим опять ' : lead === 'plain' ? 'видим ' : lead === 'simple' ? 'видим просто ' : 'если видим ' }, { text: word, color: PI_COLOR, sticker: true }]} />
            )}
            {phase >= 3 && (
                <TypedBig small onDone={() => setPhase(4)} readMs={300}
                    parts={[{ text: lead === 'first' || lead === 'simple' ? 'то ' : lead === 'again' ? 'тоже ' : 'опять ' }, { text: half ? 'МЕНЯЕМ' : 'НЕ МЕНЯЕМ', color: accent }]} />
            )}
            {phase >= 5 && ack && !acked && (
                <div className="w-full flex justify-center">
                    <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        onClick={() => { setAcked(true); onDone() }}
                        className={walkthroughButtonClass(true)}
                        style={walkthroughButtonStyle(true)}
                    >
                        Агась
                    </motion.button>
                </div>
            )}
            <div ref={endRef} />
        </div>
    )
}

const RULE_OTHERS: Record<RuleKind, [Fn, Fn][]> = {
    change: [['tg', 'ctg'], ['ctg', 'tg']],
    keep: [['cos', 'cos'], ['tg', 'tg'], ['ctg', 'ctg']],
}
// Примеры: change — sin(x + π/2), sin(x − 3π/2), cos(x − 5π/2); keep — sin(x + π), sin(x − 2π).
const RULE_EXAMPLES: Record<RuleKind, { fn: Fn; k: number }[]> = {
    change: [{ fn: 'sin', k: 1 }, { fn: 'sin', k: -3 }, { fn: 'cos', k: -5 }],
    keep: [{ fn: 'sin', k: 2 }, { fn: 'sin', k: -4 }],
}
// Перед первым примером «НЕ МЕНЯЕМ»: «Нооооо!» + лотти «браво-негатив»; после «Усёк» лотти
// останавливаем (pause), чтобы не грузил процессор.
const KeepTeaser = ({ onDone }: { onDone: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 «Ноооо», 1 «если видим π», 2 «то НЕ МЕНЯЕМ», 3 лотти + «Усёк»
    const [anim, setAnim] = useState<object | null>(null)
    const [stopped, setStopped] = useState(false)
    const lottieRef = useRef<LottieRefCurrentProps>(null)
    const endRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        let alive = true
        fetch('/Lottie/stepByStep/bravoNegative.json').then((r) => r.json()).then((d) => { if (alive) setAnim(d) }).catch(() => {})
        return () => { alive = false }
    }, [])
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [phase, anim])
    return (
        <div className="w-full flex flex-col gap-3 items-center">
            <TypedBig parts={[{ text: 'Нооооооооооооооооо!', color: '#DC605B' }]} onDone={() => setPhase(1)} readMs={300} />
            {phase >= 1 && (
                <TypedBig small onDone={() => setPhase(2)} readMs={300}
                    parts={[{ text: 'если видим ' }, { text: 'π', color: PI_COLOR, sticker: true }]} />
            )}
            {phase >= 2 && (
                <TypedBig small onDone={() => setPhase(3)} readMs={300}
                    parts={[{ text: 'то ' }, { text: 'НЕ МЕНЯЕМ', color: TEAL_COLOR }]} />
            )}
            {phase >= 3 && anim && (
                <Lottie animationData={anim} lottieRef={lottieRef} loop autoplay className="w-44 h-44" />
            )}
            {phase >= 3 && !stopped && (
                <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    onClick={() => { lottieRef.current?.pause(); setStopped(true); onDone() }}
                    className={walkthroughButtonClass(true) + ' w-full'}
                    style={{ ...walkthroughButtonStyle(true), flex: 'none' }}
                >
                    Усёк
                </motion.button>
            )}
            <div ref={endRef} />
        </div>
    )
}

const RuleScene = ({ kind, onSettled }: SceneProps & { kind: RuleKind }) => {
    const examples = RULE_EXAMPLES[kind]
    const [stage, setStage] = useState(0) // 0..n-1 — примеры по очереди, n — «так же и у остальных»
    const [teaserDone, setTeaserDone] = useState(kind !== 'keep')
    const [chip, setChip] = useState(0)
    useEffect(() => {
        if (stage < examples.length) return
        if (chip >= RULE_OTHERS[kind].length + 1) {
            const t = setTimeout(() => onSettled?.(), 1000)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => setChip((n) => n + 1), chip === 0 ? 300 : 650)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, chip])
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            {kind === 'keep' && <KeepTeaser onDone={() => setTeaserDone(true)} />}
            {teaserDone && examples.map((ex, i) => stage >= i && (
                <RuleExample key={i} k={ex.k} fn={ex.fn} kind={kind}
                    lead={i === 0 ? (kind === 'keep' ? 'simple' : 'first') : i === 1 ? 'again' : 'plain'}
                    ack={i < examples.length - 1}
                    onDone={() => setStage((st) => Math.max(st, i + 1))} />
            ))}
            {stage >= examples.length && (
                <div className="w-full flex flex-col items-center gap-2">
                    <Appear when={chip >= 1}><span className="text-sm font-bold uppercase tracking-wide text-[#9AA7B0]">так же и у остальных</span></Appear>
                    <div className="flex items-center justify-center flex-wrap gap-3 text-2xl md:text-3xl font-black" style={LABEL_STYLE}>
                        {RULE_OTHERS[kind].map(([from, to], i) => (
                            <Appear key={from} when={chip >= 2 + i}>
                                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-3 py-1.5">
                                    <Fn2 f={from} />
                                    <span className="inline-flex flex-col items-center leading-none">
                                        <span className="text-sm font-black mb-0.5" style={{ color: PI_COLOR }}>{kind === 'change' ? 'π/2' : 'π'}</span>
                                        <svg width="58" height="14" viewBox="0 0 58 14" className="overflow-visible">
                                            <line x1="1" y1="7" x2="46" y2="7" stroke="#F2F7FB" strokeWidth={3} strokeLinecap="round" />
                                            <Arrowhead x={57} y={7} dx={1} dy={0} color="#F2F7FB" size={11} />
                                        </svg>
                                    </span>
                                    <Fn2 f={to} />
                                </span>
                            </Appear>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
const RuleChangeScene = ({ onSettled }: SceneProps) => <RuleScene kind="change" onSettled={onSettled} />
const RuleKeepScene = ({ onSettled }: SceneProps) => <RuleScene kind="keep" onSettled={onSettled} />

// Разбор «куда мы придём» для двух примеров: sin(x + π/2) → cos x и cos(3π/2 + x) → sin x.
type VKey = 'sin' | 'cos'
const VARIANTS: Record<VKey, {
    fn: Fn; result: Fn; base: number; plusSticker: string
    fnWord: string; dir: string; where: string; quarter: string
    half: 'upper' | 'right'; axis: 'sin' | 'cos'
}> = {
    sin: { fn: 'sin', result: 'cos', base: PI / 2, plusSticker: '+π/2', fnWord: 'СИНУС', dir: 'ВВЕРХ', where: 'СВЕРХУ', quarter: '2', half: 'upper', axis: 'sin' },
    cos: { fn: 'cos', result: 'sin', base: (3 * PI) / 2, plusSticker: '3π/2', fnWord: 'КОСИНУС', dir: 'ВПРАВО', where: 'СПРАВА', quarter: '4', half: 'right', axis: 'cos' },
}

// 1. Осталось понять: sin(x + π/2) = cos x или −cos x? Идём сначала в +π/2, потом маленький шаг x.
//   phase: 0 «Осталось теперь понять», 1 формула, 2 первый ответ, 3 «или», 4 второй ответ, 5 «Нука-нука»,
//   6 «Для этого СНАЧАЛА идём в…», 7 маркер на сдвиге, 8 окружность, 9 дуга 0→base, 10 маркер снят,
//   11 маркер на x, 12 «А x — маленький шаг в ПЛЮС», 13 дуга +30°, 14 подпись x и мигающая точка.
const PlaceScene = ({ v, onSettled }: SceneProps & { v: VKey }) => {
    const cfg = VARIANTS[v]
    const [phase, setPhase] = useState(0)
    const endRef = useRef<HTMLDivElement>(null)
    const goto = (n: number) => setPhase((p) => (p < n ? n : p))
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        const next: Record<number, [number, number]> = { 1: [2, 900], 2: [3, 1100], 4: [5, 900], 7: [8, 1100], 10: [11, 600], 11: [12, 1100] }
        if (phase === 14) { const t = setTimeout(() => onSettled?.(), 1800); return () => clearTimeout(t) }
        const step = next[phase]
        if (!step) return
        const t = setTimeout(() => goto(step[0]), step[1])
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <TypedBig parts={[{ text: 'Осталось теперь понять' }]} onDone={() => goto(1)} readMs={500} />
            {phase >= 1 && (
                <Formula
                    variant={v} eq
                    markPi={phase >= 7 && phase < 10} markX={phase >= 11}
                    className="text-3xl sm:text-4xl md:text-5xl"
                    after={(
                        <span className="ml-2 inline-flex flex-col items-center leading-tight text-[0.72em]">
                            <Appear when={phase >= 2}><AnsX fn={cfg.result} /></Appear>
                            <span className="text-[0.62em] font-bold text-[#9AA7B0] my-0.5 h-5 min-w-8 flex items-center justify-center">
                                {phase >= 3 && <Typewriter text="или" onDone={() => goto(4)} />}
                            </span>
                            <Appear when={phase >= 4}><AnsX fn={cfg.result} neg /></Appear>
                        </span>
                    )}
                />
            )}
            {phase === 5 && (
                <motion.button
                    type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => goto(6)}
                    className={`${walkthroughButtonClass(true)} w-full`} style={{ ...walkthroughButtonStyle(true), flex: 'none' }}
                >
                    Нука-нука
                </motion.button>
            )}
            {phase >= 6 && (
                <TypedBig
                    onDone={() => goto(7)} readMs={500}
                    parts={[{ text: 'Для этого СНАЧАЛА идём в ' }, { text: cfg.plusSticker, color: PI_COLOR, sticker: true }]}
                />
            )}
            {phase >= 8 && (
                <DiagramBlock onSettled={() => setTimeout(() => goto(9), 500)}>
                    <RedCircle
                        base={cfg.base}
                        plusArc={phase >= 9 ? 'play' : null}
                        stepArc={phase >= 13 ? 'play' : null}
                        stepLabel={phase >= 14}
                        blink={phase >= 14}
                        onPlusDone={() => setTimeout(() => goto(10), 500)}
                        onStepDone={() => setTimeout(() => goto(14), 700)}
                    />
                </DiagramBlock>
            )}
            {phase >= 12 && (
                <TypedBig
                    onDone={() => goto(13)} readMs={500}
                    parts={[{ text: 'А ' }, { text: 'x', color: STEP_COLOR, sticker: true }, { text: ' — это маленький шаг в ' }, { text: 'ПЛЮС', color: PLUS_COLOR }]}
                />
            )}
            <div ref={endRef} />
        </>
    )
}

// 2. Исходная функция → знак: ось, полуплоскость, итог.
//   phase: 0 формула, 1 маркер на функции, 2 «Так как наша исходная функция — …», 3 окружность целиком,
//   4 «А ось … направлена …» (+ось крупно), 5 «И мы оказались … (N четверть)», 6 маркер двух четвертей,
//   7 «то получится ПОЛОЖИТЕЛЬНЫЙ …», 8 формула переписана с ответом.
const SignScene = ({ v, onSettled }: SceneProps & { v: VKey }) => {
    const cfg = VARIANTS[v]
    const [phase, setPhase] = useState(0)
    const endRef = useRef<HTMLDivElement>(null)
    const goto = (n: number) => setPhase((p) => (p < n ? n : p))
    useEffect(() => {
        const t = setTimeout(() => goto(1), 800)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        const next: Record<number, [number, number]> = { 1: [2, 1000], 4: [5, 1800], 6: [7, 2600] }
        if (phase === 8) { const t = setTimeout(() => onSettled?.(), 1800); return () => clearTimeout(t) }
        const step = next[phase]
        if (!step) return
        const t = setTimeout(() => goto(step[0]), step[1])
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const fnColor = FN_COLOR[cfg.fn]
    return (
        <>
            <Formula variant={v} eq markSin={phase >= 1} className="text-3xl sm:text-4xl md:text-5xl" />
            {phase >= 2 && (
                <TypedBig
                    onDone={() => goto(3)} readMs={700}
                    parts={[{ text: 'Так как наша исходная функция — ' }, { text: cfg.fnWord, color: fnColor }]}
                />
            )}
            {phase >= 3 && (
                <DiagramBlock onSettled={() => setTimeout(() => goto(4), 600)}>
                    <RedCircle
                        base={cfg.base} plusArc="instant" stepArc="instant" stepLabel blink
                        axisBold={phase >= 4 ? cfg.axis : null} half={phase >= 6 ? cfg.half : null}
                    />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <TypedBig
                    readMs={300}
                    parts={[{ text: 'А ось ' }, { text: cfg.fn, color: fnColor, sticker: true }, { text: ' направлена ' }, { text: cfg.dir, color: fnColor }]}
                />
            )}
            {phase >= 5 && (
                <TypedBig
                    onDone={() => goto(6)} readMs={300}
                    parts={[{ text: 'И мы оказались ' }, { text: cfg.where, color: fnColor }, { text: cfg.quarter, color: fnColor, circle: true, before: ' (', after: ' четверть)' }]}
                />
            )}
            {phase >= 7 && (
                <TypedBig
                    onDone={() => goto(8)} readMs={500}
                    parts={[{ text: 'то получится ' }, { text: 'ПОЛОЖИТЕЛЬНЫЙ', color: PLUS_COLOR }, { text: ' ' }, { text: cfg.result, color: FN_COLOR[cfg.result] }]}
                />
            )}
            {phase >= 8 && (
                <Formula variant={v} eq after={<span className="ml-2"><AnsX fn={cfg.result} /></span>} className="text-3xl sm:text-4xl md:text-5xl" />
            )}
            <div ref={endRef} />
        </>
    )
}
const PlaceSinScene = ({ onSettled }: SceneProps) => <PlaceScene v="sin" onSettled={onSettled} />
const SignSinScene = ({ onSettled }: SceneProps) => <SignScene v="sin" onSettled={onSettled} />
const PlaceCosScene = ({ onSettled }: SceneProps) => <PlaceScene v="cos" onSettled={onSettled} />
const SignCosScene = ({ onSettled }: SceneProps) => <SignScene v="cos" onSettled={onSettled} />

// ===== Упражнения «во что превратится» =====
type Fn = 'sin' | 'cos' | 'tg' | 'ctg'
const FN_COLOR: Record<Fn, string> = { sin: SIN_COLOR, cos: COS_COLOR, tg: TG_COLOR, ctg: CTG_COLOR }
const SWAP: Record<Fn, Fn> = { sin: 'cos', cos: 'sin', tg: 'ctg', ctg: 'tg' }
const ALL_FN: Fn[] = ['sin', 'cos', 'tg', 'ctg']

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
const pickOne = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// k — сдвиг в единицах π/2 (со знаком): нечётное |k| — функция меняется.
type Trial = { fn: Fn; k: number }
const CHANGE_KS = [1, 3, 5, 7, -1, -3, -5]
const KEEP_KS = [2, 4, 6, -2, -4]
const makeTrials = (): Trial[] => {
    const fns = shuffle<Fn>([...ALL_FN, pickOne<Fn>(['sin', 'cos']), pickOne<Fn>(['tg', 'ctg'])])
    const ks = shuffle([...shuffle(CHANGE_KS).slice(0, 3), ...shuffle(KEEP_KS).slice(0, 3)])
    return fns.map((fn, i) => ({ fn, k: ks[i] }))
}
const answerOf = (t: Trial): Fn => (Math.abs(t.k) % 2 === 1 ? SWAP[t.fn] : t.fn)
const TRIAL_COUNT = 6

const Shift = ({ k }: { k: number }) => {
    const m = Math.abs(k)
    const sign = k < 0 ? '−' : '+'
    return (
        <>
            <span className="mx-1">{sign}</span>
            <span style={{ color: PI_COLOR }}>
                {m % 2 === 0
                    ? <span>{m / 2 === 1 ? 'π' : `${m / 2}π`}</span>
                    : <Frac num={m === 1 ? 'π' : `${m}π`} den="2" />}
            </span>
        </>
    )
}

const TrialFormula = ({ t, result }: { t: Trial; result: Fn | null }) => (
    <div className="w-full flex items-center justify-center flex-wrap gap-x-3 text-4xl md:text-5xl font-black text-[#F2F7FB] py-2" style={LABEL_STYLE}>
        <span className="inline-flex items-center">
            <span style={{ color: FN_COLOR[t.fn] }}>{t.fn}</span>
            <span>(</span>
            <span>x</span>
            <Shift k={t.k} />
            <span>)</span>
        </span>
        <span>→</span>
        <span className="inline-flex items-center rounded-xl border-2 px-3 min-w-[3.5rem] justify-center"
            style={result ? { color: FN_COLOR[result], borderColor: '#A1D151', backgroundColor: hexToRgba('#A1D151', 0.14) } : { color: '#9AA7B0', borderColor: '#5C6B73', borderStyle: 'dashed' }}>
            {result ?? '?'}
        </span>
    </div>
)

const hintFor = (t: Trial) =>
    Math.abs(t.k) % 2 === 1 ? 'Здесь π/2 «нечётное» — функция меняется.' : 'Здесь целое π — функция остаётся.'

// Сцены-разборы: индексы в INTRO_SCENES; упражнения встают после правила.
const INTRO_SCENES = [FormulaScene, RuleChangeScene, RuleKeepScene, PlaceSinScene, SignSinScene, PlaceCosScene, SignCosScene]
type SceneKey = { kind: 'intro'; idx: number } | { kind: 'trial'; idx: number }
const SCENE_KEYS: SceneKey[] = [
    { kind: 'intro', idx: 0 }, { kind: 'intro', idx: 1 }, { kind: 'intro', idx: 2 },
    ...Array.from({ length: TRIAL_COUNT }, (_, i): SceneKey => ({ kind: 'trial', idx: i })),
    { kind: 'intro', idx: 3 }, { kind: 'intro', idx: 4 }, { kind: 'intro', idx: 5 }, { kind: 'intro', idx: 6 },
]
const keyName = (k: SceneKey) => (k.kind === 'intro' ? `step-${k.idx}` : `trial-${k.idx}`)

export const TypeRedFormWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const [sceneIdx, setSceneIdx] = useState(0)
    // С какой сцены показываем лог: при админском прыжке прошлые сцены не проигрываем заново.
    const [startIdx, setStartIdx] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    useEffect(() => { setNextLabel(pickFunNextLabel()) }, [sceneIdx])

    const [trials] = useState<Trial[]>(makeTrials)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<Fn[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const registerCombo = useWalkthroughCombo()

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const current = SCENE_KEYS[sceneIdx]
    const latestSceneKey = keyName(current)
    const contentSettled = current.kind === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const isLast = sceneIdx + 1 >= SCENE_KEYS.length

    const resetTrial = () => { setChecked(false); setWrongTried([]); setWrongFlash(null) }

    const answer = (t: Trial, fn: Fn) => {
        if (checked || wrongTried.includes(fn)) return
        if (fn === answerOf(t)) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setChecked(true)
            setNextLabel(pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((prev) => [...prev, fn])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (isLast) {
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
            } else {
                setSceneIdx((i) => i + 1)
                setStepReady(false)
                resetTrial()
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => {
        bumpNonce(latestSceneKey)
        setStepReady(false)
        resetTrial()
    }
    const jumpTo = (key: string) => {
        const idx = SCENE_KEYS.findIndex((k) => keyName(k) === key)
        if (advancing || idx < 0) return
        bumpNonce(key)
        setStartIdx(idx)
        setSceneIdx(idx)
        setStepReady(false)
        resetTrial()
    }
    const handleBack = () => {
        if (advancing || sceneIdx === 0) return
        bumpNonce(keyName(SCENE_KEYS[sceneIdx - 1]))
        setStartIdx((st) => Math.min(st, sceneIdx - 1))
        setSceneIdx(sceneIdx - 1)
        setStepReady(false)
        resetTrial()
    }

    const renderTrial = (i: number) => {
        const t = trials[i]
        const key = `trial-${i}`
        const isCurrent = key === latestSceneKey
        const isDone = !isCurrent || checked
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <Fragment key={`${key}-${nonceFor(key)}`}>
                    {i === 0 && (
                        <div className="w-full flex items-center gap-3" aria-hidden>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                            <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Потренируемся</span>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                        </div>
                    )}
                    <div className="relative w-full flex items-center justify-center min-h-9">
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                            style={{ borderColor: hexToRgba(PI_COLOR, 0.55), backgroundColor: hexToRgba(PI_COLOR, 0.16), color: PI_COLOR }}
                        >
                            <span>{i + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIAL_COUNT}</span>
                        </div>
                        <p className="text-base md:text-lg text-[#F2F7FB] text-center px-16">Во что превратится функция?</p>
                    </div>
                    <TrialFormula t={t} result={isDone ? answerOf(t) : null} />
                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
                        {ALL_FN.map((fn) => {
                            const isWrong = isCurrent && wrongTried.includes(fn)
                            const isRight = isDone && fn === answerOf(t)
                            return (
                                <button
                                    key={fn} type="button" disabled={isDone || isWrong}
                                    onClick={() => answer(t, fn)}
                                    className={cn(
                                        'min-h-[60px] rounded-xl border-2 text-2xl font-black transition-colors px-2',
                                        isRight ? 'border-[#A1D151] bg-[#A1D15122]' : isWrong ? 'border-[#DC605B] bg-[#DC605B22]' : 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]',
                                    )}
                                    style={{ ...LABEL_STYLE, color: isRight ? '#A1D151' : isWrong ? '#DC605B' : FN_COLOR[fn] }}
                                >
                                    {fn}
                                </button>
                            )
                        })}
                    </div>
                    {isCurrent && !checked && wrongFlash && (
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                            <X className="w-5 h-5" /> {wrongFlash}
                        </div>
                    )}
                    {isDone && (
                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                            {CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]} {hintFor(t)}
                        </FieryFeedbackBanner>
                    )}
                    {isCurrent && checked && <LocalAnswerConfetti />}
                </Fragment>
            </SceneWrapper>
        )
    }

    const mapEntries: AdminMapEntry[] = [
        { dotKey: 's0', label: 'Формула приведения', jumpKey: 'step-0', isActive: latestSceneKey === 'step-0', color: MAP_INTRO_COLOR },
        { dotKey: 's1', label: 'Правило: МЕНЯЕМ', jumpKey: 'step-1', isActive: latestSceneKey === 'step-1', color: MAP_INTRO_COLOR },
        { dotKey: 's2', label: 'Правило: НЕ МЕНЯЕМ', jumpKey: 'step-2', isActive: latestSceneKey === 'step-2', color: MAP_INTRO_COLOR },
        { dotKey: 'trials', label: `Упражнения (${TRIAL_COUNT})`, jumpKey: 'trial-0', isActive: current.kind === 'trial', color: MAP_PRACTICE_COLOR },
        { dotKey: 's3', label: 'sin(x + π/2): где окажемся', jumpKey: 'step-3', isActive: latestSceneKey === 'step-3', color: MAP_INTRO_COLOR },
        { dotKey: 's4', label: 'sin(x + π/2): знак', jumpKey: 'step-4', isActive: latestSceneKey === 'step-4', color: MAP_INTRO_COLOR },
        { dotKey: 's5', label: 'cos(3π/2 + x): где окажемся', jumpKey: 'step-5', isActive: latestSceneKey === 'step-5', color: MAP_INTRO_COLOR },
        { dotKey: 's6', label: 'cos(3π/2 + x): знак', jumpKey: 'step-6', isActive: latestSceneKey === 'step-6', color: MAP_INTRO_COLOR },
    ]

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENE_KEYS.slice(startIdx, sceneIdx + 1).map((k) => {
                    if (k.kind === 'trial') return renderTrial(k.idx)
                    const Scene = INTRO_SCENES[k.idx]
                    const key = keyName(k)
                    return (
                        <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                            <Fragment key={`${key}-${nonceFor(key)}`}>
                                <Scene onSettled={() => key === latestSceneKey && setStepReady(true)} />
                            </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>
            {(current.kind === 'intro' || checked) && (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || sceneIdx === 0} />
                    {(() => {
                        const enabled = (current.kind === 'intro' ? stepReady : checked) && !advancing
                        return (
                            <button type="button" onClick={handleNext} disabled={!enabled} className={walkthroughButtonClass(enabled)} style={walkthroughButtonStyle(enabled)}>
                                {isLast ? 'Готово' : nextLabel}
                            </button>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}
