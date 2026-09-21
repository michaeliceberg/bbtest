// app/t-lesson/[t_lessonId]/type-faradaywalk.tsx
//
// Тип FARADAYWALK — интерактивная песочница "магнит + замкнутое кольцо":
// ученик САМ двигает магнит и видит, как меняются B и поток Φ = B·S,
// как в кольце возникает ток (лампочка, бегущая по кольцу "рябь") и как
// рисуются графики Φ(t) и I(t). Закон Фарадея: ε = −ΔΦ/Δt.
//
// Цепочка мини-целей (каждая открывает "Дальше"):
// 0. Поднеси магнит близко — растут B и Φ.
// 1. Замри — большой, но ПОСТОЯННЫЙ поток даёт нулевой ток.
// 2. Двигай — лампочка загорается, пока поток меняется.
// 3. Медленно и быстро — чем быстрее меняется поток, тем больше ток.
// 4. Итог: формула закона Фарадея.
// Затем 4 вопроса-проверки (пробуй, пока не угадаешь).
//
// Физика условная: Φn = 1/(1+4d)^1.5 (d — нормированное расстояние магнита
// до кольца), I ∝ −dΦ/dt (сглаживается EMA). Симуляция крутится на
// setInterval (не rAF) — не замирает в фоновых вкладках.

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import { Check } from 'lucide-react'
import type { QuestionType } from './page'
import {
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR, WRONG_COLOR, ACTIVE_COLOR,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const FLUX_COLOR = GGEGE_PALETTE.purple.button
const CURRENT_COLOR = GGEGE_PALETTE.orange.button
const CURRENT_COLOR_REV = GGEGE_PALETTE.teal.button

// Геометрия сцены (viewBox 0 0 200 250).
const SCENE_H = 250
const MAG_W = 34
const MAG_H = 56
const TOP_MIN = 6
const TOP_MAX = 118
const RING_CY = 176
const RING_RX = 64
const RING_RY = 11

const HISTORY = 150 // ~5 c при 30 Гц
const TICK_MS = 33
const B_MAX_MT = 50
const PHI_MAX_MKWB = 100

const phiOf = (d: number) => 1 / Math.pow(1 + 4 * d, 1.5)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

type Goals = { g0: boolean; g1: boolean; g2: boolean; slow: boolean; fast: boolean }
const NO_GOALS: Goals = { g0: false, g1: false, g2: false, slow: false, fast: false }

// ===== Песочница =====

const Sandbox = ({ stage, onGoals }: { stage: number; onGoals: (g: Goals) => void }) => {
    const topRef = useRef(TOP_MAX - 40)
    const draggingRef = useRef(false)
    const grabRef = useRef(0)
    const svgRef = useRef<SVGSVGElement>(null)
    const prevPhiRef = useRef<number | null>(null)
    const prevTimeRef = useRef(0)
    const curRef = useRef(0)
    const phaseRef = useRef(0)
    const phiHist = useRef<number[]>(Array(HISTORY).fill(0))
    const curHist = useRef<number[]>(Array(HISTORY).fill(0))
    const goalsRef = useRef<Goals>({ ...NO_GOALS })
    const stillRef = useRef(0)
    const slowRef = useRef(0)
    const stageRef = useRef(stage)
    const [, setTick] = useState(0)
    const [touched, setTouched] = useState(false)

    useEffect(() => { stageRef.current = stage }, [stage])

    useEffect(() => {
        prevTimeRef.current = performance.now()
        const id = setInterval(() => {
            const now = performance.now()
            const dt = Math.max(0.001, (now - prevTimeRef.current) / 1000)
            prevTimeRef.current = now
            const d = clamp((TOP_MAX - topRef.current) / (TOP_MAX - TOP_MIN), 0, 1)
            const phi = phiOf(d)
            const rate = prevPhiRef.current == null ? 0 : (phi - prevPhiRef.current) / dt
            prevPhiRef.current = phi
            // ЭДС ~ −dΦ/dt: знак условный (сближение — один ход тока, удаление — обратный).
            const target = clamp(-rate / 3, -1, 1)
            curRef.current = curRef.current * 0.55 + target * 0.45
            if (Math.abs(curRef.current) < 0.01) curRef.current = 0
            const I = curRef.current
            phaseRef.current += I * 40 * dt * 8

            phiHist.current.push(phi); phiHist.current.shift()
            curHist.current.push(I); curHist.current.shift()

            // Цели — считаются только на своём этапе.
            const g = goalsRef.current
            const s = stageRef.current
            let changed = false
            const set = (k: keyof Goals) => { if (!g[k]) { g[k] = true; changed = true } }
            if (s === 0 && phi > 0.6) set('g0')
            if (s === 1) {
                if (phi > 0.5 && Math.abs(I) < 0.04) stillRef.current += dt; else stillRef.current = 0
                if (stillRef.current >= 1.5) set('g1')
            }
            if (s === 2 && Math.abs(I) > 0.3) set('g2')
            if (s === 3) {
                if (Math.abs(I) > 0.03 && Math.abs(I) < 0.35) slowRef.current += dt; else slowRef.current = 0
                if (slowRef.current >= 0.5) set('slow')
                if (Math.abs(I) > 0.5) set('fast')
            }
            if (changed) onGoals({ ...g })
            setTick((t) => t + 1)
        }, TICK_MS)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const toSvgY = (clientY: number) => {
        const r = svgRef.current!.getBoundingClientRect()
        return (clientY - r.top) * (SCENE_H / r.height)
    }
    const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
        const y = toSvgY(e.clientY)
        // хватаем магнит, только если попали в него (с запасом)
        if (y < topRef.current - 14 || y > topRef.current + MAG_H + 14) return
        draggingRef.current = true
        grabRef.current = y - topRef.current
        try { svgRef.current!.setPointerCapture(e.pointerId) } catch { /* синтетические события */ }
        setTouched(true)
    }
    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current) return
        topRef.current = clamp(toSvgY(e.clientY) - grabRef.current, TOP_MIN, TOP_MAX)
    }
    const onUp = () => { draggingRef.current = false }

    const top = topRef.current
    const d = clamp((TOP_MAX - top) / (TOP_MAX - TOP_MIN), 0, 1)
    const phi = phiOf(d)
    const I = curRef.current
    const absI = Math.abs(I)
    const curColor = I >= 0 ? CURRENT_COLOR : CURRENT_COLOR_REV
    const magBottom = top + MAG_H
    const bMt = phi * B_MAX_MT
    const phiMk = phi * PHI_MAX_MKWB

    const chartPath = (arr: number[], w: number, h: number, lo: number, hi: number) =>
        arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (HISTORY - 1)) * w).toFixed(1)},${(h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`).join(' ')

    // Силовые линии: 5 штук, прозрачность ~ B.
    const lines = [-24, -12, 0, 12, 24]
    const showThrough = magBottom < RING_CY - 4

    return (
        <div className="w-full rounded-2xl border-2 border-[#3A464E] bg-[#161F23] p-2">
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-bold text-[#9AA7B0]">
                <span>B = <span className="text-white">{bMt.toFixed(0)} мТ</span></span>
                <span>Φ = B·S = <span style={{ color: FLUX_COLOR }}>{phiMk.toFixed(0)} мкВб</span></span>
                <span>S = const</span>
            </div>
            <div className="flex items-stretch gap-2">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 200 ${SCENE_H}`}
                    className="w-[44%] shrink-0 select-none"
                    style={{ touchAction: 'none' }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                >
                    {/* силовые линии от магнита к кольцу */}
                    {showThrough && lines.map((dx, i) => (
                        <g key={i} opacity={0.12 + 0.88 * phi}>
                            <line x1={100 + dx * 0.6} y1={magBottom} x2={100 + dx} y2={RING_CY + 22}
                                stroke={FLUX_COLOR} strokeWidth={1.6} strokeDasharray="4 4" />
                            <path d={`M${100 + dx - 4},${RING_CY + 12} L${100 + dx},${RING_CY + 22} L${100 + dx + 4},${RING_CY + 12}`}
                                fill="none" stroke={FLUX_COLOR} strokeWidth={1.6} />
                        </g>
                    ))}

                    {/* кольцо */}
                    <ellipse cx={100} cy={RING_CY} rx={RING_RX} ry={RING_RY} fill="none" stroke="#4A5760" strokeWidth={5} />
                    {absI > 0.02 && (
                        <>
                            <ellipse cx={100} cy={RING_CY} rx={RING_RX} ry={RING_RY} fill="none"
                                stroke={curColor} strokeWidth={4 + 8 * absI} opacity={0.15 + 0.3 * absI} />
                            <ellipse cx={100} cy={RING_CY} rx={RING_RX} ry={RING_RY} fill="none"
                                stroke={curColor} strokeWidth={3 + 3 * absI} strokeLinecap="round"
                                strokeDasharray="14 14" strokeDashoffset={phaseRef.current}
                                opacity={Math.min(1, 0.4 + absI * 2)} />
                        </>
                    )}

                    {/* провод + лампочка */}
                    <line x1={100} y1={RING_CY + RING_RY} x2={100} y2={218} stroke="#4A5760" strokeWidth={3} />
                    <circle cx={100} cy={232} r={10 + 10 * absI} fill={CURRENT_COLOR} opacity={Math.min(0.5, absI * 0.6)} />
                    <circle cx={100} cy={232} r={11} fill={absI > 0.08 ? '#FFE9A8' : '#2A343A'}
                        stroke={absI > 0.08 ? CURRENT_COLOR : '#4A5760'} strokeWidth={3}
                        opacity={absI > 0.08 ? 0.5 + 0.5 * Math.min(1, absI * 1.6) : 1} />

                    {/* магнит: S сверху (синий), N снизу (красный) */}
                    <g style={{ cursor: 'grab' }}>
                        <rect x={100 - MAG_W / 2} y={top} width={MAG_W} height={MAG_H / 2} rx={5} fill="#4A90D9" />
                        <rect x={100 - MAG_W / 2} y={top + MAG_H / 2} width={MAG_W} height={MAG_H / 2} rx={5} fill="#DC605B" />
                        <text x={100} y={top + 19} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">S</text>
                        <text x={100} y={top + MAG_H - 9} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">N</text>
                    </g>
                    {!touched && (
                        <text x={100 + MAG_W / 2 + 8} y={top + MAG_H / 2 + 4} fontSize={13} fontWeight={800} fill="#F2F7FB">↕ тяни</text>
                    )}
                </svg>

                <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="rounded-xl bg-[#0F171A] p-1">
                        <div className="px-1 text-[11px] font-bold" style={{ color: FLUX_COLOR }}>Φ(t) — поток</div>
                        <svg viewBox="0 0 180 80" className="w-full">
                            <line x1={0} y1={79} x2={180} y2={79} stroke="#3A464E" />
                            <path d={chartPath(phiHist.current, 180, 76, 0, 1)} fill="none" stroke={FLUX_COLOR} strokeWidth={2.2} strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="rounded-xl bg-[#0F171A] p-1">
                        <div className="px-1 text-[11px] font-bold" style={{ color: curColor }}>I(t) — ток в кольце</div>
                        <svg viewBox="0 0 180 80" className="w-full">
                            <line x1={0} y1={40} x2={180} y2={40} stroke="#3A464E" strokeDasharray="3 3" />
                            <path d={chartPath(curHist.current, 180, 76, -1, 1)} fill="none" stroke={CURRENT_COLOR} strokeWidth={2.2} strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ===== Проверочные вопросы =====

type QuizQ = { q: string; options: string[]; correct: number; explain: string }
const QUIZ: QuizQ[] = [
    {
        q: 'Магнит неподвижно лежит на кольце. Есть ли ток в кольце?',
        options: ['Нет — поток не меняется', 'Да — поток же большой', 'Да, но слабый', 'Зависит от цвета магнита'],
        correct: 0,
        explain: 'ΔΦ = 0, значит ε = 0. Ток создаёт только изменение потока.',
    },
    {
        q: 'Магнит подвинули к кольцу за 1 с и за 0,1 с. Когда ЭДС больше?',
        options: ['За 1 с', 'За 0,1 с', 'Одинаково — поток изменился на столько же', 'В обоих случаях ЭДС = 0'],
        correct: 1,
        explain: 'ΔΦ одинаковое, а Δt меньше — значит ε = ΔΦ/Δt больше.',
    },
    {
        q: 'Поток через контур вырос с 2 Вб до 8 Вб за 3 с. Чему равна ЭДС индукции (по модулю)?',
        options: ['2 В', '6 В', '3 В', '0,5 В'],
        correct: 0,
        explain: 'ε = ΔΦ/Δt = (8 − 2)/3 = 2 В.',
    },
    {
        q: 'На графике Φ(t) — горизонтальная прямая. Что с ЭДС индукции?',
        options: ['Максимальна', 'Равна Φ', 'Равна нулю — поток не меняется', 'Постоянна и не равна нулю'],
        correct: 2,
        explain: 'Горизонтальный график — ΔΦ = 0, а значит и ε = 0.',
    },
]

const QuizPart = ({ onFinish }: { onFinish: (hadMistake: boolean) => void }) => {
    const [i, setI] = useState(0)
    // Порядок вариантов — свой на каждый вопрос, фиксируется на монтирование.
    const orders = useMemo(() => QUIZ.map((qq) => shuffle(qq.options.map((_, k) => k))), [])
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    const qq = QUIZ[i]
    const isLast = i === QUIZ.length - 1

    const pickOpt = (k: number) => {
        if (done || wrongTried.includes(k)) return
        if (k === qq.correct) {
            setDone(true); setFlash(null)
            setNextLabel(pickWalkthroughNextLabel(isLast ? 'Готово' : 'Дальше'))
        } else {
            setHadMistake(true)
            setWrongTried((w) => [...w, k])
            setFlash(pickWrongTryPhrase())
        }
    }
    const next = () => {
        if (isLast) { onFinish(hadMistake); return }
        setI(i + 1); setWrongTried([]); setFlash(null); setDone(false)
    }

    return (
        <div className="flex w-full flex-col gap-3">
            <div className="text-center text-xs font-bold text-[#9AA7B0]">Проверим себя · {i + 1}/{QUIZ.length}</div>
            <div className="rounded-2xl border-2 border-[#3A464E] bg-[#161F23] p-4 text-center text-lg font-bold text-white">{qq.q}</div>
            <div className="grid grid-cols-1 gap-2">
                {orders[i].map((k) => {
                    const isWrong = wrongTried.includes(k)
                    const isRight = done && k === qq.correct
                    return (
                        <button
                            key={k}
                            disabled={isWrong || done}
                            onClick={() => pickOpt(k)}
                            className={cn('rounded-xl border-2 px-3 py-3 text-left font-bold transition-colors',
                                isRight ? 'text-[#A1D151]' : isWrong ? 'text-[#DC605B]' : 'text-white')}
                            style={{
                                borderColor: isRight ? CORRECT_COLOR : isWrong ? WRONG_COLOR : '#3A464E',
                                background: isRight ? `${CORRECT_COLOR}22` : isWrong ? `${WRONG_COLOR}22` : '#161F23',
                            }}
                        >
                            {qq.options[k]}
                        </button>
                    )
                })}
            </div>
            {flash && !done && (
                <div className="rounded-xl px-3 py-2 text-center text-sm font-bold" style={{ background: `${WRONG_COLOR}22`, color: WRONG_COLOR }}>{flash}</div>
            )}
            {done && (
                <>
                    <LocalAnswerConfetti />
                    <FieryFeedbackBanner fiery={isFieryMilestoneTrial(i)}>
                        <div className="text-center">
                            <div className="font-extrabold" style={{ color: CORRECT_COLOR }}>
                                {CORRECT_FEEDBACK_PHRASES[Math.floor(Math.random() * CORRECT_FEEDBACK_PHRASES.length)]}
                            </div>
                            <div className="mt-1 text-sm text-[#F2F7FB]">{qq.explain}</div>
                        </div>
                    </FieryFeedbackBanner>
                    <button onClick={next} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{nextLabel}</button>
                </>
            )}
        </div>
    )
}

// ===== Основной компонент =====

const STAGE_TEXT: { title: string; hint: string; done: string }[] = [
    {
        title: 'Магнит и кольцо',
        hint: 'Потяни магнит вниз, к кольцу. Смотри: растут индукция B и магнитный поток Φ = B·S.',
        done: 'Ближе магнит — сильнее поле B, больше поток Φ через кольцо.',
    },
    {
        title: 'А теперь — замри!',
        hint: 'Держи магнит неподвижно возле кольца 1,5 секунды. Что с током?',
        done: 'Поток большой — а тока нет! Значит, ток создаёт не сам поток, а его изменение.',
    },
    {
        title: 'Зажги лампочку',
        hint: 'Двигай магнит вверх-вниз — лампочка под кольцом должна загореться.',
        done: 'Пока поток меняется — есть ток. Остановил магнит — ток пропал.',
    },
    {
        title: 'Медленно и быстро',
        hint: 'Подвигай магнит сначала плавно, потом резко. Сравни ток на графике.',
        done: 'Чем быстрее меняется поток, тем больше ток (и ЭДС).',
    },
]

export const TypeFaradayWalk = ({ onAnswer, onComplete }: Props) => {
    // stage 0..3 — песочница с целями, 4 — итог (закон Фарадея), 5 — проверка.
    const [stage, setStage] = useState(0)
    const [goals, setGoals] = useState<Goals>({ ...NO_GOALS })
    const finishedRef = useRef(false)

    const goalDone = stage === 0 ? goals.g0 : stage === 1 ? goals.g1 : stage === 2 ? goals.g2 : stage === 3 ? goals.slow && goals.fast : true
    const [label, setLabel] = useState('Дальше')
    useEffect(() => { setLabel(pickWalkthroughNextLabel('Дальше')) }, [stage])

    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    if (stage === 5) {
        return (
            <div className="mx-auto w-full max-w-md px-1 pb-8">
                <QuizPart onFinish={handleFinish} />
            </div>
        )
    }

    const t = stage < 4 ? STAGE_TEXT[stage] : null

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-1 pb-8">
            <Sandbox stage={stage} onGoals={setGoals} />

            {t && (
                <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                    <div className="text-center text-xl font-extrabold text-white">{t.title}</div>
                    <div className="text-center text-base text-[#D5DEE3]">{t.hint}</div>

                    {stage === 3 && (
                        <div className="flex justify-center gap-2 text-sm font-bold">
                            {[{ ok: goals.slow, label: 'плавно' }, { ok: goals.fast, label: 'резко' }].map((c) => (
                                <span key={c.label} className="flex items-center gap-1 rounded-lg border-2 px-2 py-1"
                                    style={{ borderColor: c.ok ? CORRECT_COLOR : '#3A464E', color: c.ok ? CORRECT_COLOR : '#9AA7B0' }}>
                                    {c.ok && <Check className="h-4 w-4" />}{c.label}
                                </span>
                            ))}
                        </div>
                    )}

                    {goalDone && (
                        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl border-2 px-3 py-2 text-center font-bold"
                            style={{ borderColor: CORRECT_COLOR, background: `${CORRECT_COLOR}1A`, color: '#E7F5C8' }}>
                            {t.done}
                        </motion.div>
                    )}
                </motion.div>
            )}

            {stage === 4 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                    <div className="text-center text-xl font-extrabold text-white">Закон Фарадея</div>
                    <div className="rounded-2xl border-2 p-4 text-center text-2xl" style={{ borderColor: ACTIVE_COLOR, background: `${ACTIVE_COLOR}14` }}>
                        <Latex>{'$\\varepsilon = -\\dfrac{\\Delta\\Phi}{\\Delta t}$'}</Latex>
                    </div>
                    <div className="text-center text-base text-[#D5DEE3]">
                        ЭДС индукции — это <b style={{ color: FLUX_COLOR }}>скорость изменения потока</b> Φ = B·S:
                        чем круче график Φ(t), тем больше ток. Горизонтальный участок — тока нет.
                        Поток меняют, двигая магнит (меняется B) или меняя площадь контура S.
                    </div>
                </motion.div>
            )}

            <button
                disabled={!goalDone}
                onClick={() => setStage(stage + 1)}
                className={walkthroughButtonClass(goalDone)}
                style={walkthroughButtonStyle(goalDone)}
            >
                {stage === 4 ? 'Проверим себя' : label}
            </button>
        </div>
    )
}
