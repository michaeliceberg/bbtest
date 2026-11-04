'use client'

// Блок «Производная» (ЕГЭ №9) → урок «Как считать производную» (SCENEWALK). Сценарий пользователя:
//   (t⁴)′: обводим степень, она спускается вниз налево, сама степень уменьшается на 1 → 4t³;
//   (4t⁶)′: 6 спускается, 6 · 4 = 24, степень 6 − 1 = 5 → 24t⁵; 4 упражнения;
//   (5t²)′ = 10t (выбор), потом (10t)′ = 10 (t¹ → t⁰ = 1, «просто стираем t»), (10)′ = 0 (10 = 10·t⁰, 0 · 10 = 0);
//   длинный пример 6t⁵ − 12t³ + 4t² − 7t + 9: фигурная скобка под слагаемым едет вправо, производная каждого — выбором.
// Анимации: PowerDemo (степень летит к коэффициенту, −1 с отскоком), PolyDerivative (скобка под слагаемым).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PlainMath, SUP_STYLE } from '@/components/geometry/plain-math'
import 'katex/dist/katex.min.css'
import { Note, type Scene } from '@/components/geometry/scene-engine'
import { MarkerLoop } from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { playJustClick, playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { cn } from '@/lib/utils'
import type { SceneLesson } from './types'

// Один цвет для всех чисел и степеней; жёлтый — только подсказка и то, что сейчас меняется.
const INK = '#F2F7FB'
const ACCENT = '#F2C35B'
const SUP_FLEX = SUP_STYLE
const BAD = '#DC605B'
const POP = { type: 'spring' as const, stiffness: 320, damping: 11 }

const Caption = ({ text }: { text: string }) => (
    <motion.div key={text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="w-full text-center text-base md:text-lg font-black text-[#F2C35B] min-h-[28px]">{text}</motion.div>
)

// ===== (c·tⁿ)′: степень спускается вниз налево, умножается на коэффициент, степень −1 =====
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export const PowerDemo = ({ c, n, onDone, gate }: { c: number; n: number; onDone: () => void; gate?: string }) => {
    const [p, setP] = useState<Phase>(0)
    const [started, setStarted] = useState(!gate)   // gate — анимация ждёт нажатия кнопки
    const boxRef = useRef<HTMLDivElement>(null)
    const srcRef = useRef<HTMLSpanElement>(null)
    const dstRef = useRef<HTMLSpanElement>(null)
    const [delta, setDelta] = useState<{ x: number; y: number } | null>(null)
    const prod = n * c
    const hasC = c !== 1
    useEffect(() => {
        if (!started) return
        // Фазы: 1 обводка, 2 степень летит, 3 перемножили, 4 «−1», 5 новая степень, 6 t¹/t⁰ упростили, 7 готово
        const plan: [Phase, number][] = [[1, 700], [2, 1900]]
        let t = 1900
        if (hasC || n === 0) { t += 1500; plan.push([3, t]) }
        if (n > 0) {
            t += 1400; plan.push([4, t])
            t += 1300; plan.push([5, t])
            if (n - 1 <= 1) { t += 1400; plan.push([6, t]) }
        }
        t += 900; plan.push([7, t])
        const ids = plan.map(([ph, ms]) => setTimeout(() => setP(ph), ms))
        const end = setTimeout(onDone, t + 700)
        return () => { ids.forEach(clearTimeout); clearTimeout(end) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started])
    useLayoutEffect(() => {
        if (p < 2 || delta || !srcRef.current || !dstRef.current) return
        const a = srcRef.current.getBoundingClientRect(), b = dstRef.current.getBoundingClientRect()
        setDelta({ x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2) })
    }, [p, delta])

    const caption =
        p >= 7 ? (n === 0 ? 'Число без t → производная 0 🧊' : 'Готово! ✅')
            : p === 6 ? (n - 1 === 0 ? 't⁰ = 1, поэтому t просто исчезает 🪄' : 't¹ — это просто t')
                : p === 5 ? `${n} − 1 = ${n - 1}`
                    : p === 4 ? 'А сама степень уменьшается на 1 ⬇️'
                        : p === 3 ? (n === 0 ? 'Умножаем на 0 → всё 0' : `Перемножаем: ${n} · ${c} = ${prod}`)
                            : p === 2 ? 'Степень спускается вниз налево 👇'
                                : p === 1 ? 'Смотрим на степень 👀' : ''
    const newExp = n - 1
    // Что показываем в ответе
    const showT = n > 0 && !(p >= 6 && newExp === 0)
    const expText = p >= 5 ? String(newExp) : String(n)
    const showExp = n > 0 && !(p >= 6 && newExp <= 1)
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div ref={boxRef} className="relative flex items-baseline justify-center whitespace-nowrap font-bold text-[32px] md:text-[42px] text-[#F2F7FB] select-none">
                <span>(</span>
                {hasC && <span>{c}</span>}
                {(n > 0 || p >= 1) && <span className="italic">t</span>}
                <span className="relative inline-block" ref={srcRef}
                    style={{ ...SUP_FLEX, opacity: n <= 1 && p < 1 ? 0.35 : 1 }}>
                    {n === 0 && p < 1 ? '' : n}
                    {p >= 1 && p <= 2 && <MarkerLoop pad={8} />}
                </span>
                <span>)′</span>
                {(p >= 2 || !started) && <span className="mx-2">=</span>}
                {p >= 2 && (
                    <span className="inline-flex items-baseline">
                        {/* коэффициент ответа: сначала «n · c», потом произведение */}
                        {p < 3 || (!hasC && n !== 0) ? (
                            <>
                                <span ref={dstRef} className="inline-block" style={{ color: p >= 7 ? INK : ACCENT, opacity: delta ? 1 : 0, transition: "color 0.4s" }}>
                                    {delta ? (
                                        <motion.span className="inline-block" initial={{ x: delta.x, y: delta.y, scale: 0.55 }} animate={{ x: 0, y: 0, scale: 1 }}
                                            transition={{ duration: 0.9, ease: [0.3, 0.8, 0.3, 1] }}>{n}</motion.span>
                                    ) : n}
                                </span>
                                {(hasC || n === 0) && <><span className="mx-1.5 text-[#8FA3AE]">·</span><span>{c}</span></>}
                            </>
                        ) : (
                            <motion.span key="prod" className="inline-block" style={{ color: INK }} initial={{ scale: 2.4 }} animate={{ scale: 1 }} transition={POP}>
                                {prod}
                            </motion.span>
                        )}
                        {showT && <span className="italic">t</span>}
                        {showExp && (
                            <span className="inline-block" style={SUP_FLEX}>
                                {p === 4 ? (
                                    <>{n}<motion.span className="inline-block text-[#F2C35B]" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={POP}>−1</motion.span></>
                                ) : p >= 5 ? (
                                    <motion.span key="ne" className="inline-block" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={POP}>{expText}</motion.span>
                                ) : n}
                            </span>
                        )}
                    </span>
                )}
            </div>
            {started ? <Caption text={caption} /> : (
                <motion.button type="button" onClick={() => { playJustClick(); setStarted(true) }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="mt-1 rounded-2xl border-2 border-b-4 active:border-b-0 border-[#5FA12F] bg-[#78C93C] px-6 py-3 text-lg font-black text-[#151F24]">
                    {gate}
                </motion.button>
            )}
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
        {t.n > 1 && <span className="font-bold" style={SUP_FLEX}>{t.n}</span>}
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
export const PolyDerivative = ({ steps, onDone }: { steps: PolyStep[]; onDone: () => void }) => {
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
                                            <path d="M 2 2 Q 2 12 14 12 L 40 12 Q 50 12 50 26 Q 50 12 60 12 L 86 12 Q 98 12 98 2" fill="none" stroke="#F2C35B" strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
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
            {finished && <Note ok>Каждое слагаемое — отдельно, и ответ собран! ¡Perfecto! 🔥</Note>}
        </div>
    )
}

const demo = (c: number, n: number, gate: string) => ({ t: 'custom' as const, render: (done: () => void) => <PowerDemo c={c} n={n} gate={gate} onDone={done} /> })

const POLY: PolyStep[] = [
    { term: { sign: '', c: 6, n: 5 }, options: ['$30t^4$', '$6t^4$', '$30t^5$', '$11t^4$'], correct: '$30t^4$', hint: '5 спускается: $5 \\cdot 6 = 30$, степень $5 - 1 = 4$ 🙃', result: { sign: '', c: 30, n: 4 } },
    { term: { sign: '−', c: 12, n: 3 }, options: ['$-36t^2$', '$-12t^2$', '$-36t^3$', '$36t^2$'], correct: '$-36t^2$', hint: 'Минус остаётся. $3 \\cdot 12 = 36$, степень 2 🙃', result: { sign: '−', c: 36, n: 2 } },
    { term: { sign: '+', c: 4, n: 2 }, options: ['$8t$', '$4t$', '$8t^2$', '$2t$'], correct: '$8t$', hint: '$2 \\cdot 4 = 8$, а $t^1$ — это просто $t$ 🙃', result: { sign: '+', c: 8, n: 1 } },
    { term: { sign: '−', c: 7, n: 1 }, options: ['$-7$', '$-7t$', '$7$', '$0$'], correct: '$-7$', hint: 'Просто стираем $t$, минус остаётся 🙃', result: { sign: '−', c: 7, n: 0 } },
    { term: { sign: '+', c: 9, n: 0 }, options: ['$0$', '$9$', '$9t$', '$1$'], correct: '$0$', hint: 'Число без $t$ не меняется — производная 0 🙃', result: null },
]

const scenes: Scene[] = [
    {
        title: 'Степень спускается', next: 'Вижу фокус', parts: [
            { t: 'say', text: '¡Hola, амиго!' },
            { t: 'pause', ms: 700 },
            { t: 'custom', render: (done) => <ScaryLine onDone={done} /> },
            { t: 'say', text: 'А считается легко 😎' },
            { t: 'pause', ms: 500 },
            demo(1, 4, 'Ну-ка, интересно'),
        ],
    },
    {
        title: 'С числом впереди', next: 'Повторю сам', parts: [
            { t: 'say', text: 'А если впереди есть число?' },
            { t: 'pause', ms: 600 },
            demo(4, 6, 'Покажи'),
            { t: 'pause', ms: 500 },
            { t: 'remember', title: 'ЗАПОМНИ!', lines: ["$(c \\cdot t^n)' = n \\cdot c \\cdot t^{n-1}$", 'Степень спускается и умножается на число', 'А сама степень уменьшается на 1'] },
        ],
    },
    {
        title: 'Разминка', next: 'Разогрелся', parts: [
            {
                t: 'choice', rounds: [
                    { prompt: "$(t^5)' = ?$", options: ['$5t^4$', '$t^4$', '$5t^5$'], correct: '$5t^4$', hint: '5 спускается вниз, степень $5 - 1$ 🙃', ok: '$5t^4$ ✅' },
                    { prompt: "$(2t^3)' = ?$", options: ['$6t^2$', '$2t^2$', '$6t^3$'], correct: '$6t^2$', hint: '$3 \\cdot 2 = 6$, степень $3 - 1 = 2$ 🙃', ok: '$6t^2$ ✅' },
                    { prompt: "$(3t^4)' = ?$", options: ['$12t^3$', '$7t^3$', '$12t^4$'], correct: '$12t^3$', hint: 'Умножаем, а не складываем: $4 \\cdot 3$ 🙃', ok: '$12t^3$ ✅' },
                    { prompt: "$(t^7)' = ?$", options: ['$7t^6$', '$6t^7$', '$7t^8$'], correct: '$7t^6$', hint: 'Степень УМЕНЬШАЕТСЯ на 1, а не растёт 🙃', ok: '$7t^6$. ¡Muy bien!' },
                ],
            },
        ],
    },
    {
        title: 'А квадрат?', next: 'Квадрат сдался', parts: [
            { t: 'say', text: 'Теперь квадрат' },
            {
                t: 'choice', rounds: [
                    { prompt: "$(5t^2)' = ?$", options: ['$10t$', '$5t$', '$10t^2$', '$2t$'], correct: '$10t$', hint: '$2 \\cdot 5 = 10$, а $t^1$ — просто $t$ 🙃', ok: '$10t$ — степень 1 не пишут' },
                ],
            },
        ],
    },
    {
        title: 'Просто t', next: 'Стираю t', parts: [
            { t: 'say', text: 'А если просто $10t$?' },
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'У $t$ есть невидимая степень 1 👻' },
            demo(10, 1, 'Покажи'),
            { t: 'pause', ms: 500 },
            { t: 'remember', title: 'ЛАЙФХАК', lines: ["$(k \\cdot t)' = k$", "Просто стираем $t$: $(7t)' = 7$"] },
        ],
    },
    {
        title: 'Просто число', next: 'Ноль понял', parts: [
            { t: 'say', text: 'А производная от числа 10?' },
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'Хитрость: $10 = 10 \\cdot t^0$, ведь $t^0 = 1$' },
            demo(10, 0, 'Покажи'),
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'Число не меняется никогда, как Команданте на посту 💂' },
            { t: 'remember', title: 'ЗАПОМНИ!', lines: ['Производная числа $= 0$', "$(10)' = 0, (-3)' = 0$"] },
        ],
    },
    {
        title: 'Длинный пример', next: 'Монстр побеждён', parts: [
            { t: 'say', text: 'А теперь босс-пример 😈' },
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'Считаем каждое слагаемое отдельно' },
            { t: 'custom', render: (done) => <PolyDerivative steps={POLY} onDone={done} /> },
            { t: 'say', text: '¡Hasta la victoria! Это вся техника производной для ЕГЭ 💪' },
        ],
    },
]

