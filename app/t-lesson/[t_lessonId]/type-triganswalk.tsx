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
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    DiagramBlock, MarkerLoop,
    pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner, useWalkthroughCombo, pickFunNextLabel,
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
    labels?: { a: number; text: React.ReactNode; color: string; key: string; side: 1 | -1 }[]
    arcs?: { a0: number; a1: number; color: string; key: string }[]
    spin?: number | null // полный круг от этого угла (+2πk)
    dashDur?: number // сколько секунд тянется пунктир
    svgRef?: React.Ref<SVGSVGElement>
}

const SinCircle = ({ draw = false, sinPulse = false, level = null, dashes = false, dots = [], dotsPop = false, labels = [], arcs = [], spin = null, svgRef, dashDur = 0.9 }: CircleProps) => {
    const dotsPopAnim = dotsPop
    const ly = level ? C - level.v * R : 0
    const hx = level ? Math.sqrt(Math.max(0, 1 - level.v * level.v)) * R : 0
    return (
        <svg ref={svgRef} viewBox="-30 0 360 300" className="w-full max-w-[500px] h-auto mx-auto block select-none overflow-visible">
            <motion.circle cx={C} cy={C} r={R} fill="none" stroke="#F2F7FB" strokeWidth={3}
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

            {arcs.map((a) => (
                <motion.path key={a.key} d={arcD(a.a0, a.a1)} fill="none" stroke={a.color} strokeWidth={6} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
            ))}

            {level && (
                <>
                    {dashes && (
                        <>
                            {/* Растягиваем конец линии (pathLength у framer затёр бы пунктир) */}
                            <motion.line x1={C} y1={ly} y2={ly} stroke={SIN_COLOR} strokeWidth={2.5} strokeDasharray="7 6"
                                initial={dotsPopAnim ? { x2: C } : false} animate={{ x2: C + hx }} transition={{ duration: dashDur, ease: 'easeInOut' }} />
                            <motion.line x1={C} y1={ly} y2={ly} stroke={SIN_COLOR} strokeWidth={2.5} strokeDasharray="7 6"
                                initial={dotsPopAnim ? { x2: C } : false} animate={{ x2: C - hx }} transition={{ duration: dashDur, ease: 'easeInOut' }} />
                        </>
                    )}
                    {/* отметка уровня на оси sin */}
                    <g transform={`translate(${C} ${ly})`}>
                        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8 }}>
                            <circle r={6} fill={SIN_COLOR} stroke="#F2F7FB" strokeWidth={2} />
                        </motion.g>
                    </g>
                    <foreignObject x={C - 58} y={ly - 26} width={48} height={52}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 8, delay: 0.15 }}
                            className="flex h-full w-full items-center justify-center text-lg font-black" style={{ color: SIN_COLOR }}>
                            {level.label}
                        </motion.div>
                    </foreignObject>
                </>
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

            {labels.map((l) => {
                const p = pt(l.a, R + 34)
                return (
                    <foreignObject key={l.key} x={p.x - 34 + l.side * 6} y={p.y - 30} width={68} height={60}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 9 }}
                            className="flex h-full w-full items-center justify-center text-xl font-black" style={{ color: l.color }}>
                            {l.text}
                        </motion.div>
                    </foreignObject>
                )
            })}

            {spin !== null && <Spinner a={spin} />}
            <circle cx={C} cy={C} r={3.5} fill="#F2F7FB" />
        </svg>
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
                    <SinCircle draw sinPulse={phase === 4} level={phase >= 5 ? HALF : null} />
                </DiagramBlock>
            )}
            {phase >= 6 && <TypedBig small parts={[{ text: 'Синус — это ' }, { text: 'высота', color: SIN_COLOR }, { text: '. Нам нужна высота ' }, { text: '1/2', color: SIN_COLOR }]} onDone={() => onSettled?.()} />}
        </>
    )
}

