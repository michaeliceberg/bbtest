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

import { Fragment, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    CORRECT_COLOR, ATTENTION_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
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
type Flyer = { from: string; to: 'base' | 'arg'; n: number; color: string }
type FlyerRun = { n: number; left: number; top: number; fs: number; dx: number; dy: number; arc: number; scale: number; color: string }

export type ChainExample = {
    left: (o: LeftOpts) => ReactNode
    strike: [string, string]
    flyers: [Flyer, Flyer]
    lines: [string[], string[], string[]]
    labels: [string, string, string]
}

const Slot = ({ value, color }: { value: number | null; color: string }) => (
    value === null ? (
        <span className="inline-block align-middle rounded-md border-2 border-dashed" style={{ width: '0.9em', height: '1em', borderColor: '#3A464E', backgroundColor: hexToRgba(color, 0.1) }} />
    ) : (
        <motion.span initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 15 }} className="inline-block text-[#F2F7FB]">{value}</motion.span>
    )
)

// «= log □ □»: data-marker base/arg — точки приземления.
const RightExpr = ({ on, base, arg }: { on: boolean; base: number | null; arg: number | null }) => (
    <span className="inline-flex items-baseline whitespace-nowrap" style={{ opacity: on ? 1 : 0, transition: 'opacity 0.4s' }}>
        <Plain>=</Plain>
        <span className="ml-2"><Plain>log</Plain></span>
        <sub className="ml-0.5" style={{ lineHeight: 0 }}><span data-marker="base" className="inline-block"><Slot value={base} color={COL_BASE} /></span></sub>
        <span data-marker="arg" className="ml-1 inline-block"><Slot value={arg} color={COL_ARG} /></span>
    </span>
)

