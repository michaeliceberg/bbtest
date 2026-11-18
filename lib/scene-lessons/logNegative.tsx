// «Отрицательные степени в логарифмах»: сначала напоминаем степени (минус = перевёртыш, корень = дробная степень,
// aᵐ/ⁿ = ⁿ√aᵐ, a⁰ = 1, комбо минус + дробь), потом логарифмы от дробей и корней.
// Переделка по правилам step-by-step: маленькие порции, ack-тезисы, мини-игры вместо чтения, шутки, перелёт числа в знаменатель.
import { Fragment, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import type { SceneLesson } from './types'
import { dessert, Fig } from './logHelpers'
import { ChoiceGame } from '@/components/geometry/scene-engine'
import { MathText } from '@/components/geometry/plain-math'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Typewriter } from '@/components/geometry/Typewriter'
import { walkthroughButtonClass, walkthroughButtonStyle } from '@/components/geometry/WalkthroughLog'
import { playJustClick } from '@/lib/sound'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Один спокойный цвет маркера для обеих половин «минус в степени = опустить в знаменатель»
const KEY = hexToRgba(GGEGE_PALETTE.blue.button, 0.3)

// Печатная строка с выделением ключевых слов маркером (текстовыделение 2.0): печатаем обычным текстом,
// после печати подсвечиваем сегменты с mark (цвет роли из палитры, тёмный текст).
const MarkSay = ({ segs, onDone }: { segs: { t: string; c?: string }[]; onDone: () => void }) => {
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
const fig = (tex: string) => ({ t: 'fig' as const, node: <Fig tex={tex} /> })
const markSay = (segs: { t: string; c?: string }[]) => ({ t: 'custom' as const, render: (done: () => void) => <MarkSay segs={segs} onDone={done} /> })

// Степень как HTML: основание + показатель; для перелёта нужны настоящие элементы, а не KaTeX.
const Pw = ({ b, children }: { b: string; children: React.ReactNode }) => (
    <span className="inline-flex items-start leading-none">
        <span>{b}</span>
        <span className="ml-0.5 mt-[-0.05em] text-[0.55em] leading-none">{children}</span>
    </span>
)

// «Перевёртыш»: ученик нажимает кнопку. Справа появляется копия a⁻ⁿ, потом она с отскоком опускается вниз,
// минус исчезает, рисуется черта и сверху появляется единица: получается 1 / aⁿ. Слева a⁻ⁿ остаётся.
const SPRING = { type: 'spring' as const, stiffness: 320, damping: 14 }
const FlipDemo = ({ b, n, label, intro, onDone }: { b: string; n: string; label: string; intro?: boolean; onDone: () => void }) => {
    const bar = useRef<HTMLSpanElement>(null)
    const dst = useRef<HTMLSpanElement>(null)
    const [phase, setPhase] = useState<'idle' | 'copy' | 'drop' | 'plus' | 'gone' | 'frac'>('idle')
    const yv = useMotionValue(0)
    // Вступление: равенство уже на экране → «что значит минус в степени?» → маркер на показателе → «значит надо опустить» → кнопка.
    // ip: -1 пауза, 0 печатается первая строка, 1 маркер на показателе, 2 печатается вторая строка, 3 кнопка.
    const [ip, setIp] = useState(intro ? -1 : 3)
    useEffect(() => {
        if (!intro) return
        const t = setTimeout(() => setIp(0), 800)
        return () => clearTimeout(t)
    }, [intro])
    const go = () => {
        if (phase !== 'idle' || ip < 3 || !bar.current || !dst.current) return
        playJustClick()
        const bb = bar.current.getBoundingClientRect(), dd = dst.current.getBoundingClientRect()
        // Копия сначала стоит на уровне черты (рядом с исходной степенью), потом падает в знаменатель.
        yv.set((bb.top + bb.height / 2) - (dd.top + dd.height / 2))
        setPhase('copy')
        setTimeout(() => {
            setPhase('drop')
            animate(yv, 0, { type: 'spring', stiffness: 220, damping: 10 })
        }, 900)
        setTimeout(() => setPhase('plus'), 1800)
        setTimeout(() => setPhase('gone'), 2800)
        setTimeout(() => setPhase('frac'), 3500)
        setTimeout(onDone, 4700)
    }
    const shown = phase !== 'idle'
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4 text-6xl font-black text-[#F2F7FB] h-[190px]">
                <Pw b={b}>
                    <span className="relative inline-block rounded-[4px] px-[3px] transition-colors duration-500" style={{ backgroundColor: ip >= 1 ? KEY : 'transparent' }}>
                        −{n}
                        {ip >= 1 && phase === 'idle' && (
                            <motion.span className="absolute left-1/2 -top-[46px] -ml-[17px] block" style={{ color: GGEGE_PALETTE.blue.button }}
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: [0, 9, 0] }}
                                transition={{ opacity: { duration: 0.3 }, y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } }}>
                                <ArrowDown size={34} strokeWidth={3.5} />
                            </motion.span>
                        )}
                    </span>
                </Pw>
                <span>=</span>
                <span className="inline-flex flex-col items-center gap-1" style={{ visibility: shown ? 'visible' : 'hidden' }}>
                    <motion.span className="inline-block" initial={false} animate={{ scale: phase === 'frac' ? 1 : 0, opacity: phase === 'frac' ? 1 : 0 }} transition={SPRING}>1</motion.span>
                    <motion.span ref={bar} className="block h-[4px] w-full rounded-full bg-[#F2F7FB] origin-center" initial={false} animate={{ scaleX: phase === 'frac' ? 1 : 0 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
                    <motion.span ref={dst} className="inline-block" style={{ y: yv }} initial={false} animate={{ scale: shown ? 1 : 0.5, opacity: shown ? 1 : 0 }} transition={SPRING}>
                        <Pw b={b}>
                            <span className="inline-block rounded-[4px] px-[3px] transition-colors duration-500" style={{ backgroundColor: phase === 'frac' ? 'transparent' : KEY }}>
                            <motion.span key={phase === 'plus' || phase === 'gone' || phase === 'frac' ? 'p' : 'm'} className="inline-block overflow-hidden whitespace-nowrap align-top"
                                initial={phase === 'plus' ? { scale: 0.2, opacity: 0 } : false}
                                animate={phase === 'gone' || phase === 'frac' ? { opacity: 0, scale: 0, width: 0 } : { opacity: 1, scale: 1 }}
                                transition={phase === 'plus' ? { type: 'spring', stiffness: 380, damping: 9 } : { duration: 0.4 }}>
                                {phase === 'plus' || phase === 'gone' || phase === 'frac' ? '+' : '−'}
                            </motion.span>
                            {n}
                            </span>
                        </Pw>
                    </motion.span>
                </span>
            </div>
            {intro && ip >= 0 && (
                <MarkSay key="l1" segs={[{ t: 'Что значит ' }, { t: 'минус в степени', c: KEY }, { t: '?' }]}
                    onDone={() => { setTimeout(() => setIp(1), 600); setTimeout(() => setIp(2), 1700) }} />
            )}
            {intro && ip >= 2 && (
                <MarkSay key="l2" segs={[{ t: 'Значит надо ' }, { t: 'опустить в знаменатель', c: KEY }]}
                    onDone={() => setTimeout(() => setIp(3), 600)} />
            )}
            {phase === 'idle' && ip >= 3 && (
                <div className="w-full flex">
                    <button type="button" className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)} onClick={go}>{label}</button>
                </div>
            )}
        </div>
    )
}
const flip = (b: string, n: string, label: string, intro = false) => ({ t: 'custom' as const, render: (done: () => void) => <FlipDemo b={b} n={n} label={label} intro={intro} onDone={done} /> })

