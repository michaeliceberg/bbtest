// app/t-lesson/[t_lessonId]/type-vietawalk.tsx
//
// VIETAWALK — «Как работает теорема Виета» (первый урок юнита «Теорема Виета»).
// Сценарий пользователя (2026-10-13):
//   1. x² − 5x + 6 = 0: какие 2 числа при умножении дают 6, при сложении 5? (варианты);
//   2. то же для x² − 7x + 12 = 0;
//   3. коэффициенты a, b, c на x² − 7x + 12 = 0, «невидимая единица» перед x²;
//   4. ЗАПОМНИ словами: умножим корни → c, сложим → b с другим знаком; простые примеры;
//   5. «посложнее»: x² + x − 6 = 0 — корни бывают отрицательными;
//   6. до этого было a = 1, на самом деле произведение = c/a, сумма = −b/a;
//   7. 2x² + 3x − 5 = 0: угадываем x = 1, второй корень = c/a = −5/2;
//   8. то же с x = −1 (3x² + 10x + 7 = 0), гонка с дискриминантом на 17x² − 317x + 300 = 0, раунды на угадывание.
// Потом «Проверим себя». Ошибки в мини-играх не засчитываются, в «Проверим себя» — да.

'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    DiagramBlock, EllipsisPause,
    pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
    pickFunNextLabel,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import Lottie from '@/components/lottie-player'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Цвета ролей (2026-10-13, просьба пользователя — контрастнее, без оранжевого):
// a — малиново-розовый, b — насыщенный синий (голубой #35C8F5 сливался с белым), c — салатовый, корни — фиолетовый.
const A_COLOR = '#FF5CB8'
const B_COLOR = '#3B82F6'
const C_COLOR = '#B8F04A'
const ROOT_COLOR = GGEGE_PALETTE.purple.button
const REMEMBER_COLOR = '#F2C35B'
const OK_COLOR = '#A1D151'
const BAD_COLOR = '#DC605B'

const pickFun = pickFunNextLabel
const pickPraise = () => CORRECT_FEEDBACK_PHRASES[Math.floor(Math.random() * CORRECT_FEEDBACK_PHRASES.length)]

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// ===== Числа =====
const fmt = (n: number) => (n < 0 ? `−${-n}` : `${n}`)
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
// Дробь строкой: «−7/3», «4», «1/4».
const fracStr = (num: number, den: number) => {
    if (den < 0) { num = -num; den = -den }
    const g = gcd(num, den) || 1
    num /= g; den /= g
    if (den === 1) return fmt(num)
    return `${num < 0 ? '−' : ''}${Math.abs(num)}/${den}`
}
const uniq = (xs: string[]) => Array.from(new Set(xs))

// ===== Текст и мелочи =====
const Pop = ({ delay = 0, children, className }: { delay?: number; children: React.ReactNode; className?: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        className={cn('inline-flex', className)}
    >
        {children}
    </motion.span>
)

type BigPart = { text: string; color?: string }
const TypedBig = ({ parts, onDone, readMs = 500, small }: { parts: BigPart[]; onDone?: () => void; readMs?: number; small?: boolean }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
            {!typed ? (
                <Typewriter text={parts.map((p) => p.text).join('')} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }} />
            ) : (
                parts.map((p, i) => <span key={i} style={p.color ? { color: p.color } : undefined}>{p.text}</span>)
            )}
        </div>
    )
}

const Frac = ({ num, den }: { num: React.ReactNode; den: React.ReactNode }) => (
    <span className="inline-flex flex-col leading-none align-middle mx-0.5 text-[0.85em]">
        <span className="pb-1 border-b-2 border-current px-1 text-center">{num}</span>
        <span className="pt-1 px-1 text-center">{den}</span>
    </span>
)

// Строка с дробями: «1 и −3/4» → дробь рисуется дробью.
const NumText = ({ s }: { s: string }) => (
    <span className="inline-flex items-center flex-wrap justify-center gap-x-1">
        {s.split(/(−?\d+\/\d+)/).map((part, i) => {
            const m = part.match(/^(−?)(\d+)\/(\d+)$/)
            if (!m) return part ? <span key={i} className="whitespace-pre">{part}</span> : null
            return (
                <span key={i} className="inline-flex items-center">
                    {m[1] && <span>{m[1]}</span>}
                    <Frac num={m[2]} den={m[3]} />
                </span>
            )
        })}
    </span>
)

// Уравнение ax² + bx + c = 0. colors — раскрасить коэффициенты, showOne — показать «невидимую» 1.
type EqSpec = { a: number; b: number; c: number }
const Eq = ({ a, b, c, colors, showOne, size = 'text-3xl md:text-4xl' }: EqSpec & { colors?: boolean; showOne?: boolean; size?: string }) => {
    const col = (k: string) => (colors ? { color: k } : undefined)
    const aTxt = a === 1 ? '' : a === -1 ? '−' : fmt(a)
    const bAbs = Math.abs(b) === 1 ? '' : `${Math.abs(b)}`
    return (
        <div className={cn('w-full flex items-center justify-center font-black text-[#F2F7FB] whitespace-nowrap', size)}>
            {a === 1 && showOne && (
                <motion.span initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55, duration: 0.9 }}
                    className="inline-flex mr-0.5" style={{ color: A_COLOR }}>1·</motion.span>
            )}
            <span style={col(A_COLOR)}>{aTxt}</span>
            <span>x²</span>
            {b !== 0 && (
                <>
                    <span className="mx-1.5" style={col(B_COLOR)}>{b < 0 ? '−' : '+'}</span>
                    <span style={col(B_COLOR)}>{bAbs}</span>
                    <span>x</span>
                </>
            )}
            <span className="mx-1.5" style={col(C_COLOR)}>{c < 0 ? '−' : '+'}</span>
            <span style={col(C_COLOR)}>{Math.abs(c)}</span>
            <span className="ml-1.5">= 0</span>
        </div>
    )
}

const RememberBanner = ({ children }: { children?: React.ReactNode }) => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-14 h-14 md:w-16 md:h-16 shrink-0" />
        <div className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}>
            {children ?? 'ЗАПОМНИ!'}
        </div>
    </div>
)

