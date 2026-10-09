// app/t-lesson/[t_lessonId]/type-triganswalk.tsx
//
// TRIGANSWALK — «Как записать ответ» (юнит «Как записать ответ», t_unit=15). Ученик уже знает
// таблицу 30°/45°/60°. Урок 1 — синус (сценарий пользователя 2026-10-09):
//   1. sin α = 1/2 → окружность → маркер на «sin» и на «1/2» → ось sin пружинит → на ней 1/2;
//   2. пунктир на высоте 1/2 к краям окружности → в пересечениях с отскоком две точки → «А что это за углы?»;
//   3. строка синусов таблицы → обводим 1/2 → стрелка вверх к 30° → «= π/6» → π/6 летит к правой точке;
//   4. левая точка зеркальная: π − π/6 = 5π/6;
//   5. +2πk — полный круг возвращает в ту же точку; итог: α = π/6 + 2πk или α = 5π/6 + 2πk.
// Потом тренировка «пробуй, пока не угадаешь». Косинус и тангенс — следующие уроки (тот же файл).

'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    DiagramBlock, MarkerLoop, glassStickerStyle,
    pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner, useWalkthroughCombo, pickFunNextLabel, TextSticker,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = { question: QuestionType; onAnswer: (answer: string) => void; onComplete: (isCorrect: boolean) => void }

const SIN_COLOR = GGEGE_PALETTE.blue.button
const COS_COLOR = GGEGE_PALETTE.green.button
const ARC_COLOR = GGEGE_PALETTE.purple.button
const DOT_COLOR = '#F09B38'
const ANGLE30 = GGEGE_PALETTE.teal.button
const PERIOD_COLOR = GGEGE_PALETTE.raspberry.button
const PI = Math.PI
const LABEL_STYLE = { fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 } as const

// ===== Мелочи текста =====
type BigPart = { text: string; color?: string }
const TypedBig = ({ parts, onDone, readMs = 500, small = false }: { parts: BigPart[]; onDone?: () => void; readMs?: number; small?: boolean }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl')}>
            {!typed ? (
                <Typewriter text={parts.map((p) => p.text).join('')} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }} />
            ) : (
                parts.map((p, i) => <span key={i} style={p.color ? { color: p.color } : undefined}>{p.text}</span>)
            )}
        </div>
    )
}

const Frac = ({ num, den, className }: { num: React.ReactNode; den: React.ReactNode; className?: string }) => (
    <span className={cn('inline-flex flex-col leading-none align-middle mx-0.5', className)}>
        <span className="pb-1 border-b-[3px] border-current px-1 flex justify-center">{num}</span>
        <span className="pt-1 px-1 flex justify-center">{den}</span>
    </span>
)
const Root = ({ n }: { n: string }) => (
    <span className="inline-flex items-baseline whitespace-nowrap"><span>√</span><span className="border-t-2 border-current leading-none pt-[1px]">{n}</span></span>
)
// Значение синуса: '1/2' | '√2/2' | '√3/2'
const SinVal = ({ v }: { v: string }) => {
    const [n, d] = v.split('/')
    return <Frac num={n.startsWith('√') ? <Root n={n.slice(1)} /> : n} den={d} />
}
// Угол-ответ вида «π/6», «5π/6», «2π/3»
const PiFrac = ({ s }: { s: string }) => {
    const [n, d] = s.split('/')
    return d ? <Frac num={n} den={d} /> : <span>{n}</span>
}
// Серия решений: α = π/6 + 2πk
const Series = ({ base, color = ARC_COLOR }: { base: string; color?: string }) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap font-black">
        <span>α =</span>
        <span style={{ color }}><PiFrac s={base} /></span>
        <span style={{ color: PERIOD_COLOR }}>+ 2πk</span>
    </span>
)

const Pop = ({ delay = 0, children, className }: { delay?: number; children: React.ReactNode; className?: string }) => (
    <motion.span initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 14, delay }} className={cn('inline-flex', className)}>
        {children}
    </motion.span>
)


