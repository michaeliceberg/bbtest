'use client'

// Блок «Производная» (ЕГЭ №9) → урок «Как считать производную» (SCENEWALK), оформлен по шаблону логарифмов
// (logNegative.tsx: FlipDemo / RootDemo): вступление печатными строками, маркер и качающаяся стрелка на нужном месте,
// кнопка, потом копия справа и число летит по параболе. Все числа белые, цвет только у маркера.
//   DropDemo: (c·tⁿ)′ → степень-копия спускается вниз налево, умножается на число, сама степень −1;
//   DerivBuild: ученик сам собирает ответ по этапам (число впереди → новая степень);
//   PolyDerivative: фигурная скобка под слагаемым едет вправо, производная каждого — выбором.
// Всё идёт строго по очереди: текст печатается → пауза → маркер → следующая строка → кнопка.

import { Fragment, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { PlainMath } from '@/components/geometry/plain-math'
import 'katex/dist/katex.min.css'
import { ChoiceGame, Note, type Scene } from '@/components/geometry/scene-engine'
import { walkthroughButtonClass, walkthroughButtonStyle } from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { playJustClick, playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { dessert } from './logHelpers'
import type { SceneLesson } from './types'

const INK = '#F2F7FB'
const KEY = hexToRgba(GGEGE_PALETTE.blue.button, 0.3)       // маркер на степени
const WARN = hexToRgba(GGEGE_PALETTE.orange.button, 0.35)   // маркер на «−1»
const SPRING = { type: 'spring' as const, stiffness: 320, damping: 14 }
const POP = { type: 'spring' as const, stiffness: 320, damping: 11 }

// Печатная строка с маркером на ключевых словах (как в логарифмах): печатаем, после печати подсвечиваем
type Seg = { t: string; c?: string }
const MarkSay = ({ segs, onDone }: { segs: Seg[]; onDone: () => void }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-center font-black text-[#F2F7FB] text-lg md:text-xl">
            {typed
                ? segs.map((g, i) => g.c
                    ? <span key={i} className="rounded-[4px] px-[5px] py-[1px] text-[#F2F7FB]" style={{ backgroundColor: g.c }}>{g.t}</span>
                    : <Fragment key={i}>{g.t}</Fragment>)
                : <Typewriter text={segs.map((g) => g.t).join('')} onDone={() => { setTyped(true); setTimeout(onDone, 350) }} />}
        </div>
    )
}

// Степень как HTML (основание + показатель): для перелёта нужны настоящие элементы, а не KaTeX
const Sup = ({ children, innerRef, style, className }: { children: React.ReactNode; innerRef?: React.Ref<HTMLSpanElement>; style?: React.CSSProperties; className?: string }) => (
    <span ref={innerRef} className={cn('ml-0.5 mt-[-0.05em] inline-block text-[0.55em] leading-none self-start', className)} style={style}>{children}</span>
)

const Arrow = () => (
    <motion.span className="absolute left-1/2 -top-[42px] -ml-[15px] block" style={{ color: GGEGE_PALETTE.blue.button }}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: [0, 9, 0] }}
        transition={{ opacity: { duration: 0.3 }, y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } }}>
        <ArrowDown size={30} strokeWidth={3.5} />
    </motion.span>
)

// Летящая копия числа: поверх всего, двигается только transform
const FlyingNum = ({ from, x, y, scale, text }: { from: { left: number; top: number }; x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number>; text: string }) => (
    <span className="pointer-events-none absolute flex h-0 w-0 items-center justify-center" style={{ left: from.left, top: from.top }}>
        <motion.span className="inline-block px-[3px] font-black text-[#F2F7FB]" style={{ x, y, scale }}>{text}</motion.span>
    </span>
)

// ===== (c·tⁿ)′: копия степени спускается вниз налево, умножается на число, сама степень −1 =====
const ORDER = ['idle', 'copy', 'fly', 'land', 'dot', 'prod', 'minus', 'newexp', 'simp', 'done'] as const
type Phase = typeof ORDER[number]
type DropProps = { c: number; n: number; label: string; lines?: [Seg[], Seg[]]; intro?: boolean; onDone: () => void }

const DEFAULT_LINES: [Seg[], Seg[]] = [
    [{ t: 'Смотрим на ' }, { t: 'степень', c: KEY }],
    [{ t: 'Она ' }, { t: 'спускается вниз налево', c: KEY }],
]

