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
} from '@/components/geometry/WalkthroughLog'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'

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
const TrialFigure = ({ t, labels, arc, central, inscribed, labelsOn }: { t: Trial; labels: Record<TKey, LabelState>; arc: number; central: boolean; inscribed: boolean; labelsOn: boolean }) => {
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
            <motion.g initial={false} animate={{ opacity: central ? 1 : 0 }} transition={{ duration: 0.5 }}>
                    <path d={sectorPath(a0, a1, 32)} fill={hexToRgba(ANGLE_COLOR, 0.3)} stroke={ANGLE_COLOR} strokeWidth={3} />
                    <line x1={CX} y1={CY} x2={A.x} y2={A.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <line x1={CX} y1={CY} x2={B.x} y2={B.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <circle cx={CX} cy={CY} r={5} fill={LINE} />
            </motion.g>
            <motion.g initial={false} animate={{ opacity: inscribed ? 1 : 0 }} transition={{ duration: 0.5 }}>
                <>
                    <path d={sectorPath(lo, hi, 38, P.x, P.y)} fill={hexToRgba(PART_COLOR, 0.3)} stroke={PART_COLOR} strokeWidth={3} />
                    <line x1={P.x} y1={P.y} x2={A.x} y2={A.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <line x1={P.x} y1={P.y} x2={B.x} y2={B.y} stroke={LINE} strokeWidth={4} strokeLinecap="round" />
                    <circle cx={P.x} cy={P.y} r={5} fill={LINE} />
                </>
            </motion.g>
            {labels.arc !== 'hidden' && <SvgPop key={`arc-${t.arc}-${labels.arc}`} x={CX} y={CY - R - 26} size={26} color={color('arc', ANGLE_COLOR)} show={labelsOn}>{text('arc')}</SvgPop>}
            {t.central && labels.central !== 'hidden' && <SvgPop key={`c-${t.arc}-${labels.central}`} x={centralLabel.x} y={centralLabel.y} size={22} color={color('central', LINE)} show={labelsOn}>{text('central')}</SvgPop>}
            {t.inscribed && labels.inscribed !== 'hidden' && <SvgPop key={`i-${t.arc}-${labels.inscribed}`} x={P.x} y={P.y - 62} size={22} color={color('inscribed', LINE)} show={labelsOn}>{text('inscribed')}</SvgPop>}
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
const pickPraise = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 2) % CORRECT_FEEDBACK_PHRASES.length]

const SCENES = [FullCircleScene, CentralScene, InscribedScene]
// Подписи общей кнопки «Дальше» по сценам (без рандома — по просьбе пользователя).
const NEXT_LABELS = ['Ну а четверть = 90°', 'Пока изи, все понятно', 'Изи - вписанный в 2 раза меньше']

export const TypeCircleWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
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
    const registerCombo = useWalkthroughCombo()
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : 'practice'
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, phase === 'intro' ? stepReady : checked)

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
            if (qIdx + 1 < trial.steps.length) setQIdx(qIdx + 1)
            else { setChecked(true); setTrialNextLabel(pickFunNextLabel()) }
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
            if (trialIndex + 1 >= TRIALS.length) {
                onComplete(!hadMistake)
                onAnswer(hadMistake ? 'wrong' : 'right')
                return
            }
            // Цифры гаснут → дуга и углы плавно перестраиваются под новое задание → появляется новый вопрос.
            const to = trialIndex + 1
            setLabelsOn(false)
            setTargetIdx(to)
            setTimeout(() => {
                tween(TRIALS[trialIndex].arc, TRIALS[to].arc, 1100, setFigArc, () => {
                    setTrialIndex(to); setQIdx(0); setChecked(false); setWrongTried([]); setWrongFlash(null)
                    setLabelsOn(true)
                })
            }, 350)
        }, 300)
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) => step >= i ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <Scene onSettled={() => i === step && setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}

                {phase === 'practice' && (() => {
                    const t = TRIALS[trialIndex]
                    const target = TRIALS[targetIdx]
                    const moving = targetIdx !== trialIndex
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
                                <motion.p key={`q-${trialIndex}-${qIdx}-${checked}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: moving ? 0 : 1, y: 0 }}
                                    className="text-base md:text-lg font-bold text-[#F2F7FB] text-center px-16">{checked ? 'Готово ✅' : ASK_TEXT[cur.key]}</motion.p>
                            </div>
                            <TrialFigure t={t} labels={labelsFor(t, qIdx, checked)} arc={figArc}
                                central={(moving ? target : t).central} inscribed={(moving ? target : t).inscribed} labelsOn={labelsOn} />
                            {!checked && !moving && (
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
                            {!checked && !moving && wrongFlash && (
                                <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{wrongFlash}</div>
                            )}
                            {checked && !moving && (
                                <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(OK_COLOR, 0.15), color: OK_COLOR }}>
                                    {pickPraise(trialIndex)}
                                </div>
                            )}
                            {checked && !moving && <LocalAnswerConfetti />}
                        </SceneWrapper>
                    )
                })()}
            </div>
            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {NEXT_LABELS[step]}
                    </button>
                </div>
            ) : checked && targetIdx === trialIndex ? (
                <div className="w-full flex">
                    <button type="button" onClick={nextTrial} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= TRIALS.length ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
