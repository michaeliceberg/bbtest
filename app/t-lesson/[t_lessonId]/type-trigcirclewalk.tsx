// app/t-lesson/[t_lessonId]/type-trigcirclewalk.tsx
//
// TRIGCIRCWALK — «Тригонометрическая окружность: знакомство» (урок 490,
// юнит «Тригонометрическая окружность», t_unit=30). Переделан 2026-10-02 в
// стиле урока 485 (DIRWALK): короткие сцены, на каждой ученик что-то делает
// сам, ЗАПОМНИ-плашки, видео-реакции.
//   1. Дом углов 🏠 справа (нажми на домик);
//   2. Вверх / вниз — пробуй обе кнопки;
//   3. ЗАПОМНИ: вверх — плюс, вниз — минус (+ лунная походка);
//   4. Полный круг 2π = 360°;
//   5. Режем пиццу: π, потом π/2 и 3π/2;
//   6. Мелкие кусочки π/6, π/4, π/3;
//   7. Игра «Поставь угол» — клик по окружности;
//   8. Зеркало: те же углы с минусом;
//   9. Игра «Одна точка — два имени»;
//  10. 5π/2 = 5 шагов по π/2;
//  11. Ось тангенсов — линейка у домика + ЗАПОМНИ.
// Потом квиз: клики по окружности/осям и вопросы с вариантами.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
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
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const COS_COLOR = GGEGE_PALETTE.green.button
const SIN_COLOR = GGEGE_PALETTE.orange.button
const TG_COLOR = GGEGE_PALETTE.raspberry.button
const ARC_COLOR = GGEGE_PALETTE.blue.button
const HOME_COLOR = '#F2C35B'
const REMEMBER_COLOR = '#F2C35B'
const PLUS_COLOR = '#A1D151'
const MINUS_COLOR = '#DC605B'
const PI = Math.PI
const TEXT = 'w-full text-base md:text-lg text-[#F2F7FB]'

// Видео-реакции. null — место под гифку есть, файла пока нет (не рисуем).
const VIDEO_HOME: string | null = null
const VIDEO_PIZZA: string | null = null
const VIDEO_MIRROR: string | null = null
const VIDEO_MINDBLOWN: string | null = null
const VIDEO_MOONWALK = '/video/mj-moonwalk.mp4'
const VIDEO_THINK = '/video/cat-thinking.webm'
const VIDEO_APPLAUSE = '/video/dicaprio-applause.mp4'

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// ===== Текст и мелочи =====
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

const Frac = ({ num, den }: { num: string; den: string }) => (
    <span className="inline-flex flex-col leading-none align-middle mx-0.5">
        <span className="pb-1 border-b-2 border-current px-1 text-center">{num}</span>
        <span className="pt-1 px-1 text-center">{den}</span>
    </span>
)
// «π/2» → дробь, «−π/3» → минус + дробь, «π» → как есть.
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

const ReactionVideo = ({ src, className = 'w-56' }: { src: string | null; className?: string }) =>
    src ? (
        <motion.video
            src={src} autoPlay loop muted playsInline
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
            className={cn('pointer-events-none rounded-2xl mx-auto block', className)}
        />
    ) : null

const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}>
            ЗАПОМНИ!
        </div>
    </div>
)

const ActionButton = ({ children, onClick, color = HOME_COLOR, pulse = true, disabled }: { children: React.ReactNode; onClick: () => void; color?: string; pulse?: boolean; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn('flex items-center justify-center gap-2 rounded-xl border-2 border-b-4 active:border-b-2 px-5 py-3 text-lg font-black transition-opacity', pulse && !disabled && 'animate-pulse', disabled && 'opacity-40')}
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.16), color }}
    >
        {children}
    </button>
)

// ===== Окружность (SVG) =====
const C = 150
const R = 92
const AX = 128
const LABEL_R = R + 24
const pt = (a: number, r = R) => ({ x: C + r * Math.cos(a), y: C - r * Math.sin(a) })
const norm = (a: number) => ((a % (2 * PI)) + 2 * PI) % (2 * PI)

