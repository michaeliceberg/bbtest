// app/t-lesson/[t_lessonId]/type-trigcirclewalk.tsx
//
// TRIGCIRCWALK — «Тригонометрическая окружность: знакомство» (юнит
// «Тригонометрическая окружность», t_unit=30, первым уроком — перед
// «Радианы и градусы» и «Секторы»). Интерактивные сцены:
//   1. окружность рисуется;
//   2. «вправо — cos, вверх — sin» (оси с подписями);
//   3. игра «подпиши оси сам» — подсвечена ось, выбери подпись;
//   4. «режем окружность»: 2π = 360° → пополам π = 180° → ещё пополам
//      π/2 = 90° → π на 3 части = 60° → на 6 частей = 30°;
//   5. точка СТАРТ справа; углы + и −: кнопки «+90°» (против часовой) и «−90°» (по часовой);
//   6. бонус: ось тангенсов справа, смотрит вверх; tg 45° = 1.
// Потом 7 тренировочных заданий, режим «пробуй, пока не угадаешь».
// Тот же самодостаточный принцип, что у остальных *WALK.

'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Scissors, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Цвета — те же роли, что в разборах «Таблица 30°, 45°, 60°».
const COS_COLOR = GGEGE_PALETTE.green.button
const SIN_COLOR = GGEGE_PALETTE.orange.button
const TG_COLOR = GGEGE_PALETTE.raspberry.button
const ARC_COLOR = GGEGE_PALETTE.blue.button
const PLUS_COLOR = '#A1D151'
const MINUS_COLOR = '#DC605B'
const ATTENTION = GGEGE_PALETTE.orange.button
const PI = Math.PI
const TEXT = 'w-full text-base md:text-lg text-[#F2F7FB]'

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// ===== Текст =====
const Pop = ({ delay = 0, children, className }: { delay?: number; children: React.ReactNode; className?: string }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        className={cn('inline-flex', className)}
    >
        {children}
    </motion.span>
)

// Крупная фраза: печатается белым, после печати куски раскрашиваются.
type BigPart = { text: string; color?: string }
const TypedBig = ({ parts, onDone, readMs = 500 }: { parts: BigPart[]; onDone?: () => void; readMs?: number }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-center text-2xl md:text-3xl font-black text-[#F2F7FB]">
            {!typed ? (
                <Typewriter text={parts.map((p) => p.text).join('')} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }} />
            ) : (
                parts.map((p, i) => <span key={i} style={p.color ? { color: p.color } : undefined}>{p.text}</span>)
            )}
        </div>
    )
}

// «π/2» → дробь, «−π/3» → минус + дробь, «180°» → как есть.
const Frac = ({ num, den }: { num: string; den: string }) => (
    <span className="inline-flex flex-col leading-none align-middle mx-0.5">
        <span className="pb-1 border-b-2 border-current px-1 text-center">{num}</span>
        <span className="pt-1 px-1 text-center">{den}</span>
    </span>
)
const Rad = ({ s }: { s: string }) => {
    const m = s.match(/^([+−-]?)(.*)\/(\d+)$/)
    if (!m) return <span className="whitespace-nowrap">{s}</span>
    return (
        <span className="inline-flex items-center whitespace-nowrap">
            {m[1] && <span>{m[1]}</span>}
            <Frac num={m[2]} den={m[3]} />
        </span>
    )
}

