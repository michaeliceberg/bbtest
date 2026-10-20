'use client'

// «Степени и корни» → «Что такое степень» (POWWALK). Пошаговый разбор:
//   0. «Что такое 2³?» — из 2³ по очереди падают три двойки 2 · 2 · 2, под ними фигурная скобка и «3», потом = 8.
//   1. «Собиралки»: собери степень кнопками «+ ·7» / «− ·7» (7⁵, 3⁴, 10³) и запиши произведение степенью.
//   2. «Тогдааааа:» 5² · 5⁴ — две пятёрки под своей скобкой, четыре под своей, потом одна общая скобка: сколько пятёрок?
//      → 5⁶, плашка «показатели складываются».
// Затем «Проверим себя» — 4 задания на aᵐ · aⁿ = aᵐ⁺ⁿ.
// Цвета: показатель — фиолетовый (ключевое), скобки групп — бирюзовая и синяя, общая — фиолетовая. Оранжевый не используем.

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, RememberPlate, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner } from '@/components/geometry/WalkthroughLog'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}
type SceneProps = { onSettled?: () => void }

const EXP_COLOR = GGEGE_PALETTE.purple.button
const A_COLOR = GGEGE_PALETTE.teal.button
const B_COLOR = GGEGE_PALETTE.blue.button
const OK_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'
const TEXT = '#F2F7FB'
const MUTED = '#9AA7B0'

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n: number) => String(n).split('').map((d) => SUP[Number(d)]).join('')

const bounceIn = { initial: { y: -46, scale: 0.3, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 420, damping: 13 } }
const popIn = { initial: { scale: 3.2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 380, damping: 12 } }

// Степень: основание белым, показатель фиолетовым сверху.
const Pow = ({ base, exp, className, expColor = EXP_COLOR }: { base: React.ReactNode; exp: React.ReactNode; className?: string; expColor?: string }) => (
    <span className={cn('inline-flex items-start font-black', className)} style={{ color: TEXT }}>
        <span>{base}</span>
        <span className="text-[0.55em] leading-none -mt-[0.05em] ml-[0.04em]" style={{ color: expColor }}>{exp}</span>
    </span>
)

// Фигурная скобка снизу: тянется на ширину группы, рисуется «пером».
const Brace = ({ color, show = true }: { color: string; show?: boolean }) => (
    <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="w-full h-4 overflow-visible">
        <motion.path d="M2 1 C2 9 5 10 12 10 L43 10 C48 10 50 12 50 17 C50 12 52 10 57 10 L88 10 C95 10 98 9 98 1"
            fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: show ? 1 : 0 }}
            transition={{ pathLength: { duration: 0.7, ease: 'easeInOut' }, opacity: { duration: 0.4 } }} />
    </svg>
)

// Ряд множителей a · a · … с (необязательной) скобкой и числом под ней. Новые множители падают сверху с отскоком.
const FactorGroup = ({ base, shown, braceOn, braceShow = true, braceColor, label, labelColor, size = 'text-3xl md:text-4xl' }: {
    base: number | string; shown: number; braceOn: boolean; braceShow?: boolean; braceColor: string; label?: React.ReactNode; labelColor?: string; size?: string
}) => (
    <div className="inline-flex flex-col items-center">
        <div className={cn('flex items-center font-black', size)} style={{ color: TEXT }}>
            {Array.from({ length: shown }).map((_, i) => (
                <motion.span key={i} className="inline-flex items-center" {...bounceIn}>
                    {i > 0 && <span className="mx-1 md:mx-1.5" style={{ color: MUTED }}>·</span>}
                    {base}
                </motion.span>
            ))}
        </div>
        <div className="w-full h-4 mt-1">{braceOn && <Brace color={braceColor} show={braceShow} />}</div>
        <div className="h-9 flex items-center">
            {label !== undefined && label !== null && (
                <motion.span key={String(label)} className="text-2xl md:text-3xl font-black tabular-nums" style={{ color: labelColor ?? braceColor }} {...popIn}>{label}</motion.span>
            )}
        </div>
    </div>
)

const TypedBig = ({ text, onDone, readMs = 400, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)

const ReplyButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{children}</button>
    </motion.div>
)

// Цепочка шагов по таймеру: after(ms, n) — перейти в фазу n через ms (не раньше).
function usePhase() {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    const after = (ms: number, n: number) => setTimeout(() => go(n), ms)
    return { phase, go, after }
}

