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
//   8. при a ≠ 1 тупо проверяем x₁ = 1 (2x² + 3x − 5 = 0, подстановка), потом 3 уравнения с x₁ = 1 сам.
// Потом «Проверим себя». Ошибки в мини-играх не засчитываются, в «Проверим себя» — да.

'use client'

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
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
    RememberPlate, MarkerLoop, ZakrepPlate,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { DifficultyBadge } from '@/components/difficulty-badge'

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

type BigPart = { text: string; color?: string; marker?: string }
const TypedBig = ({ parts, onDone, readMs = 500, small }: { parts: BigPart[]; onDone?: () => void; readMs?: number; small?: boolean }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
            {!typed ? (
                <Typewriter text={parts.map((p) => p.text).join('')} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }} />
            ) : (
                parts.map((p, i) => <span key={i} data-marker={p.marker} style={p.color ? { color: p.color } : undefined}>{p.text}</span>)
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
// focus — подсветить b или c (как в уроке 488: всё остальное бледное и серое, выбранное — в рамке со свечением).
const DIM_STYLE: React.CSSProperties = { opacity: 0.25, filter: 'grayscale(1)' }
const FocusBox = ({ on, color, children }: { on: boolean; color: string; children: React.ReactNode }) => (
    <span className="inline-flex items-center rounded-xl px-1.5 transition-all duration-500"
        style={on ? { border: `2px solid ${color}`, backgroundColor: hexToRgba(color, 0.16), boxShadow: `0 0 14px ${hexToRgba(color, 0.45)}` }
            : { border: '2px solid transparent' }}>
        {children}
    </span>
)
const Eq = ({ a, b, c, colors, showOne, focus, size = 'text-3xl md:text-4xl' }: EqSpec & { colors?: boolean; showOne?: boolean; focus?: 'b' | 'c' | null; size?: string }) => {
    const col = (k: string) => (colors ? { color: k } : undefined)
    const aTxt = a === 1 ? '' : a === -1 ? '−' : fmt(a)
    const bAbs = Math.abs(b) === 1 ? '' : `${Math.abs(b)}`
    const dim = (part: 'a' | 'b' | 'c' | 'rest'): React.CSSProperties | undefined => (focus && focus !== part ? DIM_STYLE : undefined)
    return (
        <div className={cn('w-full flex items-center justify-center font-black text-[#F2F7FB] whitespace-nowrap', size)}>
            <span className="inline-flex items-center transition-all duration-500" style={dim('a')}>
                {a === 1 && showOne && (
                    <motion.span initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55, duration: 0.9 }}
                        className="inline-flex mr-0.5" style={{ color: A_COLOR }}>1·</motion.span>
                )}
                <span style={col(A_COLOR)}>{aTxt}</span>
                <span>x²</span>
            </span>
            {b !== 0 && (
                <>
                    <FocusBox on={focus === 'b'} color={B_COLOR}>
                        <span data-marker="eq-b" className="inline-flex items-center transition-all duration-500" style={dim('b')}>
                            <span className="mx-1.5" style={col(B_COLOR)}>{b < 0 ? '−' : '+'}</span>
                            <span style={col(B_COLOR)}>{bAbs}</span>
                        </span>
                    </FocusBox>
                    <span className="transition-all duration-500" style={dim('rest')}>x</span>
                </>
            )}
            <FocusBox on={focus === 'c'} color={C_COLOR}>
                <span data-marker="eq-c" className="inline-flex items-center transition-all duration-500" style={dim('c')}>
                    <span className="mx-1.5" style={col(C_COLOR)}>{c < 0 ? '−' : '+'}</span>
                    <span style={col(C_COLOR)}>{Math.abs(c)}</span>
                </span>
            </FocusBox>
            <span className="ml-1.5 transition-all duration-500" style={dim('rest')}>= 0</span>
        </div>
    )
}

const RememberBanner = ({ children }: { children?: React.ReactNode }) => <RememberPlate title={children ?? 'ЗАПОМНИ!'} />

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
            {ask && <div className="text-xl md:text-2xl font-black text-center text-[#F2F7FB]"><Pop>{ask}</Pop></div>}
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

const RoundsBody = ({ rounds, onDone, doneText, hideBadge }: { rounds: Round[]; onDone: () => void; doneText?: React.ReactNode; hideBadge?: boolean }) => {
    const [r, setR] = useState(0)
    const [doneSteps, setDoneSteps] = useState(0)
    const [praise, setPraise] = useState<string | null>(null)
    if (r >= rounds.length) {
        return (
            <div className="w-full flex flex-col items-center gap-2">
                <Pop><span className="text-2xl font-black" style={{ color: OK_COLOR }}>{doneText ?? 'Все раунды пройдены! 🔥'}</span></Pop>
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
            {!hideBadge && (
                <div className="w-full flex items-center justify-center gap-3">
                    <RoundBadge n={r + 1} total={rounds.length} />
                </div>
            )}
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
    // Верно — числа остаются белыми, рамка бледно-зелёная: иначе зелёные 3 и 4 сливались с салатовым c (12).
    const border = state === 'ok' ? hexToRgba(OK_COLOR, 0.45) : state === 'bad' ? BAD_COLOR : active ? hexToRgba(ROOT_COLOR, 0.7) : '#3A464E'
    const color = state === 'bad' ? BAD_COLOR : '#F2F7FB'
    const bg = state === 'ok' ? hexToRgba(OK_COLOR, 0.07) : state === 'bad' ? hexToRgba(BAD_COLOR, 0.12) : '#161F23'
    return (
        <button type="button" onClick={onClick}
            className="min-w-[56px] h-[52px] px-2 rounded-xl border-2 border-b-4 active:border-b-2 font-black transition-colors"
            style={{ borderColor: border, color, backgroundColor: bg }}>
            {val !== null
                ? <motion.span key={val} initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 16 }} className="inline-block">{fmt(val)}</motion.span>
                : <span className={cn('text-xl', active && !state && 'animate-slot-label')}
                    style={{ color: active ? ROOT_COLOR : '#5C6B73', ['--slot-c' as string]: ROOT_COLOR }}>{label}</span>}
        </button>
    )
}

