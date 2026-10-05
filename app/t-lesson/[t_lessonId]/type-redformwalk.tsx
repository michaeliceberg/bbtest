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

import { Fragment, useEffect, useState } from 'react'
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
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'

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
const PLUS_COLOR = '#A1D151'
const HOUSE_STICKER = '/lesson-pics/house-sticker.webp'
const PI = Math.PI

// ===== Крупный печатаемый текст (части: цвет / стикер) =====
type BigPart = { text: string; color?: string; sticker?: boolean }
const TypedBig = ({ parts, onDone, readMs = 500, small = false }: { parts: BigPart[]; onDone?: () => void; readMs?: number; small?: boolean }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className={`w-full text-center font-black text-[#F2F7FB] ${small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>
            {!typed ? (
                <Typewriter text={parts.map((p) => p.text).join('')} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }} />
            ) : (
                parts.map((p, i) => p.sticker && p.color ? (
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
const Marked = ({ children, active }: { children: React.ReactNode; active: boolean }) => (
    <span className="relative inline-block px-1">
        {children}
        {active && <MarkerLoop />}
    </span>
)

const Formula = ({ markPi = false, markX = false, markSin = false, plain = false, className = 'text-5xl md:text-6xl' }: { markPi?: boolean; markX?: boolean; markSin?: boolean; plain?: boolean; className?: string }) => (
    <motion.div
        initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className={`w-full flex items-center justify-center font-black text-[#F2F7FB] py-3 ${className}`}
    >
        <Marked active={markSin}><span style={{ color: plain ? '#F2F7FB' : SIN_COLOR }}>sin</span></Marked>
        <span>(</span>
        <Marked active={markX}><span style={{ color: plain ? '#F2F7FB' : STEP_COLOR }}>x</span></Marked>
        <span className="mx-1">+</span>
        <Marked active={markPi}><span style={{ color: PI_COLOR }}><Frac num="π" den="2" /></span></Marked>
        <span>)</span>
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
    plusArc?: 'instant' | 'play' | null      // дуга от домика до π/2
    stepArc?: 'play' | 'instant' | null      // маленький шаг π/2 → π/2 + STEP
    onPlusDone?: () => void
    onStepDone?: () => void
    pointer?: boolean                         // стрелка на точку
    sinBold?: boolean                         // ось sin крупно ещё раз
    upperHalf?: boolean                       // 1 и 2 четверти маркером
    stepLabel?: boolean                       // стикер «x» у маленького шага
}
const STEP = PI / 6 // 30°
const TARGET = PI / 2 + STEP

const RedCircle = ({ plusArc = null, stepArc = null, onPlusDone, onStepDone, pointer = false, sinBold = false, upperHalf = false, stepLabel = false }: CircleProps) => {
    const p = pt(TARGET)
    const tail = pt(TARGET + 0.22, R + 62)
    const head = pt(TARGET + 0.04, R + 14)
    const lp = pt(PI / 2 + STEP / 2, R + 30)
    return (
        <svg viewBox="-30 0 360 300" className="w-full max-w-[360px] h-auto mx-auto block select-none overflow-visible">
            {/* 1 и 2 четверти — крупный маркер по верхней полуокружности */}
            {upperHalf && (
                <>
                    <motion.path d={arcSeg(0, PI)} fill="none" stroke={hexToRgba(SIN_COLOR, 0.4)} strokeWidth={26} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
                    {[{ a: PI / 4, n: '1' }, { a: (3 * PI) / 4, n: '2' }].map(({ a, n }, i) => {
                        const q = pt(a, 50)
                        return (
                            <g key={n} transform={`translate(${q.x} ${q.y})`}>
                                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8, delay: 1 + i * 0.3 }}>
                                    <circle r={17} fill={hexToRgba(SIN_COLOR, 0.25)} stroke={SIN_COLOR} strokeWidth={2.5} />
                                    <text textAnchor="middle" dominantBaseline="central" fontSize={22} fill={SIN_COLOR} style={LABEL_STYLE}>{n}</text>
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
            {/* ось sin ещё раз — крупно, вверх */}
            {sinBold && (
                <motion.line x1={C} y1={C} x2={C} y2={C - AX + 4} stroke={SIN_COLOR} strokeWidth={12} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            )}
            {/* дуги пути */}
            {plusArc && <TravelSegment from={0} to={PI / 2} color={PLUS_COLOR} play={plusArc === 'play'} instant={plusArc === 'instant'} dot={plusArc === 'play' || stepArc === null} onDone={onPlusDone} />}
            {stepArc && <TravelSegment from={PI / 2} to={TARGET} color={STEP_COLOR} play={stepArc === 'play'} instant={stepArc === 'instant'} dot width={8} onDone={onStepDone} />}
            {/* подпись «x» у маленького шага */}
            {stepLabel && (
                <g transform={`translate(${lp.x} ${lp.y})`}>
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>
                        <rect x={-14} y={-15} width={28} height={30} rx={8} fill={hexToRgba(STEP_COLOR, 0.2)} stroke={STEP_COLOR} strokeWidth={2.5} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={20} fill={STEP_COLOR} style={LABEL_STYLE}>x</text>
                    </motion.g>
                </g>
            )}
            {/* стрелка на точку */}
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
                    parts={[{ text: 'Именно такой кусочек ' }, { text: 'π/2', color: PI_COLOR, sticker: true }, { text: ' и есть формула приведения' }]}
                    onDone={() => setPhase(2)} readMs={400}
                />
            )}
        </>
    )
}

// 0б. Правило: прибавили/вычли π/2, 3π/2, 5π/2… — функция меняется.
const RULE_PAIRS: { from: string; to: string; fromColor: string; toColor: string }[] = [
    { from: 'sin', to: 'cos', fromColor: SIN_COLOR, toColor: COS_COLOR },
    { from: 'cos', to: 'sin', fromColor: COS_COLOR, toColor: SIN_COLOR },
    { from: 'tg', to: 'ctg', fromColor: TG_COLOR, toColor: CTG_COLOR },
    { from: 'ctg', to: 'tg', fromColor: CTG_COLOR, toColor: TG_COLOR },
]
const RuleScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [shown, setShown] = useState(0)
    useEffect(() => {
        if (phase < 1) return
        if (shown >= RULE_PAIRS.length) {
            const t = setTimeout(() => setPhase((p) => (p < 2 ? 2 : p)), 1100)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : 900)
        return () => clearTimeout(t)
    }, [phase, shown])
    return (
        <>
            <TypedBig
                parts={[
                    { text: 'Если прибавляем или вычитаем ' }, { text: 'π/2', color: PI_COLOR }, { text: ', ' },
                    { text: '3π/2', color: PI_COLOR }, { text: ', ' }, { text: '5π/2', color: PI_COLOR },
                    { text: ' или всё что угодно с ' }, { text: 'π/2', color: PI_COLOR },
                    { text: ' — функция ' }, { text: 'МЕНЯЕТСЯ', color: STEP_COLOR },
                ]}
                onDone={() => setPhase(1)} readMs={400}
            />
            {phase >= 1 && (
                <div className="w-full grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {RULE_PAIRS.map((r, i) => i < shown && (
                        <motion.div
                            key={r.from}
                            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#3A464E] bg-[#161F23] py-4 text-3xl md:text-4xl font-black"
                            style={LABEL_STYLE}
                        >
                            <span style={{ color: r.fromColor }}>{r.from}</span>
                            <span className="text-[#F2F7FB]">→</span>
                            <span style={{ color: r.toColor }}>{r.to}</span>
                        </motion.div>
                    ))}
                </div>
            )}
            {phase >= 2 && (
                <TypedBig
                    parts={[
                        { text: 'А если прибавляем или вычитаем ' }, { text: 'π', color: PI_COLOR }, { text: ', ' },
                        { text: '2π', color: PI_COLOR }, { text: ', ' }, { text: '3π', color: PI_COLOR },
                        { text: ' — функция ' }, { text: 'НЕ МЕНЯЕТСЯ', color: PLUS_COLOR },
                    ]}
                    onDone={() => onSettled?.()} readMs={500}
                />
            )}
        </>
    )
}

