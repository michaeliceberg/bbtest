'use client'

// «Алгебра» → «Пропорция» → «Жонглируем буквами» (PROPWALK). Учим выражать одну переменную через другие.
// Главная механика — «этажи»: у каждой стороны равенства верхний этаж (числитель) и нижний (знаменатель).
// Кликнул на букву — она перелетает через «=» по диагонали и МЕНЯЕТ ЭТАЖ (верх → низ, низ → верх).
// Опустел верхний этаж — там остаётся 1; опустел нижний — дробь исчезает.
// Сцены: два этажа → свободная игра ab/cd = ef/kt → ЗАПОМНИ → «пустой этаж = 1» → «дробь исчезла» (ac = b, и это нормально,
// что b справа) → «вырази a» в a/b = c/d → тренировка «вырази букву» от простого к сложному (в т.ч. v = s/t, ρ = m/V, S = ah/2).
// Затем «Проверим себя» — 5 заданий «чему равно …?» с выбором ответа.
// Цвета букв — палитра ggege без оранжевого; числа — серые.

import { Fragment, useEffect, useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { QuestionType } from './page'
import {
    DiagramBlock, glassStickerStyle,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, RememberPlate, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner,
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

const OK_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'
const TEXT = '#F2F7FB'
const MUTED = '#9AA7B0'
const NUM_COLOR = '#C9D3D9'
const ACCENT = GGEGE_PALETTE.purple.button

// ===== Модель: равенство из двух дробей =====
type Tok = { id: string; v: string }
type Side = { num: Tok[]; den: Tok[] }
type Eq = { L: Side; R: Side }
type SideKey = 'L' | 'R'
type Floor = 'num' | 'den'

// 'a b / c d = e f / k t' — буквы через пробел, «/» — черта, «=» — равно
const parseEq = (s: string): Eq => {
    const counts: Record<string, number> = {}
    const toks = (part: string) => part.trim().split(/\s+/).filter(Boolean).map((v) => {
        counts[v] = (counts[v] ?? 0) + 1
        return { id: `${v}${counts[v]}`, v }
    })
    const side = (part: string): Side => {
        const [n, d = ''] = part.split('/')
        return { num: toks(n), den: toks(d) }
    }
    const [l, r] = s.split('=')
    return { L: side(l), R: side(r) }
}

// Перелёт: с этой стороны — на другую, этаж меняется
const moveTok = (eq: Eq, from: SideKey, floor: Floor, id: string): Eq => {
    const to: SideKey = from === 'L' ? 'R' : 'L'
    const toFloor: Floor = floor === 'num' ? 'den' : 'num'
    const tok = eq[from][floor].find((t) => t.id === id)
    if (!tok) return eq
    const next: Eq = { L: { num: [...eq.L.num], den: [...eq.L.den] }, R: { num: [...eq.R.num], den: [...eq.R.den] } }
    next[from][floor] = next[from][floor].filter((t) => t.id !== id)
    next[to][toFloor] = [...next[to][toFloor], tok]
    return next
}

// Буква «выражена»: одна на верхнем этаже своей стороны, без знаменателя, и больше её нигде нет
const isIsolated = (eq: Eq, target: string) => {
    for (const k of ['L', 'R'] as SideKey[]) {
        const s = eq[k], o = eq[k === 'L' ? 'R' : 'L']
        if (s.num.length === 1 && s.num[0].v === target && s.den.length === 0 && ![...o.num, ...o.den].some((t) => t.v === target)) return true
    }
    return false
}

const LETTER_COLORS = [GGEGE_PALETTE.teal.button, GGEGE_PALETTE.blue.button, GGEGE_PALETTE.purple.button, GGEGE_PALETTE.raspberry.button, GGEGE_PALETTE.green.button]
const colorOf = (v: string) => /^\d+$/.test(v) ? NUM_COLOR : LETTER_COLORS[[...v].reduce((s, c) => s + c.charCodeAt(0), 0) % LETTER_COLORS.length]

// ===== Отрисовка =====
const flight = { type: 'spring' as const, stiffness: 240, damping: 15 }

const TokChip = ({ tok, tappable, dim, glow, onTap }: { tok: Tok; tappable: boolean; dim: boolean; glow: boolean; onTap?: () => void }) => {
    const color = colorOf(tok.v)
    return (
        <motion.button
            type="button"
            layoutId={tok.id}
            layout
            transition={{ layout: flight }}
            disabled={!tappable}
            onClick={onTap}
            className={cn('inline-flex items-center justify-center min-w-[42px] h-[46px] md:min-w-[50px] md:h-[54px] px-2 rounded-xl border-2 font-black text-2xl md:text-3xl select-none',
                tappable ? 'cursor-pointer' : 'cursor-default')}
            style={{
                ...glassStickerStyle(color),
                opacity: dim ? 0.3 : 1,
                boxShadow: glow ? `0 0 16px 2px ${hexToRgba(color, 0.75)}` : undefined,
                transition: 'opacity 0.35s, box-shadow 0.35s',
            }}
        >
            {tok.v}
        </motion.button>
    )
}

const OneChip = ({ k }: { k: string }) => (
    <motion.span key={k} layout className="inline-flex items-center justify-center min-w-[42px] h-[46px] md:min-w-[50px] md:h-[54px] font-black text-3xl md:text-4xl"
        style={{ color: MUTED }}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 12, delay: 0.25 }}>
        1
    </motion.span>
)