// ===== Окружность =====
const C = 150
// Окружность крупнее (просьба 2026-10-09): радиус ближе к краям холста.
const R = 114
const AX = 138
const pt = (a: number, r = R) => ({ x: C + r * Math.cos(a), y: C - r * Math.sin(a) })
const arcD = (a0: number, a1: number, r = R) => {
    const p0 = pt(a0, r), p1 = pt(a1, r)
    const large = Math.abs(a1 - a0) > PI ? 1 : 0
    const sweep = a1 > a0 ? 0 : 1
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`
}
// Полная окружность от точки 0 (справа) против часовой стрелки (sweep 0 — против часовой на экране).
const CIRCLE_CCW = `M ${C + R} ${C} A ${R} ${R} 0 1 0 ${C - R} ${C} A ${R} ${R} 0 1 0 ${C + R} ${C}`
const Arrowhead = ({ x, y, dx, dy, color, size = 12 }: { x: number; y: number; dx: number; dy: number; color: string; size?: number }) => {
    const px = -dy, py = dx
    return <polygon points={`${x},${y} ${x - dx * size + px * size * 0.55},${y - dy * size + py * size * 0.55} ${x - dx * size - px * size * 0.55},${y - dy * size - py * size * 0.55}`} fill={color} />
}

type Level = { v: number; label: React.ReactNode }
type CircleProps = {
    draw?: boolean
    sinPulse?: boolean // ось sin пружинит
    level?: Level | null // отметка на оси sin
    dashes?: boolean // пунктир к краям окружности
    dots?: number[] // углы точек
    dotsPop?: boolean
    labels?: { a: number; text: React.ReactNode; color: string; key: string; side: 1 | -1; pop?: boolean }[]
    arcs?: { a0: number; a1: number; color: string; key: string; arrow?: boolean; width?: number; dur?: number }[]
    spin?: number | null // полный круг от этого угла (+2πk)
    dashDur?: number // сколько секунд тянется пунктир
    svgExtra?: React.ReactNode // дополнительные элементы внутри SVG
    overlay?: React.ReactNode // HTML поверх рисунка (через At — координаты холста в процентах)
    levelPop?: boolean // ½ на оси появляется с отскоком — только при самом первом показе
    markLevel?: boolean // обвести ½ на оси маркером
    levelBounce?: boolean // крупный отскок стикера ½ — «смотри сюда»
    svgRef?: React.Ref<SVGSVGElement>
    maxW?: number // предел ширины рисунка, px (чтобы сцена влезала в экран телефона)
}

// HTML-элемент поверх окружности в координатах холста (viewBox −30…330 × 0…300), в процентах —
// одинаково на телефоне и компьютере. (Через <foreignObject> Safari на iPhone ставил подписи не туда.)
const VB_W = 360, VB_H = 300
const At = ({ x, y, w, children, className }: { x: number; y: number; w?: number; children: React.ReactNode; className?: string }) => (
    <div className={cn('pointer-events-none absolute', className)}
        style={{ left: `${((x + 30) / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%`, width: w ? `${(w / VB_W) * 100}%` : undefined, transform: 'translate(-50%, -50%)' }}>
        {children}
    </div>
)
// Где стоит подпись угла a (снаружи окружности); side сдвигает чуть вправо/влево.
const labelPos = (a: number, side: 1 | -1 = 1) => { const p = pt(a, R + 30); return { x: p.x + side * 6, y: p.y } }
// Синий стикер ½ над осью — выше пунктира, чтобы не накладывались.
const levelPos = (v: number) => ({ x: C - 34, y: C - v * R - 34 })
// Перевод точки холста в координаты контейнера сцены (для стрелок и полётов).
const toBoxCoords = (box: DOMRect, svg: DOMRect, x: number, y: number) => {
    const k = svg.width / VB_W
    return { x: svg.left - box.left + (x + 30) * k, y: svg.top - box.top + y * k }
}

const SinCircle = ({ draw = false, sinPulse = false, level = null, dashes = false, dots = [], dotsPop = false, labels = [], arcs = [], spin = null, svgRef, dashDur = 0.9, svgExtra, overlay, levelPop = false, markLevel = false, levelBounce = false, maxW }: CircleProps) => {
    const ly = level ? C - level.v * R : 0
    const hx = level ? Math.sqrt(Math.max(0, 1 - level.v * level.v)) * R : 0
    return (
        <div className="relative w-full max-w-[500px] mx-auto" style={maxW ? { maxWidth: maxW } : undefined}>
        <svg ref={svgRef} viewBox="-30 0 360 300" className="w-full h-auto block select-none overflow-visible">
            {/* Окружность рисуем ПРОТИВ часовой (от 0 вверх — в плюс), как растут углы. */}
            <motion.path d={CIRCLE_CCW} fill="none" stroke="#F2F7FB" strokeWidth={3}
                initial={draw ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
            {/* ось cos */}
            <line x1={C - AX} y1={C} x2={C + AX - 4} y2={C} stroke={COS_COLOR} strokeWidth={3} />
            <Arrowhead x={C + AX + 4} y={C} dx={1} dy={0} color={COS_COLOR} />
            <text x={C + AX + 10} y={C} dominantBaseline="central" fontSize={18} fill={COS_COLOR} style={LABEL_STYLE}>cos</text>
            {/* ось sin — пружинит, когда её показываем */}
            <motion.g style={{ transformOrigin: `${C}px ${C}px` }}
                animate={sinPulse ? { scale: [1, 1.18, 0.94, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}>
                {sinPulse && <line x1={C} y1={C + AX} x2={C} y2={C - AX} stroke={hexToRgba(SIN_COLOR, 0.35)} strokeWidth={14} strokeLinecap="round" />}
                <line x1={C} y1={C + AX} x2={C} y2={C - AX + 4} stroke={SIN_COLOR} strokeWidth={sinPulse ? 5 : 3} />
                <Arrowhead x={C} y={C - AX - 4} dx={0} dy={-1} color={SIN_COLOR} />
            </motion.g>
            <text x={C + 14} y={C - AX + 2} dominantBaseline="central" fontSize={18} fill={SIN_COLOR} style={LABEL_STYLE}>sin</text>
            {/* 0 и 1 на оси sin */}
            <text x={C - 10} y={C + 14} textAnchor="end" fontSize={15} fill="#9AA7B0" style={LABEL_STYLE}>0</text>
            <text x={C - 9} y={C - R - 13} textAnchor="end" dominantBaseline="central" fontSize={15} fill="#9AA7B0" style={LABEL_STYLE}>1</text>
            <line x1={C - 5} y1={C - R} x2={C + 5} y2={C - R} stroke="#9AA7B0" strokeWidth={2} />

            {arcs.map((a) => {
                const dir = a.a1 > a.a0 ? 1 : -1
                // касательная в конце дуги (против часовой — рост угла, по часовой — убывание)
                const tdx = -Math.sin(a.a1) * dir, tdy = -Math.cos(a.a1) * dir
                const end = pt(a.a1)
                return (
                    <Fragment key={a.key}>
                        <motion.path d={arcD(a.a0, a.a1)} fill="none" stroke={a.color} strokeWidth={a.width ?? 6} strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: a.dur ?? 0.9, ease: 'easeInOut' }} />
                        {a.arrow && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (a.dur ?? 0.9) - 0.05, duration: 0.15 }}>
                                <Arrowhead x={end.x + tdx * 9} y={end.y + tdy * 9} dx={tdx} dy={tdy} color={a.color} size={(a.width ?? 6) > 6 ? 27 : 15} />
                            </motion.g>
                        )}
                    </Fragment>
                )
            })}

            {level && dashes && (
                <>
                    {/* Растягиваем конец линии (pathLength у framer затёр бы пунктир) */}
                    <motion.line x1={C} y1={ly} y2={ly} stroke={SIN_COLOR} strokeWidth={2.5} strokeDasharray="7 6"
                        initial={dotsPop ? { x2: C } : false} animate={{ x2: C + hx }} transition={{ duration: dashDur, ease: 'easeInOut' }} />
                    <motion.line x1={C} y1={ly} y2={ly} stroke={SIN_COLOR} strokeWidth={2.5} strokeDasharray="7 6"
                        initial={dotsPop ? { x2: C } : false} animate={{ x2: C - hx }} transition={{ duration: dashDur, ease: 'easeInOut' }} />
                </>
            )}
            {level && (
                // отметка уровня на оси sin
                <g transform={`translate(${C} ${ly})`}>
                    <motion.g initial={levelPop ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8 }}>
                        <circle r={6} fill={SIN_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                    </motion.g>
                </g>
            )}

            {dots.map((a, i) => {
                const p = pt(a)
                return (
                    <g key={`d${a}`} transform={`translate(${p.x} ${p.y})`}>
                        <motion.g initial={dotsPop ? { scale: 0 } : false} animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 7, delay: dotsPop ? dashDur + 0.05 + i * 0.12 : 0 }}>
                            <circle r={11} fill={hexToRgba(DOT_COLOR, 0.3)} />
                            <circle r={7} fill={DOT_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                        </motion.g>
                    </g>
                )
            })}

            {spin !== null && <Spinner a={spin} />}
            <circle cx={C} cy={C} r={3.5} fill="#F2F7FB" />
            {svgExtra}
        </svg>
            {level && (
                <At {...levelPos(level.v)}>
                    <motion.span initial={levelPop ? { scale: 0 } : false}
                        animate={levelBounce ? { scale: [1, 1.9, 0.88, 1.18, 1] } : { scale: 1 }}
                        transition={levelBounce ? { duration: 1, ease: 'easeOut' } : { type: 'spring', stiffness: 320, damping: 8, delay: 0.15 }}
                        className="relative flex items-center justify-center rounded-lg border-2 px-1.5 py-0.5 text-base md:text-lg font-black"
                        style={glassStickerStyle(SIN_COLOR)}>
                        {level.label}
                        {markLevel && <MarkerLoop pad={10} />}
                    </motion.span>
                </At>
            )}
            {labels.map((l) => (
                <At key={l.key} {...labelPos(l.a, l.side)}>
                    <motion.span initial={l.pop === false ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 9 }}
                        className="flex items-center justify-center text-lg md:text-xl font-black" style={{ color: l.color }}>
                        {l.text}
                    </motion.span>
                </At>
            ))}
            {overlay}
        </div>
    )
}

// Полный круг: точка обходит окружность вокруг центра (обычный CSS-поворот — framer у <g>
// вращал бы вокруг самой точки) и возвращается туда же. Два круга подряд.
const Spinner = ({ a }: { a: number }) => {
    const [deg, setDeg] = useState(0)
    useEffect(() => {
        const t1 = setTimeout(() => setDeg(-360), 50)
        const t2 = setTimeout(() => setDeg(-720), 2900)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [])
    const p = pt(a)
    return (
        <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${C}px ${C}px`, transition: 'transform 2.4s ease-in-out' }}>
            <circle cx={p.x} cy={p.y} r={9} fill={PERIOD_COLOR} stroke="#F2F7FB" strokeWidth={2} />
        </g>
    )
}