// 1. Где мы окажемся, придя в x + π/2: сначала идём в плюс π/2.
const WhereScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig
                parts={[{ text: 'Чтобы понять, чему равен sin(x + π/2), сначала поймём, где мы окажемся, придя в x + π/2' }]}
                onDone={() => setPhase(1)} readMs={600}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => (p < 2 ? 2 : p)), 600)}>
                    <RedCircle plusArc={phase >= 3 ? 'play' : null} onPlusDone={() => setTimeout(() => setPhase(4), 400)} />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedBig parts={[{ text: 'Сначала пройдём в ' }, { text: 'ПЛЮС', color: PLUS_COLOR }, { text: ' π/2' }]} onDone={() => setPhase((p) => (p < 3 ? 3 : p))} readMs={500} />
            )}
            {phase >= 4 && (
                <TypedBig parts={[{ text: 'Ок, мы ' }, { text: 'НАВЕРХУ', color: PLUS_COLOR }, { text: '.' }]} onDone={() => onSettled?.()} readMs={400} />
            )}
        </>
    )
}

// 2. x — маленький шаг в плюс: ещё 30° — и мы во второй четверти.
const StepScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setPhase(1), 800)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        if (phase !== 5) return
        const t = setTimeout(() => onSettled?.(), 1800)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <Formula markX={phase >= 1} className="text-4xl md:text-5xl" />
            {phase >= 1 && (
                <TypedBig
                    parts={[{ text: 'А ' }, { text: 'x', color: STEP_COLOR, sticker: true }, { text: ' — это маленький ' }, { text: 'шаг', color: STEP_COLOR, sticker: true }, { text: ' в направлении ' }, { text: 'ПЛЮС', color: PLUS_COLOR }]}
                    onDone={() => setPhase(2)} readMs={500}
                />
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => (p < 3 ? 3 : p)), 500)}>
                    <RedCircle
                        plusArc="instant"
                        stepArc={phase >= 3 ? 'play' : null}
                        stepLabel={phase >= 4}
                        pointer={phase >= 5}
                        onStepDone={() => setTimeout(() => setPhase(4), 400)}
                    />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <TypedBig parts={[{ text: 'И мы оказались в ' }, { text: 'ЭТОЙ', color: STEP_COLOR, sticker: true }, { text: ' точке' }]} onDone={() => setPhase(5)} readMs={300} />
            )}
        </>
    )
}

