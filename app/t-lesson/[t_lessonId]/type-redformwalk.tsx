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
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickFunNextLabel,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

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
const PLUS_COLOR = '#A1D151'
const HOUSE_STICKER = '/lesson-pics/house-sticker.webp'
const PI = Math.PI

// ===== Крупный печатаемый текст (части: цвет / стикер) =====
type BigPart = { text: string; color?: string; sticker?: boolean }
const TypedBig = ({ parts, onDone, readMs = 500 }: { parts: BigPart[]; onDone?: () => void; readMs?: number }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-center text-2xl md:text-3xl font-black text-[#F2F7FB]">
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

// Овал-маркер, «рисуемый» вокруг куска формулы (SVG растягивается по размеру обёртки).
const Marked = ({ children, color, active, delay = 0 }: { children: React.ReactNode; color: string; active: boolean; delay?: number }) => (
    <span className="relative inline-block px-1">
        {children}
        <svg className="pointer-events-none absolute left-[-6px] top-[-8px] w-[calc(100%+12px)] h-[calc(100%+16px)] overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
            <motion.ellipse
                cx={50} cy={20} rx={49} ry={19} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.7, delay, ease: 'easeInOut' }}
            />
        </svg>
    </span>
)

const Formula = ({ markPi = false, markX = false, markSin = false, className = 'text-5xl md:text-6xl' }: { markPi?: boolean; markX?: boolean; markSin?: boolean; className?: string }) => (
    <motion.div
        initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className={`w-full flex items-center justify-center font-black text-[#F2F7FB] py-3 ${className}`}
    >
        <Marked color={SIN_COLOR} active={markSin}><span style={{ color: SIN_COLOR }}>sin</span></Marked>
        <span>(</span>
        <Marked color={STEP_COLOR} active={markX}><span style={{ color: STEP_COLOR }}>x</span></Marked>
        <span className="mx-1">+</span>
        <Marked color={PI_COLOR} active={markPi}><span style={{ color: PI_COLOR }}><Frac num="π" den="2" /></span></Marked>
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

// 0. Что такое формула приведения.
const FormulaScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setPhase(1), 900)
        return () => clearTimeout(t)
    }, [])
    return (
        <>
            <Formula markPi={phase >= 2} />
            {phase >= 1 && (
                <TypedBig parts={[{ text: 'Это и есть ' }, { text: 'формула приведения', color: PI_COLOR }]} onDone={() => setPhase(2)} readMs={900} />
            )}
            {phase >= 2 && (
                <TypedBig
                    parts={[{ text: 'Именно такой кусочек с ' }, { text: 'π/2', color: PI_COLOR, sticker: true }, { text: ' и есть формула приведения' }]}
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

const SCENES = [FormulaScene, WhereScene, StepScene, SignScene]

export const TypeRedFormWalk = ({ onAnswer, onComplete }: Props) => {
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    useEffect(() => { setNextLabel(pickFunNextLabel()) }, [step])

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `step-${step}`
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, stepReady)
    const isLast = step + 1 >= SCENES.length

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (isLast) {
                onComplete(true)
                onAnswer('right')
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => {
        bumpNonce(latestSceneKey)
        setStepReady(false)
    }
    const handleBack = () => {
        if (advancing || step === 0) return
        bumpNonce(`step-${step - 1}`)
        setStep(step - 1)
        setStepReady(false)
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
            </div>
            <div className="w-full flex items-center gap-2">
                <ReplayButton onClick={handleReplay} disabled={advancing} />
                <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                <button type="button" onClick={handleNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                    {isLast ? 'Готово' : nextLabel}
                </button>
            </div>
        </div>
    )
}