// Мини-игра «собери пару»: x₁ · x₂ = c и x₁ + x₂ = s, числа снизу. Неверно — тряска и сброс.
// assemble (1-е уравнение): правая часть сначала пустая; через 2 с сверху спускается c, затем −b —
// на полпути останавливается, пружинит и превращается в b с другим знаком.
// «Собираем правую часть» (первые два уравнения): вокруг коэффициента в уравнении «рисуется» пунктирный
// овал, и число вместе с этим овалом (тот же размер и стиль) плавно едет вниз к своей строке. У суммы стикер на полпути
// останавливается, знак «−» с отскоком меняется на «+», держим 1 с и едем дальше. На месте рамка и «+»
// гаснут, остаётся число. Координаты меряем по DOM (data-marker), относительно контейнера сцены.
type FlightKind = 'prod' | 'sum' | 'plain'
const FLIGHT_STEPS: Record<FlightKind, { stage: string; ms: number }[]> = {
    prod: [{ stage: 'outline', ms: 1000 }, { stage: 'move', ms: 1000 }, { stage: 'land', ms: 750 }],
    // Число со своим знаком едет без превращения «−» в «+» (первое уравнение: −5 садится на b в «−b»).
    plain: [{ stage: 'outline', ms: 1000 }, { stage: 'move', ms: 1100 }, { stage: 'land', ms: 750 }],
    sum: [{ stage: 'outline', ms: 1000 }, { stage: 'move1', ms: 750 }, { stage: 'look', ms: 500 },
        { stage: 'flip', ms: 550 }, { stage: 'hold', ms: 1000 }, { stage: 'move2', ms: 900 }, { stage: 'land', ms: 750 }],
}
type Rect = { cx: number; cy: number; w: number; h: number; font: number }
const measure = (root: HTMLElement, marker: string): Rect | null => {
    const el = root.querySelector<HTMLElement>(`[data-marker="${marker}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect(), o = root.getBoundingClientRect()
    return { cx: r.left - o.left + r.width / 2, cy: r.top - o.top + r.height / 2, w: r.width, h: r.height, font: parseFloat(getComputedStyle(el).fontSize) || 30 }
}
const StickerFlight = ({ rootRef, kind, from, to, startValue, value, color, onDone }: {
    rootRef: React.RefObject<HTMLDivElement>; kind: FlightKind; from: string; to: string
    startValue: number; value: number; color: string; onDone: () => void
}) => {
    const [rects, setRects] = useState<{ a: Rect; b: Rect } | null>(null)
    const [step, setStep] = useState(0)
    const [digitOff, setDigitOff] = useState(0)
    const maskId = `sf-${useId().replace(/:/g, '')}`
    const boxRef = useRef<HTMLDivElement>(null)
    const digitRef = useRef<HTMLSpanElement>(null)
    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        const a = measure(root, from), b = measure(root, to)
        if (a && b) setRects({ a, b })
        else onDone()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    useLayoutEffect(() => {
        if (!rects || !boxRef.current || !digitRef.current) return
        const box = boxRef.current.getBoundingClientRect(), d = digitRef.current.getBoundingClientRect()
        setDigitOff(d.left + d.width / 2 - (box.left + box.width / 2))
    }, [rects])
    const steps = FLIGHT_STEPS[kind]
    useEffect(() => {
        if (!rects) return
        if (step >= steps.length) { onDone(); return }
        const t = setTimeout(() => setStep((x) => x + 1), steps[step].ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rects, step])
    // После последнего этапа стикер остаётся на месте, пока родитель его не уберёт: число в строке
    // появляется в том же кадре, без пустой вспышки.
    if (!rects) return null
    const stage = steps[Math.min(step, steps.length - 1)].stage
    const { a, b } = rects
    const scaleEnd = b.font / a.font
    // Цель: цифра стикера встаёт ровно на место числа в строке.
    const dx = b.cx - digitOff * scaleEnd - a.cx, dy = b.cy - a.cy
    const scaleMid = (1 + scaleEnd) / 2
    const flipped = kind === 'sum' && ['flip', 'hold', 'move2', 'land'].includes(stage)
    const shown = flipped ? value : startValue
    const signTxt = shown < 0 ? '−' : '+'
    const fadeSign = value >= 0
    let pos = { x: 0, y: 0, scale: 1 }, dur = 0.3, ease: number[] | string = 'easeInOut'
    if (stage === 'move') { pos = { x: dx, y: dy, scale: scaleEnd }; dur = 1; ease = [0.45, 0, 0.25, 1] }
    if (stage === 'move1' || stage === 'look' || stage === 'flip' || stage === 'hold') { pos = { x: dx / 2, y: dy / 2, scale: stage === 'hold' ? scaleMid * 1.12 : scaleMid }; dur = 0.75; ease = [0.2, 0.7, 0.3, 1] }
    if (stage === 'flip') dur = 0.3
    if (stage === 'move2' || stage === 'land') { pos = { x: dx, y: dy, scale: scaleEnd }; dur = 0.9; ease = [0.45, 0, 0.25, 1] }
    const sticker = stage !== 'outline'
    const landing = stage === 'land'
    // Пунктирный овал — того же размера, что вокруг коэффициента в уравнении; не масштабируется.
    const ow = a.w + 20, oh = a.h + 12, sw = 2.5
    return (
        <div className="absolute pointer-events-none z-20" style={{ left: a.cx, top: a.cy, width: 0, height: 0 }}>
            <motion.div className="absolute left-0 top-0" initial={false} animate={{ x: pos.x, y: pos.y }} transition={{ duration: dur, ease }}>
                {/* Стеклянная подложка: размывает то, что под цифрой, пока она едет */}
                <motion.div className="absolute rounded-full" style={{
                    left: -ow / 2, top: -oh / 2, width: ow, height: oh,
                    background: `linear-gradient(${hexToRgba(color, 0.18)}, ${hexToRgba(color, 0.18)}), rgba(22, 31, 35, 0.62)`,
                    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                }} initial={{ opacity: 0 }} animate={{ opacity: sticker && !landing ? 1 : 0 }} transition={{ duration: landing ? 0.45 : 0.25 }} />
                <motion.svg className="absolute overflow-visible" width={ow} height={oh} style={{ left: -ow / 2, top: -oh / 2 }}
                    initial={false} animate={{ opacity: landing ? 0 : 1 }} transition={{ duration: 0.45 }}>
                    <defs>
                        <mask id={maskId} maskUnits="userSpaceOnUse" x={-10} y={-10} width={ow + 20} height={oh + 20}>
                            <motion.rect x={sw / 2} y={sw / 2} width={ow - sw} height={oh - sw} rx={(oh - sw) / 2}
                                fill="none" stroke="white" strokeWidth={sw * 3}
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.75, ease: 'easeInOut' }} />
                        </mask>
                    </defs>
                    <rect x={sw / 2} y={sw / 2} width={ow - sw} height={oh - sw} rx={(oh - sw) / 2}
                        fill="none" stroke={color} strokeWidth={sw} strokeDasharray="7 6" strokeLinecap="round" mask={`url(#${maskId})`} />
                </motion.svg>
                <motion.div className="absolute left-0 top-0" initial={false} animate={{ scale: pos.scale }} transition={{ duration: dur, ease }}>
                    <div ref={boxRef} className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center whitespace-nowrap font-black"
                        style={{ fontSize: a.font, color, opacity: sticker ? 1 : 0 }}>
                        <motion.span key={signTxt} className="relative inline-block mr-0.5"
                            initial={flipped ? { scale: 2.2, rotate: -90 } : false}
                            animate={landing && fadeSign ? { scale: 1.9, opacity: 0 } : { scale: 1, rotate: 0, opacity: 1 }}
                            transition={landing ? { duration: 0.55, ease: 'easeOut' } : { type: 'spring', stiffness: 420, damping: 10 }}>
                            {signTxt}
                        </motion.span>
                        <motion.span ref={digitRef} key={`d${flipped}`} className="relative inline-block"
                            initial={flipped ? { scale: 1.6 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }}>
                            {Math.abs(shown)}
                        </motion.span>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

// asm — правая часть собирается снаружи (StickerFlight): пока prod/sum false, число невидимо (место держим).
// rightOverride — своё содержимое правой части строки (буквы c / −b, «− −5» и т.п.), rowsShown — сколько строк системы видно.
const PairBuilder = ({ c, s, nums, onSolved, focus, asm, between, rightOverride, rowsShown = 2 }: { c: number; s: number; nums: number[]; onSolved: () => void; focus?: 'prod' | 'sum' | null; asm?: { prod: boolean; sum: boolean; nums: boolean }; between?: React.ReactNode; rightOverride?: { prod?: React.ReactNode; sum?: React.ReactNode }; rowsShown?: number }) => {
    const [vals, setVals] = useState<(number | null)[]>([null, null])
    const [active, setActive] = useState(0)
    const [result, setResult] = useState<'ok' | 'bad' | null>(null)
    // Сначала показываем строки x₁ · x₂ и x₁ + x₂, через 1 с падают числа-варианты.
    const [showNums, setShowNums] = useState(false)
    useEffect(() => {
        if (asm) { if (asm.nums) setShowNums(true); return }
        const t = setTimeout(() => setShowNums(true), 1500)
        return () => clearTimeout(t)
    }, [asm?.nums])
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
    const row = (op: string, right: number, color: string, ok: boolean, kind: 'prod' | 'sum') => (
        <motion.div animate={result === 'bad' && !ok ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5 text-2xl md:text-3xl font-black text-[#F2F7FB] transition-all duration-500"
            style={focus && focus !== kind ? DIM_STYLE : undefined}>
            {/* При подсветке своей строки бледнеют числа и «=», ярко — только знак (в маркере) и результат. */}
            <span className="inline-flex transition-all duration-500" style={focus === kind ? DIM_STYLE : undefined}>
                <PairSlot label="x₁" val={vals[0]} active={active === 0 && !result} state={rowState(ok)} onClick={() => !result && setActive(0)} />
            </span>
            <span className="relative inline-flex px-0.5">
                {op}
                {focus === kind && <MarkerLoop pad={10} />}
            </span>
            <span className="inline-flex transition-all duration-500" style={focus === kind ? DIM_STYLE : undefined}>
                <PairSlot label="x₂" val={vals[1]} active={active === 1 && !result} state={rowState(ok)} onClick={() => !result && setActive(1)} />
            </span>
            <span className="transition-all duration-500" style={focus === kind ? DIM_STYLE : undefined}>=</span>
            <FocusBox on={focus === kind} color={color}>{rightOverride?.[kind] !== undefined
                ? <span className="inline-flex items-center" style={{ color }}>{rightOverride[kind]}</span>
                : <span data-marker={`slot-${kind}`} className={asm && !asm[kind] ? 'invisible' : undefined} style={{ color }}>{fmt(right)}</span>}</FocusBox>
            <span className="w-7 transition-all duration-500" style={focus === kind ? DIM_STYLE : undefined}>{mark(ok)}</span>
        </motion.div>
    )
    return (
        <div className="w-full flex flex-col items-center gap-4">
            {/* Строки системы падают сверху по очереди, как варианты ответа */}
            <div className="drop-in-options flex flex-col items-center gap-3">
                <div>{row('·', c, C_COLOR, prodOk, 'prod')}</div>
                {rowsShown >= 2 && <div>{row('+', s, B_COLOR, sumOk, 'sum')}</div>}
            </div>
            {between}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] transition-all duration-500 min-h-[122px]" style={focus ? DIM_STYLE : undefined}>
                {showNums && nums.map((n, i) => {
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
// explain (2-е уравнение): после «КОРНИ» по очереди подсвечиваем (остальное бледное, как в уроке 488)
// 12 справа и +12 в уравнении, потом 7 и −7 — «знак НАОБОРОТ».
const PairGuessScene = ({ onSettled, intro, sysText, x1, x2, nums, explain, assemble, memo, quickMemo }: SceneProps & { intro: string; sysText?: string; x1: number; x2: number; nums: number[]; explain?: boolean; assemble?: boolean; memo?: boolean; quickMemo?: boolean }) => {
    const [phase, setPhase] = useState(0)
    const b = -(x1 + x2), c = x1 * x2
    // memo (1-е уравнение): «Запомни систему:» → строка x₁·x₂ = c → «Ага, вижу c справа» → строка x₁+x₂ = −b →
    // «Ого, а тут МИНУС b» → сборка. 0 — видна 1-я строка, 1 — кнопка, 2 — видны обе, 3 — кнопка, 4 — дальше.
    // quickMemo (2-е уравнение): система сразу целиком → кнопка «Систему запомнил» → сборка.
    const [memoStep, setMemoStep] = useState(memo ? (quickMemo ? 2 : 0) : 4)
    useEffect(() => {
        if (!memo || phase < 3 || (memoStep !== 0 && memoStep !== 2)) return
        const t = setTimeout(() => setMemoStep((x) => x + 1), 1300)
        return () => clearTimeout(t)
    }, [memo, phase, memoStep])
    const focus: 'prod' | 'sum' | null = phase >= 5 && phase <= 6 ? 'prod' : phase === 7 ? 'sum' : null
    const eqFocus = focus === 'prod' ? 'c' : focus === 'sum' ? 'b' : null
    const rootRef = useRef<HTMLDivElement>(null)
    // Сборка правой части. Обычно: 0 — ждём, 1 — летит c, 2 — летит −b (−→+), 3 — «Подбери», 4 — числа-варианты.
    // memo: 1 — c садится поверх «c», 2 — −5 садится на b в «−b», 3 — «− −5» и обводка минусов, 4 — «+5», 5 — «Подбери», 6 — числа.
    const numsStep = memo ? 6 : 4
    const [asmStep, setAsmStep] = useState(assemble ? 0 : numsStep)
    useEffect(() => {
        if (!assemble || phase < 3 || asmStep !== 0 || memoStep < 4) return
        const t = setTimeout(() => setAsmStep(1), memo ? 700 : 1400)
        return () => clearTimeout(t)
    }, [assemble, phase, asmStep, memoStep, memo])
    useEffect(() => {
        if (!memo || (asmStep !== 3 && asmStep !== 4)) return
        const t = setTimeout(() => setAsmStep((x) => x + 1), asmStep === 3 ? 1900 : 1300)
        return () => clearTimeout(t)
    }, [memo, asmStep])
    const asm = assemble ? (memo
        ? { prod: asmStep >= 2, sum: asmStep >= 5, nums: asmStep >= 6 }
        : { prod: asmStep >= 2, sum: asmStep >= 3, nums: asmStep >= 4 }) : undefined
    // memo: правая часть — фиксированная раскладка, ничего не прыгает. Цифра встаёт поверх буквы (c / b),
    // буква гаснет как раз к посадке стикера, а число в строке появляется в тот же кадр, когда стикер исчезает.
    const cell = { gridArea: '1 / 1' } as const
    const fadeAt = (on: boolean, delayMs: number) => ({ ...cell, opacity: on ? 0 : 1, transition: on ? `opacity 400ms ease ${delayMs}ms` : 'none' })
    const memoRight = memo ? {
        prod: (
            <span className="inline-grid justify-items-center">
                <span data-marker="slot-prod" style={fadeAt(asmStep >= 1, 1800)}>c</span>
                <span style={{ ...cell, opacity: asmStep >= 2 ? 1 : 0 }}>{c}</span>
            </span>
        ),
        sum: (
            <span className="inline-flex items-center">
                <motion.span className={`relative inline-grid justify-items-center ${asmStep >= 5 ? 'overflow-hidden' : ''}`}
                    initial={false} animate={{ width: asmStep >= 5 ? 0 : 'auto', opacity: asmStep >= 5 ? 0 : 1 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}>
                    <span className="inline-flex items-center whitespace-nowrap" style={{ ...cell, opacity: asmStep >= 4 ? 0 : 1, transition: 'opacity 200ms' }}>
                        <span>−</span>
                        <span className="inline-block ml-2 mr-0.5" style={{ opacity: asmStep >= 3 ? 1 : 0 }}>−</span>
                    </span>
                    {asmStep >= 4 && (
                        <motion.span className="inline-block" style={cell} initial={{ scale: 2.4, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 10 }}>+</motion.span>
                    )}
                    {asmStep === 3 && <MarkerLoop pad={8} />}
                </motion.span>
                <span className="inline-grid justify-items-center">
                    <span data-marker="slot-sum" style={fadeAt(asmStep >= 2, 1900)}>b</span>
                    <span style={{ ...cell, opacity: asmStep >= 3 ? 1 : 0 }}>{-b}</span>
                </span>
            </span>
        ),
    } : undefined
    const memoBtn = (label: string, next: number) => (
        <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <button type="button" onClick={() => setMemoStep(next)} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                {label}
            </button>
        </motion.div>
    )
    return (
        <div ref={rootRef} className="relative w-full flex flex-col items-center gap-4">
            <TypedBig small parts={[{ text: intro }]} onDone={() => setPhase(1)} readMs={150} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 2))}>
                    <Eq a={1} b={b} c={c} colors focus={eqFocus} />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedBig small parts={[{ text: sysText ?? (memo ? 'Запомни систему:' : assemble ? 'Составим систему:' : 'Подбери 2 числа 👇') }]} onDone={() => setPhase((p) => Math.max(p, 3))} readMs={150} />}
            {phase >= 3 && <PairBuilder c={c} s={-b} nums={nums} focus={focus} asm={asm} onSolved={() => setPhase(4)}
                rightOverride={memoRight} rowsShown={memo && memoStep < 2 ? 1 : 2}
                between={assemble && asmStep >= numsStep - 1 ? <TypedBig small parts={[{ text: 'Подбери x₁ x₂ 👆' }]} onDone={() => setAsmStep((x) => Math.max(x, numsStep))} readMs={150} />
                    : memo && memoStep === 1 ? memoBtn('Произведение = Цэ', 2)
                    : memo && memoStep === 3 ? memoBtn(quickMemo ? 'Систему запомнил' : 'Сумма = МИНУС b', 4)
                    : undefined} />}

            {asmStep === 1 && (
                <StickerFlight rootRef={rootRef} kind="prod" from="eq-c" to="slot-prod" startValue={c} value={c} color={C_COLOR}
                    onDone={() => setAsmStep(2)} />
            )}
            {asmStep === 2 && (
                <StickerFlight rootRef={rootRef} kind={memo ? 'plain' : 'sum'} from="eq-b" to="slot-sum" startValue={b} value={memo ? b : -b} color={B_COLOR}
                    onDone={() => setAsmStep(3)} />
            )}
            {phase >= 4 && (
                <TypedBig onDone={() => (explain ? setPhase(5) : onSettled?.())} readMs={explain ? 900 : 300}
                    parts={[{ text: `${x1} и ${x2} это ` }, { text: 'КОРНИ', color: ROOT_COLOR }, { text: ' 🎯' }]} />
            )}
            {explain && phase >= 5 && (
                <TypedBig small onDone={() => setPhase((p) => Math.max(p, 6))} readMs={700}
                    parts={[{ text: 'Смотри! ' }, { text: `${c}`, color: C_COLOR }, { text: ' пишем просто' }]} />
            )}
            {explain && phase === 6 && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <button type="button" onClick={() => setPhase(7)} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                        Понял-принял
                    </button>
                </motion.div>
            )}
            {explain && phase >= 7 && (
                <TypedBig small onDone={() => setPhase(8)} readMs={1400}
                    parts={[{ text: 'а у ' }, { text: `${-b}`, color: B_COLOR }, { text: ' ' }, { text: 'МЕНЯЕТСЯ', color: REMEMBER_COLOR }, { text: ' знак!' }]} />
            )}
            {explain && phase >= 8 && <PauseThen ms={300} onDone={() => onSettled?.()} />}
        </div>
    )
}
const PauseThen = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}
const Guess56Scene = (p: SceneProps) => <PairGuessScene {...p} intro="Вот уравнение:" x1={2} x2={3} nums={[1, 2, 3, 4, 5, 6]} assemble memo />
const Guess712Scene = (p: SceneProps) => <PairGuessScene {...p} intro="А вот ещё одно:" sysText="Составим систему:" x1={3} x2={4} nums={[1, 2, 3, 4, 6, 12]} assemble memo quickMemo />

// «КОМБО»: решаем Виетом в 2 этапа. Этап 1 — правая часть (c и −b), этап 2 — подбираем x₁ и x₂.
// Система одна на оба этапа и не перерисовывается: меняются только варианты снизу и плашка этапа (с отскоком).
// Ошибка не в зачёт.
type ComboRound = { b: number; c: number; nums: number[]; roots: number[] }
// После «ЗАКРЕП» (a = 1, раньше тут были 4 раунда только с правой частью).
// 3 примера с положительными корнями, 2 — один плюс, другой минус, 2 — оба отрицательные.
const ZAKREP_ROUNDS: ComboRound[] = [
    { b: -5, c: 4, nums: [4, -4, 5, -5, 1, 9], roots: [1, 4, 2, -1, -4, 5] },
    { b: -8, c: 15, nums: [15, -15, 8, -8, 2, 23], roots: [3, 5, -3, -5, 1, 15] },
    { b: -9, c: 14, nums: [14, -14, 9, -9, 5, 23], roots: [2, 7, -2, -7, 1, 14] },
    { b: 1, c: -12, nums: [-12, 12, -1, 1, 7, -7], roots: [3, -4, -3, 4, 2, 6] },
    { b: -3, c: -10, nums: [-10, 10, 3, -3, 7, -7], roots: [5, -2, -5, 2, 1, 10] },
    { b: 7, c: 10, nums: [10, -10, -7, 7, 3, -3], roots: [-2, -5, 2, 5, -1, -10] },
    { b: 8, c: 12, nums: [12, -12, -8, 8, 4, -4], roots: [-2, -6, 2, 6, -3, -4] },
]
// Сложность раунда: оба корня положительные — 1, разных знаков — 2, оба отрицательные — 3.
const rootsLevel = (r: ComboRound): 1 | 2 | 3 => (r.c < 0 ? 2 : -r.b > 0 ? 1 : 3)
const STAGE_TEXT = { 1: 'Этап 1: правая часть', 2: 'Этап 2: подбираем x₁ и x₂' } as const
const ComboRoundView = ({ r, colors, onSolved }: { r: ComboRound; colors: boolean; onSolved: () => void }) => {
    const [stage, setStage] = useState<1 | 2>(1)
    const [right, setRight] = useState<(number | null)[]>([null, null])
    const [roots, setRoots] = useState<(number | null)[]>([null, null])
    const [active, setActive] = useState(0)
    const [result, setResult] = useState<'ok' | 'bad' | null>(null)
    const [showNums, setShowNums] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setShowNums(true), 1500)
        return () => clearTimeout(t)
    }, [])
    const target = [r.c, -r.b]
    const vals = stage === 1 ? right : roots
    const setVals = stage === 1 ? setRight : setRoots
    const isOk = (next: (number | null)[]) => stage === 1
        ? next[0] === target[0] && next[1] === target[1]
        : next[0]! * next[1]! === r.c && next[0]! + next[1]! === -r.b
    const pick = (n: number) => {
        if (result) return
        const next = [...vals]
        next[active] = n
        setVals(next)
        const other = active === 0 ? 1 : 0
        if (next[other] === null) { setActive(other); return }
        if (isOk(next)) {
            setResult('ok'); showAnswerMeme(true)
            setTimeout(() => {
                if (stage === 1) { setStage(2); setResult(null); setActive(0) }
                else onSolved()
            }, 1100)
        } else {
            setResult('bad'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setTimeout(() => { setResult(null); setVals([null, null]); setActive(0) }, 1500)
        }
    }
    const filled = vals[0] !== null && vals[1] !== null
    const rowOk = (i: number) => stage === 1
        ? right[i] === target[i]
        : filled && (i === 0 ? roots[0]! * roots[1]! === r.c : roots[0]! + roots[1]! === -r.b)
    const rowState = (i: number): 'ok' | 'bad' | null => (result && filled ? (rowOk(i) ? 'ok' : 'bad') : null)
    // Этап 1: подсвечиваем строку, правую часть которой заполняем сейчас (сначала произведение, потом сумма), другая бледная.
    const focusRow = stage === 1 && !result ? active : null
    const row = (i: number, op: string, color: string) => {
        const st = rowState(i)
        // Правая часть: в 1-м этапе — пропуск, во 2-м — уже составленное число.
        const rv = right[i]
        // Заполненная правая часть — нейтральная рамка (зелёная сбивала с толку), красная — только при ошибке.
        const rightBorder = stage === 2 ? '#3A464E'
            : st === 'bad' ? BAD_COLOR : active === i && !result ? hexToRgba(B_COLOR, 0.75) : '#3A464E'
        return (
            <motion.div animate={st === 'bad' ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}
                className="flex items-center gap-2.5 text-2xl md:text-3xl font-black text-[#F2F7FB] rounded-2xl px-2 py-1.5 border-2 transition-all duration-500"
                style={focusRow === null ? { borderColor: 'transparent' }
                    : focusRow === i ? { borderColor: hexToRgba(B_COLOR, 0.55) }
                        : { borderColor: 'transparent', opacity: 0.3, filter: 'grayscale(1)' }}>
                <span className="w-7" />
                <PairSlot label="x₁" val={roots[0]} active={stage === 2 && active === 0 && !result} state={stage === 2 ? st : null}
                    onClick={() => stage === 2 && !result && setActive(0)} />
                <span>{op}</span>
                <PairSlot label="x₂" val={roots[1]} active={stage === 2 && active === 1 && !result} state={stage === 2 ? st : null}
                    onClick={() => stage === 2 && !result && setActive(1)} />
                <span>=</span>
                <button type="button" onClick={() => stage === 1 && !result && setActive(i)}
                    className="min-w-[64px] h-[52px] px-2 rounded-xl border-2 border-b-4 bg-[#161F23] flex items-center justify-center transition-colors"
                    style={{ borderColor: rightBorder }}>
                    {rv !== null
                        ? <motion.span key={rv} initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 16 }} style={{ color: stage === 1 && st === 'bad' ? BAD_COLOR : color }}>{fmt(rv)}</motion.span>
                        : <span className={cn('text-xl', active === i && 'animate-slot-label')}
                            style={{ color: active === i ? B_COLOR : '#5C6B73', ['--slot-c' as string]: B_COLOR }}>?</span>}
                </button>
                {/* Галочка/крестик справа после проверки этапа, исчезают вместе со сменой этапа/сбросом. */}
                <span className="w-7 inline-flex justify-center">
                    {st && <Pop><span className="text-2xl font-black" style={{ color: st === 'ok' ? OK_COLOR : BAD_COLOR }}>{st === 'ok' ? '✓' : '✗'}</span></Pop>}
                </span>
            </motion.div>
        )
    }
    const opts = stage === 1 ? r.nums : r.roots
    return (
        <div className="w-full flex flex-col items-center gap-4">
            {/* Уравнение и плашка этапа — столбиком по центру, «Сложность» справа от всего блока
                (не отдельной строкой — иначе растягивает страницу по вертикали). */}
            <div className="w-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <span />
                <div className="flex flex-col items-center gap-3">
                <Eq a={1} b={r.b} c={r.c} colors={colors} />
                <div className="px-3 py-1 rounded-full text-sm font-black overflow-hidden" style={{ backgroundColor: hexToRgba(B_COLOR, 0.15), color: B_COLOR }}>
                    <motion.span key={stage} className="inline-block" initial={{ scale: 0.3, y: -14, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 9 }}>{STAGE_TEXT[stage]}</motion.span>
                </div>
                </div>
                <span className="justify-self-end"><DifficultyBadge level={rootsLevel(r)} variant="bars" /></span>
            </div>
            <div className="flex flex-col items-center gap-3">
                {row(0, '·', C_COLOR)}
                {row(1, '+', B_COLOR)}
            </div>
            <div key={stage} className="drop-in-options grid grid-cols-3 gap-2.5 w-full max-w-[280px] min-h-[122px]">
                {showNums && opts.map((n) => {
                    const used = vals[active === 0 ? 1 : 0] === n
                    return (
                        <button key={n} type="button" onClick={() => pick(n)} disabled={!!result || used}
                            className={cn('h-14 rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-2xl font-black text-[#F2F7FB] active:border-b-2', used && 'opacity-35')}>
                            {fmt(n)}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
const ComboRounds = ({ rounds, onDone, doneText }: { rounds: ComboRound[]; onDone: () => void; doneText: React.ReactNode }) => {
    const [round, setRound] = useState(0)
    const [done, setDone] = useState(false)
    return (
        <div className="w-full flex flex-col items-center gap-3">
            {/* Новый пример заметен: сначала с отскоком меняется счётчик, потом с отскоком появляется сам пример. */}
            <motion.div key={`cnt-${round}`} className="px-3 py-1 rounded-full text-sm font-black"
                style={{ backgroundColor: hexToRgba(ROOT_COLOR, 0.15), color: ROOT_COLOR }}
                initial={round === 0 ? false : { scale: 2.2 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 9 }}>
                {Math.min(round + 1, rounds.length)}/{rounds.length}
            </motion.div>
            {!done && (
                <motion.div key={round} className="w-full"
                    initial={round === 0 ? false : { scale: 0.6, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 13, delay: 0.45 }}>
                    <ComboRoundView r={rounds[round]} colors={round === 0} onSolved={() => {
                        if (round + 1 < rounds.length) setRound(round + 1)
                        else { setDone(true); onDone() }
                    }} />
                </motion.div>
            )}
            {done && doneText}
        </div>
    )
}
const ZakrepScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <ZakrepPlate />
            <PauseThen ms={1200} onDone={() => setPhase(1)} />
            {phase >= 1 && <TypedBig small onDone={() => setPhase(2)} readMs={400} parts={[{ text: 'Сам составь систему и найди x₁ x₂' }]} />}
            {phase >= 2 && (
                <ComboRounds rounds={ZAKREP_ROUNDS} onDone={() => onSettled?.()}
                    doneText={<TypedBig parts={[{ text: 'Закреп ' }, { text: 'есть', color: OK_COLOR }, { text: ' 💪' }]} readMs={200} />} />
            )}
        </>
    )
}
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

// Подпись над найденным коэффициентом: «c = 12» прямо над своим числом.
const CoefTag = ({ text, note, color }: { text: string; note?: string; color: string }) => (
    // Центрирование — на статичной обёртке: framer перезаписывает transform у motion-элемента (и -translate-x-1/2 терялся).
    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none">
    <motion.span initial={{ y: -40, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        className="flex flex-col items-center whitespace-nowrap">
        {note && (
            <motion.span initial={{ y: -30, opacity: 0, scale: 1.8 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 11, delay: 0.7 }}
                className="text-base md:text-lg font-black mb-1" style={{ color, textShadow: `0 0 14px ${hexToRgba(color, 0.6)}` }}>{note}</motion.span>
        )}
        <span className="text-sm md:text-base font-black px-2 py-0.5 rounded-lg"
            style={{ color, backgroundColor: hexToRgba(color, 0.14) }}>{text}</span>
    </motion.span>
    </span>
)

type CoefStep = 'c' | 'b' | 'a' | 'done'

// 3. Коэффициенты a, b, c: буквы падают, потом ученик сам находит их в уравнении; «невидимая единица».
const CoefScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [step, setStep] = useState<CoefStep>('c')
    const [wrong, setWrong] = useFlash<string>()
    const [hint, setHint] = useState<string | null>(null)
    const [askReady, setAskReady] = useState(false)
    const [minusAsk, setMinusAsk] = useState(false)
    // c: пауза 2 с после появления уравнения; b: пауза 1 с после подписи «c = 12».
    useEffect(() => {
        if (phase < 3 || (step !== 'c' && step !== 'b')) return
        setAskReady(false)
        const t = setTimeout(() => setAskReady(true), step === 'c' ? 2000 : 1000)
        return () => clearTimeout(t)
    }, [phase >= 3, step])
    useEffect(() => {
        if (phase !== 1) return
        const t = setTimeout(() => setPhase(2), 2400)
        return () => clearTimeout(t)
    }, [phase])
    const found = { c: step !== 'c', b: step === 'a' || step === 'done', a: step === 'done' }
    const tap = (tok: 'x2' | 'b' | 'c') => {
        if (step !== 'c' && step !== 'b') return
        if (tok === step) {
            setHint(null)
            if (step === 'c') setStep('b')
            else { setStep('a'); setTimeout(() => setMinusAsk(true), 1500) }
            return
        }
        if (tok === 'c' && step === 'b') return
        playSound(WRONG_ANSWER_SOUND)
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
                    <div className="w-full flex items-end justify-center font-black text-4xl md:text-5xl text-[#F2F7FB] whitespace-nowrap pt-24 pb-1">
                        {found.a && (
                            <span className="relative inline-flex">
                                <CoefTag text="a = 1" color={A_COLOR} />
                                <motion.span initial={{ y: -120, opacity: 0, scale: 2 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 240, damping: 10 }} style={{ color: A_COLOR }}>1·</motion.span>
                            </span>
                        )}
                        <button type="button" onClick={() => tap('x2')}
                            className={cn(tokCls, wrong === 'x2' && 'bg-[#DC605B33] text-[#DC605B]')}>x²</button>
                        <button type="button" onClick={() => tap('b')} className={cn(tokCls, 'ml-1', wrong === 'b' && 'bg-[#DC605B33]')}
                            style={{ color: found.b ? B_COLOR : wrong === 'b' ? BAD_COLOR : undefined }}>
                            {found.b && <CoefTag text="b = −7" note="МИНУС тоже входит!" color={B_COLOR} />}−7
                        </button>
                        <span>x</span>
                        <span className="mx-1.5">+</span>
                        <button type="button" onClick={() => tap('c')} className={cn(tokCls, wrong === 'c' && 'bg-[#DC605B33]')}
                            style={{ color: found.c ? C_COLOR : wrong === 'c' ? BAD_COLOR : undefined }}>
                            {found.c && <CoefTag text="c = 12" color={C_COLOR} />}12
                        </button>
                        <span className="ml-1.5">= 0</span>
                    </div>
                </Pop>
            )}
            {phase >= 3 && askReady && (step === 'c' || step === 'b') && (
                <div className="w-full flex flex-col items-center gap-1">
                    <TypedBig key={step} small readMs={100}
                        parts={[{ text: 'Нажми на ' }, { text: step, color: askColor }]} />
                    <div className="min-h-[24px] text-center font-bold" style={{ color: BAD_COLOR }}>{hint}</div>
                </div>
            )}
            {minusAsk && phase < 4 && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <button type="button" onClick={() => setPhase(4)} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                        Понял, минус тоже важен!
                    </button>
                </motion.div>
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

// 3б. Сам находит a, b, c в двух уравнениях.
const coefSteps = (e: EqSpec, bOpts: string[], cOpts: string[]): RStep[] => [
    { ask: <span>Чему равно <span style={{ color: A_COLOR }}>a</span>?</span>, options: ['1', '0', '2', '−1'], correct: '1',
        hint: () => 'Перед x² ничего нет, значит там 1 🫣', after: <span style={{ color: A_COLOR }}>a = 1</span> },
    { ask: <span>Чему равно <span style={{ color: B_COLOR }}>b</span>?</span>, options: bOpts, correct: fmt(e.b),
        hint: () => 'b это число перед x, вместе со знаком 🙃', after: <span style={{ color: B_COLOR }}>b = {fmt(e.b)}</span> },
    { ask: <span>Чему равно <span style={{ color: C_COLOR }}>c</span>?</span>, options: cOpts, correct: fmt(e.c),
        hint: () => 'c это число без x, вместе со знаком 🙃', after: <span style={{ color: C_COLOR }}>c = {fmt(e.c)}</span> },
]
const COEF_DRILL: Round[] = [
    { eq: { a: 1, b: 5, c: 4 }, steps: coefSteps({ a: 1, b: 5, c: 4 }, ['5', '−5', '4', '1'], ['4', '−4', '5', '1']) },
    { eq: { a: 1, b: -2, c: -15 }, steps: coefSteps({ a: 1, b: -2, c: -15 }, ['−2', '2', '−15', '1'], ['−15', '15', '−2', '1']) },
]
const CoefDrillScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedBig small onDone={() => setPhase(1)} readMs={300}
                parts={[{ text: 'Теперь сам: чему равны ' }, { text: 'a', color: A_COLOR }, { text: ', ' }, { text: 'b', color: B_COLOR }, { text: ', ' }, { text: 'c', color: C_COLOR }, { text: '?' }]} />
            {phase >= 1 && <RoundsBody rounds={COEF_DRILL} onDone={() => onSettled?.()}
                doneText={<><span style={{ color: A_COLOR }}>a</span>, <span style={{ color: B_COLOR }}>b</span>, <span style={{ color: C_COLOR }}>c</span> найдены! 🔥</>} />}
        </>
    )
}

// Все прошлые уравнения — с a = 1 (из урока: коэффициенты, первые два, закреп).
const A1_LIST: EqSpec[] = [
    { a: 1, b: -5, c: 6 }, { a: 1, b: -7, c: 12 }, { a: 1, b: 5, c: 4 }, { a: 1, b: -2, c: -15 },
    ...ZAKREP_ROUNDS.map((r) => ({ a: 1, b: r.b, c: r.c })),
]
const Cf = ({ k, children }: { k: string; children: React.ReactNode }) => <span style={{ color: k }}>{children}</span>
const VIETA_STICKER = '/remember-stickers/gentelmen-notext.webp'

// После закрепа: везде было a = 1 → а если нет? → Теорема Виета (c/a и −b/a).
// Стрелка от «a» в строке «…делим на a» вверх, вправо и раздваивается на оба знаменателя a в плашке.
// Координаты — по DOM (data-marker), относительно контейнера сцены; перемеряем при ресайзе.
const SplitArrowToDens = ({ rootRef }: { rootRef: React.RefObject<HTMLDivElement> }) => {
    const [geo, setGeo] = useState<{ w: number; h: number; d1: string; d2: string } | null>(null)
    // Наконечники — только после того, как обе линии дорисованы (0,9 с + 0,35 с).
    const [heads, setHeads] = useState(false)
    useEffect(() => {
        if (!geo || heads) return
        const t = setTimeout(() => setHeads(true), 1350)
        return () => clearTimeout(t)
    }, [geo, heads])
    useLayoutEffect(() => {
        const measure = () => {
            const root = rootRef.current
            if (!root) return
            const r = root.getBoundingClientRect()
            const get = (m: string) => root.querySelector<HTMLElement>(`[data-marker="${m}"]`)?.getBoundingClientRect()
            const from = get('div-a'), a1 = get('den-1'), a2 = get('den-2'), row1 = get('row-1'), row2 = get('row-2'), plate = get('vieta-body')
            if (!from || !a1 || !a2 || !row1 || !row2 || !plate) return
            const x = (v: number) => v - r.left, y = (v: number) => v - r.top
            // Из «a» выходим вправо (не вверх — над ней строка текста), огибаем текст справа.
            const fx = x(from.right) + 3, fy = y(from.top + from.height / 2)
            const xr = r.width + 8
            const branchY = y(plate.bottom) + 28
            const colX = x(Math.max(row1.right, row2.right)) + 16
            const y1 = y(a1.top + a1.height / 2), y2 = y(a2.top + a2.height / 2)
            const e1 = x(row1.right) + 5, e2 = x(row2.right) + 5
            setGeo({
                w: r.width, h: r.height,
                d1: `M ${fx} ${fy} L ${xr} ${fy} L ${xr} ${branchY} L ${colX} ${branchY} L ${colX} ${y1} L ${e1} ${y1}`,
                d2: `M ${colX} ${y2} L ${e2} ${y2}`,
            })
        }
        measure()
        const t = setTimeout(measure, 450) // после входной анимации DiagramBlock (scale 0.94 → 1)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
    }, [rootRef])
    if (!geo) return null
    const common = { fill: 'none', stroke: A_COLOR, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, markerEnd: heads ? 'url(#vieta-split-head)' : undefined }
    return (
        <svg className="absolute inset-0 pointer-events-none overflow-visible" width={geo.w} height={geo.h}>
            <defs>
                <marker id="vieta-split-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={A_COLOR} />
                </marker>
            </defs>
            <motion.path d={geo.d1} {...common} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
            <motion.path d={geo.d2} {...common} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.35, delay: 0.9, ease: 'easeOut' }} />
        </svg>
    )
}

const TheoremScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const rootRef = useRef<HTMLDivElement>(null)
    return (
        <div ref={rootRef} className="relative w-full flex flex-col items-center gap-4">
            <TypedBig small onDone={() => setPhase(1)} readMs={300}
                parts={[{ text: 'Во всех прошлых уравнениях ' }, { text: 'a = 1', color: A_COLOR }]} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 2))}>
                    <div className="drop-in-options w-full grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {A1_LIST.map((e, i) => <Eq key={i} {...e} showOne size="text-base md:text-lg" />)}
                    </div>
                </DiagramBlock>
            )}
            {phase === 2 && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <button type="button" onClick={() => setPhase(3)} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                        Действительно везде было a = 1
                    </button>
                </motion.div>
            )}
            {phase >= 3 && (
                <TypedBig onDone={() => setPhase(4)} readMs={2000}
                    parts={[{ text: 'Но что если ' }, { text: 'a ≠ 1', color: A_COLOR }, { text: '?' }]} />
            )}
            {phase >= 4 && <TypedBig small onDone={() => setPhase(5)} readMs={200} parts={[{ text: 'например:' }]} />}
            {phase >= 5 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 6))}>
                    <Eq a={2} b={3} c={-5} colors />
                </DiagramBlock>
            )}
            {phase >= 6 && <PauseThen ms={2000} onDone={() => setPhase(7)} />}
            {phase >= 7 && (
                <DiagramBlock onSettled={() => setPhase((p) => Math.max(p, 8))}>
                    <RememberPlate title="Привет, Теорема Виета 👋" sticker={VIETA_STICKER}>
                        <span data-marker="vieta-body" className="flex flex-col items-center gap-2">
                            <span data-marker="row-1" className="text-2xl md:text-3xl font-black inline-flex items-center gap-2">
                                x₁ · x₂ = <Frac num={<Cf k={C_COLOR}>c</Cf>} den={<span data-marker="den-1"><Cf k={A_COLOR}>a</Cf></span>} />
                            </span>
                            <span data-marker="row-2" className="text-2xl md:text-3xl font-black inline-flex items-center gap-2">
                                x₁ + x₂ = <Frac num={<Cf k={B_COLOR}>−b</Cf>} den={<span data-marker="den-2"><Cf k={A_COLOR}>a</Cf></span>} />
                            </span>
                        </span>
                    </RememberPlate>
                </DiagramBlock>
            )}
            {phase >= 8 && <PauseThen ms={2000} onDone={() => setPhase(9)} />}
            {phase >= 9 && (
                <div className="w-full pt-6">
                    <TypedBig small onDone={() => setPhase(10)} readMs={200}
                        parts={[{ text: 'Всё то же самое, но теперь ещё делим на ' }, { text: 'a', color: A_COLOR, marker: 'div-a' }]} />
                </div>
            )}
            {phase >= 10 && <SplitArrowToDens rootRef={rootRef} />}
            {phase >= 10 && <PauseThen ms={1200} onDone={() => onSettled?.()} />}
        </div>
    )
}