// Строка-факт, появляется с отскоком.
const Fact = ({ children, color = '#F2F7FB', delay = 0 }: { children: React.ReactNode; color?: string; delay?: number }) => (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay }}
        className="w-full text-center text-lg md:text-xl font-extrabold" style={{ color }}>
        {children}
    </motion.div>
)

// Сброс красной вспышки через 800 мс.
const useFlash = <T,>() => {
    const [v, setV] = useState<T | null>(null)
    useEffect(() => {
        if (v === null) return
        const t = setTimeout(() => setV(null), 800)
        return () => clearTimeout(t)
    }, [v])
    return [v, setV] as const
}

// Мини-игра «выбери вариант»: ошибка — красная вспышка и подсказка, в ошибки урока не идёт.
const QuickPick = ({ ask, options, correct, hint, onDone }: {
    ask: React.ReactNode; options: string[]; correct: string; hint?: (o: string) => string; onDone?: () => void
}) => {
    const [opts] = useState(() => shuffle(options))
    const [wrong, setWrong] = useFlash<string>()
    const [hintText, setHintText] = useState<string | null>(null)
    const [ok, setOk] = useState(false)
    const pick = (o: string) => {
        if (ok) return
        if (o === correct) {
            showAnswerMeme(true)
            setOk(true)
            setHintText(null)
            setTimeout(() => onDone?.(), 700)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setWrong(o)
            setHintText(hint?.(o) ?? pickWrongTryPhrase())
        }
    }
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="text-xl md:text-2xl font-black text-center text-[#F2F7FB]"><Pop>{ask}</Pop></div>
            <div className={cn('drop-in-options grid gap-2.5 w-full max-w-sm', opts.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                {opts.map((o) => (
                    <button key={o} type="button" onClick={() => pick(o)} disabled={ok}
                        className={cn('min-h-[56px] rounded-xl border-2 text-xl font-black transition-colors px-2',
                            ok && o === correct ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                : wrong === o ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                        <NumText s={o} />
                    </button>
                ))}
            </div>
            <div className="min-h-[24px] text-center text-sm md:text-base font-bold" style={{ color: BAD_COLOR }}>{hintText}</div>
        </div>
    )
}

// ===== Раунды =====
type RStep = { ask: React.ReactNode; options: string[]; correct: string; hint?: (o: string) => string; after: React.ReactNode }
type Round = { eq: EqSpec; steps: RStep[] }

const RoundBadge = ({ n, total }: { n: number; total: number }) => (
    <div className="flex items-center gap-0.5 px-3 h-8 rounded-full border-2 font-black text-sm tabular-nums"
        style={{ borderColor: hexToRgba(A_COLOR, 0.55), backgroundColor: hexToRgba(A_COLOR, 0.16), color: A_COLOR }}>
        <span>{n}</span><span className="opacity-50 font-normal">/</span><span>{total}</span>
    </div>
)

const RoundsBody = ({ rounds, onDone }: { rounds: Round[]; onDone: () => void }) => {
    const [r, setR] = useState(0)
    const [doneSteps, setDoneSteps] = useState(0)
    const [praise, setPraise] = useState<string | null>(null)
    if (r >= rounds.length) {
        return (
            <div className="w-full flex flex-col items-center gap-2">
                <Pop><span className="text-2xl font-black" style={{ color: OK_COLOR }}>Все раунды пройдены! 🔥</span></Pop>
                <LocalAnswerConfetti />
            </div>
        )
    }
    const round = rounds[r]
    const stepDone = () => {
        const n = doneSteps + 1
        setDoneSteps(n)
        if (n < round.steps.length) return
        setPraise(pickPraise())
        setTimeout(() => {
            setPraise(null)
            setDoneSteps(0)
            setR(r + 1)
            if (r + 1 >= rounds.length) setTimeout(onDone, 900)
        }, 1500)
    }
    const cur = round.steps[doneSteps]
    return (
        <div key={`round-${r}`} className="w-full flex flex-col items-center gap-2">
            <div className="w-full flex items-center justify-center gap-3">
                <RoundBadge n={r + 1} total={rounds.length} />
            </div>
            <Pop><Eq {...round.eq} colors size="text-2xl md:text-3xl" /></Pop>
            {round.steps.slice(0, doneSteps).map((s, i) => <Fact key={i}>{s.after}</Fact>)}
            {cur && <QuickPick key={`${r}-${doneSteps}`} ask={cur.ask} options={cur.options} correct={cur.correct} hint={cur.hint} onDone={stepDone} />}
            {praise && <Pop><span className="text-xl font-black" style={{ color: OK_COLOR }}>{praise}</span></Pop>}
        </div>
    )
}

const X1X2 = () => <span>x₁ · x₂</span>
const X1PX2 = () => <span>x₁ + x₂</span>

// Пары с тем же произведением — правдоподобные ошибки.
const pairOptions = (x1: number, x2: number) => {
    const c = x1 * x2
    const key = (p: number, q: number) => [p, q].sort((m, n) => m - n).join(',')
    const used = new Set([key(x1, x2)])
    const out: string[] = []
    const add = (p: number, q: number) => {
        const k = key(p, q)
        if (used.has(k) || out.length >= 3) return
        used.add(k)
        out.push(`${fmt(p)} и ${fmt(q)}`)
    }
    add(-x1, -x2)
    add(x1, -x2)
    const cands: [number, number][] = []
    for (let d = 1; d <= Math.abs(c); d++) if (c % d === 0) cands.push([d, c / d], [-d, -c / d])
    for (const [p, q] of shuffle(cands)) add(p, q)
    return [`${fmt(x1)} и ${fmt(x2)}`, ...out]
}
const parsePair = (o: string) => o.split(' и ').map((t) => Number(t.replace('−', '-')))
const pairHint = (c: number, sum: number) => (o: string) => {
    const [p, q] = parsePair(o)
    const prod = p * q, s = p + q
    const pq = `${fmt(p)} · ${q < 0 ? `(${fmt(q)})` : q} = ${fmt(prod)} ${prod === c ? '✓' : '✗'}`
    const ps = `${fmt(p)} + ${q < 0 ? `(${fmt(q)})` : q} = ${fmt(s)} ${s === sum ? '✓' : '✗'}`
    return `${pq},  ${ps}`
}

// Простой раунд (a = 1): произведение → сумма → корни.
const simpleRound = (x1: number, x2: number): Round => {
    const b = -(x1 + x2), c = x1 * x2
    return {
        eq: { a: 1, b, c },
        steps: [
            {
                ask: <span><X1X2 /> = ?</span>,
                options: uniq([fmt(c), fmt(-c), fmt(b), fmt(-b)]).slice(0, 4),
                correct: fmt(c),
                hint: (o) => (o === fmt(-c) ? 'c берём вместе с его знаком 🙃' : 'Произведение = c, это число без x 🙃'),
                after: <span><X1X2 /> = <span style={{ color: C_COLOR }}>c</span> = {fmt(c)}</span>,
            },
            {
                ask: <span><X1PX2 /> = ?</span>,
                options: uniq([fmt(-b), fmt(b), fmt(c)]),
                correct: fmt(-b),
                hint: (o) => (o === fmt(b) ? 'Сумма = −b, знак МЕНЯЕМ! 🙃' : 'Сумма = −b: число перед x, но с другим знаком 🙃'),
                after: <span><X1PX2 /> = <span style={{ color: B_COLOR }}>−b</span> = {fmt(-b)}</span>,
            },
            {
                ask: <span>Значит, корни:</span>,
                options: pairOptions(x1, x2),
                correct: `${fmt(x1)} и ${fmt(x2)}`,
                hint: pairHint(c, -b),
                after: <span style={{ color: ROOT_COLOR }}>Корни: {fmt(x1)} и {fmt(x2)} ✓</span>,
            },
        ],
    }
}

// Раунд «угадай корень» (a ≠ 1): x₁ = 1 или −1, потом x₂ = c/a : x₁.
const guessRound = (a: number, b: number, c: number, root: 1 | -1): Round => {
    const at = (x: number) => a * x * x + b * x + c
    const x2 = fracStr(c, a * root)
    const opp = fracStr(-c, a * root)
    const flip = fracStr(a * root, c)
    const opts = uniq([x2, opp, flip, fracStr(c, 1), fracStr(-a * root, c)]).slice(0, 4)
    return {
        eq: { a, b, c },
        steps: [
            {
                ask: <span>Какой корень угадаем?</span>,
                options: ['1', '−1'],
                correct: fmt(root),
                hint: (o) => `При x = ${o} получится ${fmt(at(o === '1' ? 1 : -1))}, а не 0 🙃`,
                after: <span>x = {fmt(root)}: {fmt(a)} {(root === 1 ? b < 0 : b > 0) ? '−' : '+'} {Math.abs(b)} {c < 0 ? '−' : '+'} {Math.abs(c)} = 0 ✓ <span style={{ color: ROOT_COLOR }}>x₁ = {fmt(root)}</span></span>,
            },
            {
                ask: <span>x₂ = ?</span>,
                options: opts,
                correct: x2,
                hint: () => `x₁ · x₂ = c/a = ${fracStr(c, a)}, а x₁ = ${fmt(root)} 🙃`,
                after: <span style={{ color: ROOT_COLOR }}>x₂ = <NumText s={x2} /> ✓</span>,
            },
        ],
    }
}

// ===== Сцены =====
type SceneProps = { onSettled?: () => void }

// Слот-кнопка x₁/x₂: обычная кнопка проекта, у активной только буква мягко переливается в белый.
const PairSlot = ({ label, val, active, state, onClick }: {
    label: string; val: number | null; active: boolean; state: 'ok' | 'bad' | null; onClick: () => void
}) => {
    const border = state === 'ok' ? OK_COLOR : state === 'bad' ? BAD_COLOR : active ? hexToRgba(ROOT_COLOR, 0.7) : '#3A464E'
    const color = state === 'ok' ? OK_COLOR : state === 'bad' ? BAD_COLOR : '#F2F7FB'
    return (
        <button type="button" onClick={onClick}
            className="min-w-[56px] h-[52px] px-2 rounded-xl border-2 border-b-4 active:border-b-2 font-black transition-colors"
            style={{ borderColor: border, color, backgroundColor: state ? hexToRgba(border, 0.12) : '#161F23' }}>
            {val !== null
                ? <motion.span key={val} initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 16 }} className="inline-block">{fmt(val)}</motion.span>
                : <span className={cn('text-xl', active && !state && 'animate-slot-label')}
                    style={{ color: active ? ROOT_COLOR : '#5C6B73', ['--slot-c' as string]: ROOT_COLOR }}>{label}</span>}
        </button>
    )
}

// Мини-игра «собери пару»: x₁ · x₂ = c и x₁ + x₂ = s, числа снизу. Неверно — тряска и сброс.
const PairBuilder = ({ c, s, nums, onSolved }: { c: number; s: number; nums: number[]; onSolved: () => void }) => {
    const [vals, setVals] = useState<(number | null)[]>([null, null])
    const [active, setActive] = useState(0)
    const [result, setResult] = useState<'ok' | 'bad' | null>(null)
    const filled = vals[0] !== null && vals[1] !== null
    const prodOk = filled && vals[0]! * vals[1]! === c
    const sumOk = filled && vals[0]! + vals[1]! === s
    const pick = (n: number) => {
        if (result) return
        const next = [...vals]
        next[active] = n
        setVals(next)
        const other = active === 0 ? 1 : 0
        if (next[other] === null) { setActive(other); return }
        if (next[0]! * next[1]! === c && next[0]! + next[1]! === s) {
            setResult('ok'); showAnswerMeme(true)
            setTimeout(onSolved, 1100)
        } else {
            setResult('bad'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setTimeout(() => { setResult(null); setVals([null, null]); setActive(0) }, 1500)
        }
    }
    const mark = (ok: boolean) => filled && (
        <Pop><span className="text-2xl font-black w-7 inline-block text-center" style={{ color: ok ? OK_COLOR : BAD_COLOR }}>{ok ? '✓' : '✗'}</span></Pop>
    )
    const rowState = (ok: boolean): 'ok' | 'bad' | null => (filled && result ? (ok ? 'ok' : 'bad') : null)
    const row = (op: string, right: number, color: string, ok: boolean) => (
        <motion.div animate={result === 'bad' && !ok ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5 text-2xl md:text-3xl font-black text-[#F2F7FB]">
            <PairSlot label="x₁" val={vals[0]} active={active === 0 && !result} state={rowState(ok)} onClick={() => !result && setActive(0)} />
            <span>{op}</span>
            <PairSlot label="x₂" val={vals[1]} active={active === 1 && !result} state={rowState(ok)} onClick={() => !result && setActive(1)} />
            <span>=</span>
            <span style={{ color }}>{fmt(right)}</span>
            <span className="w-7">{mark(ok)}</span>
        </motion.div>
    )
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3">
                {row('·', c, C_COLOR, prodOk)}
                {row('+', s, B_COLOR, sumOk)}
            </div>
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
                {nums.map((n, i) => {
                    const used = vals[active === 0 ? 1 : 0] === n
                    return (
                        <motion.button key={n} type="button" onClick={() => pick(n)} disabled={!!result || used}
                            initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: used ? 0.35 : 1 }}
                            transition={{ type: 'spring', bounce: 0.5, delay: 0.05 * i }}
                            whileTap={{ scale: 0.9 }}
                            className="h-14 rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-2xl font-black text-[#F2F7FB]">
                            {fmt(n)}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}

// 1–2. Подбери 2 числа: произведение и сумма.
const PairGuessScene = ({ onSettled, intro, x1, x2, nums }: SceneProps & { intro: string; x1: number; x2: number; nums: number[] }) => {
    const [phase, setPhase] = useState(0)
    const b = -(x1 + x2), c = x1 * x2
    return (
        <>
            <TypedBig small parts={[{ text: intro }]} onDone={() => setPhase(1)} readMs={150} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 2))}>
                    <Eq a={1} b={b} c={c} colors />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedBig small parts={[{ text: 'Подбери 2 числа 👇' }]} onDone={() => setPhase((p) => Math.max(p, 3))} readMs={150} />}
            {phase >= 3 && <PairBuilder c={c} s={-b} nums={nums} onSolved={() => setPhase(4)} />}
            {phase >= 4 && (
                <TypedBig onDone={() => onSettled?.()} readMs={300}
                    parts={[{ text: `${x1} и ${x2} это ` }, { text: 'КОРНИ', color: ROOT_COLOR }, { text: ' 🎯' }]} />
            )}
        </>
    )
}
const Guess56Scene = (p: SceneProps) => <PairGuessScene {...p} intro="Вот уравнение:" x1={2} x2={3} nums={[1, 2, 3, 4, 5, 6]} />
const Guess712Scene = (p: SceneProps) => <PairGuessScene {...p} intro="А вот ещё одно:" x1={3} x2={4} nums={[1, 2, 3, 4, 6, 12]} />

// Буква-коэффициент падает сверху в пунктирную клетку.
const FallingLetter = ({ letter, color, delay }: { letter: string; color: string; delay: number }) => (
    <span className="relative inline-flex items-center justify-center w-12 h-14 md:w-14 md:h-16 rounded-xl border-2 border-dashed mx-0.5"
        style={{ borderColor: hexToRgba(color, 0.55) }}>
        <motion.span initial={{ y: -140, opacity: 0, rotate: -25 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 11, delay }}
            className="inline-block font-black" style={{ color, textShadow: `0 0 18px ${hexToRgba(color, 0.7)}` }}>
            {letter}
        </motion.span>
    </span>
)

// Наклейка-буква над найденным коэффициентом.
const CoefTag = ({ letter, color }: { letter: string; color: string }) => (
    <motion.span initial={{ y: -60, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        className="absolute -top-11 left-1/2 -translate-x-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-xl font-black"
        style={{ color, border: `2px solid ${color}`, backgroundColor: hexToRgba(color, 0.18) }}>
        {letter}
    </motion.span>
)

type CoefStep = 'c' | 'b' | 'a' | 'done'

// 3. Коэффициенты a, b, c: буквы падают, потом ученик сам находит их в уравнении; «невидимая единица».
const CoefScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [step, setStep] = useState<CoefStep>('c')
    const [wrong, setWrong] = useFlash<string>()
    const [hint, setHint] = useState<string | null>(null)
    useEffect(() => {
        if (phase !== 1) return
        const t = setTimeout(() => setPhase(2), 2400)
        return () => clearTimeout(t)
    }, [phase])
    const found = { c: step !== 'c', b: step === 'a' || step === 'done', a: step === 'done' }
    const tap = (tok: 'x2' | 'b' | 'c') => {
        if (step !== 'c' && step !== 'b') return
        if (tok === step) {
            showAnswerMeme(true)
            setHint(null)
            if (step === 'c') setStep('b')
            else { setStep('a'); setTimeout(() => setPhase((p) => Math.max(p, 4)), 700) }
            return
        }
        if (tok === 'c' && step === 'b') return
        playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
        setWrong(tok)
        setHint(step === 'c' ? 'c это число без x 🙃' : 'b это число перед x, вместе со знаком 🙃')
    }
    const tokCls = 'relative inline-flex items-center justify-center rounded-xl px-1.5 transition-colors'
    const askColor = step === 'c' ? C_COLOR : B_COLOR
    return (
        <>
            <TypedBig small parts={[{ text: 'Любое квадратное уравнение:' }]} onDone={() => setPhase(1)} readMs={150} />
            {phase >= 1 && (
                <div className="w-full flex items-center justify-center font-black text-3xl md:text-4xl text-[#F2F7FB] whitespace-nowrap py-2">
                    <FallingLetter letter="a" color={A_COLOR} delay={0.2} />x²<span className="mx-1">+</span>
                    <FallingLetter letter="b" color={B_COLOR} delay={0.8} />x<span className="mx-1">+</span>
                    <FallingLetter letter="c" color={C_COLOR} delay={1.4} /><span className="ml-1.5">= 0</span>
                </div>
            )}
            {phase >= 2 && <TypedBig small parts={[{ text: 'Найдём их здесь 👇' }]} onDone={() => setPhase((p) => Math.max(p, 3))} readMs={150} />}
            {phase >= 3 && (
                <Pop>
                    <div className="w-full flex items-end justify-center font-black text-4xl md:text-5xl text-[#F2F7FB] whitespace-nowrap pt-12 pb-1">
                        {found.a && (
                            <span className="relative inline-flex">
                                <CoefTag letter="a" color={A_COLOR} />
                                <motion.span initial={{ y: -120, opacity: 0, scale: 2 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 10 }} style={{ color: A_COLOR }}>1·</motion.span>
                            </span>
                        )}
                        <button type="button" onClick={() => tap('x2')}
                            className={cn(tokCls, wrong === 'x2' && 'bg-[#DC605B33] text-[#DC605B]')}>x²</button>
                        <button type="button" onClick={() => tap('b')} className={cn(tokCls, 'ml-1', wrong === 'b' && 'bg-[#DC605B33]')}
                            style={{ color: found.b ? B_COLOR : wrong === 'b' ? BAD_COLOR : undefined }}>
                            {found.b && <CoefTag letter="b" color={B_COLOR} />}−7
                        </button>
                        <span>x</span>
                        <span className="mx-1.5">+</span>
                        <button type="button" onClick={() => tap('c')} className={cn(tokCls, wrong === 'c' && 'bg-[#DC605B33]')}
                            style={{ color: found.c ? C_COLOR : wrong === 'c' ? BAD_COLOR : undefined }}>
                            {found.c && <CoefTag letter="c" color={C_COLOR} />}12
                        </button>
                        <span className="ml-1.5">= 0</span>
                    </div>
                </Pop>
            )}
            {phase >= 3 && (step === 'c' || step === 'b') && (
                <div className="w-full flex flex-col items-center gap-1">
                    <Pop key={step}>
                        <span className="text-xl md:text-2xl font-black text-[#F2F7FB]">
                            Нажми на <span className="px-2 rounded-lg" style={{ color: askColor, border: `2px solid ${askColor}` }}>{step}</span> 👆
                        </span>
                    </Pop>
                    <div className="min-h-[24px] text-center font-bold" style={{ color: BAD_COLOR }}>{hint}</div>
                </div>
            )}
            {step !== 'c' && (
                <div className="w-full flex flex-wrap items-center justify-center gap-2">
                    <Pop><span className="text-lg font-black px-3 py-1 rounded-xl" style={{ color: C_COLOR, backgroundColor: hexToRgba(C_COLOR, 0.14) }}>c = 12</span></Pop>
                    {found.b && <Pop><span className="text-lg font-black px-3 py-1 rounded-xl" style={{ color: B_COLOR, backgroundColor: hexToRgba(B_COLOR, 0.14) }}>b = −7 (минус тоже входит!)</span></Pop>}
                    {found.a && <Pop><span className="text-lg font-black px-3 py-1 rounded-xl" style={{ color: A_COLOR, backgroundColor: hexToRgba(A_COLOR, 0.14) }}>a = 1</span></Pop>}
                </div>
            )}
            {phase >= 4 && (
                <TypedBig small onDone={() => setPhase((p) => Math.max(p, 5))} readMs={100}
                    parts={[{ text: 'А где ' }, { text: 'a', color: A_COLOR }, { text: '? Перед x² ничего не написано 🤔' }]} />
            )}
            {phase === 5 && <EllipsisPause onDone={() => { setStep('done'); setPhase(6) }} />}
            {phase >= 6 && (
                <TypedBig onDone={() => onSettled?.()} readMs={400}
                    parts={[{ text: 'Там спряталась ' }, { text: '1', color: A_COLOR }, { text: '! 🫣' }]} />
            )}
        </>
    )
}

// 4. ЗАПОМНИ: словами — УМНОЖИМ корни → c, СЛОЖИМ корни → b с другим знаком.
const RuleScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase === 0) { const t = setTimeout(() => setPhase(1), 700); return () => clearTimeout(t) }
        if (phase === 4) { const t = setTimeout(() => setPhase(5), 2400); return () => clearTimeout(t) }
        if (phase === 5) { const t = setTimeout(() => onSettled?.(), 1200); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <RememberBanner>ЗАПОМНИ!</RememberBanner>
            {phase >= 1 && (
                <TypedBig onDone={() => setPhase(2)} readMs={300}
                    parts={[{ text: 'УМНОЖИМ', color: ROOT_COLOR }, { text: ' корни → ' }, { text: 'c', color: C_COLOR }]} />
            )}
            {phase >= 2 && (
                <TypedBig onDone={() => setPhase(3)} readMs={300}
                    parts={[{ text: 'СЛОЖИМ', color: ROOT_COLOR }, { text: ' корни → ' }, { text: 'b', color: B_COLOR }, { text: ' с другим знаком' }]} />
            )}
            {phase >= 3 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 4))}>
                    <Eq a={1} b={-7} c={12} colors size="text-2xl md:text-3xl" />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <>
                    <Fact>3 · 4 = <span style={{ color: C_COLOR }}>12</span> ✓</Fact>
                    <Fact delay={0.7}>3 + 4 = 7, а тут <span style={{ color: B_COLOR }}>−7</span> ✓</Fact>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                        className="w-full text-center text-base text-[#9AA7B0]">
                        Знак <b>наоборот</b> — вот и вся хитрость 😉
                    </motion.div>
                </>
            )}
        </>
    )
}

