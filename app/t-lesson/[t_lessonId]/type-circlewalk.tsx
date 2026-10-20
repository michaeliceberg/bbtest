'use client'

// Планиметрия → «Треугольники» → «Окружности» (CIRCLEWALK). Пошаговый разбор без квиза:
//   1. Окружность = 360°, половина = 180°, четверть = 90° (на одной и той же окружности).
//   2. Центральный угол: два радиуса, угол, 60° → его дуга тоже 60°; угол «тянется» до 100° и сжимается до 40°.
//   3. Вписанный угол: две хорды из одной точки окружности.
// Окружность рисуем ПРОТИВ часовой от точки справа (правило проекта). Углы — синие (роль «угол»).

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, RememberPlate, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner } from '@/components/geometry/WalkthroughLog'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import Lottie from '@/components/lottie-player'
import crowEat from '@/public/Lottie/stepByStep/crowEat.json'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}
type SceneProps = { onSettled?: () => void }

const ANGLE_COLOR = GGEGE_PALETTE.blue.button
const PART_COLOR = GGEGE_PALETTE.purple.button
const LINE = '#F2F7FB'
const DIM = 0.18
const OK_COLOR = '#A1D151'

// ===== Геометрия: углы в градусах «по-математически» (против часовой, y вверх) =====
const VIEW = 300
const CX = 150, CY = 150, R = 110
const rad = (d: number) => (d * Math.PI) / 180
const pt = (deg: number, r = R, cx = CX, cy = CY) => ({ x: cx + r * Math.cos(rad(deg)), y: cy - r * Math.sin(rad(deg)) })
// Дуга против часовой от a0 до a1 (a1 > a0). В SVG (y вниз) «против часовой» = sweep-flag 0.
const arcPath = (a0: number, a1: number, r = R, cx = CX, cy = CY) => {
    const p0 = pt(a0, r, cx, cy), p1 = pt(a1, r, cx, cy)
    const large = a1 - a0 > 180 ? 1 : 0
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`
}
const sectorPath = (a0: number, a1: number, r: number, cx = CX, cy = CY) => `${arcPath(a0, a1, r, cx, cy).replace('M', `M ${cx} ${cy} L`)} Z`
const dirDeg = (from: { x: number; y: number }, to: { x: number; y: number }) => (Math.atan2(-(to.y - from.y), to.x - from.x) * 180) / Math.PI

// Текст на рисунке с отскоком. Позиция — на статичном <g> (framer перезаписывает transform у motion-узла).
const SvgPop = ({ x, y, children, color = LINE, size = 30, show = true }: { x: number; y: number; children: React.ReactNode; color?: string; size?: number; show?: boolean }) => (
    <g transform={`translate(${x} ${y})`}>
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={show ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
            transition={show ? { type: 'spring', stiffness: 380, damping: 11 } : { duration: 0.25 }}>
            <text textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size} fontWeight={900}
                style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{children}</text>
        </motion.g>
    </g>
)

// Окружность, которая рисуется против часовой от точки справа.
const DrawCircle = ({ opacity = 1, instant }: { opacity?: number; instant?: boolean }) => (
    <motion.path d={`${arcPath(0, 180)} ${arcPath(180, 359.99).replace('M', 'L')}`} fill="none" stroke={LINE} strokeWidth={4} strokeLinecap="round"
        initial={{ pathLength: instant ? 1 : 0 }} animate={{ pathLength: 1, opacity }} transition={{ pathLength: { duration: instant ? 0 : 1.1, ease: 'easeInOut' }, opacity: { duration: 0.6 } }} />
)

const Svg = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex justify-center">
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full max-w-[340px] overflow-visible">{children}</svg>
    </div>
)

const TypedBig = ({ text, onDone, readMs = 500, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)

const ReplyButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{children}</button>
    </motion.div>
)

const PauseThen = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}

// Плавное изменение числа (easeInOut) на setInterval, а не на requestAnimationFrame: так же плавно, но не замирает,
// если вкладка/панель не отрисовывает кадры.
const tween = (from: number, to: number, ms: number, onUpdate: (v: number) => void, onDone?: () => void) => {
    const t0 = Date.now()
    const id = setInterval(() => {
        const k = Math.min(1, (Date.now() - t0) / ms)
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        onUpdate(from + (to - from) * e)
        if (k >= 1) { clearInterval(id); onDone?.() }
    }, 16)
}

// ===== Сцена 1: 360 → 180 → 90 =====
// Число стоит на одном месте (в центре) и с отскоком меняется 360 → 180 → 90. Жирная фиолетовая дуга от точки справа
// плавно укорачивается вместе с ним; остальная окружность — бледная.
const FullCircleScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [arcEnd, setArcEnd] = useState(359.99)
    const [label, setLabel] = useState(360)
    const endRef = useRef(arcEnd)
    endRef.current = arcEnd
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    const shrinkTo = (to: number, num: number, nextPhase: number) => {
        setPhase(nextPhase)
        // Сначала укорачивается дуга, число меняется с отскоком под самый конец (когда дуга почти дошла).
        tween(endRef.current, to, 1100, setArcEnd)
        setTimeout(() => setLabel(num), 950)
    }
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 900)}>
                <Svg>
                    {phase < 1 ? <DrawCircle /> : (
                        <motion.path d={`${arcPath(0, 180)} ${arcPath(180, 359.99).replace('M', 'L')}`} fill="none" stroke={LINE} strokeWidth={4}
                            initial={{ opacity: 1 }} animate={{ opacity: phase >= 2 ? DIM : 1 }} transition={{ duration: 0.7 }} />
                    )}
                    {phase >= 1 && (
                        <motion.path d={arcPath(0, arcEnd)} fill="none" stroke={PART_COLOR} strokeWidth={9} strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
                    )}
                    {phase >= 1 && <SvgPop key={label} x={CX} y={CY} size={46}>{`${label}°`}</SvgPop>}
                </Svg>
            </DiagramBlock>
            {phase === 1 && <PauseThen ms={1300} onDone={next(1.5)} />}
            {phase === 1.5 && <ReplyButton onClick={() => shrinkTo(180, 180, 2)}>Вся окружность = 360°</ReplyButton>}
            {phase === 2 && <PauseThen ms={1400} onDone={next(2.5)} />}
            {phase === 2.5 && <ReplyButton onClick={() => shrinkTo(90, 90, 3)}>Половина окружности = 180°</ReplyButton>}
            {phase >= 3 && <PauseThen ms={1500} onDone={() => onSettled?.()} />}
        </>
    )
}

// Плавное изменение угла: цифры гаснут → угол тянется → новые цифры с отскоком.
const useAngleMorph = (initial: number) => {
    const [value, setValue] = useState(initial)
    const [shown, setShown] = useState(initial)
    const [numsOn, setNumsOn] = useState(true)
    const ref = useRef(initial)
    ref.current = value
    const morph = (to: number) => new Promise<void>((resolve) => {
        setNumsOn(false)
        setTimeout(() => {
            tween(ref.current, to, 1300, setValue, () => { setShown(to); setNumsOn(true); resolve() })
        }, 450)
    })
    // До a, пауза 2 с, потом до b.
    const runTwo = async (a: number, b: number) => {
        await morph(a)
        await new Promise((r) => setTimeout(r, 2000))
        await morph(b)
    }
    return { value, shown, numsOn, runTwo }
}

// ===== Сцена 2: центральный угол =====
const CENTRAL_START = 25
const CentralScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const m = useAngleMorph(60)
    const theta = m.value
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    const a0 = CENTRAL_START, a1 = CENTRAL_START + theta
    const P0 = pt(a0), P1 = pt(a1)
    const mid = a0 + theta / 2
    const inLabel = pt(mid, 52), outLabel = pt(mid, R + 30)
    const run = async () => { setPhase(7); await m.runTwo(100, 40); setPhase(8) }

    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 700)}>
                <Svg>
                    <DrawCircle instant />
                    {phase >= 2 && (
                        <g transform={`translate(${CX} ${CY})`}>
                            <motion.path d={sectorPath(a0, a1, 34, 0, 0)} fill={hexToRgba(ANGLE_COLOR, 0.35)} stroke={ANGLE_COLOR} strokeWidth={3}
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 10 }} />
                        </g>
                    )}
                    {phase >= 5 && (
                        <motion.path d={arcPath(a0, a1)} fill="none" stroke={ANGLE_COLOR} strokeWidth={10} strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                    )}
                    {phase >= 1 && (
                        <>
                            <motion.line x1={CX} y1={CY} x2={P0.x} y2={P0.y} stroke={LINE} strokeWidth={4} strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                            <motion.line x1={CX} y1={CY} x2={P1.x} y2={P1.y} stroke={LINE} strokeWidth={4} strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.35 }} />
                            <circle cx={CX} cy={CY} r={5} fill={LINE} />
                        </>
                    )}
                    {phase >= 4 && <SvgPop key={`in-${m.shown}`} x={inLabel.x} y={inLabel.y} size={20} color={LINE} show={m.numsOn}>{`${m.shown}°`}</SvgPop>}
                    {phase >= 6 && <SvgPop key={`out-${m.shown}`} x={outLabel.x} y={outLabel.y} size={24} color={ANGLE_COLOR} show={m.numsOn}>{`${m.shown}°`}</SvgPop>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <PauseThen ms={1100} onDone={next(2)} />}
            {phase >= 2 && <TypedBig text="Это центральный угол" onDone={next(3)} readMs={300} />}
            {phase === 3 && <ReplyButton onClick={() => setPhase(4)}>Вижу, центральный угол</ReplyButton>}
            {phase >= 4 && <PauseThen ms={1300} onDone={next(5)} />}
            {phase >= 5 && <PauseThen ms={900} onDone={next(6)} />}
            {phase >= 6 && <TypedBig small text="Центральный угол = дуге, на которую он опирается" onDone={next(6.5)} readMs={300} />}
            {phase === 6.5 && <ReplyButton onClick={run}>Понял-принял</ReplyButton>}
            {phase >= 8 && <PauseThen ms={1000} onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 3: вписанный угол =====
// Вершина внизу (270°), концы хорд симметрично относительно верха: дуга между ними (сверху) = 2 · угол.
const INS_P = 270
const InscribedScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const m = useAngleMorph(60)
    const angle = m.value
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    const arcA = 90 - angle, arcB = 90 + angle // дуга = 2 · угол
    const P = pt(INS_P), A = pt(arcA), B = pt(arcB)
    const dA = dirDeg(P, A), dB = dirDeg(P, B)
    const [lo, hi] = dA < dB ? [dA, dB] : [dB, dA]
    const inLabel = { x: P.x, y: P.y - 66 }
    const outLabel = pt(90, R + 28)
    const run = async () => { setPhase(7); await m.runTwo(80, 40); setPhase(8) }
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 700)}>
                <Svg>
                    <DrawCircle instant />
                    {phase >= 2 && (
                        <g transform={`translate(${P.x} ${P.y})`}>
                            <motion.path d={sectorPath(lo, hi, 40, 0, 0)} fill={hexToRgba(ANGLE_COLOR, 0.35)} stroke={ANGLE_COLOR} strokeWidth={3}
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 10 }} />
                        </g>
                    )}
                    {phase >= 5 && (
                        <motion.path d={arcPath(arcA, arcB)} fill="none" stroke={ANGLE_COLOR} strokeWidth={10} strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                    )}
                    {phase >= 1 && (
                        <>
                            <motion.line x1={P.x} y1={P.y} x2={A.x} y2={A.y} stroke={LINE} strokeWidth={4} strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                            <motion.line x1={P.x} y1={P.y} x2={B.x} y2={B.y} stroke={LINE} strokeWidth={4} strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.4 }} />
                            <circle cx={P.x} cy={P.y} r={5} fill={LINE} />
                        </>
                    )}
                    {phase >= 4 && <SvgPop key={`in-${m.shown}`} x={inLabel.x} y={inLabel.y} size={20} color={LINE} show={m.numsOn}>{`${m.shown}°`}</SvgPop>}
                    {phase >= 6 && <SvgPop key={`out-${m.shown}`} x={outLabel.x} y={outLabel.y} size={24} color={ANGLE_COLOR} show={m.numsOn}>{`${m.shown * 2}°`}</SvgPop>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <PauseThen ms={1300} onDone={next(2)} />}
            {phase >= 2 && <TypedBig text="А это вписанный угол" onDone={next(3)} readMs={300} />}
            {phase === 3 && <ReplyButton onClick={() => setPhase(4)}>Вписанный угол</ReplyButton>}
            {phase >= 4 && <PauseThen ms={1300} onDone={next(5)} />}
            {phase >= 5 && <PauseThen ms={900} onDone={next(6)} />}
            {phase >= 6 && <TypedBig small text="Вписанный угол = ПОЛОВИНЕ дуги, на которую он опирается" onDone={next(6.5)} readMs={300} />}
            {phase === 6.5 && <ReplyButton onClick={run}>Понял-принял</ReplyButton>}
            {phase >= 8 && <PauseThen ms={1000} onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Тренировка: центральный и вписанный угол =====
// Концы дуги симметричны относительно верха окружности (90° ± дуга/2), вершина вписанного угла — внизу (270°),
// центральный угол — из центра к тем же концам. Значения: дуга = центральный = 2 · вписанный.
type TKey = 'central' | 'inscribed' | 'arc'
type TStep = { key: TKey; options: number[]; hint: string }
type Trial = { arc: number; central: boolean; inscribed: boolean; given: TKey[]; steps: TStep[] }
const TRIALS: Trial[] = [
    { arc: 50, central: true, inscribed: false, given: ['central'], steps: [{ key: 'arc', options: [50, 100, 25, 130], hint: 'Центральный угол = дуге 🙃' }] },
    { arc: 120, central: true, inscribed: false, given: ['arc'], steps: [{ key: 'central', options: [120, 60, 240, 90], hint: 'Центральный угол = дуге 🙃' }] },
    { arc: 100, central: false, inscribed: true, given: ['inscribed'], steps: [{ key: 'arc', options: [100, 50, 25, 130], hint: 'Дуга в 2 раза БОЛЬШЕ вписанного 🙃' }] },
    { arc: 140, central: false, inscribed: true, given: ['arc'], steps: [{ key: 'inscribed', options: [70, 140, 280, 40], hint: 'Вписанный в 2 раза МЕНЬШЕ дуги 🙃' }] },
    { arc: 160, central: true, inscribed: true, given: ['central'], steps: [
        { key: 'arc', options: [160, 80, 320, 100], hint: 'Центральный угол = дуге 🙃' },
        { key: 'inscribed', options: [80, 160, 40, 100], hint: 'Вписанный в 2 раза МЕНЬШЕ дуги 🙃' },
    ] },
    { arc: 70, central: true, inscribed: true, given: ['inscribed'], steps: [
        { key: 'arc', options: [70, 35, 140, 110], hint: 'Дуга в 2 раза БОЛЬШЕ вписанного 🙃' },
        { key: 'central', options: [70, 35, 140, 105], hint: 'Центральный угол = дуге 🙃' },
    ] },
]
const valueOf = (t: Trial, k: TKey) => (k === 'inscribed' ? t.arc / 2 : t.arc)
const ASK_TEXT: Record<TKey, string> = { arc: 'Чему равна дуга?', central: 'Чему равен центральный угол?', inscribed: 'Чему равен вписанный угол?' }
const ASK_COLOR = '#F2C35B'

type LabelState = 'given' | 'ask' | 'answered' | 'hidden'
// central / inscribed — прозрачность угла: 0 — нет, 1 — есть, между — «потускневший» (сейчас не про него).
const TrialFigure = ({ t, labels, arc, central, inscribed, labelsOn }: { t: Trial; labels: Record<TKey, LabelState>; arc: number; central: number; inscribed: number; labelsOn: boolean }) => {
    const a0 = 90 - arc / 2, a1 = 90 + arc / 2
    const A = pt(a0), B = pt(a1), P = pt(270)
    const dA = dirDeg(P, A), dB = dirDeg(P, B)
    const [lo, hi] = dA < dB ? [dA, dB] : [dB, dA]
    const text = (k: TKey) => (labels[k] === 'ask' ? '?' : `${valueOf(t, k)}°`)
    const color = (k: TKey, base: string) => (labels[k] === 'ask' ? ASK_COLOR : labels[k] === 'answered' ? OK_COLOR : base)
    const centralLabel = pt(90, arc < 70 ? 62 : 50)
    return (
        <Svg>
            <DrawCircle instant />
            <path d={arcPath(a0, a1)} fill="none" stroke={ANGLE_COLOR} strokeWidth={10} strokeLinecap="round" />
            <motion.g initial={false} animate={{ opacity: central }} transition={{ duration: 0.6 }}>
                    <path d={sectorPath(a0, a1, 32)} fill={hexToRgba(ANGLE_COLOR, 0.3)} stroke={ANGLE_COLOR} strokeWidth={3} />
                    <line x1={CX} y1={CY} x2={A.x} y2={A.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <line x1={CX} y1={CY} x2={B.x} y2={B.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <circle cx={CX} cy={CY} r={5} fill={LINE} />
            </motion.g>
            <motion.g initial={false} animate={{ opacity: inscribed }} transition={{ duration: 0.6 }}>
                <>
                    <path d={sectorPath(lo, hi, 38, P.x, P.y)} fill={hexToRgba(PART_COLOR, 0.3)} stroke={PART_COLOR} strokeWidth={3} />
                    <line x1={P.x} y1={P.y} x2={A.x} y2={A.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <line x1={P.x} y1={P.y} x2={B.x} y2={B.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <circle cx={P.x} cy={P.y} r={5} fill={LINE} />
                </>
            </motion.g>
            {labels.arc !== 'hidden' && <SvgPop key={`arc-${t.arc}-${labels.arc}`} x={CX} y={CY - R - 26} size={26} color={color('arc', ANGLE_COLOR)} show={labelsOn}>{text('arc')}</SvgPop>}
            {t.central && labels.central !== 'hidden' && central > 0 && <g opacity={central} style={{ transition: 'opacity 0.6s' }}><SvgPop key={`c-${t.arc}-${labels.central}`} x={centralLabel.x} y={centralLabel.y} size={22} color={color('central', LINE)} show={labelsOn}>{text('central')}</SvgPop></g>}
            {t.inscribed && labels.inscribed !== 'hidden' && inscribed > 0 && <g opacity={inscribed} style={{ transition: 'opacity 0.6s' }}><SvgPop key={`i-${t.arc}-${labels.inscribed}`} x={P.x} y={P.y - 62} size={22} color={color('inscribed', LINE)} show={labelsOn}>{text('inscribed')}</SvgPop></g>}
        </Svg>
    )
}
const labelsFor = (t: Trial, stepIdx: number, done: boolean): Record<TKey, LabelState> => {
    const out: Record<TKey, LabelState> = { arc: 'hidden', central: 'hidden', inscribed: 'hidden' }
    t.given.forEach((k) => { out[k] = 'given' })
    t.steps.forEach((s, i) => {
        if (i < stepIdx || (i === stepIdx && done)) out[s.key] = 'answered'
        else if (i === stepIdx) out[s.key] = 'ask'
    })
    return out
}
// Перед этим заданием (5/6) — вставка: Lottie вороны на 1 цикл и «Теперь К-К-КОМБО!».
const COMBO_BEFORE = 4
const OUTLINE_SHADOW = [-3, 0, 3].flatMap((x) => [-3, 0, 3].map((y) => `${x}px ${y}px 0 #0B1114`)).join(', ')
const ComboInterlude = ({ onDone }: { onDone: () => void }) => {
    const doneRef = useRef(false)
    const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone() } }
    useEffect(() => {
        const t = setTimeout(finish, 3800) // страховка, если onComplete не придёт
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <motion.div className="w-full flex flex-col items-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
            <div className="w-56 h-56 md:w-64 md:h-64">
                <Lottie animationData={crowEat} loop={false} autoplay onComplete={finish} />
            </div>
            <div className="text-3xl md:text-4xl font-black text-white text-center -mt-4" style={{ textShadow: OUTLINE_SHADOW }}>
                Теперь К-К-КОМБО!
            </div>
        </motion.div>
    )
}
// Прозрачность угла: нет на рисунке — 0; в задании с двумя углами тот, про который сейчас не спрашиваем, — бледный.
const opacityOf = (t: Trial, k: 'central' | 'inscribed', st: TStep | null) => {
    if (!t[k]) return 0
    if (!st || !(t.central && t.inscribed)) return 1
    const other: 'central' | 'inscribed' = k === 'central' ? 'inscribed' : 'central'
    // Про дугу спрашиваем через данный угол — бледнеет второй; про угол — бледнеет другой угол.
    const focus = st.key === 'arc' ? (t.given.includes('central') ? 'central' : 'inscribed') : st.key
    return focus === k ? 1 : (focus === other ? 0.22 : 1)
}
const pickPraise = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 2) % CORRECT_FEEDBACK_PHRASES.length]

