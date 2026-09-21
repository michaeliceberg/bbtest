// app/t-lesson/[t_lessonId]/type-faradaywalk.tsx
//
// Тип FARADAYWALK — пошаговая песочница "магнит + кольцо" (закон
// Фарадея). Модель упрощена: поток Φ линейно зависит от положения
// магнита p (Φ = p), поэтому график Φ(t) повторяет движение, а ток
// I ~ dΦ/dt — это "наклон" графика Φ(t).
//
// Этапы (по одной идее): 0 магнит стоит → I=0; 1 едет ровно → Φ прямая,
// I постоянен; 2 вдвое быстрее → I вдвое больше; 3 разгоняется → Φ парабола,
// I растёт линейно; 4 формула ε=−ΔΦ/Δt; 5 своя очередь (зажги лампочку);
// 6 вопросы. Этапы 0-3 — магнит едет сам по программе (кнопка "Запустить").
// Симуляция на setInterval (не rAF).

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

const HISTORY = 150 // окно ~5 c при 30 Гц (ручной режим)
const TICK_MS = 33
const B_MAX_MT = 50
const PHI_MAX_MKWB = 100

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)


// ===== Программы движения (этапы 0-3) =====

const V_REF = 0.4 // скорость p/с, при которой I = 1
type Profile = { T: number; p: (t: number) => number; v: (t: number) => number }
const PROFILES: Profile[] = [
    { T: 4, p: () => 0.5, v: () => 0 }, // стоит
    { T: 5, p: (t) => 0.1 + 0.15 * t, v: () => 0.15 }, // ровно
    { T: 6, p: (t) => (t < 3 ? 0.05 + 0.08 * t : 0.29 + 0.16 * (t - 3)), v: (t) => (t < 3 ? 0.08 : 0.16) }, // вдвое быстрее
    { T: 5, p: (t) => 0.05 + 0.03 * t * t, v: (t) => 0.06 * t }, // разгон
]

// ===== Песочница =====

type SandboxProps = {
    mode: 'auto' | 'manual'
    profile?: Profile
    runKey: number // смена запускает программу заново
    onFinish?: () => void
    onLamp?: () => void
}