// ===== Сцена 0: что такое 2³ =====
const WhatIsPowerScene = ({ onSettled }: SceneProps) => {
    const { phase, go, after } = usePhase()
    const [shown, setShown] = useState(0)
    useEffect(() => {
        if (phase !== 2) return
        let n = 0
        const id = setInterval(() => {
            n += 1
            setShown(n)
            if (n >= 3) { clearInterval(id); after(500, 3) }
        }, 550)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    useEffect(() => {
        if (phase === 3) { const t = setTimeout(() => go(4), 900); return () => clearTimeout(t) }
        if (phase === 4) { const t = setTimeout(() => go(5), 700); return () => clearTimeout(t) }
        if (phase === 5) { const t = setTimeout(() => go(6), 500); return () => clearTimeout(t) }
        if (phase === 6) { const t = setTimeout(() => onSettled?.(), 900); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <TypedBig text="Что такое 2³?" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => after(300, 2)}>
                    <div className="w-full flex flex-col items-center gap-3 py-2">
                        <motion.div {...popIn}><Pow base="2" exp="3" className="text-6xl md:text-7xl" /></motion.div>
                        <div className="flex items-start gap-3 min-h-[100px]">
                            <FactorGroup base={2} shown={shown} braceOn={phase >= 3} braceColor={A_COLOR} label={phase >= 4 ? 3 : undefined} labelColor={EXP_COLOR} />
                            {phase >= 5 && <motion.span className="text-3xl md:text-4xl font-black" style={{ color: MUTED }} {...popIn}>=</motion.span>}
                            {phase >= 6 && <motion.span className="text-3xl md:text-4xl font-black" style={{ color: OK_COLOR }} {...popIn}>8</motion.span>}
                        </div>
                        {phase >= 4 && (
                            <motion.p className="text-base md:text-lg font-bold text-center" style={{ color: MUTED }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                                Показатель <span style={{ color: EXP_COLOR }}>3</span> — сколько раз умножаем двойку на себя
                            </motion.p>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// ===== Сцена 1: «Собиралки» =====
type BuildRound = { kind: 'build'; base: number; exp: number; start: number; value: string }
type CountRound = { kind: 'count'; base: number; n: number; options: number[] }
type Round = BuildRound | CountRound
const ROUNDS: Round[] = [
    { kind: 'build', base: 7, exp: 5, start: 1, value: '16 807' },
    { kind: 'build', base: 3, exp: 4, start: 6, value: '81' },
    { kind: 'build', base: 10, exp: 3, start: 1, value: '1000' },
    // дистрактор «основание × количество» (20, 14) — частая ошибка: путают степень с умножением
    { kind: 'count', base: 4, n: 5, options: [5, 20, 4, 6] },
    { kind: 'count', base: 2, n: 7, options: [14, 7, 6, 2] },
]
const MAX_FACTORS = 8
const BASE_WORD: Record<number, string> = { 7: 'семёрок', 3: 'троек', 10: 'десяток', 4: 'четвёрок', 2: 'двоек' }

const CollectorScene = ({ onSettled }: SceneProps) => {
    const [ri, setRi] = useState(0)
    const [count, setCount] = useState((ROUNDS[0] as BuildRound).start)
    const [done, setDone] = useState(false)
    const [typed, setTyped] = useState(false)
    const [flash, setFlash] = useState<string | null>(null)
    const [wrong, setWrong] = useState<number[]>([])
    const r = ROUNDS[ri]
    const fail = (msg: string) => { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setFlash(msg) }
    const win = () => {
        showAnswerMeme(true)
        setFlash(null); setDone(true)
        if (ri + 1 >= ROUNDS.length) setTimeout(() => onSettled?.(), 600)
    }
    const nextRound = () => {
        const n = ri + 1
        setRi(n); setDone(false); setTyped(false); setFlash(null); setWrong([])
        const nr = ROUNDS[n]
        if (nr.kind === 'build') setCount(nr.start)
    }
    const check = () => {
        if (r.kind !== 'build' || done) return
        if (count === r.exp) win()
        else fail(count < r.exp
            ? `${pickWrongTryPhrase()} Пока ${count}, а нужно ${r.exp}. Добавь ещё.`
            : `${pickWrongTryPhrase()} Тут ${count} — это перебор, лишние убери.`)
    }
    const pick = (v: number) => {
        if (r.kind !== 'count' || done || wrong.includes(v)) return
        if (v === r.n) win()
        else { setWrong((w) => [...w, v]); fail(v === r.base * r.n ? `${pickWrongTryPhrase()} Это ${r.base}·${r.n}, а нам нужно посчитать, сколько раз стоит ${r.base}.` : `${pickWrongTryPhrase()} Посчитай множители под скобкой.`) }
    }
    const prompt = r.kind === 'build' ? `Собери ${r.base}${sup(r.exp)}` : `Сколько тут ${BASE_WORD[r.base]}? Запиши степенью`
    return (
        <>
            <div className="w-full flex items-center gap-3" aria-hidden>
                <div className="flex-1 h-px bg-[#3A464E]" />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: EXP_COLOR }}>Собиралки 🧩</span>
                <div className="flex-1 h-px bg-[#3A464E]" />
            </div>
            <div className="relative w-full flex items-center justify-center min-h-9">
                <motion.div key={`cnt-${ri}`} initial={ri === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                    style={{ borderColor: hexToRgba(EXP_COLOR, 0.55), backgroundColor: hexToRgba(EXP_COLOR, 0.16), color: EXP_COLOR }}>
                    <span>{ri + 1}</span><span className="opacity-50 font-normal">/</span><span>{ROUNDS.length}</span>
                </motion.div>
                <p className="text-xl md:text-2xl font-black text-[#F2F7FB] text-center px-16">
                    <Typewriter key={`p-${ri}`} text={prompt} onDone={() => setTyped(true)} />
                </p>
            </div>
            <div key={`fig-${ri}`} className="w-full flex flex-col items-center gap-1 min-h-[110px] justify-center">
                {r.kind === 'build' ? (
                    <div className="flex items-start gap-3">
                        <FactorGroup base={r.base} shown={count} braceOn={count > 0} braceColor={done ? OK_COLOR : A_COLOR}
                            label={count} labelColor={done ? OK_COLOR : A_COLOR} size={r.base === 10 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'} />
                        {done && <motion.span className="text-2xl md:text-3xl font-black pt-1" style={{ color: OK_COLOR }} {...popIn}>= {r.value}</motion.span>}
                    </div>
                ) : (
                    <FactorGroup base={r.base} shown={r.n} braceOn braceColor={done ? OK_COLOR : A_COLOR} label={done ? r.n : '?'} labelColor={done ? OK_COLOR : A_COLOR} />
                )}
            </div>
            {!done && typed && r.kind === 'build' && (
                <div className="w-full flex flex-col gap-3">
                    <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
                        <button type="button" disabled={count <= 1} onClick={() => { setFlash(null); setCount((c) => Math.max(1, c - 1)) }}
                            className="min-h-[56px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-xl font-black text-[#F2F7FB] disabled:opacity-40">
                            − убрать ·{r.base}
                        </button>
                        <button type="button" disabled={count >= MAX_FACTORS} onClick={() => { setFlash(null); setCount((c) => Math.min(MAX_FACTORS, c + 1)) }}
                            className="min-h-[56px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-xl font-black text-[#F2F7FB] disabled:opacity-40">
                            + добавить ·{r.base}
                        </button>
                    </div>
                    <div className="w-full flex">
                        <button type="button" onClick={check} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>Проверить</button>
                    </div>
                </div>
            )}
            {!done && typed && r.kind === 'count' && (
                <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
                    {r.options.map((v) => {
                        const isWrong = wrong.includes(v)
                        return (
                            <button key={v} type="button" disabled={isWrong} onClick={() => pick(v)}
                                className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-3xl transition-colors flex items-center justify-center',
                                    isWrong ? 'border-[#DC605B] bg-[#DC605B22]' : 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]')}>
                                <Pow base={r.base} exp={v} />
                            </button>
                        )
                    })}
                </div>
            )}
            {flash && !done && <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.13), color: WRONG_COLOR }}>{flash}</div>}
            {done && (
                <>
                    <FieryFeedbackBanner>
                        {CORRECT_FEEDBACK_PHRASES[ri % CORRECT_FEEDBACK_PHRASES.length]} {r.kind === 'build' ? `${r.base}${sup(r.exp)} — это ${r.exp} ${BASE_WORD[r.base]}` : `${r.base}${sup(r.n)}`}
                    </FieryFeedbackBanner>
                    <LocalAnswerConfetti />
                    {ri + 1 < ROUNDS.length && <ReplyButton onClick={nextRound}>{ri === 2 ? 'А теперь наоборот' : 'Ещё!'}</ReplyButton>}
                </>
            )}
        </>
    )
}

// ===== Сцена 2: 5² · 5⁴ =====
const ProductScene = ({ onSettled }: SceneProps) => {
    const { phase, go, after } = usePhase()
    const [aShown, setAShown] = useState(0)
    const [bShown, setBShown] = useState(0)
    const [wrong, setWrong] = useState<number[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const dropFactors = (total: number, set: (n: number) => void, then: () => void) => {
        let n = 0
        const id = setInterval(() => { n += 1; set(n); if (n >= total) { clearInterval(id); then() } }, 500)
        return () => clearInterval(id)
    }
    // 2: две пятёрки → 3: скобка → 4: «2» → 5: кнопка «Дальше дальше!»
    useEffect(() => {
        if (phase === 2) return dropFactors(2, setAShown, () => after(400, 3))
        if (phase === 3) { const t = setTimeout(() => go(4), 800); return () => clearTimeout(t) }
        if (phase === 4) { const t = setTimeout(() => go(5), 700); return () => clearTimeout(t) }
        // 6: четыре пятёрки → 7: скобка → 8: «4» → 9: вопрос
        if (phase === 6) return dropFactors(4, setBShown, () => after(400, 7))
        if (phase === 7) { const t = setTimeout(() => go(8), 800); return () => clearTimeout(t) }
        if (phase === 8) { const t = setTimeout(() => go(9), 900); return () => clearTimeout(t) }
        // 10: скобки групп гаснут → 11: общая скобка и варианты
        if (phase === 10) { const t = setTimeout(() => go(11), 700); return () => clearTimeout(t) }
        // 12: ответ 6 → 13: = 5⁶ → 14: плашка
        if (phase === 12) { const t = setTimeout(() => go(13), 900); return () => clearTimeout(t) }
        if (phase === 13) { const t = setTimeout(() => go(14), 1000); return () => clearTimeout(t) }
        if (phase === 14) { const t = setTimeout(() => onSettled?.(), 1400); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const pick = (v: number) => {
        if (phase !== 11 || wrong.includes(v)) return
        if (v === 6) { showAnswerMeme(true); setFlash(null); go(12); return }
        playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
        setWrong((w) => [...w, v])
        setFlash(v === 8 ? `${pickWrongTryPhrase()} 2 · 4 = 8 — но мы не умножаем, а считаем пятёрки подряд.` : `${pickWrongTryPhrase()} Посчитай все пятёрки под большой скобкой.`)
    }
    return (
        <>
            <TypedBig text="Тогдааааааааааа:" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => after(300, 2)}>
                    <div className="w-full flex flex-col items-center gap-3 py-2">
                        <motion.div className="flex items-center gap-3 text-5xl md:text-6xl" {...popIn}>
                            <Pow base="5" exp="2" /><span className="font-black" style={{ color: MUTED }}>·</span><Pow base="5" exp="4" />
                            <span className="font-black" style={{ color: MUTED }}>=</span>
                            {phase >= 13 ? <motion.span {...popIn}><Pow base="5" exp="6" /></motion.span> : <span className="font-black" style={{ color: MUTED }}>?</span>}
                        </motion.div>
                        <div className="inline-flex flex-col items-center min-h-[120px]">
                            <div className="flex items-start">
                                <FactorGroup base={5} shown={aShown} braceOn={phase >= 3} braceShow={phase < 10} braceColor={A_COLOR}
                                    label={phase >= 4 && phase < 10 ? 2 : undefined} size="text-2xl md:text-4xl" />
                                {phase >= 6 && <motion.span className="text-2xl md:text-4xl font-black mx-1 md:mx-1.5" style={{ color: MUTED }} {...bounceIn}>·</motion.span>}
                                {phase >= 6 && (
                                    <FactorGroup base={5} shown={bShown} braceOn={phase >= 7} braceShow={phase < 10} braceColor={B_COLOR}
                                        label={phase >= 8 && phase < 10 ? 4 : undefined} size="text-2xl md:text-4xl" />
                                )}
                            </div>
                            {phase >= 11 && (
                                <div className="w-full -mt-[52px] flex flex-col items-center">
                                    <div className="w-full h-4"><Brace color={EXP_COLOR} /></div>
                                    <div className="h-9 flex items-center">
                                        <motion.span key={phase >= 12 ? 'six' : 'q'} className="text-2xl md:text-3xl font-black" style={{ color: phase >= 12 ? OK_COLOR : EXP_COLOR }} {...popIn}>
                                            {phase >= 12 ? '6' : '?'}
                                        </motion.span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase === 5 && <ReplyButton onClick={() => go(6)}>Дальше дальше!</ReplyButton>}
            {phase >= 9 && <TypedBig small text="Сколько теперь пятёрок?" onDone={() => go(10)} />}
            {phase === 11 && (
                <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
                    {[8, 6, 4, 2].map((v) => {
                        const isWrong = wrong.includes(v)
                        return (
                            <button key={v} type="button" disabled={isWrong} onClick={() => pick(v)}
                                className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors',
                                    isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                {v}
                            </button>
                        )
                    })}
                </div>
            )}
            {phase === 11 && flash && <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.13), color: WRONG_COLOR }}>{flash}</div>}
            {phase >= 12 && <LocalAnswerConfetti />}
            {phase >= 14 && (
                <RememberPlate>
                    <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                        При умножении показатели <span style={{ color: EXP_COLOR }}>СКЛАДЫВАЮТСЯ</span>
                        <div className="mt-2 text-2xl md:text-3xl flex items-center justify-center gap-2">
                            <Pow base="a" exp="m" /><span style={{ color: MUTED }}>·</span><Pow base="a" exp="n" /><span style={{ color: MUTED }}>=</span><Pow base="a" exp="m+n" />
                        </div>
                    </div>
                </RememberPlate>
            )}
        </>
    )
}

// ===== Урок 2: степень в степени и деление =====
// (5²)⁴: внутренняя степень — фиолетовая, внешняя — синяя (как скобка-счётчик блоков).
const PowPow = ({ base, inner, outer, className }: { base: React.ReactNode; inner: React.ReactNode; outer: React.ReactNode; className?: string }) => (
    <span className={cn('inline-flex items-start font-black', className)} style={{ color: TEXT }}>
        <span>(</span><Pow base={base} exp={inner} /><span>)</span>
        <span className="text-[0.55em] leading-none -mt-[0.05em] ml-[0.04em]" style={{ color: B_COLOR }}>{outer}</span>
    </span>
)

// Блок «5·5» в рамке — одна внутренняя степень.
const Block = ({ base, n, color = A_COLOR }: { base: number | string; n: number; color?: string }) => (
    <span className="inline-flex items-center rounded-xl border-2 px-1.5 py-0.5" style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.12) }}>
        {Array.from({ length: n }).map((_, i) => (
            <span key={i} className="inline-flex items-center">{i > 0 && <span className="mx-0.5" style={{ color: MUTED }}>·</span>}{base}</span>
        ))}
    </span>
)

// Ряд блоков · блок · блок со скобкой снизу и числом блоков. Блоки падают сверху с отскоком.
const BlockRow = ({ base, n, shown, braceOn, label, labelColor = B_COLOR, size = 'text-xl md:text-3xl' }: {
    base: number | string; n: number; shown: number; braceOn: boolean; label?: React.ReactNode; labelColor?: string; size?: string
}) => (
    <div className="inline-flex flex-col items-center max-w-full">
        <div className={cn('flex items-center font-black flex-nowrap', size)} style={{ color: TEXT }}>
            {Array.from({ length: shown }).map((_, i) => (
                <motion.span key={i} className="inline-flex items-center" {...bounceIn}>
                    {i > 0 && <span className="mx-1" style={{ color: MUTED }}>·</span>}
                    <Block base={base} n={n} />
                </motion.span>
            ))}
        </div>
        <div className="w-full h-4 mt-1">{braceOn && <Brace color={B_COLOR} />}</div>
        <div className="h-9 flex items-center">
            {label !== undefined && label !== null && (
                <motion.span key={String(label)} className="text-2xl md:text-3xl font-black tabular-nums" style={{ color: labelColor }} {...popIn}>{label}</motion.span>
            )}
        </div>
    </div>
)

const OptionGrid = ({ options, wrong, onPick, render }: { options: (number | string)[]; wrong: (number | string)[]; onPick: (v: number | string) => void; render?: (v: number | string) => React.ReactNode }) => (
    <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
        {options.map((v) => {
            const isWrong = wrong.includes(v)
            return (
                <button key={String(v)} type="button" disabled={isWrong} onClick={() => onPick(v)}
                    className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors flex items-center justify-center px-2',
                        isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                    {render ? render(v) : v}
                </button>
            )
        })}
    </div>
)
const FlashBad = ({ text }: { text: string }) => <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.13), color: WRONG_COLOR }}>{text}</div>
const FlashOk = ({ text }: { text: React.ReactNode }) => <FieryFeedbackBanner>{text}</FieryFeedbackBanner>
const badTry = (hint: string) => { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); return `${pickWrongTryPhrase()} ${hint}` }