// ===== Окружность (SVG) =====
const C = 150
const R = 92
const AX = 128
const pt = (a: number, r = R) => ({ x: C + r * Math.cos(a), y: C - r * Math.sin(a) })
// Дуга от 0 до `to` (to > 0 — против часовой, to < 0 — по часовой).
const arcPath = (to: number, r = R) => {
    const p0 = pt(0, r)
    const sweep = to > 0 ? 0 : 1
    if (Math.abs(to) >= 2 * PI - 1e-6) {
        const mid = pt(to / 2, r)
        return `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 ${sweep} ${mid.x} ${mid.y} A ${r} ${r} 0 1 ${sweep} ${p0.x} ${p0.y}`
    }
    const p1 = pt(to, r)
    const large = Math.abs(to) > PI ? 1 : 0
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`
}
const sectorPath = (to: number) =>
    Math.abs(to) >= 2 * PI - 1e-6
        ? `M ${C - R} ${C} A ${R} ${R} 0 1 0 ${C + R} ${C} A ${R} ${R} 0 1 0 ${C - R} ${C} Z`
        : `M ${C} ${C} L ${pt(0).x} ${pt(0).y} ${arcPath(to).replace(/^M [^A]+/, '')} Z`

const Arrowhead = ({ x, y, dx, dy, color, size = 9 }: { x: number; y: number; dx: number; dy: number; color: string; size?: number }) => {
    // (dx, dy) — направление в экранных координатах, (x, y) — острие.
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const bx = x - ux * size
    const by = y - uy * size
    return <polygon points={`${x},${y} ${bx - uy * size * 0.6},${by + ux * size * 0.6} ${bx + uy * size * 0.6},${by - ux * size * 0.6}`} fill={color} />
}

type Axis = 'cos' | 'sin'
type CanvasProps = {
    axes?: boolean
    labels?: { cos?: boolean; sin?: boolean }
    glowAxis?: { axis: Axis; color: string } | null
    arc?: { to: number; color: string; key: string } | null
    cuts?: number[]
    tg?: boolean
    tgRay?: boolean
    drawCircle?: boolean
    start?: boolean
}
const LABEL_STYLE = { fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 } as const

const CircleCanvas = ({ axes = true, labels = {}, glowAxis = null, arc = null, cuts = [], tg = false, tgRay = false, drawCircle = false, start = false }: CanvasProps) => {
    const axisColor = (a: Axis) => (glowAxis?.axis === a ? glowAxis.color : labels[a] ? (a === 'cos' ? COS_COLOR : SIN_COLOR) : '#9AA7B0')
    const tangentDir = (to: number) => {
        const t = to > 0 ? to + PI / 2 : to - PI / 2
        return { dx: Math.cos(t), dy: -Math.sin(t) }
    }
    return (
        <svg viewBox="0 0 300 300" className="w-full max-w-[360px] h-auto mx-auto block">
            {arc && (
                <motion.path key={`s-${arc.key}`} d={sectorPath(arc.to)} fill={hexToRgba(arc.color, 0.16)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} />
            )}
            {/* Окружность */}
            <motion.circle
                cx={C} cy={C} r={R} fill="none" stroke="#F2F7FB" strokeWidth={3}
                initial={drawCircle ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
            {/* Разрезы — радиусы по углам */}
            {cuts.map((a) => (
                <motion.line
                    key={`cut-${a.toFixed(4)}`}
                    x1={C} y1={C} x2={pt(a).x} y2={pt(a).y}
                    stroke={ATTENTION} strokeWidth={2.5} strokeDasharray="6 5"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                />
            ))}
            {axes && (
                <>
                    {glowAxis && (
                        glowAxis.axis === 'cos'
                            ? <line x1={C - AX} y1={C} x2={C + AX} y2={C} stroke={hexToRgba(glowAxis.color, 0.35)} strokeWidth={14} strokeLinecap="round" />
                            : <line x1={C} y1={C + AX} x2={C} y2={C - AX} stroke={hexToRgba(glowAxis.color, 0.35)} strokeWidth={14} strokeLinecap="round" />
                    )}
                    <line x1={C - AX} y1={C} x2={C + AX - 4} y2={C} stroke={axisColor('cos')} strokeWidth={3} />
                    <Arrowhead x={C + AX + 4} y={C} dx={1} dy={0} color={axisColor('cos')} size={12} />
                    <line x1={C} y1={C + AX} x2={C} y2={C - AX + 4} stroke={axisColor('sin')} strokeWidth={3} />
                    <Arrowhead x={C} y={C - AX - 4} dx={0} dy={-1} color={axisColor('sin')} size={12} />
                    {labels.cos && (
                        <motion.text key="lc" x={C + AX - 6} y={C - 12} textAnchor="middle" fontSize={22} fill={COS_COLOR} style={LABEL_STYLE}
                            initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.55 }}>
                            cos
                        </motion.text>
                    )}
                    {labels.sin && (
                        <motion.text key="ls" x={C - 22} y={C - AX + 10} textAnchor="middle" fontSize={22} fill={SIN_COLOR} style={LABEL_STYLE}
                            initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.55 }}>
                            sin
                        </motion.text>
                    )}
                </>
            )}
            {/* Ось тангенсов — касательная справа, смотрит вверх */}
            {tg && (
                <>
                    <motion.line x1={C + R} y1={C + 110} x2={C + R} y2={C - AX + 2} stroke={TG_COLOR} strokeWidth={3}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                        <Arrowhead x={C + R} y={C - AX - 6} dx={0} dy={-1} color={TG_COLOR} size={12} />
                        <text x={C + R + 26} y={C - AX + 6} textAnchor="middle" fontSize={22} fill={TG_COLOR} style={LABEL_STYLE}>tg</text>
                        <line x1={C + R - 6} y1={C - R} x2={C + R + 6} y2={C - R} stroke={TG_COLOR} strokeWidth={3} />
                        <text x={C + R + 16} y={C - R + 6} fontSize={16} fill={TG_COLOR} style={LABEL_STYLE}>1</text>
                        <text x={C + R + 8} y={C + 18} fontSize={16} fill={TG_COLOR} style={LABEL_STYLE}>0</text>
                    </motion.g>
                </>
            )}
            {tgRay && (
                <>
                    <motion.line x1={C} y1={C} x2={C + R} y2={C - R} stroke={ARC_COLOR} strokeWidth={3}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
                    <motion.circle cx={C + R} cy={C - R} fill={TG_COLOR} initial={{ r: 0 }} animate={{ r: 7 }} transition={{ delay: 0.9, type: 'spring', bounce: 0.6 }} />
                    <motion.circle cx={pt(PI / 4).x} cy={pt(PI / 4).y} fill={ARC_COLOR} initial={{ r: 0 }} animate={{ r: 6 }} transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }} />
                </>
            )}
            {/* Дуга угла со стрелкой на конце */}
            {arc && (
                <>
                    <motion.path key={`a-${arc.key}`} d={arcPath(arc.to, R)} fill="none" stroke={arc.color} strokeWidth={7} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
                    {Math.abs(arc.to) < 2 * PI - 1e-6 && (
                        <motion.g key={`h-${arc.key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
                            <line x1={C} y1={C} x2={pt(arc.to).x} y2={pt(arc.to).y} stroke={arc.color} strokeWidth={2.5} />
                            <Arrowhead x={pt(arc.to).x + tangentDir(arc.to).dx * 6} y={pt(arc.to).y + tangentDir(arc.to).dy * 6} {...tangentDir(arc.to)} color={arc.color} size={14} />
                            <circle cx={pt(arc.to).x} cy={pt(arc.to).y} r={6} fill={arc.color} />
                        </motion.g>
                    )}
                    <circle cx={pt(0).x} cy={pt(0).y} r={5} fill="#F2F7FB" />
                </>
            )}
            {/* Точка СТАРТ — справа, отсюда отсчитываются углы */}
            {start && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                    <motion.circle cx={C + R} cy={C} r={11} fill="none" stroke={ATTENTION} strokeWidth={3}
                        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    <circle cx={C + R} cy={C} r={6} fill={ATTENTION} />
                    <text x={C + R + 4} y={C + 32} textAnchor="middle" fontSize={17} fill={ATTENTION} style={LABEL_STYLE}>СТАРТ</text>
                </motion.g>
            )}
            <circle cx={C} cy={C} r={4} fill="#F2F7FB" />
        </svg>
    )
}

