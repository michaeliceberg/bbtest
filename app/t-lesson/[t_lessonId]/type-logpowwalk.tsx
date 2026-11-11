// app/t-lesson/[t_lessonId]/type-logpowwalk.tsx
//
// Тип LOGPOWWALK — разбор «Степени»: log_{a^n} b^m = (m/n)·log_a b. Устроен как LOGWALK/LOGSUBWALK: одна сцена с одной формулой
// («текстовыделение 2.0» вместо стикеров, без «= ?» справа):
// 0: «Вижу степень сверху и снизу» → маркером выделяются 3 и 7, кнопка «Вижу обе степени»;
// 1: «Верхняя степень идёт НАВЕРХ, а нижняя ВНИЗ» → логарифм плавно уезжает вправо → слева появляется черта дроби →
//    семёрка (выделенная) перелетает справа налево в числитель → тройка перелетает в знаменатель; на старых местах ничего не остаётся.
// После разбора — тренировочные задания с НОВЫМИ случайными числами (клик по верной формуле среди 4 вариантов).

'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, CORRECT_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter, withBreaks } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

// Тот же приём и то же значение, что у SINWALK/LOGWALK/LOGSUBWALK.
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const INTRO_STEPS = 2
const TRIAL_COUNT = 4

// Фиксированный обучающий пример — a=2 (основание), n=3 (степень
// основания → знаменатель), b=5 (аргумент), m=7 (степень аргумента →
// числитель). Однозначные числа по прямой просьбе пользователя ("чтобы
// было легче увидеть").
const A = 2
const N = 3
const B = 5
const M = 7

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина, что
// и в LOGWALK/LOGSUBWALK: короткая целочисленная запись не требует
// формульного рендера, а HTML избавляет от KaTeX-сегментирования). =====

// Выделение маркером («текстовыделение 2.0», /test-base-marker): сплошная заливка, тёмная цифра, без рамки и второго уменьшения.
const MARK_COLOR = GGEGE_PALETTE.blue.button
const markStyle = { background: MARK_COLOR, color: '#10181C', lineHeight: 1.15 } as const
const BaseMark = ({ value }: { value: number | string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-block rounded-[3px] px-[3px] font-extrabold"
        style={markStyle}
    >
        {value}
    </motion.span>
)

const Plain = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#F2F7FB]">{children}</span>
)


// Показатель степени — НЕ нативный <sup> (даёт разный визуальный масштаб/
// высоту в зависимости от того, вложен он в <sub> или в обычный baseline-
// контекст — нашёл живьём: "7" у аргумента получался заметно крупнее и
// выше, чем "3" у основания, хотя должны читаться как единый приём).
// Явный `position:relative`+`top`+`font-size` в одних и тех же em-долях
// даёт одинаковую ОТНОСИТЕЛЬНУЮ посадку в обоих местах — абсолютный
// размер у "3" (внутри уже уменьшенного <sub>) естественно чуть меньше,
// чем у "7" (в обычном baseline), что и требуется для настоящей
// вложенной типографики (степень степени мельче степени).
// Увеличено с 0.6em до 0.78em по прямой просьбе пользователя ("степени
// очень маленького размера шрифта") — см. ТАКЖЕ фикс ниже: главная
// причина крошечных стикер-степеней была не в самом Exp, а в том, что
// стикер внутри Exp дополнительно применял свой собственный "small"
// (ещё ×0.6) — итоговый масштаб схлопывался до ~0.36em. small убран у
// стикеров степеней (см. PowFormula), Exp сам держит разумный масштаб.
const Exp = ({ children }: { children: React.ReactNode }) => (
    <span className="relative inline-block ml-px" style={{ fontSize: '0.78em', top: '-0.8em' }}>{children}</span>
)

// Формула «log_{a^n} b^m» без правой части; marked — показатели выделены маркером (в тренировке всегда выделены).
const PowFormula = ({
    a = A, n = N, b = B, m = M, marked = true,
}: { a?: number; n?: number; b?: number; m?: number; marked?: boolean }) => (
    <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-3 text-2xl md:text-3xl font-extrabold py-1">
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain>
            <sub className="ml-0.5 inline-flex items-baseline">
                <Plain>{a}</Plain>
                <Exp>{marked ? <BaseMark value={n} /> : <Plain>{n}</Plain>}</Exp>
            </sub>
            <span className="ml-1.5 inline-flex items-baseline">
                <Plain>{b}</Plain>
                <Exp>{marked ? <BaseMark value={m} /> : <Plain>{m}</Plain>}</Exp>
            </span>
        </span>
    </div>
)

