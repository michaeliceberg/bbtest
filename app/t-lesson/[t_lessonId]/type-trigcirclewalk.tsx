// app/t-lesson/[t_lessonId]/type-trigcirclewalk.tsx
//
// TRIGCIRCWALK — «Тригонометрическая окружность: знакомство» (урок 490,
// юнит «Тригонометрическая окружность», t_unit=30). Сценарий пользователя
// (2026-10-02, вторая переделка):
//   1. Это окружность: ВПРАВО — всегда cos, ВВЕРХ — всегда sin;
//   2. игра «укажи ось синуса/косинуса» (клик по оси);
//   3. все углы откладываются СПРАВА — крупная стрелка и домик;
//   4. вверх — плюс (дуга + bounce «+»), вниз — минус;
//   5. вопросы: где домик? (4 домика), куда строим + и − углы;
//   6. π = 180° (полуокружность) → π/2 (делим пополам) → 2π (вся);
//   7. игра: где π/2, π, −π/2, 2π (клик по окружности);
//   8. 3π/2 — три шага по π/2 вверх; −5π/2 — пять шагов ВНИЗ;
//   9. радиус = 1: справа 1, сверху 1, слева −1, снизу −1;
//  10. sin π/2 — где окажемся? НАВЕРХУ → синус там = 1.
// Потом квиз: значения sin/cos по окружности и клики «где cos = −1».

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { AnswerMemeLayer, showAnswerMeme } from '@/components/answer-meme-burst'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const COS_COLOR = GGEGE_PALETTE.green.button
const SIN_COLOR = GGEGE_PALETTE.blue.button
const ARC_COLOR = GGEGE_PALETTE.purple.button
const HOME_COLOR = '#F2C35B'
const REMEMBER_COLOR = '#F2C35B'
const PICK_COLOR = '#F09B38'
const PLUS_COLOR = '#A1D151'
const MINUS_COLOR = '#DC605B'
const PI = Math.PI
const TEXT = 'w-full text-base md:text-lg text-[#F2F7FB]'

const HOUSE_STICKER = '/lesson-pics/house-sticker.webp'
const WALKER_STICKER = '/lesson-pics/dicaprio-walk.webp'

// Вместо «Дальше» — всегда смешное слово (просьба пользователя). Колода без
// повторов: пока не выпадут все фразы, ни одна не повторится. «ГААААЗ» — редкая
// (одна из ~40).
const FUN_NEXT = [
    'Агась', 'Го!', 'Понял-принял', 'Изи', 'Погнали', 'Фармим дальше', 'Ясно-понятно', 'Ок, бро', 'Вкатился', 'База',
    'Жми на газ', 'Чётко', 'Без базара', 'Понятно, го', 'Окей-окей', 'Принято', 'Летс го', 'Записал',
    'Кайф, дальше', 'Чекнул', 'Залетаем', 'Врубился', 'Мотаю на ус', 'Всё по фактам', 'Дошло', 'Так-так, дальше',
    'Логично', 'Ну го', 'Зашло', 'Опа, понял', 'Красиво', 'Едем дальше', 'Шарю', 'Агонь', 'Изи катка',
    'Ещё!', 'Гоу-гоу', 'Вот это да', 'ГААААЗ',
]
let funDeck: string[] = []
let lastFun = ''
const pickFun = () => {
    if (funDeck.length === 0) {
        funDeck = shuffle(FUN_NEXT)
        if (funDeck[funDeck.length - 1] === lastFun) funDeck.unshift(funDeck.pop()!)
    }
    lastFun = funDeck.pop()!
    return lastFun
}
const pickPraise = () => CORRECT_FEEDBACK_PHRASES[Math.floor(Math.random() * CORRECT_FEEDBACK_PHRASES.length)]
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
const BigRad = ({ s, color = ARC_COLOR }: { s: string; color?: string }) => <span className="text-2xl font-black" style={{ color }}><Rad s={s} /></span>

const ReactionVideo = ({ src, className = 'w-56' }: { src: string; className?: string }) => (
    <motion.video
        src={src} autoPlay loop muted playsInline
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
        className={cn('pointer-events-none rounded-2xl mx-auto block', className)}
    />
)

const RememberBanner = ({ children }: { children?: React.ReactNode }) => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}>
            {children ?? 'ЗАПОМНИ!'}
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