// ===== Сцены =====
const IntroScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig parts={[{ text: 'Это ' }, { text: 'тригонометрическая окружность', color: ARC_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1200)}>
                    <CircleCanvas axes={false} drawCircle />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedLine className={TEXT} text="Центр — в нуле, радиус равен 1. На ней мы будем откладывать углы." onSettled={onSettled} />}
        </>
    )
}

const AxesScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase === 1) { const t = setTimeout(() => setPhase(2), 1000); return () => clearTimeout(t) }
        if (phase === 2) { const t = setTimeout(() => setPhase(3), 1000); return () => clearTimeout(t) }
    }, [phase])
    return (
        <>
            <TypedBig
                parts={[{ text: 'Запомни: ВПРАВО — ось ' }, { text: 'cos', color: COS_COLOR }, { text: ', ВВЕРХ — ось ' }, { text: 'sin', color: SIN_COLOR }]}
                onDone={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <CircleCanvas labels={{ cos: phase >= 2, sin: phase >= 3 }} />
                </DiagramBlock>
            )}
            {phase >= 3 && <TypedLine className={TEXT} text="Так на любой тригонометрической окружности — всегда." onSettled={onSettled} />}
        </>
    )
}

// Игра: подсвечена ось — выбери для неё подпись.
const AXIS_ORDER: Axis[] = ['cos', 'sin']
const AxisGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [ready, setReady] = useState(false)
    const [chips] = useState(() => shuffle<Axis>(['cos', 'sin']))
    const [filled, setFilled] = useState(0)
    const [wrong, setWrong] = useState<Axis | null>(null)
    const done = filled >= AXIS_ORDER.length
    const cur = done ? null : AXIS_ORDER[filled]
    useEffect(() => {
        if (!wrong) return
        const t = setTimeout(() => setWrong(null), 700)
        return () => clearTimeout(t)
    }, [wrong])
    const tap = (a: Axis) => {
        if (done) return
        playSound('/click6.wav')
        if (a === cur) {
            setFilled(filled + 1)
            setWrong(null)
            if (filled + 1 >= AXIS_ORDER.length) setTimeout(() => onSettled?.(), 1000)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrong(a)
        }
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Подпиши оси сам!' }]} onDone={() => setReady(true)} readMs={200} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-4 py-1">
                        <p className="text-base md:text-lg text-[#9AA7B0] text-center">
                            {done ? ' ' : 'Какая это ось? Подсвечена оранжевым.'}
                        </p>
                        <CircleCanvas
                            labels={{ cos: filled >= 1, sin: filled >= 2 }}
                            glowAxis={cur ? { axis: cur, color: wrong ? '#DC605B' : ATTENTION } : null}
                        />
                        {!done ? (
                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                {chips.map((a) => {
                                    const used = AXIS_ORDER.slice(0, filled).includes(a)
                                    return (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => tap(a)}
                                            disabled={used}
                                            className={cn(
                                                'min-h-[64px] rounded-xl border-2 text-2xl font-black transition-[opacity,border-color,background-color] duration-200',
                                                used && 'opacity-0 pointer-events-none',
                                                wrong === a ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]',
                                            )}
                                            style={wrong === a ? undefined : { color: a === 'cos' ? COS_COLOR : SIN_COLOR }}
                                        >
                                            {a}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-lg font-black text-[#A1D151]">Вправо — cos, вверх — sin. Отлично!</p>
                        )}
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// Режем окружность: 2π → π → π/2 → π/3 → π/6.
type CutStep = { to: number; div: number; rad: string; deg: string; btn: string; line: string }
const CUT_STEPS: CutStep[] = [
    { to: PI, div: 1, rad: 'π', deg: '180°', btn: 'Разрежь пополам', line: 'Половина окружности — это π. То есть π = 180°!' },
    { to: PI / 2, div: 2, rad: 'π/2', deg: '90°', btn: 'Ещё раз пополам', line: 'Половинка от π — это π/2 = 90°.' },
    { to: PI / 3, div: 3, rad: 'π/3', deg: '60°', btn: 'Раздели π на 3 части', line: 'π на три части: π/3 = 180° : 3 = 60°.' },
    { to: PI / 6, div: 6, rad: 'π/6', deg: '30°', btn: 'Раздели π на 6 частей', line: 'π на шесть частей: π/6 = 180° : 6 = 30°.' },
]
const cutAngles = (div: number) => Array.from({ length: div + 1 }, (_, k) => (k * PI) / div)

const AngleBadge = ({ rad, deg, color }: { rad: string; deg: string; color: string }) => (
    <Pop key={rad}>
        <span className="flex items-center gap-2 text-3xl md:text-4xl font-black" style={{ color }}>
            <Rad s={rad} /> <span className="text-[#F2F7FB]">=</span> <span>{deg}</span>
        </span>
    </Pop>
)

const CutButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
        type="button"
        onClick={() => { playSound('/click6.wav'); onClick() }}
        className="flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-lg font-black animate-pulse"
        style={{ borderColor: ATTENTION, backgroundColor: hexToRgba(ATTENTION, 0.16), color: ATTENTION }}
    >
        <Scissors className="w-5 h-5" /> {label}
    </button>
)

const CutScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 печать, 1 полный круг
    const [step, setStep] = useState(-1)
    const [btnReady, setBtnReady] = useState(false)
    const cur = step >= 0 ? CUT_STEPS[step] : null
    return (
        <>
            <TypedBig
                parts={[{ text: 'Полный круг — это ' }, { text: '2π = 360°', color: ARC_COLOR }]}
                onDone={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setBtnReady(true), 900)}>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas
                            axes={false}
                            arc={{ to: cur ? cur.to : 2 * PI, color: ARC_COLOR, key: `cut-${step}` }}
                            cuts={cur ? cutAngles(cur.div) : []}
                        />
                        <div className="h-16 flex items-center justify-center">
                            {cur ? <AngleBadge rad={cur.rad} deg={cur.deg} color={ARC_COLOR} /> : <AngleBadge rad="2π" deg="360°" color={ARC_COLOR} />}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {cur && (
                <TypedLine
                    key={step}
                    className={TEXT}
                    text={cur.line}
                    onSettled={() => (step + 1 < CUT_STEPS.length ? setBtnReady(true) : onSettled?.())}
                />
            )}
            {btnReady && step + 1 < CUT_STEPS.length && (
                <div className="w-full flex justify-center">
                    <CutButton label={CUT_STEPS[step + 1].btn} onClick={() => { setBtnReady(false); setStep(step + 1) }} />
                </div>
            )}
        </>
    )
}

// Углы + и −.
const SignScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [shown, setShown] = useState<'plus' | 'minus' | null>(null)
    const [tried, setTried] = useState<{ plus: boolean; minus: boolean }>({ plus: false, minus: false })
    const both = tried.plus && tried.minus
    useEffect(() => {
        if (!both) return
        const t = setTimeout(() => onSettled?.(), 1800)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [both])
    const press = (k: 'plus' | 'minus') => {
        playSound('/click6.wav')
        setShown(k)
        setTried((t) => ({ ...t, [k]: true }))
    }
    const btn = (k: 'plus' | 'minus') => {
        const color = k === 'plus' ? PLUS_COLOR : MINUS_COLOR
        return (
            <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className={cn('flex flex-col items-center rounded-xl border-2 px-3 py-2 font-black', !tried[k] && 'animate-pulse')}
                style={{ borderColor: color, backgroundColor: hexToRgba(color, shown === k ? 0.25 : 0.1), color }}
            >
                <span className="text-2xl"><Rad s={k === 'plus' ? '+π/2' : '−π/2'} /></span>
                <span className="text-sm">{k === 'plus' ? 'против часовой' : 'по часовой'}</span>
            </button>
        )
    }
    return (
        <>
            <TypedBig
                parts={[{ text: 'Углы бывают ' }, { text: 'ПОЛОЖИТЕЛЬНЫЕ', color: PLUS_COLOR }, { text: ' и ' }, { text: 'ОТРИЦАТЕЛЬНЫЕ', color: MINUS_COLOR }]}
                onDone={() => setPhase(1)}
            />
            {phase >= 1 && <TypedLine className={TEXT} text="Углы всегда отсчитываем от точки СТАРТ — она справа." onSettled={() => setPhase(2)} delayAfter={200} />}
            {phase >= 2 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas
                            labels={{ cos: true, sin: true }}
                            start
                            arc={shown ? { to: shown === 'plus' ? PI / 2 : -PI / 2, color: shown === 'plus' ? PLUS_COLOR : MINUS_COLOR, key: `${shown}-${tried.plus}-${tried.minus}` } : null}
                        />
                        <div className="h-12 flex items-center justify-center">
                            {shown && (
                                <AngleBadge
                                    rad={shown === 'plus' ? '+π/2' : '−π/2'}
                                    deg={shown === 'plus' ? '+90°' : '−90°'}
                                    color={shown === 'plus' ? PLUS_COLOR : MINUS_COLOR}
                                />
                            )}
                        </div>
                        {phase >= 3 && <div className="grid grid-cols-2 gap-3 w-full max-w-xs">{btn('plus')}{btn('minus')}</div>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLine
                    className={TEXT}
                    text="Пошли от старта ВВЕРХ (против часовой) — угол положительный, ВНИЗ (по часовой) — отрицательный. Нажми обе кнопки:"
                    onSettled={() => setPhase(3)}
                    delayAfter={200}
                />
            )}
        </>
    )
}

// Бонус: ось тангенсов.
const TgScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 печать, 1 ось, 2 строка, 3 кнопка, 4 луч
    useEffect(() => {
        if (phase === 4) { const t = setTimeout(() => onSettled?.(), 2000); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <TypedBig parts={[{ text: 'БОНУС: ось ' }, { text: 'тангенсов', color: TG_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => Math.max(p, 2)), 1000)}>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas labels={{ cos: true, sin: true }} tg tgRay={phase >= 4} />
                        <div className="h-12 flex items-center justify-center">
                            {phase >= 4 && (
                                <Pop delay={1}>
                                    <span className="text-3xl font-black">
                                        <span style={{ color: TG_COLOR }}>tg</span> <span style={{ color: ARC_COLOR }}>45°</span> <span className="text-[#F2F7FB]">= 1</span>
                                    </span>
                                </Pop>
                            )}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLine className={TEXT} text="Нужна реже: вертикальная прямая справа, касается окружности и смотрит ВВЕРХ." onSettled={() => setPhase((p) => Math.max(p, 3))} delayAfter={200} />
            )}
            {phase === 3 && (
                <div className="w-full flex justify-center">
                    <button
                        type="button"
                        onClick={() => { playSound('/click6.wav'); setPhase(4) }}
                        className="rounded-xl border-2 px-5 py-3 text-lg font-black animate-pulse"
                        style={{ borderColor: TG_COLOR, backgroundColor: hexToRgba(TG_COLOR, 0.16), color: TG_COLOR }}
                    >
                        Покажи угол 45°
                    </button>
                </div>
            )}
            {phase >= 4 && <TypedLine className={TEXT} text="Продолжаем луч угла до оси тангенсов — он попадает в 1. Значит, tg 45° = 1." />}
        </>
    )
}

