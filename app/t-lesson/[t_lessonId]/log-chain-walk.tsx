// app/t-lesson/[t_lessonId]/log-chain-walk.tsx
//
// Общий движок разборов «Деление логарифмов» (470) и «К-к-комбо логарифмов» (471) в стиле 465–469:
// один пример = ОДНА сцена, формула растёт на месте, «текстовыделение 2.0» (сплошной маркер), короткие строки по одной.
// Фазы сцены (кнопка внизу переключает фазу, сцена не пересоздаётся):
// 0: формула → маркером выделяем совпадающее → короткий текст;
// 1: совпавшее вычёркивается и бледнеет → короткий текст (с шуткой);
// 2: справа появляется «= log □ □», нужные числа (в маркерах) перелетают по параболе в основание и под логарифм → текст.
// После разбора — тренировка-конструктор (основание → число под логарифмом), шуточный вопрос и «десерт» (любой ответ верный).

'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    CORRECT_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { Typewriter, withBreaks } from '@/components/geometry/Typewriter'
import { StrikeMark } from '@/components/geometry/strike-variants'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

const SCENE_TRANSITION_PAUSE_MS = 1000
const FLIGHT_MS = 2200

// Роли цветов: фиолетовый — «ищем» (совпадающее), синий — основание, зелёный (teal) — число под логарифмом.
export const COL_MATCH = GGEGE_PALETTE.purple.button
export const COL_BASE = GGEGE_PALETTE.blue.button
export const COL_ARG = GGEGE_PALETTE.teal.button

export const Plain = ({ children }: { children: ReactNode }) => <span className="text-[#F2F7FB]">{children}</span>

// Сплошной маркер с тёмной цифрой (эталон BaseMark в type-logwalk.tsx).
export const Mark = ({ value, color }: { value: number | string; color: string }) => (
    <motion.span
        initial={{ scale: 2.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-block rounded-[3px] px-[3px] font-extrabold"
        style={{ background: color, color: '#10181C', lineHeight: 1.15 }}
    >
        {value}
    </motion.span>
)

export type LeftOpts = { marked: boolean; dim: boolean; fly: boolean; sent: boolean }
type Flyer = { from: string; to: 'base' | 'arg'; n: number; color: string; arc: number }
type FlyerRun = { n: number; left: number; top: number; fs: number; dx: number; dy: number; arc: number; scale: number; color: string }

// Строка текста: простая или с вставленным числом-стикером (маркер цвета роли).
export type Line = string | ({ t: string } | { n: number; color: string })[]

export type ChainExample = {
    left: (o: LeftOpts) => ReactNode
    strike: [string, string]
    flyers: [Flyer, Flyer]
    // kind: 'strike' — совпавшее вычёркивается (3 фазы); 'oval' — конструкция обводится маркером и бледнеет (4 фазы);
    // 'flip' — «перевёртыш»: справа вырастает «= 1 / log □ □», числа меняются местами (3 фазы)
    flip?: { a: number; b: number }   // для kind 'flip': основание и число под логарифмом
    kind: 'strike' | 'oval' | 'flip'
    lines: Line[][]
    labels: string[]
}

const Slot = ({ value, color }: { value: number | null; color: string }) => (
    value === null ? (
        <span className="inline-block align-middle rounded-md border-2 border-dashed" style={{ width: '0.9em', height: '1em', borderColor: '#3A464E', backgroundColor: hexToRgba(color, 0.1) }} />
    ) : (
        <motion.span initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 15 }} className="inline-block text-[#F2F7FB]">{value}</motion.span>
    )
)

// «= log □ □» (или «= 1 / log □ □» при frac): data-marker base/arg — точки приземления.
const RightExpr = ({ on, base, arg, frac }: { on: boolean; base: number | null; arg: number | null; frac?: boolean }) => {
    const logPart = (
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain>
            <sub className="ml-0.5" style={{ lineHeight: 0 }}><span data-marker="base" className="inline-block"><Slot value={base} color={COL_BASE} /></span></sub>
            <span data-marker="arg" className="ml-1 inline-block"><Slot value={arg} color={COL_ARG} /></span>
        </span>
    )
    return (
        <span className="inline-flex items-center whitespace-nowrap" style={{ opacity: on ? 1 : 0, transition: 'opacity 0.4s' }}>
            <Plain>=</Plain>
            {frac ? (
                <span className="ml-2 inline-flex flex-col items-center">
                    <span className="border-b-2 border-[#F2F7FB] px-2 pb-1"><Plain>1</Plain></span>
                    <span className="px-2 pt-1">{logPart}</span>
                </span>
            ) : <span className="ml-2">{logPart}</span>}
        </span>
    )
}