export const DropDemo = ({ c, n, label, lines = DEFAULT_LINES, intro, onDone }: DropProps) => {
    const hasC = c !== 1
    const prod = n * c
    const newExp = n - 1
    const ghost = n <= 1                       // степень 1 и 0 не пишут: показываем бледной
    const src = useRef<HTMLSpanElement>(null)  // степень в правой копии
    const dst = useRef<HTMLSpanElement>(null)  // место перед t, куда она спускается
    const row = useRef<HTMLDivElement>(null)
    const [from, setFrom] = useState({ left: 0, top: 0 })
    const d = useRef({ x: 0, y: 0 })
    const [phase, setPhase] = useState<Phase>('idle')
    const [caption, setCaption] = useState('')
    // ip: -1 пауза, 0 печатается первая строка, 1 маркер и стрелка, 2 печатается вторая строка, 3 кнопка
    const [ip, setIp] = useState(intro ? -1 : 3)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    useEffect(() => {
        const ts = timers.current
        if (!intro) return () => ts.forEach(clearTimeout)
        const t = setTimeout(() => setIp(0), 800)
        return () => { clearTimeout(t); ts.forEach(clearTimeout) }
    }, [intro])
    const later = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)) }

    const p = useMotionValue(0)
    const x = useTransform(p, (v) => d.current.x * v)
    const y = useTransform(p, (v) => d.current.y * v - 56 * 4 * v * (1 - v))
    const sc = useTransform(p, (v) => 0.55 + 0.45 * v)

    const go = () => {
        if (phase !== 'idle' || ip < 3) return
        playJustClick()
        let t = 0
        const at = (ph: Phase, cap = '') => { later(t, () => { setPhase(ph); setCaption(cap) }) }
        at('copy')
        t += 1000
        later(t, () => {
            const s = src.current, e = dst.current, r = row.current
            if (!s || !e || !r) return
            const sr = s.getBoundingClientRect(), er = e.getBoundingClientRect(), rr = r.getBoundingClientRect()
            d.current = { x: er.left + er.width / 2 - (sr.left + sr.width / 2), y: er.top + er.height / 2 - (sr.top + sr.height / 2) }
            setFrom({ left: sr.left + sr.width / 2 - rr.left, top: sr.top + sr.height / 2 - rr.top })
            setPhase('fly')
            animate(p, 1, { duration: 1.1, ease: 'easeInOut' })
        })
        t += 1200
        at('land', hasC ? 'Умножаем её на число впереди' : '')
        if (hasC) {
            t += 1300; at('dot', 'Умножаем её на число впереди')
            t += 1200; at('prod', `${n} · ${c} = ${prod}`)
        }
        if (n > 0) {
            t += 1500; at('minus', 'А сама степень на один меньше')
            t += 1400; at('newexp', `${n} − 1 = ${newExp}`)
            if (newExp <= 1) { t += 1500; at('simp', newExp === 1 ? 't¹ — это просто t' : 't⁰ = 1, поэтому t исчезает') }
        } else {
            t += 1400; at('simp', 'Ноль на что ни умножай, будет ноль')
        }
        t += 1100; at('done')
        later(t + 600, onDone)
    }

    const idx = ORDER.indexOf(phase)
    const shown = idx >= 1
    const landed = idx >= 3
    const flying = phase === 'fly'
    const mark = intro ? ip >= 1 : true
    // Что осталось от t и степени в ответе
    const showT = n === 0 ? idx < 5 : !(idx >= 8 && newExp === 0)
    const showExp = n === 0 ? idx < 5 : !(idx >= 8 && newExp <= 1)
    const expOpacity = ghost && idx < 6 ? 0.4 : 1
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div ref={row} className="relative flex items-center justify-center gap-2 font-black text-[#F2F7FB] text-[34px] md:text-5xl h-[170px] max-w-full">
                <span className="inline-flex items-center whitespace-nowrap">
                    <span>(</span>
                    {hasC && <span>{c}</span>}
                    <span className="italic" style={{ opacity: n === 0 ? 0.4 : 1 }}>t</span>
                    <Sup className="relative rounded-[4px] px-[3px] transition-colors duration-500" style={{ backgroundColor: mark ? KEY : 'transparent', opacity: ghost ? 0.4 + (mark ? 0.6 : 0) : 1 }}>
                        {n}
                        {mark && phase === 'idle' && ip >= 1 && <Arrow />}
                    </Sup>
                    <span>)′</span>
                </span>
                <span className="px-1">=</span>
                <span className="inline-flex items-center whitespace-nowrap" style={{ visibility: shown ? 'visible' : 'hidden' }}>
                    {/* место для числа, которое спустится; потом «· число» или произведение */}
                    {hasC && idx >= 5 ? (
                        <motion.span key="prod" className="inline-block" initial={{ scale: 2.4 }} animate={{ scale: 1 }} transition={POP}>{prod}</motion.span>
                    ) : (
                        <>
                            <span ref={dst} className="inline-block" style={{ opacity: landed ? 1 : 0 }}>{n}</span>
                            {hasC && (
                                <>
                                    <span className="mx-1.5 text-[#8FA3AE]" style={{ opacity: idx >= 4 ? 1 : 0 }}>·</span>
                                    <motion.span className="inline-block" initial={false} animate={{ scale: shown ? 1 : 0.4, opacity: shown ? 1 : 0 }} transition={SPRING}>{c}</motion.span>
                                </>
                            )}
                        </>
                    )}
                    {showT && <motion.span className="italic inline-block" initial={false} animate={{ scale: shown ? 1 : 0.4, opacity: shown ? (n === 0 ? 0.4 : 1) : 0 }} transition={SPRING}>t</motion.span>}
                    {showExp && (
                        <Sup innerRef={src} style={{ opacity: expOpacity }}>
                            {idx >= 7 ? (
                                <motion.span key="ne" className="inline-block" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={POP}>{newExp}</motion.span>
                            ) : idx === 6 ? (
                                <>
                                    {n}
                                    <motion.span className="ml-[2px] inline-block rounded-[4px] px-[3px]" style={{ backgroundColor: WARN }} initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>−1</motion.span>
                                </>
                            ) : n}
                        </Sup>
                    )}
                </span>
                {flying && <FlyingNum from={from} x={x} y={y} scale={sc} text={String(n)} />}
            </div>
            {intro && ip >= 0 && (
                <MarkSay key="l1" segs={lines[0]} onDone={() => { setTimeout(() => setIp(1), 600); setTimeout(() => setIp(2), 1700) }} />
            )}
            {intro && ip >= 2 && (
                <MarkSay key="l2" segs={lines[1]} onDone={() => setTimeout(() => setIp(3), 600)} />
            )}
            {phase === 'idle' && ip >= 3 && (
                <div className="w-full flex">
                    <button type="button" className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)} onClick={go}>{label}</button>
                </div>
            )}
            {phase !== 'idle' && (
                <div className="min-h-[30px] w-full text-center text-lg font-black text-[#F2F7FB]">
                    {caption && <motion.div key={caption} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{caption}</motion.div>}
                </div>
            )}
        </div>
    )
}