// ===== Тренировка =====
type Trial = { prompt: string; promptRad?: string; options: string[]; correct: string; hint: string }
const TRIAL_POOL: Trial[] = [
    { prompt: 'Сколько это градусов?', promptRad: 'π', options: ['180°', '90°', '360°', '3,14°'], correct: '180°', hint: 'π — половина окружности.' },
    { prompt: 'Сколько это градусов?', promptRad: 'π/2', options: ['90°', '45°', '180°', '60°'], correct: '90°', hint: 'Половинка от π.' },
    { prompt: 'Сколько это градусов?', promptRad: 'π/3', options: ['60°', '30°', '90°', '120°'], correct: '60°', hint: '180° : 3 = 60°.' },
    { prompt: 'Куда направлена ось косинуса?', options: ['вправо', 'вверх', 'влево', 'вниз'], correct: 'вправо', hint: 'Вправо — cos, вверх — sin.' },
    { prompt: 'Угол −π/2 — это поворот…', options: ['по часовой', 'против часовой'], correct: 'по часовой', hint: 'Минус — по часовой стрелке, вниз от старта.' },
    { prompt: 'Откуда отсчитывают углы на окружности?', options: ['справа', 'сверху', 'слева', 'снизу'], correct: 'справа', hint: 'Точка СТАРТ — справа.' },
    { prompt: 'Где ось тангенсов?', options: ['справа, смотрит вверх', 'сверху, смотрит вправо', 'совпадает с осью sin', 'слева, смотрит вниз'], correct: 'справа, смотрит вверх', hint: 'Касательная справа, направлена вверх.' },
]
const makeTrials = (): Trial[] => shuffle(TRIAL_POOL).map((t) => ({ ...t, options: shuffle(t.options) }))