// Мини-игра «опусти сам»: сначала в ответе только «?», нажимаем «опустить в знаменатель» — сверху прилетает единица,
// потом выбираем, что осталось внизу. Вариантов мало и они похожи, чтобы внимание не разбегалось.
const SinkBuild = ({ onDone }: { onDone: () => void }) => {
    const [stage, setStage] = useState<0 | 1 | 2>(0) // что показано в уравнении
    const [step, setStep] = useState<0 | 1>(0) // какой вопрос сейчас на экране
    const pop = { type: 'spring' as const, stiffness: 380, damping: 12 }
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-center gap-3 text-5xl font-black text-[#F2F7FB] min-h-[150px]">
                <MathText>{'$3^{-2} =$'}</MathText>
                {stage === 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[56px] h-[56px] px-2 rounded-xl border-2 border-dashed text-4xl" style={{ borderColor: GGEGE_PALETTE.purple.button, backgroundColor: '#161F23' }}><span className="animate-slot-label" style={{ ['--slot-c' as string]: GGEGE_PALETTE.purple.button } as React.CSSProperties}>?</span></span>
                ) : (
                    <span className="inline-flex flex-col items-center gap-1">
                        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={pop}>1</motion.span>
                        <span className="block h-[4px] w-full rounded-full bg-[#F2F7FB]" />
                        {stage === 1
                            ? <span className="inline-flex items-center justify-center min-w-[56px] h-[56px] px-2 rounded-xl border-2 border-dashed text-4xl" style={{ borderColor: GGEGE_PALETTE.purple.button, backgroundColor: '#161F23' }}><span className="animate-slot-label" style={{ ['--slot-c' as string]: GGEGE_PALETTE.purple.button } as React.CSSProperties}>?</span></span>
                            : <motion.span initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={pop}><MathText>{'$3^2$'}</MathText></motion.span>}
                    </span>
                )}
            </div>
            {step === 0 && <ChoiceGame key="s0" onPick={() => setStage(1)} onDone={() => setStep(1)} rounds={[
                { prompt: 'Что делаем с минусом?', options: ['Опустить в знаменатель', 'Поставить минус перед числом', 'Поменять знак ответа'], correct: 'Опустить в знаменатель', hint: 'Минус не делает число отрицательным. Он отправляет вниз' },
            ]} />}
            {step === 1 && <ChoiceGame key="s1" onPick={() => setStage(2)} onDone={() => setTimeout(onDone, 300)} rounds={[
                { prompt: 'Что стоит внизу?', options: ['$3^2$', '$-3^2$', '$2^3$'], correct: '$3^2$', hint: 'Едет вниз то же число, но без минуса' },
            ]} />}
        </div>
    )
}

// «Корень = степень»: слева ⁿ√a, ученик жмёт кнопку, справа появляется основание a, а число n у корня
// по дуге летит в показатель и становится знаменателем: появляется черта и сверху единица. Всё белое, цвет только у маркера.
const Radical = ({ idx, children, idxRef, idxMark, arrow, whole }: { idx: React.ReactNode; children: React.ReactNode; idxRef?: React.Ref<HTMLSpanElement>; idxMark?: boolean; arrow?: boolean; whole?: boolean }) => (
    <span className="inline-flex items-end leading-none rounded-[6px] px-1 transition-colors duration-500" style={{ backgroundColor: whole ? KEY : 'transparent' }}>
        <span ref={idxRef} className="relative inline-block self-start rounded-[4px] px-[3px] mr-[-4px] text-3xl leading-none transition-colors duration-500" style={{ backgroundColor: idxMark ? KEY : 'transparent' }}>
            {idx}
            {arrow && (
                <motion.span className="absolute left-1/2 -top-[46px] -ml-[17px] block" style={{ color: GGEGE_PALETTE.blue.button }}
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: [0, 9, 0] }}
                    transition={{ opacity: { duration: 0.3 }, y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } }}>
                    <ArrowDown size={34} strokeWidth={3.5} />
                </motion.span>
            )}
        </span>
        <svg viewBox="0 0 34 64" className="h-[64px] w-[26px] shrink-0 self-stretch" fill="none" stroke="#F2F7FB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="none" aria-hidden>
            <path d="M3 38 L10 33 L19 58 L32 4" />
        </svg>
        <span className="inline-block border-t-[5px] border-[#F2F7FB] px-1 pt-1 leading-none h-[64px]">{children}</span>
    </span>
)