const HALF: Level = { v: 0.5, label: <SinVal v="1/2" /> }
const A30 = PI / 6
const A150 = (5 * PI) / 6

// ===== Сцены =====
type SceneProps = { onSettled?: () => void }

// 1. sin α = 1/2 → окружность → маркер на sin и 1/2 → ось пружинит → 1/2 на оси.
const FormulaScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const next: Record<number, [number, number]> = { 0: [1, 900], 1: [2, 1500], 2: [3, 900], 3: [4, 900], 4: [5, 1100], 5: [6, 900] }
        const s = next[phase]
        if (!s) return
        const t = setTimeout(() => setPhase(s[0]), s[1])
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                onAnimationComplete={() => setPhase((p) => Math.max(p, 1))}
                className="flex w-full items-center justify-center gap-3 text-4xl md:text-5xl font-black text-[#F2F7FB]">
                <span className="relative" style={{ color: phase >= 2 ? SIN_COLOR : undefined }}>
                    sin
                    {phase >= 2 && <MarkerLoop pad={10} />}
                </span>
                <span>α =</span>
                <span className="relative" style={{ color: phase >= 3 ? SIN_COLOR : undefined }}>
                    <SinVal v="1/2" />
                    {phase >= 3 && <MarkerLoop pad={8} />}
                </span>
            </motion.div>
            {phase >= 1 && (
                <DiagramBlock>
                    <SinCircle draw sinPulse={phase === 4} level={phase >= 5 ? HALF : null} levelPop />
                </DiagramBlock>
            )}
            {phase >= 6 && <TypedBig small parts={[{ text: 'Синус — это ' }, { text: 'высота', color: SIN_COLOR }, { text: '. Нам нужна высота ' }, { text: '1/2', color: SIN_COLOR }]} onDone={() => onSettled?.()} />}
        </>
    )
}

// 2. Пунктир на высоте 1/2 к краям → две точки → «А что это за углы?»
const DOTS_DASH_S = 1.8 // пунктир — в 2 раза медленнее обычного
const SAUL_VIDEO = '/video/saul-think.webm'
const SAUL_SIZE = 84 // в единицах холста окружности
const SAUL_PLAYS = 3

// Видео-реакция «задумался» правее и выше правой точки: прыгает с отскоком, играет 3 раза и замирает.
const SaulNearPoint = ({ onShown }: { onShown?: () => void }) => {
    const p = pt(A30)
    const plays = useRef(0)
    useEffect(() => {
        const t = setTimeout(() => onShown?.(), 900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <At x={p.x + 38} y={p.y - 46} w={SAUL_SIZE}>
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 11 }}
                className="aspect-square w-full overflow-hidden rounded-xl">
                <video src={SAUL_VIDEO} autoPlay muted playsInline className="h-full w-full object-cover"
                    onEnded={(e) => { plays.current += 1; if (plays.current < SAUL_PLAYS) { e.currentTarget.currentTime = 0; void e.currentTarget.play() } }} />
            </motion.div>
        </At>
    )
}

const DotsScene = ({ onSettled }: SceneProps) => {
    // 0 печатаем фразу → 1 пунктиры и точки → 2 «А что это за углы?» (после отскока точек) → 3 видео у правой точки
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase !== 1) return
        const t = setTimeout(() => setPhase(2), (DOTS_DASH_S + 0.9) * 1000)
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'Проведём пунктир на высоте ' }, { text: '1/2', color: SIN_COLOR }]} onDone={() => setPhase(1)} readMs={300} />
            <DiagramBlock>
                <SinCircle level={HALF} dashes={phase >= 1} dots={phase >= 1 ? [A30, A150] : []} dotsPop dashDur={DOTS_DASH_S}
                    overlay={phase >= 3 ? <SaulNearPoint onShown={() => onSettled?.()} /> : null} />
            </DiagramBlock>
            {phase >= 2 && <TypedBig parts={[{ text: 'А что это за ' }, { text: 'углы', color: DOT_COLOR }, { text: '?' }]} onDone={() => setPhase(3)} />}
        </>
    )
}