const pickTrialFeedback = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
const SCENES = [IntroScene, AxesScene, AxisGameScene, CutScene, SignScene, TgScene]

export const TypeTrigCircleWalk = ({ onAnswer, onComplete }: Props) => {
    const INTRO_STEPS = SCENES.length
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials] = useState<Trial[]>(makeTrials)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<string[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const handleOptionClick = (t: Trial, o: string) => {
        playSound('/click6.wav')
        if (checked || wrongTried.includes(o)) return
        if (o === t.correct) {
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            setWrongTried((prev) => [...prev, o])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (trialIndex + 1 >= trials.length) {
                setAdvancing(false)
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
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
            if (step + 1 >= INTRO_STEPS) setPhase('practice')
            else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice(6))
            return idx > 0 ? `trial-${idx - 1}` : `step-${INTRO_STEPS - 1}`
        }
        const idx = Number(key.slice(5))
        return idx > 0 ? `step-${idx - 1}` : null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null
    const handleReplay = () => {
        bumpNonce(latestSceneKey)
        if (phase === 'intro') setStepReady(false)
    }
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            setTrialIndex(Number(target.slice(6)))
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
        } else {
            setPhase('intro')
            setStep(Number(target.slice(5)))
            setStepReady(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) =>
                    step >= i ? (
                        <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                            <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                                <Scene onSettled={() => i === step && setStepReady(true)} />
                            </Fragment>
                        </SceneWrapper>
                    ) : null,
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
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
                                <div className="relative w-full flex items-center justify-center min-h-9">
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
                                    <p className="text-base md:text-lg text-[#F2F7FB] text-center px-16">{t.prompt}</p>
                                </div>
                                {t.promptRad && (
                                    <DiagramBlock>
                                        <div className="w-full flex justify-center py-2 text-4xl font-black" style={{ color: ARC_COLOR }}>
                                            <Rad s={t.promptRad} />
                                        </div>
                                    </DiagramBlock>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {t.options.map((o) => {
                                        const isWrong = isCurrent && wrongTried.includes(o)
                                        const state = isDone && o === t.correct ? 'correct' : isWrong ? 'wrong' : 'idle'
                                        return (
                                            <button
                                                key={o}
                                                type="button"
                                                disabled={isDone || isWrong}
                                                onClick={isDone ? undefined : () => handleOptionClick(t, o)}
                                                className={cn(
                                                    'flex min-h-[64px] items-center justify-center py-3 px-3 rounded-xl border-2 text-lg md:text-xl font-extrabold text-center transition-colors',
                                                    state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
                                                    state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
                                                    state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                                )}
                                            >
                                                {o}
                                            </button>
                                        )
                                    })}
                                </div>
                                {isCurrent && !checked && (
                                    wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант выше</p>
                                    )
                                )}
                                {isDone && (
                                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                        {pickTrialFeedback(i)} {t.hint}
                                    </FieryFeedbackBanner>
                                )}
                                {isCurrent && checked && <LocalAnswerConfetti />}
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