// Гонка (после c/a и угадывания корня): 17x² − 317x + 300 = 0. Виета: 17 − 317 + 300 = 0 → x₁ = 1, x₂ = c/a.
// Дискриминант: 317² − 4·17·300 = 80 089, √80 089 = 283 — считать долго.
const RACE_D_LINES: React.ReactNode[] = [
    <span key="1">D = 317² − 4 · 17 · 300</span>,
    <span key="2">D = 100 489 − 20 400</span>,
    <span key="3">D = 80 089</span>,
    <span key="4">√80 089 = … 😵‍💫</span>,
    <span key="5">√80 089 = 283</span>,
    <span key="6" className="inline-flex items-center gap-1">x = <Frac num="317 ± 283" den="34" /></span>,
    <span key="7" className="inline-flex items-center gap-1">x₁ = 1, x₂ = <Frac num="300" den="17" /></span>,
]
const RaceScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    // phase 1: старт; Виета готов сразу, дискриминант — строка за строкой
    useEffect(() => {
        if (phase < 1 || phase > RACE_D_LINES.length + 1) return
        const t = setTimeout(() => setPhase(phase + 1), phase === 1 ? 700 : 1200)
        return () => clearTimeout(t)
    }, [phase])
    const dLines = Math.max(0, Math.min(RACE_D_LINES.length, phase - 1))
    return (
        <>
            <TypedBig small parts={[{ text: 'А теперь реши вот это 😈' }]} onDone={() => setPhase((p) => Math.max(p, 1))} readMs={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <Eq a={17} b={-317} c={300} colors size="text-xl md:text-3xl" />
                        <div className="w-full grid grid-cols-2 gap-3">
                            <div className="rounded-xl border-2 p-3 flex flex-col items-center gap-1.5 min-h-[230px]" style={{ borderColor: hexToRgba(OK_COLOR, 0.6) }}>
                                <div className="text-sm font-black" style={{ color: OK_COLOR }}>Виета ⚡</div>
                                <Fact><span className="text-sm md:text-base">17 − 317 + 300 = 0</span></Fact>
                                <Fact delay={0.4}><span className="text-base">x₁ = 1</span></Fact>
                                <Fact delay={0.8}><span className="text-base inline-flex items-center gap-1">x₂ = <Frac num={<span style={{ color: C_COLOR }}>300</span>} den={<span style={{ color: A_COLOR }}>17</span>} /></span></Fact>
                                <Fact delay={1.2} color={OK_COLOR}><Pop delay={1.2}>Готово ✓</Pop></Fact>
                            </div>
                            <div className="rounded-xl border-2 p-3 flex flex-col items-center gap-1.5 min-h-[230px]" style={{ borderColor: hexToRgba(BAD_COLOR, 0.6) }}>
                                <div className="text-sm font-black" style={{ color: BAD_COLOR }}>Дискриминант 🐢</div>
                                {RACE_D_LINES.map((l, i) => ({ l, i })).slice(0, dLines).filter(({ i }) => !(i === 3 && dLines > 4)).map(({ l, i }) => <Fact key={i}><span className="text-sm md:text-base">{l}</span></Fact>)}
                            </div>
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= RACE_D_LINES.length + 2 && (
                <TypedBig onDone={() => onSettled?.()} readMs={400}
                    parts={[{ text: 'Виета', color: OK_COLOR }, { text: ' в разы быстрее! ⚡' }]} />
            )}
        </>
    )
}