const Sandbox = ({ mode, profile, runKey, onFinish, onLamp }: SandboxProps) => {
    const pRef = useRef(0.3) // положение магнита 0 (далеко) .. 1 (у кольца)
    const draggingRef = useRef(false)
    const grabRef = useRef(0)
    const svgRef = useRef<SVGSVGElement>(null)
    const prevPRef = useRef<number | null>(null)
    const prevTimeRef = useRef(0)
    const curRef = useRef(0)
    const phaseRef = useRef(0)
    const tRef = useRef(0)
    const runningRef = useRef(false)
    const phiHist = useRef<number[]>([])
    const curHist = useRef<number[]>([])
    const [, setTick] = useState(0)
    const [touched, setTouched] = useState(false)
    const modeRef = useRef(mode); modeRef.current = mode
    const profRef = useRef(profile); profRef.current = profile
    const cb = useRef({ onFinish, onLamp }); cb.current = { onFinish, onLamp }

    // Запуск программы (или сброс графиков в ручном режиме).
    useEffect(() => {
        phiHist.current = []; curHist.current = []; tRef.current = 0; curRef.current = 0; prevPRef.current = null
        if (mode === 'auto' && profile) {
            pRef.current = profile.p(0)
            runningRef.current = runKey > 0
        } else {
            runningRef.current = false
            if (mode === 'manual') pRef.current = 0.3
        }
        setTick((x) => x + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runKey, mode])

    useEffect(() => {
        prevTimeRef.current = performance.now()
        const id = setInterval(() => {
            const now = performance.now()
            const dt = Math.max(0.001, (now - prevTimeRef.current) / 1000)
            prevTimeRef.current = now
            if (modeRef.current === 'auto') {
                const pr = profRef.current
                if (!pr || !runningRef.current) return
                tRef.current = Math.min(pr.T, tRef.current + dt)
                pRef.current = pr.p(tRef.current)
                curRef.current = pr.v(tRef.current) / V_REF
                phiHist.current.push(pRef.current); curHist.current.push(curRef.current)
                phaseRef.current += curRef.current * 40 * dt * 8
                if (tRef.current >= pr.T) { runningRef.current = false; cb.current.onFinish?.() }
            } else {
                const p = pRef.current
                const rate = prevPRef.current == null ? 0 : (p - prevPRef.current) / dt
                prevPRef.current = p
                curRef.current = curRef.current * 0.55 + clamp(rate / V_REF, -1, 1) * 0.45
                if (Math.abs(curRef.current) < 0.01) curRef.current = 0
                phaseRef.current += curRef.current * 40 * dt * 8
                phiHist.current.push(p); curHist.current.push(curRef.current)
                if (phiHist.current.length > HISTORY) { phiHist.current.shift(); curHist.current.shift() }
                if (Math.abs(curRef.current) > 0.3) cb.current.onLamp?.()
            }
            setTick((x) => x + 1)
        }, TICK_MS)
        return () => clearInterval(id)
    }, [])

    const toSvgY = (clientY: number) => {
        const r = svgRef.current!.getBoundingClientRect()
        return (clientY - r.top) * (SCENE_H / r.height)
    }
    const topOf = (p: number) => TOP_MIN + p * (TOP_MAX - TOP_MIN)
    const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (mode !== 'manual') return
        const y = toSvgY(e.clientY)
        const top = topOf(pRef.current)
        if (y < top - 14 || y > top + MAG_H + 14) return
        draggingRef.current = true
        grabRef.current = y - top
        try { svgRef.current!.setPointerCapture(e.pointerId) } catch { /* синтетические события */ }
        setTouched(true)
    }
    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current) return
        pRef.current = clamp((toSvgY(e.clientY) - grabRef.current - TOP_MIN) / (TOP_MAX - TOP_MIN), 0, 1)
    }
    const onUp = () => { draggingRef.current = false }

    const p = pRef.current
    const top = topOf(p)
    const I = curRef.current
    const absI = Math.abs(I)
    const curColor = I >= 0 ? CURRENT_COLOR : CURRENT_COLOR_REV
    const magBottom = top + MAG_H
    const bMt = p * B_MAX_MT
    const phiMk = p * PHI_MAX_MKWB

    const auto = mode === 'auto'
    const total = auto && profile ? Math.round((profile.T * 1000) / TICK_MS) : HISTORY
    const chartPath = (arr: number[], w: number, h: number, lo: number, hi: number) =>
        arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (total - 1)) * w).toFixed(1)},${(h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`).join(' ')
    const iLo = auto ? -0.1 : -1

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
                    style={{ touchAction: mode === 'manual' ? 'none' : 'auto' }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                >
                    {showThrough && lines.map((dx, i) => (
                        <g key={i} opacity={0.12 + 0.88 * p}>
                            <line x1={100 + dx * 0.6} y1={magBottom} x2={100 + dx} y2={RING_CY + 22}
                                stroke={FLUX_COLOR} strokeWidth={1.6} strokeDasharray="4 4" />
                            <path d={`M${100 + dx - 4},${RING_CY + 12} L${100 + dx},${RING_CY + 22} L${100 + dx + 4},${RING_CY + 12}`}
                                fill="none" stroke={FLUX_COLOR} strokeWidth={1.6} />
                        </g>
                    ))}
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
                    <line x1={100} y1={RING_CY + RING_RY} x2={100} y2={218} stroke="#4A5760" strokeWidth={3} />
                    <circle cx={100} cy={232} r={10 + 10 * absI} fill={CURRENT_COLOR} opacity={Math.min(0.5, absI * 0.6)} />
                    <circle cx={100} cy={232} r={11} fill={absI > 0.08 ? '#FFE9A8' : '#2A343A'}
                        stroke={absI > 0.08 ? CURRENT_COLOR : '#4A5760'} strokeWidth={3}
                        opacity={absI > 0.08 ? 0.5 + 0.5 * Math.min(1, absI * 1.6) : 1} />
                    <g style={{ cursor: mode === 'manual' ? 'grab' : 'default' }}>
                        <rect x={100 - MAG_W / 2} y={top} width={MAG_W} height={MAG_H / 2} rx={5} fill="#4A90D9" />
                        <rect x={100 - MAG_W / 2} y={top + MAG_H / 2} width={MAG_W} height={MAG_H / 2} rx={5} fill="#DC605B" />
                        <text x={100} y={top + 19} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">S</text>
                        <text x={100} y={top + MAG_H - 9} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">N</text>
                    </g>
                    {mode === 'manual' && !touched && (
                        <text x={100 + MAG_W / 2 + 8} y={top + MAG_H / 2 + 4} fontSize={13} fontWeight={800} fill="#F2F7FB">↕ тяни</text>
                    )}
                </svg>

                <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="rounded-xl bg-[#0F171A] p-1">
                        <div className="px-1 text-[11px] font-bold" style={{ color: FLUX_COLOR }}>Φ(t) — поток</div>
                        <svg viewBox="0 0 180 80" className="w-full">
                            <line x1={0} y1={79} x2={180} y2={79} stroke="#3A464E" />
                            <path d={chartPath(phiHist.current, 180, 76, 0, 1)} fill="none" stroke={FLUX_COLOR} strokeWidth={2.4} strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="rounded-xl bg-[#0F171A] p-1">
                        <div className="px-1 text-[11px] font-bold" style={{ color: curColor }}>I(t) — ток в кольце</div>
                        <svg viewBox="0 0 180 80" className="w-full">
                            <line x1={0} y1={76 - ((0 - iLo) / (1 - iLo)) * 76} x2={180} y2={76 - ((0 - iLo) / (1 - iLo)) * 76} stroke="#3A464E" strokeDasharray="3 3" />
                            <path d={chartPath(curHist.current, 180, 76, iLo, 1)} fill="none" stroke={CURRENT_COLOR} strokeWidth={2.4} strokeLinejoin="round" />
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
        q: 'Магнит едет с постоянной скоростью — график Φ(t) прямая наклонная линия. Какой ток?',
        options: ['Постоянный, не равный нулю', 'Нулевой', 'Растёт всё сильнее', 'Убывает до нуля'],
        correct: 0,
        explain: 'Прямая — поток растёт равномерно, ΔΦ/Δt одинаково всё время, значит ток постоянный.',
    },
    {
        q: 'Магнит стал ехать вдвое быстрее. Что стало с током?',
        options: ['Не изменился', 'Уменьшился вдвое', 'Стал вдвое больше', 'Пропал'],
        correct: 2,
        explain: 'Поток меняется вдвое быстрее — ΔΦ/Δt вдвое больше, и ток вдвое больше.',
    },
    {
        q: 'Магнит разгоняется, график Φ(t) — парабола (круче и круче). Что с током?',
        options: ['Постоянный', 'Линейно растёт', 'Равен нулю', 'Линейно убывает'],
        correct: 1,
        explain: 'Наклон Φ(t) всё время растёт — значит и ток (ЭДС) растёт.',
    },
    {
        q: 'Поток через контур вырос с 2 Вб до 8 Вб за 3 с. Чему равна ЭДС индукции (по модулю)?',
        options: ['2 В', '6 В', '3 В', '0,5 В'],
        correct: 0,
        explain: 'ε = ΔΦ/Δt = (8 − 2)/3 = 2 В.',
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

type Stage = { title: string; hint: string; done: string; prof?: number }
const STAGES: Stage[] = [
    { prof: 0, title: 'Магнит стоит', hint: 'Нажми «Запустить» и смотри на графики: магнит просто лежит над кольцом.', done: 'Поток Φ не меняется — график ровный, тока нет. Лампочка не горит.' },
    { prof: 1, title: 'Магнит едет ровно', hint: 'Теперь магнит движется с постоянной скоростью. Что будет с потоком и током?', done: 'Поток растёт равномерно (прямая), а ток постоянный: ровная линия, но не ноль!' },
    { prof: 2, title: 'А если быстрее?', hint: 'Сначала магнит едет медленно, потом вдвое быстрее. Смотри на график тока.', done: 'Быстрее — круче Φ(t) — больше ток. Вдвое быстрее — вдвое больше ток.' },
    { prof: 3, title: 'Магнит разгоняется', hint: 'Скорость магнита всё время растёт. Что с током?', done: 'Φ(t) — парабола, круче и круче. Ток растёт линейно: ток — это наклон графика потока.' },
]
// 4 — формула, 5 — своя очередь, 6 — вопросы.

export const TypeFaradayWalk = ({ onAnswer, onComplete }: Props) => {
    const [stage, setStage] = useState(0)
    const [runKey, setRunKey] = useState(0)
    const [ran, setRan] = useState(false)
    const [running, setRunning] = useState(false)
    const [lamp, setLamp] = useState(false)
    const finishedRef = useRef(false)
    const [label, setLabel] = useState('Дальше')
    useEffect(() => { setLabel(pickWalkthroughNextLabel('Дальше')) }, [stage])

    const go = (n: number) => { setStage(n); setRan(false); setRunning(false); setLamp(false); setRunKey(0) }
    const start = () => { setRunning(true); setRunKey((k) => k + 1) }

    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    if (stage === 6) {
        return (
            <div className="mx-auto w-full max-w-md px-1 pb-8">
                <QuizPart onFinish={handleFinish} />
            </div>
        )
    }

    const st = stage < 4 ? STAGES[stage] : null
    const canNext = stage < 4 ? ran : stage === 4 ? true : lamp
    const isAuto = stage < 4

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-1 pb-8">
            {stage !== 4 && (
                <Sandbox
                    key={`sb-${stage}`}
                    mode={isAuto ? 'auto' : 'manual'}
                    profile={isAuto ? PROFILES[STAGES[stage].prof!] : undefined}
                    runKey={runKey}
                    onFinish={() => { setRan(true); setRunning(false) }}
                    onLamp={() => setLamp(true)}
                />
            )}

            {st && (
                <motion.div key={`tx-${stage}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                    <div className="text-center text-xs font-bold text-[#9AA7B0]">Шаг {stage + 1} из 6</div>
                    <div className="text-center text-xl font-extrabold text-white">{st.title}</div>
                    <div className="text-center text-base text-[#D5DEE3]">{st.hint}</div>
                    {ran && (
                        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl border-2 px-3 py-2 text-center font-bold"
                            style={{ borderColor: CORRECT_COLOR, background: `${CORRECT_COLOR}1A`, color: '#E7F5C8' }}>
                            {st.done}
                        </motion.div>
                    )}
                    <button
                        disabled={running}
                        onClick={start}
                        className={walkthroughButtonClass(!running)}
                        style={walkthroughButtonStyle(!running)}
                    >
                        {running ? 'Идёт…' : ran ? '↻ Ещё раз' : '▶ Запустить'}
                    </button>
                </motion.div>
            )}

            {stage === 4 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                    <div className="text-center text-xs font-bold text-[#9AA7B0]">Шаг 5 из 6</div>
                    <div className="text-center text-xl font-extrabold text-white">Закон Фарадея</div>
                    <div className="rounded-2xl border-2 p-4 text-center text-2xl" style={{ borderColor: ACTIVE_COLOR, background: `${ACTIVE_COLOR}14` }}>
                        <Latex>{'$\\varepsilon = -\\dfrac{\\Delta\\Phi}{\\Delta t}$'}</Latex>
                    </div>
                    <div className="text-center text-base text-[#D5DEE3]">
                        ЭДС индукции — это <b style={{ color: FLUX_COLOR }}>скорость изменения потока</b>, то есть
                        «наклон» графика Φ(t). Ровная линия — тока нет, прямая наклонная — ток постоянный,
                        круче — ток больше. Знак «−» только про направление тока.
                    </div>
                </motion.div>
            )}

            {stage === 5 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                    <div className="text-center text-xs font-bold text-[#9AA7B0]">Шаг 6 из 6</div>
                    <div className="text-center text-xl font-extrabold text-white">Твоя очередь</div>
                    <div className="text-center text-base text-[#D5DEE3]">Потяни магнит сам — зажги лампочку и посмотри, как ток повторяет наклон потока.</div>
                    {lamp && (
                        <div className="rounded-xl border-2 px-3 py-2 text-center font-bold"
                            style={{ borderColor: CORRECT_COLOR, background: `${CORRECT_COLOR}1A`, color: '#E7F5C8' }}>
                            Лампочка горит! Движешь магнит — поток меняется — есть ток.
                        </div>
                    )}
                </motion.div>
            )}

            <button
                disabled={!canNext}
                onClick={() => go(stage + 1)}
                className={walkthroughButtonClass(canNext)}
                style={walkthroughButtonStyle(canNext)}
            >
                {stage === 5 ? 'Проверим себя' : stage === 4 ? 'Попробовать самому' : label}
            </button>
        </div>
    )
}