const Pop = ({ children }: { children: React.ReactNode }) => (
    <motion.span className="inline-flex items-center" initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}>{children}</motion.span>
)

// ===== Следствие: вписанный четырёхугольник, ∠ + ∠ = 180° =====
// Ученик сам выбирает первую дугу X (нижняя, симметрична относительно низа окружности), находит вторую 360 − X,
// потом два вписанных угла: первый опирается на дугу X (вершина сверху) = X/2, второй — на другую дугу (вершина снизу).
// В конце: X/2 + (360 − X)/2 = 180°. Ошибки здесь не засчитываются — это объяснение, а не проверка.
const ARC1_COLOR = PART_COLOR
// Вторая дуга — бирюзовая: синяя рядом с фиолетовой читалась как та же самая.
const ARC2_COLOR = GGEGE_PALETTE.teal.button
const pickOptions = (correct: number, cands: number[]) => {
    const out: number[] = []
    for (const v of [correct, ...cands]) if (v > 0 && !out.includes(v) && out.length < 4) out.push(v)
    return out
}
const CorAngle = ({ v, e0, e1, color, value, show, dim = false }: { v: number; e0: number; e1: number; color: string; value: number | null; show: boolean; dim?: boolean }) => {
    const V = pt(v), A = pt(e0), C = pt(e1)
    const dA = dirDeg(V, A), dC = dirDeg(V, C)
    const [lo, hi] = dA < dC ? [dA, dC] : [dC, dA]
    const L = { x: V.x + 58 * Math.cos(rad((lo + hi) / 2)), y: V.y - 58 * Math.sin(rad((lo + hi) / 2)) }
    return (
        <motion.g initial={false} animate={{ opacity: dim ? DIM : 1 }} transition={{ duration: 0.5 }}>
            <motion.line x1={V.x} y1={V.y} x2={A.x} y2={A.y} stroke={LINE} strokeWidth={4} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
            <motion.line x1={V.x} y1={V.y} x2={C.x} y2={C.y} stroke={LINE} strokeWidth={4} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
            <motion.path d={sectorPath(lo, hi, 30, V.x, V.y)} fill={hexToRgba(color, 0.32)} stroke={color} strokeWidth={3}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.8 }} />
            <circle cx={V.x} cy={V.y} r={5} fill={LINE} />
            <SvgPop key={`${v}-${show}`} x={L.x} y={L.y} size={20} color={show ? color : ASK_COLOR}>{show && value !== null ? `${value}°` : '?'}</SvgPop>
        </motion.g>
    )
}
const ChoiceRow = ({ options, correct, onDone, hint }: { options: number[]; correct?: number; onDone: (v: number) => void; hint?: string }) => {
    const [wrong, setWrong] = useState<number[]>([])
    const [ok, setOk] = useState<number | null>(null)
    const pick = (v: number) => {
        if (ok !== null || wrong.includes(v)) return
        if (correct === undefined || v === correct) {
            setOk(v)
            if (correct !== undefined) showAnswerMeme(true)
            setTimeout(() => onDone(v), 500)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setWrong((w) => [...w, v])
        }
    }
    return (
        <div className="w-full flex flex-col gap-2">
            <div className={cn('drop-in-options grid gap-3 w-full', options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                {options.map((v) => (
                    <button key={v} type="button" disabled={ok !== null || wrong.includes(v)} onClick={() => pick(v)}
                        className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors',
                            ok === v ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                : wrong.includes(v) ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                        {v}°
                    </button>
                ))}
            </div>
            {wrong.length > 0 && ok === null && hint && (
                <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{pickWrongTryPhrase()} {hint}</div>
            )}
        </div>
    )
}
const CorollaryScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [x, setX] = useState(200)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    const y = 360 - x
    const e0 = 270 - x / 2, e1 = 270 + x / 2 // концы дуг; первая дуга — снизу, от e0 до e1 против часовой
    const arc1Label = pt(270, R + 30), arc2Label = pt(90, R + 28)
    // Вершины вписанных углов — не напротив середины дуги, а сбоку: хорды наклонены, четырёхугольник несимметричный.
    // Вершина первого угла — на второй дуге (65% пути от e1), второго — на первой дуге (30% пути от e0).
    const v1 = (e1 + 0.65 * y) % 360, v2 = (e0 + 0.3 * x) % 360
    // Пока спрашиваем про угол — ярко только он и его дуга, остальное бледное.
    const focus1 = phase >= 12 && phase <= 14, focus2 = phase >= 17 && phase <= 19
    const dimArc1 = focus2, dimArc2 = focus1
    // Шаги: 0 круг → 1 «Поделим…» → 2 «Пусть одна дуга будет:» → 3 выбор → 4 дуга X → 5 пауза → 6 вопрос →
    // 7 вторая дуга + 360 → 8 варианты → 9 ответ, 360 гаснет → 10 пауза → 11 угол на дуге X → 12 вопрос → 13 варианты →
    // 14 ответ → 15 пауза → 16 второй угол → 17 вопрос → 18 варианты → 19 ответ → 20 сумма → 21 вывод.
    return (
        <>
            <DiagramBlock onSettled={next(1)}>
                <Svg>
                    <DrawCircle instant opacity={focus1 || focus2 ? DIM : 1} />
                    {phase >= 4 && (
                        <motion.path d={arcPath(e0, e1)} fill="none" stroke={ARC1_COLOR} strokeWidth={10} strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: dimArc1 ? DIM : 1 }} transition={{ pathLength: { duration: 0.9, ease: 'easeOut' }, opacity: { duration: 0.5 } }} />
                    )}
                    {phase >= 7 && (
                        <motion.path d={arcPath(e1, e0 + 360)} fill="none" stroke={ARC2_COLOR} strokeWidth={10} strokeLinecap="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: dimArc2 ? DIM : 1 }} transition={{ pathLength: { duration: 0.9, ease: 'easeOut' }, opacity: { duration: 0.5 } }} />
                    )}
                    {/* Подсказка: вся окружность 360° — крупно, бледно, пульсирует, пока ищем вторую дугу */}
                    {phase >= 7 && phase < 9 && (
                        <g className="animate-glow-pulse">
                            <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fill="#5C6B73" fontSize={64} fontWeight={900}
                                style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>360°</text>
                        </g>
                    )}
                    {phase >= 11 && <CorAngle v={v1} e0={e0} e1={e1} color={ARC1_COLOR} value={x / 2} show={phase >= 14} dim={focus2} />}
                    {phase >= 16 && <CorAngle v={v2} e0={e0} e1={e1} color={ARC2_COLOR} value={y / 2} show={phase >= 19} dim={focus1} />}
                    {phase >= 4 && <motion.g initial={false} animate={{ opacity: dimArc1 ? DIM : 1 }}><SvgPop x={arc1Label.x} y={arc1Label.y} size={24} color={ARC1_COLOR}>{`${x}°`}</SvgPop></motion.g>}
                    {phase >= 7 && <motion.g initial={false} animate={{ opacity: dimArc2 ? DIM : 1 }}><SvgPop key={`a2-${phase >= 9}`} x={arc2Label.x} y={arc2Label.y} size={24} color={phase >= 9 ? ARC2_COLOR : ASK_COLOR}>{phase >= 9 ? `${y}°` : '?'}</SvgPop></motion.g>}
                    {phase >= 4 && <><circle cx={pt(e0).x} cy={pt(e0).y} r={5} fill={LINE} /><circle cx={pt(e1).x} cy={pt(e1).y} r={5} fill={LINE} /></>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && phase < 4 && <RememberPlate title="СЛЕДСТВИЕ!" />}
            {phase >= 1 && phase < 4 && <TypedBig small text="Поделим окружность на 2 дуги" onDone={next(2)} readMs={400} />}
            {phase >= 2 && phase < 4 && <TypedBig small text="Пусть одна дуга будет:" onDone={next(3)} readMs={200} />}
            {phase === 3 && <ChoiceRow options={[100, 200, 280]} onDone={(v) => { setX(v); setPhase(4) }} />}
            {phase === 4 && <PauseThen ms={2000} onDone={next(6)} />}
            {phase >= 6 && phase < 10 && <TypedBig small text="Тогда чему равна другая дуга?" onDone={next(7)} readMs={200} />}
            {phase === 7 && <PauseThen ms={1000} onDone={next(8)} />}
            {phase === 8 && <ChoiceRow options={pickOptions(y, [x, 180, y / 2])} correct={y} hint="Вся окружность = 360° 🙃" onDone={() => setPhase(9)} />}
            {phase === 9 && <PauseThen ms={2000} onDone={next(11)} />}
            {phase >= 11 && phase < 15 && <PauseThen ms={1300} onDone={next(12)} />}
            {phase >= 12 && phase < 15 && <TypedBig small text="Чему равен этот вписанный угол?" onDone={next(13)} readMs={200} />}
            {phase === 13 && <ChoiceRow options={pickOptions(x / 2, [x, y / 2, x / 4, 90])} correct={x / 2} hint="Вписанный = половине дуги, на которую опирается 🙃" onDone={() => setPhase(14)} />}
            {phase === 14 && <PauseThen ms={2000} onDone={next(16)} />}
            {phase >= 16 && phase < 20 && <PauseThen ms={1300} onDone={next(17)} />}
            {phase >= 17 && phase < 20 && <TypedBig small text="А чему равен этот вписанный угол?" onDone={next(18)} readMs={200} />}
            {phase === 18 && <ChoiceRow options={pickOptions(y / 2, [y, x / 2, 90, y / 4])} correct={y / 2} hint="Он опирается на другую дугу: половина от неё 🙃" onDone={() => setPhase(19)} />}
            {phase === 19 && <PauseThen ms={1500} onDone={next(20)} />}
            {phase >= 20 && (
                <div className="w-full flex justify-center text-3xl md:text-4xl font-black">
                    <Pop>
                        <span style={{ color: ARC1_COLOR }}>{x / 2}°</span>&nbsp;+&nbsp;<span style={{ color: ARC2_COLOR }}>{y / 2}°</span>&nbsp;=&nbsp;<span style={{ color: OK_COLOR }}>180°</span>
                    </Pop>
                </div>
            )}
            {phase >= 20 && <PauseThen ms={1500} onDone={next(21)} />}
            {phase >= 21 && (
                <motion.div className="w-full rounded-2xl border-2 px-4 py-3 text-center font-black text-lg md:text-xl text-[#F2F7FB]"
                    style={{ borderColor: '#F2C35B', backgroundColor: hexToRgba('#F2C35B', 0.1) }}
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 13 }}>
                    Во вписанном четырёхугольнике сумма противоположных углов = 180°
                </motion.div>
            )}
            {phase >= 21 && <PauseThen ms={1200} onDone={() => onSettled?.()} />}
        </>
    )
}