// 2. Пунктир на высоте 1/2 к краям → две точки → «А что это за углы?»
const DOTS_DASH_S = 1.8 // пунктир — в 2 раза медленнее обычного
const DotsScene = ({ onSettled }: SceneProps) => {
    // 0 печатаем фразу → 1 пунктиры и точки → 2 «А что это за углы?» (после отскока точек)
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase !== 1) return
        const t = setTimeout(() => setPhase(2), (DOTS_DASH_S + 0.9) * 1000)
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'Проведём на высоте ' }, { text: '1/2', color: SIN_COLOR }, { text: ' линию до окружности' }]} onDone={() => setPhase(1)} readMs={300} />
            <DiagramBlock>
                <SinCircle level={HALF} dashes={phase >= 1} dots={phase >= 1 ? [A30, A150] : []} dotsPop dashDur={DOTS_DASH_S} />
            </DiagramBlock>
            {phase >= 2 && <TypedBig parts={[{ text: 'А что это за ' }, { text: 'углы', color: DOT_COLOR }, { text: '?' }]} onDone={() => onSettled?.()} />}
        </>
    )
}

// 3. Таблица (строка синусов) → обводим 1/2 → вверх к 30° → «= π/6» → π/6 летит к правой точке.
const TABLE_VALUES = ['1/2', '√2/2', '√3/2']
const TABLE_ANGLES = [30, 45, 60]
const TableScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    // 0 таблица, 1 маркер 1/2, 2 стрелка вверх, 3 «= π/6», 4 полёт, 5 π/6 у точки
    useEffect(() => {
        // 4 → 5 — по концу полёта π/6, а это страховка (вкладку свернули, анимация не доиграла).
        const next: Record<number, [number, number]> = { 0: [1, 1100], 1: [2, 900], 2: [3, 900], 3: [4, 1000], 4: [5, 1800] }
        const s = next[phase]
        if (!s) return
        const t = setTimeout(() => setPhase(s[0]), s[1])
        return () => clearTimeout(t)
    }, [phase])

    const boxRef = useRef<HTMLDivElement>(null)
    const srcRef = useRef<HTMLSpanElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const [fly, setFly] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
    useLayoutEffect(() => {
        if (phase !== 4 || !boxRef.current || !srcRef.current || !svgRef.current) return
        const box = boxRef.current.getBoundingClientRect()
        const s = srcRef.current.getBoundingClientRect()
        const v = svgRef.current.getBoundingClientRect()
        const k = v.width / 360
        const p = pt(A30, R + 34)
        setFly({
            x0: s.left - box.left + s.width / 2, y0: s.top - box.top + s.height / 2,
            x1: v.left - box.left + (p.x + 30 + 6) * k, y1: v.top - box.top + p.y * k,
        })
    }, [phase])

    return (
        <div ref={boxRef} className="relative w-full flex flex-col gap-4">
            <TypedBig small parts={[{ text: 'Смотрим в ' }, { text: 'таблицу синусов', color: SIN_COLOR }]} readMs={200} />
            <div className="w-full flex justify-center">
                <div className="grid grid-cols-[3rem_repeat(3,minmax(4.5rem,6rem))] gap-x-2 gap-y-9 text-xl md:text-2xl font-extrabold text-[#F2F7FB]">
                    <div />
                    {TABLE_ANGLES.map((a, i) => (
                        <div key={a} className="flex h-11 items-center justify-center">
                            <span className="rounded-xl border-2 px-2 py-0.5 text-lg font-black transition-opacity duration-500"
                                style={{ borderColor: ANGLE30, backgroundColor: hexToRgba(ANGLE30, i === 0 && phase >= 2 ? 0.3 : 0.12), color: ANGLE30, opacity: phase >= 2 && i > 0 ? 0.35 : 1 }}>
                                {a}°
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center justify-center text-lg font-black" style={{ color: SIN_COLOR }}>sin</div>
                    {TABLE_VALUES.map((v, i) => (
                        <div key={v} className="relative flex h-20 items-center justify-center rounded-xl border-2 transition-opacity duration-500"
                            style={{ borderColor: hexToRgba(SIN_COLOR, i === 0 && phase >= 1 ? 1 : 0.35), backgroundColor: hexToRgba(SIN_COLOR, 0.08), color: SIN_COLOR, opacity: phase >= 1 && i > 0 ? 0.35 : 1 }}>
                            <span className="relative">
                                <SinVal v={v} />
                                {i === 0 && phase >= 1 && <MarkerLoop pad={10} />}
                            </span>
                            {i === 0 && phase >= 2 && (
                                // стрелка вверх — от 1/2 к 30°
                                <motion.svg className="absolute left-1/2 -translate-x-1/2 bottom-full overflow-visible" width="20" height="36" viewBox="0 0 20 36"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <motion.line x1={10} y1={34} x2={10} y2={8} stroke="#F2C35B" strokeWidth={3.5} strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                                    <motion.polygon points="10,0 3,11 17,11" fill="#F2C35B" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45, type: 'spring', bounce: 0.6 }} />
                                </motion.svg>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {phase >= 3 && (
                <div className="flex items-center justify-center gap-2 text-3xl font-black text-[#F2F7FB]">
                    <span className="rounded-xl border-2 px-2 py-0.5 text-2xl" style={{ borderColor: ANGLE30, backgroundColor: hexToRgba(ANGLE30, 0.2), color: ANGLE30 }}>30°</span>
                    <Pop><span style={{ color: ARC_COLOR }}>=</span></Pop>
                    <Pop delay={0.2}>
                        <span ref={srcRef} style={{ color: ARC_COLOR, opacity: phase >= 4 ? 0.25 : 1 }}><PiFrac s="π/6" /></span>
                    </Pop>
                </div>
            )}
            <DiagramBlock>
                <SinCircle svgRef={svgRef} level={HALF} dashes dots={[A30, A150]}
                    labels={phase >= 5 ? [{ a: A30, text: <PiFrac s="π/6" />, color: ARC_COLOR, key: 'r', side: 1 }] : []} />
            </DiagramBlock>
            {fly && phase === 4 && (
                <motion.div className="pointer-events-none absolute z-20 text-3xl font-black" style={{ color: ARC_COLOR, left: 0, top: 0 }}
                    initial={{ x: fly.x0, y: fly.y0, translateX: '-50%', translateY: '-50%', scale: 1 }}
                    animate={{ x: fly.x1, y: fly.y1, scale: 0.8 }}
                    transition={{ duration: 1, ease: [0.45, 0, 0.2, 1] }}
                    onAnimationComplete={() => setPhase((p) => Math.max(p, 5))}>
                    <PiFrac s="π/6" />
                </motion.div>
            )}
            {phase >= 5 && <TypedBig small parts={[{ text: 'Правая точка — ' }, { text: 'π/6', color: ARC_COLOR }]} onDone={() => onSettled?.()} />}
        </div>
    )
}

// 4. Левая точка — зеркальная: до π не хватает того же π/6 → 5π/6.
const LeftScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase !== 1) return
        const t = setTimeout(() => setPhase((p) => Math.max(p, 2)), 2200)
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'А левая — ' }, { text: 'зеркальная', color: DOT_COLOR }, { text: ': до π ей не хватает тех же π/6' }]} onDone={() => setPhase(1)} readMs={200} />
            <DiagramBlock>
                <SinCircle level={HALF} dashes dots={[A30, A150]}
                    arcs={phase >= 1 ? [{ a0: 0, a1: A30, color: ARC_COLOR, key: 'r' }, { a0: PI, a1: A150, color: ARC_COLOR, key: 'l' }] : []}
                    labels={[
                        { a: A30, text: <PiFrac s="π/6" />, color: ARC_COLOR, key: 'r', side: 1 },
                        ...(phase >= 2 ? [{ a: A150, text: <PiFrac s="5π/6" />, color: ARC_COLOR, key: 'l', side: -1 as const }] : []),
                    ]} />
            </DiagramBlock>
            {phase >= 1 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                    onAnimationComplete={() => setTimeout(() => setPhase((p) => Math.max(p, 2)), 600)}
                    className="flex items-center justify-center gap-2 text-3xl font-black text-[#F2F7FB]">
                    <span>π −</span><span style={{ color: ARC_COLOR }}><PiFrac s="π/6" /></span><span>=</span>
                    {phase >= 2 && <Pop><span style={{ color: ARC_COLOR }}><PiFrac s="5π/6" /></span></Pop>}
                </motion.div>
            )}
            {phase >= 2 && <TypedBig small parts={[{ text: 'Левая точка — ' }, { text: '5π/6', color: ARC_COLOR }]} onDone={() => onSettled?.()} />}
        </>
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
    useEffect(() => { setIntroNextLabel(pickFunNextLabel()) }, [step])

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

