'use client'

// Планиметрия → «Треугольники» → «Окружности» (CIRCLEWALK). Пошаговый разбор без квиза:
//   1. Окружность = 360°, половина = 180°, четверть = 90° (на одной и той же окружности).
//   2. Центральный угол: два радиуса, угол, 60° → его дуга тоже 60°; угол «тянется» до 100° и сжимается до 40°.
//   3. Вписанный угол: две хорды из одной точки окружности.
// Окружность рисуем ПРОТИВ часовой от точки справа (правило проекта). Углы — синие (роль «угол»).

import { Fragment, useEffect, useRef, useState } from 'react'
import { animate, motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
} from '@/components/geometry/WalkthroughLog'
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

// ===== Сцена 1: 360 → 180 → 90 =====
// Окружность из трёх кусков (0–90, 90–180, 180–360): поверх тонкой белой — жирная цветная дуга того, о чём говорим.
// 360°: жирная вся окружность; 180°: нижняя половина бледнеет; 90°: бледнеет и верхняя левая четверть.
const FullCircleScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    const lowerOp = phase >= 2 ? DIM : 1
    const q2Op = phase >= 3 ? DIM : 1
    const segs: { a0: number; a1: number; op: number; delay: number; dur: number }[] = [
        { a0: 0, a1: 90, op: 1, delay: 0, dur: 0.3 },
        { a0: 90, a1: 180, op: q2Op, delay: 0.3, dur: 0.3 },
        { a0: 180, a1: 359.99, op: lowerOp, delay: 0.6, dur: 0.6 },
    ]
    const q1Label = pt(45, R + 34)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 900)}>
                <Svg>
                    {/* Тонкая белая окружность рисуется один раз; потом заменяется тремя кусками, которые бледнеют вместе с жирными. */}
                    {phase < 1 ? <DrawCircle /> : segs.map((s) => (
                        <motion.path key={`w${s.a0}`} d={arcPath(s.a0, s.a1)} fill="none" stroke={LINE} strokeWidth={4} strokeLinecap="round"
                            initial={{ opacity: 1 }} animate={{ opacity: s.op }} transition={{ duration: 0.7 }} />
                    ))}
                    {phase >= 1 && segs.map((s) => (
                        <motion.path key={s.a0} d={arcPath(s.a0, s.a1)} fill="none" stroke={PART_COLOR} strokeWidth={9} strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: s.op }}
                            transition={{ pathLength: { duration: s.dur, delay: s.delay, ease: 'linear' }, opacity: { duration: 0.7 } }} />
                    ))}
                    <SvgPop x={CX} y={CY} size={46} show={phase >= 1 && phase < 2}>360°</SvgPop>
                    <SvgPop x={CX} y={CY - 40} size={46} show={phase >= 2}>180°</SvgPop>
                    {phase >= 3 && <SvgPop x={q1Label.x} y={q1Label.y} size={34} color={PART_COLOR}>90°</SvgPop>}
                </Svg>
            </DiagramBlock>
            {phase === 1 && <PauseThen ms={1300} onDone={next(1.5)} />}
            {phase === 1.5 && <ReplyButton onClick={() => setPhase(2)}>Вся окружность = 360°</ReplyButton>}
            {phase === 2 && <PauseThen ms={900} onDone={next(2.5)} />}
            {phase === 2.5 && <ReplyButton onClick={() => setPhase(3)}>Половина окружности = 180°</ReplyButton>}
            {phase >= 3 && <PauseThen ms={1200} onDone={() => onSettled?.()} />}
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
            animate(ref.current, to, {
                duration: 1.3, ease: 'easeInOut', onUpdate: (v) => setValue(v),
                onComplete: () => { setValue(to); setShown(to); setNumsOn(true); resolve() },
            })
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

const SCENES = [FullCircleScene, CentralScene, InscribedScene]
// Подписи общей кнопки «Дальше» по сценам (без рандома — по просьбе пользователя).
const NEXT_LABELS = ['Ну а четверть = 90°', 'Пока изи, все понятно', 'Изи, вписанный тоже понятен']

export const TypeCircleWalk = ({ onAnswer, onComplete }: Props) => {
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `step-${step}`
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, stepReady)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (step + 1 >= SCENES.length) {
                onComplete(true)
                onAnswer('right')
                return
            }
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
            </div>
            <div className="w-full flex items-center gap-2">
                <ReplayButton onClick={handleReplay} disabled={advancing} />
                <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                    className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                    {NEXT_LABELS[step]}
                </button>
            </div>
        </div>
    )
}