// 3. Таблица (строка синусов) → обводим 1/2 → вверх к 30° → «= π/6» → π/6 летит к правой точке.
const TABLE_VALUES = ['1/2', '√2/2', '√3/2']
const TABLE_ANGLES = [30, 45, 60]
// Стрелка по кривой Безье: линия кончается у основания наконечника, наконечник смотрит по касательной.
const CurveArrow = ({ x0, y0, c1x, c1y, c2x, c2y, x1, y1, color = '#F2C35B', head = 14 }: {
    x0: number; y0: number; c1x: number; c1y: number; c2x: number; c2y: number; x1: number; y1: number; color?: string; head?: number
}) => {
    const dx = x1 - c2x, dy = y1 - c2y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    const bx = x1 - ux * head, by = y1 - uy * head // основание наконечника
    const px = -uy, py = ux
    return (
        <>
            <motion.path d={`M ${x0} ${y0} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${bx} ${by}`} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
            <motion.polygon points={`${x1},${y1} ${bx + px * head * 0.5},${by + py * head * 0.5} ${bx - px * head * 0.5},${by - py * head * 0.5}`} fill={color}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.15 }} />
        </>
    )
}

// Перелёт подписи из точки from в точку to (координаты контейнера сцены). x/y — у внешнего слоя,
// центрирование — у внутреннего (если задать x и translateX вместе, framer их путает — π/6 прыгал).
const Flyer = ({ from, to, children, onDone, dur = 1 }: { from: { x: number; y: number }; to: { x: number; y: number }; children: React.ReactNode; onDone?: () => void; dur?: number }) => (
    <motion.div className="pointer-events-none absolute left-0 top-0 z-20" initial={{ x: from.x, y: from.y }} animate={{ x: to.x, y: to.y }}
        transition={{ duration: dur, ease: [0.45, 0, 0.2, 1] }} onAnimationComplete={() => onDone?.()}>
        <div className="-translate-x-1/2 -translate-y-1/2">{children}</div>
    </motion.div>
)