// ===== a ≠ 1: тупо проверяем x = 1 (а если не подошёл — x = −1) =====
type CheckSpec = { a: number; b: number; c: number; root: 1 | -1; x2: string }
const CHECK_ONE: CheckSpec = { a: 2, b: 3, c: -5, root: 1, x2: '−5/2' }
const CHECK_MINUS: CheckSpec = { a: 3, b: 8, c: 5, root: -1, x2: '−5/3' }
const rootStr = (r: 1 | -1) => (r === 1 ? '1' : '−1')

// x в уравнении по очереди меняется на ·1 или ·(−1). Слот — снаружи SubstEq: объявленный внутри,
// он пересоздавался при каждом рендере родителя и анимация повторялась.
const SubstSlot = ({ on, sq, root }: { on: boolean; sq?: boolean; root: 1 | -1 }) => (
    <span className="relative inline-flex items-center">
        {on ? (
            <>
                <span className="mx-0.5 text-[#9AA7B0]">·</span>
                <motion.span className="inline-flex" style={{ color: ROOT_COLOR }}
                    initial={{ y: -28, opacity: 0, scale: 0.4 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 15 }}>{root === 1 ? '1' : '(−1)'}</motion.span>
            </>
        ) : (
            <span>x</span>
        )}
        {sq && <span>²</span>}
    </span>
)
const Sgn = ({ n, color, first }: { n: number; color: string; first?: boolean }) => (
    <>
        {(!first || n < 0) && <span className={first ? '' : 'mx-1.5'} style={{ color }}>{n < 0 ? '−' : '+'}</span>}
        <span style={{ color }}>{Math.abs(n)}</span>
    </>
)
// Уравнение ax² + bx + c = 0; при go — x прямо в нём меняются на root (без второй копии уравнения).
const SubstEq = ({ spec, go, onDone }: { spec: CheckSpec; go: boolean; onDone: () => void }) => {
    const [swapped, setSwapped] = useState(0)
    useEffect(() => {
        if (!go) return
        if (swapped >= 2) {
            const t = setTimeout(onDone, 2000)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => setSwapped((n) => n + 1), swapped === 0 ? 700 : 650)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [swapped, go])
    return (
        <div className="w-full flex items-center justify-center font-black text-[#F2F7FB] whitespace-nowrap text-3xl md:text-4xl">
            <Sgn n={spec.a} color={A_COLOR} first /><SubstSlot on={swapped > 0} sq root={spec.root} />
            <Sgn n={spec.b} color={B_COLOR} /><SubstSlot on={swapped > 1} root={spec.root} />
            <Sgn n={spec.c} color={C_COLOR} />
            <span className="ml-1.5">= 0</span>
        </div>
    )
}

const BigLine = ({ children, color = '#F2F7FB' }: { children: React.ReactNode; color?: string }) => (
    <div className="w-full flex justify-center text-4xl md:text-5xl font-black" style={{ color }}>
        <Pop>{children}</Pop>
    </div>
)

const ReplyButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
            {children}
        </button>
    </motion.div>
)

