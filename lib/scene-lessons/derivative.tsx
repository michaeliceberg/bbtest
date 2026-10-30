'use client'

// Блок «Производная» (ЕГЭ №9) → урок «Как считать производную» (SCENEWALK). Сценарий пользователя:
//   (t⁴)′: обводим степень, она спускается вниз налево, сама степень уменьшается на 1 → 4t³;
//   (4t⁶)′: 6 спускается, 6 · 4 = 24, степень 6 − 1 = 5 → 24t⁵; 4 упражнения;
//   (5t²)′ = 10t (выбор), потом (10t)′ = 10 (t¹ → t⁰ = 1, «просто стираем t»), (10)′ = 0 (10 = 10·t⁰, 0 · 10 = 0);
//   длинный пример 6t⁵ − 12t³ + 4t² − 7t + 9: фигурная скобка под слагаемым едет вправо, производная каждого — выбором.
// Анимации: PowerDemo (степень летит к коэффициенту, −1 с отскоком), PolyDerivative (скобка под слагаемым).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { Note, type Scene } from '@/components/geometry/scene-engine'
import { MarkerLoop } from '@/components/geometry/WalkthroughLog'
import { playJustClick, playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import type { SceneLesson } from './types'

const EXP = GGEGE_PALETTE.purple.button   // степень
const COEF = GGEGE_PALETTE.teal.button    // коэффициент
const OK = '#A1D151'
const BAD = '#DC605B'
const POP = { type: 'spring' as const, stiffness: 320, damping: 11 }

const Caption = ({ text }: { text: string }) => (
    <motion.div key={text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="w-full text-center text-base md:text-lg font-black text-[#F2C35B] min-h-[28px]">{text}</motion.div>
)

// ===== (c·tⁿ)′: степень спускается вниз налево, умножается на коэффициент, степень −1 =====
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export const PowerDemo = ({ c, n, onDone }: { c: number; n: number; onDone: () => void }) => {
    const [p, setP] = useState<Phase>(0)
    const boxRef = useRef<HTMLDivElement>(null)
    const srcRef = useRef<HTMLSpanElement>(null)
    const dstRef = useRef<HTMLSpanElement>(null)
    const [delta, setDelta] = useState<{ x: number; y: number } | null>(null)
    const prod = n * c
    const hasC = c !== 1
    useEffect(() => {
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
    }, [])
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
            <div ref={boxRef} className="relative flex items-baseline justify-center whitespace-nowrap font-black text-[34px] md:text-5xl text-[#F2F7FB] select-none">
                <span>(</span>
                {hasC && <span style={{ color: COEF }}>{c}</span>}
                {(n > 0 || p >= 1) && <span className="italic">t</span>}
                <span className="relative inline-block text-[0.55em] -translate-y-[0.8em] px-0.5" ref={srcRef}
                    style={{ color: EXP, opacity: n <= 1 && p < 1 ? 0.35 : 1 }}>
                    {n === 0 && p < 1 ? '' : n}
                    {p >= 1 && p <= 2 && <MarkerLoop pad={8} />}
                </span>
                <span>)′</span>
                {p >= 2 && <span className="mx-2">=</span>}
                {p >= 2 && (
                    <span className="inline-flex items-baseline">
                        {/* коэффициент ответа: сначала «n · c», потом произведение */}
                        {p < 3 || (!hasC && n !== 0) ? (
                            <>
                                <span ref={dstRef} className="inline-block" style={{ color: EXP, opacity: delta ? 1 : 0 }}>
                                    {delta ? (
                                        <motion.span className="inline-block" initial={{ x: delta.x, y: delta.y, scale: 0.55 }} animate={{ x: 0, y: 0, scale: 1 }}
                                            transition={{ duration: 0.9, ease: [0.3, 0.8, 0.3, 1] }}>{n}</motion.span>
                                    ) : n}
                                </span>
                                {(hasC || n === 0) && <><span className="mx-1 text-[#8FA3AE]">·</span><span style={{ color: COEF }}>{c}</span></>}
                            </>
                        ) : (
                            <motion.span key="prod" className="inline-block" style={{ color: OK }} initial={{ scale: 2.4 }} animate={{ scale: 1 }} transition={POP}>
                                {prod}
                            </motion.span>
                        )}
                        {showT && <span className="italic">t</span>}
                        {showExp && (
                            <span className="inline-block text-[0.55em] -translate-y-[0.8em] px-0.5" style={{ color: EXP }}>
                                {p === 4 ? (
                                    <>{n}<motion.span className="inline-block text-[#F2C35B]" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={POP}>−1</motion.span></>
                                ) : p >= 5 ? (
                                    <motion.span key="ne" className="inline-block" initial={{ scale: 3 }} animate={{ scale: 1 }} transition={POP}>{expText}</motion.span>
                                ) : n}
                            </span>
                        )}
                    </span>
                )}
                {p >= 7 && (
                    <motion.span className="absolute -inset-x-3 -inset-y-1 rounded-2xl border-2 pointer-events-none" style={{ borderColor: OK }}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} />
                )}
            </div>
            <Caption text={caption} />
        </div>
    )
}