// ===== Ученик собирает ответ сам: сначала число впереди, потом новая степень =====
const slotBox = (child: React.ReactNode, small?: boolean) => (
    <span className={cn('inline-flex items-center justify-center rounded-xl border-2 border-dashed px-2', small ? 'h-[30px] min-w-[30px] text-xl' : 'h-[54px] min-w-[54px] text-3xl')}
        style={{ borderColor: GGEGE_PALETTE.purple.button, backgroundColor: '#161F23' }}>{child}</span>
)
const qMark = (
    <span className="animate-slot-label" style={{ ['--slot-c' as string]: GGEGE_PALETTE.purple.button } as React.CSSProperties}>?</span>
)
type BuildProps = { c: number; n: number; coefOpts: string[]; expOpts: string[]; hint1: string; hint2: string; onDone: () => void }
export const DerivBuild = ({ c, n, coefOpts, expOpts, hint1, hint2, onDone }: BuildProps) => {
    const [stage, setStage] = useState<0 | 1 | 2>(0) // что уже стоит в ответе
    const [step, setStep] = useState<0 | 1>(0)       // какой вопрос на экране
    const hasC = c !== 1
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 font-black text-[#F2F7FB] text-[34px] min-h-[110px] whitespace-nowrap">
                <span className="inline-flex items-center">
                    <span>(</span>{hasC && <span>{c}</span>}<span className="italic">t</span><Sup>{n}</Sup><span>)′ =</span>
                </span>
                {stage === 0 ? slotBox(qMark) : <motion.span className="inline-block" initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={POP}>{n * c}</motion.span>}
                <span className="inline-flex items-start">
                    <span className="italic">t</span>
                    <Sup>{stage < 2 ? slotBox(stage === 0 ? <span className="opacity-30">?</span> : qMark, true) : (
                        <motion.span className="inline-block" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={POP}>{n - 1}</motion.span>
                    )}</Sup>
                </span>
            </div>
            {step === 0 && <ChoiceGame key="s0" onPick={() => setStage(1)} onDone={() => setStep(1)} rounds={[
                { prompt: 'Что встанет перед t?', options: coefOpts, correct: String(n * c), hint: hint1 },
            ]} />}
            {step === 1 && <ChoiceGame key="s1" onPick={() => setStage(2)} onDone={() => setTimeout(onDone, 300)} rounds={[
                { prompt: 'Какая теперь степень?', options: expOpts, correct: String(n - 1), hint: hint2 },
            ]} />}
        </div>
    )
}