// 5. Твоя очередь: простые примеры.
const SIMPLE_ROUNDS = [simpleRound(2, 4), simpleRound(4, 5), simpleRound(3, 5)]
const SimpleRoundsScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig parts={[{ text: 'Твоя очередь! Подбери корни 💪' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && <RoundsBody rounds={SIMPLE_ROUNDS} onDone={() => onSettled?.()} />}
        </>
    )
}

// 6. Посложнее: x² + x − 6 = 0, корни разных знаков.
const NEG_INTRO_ROUND: Round = {
    eq: { a: 1, b: 1, c: -6 },
    steps: [
        {
            ask: <span><X1X2 /> = ?</span>, options: ['−6', '6', '1', '−1'], correct: '−6',
            hint: (o) => (o === '6' ? 'c = −6, минус тоже берём 🙃' : 'Произведение = c 🙃'),
            after: <span><X1X2 /> = −6 <span style={{ color: REMEMBER_COLOR }}>Минус, значит знаки РАЗНЫЕ!</span></span>,
        },
        {
            ask: <span><X1PX2 /> = ?</span>, options: ['−1', '1', '−6'], correct: '−1',
            hint: (o) => (o === '1' ? 'b = 1, сумма = −b = −1 🙃' : 'Сумма = −b 🙃'),
            after: <span><X1PX2 /> = −1</span>,
        },
        {
            ask: <span>Значит, корни:</span>, options: ['2 и −3', '−2 и 3', '1 и −6', '2 и 3'], correct: '2 и −3',
            hint: pairHint(-6, -1),
            after: <span style={{ color: ROOT_COLOR }}>Корни: 2 и −3 ✓</span>,
        },
    ],
}
const NegIntroScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig parts={[{ text: 'А теперь посложнее 😏' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && <RoundsBody rounds={[NEG_INTRO_ROUND]} onDone={() => setPhase(2)} />}
            {phase >= 2 && (
                <TypedBig small onDone={() => onSettled?.()} readMs={400}
                    parts={[{ text: 'Корни бывают с ' }, { text: 'МИНУСОМ', color: BAD_COLOR }, { text: '!' }]} />
            )}
        </>
    )
}