// 3. Исходная функция — синус: ось вверх, точка в верхней полуплоскости → плюс.
//   phase: 1 «Наша функция — СИНУС» (+маркер sin), 2 диаграмма, 3 текст про ось,
//   4 ось крупно, 5 текст про полуплоскость, 6 маркер 1–2 четвертей, 7 вывод.
const SignScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setPhase(1), 800)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        const next: Record<number, [number, number]> = { 4: [5, 1500], 6: [7, 2400] }
        const step = next[phase]
        if (!step) return
        const t = setTimeout(() => setPhase(step[0]), step[1])
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <Formula markSin={phase >= 1} className="text-4xl md:text-5xl" />
            {phase >= 1 && (
                <TypedBig parts={[{ text: 'Наша исходная функция — ' }, { text: 'СИНУС', color: SIN_COLOR }]} onDone={() => setPhase((p) => (p < 2 ? 2 : p))} readMs={900} />
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => (p < 3 ? 3 : p)), 500)}>
                    <RedCircle plusArc="instant" stepArc="instant" stepLabel pointer sinBold={phase >= 4} upperHalf={phase >= 6} />
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedBig
                    parts={[{ text: 'Так как ось ' }, { text: 'sin', color: SIN_COLOR, sticker: true }, { text: ' направлена ' }, { text: 'ВВЕРХ', color: SIN_COLOR }]}
                    onDone={() => setPhase((p) => (p < 4 ? 4 : p))} readMs={300}
                />
            )}
            {phase >= 5 && (
                <TypedBig
                    parts={[{ text: 'и наша точка оказалась в верхней ' }, { text: 'ПОЛУПЛОСКОСТИ', color: SIN_COLOR }]}
                    onDone={() => setPhase((p) => (p < 6 ? 6 : p))} readMs={300}
                />
            )}
            {phase >= 7 && (
                <TypedBig
                    parts={[{ text: 'то получится ' }, { text: 'ПОЛОЖИТЕЛЬНЫЙ', color: PLUS_COLOR }, { text: ' косинус' }]}
                    onDone={() => onSettled?.()} readMs={400}
                />
            )}
        </>
    )
}

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
const INTRO_SCENES = [FormulaScene, RuleScene, WhereScene, StepScene, SignScene]
type SceneKey = { kind: 'intro'; idx: number } | { kind: 'trial'; idx: number }
const SCENE_KEYS: SceneKey[] = [
    { kind: 'intro', idx: 0 }, { kind: 'intro', idx: 1 },
    ...Array.from({ length: TRIAL_COUNT }, (_, i): SceneKey => ({ kind: 'trial', idx: i })),
    { kind: 'intro', idx: 2 }, { kind: 'intro', idx: 3 }, { kind: 'intro', idx: 4 },
]
const keyName = (k: SceneKey) => (k.kind === 'intro' ? `step-${k.idx}` : `trial-${k.idx}`)

export const TypeRedFormWalk = ({ onAnswer, onComplete }: Props) => {
    const [sceneIdx, setSceneIdx] = useState(0)
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
    const handleBack = () => {
        if (advancing || sceneIdx === 0) return
        bumpNonce(keyName(SCENE_KEYS[sceneIdx - 1]))
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

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {SCENE_KEYS.slice(0, sceneIdx + 1).map((k) => {
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