// «Производная звучит страшно» + стикер персонажа в ужасе
const ScaryLine = ({ onDone }: { onDone: () => void }) => {
    const [typed, setTyped] = useState(false)
    useEffect(() => {
        if (!typed) return
        const t = setTimeout(onDone, 1800)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typed])
    return (
        <div className="w-full flex items-center justify-center gap-3">
            <div className="text-lg md:text-xl font-black text-[#F2F7FB]">
                <Typewriter text="Производная звучит страшно…" onDone={() => setTimeout(() => setTyped(true), 300)} />
            </div>
            <div className="w-24 h-24 shrink-0">
                {typed && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <motion.img src="/answer-meme-wrong/38.webp" alt="" className="w-full h-full object-contain"
                        initial={{ scale: 0, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={POP} />
                )}
            </div>
        </div>
    )
}

// ===== Многочлен: скобка под слагаемым, производная каждого — выбором =====
type Term = { sign: '+' | '−' | ''; c: number; n: number }
const TermView = ({ t, tight }: { t: Term; tight?: boolean }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        {t.sign && <span className={cn('text-[#8FA3AE]', tight ? 'mr-0.5' : 'mx-1.5')}>{t.sign}</span>}
        {(t.c !== 1 || t.n === 0) && <span>{t.c}</span>}
        {t.n > 0 && <span className="italic">t</span>}
        {t.n > 1 && <Sup className="self-auto align-super">{t.n}</Sup>}
    </span>
)
// '$-36t^2$' → { sign: '−', c: 36, n: 2 } — варианты рисуем тем же шрифтом, что и сам пример
const parseTerm = (o: string): Term => {
    const m = o.replace(/\$/g, '').match(/^(-?)(\d*)(t?)(?:\^(\d+))?$/)
    if (!m) return { sign: '', c: 0, n: 0 }
    const hasT = m[3] === 't'
    return { sign: m[1] ? '−' : '', c: m[2] ? Number(m[2]) : 1, n: hasT ? (m[4] ? Number(m[4]) : 1) : 0 }
}
type PolyStep = { term: Term; options: string[]; correct: string; hint: string; result: Term | null }
// Тайминги: ответ спускается под скобку → пауза → скобка едет к следующему слагаемому
const DROP_S = 0.9
const BRACE_MOVE_MS = 2000
export const PolyDerivative = ({ steps, onDone, finish }: { steps: PolyStep[]; onDone: () => void; finish: string }) => {
    const [i, setI] = useState(0)          // где сейчас скобка
    const [shown, setShown] = useState(0)  // сколько ответов уже записано
    const [wrong, setWrong] = useState<string[]>([])
    const finished = i >= steps.length
    const busy = shown > i
    useEffect(() => {
        if (!finished) return
        const t = setTimeout(onDone, 1600)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished])
    useEffect(() => {
        if (!busy) return
        const t = setTimeout(() => { setWrong([]); setI(shown) }, BRACE_MOVE_MS)
        return () => clearTimeout(t)
    }, [busy, shown])
    const pick = (o: string) => {
        if (finished || busy || wrong.includes(o)) return
        const s = steps[i]
        if (o === s.correct) {
            playJustClick(); showAnswerMeme(true)
            setShown(i + 1)
        } else { setWrong((w) => [...w, o]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    // Каждое слагаемое — свой столбик: сверху слагаемое, под ним скобка (если сейчас оно), ещё ниже — его производная.
    // Варианты порядка в steps[i].options перемешивает вызывающий (верный не первым).
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full overflow-x-auto overflow-y-hidden">
                <div className="mx-auto w-max flex items-start pt-1 font-bold text-[24px] md:text-[30px] text-[#F2F7FB]">
                    <div className="flex flex-col items-center">
                        <span className="mr-1 h-[1.6em] leading-[1.6em]">(</span>
                        <span className="h-8" />
                        <span className="mr-1 h-[1.6em] leading-[1.6em] text-[#8FA3AE]">=</span>
                    </div>
                    {steps.map((s, k) => {
                        const res = k < shown ? s.result : undefined
                        const isZero = k < shown && !s.result
                        return (
                            <div key={k} className="flex flex-col items-center">
                                <span className="h-[1.6em] leading-[1.6em] transition-opacity duration-300"
                                    style={{ opacity: finished || k === i ? 1 : k < i ? 0.4 : 0.75 }}>
                                    <TermView t={s.term} />
                                </span>
                                <span className="h-8 w-full">
                                    {k === i && !finished && (
                                        <motion.svg layoutId="poly-brace" className="h-8 w-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none"
                                            transition={{ layout: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }}>
                                            <path d="M 2 2 Q 2 12 14 12 L 40 12 Q 50 12 50 26 Q 50 12 60 12 L 86 12 Q 98 12 98 2" fill="none" stroke="#7dd3fc" strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                        </motion.svg>
                                    )}
                                </span>
                                <span className="h-[1.6em] leading-[1.6em]">
                                    {res && (
                                        <motion.span className="inline-block" initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                            transition={{ duration: DROP_S, ease: [0.2, 0.8, 0.3, 1] }}
                                            style={{ color: INK }}>
                                            <TermView t={k === 0 && res.sign === '+' ? { ...res, sign: '' } : res} />
                                        </motion.span>
                                    )}
                                    {isZero && (
                                        <motion.span initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: finished ? 0.25 : 1 }}
                                            transition={{ duration: DROP_S, ease: [0.2, 0.8, 0.3, 1] }}
                                            className={cn('inline-block', finished && 'line-through')}><span className="mx-1.5 text-[#8FA3AE]">+</span>0</motion.span>
                                    )}
                                </span>
                            </div>
                        )
                    })}
                    <div className="flex flex-col items-center">
                        <span className="ml-1 h-[1.6em] leading-[1.6em]">)′</span>
                    </div>
                </div>
            </div>
            {!finished && !busy && (
                <>
                    <div className="w-full text-center text-lg font-bold text-[#F2F7FB]">Производная слагаемого в скобке?</div>
                    <div key={i} className="drop-in-options grid w-full grid-cols-2 gap-3">
                        {steps[i].options.map((o) => {
                            const bad = wrong.includes(o)
                            return (
                                <button key={o} type="button" disabled={bad} onClick={() => pick(o)}
                                    className={cn('min-h-[56px] rounded-xl border-2 border-b-4 active:border-b-0 text-[24px] font-bold',
                                        bad ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB]')}>
                                    <TermView t={parseTerm(o)} tight />
                                </button>
                            )
                        })}
                    </div>
                    {wrong.length > 0 && <Note ok={false}><PlainMath>{steps[i].hint}</PlainMath></Note>}
                </>
            )}
            {busy && !finished && <div className="min-h-[148px]" />}
            {finished && <Note ok>{finish}</Note>}
        </div>
    )
}

const drop = (c: number, n: number, label: string, intro = false, lines?: [Seg[], Seg[]]) =>
    ({ t: 'custom' as const, render: (done: () => void) => <DropDemo c={c} n={n} label={label} intro={intro} lines={lines} onDone={done} /> })
const build = (c: number, n: number, coefOpts: string[], expOpts: string[], hint1: string, hint2: string) =>
    ({ t: 'custom' as const, render: (done: () => void) => <DerivBuild c={c} n={n} coefOpts={coefOpts} expOpts={expOpts} hint1={hint1} hint2={hint2} onDone={done} /> })

// Порядок вариантов перемешивает движок; здесь верный — первым для удобства автора
const POLY: PolyStep[] = [
    { term: { sign: '', c: 6, n: 5 }, options: ['$6t^4$', '$30t^4$', '$30t^5$', '$11t^4$'], correct: '$30t^4$', hint: '5 спускается: $5 \\cdot 6 = 30$, степень $5 - 1 = 4$', result: { sign: '', c: 30, n: 4 } },
    { term: { sign: '−', c: 12, n: 3 }, options: ['$-12t^2$', '$-36t^3$', '$-36t^2$', '$36t^2$'], correct: '$-36t^2$', hint: 'Минус остаётся. $3 \\cdot 12 = 36$, степень 2', result: { sign: '−', c: 36, n: 2 } },
    { term: { sign: '+', c: 4, n: 2 }, options: ['$4t$', '$8t^2$', '$8t$', '$2t$'], correct: '$8t$', hint: '$2 \\cdot 4 = 8$, а $t^1$ — это просто $t$', result: { sign: '+', c: 8, n: 1 } },
    { term: { sign: '−', c: 7, n: 1 }, options: ['$-7t$', '$7$', '$0$', '$-7$'], correct: '$-7$', hint: 'Просто стираем $t$, минус остаётся', result: { sign: '−', c: 7, n: 0 } },
    { term: { sign: '+', c: 9, n: 0 }, options: ['$9$', '$0$', '$9t$', '$1$'], correct: '$0$', hint: 'Число без $t$ не меняется. Производная 0', result: null },
]
const POLY2: PolyStep[] = [
    { term: { sign: '', c: 3, n: 4 }, options: ['$3t^3$', '$12t^4$', '$12t^3$', '$7t^3$'], correct: '$12t^3$', hint: '$4 \\cdot 3 = 12$, степень $4 - 1 = 3$', result: { sign: '', c: 12, n: 3 } },
    { term: { sign: '−', c: 2, n: 2 }, options: ['$-2t$', '$-4t^2$', '$4t$', '$-4t$'], correct: '$-4t$', hint: 'Минус остаётся. $2 \\cdot 2 = 4$, а $t^1$ — это $t$', result: { sign: '−', c: 4, n: 1 } },
    { term: { sign: '+', c: 5, n: 1 }, options: ['$5t$', '$1$', '$0$', '$5$'], correct: '$5$', hint: 'Просто стираем $t$', result: { sign: '+', c: 5, n: 0 } },
    { term: { sign: '−', c: 8, n: 0 }, options: ['$-8$', '$8$', '$0$', '$-8t$'], correct: '$0$', hint: 'Число само по себе — ноль', result: null },
]

const EGE_TEXT = 'Материальная точка движется по закону\n{{law|x(t) = t³ − 6t² + 2t + 5}}\n(x — путь в метрах, t — время в секундах)\nНайдите {{what|скорость}} точки (в м/с)\nв момент времени {{moment|t = 4 с}}'

const scenes: Scene[] = [
    {
        title: 'Степень спускается', next: 'Вижу фокус', parts: [
            { t: 'say', text: '¡Hola, амиго!' },
            { t: 'pause', ms: 700 },
            { t: 'custom', render: (done) => <ScaryLine onDone={done} /> },
            { t: 'say', text: 'А считается легко' },
            { t: 'pause', ms: 500 },
            drop(1, 4, 'Спустить степень', true),
            { t: 'ack', label: 'Понял, степень спускается' },
            { t: 'say', text: 'Ещё раз, теперь сам' },
            drop(1, 5, 'Спустить степень'),
            { t: 'remember', title: 'ЗАПОМНИ', lines: ["$(t^n)' = n \\cdot t^{n-1}$", 'Степень спускается вниз налево', 'А сама степень уменьшается на 1'] },
        ],
    },
    {
        title: 'С числом впереди', next: 'Умножаем на число', parts: [
            { t: 'say', text: 'А если впереди есть число?' },
            { t: 'pause', ms: 600 },
            drop(4, 6, 'Спустить степень', true, [
                [{ t: 'Степень ' }, { t: 'спускается', c: KEY }, { t: ', как и раньше' }],
                [{ t: 'И ' }, { t: 'умножается на число', c: KEY }, { t: ' впереди' }],
            ]),
            { t: 'ack', label: 'Понял, степень умножается на число' },
            { t: 'say', text: 'Теперь собери сам' },
            build(3, 4, ['3', '4', '7', '12'], ['3', '4', '5'], 'Степень умножается на число: $4 \\cdot 3$', 'Степень уменьшается на 1: $4 - 1$'),
            build(5, 3, ['8', '15', '5', '3'], ['2', '3', '4'], 'Степень умножается на число: $3 \\cdot 5$', 'Степень уменьшается на 1: $3 - 1$'),
            build(2, 7, ['14', '9', '2', '7'], ['6', '7', '8'], 'Степень умножается на число: $7 \\cdot 2$', 'Степень уменьшается на 1: $7 - 1$'),
            { t: 'remember', title: 'ЗАПОМНИ', lines: ["$(c \\cdot t^n)' = n \\cdot c \\cdot t^{n-1}$", 'Степень спускается и умножается на число', 'А сама степень уменьшается на 1'] },
        ],
    },
    {
        title: 'Разминка', next: 'Разогрелся', parts: [
            { t: 'say', text: 'Разомнёмся' },
            {
                t: 'choice', rounds: [
                    { prompt: "$(t^5)' = ?$", options: ['$5t^4$', '$t^4$', '$5t^5$'], correct: '$5t^4$', hint: '5 спускается вниз, степень $5 - 1$', ok: '$5t^4$' },
                    { prompt: "$(2t^3)' = ?$", options: ['$6t^2$', '$2t^2$', '$6t^3$'], correct: '$6t^2$', hint: '$3 \\cdot 2 = 6$, степень $3 - 1 = 2$', ok: '$6t^2$' },
                    { prompt: "$(3t^4)' = ?$", options: ['$12t^3$', '$7t^3$', '$12t^4$'], correct: '$12t^3$', hint: 'Умножаем, а не складываем: $4 \\cdot 3$', ok: '$12t^3$' },
                    { prompt: 'Степень спустилась вниз налево. Что делаем с той, что осталась?', options: ['Уменьшаем на 1', 'Объявляем в розыск', 'Сдаём в бюро находок', 'Делаем вид, что так и было'], correct: 'Уменьшаем на 1', hint: 'Розыск не поможет. Степень уменьшается на 1', ok: 'Минус один, и порядок' },
                    { prompt: "$(t^7)' = ?$", options: ['$7t^6$', '$6t^7$', '$7t^8$'], correct: '$7t^6$', hint: 'Степень УМЕНЬШАЕТСЯ на 1, а не растёт', ok: '$7t^6$. ¡Muy bien!' },
                ],
            },
        ],
    },
    {
        title: 'А квадрат?', next: 'Квадрат сдался', parts: [
            { t: 'say', text: 'Теперь квадрат' },
            {
                t: 'choice', rounds: [
                    { prompt: "$(5t^2)' = ?$", options: ['$10t$', '$5t$', '$10t^2$', '$2t$'], correct: '$10t$', hint: '$2 \\cdot 5 = 10$, а $t^1$ — просто $t$', ok: '$10t$. Степень 1 не пишут' },
                ],
            },
        ],
    },
    {
        title: 'Просто t', next: 'Стираю t', parts: [
            { t: 'say', text: 'А если просто $10t$?' },
            { t: 'pause', ms: 500 },
            drop(10, 1, 'Спустить степень', true, [
                [{ t: 'У ' }, { t: 't', c: KEY }, { t: ' есть невидимая ' }, { t: 'степень 1', c: KEY }],
                [{ t: 'Она спускается, и ' }, { t: 't исчезает', c: KEY }],
            ]),
            { t: 'ack', label: 'Понял, t просто исчезает' },
            { t: 'remember', title: 'ЛАЙФХАК', lines: ["$(k \\cdot t)' = k$", "Просто стираем $t$: $(7t)' = 7$"] },
            {
                t: 'choice', label: 'Стираем t', rounds: [
                    { prompt: "$(6t)' = ?$", options: ['$6$', '$6t$', '$0$'], correct: '$6$', hint: 'Стираем $t$, остаётся число', ok: '$6$' },
                    { prompt: "$(-9t)' = ?$", options: ['$-9$', '$9$', '$-9t$'], correct: '$-9$', hint: 'Минус остаётся, $t$ стираем', ok: '$-9$' },
                ],
            },
        ],
    },
    {
        title: 'Просто число', next: 'Ноль понял', parts: [
            { t: 'say', text: 'А производная от числа 10?' },
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'Хитрость: $10 = 10 \\cdot t^0$, ведь $t^0 = 1$' },
            drop(10, 0, 'Спустить степень', true, [
                [{ t: 'Спрятанная ' }, { t: 'степень 0', c: KEY }],
                [{ t: 'Она спускается, и ' }, { t: 'всё умножается на 0', c: KEY }],
            ]),
            { t: 'ack', label: 'Понял, у числа производная 0' },
            { t: 'say', text: 'Число не меняется никогда, как Команданте на посту' },
            { t: 'remember', title: 'ЗАПОМНИ', lines: ['Производная числа $= 0$', "$(10)' = 0, (-3)' = 0$"] },
            {
                t: 'choice', label: 'Числа', rounds: [
                    { prompt: "$(25)' = ?$", options: ['$0$', '$25$', '$1$'], correct: '$0$', hint: 'Число без $t$ не меняется', ok: '$0$' },
                    { prompt: "$(-4)' = ?$", options: ['$0$', '$-4$', '$4$'], correct: '$0$', hint: 'Любое число даёт 0', ok: '$0$' },
                    { prompt: 'Число решило стать переменной и сменить имя. Что с производной?', options: ['Всё равно ноль', 'Станет единицей', 'Уйдёт в отпуск', 'Сменит имя тоже'], correct: 'Всё равно ноль', hint: 'Число остаётся числом', ok: 'Паспорт не поможет, ноль' },
                ],
            },
        ],
    },
    {
        title: 'Длинный пример', next: 'Монстр побеждён', parts: [
            { t: 'say', text: 'А теперь босс-пример' },
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'Считаем каждое слагаемое отдельно' },
            { t: 'custom', render: (done) => <PolyDerivative steps={POLY} finish="Каждое слагаемое отдельно, и ответ собран. ¡Perfecto!" onDone={done} /> },
            { t: 'ack', label: 'Понял, считаем по слагаемым' },
            { t: 'say', text: 'Ещё один, смелее' },
            { t: 'custom', render: (done) => <PolyDerivative steps={POLY2} finish="Монстр побеждён. ¡Hasta la victoria!" onDone={done} /> },
        ],
    },
    {
        title: 'Как в ЕГЭ', next: 'Решил как в ЕГЭ', parts: [
            { t: 'say', text: 'Производная в ЕГЭ — это скорость' },
            { t: 'pause', ms: 500 },
            {
                t: 'ege', num: 9, text: EGE_TEXT, start: 'Найти скорость',
                quiz: [
                    { focus: 'what', prompt: 'Скорость — это ... положения', options: ['производная', 'сама функция', 'обратная функция'], correct: 'производная', hint: 'Скорость — это производная пути по времени', ok: 'v = x′' },
                    { focus: 'law', prompt: "$(t^3 - 6t^2 + 2t + 5)' = ?$", options: ['$3t^2 - 12t + 2$', '$3t^2 - 6t + 2$', '$3t^2 - 12t + 2 + 5$', '$t^2 - 12t + 2$'], correct: '$3t^2 - 12t + 2$', hint: 'По слагаемым: $3t^2$, $-12t$, $2$, а пятёрка даёт 0', ok: '$v = 3t^2 - 12t + 2$' },
                    { focus: 'moment', prompt: '$t = 4$: $3 \\cdot 16 - 12 \\cdot 4 + 2 = \\ ?$', options: ['$2$', '$-2$', '$98$', '$50$'], correct: '$2$', hint: '$48 - 48 + 2$', ok: 'Ответ: 2' },
                ],
            },
        ],
    },
]