// Показатель в сцене-разборе: можно спрятать (улетел) и затем схлопнуть по ширине (после приземления соседа не оставляем дыру).
const SceneExp = ({ marker, value, marked, gone, collapsed }: { marker: string; value: number; marked: boolean; gone: boolean; collapsed: boolean }) => (
    <motion.span
        className="relative inline-block ml-px"
        style={{ fontSize: '0.78em', top: '-0.8em', overflow: collapsed ? 'hidden' : 'visible' }}
        initial={false}
        animate={{ width: collapsed ? 0 : 'auto', marginLeft: collapsed ? 0 : 1 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
        <span data-marker={marker} className="inline-block" style={{ opacity: gone ? 0 : 1 }}>
            {marked ? <BaseMark value={value} /> : <Plain>{value}</Plain>}
        </span>
    </motion.span>
)

type PowFlyer = { n: number; left: number; top: number; fs: number; dx: number; dy: number; arc: number; scale: number }
const FLIGHT_MS = 1900

const MergedPowScene = ({ step, onSettled }: { step: number; onSettled: () => void }) => {
    const [lines, setLines] = useState(0)
    const [marked, setMarked] = useState(false)
    const [shift, setShift] = useState<number | null>(null)
    const [slide, setSlide] = useState(false)
    const [barOn, setBarOn] = useState(false)
    const [gone, setGone] = useState({ m: false, n: false })
    const [collapsed, setCollapsed] = useState({ m: false, n: false })
    const [landed, setLanded] = useState({ m: false, n: false })
    const [flyer, setFlyer] = useState<PowFlyer | null>(null)
    const [done, setDone] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }

    // Пока дробь не показана, логарифм стоит по центру: сдвигаем строку влево на половину ширины невидимой дроби.
    useLayoutEffect(() => {
        const measure = (): boolean => {
            const row = rowRef.current
            const frac = row?.querySelector<HTMLElement>('[data-marker="fracgrp"]')
            if (!row || !frac) return false
            if (!slide) setShift(-Math.round((frac.getBoundingClientRect().width + 8) / 2))
            return true
        }
        const poll = setInterval(() => { if (measure()) clearInterval(poll) }, 60)
        const onResize = () => { measure() }
        window.addEventListener('resize', onResize)
        return () => { clearInterval(poll); window.removeEventListener('resize', onResize) }
    }, [slide])

    // Выделенный показатель отрывается от места, летит по дуге в свою ячейку дроби и садится обычной цифрой.
    const fly = (key: 'm' | 'n', n: number, up: boolean, onLanded: () => void) => {
        const c = ref.current
        const src = c?.querySelector<HTMLElement>(`[data-marker="exp-${key}"]`)
        const dst = c?.querySelector<HTMLElement>(`[data-marker="slot-${key}"]`)
        if (!c || !src || !dst) { setLanded((l) => ({ ...l, [key]: true })); onLanded(); return }
        const cr = c.getBoundingClientRect(), sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect()
        const fs = parseFloat(getComputedStyle(src).fontSize)
        const ds = parseFloat(getComputedStyle(dst).fontSize)
        setFlyer({
            n, left: sr.left - cr.left, top: sr.top - cr.top, fs,
            dx: (dr.left + dr.width / 2) - (sr.left + sr.width / 2), dy: (dr.top + dr.height / 2) - (sr.top + sr.height / 2),
            arc: up ? -46 : 40, scale: ds / fs,
        })
        setGone((g) => ({ ...g, [key]: true }))
        later(() => {
            setFlyer(null)
            setLanded((l) => ({ ...l, [key]: true }))
            setCollapsed((cl) => ({ ...cl, [key]: true }))
            onLanded()
        }, FLIGHT_MS)
    }

    useEffect(() => {
        const list = timers.current
        if (step === 0) later(() => setLines(1), 1000)
        if (step === 1) {
            later(() => setLines(2), 300)
        }
        return () => { list.forEach(clearTimeout); list.length = 0 }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    const dim = (n: number) => (lines > n || step >= 1 && n < 2) ? { opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 0.4s' } : { transition: 'opacity 0.4s' }

    return (
        <>
            <DiagramBlock>
                <div ref={ref} className="relative w-full overflow-x-clip py-12">
                    <motion.div
                        ref={rowRef as React.RefObject<HTMLDivElement>}
                        className="w-full flex items-center justify-center gap-x-2 text-2xl md:text-3xl font-extrabold py-1"
                        style={{ opacity: shift === null ? 0 : 1 }}
                        initial={false}
                        animate={{ x: shift ?? 0 }}
                        transition={{ duration: slide ? 0.9 : 0, ease: 'easeInOut' }}
                    >
                        <span data-marker="fracgrp" className="inline-block align-middle leading-none" style={{ fontSize: '0.85em' }}>
                            <span className="block px-1.5 pb-1 border-b-2 min-w-[1.4em] text-center transition-colors duration-500" style={{ borderColor: barOn ? 'rgba(242,247,251,0.75)' : 'transparent' }}>
                                <span data-marker="slot-m" className="text-[#F2F7FB]" style={{ opacity: landed.m ? 1 : 0 }}>{M}</span>
                            </span>
                            <span className="block px-1.5 pt-1 min-w-[1.4em] text-center">
                                <span data-marker="slot-n" className="text-[#F2F7FB]" style={{ opacity: landed.n ? 1 : 0 }}>{N}</span>
                            </span>
                        </span>
                        <span className="inline-flex items-baseline whitespace-nowrap">
                            <Plain>log</Plain>
                            <sub className="ml-0.5 inline-flex items-baseline">
                                <Plain>{A}</Plain>
                                <SceneExp marker="exp-n" value={N} marked={marked} gone={gone.n} collapsed={collapsed.n} />
                            </sub>
                            <span className="ml-1.5 inline-flex items-baseline">
                                <Plain>{B}</Plain>
                                <SceneExp marker="exp-m" value={M} marked={marked} gone={gone.m} collapsed={collapsed.m} />
                            </span>
                        </span>
                    </motion.div>
                    {flyer && (
                        <motion.span
                            className="absolute inline-block rounded-[3px] px-[3px] font-extrabold"
                            style={{ ...markStyle, left: flyer.left, top: flyer.top, fontSize: flyer.fs }}
                            initial={{ x: 0, y: 0, scale: 1 }}
                            animate={{ x: [0, flyer.dx * 0.5, flyer.dx], y: [0, flyer.dy * 0.5 + flyer.arc, flyer.dy], scale: [1, 1.2, flyer.scale] }}
                            transition={{ duration: FLIGHT_MS / 1000, times: [0, 0.5, 1], ease: 'easeInOut' }}
                        >
                            {flyer.n}
                        </motion.span>
                    )}
                </div>
            </DiagramBlock>
            {done && <LocalAnswerConfetti />}
            {lines >= 1 && (
                <div style={dim(1)}>
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Вижу степень сверху и снизу."
                        onSettled={() => {
                            // показатели выделяются маркером → кнопка
                            setMarked(true)
                            later(onSettled, 900)
                        }}
                    />
                </div>
            )}
            {lines >= 2 && (
                <div style={dim(2)}>
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Верхняя степень идёт НАВЕРХ, а нижняя ВНИЗ."
                        onSettled={() => {
                            // пауза → логарифм плавно вправо → черта дроби → 7 в числитель → 3 в знаменатель → кнопка
                            later(() => { setSlide(true); setShift(0) }, 900)
                            later(() => setBarOn(true), 900 + 1000)
                            later(() => fly('m', M, true, () => {
                                later(() => fly('n', N, false, () => {
                                    later(() => { setDone(true); later(onSettled, 1200) }, 500)
                                }), 1100)
                            }), 900 + 1000 + 900)
                        }}
                    />
                </div>
            )}
        </>
    )
}

// ===== Тренировочные задания — новые случайные (a, n, b, m), нужно
// кликнуть верную формулу-ответ (m/n · log_a b) среди 4 вариантов. =====

type PowOption = { frac: [number, number]; base: number; arg: number }
type PowTrial = { a: number; n: number; b: number; m: number; options: PowOption[] }

const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (x: PowOption, y: PowOption) => x.frac[0] === y.frac[0] && x.frac[1] === y.frac[1] && x.base === y.base && x.arg === y.arg

// Дистракторы — правдоподобные ошибки школьника, не случайный шум:
// перепутал местами числитель/знаменатель, перепутал местами основание и
// аргумент лога, ошибся на 1 в числителе.
function makeOptions(a: number, n: number, b: number, m: number): PowOption[] {
    const correct: PowOption = { frac: [m, n], base: a, arg: b }
    const candidates: PowOption[] = [
        { frac: [n, m], base: a, arg: b },
        { frac: [m, n], base: b, arg: a },
        { frac: [m + 1, n], base: a, arg: b },
    ]
    const chosen: PowOption[] = [correct]
    for (const c of candidates) {
        if (!chosen.some((x) => sameOption(x, c))) chosen.push(c)
    }
    let extraShift = 2
    while (chosen.length < 4) {
        const extra: PowOption = { frac: [m + extraShift, n], base: a, arg: b }
        if (!chosen.some((x) => sameOption(x, extra))) chosen.push(extra)
        extraShift++
    }
    return shuffle(chosen)
}

const makeTrial = (prev: PowTrial | null): PowTrial => {
    let t: PowTrial
    let guard = 0
    do {
        const a = pick(NUM_POOL)
        let b = pick(NUM_POOL)
        while (b === a) b = pick(NUM_POOL)
        const n = pick(NUM_POOL)
        let m = pick(NUM_POOL)
        while (m === n) m = pick(NUM_POOL)
        t = { a, n, b, m, options: makeOptions(a, n, b, m) }
        guard++
    } while (prev && t.a === prev.a && t.n === prev.n && t.b === prev.b && t.m === prev.m && guard < 8)
    return t
}

const makeTrials = (n: number): PowTrial[] => {
    const out: PowTrial[] = []
    let prev: PowTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

const pickTrialFeedback = (t: PowTrial): string => {
    const seed = t.a * 7 + t.n * 5 + t.b * 3 + t.m
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Кнопка-вариант — компактная формула "m/n · logₐb". Цвет всей формулы —
// текущий текстовый цвет кнопки (border-current/наследуемый text color),
// а НЕ Plain/NumSticker с зашитым белым — иначе состояние correct/wrong
// не смогло бы перекрасить дробь и лог вместе с рамкой кнопки.
const MiniAnswerButton = ({
    option, onClick, disabled, state,
}: { option: PowOption; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border-2 text-base md:text-lg font-bold transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        <span className="inline-flex flex-col items-center leading-none text-[0.7em]">
            <span className="px-1 pb-0.5 border-b-2 border-current">{option.frac[0]}</span>
            <span className="px-1 pt-0.5">{option.frac[1]}</span>
        </span>
        <span className="inline-flex items-baseline whitespace-nowrap">
            log<sub className="ml-0.5 text-[0.7em]">{option.base}</sub><span className="ml-0.5">{option.arg}</span>
        </span>
    </button>
)

export const TypeLogPowWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<PowTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" (та же механика, что и у
    // LOGCOMBOWALK/LOGDEFWALK/SINWALK/LOGWALK/LOGSUBWALK) — неверно
    // нажатые формулы ТЕКУЩЕГО задания красятся красным и блокируются,
    // wrongFlash — ПЕРСИСТЕНТНОЕ сообщение под вариантами (не гаснет по
    // таймеру).
    const [wrongTried, setWrongTried] = useState<PowOption[]>([])
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)


    const currentCorrectOption = trials[trialIndex].options.find(
        (o) => sameOption(o, { frac: [trials[trialIndex].m, trials[trialIndex].n], base: trials[trialIndex].a, arg: trials[trialIndex].b })
    )!

    const handleOptionClick = (option: PowOption) => {
        if (checked) return
        if (wrongTried.some((w) => sameOption(w, option))) return
        if (sameOption(option, currentCorrectOption)) {
            registerCombo(wrongTried.length === 0)
            showAnswerMeme(true)
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
            setWrongTried((prev) => [...prev, option])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isLastInList = trialIndex + 1 >= trials.length
            if (isLastInList) {
                setAdvancing(false)
                const isFullyCorrect = !hadMistake
                onComplete(isFullyCorrect)
                onAnswer(isFullyCorrect ? 'right' : 'wrong')
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_STEPS) {
                setPhase('practice')
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // trialNextLabel выставляется ПРЯМО в handleOptionClick (не эффектом
    // на trialIndex) — её тон зависит от того, верно ли ответили сейчас.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])
    const stepLabel = ['Вижу обе степени', 'Степени переехали'][step] ?? introNextLabel

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевой сцены (см. type-sinwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой — та же схема ключей,
    // что и в LOGWALK/LOGSUBWALK/LOGDEFWALK (см. useSceneFocus в
    // WalkthroughLog.tsx).
    const latestSceneKey = phase === 'intro' ? 'step-0' : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            return idx > 0 ? `trial-${idx - 1}` : 'step-0'
        }
        if (key.startsWith('step-')) {
            return null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null || (phase === 'intro' && step > 0)
    // "Повторить" — переигрывает анимацию ТЕКУЩЕЙ сцены заново, не трогая
    // состояние (в отличие от handleBack ниже) — та же пара useReplayNonces,
    // что уже используется для отката.
    const handleReplay = () => {
        // сцена с растущей формулой проигрывается с самого начала
        if (latestSceneKey === 'step-0') { setStep(0); setStepReady(false) }
        bumpNonce(latestSceneKey)
    }

    // "Назад" — реальный откат состояния на предыдущую сцену (см.
    // type-logwalk.tsx для подробного комментария).
    const handleBack = () => {
        if (advancing) return
        if (phase === 'intro' && step > 0) {
            bumpNonce('step-0'); setStep(0); setStepReady(false)
            return
        }
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
        } else if (target.startsWith('step-')) {
            const idx = Number(target.slice('step-'.length))
            setPhase('intro')
            setStep(idx)
            setStepReady(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаги 0-1 — одна сцена с растущей формулой (MergedPowScene). */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <MergedPowScene step={step} onSettled={() => setStepReady(true)} />
                    </Fragment>
                </SceneWrapper>

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const correctOption = t.options.find(
                        (o) => sameOption(o, { frac: [t.m, t.n], base: t.a, arg: t.b })
                    )!
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                            {/* Разделитель перед ПЕРВЫМ тренировочным заданием —
                                по прямой просьбе пользователя визуально
                                отгородить практику от предшествующего разбора
                                по шагам. */}
                            {i === 0 && (
                                <div className="w-full flex items-center gap-3" aria-hidden>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                </div>
                            )}
                            {/* Бейдж "N/M" вынесен из потока (absolute), иначе
                                текст "Выбери правильный ответ:" центрировался
                                относительно ОСТАВШЕГОСЯ места (после бейджа),
                                а не всей строки, и визуально съезжал вправо —
                                баг, найденный пользователем. */}
                            <div className="relative w-full flex items-center justify-center">
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                    style={{
                                        borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                        backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                        color: GGEGE_PALETTE.purple.button,
                                    }}
                                >
                                    <span>{i + 1}</span>
                                    <span className="opacity-50 font-normal">/</span>
                                    <span>{trials.length}</span>
                                </div>
                                <p className="text-base md:text-lg text-[#F2F7FB] text-center">
                                    Выбери правильный ответ:
                                </p>
                            </div>
                            <DiagramBlock>
                                <PowFormula a={t.a} n={t.n} b={t.b} m={t.m} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div className="drop-in-options grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => {
                                            const isWrongTriedOpt = wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <MiniAnswerButton
                                                    key={oi}
                                                    option={opt}
                                                    state={isWrongTriedOpt ? 'wrong' : 'idle'}
                                                    disabled={isWrongTriedOpt}
                                                    onClick={() => handleOptionClick(opt)}
                                                />
                                            )
                                        })}
                                    </div>
                                    {wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        null
                                    )}
                                </>
                            )}
                            {isDone && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => {
                                            const isCorrectOpt = sameOption(opt, correctOption)
                                            const isWrongTriedOpt = isCurrent && wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <MiniAnswerButton
                                                    key={oi}
                                                    option={opt}
                                                    disabled
                                                    state={isCorrectOpt ? 'correct' : (isWrongTriedOpt ? 'wrong' : 'idle')}
                                                />
                                            )
                                        })}
                                    </div>
                                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                        {pickTrialFeedback(t)}
                                    </FieryFeedbackBanner>
                                </>
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
                        {stepLabel}
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