// Напоминание уравнения перед x₂: над a и c подписи «a» и «c», b бледное (оно тут не нужно).
const TagAbove = ({ tag, color, children }: { tag: string; color: string; children: React.ReactNode }) => (
    <span className="relative inline-flex">
        <span className="absolute left-1/2 -translate-x-1/2 -top-8 text-lg font-black leading-none px-2 py-1 rounded-md"
            style={{ color, backgroundColor: hexToRgba(color, 0.15) }}>{tag}</span>
        {children}
    </span>
)
const AcEq = ({ spec }: { spec: CheckSpec }) => (
    <div className="w-full flex items-center justify-center pt-8 font-black text-[#F2F7FB] whitespace-nowrap text-3xl md:text-4xl">
        <TagAbove tag="a" color={A_COLOR}><span style={{ color: A_COLOR }}>{spec.a}</span></TagAbove>
        <span>x²</span>
        <span className="inline-flex opacity-30"><Sgn n={spec.b} color="#F2F7FB" /><span>x</span></span>
        {/* c — вместе со знаком: в 2x² + 3x − 5 c = −5 */}
        <span className="ml-1.5"><TagAbove tag="c" color={C_COLOR}><span style={{ color: C_COLOR }}>{spec.c < 0 ? `−${-spec.c}` : `+${spec.c}`}</span></TagAbove></span>
        <span className="ml-1.5">= 0</span>
    </div>
)