// Вычёркивание: меряем элементы с data-marker и рисуем поверх выбранный способ (см. strike-variants.tsx).
const Strikes = ({ containerRef, markers, dim }: { containerRef: RefObject<HTMLDivElement | null>; markers: string[]; dim: boolean }) => {
    const [rects, setRects] = useState<{ x: number; y: number; w: number; h: number }[]>([])
    useEffect(() => {
        const c = containerRef.current
        if (!c) return
        const cr = c.getBoundingClientRect()
        setRects(markers.map((m) => {
            const r = c.querySelector<HTMLElement>(`[data-marker="${m}"]`)?.getBoundingClientRect()
            return r ? { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 0, h: 0 }
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // линии бледнеют вместе с логарифмами
    return <span style={{ opacity: dim ? 0.3 : 1, transition: 'opacity 0.5s' }}>{rects.map((r, i) => <StrikeMark key={i} rect={r} delay={i * 0.45} />)}</span>
}

// Обводка «от руки»: овал вокруг группы элементов (union data-marker), чуть наклонён сверху-слева вправо-вниз, концы не сходятся ровно.
const HandOval = ({ containerRef, markers, dim }: { containerRef: RefObject<HTMLDivElement | null>; markers: string[]; dim: boolean }) => {
    const [d, setD] = useState<string | null>(null)
    useEffect(() => {
        const c = containerRef.current
        if (!c) return
        const cr = c.getBoundingClientRect()
        const rs = markers.map((m) => c.querySelector<HTMLElement>(`[data-marker="${m}"]`)?.getBoundingClientRect()).filter(Boolean) as DOMRect[]
        if (!rs.length) return
        const l = Math.min(...rs.map((r) => r.left)), r2 = Math.max(...rs.map((r) => r.right))
        const t = Math.min(...rs.map((r) => r.top)), b = Math.max(...rs.map((r) => r.bottom))
        const cx = (l + r2) / 2 - cr.left, cy = (t + b) / 2 - cr.top
        const rx = (r2 - l) / 2 * 1.1 + 5, ry = (b - t) / 2 * 1.5 + 6
        const rot = (11 * Math.PI) / 180
        const pts: string[] = []
        const N = 64, start = Math.PI * 0.9, total = Math.PI * 2 * 1.1
        for (let i = 0; i <= N; i++) {
            const a = start + (total * i) / N
            const k = 0.95 + 0.1 * (i / N) + 0.025 * Math.sin(a * 3 + 1)
            const x = rx * k * Math.cos(a), y = ry * k * Math.sin(a)
            pts.push(`${(cx + x * Math.cos(rot) - y * Math.sin(rot)).toFixed(1)},${(cy + x * Math.sin(rot) + y * Math.cos(rot)).toFixed(1)}`)
        }
        setD('M' + pts.join(' L'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    if (!d) return null
    return (
        <svg className="pointer-events-none absolute inset-0" style={{ overflow: 'visible', width: '100%', height: '100%', opacity: dim ? 0.3 : 1, transition: 'opacity 0.5s', zIndex: 3 }}>
            <motion.path d={d} fill="none" stroke={COL_MATCH} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
        </svg>
    )
}

// Летящее число: один прогресс p, парабола (прямая + дуга 4·p·(1−p)), маркер к концу растворяется.
const FlyerView = ({ f }: { f: FlyerRun }) => {
    const p = useMotionValue(0)
    useEffect(() => {
        const c = animate(p, 1, { duration: FLIGHT_MS / 1000, ease: [0.45, 0, 0.25, 1] })
        return () => c.stop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const x = useTransform(p, (v) => f.dx * v)
    const y = useTransform(p, (v) => f.dy * v + f.arc * 4 * v * (1 - v))
    const scale = useTransform(p, (v) => 1 + (f.scale - 1) * v)
    const bg = useTransform(p, [0.7, 1], [hexToRgba(f.color, 1), hexToRgba(f.color, 0)])
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

// Строка с числом-стикером: Typewriter печатает плоский текст, после печати вид подменяется на размеченный.
const TypedParts = ({ parts, onSettled }: { parts: Exclude<Line, string>; onSettled: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plain = parts.map((p) => ('t' in p ? p.t : String(p.n))).join('')
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter text={plain} onDone={() => { setTyped(true); setTimeout(onSettled, 450) }} />
            ) : parts.map((p, i) => ('t' in p ? <span key={i}>{withBreaks(p.t)}</span> : <Mark key={i} value={p.n} color={p.color} />))}
        </div>
    )
}

// Блок коротких строк: печатаются по одной, следующая — после предыдущей.
const Lines = ({ lines, dim, onDone }: { lines: Line[]; dim: boolean; onDone: () => void }) => {
    const [n, setN] = useState(1)
    return (
        <div className="flex flex-col gap-1.5" style={dim ? { opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 0.4s' } : undefined}>
            {lines.slice(0, n).map((t, i) => {
                const settled = () => { if (i === lines.length - 1) onDone(); else setN(i + 2) }
                return typeof t === 'string'
                    ? <TypedLine key={i} className="w-full text-base md:text-lg text-[#F2F7FB]" text={t} onSettled={settled} />
                    : <TypedParts key={i} parts={t} onSettled={settled} />
            })}
        </div>
    )
}

// ===== «Перевёртыш» (kind 'flip') =====

// Двойная стрелка над парой чисел: «качается» — наконечники по очереди загораются (то у a, то у b), вся стрелка слегка покачивается.
const SwayArrow = ({ containerRef, from, to, color }: { containerRef: RefObject<HTMLDivElement | null>; from: string; to: string; color: string }) => {
    const [g, setG] = useState<{ d: string; h1: string; h2: string; px: number; py: number } | null>(null)
    useEffect(() => {
        const c = containerRef.current
        const fe = c?.querySelector<HTMLElement>(`[data-marker="${from}"]`), te = c?.querySelector<HTMLElement>(`[data-marker="${to}"]`)
        if (!c || !fe || !te) return
        const cr = c.getBoundingClientRect(), fr = fe.getBoundingClientRect(), tr = te.getBoundingClientRect()
        // концы стрелки чуть внутри рамок цифр: при качании она не выходит за левый край 8 и правый край 2
        const x1 = fr.left + fr.width / 2 - cr.left + 2, x2 = tr.left + tr.width / 2 - cr.left - 2
        const y1 = fr.top - cr.top - 8, y2 = tr.top - cr.top - 8
        const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - 26
        const head = (x: number, y: number, ang: number) => {
            const L = 10, W = 5.5
            const p = (dx: number, dy: number) => `${(x + dx * Math.cos(ang) - dy * Math.sin(ang)).toFixed(1)},${(y + dx * Math.sin(ang) + dy * Math.cos(ang)).toFixed(1)}`
            return `${p(0, 0)} ${p(-L, -W)} ${p(-L, W)}`
        }
        // касательные квадратичной кривой на концах
        const a1 = Math.atan2(y1 - cy, x1 - cx), a2 = Math.atan2(y2 - cy, x2 - cx)
        setG({ d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, h1: head(x1, y1, a1), h2: head(x2, y2, a2), px: cx, py: (y1 + y2) / 2 + 8 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    if (!g) return null
    return (
        <motion.svg className="pointer-events-none absolute inset-0" style={{ overflow: 'visible', width: '100%', height: '100%', transformOrigin: `${g.px}px ${g.py}px` }}
            // качается по и против часовой на небольшой угол вокруг точки между цифрами
            animate={{ rotate: [-7, 7, -7] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
            <motion.path d={g.d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
            <motion.polygon points={g.h1} fill={color} animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }} />
            <motion.polygon points={g.h2} fill={color} animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }} />
        </motion.svg>
    )
}

// Правая часть «= 1 / log_b a»: stage 1 — «=» и копия логарифма (по центру строки); 2 — числа меняются местами, логарифм опускается;
// 3 — рисуется черта дроби; 4 — над чертой появляется 1. Место под дробь зарезервировано, ничего не прыгает.
const FlipRight = ({ stage, a, b, onWidth }: { stage: number; a: number; b: number; onWidth: (w: number) => void }) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const numRef = useRef<HTMLSpanElement>(null)
    const baseRef = useRef<HTMLSpanElement>(null)
    const argRef = useRef<HTMLSpanElement>(null)
    const [dy, setDy] = useState(0)
    const [swap, setSwap] = useState<{ a: { x: number; y: number; s: number }; b: { x: number; y: number; s: number } } | null>(null)
    useLayoutEffect(() => {
        if (rootRef.current) onWidth(rootRef.current.offsetWidth)
        if (numRef.current) setDy(numRef.current.offsetHeight / 2)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    useEffect(() => {
        if (stage !== 2) return
        const be = baseRef.current, ae = argRef.current
        if (!be || !ae) return
        const br = be.getBoundingClientRect(), ar = ae.getBoundingClientRect()
        const fb = parseFloat(getComputedStyle(be).fontSize), fa = parseFloat(getComputedStyle(ae).fontSize)
        const bc = { x: br.left + br.width / 2, y: br.top + br.height / 2 }, ac = { x: ar.left + ar.width / 2, y: ar.top + ar.height / 2 }
        setSwap({ a: { x: ac.x - bc.x, y: ac.y - bc.y, s: fa / fb }, b: { x: bc.x - ac.x, y: bc.y - ac.y, s: fb / fa } })
    }, [stage])
    const dur = 1.3
    return (
        <div ref={rootRef} className="inline-flex items-center" style={{ opacity: stage >= 1 ? 1 : 0, transition: 'opacity 0.5s' }}>
            <Plain>=</Plain>
            <span className="ml-3 inline-flex flex-col items-center">
                <span ref={numRef} className="relative self-stretch px-2 pb-1 text-center">
                    <motion.span className="inline-block text-[#F2F7FB]" initial={false} animate={{ scale: stage >= 4 ? 1 : 0.2, opacity: stage >= 4 ? 1 : 0 }} transition={{ type: 'spring', stiffness: 320, damping: 15 }}>1</motion.span>
                    <motion.span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#F2F7FB]" initial={false} animate={{ scaleX: stage >= 3 ? 1 : 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                </span>
                <motion.span className="inline-flex items-baseline whitespace-nowrap px-2 pt-1" initial={false} animate={{ y: stage >= 2 ? 0 : -dy }} transition={{ duration: stage >= 2 ? dur : 0, ease: 'easeInOut' }}>
                    <Plain>log</Plain>
                    <sub className="ml-0.5">
                        <motion.span ref={baseRef} className="inline-block" initial={false}
                            animate={swap ? { x: [0, swap.a.x * 0.5, swap.a.x], y: [0, swap.a.y - 26, swap.a.y], scale: [1, 1, swap.a.s] } : { x: 0, y: 0, scale: 1 }}
                            transition={{ duration: dur, ease: 'easeInOut', times: [0, 0.5, 1] }}>
                            <Mark value={a} color={COL_BASE} />
                        </motion.span>
                    </sub>
                    <motion.span ref={argRef} className="ml-1 inline-block" initial={false}
                        animate={swap ? { x: [0, swap.b.x * 0.5, swap.b.x], y: [0, swap.b.y + 22, swap.b.y], scale: [1, 1, swap.b.s] } : { x: 0, y: 0, scale: 1 }}
                        transition={{ duration: dur, ease: 'easeInOut', times: [0, 0.5, 1] }}>
                        <Mark value={b} color={COL_ARG} />
                    </motion.span>
                </motion.span>
            </span>
        </div>
    )
}

// Дробь в тренировке: до «броска» логарифм стоит один; после — опускается, рисуется черта на всю его длину, сверху 1.
const TrialFrac = ({ thrown, children }: { thrown: boolean; children: ReactNode }) => {
    const numRef = useRef<HTMLSpanElement>(null)
    const [dy, setDy] = useState(0)
    useLayoutEffect(() => { if (numRef.current) setDy(numRef.current.offsetHeight / 2) }, [])
    return (
        <span className="inline-flex flex-col items-center">
            <span ref={numRef} className="relative self-stretch px-2 pb-1 text-center">
                <motion.span className="inline-block text-[#F2F7FB]" initial={false} animate={{ scale: thrown ? 1 : 0.2, opacity: thrown ? 1 : 0 }} transition={{ type: 'spring', stiffness: 320, damping: 15, delay: thrown ? 1.5 : 0 }}>1</motion.span>
                <motion.span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#F2F7FB]" initial={false} animate={{ scaleX: thrown ? 1 : 0 }} transition={{ duration: 0.6, ease: 'easeOut', delay: thrown ? 0.9 : 0 }} />
            </span>
            <motion.span className="px-2 pt-1" initial={false} animate={{ y: thrown ? 0 : -dy }} transition={{ duration: thrown ? 1 : 0, ease: 'easeInOut' }}>{children}</motion.span>
        </span>
    )
}

const ChainScene = ({ ex, phase, onSettled }: { ex: ChainExample; phase: number; onSettled: () => void }) => {
    const [marked, setMarked] = useState(false)
    const [struck, setStruck] = useState(false)
    const [oval, setOval] = useState(false)
    const [dim, setDim] = useState(false)
    const [rightOn, setRightOn] = useState(false)
    const [fly, setFly] = useState(false)
    const [sent, setSent] = useState(false)
    const [flyers, setFlyers] = useState<FlyerRun[] | null>(null)
    const [landed, setLanded] = useState(false)
    const [shown, setShown] = useState<boolean[]>(() => ex.lines.map(() => false))
    // «перевёртыш»: стрелка-качалка, сдвиг левой части, этап правой части (0..4), ширина резерва
    const [arrowOn, setArrowOn] = useState(false)
    const [shift, setShift] = useState(false)
    const [flipStage, setFlipStage] = useState(0)
    const [off, setOff] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const phaseRef = useRef(phase)
    phaseRef.current = phase
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }
    const showText = (p: number) => setShown((s) => s.map((v, i) => v || i === p))
    // Порядок «текст → действие»: сначала строка печатается, и только потом вычёркивание/перелёт; кнопка — после действия.
    const launch = () => {
        const c = ref.current
        if (!c) { setLanded(true); later(onSettled, 300); return }
        const cr = c.getBoundingClientRect()
        const run: FlyerRun[] = []
        ex.flyers.forEach((f) => {
            const src = c.querySelector<HTMLElement>(`[data-marker="${f.from}"]`)
            const dst = c.querySelector<HTMLElement>(`[data-marker="${f.to}"]`)
            if (!src || !dst) return
            const sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect()
            const fsS = parseFloat(getComputedStyle(src).fontSize), fsD = parseFloat(getComputedStyle(dst).fontSize)
            run.push({
                n: f.n, color: f.color, left: sr.left - cr.left, top: sr.top - cr.top, fs: fsS,
                dx: dr.left + dr.width / 2 - (sr.left + sr.width / 2), dy: dr.top + dr.height / 2 - (sr.top + sr.height / 2),
                arc: f.arc, scale: fsD / fsS,
            })
        })
        setFlyers(run)
        setSent(true)
        later(() => { setFlyers(null); setLanded(true) }, FLIGHT_MS)
        later(onSettled, FLIGHT_MS + 900)
    }
    const lastPhase = ex.lines.length - 1
    const typed = (p: number) => () => {
        if (phaseRef.current !== p) return
        if (ex.kind === 'flip') {
            // текст → действие: 0 — маркеры после текста, 1 — стрелка-качалка после текста
            if (p === 0) { later(() => setMarked(true), 300); later(onSettled, 1200) }
            else if (p === 1) { later(() => setArrowOn(true), 400); later(onSettled, 2600) }
        } else if (p === 0) later(onSettled, 300)
        else if (p === lastPhase) {
            later(() => setRightOn(true), 300)
            later(() => setFly(true), 900)
            later(launch, 1800)
        } else if (ex.kind === 'oval') {
            if (p === 1) { later(() => setOval(true), 400); later(onSettled, 1900) }
            else { later(() => setDim(true), 400); later(onSettled, 1500) }
        } else {
            later(() => setStruck(true), 500)
            later(() => setDim(true), 1700)
            later(onSettled, 2400)
        }
    }

    useEffect(() => {
        const list = timers.current
        if (ex.kind === 'flip') {
            if (phase === 0) later(() => showText(0), 500)
            else if (phase === 1) showText(1)
            else {
                // без текста: исходный логарифм съезжает влево, справа такой же; пауза; числа меняются местами и логарифм опускается; черта; единица
                setArrowOn(false)
                later(() => setShift(true), 100)
                later(() => setFlipStage(1), 800)
                later(() => setFlipStage(2), 2800)
                later(() => setFlipStage(3), 4400)
                later(() => setFlipStage(4), 5200)
                later(onSettled, 6300)
            }
        } else if (phase === 0) { later(() => setMarked(true), 900); later(() => showText(0), 1700) }
        else showText(phase)
        return () => { list.forEach(clearTimeout); list.length = 0 }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    return (
        <>
            <DiagramBlock>
                {ex.kind === 'flip' && ex.flip ? (
                    <div ref={ref} className="relative w-full py-6 flex items-center justify-center gap-3 text-2xl md:text-3xl font-extrabold">
                        <div style={{ transform: `translateX(${shift ? 0 : off}px)`, transition: shift ? 'transform 0.7s ease-in-out' : 'none' }}>
                            {ex.left({ marked, dim, fly, sent })}
                        </div>
                        <FlipRight stage={flipStage} a={ex.flip.a} b={ex.flip.b} onWidth={(w) => setOff((w + 12) / 2)} />
                        {arrowOn && <SwayArrow containerRef={ref} from="a" to="b" color={COL_MATCH} />}
                    </div>
                ) : (
                <div ref={ref} className="relative w-full py-4 flex items-center justify-center gap-5 text-2xl md:text-3xl font-extrabold">
                    {ex.left({ marked, dim, fly, sent })}
                    <RightExpr on={rightOn} base={landed ? ex.flyers[0].n : null} arg={landed ? ex.flyers[1].n : null} />
                    {struck && <Strikes containerRef={ref} markers={ex.strike} dim={dim} />}
                    {oval && <HandOval containerRef={ref} markers={ex.strike} dim={dim} />}
                    {flyers?.map((f) => <FlyerView key={`${f.n}-${f.left}`} f={f} />)}
                </div>
                )}
            </DiagramBlock>
            <div className="flex flex-col gap-2">
                {ex.lines.map((_, p) => shown[p] && ex.lines[p].length > 0 && <Lines key={p} lines={ex.lines[p]} dim={phase > p} onDone={typed(p)} />)}
            </div>
        </>
    )
}

// ===== Тренировка =====

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

type NumTrial = { n: [number, number, number]; options: number[][] }
const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

// Верный ответ в каждом этапе не стоит первым (иначе ребёнок кликает наугад).
const shuffleNotFirst = (arr: number[], correct: number): number[] => {
    let s = shuffle(arr), guard = 0
    while (s[0] === correct && guard++ < 10) s = shuffle(arr)
    return s
}

const makeTrials = (n: number, answer: (t: [number, number, number]) => [number, number]): NumTrial[] => {
    const out: NumTrial[] = []
    for (let i = 0; i < n; i++) {
        let t: NumTrial, guard = 0
        do {
            const [a, b, c, extra] = shuffle([...NUM_POOL]).slice(0, 4)
            const nn: [number, number, number] = [a, b, c]
            const ans = answer(nn)
            t = { n: nn, options: [0, 1].map((k) => shuffleNotFirst([a, b, c, extra], ans[k])) }
            guard++
        } while (out.length && out[out.length - 1].n.join() === t.n.join() && guard < 8)
        out.push(t)
    }
    return out
}

type ChoiceExtra = { question: string; options: string[]; correct: string[] }

export type ChainWalkConfig = {
    examples: [ChainExample, ChainExample]
    prompt: (n: [number, number, number]) => ReactNode
    answer: (n: [number, number, number]) => [number, number]
    stagePrompts: [string, string]
    frac?: boolean          // ответ вида «1 / log □ □»: ученик сам «кидает» логарифм в знаменатель
    throwPrompt?: string
    throwOptions?: [string, string][]   // по паре на задание: верный первым, шуточный вторым
    joke: ChoiceExtra
}

const DESSERT: ChoiceExtra = {
    question: 'Кто теперь шарит в теме?',
    options: ['Я', 'Конечно, я', 'Несомненно, я', 'Кто же ещё, как не я'],
    correct: ['Я', 'Конечно, я', 'Несомненно, я', 'Кто же ещё, как не я'],
}

const NUM_TRIALS = 4

export const LogChainWalk = ({ cfg, onAnswer, onComplete }: { cfg: ChainWalkConfig; onAnswer: (a: string) => void; onComplete: (ok: boolean) => void }) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [trials] = useState<NumTrial[]>(() => makeTrials(NUM_TRIALS, cfg.answer))
    const extras = [cfg.joke, DESSERT]
    const total = NUM_TRIALS + extras.length
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [stage, setStage] = useState(cfg.frac ? -1 : 0)
    const [fracReady, setFracReady] = useState(false)
    const [throwOrder] = useState(() => (cfg.throwOptions ?? []).map((o) => shuffle([...o])))
    const [wrongTried, setWrongTried] = useState<(number | string)[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [jokeOrder] = useState(() => extras.map((e) => shuffle(e.options)))
    const registerCombo = useWalkthroughCombo()
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // у примера 3 или 4 фазы (см. kind): считаем начало каждого примера
    const lens = cfg.examples.map((e) => e.lines.length)
    const starts = [0, lens[0]]
    const totalSteps = lens[0] + lens[1]
    const exIdx = step >= starts[1] ? 1 : 0
    const exPhase = step - starts[exIdx]
    const resetTrial = () => { setChecked(false); setStage(cfg.frac ? -1 : 0); setFracReady(false); setWrongTried([]); setWrongFlash(null) }

    const finishTrial = () => {
        registerCombo(wrongTried.length === 0)
        showAnswerMeme(true)
        setChecked(true)
        setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
    }
    const onWrong = (v: number | string) => {
        playSound(WRONG_ANSWER_SOUND)
        setHadMistake(true)
        showAnswerMeme(false)
        setWrongTried((p) => [...p, v])
        setWrongFlash(pickWrongTryPhrase())
    }

    const handleNumber = (n: number) => {
        if (checked || wrongTried.includes(n)) return
        const correct = cfg.answer(trials[trialIndex].n)[stage]
        if (n !== correct) return onWrong(n)
        if (stage < 1) { registerCombo(wrongTried.length === 0); setStage(stage + 1); setWrongTried([]); setWrongFlash(null); return }
        finishTrial()
    }
    const handleThrow = (s: string) => {
        if (wrongTried.includes(s)) return
        const [good] = cfg.throwOptions![trialIndex]
        if (s !== good) return onWrong(s)
        registerCombo(wrongTried.length === 0)
        setStage(0); setWrongTried([]); setWrongFlash(null); setFracReady(false)
        setTimeout(() => setFracReady(true), 2300)
    }
    const handleText = (s: string) => {
        if (checked || wrongTried.includes(s)) return
        const ex = extras[trialIndex - NUM_TRIALS]
        if (ex.correct.includes(s)) finishTrial(); else onWrong(s)
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (trialIndex + 1 >= total) {
                setAdvancing(false)
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
                return
            }
            setTrialIndex((i) => i + 1)
            resetTrial()
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= totalSteps) setPhase('practice')
            else { setStep((s) => s + 1); setStepReady(false) }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const latestSceneKey = phase === 'intro' ? `step-${exIdx}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) { const i = Number(key.slice(6)); return i > 0 ? `trial-${i - 1}` : 'step-1' }
        return key === 'step-1' ? 'step-0' : null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = phase === 'practice' || step > 0

    const handleReplay = () => {
        if (phase === 'intro') { setStep(starts[exIdx]); setStepReady(false) } else resetTrial()
        bumpNonce(latestSceneKey)
    }
    const handleBack = () => {
        if (advancing) return
        if (phase === 'intro') {
            if (step === 0) return
            const t = exPhase > 0 ? starts[exIdx] : starts[exIdx - 1]
            bumpNonce(`step-${exPhase > 0 ? exIdx : exIdx - 1}`); setStep(t); setStepReady(false)
            return
        }
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) { setTrialIndex(Number(target.slice(6))); resetTrial() }
        else { setPhase('intro'); setStep(starts[Number(target.slice(5))] + lens[Number(target.slice(5))] - 1); setStepReady(false) }
    }

    const slotText = (n: number | null, color: string, done: boolean, active: boolean) => (
        n === null ? (
            <span
                className={cn('inline-block align-middle rounded-md border-2 border-dashed', active && 'animate-slot-breathe')}
                style={{ width: '0.95em', height: '1.05em', borderColor: active ? color : '#3A464E', backgroundColor: active ? hexToRgba(color, 0.18) : 'transparent' }}
            />
        ) : (
            <motion.span initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 15 }} className="inline-block" style={{ color: done ? CORRECT_COLOR : '#F2F7FB' }}>{n}</motion.span>
        )
    )

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {[0, 1].map((i) => step >= starts[i] && (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <ChainScene ex={cfg.examples[i]} phase={Math.min(lens[i] - 1, Math.max(0, step - starts[i]))} onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                ))}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const isNum = i < NUM_TRIALS
                    const t = isNum ? trials[i] : null
                    const ans = t ? cfg.answer(t.n) : null
                    const extra = isNum ? null : extras[i - NUM_TRIALS]
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
                                <div className="relative w-full flex items-center justify-center">
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{ borderColor: hexToRgba(COL_MATCH, 0.55), backgroundColor: hexToRgba(COL_MATCH, 0.16), color: COL_MATCH }}
                                    >
                                        <span>{i + 1}</span><span className="opacity-50 font-normal">/</span><span>{total}</span>
                                    </div>
                                    <p className="text-base md:text-lg text-[#F2F7FB] text-center px-14">
                                        {extra ? extra.question : (isDone || !isCurrent ? 'Собрали ответ' : stage < 0 ? cfg.throwPrompt : cfg.stagePrompts[stage])}
                                    </p>
                                </div>

                                {t && ans && (
                                    <>
                                        <DiagramBlock>
                                            <div className="w-full flex items-center justify-center text-2xl md:text-3xl font-extrabold py-1">{cfg.prompt(t.n)}</div>
                                            <div className="w-full flex items-center justify-center gap-x-2 text-2xl md:text-3xl font-extrabold pt-6 pb-1">
                                                <Plain>=</Plain>
                                                {(() => {
                                                    const logPart = (
                                                        <span className="inline-flex items-baseline whitespace-nowrap">
                                                            <Plain>log</Plain>
                                                            <sub className="ml-0.5" style={{ lineHeight: 0 }}>{slotText((isDone || !isCurrent || stage > 0) ? ans[0] : null, COL_BASE, isDone, isCurrent && !isDone && stage === 0 && (!cfg.frac || fracReady))}</sub>
                                                            <span className="ml-1">{slotText((isDone || !isCurrent) ? ans[1] : null, COL_ARG, isDone, isCurrent && !isDone && stage === 1)}</span>
                                                        </span>
                                                    )
                                                    return cfg.frac ? (
                                                        <TrialFrac thrown={isDone || !isCurrent || stage >= 0}>{logPart}</TrialFrac>
                                                    ) : logPart
                                                })()}
                                            </div>
                                        </DiagramBlock>
                                        {isCurrent && !checked && stage >= 0 && (!cfg.frac || fracReady) && (
                                            <div key={stage} className="drop-in-options flex flex-wrap justify-center gap-3">
                                                {t.options[stage].map((n) => {
                                                    const bad = wrongTried.includes(n)
                                                    return (
                                                        <button key={n} type="button" onClick={() => handleNumber(n)} disabled={bad}
                                                            className={cn('min-w-[72px] py-3 px-4 rounded-xl border-2 text-xl md:text-2xl font-extrabold transition-colors inline-flex items-center justify-center',
                                                                bad ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                                            {n}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}

                                {t && cfg.frac && isCurrent && !checked && stage < 0 && (
                                    <div className="drop-in-options grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {throwOrder[i].map((o) => {
                                            const bad = wrongTried.includes(o)
                                            return (
                                                <button key={o} type="button" onClick={() => handleThrow(o)} disabled={bad}
                                                    className={cn('py-3 px-4 rounded-xl border-2 text-base md:text-lg font-bold transition-colors',
                                                        bad ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                                    {o}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {extra && isCurrent && !checked && (
                                    <div className="drop-in-options grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {jokeOrder[i - NUM_TRIALS].map((s) => {
                                            const bad = wrongTried.includes(s)
                                            return (
                                                <button key={s} type="button" onClick={() => handleText(s)} disabled={bad}
                                                    className={cn('py-3 px-4 rounded-xl border-2 text-base md:text-lg font-bold transition-colors',
                                                        bad ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                                    {s}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {isCurrent && !checked && wrongFlash && (
                                    <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                        <X className="w-5 h-5" /> {wrongFlash}
                                    </div>
                                )}
                                {isDone && (
                                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                        {CORRECT_FEEDBACK_PHRASES[(i * 5 + (t ? t.n[0] + t.n[1] * 3 : 0)) % CORRECT_FEEDBACK_PHRASES.length]}
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
                        {cfg.examples[exIdx].labels[exPhase]}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= total ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}