const TableScene = ({ onSettled }: SceneProps) => {
    // 0 окружность → 1 печать «Смотрим в таблицу синусов» → 2 таблица → (пауза) 3 крупный отскок и маркер на ½ окружности →
    // 4 стрелка ½ → ½ таблицы → (пауза) 5 стрелка вверх к 30° → 6 обводим 30° → (пауза) 7 «30° = π/6» →
    // 8 π/6 летит к правой точке → 9 подпись.
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        // 8 → 9 — по концу полёта π/6, а это страховка (вкладку свернули, анимация не доиграла).
        const next: Record<number, [number, number]> = { 0: [1, 800], 2: [3, 1300], 3: [4, 1400], 4: [5, 1600], 5: [6, 900], 6: [7, 1500], 7: [8, 1100], 8: [9, 1800] }
        const s = next[phase]
        if (!s) return
        const t = setTimeout(() => setPhase(s[0]), s[1])
        return () => clearTimeout(t)
    }, [phase])

    const boxRef = useRef<HTMLDivElement>(null)
    const srcRef = useRef<HTMLSpanElement>(null)
    const cellRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    // Координаты (в рамках сцены) для стрелки ½ → ½ и для полёта π/6.
    const [geo, setGeo] = useState<{ phase: number; ax: number; ay: number; bx: number; by: number; fx0: number; fy0: number; fx1: number; fy1: number } | null>(null)
    useLayoutEffect(() => {
        if (!boxRef.current || !cellRef.current || !svgRef.current) return
        const measure = () => {
            if (!boxRef.current || !cellRef.current || !svgRef.current) return
            const box = boxRef.current.getBoundingClientRect()
            const v = svgRef.current.getBoundingClientRect()
            const lp = levelPos(0.5)
            const a = toBoxCoords(box, v, lp.x, lp.y - 30) // над стикером ½ на оси sin
            const cell = cellRef.current.getBoundingClientRect()
            const tp = labelPos(A30, 1)
            const p = toBoxCoords(box, v, tp.x, tp.y)
            const src = srcRef.current?.getBoundingClientRect()
            setGeo({
                phase,
                ax: a.x, ay: a.y,
                bx: cell.left - box.left + cell.width / 2, by: cell.bottom - box.top + 4, // в нижний край ячейки ½
                fx0: src ? src.left - box.left + src.width / 2 : 0, fy0: src ? src.top - box.top + src.height / 2 : 0,
                fx1: p.x, fy1: p.y,
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(boxRef.current)
        return () => ro.disconnect()
    }, [phase])

    return (
        <div ref={boxRef} className="relative w-full flex flex-col gap-2">
            {/* место под текст и таблицу занято заранее — окружность не прыгает, стрелки остаются на месте */}
            <div className="min-h-[2.25rem]">
                {phase >= 1 && <TypedBig small parts={[{ text: 'Вспоминаем ' }, { text: 'таблицу синусов', color: SIN_COLOR }]} readMs={300} onDone={() => setPhase((p) => Math.max(p, 2))} />}
            </div>
            <motion.div initial={false} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 10 }} transition={{ duration: 0.4 }} className="w-full flex justify-center">
                <div className="grid grid-cols-[3rem_repeat(3,minmax(4.5rem,6rem))] gap-x-2 gap-y-6 text-lg md:text-xl font-extrabold text-[#F2F7FB]">
                    <div />
                    {TABLE_ANGLES.map((a, i) => (
                        <div key={a} className="flex h-9 items-center justify-center">
                            <span className="relative rounded-xl border-2 px-2 py-0.5 text-lg font-black transition-opacity duration-500"
                                style={{ borderColor: ANGLE30, backgroundColor: hexToRgba(ANGLE30, i === 0 && phase >= 5 ? 0.3 : 0.12), color: ANGLE30, opacity: phase >= 5 && i > 0 ? 0.35 : 1 }}>
                                {a}°
                                {i === 0 && phase >= 6 && <MarkerLoop pad={12} />}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center justify-center text-lg font-black" style={{ color: SIN_COLOR }}>sin</div>
                    {TABLE_VALUES.map((v, i) => (
                        <div key={v} ref={i === 0 ? cellRef : undefined} className="relative flex h-14 items-center justify-center rounded-xl border-2 transition-opacity duration-500"
                            style={{ borderColor: hexToRgba(SIN_COLOR, i === 0 && phase >= 4 ? 1 : 0.35), backgroundColor: hexToRgba(SIN_COLOR, i === 0 && phase >= 4 ? 0.18 : 0.08), color: SIN_COLOR, opacity: phase >= 4 && i > 0 ? 0.35 : 1 }}>
                            <SinVal v={v} />
                            {i === 0 && phase >= 5 && (
                                // стрелка вверх — от ½ к 30°
                                <motion.svg className="absolute left-1/2 -translate-x-1/2 bottom-full overflow-visible" width="20" height="24" viewBox="0 0 20 24"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <motion.line x1={10} y1={23} x2={10} y2={11} stroke="#F2C35B" strokeWidth={3.5} strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                                    <motion.polygon points="10,0 3,12 17,12" fill="#F2C35B" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.15 }} />
                                </motion.svg>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
            <div className="flex items-center justify-center gap-3 text-3xl font-black text-[#F2F7FB]" style={{ visibility: phase >= 7 ? 'visible' : 'hidden' }}>
                <span className="rounded-xl border-2 px-2 py-0.5 text-xl" style={{ borderColor: ANGLE30, backgroundColor: hexToRgba(ANGLE30, 0.2), color: ANGLE30 }}>30°</span>
                {phase >= 7 && <Pop><span style={{ color: ARC_COLOR }}>=</span></Pop>}
                {phase >= 7 ? (
                    <Pop delay={0.2}>
                        <span ref={srcRef} style={{ color: ARC_COLOR, opacity: phase >= 8 ? 0.25 : 1 }}><PiFrac s="π/6" /></span>
                    </Pop>
                ) : <span className="text-transparent"><PiFrac s="π/6" /></span>}
            </div>
            <DiagramBlock>
                <SinCircle svgRef={svgRef} level={HALF} dashes dots={[A30, A150]} markLevel={phase >= 3} levelBounce={phase === 3}
                    labels={phase >= 9 ? [{ a: A30, text: <PiFrac s="π/6" />, color: ARC_COLOR, key: 'r', side: 1 }] : []} />
            </DiagramBlock>
            {geo && phase >= 4 && (
                // стрелка: от обведённой ½ на окружности вверх, с изгибом влево — в нижний край ячейки ½
                <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
                    <CurveArrow x0={geo.ax} y0={geo.ay}
                        c1x={Math.min(geo.ax, geo.bx) - 55} c1y={geo.ay - 30}
                        c2x={geo.bx} c2y={geo.by + 70}
                        x1={geo.bx} y1={geo.by} />
                </svg>
            )}
            {geo && phase === 8 && geo.phase === 8 && (
                <Flyer from={{ x: geo.fx0, y: geo.fy0 }} to={{ x: geo.fx1, y: geo.fy1 }} onDone={() => setPhase((p) => Math.max(p, 9))}>
                    <span className="text-3xl font-black" style={{ color: ARC_COLOR }}><PiFrac s="π/6" /></span>
                </Flyer>
            )}
            {phase >= 9 && <TypedBig small parts={[{ text: 'Правая точка — ' }, { text: 'π/6', color: ARC_COLOR }]} onDone={() => onSettled?.()} />}
        </div>
    )
}

// 4. Левая точка. Мини-игра: что за точка слева на оси (π)? Потом от π по часовой дуга до левой
// оранжевой точки и «−π/6»; π и −π/6 съезжаются в строку π − π/6 = 5π/6; 5π/6 летит к левой точке.
const PI_POINT_COLOR = ARC_COLOR
const PI_OPTIONS = ['π', 'π/2', '2π']
// «−π/6» — внутри окружности у дуги π → 5π/6 (снаружи наезжал на подпись 5π/6).
// «−π/6» — сбоку от дуги, левее и выше её середины (снаружи окружности)
const MINUS_POS = (() => { const p = pt((PI + (5 * PI) / 6) / 2, R + 34); return { x: p.x - 4, y: p.y - 6 } })()
// Стикер-реакция Начо левее левой точки: в ролике он лежит на боку — поворачиваем на 90° и отражаем,
// чтобы голова смотрела вправо-вниз, на левую оранжевую точку. Играет по кругу, пока не нажали «Давай узнаем».
const NACHO_VIDEO = '/video/nacho-1.webm'
const NachoNearLeftPoint = () => {
    const p = pt(A150)
    return (
        <At x={p.x - 46} y={p.y - 22} w={62}>
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 11, delay: 0.5 }}
                className="aspect-square w-full overflow-hidden rounded-xl">
                <video src={NACHO_VIDEO} autoPlay loop muted playsInline className="h-full w-full object-cover"
                    style={{ transform: 'scaleX(-1) rotate(90deg)' }} />
            </motion.div>
        </At>
    )
}

// Угол «как часовая стрелка»: радиус поворачивается от a0 до a1 по дуге и заметает
// полупрозрачный синий сектор (против часовой, если a1 > a0, иначе по часовой).
const SweepSector = ({ a0, a1, dur = 1.1 }: { a0: number; a1: number; dur?: number }) => {
    const [a, setA] = useState(a0)
    useEffect(() => {
        const c = animate(a0, a1, { duration: dur, ease: 'easeInOut', onUpdate: setA })
        // страховка: если вкладку свернули и анимация не доиграла
        const t = setTimeout(() => setA(a1), dur * 1000 + 400)
        return () => { c.stop(); clearTimeout(t) }
    }, [a0, a1, dur])
    const p0 = pt(a0), p = pt(a)
    const sweep = a1 > a0 ? 0 : 1
    return (
        <>
            <path d={`M ${C} ${C} L ${p0.x} ${p0.y} A ${R} ${R} 0 0 ${sweep} ${p.x} ${p.y} Z`} fill={hexToRgba(SIN_COLOR, 0.32)} />
            <line x1={C} y1={C} x2={p0.x} y2={p0.y} stroke={hexToRgba('#F2F7FB', 0.45)} strokeWidth={2} />
            <line x1={C} y1={C} x2={p.x} y2={p.y} stroke="#F2F7FB" strokeWidth={3.5} strokeLinecap="round" />
        </>
    )
}

const LeftScene = ({ onSettled }: SceneProps) => {
    // 0 печать «А что это за точка?» → отскок левой точки и Начо → кнопка → 1 «а что это?», точка π прыгает →
    // 2 варианты → 3 «π» слева → 4 радиус к π/6 и угол π/6 справа → 5 радиусы к π и к левой точке, угол −π/6 →
    // 6 «Теперь от π пойдём вверх В МИНУС π/6» → 7 точка π пружинит → 8 жирная дуга от π вверх → 9 «−π/6» у дуги →
    // 10 π и −π/6 спускаются в строку → 11 «=» → 12 справа 5π/6 → 13 5π/6 летит к левой точке → 14 подпись
    const [phase, setPhase] = useState(0)
    const [opts] = useState(() => shuffle(PI_OPTIONS))
    const [wrong, setWrong] = useState<string | null>(null)
    const [askReady, setAskReady] = useState(false)
    const [btnReady, setBtnReady] = useState(false)
    useEffect(() => {
        if (!askReady) return
        const t = setTimeout(() => setBtnReady(true), 1600) // после отскока точки и появления Начо
        return () => clearTimeout(t)
    }, [askReady])
    useEffect(() => {
        // 7 → 8 — по концу полёта, это страховка.
        const next: Record<number, [number, number]> = { 4: [5, 2200], 5: [6, 3300], 7: [8, 1500], 8: [9, 1900], 9: [10, 1600], 10: [11, 1300], 11: [12, 1200], 12: [13, 1600], 13: [14, 1500] }
        const st = next[phase]
        if (!st) return
        const t = setTimeout(() => setPhase(st[0]), st[1])
        return () => clearTimeout(t)
    }, [phase])
    // После ответа π — пауза, потом «стикер текста» «Давай заметим», и только потом угол π/6.
    const [notice, setNotice] = useState(false)
    useEffect(() => {
        if (phase !== 3) return
        const t = setTimeout(() => setNotice(true), 1300)
        return () => clearTimeout(t)
    }, [phase])
    useEffect(() => {
        if (!wrong) return
        const t = setTimeout(() => setWrong(null), 800)
        return () => clearTimeout(t)
    }, [wrong])
    const pick = (o: string) => {
        if (phase !== 2) return
        if (o === 'π') { showAnswerMeme(true); setPhase(3) }
        else { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrong(o) }
    }

    const boxRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const slotPi = useRef<HTMLSpanElement>(null)
    const slotMinus = useRef<HTMLSpanElement>(null)
    const slotRes = useRef<HTMLSpanElement>(null)
    type P = { x: number; y: number }
    const [geo, setGeo] = useState<{ phase: number; piFrom: P; minusFrom: P; piTo: P; minusTo: P; resFrom: P; resTo: P } | null>(null)
    useLayoutEffect(() => {
        const measure = () => {
            if (!boxRef.current || !svgRef.current || !slotPi.current || !slotMinus.current || !slotRes.current) return
            const box = boxRef.current.getBoundingClientRect()
            const v = svgRef.current.getBoundingClientRect()
            const c = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 } }
            const pl = labelPos(PI, -1), ml = MINUS_POS, ll = labelPos(A150, -1)
            setGeo({
                phase,
                piFrom: toBoxCoords(box, v, pl.x, pl.y), minusFrom: toBoxCoords(box, v, ml.x, ml.y),
                piTo: c(slotPi.current), minusTo: c(slotMinus.current),
                resFrom: c(slotRes.current), resTo: toBoxCoords(box, v, ll.x, ll.y),
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        if (boxRef.current) ro.observe(boxRef.current)
        return () => ro.disconnect()
    }, [phase])

    const piLabel = <span className="text-2xl font-black" style={{ color: PI_POINT_COLOR }}>π</span>
    const minusLabel = (
        <span className="flex items-center gap-0.5 rounded-lg border-2 px-1.5 text-lg font-black" style={glassStickerStyle(PERIOD_COLOR)}>
            −<PiFrac s="π/6" />
        </span>
    )
    // В строке вычисления и при спуске — крупнее
    const bigPi = <span className="text-5xl font-black" style={{ color: PI_POINT_COLOR }}>π</span>
    const bigMinus = (
        <span className="flex items-center gap-1 rounded-xl border-2 px-2 py-0.5 text-4xl font-black" style={glassStickerStyle(PERIOD_COLOR)}>
            −<PiFrac s="π/6" />
        </span>
    )
    const flying = phase === 10 && geo?.phase === 10

    return (
        <div ref={boxRef} className="relative w-full flex flex-col gap-4">
            <TypedBig small parts={[{ text: 'А что это за ' }, { text: 'точка', color: DOT_COLOR }, { text: '?' }]} readMs={600} onDone={() => setAskReady(true)} />
            <DiagramBlock>
                <SinCircle svgRef={svgRef} level={HALF} dashes dots={[A30, A150]}
                    arcs={phase >= 8 ? [{ a0: PI, a1: A150, color: PERIOD_COLOR, key: 'cw', arrow: true, width: 10, dur: 1.3 }] : []}
                    labels={[
                        { a: A30, text: <PiFrac s="π/6" />, color: ARC_COLOR, key: 'r', side: 1, pop: false },
                        ...(phase >= 14 ? [{ a: A150, text: <PiFrac s="5π/6" />, color: ARC_COLOR, key: 'l', side: -1 as const }] : []),
                    ]}
                    svgExtra={(
                        <>
                            {/* радиусы-векторы и маленькие углы π/6 (справа от 0) и −π/6 (слева от π) */}
                            {/* углы π/6 (от 0 вверх) и −π/6 (от π по часовой) — радиус крутится как стрелка часов */}
                            {phase >= 4 && phase <= 9 && (
                                <g opacity={phase >= 6 ? 0.45 : 1} style={{ transition: 'opacity 0.5s' }}>
                                    <SweepSector a0={0} a1={A30} />
                                </g>
                            )}
                            {phase >= 5 && phase <= 9 && (
                                <g opacity={phase >= 6 ? 0.45 : 1} style={{ transition: 'opacity 0.5s' }}>
                                    <SweepSector a0={PI} a1={A150} />
                                </g>
                            )}
                            {/* левая точка (sin ½) — крупный отскок «вот про этот угол» */}
                            <g transform={`translate(${pt(A150).x} ${pt(A150).y})`}>
                                <motion.g initial={{ scale: 1 }} animate={phase === 0 && askReady ? { scale: [1, 2.3, 1, 1.7, 1] } : { scale: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}>
                                    <circle r={11} fill={hexToRgba(DOT_COLOR, 0.35)} />
                                    <circle r={8} fill={DOT_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                                </motion.g>
                            </g>
                            {phase >= 1 && (
                                // точка π — прыгает, пока не ответили
                                <g transform={`translate(${C - R} ${C})`}>
                                    <motion.g initial={{ scale: 0 }}
                                        animate={phase <= 2 ? { scale: [1, 1.45, 1] } : phase === 7 ? { scale: [1, 2.4, 1, 1.7, 1] } : { scale: 1 }}
                                        transition={phase <= 2 ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : phase === 7 ? { duration: 1.3, ease: 'easeOut' } : { type: 'spring', bounce: 0.5 }}>
                                        <circle r={11} fill={PI_POINT_COLOR} stroke="#F2F7FB" strokeWidth={2.5} />
                                    </motion.g>
                                </g>
                            )}
                        </>
                    )}
                    overlay={(
                        <>
                            {phase === 0 && askReady && <NachoNearLeftPoint />}
                            {phase >= 4 && phase <= 9 && (
                                <At {...pt(A30 / 2, 74)}>
                                    <motion.span className="block text-xs md:text-sm font-black" initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: phase >= 6 ? 0.5 : 1 }} transition={{ type: 'spring', stiffness: 320, damping: 10, delay: 1.1 }}
                                        style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}><PiFrac s="π/6" /></motion.span>
                                </At>
                            )}
                            {phase >= 5 && phase <= 9 && (
                                <At {...pt((PI + A150) / 2, 74)}>
                                    <motion.span className="flex items-center text-xs md:text-sm font-black" initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: phase >= 6 ? 0.5 : 1 }} transition={{ type: 'spring', stiffness: 320, damping: 10, delay: 1.1 }}
                                        style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>−<PiFrac s="π/6" /></motion.span>
                                </At>
                            )}
                            {phase >= 3 && phase !== 10 && (
                                <At {...labelPos(PI, -1)}>
                                    <motion.span className="block" initial={phase === 3 ? { scale: 0 } : false} animate={{ scale: 1, opacity: phase >= 11 ? 0.35 : 1 }} transition={{ type: 'spring', stiffness: 320, damping: 9 }}>{piLabel}</motion.span>
                                </At>
                            )}
                            {phase === 9 && (
                                <At {...MINUS_POS}>
                                    <motion.span className="block" initial={phase === 9 ? { scale: 0 } : false} animate={{ scale: 1, opacity: phase >= 11 ? 0.35 : 1 }} transition={{ type: 'spring', stiffness: 320, damping: 9 }}>{minusLabel}</motion.span>
                                </At>
                            )}
                        </>
                    )} />
            </DiagramBlock>
            {phase === 3 && notice && <TextSticker text="Давай заметим" color={ARC_COLOR} onDone={() => setPhase((p) => Math.max(p, 4))} />}
            {phase === 0 && btnReady && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <button type="button" onClick={() => setPhase(1)} className={cn(walkthroughButtonClass(true), 'w-full')} style={walkthroughButtonStyle(true)}>
                        Давай узнаем
                    </button>
                </motion.div>
            )}
            {/* Вопрос «что это?» после ответа убираем, на его месте потом печатается следующая фраза —
                страница не растёт. */}
            {phase >= 1 && (
                <div className="min-h-[2.25rem]">
                    {phase <= 2 && <TypedBig small parts={[{ text: 'Сначала скажи: ' }, { text: 'что это', color: PI_POINT_COLOR }, { text: '?' }]} readMs={200} onDone={() => setPhase((p) => Math.max(p, 2))} />}
                    {phase >= 6 && <TypedBig small parts={[{ text: 'значит надо от ' }, { text: 'π', color: PI_POINT_COLOR }, { text: ' пойти ВВЕРХ на ' }, { text: 'π/6', color: PERIOD_COLOR }]} readMs={900} onDone={() => setPhase((p) => Math.max(p, 7))} />}
                </div>
            )}
            {phase === 2 && (
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto">
                    {opts.map((o) => (
                        <button key={o} type="button" onClick={() => pick(o)}
                            className={cn('min-h-[60px] rounded-xl border-2 text-2xl font-black transition-colors',
                                wrong === o ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                            <PiFrac s={o} />
                        </button>
                    ))}
                </div>
            )}
            {/* строка вычисления: слоты заняты заранее, π и −π/6 прилетают в них */}
            <div className="flex items-center justify-center gap-2 text-3xl font-black text-[#F2F7FB]" style={{ visibility: phase >= 6 ? 'visible' : 'hidden' }}>
                <span ref={slotPi} style={{ visibility: phase >= 11 ? 'visible' : 'hidden' }}>{bigPi}</span>
                <span ref={slotMinus} style={{ visibility: phase >= 11 ? 'visible' : 'hidden' }}>{bigMinus}</span>
                <span style={{ visibility: phase >= 11 ? 'visible' : 'hidden' }}>{phase >= 11 ? <Pop><span>=</span></Pop> : '='}</span>
                <span ref={slotRes} style={{ visibility: phase >= 12 ? 'visible' : 'hidden', opacity: phase >= 13 ? 0.25 : 1, color: ARC_COLOR }}>
                    {phase >= 12 ? <motion.span className="inline-block" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55, duration: 0.7 }}><PiFrac s="5π/6" /></motion.span> : <PiFrac s="5π/6" />}
                </span>
            </div>
            {flying && geo && (
                <>
                    <Flyer from={geo.piFrom} to={geo.piTo} dur={1.1}>{bigPi}</Flyer>
                    <Flyer from={geo.minusFrom} to={geo.minusTo} dur={1.1}>{bigMinus}</Flyer>
                </>
            )}
            {phase === 13 && geo?.phase === 13 && (
                <Flyer from={geo.resFrom} to={geo.resTo} dur={1.1} onDone={() => setPhase((p) => Math.max(p, 14))}>
                    <span className="text-5xl font-black" style={{ color: ARC_COLOR }}><PiFrac s="5π/6" /></span>
                </Flyer>
            )}
            {phase >= 14 && <TypedBig small parts={[{ text: 'Левая точка — ' }, { text: '5π/6', color: ARC_COLOR }]} onDone={() => onSettled?.()} />}
        </div>
    )
}

// 5. +2πk: полный круг возвращает в ту же точку → итог.
const PeriodScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase === 1) { const t = setTimeout(() => setPhase(2), 6200); return () => clearTimeout(t) }
        if (phase === 3) { const t = setTimeout(() => onSettled?.(), 1200); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'Пройдём ' }, { text: 'полный круг', color: PERIOD_COLOR }, { text: ' — это 2π' }]} onDone={() => setPhase(1)} readMs={200} />
            <DiagramBlock>
                <SinCircle level={HALF} dots={[A30, A150]} spin={phase >= 1 ? A30 : null}
                    labels={[
                        { a: A30, text: <PiFrac s="π/6" />, color: ARC_COLOR, key: 'r', side: 1 },
                        { a: A150, text: <PiFrac s="5π/6" />, color: ARC_COLOR, key: 'l', side: -1 },
                    ]} />
            </DiagramBlock>
            {phase >= 2 && (
                <TypedBig small parts={[{ text: 'Вернулись в ту же точку! Кругов можно пройти сколько угодно: ' }, { text: '+2πk', color: PERIOD_COLOR }, { text: ', k — любое целое' }]}
                    onDone={() => setPhase(3)} readMs={300} />
            )}
            {phase >= 3 && (
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-full rounded-2xl border-2 px-4 py-4 flex flex-col items-center gap-3 text-2xl md:text-3xl text-[#F2F7FB]"
                    style={{ borderColor: '#F2C35B', backgroundColor: hexToRgba('#F2C35B', 0.1) }}>
                    <span className="text-xs font-black uppercase tracking-widest text-[#F2C35B]">Ответ</span>
                    <span className="flex items-center gap-2 font-black"><span style={{ color: SIN_COLOR }}>sin</span> α = <SinVal v="1/2" /></span>
                    <Series base="π/6" />
                    <span className="text-lg font-bold text-[#9AA7B0]">или</span>
                    <Series base="5π/6" />
                </motion.div>
            )}
        </>
    )
}