// Линия-вычёркивание поверх элемента с data-marker (рисуется слева направо).
const Strikes = ({ containerRef, markers }: { containerRef: RefObject<HTMLDivElement | null>; markers: string[] }) => {
    const [rects, setRects] = useState<{ x: number; y: number; w: number }[]>([])
    useEffect(() => {
        const c = containerRef.current
        if (!c) return
        const cr = c.getBoundingClientRect()
        setRects(markers.map((m) => {
            const r = c.querySelector<HTMLElement>(`[data-marker="${m}"]`)?.getBoundingClientRect()
            return r ? { x: r.left - cr.left - 3, y: r.top - cr.top + r.height / 2, w: r.width + 6 } : { x: 0, y: 0, w: 0 }
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <>
            {rects.map((r, i) => (
                <motion.span
                    key={i}
                    className="pointer-events-none absolute"
                    style={{ left: r.x, top: r.y - 1.5, width: r.w, height: 3, borderRadius: 2, background: ATTENTION_COLOR, transformOrigin: 'left center', zIndex: 4 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.35 }}
                />
            ))}
        </>
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

// Блок коротких строк: печатаются по одной, следующая — после предыдущей.
const Lines = ({ lines, dim, onDone }: { lines: string[]; dim: boolean; onDone: () => void }) => {
    const [n, setN] = useState(1)
    return (
        <div className="flex flex-col gap-1.5" style={dim ? { opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 0.4s' } : undefined}>
            {lines.slice(0, n).map((t, i) => (
                <TypedLine
                    key={i}
                    className="w-full text-base md:text-lg text-[#F2F7FB]"
                    text={t}
                    onSettled={() => { if (i === lines.length - 1) onDone(); else setN(i + 2) }}
                />
            ))}
        </div>
    )
}

const ChainScene = ({ ex, phase, onSettled }: { ex: ChainExample; phase: number; onSettled: () => void }) => {
    const [marked, setMarked] = useState(false)
    const [struck, setStruck] = useState(false)
    const [dim, setDim] = useState(false)
    const [rightOn, setRightOn] = useState(false)
    const [fly, setFly] = useState(false)
    const [sent, setSent] = useState(false)
    const [flyers, setFlyers] = useState<FlyerRun[] | null>(null)
    const [landed, setLanded] = useState(false)
    const [shown, setShown] = useState<boolean[]>([false, false, false])
    const ref = useRef<HTMLDivElement>(null)
    const phaseRef = useRef(phase)
    phaseRef.current = phase
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }
    const showText = (p: number) => setShown((s) => s.map((v, i) => v || i === p))
    const done = (p: number) => () => { if (phaseRef.current === p) setTimeout(onSettled, 300) }

    useEffect(() => {
        const list = timers.current
        if (phase === 0) {
            later(() => setMarked(true), 1000)
            later(() => showText(0), 2100)
        } else if (phase === 1) {
            later(() => setStruck(true), 500)
            later(() => setDim(true), 1700)
            later(() => showText(1), 2400)
        } else {
            later(() => setRightOn(true), 200)
            later(() => setFly(true), 1000)
            later(() => {
                const c = ref.current
                if (!c) { setLanded(true); showText(2); return }
                const cr = c.getBoundingClientRect()
                const run: FlyerRun[] = []
                ex.flyers.forEach((f, i) => {
                    const src = c.querySelector<HTMLElement>(`[data-marker="${f.from}"]`)
                    const dst = c.querySelector<HTMLElement>(`[data-marker="${f.to}"]`)
                    if (!src || !dst) return
                    const sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect()
                    const fsS = parseFloat(getComputedStyle(src).fontSize), fsD = parseFloat(getComputedStyle(dst).fontSize)
                    run.push({
                        n: f.n, color: f.color, left: sr.left - cr.left, top: sr.top - cr.top, fs: fsS,
                        dx: dr.left + dr.width / 2 - (sr.left + sr.width / 2), dy: dr.top + dr.height / 2 - (sr.top + sr.height / 2),
                        arc: i === 0 ? -48 : -84, scale: fsD / fsS,
                    })
                })
                setFlyers(run)
                setSent(true)
            }, 1900)
            later(() => { setFlyers(null); setLanded(true) }, 1900 + FLIGHT_MS)
            later(() => showText(2), 1900 + FLIGHT_MS + 600)
        }
        return () => { list.forEach(clearTimeout); list.length = 0 }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    return (
        <>
            <DiagramBlock>
                <div ref={ref} className="relative w-full py-4 flex items-center justify-center gap-3 text-2xl md:text-3xl font-extrabold">
                    {ex.left({ marked, dim, fly, sent })}
                    <RightExpr on={rightOn} base={landed ? ex.flyers[0].n : null} arg={landed ? ex.flyers[1].n : null} />
                    {struck && <Strikes containerRef={ref} markers={ex.strike} />}
                    {flyers?.map((f) => <FlyerView key={`${f.n}-${f.left}`} f={f} />)}
                </div>
            </DiagramBlock>
            <div className="flex flex-col gap-2">
                {[0, 1, 2].map((p) => shown[p] && <Lines key={p} lines={ex.lines[p]} dim={phase > p} onDone={done(p)} />)}
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
    const [stage, setStage] = useState(0)
    const [wrongTried, setWrongTried] = useState<(number | string)[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [jokeOrder] = useState(() => extras.map((e) => shuffle(e.options)))
    const registerCombo = useWalkthroughCombo()
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    const exIdx = Math.floor(step / 3)
    const exPhase = step % 3
    const resetTrial = () => { setChecked(false); setStage(0); setWrongTried([]); setWrongFlash(null) }

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
            if (step + 1 >= 6) setPhase('practice')
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
        if (phase === 'intro') { setStep(exIdx * 3); setStepReady(false) } else resetTrial()
        bumpNonce(latestSceneKey)
    }
    const handleBack = () => {
        if (advancing) return
        if (phase === 'intro') {
            if (step === 0) return
            const t = exPhase > 0 ? exIdx * 3 : (exIdx - 1) * 3
            bumpNonce(`step-${Math.floor(t / 3)}`); setStep(t); setStepReady(false)
            return
        }
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) { setTrialIndex(Number(target.slice(6))); resetTrial() }
        else { setPhase('intro'); setStep(Number(target.slice(5)) * 3 + 2); setStepReady(false) }
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
                {[0, 1].map((i) => step >= i * 3 && (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <ChainScene ex={cfg.examples[i]} phase={Math.min(2, Math.max(0, step - i * 3))} onSettled={() => setStepReady(true)} />
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
                                        {extra ? extra.question : (isDone || !isCurrent ? 'Собрали ответ' : cfg.stagePrompts[stage])}
                                    </p>
                                </div>

                                {t && ans && (
                                    <>
                                        <DiagramBlock>
                                            <div className="w-full flex items-center justify-center text-2xl md:text-3xl font-extrabold py-1">{cfg.prompt(t.n)}</div>
                                            <div className="w-full flex items-center justify-center gap-x-2 text-2xl md:text-3xl font-extrabold py-1">
                                                <Plain>=</Plain>
                                                <span className="inline-flex items-baseline whitespace-nowrap">
                                                    <Plain>log</Plain>
                                                    <sub className="ml-0.5" style={{ lineHeight: 0 }}>{slotText((isDone || !isCurrent || stage > 0) ? ans[0] : null, COL_BASE, isDone, isCurrent && !isDone && stage === 0)}</sub>
                                                    <span className="ml-1">{slotText((isDone || !isCurrent) ? ans[1] : null, COL_ARG, isDone, isCurrent && !isDone && stage === 1)}</span>
                                                </span>
                                            </div>
                                        </DiagramBlock>
                                        {isCurrent && !checked && (
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