// x₂ = c/a или x₂ = −c/a
const X2Formula = ({ minus }: { minus?: boolean }) => (
    <span className="inline-flex items-center gap-2">x₂ = {minus && '−'}<Frac num={<Cf k={C_COLOR}>c</Cf>} den={<Cf k={A_COLOR}>a</Cf>} /></span>
)

// Правило «тупо проверяем» (до кнопки — паузы 1 с), потом подстановка в уравнение (паузы 2 с).
// root = 1: правило → «Давай попробуем!» → уравнение. root = −1: «А что если вот такое:» → уравнение →
// x = 1 не подойдёт → проверяем x = −1 → «Ок, давай попробуем!»; уравнение пишем заново и подставляем в него.
const CheckRootScene = ({ spec, onSettled }: SceneProps & { spec: CheckSpec }) => {
    const one = spec.root === 1
    const [phase, setPhase] = useState(0)
    // t — вторая половина (после кнопки «…попробуем!»): -1 — ещё не начали.
    const [t, setT] = useState(-1)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    const tn = (n: number) => () => setT((p) => Math.max(p, n))
    const ruleDim: React.CSSProperties = t >= 0 ? { opacity: 0.35, filter: 'grayscale(1)' } : {}
    const r = rootStr(spec.root)
    const terms = [spec.a, spec.b * spec.root, spec.c]
    const eqBlock = (onSettledEq: () => void) => (
        <DiagramBlock onSettled={onSettledEq}>
            <SubstEq spec={spec} go={t >= 3} onDone={tn(4)} />
        </DiagramBlock>
    )
    return (
        <>
            {one ? (
                <div className="w-full flex flex-col items-center gap-4 transition-all duration-700" style={ruleDim}>
                    <TypedBig small onDone={next(1)} readMs={1000}
                        parts={[{ text: 'В таких уравнениях мы будем ' }, { text: 'ТУПО ПРОВЕРЯТЬ', color: REMEMBER_COLOR }]} />
                    {phase >= 1 && <BigLine color={ROOT_COLOR}>x₁ = 1</BigLine>}
                    {phase >= 1 && <PauseThen ms={1000} onDone={next(2)} />}
                    {phase >= 2 && (
                        <TypedBig small onDone={next(3)} readMs={1000}
                            parts={[{ text: 'ЕСЛИ ' }, { text: 'x₁ = 1', color: ROOT_COLOR }, { text: ' подойдёт, то' }]} />
                    )}
                    {phase >= 3 && <BigLine><X2Formula /></BigLine>}
                    {phase >= 3 && <PauseThen ms={1000} onDone={next(4)} />}
                    {phase >= 4 && <TypedBig onDone={next(5)} readMs={300} parts={[{ text: 'И ВСЁ!', color: REMEMBER_COLOR }]} />}
                </div>
            ) : (
                <>
                    <TypedBig small onDone={next(1)} readMs={500} parts={[{ text: 'А что если вот такое:' }]} />
                    {phase >= 1 && (
                        <DiagramBlock onSettled={next(2)}>
                            <Eq a={spec.a} b={spec.b} c={spec.c} colors />
                        </DiagramBlock>
                    )}
                    {phase >= 2 && (
                        <div className="w-full flex flex-col items-center gap-4 transition-all duration-700" style={ruleDim}>
                            <TypedBig small onDone={next(3)} readMs={1000}
                                parts={[{ text: 'Тут ' }, { text: 'x = 1', color: ROOT_COLOR }, { text: ' НЕ подойдёт.', color: BAD_COLOR }]} />
                            {phase === 3 && <ReplyButton onClick={() => setPhase(4)}>Действительно не подходит</ReplyButton>}
                            {phase >= 4 && (
                                <TypedBig small onDone={next(5)} readMs={300} parts={[{ text: 'В таком случае осталось проверить' }]} />
                            )}
                            {phase >= 5 && <BigLine color={ROOT_COLOR}>x = −1</BigLine>}
                            {phase >= 5 && <PauseThen ms={1000} onDone={next(6)} />}
                            {phase >= 6 && (
                                <TypedBig small onDone={next(7)} readMs={300}
                                    parts={[{ text: 'Если подойдёт ' }, { text: 'x = −1', color: ROOT_COLOR }, { text: ', то' }]} />
                            )}
                            {phase >= 7 && <BigLine><X2Formula minus /></BigLine>}
                            {phase >= 7 && <PauseThen ms={1000} onDone={next(8)} />}
                        </div>
                    )}
                </>
            )}
            {t < 0 && phase === (one ? 5 : 8) && (
                <ReplyButton onClick={() => setT(0)}>{one ? 'Давай попробуем!' : 'Ок, давай попробуем!'}</ReplyButton>
            )}
            {/* Подставляем в уравнение, записанное заново прямо здесь (наверх смотреть неудобно). */}
            {t >= 0 && eqBlock(tn(1))}
            {t >= 1 && (
                <TypedBig small onDone={tn(2)} readMs={200} parts={[{ text: 'Подставим ' }, { text: `x = ${r}`, color: ROOT_COLOR }]} />
            )}
            {t === 2 && <ReplyButton onClick={() => setT(3)}>Поехали!</ReplyButton>}
            {t >= 4 && (
                <div className="w-full flex justify-center text-3xl md:text-4xl font-black text-[#F2F7FB]">
                    <Pop>
                        <Sgn n={terms[0]} color={A_COLOR} first /><Sgn n={terms[1]} color={B_COLOR} /><Sgn n={terms[2]} color={C_COLOR} />
                        <span className="ml-1.5">= 0</span>
                    </Pop>
                </div>
            )}
            {t >= 4 && <PauseThen ms={2000} onDone={tn(5)} />}
            {t >= 5 && <BigLine color={OK_COLOR}>0 = 0 ✅</BigLine>}
            {t >= 5 && <PauseThen ms={2000} onDone={tn(6)} />}
            {t >= 6 && <TypedBig onDone={tn(7)} readMs={2000} parts={[{ text: 'Получилось!', color: OK_COLOR }]} />}
            {t >= 7 && <TypedBig small onDone={tn(8)} readMs={1000} parts={[{ text: 'Значит мы угадали первый корень!' }]} />}
            {t >= 8 && <BigLine color={ROOT_COLOR}>x₁ = {r}</BigLine>}
            {t >= 8 && <PauseThen ms={1000} onDone={tn(9)} />}
            {t === 9 && <ReplyButton onClick={() => setT(10)}>{one ? 'Мы везунчики!' : 'Нам снова везёт!'}</ReplyButton>}
            {t >= 10 && <TypedBig small onDone={tn(11)} readMs={1000} parts={[{ text: 'Тогда второй корень:' }]} />}
            {/* Исходное уравнение к этому месту уже ушло вверх: напоминаем его, подписав a и c. */}
            {t >= 11 && (
                <DiagramBlock onSettled={tn(12)}>
                    <AcEq spec={spec} />
                </DiagramBlock>
            )}
            {/* x₂ в 2 этапа: сначала формула, пауза, потом справа «= значение» (c и a своими цветами). */}
            {t >= 13 && (
                <div className="w-full flex justify-center items-center gap-2 text-4xl md:text-5xl font-black text-[#F2F7FB]">
                    <Pop><X2Formula minus={!one} /></Pop>
                    {t >= 14 && (
                        <Pop>
                            <span className="inline-flex items-center gap-2">=
                                <span className="inline-flex items-center">
                                    {!one && '−'}<Frac num={<Cf k={C_COLOR}>{fmt(spec.c)}</Cf>} den={<Cf k={A_COLOR}>{spec.a}</Cf>} />
                                </span>
                            </span>
                        </Pop>
                    )}
                </div>
            )}
            {t >= 12 && <PauseThen ms={1000} onDone={tn(13)} />}
            {t >= 13 && <PauseThen ms={1500} onDone={tn(14)} />}
            {t >= 14 && <PauseThen ms={1000} onDone={() => onSettled?.()} />}
        </>
    )
}
const CheckOneScene = (p: SceneProps) => <CheckRootScene {...p} spec={CHECK_ONE} />
const CheckMinusScene = (p: SceneProps) => <CheckRootScene {...p} spec={CHECK_MINUS} />