type BoardOpts = {
    tapLetters?: string[] | null   // кликать можно только эти (null — любые)
    interactive: boolean
    glowFloor?: Floor | null       // подсветить этаж, остальное приглушить
    glowLetters?: string[]
    onTap?: (side: SideKey, floor: Floor, id: string) => void
}

const SideView = ({ side, k, o }: { side: Side; k: SideKey; o: BoardOpts }) => {
    const chip = (t: Tok, floor: Floor) => {
        const can = o.interactive && (!o.tapLetters || o.tapLetters.includes(t.v))
        const dim = (o.glowFloor && o.glowFloor !== floor) || (o.interactive && !!o.tapLetters && !o.tapLetters.includes(t.v)) || (!!o.glowLetters && !o.glowLetters.includes(t.v))
        const glow = (o.glowFloor === floor) || (!!o.glowLetters && o.glowLetters.includes(t.v))
        return <TokChip key={t.id} tok={t} tappable={can} dim={!!dim} glow={glow} onTap={() => o.onTap?.(k, floor, t.id)} />
    }
    // Числа — впереди букв: пишем «2S», а не «S2»
    const row = (toks: Tok[], floor: Floor) => toks.length
        ? [...toks].sort((x, y) => Number(!/^\d+$/.test(x.v)) - Number(!/^\d+$/.test(y.v))).map((t) => chip(t, floor))
        : <OneChip k={`one-${k}-${floor}`} />
    if (side.den.length === 0) {
        return <motion.div layout transition={flight} className="flex items-center gap-1">{row(side.num, 'num')}</motion.div>
    }
    return (
        <motion.div layout transition={flight} className="inline-flex flex-col items-stretch">
            <motion.div layout transition={flight} className="flex items-center justify-center gap-1 pb-1.5">{row(side.num, 'num')}</motion.div>
            <motion.div layout transition={flight} className="h-[3px] rounded-full bg-[#F2F7FB] min-w-[52px]" />
            <motion.div layout transition={flight} className="flex items-center justify-center gap-1 pt-1.5">{row(side.den, 'den')}</motion.div>
        </motion.div>
    )
}

const Board = ({ eq, groupId, ...o }: BoardOpts & { eq: Eq; groupId: string }) => (
    <LayoutGroup id={groupId}>
        <motion.div layout className="flex items-center justify-center gap-3 md:gap-4 py-2">
            <SideView side={eq.L} k="L" o={o} />
            <motion.span layout transition={flight} className="font-black text-3xl md:text-4xl" style={{ color: MUTED }}>=</motion.span>
            <SideView side={eq.R} k="R" o={o} />
        </motion.div>
    </LayoutGroup>
)