// Варианты ответа внутри мини-игр сцены (ошибка — красная вспышка).
const OptionGrid = ({ options, wrong, onPick, render }: { options: string[]; wrong: string | null; onPick: (o: string) => void; render?: (o: string) => React.ReactNode }) => (
    <div className={cn('grid gap-3 w-full max-w-sm', options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {options.map((o) => (
            <button key={o} type="button" onClick={() => onPick(o)}
                className={cn('min-h-[60px] rounded-xl border-2 text-xl font-black transition-colors px-2',
                    wrong === o ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                {render ? render(o) : o}
            </button>
        ))}
    </div>
)

// Плашка «1/4» слева, фиолетовая — как в тренировках других уроков.
const RoundBadge = ({ n, total }: { n: number; total: number }) => (
    <div
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
        style={{ borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55), backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16), color: GGEGE_PALETTE.purple.button }}
    >
        <span>{n}</span><span className="opacity-50 font-normal">/</span><span>{total}</span>
    </div>
)

// Сброс красной вспышки через 800 мс.
const useFlash = <T,>() => {
    const [v, setV] = useState<T | null>(null)
    useEffect(() => {
        if (v === null) return
        const t = setTimeout(() => setV(null), 800)
        return () => clearTimeout(t)
    }, [v])
    return [v, setV] as const
}

// ===== Окружность (SVG) =====
const C = 150
const R = 92
const AX = 128
const LABEL_R = R + 24
const pt = (a: number, r = R) => ({ x: C + r * Math.cos(a), y: C - r * Math.sin(a) })
const norm = (a: number) => ((a % (2 * PI)) + 2 * PI) % (2 * PI)

// Дуга против часовой от a0 до a1 (a1 > a0, не больше полного круга).
const arcSeg = (a0: number, a1: number, r = R) => {
    if (a1 - a0 >= 2 * PI - 1e-6) {
        const p0 = pt(a0, r)
        const m = pt(a0 + PI, r)
        return `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 0 ${m.x} ${m.y} A ${r} ${r} 0 1 0 ${p0.x} ${p0.y}`
    }
    const p0 = pt(a0, r)
    const p1 = pt(a1, r)
    const large = a1 - a0 > PI ? 1 : 0
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`
}
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
// Только четыре «главные» точки (0, π/2, π, 3π/2) — для игр без мелких делений.
const QUARTER_IDX = [0, PI / 2, PI, (3 * PI) / 2].map(nearestStd)
const nearestQuarter = (a: number) => {
    const n = norm(a)
    let best = QUARTER_IDX[0]
    let bestD = Infinity
    QUARTER_IDX.forEach((idx) => {
        const s = STD_ANGLES[idx]
        const d = Math.min(Math.abs(s - n), 2 * PI - Math.abs(s - n))
        if (d < bestD) { bestD = d; best = idx }
    })
    return best
}

// boxed — подпись стикером, сдвинута по окружности, чтобы не лечь на ось.
type Mark = { key: string; a: number; label: string; color: string; boxed?: boolean }
type Axis = 'cos' | 'sin'
type ArcSpec = { to: number; color: string; key: string; sign?: '+' | '−' }

type CanvasProps = {
    axes?: boolean
    axisLabels?: { cos?: boolean; sin?: boolean }
    drawCircle?: boolean
    house?: boolean
    houses?: { a: number; state: 'idle' | 'wrong' | 'right'; popDelay?: number }[]
    onHousePick?: (a: number) => void
    arcs?: ArcSpec[]
    segments?: { a0: number; a1: number; r?: number; key: string; color?: string; d?: string }[]
    marks?: Mark[]
    units?: number
    dots?: 'all' | 'quarters'
    hitDots?: { idx: number; color: string }[]
    traveler?: number | null
    onCirclePick?: (stdIdx: number) => void
    onAxisPick?: (axis: Axis) => void
    axisFlash?: { axis: Axis; color: string } | null
    glowValue?: { axis: Axis; v: 1 | 0 | -1 } | null
    dirPick?: { onPick?: (d: 'up' | 'down') => void; wrong: 'up' | 'down' | null; done: ('up' | 'down')[] } | null
    blinkDots?: boolean
    // Показ осей по одной с bounce (сцена-вступление).
    axisShow?: { cos: boolean; sin: boolean }
    housePop?: boolean
    walker?: number | null
}
const LABEL_STYLE = { fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 } as const

// Домик — стикер «Это мой дом» (лягушка под книгой) в точке окружности под углом a.
const HOUSE_SIZE = 36
const House = ({ a = 0, state = 'idle', onClick, bounce = false, pop = false, popDelay = 0 }: { a?: number; state?: 'idle' | 'wrong' | 'right'; onClick?: () => void; bounce?: boolean; pop?: boolean; popDelay?: number }) => {
    const { x, y } = pt(a)
    return (
        <g transform={`translate(${x} ${y})`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
            <motion.g initial={pop ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8, delay: popDelay }}>
            <g className={bounce ? 'animate-chest-idle-bounce' : undefined} style={{ transformBox: 'fill-box' }}>
                {state !== 'idle' && <circle r={HOUSE_SIZE / 2 + 4} fill={hexToRgba(state === 'wrong' ? MINUS_COLOR : PLUS_COLOR, 0.3)} stroke={state === 'wrong' ? MINUS_COLOR : PLUS_COLOR} strokeWidth={3} />}
                <image href={HOUSE_STICKER} x={-HOUSE_SIZE / 2} y={-HOUSE_SIZE / 2} width={HOUSE_SIZE} height={HOUSE_SIZE * 0.87} />
                {/* Зона клика — прозрачный круг поверх картинки */}
                {onClick && <circle r={HOUSE_SIZE / 2 + 6} fill="transparent" />}
            </g>
            </motion.g>
        </g>
    )
}

// Подписи радиуса = 1: справа 1, сверху 1, слева −1, снизу −1.
const UNIT_LABELS = [
    { x: C + R + 12, y: C + 36, t: '1', color: COS_COLOR },
    { x: C - 18, y: C - R - 18, t: '1', color: SIN_COLOR },
    { x: C - R - 16, y: C + 22, t: '−1', color: COS_COLOR },
    { x: C - 20, y: C + R + 22, t: '−1', color: SIN_COLOR },
]

const CircleCanvas = ({
    axes = true, axisLabels = { cos: true, sin: true }, drawCircle = false, house = false,
    houses = [], onHousePick, arcs = [], segments = [], marks = [], units = 0, dots, hitDots = [], traveler = null,
    onCirclePick, onAxisPick, axisFlash = null, glowValue = null, dirPick = null, blinkDots = false, axisShow, housePop = false, walker = null,
}: CanvasProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const pick = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!onCirclePick || !svgRef.current) return
        const r = svgRef.current.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * 360 - 30
        const y = ((e.clientY - r.top) / r.height) * 300
        if (Math.hypot(x - C, y - C) < 30) return
        const a = Math.atan2(C - y, x - C)
        onCirclePick(dots === 'quarters' ? nearestQuarter(a) : nearestStd(a))
    }
    const axisColor = (a: Axis) => {
        if (axisFlash?.axis === a) return axisFlash.color
        if (!axisLabels[a]) return '#9AA7B0'
        return a === 'cos' ? COS_COLOR : SIN_COLOR
    }
    const hit = (a: Axis) => (onAxisPick ? { onClick: () => onAxisPick(a), style: { cursor: 'pointer' } } : {})
    const dotList = dots === 'all' ? STD_ANGLES.map((_, i) => i) : dots === 'quarters' ? QUARTER_IDX : []
    return (
        <svg ref={svgRef} viewBox="-30 0 360 300" className={cn('w-full max-w-[360px] h-auto mx-auto block select-none overflow-visible', onCirclePick && 'cursor-pointer')} onPointerDown={pick}>
            {arcs.map((arc) => (
                <motion.path key={`s-${arc.key}`} d={`M ${C} ${C} L ${pt(0).x} ${pt(0).y} ${arcPath(arc.to).replace(/^M [^A]+/, '')} Z`}
                    fill={hexToRgba(arc.color, 0.14)} initial={{ opacity: 0 }} animate={{ opacity: Math.abs(arc.to) < 2 * PI - 1e-6 ? 1 : 0.6 }} transition={{ duration: 0.6, delay: 0.5 }} />
            ))}
            {/* Путь идёт от точки справа ПРОТИВ часовой — так и рисуется */}
            <motion.path d={arcPath(2 * PI)} fill="none" stroke="#F2F7FB" strokeWidth={3}
                initial={drawCircle ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
            {axes && (
                <>
                    {axisFlash && (
                        <motion.line key={`fl-${axisFlash.axis}-${axisFlash.color}`}
                            x1={axisFlash.axis === 'cos' ? C - AX : C} y1={axisFlash.axis === 'cos' ? C : C + AX}
                            x2={axisFlash.axis === 'cos' ? C + AX : C} y2={axisFlash.axis === 'cos' ? C : C - AX}
                            stroke={hexToRgba(axisFlash.color, 0.45)} strokeLinecap="round"
                            initial={{ strokeWidth: 2 }} animate={{ strokeWidth: 16 }} transition={{ type: 'spring', stiffness: 380, damping: 9 }} />
                    )}
                    {(['cos', 'sin'] as const).map((ax) => {
                        if (axisShow && !axisShow[ax]) return null
                        const isCos = ax === 'cos'
                        const hint = !!onAxisPick && axisFlash?.axis !== ax
                        return (
                            <motion.g key={`ax-${ax}`}
                                initial={axisShow ? { scale: 0, opacity: 0 } : false}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 7 }}>
                                {/* «Кликни на меня» — серое мигание оси */}
                                {hint && (
                                    <line className="animate-pulse" x1={isCos ? C - AX : C} y1={isCos ? C : C + AX} x2={isCos ? C + AX : C} y2={isCos ? C : C - AX}
                                        stroke="rgba(154, 167, 176, 0.45)" strokeWidth={16} strokeLinecap="round" />
                                )}
                                {isCos ? (
                                    <>
                                        <line x1={C - AX} y1={C} x2={C + AX - 4} y2={C} stroke={axisColor('cos')} strokeWidth={4} />
                                        <Arrowhead x={C + AX + 4} y={C} dx={1} dy={0} color={axisColor('cos')} size={14} />
                                    </>
                                ) : (
                                    <>
                                        <line x1={C} y1={C + AX} x2={C} y2={C - AX + 4} stroke={axisColor('sin')} strokeWidth={4} />
                                        <Arrowhead x={C} y={C - AX - 4} dx={0} dy={-1} color={axisColor('sin')} size={14} />
                                    </>
                                )}
                            </motion.g>
                        )
                    })}
                    {axisLabels.cos && (!axisShow || axisShow.cos) && (
                        <g transform={`translate(${C + AX + 12} ${C})`}>
                            <motion.g key="lc" initial={axisShow ? { scale: 0 } : { opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8 }}>
                                <text textAnchor="start" dominantBaseline="central" fontSize={axisShow ? 26 : 22} fill={axisColor('cos')} style={LABEL_STYLE}>cos</text>
                            </motion.g>
                        </g>
                    )}
                    {axisLabels.sin && (!axisShow || axisShow.sin) && (
                        <g transform={`translate(${C + 28} ${C - AX + 6})`}>
                            <motion.g key="ls" initial={axisShow ? { scale: 0 } : { opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8 }}>
                                <text textAnchor="middle" dominantBaseline="central" fontSize={axisShow ? 26 : 22} fill={axisColor('sin')} style={LABEL_STYLE}>sin</text>
                            </motion.g>
                        </g>
                    )}
                    <line x1={C - AX} y1={C} x2={C + AX} y2={C} stroke="transparent" strokeWidth={24} {...hit('cos')} />
                    <line x1={C} y1={C + AX} x2={C} y2={C - AX} stroke="transparent" strokeWidth={24} {...hit('sin')} />
                </>
            )}
            {segments.map((s) => (
                <motion.path key={s.key} d={s.d ?? arcSeg(s.a0, s.a1, s.r ?? R)} fill="none" stroke={s.color ?? ARC_COLOR} strokeWidth={6} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeInOut' }} />
            ))}
            {arcs.map((arc) => (
                <Fragment key={`a-${arc.key}`}>
                    <motion.path d={arcPath(arc.to)} fill="none" stroke={arc.color} strokeWidth={7} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
                    {Math.abs(arc.to) < 2 * PI - 1e-6 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                            <Arrowhead x={pt(arc.to).x + tangentDir(arc.to).dx * 6} y={pt(arc.to).y + tangentDir(arc.to).dy * 6} {...tangentDir(arc.to)} color={arc.color} size={14} />
                        </motion.g>
                    )}
                    {arc.sign && (
                        <g transform={`translate(${pt(arc.to / 2, R + 32).x} ${pt(arc.to / 2, R + 32).y})`}>
                            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.1, type: 'spring', bounce: 0.6 }}>
                                <circle r={17} fill={hexToRgba(arc.color, 0.2)} stroke={arc.color} strokeWidth={2.5} />
                                <text textAnchor="middle" dominantBaseline="central" fontSize={28} fill={arc.color} style={LABEL_STYLE}>{arc.sign}</text>
                            </motion.g>
                        </g>
                    )}
                </Fragment>
            ))}
            {glowValue && (() => {
                const p = glowValue.axis === 'cos' ? { x: C + glowValue.v * R, y: C } : { x: C, y: C - glowValue.v * R }
                const color = glowValue.axis === 'cos' ? COS_COLOR : SIN_COLOR
                return (
                    <g transform={`translate(${p.x} ${p.y})`}>
                        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>
                            <circle r={16} fill={hexToRgba(color, 0.25)} stroke={color} strokeWidth={3} />
                        </motion.g>
                    </g>
                )
            })()}
            {UNIT_LABELS.slice(0, units).map((u, i) => (
                <g key={`u-${i}`} transform={`translate(${u.x} ${u.y})`}>
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>
                        <text textAnchor="middle" dominantBaseline="central" fontSize={22} fill={u.color} style={LABEL_STYLE}>{u.t}</text>
                    </motion.g>
                </g>
            ))}
            {dotList.map((i) => (
                blinkDots ? (
                    // Крупные мигающие оранжевые точки — «кликни сюда» (как магнит в уроке 484).
                    <g key={`d-${i}`} transform={`translate(${pt(STD_ANGLES[i]).x} ${pt(STD_ANGLES[i]).y})`}>
                        <circle r={15} fill={hexToRgba(PICK_COLOR, 0.35)} className="animate-ping" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                        <circle r={10} fill={PICK_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                    </g>
                ) : (
                    <circle key={`d-${i}`} cx={pt(STD_ANGLES[i]).x} cy={pt(STD_ANGLES[i]).y} r={5} fill="#5C6B73" />
                )
            ))}
            {dirPick && (['up', 'down'] as const).map((d) => {
                const to = d === 'up' ? PI / 4 : -PI / 4
                const isDone = dirPick.done.includes(d)
                const color = isDone ? (d === 'up' ? PLUS_COLOR : MINUS_COLOR) : dirPick.wrong === d ? MINUS_COLOR : PICK_COLOR
                const tip = pt(to)
                const dir = tangentDir(to)
                const sp = pt(to / 2, R + 32)
                const clickable = !isDone && !!dirPick.onPick
                return (
                    <motion.g key={`dp-${d}-${isDone}`} onClick={clickable ? () => dirPick.onPick?.(d) : undefined}
                        style={clickable ? { cursor: 'pointer' } : undefined}
                        className={clickable && dirPick.wrong !== d ? 'animate-pulse' : undefined}
                        initial={isDone ? { scale: 1.4 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 8 }}>
                        <path d={arcPath(to)} fill="none" stroke="transparent" strokeWidth={34} />
                        <path d={arcPath(to)} fill="none" stroke={color} strokeWidth={isDone ? 10 : 8} strokeLinecap="round" />
                        <Arrowhead x={tip.x + dir.dx * 8} y={tip.y + dir.dy * 8} {...dir} color={color} size={isDone ? 20 : 18} />
                        {isDone && (
                            <g transform={`translate(${sp.x} ${sp.y})`}>
                                <circle r={17} fill={hexToRgba(color, 0.25)} stroke={color} strokeWidth={2.5} />
                                <text textAnchor="middle" dominantBaseline="central" fontSize={28} fill={color} style={LABEL_STYLE}>{d === 'up' ? '+' : '−'}</text>
                            </g>
                        )}
                    </motion.g>
                )
            })}
            {hitDots.map((h) => (
                <motion.circle key={`h-${h.idx}-${h.color}`} cx={pt(STD_ANGLES[h.idx]).x} cy={pt(STD_ANGLES[h.idx]).y} fill={h.color}
                    initial={{ r: 0 }} animate={{ r: 9 }} transition={{ type: 'spring', bounce: 0.6 }} />
            ))}
            {marks.map((m) => {
                const p = pt(m.a)
                const l = m.boxed ? pt(m.a + 0.42, R + 22) : pt(m.a, LABEL_R)
                const w = m.label.length * 11 + 14
                return (
                    <g key={m.key}>
                        <motion.circle fill={m.color} initial={{ r: 0, cx: p.x, cy: p.y }} animate={{ r: m.boxed ? 9 : 6, cx: p.x, cy: p.y }} transition={{ type: 'spring', bounce: 0.5, duration: 0.9 }} />
                        <g transform={`translate(${l.x} ${l.y})`}>
                            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}>
                                {m.boxed && <rect x={-w / 2} y={-14} width={w} height={28} rx={8} fill={hexToRgba(m.color, 0.2)} stroke={m.color} strokeWidth={2} />}
                                <text textAnchor="middle" dominantBaseline="central" fontSize={m.boxed ? 17 : 20} fill={m.color} style={LABEL_STYLE}>{m.label}</text>
                            </motion.g>
                        </g>
                    </g>
                )
            })}
            {traveler !== null && (
                // Поворот вокруг центра обычным CSS-переходом — точка едет ПО дуге.
                <g style={{ transform: `rotate(${(-traveler * 180) / PI}deg)`, transformOrigin: `${C}px ${C}px`, transition: 'transform 0.7s ease-in-out' }}>
                    <circle cx={C + R} cy={C} r={9} fill={ARC_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                </g>
            )}
            {house && <House pop={housePop} />}
            {walker !== null && <Walker angle={walker} />}
            {houses.map((h) => (
                <House key={`hs-${h.a}`} a={h.a} state={h.state} pop={h.popDelay !== undefined} popDelay={h.popDelay}
                    onClick={onHousePick ? () => onHousePick(h.a) : undefined} />
            ))}
            <circle cx={C} cy={C} r={4} fill="#F2F7FB" />
        </svg>
    )
}

// ===== Сцены =====
type SceneProps = { onSettled?: () => void }

// 1. Что такое тригонометрическая окружность.
const IntroScene = ({ onSettled }: SceneProps) => {
    // 1 окружность → 2 стрелка cos (bounce) → 3 подпись cos → 4 текст про cos →
    // 5 стрелка sin → 6 подпись sin → 7 текст про sin.
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const next: Record<number, [number, number]> = { 2: [3, 900], 3: [4, 700], 5: [6, 900], 6: [7, 700] }
        const step = next[phase]
        if (!step) return
        const t = setTimeout(() => setPhase(step[0]), step[1])
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig parts={[{ text: 'Это ' }, { text: 'тригонометрическая окружность', color: ARC_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1200)}>
                    <CircleCanvas drawCircle axisShow={{ cos: phase >= 2, sin: phase >= 5 }} axisLabels={{ cos: phase >= 3, sin: phase >= 6 }} />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <TypedBig parts={[{ text: 'Стрелка ВПРАВО — ' }, { text: 'косинус', color: COS_COLOR }]} onDone={() => setTimeout(() => setPhase(5), 800)} readMs={100} />
            )}
            {phase >= 7 && (
                <TypedBig parts={[{ text: 'Стрелка ВВЕРХ — ' }, { text: 'синус', color: SIN_COLOR }]} onDone={() => setTimeout(() => onSettled?.(), 1000)} readMs={100} />
            )}
        </>
    )
}

// 2. Игра: укажи ось (2 раунда, после верного — похвала).
const AXIS_ROUNDS: Axis[] = ['sin', 'cos']
const AxisGameScene = ({ onSettled }: SceneProps) => {
    const ready = true
    const [round, setRound] = useState(0)
    const [wrong, setWrong] = useFlash<Axis>()
    const [right, setRight] = useState<Axis | null>(null)
    const [praise, setPraise] = useState<string | null>(null)
    const done = round >= AXIS_ROUNDS.length
    const cur = done ? null : AXIS_ROUNDS[round]
    const pick = (a: Axis) => {
        if (!cur || right) return
        if (a === cur) {
            showAnswerMeme(true)
            setRight(a)
            setPraise(pickPraise())
            setTimeout(() => {
                setRight(null)
                setPraise(null)
                setRound(round + 1)
                if (round + 1 >= AXIS_ROUNDS.length) setTimeout(() => onSettled?.(), 900)
            }, 1300)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setWrong(a)
        }
    }
    return (
        <>
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-2">
                        <div className="h-14 flex items-center justify-center text-2xl font-black">
                            {cur ? (
                                <Pop key={`q${round}`}>
                                    <span>Где ось <span style={{ color: cur === 'cos' ? COS_COLOR : SIN_COLOR }}>{cur === 'cos' ? 'КОСИНУСА' : 'СИНУСА'}</span>?</span>
                                </Pop>
                            ) : (
                                <Pop key="done"><span className="text-[#A1D151]">Оси в кармане! 😎</span></Pop>
                            )}
                        </div>
                        <CircleCanvas
                            axisLabels={{ cos: done, sin: done }}
                            axisFlash={right ? { axis: right, color: right === 'cos' ? COS_COLOR : SIN_COLOR } : wrong ? { axis: wrong, color: MINUS_COLOR } : null}
                            onAxisPick={done ? undefined : pick}
                        />
                        <div className="h-9 flex items-center justify-center text-xl font-black">
                            {praise ? (
                                <Pop key={praise}><span className="text-[#A1D151]">{praise}</span></Pop>
                            ) : wrong ? (
                                <span className="text-base text-[#DC605B]">{wrong === 'cos' ? 'Это косинус — он ВПРАВО 🙃' : 'Это синус — он ВВЕРХ 🙃'}</span>
                            ) : null}
                        </div>
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// 3. Все углы откладываются справа — стрелка и домик.
const HomeScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig parts={[{ text: 'Все углы откладываются ' }, { text: 'СПРАВА', color: PLUS_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => { setPhase(2); setTimeout(() => onSettled?.(), 1200) }, 500)}>
                    <CircleCanvas house={phase >= 2} housePop />
                </DiagramBlock>
            )}
        </>
    )
}

// 4. Вверх — в плюс, вниз — в минус (дуги рисуются сами, примерно до ±π/4).
const SignScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase === 2) { const t = setTimeout(() => setPhase(3), 2000); return () => clearTimeout(t) }
        if (phase === 4) { const t = setTimeout(() => onSettled?.(), 2000); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const arcs: ArcSpec[] = [
        ...(phase >= 2 ? [{ to: PI / 4, color: PLUS_COLOR, key: 'up', sign: '+' as const }] : []),
        ...(phase >= 4 ? [{ to: -PI / 4, color: MINUS_COLOR, key: 'down', sign: '−' as const }] : []),
    ]
    return (
        <>
            <TypedBig parts={[{ text: 'Пошли ВВЕРХ — угол ' }, { text: 'В ПЛЮС', color: PLUS_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 500)}>
                    <CircleCanvas house arcs={arcs} />
                </DiagramBlock>
            )}
            {phase >= 3 && <TypedBig parts={[{ text: 'Пошли ВНИЗ — угол ' }, { text: 'В МИНУС', color: MINUS_COLOR }]} onDone={() => setPhase(4)} />}
        </>
    )
}

// 5. Вопросы: где домик? куда + и −?
const HOUSE_ANGLES = [0, PI / 2, PI, (3 * PI) / 2]
const DirQuizScene = ({ onSettled }: SceneProps) => {
    const [ready, setReady] = useState(false)
    const [step, setStep] = useState(0) // 0 домик, 1 плюс, 2 минус, 3 готово
    const [wrongHouse, setWrongHouse] = useFlash<number>()
    const [wrongDir, setWrongDir] = useFlash<'up' | 'down'>()
    const [houseDelays] = useState(() => {
        const order = shuffle([0, 1, 2, 3])
        return HOUSE_ANGLES.map((_, i) => 0.15 + order.indexOf(i) * 0.35)
    })
    const pickHouse = (a: number) => {
        if (step !== 0) return
        if (a === 0) { showAnswerMeme(true); setStep(1) }
        else { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrongHouse(a) }
    }
    const pickDir = (d: 'up' | 'down') => {
        const need = step === 1 ? 'up' : 'down'
        if (d === need) {
            showAnswerMeme(true)
            setStep(step + 1)
            if (step + 1 >= 3) setTimeout(() => onSettled?.(), 1200)
        } else { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrongDir(d) }
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Вопросики! 🤔' }]} onDone={() => setReady(true)} readMs={200} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <p className="text-xl font-black text-center">
                            {step === 0 && <Pop key="h"><span>Где настоящий домик?</span></Pop>}
                            {step === 1 && <Pop key="p"><span>Куда строим <span style={{ color: PLUS_COLOR }}>ПОЛОЖИТЕЛЬНЫЕ</span> углы?</span></Pop>}
                            {step === 2 && <Pop key="m"><span>Куда строим <span style={{ color: MINUS_COLOR }}>ОТРИЦАТЕЛЬНЫЕ</span> углы?</span></Pop>}
                            {step >= 3 && <span className="text-[#A1D151]">Красава! Домик справа, плюс вверх, минус вниз 🏠</span>}
                        </p>
                        <CircleCanvas
                            houses={(step > 0 ? [0] : HOUSE_ANGLES).map((a, i) => ({ a, state: wrongHouse === a ? 'wrong' : step > 0 ? 'right' : 'idle', popDelay: step > 0 ? undefined : houseDelays[i] }))}
                            onHousePick={step === 0 ? pickHouse : undefined}
                            dirPick={step >= 1 ? { onPick: step < 3 ? pickDir : undefined, wrong: wrongDir, done: step >= 3 ? ['up', 'down'] : step >= 2 ? ['up'] : [] } : null}
                        />
                        <div className="h-7 text-sm font-bold text-[#DC605B]">
                            {wrongHouse !== null && 'Это не он! Домик всегда СПРАВА 🏠'}
                            {wrongDir !== null && 'Мимо! Плюс — вверх, минус — вниз 🙃'}
                        </div>
                        {(step === 1 || step === 2) && <p className="text-sm text-[#9AA7B0]">Кликни по стрелке на окружности</p>}
                    </div>
                    {step >= 3 && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// 6. Что такое π — без тригонометрической окружности. Одна и та же картинка:
// 0 полукруг (π = 180°) → 1 дорисовываем круг (2π = 360°) → 2 отрезаем
// четверть как кусок торта, остальные 3/4 смахиваются влево-вниз → 3 это π/2 →
// 4 режем четверть на 3 кусочка → 5 два верхних отбрасываем, осталось π/6 →
// 6 тянем за верхний край до π/4 → 7 ещё тянем до π/3. Потом «Агась» и табличка.
type PiStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
const PI_R = 110
const PI_C = { x: 150, y: 150 }
const ppt = (a: number, r = PI_R) => ({ x: PI_C.x + r * Math.cos(a), y: PI_C.y - r * Math.sin(a) })
// Сектор/дуга от a0 до a1 против часовой.
const pieSector = (a0: number, a1: number) => {
    const p0 = ppt(a0)
    const p1 = ppt(a1)
    return `M ${PI_C.x} ${PI_C.y} L ${p0.x} ${p0.y} A ${PI_R} ${PI_R} 0 ${a1 - a0 > PI ? 1 : 0} 0 ${p1.x} ${p1.y} Z`
}
const pieArc = (a0: number, a1: number) => {
    const p0 = ppt(a0)
    const p1 = ppt(a1)
    return `M ${p0.x} ${p0.y} A ${PI_R} ${PI_R} 0 ${a1 - a0 > PI ? 1 : 0} 0 ${p1.x} ${p1.y}`
}
const PIECE_TARGET: Partial<Record<PiStage, number>> = { 5: PI / 6, 6: PI / 4, 7: PI / 3 }

const PiCircle = ({ stage }: { stage: PiStage }) => {
    const { x: cx, y: cy } = PI_C
    const r = PI_R
    // Угол «растягиваемого» кусочка: π/6 → π/4 → π/3, плавно, за верхний край.
    const ang = useMotionValue(PI / 6)
    useEffect(() => {
        const target = PIECE_TARGET[stage]
        if (target === undefined) return
        const ctrl = animate(ang, target, { duration: 1.3, ease: [0.4, 0, 0.2, 1] })
        return () => ctrl.stop()
    }, [stage, ang])
    const pieceFill = useTransform(ang, (a) => pieSector(0, a))
    const pieceArc = useTransform(ang, (a) => pieArc(0, a))
    const pieceEdgeX = useTransform(ang, (a) => ppt(a).x)
    const pieceEdgeY = useTransform(ang, (a) => ppt(a).y)
    const big = (text: string, y: number, key: string) => (
        <g transform={`translate(${cx} ${y})`}>
            <motion.g key={key} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}>
                <text textAnchor="middle" dominantBaseline="central" fontSize={30} fill={ARC_COLOR} style={LABEL_STYLE}>{text}</text>
            </motion.g>
        </g>
    )
    const cut = (a: number, key: string, delay = 0) => (
        <motion.line key={key} x1={cx} y1={cy} x2={ppt(a).x} y2={ppt(a).y} stroke="#F2F7FB" strokeWidth={3}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay }} />
    )
    return (
        <svg viewBox="0 0 300 300" className="w-full max-w-[340px] h-auto mx-auto block overflow-visible">
            {stage <= 1 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3A464E" strokeWidth={2} strokeDasharray="4 6" />}
            {stage <= 1 && (
                <>
                    {/* Полукруг */}
                    <motion.path d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy} L ${cx + r} ${cy} Z`} fill={hexToRgba(ARC_COLOR, stage === 0 ? 0.16 : 0)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} />
                    <motion.path d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy}`} fill="none" stroke={ARC_COLOR} strokeWidth={7} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }} />
                </>
            )}
            {/* Дорисовываем до полного круга */}
            {stage === 1 && (
                <>
                    <motion.path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`} fill="none" stroke={ARC_COLOR} strokeWidth={7} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }} />
                    <circle cx={cx} cy={cy} r={r} fill={hexToRgba(ARC_COLOR, 0.12)} />
                </>
            )}
            {/* Отрезаем четверть: 3/4 смахиваются влево-вниз */}
            {stage === 2 && (
                <motion.g initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: -90, y: 90, opacity: 0 }} transition={{ delay: 0.9, duration: 1.1, ease: [0.4, 0, 0.6, 1] }}>
                    <path d={pieSector(PI / 2, 2 * PI)} fill={hexToRgba(ARC_COLOR, 0.12)} />
                    <path d={pieArc(PI / 2, 2 * PI)} fill="none" stroke={ARC_COLOR} strokeWidth={7} strokeLinecap="round" />
                </motion.g>
            )}
            {/* Четверть (π/2) */}
            {stage >= 2 && stage <= 4 && (
                <>
                    <path d={pieSector(0, PI / 2)} fill={hexToRgba(ARC_COLOR, stage >= 3 ? 0.22 : 0.12)} />
                    <path d={pieArc(0, PI / 2)} fill="none" stroke={ARC_COLOR} strokeWidth={7} strokeLinecap="round" />
                    {stage === 2 && <>{cut(0, 'c0')}{cut(PI / 2, 'c90')}</>}
                </>
            )}
            {/* Режем четверть на 3 кусочка */}
            {stage === 4 && <>{cut(PI / 6, 'c30')}{cut(PI / 3, 'c60', 0.4)}</>}
            {/* Два верхних кусочка отбрасываем вверх */}
            {stage === 5 && (
                <motion.g initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: 50, y: -90, opacity: 0 }} transition={{ delay: 0.2, duration: 1, ease: [0.4, 0, 0.6, 1] }}>
                    <path d={pieSector(PI / 6, PI / 2)} fill={hexToRgba(ARC_COLOR, 0.22)} stroke="#F2F7FB" strokeWidth={2} />
                    <path d={pieArc(PI / 6, PI / 2)} fill="none" stroke={ARC_COLOR} strokeWidth={7} strokeLinecap="round" />
                </motion.g>
            )}
            {/* Оставшийся кусочек — растягивается за верхний край */}
            {stage >= 5 && (
                <>
                    <motion.path d={pieceFill} fill={hexToRgba(ARC_COLOR, 0.28)} />
                    <motion.path d={pieceArc} fill="none" stroke={ARC_COLOR} strokeWidth={7} strokeLinecap="round" />
                    <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#F2F7FB" strokeWidth={3} />
                    <motion.line x1={cx} y1={cy} x2={pieceEdgeX} y2={pieceEdgeY} stroke="#F2F7FB" strokeWidth={3} />
                    {stage >= 6 && (
                        <motion.circle cx={pieceEdgeX} cy={pieceEdgeY} r={9} fill={PICK_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                    )}
                </>
            )}
            {stage === 0 && big('π = 180°', cy - r / 2.4, 's0')}
            {stage === 1 && big('2π = 360°', cy, 's1')}
        </svg>
    )
}