// Итог примера: уравнение, оба корня и «и ВСЁ.» (+ видео).
const STEVE_BLINK_VIDEO = '/video/steve-blink.webm'
const LEGEND_VIDEO = '/video/legend.webm'
const SummaryScene = ({ spec, video, onSettled }: SceneProps & { spec: CheckSpec; video?: string }) => {
    const [phase, setPhase] = useState(0)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    return (
        <>
            <TypedBig onDone={next(1)} readMs={2000} parts={[{ text: 'Итого:', color: REMEMBER_COLOR }]} />
            {phase >= 1 && (
                <DiagramBlock onSettled={next(2)}>
                    <Eq a={spec.a} b={spec.b} c={spec.c} colors />
                </DiagramBlock>
            )}
            {phase >= 2 && <PauseThen ms={1000} onDone={next(3)} />}
            {/* x₁ слева, через 1 с x₂ справа (место под x₂ зарезервировано, чтобы x₁ не сдвигался). */}
            {phase >= 3 && (
                <div className="w-full grid grid-cols-2 gap-6 items-center text-4xl md:text-5xl font-black" style={{ color: ROOT_COLOR }}>
                    <span className="justify-self-end"><Pop>x₁ = {rootStr(spec.root)}</Pop></span>
                    <span className="justify-self-start">
                        {phase >= 4 && <Pop><span className="inline-flex items-center gap-1">x₂ = <NumText s={spec.x2} /></span></Pop>}
                    </span>
                </div>
            )}
            {phase >= 3 && <PauseThen ms={1000} onDone={next(4)} />}
            {phase >= 4 && <PauseThen ms={1000} onDone={next(5)} />}
            {phase >= 5 && <TypedBig onDone={next(6)} readMs={300} parts={[{ text: 'и ВСЁ.', color: REMEMBER_COLOR }]} />}
            {phase >= 6 && video && (
                <div className="w-full flex justify-center">
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                        className="w-40 md:w-48 aspect-square overflow-hidden rounded-xl">
                        <video src={video} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                    </motion.div>
                </div>
            )}
            {phase >= 6 && <PauseThen ms={1500} onDone={() => onSettled?.()} />}
        </>
    )
}
const SummaryOneScene = (p: SceneProps) => <SummaryScene {...p} spec={CHECK_ONE} video={STEVE_BLINK_VIDEO} />
const SummaryMinusScene = (p: SceneProps) => <SummaryScene {...p} spec={CHECK_MINUS} video={LEGEND_VIDEO} />