// Сцена 0 урока 2: (5²)⁴ — четыре блока 5·5
const PowerOfPowerScene = ({ onSettled }: SceneProps) => {
    const { phase, go, after } = usePhase()
    const [shown, setShown] = useState(0)
    const [wrong, setWrong] = useState<(number | string)[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    useEffect(() => {
        if (phase === 2) {
            let n = 0
            const id = setInterval(() => { n += 1; setShown(n); if (n >= 4) { clearInterval(id); after(450, 3) } }, 600)
            return () => clearInterval(id)
        }
        if (phase === 3) { const t = setTimeout(() => go(4), 800); return () => clearTimeout(t) }
        if (phase === 4) { const t = setTimeout(() => go(5), 900); return () => clearTimeout(t) }
        if (phase === 7) { const t = setTimeout(() => go(8), 900); return () => clearTimeout(t) }
        if (phase === 8) { const t = setTimeout(() => go(9), 1000); return () => clearTimeout(t) }
        if (phase === 9) { const t = setTimeout(() => onSettled?.(), 1400); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const pick = (v: number | string) => {
        if (phase !== 6 || wrong.includes(v)) return
        if (v === 8) { showAnswerMeme(true); setFlash(null); go(7); return }
        setWrong((w) => [...w, v])
        setFlash(badTry(v === 6 ? '2 + 4 = 6 — так было при умножении степеней. Тут 4 блока по 2.' : 'Посчитай: 4 блока, в каждом по 2 пятёрки.'))
    }
    return (
        <>
            <TypedBig text="А теперь степень в степени 😎" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => after(300, 2)}>
                    <div className="w-full flex flex-col items-center gap-3 py-2">
                        <motion.div className="flex items-center gap-3 text-5xl md:text-6xl" {...popIn}>
                            <PowPow base="5" inner="2" outer="4" />
                            <span className="font-black" style={{ color: MUTED }}>=</span>
                            {phase >= 8 ? <motion.span {...popIn}><Pow base="5" exp="8" /></motion.span> : <span className="font-black" style={{ color: MUTED }}>?</span>}
                        </motion.div>
                        <BlockRow base={5} n={2} shown={shown} braceOn={phase >= 3} label={phase >= 7 ? <span style={{ color: OK_COLOR }}>4 · 2 = 8 пятёрок</span> : phase >= 4 ? '4 блока' : undefined} />
                    </div>
                </DiagramBlock>
            )}
            {phase >= 5 && <TypedBig small text="Сколько всего пятёрок?" onDone={() => go(6)} />}
            {phase === 6 && <OptionGrid options={[6, 8, 16, 7]} wrong={wrong} onPick={pick} />}
            {phase === 6 && flash && <FlashBad text={flash} />}
            {phase >= 7 && <LocalAnswerConfetti />}
            {phase >= 9 && (
                <RememberPlate>
                    <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                        Степень в степени: показатели <span style={{ color: B_COLOR }}>ПЕРЕМНОЖАЮТСЯ</span>
                        <div className="mt-2 text-2xl md:text-3xl flex items-center justify-center gap-2">
                            <PowPow base="a" inner="m" outer="n" /><span style={{ color: MUTED }}>=</span><Pow base="a" exp="m·n" />
                        </div>
                        <div className="mt-2 text-sm font-bold" style={{ color: MUTED }}>А при aᵐ · aⁿ — складываем. Не путай 😉</div>
                    </div>
                </RememberPlate>
            )}
        </>
    )
}

// Сцена 1 урока 2: «Блокостройка» — 4 разных упражнения
type BlockRound =
    | { kind: 'build'; base: number; inner: number; outer: number; start: number }
    | { kind: 'write'; base: number; inner: number; outer: number; options: string[] }
    | { kind: 'impostor'; total: number; options: string[]; impostor: string }
    | { kind: 'trap'; options: string[]; correct: string }
const BLOCK_ROUNDS: BlockRound[] = [
    { kind: 'build', base: 3, inner: 3, outer: 2, start: 1 },
    { kind: 'write', base: 2, inner: 4, outer: 3, options: ['4,3', '3,4', '4,7', '12,1'] },
    { kind: 'impostor', total: 12, options: ['3,4', '6,2', '4,3', '10,2'], impostor: '10,2' },
    { kind: 'trap', options: ['mul', 'pp'], correct: 'pp' },
]
const pp = (code: string, base: number | string) => { const [i, o] = code.split(','); return <PowPow base={base} inner={i} outer={o} className="text-2xl md:text-3xl" /> }
const BLOCK_PROMPT: Record<BlockRound['kind'], string> = {
    build: 'Собери (3³)²: сколько блоков 3·3·3?',
    write: 'Запиши это степенью в степени',
    impostor: 'Найди самозванца 🕵️ Все равны 2¹², кроме одного',
    trap: 'Ловушка! Где ровно 6 пятёрок?',
}

const BlockGameScene = ({ onSettled }: SceneProps) => {
    const [ri, setRi] = useState(0)
    const [count, setCount] = useState(1)
    const [done, setDone] = useState(false)
    const [typed, setTyped] = useState(false)
    const [flash, setFlash] = useState<string | null>(null)
    const [wrong, setWrong] = useState<(number | string)[]>([])
    const r = BLOCK_ROUNDS[ri]
    const win = () => { showAnswerMeme(true); setFlash(null); setDone(true); if (ri + 1 >= BLOCK_ROUNDS.length) setTimeout(() => onSettled?.(), 600) }
    const next = () => { setRi(ri + 1); setDone(false); setTyped(false); setFlash(null); setWrong([]) }
    const pick = (v: number | string) => {
        if (done || wrong.includes(v)) return
        const ok = r.kind === 'write' ? v === `${r.inner},${r.outer}` : r.kind === 'impostor' ? v === r.impostor : r.kind === 'trap' ? v === r.correct : false
        if (ok) return win()
        setWrong((w) => [...w, v])
        if (r.kind === 'write') setFlash(badTry(v === '3,4' ? 'Внутри — один блок (2⁴), снаружи — сколько блоков (3).' : 'В блоке 4 двойки, блоков 3.'))
        if (r.kind === 'impostor') setFlash(badTry('Этот как раз 2¹²: перемножь показатели.'))
        if (r.kind === 'trap') setFlash(badTry('5² · 5³ = 5⁵: при умножении складываем. А (5²)³ — 2 · 3 = 6.'))
    }
    const check = () => {
        if (r.kind !== 'build' || done) return
        if (count === r.outer) win()
        else setFlash(badTry(`Показатель снаружи — ${r.outer}, значит нужно ${r.outer} блока.`))
    }
    return (
        <>
            <div className="w-full flex items-center gap-3" aria-hidden>
                <div className="flex-1 h-px bg-[#3A464E]" />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: B_COLOR }}>Блокостройка 🧱</span>
                <div className="flex-1 h-px bg-[#3A464E]" />
            </div>
            <div className="relative w-full flex items-center justify-center min-h-9">
                <motion.div key={`cnt-${ri}`} initial={ri === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                    style={{ borderColor: hexToRgba(B_COLOR, 0.55), backgroundColor: hexToRgba(B_COLOR, 0.16), color: B_COLOR }}>
                    <span>{ri + 1}</span><span className="opacity-50 font-normal">/</span><span>{BLOCK_ROUNDS.length}</span>
                </motion.div>
                <p className="text-lg md:text-xl font-black text-[#F2F7FB] text-center px-16">
                    <Typewriter key={`p-${ri}`} text={BLOCK_PROMPT[r.kind]} onDone={() => setTyped(true)} />
                </p>
            </div>
            <div key={`fig-${ri}`} className="w-full flex flex-col items-center gap-2 min-h-[100px] justify-center">
                {r.kind === 'build' && (
                    <>
                        <BlockRow base={r.base} n={r.inner} shown={count} braceOn label={count} labelColor={done ? OK_COLOR : B_COLOR} size="text-lg md:text-2xl" />
                        {done && <motion.div className="text-3xl" {...popIn}><PowPow base="3" inner="3" outer="2" /> <span style={{ color: MUTED }}>=</span> <Pow base="3" exp="6" /></motion.div>}
                    </>
                )}
                {r.kind === 'write' && <BlockRow base={r.base} n={r.inner} shown={r.outer} braceOn label={done ? <PowPow base="2" inner="4" outer="3" /> : '?'} size="text-lg md:text-2xl" />}
                {r.kind === 'impostor' && <motion.div className="text-5xl" {...popIn}><Pow base="2" exp="12" /></motion.div>}
                {r.kind === 'trap' && <div className="text-base font-bold" style={{ color: MUTED }}>Одна из них хитрая 👀</div>}
            </div>
            {!done && typed && r.kind === 'build' && (
                <div className="w-full flex flex-col gap-3">
                    <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
                        <button type="button" disabled={count <= 1} onClick={() => { setFlash(null); setCount((c) => Math.max(1, c - 1)) }}
                            className="min-h-[56px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-lg font-black text-[#F2F7FB] disabled:opacity-40">− убрать блок</button>
                        <button type="button" disabled={count >= 4} onClick={() => { setFlash(null); setCount((c) => Math.min(4, c + 1)) }}
                            className="min-h-[56px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-lg font-black text-[#F2F7FB] disabled:opacity-40">+ добавить блок</button>
                    </div>
                    <div className="w-full flex"><button type="button" onClick={check} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>Проверить</button></div>
                </div>
            )}
            {!done && typed && r.kind !== 'build' && (
                <OptionGrid options={r.options} wrong={wrong} onPick={pick}
                    render={(v) => r.kind === 'trap'
                        ? (v === 'pp' ? <PowPow base="5" inner="2" outer="3" className="text-3xl" /> : <span className="inline-flex items-center gap-1 text-3xl"><Pow base="5" exp="2" /><span style={{ color: MUTED }}>·</span><Pow base="5" exp="3" /></span>)
                        : pp(String(v), r.kind === 'write' ? r.base : 2)} />
            )}
            {flash && !done && <FlashBad text={flash} />}
            {done && (
                <>
                    <FlashOk text={<>{CORRECT_FEEDBACK_PHRASES[(ri + 5) % CORRECT_FEEDBACK_PHRASES.length]} {r.kind === 'impostor' ? '(2¹⁰)² = 2²⁰ — самозванец пойман!' : r.kind === 'trap' ? '(5²)³ = 5⁶, а 5² · 5³ = 5⁵' : r.kind === 'write' ? '(2⁴)³ = 2¹²' : '2 блока по 3 = 3⁶'}</>} />
                    <LocalAnswerConfetti />
                    {ri + 1 < BLOCK_ROUNDS.length && <ReplyButton onClick={next}>{ri === 2 ? 'Давай ловушку!' : 'Ещё!'}</ReplyButton>}
                </>
            )}
        </>
    )
}