// Дуга против часовой от a0 до a1 (a1 > a0, не больше полного круга).
const arcSeg = (a0: number, a1: number, r = R) => {
    const p0 = pt(a0, r)
    const p1 = pt(a1, r)
    const large = a1 - a0 > PI ? 1 : 0
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`
}
// Дуга от 0 до `to` (to > 0 — против часовой, to < 0 — по часовой), |to| ≤ 2π.
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

const Arrowhead = ({ x, y, dx, dy, color, size = 9 }: { x: number; y: number; dx: number; dy: number; color: string; size?: number }) => {
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const bx = x - ux * size
    const by = y - uy * size
    return <polygon points={`${x},${y} ${bx - uy * size * 0.6},${by + ux * size * 0.6} ${bx + uy * size * 0.6},${by - ux * size * 0.6}`} fill={color} />
}
const tangentDir = (to: number) => {
    const t = to > 0 ? to + PI / 2 : to - PI / 2
    return { dx: Math.cos(t), dy: -Math.sin(t) }
}

// Стандартные точки окружности: kπ/6 и π/4 + kπ/2.
const STD_ANGLES: number[] = [
    ...Array.from({ length: 12 }, (_, k) => (k * PI) / 6),
    ...Array.from({ length: 4 }, (_, k) => PI / 4 + (k * PI) / 2),
].sort((a, b) => a - b)
const nearestStd = (a: number) => {
    const n = norm(a)
    let best = 0
    let bestD = Infinity
    STD_ANGLES.forEach((s, i) => {
        const d = Math.min(Math.abs(s - n), 2 * PI - Math.abs(s - n))
        if (d < bestD) { bestD = d; best = i }
    })
    return best
}
const sameAngle = (a: number, b: number) => {
    const d = Math.abs(norm(a) - norm(b))
    return Math.min(d, 2 * PI - d) < 1e-3
}

type Mark = { key: string; a: number; label: string; color: string }
type Axis = 'cos' | 'sin' | 'tg'

type CanvasProps = {
    axes?: boolean
    axisLabels?: boolean
    tg?: boolean
    drawCircle?: boolean
    house?: boolean
    houseBounce?: number
    arc?: { to: number; color: string; key: string } | null
    segments?: { a0: number; a1: number; r?: number; key: string }[]
    cuts?: number[]
    marks?: Mark[]
    dots?: boolean
    hitDots?: { idx: number; color: string }[]
    traveler?: number | null
    onCirclePick?: (stdIdx: number) => void
    onAxisPick?: (axis: Axis) => void
    axisFlash?: { axis: Axis; color: string } | null
}
const LABEL_STYLE = { fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 } as const

// Домик 🏠 у точки старта (справа на окружности).
const House = ({ bounce = 0 }: { bounce?: number }) => {
    const x = C + R
    const y = C
    return (
        <g key={`house-${bounce}`} className={bounce ? 'animate-chest-idle-bounce' : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}>
            <polygon points={`${x - 13},${y - 4} ${x},${y - 17} ${x + 13},${y - 4}`} fill={HOME_COLOR} stroke="#8A6A1E" strokeWidth={1.5} strokeLinejoin="round" />
            <rect x={x - 10} y={y - 4} width={20} height={15} rx={2} fill={HOME_COLOR} stroke="#8A6A1E" strokeWidth={1.5} />
            <rect x={x - 3} y={y + 3} width={6} height={8} rx={1} fill="#8A6A1E" />
        </g>
    )
}

const CircleCanvas = ({
    axes = true, axisLabels = true, tg = false, drawCircle = false, house = true, houseBounce = 0,
    arc = null, segments = [], cuts = [], marks = [], dots = false, hitDots = [], traveler = null,
    onCirclePick, onAxisPick, axisFlash = null,
}: CanvasProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const pick = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!onCirclePick || !svgRef.current) return
        const r = svgRef.current.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * 300
        const y = ((e.clientY - r.top) / r.height) * 300
        if (Math.hypot(x - C, y - C) < 30) return
        onCirclePick(nearestStd(Math.atan2(C - y, x - C)))
    }
    const axisColor = (a: Axis) => {
        if (axisFlash?.axis === a) return axisFlash.color
        if (!axisLabels) return '#9AA7B0'
        return a === 'cos' ? COS_COLOR : a === 'sin' ? SIN_COLOR : TG_COLOR
    }
    const hit = (a: Axis) => (onAxisPick ? { onClick: () => onAxisPick(a), style: { cursor: 'pointer' } } : {})
    return (
        <svg ref={svgRef} viewBox="0 0 300 300" className={cn('w-full max-w-[360px] h-auto mx-auto block select-none', onCirclePick && 'cursor-pointer')} onPointerDown={pick}>
            {arc && (
                <motion.path key={`s-${arc.key}`} d={`M ${C} ${C} L ${pt(0).x} ${pt(0).y} ${arcPath(arc.to).replace(/^M [^A]+/, '')} Z`}
                    fill={hexToRgba(arc.color, 0.14)} initial={{ opacity: 0 }} animate={{ opacity: Math.abs(arc.to) < 2 * PI - 1e-6 ? 1 : 0 }} transition={{ duration: 0.6, delay: 0.5 }} />
            )}
            <motion.circle cx={C} cy={C} r={R} fill="none" stroke="#F2F7FB" strokeWidth={3}
                initial={drawCircle ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
            {cuts.map((a) => (
                <motion.line key={`cut-${a.toFixed(4)}`} x1={C} y1={C} x2={pt(a).x} y2={pt(a).y}
                    stroke={SIN_COLOR} strokeWidth={2.5} strokeDasharray="6 5"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
            ))}
            {axes && (
                <>
                    {axisFlash && axisFlash.axis !== 'tg' && (
                        axisFlash.axis === 'cos'
                            ? <line x1={C - AX} y1={C} x2={C + AX} y2={C} stroke={hexToRgba(axisFlash.color, 0.35)} strokeWidth={14} strokeLinecap="round" />
                            : <line x1={C} y1={C + AX} x2={C} y2={C - AX} stroke={hexToRgba(axisFlash.color, 0.35)} strokeWidth={14} strokeLinecap="round" />
                    )}
                    <line x1={C - AX} y1={C} x2={C + AX - 4} y2={C} stroke={axisColor('cos')} strokeWidth={3} />
                    <Arrowhead x={C + AX + 4} y={C} dx={1} dy={0} color={axisColor('cos')} size={12} />
                    <line x1={C} y1={C + AX} x2={C} y2={C - AX + 4} stroke={axisColor('sin')} strokeWidth={3} />
                    <Arrowhead x={C} y={C - AX - 4} dx={0} dy={-1} color={axisColor('sin')} size={12} />
                    {axisLabels && (
                        <>
                            <text x={C + AX - 10} y={C + 24} textAnchor="middle" fontSize={20} fill={axisColor('cos')} style={LABEL_STYLE}>cos</text>
                            <text x={C - 24} y={C - AX + 10} textAnchor="middle" fontSize={20} fill={axisColor('sin')} style={LABEL_STYLE}>sin</text>
                        </>
                    )}
                    <line x1={C - AX} y1={C} x2={C + AX} y2={C} stroke="transparent" strokeWidth={24} {...hit('cos')} />
                    <line x1={C} y1={C + AX} x2={C} y2={C - AX} stroke="transparent" strokeWidth={24} {...hit('sin')} />
                </>
            )}
            {tg && (
                <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', bounce: 0.55 }}>
                    {axisFlash?.axis === 'tg' && <line x1={C + R} y1={C + 110} x2={C + R} y2={C - AX} stroke={hexToRgba(axisFlash.color, 0.35)} strokeWidth={14} strokeLinecap="round" />}
                    <line x1={C + R} y1={C + 110} x2={C + R} y2={C - AX + 2} stroke={axisColor('tg')} strokeWidth={3} />
                    <Arrowhead x={C + R} y={C - AX - 6} dx={0} dy={-1} color={axisColor('tg')} size={12} />
                    {axisLabels && <text x={C + R + 24} y={C - AX + 6} textAnchor="middle" fontSize={20} fill={axisColor('tg')} style={LABEL_STYLE}>tg</text>}
                    <line x1={C + R} y1={C + 110} x2={C + R} y2={C - AX} stroke="transparent" strokeWidth={24} {...hit('tg')} />
                </motion.g>
            )}
            {segments.map((s) => (
                <motion.path key={s.key} d={arcSeg(s.a0, s.a1, s.r ?? R)} fill="none" stroke={ARC_COLOR} strokeWidth={6} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeInOut' }} />
            ))}
            {arc && (
                <>
                    <motion.path key={`a-${arc.key}`} d={arcPath(arc.to)} fill="none" stroke={arc.color} strokeWidth={7} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
                    {Math.abs(arc.to) < 2 * PI - 1e-6 && (
                        <motion.g key={`h-${arc.key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                            <Arrowhead x={pt(arc.to).x + tangentDir(arc.to).dx * 6} y={pt(arc.to).y + tangentDir(arc.to).dy * 6} {...tangentDir(arc.to)} color={arc.color} size={14} />
                            <circle cx={pt(arc.to).x} cy={pt(arc.to).y} r={6} fill={arc.color} />
                        </motion.g>
                    )}
                </>
            )}
            {dots && STD_ANGLES.map((a, i) => (
                <circle key={`d-${i}`} cx={pt(a).x} cy={pt(a).y} r={4} fill="#5C6B73" />
            ))}
            {hitDots.map((h) => (
                <motion.circle key={`h-${h.idx}-${h.color}`} cx={pt(STD_ANGLES[h.idx]).x} cy={pt(STD_ANGLES[h.idx]).y} fill={h.color}
                    initial={{ r: 0 }} animate={{ r: 8 }} transition={{ type: 'spring', bounce: 0.6 }} />
            ))}
            {marks.map((m) => {
                const p = pt(m.a)
                const l = pt(m.a, LABEL_R)
                return (
                    <g key={m.key}>
                        <motion.circle fill={m.color} initial={{ r: 0, cx: p.x, cy: p.y }} animate={{ r: 6, cx: p.x, cy: p.y }} transition={{ type: 'spring', bounce: 0.5, duration: 0.9 }} />
                        <motion.text textAnchor="middle" dominantBaseline="middle" fontSize={17} fill={m.color} style={LABEL_STYLE}
                            initial={{ opacity: 0, x: l.x, y: l.y }} animate={{ opacity: 1, x: l.x, y: l.y }} transition={{ type: 'spring', bounce: 0.4, duration: 0.9 }}>
                            {m.label}
                        </motion.text>
                    </g>
                )
            })}
            {traveler !== null && (
                // Поворот вокруг центра обычным CSS-переходом — точка едет ПО дуге.
                <g style={{ transform: `rotate(${(-traveler * 180) / PI}deg)`, transformOrigin: `${C}px ${C}px`, transition: 'transform 0.7s ease-in-out' }}>
                    <circle cx={C + R} cy={C} r={9} fill={ARC_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                </g>
            )}
            {house && <House bounce={houseBounce} />}
            <circle cx={C} cy={C} r={4} fill="#F2F7FB" />
        </svg>
    )
}