const NEG_ROUNDS = [simpleRound(4, -3), simpleRound(-2, -3), simpleRound(2, -4)]
const NegRoundsScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig small parts={[{ text: 'Ещё парочку, с минусами:' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && <RoundsBody rounds={NEG_ROUNDS} onDone={() => onSettled?.()} />}
        </>
    )
}

// 7. На самом деле: c/a и −b/a.
const GeneralScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase !== 3) return
        const t = setTimeout(() => setPhase(4), 2000)
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'До этого везде было ' }, { text: 'a = 1', color: A_COLOR }]} onDone={() => setPhase(1)} readMs={300} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 2))}>
                    <Eq a={1} b={-7} c={12} colors showOne />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedBig small parts={[{ text: 'А если ' }, { text: 'a', color: A_COLOR }, { text: ' не 1? Тогда:' }]} onDone={() => setPhase(3)} readMs={200} />}
            {phase >= 3 && (
                <>
                    <RememberBanner />
                    <Fact><span className="text-2xl md:text-3xl font-black inline-flex items-center gap-2">x₁ · x₂ = <Frac num={<span style={{ color: C_COLOR }}>c</span>} den={<span style={{ color: A_COLOR }}>a</span>} /></span></Fact>
                    <Fact delay={0.7}><span className="text-2xl md:text-3xl font-black inline-flex items-center gap-2">x₁ + x₂ = <Frac num={<span style={{ color: B_COLOR }}>−b</span>} den={<span style={{ color: A_COLOR }}>a</span>} /></span></Fact>
                </>
            )}
            {phase >= 4 && (
                <TypedBig small onDone={() => onSettled?.()} readMs={400}
                    parts={[{ text: 'Просто делим на ' }, { text: 'a', color: A_COLOR }, { text: '. При a = 1 всё как раньше.' }]} />
            )}
        </>
    )
}