const SCENES = [FullCircleScene, CentralScene, InscribedScene]
// Подписи общей кнопки «Дальше» по сценам (без рандома — по просьбе пользователя).
const NEXT_LABELS = ['Ну а четверть = 90°', 'Пока изи, все понятно', 'Изи - вписанный в 2 раза меньше']

export const TypeCircleWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    // С какой сцены рисуем лог: при админском прыжке прошлые сцены не проигрываем заново.
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice' | 'corollary'>('intro')
    const [corReady, setCorReady] = useState(false)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [qIdx, setQIdx] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    // Один общий рисунок на всю тренировку: дуга плавно меняется между заданиями.
    const [figArc, setFigArc] = useState(TRIALS[0].arc)
    const [targetIdx, setTargetIdx] = useState(0)
    const [labelsOn, setLabelsOn] = useState(true)
    // Пауза 2 с между вопросами одного задания (5/6, 6/6): ответ уже стоит на рисунке, следующий вопрос ещё не задан.
    const [stepPause, setStepPause] = useState(false)
    // Смена рисунка (центральный ↔ вписанный): старый гаснет целиком, новый проявляется. combo — вставка перед 5/6.
    const [figHidden, setFigHidden] = useState(false)
    const [combo, setCombo] = useState(false)
    // Правило: сначала рисунок полностью появился → потом печатается вопрос → потом падают варианты.
    const [qShow, setQShow] = useState(false)
    const [qTyped, setQTyped] = useState(false)
    const moving = targetIdx !== trialIndex
    useEffect(() => {
        setQShow(false); setQTyped(false)
        if (phase !== 'practice' || moving || combo || stepPause || checked) return
        const t = setTimeout(() => setQShow(true), 900)
        return () => clearTimeout(t)
    }, [phase, trialIndex, qIdx, moving, combo, stepPause, checked])
    const registerCombo = useWalkthroughCombo()
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : phase === 'practice' ? 'practice' : 'corollary'
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, phase === 'intro' ? stepReady : phase === 'practice' ? checked : corReady)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (step + 1 >= SCENES.length) { setPhase('practice'); return }
            setStep((s) => s + 1)
            setStepReady(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        bumpNonce(`step-${step - 1}`)
        setStep(step - 1)
        setStepReady(false)
    }

    const trial = TRIALS[trialIndex]
    const answer = (v: number) => {
        if (checked || wrongTried.includes(v)) return
        const cur = trial.steps[qIdx]
        if (v === valueOf(trial, cur.key)) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongTried([]); setWrongFlash(null)
            if (qIdx + 1 < trial.steps.length) {
                setStepPause(true)
                setTimeout(() => { setQIdx((q) => q + 1); setStepPause(false) }, 2000)
            } else { setChecked(true); setTrialNextLabel(pickFunNextLabel()) }
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, v])
            setWrongFlash(`${pickWrongTryPhrase()} ${cur.hint}`)
        }
    }
    const nextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (trialIndex + 1 >= TRIALS.length) { setPhase('corollary'); return }
            const to = trialIndex + 1
            const from = TRIALS[trialIndex], target = TRIALS[to]
            const finish = () => {
                setTrialIndex(to); setQIdx(0); setChecked(false); setWrongTried([]); setWrongFlash(null)
                setLabelsOn(true); setFigHidden(false)
            }
            setLabelsOn(false)
            setTargetIdx(to)
            const sameFigure = from.central === target.central && from.inscribed === target.inscribed
            if (sameFigure && to !== COMBO_BEFORE) {
                // Тот же рисунок: цифры гаснут → дуга и угол плавно меняются → новый вопрос.
                setTimeout(() => tween(from.arc, target.arc, 1100, setFigArc, finish), 350)
                return
            }
            // Другой рисунок: старый гаснет целиком, потом (перед 5/6 — после вставки «К-К-КОМБО!») проявляется новый.
            setFigHidden(true)
            setTimeout(() => {
                setFigArc(target.arc)
                if (to === COMBO_BEFORE) setCombo(true)
                else setTimeout(finish, 150)
            }, 650)
        }, 300)
    }

    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setWrongTried([]); setWrongFlash(null); setStepPause(false); setCombo(false); setFigHidden(false); setLabelsOn(true)
        if (key.startsWith('step-')) {
            const i = Number(key.slice(5))
            bumpNonce(key)
            setPhase('intro'); setStartStep(i); setStep(i); setStepReady(false)
            return
        }
        setStartStep(SCENES.length); setStep(SCENES.length - 1)
        if (key === 'corollary') {
            const last = TRIALS.length - 1
            setTrialIndex(last); setTargetIdx(last); setFigArc(TRIALS[last].arc); setQIdx(TRIALS[last].steps.length - 1); setChecked(true)
            setCorReady(false); setPhase('corollary')
            return
        }
        const k = Number(key.slice(6))
        setTrialIndex(k); setTargetIdx(k); setFigArc(TRIALS[k].arc); setQIdx(0); setPhase('practice')
    }
    const mapEntries: AdminMapEntry[] = [
        ...['360 → 180 → 90', 'Центральный угол', 'Вписанный угол'].map((label, i) => ({
            dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR,
        })),
        ...TRIALS.map((t, i) => ({
            dotKey: `t${i}`, label: `Задание ${i + 1}/${TRIALS.length}`, jumpKey: `trial-${i}`, isActive: phase === 'practice' && trialIndex === i, color: MAP_PRACTICE_COLOR,
        })),
        { dotKey: 'cor', label: 'Следствие: четырёхугольник', jumpKey: 'corollary', isActive: phase === 'corollary', color: MAP_INTRO_COLOR },
    ]

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <Scene onSettled={() => i === step && setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}

                {phase !== 'intro' && (() => {
                    const t = TRIALS[trialIndex]
                    const target = TRIALS[targetIdx]
                    const cur = t.steps[qIdx]
                    return (
                        <SceneWrapper key="practice" innerRef={sceneRef('practice')} active={isActive('practice')}>
                            <div className="w-full flex items-center gap-3" aria-hidden>
                                <div className="flex-1 h-px bg-[#3A464E]" />
                                <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                                <div className="flex-1 h-px bg-[#3A464E]" />
                            </div>
                            <div className="relative w-full flex items-center justify-center min-h-9">
                                <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                    style={{ borderColor: hexToRgba(PART_COLOR, 0.55), backgroundColor: hexToRgba(PART_COLOR, 0.16), color: PART_COLOR }}>
                                    <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                                </motion.div>
                                <p className="text-base md:text-lg font-bold text-[#F2F7FB] text-center px-16 min-h-[1.75rem]">
                                    {checked ? 'Готово ✅' : qShow && !moving
                                        ? <Typewriter key={`q-${trialIndex}-${qIdx}`} text={ASK_TEXT[cur.key]} onDone={() => setQTyped(true)} />
                                        : '\u00a0'}
                                </p>
                            </div>
                            {combo ? (
                                <ComboInterlude onDone={() => {
                                    setCombo(false)
                                    setTrialIndex(targetIdx); setQIdx(0); setChecked(false); setWrongTried([]); setWrongFlash(null)
                                    setLabelsOn(true); setFigHidden(false)
                                }} />
                            ) : (
                                <motion.div className="w-full" initial={false} animate={{ opacity: figHidden ? 0 : 1, scale: figHidden ? 0.92 : 1 }} transition={{ duration: 0.5 }}>
                                    <TrialFigure key={trialIndex} t={t} labels={labelsFor(t, qIdx, checked || stepPause)} arc={figArc}
                                        central={opacityOf(moving && !figHidden ? target : t, 'central', moving || checked ? null : t.steps[qIdx])}
                                        inscribed={opacityOf(moving && !figHidden ? target : t, 'inscribed', moving || checked ? null : t.steps[qIdx])} labelsOn={labelsOn} />
                                </motion.div>
                            )}
                            {!checked && !moving && !stepPause && qTyped && (
                                <div key={`opts-${trialIndex}-${qIdx}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                    {cur.options.map((v) => {
                                        const isWrong = wrongTried.includes(v)
                                        return (
                                            <button key={v} type="button" disabled={isWrong} onClick={() => answer(v)}
                                                className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors',
                                                    isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                                {v}°
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            {!checked && !moving && !stepPause && wrongFlash && (
                                <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{wrongFlash}</div>
                            )}
                            {checked && !moving && (
                                <FieryFeedbackBanner>
                                    {pickPraise(trialIndex)}
                                </FieryFeedbackBanner>
                            )}
                            {checked && !moving && <LocalAnswerConfetti />}
                        </SceneWrapper>
                    )
                })()}
                {phase === 'corollary' && (
                    <SceneWrapper key="corollary" innerRef={sceneRef('corollary')} active={isActive('corollary')}>
                        <CorollaryScene onSettled={() => setCorReady(true)} />
                    </SceneWrapper>
                )}
            </div>
            {phase === 'corollary' && (
                <div className="w-full flex">
                    <button type="button" disabled={!corReady} onClick={() => { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right') }}
                        className={walkthroughButtonClass(corReady)} style={walkthroughButtonStyle(corReady)}>
                        Сумма = 180°, понял!
                    </button>
                </div>
            )}
            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {NEXT_LABELS[step]}
                    </button>
                </div>
            ) : phase === 'practice' && checked && targetIdx === trialIndex ? (
                <div className="w-full flex">
                    <button type="button" onClick={nextTrial} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