const T = (text: string, options: string[], answer: string, hint: string, tag = 'Производная') => ({ tag, text, options, answer, hint })

export const DERIV_BASIC: SceneLesson = {
    question: 'Как считать производную',
    mascot: 'Производная — это фокус',
    last: 'Производные мои!',
    plainMath: true,
    scenes,
    trials: [
        T("$(t^6)' = ?$", ['$6t^5$', '$t^5$', '$6t^6$', '$5t^6$'], '$6t^5$', 'Степень спускается и уменьшается на 1'),
        T("$(3t^5)' = ?$", ['$15t^4$', '$8t^4$', '$15t^5$', '$3t^4$'], '$15t^4$', '$5 \\cdot 3 = 15$, степень 4'),
        T("$(7t)' = ?$", ['$7$', '$7t$', '$0$', '$1$'], '$7$', 'Просто стираем $t$'),
        T("$(15)' = ?$", ['$0$', '$15$', '$1$', '$15t$'], '$0$', 'Число не меняется: производная 0'),
        T('Степень спустилась, а коэффициент ревнует. Что делаем?', ['Перемножаем их', 'Мирим через общего друга', 'Ставим между ними стенку', 'Пишем в разные тетради'], 'Перемножаем их', 'Дружим по-математически: степень умножается на число', 'Подвох'),
        T("$(2t^3 - 5t + 4)' = ?$", ['$6t^2 - 5$', '$6t^2 - 5t$', '$6t^2 - 5 + 4$', '$2t^2 - 5$'], '$6t^2 - 5$', 'Каждое слагаемое отдельно, а 4 даёт 0'),
        T("$(t^4 + 3t^2)' = ?$", ['$4t^3 + 6t$', '$4t^3 + 3t$', '$4t^3 + 6t^2$', '$t^3 + 6t$'], '$4t^3 + 6t$', '$(3t^2)\' = 6t$'),
        T('Скорость точки $x(t) = t^2 + 3t$ при $t = 2$', ['$7$', '$10$', '$4$', '$5$'], '$7$', '$x\' = 2t + 3$, подставляем $t = 2$: $4 + 3$', 'Как в ЕГЭ'),
        dessert('производных'),
    ],
}