// «Сокращалка»: ученик сам вычёркивает пары «верхняя + нижняя пятёрка». Один движок на три сцены:
// 5⁵ : 5² (урок 2), 5² : 5² → 5⁰ = 1 и 5² : 5⁵ → 1/5³ (урок 3).
type Opt = number | string
type CutCfg = {
    intro: string; top: number; bot: number; result: React.ReactNode
    question: string; options: Opt[]; correct: Opt; render?: (v: Opt) => React.ReactNode
    hint: (v: Opt) => string; ok: React.ReactNode; plate: React.ReactNode
}
const ExpTxt = (v: Opt) => String(v).replace(/-/g, '−')
// «1/5³» → дробь; иначе текст как есть
const FracTxt = ({ v, className }: { v: Opt; className?: string }) => {
    const t = String(v)
    if (!t.includes('/')) return <span className={cn('font-black', className)}>{t}</span>
    const [a, b] = t.split('/')
    return (
        <span className={cn('inline-flex flex-col items-center font-black leading-none', className)}>
            <span>{a}</span><span className="h-[3px] w-full rounded-full my-1 bg-current" /><span>{b}</span>
        </span>
    )
}
const makeCutScene = (c: CutCfg) => {
    const pairs = Math.min(c.top, c.bot)
    const CutScene = ({ onSettled }: SceneProps) => {
        const { phase, go, after } = usePhase()
        const [shown, setShown] = useState(0)
        const [selTop, setSelTop] = useState<number | null>(null)
        const [selBot, setSelBot] = useState<number | null>(null)
        const [cutTop, setCutTop] = useState<number[]>([])
        const [cutBot, setCutBot] = useState<number[]>([])
        const [wrong, setWrong] = useState<Opt[]>([])
        const [flash, setFlash] = useState<string | null>(null)
        useEffect(() => {
            if (phase === 2) {
                let n = 0
                const id = setInterval(() => { n += 1; setShown(n); if (n >= c.top + c.bot) { clearInterval(id); after(500, 3) } }, 380)
                return () => clearInterval(id)
            }
            if (phase === 6) { const t = setTimeout(() => go(7), 900); return () => clearTimeout(t) }
            if (phase === 7) { const t = setTimeout(() => go(8), 1000); return () => clearTimeout(t) }
            if (phase === 8) { const t = setTimeout(() => onSettled?.(), 1400); return () => clearTimeout(t) }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [phase])
        // Пара выбрана → обе пятёрки вычёркиваются
        useEffect(() => {
            if (selTop === null || selBot === null) return
            const t = selTop, b = selBot
            setCutTop((x) => [...x, t]); setCutBot((x) => [...x, b]); setSelTop(null); setSelBot(null)
            showAnswerMeme(true)
            if (cutBot.length + 1 >= pairs) setTimeout(() => go(4), 700)
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [selTop, selBot])
        const pick = (v: Opt) => {
            if (phase !== 5 || wrong.includes(v)) return
            if (v === c.correct) { showAnswerMeme(true); setFlash(null); go(6); return }
            setWrong((w) => [...w, v])
            setFlash(badTry(c.hint(v)))
        }
        // Функция, а не компонент: компонент, объявленный внутри, пересоздавался бы на каждый рендер и пятёрки прыгали бы заново.
        const five = (i: number, top: boolean) => {
            const cut = (top ? cutTop : cutBot).includes(i)
            const sel = top ? selTop === i : selBot === i
            const clickable = phase === 3 && !cut
            return (
                <motion.button key={`${top ? 't' : 'b'}${i}`} type="button" disabled={!clickable} onClick={() => (top ? setSelTop(i) : setSelBot(i))}
                    className="relative inline-flex items-center justify-center w-10 h-12 md:w-12 md:h-14 rounded-xl border-2 text-2xl md:text-3xl font-black"
                    style={{ color: TEXT, borderColor: sel ? EXP_COLOR : clickable ? '#3A464E' : 'transparent', backgroundColor: sel ? hexToRgba(EXP_COLOR, 0.2) : 'transparent' }}
                    {...bounceIn} animate={{ y: 0, scale: 1, opacity: cut ? 0.28 : 1 }}>
                    5
                    {cut && (
                        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                            <motion.line x1={6} y1={34} x2={34} y2={6} stroke={WRONG_COLOR} strokeWidth={4} strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                        </svg>
                    )}
                </motion.button>
            )
        }
        return (
            <>
                <TypedBig text={c.intro} onDone={() => go(1)} />
                {phase >= 1 && (
                    <DiagramBlock onSettled={() => after(300, 2)}>
                        <div className="w-full flex flex-col items-center gap-3 py-2">
                            <motion.div className="flex items-center gap-3 text-5xl md:text-6xl" {...popIn}>
                                <Pow base="5" exp={c.top} /><span className="font-black" style={{ color: MUTED }}>:</span><Pow base="5" exp={c.bot} expColor={B_COLOR} />
                                <span className="font-black" style={{ color: MUTED }}>=</span>
                                {phase >= 7 ? <motion.span className="inline-flex items-center gap-3" {...popIn}>{c.result}</motion.span> : <span className="font-black" style={{ color: MUTED }}>?</span>}
                            </motion.div>
                            <div className="flex flex-col items-center">
                                <div className="flex gap-1 min-h-[3.5rem]">{Array.from({ length: Math.min(shown, c.top) }).map((_, i) => five(i, true))}</div>
                                <div className="h-1 w-full min-w-[96px] rounded-full my-1.5" style={{ backgroundColor: TEXT }} />
                                <div className="flex gap-1 min-h-[3.5rem]">{Array.from({ length: Math.max(0, shown - c.top) }).map((_, i) => five(i, false))}</div>
                            </div>
                        </div>
                    </DiagramBlock>
                )}
                {phase >= 3 && <TypedBig small text="Сокращалка: тапни пятёрку сверху и пятёрку снизу — пара сгорит 🔥" />}
                {phase >= 4 && <TypedBig small text={c.question} onDone={() => go(5)} />}
                {phase === 5 && <OptionGrid options={c.options} wrong={wrong} onPick={pick} render={c.render} />}
                {phase === 5 && flash && <FlashBad text={flash} />}
                {phase >= 6 && <FlashOk text={c.ok} />}
                {phase >= 6 && <LocalAnswerConfetti />}
                {phase >= 8 && <RememberPlate><div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">{c.plate}</div></RememberPlate>}
            </>
        )
    }
    return CutScene
}

const CutScene = makeCutScene({
    intro: 'А что если ДЕЛИТЬ? ✂️', top: 5, bot: 2, result: <Pow base="5" exp="3" />,
    question: 'Сколько пятёрок осталось?', options: [7, 3, 10, 2], correct: 3,
    hint: (v) => v === 7 ? '5 + 2 = 7 — это было бы умножение. Тут мы сократили.' : 'Посчитай невычеркнутые пятёрки сверху.',
    ok: '3 пятёрки → 5³',
    plate: <>При делении показатели <span style={{ color: WRONG_COLOR }}>ВЫЧИТАЮТСЯ</span>
        <div className="mt-2 text-2xl md:text-3xl flex items-center justify-center gap-2">
            <Pow base="a" exp="m" /><span style={{ color: MUTED }}>:</span><Pow base="a" exp="n" /><span style={{ color: MUTED }}>=</span><Pow base="a" exp="m−n" />
        </div></>,
})

// ===== Урок 3: нулевая и отрицательная степень =====
const ZeroCutScene = makeCutScene({
    intro: 'А если поровну? 🤔', top: 2, bot: 2,
    result: <><Pow base="5" exp="0" /><span className="font-black" style={{ color: MUTED }}>=</span><span className="font-black" style={{ color: OK_COLOR }}>1</span></>,
    question: 'Всё сгорело 🔥 А чему равно 25 : 25?', options: [0, 1, 25, 5], correct: 1,
    hint: (v) => v === 0 ? 'Не 0! Число, делённое само на себя, — это 1.' : '25 : 25 — сколько раз 25 помещается в 25?',
    ok: <>25 : 25 = 1. А по правилу 5²⁻² = 5⁰. Значит 5⁰ = 1!</>,
    plate: <>Любое число в степени <span style={{ color: EXP_COLOR }}>0</span> = 1
        <div className="mt-2 text-2xl md:text-3xl flex items-center justify-center gap-2">
            <Pow base="a" exp="0" /><span style={{ color: MUTED }}>=</span><span>1</span>
        </div>
        <div className="mt-1 text-sm font-bold" style={{ color: MUTED }}>(a ≠ 0)</div></>,
})
const NegCutScene = makeCutScene({
    intro: 'А если снизу БОЛЬШЕ? 😳', top: 2, bot: 5,
    result: <><Pow base="5" exp="−3" /><span className="font-black" style={{ color: MUTED }}>=</span><FracTxt v="1/5³" className="text-4xl" /></>,
    question: 'Пятёрки остались ВНИЗУ. Что получилось?', options: ['5³', '1/5³', '0', '−5³'], correct: '1/5³',
    render: (v) => <FracTxt v={v} className={String(v).includes('/') ? 'text-xl' : ''} />,
    hint: (v) => v === '−5³' ? 'Минус в показателе — это не минус перед числом. Число просто уезжает вниз.' : v === '5³' ? 'Посмотри: оставшиеся пятёрки — снизу дроби.' : 'Что-то же осталось — три пятёрки внизу.',
    ok: <>Внизу 5³ → это 1/5³. А по правилу 5²⁻⁵ = 5⁻³!</>,
    plate: <>Минус в показателе — число уезжает <span style={{ color: B_COLOR }}>ВНИЗ</span> дроби
        <div className="mt-2 text-2xl md:text-3xl flex items-center justify-center gap-2">
            <Pow base="a" exp="−n" /><span style={{ color: MUTED }}>=</span><FracTxt v="1/aⁿ" className="text-2xl" />
        </div></>,
})

// Короткие раунды «выбери вариант» для мини-игр урока 3.
type QRound = { prompt: string; fig: React.ReactNode; options: Opt[]; correct: Opt; hint: string; ok: string; frac?: boolean }
const makeQuizRounds = (title: string, color: string, rounds: QRound[], moreLabel = 'Ещё!') => {
    const QuizRoundsScene = ({ onSettled }: SceneProps) => {
        const [ri, setRi] = useState(0)
        const [done, setDone] = useState(false)
        const [typed, setTyped] = useState(false)
        const [wrong, setWrong] = useState<Opt[]>([])
        const [flash, setFlash] = useState<string | null>(null)
        const r = rounds[ri]
        const pick = (v: Opt) => {
            if (done || wrong.includes(v)) return
            if (v === r.correct) {
                showAnswerMeme(true); setFlash(null); setDone(true)
                if (ri + 1 >= rounds.length) setTimeout(() => onSettled?.(), 600)
                return
            }
            setWrong((w) => [...w, v]); setFlash(badTry(r.hint))
        }
        return (
            <>
                <div className="w-full flex items-center gap-3" aria-hidden>
                    <div className="flex-1 h-px bg-[#3A464E]" />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{title}</span>
                    <div className="flex-1 h-px bg-[#3A464E]" />
                </div>
                <div className="relative w-full flex items-center justify-center min-h-9">
                    <motion.div key={`cnt-${ri}`} initial={ri === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                        style={{ borderColor: hexToRgba(color, 0.55), backgroundColor: hexToRgba(color, 0.16), color }}>
                        <span>{ri + 1}</span><span className="opacity-50 font-normal">/</span><span>{rounds.length}</span>
                    </motion.div>
                    <p className="text-lg md:text-xl font-black text-[#F2F7FB] text-center px-16">
                        <Typewriter key={`p-${ri}`} text={r.prompt} onDone={() => setTyped(true)} />
                    </p>
                </div>
                <motion.div key={`fig-${ri}`} className="w-full flex items-center justify-center min-h-[90px] text-5xl md:text-6xl" {...popIn}>{r.fig}</motion.div>
                {!done && typed && <OptionGrid options={r.options} wrong={wrong} onPick={pick} render={r.frac ? (v) => <FracTxt v={v} className={String(v).includes('/') ? 'text-xl' : ''} /> : undefined} />}
                {flash && !done && <FlashBad text={flash} />}
                {done && (
                    <>
                        <FlashOk text={`${CORRECT_FEEDBACK_PHRASES[(ri + 2) % CORRECT_FEEDBACK_PHRASES.length]} ${r.ok}`} />
                        <LocalAnswerConfetti />
                        {ri + 1 < rounds.length && <ReplyButton onClick={() => { setRi(ri + 1); setDone(false); setTyped(false); setWrong([]); setFlash(null) }}>{moreLabel}</ReplyButton>}
                    </>
                )}
            </>
        )
    }
    return QuizRoundsScene
}

const ZeroGameScene = makeQuizRounds('Нулевик 0️⃣', EXP_COLOR, [
    { prompt: 'Огромное число в нулевой степени', fig: <Pow base="9 999 999" exp="0" className="text-4xl md:text-5xl" />, options: [0, 1, 9999999, '∞'], correct: 1, hint: 'Неважно, какое число — в степени 0 всегда 1.', ok: 'Хоть миллиард — в нулевой степени будет 1' },
    { prompt: 'А с буквой? (x ≠ 0)', fig: <Pow base="x" exp="0" />, options: ['x', '0', '1', 'x²'], correct: '1', hint: 'x⁰ — это как 5⁰: всегда 1.', ok: 'x⁰ = 1' },
    { prompt: 'Сложим два нуля в степени', fig: <span className="inline-flex items-center gap-2"><Pow base="5" exp="0" /><span style={{ color: MUTED }}>+</span><Pow base="5" exp="0" /></span>, options: [2, 10, 0, 1], correct: 2, hint: '5⁰ = 1, значит 1 + 1.', ok: '1 + 1 = 2' },
    { prompt: 'Ловушка! Умножение', fig: <span className="inline-flex items-center gap-2"><Pow base="5" exp="0" /><span style={{ color: MUTED }}>·</span><Pow base="5" exp="3" /></span>, options: ['5⁰', '5³', '0', '1'], correct: '5³', hint: 'Складываем показатели: 0 + 3. Или 1 · 5³.', ok: '5⁰ · 5³ = 1 · 5³ = 5³' },
])
const NegGameScene = makeQuizRounds('Лифт 🛗', B_COLOR, [
    { prompt: 'Минус — едем ВНИЗ дроби', fig: <Pow base="2" exp="−3" />, options: ['1/2³', '−2³', '2³', '−8'], correct: '1/2³', hint: 'Минус в показателе отправляет 2³ вниз дроби.', ok: '2⁻³ = 1/2³ = 1/8', frac: true },
    { prompt: 'Подними обратно наверх', fig: <FracTxt v="1/7²" />, options: ['7²', '7⁻²', '−7²', '−14'], correct: '7⁻²', hint: 'Снизу наверх — показатель становится с минусом.', ok: '1/7² = 7⁻²' },
    { prompt: 'Сколько это числом?', fig: <Pow base="10" exp="−2" />, options: ['−100', '0,01', '−20', '0,1'], correct: '0,01', hint: '10⁻² = 1/10² = 1/100.', ok: '1/100 = 0,01' },
    { prompt: 'Минус внизу — едет НАВЕРХ', fig: <span className="inline-flex flex-col items-center leading-none"><span>1</span><span className="h-[3px] w-full my-1 rounded-full bg-current" /><Pow base="5" exp="−2" /></span>, options: ['5²', '5⁻²', '1/5²', '−25'], correct: '5²', hint: 'Из знаменателя с минусом число поднимается наверх с плюсом.', ok: '1/5⁻² = 5²', frac: true },
], 'Следующий этаж')

// ===== Тренировка =====
// left — выражение слева от «=», ответ — показатель степени base^ans.
type Trial = { left: React.ReactNode; base: string; ans: number; options: number[]; hint: string }
const M = ({ children }: { children: React.ReactNode }) => <span className="font-black" style={{ color: MUTED }}>{children}</span>
const TRIALS_BASIC: Trial[] = [
    { left: <><Pow base="3" exp="2" /><M>·</M><Pow base="3" exp="5" /></>, base: '3', ans: 7, options: [7, 10, 3, 5], hint: 'Складываем показатели: 2 + 5.' },
    { left: <><Pow base="10" exp="3" /><M>·</M><Pow base="10" exp="3" /></>, base: '10', ans: 6, options: [9, 6, 3, 100], hint: '3 + 3, а не 3 · 3.' },
    // 2⁴ · 2: у одиночной двойки показатель 1
    { left: <><Pow base="2" exp="4" /><M>·</M><span className="font-black">2</span></>, base: '2', ans: 5, options: [4, 8, 5, 6], hint: 'Одна двойка — это 2¹. Значит 4 + 1.' },
    { left: <><Pow base="a" exp="5" /><M>·</M><Pow base="a" exp="7" /></>, base: 'a', ans: 12, options: [35, 12, 2, 13], hint: '5 + 7 — складываем, не умножаем.' },
]
const TRIALS_POWPOW: Trial[] = [
    { left: <PowPow base="2" inner="3" outer="4" />, base: '2', ans: 12, options: [7, 12, 64, 81], hint: 'Степень в степени — перемножаем: 3 · 4.' },
    { left: <><Pow base="7" exp="9" /><M>:</M><Pow base="7" exp="4" /></>, base: '7', ans: 5, options: [13, 5, 36, 2], hint: 'Делим — вычитаем: 9 − 4.' },
    { left: <PowPow base="a" inner="5" outer="2" />, base: 'a', ans: 10, options: [7, 10, 25, 3], hint: '5 · 2 = 10.' },
    // 3⁸ : 3⁷ = 3¹ — показатель 1
    { left: <><Pow base="3" exp="8" /><M>:</M><Pow base="3" exp="7" /></>, base: '3', ans: 1, options: [1, 15, 0, 2], hint: '8 − 7 = 1. А 3¹ = 3.' },
    { left: <><PowPow base="10" inner="2" outer="3" /><M>·</M><span className="font-black">10</span></>, base: '10', ans: 7, options: [7, 6, 9, 12], hint: 'Сначала (10²)³ = 10⁶, потом · 10¹: 6 + 1.' },
]

const TRIALS_ZERONEG: Trial[] = [
    { left: <><Pow base="3" exp="4" /><M>:</M><Pow base="3" exp="4" /></>, base: '3', ans: 0, options: [0, 1, 8, 16], hint: '4 − 4 = 0. А 3⁰ = 1.' },
    { left: <><Pow base="2" exp="3" /><M>:</M><Pow base="2" exp="7" /></>, base: '2', ans: -4, options: [4, -4, 10, -10], hint: 'Вычитаем: 3 − 7.' },
    { left: <PowPow base="5" inner="−2" outer="3" />, base: '5', ans: -6, options: [-6, 1, 6, -5], hint: 'Степень в степени — перемножаем: −2 · 3.' },
    { left: <><Pow base="7" exp="−3" /><M>·</M><Pow base="7" exp="5" /></>, base: '7', ans: 2, options: [2, -8, 8, -2], hint: 'Складываем: −3 + 5.' },
    { left: <><Pow base="10" exp="0" /><M>·</M><Pow base="10" exp="−2" /></>, base: '10', ans: -2, options: [-2, 0, 2, -20], hint: '0 + (−2).' },
]

type LessonCfg = { scenes: React.ComponentType<SceneProps>[]; labels: string[]; next: string[]; trials: Trial[] }
const LESSONS: Record<'basic' | 'powpow' | 'zeroneg', LessonCfg> = {
    basic: {
        scenes: [WhatIsPowerScene, CollectorScene, ProductScene],
        labels: ['Что такое 2³', 'Собиралки', '5² · 5⁴'],
        next: ['Ага, двойка 3 раза!', 'Я машина степеней', 'Складываем, понял!'],
        trials: TRIALS_BASIC,
    },
    powpow: {
        scenes: [PowerOfPowerScene, BlockGameScene, CutScene],
        labels: ['(5²)⁴', 'Блокостройка', 'Сокращалка 5⁵ : 5²'],
        next: ['Перемножаем, понял!', 'Блоки — изи', 'Делим — вычитаем!'],
        trials: TRIALS_POWPOW,
    },
    zeroneg: {
        scenes: [ZeroCutScene, ZeroGameScene, NegCutScene, NegGameScene],
        labels: ['5² : 5² = 5⁰', 'Нулевик', '5² : 5⁵ = 5⁻³', 'Лифт'],
        next: ['В нулевой степени — всегда 1!', 'Ноль не страшен', 'Минус — вниз!', 'Лифт освоен'],
        trials: TRIALS_ZERONEG,
    },
}
export const powLessonKey = (q: string): keyof typeof LESSONS => /^Степень в степени/i.test(q) ? 'powpow' : /^Нулевая/i.test(q) ? 'zeroneg' : 'basic'

export const TypePowWalk = ({ question, onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    // Урок выбирается по тексту задания: «Степень в степени…» — второй урок юнита.
    const cfg = LESSONS[powLessonKey(question.question)]
    const SCENES = cfg.scenes, SCENE_MAP_LABELS = cfg.labels, NEXT_LABELS = cfg.next, TRIALS = cfg.trials
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [typed, setTyped] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    const registerCombo = useWalkthroughCombo()
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, phase === 'intro' ? stepReady : checked)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (step + 1 >= SCENES.length) { setPhase('practice'); return }
            setStep((s) => s + 1)
            setStepReady(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        bumpNonce(`step-${step - 1}`)
        setStep(step - 1)
        setStepReady(false)
    }

    const trial = TRIALS[trialIndex]
    const answer = (v: number) => {
        if (checked || wrongTried.includes(v)) return
        if (v === trial.ans) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongFlash(null); setChecked(true); setTrialNextLabel(pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, v])
            setWrongFlash(`${pickWrongTryPhrase()} ${trial.hint}`)
        }
    }
    const nextTrial = () => {
        if (advancing) return
        if (trialIndex + 1 >= TRIALS.length) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            setTrialIndex((i) => i + 1); setChecked(false); setTyped(false); setWrongTried([]); setWrongFlash(null)
        }, 300)
    }

    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setTyped(false); setWrongTried([]); setWrongFlash(null)
        if (key.startsWith('step-')) {
            const i = Number(key.slice(5))
            bumpNonce(key)
            setPhase('intro'); setStartStep(i); setStep(i); setStepReady(false)
            return
        }
        setStartStep(SCENES.length); setStep(SCENES.length - 1)
        setTrialIndex(Number(key.slice(6))); setPhase('practice')
    }
    const mapEntries: AdminMapEntry[] = [
        ...SCENE_MAP_LABELS.map((label, i) => ({ dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR })),
        ...TRIALS.map((_, i) => ({ dotKey: `t${i}`, label: `Задание ${i + 1}/${TRIALS.length}`, jumpKey: `trial-${i}`, isActive: phase === 'practice' && trialIndex === i, color: MAP_PRACTICE_COLOR })),
    ]

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <Scene onSettled={() => i === step && setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}

                {phase === 'practice' && (
                    <SceneWrapper key={`trial-${trialIndex}`} innerRef={sceneRef(`trial-${trialIndex}`)} active={isActive(`trial-${trialIndex}`)}>
                        <div className="w-full flex items-center gap-3" aria-hidden>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                            <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                        </div>
                        <div className="relative w-full flex items-center justify-center min-h-9">
                            <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                style={{ borderColor: hexToRgba(EXP_COLOR, 0.55), backgroundColor: hexToRgba(EXP_COLOR, 0.16), color: EXP_COLOR }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <p className="text-base md:text-lg font-bold text-[#F2F7FB] text-center px-16">
                                <Typewriter key={`q-${trialIndex}`} text="Какой будет показатель?" onDone={() => setTyped(true)} />
                            </p>
                        </div>
                        <motion.div key={`f-${trialIndex}`} className="w-full flex flex-wrap items-center justify-center gap-2 md:gap-3 text-4xl md:text-6xl py-2" {...popIn}>
                            {trial.left}
                            <span className="font-black" style={{ color: MUTED }}>=</span>
                            <Pow base={trial.base} exp={checked ? <motion.span key="ans" className="inline-block" style={{ color: OK_COLOR }} {...popIn}>{ExpTxt(trial.ans)}</motion.span> : '?'} />
                        </motion.div>
                        {!checked && typed && (
                            <div key={`opts-${trialIndex}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                {trial.options.map((v) => {
                                    const isWrong = wrongTried.includes(v)
                                    return (
                                        <button key={v} type="button" disabled={isWrong} onClick={() => answer(v)}
                                            className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                            {ExpTxt(v)}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {!checked && wrongFlash && <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.13), color: WRONG_COLOR }}>{wrongFlash}</div>}
                        {checked && (
                            <FieryFeedbackBanner>
                                {CORRECT_FEEDBACK_PHRASES[(trialIndex + 3) % CORRECT_FEEDBACK_PHRASES.length]}
                            </FieryFeedbackBanner>
                        )}
                        {checked && <LocalAnswerConfetti />}
                    </SceneWrapper>
                )}
            </div>
            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {NEXT_LABELS[step]}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex">
                    <button type="button" onClick={nextTrial} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= TRIALS.length ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