// Тренировка: «Теперь сам! Найди корни:» → уравнение → клетки x₁ и x₂, снизу падают числа (одно из них 1).
type RootRound = { a: number; b: number; c: number; roots: [string, string]; tiles: string[] }
const X1_ROUNDS: RootRound[] = [
    { a: 3, b: -5, c: 2, roots: ['1', '2/3'], tiles: ['1', '−1', '2/3', '−2/3', '3/2', '2'] },
    { a: 5, b: 2, c: -7, roots: ['1', '−7/5'], tiles: ['1', '−1', '−7/5', '7/5', '−5/7', '7'] },
    { a: 4, b: -9, c: 5, roots: ['1', '5/4'], tiles: ['1', '−1', '5/4', '−5/4', '4/5', '5'] },
]
const RootSlot = ({ label, val, active, state, onClick }: {
    label: string; val: string | null; active: boolean; state: 'ok' | 'bad' | null; onClick: () => void
}) => {
    const border = state === 'ok' ? hexToRgba(OK_COLOR, 0.45) : state === 'bad' ? BAD_COLOR : active ? hexToRgba(ROOT_COLOR, 0.7) : '#3A464E'
    const color = state === 'bad' ? BAD_COLOR : '#F2F7FB'
    const bg = state === 'ok' ? hexToRgba(OK_COLOR, 0.07) : state === 'bad' ? hexToRgba(BAD_COLOR, 0.12) : '#161F23'
    return (
        <button type="button" onClick={onClick}
            className="min-w-[64px] min-h-[64px] px-2 rounded-xl border-2 border-b-4 active:border-b-2 font-black text-2xl transition-colors flex items-center justify-center"
            style={{ borderColor: border, color, backgroundColor: bg }}>
            {val !== null
                ? <motion.span key={val} initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 16 }} className="inline-flex"><NumText s={val} /></motion.span>
                : <span className={cn('text-xl', active && !state && 'animate-slot-label')}
                    style={{ color: active ? ROOT_COLOR : '#5C6B73', ['--slot-c' as string]: ROOT_COLOR }}>{label}</span>}
        </button>
    )
}
const RootRoundView = ({ r, onSolved }: { r: RootRound; onSolved: () => void }) => {
    const [tiles] = useState(() => shuffle(r.tiles))
    const [vals, setVals] = useState<(string | null)[]>([null, null])
    const [active, setActive] = useState(0)
    const [result, setResult] = useState<'ok' | 'bad' | null>(null)
    const [hint, setHint] = useState<string | null>(null)
    const pick = (v: string) => {
        if (result) return
        const nextVals = [...vals]
        nextVals[active] = v
        setVals(nextVals)
        const other = active === 0 ? 1 : 0
        if (nextVals[other] === null) { setActive(other); return }
        const ok = [...nextVals].sort().join('|') === [...r.roots].sort().join('|')
        if (ok) {
            setResult('ok'); setHint(null); showAnswerMeme(true)
            setTimeout(onSolved, 1100)
        } else {
            setResult('bad'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            const guess = r.roots[0]
            setHint(!nextVals.includes(guess) ? 'Проверь x = 1 и x = −1 🙃'
                : guess === '1' ? 'x₂ = c/a: сверху c со знаком, снизу a 🙃' : 'x₂ = −c/a: не забудь минус перед дробью 🙃')
            setTimeout(() => { setResult(null); setVals([null, null]); setActive(0) }, 1500)
        }
    }
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Pop><Eq a={r.a} b={r.b} c={r.c} colors size="text-2xl md:text-3xl" /></Pop>
            <motion.div animate={result === 'bad' ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.5 }}
                className="flex items-center gap-6 text-2xl md:text-3xl font-black text-[#F2F7FB]">
                <span className="inline-flex items-center gap-2">x₁ = <RootSlot label="x₁" val={vals[0]} active={active === 0 && !result} state={result} onClick={() => !result && setActive(0)} /></span>
                <span className="inline-flex items-center gap-2">x₂ = <RootSlot label="x₂" val={vals[1]} active={active === 1 && !result} state={result} onClick={() => !result && setActive(1)} /></span>
            </motion.div>
            <div className="drop-in-options grid grid-cols-3 gap-2.5 w-full max-w-[300px]">
                {tiles.map((v) => {
                    const used = vals[active === 0 ? 1 : 0] === v
                    return (
                        <button key={v} type="button" onClick={() => pick(v)} disabled={!!result || used}
                            className="min-h-[64px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-2xl font-black text-[#F2F7FB] transition-opacity active:scale-95"
                            style={{ opacity: used ? 0.35 : 1 }}>
                            <NumText s={v} />
                        </button>
                    )
                })}
            </div>
            <div className="min-h-[24px] text-center text-sm md:text-base font-bold" style={{ color: BAD_COLOR }}>{hint}</div>
        </div>
    )
}
// Серия раундов «найди корни» с клетками x₁ x₂. finale — что показать после последнего раунда (иначе «изи»).
const RootPractice = ({ rounds, intro, finale, onSettled }: SceneProps & { rounds: RootRound[]; intro: string; finale?: (done: () => void) => React.ReactNode }) => {
    const [phase, setPhase] = useState(0)
    const [round, setRound] = useState(0)
    const [praise, setPraise] = useState<string | null>(null)
    const solved = () => {
        setPraise(pickPraise())
        setTimeout(() => {
            setPraise(null)
            setRound((n) => n + 1)
            if (round + 1 >= rounds.length && !finale) setTimeout(() => onSettled?.(), 900)
        }, 1200)
    }
    return (
        <>
            <TypedBig small onDone={() => setPhase(1)} readMs={500} parts={[{ text: intro }]} />
            {phase >= 1 && round < rounds.length && <RootRoundView key={round} r={rounds[round]} onSolved={solved} />}
            {praise && <div className="w-full flex justify-center"><Pop><span className="text-xl font-black" style={{ color: OK_COLOR }}>{praise}</span></Pop></div>}
            {round >= rounds.length && (finale ? finale(() => onSettled?.()) : (
                <div className="w-full flex flex-col items-center gap-2">
                    <Pop><span className="text-2xl font-black" style={{ color: OK_COLOR }}>Угадывать корни — изи! 🔥</span></Pop>
                    <LocalAnswerConfetti />
                </div>
            ))}
        </>
    )
}
const X1PracticeScene = (p: SceneProps) => <RootPractice {...p} rounds={X1_ROUNDS} intro="Теперь сам! Найди корни:" />