// Мини-пицца: закрашено `frac` от круга.
const MiniPie = ({ frac }: { frac: number }) => {
    const r = 18
    const c = 22
    const a = frac * 2 * PI
    const end = { x: c + r * Math.cos(a), y: c - r * Math.sin(a) }
    const d = frac >= 1 ? '' : `M ${c} ${c} L ${c + r} ${c} A ${r} ${r} 0 ${a > PI ? 1 : 0} 0 ${end.x} ${end.y} Z`
    return (
        <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
            <circle cx={c} cy={c} r={r} fill="#1B2A31" stroke="#5C6B73" strokeWidth={1.5} />
            {frac >= 1 ? <circle cx={c} cy={c} r={r} fill={ARC_COLOR} /> : <path d={d} fill={ARC_COLOR} />}
            <circle cx={c} cy={c} r={r} fill="none" stroke="#F2F7FB" strokeWidth={1.5} />
        </svg>
    )
}

const PI_TABLE: { frac: number; rad: string; name: string; deg: string }[] = [
    { frac: 1, rad: '2π', name: 'целая', deg: '360°' },
    { frac: 1 / 2, rad: 'π', name: 'половина', deg: '180°' },
    { frac: 1 / 4, rad: 'π/2', name: 'четверть', deg: '90°' },
    { frac: 1 / 6, rad: 'π/3', name: '180° : 3', deg: '60°' },
    { frac: 1 / 8, rad: 'π/4', name: '180° : 4', deg: '45°' },
    { frac: 1 / 12, rad: 'π/6', name: '180° : 6', deg: '30°' },
]

const PiScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [stage, setStage] = useState<PiStage>(0)
    const [rows, setRows] = useState(0)
    // Картинка: полукруг → круг → четверть → 3 кусочка → π/6 → π/4 → π/3 → «Агась».
    // Каждый шаг — по кнопке («Агась» и т.п.), чтобы ученик успел рассмотреть угол.
    // Кнопка появляется, когда анимация шага доиграла.
    const STAGE_MS: Record<number, number> = { 0: 1800, 1: 1600, 2: 2200, 3: 900, 4: 1200, 5: 1400, 6: 1500, 7: 1500 }
    const [stageReady, setStageReady] = useState(false)
    const [stageLabel, setStageLabel] = useState('Агась')
    useEffect(() => {
        if (phase !== 2) return
        setStageReady(false)
        const t = setTimeout(() => { setStageLabel(pickFun()); setStageReady(true) }, STAGE_MS[stage])
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, stage])
    const nextStage = () => {
        setStageReady(false)
        if (stage >= 7) setPhase(4)
        else setStage((st) => (st + 1) as PiStage)
    }
    useEffect(() => {
        if (phase < 4 || rows >= PI_TABLE.length) return
        const t = setTimeout(() => setRows((n) => n + 1), rows === 0 ? 300 : 1000)
        return () => clearTimeout(t)
    }, [phase, rows])
    useEffect(() => {
        if (rows >= PI_TABLE.length) { const t = setTimeout(() => onSettled?.(), 1000); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows])
    const CAPTIONS: Record<number, React.ReactNode> = {
        1: <span>Дорисуем до круга</span>,
        2: <span>Отрежем кусочек, как торт 🍰</span>,
        3: <span className="inline-flex items-center gap-2 text-3xl" style={{ color: ARC_COLOR }}><Rad s="π/2" /><span>= 90°</span></span>,
        4: <span>Режем на 3 кусочка ✂</span>,
        5: <span className="inline-flex items-center gap-2 text-3xl" style={{ color: ARC_COLOR }}><Rad s="π/6" /><span>= 30°</span></span>,
        6: <span className="inline-flex items-center gap-2 text-3xl" style={{ color: ARC_COLOR }}><Rad s="π/4" /><span>= 45°</span></span>,
        7: <span className="inline-flex items-center gap-2 text-3xl" style={{ color: ARC_COLOR }}><Rad s="π/3" /><span>= 60°</span></span>,
    }
    const caption = CAPTIONS[stage] ?? null
    return (
        <>
            <RememberBanner>π = 180°</RememberBanner>
            <TypedBig parts={[{ text: 'π — это ' }, { text: 'ПОЛОВИНА', color: ARC_COLOR }, { text: ' окружности' }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase(2)}>
                    <div className="w-full flex flex-col items-center gap-2">
                        {/* Когда осталась только верхняя четверть, нижняя половина
                            картинки плавно схлопывается — подпись поднимается ближе. */}
                        <div className="relative w-full max-w-[340px] mx-auto overflow-hidden transition-[padding-bottom] duration-700 ease-in-out"
                            style={{ paddingBottom: stage >= 3 ? '56%' : '100%' }}>
                            <div className="absolute inset-x-0 top-0">
                                <PiCircle stage={stage} />
                            </div>
                        </div>
                        <div className="h-14 flex items-center justify-center text-lg font-black text-[#F2F7FB]">
                            {caption && <Pop key={`cap-${stage}`}>{caption}</Pop>}
                        </div>
                        <div className="h-14 flex items-center">
                            {phase === 2 && stageReady && <ActionButton color={PLUS_COLOR} onClick={nextStage}>{stageLabel}</ActionButton>}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <DiagramBlock>
                    <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-[#3A464E] bg-[#161F23] overflow-hidden">
                        {PI_TABLE.slice(0, rows).map((r, i) => (
                            <motion.div
                                key={r.rad}
                                initial={{ scale: 1.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className={cn('flex items-center gap-3 px-3 py-2', i > 0 && 'border-t border-[#2A363C]')}
                            >
                                <MiniPie frac={r.frac} />
                                <span className="w-16 text-2xl font-black" style={{ color: ARC_COLOR }}><Rad s={r.rad} /></span>
                                <span className="flex-1 text-base font-bold text-[#9AA7B0]">{r.name}</span>
                                <span className="text-xl font-black text-[#F2F7FB]">{r.deg}</span>
                            </motion.div>
                        ))}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// 7. Игра: где угол?
const FIND_ROUNDS: { a: number; label: string }[] = [
    { a: PI / 2, label: 'π/2' },
    { a: PI, label: 'π' },
    { a: -PI / 2, label: '−π/2' },
    { a: 2 * PI, label: '2π' },
]
const FindGameScene = ({ onSettled }: SceneProps) => {
    const [ready, setReady] = useState(false)
    const [round, setRound] = useState(0)
    // marked — сколько углов уже отмечено стикером. Сначала отмечаем угол,
    // и только потом (через паузу) с bounce меняем вопрос.
    const [marked, setMarked] = useState(0)
    const [wrongIdx, setWrongIdx] = useFlash<number>()
    const [hint, setHint] = useState<string | null>(null)
    const done = round >= FIND_ROUNDS.length
    const cur = done ? null : FIND_ROUNDS[round]
    const placed: Mark[] = FIND_ROUNDS.slice(0, marked).map((r) => ({ key: r.label, a: r.a, label: r.label, color: PLUS_COLOR, boxed: true }))
    const onPick = (idx: number) => {
        if (!cur || marked > round) return
        if (idx === nearestStd(cur.a)) {
            showAnswerMeme(true)
            setHint(null)
            setMarked(round + 1)
            setTimeout(() => {
                setRound(round + 1)
                if (round + 1 >= FIND_ROUNDS.length) setTimeout(() => onSettled?.(), 1000)
            }, 1100)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setWrongIdx(idx)
            setHint(pickWrongTryPhrase())
        }
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Игра: найди угол! 🎯' }]} onDone={() => setReady(true)} readMs={200} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-2">
                        <div className="relative w-full h-16 flex items-center justify-center">
                            {cur && <RoundBadge n={round + 1} total={FIND_ROUNDS.length} />}
                            {cur ? (
                                <Pop key={`f${round}`}>
                                    <span className="flex items-center gap-2 text-xl font-black text-[#F2F7FB]">Где угол <span className="text-4xl" style={{ color: ARC_COLOR }}><Rad s={cur.label} /></span>?</span>
                                </Pop>
                            ) : (
                                <span className="text-xl font-black text-[#A1D151]">Снайпер! 🎯</span>
                            )}
                        </div>
                        <CircleCanvas house dots={done ? undefined : 'quarters'} blinkDots marks={placed} hitDots={wrongIdx !== null ? [{ idx: wrongIdx, color: MINUS_COLOR }] : []} onCirclePick={done ? undefined : onPick} />
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

// 8. Шаги: 3π/2 вверх, −5π/2 вниз. По окружности шагает стикер ДиКаприо.
// Путь шага рисуется в сторону движения (по часовой для минуса). Если пройдено
// больше полного круга — линия плавно уходит наружу спиралью, а не новой дугой.
const SPIRAL_GROW = 14 // насколько радиус растёт за каждую четверть сверх 2π
const walkPath = (t0: number, t1: number, dir: 1 | -1) => {
    const n = 28
    const pts: string[] = []
    for (let i = 0; i <= n; i++) {
        const t = t0 + ((t1 - t0) * i) / n
        const r = R + Math.max(0, t - 2 * PI) * (SPIRAL_GROW / (PI / 2))
        const a = dir * t
        pts.push(`${(C + r * Math.cos(a)).toFixed(2)} ${(C - r * Math.sin(a)).toFixed(2)}`)
    }
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
}
const WALKER_W = 30
const WALKER_H = 70
const WALKER_R = R + 26
// Идущий человечек: едет по дуге (угол анимируется), сам стоит вертикально.
const Walker = ({ angle }: { angle: number }) => {
    const ang = useMotionValue(0)
    useEffect(() => {
        const ctrl = animate(ang, angle, { duration: 0.9, ease: [0.45, 0, 0.55, 1] })
        return () => ctrl.stop()
    }, [angle, ang])
    const rad = (a: number) => WALKER_R + Math.max(0, Math.abs(a) - 2 * PI) * (SPIRAL_GROW / (PI / 2))
    const x = useTransform(ang, (a) => C + rad(a) * Math.cos(a) - WALKER_W / 2)
    const y = useTransform(ang, (a) => C - rad(a) * Math.sin(a) - WALKER_H / 2)
    return <motion.image href={WALKER_STICKER} x={x} y={y} width={WALKER_W} height={WALKER_H} />
}

const StepWalk = ({ count, dir, onDone }: { count: number; dir: 1 | -1; onDone: () => void }) => {
    const [steps, setSteps] = useState(0)
    const done = steps >= count
    useEffect(() => {
        if (!done) return
        const t = setTimeout(onDone, 1400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done])
    const color = dir > 0 ? PLUS_COLOR : MINUS_COLOR
    const segments = Array.from({ length: steps }, (_, j) => ({
        a0: 0, a1: 0, key: `s${dir}-${j}`, color,
        d: walkPath((j * PI) / 2, ((j + 1) * PI) / 2, dir),
    }))
    return (
        <div className="w-full flex flex-col items-center gap-3">
            {/* Крупно: «2 · π/2» — цифра шагов с bounce */}
            <div className="h-16 flex items-center justify-center gap-2 text-4xl font-black" style={{ color }}>
                {steps > 0 ? (
                    <>
                        {dir < 0 && <span>−</span>}
                        <Pop key={steps}><span>{steps}</span></Pop>
                        <span className="text-2xl text-[#9AA7B0]">·</span>
                        <Rad s="π/2" />
                    </>
                ) : (
                    <span className="text-base text-[#9AA7B0] font-bold">Жми «Шаг» — идём по π/2</span>
                )}
            </div>
            <CircleCanvas house segments={segments} walker={(dir * steps * PI) / 2} />
            {!done && <ActionButton color={color} onClick={() => setSteps((st) => st + 1)}>👣 Шаг ({steps}/{count})</ActionButton>}
        </div>
    )
}
const StepsScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig parts={[{ text: 'Где угол ' }, { text: '3π/2', color: PLUS_COLOR }, { text: '? Это 3 раза по π/2' }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <StepWalk count={3} dir={1} onDone={() => setPhase(2)} />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedLine className={TEXT} text="Три шага вверх — и мы внизу. Вот он, 3π/2." onSettled={() => setPhase(3)} delayAfter={300} />}
            {phase >= 3 && (
                <TypedBig parts={[{ text: 'А где ' }, { text: '−5π/2', color: MINUS_COLOR }, { text: '? Это угол МИНУС — значит идём ВНИЗ. ЛЕТС ГО! 🚀' }]} onDone={() => setPhase(4)} />
            )}
            {phase >= 4 && (
                <DiagramBlock>
                    <StepWalk count={5} dir={-1} onDone={() => onSettled?.()} />
                </DiagramBlock>
            )}
        </>
    )
}

// 9. Радиус = 1.
const RadiusScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [units, setUnits] = useState(0)
    useEffect(() => {
        if (phase < 1 || units >= 4) return
        const t = setTimeout(() => setUnits((u) => u + 1), 900)
        return () => clearTimeout(t)
    }, [phase, units])
    useEffect(() => {
        if (units >= 4) { const t = setTimeout(() => onSettled?.(), 900); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [units])
    return (
        <>
            <TypedBig parts={[{ text: 'У нашей окружности ' }, { text: 'РАДИУС = 1', color: ARC_COLOR }]} onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <CircleCanvas house units={units} />
                </DiagramBlock>
            )}

        </>
    )
}

// 10. «Чему равен sin π/2?» — в 2 шага: сначала идём на угол, потом смотрим,
// где оказались, и выбираем значение. Несколько раундов подряд.
type FnRound = { fn: 'sin' | 'cos'; a: number; label: string; where: string; ans: string; v: 1 | 0 | -1 }
const FN_ROUNDS: FnRound[] = [
    { fn: 'sin', a: PI / 2, label: 'π/2', where: 'НАВЕРХУ', ans: '1', v: 1 },
    { fn: 'cos', a: PI, label: 'π', where: 'СЛЕВА', ans: '−1', v: -1 },
    { fn: 'sin', a: -PI / 2, label: '−π/2', where: 'ВНИЗУ', ans: '−1', v: -1 },
    { fn: 'cos', a: PI / 2, label: 'π/2', where: 'НАВЕРХУ', ans: '0', v: 0 },
]
const FnTitle = ({ r }: { r: FnRound }) => (
    <span className="inline-flex items-center gap-2">
        Чему равен <span style={{ color: r.fn === 'sin' ? SIN_COLOR : COS_COLOR }}>{r.fn}</span> <Rad s={r.label} />?
    </span>
)
const SinScene = ({ onSettled }: SceneProps) => {
    const [round, setRound] = useState(0)
    // 0 вопрос, 1 идём, 2 «где оказались?», 3 выбор, 4 верно
    const [phase, setPhase] = useState(0)
    const [wrong, setWrong] = useFlash<string>()
    const [opts, setOpts] = useState(() => shuffle(['1', '0', '−1']))
    const r = FN_ROUNDS[round]
    const fnColor = r.fn === 'sin' ? SIN_COLOR : COS_COLOR
    const fnWord = r.fn === 'sin' ? 'синус' : 'косинус'
    useEffect(() => {
        if (phase === 1) { const t = setTimeout(() => setPhase(2), 1300); return () => clearTimeout(t) }
        if (phase === 2) { const t = setTimeout(() => setPhase(3), 1300); return () => clearTimeout(t) }
        if (phase === 4) {
            const t = setTimeout(() => {
                if (round + 1 >= FN_ROUNDS.length) onSettled?.()
                else { setRound(round + 1); setPhase(0); setOpts(shuffle(['1', '0', '−1'])) }
            }, 1800)
            return () => clearTimeout(t)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const pick = (o: string) => {
        if (phase !== 3) return
        if (o === r.ans) { showAnswerMeme(true); setPhase(4) }
        else { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrong(o) }
    }
    return (
        <DiagramBlock>
            <div className="w-full flex flex-col items-center gap-3">
                <div className="relative w-full min-h-[56px] flex items-center justify-center">
                    <RoundBadge n={round + 1} total={FN_ROUNDS.length} />
                    <Pop key={`q${round}`}><span className="text-2xl md:text-3xl font-black text-[#F2F7FB]"><FnTitle r={r} /></span></Pop>
                </div>
                <CircleCanvas key={`c${round}`} house units={4} traveler={phase >= 1 ? r.a : 0}
                    segments={phase >= 1 ? [{ a0: 0, a1: 0, key: `w${round}`, color: ARC_COLOR, d: walkPath(0, Math.abs(r.a), r.a < 0 ? -1 : 1) }] : []}
                    glowValue={phase >= 4 ? { axis: r.fn, v: r.v } : null} />
                <div className="w-full flex flex-col items-center gap-3 min-h-[120px]">
                    {phase === 0 && (
                        <ActionButton color={ARC_COLOR} onClick={() => setPhase(1)}>
                            <span className="inline-flex items-center gap-2">🏃 Сначала идём на <Rad s={r.label} /></span>
                        </ActionButton>
                    )}
                    {phase >= 2 && (
                        <Pop key={`w${round}`}>
                            <span className="text-xl font-black text-center text-[#F2F7FB]">
                                Мы <span style={{ color: ARC_COLOR }}>{r.where}</span>! А {fnWord} там чему равен?
                            </span>
                        </Pop>
                    )}
                    {phase === 3 && <OptionGrid options={opts} wrong={wrong} onPick={pick} />}
                    {phase >= 4 && round + 1 >= FN_ROUNDS.length && <ReactionVideo src={VIDEO_APPLAUSE} className="w-44" />}
                    {phase >= 4 && (
                        <Pop key={`ok${round}`}>
                            <span className="inline-flex items-center gap-2 text-3xl font-black" style={{ color: fnColor }}>
                                {r.fn} <Rad s={r.label} /> <span className="text-[#F2F7FB]">= {r.ans}</span> <span className="text-[#A1D151]">✓</span>
                            </span>
                        </Pop>
                    )}
                </div>
            </div>
            {phase >= 4 && <LocalAnswerConfetti />}
        </DiagramBlock>
    )
}

// ===== Квиз =====
type ChoiceTrial = { kind: 'choice'; prompt: React.ReactNode; options: string[]; correct: string; hint: string; circle?: { at: number } }
type ClickTrial = { kind: 'click'; prompt: React.ReactNode; target: number; hint: string }
type AxisTrial = { kind: 'axis'; prompt: React.ReactNode; target: Axis; hint: string }
type Trial = ChoiceTrial | ClickTrial | AxisTrial

const Fn = ({ f, s }: { f: 'sin' | 'cos'; s: string }) => (
    <span className="inline-flex items-center gap-1 text-2xl font-black align-middle">
        <span style={{ color: f === 'sin' ? SIN_COLOR : COS_COLOR }}>{f}</span>
        <Rad s={s} />
    </span>
)

const makeTrials = (): Trial[] => [
    { kind: 'axis', prompt: <>Кликни по оси <b style={{ color: SIN_COLOR }}>синуса</b></>, target: 'sin', hint: 'Синус — всегда ВВЕРХ.' },
    { kind: 'choice', prompt: <>Чему равен <Fn f="sin" s="π" />?</>, options: shuffle(['0', '1', '−1']), correct: '0', hint: 'π — слева, на оси cos. Высота (синус) там 0.', circle: { at: PI } },
    { kind: 'choice', prompt: <>Чему равен <Fn f="cos" s="π" />?</>, options: shuffle(['−1', '0', '1']), correct: '−1', hint: 'π — слева, косинус там −1.', circle: { at: PI } },
    { kind: 'click', prompt: <>Кликни, где <b style={{ color: COS_COLOR }}>cos = −1</b></>, target: PI, hint: 'Косинус — ось вправо. −1 — самая левая точка, это π.' },
    { kind: 'choice', prompt: <>Чему равен <Fn f="sin" s="−π/2" />?</>, options: shuffle(['−1', '1', '0']), correct: '−1', hint: '−π/2 — шаг вниз. Внизу синус −1.', circle: { at: -PI / 2 } },
    { kind: 'click', prompt: <>Кликни, где <b style={{ color: SIN_COLOR }}>sin = 1</b></>, target: PI / 2, hint: 'Синус — ось вверх. 1 — самый верх, это π/2.' },
    { kind: 'choice', prompt: <>Чему равен <Fn f="cos" s="2π" />?</>, options: shuffle(['1', '0', '−1']), correct: '1', hint: '2π — полный круг, вернулись в домик. Косинус там 1.', circle: { at: 2 * PI } },
    { kind: 'choice', prompt: <>Бонус! Кто теперь шарит в окружности? 😎</>, options: ['Я 😎'], correct: 'Я 😎', hint: 'Без вариантов — ты! Оси, домик, плюс-минус, π и синусы — всё твоё 🏠' },
]

const pickTrialFeedback = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
const SCENES = [IntroScene, AxisGameScene, HomeScene, SignScene, DirQuizScene, PiScene, FindGameScene, StepsScene, RadiusScene, SinScene]

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
    useEffect(() => { setIntroNextLabel(pickFun()) }, [step])

    const answer = (ok: boolean, key: string, joke?: string) => {
        if (checked || wrongTried.includes(key)) return
        if (ok) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setChecked(true)
            setTrialNextLabel(pickFun())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
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
                    <CircleCanvas axisLabels={{ cos: isDone, sin: isDone }} axisFlash={flash}
                        onAxisPick={isCurrent && !isDone ? (a) => answer(a === t.target, a, a === 'cos' ? 'Это косинус — он ВПРАВО 🙃' : undefined) : undefined} />
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
                    <CircleCanvas house units={4} dots={isDone ? undefined : 'quarters'} blinkDots hitDots={hits} onCirclePick={isCurrent && !isDone ? (idx) => answer(idx === target, String(idx)) : undefined} />
                </DiagramBlock>
            )
        }
        return (
            <>
                {t.circle && isDone && (
                    <DiagramBlock>
                        <CircleCanvas house units={4} hitDots={[{ idx: nearestStd(t.circle.at), color: ARC_COLOR }]} />
                    </DiagramBlock>
                )}
                <div className={cn('grid gap-3', t.options.length === 1 ? 'grid-cols-1' : t.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
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
                                    'flex min-h-[64px] items-center justify-center py-3 px-3 rounded-xl border-2 text-xl md:text-2xl font-extrabold text-center transition-colors',
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
            </>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <AnswerMemeLayer />
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
                                        <p className="text-sm text-[#9AA7B0] text-center">{t.kind === 'choice' ? 'Кликни на вариант' : 'Кликни прямо по рисунку'}</p>
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