const RootDemo = ({ a, n, label, intro, onDone }: { a: string; n: string; label: string; intro?: boolean; onDone: () => void }) => {
    const src = useRef<HTMLSpanElement>(null)
    const dst = useRef<HTMLSpanElement>(null)
    const d = useRef({ x: 0, y: 0 })
    const [phase, setPhase] = useState<'idle' | 'base' | 'fly' | 'frac'>('idle')
    // ip: -1 пауза, 0 печатается «корень — это дробная степень», 1 маркер на всём корне, 2 печатается «число у корня уезжает…»,
    // 3 маркер и стрелка на числе у корня, 4 кнопка
    const [ip, setIp] = useState(intro ? -1 : 4)
    useEffect(() => {
        if (!intro) { setIp(4); return }
        const t = setTimeout(() => setIp(0), 800)
        return () => clearTimeout(t)
    }, [intro])
    const p = useMotionValue(0)
    const x = useTransform(p, (v) => d.current.x * v)
    const y = useTransform(p, (v) => d.current.y * v - 60 * 4 * v * (1 - v))
    const sc = useTransform(p, (v) => 1 - 0.2 * v) // 30px у корня → 24px в показателе
    const go = () => {
        if (phase !== 'idle' || ip < 4 || !src.current || !dst.current) return
        playJustClick()
        const sr = src.current.getBoundingClientRect(), tr = dst.current.getBoundingClientRect()
        d.current = { x: tr.left + tr.width / 2 - (sr.left + sr.width / 2), y: tr.top + tr.height / 2 - (sr.top + sr.height / 2) }
        setPhase('base')
        setTimeout(() => {
            setPhase('fly')
            animate(p, 1, { duration: 1.1, ease: 'easeInOut', onComplete: () => setPhase('frac') })
        }, 1000)
        setTimeout(onDone, 3600)
    }
    const shown = phase !== 'idle'
    const landed = phase === 'frac'
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center gap-4 text-6xl font-black text-[#F2F7FB] h-[190px]">
                <Radical idx={n} idxRef={src} idxMark={ip >= 3} arrow={ip >= 3 && phase === 'idle'} whole={ip === 1}>{a}</Radical>
                <span>=</span>
                <span className="inline-flex items-start" style={{ visibility: shown ? 'visible' : 'hidden' }}>
                    <motion.span className="inline-block" initial={false} animate={{ scale: shown ? 1 : 0.4, opacity: shown ? 1 : 0 }} transition={SPRING}>{a}</motion.span>
                    <span className="ml-1 mt-[-30px] inline-flex flex-col items-center gap-[2px] text-2xl leading-none">
                        <motion.span className="inline-block" initial={false} animate={{ scale: landed ? 1 : 0, opacity: landed ? 1 : 0 }} transition={SPRING}>1</motion.span>
                        <motion.span className="block h-[3px] w-full rounded-full bg-[#F2F7FB] origin-center" initial={false} animate={{ scaleX: landed ? 1 : 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} />
                        <span ref={dst} className="inline-block px-[3px]" style={{ opacity: landed ? 1 : 0 }}>{n}</span>
                    </span>
                </span>
                {/* летящая копия числа: поверх всего, двигается только transform/opacity */}
                {phase === 'fly' && src.current && (
                    <FlyingNum from={src.current} x={x} y={y} scale={sc} text={n} />
                )}
            </div>
            {intro && ip >= 0 && (
                <MarkSay key="r0" segs={[{ t: 'Корень', c: KEY }, { t: ' — это ' }, { t: 'дробная степень', c: KEY }]}
                    onDone={() => { setTimeout(() => setIp(1), 400); setTimeout(() => setIp(2), 1700) }} />
            )}
            {intro && ip >= 2 && (
                <MarkSay key="r1" segs={[{ t: 'Число у корня', c: KEY }, { t: ' уезжает в показатель' }]}
                    onDone={() => { setTimeout(() => setIp(3), 500); setTimeout(() => setIp(4), 1500) }} />
            )}
            {phase === 'idle' && ip >= 4 && (
                <div className="w-full flex">
                    <button type="button" className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)} onClick={go}>{label}</button>
                </div>
            )}
        </div>
    )
}
const FlyingNum = ({ from, x, y, scale, text }: { from: HTMLElement; x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number>; text: string }) => {
    // позиция исходного числа относительно строки с равенством считается один раз при появлении копии
    const [pos] = useState(() => {
        const par = from.offsetParent as HTMLElement | null
        const fr = from.getBoundingClientRect(), pr = par?.getBoundingClientRect()
        return { left: pr ? fr.left - pr.left : 0, top: pr ? fr.top - pr.top : 0 }
    })
    return (
        <motion.span className="pointer-events-none absolute text-3xl leading-none px-[3px] font-black text-[#F2F7FB]" style={{ left: pos.left, top: pos.top, x, y, scale }}>{text}</motion.span>
    )
}
const rootDemo = (a: string, n: string, label: string, intro = false) => ({ t: 'custom' as const, render: (done: () => void) => <RootDemo a={a} n={n} label={label} intro={intro} onDone={done} /> })