// После x = −1: два раунда с корнем −1, один с 1 и «193x² + 3x − 190 = 0» (через дискриминант — больно).
const MIX_ROUNDS: RootRound[] = [
    { a: 2, b: 5, c: 3, roots: ['−1', '−3/2'], tiles: ['−1', '1', '−3/2', '3/2', '−2/3', '3'] },
    { a: 5, b: 6, c: 1, roots: ['−1', '−1/5'], tiles: ['−1', '1', '−1/5', '1/5', '−5', '5'] },
    { a: 7, b: -4, c: -3, roots: ['1', '−3/7'], tiles: ['1', '−1', '−3/7', '3/7', '−7/3', '3'] },
    { a: 193, b: 3, c: -190, roots: ['−1', '190/193'], tiles: ['−1', '1', '190/193', '−190/193', '193/190', '190'] },
]
const NICE_JOKE_VIDEO = '/video/nice-joke.webm'
const DiscrFinale = ({ onDone }: { onDone: () => void }) => {
    const [phase, setPhase] = useState(0)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <TypedBig onDone={next(1)} readMs={300} parts={[{ text: 'И если захочешь..' }]} />
            {phase >= 1 && <EllipsisPause onDone={next(2)} />}
            {phase >= 2 && (
                <TypedBig small onDone={next(3)} readMs={300}
                    parts={[{ text: 'можешь проверить этот номер через ' }, { text: 'дискриминант', color: REMEMBER_COLOR }]} />
            )}
            {phase >= 3 && (
                <DiagramBlock onSettled={next(4)}>
                    <Eq a={193} b={3} c={-190} colors />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                    className="w-40 md:w-48 aspect-square overflow-hidden rounded-xl">
                    <video src={NICE_JOKE_VIDEO} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                </motion.div>
            )}
            {phase >= 4 && <PauseThen ms={1500} onDone={onDone} />}
        </div>
    )
}
const MixPracticeScene = (p: SceneProps) => (
    <RootPractice {...p} rounds={MIX_ROUNDS} intro="Теперь сам! Найди корни:" finale={(done) => <DiscrFinale onDone={done} />} />
)

const ReadyScene = ({ onSettled }: SceneProps) => (
    <TypedBig parts={[{ text: 'Приготовься, пора ' }, { text: 'блистать знаниями!', color: REMEMBER_COLOR }]} onDone={() => onSettled?.()} readMs={300} />
)

const SCENES = [CoefScene, CoefDrillScene, Guess56Scene, Guess712Scene, ZakrepScene, TheoremScene, CheckOneScene, SummaryOneScene, X1PracticeScene, CheckMinusScene, SummaryMinusScene, MixPracticeScene, ReadyScene]
const FIXED_NEXT_LABELS = new Map<unknown, string>([
    [ZakrepScene, 'Закреплено 📌'],
    [CoefScene, 'Невидимка, понял 👀'],
    [TheoremScene, 'Запомнил!'],
    [CheckOneScene, 'ГАААААЗ'],
    [CheckMinusScene, 'ГАААААЗ'],
    [MixPracticeScene, 'Я что крейзи?'],
    [ReadyScene, 'ЛЕТС ГООООУ'],
])
// Подписи для админской карты этапов (по порядку SCENES).
const SCENE_MAP_LABELS = ['Коэффициенты a, b, c', 'Сам: a, b, c', 'x² − 5x + 6', 'x² − 7x + 12', 'ЗАКРЕП (7 уравнений)', 'Теорема Виета (a ≠ 1)', 'Тупо проверяем x₁ = 1', 'Итого: и ВСЁ', 'Сам: 3 уравнения с x₁ = 1', 'А если x = −1 (3x² + 8x + 5)', 'Итого для x = −1', 'Сам: −1, −1, 1, 193x²', 'Приготовься']

// ===== Квиз =====
// fact — картинка и интересная история, показываются после верного ответа (вопрос-шутка про Виета).
type Trial = { prompt: React.ReactNode; eq?: EqSpec; options: string[]; correct: string; hint: string; fact?: { src: string; caption: string; story: React.ReactNode } }

// Итоговый тест: подбор корней, c/a и −b/a, угадывание x = ±1 и вопросы-шутки для настроения.
const makeTrials = (): Trial[] => [
    { prompt: 'Подбери корни', eq: { a: 1, b: -9, c: 20 }, options: shuffle(['4 и 5', '−4 и −5', '2 и 10', '4 и −5']), correct: '4 и 5', hint: '4 · 5 = 20 = c, 4 + 5 = 9 = −b.' },
    { prompt: 'Как называется теорема, которую мы прошли? 🤔', options: shuffle(['Теорема Виета', 'Теорема Вити', 'Теорема Виталика', 'Теорема Ватсапа']), correct: 'Теорема Виета', hint: 'Франсуа Виет, француз, XVI век 🎩 Витя тут ни при чём.',
        fact: {
            src: '/lesson-pics/viete.jpg', caption: 'Франсуа Виет',
            story: <>Виет был не только математиком, но и <b>хакером короля</b> 🕵️. Он работал на французского короля Генриха IV и <b>взломал секретный шифр испанцев</b>: французы читали их тайные письма. Испанский король Филипп II был в шоке и пожаловался самому Папе Римскому, что французы <b>колдуют чёрной магией</b> 🧙. А это была просто математика 😎</>,
        } },
    { prompt: 'Подбери корни', eq: { a: 1, b: 2, c: -15 }, options: shuffle(['3 и −5', '−3 и 5', '3 и 5', '1 и −15']), correct: '3 и −5', hint: '3 · (−5) = −15 = c, 3 + (−5) = −2 = −b.' },
    { prompt: 'Чему равно x₁ · x₂?', eq: { a: 3, b: -7, c: 2 }, options: shuffle(['2/3', '−2/3', '7/3', '3/2']), correct: '2/3', hint: 'x₁ · x₂ = c/a = 2/3.' },
    { prompt: 'Чему равно x₁ + x₂?', eq: { a: 1, b: -11, c: 24 }, options: shuffle(['11', '−11', '24', '−24']), correct: '11', hint: 'x₁ + x₂ = −b = 11 (минус на минус).' },
    { prompt: 'Если a ≠ 1, какой корень проверяем ПЕРВЫМ?', options: shuffle(['x = 1', 'x = 1000', 'x = π', 'x = номер моего телефона']), correct: 'x = 1', hint: 'Тупо проверяем x = 1: это просто a + b + c 😎' },
    { prompt: 'Угадай корень и найди второй', eq: { a: 5, b: -3, c: -2 }, options: shuffle(['1 и −2/5', '1 и 2/5', '−1 и 2/5', '1 и −5/2']), correct: '1 и −2/5', hint: '5 − 3 − 2 = 0, значит x₁ = 1, а x₂ = c/a = −2/5.' },
    { prompt: 'Угадай корень и найди второй', eq: { a: 4, b: 9, c: 5 }, options: shuffle(['−1 и −5/4', '−1 и 5/4', '1 и −5/4', '−1 и −4/5']), correct: '−1 и −5/4', hint: '4 − 9 + 5 = 0, значит x₁ = −1, а x₂ = −c/a = −5/4.' },
    { prompt: 'x = 1 и x = −1 оба НЕ подошли. Что делаем?', options: shuffle(['Считаем дискриминант', 'Плачем 😭', 'Закрываем тетрадь', 'Звоним маме']), correct: 'Считаем дискриминант', hint: 'Виета не всемогущ: тогда честно считаем дискриминант 🫡' },
    { prompt: 'Угадай корень и найди второй', eq: { a: 100, b: -99, c: -1 }, options: shuffle(['1 и −1/100', '1 и 1/100', '−1 и 1/100', '1 и −100']), correct: '1 и −1/100', hint: '100 − 99 − 1 = 0, значит x₁ = 1, а x₂ = c/a = −1/100.' },
    { prompt: 'Бонус! Кто теперь шарит в теореме Виета? 😎', options: ['Я 😎'], correct: 'Я 😎', hint: 'Без вариантов — ты! Произведение, сумма, угадывание корня — всё твоё 🔥' },
]

const pickTrialFeedback = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
export const TypeVietaWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const INTRO_STEPS = SCENES.length
    // С какой сцены рисуем лог: при админском прыжке прошлые сцены не проигрываем заново.
    const [startStep, setStartStep] = useState(0)
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
            const idx = Number(target.slice(5))
            setPhase('intro')
            setStartStep((st) => Math.min(st, idx))
            setStep(idx)
            setStepReady(false)
        }
    }

    const jumpTo = (key: string) => {
        if (advancing) return
        bumpNonce(key)
        setChecked(false); setWrongTried([]); setWrongFlash(null)
        if (key.startsWith('trial-')) {
            setStartStep(INTRO_STEPS)
            setStep(INTRO_STEPS - 1)
            setPhase('practice')
            setTrialIndex(0)
        } else {
            const idx = Number(key.slice(5))
            setStartStep(idx)
            setPhase('intro')
            setStep(idx)
            setStepReady(false)
        }
    }
    const mapEntries: AdminMapEntry[] = [
        ...SCENE_MAP_LABELS.map((label, i) => ({
            dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: latestSceneKey === `step-${i}`, color: MAP_INTRO_COLOR,
        })),
        { dotKey: 'trials', label: `Проверим себя (${trials.length})`, jumpKey: 'trial-0', isActive: phase === 'practice', color: MAP_PRACTICE_COLOR },
    ]

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) =>
                    step >= i && i >= startStep ? (
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
                                {t.eq && <Eq {...t.eq} colors size="text-2xl md:text-3xl" />}
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
                                                    'flex min-h-[64px] items-center justify-center py-3 px-3 rounded-xl border-2 font-extrabold text-center transition-colors',
                                                    o.length > 12 ? 'text-base md:text-lg' : 'text-xl md:text-2xl',
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
                                {isDone && t.fact && (
                                    <motion.div className="w-full flex items-start gap-3 rounded-2xl border-2 p-3"
                                        style={{ borderColor: hexToRgba(REMEMBER_COLOR, 0.5), backgroundColor: hexToRgba(REMEMBER_COLOR, 0.08) }}
                                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                                        <figure className="shrink-0 w-24 md:w-28">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={t.fact.src} alt={t.fact.caption} className="w-full rounded-lg border border-[#3A464E]" />
                                            <figcaption className="mt-1 text-center text-xs font-bold text-[#9AA7B0]">{t.fact.caption}</figcaption>
                                        </figure>
                                        <p className="text-sm md:text-base text-[#F2F7FB] leading-snug [&_b]:font-black [&_b]:text-[#F2C35B]">{t.fact.story}</p>
                                    </motion.div>
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