// 8. 2x² + 3x − 5 = 0: угадываем x = 1.
const GuessOneScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const next: Record<number, [number, number]> = { 4: [5, 1100], 5: [6, 900], 6: [7, 1300] }
        const s = next[phase]
        if (!s) return
        const t = setTimeout(() => setPhase(s[0]), s[1])
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'Возьмём уравнение с a = 2:' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 2))}>
                    <Eq a={2} b={3} c={-5} colors />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedBig small parts={[{ text: 'Подбирать сложно. ' }, { text: 'УГАДАЕМ', color: REMEMBER_COLOR }, { text: ' один корень!' }]} onDone={() => setPhase(3)} readMs={200} />}
            {phase >= 3 && <TypedBig small parts={[{ text: 'Проверим x = 1' }]} onDone={() => setPhase(4)} readMs={200} />}
            {phase >= 4 && <Fact>2 · 1² + 3 · 1 − 5 = 2 + 3 − 5 = 0</Fact>}
            {phase >= 5 && <Fact color={OK_COLOR}><Pop>Подошло! x₁ = 1 ✓</Pop></Fact>}
            {phase >= 6 && (
                <Fact>
                    <span className="inline-flex items-center gap-1.5">x₁ · x₂ = <Frac num={<span style={{ color: C_COLOR }}>c</span>} den={<span style={{ color: A_COLOR }}>a</span>} /> = <NumText s="−5/2" /></span>
                </Fact>
            )}
            {phase >= 7 && phase < 8 && (
                <QuickPick ask={<span>1 · x₂ = <NumText s="−5/2" />, значит x₂ =</span>} options={['−5/2', '5/2', '−5', '−2/5']} correct="−5/2"
                    hint={() => 'Умножаем на 1 — число не меняется 🙃'} onDone={() => setPhase(8)} />
            )}
            {phase >= 8 && (
                <>
                    <Fact color={ROOT_COLOR}>Корни: 1 и <NumText s="−5/2" /> 🎉</Fact>
                    <TypedBig small onDone={() => onSettled?.()} readMs={400}
                        parts={[{ text: 'x = 1 подходит, если ' }, { text: 'a + b + c = 0', color: REMEMBER_COLOR }]} />
                </>
            )}
        </>
    )
}