// «Степень = корень» (обратное к RootDemo): слева a^(m/n). Знаменатель n копией летит в показатель корня,
// затем числитель m — в степень под корнем. Всё белое, цвет только у маркера, стрелка качается на текущем числе.
const PowerRootDemo = ({ a, m, n, intro, onDone }: { a: string; m: string; n: string; intro?: boolean; onDone: () => void }) => {
    const srcs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)] // знаменатель, числитель
    const dsts = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)] // индекс корня, степень под корнем
    const d = useRef({ x: 0, y: 0 })
    const [k, setK] = useState<0 | 1>(0)
    const [phase, setPhase] = useState<'idle' | 'fly' | 'land'>('idle')
    const [shown, setShown] = useState(false)
    const [landed, setLanded] = useState<[boolean, boolean]>([false, false])
    const [ip, setIp] = useState(-1) // -1 пауза, 0 печатается строка, 1 маркер и стрелка, 2 кнопка
    useEffect(() => {
        if (!intro) { setIp(2); return }
        setIp(-1)
        const t = setTimeout(() => setIp(0), k === 0 ? 800 : 500)
        return () => clearTimeout(t)
    }, [intro, k])
    const p = useMotionValue(0)
    const x = useTransform(p, (v) => d.current.x * v)
    const y = useTransform(p, (v) => d.current.y * v - 60 * 4 * v * (1 - v))
    const sc = useTransform(p, () => 1)
    const go = () => {
        const s = srcs[k].current, t = dsts[k].current
        if (phase !== 'idle' || ip < 2 || !s || !t) return
        playJustClick()
        const sr = s.getBoundingClientRect(), tr = t.getBoundingClientRect()
        d.current = { x: tr.left + tr.width / 2 - (sr.left + sr.width / 2), y: tr.top + tr.height / 2 - (sr.top + sr.height / 2) }
        setPhase('fly')
        const delay = shown ? 0 : 1000
        setShown(true)
        setTimeout(() => {
            animate(p, 1, {
                duration: 1.1, ease: 'easeInOut', onComplete: () => {
                    setLanded((l) => (k === 0 ? [true, l[1]] : [l[0], true]))
                    setPhase('land')
                    setTimeout(() => {
                        if (k === 0) { p.set(0); setPhase('idle'); setK(1) } else onDone()
                    }, k === 0 ? 700 : 900)
                },
            })
        }, delay)
    }
    const mark = (i: 0 | 1) => ip >= 1 && phase === 'idle' && k === i
    const arrowStyle = { color: GGEGE_PALETTE.blue.button }
    const lineSegs = k === 0
        ? [{ t: 'Показатель корня', c: KEY }, { t: ' — в знаменатель' }]
        : [{ t: 'Степень под корнем', c: KEY }, { t: ' — в числитель' }]
    const sw = { opacity: 0 } as const
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center gap-4 text-6xl font-black text-[#F2F7FB] h-[210px]">
                <Radical idx={n} idxRef={srcs[0]} idxMark={mark(0)} arrow={mark(0)}>
                    <span className="inline-flex items-start">
                        {a}
                        <span ref={srcs[1]} className="relative ml-1 inline-block rounded-[4px] px-[3px] text-3xl leading-none transition-colors duration-500" style={{ backgroundColor: mark(1) ? KEY : 'transparent' }}>
                            {m}
                            {mark(1) && (
                                <motion.span className="absolute left-1/2 -top-[46px] -ml-[17px] block" style={arrowStyle} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: [0, 9, 0] }}
                                    transition={{ opacity: { duration: 0.3 }, y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } }}>
                                    <ArrowDown size={34} strokeWidth={3.5} />
                                </motion.span>
                            )}
                        </span>
                    </span>
                </Radical>
                <span>=</span>
                <motion.span className="inline-flex items-start" initial={false} animate={{ scale: shown ? 1 : 0.4, opacity: shown ? 1 : 0 }} transition={SPRING}>
                    <span>{a}</span>
                    <span className="ml-1 mt-[-36px] inline-flex flex-col items-center gap-[2px] text-3xl leading-none">
                        <span ref={dsts[1]} className="inline-block px-[3px]" style={landed[1] ? undefined : sw}>{m}</span>
                        <span className="block h-[3px] w-full rounded-full bg-[#F2F7FB]" />
                        <span ref={dsts[0]} className="inline-block px-[3px]" style={landed[0] ? undefined : sw}>{n}</span>
                    </span>
                </motion.span>
                {phase === 'fly' && srcs[k].current && (
                    <FlyingNum key={k} from={srcs[k].current as HTMLElement} x={x} y={y} scale={sc} text={k === 0 ? n : m} />
                )}
            </div>
            {intro && ip >= 0 && (
                <MarkSay key={`l${k}`} segs={lineSegs}
                    onDone={() => { setTimeout(() => setIp(1), 500); setTimeout(() => setIp(2), 1500) }} />
            )}
            {phase === 'idle' && ip >= 2 && (
                <div className="w-full flex">
                    <button type="button" className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)} onClick={go}>
                        {k === 0 ? 'Отправить в знаменатель' : 'Отправить в числитель'}
                    </button>
                </div>
            )}
        </div>
    )
}
const powerRootDemo = (a: string, m: string, n: string, intro = false) => ({ t: 'custom' as const, render: (done: () => void) => <PowerRootDemo a={a} m={m} n={n} intro={intro} onDone={done} /> })