const SCENES = [FormulaScene, DotsScene, TableScene, LeftScene, PeriodScene]

// ===== Тренировка =====
type Trial = { prompt: React.ReactNode; options: { key: string; view: React.ReactNode }[]; correct: string; hint: string }

const TwoSeries = ({ a, b, period = '2πk' }: { a: string; b: string; period?: string }) => (
    <span className="flex flex-col items-center gap-1 text-lg md:text-xl">
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-black"><PiFrac s={a} /><span style={{ color: PERIOD_COLOR }}>+ {period}</span></span>
        <span className="text-xs font-bold text-[#9AA7B0]">или</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-black"><PiFrac s={b} /><span style={{ color: PERIOD_COLOR }}>+ {period}</span></span>
    </span>
)
const SinPrompt = ({ v }: { v: string }) => (
    <span className="inline-flex items-center gap-2 text-xl md:text-2xl font-black">
        <span style={{ color: SIN_COLOR }}>sin</span> α = <SinVal v={v} />
    </span>
)
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
}
const seriesTrial = (v: string, a: string, b: string, wrong: [string, string, string?][], hint: string): Trial => {
    const opts = [{ key: 'ok', view: <TwoSeries a={a} b={b} /> }, ...wrong.map(([x, y, p], i) => ({ key: `w${i}`, view: <TwoSeries a={x} b={y} period={p} /> }))]
    return { prompt: <SinPrompt v={v} />, options: shuffle(opts), correct: 'ok', hint }
}
const makeTrials = (): Trial[] => [
    seriesTrial('1/2', 'π/6', '5π/6', [['π/3', '2π/3'], ['π/6', '5π/6', 'πk'], ['π/6', '7π/6']], 'Высота 1/2 — это 30° = π/6, а вторая точка π − π/6 = 5π/6.'),
    seriesTrial('√2/2', 'π/4', '3π/4', [['π/6', '5π/6'], ['π/4', '5π/4'], ['π/4', '3π/4', 'πk']], 'По таблице sin 45° = √2/2 → π/4, вторая точка π − π/4 = 3π/4.'),
    seriesTrial('√3/2', 'π/3', '2π/3', [['π/6', '5π/6'], ['π/3', '4π/3'], ['2π/3', '5π/3']], 'sin 60° = √3/2 → π/3, вторая точка π − π/3 = 2π/3.'),
    {
        prompt: <span className="text-base md:text-lg">Правая точка — <b style={{ color: ARC_COLOR }}>π/3</b>. Какая левая (зеркальная)?</span>,
        options: shuffle(['2π/3', '4π/3', '5π/6', '−π/3'].map((s) => ({ key: s, view: <span className="text-2xl font-black"><PiFrac s={s} /></span> }))),
        correct: '2π/3', hint: 'Левая точка = π − π/3 = 2π/3.',
    },
    {
        prompt: <span className="text-base md:text-lg">Зачем в ответе <b style={{ color: PERIOD_COLOR }}>+ 2πk</b>?</span>,
        options: shuffle([
            { key: 'ok', view: <span className="text-base font-bold">Полный круг возвращает в ту же точку</span> },
            { key: 'a', view: <span className="text-base font-bold">Так красивее</span> },
            { key: 'b', view: <span className="text-base font-bold">Чтобы угол стал больше</span> },
            { key: 'c', view: <span className="text-base font-bold">Это 2 · π · кот 🐈</span> },
        ]),
        correct: 'ok', hint: 'Каждый полный круг (2π) приводит в ту же точку, а кругов можно пройти сколько угодно — k любое целое.',
    },
]
const pickTrialFeedback = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
export const TypeTrigAnsWalk = ({ onAnswer, onComplete }: Props) => {
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
    const registerCombo = useWalkthroughCombo()
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    // После «А что это за углы?» (DotsScene) — кнопка «Давай узнаем»
    useEffect(() => { setIntroNextLabel(SCENES[step] === DotsScene ? 'Давай узнаем' : pickFunNextLabel()) }, [step])

    const answer = (key: string, t: Trial) => {
        if (checked || wrongTried.includes(key)) return
        if (key === t.correct) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setChecked(true)
            setTrialNextLabel(pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((p) => [...p, key])
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
                onComplete(ok); onAnswer(ok ? 'right' : 'wrong')
                return
            }
            setTrialIndex((i) => i + 1); setChecked(false); setWrongTried([]); setWrongFlash(null); setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_STEPS) setPhase('practice')
            else { setStep((s) => s + 1); setStepReady(false) }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) { const i = Number(key.slice(6)); return i > 0 ? `trial-${i - 1}` : `step-${INTRO_STEPS - 1}` }
        const i = Number(key.slice(5)); return i > 0 ? `step-${i - 1}` : null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null
    const handleReplay = () => { bumpNonce(latestSceneKey); if (phase === 'intro') setStepReady(false) }
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) { setTrialIndex(Number(target.slice(6))); setChecked(false); setWrongTried([]); setWrongFlash(null) }
        else { setPhase('intro'); setStep(Number(target.slice(5))); setStepReady(false) }
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
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{ borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55), backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16), color: GGEGE_PALETTE.purple.button }}>
                                        <span>{i + 1}</span><span className="opacity-50 font-normal">/</span><span>{trials.length}</span>
                                    </div>
                                    <div className="text-[#F2F7FB] text-center px-16">{t.prompt}</div>
                                </div>
                                {i < 3 && <p className="text-sm text-[#9AA7B0] text-center -mt-2">Запиши ответ:</p>}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    {t.options.map((o) => {
                                        const isWrong = isCurrent && wrongTried.includes(o.key)
                                        const state = isDone && o.key === t.correct ? 'correct' : isWrong ? 'wrong' : 'idle'
                                        return (
                                            <button key={o.key} type="button" disabled={isDone || isWrong} onClick={isDone ? undefined : () => answer(o.key, t)}
                                                className={cn('flex min-h-[72px] items-center justify-center py-3 px-2 rounded-xl border-2 text-[#F2F7FB] transition-colors',
                                                    state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
                                                    state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
                                                    state === 'idle' && 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]')}>
                                                {o.view}
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