// 9. Бывает и x = −1: 3x² + 10x + 7 = 0.
const GuessMinusOneScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const next: Record<number, [number, number]> = { 2: [3, 1300], 3: [4, 1400], 4: [5, 1300] }
        const s = next[phase]
        if (!s) return
        const t = setTimeout(() => setPhase(s[0]), s[1])
        return () => clearTimeout(t)
    }, [phase])
    return (
        <>
            <TypedBig small parts={[{ text: 'А бывает, что подходит ' }, { text: 'x = −1', color: REMEMBER_COLOR }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 2))}>
                    <Eq a={3} b={10} c={7} colors />
                </DiagramBlock>
            )}
            {phase >= 2 && <Fact color={BAD_COLOR}>x = 1: 3 + 10 + 7 = 20 ✗</Fact>}
            {phase >= 3 && <Fact>x = −1: 3 · (−1)² + 10 · (−1) + 7 = 3 − 10 + 7 = 0</Fact>}
            {phase >= 4 && <Fact color={OK_COLOR}><Pop>Подошло! x₁ = −1 ✓</Pop></Fact>}
            {phase >= 5 && (
                <Fact>
                    <span className="inline-flex items-center gap-1.5">x₁ · x₂ = <Frac num={<span style={{ color: C_COLOR }}>c</span>} den={<span style={{ color: A_COLOR }}>a</span>} /> = <NumText s="7/3" /></span>
                </Fact>
            )}
            {phase === 5 && (
                <QuickPick ask={<span>−1 · x₂ = <NumText s="7/3" />, значит x₂ =</span>} options={['−7/3', '7/3', '−3/7', '7']} correct="−7/3"
                    hint={(o) => (o === '7/3' ? 'x₁ = −1, знак меняется! 🙃' : 'Делим 7/3 на −1 🙃')} onDone={() => setPhase(6)} />
            )}
            {phase >= 6 && (
                <>
                    <Fact color={ROOT_COLOR}>Корни: −1 и <NumText s="−7/3" /> 🎉</Fact>
                    <TypedBig small onDone={() => onSettled?.()} readMs={400}
                        parts={[{ text: 'x = −1 подходит, когда ' }, { text: 'a − b + c = 0', color: REMEMBER_COLOR }]} />
                </>
            )}
        </>
    )
}

// 10. Раунды «угадай корень».
const GUESS_ROUNDS = [guessRound(3, -7, 4, 1), guessRound(2, 5, 3, -1), guessRound(5, 2, -7, 1), guessRound(4, 3, -1, -1)]
const GuessRoundsScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig small parts={[{ text: 'Теперь сам: угадай корень, потом второй' }]} onDone={() => setPhase(1)} readMs={200} />
            {phase >= 1 && <RoundsBody rounds={GUESS_ROUNDS} onDone={() => onSettled?.()} />}
        </>
    )
}

const ReadyScene = ({ onSettled }: SceneProps) => (
    <TypedBig parts={[{ text: 'Приготовься, пора ' }, { text: 'блистать знаниями!', color: REMEMBER_COLOR }]} onDone={() => onSettled?.()} readMs={300} />
)