// Конструктор степени из корня: сначала пропуск в основании (светится), потом пропуск-показатель сверху справа.
// Каждый этап — 3 похожих варианта; верный ответ влетает в пропуск сразу, как выбран.
const EmptySlot = ({ active, small }: { active: boolean; small?: boolean }) => (
    <span className={`inline-flex items-center justify-center rounded-xl border-2 border-dashed ${small ? 'min-w-[44px] h-[44px] text-2xl' : 'min-w-[60px] h-[60px] text-4xl'}`}
        style={{ borderColor: GGEGE_PALETTE.purple.button, backgroundColor: '#161F23', opacity: active ? 1 : 0.35 }}>
        <span className={active ? 'animate-slot-label' : undefined} style={{ ['--slot-c' as string]: GGEGE_PALETTE.purple.button } as React.CSSProperties}>?</span>
    </span>
)
const PowerBuild = ({ radical, base, baseOpts, expTex, expOpts, onDone }: { radical: string; base: string; baseOpts: string[]; expTex: string; expOpts: string[]; onDone: () => void }) => {
    const [stage, setStage] = useState<0 | 1 | 2>(0) // что уже вставлено
    const [step, setStep] = useState<0 | 1>(0) // какой вопрос на экране
    const pop = { type: 'spring' as const, stiffness: 380, damping: 12 }
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-center gap-3 text-5xl font-black text-[#F2F7FB] min-h-[150px]">
                <MathText>{`$${radical} =$`}</MathText>
                {stage < 2 ? (
                    <span className="inline-flex items-start">
                        {stage === 0
                            ? <EmptySlot active />
                            : <motion.span initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={pop}><MathText>{`$${base}$`}</MathText></motion.span>}
                        <span className="ml-1 mt-[-18px] inline-flex text-3xl">
                            <EmptySlot small active={stage === 1} />
                        </span>
                    </span>
                ) : (
                    // настоящая степень KaTeX: дробь маленькая и стоит над основанием
                    <motion.span initial={{ scale: 0.85, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={pop}>
                        <MathText>{`$${base}^{${expTex.replace('dfrac', 'frac')}}$`}</MathText>
                    </motion.span>
                )}
            </div>
            {step === 0 && <ChoiceGame key="p0" onPick={() => setStage(1)} onDone={() => setStep(1)} rounds={[
                { prompt: 'Что в основании?', options: baseOpts.map((o) => `$${o}$`), correct: `$${baseOpts[0]}$`, hint: 'Число под корнем остаётся основанием' },
            ]} />}
            {step === 1 && <ChoiceGame key="p1" onPick={() => setStage(2)} onDone={() => setTimeout(onDone, 300)} rounds={[
                { prompt: 'Что в показателе?', options: expOpts.map((o) => `$${o}$`), correct: `$${expOpts[0]}$`, hint: 'Число у корня уезжает вниз, сверху единица' },
            ]} />}
        </div>
    )
}

export const LOG_NEGATIVE: SceneLesson = {
    question: 'Минус и дробь в степенях',
    mascot: 'Минус и дробь в степени',
    last: 'Готово, я шарю',
    scenes: [
        {
            title: 'Минус в степени', next: 'Минус — это вниз', parts: [
                flip('5', '2', 'Отправить вниз', true),
                { t: 'ack', label: 'Понял, минус — это вниз' },
                { t: 'say', text: 'Сел в лифт и поехал на первый этаж' },
                { t: 'pause', ms: 800 },
                { t: 'say', text: 'Ещё раз, теперь сам' },
                flip('7', '3', 'Отправить вниз'),
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$7^{-3} = \\dfrac{1}{7^3}$', 'Минус в степени — опусти в знаменатель'] },
            ],
        },
        {
            title: 'Тренируем минус', next: 'Минус-степень освоил', parts: [
                { t: 'say', text: 'Теперь сам' },
                { t: 'custom', render: (done: () => void) => <SinkBuild onDone={done} /> },
                {
                    t: 'choice', label: 'Разминка', rounds: [
                        { prompt: '$2^{-3} = \\ ?$', options: ['$\\dfrac18$', '$-8$', '$-6$'], correct: '$\\dfrac18$', hint: 'Это не минус восемь. Это один делить на $2^3$', ok: '$2^{-3} = \\dfrac18$' },
                        { prompt: '$10^{-2} = \\ ?$', options: ['$\\dfrac{1}{100}$', '$-100$', '$\\dfrac{1}{20}$'], correct: '$\\dfrac{1}{100}$', hint: '$10^2 = 100$, и сотка едет вниз', ok: '$10^{-2} = \\dfrac{1}{100}$' },
                        { prompt: 'А в обратную сторону: $\\dfrac{1}{4^3} = 4^{?}$', options: ['$-3$', '$3$', '$-4$'], correct: '$-3$', hint: 'Всё стоит в знаменателе, значит показатель с минусом', ok: '$\\dfrac{1}{4^3} = 4^{-3}$' },
                        { prompt: '$\\dfrac{1}{7} = 7^{?}$', options: ['$-1$', '$1$', '$0$'], correct: '$-1$', hint: '$7 = 7^1$, и она стоит внизу', ok: '$\\dfrac17 = 7^{-1}$' },
                    ],
                },
            ],
        },
        {
            title: 'Корень — это степень', next: 'Корень — это дробь в степени', parts: [
                rootDemo('5', '3', 'Отправить в показатель', true),
                { t: 'ack', label: 'Понял, корень — это дробь в степени' },
                { t: 'say', text: 'Ещё раз, теперь сам' },
                rootDemo('4', '5', 'Отправить в показатель'),
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$\\sqrt[3]{5} = 5^{\\frac13}$', 'Корень — это степень с дробью'] },
            ],
        },
        {
            title: 'Тренируем корни', next: 'Корни освоил', parts: [
                { t: 'say', text: 'Теперь сам' },
                { t: 'custom', render: (done: () => void) => <PowerBuild radical="\sqrt[5]{4}" base="4" baseOpts={['4', '5', '20']} expTex="\dfrac{1}{5}" expOpts={['\\dfrac{1}{5}', '\\dfrac{1}{4}', '5']} onDone={done} /> },
                {
                    t: 'choice', label: 'Корни', rounds: [
                        { prompt: '$\\sqrt[4]{3} = 3^{?}$', options: ['$\\dfrac14$', '$4$', '$-4$'], correct: '$\\dfrac14$', hint: 'Четвёрка у корня уезжает в знаменатель', ok: '$\\sqrt[4]{3} = 3^{\\frac14}$' },
                        { prompt: '$\\sqrt{7} = 7^{?}$', options: ['$\\dfrac12$', '$2$', '$-\\dfrac12$'], correct: '$\\dfrac12$', hint: 'У квадратного корня двойка спрятана', ok: '$\\sqrt{7} = 7^{\\frac12}$' },
                        { prompt: 'В обратную сторону: $11^{\\frac13} = \\ ?$', options: ['$\\sqrt[3]{11}$', '$\\sqrt{11}$', '$\\dfrac{11}{3}$'], correct: '$\\sqrt[3]{11}$', hint: 'Знаменатель показателя — это степень корня', ok: '$11^{\\frac13} = \\sqrt[3]{11}$' },
                        { prompt: '$2^{\\frac16} = \\ ?$', options: ['$\\sqrt[6]{2}$', '$\\sqrt{2}$', '$\\dfrac{2}{6}$'], correct: '$\\sqrt[6]{2}$', hint: 'Шестёрка снизу значит корень шестой степени', ok: '$2^{\\frac16} = \\sqrt[6]{2}$' },
                    ],
                },
            ],
        },
        {
            title: 'Корень со степенью', next: 'Корень вниз, степень вверх', parts: [
                { t: 'say', text: 'А если под корнем есть степень?' },
                powerRootDemo('5', '2', '3', true),
                { t: 'ack', label: 'Понял, корень вниз, степень вверх' },
                { t: 'say', text: 'Ещё раз' },
                powerRootDemo('7', '3', '4'),
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$\\sqrt[3]{5^2} = 5^{\\frac23}$', 'Корень — вниз, степень под корнем — вверх'] },
                {
                    t: 'choice', label: 'Туда и обратно', rounds: [
                        { prompt: '$7^{\\frac34} = \\ ?$', options: ['$\\sqrt[4]{7^3}$', '$\\sqrt[3]{7^4}$', '$\\dfrac{7^3}{7^4}$'], correct: '$\\sqrt[4]{7^3}$', hint: 'Знаменатель 4 — корень четвёртой степени, числитель 3 — степень', ok: '$7^{\\frac34} = \\sqrt[4]{7^3}$' },
                        { prompt: '$\\sqrt[5]{2^3} = 2^{?}$', options: ['$\\dfrac35$', '$\\dfrac53$', '$15$'], correct: '$\\dfrac35$', hint: 'Корень пятой степени уезжает вниз, тройка остаётся вверху', ok: '$\\sqrt[5]{2^3} = 2^{\\frac35}$' },
                        { prompt: '$\\sqrt{3^5} = 3^{?}$', options: ['$\\dfrac52$', '$\\dfrac25$', '$10$'], correct: '$\\dfrac52$', hint: 'У квадратного корня двойка внизу, пятёрка сверху', ok: '$\\sqrt{3^5} = 3^{\\frac52}$' },
                    ],
                },
                { t: 'ack', label: 'Корень вниз, степень вверх' },
            ],
        },
        {
            title: 'Нулевая степень', next: 'Нуль в степени — единица', parts: [
                { t: 'say', text: 'И ещё один фокус' },
                fig('2^0 = \\ ?'),
                {
                    t: 'choice', rounds: [
                        { prompt: '$2^0 = \\ ?$', options: ['$1$', '$0$', '$2$'], correct: '$1$', hint: 'Ноль в степени не обнуляет число', ok: '$2^0 = 1$' },
                        { prompt: '$100^0 = \\ ?$', options: ['$1$', '$0$', '$100$'], correct: '$1$', hint: 'Любое число в нулевой степени — единица', ok: '$100^0 = 1$' },
                    ],
                },
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$7^0 = 1$', 'Любое число, кроме нуля, в нулевой степени — единица'] },
            ],
        },
        {
            title: 'Комбо: минус и дробь', next: 'Комбо собрал', parts: [
                { t: 'say', text: 'А теперь всё вместе: и корень, и минус' },
                { t: 'pause', ms: 700 },
                fig('\\dfrac{1}{\\sqrt[4]{5^5}}'),
                { t: 'say', text: 'Идём по порядку. Сначала корень' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\sqrt[4]{5^5} = 5^{?}$', options: ['$\\dfrac54$', '$\\dfrac45$', '$20$'], correct: '$\\dfrac54$', hint: 'Четвёрка внизу, пятёрка сверху', ok: '$\\sqrt[4]{5^5} = 5^{\\frac54}$' },
                    ],
                },
                fig('\\dfrac{1}{5^{\\frac54}}'),
                { t: 'say', text: 'Теперь число стоит в знаменателе' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\dfrac{1}{5^{\\frac54}} = 5^{?}$', options: ['$-\\dfrac54$', '$\\dfrac54$', '$-\\dfrac45$'], correct: '$-\\dfrac54$', hint: 'В знаменателе — значит минус в показателе', ok: '$\\dfrac{1}{\\sqrt[4]{5^5}} = 5^{-\\frac54}$' },
                    ],
                },
                { t: 'ack', label: 'Минус и дробь — комбо' },
                { t: 'say', text: 'И обратно: от степени к корню' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', label: 'Комбо', rounds: [
                        { prompt: '$7^{-\\frac23} = \\ ?$', options: ['$\\dfrac{1}{\\sqrt[3]{7^2}}$', '$\\dfrac{1}{\\sqrt{7^3}}$', '$-\\sqrt[3]{7^2}$'], correct: '$\\dfrac{1}{\\sqrt[3]{7^2}}$', hint: 'Минус отправляет всё вниз, тройка внизу — корень третьей степени', ok: '$7^{-\\frac23} = \\dfrac{1}{\\sqrt[3]{7^2}}$' },
                        { prompt: '$\\dfrac{1}{\\sqrt[3]{2^4}} = 2^{?}$', options: ['$-\\dfrac43$', '$\\dfrac43$', '$-\\dfrac34$'], correct: '$-\\dfrac43$', hint: 'Корень третьей степени — внизу, четвёрка — вверху, а перед всем минус', ok: '$\\dfrac{1}{\\sqrt[3]{2^4}} = 2^{-\\frac43}$' },
                        { prompt: '$\\sqrt[5]{3^{-2}} = 3^{?}$', options: ['$-\\dfrac25$', '$-\\dfrac52$', '$\\dfrac25$'], correct: '$-\\dfrac25$', hint: 'Показатель −2 делим на 5', ok: '$\\sqrt[5]{3^{-2}} = 3^{-\\frac25}$' },
                        { prompt: 'Минус, дробь и корень в одном примере. Что делаем?', options: ['Идём по порядку', 'Плачем', 'Закрываем тетрадь', 'Звоним маме'], correct: 'Идём по порядку', hint: 'Слёзы не помогут. Сначала корень, потом минус', ok: 'Так и делаем, шаг за шагом' },
                    ],
                },
            ],
        },
        {
            title: 'Числа с красивым ответом', next: 'Числа считаются', parts: [
                { t: 'say', text: 'Иногда степень можно просто посчитать' },
                fig('8^{-\\frac13} = \\ ?'),
                { t: 'say', text: 'Восемь это два в кубе' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$8^{\\frac13} = \\sqrt[3]{8} = \\ ?$', options: ['$2$', '$3$', '$\\dfrac83$'], correct: '$2$', hint: '$2 \\cdot 2 \\cdot 2 = 8$', ok: '$8^{\\frac13} = 2$' },
                        { prompt: 'А с минусом: $8^{-\\frac13} = \\dfrac{1}{8^{\\frac13}} = \\ ?$', options: ['$\\dfrac12$', '$-2$', '$-\\dfrac12$'], correct: '$\\dfrac12$', hint: 'Минус перевернул двойку', ok: '$8^{-\\frac13} = \\dfrac12$' },
                        { prompt: '$9^{-\\frac12} = \\ ?$', options: ['$\\dfrac13$', '$-3$', '$-\\dfrac13$'], correct: '$\\dfrac13$', hint: '$9^{\\frac12} = \\sqrt9 = 3$, а потом переворот', ok: '$9^{-\\frac12} = \\dfrac13$' },
                    ],
                },
            ],
        },
        {
            title: 'Логарифм дроби', next: 'Минус в ответе — норм', parts: [
                { t: 'say', text: 'Вернёмся к логарифмам' },
                fig('\\log_2 \\dfrac18 = \\ ?'),
                { t: 'say', text: 'Спрашиваем: 2 в какой степени даёт одну восьмую?' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\dfrac18 = 2^{?}$', options: ['$-3$', '$3$', '$-8$'], correct: '$-3$', hint: '$8 = 2^3$, а дробь — значит минус', ok: '$\\dfrac18 = 2^{-3}$' },
                    ],
                },
                fig('\\log_2 \\dfrac18 = -3'),
                { t: 'say', text: 'Логарифм бывает отрицательным, и это нормально' },
                { t: 'ack', label: 'Минус в ответе — это нормально' },
                { t: 'card', title: 'Логарифм дроби', tex: '\\log_5 \\dfrac{1}{25} = -2' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\log_2 \\dfrac14 = \\ ?$', options: ['$-2$', '$2$', '$\\dfrac14$'], correct: '$-2$', hint: '$\\dfrac14 = 2^{-2}$', ok: '$-2$' },
                        { prompt: '$\\log_3 \\dfrac{1}{27} = \\ ?$', options: ['$-3$', '$3$', '$-9$'], correct: '$-3$', hint: '$27 = 3^3$, а в знаменателе минус', ok: '$-3$' },
                        { prompt: '$\\log_5 0{,}2 = \\ ?$', options: ['$-1$', '$-2$', '$0{,}2$'], correct: '$-1$', hint: '$0{,}2 = \\dfrac15$. Хитро замаскировался', ok: '$0{,}2 = \\dfrac15 = 5^{-1}$, ответ −1' },
                    ],
                },
            ],
        },
        {
            title: 'Корень в логарифме', next: 'Дробь в ответе — норм', parts: [
                fig('\\log_2 \\sqrt[3]{2} = \\ ?'),
                { t: 'say', text: 'Корень — это степень с дробью' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\sqrt[3]{2} = 2^{?}$', options: ['$\\dfrac13$', '$3$', '$-\\dfrac13$'], correct: '$\\dfrac13$', hint: 'Тройка у корня уезжает в знаменатель', ok: '$\\sqrt[3]{2} = 2^{\\frac13}$' },
                    ],
                },
                fig('\\log_2 \\sqrt[3]{2} = \\dfrac13'),
                { t: 'say', text: 'А если корень ещё и в знаменателе?' },
                fig('\\log_3 \\dfrac{1}{\\sqrt{3}}'),
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\dfrac{1}{\\sqrt{3}} = 3^{?}$', options: ['$-\\dfrac12$', '$\\dfrac12$', '$-2$'], correct: '$-\\dfrac12$', hint: 'Корень — это половинка степени, а знаменатель добавляет минус', ok: '$\\dfrac{1}{\\sqrt3} = 3^{-\\frac12}$, ответ $-\\dfrac12$' },
                        { prompt: '$\\log_5 \\sqrt[4]{5} = \\ ?$', options: ['$\\dfrac14$', '$4$', '$-\\dfrac14$'], correct: '$\\dfrac14$', hint: '$\\sqrt[4]{5} = 5^{\\frac14}$', ok: '$\\dfrac14$' },
                    ],
                },
            ],
        },
        {
            title: 'Разные основания и дробь внизу', next: 'Общее основание — сила', parts: [
                fig('\\log_8 \\dfrac12 = \\ ?'),
                { t: 'say', text: 'Восемь и одна вторая — оба из семьи двойки' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', label: 'Через двойку', rounds: [
                        { prompt: '$8 = 2^{?}$', options: ['$3$', '$4$', '$-3$'], correct: '$3$', hint: '2 · 2 · 2', ok: '$8 = 2^3$' },
                        { prompt: '$\\dfrac12 = 2^{?}$', options: ['$-1$', '$1$', '$-2$'], correct: '$-1$', hint: 'Перевёртыш двойки', ok: '$\\dfrac12 = 2^{-1}$' },
                    ],
                },
                fig('(2^3)^x = 2^{-1} \\;\\Rightarrow\\; 3x = -1'),
                {
                    t: 'choice', rounds: [
                        { prompt: '$3x = -1,\\ x = \\ ?$', options: ['$-\\dfrac13$', '$-3$', '$\\dfrac13$'], correct: '$-\\dfrac13$', hint: 'Делим −1 на 3', ok: '$\\log_8 \\dfrac12 = -\\dfrac13$. Минус и дробь сразу, комбо' },
                    ],
                },
                { t: 'ack', label: 'Всё через двойку, понял' },
                fig('\\log_{\\frac12} 16 = \\ ?'),
                { t: 'say', text: 'Теперь дробь в основании. Тот же трюк' },
                fig('\\left(\\tfrac12\\right)^x = 16 \\;\\Rightarrow\\; 2^{-x} = 2^4'),
                {
                    t: 'choice', rounds: [
                        { prompt: '$-x = 4,\\ x = \\ ?$', options: ['$-4$', '$4$', '$\\dfrac14$'], correct: '$-4$', hint: 'Если −x = 4, то x = −4', ok: '$\\log_{\\frac12} 16 = -4$' },
                        { prompt: 'А если обе дроби? $\\log_{\\frac13} \\dfrac19 = \\ ?$', options: ['$2$', '$-2$', '$\\dfrac12$'], correct: '$2$', hint: '$\\left(\\tfrac13\\right)^2 = \\tfrac19$', ok: 'Минус на минус даёт плюс' },
                    ],
                },
                {
                    t: 'remember', title: 'ЗАПОМНИ', lines: [
                        '1. $\\dfrac18 = 2^{-3}$, а $\\sqrt{2} = 2^{\\frac12}$',
                        '2. Основание и аргумент записываем через одно число (2, 3, 5)',
                        '3. Основание и аргумент по разные стороны от 1, значит ответ отрицательный',
                    ],
                },
            ],
        },
    ],
    trials: [
        { tag: 'Минус', text: '$6^{-2} = \\ ?$', options: ['$\\dfrac{1}{36}$', '$-36$', '$-12$', '$\\dfrac{1}{12}$'], answer: '$\\dfrac{1}{36}$', hint: '$6^{-2} = \\dfrac{1}{6^2}$' },
        { tag: 'Корень', text: '$\\sqrt[4]{5} = 5^{?}$', options: ['$\\dfrac14$', '$4$', '$-\\dfrac14$', '$\\dfrac54$'], answer: '$\\dfrac14$', hint: 'Четвёрка у корня уезжает в знаменатель' },
        { tag: 'Числитель', text: '$3^{\\frac52} = \\ ?$', options: ['$\\sqrt{3^5}$', '$\\sqrt[5]{3^2}$', '$\\dfrac{3^5}{3^2}$', '$\\dfrac{3^2}{3^5}$'], answer: '$\\sqrt{3^5}$', hint: 'Знаменатель 2 — корень, числитель 5 — степень под корнем' },
        {
            tag: 'Подвох', text: 'Минус в показателе степени. Что делаем?',
            options: ['Переворачиваем число', 'Плачем', 'Закрываем тетрадь', 'Звоним маме'], answer: 'Переворачиваем число',
            hint: 'Слёзы не помогут. Минус отправляет число в знаменатель',
        },
        { tag: 'Комбо', text: '$\\dfrac{1}{\\sqrt[3]{7^2}} = 7^{?}$', options: ['$-\\dfrac23$', '$\\dfrac23$', '$-\\dfrac32$', '$-6$'], answer: '$-\\dfrac23$', hint: 'Корень третьей степени, двойка вверху, а знаменатель добавляет минус' },
        { tag: 'Считаем', text: '$27^{-\\frac13} = \\ ?$', options: ['$\\dfrac13$', '$-3$', '$-\\dfrac13$', '$9$'], answer: '$\\dfrac13$', hint: '$27^{\\frac13} = 3$, потом переворот' },
        { tag: 'Считаем', text: '$16^{\\frac34} = \\ ?$', options: ['$8$', '$12$', '$4$', '$64$'], answer: '$8$', hint: '$16^{\\frac14} = 2$, потом в третьей степени: 8' },
        { tag: 'Логарифм', text: '$\\log_2 \\dfrac{1}{32} = \\ ?$', options: ['$-5$', '$5$', '$-\\dfrac15$', '$-16$'], answer: '$-5$', hint: '$32 = 2^5$' },
        { tag: 'Логарифм', text: '$\\log_9 \\dfrac13 = \\ ?$', options: ['$-\\dfrac12$', '$\\dfrac12$', '$-3$', '$-2$'], answer: '$-\\dfrac12$', hint: '$9 = 3^2$, $\\tfrac13 = 3^{-1}$, значит $2x = -1$' },
        { tag: 'Логарифм', text: '$\\log_3 \\dfrac{1}{\\sqrt{3}} = \\ ?$', options: ['$-\\dfrac12$', '$\\dfrac12$', '$-2$', '$-3$'], answer: '$-\\dfrac12$', hint: '$\\dfrac{1}{\\sqrt3} = 3^{-\\frac12}$' },
        { tag: 'Дробь внизу', text: '$\\log_{\\frac13} 27 = \\ ?$', options: ['$-3$', '$3$', '$-9$', '$\\dfrac13$'], answer: '$-3$', hint: '$\\left(\\tfrac13\\right)^{-3} = 27$' },
        dessert('степенях и логарифмах'),
    ],
}
