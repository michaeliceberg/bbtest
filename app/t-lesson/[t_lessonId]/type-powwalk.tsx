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
    AdminSceneMap, MAP_INTRO_COLOR, RememberPlate, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
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
const Pow = ({ base, exp, className }: { base: React.ReactNode; exp: React.ReactNode; className?: string }) => (
    <span className={cn('inline-flex items-start font-black', className)} style={{ color: TEXT }}>
        <span>{base}</span>
        <span className="text-[0.55em] leading-none -mt-[0.05em] ml-[0.04em]" style={{ color: EXP_COLOR }}>{exp}</span>
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
                    <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(OK_COLOR, 0.15), color: OK_COLOR }}>
                        {CORRECT_FEEDBACK_PHRASES[ri % CORRECT_FEEDBACK_PHRASES.length]} {r.kind === 'build' ? `${r.base}${sup(r.exp)} — это ${r.exp} ${BASE_WORD[r.base]}` : `${r.base}${sup(r.n)}`}
                    </div>
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

// ===== Тренировка: aᵐ · aⁿ = a^? =====
type Trial = { a: string; m: number; n: number | null; options: number[]; hint: string }
const TRIALS: Trial[] = [
    { a: '3', m: 2, n: 5, options: [7, 10, 3, 5], hint: 'Складываем показатели: 2 + 5.' },
    { a: '10', m: 3, n: 3, options: [9, 6, 3, 100], hint: '3 + 3, а не 3 · 3.' },
    // 2⁴ · 2: у одиночной двойки показатель 1
    { a: '2', m: 4, n: null, options: [4, 8, 5, 6], hint: 'Одна двойка — это 2¹. Значит 4 + 1.' },
    { a: 'a', m: 5, n: 7, options: [35, 12, 2, 13], hint: '5 + 7 — складываем, не умножаем.' },
]
const answerOf = (t: Trial) => t.m + (t.n ?? 1)

const SCENES = [WhatIsPowerScene, CollectorScene, ProductScene]
const SCENE_MAP_LABELS = ['Что такое 2³', 'Собиралки', '5² · 5⁴']
const NEXT_LABELS = ['Ага, двойка 3 раза!', 'Я машина степеней', 'Складываем, понял!']

export const TypePowWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
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
        if (v === answerOf(trial)) {
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
                        <motion.div key={`f-${trialIndex}`} className="w-full flex items-center justify-center gap-3 text-5xl md:text-6xl py-2" {...popIn}>
                            <Pow base={trial.a} exp={trial.m} />
                            <span className="font-black" style={{ color: MUTED }}>·</span>
                            {trial.n === null ? <span className="font-black" style={{ color: TEXT }}>{trial.a}</span> : <Pow base={trial.a} exp={trial.n} />}
                            <span className="font-black" style={{ color: MUTED }}>=</span>
                            <Pow base={trial.a} exp={checked ? <motion.span key="ans" className="inline-block" style={{ color: OK_COLOR }} {...popIn}>{answerOf(trial)}</motion.span> : '?'} />
                        </motion.div>
                        {!checked && typed && (
                            <div key={`opts-${trialIndex}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                {trial.options.map((v) => {
                                    const isWrong = wrongTried.includes(v)
                                    return (
                                        <button key={v} type="button" disabled={isWrong} onClick={() => answer(v)}
                                            className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                            {v}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {!checked && wrongFlash && <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.13), color: WRONG_COLOR }}>{wrongFlash}</div>}
                        {checked && (
                            <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(OK_COLOR, 0.15), color: OK_COLOR }}>
                                {CORRECT_FEEDBACK_PHRASES[(trialIndex + 3) % CORRECT_FEEDBACK_PHRASES.length]}
                            </div>
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