const T = (text: string, options: string[], answer: string, hint: string) => ({ tag: 'Производная', text, options, answer, hint })

export const DERIV_BASIC: SceneLesson = {
    question: 'Как считать производную',
    mascot: 'Производная — это фокус',
    last: 'Производные мои!',
    plainMath: true,
    scenes,
    trials: [
        T("$(t^6)' = ?$", ['$6t^5$', '$t^5$', '$6t^6$'], '$6t^5$', 'Степень спускается и уменьшается на 1 🙃'),
        T("$(3t^5)' = ?$", ['$15t^4$', '$8t^4$', '$15t^5$'], '$15t^4$', '$5 \\cdot 3 = 15$, степень 4 🙃'),
        T("$(7t)' = ?$", ['$7$', '$7t$', '$0$'], '$7$', 'Просто стираем $t$ 🙃'),
        T("$(15)' = ?$", ['$0$', '$15$', '$1$'], '$0$', 'Число не меняется — производная 0 🙃'),
        T("$(2t^3 - 5t + 4)' = ?$", ['$6t^2 - 5$', '$6t^2 - 5t$', '$6t^2 - 5 + 4$'], '$6t^2 - 5$', 'Каждое слагаемое отдельно, а 4 даёт 0 🙃'),
        T("$(t^4 + 3t^2)' = ?$", ['$4t^3 + 6t$', '$4t^3 + 3t$', '$4t^3 + 6t^2$'], '$4t^3 + 6t$', '$(3t^2)\' = 6t$ 🙃'),
    ],
}