// ===== Сцены =====
type SceneProps = { onSettled?: () => void }

// 1. Дом углов.
const HomeScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [bounce, setBounce] = useState(0)
    return (
        <>
            <TypedBig parts={[{ text: 'У всех углов есть ' }, { text: 'ДОМ 🏠', color: HOME_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1200)}>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas drawCircle axisLabels={false} houseBounce={bounce} />
                        {phase >= 2 && bounce === 0 && (
                            <ActionButton onClick={() => { setBounce(1); setTimeout(() => setPhase(3), 900) }}>🏠 Постучи в домик</ActionButton>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <>
                    <ReactionVideo src={VIDEO_HOME} />
                    <TypedLine className={TEXT} text="Он стоит СПРАВА на окружности. Отсюда стартует любой угол — и сюда же возвращается." onSettled={onSettled} />
                </>
            )}
        </>
    )
}

// 2. Вверх или вниз — нажми обе кнопки.
const DirectionScene = ({ onSettled }: SceneProps) => {
    const [ready, setReady] = useState(false)
    const [shown, setShown] = useState<'up' | 'down' | null>(null)
    const [tried, setTried] = useState({ up: false, down: false })
    const [n, setN] = useState(0)
    const both = tried.up && tried.down
    useEffect(() => {
        if (!both) return
        const t = setTimeout(() => onSettled?.(), 1800)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [both])
    const press = (k: 'up' | 'down') => {
        setShown(k)
        setN((x) => x + 1)
        setTried((t) => ({ ...t, [k]: true }))
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Из дома можно пойти ' }, { text: 'ВВЕРХ', color: PLUS_COLOR }, { text: ' или ' }, { text: 'ВНИЗ', color: MINUS_COLOR }]} onDone={() => setReady(true)} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas arc={shown ? { to: shown === 'up' ? PI / 2 : -PI / 2, color: shown === 'up' ? PLUS_COLOR : MINUS_COLOR, key: `${shown}-${n}` } : null} />
                        <div className="h-10 flex items-center justify-center text-2xl font-black">
                            {shown === 'up' && <Pop key={`u${n}`}><span style={{ color: PLUS_COLOR }}>ПЛЮС ➕</span></Pop>}
                            {shown === 'down' && <Pop key={`d${n}`}><span style={{ color: MINUS_COLOR }}>МИНУС ➖</span></Pop>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                            <ActionButton color={PLUS_COLOR} pulse={!tried.up} onClick={() => press('up')}>⬆ Вверх</ActionButton>
                            <ActionButton color={MINUS_COLOR} pulse={!tried.down} onClick={() => press('down')}>⬇ Вниз</ActionButton>
                        </div>
                        {!both && <p className="text-sm text-[#9AA7B0]">Попробуй обе кнопки</p>}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// 3. ЗАПОМНИ: вверх — плюс, вниз — минус.
const RememberSignScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <RememberBanner />
            <TypedBig
                parts={[{ text: 'ВВЕРХ (против часовой) — ' }, { text: 'ПЛЮС', color: PLUS_COLOR }, { text: '. ВНИЗ (по часовой) — ' }, { text: 'МИНУС', color: MINUS_COLOR }]}
                onDone={() => setPhase(1)}
            />
            {phase >= 1 && (
                <>
                    <ReactionVideo src={VIDEO_MOONWALK} className="w-48" />
                    <TypedLine className={TEXT} text="По часовой — как стрелки часов: время уходит, значит минус. Как лунная походка — вроде идёшь, а на самом деле назад 🕺" onSettled={onSettled} />
                </>
            )}
        </>
    )
}

// 4. Полный круг.
const FullCircleScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [went, setWent] = useState(false)
    return (
        <>
            <TypedBig parts={[{ text: 'Обойдём круг целиком' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas arc={went ? { to: 2 * PI, color: ARC_COLOR, key: 'full' } : null} traveler={went ? 2 * PI : 0} />
                        <div className="h-14 flex items-center justify-center">
                            {went ? (
                                <Pop delay={0.9}><span className="text-3xl font-black" style={{ color: ARC_COLOR }}>2π = 360°</span></Pop>
                            ) : (
                                <ActionButton color={ARC_COLOR} onClick={() => { setWent(true); setTimeout(() => setPhase(2), 1600) }}>🔄 Обойти круг</ActionButton>
                            )}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedLine className={TEXT} text="Ушли из дома — и вернулись домой. Полный круг — это 2π, то есть 360°." onSettled={onSettled} />}
        </>
    )
}

// 5. Режем пиццу.
const CutScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [cut, setCut] = useState(0) // 0 целая, 1 пополам, 2 на четыре
    const marks: Mark[] = [
        ...(cut >= 1 ? [{ key: 'pi', a: PI, label: 'π', color: ARC_COLOR }] : []),
        ...(cut >= 2 ? [{ key: 'pi2', a: PI / 2, label: 'π/2', color: ARC_COLOR }, { key: '3pi2', a: (3 * PI) / 2, label: '3π/2', color: ARC_COLOR }] : []),
    ]
    const cuts = cut >= 2 ? [0, PI / 2, PI, (3 * PI) / 2] : cut >= 1 ? [0, PI] : []
    return (
        <>
            <TypedBig parts={[{ text: 'Окружность — это ' }, { text: 'ПИЦЦА 🍕', color: SIN_COLOR }, { text: '. Давай резать!' }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas axes={false} cuts={cuts} marks={marks} />
                        {cut < 2 && (
                            <ActionButton color={SIN_COLOR} onClick={() => setCut(cut + 1)}>
                                <Scissors className="w-5 h-5" /> {cut === 0 ? 'Разрежь пополам' : 'Ещё раз пополам'}
                            </ActionButton>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {cut >= 1 && (
                <TypedLine key="c1" className={TEXT} text="Половина круга — π (180°). Это точка прямо напротив дома, слева." />
            )}
            {cut >= 2 && (
                <>
                    <ReactionVideo src={VIDEO_PIZZA} />
                    <TypedLine key="c2" className={TEXT} text="Четвертинка — π/2 (90°), она наверху. А внизу — 3π/2 (270°): три четвертинки от дома." onSettled={onSettled} />
                </>
            )}
        </>
    )
}

// 6. Мелкие кусочки: π/6, π/4, π/3.
const SMALL: Mark[] = [
    { key: 'p6', a: PI / 6, label: 'π/6', color: COS_COLOR },
    { key: 'p4', a: PI / 4, label: 'π/4', color: ARC_COLOR },
    { key: 'p3', a: PI / 3, label: 'π/3', color: SIN_COLOR },
]
const SmallScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (phase < 1 || count >= SMALL.length) return
        const t = setTimeout(() => setCount((c) => c + 1), 1100)
        return () => clearTimeout(t)
    }, [phase, count])
    useEffect(() => {
        if (count >= SMALL.length) { const t = setTimeout(() => setPhase(2), 700); return () => clearTimeout(t) }
    }, [count])
    return (
        <>
            <TypedBig parts={[{ text: 'А теперь — маленькие кусочки' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <CircleCanvas marks={SMALL.slice(0, count)} cuts={SMALL.slice(0, count).map((m) => m.a)} />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <>
                    <ReactionVideo src={VIDEO_THINK} className="w-40" />
                    <TypedLine className={TEXT} text="π/6 = 30°, π/4 = 45°, π/3 = 60°. Чем БОЛЬШЕ число внизу — тем МЕНЬШЕ кусочек. Как пицца на шестерых меньше, чем на троих 🍕" onSettled={onSettled} />
                </>
            )}
        </>
    )
}

// 7. Игра «Поставь угол».
const PLACE_ROUNDS: { a: number; label: string }[] = [
    { a: PI / 3, label: 'π/3' },
    { a: PI, label: 'π' },
    { a: PI / 2, label: 'π/2' },
    { a: (3 * PI) / 2, label: '3π/2' },
    { a: PI / 4, label: 'π/4' },
]
const PlaceGameScene = ({ onSettled }: SceneProps) => {
    const [ready, setReady] = useState(false)
    const [round, setRound] = useState(0)
    const [wrongIdx, setWrongIdx] = useState<number | null>(null)
    const [hint, setHint] = useState<string | null>(null)
    const done = round >= PLACE_ROUNDS.length
    const cur = done ? null : PLACE_ROUNDS[round]
    const placed: Mark[] = PLACE_ROUNDS.slice(0, round).map((r) => ({ key: r.label, a: r.a, label: r.label, color: PLUS_COLOR }))
    useEffect(() => {
        if (wrongIdx === null) return
        const t = setTimeout(() => setWrongIdx(null), 800)
        return () => clearTimeout(t)
    }, [wrongIdx])
    const onPick = (idx: number) => {
        if (!cur) return
        if (sameAngle(STD_ANGLES[idx], cur.a)) {
            setHint(null)
            setRound(round + 1)
            if (round + 1 >= PLACE_ROUNDS.length) setTimeout(() => onSettled?.(), 1200)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrongIdx(idx)
            setHint(pickWrongTryPhrase())
        }
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Игра: поставь угол! 🎯' }]} onDone={() => setReady(true)} readMs={200} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-2">
                        <div className="h-16 flex items-center justify-center gap-3 text-lg font-bold text-[#9AA7B0]">
                            {cur ? (
                                <>Кликни, где <span className="text-4xl font-black" style={{ color: ARC_COLOR }}><Rad s={cur.label} /></span><span className="text-sm tabular-nums">{round + 1}/{PLACE_ROUNDS.length}</span></>
                            ) : (
                                <span className="text-xl font-black text-[#A1D151]">Снайпер! Все углы на месте 🎯</span>
                            )}
                        </div>
                        <CircleCanvas dots marks={placed} hitDots={wrongIdx !== null ? [{ idx: wrongIdx, color: MINUS_COLOR }] : []} onCirclePick={done ? undefined : onPick} />
                        <div className="h-8 flex items-center">
                            {hint && <span className="flex items-center gap-1 font-bold text-[#DC605B]"><X className="w-4 h-4" /> {hint}</span>}
                        </div>
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// 8. Зеркало: те же углы с минусом.
const MIRROR_BASE = [
    { key: 'm6', a: PI / 6, label: 'π/6' },
    { key: 'm4', a: PI / 4, label: 'π/4' },
    { key: 'm3', a: PI / 3, label: 'π/3' },
    { key: 'm2', a: PI / 2, label: 'π/2' },
    { key: 'm1', a: PI, label: 'π' },
]
const MirrorScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [mirrored, setMirrored] = useState(false)
    const marks: Mark[] = MIRROR_BASE.map((m) => ({
        key: m.key,
        a: mirrored ? -m.a : m.a,
        label: mirrored ? `−${m.label}` : m.label,
        color: mirrored ? MINUS_COLOR : PLUS_COLOR,
    }))
    return (
        <>
            <TypedBig parts={[{ text: 'А что внизу? ' }, { text: 'Зеркало! 🪞', color: MINUS_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas marks={marks} />
                        {!mirrored && (
                            <ActionButton color={MINUS_COLOR} onClick={() => { setMirrored(true); setTimeout(() => setPhase(2), 1400) }}>🪞 Отрази вниз</ActionButton>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <>
                    <ReactionVideo src={VIDEO_MIRROR} />
                    <TypedLine className={TEXT} text="Те же кусочки, только идём ВНИЗ, по часовой: −π/6, −π/4, −π/3, −π/2. А −π и π — одна и та же точка слева!" onSettled={onSettled} />
                </>
            )}
        </>
    )
}

// 9. Одна точка — два имени.
const NAME_ROUNDS: { a: number; shown: string; options: string[]; correct: string }[] = [
    { a: (3 * PI) / 2, shown: '3π/2', options: ['−π/2', 'π/2'], correct: '−π/2' },
    { a: PI, shown: 'π', options: ['−π', '0'], correct: '−π' },
    { a: -PI / 2, shown: '−π/2', options: ['π/2', '3π/2'], correct: '3π/2' },
]
const NamesScene = ({ onSettled }: SceneProps) => {
    const [ready, setReady] = useState(false)
    const [round, setRound] = useState(0)
    const [wrong, setWrong] = useState<string | null>(null)
    const [opts] = useState(() => NAME_ROUNDS.map((r) => shuffle(r.options)))
    const done = round >= NAME_ROUNDS.length
    const cur = done ? null : NAME_ROUNDS[round]
    useEffect(() => {
        if (!wrong) return
        const t = setTimeout(() => setWrong(null), 800)
        return () => clearTimeout(t)
    }, [wrong])
    const pick = (o: string) => {
        if (!cur) return
        if (o === cur.correct) {
            setRound(round + 1)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrong(o)
        }
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Хитрость: у точки бывает ' }, { text: 'ДВА ИМЕНИ', color: TG_COLOR }]} onDone={() => setReady(true)} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        {cur ? (
                            <>
                                <p className="text-base md:text-lg font-bold text-[#9AA7B0] text-center">
                                    Эта точка — <span className="text-2xl font-black" style={{ color: ARC_COLOR }}><Rad s={cur.shown} /></span>. Как её назвать ещё? <span className="text-sm tabular-nums">{round + 1}/{NAME_ROUNDS.length}</span>
                                </p>
                                <CircleCanvas marks={[{ key: `n${round}`, a: cur.a, label: cur.shown, color: ARC_COLOR }]} />
                                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                    {opts[round].map((o) => (
                                        <button key={o} type="button" onClick={() => pick(o)}
                                            className={cn('min-h-[64px] rounded-xl border-2 text-2xl font-black transition-colors',
                                                wrong === o ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                            <Rad s={o} />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <Pop><span className="text-2xl md:text-3xl font-black text-center" style={{ color: TG_COLOR }}>Одна точка — много имён 🤯</span></Pop>
                                <ReactionVideo src={VIDEO_MINDBLOWN} />
                                <TypedLine className={TEXT} text="Пошёл вверх на 3π/2 или вниз на π/2 — пришёл в одно и то же место. Имена разные, точка одна." onSettled={onSettled} />
                            </>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// 10. 5π/2 = 5 шагов по π/2.
const STEP_LABELS = ['π/2', 'π', '3π/2', '2π', '5π/2']
const StepsScene = ({ onSettled }: SceneProps) => {
    const [ready, setReady] = useState(false)
    const [steps, setSteps] = useState(0)
    const done = steps >= 5
    useEffect(() => {
        if (!done) return
        const t = setTimeout(() => onSettled?.(), 2200)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done])
    const segments = Array.from({ length: steps }, (_, j) => {
        const k = j + 1
        const lap2 = k > 4
        const a0 = ((k - 1) % 4) * (PI / 2)
        return { a0, a1: a0 + PI / 2, r: lap2 ? R + 11 : R, key: `seg-${k}` }
    })
    return (
        <>
            <TypedBig parts={[{ text: 'Что такое ' }, { text: '5π/2', color: ARC_COLOR }, { text: '? Это 5 шагов по π/2 👣' }]} onDone={() => setReady(true)} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="h-12 flex items-center justify-center text-2xl font-black" style={{ color: ARC_COLOR }}>
                            {steps > 0 ? (
                                <Pop key={steps}><span>Шаг {steps}: <Rad s={STEP_LABELS[steps - 1]} /></span></Pop>
                            ) : (
                                <span className="text-base text-[#9AA7B0] font-bold">Шагай из дома четвертинками</span>
                            )}
                        </div>
                        <CircleCanvas segments={segments} traveler={(steps * PI) / 2} />
                        {!done && (
                            <ActionButton color={ARC_COLOR} onClick={() => setSteps((s) => s + 1)}>👣 Шаг ({steps}/5)</ActionButton>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {steps >= 4 && (
                <TypedLine key="lap" className={TEXT} text="4 шага — круг пройден, мы снова дома (2π)!" />
            )}
            {done && (
                <>
                    <TypedLine key="five" className={TEXT} text="И ещё шаг — мы наверху, в той же точке, что и π/2. Значит, 5π/2 стоит там же, где π/2 😎" />
                    <ReactionVideo src={VIDEO_APPLAUSE} />
                </>
            )}
        </>
    )
}

// 11. Ось тангенсов.
const TgScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [tg, setTg] = useState(false)
    return (
        <>
            <TypedBig parts={[{ text: 'Третья ось — ' }, { text: 'ТАНГЕНСЫ', color: TG_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <CircleCanvas tg={tg} />
                        {!tg && (
                            <ActionButton color={TG_COLOR} onClick={() => { setTg(true); setTimeout(() => setPhase(2), 1200) }}>📏 Приложи линейку к домику</ActionButton>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <>
                    <RememberBanner />
                    <TypedBig
                        parts={[{ text: 'Ось ' }, { text: 'tg', color: TG_COLOR }, { text: ' — справа, ровно через домик 🏠, смотрит ВВЕРХ' }]}
                        onDone={() => setPhase(3)}
                    />
                </>
            )}
            {phase >= 3 && <TypedLine className={TEXT} text="Она касается окружности в точке старта. Не путай с осью sin — та идёт через центр." onSettled={onSettled} />}
        </>
    )
}

// ===== Квиз =====
type ChoiceTrial = { kind: 'choice'; prompt: React.ReactNode; options: string[]; correct: string; hint: string; rad?: boolean }
type ClickTrial = { kind: 'click'; prompt: React.ReactNode; target: number; hint: string; tg?: boolean }
type AxisTrial = { kind: 'axis'; prompt: React.ReactNode; target: Axis; hint: string; jokes: Partial<Record<Axis, string>> }
type Trial = ChoiceTrial | ClickTrial | AxisTrial

const BigRad = ({ s }: { s: string }) => <span className="text-2xl font-black" style={{ color: ARC_COLOR }}><Rad s={s} /></span>

const makeTrials = (): Trial[] => [
    {
        kind: 'axis', prompt: <>Кликни по оси <b style={{ color: TG_COLOR }}>тангенсов</b></>, target: 'tg',
        hint: 'Ось tg — справа, через домик, смотрит вверх.',
        jokes: { sin: 'Это синус, он тут не при делах 😅', cos: 'Это косинус. Тангенс — справа, у домика 🏠' },
    },
    { kind: 'click', prompt: <>Кликни, где угол <BigRad s="−π/2" /></>, target: -PI / 2, hint: 'Минус — идём вниз, четвертинка.' },
    { kind: 'choice', prompt: <>Пошли из домика <b>ВВЕРХ</b> — угол…</>, options: shuffle(['плюс ➕', 'минус ➖']), correct: 'плюс ➕', hint: 'Вверх, против часовой — плюс.' },
    { kind: 'choice', prompt: <>Сколько шагов по <BigRad s="π/2" /> в <BigRad s="3π/2" />?</>, options: shuffle(['3', '2', '4', '6']), correct: '3', hint: '3π/2 = π/2 + π/2 + π/2.' },
    { kind: 'click', prompt: <>Кликни, где угол <BigRad s="5π/2" /></>, target: (5 * PI) / 2, hint: '5 шагов по π/2: круг и ещё четвертинка — наверху.' },
    { kind: 'choice', prompt: <>Какой кусочек больше?</>, options: shuffle(['π/3', 'π/6']), correct: 'π/3', hint: 'Чем больше число внизу, тем меньше кусочек.', rad: true },
    { kind: 'choice', prompt: <>Бонус! Кто теперь шарит в окружности? 😎</>, options: ['Я 😎'], correct: 'Я 😎', hint: 'Без вариантов — ты! Домик, плюс-минус, шаги и тангенсы — всё твоё 🏠' },
]

const pickTrialFeedback = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
const SCENES = [HomeScene, DirectionScene, RememberSignScene, FullCircleScene, CutScene, SmallScene, PlaceGameScene, MirrorScene, NamesScene, StepsScene, TgScene]

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
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const answer = (ok: boolean, key: string, joke?: string) => {
        if (checked || wrongTried.includes(key)) return
        if (ok) {
            registerCombo(wrongTried.length === 0)
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            setWrongTried((prev) => [...prev, key])
            setWrongFlash(joke ?? pickWrongTryPhrase())
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

    const renderTrialBody = (t: Trial, isCurrent: boolean, isDone: boolean) => {
        if (t.kind === 'axis') {
            const flash = isDone ? { axis: t.target, color: PLUS_COLOR } : isCurrent && wrongTried.length ? { axis: wrongTried[wrongTried.length - 1] as Axis, color: MINUS_COLOR } : null
            return (
                <DiagramBlock>
                    <CircleCanvas tg axisLabels={false} axisFlash={flash} onAxisPick={isCurrent && !isDone ? (a) => answer(a === t.target, a, t.jokes[a]) : undefined} />
                </DiagramBlock>
            )
        }
        if (t.kind === 'click') {
            const target = nearestStd(t.target)
            const hits = [
                ...(isCurrent ? wrongTried.map((k) => ({ idx: Number(k), color: MINUS_COLOR })) : []),
                ...(isDone ? [{ idx: target, color: PLUS_COLOR }] : []),
            ]
            return (
                <DiagramBlock>
                    <CircleCanvas dots hitDots={hits} onCirclePick={isCurrent && !isDone ? (idx) => answer(idx === target, String(idx)) : undefined} />
                </DiagramBlock>
            )
        }
        return (
            <div className={cn('grid gap-3', t.options.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                {t.options.map((o) => {
                    const isWrong = isCurrent && wrongTried.includes(o)
                    const state = isDone && o === t.correct ? 'correct' : isWrong ? 'wrong' : 'idle'
                    return (
                        <button
                            key={o}
                            type="button"
                            disabled={isDone || isWrong}
                            onClick={isDone ? undefined : () => answer(o === t.correct, o)}
                            className={cn(
                                'flex min-h-[64px] items-center justify-center py-3 px-3 rounded-xl border-2 text-lg md:text-xl font-extrabold text-center transition-colors',
                                state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
                                state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
                                state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                            )}
                        >
                            {t.rad ? <span className="text-2xl"><Rad s={o} /></span> : o}
                        </button>
                    )
                })}
            </div>
        )
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
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
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
                                {renderTrialBody(t, isCurrent, isDone)}
                                {isCurrent && !checked && (
                                    wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#9AA7B0] text-center">{t.kind === 'choice' ? 'Кликни на вариант выше' : 'Кликни прямо по рисунку'}</p>
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