// ===== Многочлен: скобка под слагаемым, производная каждого — выбором =====
type Term = { sign: '+' | '−' | ''; c: number; n: number }
const TermView = ({ t }: { t: Term }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        {t.sign && <span className="mx-1.5 text-[#8FA3AE]">{t.sign}</span>}
        {(t.c !== 1 || t.n === 0) && <span>{t.c}</span>}
        {t.n > 0 && <span className="italic">t</span>}
        {t.n > 1 && <span className="inline-block text-[0.55em] -translate-y-[0.8em]" style={{ color: EXP }}>{t.n}</span>}
    </span>
)
type PolyStep = { term: Term; options: string[]; correct: string; hint: string; result: Term | null }
export const PolyDerivative = ({ steps, onDone }: { steps: PolyStep[]; onDone: () => void }) => {
    const boxRef = useRef<HTMLDivElement>(null)
    const termRefs = useRef<(HTMLSpanElement | null)[]>([])
    const [rects, setRects] = useState<{ left: number; width: number }[]>([])
    const [i, setI] = useState(0)
    const [wrong, setWrong] = useState<string[]>([])
    const [done, setDone] = useState<Term[]>([])
    const [zero, setZero] = useState(false)
    const finished = i >= steps.length
    useLayoutEffect(() => {
        const measure = () => {
            const box = boxRef.current?.getBoundingClientRect()
            if (!box) return
            setRects(termRefs.current.map((el) => {
                const r = el?.getBoundingClientRect()
                return r ? { left: r.left - box.left, width: r.width } : { left: 0, width: 0 }
            }))
        }
        measure()
        const ro = new ResizeObserver(measure)
        if (boxRef.current) ro.observe(boxRef.current)
        return () => ro.disconnect()
    }, [])
    useEffect(() => {
        if (!finished) return
        const t = setTimeout(onDone, 1600)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished])
    const pick = (o: string) => {
        if (finished || wrong.includes(o)) return
        const s = steps[i]
        if (o === s.correct) {
            playJustClick(); showAnswerMeme(true)
            if (s.result) setDone((d) => [...d, s.result!])
            else setZero(true)
            setWrong([]); setI(i + 1)
        } else { setWrong((w) => [...w, o]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    const r = rects[Math.min(i, steps.length - 1)]
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full overflow-x-auto overflow-y-hidden">
                <div ref={boxRef} className="relative mx-auto w-max pb-10 pt-1 font-black text-[22px] md:text-3xl text-[#F2F7FB]">
                    <span className="mr-1">(</span>
                    {steps.map((s, k) => (
                        <span key={k} ref={(el) => { termRefs.current[k] = el }}
                            className="transition-opacity duration-300" style={{ opacity: finished || k === i ? 1 : k < i ? 0.4 : 0.75 }}>
                            <TermView t={s.term} />
                        </span>
                    ))}
                    <span className="ml-1">)′</span>
                    {r && !finished && (
                        <svg className="absolute bottom-1 h-8 overflow-visible transition-[left,width] duration-500 ease-out" style={{ left: r.left, width: r.width }}
                            viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path d="M 2 2 Q 2 12 14 12 L 40 12 Q 50 12 50 26 Q 50 12 60 12 L 86 12 Q 98 12 98 2" fill="none" stroke="#F2C35B" strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
            </div>
            {/* Собираемый ответ */}
            <div className="flex min-h-[48px] items-baseline justify-center flex-wrap font-black text-[24px] md:text-3xl text-[#F2F7FB]">
                <span className="mr-2 text-[#8FA3AE]">=</span>
                {done.length === 0 && !zero && <span className="text-[#5C6B73]">…</span>}
                {done.map((t, k) => (
                    <motion.span key={k} initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}
                        style={{ color: finished ? OK : '#F2F7FB' }}>
                        <TermView t={k === 0 && t.sign === '+' ? { ...t, sign: '' } : t} />
                    </motion.span>
                ))}
                {zero && (
                    <motion.span initial={{ opacity: 1 }} animate={{ opacity: finished ? 0.25 : 1 }} transition={{ delay: 0.6 }}
                        className={cn('ml-1.5', finished && 'line-through')}>+ 0</motion.span>
                )}
            </div>
            {!finished && (
                <>
                    <div className="w-full text-center text-lg font-black text-[#F2F7FB]">
                        Производная слагаемого в скобке? <span className="text-sm font-bold text-[#5C6B73]">{i + 1}/{steps.length}</span>
                    </div>
                    <div key={i} className="drop-in-options grid w-full grid-cols-2 gap-3">
                        {steps[i].options.map((o) => {
                            const bad = wrong.includes(o)
                            return (
                                <button key={o} type="button" disabled={bad} onClick={() => pick(o)}
                                    className={cn('min-h-[56px] rounded-xl border-2 border-b-4 active:border-b-0 text-xl font-black',
                                        bad ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB]')}>
                                    <Latex>{o}</Latex>
                                </button>
                            )
                        })}
                    </div>
                    {wrong.length > 0 && <Note ok={false}><Latex>{steps[i].hint}</Latex></Note>}
                </>
            )}
            {finished && <Note ok>Каждое слагаемое — отдельно, и ответ собран! ¡Perfecto! 🔥</Note>}
        </div>
    )
}

const demo = (c: number, n: number) => ({ t: 'custom' as const, label: 'Смотри', render: (done: () => void) => <PowerDemo c={c} n={n} onDone={done} /> })

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
            { t: 'say', text: '¡Hola, амиго! Производная звучит страшно, а считается как фокус 🎩 Чему равна производная от $t^4$?' },
            demo(1, 4),
            { t: 'calc', tex: '(t^4)\' = 4t^3' },
        ],
    },
    {
        title: 'С числом впереди', next: 'Повторю сам', parts: [
            { t: 'say', text: 'А если впереди есть число? Например, $4t^6$' },
            demo(4, 6),
            { t: 'calc', tex: '(4t^6)\' = 24t^5' },
            { t: 'remember', title: 'ЗАПОМНИ!', lines: ['$(c \\cdot t^n)\' = n \\cdot c \\cdot t^{n-1}$', 'Степень спускается и умножается на число', 'А сама степень уменьшается на 1'] },
        ],
    },
    {
        title: 'Разминка', next: 'Разогрелся', parts: [
            {
                t: 'choice', label: 'Посчитай', rounds: [
                    { prompt: "$(t^5)' = \\ ?$", options: ['$5t^4$', '$t^4$', '$5t^5$'], correct: '$5t^4$', hint: '5 спускается вниз, степень $5 - 1$ 🙃', ok: '$5t^4$ ✅' },
                    { prompt: "$(2t^3)' = \\ ?$", options: ['$6t^2$', '$2t^2$', '$6t^3$'], correct: '$6t^2$', hint: '$3 \\cdot 2 = 6$, степень $3 - 1 = 2$ 🙃', ok: '$6t^2$ ✅' },
                    { prompt: "$(3t^4)' = \\ ?$", options: ['$12t^3$', '$7t^3$', '$12t^4$'], correct: '$12t^3$', hint: 'Умножаем, а не складываем: $4 \\cdot 3$ 🙃', ok: '$12t^3$ ✅' },
                    { prompt: "$(t^7)' = \\ ?$", options: ['$7t^6$', '$6t^7$', '$7t^8$'], correct: '$7t^6$', hint: 'Степень УМЕНЬШАЕТСЯ на 1, а не растёт 🙃', ok: '$7t^6$. ¡Muy bien!' },
                ],
            },
        ],
    },
    {
        title: 'А квадрат?', next: 'Квадрат сдался', parts: [
            { t: 'say', text: 'Давай посчитаем производную от $5t^2$' },
            {
                t: 'choice', rounds: [
                    { prompt: "$(5t^2)' = \\ ?$", options: ['$10t$', '$5t$', '$10t^2$', '$2t$'], correct: '$10t$', hint: '$2 \\cdot 5 = 10$, а $t^1$ — просто $t$ 🙃', ok: '$10t$ — степень 1 не пишут' },
                ],
            },
        ],
    },
    {
        title: 'Просто t', next: 'Стираю t', parts: [
            { t: 'say', text: 'А теперь снова производная, но уже от $10t$. У $t$ невидимая степень 1 👻' },
            demo(10, 1),
            { t: 'calc', tex: '(10t)\' = 10' },
            { t: 'remember', title: 'ЛАЙФХАК', lines: ['$(k \\cdot t)\' = k$', 'Просто стираем $t$! $(7t)\' = 7$, $(t)\' = 1$'] },
        ],
    },
    {
        title: 'Просто число', next: 'Ноль понял', parts: [
            { t: 'say', text: 'А производная от числа 10? Хитрость: $10 = 10 \\cdot t^0$, ведь $t^0 = 1$' },
            demo(10, 0),
            { t: 'say', text: 'Производная — это скорость изменения. Число 10 не меняется никогда, как Команданте на посту 💂 Скорость 0' },
            { t: 'remember', title: 'ЗАПОМНИ!', lines: ['Производная числа $= 0$', '$(10)\' = 0, \\ (-3)\' = 0, \\ (2026)\' = 0$'] },
        ],
    },
    {
        title: 'Длинный пример', next: 'Монстр побеждён', parts: [
            { t: 'say', text: 'А теперь босс-пример 😈 Считаем каждое слагаемое отдельно, знаки сохраняем' },
            { t: 'custom', label: 'По слагаемым', render: (done) => <PolyDerivative steps={POLY} onDone={done} /> },
            { t: 'calc', tex: '(6t^5 - 12t^3 + 4t^2 - 7t + 9)\' = 30t^4 - 36t^2 + 8t - 7' },
            { t: 'say', text: '¡Hasta la victoria! Это и есть вся техника производной для ЕГЭ 💪' },
        ],
    },
]

const T = (text: string, options: string[], answer: string, hint: string) => ({ tag: 'Производная', text, options, answer, hint })

export const DERIV_BASIC: SceneLesson = {
    question: 'Как считать производную',
    mascot: 'Производная — это фокус',
    last: 'Производные мои!',
    scenes,
    trials: [
        T("$(t^6)' = \\ ?$", ['$6t^5$', '$t^5$', '$6t^6$'], '$6t^5$', 'Степень спускается и уменьшается на 1 🙃'),
        T("$(3t^5)' = \\ ?$", ['$15t^4$', '$8t^4$', '$15t^5$'], '$15t^4$', '$5 \\cdot 3 = 15$, степень 4 🙃'),
        T("$(7t)' = \\ ?$", ['$7$', '$7t$', '$0$'], '$7$', 'Просто стираем $t$ 🙃'),
        T("$(15)' = \\ ?$", ['$0$', '$15$', '$1$'], '$0$', 'Число не меняется — производная 0 🙃'),
        T("$(2t^3 - 5t + 4)' = \\ ?$", ['$6t^2 - 5$', '$6t^2 - 5t$', '$6t^2 - 5 + 4$'], '$6t^2 - 5$', 'Каждое слагаемое отдельно, а 4 даёт 0 🙃'),
        T("$(t^4 + 3t^2)' = \\ ?$", ['$4t^3 + 6t$', '$4t^3 + 3t$', '$4t^3 + 6t^2$'], '$4t^3 + 6t$', '$(3t^2)\' = 6t$ 🙃'),
    ],
}