// Неинтерактивная запись «b c / d» — для вариантов ответа
const PlainFrac = ({ s, className }: { s: string; className?: string }) => {
    const [n, d] = s.split('/')
    const T = ({ p }: { p: string }) => (
        <span className="inline-flex items-center gap-[0.08em]">
            {p.trim().split(/\s+/).map((v, i) => <span key={i} style={{ color: colorOf(v) }}>{v}</span>)}
        </span>
    )
    if (!d) return <span className={cn('font-black', className)}><T p={n} /></span>
    return (
        <span className={cn('inline-flex flex-col items-center font-black leading-tight', className)}>
            <T p={n} />
            <span className="w-full h-[2px] my-0.5 rounded-full bg-[#F2F7FB]" />
            <T p={d} />
        </span>
    )
}

// ===== Мелочи сцен =====
const TLine = ({ text, onDone, readMs = 450, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-xl md:text-2xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)

const ReplyButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{children}</button>
    </motion.div>
)

const ResetButton = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-3 py-1.5 text-sm font-black text-[#9AA7B0] hover:text-[#F2F7FB]">
        <RotateCcw className="w-4 h-4" /> Вернуть как было
    </button>
)

function usePhase() {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    return { phase, go }
}

// ===== Сцена 0: два этажа =====
const FloorsScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const eq = parseEq('a / b = c / d')
    return (
        <>
            <TLine text="У каждой дроби есть два этажа." onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <Board eq={eq} groupId="floors" interactive={false} glowFloor={phase >= 4 ? 'den' : phase >= 2 ? 'num' : null} />
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine text="ВЕРХНИЙ этаж — числитель." onDone={() => setTimeout(() => go(4), 700)} />}
            {phase >= 4 && <TLine text="НИЖНИЙ этаж — знаменатель." onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 1: свободная игра ab/cd = ef/kt =====
const JUGGLE = 'a b / c d = e f / k t'
const JuggleScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [eq, setEq] = useState(() => parseEq(JUGGLE))
    const [taps, setTaps] = useState(0)
    const tap = (s: SideKey, f: Floor, id: string) => {
        setEq((e) => moveTok(e, s, f, id))
        setTaps((n) => n + 1)
    }
    useEffect(() => {
        if (taps === 1) go(2)
        if (taps >= 3) go(3)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taps])
    return (
        <>
            <TLine text="Буквы умеют прыгать через «=». Кликни на любую букву!" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-2">
                        <Board eq={eq} groupId="juggle" interactive onTap={tap} />
                        {taps > 0 && <ResetButton onClick={() => setEq(parseEq(JUGGLE))} />}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Видел? Буква перелетела на другую сторону и поменяла этаж!" />}
            {phase >= 3 && <TLine small text="Покликай ещё. Сверху улетает вниз, снизу — наверх." onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 2: правило =====
const RuleScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    useEffect(() => { const t = setTimeout(() => go(1), 600); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <>
            {phase >= 1 && (
                <motion.div className="w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <RememberPlate>
                        <div className="text-lg md:text-xl">Перепрыгнула через «=» — <span style={{ color: ACCENT }}>поменяла этаж</span></div>
                        <div className="text-base md:text-lg" style={{ color: MUTED }}>верх ↘ низ · низ ↗ верх</div>
                    </RememberPlate>
                </motion.div>
            )}
            {phase >= 1 && <TLine small text="Буква всегда летит по диагонали." onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 3: пустой этаж = 1 =====
const OneScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [eq, setEq] = useState(() => parseEq('a / b = c / d'))
    const tap = (s: SideKey, f: Floor, id: string) => { setEq((e) => moveTok(e, s, f, id)); go(3) }
    return (
        <>
            <TLine text="А что если этаж опустеет?" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <Board eq={eq} groupId="one" interactive={phase < 3} tapLetters={['a']} glowLetters={phase < 3 ? ['a'] : undefined} onTap={tap} />
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Кликни на a" />}
            {phase >= 3 && <TLine small text="Сверху никого не осталось — там стоит 1. Пустой этаж — это 1." onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 4: дробь исчезает =====
const VanishScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [eq, setEq] = useState(() => parseEq('a = b / c'))
    const tap = (s: SideKey, f: Floor, id: string) => { setEq((e) => moveTok(e, s, f, id)); go(3) }
    return (
        <>
            <TLine text="А если опустеет НИЖНИЙ этаж?" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <Board eq={eq} groupId="vanish" interactive={phase < 3} tapLetters={['c']} glowLetters={phase < 3 ? ['c'] : undefined} onTap={tap} />
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Кликни на c" />}
            {phase >= 3 && <TLine small text="Внизу никого — дробь исчезла! Получилось ac = b." onDone={() => setTimeout(() => go(4), 600)} />}
            {phase >= 4 && <TLine small text="b осталась справа? Ничего страшного: ac = b — это то же самое, что b = ac 👌" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Головоломка «вырази букву» =====
const Puzzle = ({ init, target, best, groupId, onSolved }: { init: string; target: string; best: number; groupId: string; onSolved: (moves: number) => void }) => {
    const [eq, setEq] = useState(() => parseEq(init))
    const [moves, setMoves] = useState(0)
    const [solved, setSolved] = useState(false)
    const tap = (s: SideKey, f: Floor, id: string) => {
        if (solved) return
        const next = moveTok(eq, s, f, id)
        const m = moves + 1
        setEq(next); setMoves(m)
        if (isIsolated(next, target)) {
            setSolved(true)
            showAnswerMeme(true)
            onSolved(m)
        }
    }
    const reset = () => { setEq(parseEq(init)); setMoves(0) }
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <Board eq={eq} groupId={groupId} interactive={!solved} onTap={tap} glowLetters={solved ? [target] : undefined} />
            <div className="flex items-center gap-3 text-sm font-bold" style={{ color: MUTED }}>
                <span>Ходов: <span className="tabular-nums" style={{ color: TEXT }}>{moves}</span></span>
                <span>· можно за {best}</span>
                {!solved && moves > 0 && <ResetButton onClick={reset} />}
            </div>
            {!solved && moves > best && (
                <div className="w-full text-center text-sm font-bold rounded-xl px-3 py-2" style={{ color: MUTED, backgroundColor: '#1C272C' }}>
                    Подсказка: <span style={{ color: colorOf(target) }}>{target}</span> должна остаться одна — перекидывай её соседей на другую сторону.
                </div>
            )}
        </div>
    )
}

// ===== Сцена 5: вырази a =====
const ExpressScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="Теперь сам! Вырази a — сделай так, чтобы a осталась одна." onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <Puzzle init="a / b = c / d" target="a" best={1} groupId="express" onSolved={() => go(2)} />
                </DiagramBlock>
            )}
            {phase >= 2 && <FieryFeedbackBanner>Есть! Мы выразили a.</FieryFeedbackBanner>}
            {phase >= 2 && <TLine small text="Хватило одного клика: b перелетела наверх справа." onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 6: тренировка «вырази букву» от простого к сложному =====
type Round = { init: string; target: string; best: number; title?: string; after?: string }
const ROUNDS: Round[] = [
    { init: 'a b = c', target: 'b', best: 1 },
    { init: 'a = b c', target: 'c', best: 1 },
    { init: 'a / b = c', target: 'a', best: 1 },
    { init: 'a = b / c', target: 'c', best: 2, after: 'Два хода: сначала c наверх, потом a вниз.' },
    { init: 'a / b = c / d', target: 'd', best: 3, after: 'd = bc / a — понадобилось три прыжка.' },
    { init: 'v = s / t', target: 't', best: 2, title: 'Скорость', after: 't = s / v — время = путь : скорость.' },
    { init: 'ρ = m / V', target: 'V', best: 2, title: 'Плотность' },
    { init: 'S = a h / 2', target: 'h', best: 2, title: 'Площадь треугольника', after: 'h = 2S / a. Двойка — тоже «буква», она прыгает так же.' },
]
const RoundsScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [ri, setRi] = useState(0)
    const [solvedIdx, setSolvedIdx] = useState<number | null>(null)
    const r = ROUNDS[ri]
    const last = ri + 1 >= ROUNDS.length
    return (
        <>
            <TLine text="Тренировка: вырази букву 🎯" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div key={ri} className="w-full flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-black">
                            <span className="px-2.5 h-7 inline-flex items-center rounded-full border-2 tabular-nums"
                                style={{ borderColor: hexToRgba(ACCENT, 0.55), backgroundColor: hexToRgba(ACCENT, 0.16), color: ACCENT }}>
                                {ri + 1}/{ROUNDS.length}
                            </span>
                            {r.title && <span style={{ color: MUTED }}>{r.title}</span>}
                        </div>
                        <div className="text-xl md:text-2xl font-black text-[#F2F7FB]">
                            Вырази <span style={{ color: colorOf(r.target) }}>{r.target}</span>
                        </div>
                        <Puzzle init={r.init} target={r.target} best={r.best} groupId={`round-${ri}`} onSolved={() => setSolvedIdx(ri)} />
                        {solvedIdx === ri && (
                            <>
                                <FieryFeedbackBanner>{r.after ?? CORRECT_FEEDBACK_PHRASES[ri % CORRECT_FEEDBACK_PHRASES.length]}</FieryFeedbackBanner>
                                {last
                                    ? <SettleOnMount onSettled={onSettled} />
                                    : <ReplyButton onClick={() => setRi((i) => i + 1)}>Следующая →</ReplyButton>}
                            </>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}
const SettleOnMount = ({ onSettled }: SceneProps) => {
    useEffect(() => { const t = setTimeout(() => onSettled?.(), 500); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return null
}

const SCENES = [FloorsScene, JuggleScene, RuleScene, OneScene, VanishScene, ExpressScene, RoundsScene]
const SCENE_MAP_LABELS = ['Два этажа', 'Жонглирование', 'ЗАПОМНИ', 'Пустой этаж = 1', 'Дробь исчезла', 'Вырази a', 'Тренировка']
const NEXT_LABELS = ['Понял, два этажа', 'Буквы прыгают!', 'Меняем этаж!', 'Пустой этаж — это 1', 'Дробь исчезла!', 'Я выразил a', 'Я жонглёр 🤹']

// ===== Проверим себя =====
type Trial = { eq: string; target: string; options: string[]; correct: number; hint: string }
const TRIALS: Trial[] = [
    { eq: 'a / b = c / d', target: 'a', options: ['b c / d', 'b d / c', 'c d / b', 'd / b c'], correct: 0, hint: 'Перекинь b наверх вправо.' },
    { eq: 'a b = c', target: 'b', options: ['a c', 'c / a', 'a / c', 'c'], correct: 1, hint: 'a уходит вправо вниз.' },
    { eq: 'x = y / z', target: 'z', options: ['x y', 'x / y', 'y / x', 'y'], correct: 2, hint: 'z наверх влево, потом x вниз вправо.' },
    { eq: 'v = s / t', target: 's', options: ['v / t', 'v t', 't / v', 's v'], correct: 1, hint: 't уходит наверх влево.' },
    { eq: 'S = a h / 2', target: 'a', options: ['S h / 2', '2 h / S', '2 S / h', 'S / 2 h'], correct: 2, hint: '2 — наверх влево, h — вниз влево.' },
]

export const TypePropWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
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
    const answer = (i: number) => {
        if (checked || wrongTried.includes(i)) return
        if (i === trial.correct) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongFlash(null); setChecked(true); setTrialNextLabel(pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, i])
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
                                style={{ borderColor: hexToRgba(ACCENT, 0.55), backgroundColor: hexToRgba(ACCENT, 0.16), color: ACCENT }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <p className="text-base md:text-lg font-bold text-[#F2F7FB] text-center px-16">
                                <Typewriter key={`q-${trialIndex}`} text={`Чему равно ${trial.target}?`} onDone={() => setTyped(true)} />
                            </p>
                        </div>
                        <Board eq={parseEq(trial.eq)} groupId={`trial-${trialIndex}`} interactive={false} />
                        {checked && (
                            <motion.div className="w-full flex items-center justify-center gap-3 text-3xl md:text-4xl"
                                initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}>
                                <span className="font-black" style={{ color: colorOf(trial.target) }}>{trial.target}</span>
                                <span className="font-black" style={{ color: MUTED }}>=</span>
                                <PlainFrac s={trial.options[trial.correct]} />
                            </motion.div>
                        )}
                        {!checked && typed && (
                            <div key={`opts-${trialIndex}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                {trial.options.map((opt, i) => {
                                    const isWrong = wrongTried.includes(i)
                                    return (
                                        <button key={i} type="button" disabled={isWrong} onClick={() => answer(i)}
                                            className={cn('min-h-[76px] rounded-xl border-2 border-b-4 text-2xl transition-colors flex items-center justify-center',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] opacity-60' : 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]')}>
                                            <PlainFrac s={opt} />
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