const SCENES = [Guess56Scene, Guess712Scene, CoefScene, RuleScene, SimpleRoundsScene, NegIntroScene, NegRoundsScene, GeneralScene, GuessOneScene, GuessMinusOneScene, RaceScene, GuessRoundsScene, ReadyScene]
const FIXED_NEXT_LABELS = new Map<unknown, string>([
    [CoefScene, 'Невидимка, понял 👀'],
    [RuleScene, 'Запомнил!'],
    [RaceScene, 'Виета имба ⚡'],
    [GeneralScene, 'Логично'],
    [ReadyScene, 'ЛЕТС ГООООУ'],
])

// ===== Квиз =====
type Trial = { prompt: React.ReactNode; eq: EqSpec; options: string[]; correct: string; hint: string }

const makeTrials = (): Trial[] => [
    { prompt: 'Подбери корни', eq: { a: 1, b: -10, c: 21 }, options: shuffle(['3 и 7', '−3 и −7', '1 и 21', '3 и −7']), correct: '3 и 7', hint: '3 · 7 = 21 = c, 3 + 7 = 10 = −b.' },
    { prompt: 'Подбери корни', eq: { a: 1, b: 3, c: -10 }, options: shuffle(['2 и −5', '−2 и 5', '1 и −10', '2 и 5']), correct: '2 и −5', hint: '2 · (−5) = −10 = c, 2 + (−5) = −3 = −b.' },
    { prompt: 'Чему равно x₁ · x₂?', eq: { a: 2, b: -7, c: 3 }, options: shuffle(['3/2', '3', '−3/2', '2/3']), correct: '3/2', hint: 'x₁ · x₂ = c/a = 3/2.' },
    { prompt: 'Угадай корень и найди второй', eq: { a: 4, b: -1, c: -3 }, options: shuffle(['1 и −3/4', '1 и 3/4', '−1 и 3/4', '1 и −4/3']), correct: '1 и −3/4', hint: '4 − 1 − 3 = 0, значит x₁ = 1, а x₂ = c/a = −3/4.' },
    { prompt: 'Угадай корень и найди второй', eq: { a: 2, b: 7, c: 5 }, options: shuffle(['−1 и −5/2', '1 и −5/2', '−1 и 5/2', '−1 и −2/5']), correct: '−1 и −5/2', hint: '2 − 7 + 5 = 0, значит x₁ = −1, а x₂ = (5/2) : (−1) = −5/2.' },
    { prompt: 'Бонус! Кто теперь шарит в теореме Виета? 😎', eq: { a: 1, b: -5, c: 6 }, options: ['Я 😎'], correct: 'Я 😎', hint: 'Без вариантов — ты! Произведение, сумма, угадывание корня — всё твоё 🔥' },
]

const pickTrialFeedback = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
export const TypeVietaWalk = ({ onAnswer, onComplete }: Props) => {
    const INTRO_STEPS = SCENES.length
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials] = useState<Trial[]>(makeTrials)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<string[]>([])
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(FIXED_NEXT_LABELS.get(SCENES[step]) ?? pickFun()) }, [step])

    const answer = (ok: boolean, key: string) => {
        if (checked || wrongTried.includes(key)) return
        if (ok) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setChecked(true)
            setTrialNextLabel(pickFun())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((prev) => [...prev, key])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (trialIndex + 1 >= trials.length) {
                setAdvancing(false)
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
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
            if (step + 1 >= INTRO_STEPS) setPhase('practice')
            else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice(6))
            return idx > 0 ? `trial-${idx - 1}` : `step-${INTRO_STEPS - 1}`
        }
        const idx = Number(key.slice(5))
        return idx > 0 ? `step-${idx - 1}` : null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null
    const handleReplay = () => {
        bumpNonce(latestSceneKey)
        if (phase === 'intro') setStepReady(false)
        else { setChecked(false); setWrongTried([]); setWrongFlash(null) }
    }
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            setTrialIndex(Number(target.slice(6)))
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
        } else {
            setPhase('intro')
            setStep(Number(target.slice(5)))
            setStepReady(false)
        }
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

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                            <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                                {i === 0 && (
                                    <div className="w-full flex items-center gap-3" aria-hidden>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                    </div>
                                )}
                                <div className="relative w-full flex items-center justify-center min-h-9">
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{ borderColor: hexToRgba(A_COLOR, 0.55), backgroundColor: hexToRgba(A_COLOR, 0.16), color: A_COLOR }}
                                    >
                                        <span>{i + 1}</span>
                                        <span className="opacity-50 font-normal">/</span>
                                        <span>{trials.length}</span>
                                    </div>
                                    <p className="text-base md:text-lg text-[#F2F7FB] text-center px-16">{t.prompt}</p>
                                </div>
                                <Eq {...t.eq} colors size="text-2xl md:text-3xl" />
                                <div className={cn('drop-in-options grid gap-3', t.options.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                                    {t.options.map((o) => {
                                        const isWrong = isCurrent && wrongTried.includes(o)
                                        const state = isDone && o === t.correct ? 'correct' : isWrong ? 'wrong' : 'idle'
                                        return (
                                            <button
                                                key={o}
                                                type="button"
                                                disabled={isDone || isWrong}
                                                onClick={isDone ? undefined : () => answer(o === t.correct, o)}
                                                className={cn(
                                                    'flex min-h-[64px] items-center justify-center py-3 px-3 rounded-xl border-2 text-xl md:text-2xl font-extrabold text-center transition-colors',
                                                    state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
                                                    state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
                                                    state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                                )}
                                            >
                                                <NumText s={o} />
                                            </button>
                                        )
                                    })}
                                </div>
                                {isCurrent && !checked && (
                                    wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант</p>
                                    )
                                )}
                                {isDone && (
                                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                        {pickTrialFeedback(i)} {t.hint}
                                    </FieryFeedbackBanner>
                                )}
                                {isCurrent && checked && <LocalAnswerConfetti />}
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
                        {introNextLabel}
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
