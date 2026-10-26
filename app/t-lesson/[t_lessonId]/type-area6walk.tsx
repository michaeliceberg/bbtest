'use client'

// Планиметрия → «Треугольник» → площадь треугольника (AREA6WALK). Три урока на одном движке, урок выбирается
// по тексту задания (см. lessonKeyOf):
//   «Площадь: основание и высота» — S = ½·a·h: половина прямоугольника, где a и где h (в т.ч. в прямоугольном и
//     тупоугольном), собери формулу из кнопок, посчитай.
//   «Площадь: синус и Герон» — S = ½·a·b·sin γ (угол МЕЖДУ сторонами) и Герон (сначала p, потом что под корнем).
//   «Площадь: окружности и Пик» — S = p·r, S = abc/4R, Пик, в конце шпаргалка всех 6 формул.
// Каждая сцена — список шагов (Part): рисунок, печатная фраза, карточка формулы, мини-игры
// «нажми на …» (tap), «собери формулу» (build), «посчитай» (choice). Ошибки в мини-играх не идут в зачёт урока;
// в зачёт — только тренировка в конце («пробуй, пока не угадаешь»).

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    walkthroughButtonClass, walkthroughButtonStyle, RememberPlate,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner } from '@/components/geometry/WalkthroughLog'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const LINE = '#F2F7FB'
const NEUTRAL = '#8FA3AE'
const A_COL = GGEGE_PALETTE.teal.button     // основание a
const B_COL = GGEGE_PALETTE.green.button    // сторона b
const H_COL = GGEGE_PALETTE.purple.button   // высота / то, что ищем
const ANG_COL = GGEGE_PALETTE.blue.button   // угол
const CIR_COL = GGEGE_PALETTE.raspberry.button
const OK = '#A1D151'
const BAD = '#DC605B'
const PIECE = [GGEGE_PALETTE.blue.button, GGEGE_PALETTE.raspberry.button, GGEGE_PALETTE.green.button]

// ===== Геометрия =====
type Pt = { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y })
const mid = (p: Pt, q: Pt): Pt => P((p.x + q.x) / 2, (p.y + q.y) / 2)
const unit = (p: Pt, q: Pt): Pt => { const l = Math.hypot(q.x - p.x, q.y - p.y); return P((q.x - p.x) / l, (q.y - p.y) / l) }
const foot = (o: Pt, a: Pt, b: Pt): Pt => {
    const dx = b.x - a.x, dy = b.y - a.y
    const t = ((o.x - a.x) * dx + (o.y - a.y) * dy) / (dx * dx + dy * dy)
    return P(a.x + dx * t, a.y + dy * t)
}

// ===== Элементы рисунка =====
type El =
    | { k: 'seg'; id?: string; p: Pt; q: Pt; c?: string; w?: number; dash?: boolean; draw?: boolean }
    | { k: 'poly'; pts: Pt[]; fill?: string; stroke?: string; fade?: boolean }
    | { k: 'right'; at: Pt; to1: Pt; to2: Pt; c?: string }
    | { k: 'arc'; id?: string; at: Pt; a: Pt; b: Pt; c: string; r?: number }
    | { k: 'circle'; id?: string; o: Pt; r: number; c: string; draw?: boolean }
    | { k: 'dot'; id?: string; p: Pt; c: string; r?: number; pop?: boolean }
    | { k: 'txt'; p: Pt; t: string; c?: string; s?: number; pop?: boolean; italic?: boolean }
    | { k: 'grid'; o: Pt; cell: number; nx: number; ny: number }

type Flash = Record<string, 'ok' | 'bad'>
const tint = (id: string | undefined, base: string, flash?: Flash) =>
    id && flash?.[id] === 'ok' ? OK : id && flash?.[id] === 'bad' ? BAD : base

const Txt = ({ p, t, c = LINE, s = 18, italic }: { p: Pt; t: string; c?: string; s?: number; italic?: boolean }) => (
    <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill={c} fontSize={s} fontWeight={900}
        fontStyle={italic ? 'italic' : undefined}
        style={{ fontFamily: 'var(--font-nunito), sans-serif', paintOrder: 'stroke', stroke: '#131D22', strokeWidth: 4, pointerEvents: 'none' }}>{t}</text>
)
// Позиция — на статичном <g>: framer у motion-узла перезаписывает transform.
const Pop = ({ p, children }: { p: Pt; children: React.ReactNode }) => (
    <g transform={`translate(${p.x} ${p.y})`} style={{ pointerEvents: 'none' }}>
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 11 }}>
            {children}
        </motion.g>
    </g>
)
const arcPath = (at: Pt, a: Pt, b: Pt, r: number) => {
    const u = unit(at, a), v = unit(at, b)
    const s = P(at.x + u.x * r, at.y + u.y * r), e = P(at.x + v.x * r, at.y + v.y * r)
    const sweep = u.x * v.y - u.y * v.x > 0 ? 1 : 0
    return `M ${at.x} ${at.y} L ${s.x} ${s.y} A ${r} ${r} 0 0 ${sweep} ${e.x} ${e.y} Z`
}
const arcHit = (at: Pt, a: Pt, b: Pt) => {
    const u = unit(at, a), v = unit(at, b)
    const bx = u.x + v.x, by = u.y + v.y, l = Math.hypot(bx, by) || 1
    return P(at.x + (bx / l) * 26, at.y + (by / l) * 26)
}

const Fig = ({ els, onTap, flash }: { els: El[]; onTap?: (id: string) => void; flash?: Flash }) => (
    <svg viewBox="0 0 310 252" className="w-full max-w-[330px] overflow-visible select-none">
        {els.map((e, i) => {
            switch (e.k) {
                case 'grid': return (
                    <g key={i}>
                        {Array.from({ length: e.nx + 1 }, (_, j) => <line key={`v${j}`} x1={e.o.x + j * e.cell} y1={e.o.y} x2={e.o.x + j * e.cell} y2={e.o.y - e.ny * e.cell} stroke="#2A363C" strokeWidth={1.5} />)}
                        {Array.from({ length: e.ny + 1 }, (_, j) => <line key={`h${j}`} x1={e.o.x} y1={e.o.y - j * e.cell} x2={e.o.x + e.nx * e.cell} y2={e.o.y - j * e.cell} stroke="#2A363C" strokeWidth={1.5} />)}
                    </g>
                )
                case 'poly': return (
                    <motion.polygon key={i} points={e.pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}
                        fill={e.fill ?? 'none'} stroke={e.stroke} strokeWidth={e.stroke ? 4 : 0} strokeLinejoin="round"
                        initial={e.fade ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ pointerEvents: 'none' }} />
                )
                case 'seg': return (
                    <motion.line key={i} x1={e.p.x} y1={e.p.y} stroke={tint(e.id, e.c ?? LINE, flash)} strokeWidth={e.w ?? 4}
                        strokeLinecap="round" strokeDasharray={e.dash ? '7 6' : undefined}
                        initial={e.draw ? { x2: e.p.x, y2: e.p.y } : { x2: e.q.x, y2: e.q.y }} animate={{ x2: e.q.x, y2: e.q.y }}
                        transition={{ duration: e.draw ? 0.7 : 0, ease: 'easeOut' }} style={{ pointerEvents: 'none' }} />
                )
                case 'right': {
                    const u = unit(e.at, e.to1), v = unit(e.at, e.to2), s = 12
                    return <path key={i} d={`M ${e.at.x + u.x * s} ${e.at.y + u.y * s} L ${e.at.x + (u.x + v.x) * s} ${e.at.y + (u.y + v.y) * s} L ${e.at.x + v.x * s} ${e.at.y + v.y * s}`}
                        fill="none" stroke={e.c ?? LINE} strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
                }
                case 'arc': {
                    const c = tint(e.id, e.c, flash)
                    return <path key={i} d={arcPath(e.at, e.a, e.b, e.r ?? 28)} fill={hexToRgba(c, 0.35)} stroke={c} strokeWidth={3} style={{ pointerEvents: 'none' }} />
                }
                case 'circle': return (
                    <motion.circle key={i} cx={e.o.x} cy={e.o.y} r={e.r} fill="none" stroke={tint(e.id, e.c, flash)} strokeWidth={3}
                        initial={{ pathLength: e.draw ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ duration: e.draw ? 1.1 : 0, ease: 'easeInOut' }}
                        style={{ pointerEvents: 'none' }} />
                )
                case 'dot': return e.pop
                    ? <Pop key={i} p={e.p}><circle r={e.r ?? 6} fill={tint(e.id, e.c, flash)} /></Pop>
                    : <circle key={i} cx={e.p.x} cy={e.p.y} r={e.r ?? 6} fill={tint(e.id, e.c, flash)} style={{ pointerEvents: 'none' }} />
                case 'txt': return e.pop
                    ? <Pop key={i} p={e.p}><Txt p={P(0, 0)} t={e.t} c={e.c} s={e.s} italic={e.italic} /></Pop>
                    : <Txt key={i} p={e.p} t={e.t} c={e.c} s={e.s} italic={e.italic} />
            }
        })}
        {onTap && els.map((e, i) => {
            if (!('id' in e) || !e.id) return null
            const id = e.id
            if (e.k === 'seg') return <line key={`h${i}`} x1={e.p.x} y1={e.p.y} x2={e.q.x} y2={e.q.y} stroke="transparent" strokeWidth={26} strokeLinecap="round" style={{ cursor: 'pointer' }} onClick={() => onTap(id)} />
            if (e.k === 'arc') { const h = arcHit(e.at, e.a, e.b); return <circle key={`h${i}`} cx={h.x} cy={h.y} r={22} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onTap(id)} /> }
            if (e.k === 'circle') return <circle key={`h${i}`} cx={e.o.x} cy={e.o.y} r={e.r} fill="none" stroke="transparent" strokeWidth={24} style={{ cursor: 'pointer' }} onClick={() => onTap(id)} />
            if (e.k === 'dot') return <circle key={`h${i}`} cx={e.p.x} cy={e.p.y} r={18} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onTap(id)} />
            return null
        })}
    </svg>
)

// ===== Готовые рисунки =====
const tri = (a: Pt, b: Pt, c: Pt): El => ({ k: 'poly', pts: [a, b, c], stroke: LINE })
// Остроугольный: A сверху, основание BC.
const T1 = { A: P(110, 46), B: P(30, 220), C: P(280, 220) }
const T1H = P(110, 220)
// Прямоугольный: прямой угол в C.
const T2 = { A: P(60, 56), B: P(270, 220), C: P(60, 220) }
// Тупоугольный: высота из A падает за треугольник.
const T3 = { A: P(262, 64), B: P(30, 220), C: P(170, 220) }
const T3H = P(262, 220)
const heightAll = (A: Pt, H: Pt, base: Pt, c = H_COL, draw = false): El[] => [
    { k: 'seg', p: A, q: H, c, w: 3.5, dash: true, draw },
    { k: 'right', at: H, to1: base, to2: A, c },
]
const T1_AH: El[] = [
    tri(T1.A, T1.B, T1.C),
    { k: 'seg', p: T1.B, q: T1.C, c: A_COL, w: 6 },
    { k: 'txt', p: P(200, 240), t: 'a', c: A_COL, italic: true },
    ...heightAll(T1.A, T1H, T1.C),
    { k: 'txt', p: P(124, 150), t: 'h', c: H_COL, italic: true },
]

// Прямоугольник и его половина
const R = { TL: P(50, 60), TR: P(260, 60), BR: P(260, 210), BL: P(50, 210) }
const RECT: El[] = [
    { k: 'poly', pts: [R.TL, R.TR, R.BR, R.BL], stroke: LINE },
    { k: 'txt', p: P(155, 232), t: 'a', c: A_COL, italic: true },
    { k: 'txt', p: P(32, 135), t: 'h', c: H_COL, italic: true },
]
const RECT_CUT: El[] = [...RECT, { k: 'seg', p: R.TL, q: R.BR, c: LINE, w: 3, dash: true, draw: true }]
const RECT_HALF: El[] = [
    { k: 'poly', pts: [R.TL, R.BL, R.BR], fill: hexToRgba(A_COL, 0.35), fade: true },
    ...RECT, { k: 'seg', p: R.TL, q: R.BR, c: LINE, w: 3, dash: true },
]
// Любой треугольник — тоже половина прямоугольника (две «лишние» части равны двум кускам внутри).
const ANY_HALF: El[] = [
    { k: 'poly', pts: [T1.B, P(T1.B.x, T1.A.y), T1.A], fill: hexToRgba(H_COL, 0.18), fade: true },
    { k: 'poly', pts: [T1.C, P(T1.C.x, T1.A.y), T1.A], fill: hexToRgba(H_COL, 0.18), fade: true },
    { k: 'poly', pts: [T1.B, P(T1.B.x, T1.A.y), P(T1.C.x, T1.A.y), T1.C], stroke: H_COL },
    { k: 'poly', pts: [T1.A, T1.B, T1.C], fill: hexToRgba(A_COL, 0.3) },
    ...T1_AH,
]

// Синус: стороны a, b и угол γ при B
const S2 = { A: P(120, 60), B: P(40, 215), C: P(275, 215) }
const SIN_BASE: El[] = [
    tri(S2.A, S2.B, S2.C),
    { k: 'arc', at: S2.B, a: S2.C, b: S2.A, c: ANG_COL },
    { k: 'seg', p: S2.B, q: S2.C, c: A_COL, w: 6 },
    { k: 'seg', p: S2.B, q: S2.A, c: B_COL, w: 6 },
    { k: 'txt', p: P(165, 236), t: 'a', c: A_COL, italic: true },
    { k: 'txt', p: P(62, 128), t: 'b', c: B_COL, italic: true },
    { k: 'txt', p: P(88, 196), t: 'γ', c: ANG_COL, italic: true },
]
const SIN_H: El[] = [...SIN_BASE, ...heightAll(S2.A, P(S2.A.x, S2.B.y), S2.C, H_COL, true), { k: 'txt', p: P(170, 140), t: 'h = b · sin γ', c: H_COL, s: 16, pop: true }]
const sideTri = (A: Pt, B: Pt, C: Pt, l: [string, Pt][]): El[] => [tri(A, B, C), ...l.map(([t, p]): El => ({ k: 'txt', p, t, c: '#F2C35B', s: 17 }))]
const HERON_556 = sideTri(P(155, 70), P(50, 215), P(260, 215), [['5', P(90, 136)], ['5', P(222, 136)], ['6', P(155, 236)]])

// 13-14-15 с вписанной окружностью (r = 4), масштаб 18
const K = 18
const I3 = { B: P(28, 236), C: P(28 + 14 * K, 236), A: P(28 + 5 * K, 236 - 12 * K) }
const IC = P(28 + 6 * K, 236 - 4 * K)
const IR = 4 * K
const TB = foot(IC, I3.B, I3.C), TA = foot(IC, I3.A, I3.C), TAB = foot(IC, I3.A, I3.B)
const IN_BASE: El[] = [tri(I3.A, I3.B, I3.C), { k: 'circle', o: IC, r: IR, c: CIR_COL }, { k: 'dot', p: IC, c: CIR_COL, r: 5 }]
const IN_PIECES: El[] = [
    ...[[IC, I3.B, I3.C], [IC, I3.C, I3.A], [IC, I3.A, I3.B]].map((pts, i): El => ({ k: 'poly', pts, fill: hexToRgba(PIECE[i], 0.38), fade: true })),
    ...IN_BASE,
    { k: 'seg', p: IC, q: I3.A, w: 2 }, { k: 'seg', p: IC, q: I3.B, w: 2 }, { k: 'seg', p: IC, q: I3.C, w: 2 },
    { k: 'seg', p: IC, q: TB, c: H_COL, w: 3 }, { k: 'seg', p: IC, q: TA, c: H_COL, w: 3 }, { k: 'seg', p: IC, q: TAB, c: H_COL, w: 3 },
    { k: 'txt', p: P(IC.x + 14, (IC.y + TB.y) / 2), t: 'r', c: H_COL, italic: true },
]
// 6-8-10 с описанной окружностью (R = 5), масштаб 22
const K2 = 22
const R3 = { C: P(48, 222), A: P(48, 222 - 6 * K2), B: P(48 + 8 * K2, 222) }
const RO = mid(R3.A, R3.B)
const CIRC_BASE: El[] = [
    { k: 'circle', o: RO, r: 5 * K2, c: CIR_COL },
    tri(R3.A, R3.B, R3.C), { k: 'right', at: R3.C, to1: R3.B, to2: R3.A },
    { k: 'txt', p: P(32, 156), t: '6', c: '#F2C35B', s: 17 }, { k: 'txt', p: P(136, 240), t: '8', c: '#F2C35B', s: 17 },
    { k: 'txt', p: P(150, 125), t: '10', c: '#F2C35B', s: 17 },
    { k: 'dot', p: RO, c: CIR_COL, r: 5 },
]
// Пик: (0,0)–(6,0)–(2,4) на клетках, В = 7, Г = 12
const CELL = 38, GO = P(40, 228)
const gp = (x: number, y: number) => P(GO.x + x * CELL, GO.y - y * CELL)
const PICK_BASE: El[] = [
    { k: 'grid', o: GO, cell: CELL, nx: 6, ny: 5 },
    { k: 'poly', pts: [gp(0, 0), gp(6, 0), gp(2, 4)], fill: hexToRgba(A_COL, 0.15), stroke: LINE },
]
const INNER = [[1, 1], [2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [2, 3]]
const BORDER = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [1, 2], [2, 4], [3, 3], [4, 2], [5, 1]]
const PICK_IN: El[] = INNER.map(([x, y]): El => ({ k: 'dot', p: gp(x, y), c: ANG_COL, r: 7, pop: true }))
const PICK_BORDER: El[] = BORDER.map(([x, y]): El => ({ k: 'dot', p: gp(x, y), c: GGEGE_PALETTE.orange.button, r: 7, pop: true }))

// ===== Шаги сцены =====
type TapRound = { prompt: string; els: El[]; target: string; hints: Record<string, string>; after?: El[]; ok: string }
type ChoiceRound = { prompt: string; els?: El[]; options: string[]; correct: string; hint: string; after?: El[]; ok?: string }
type Tok = string | { s: number } | { frac: [Tok[], Tok[]] } | { sqrt: Tok[] }
type Part =
    | { t: 'fig'; els: El[] }
    | { t: 'say'; text: string; big?: boolean }
    | { t: 'pause'; ms: number }
    | { t: 'card'; title: string; tex: string }
    | { t: 'calc'; tex: string }
    | { t: 'tap'; rounds: TapRound[] }
    | { t: 'choice'; rounds: ChoiceRound[] }
    | { t: 'build'; prompt: string; tpl: Tok[]; chips: string[]; slots: string[]; any?: number[][]; hint: string }
    | { t: 'remember'; title: string; lines: string[] }

type Scene = { title: string; next: string; parts: Part[] }
type Override = { els: El[]; onTap?: (id: string) => void; flash?: Flash } | null

const TypedLine = ({ text, onDone, big }: { text: string; onDone?: () => void; big?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', big ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), 350)} />
    </div>
)
const After = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}
const FormulaCard = ({ tex, title }: { tex: string; title: string }) => (
    <motion.div className="w-full rounded-2xl border-2 px-4 py-3 flex flex-col items-center gap-1"
        style={{ borderColor: 'rgba(232,182,54,0.85)', backgroundColor: '#161F23', boxShadow: '0 0 14px -4px rgba(232,182,54,0.45)' }}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 13 }}>
        <div className="text-xs font-black uppercase tracking-wide text-[#F2C35B]">{title}</div>
        <div className="text-2xl md:text-3xl text-[#F2F7FB]"><Latex>{`$${tex}$`}</Latex></div>
    </motion.div>
)
const CalcLine = ({ tex }: { tex: string }) => (
    <motion.div className="w-full text-center text-xl md:text-2xl text-[#F2F7FB]"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Latex>{`$${tex}$`}</Latex>
    </motion.div>
)
const GameLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex items-center gap-2" aria-hidden>
        <div className="flex-1 h-px bg-[#3A464E]" />
        <span className="text-[11px] font-black uppercase tracking-wide text-[#F2C35B]">🎮 {children}</span>
        <div className="flex-1 h-px bg-[#3A464E]" />
    </div>
)
const Note = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-xl px-4 py-2 font-bold w-full text-center', ok ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]')}>
        {children}
    </motion.div>
)

// --- «Нажми на …» ---
const TapGame = ({ rounds, setOverride, onDone }: { rounds: TapRound[]; setOverride: (o: Override) => void; onDone: () => void }) => {
    const [r, setR] = useState(0)
    const [flash, setFlash] = useState<Flash>({})
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [solved, setSolved] = useState(false)
    const round = rounds[r]
    useEffect(() => {
        const tap = (id: string) => {
            if (solved) return
            if (id === round.target) {
                setFlash({ [id]: 'ok' }); setSolved(true); setMsg({ ok: true, text: round.ok }); showAnswerMeme(true)
                setTimeout(() => {
                    if (r + 1 >= rounds.length) { onDone(); return }
                    setR(r + 1); setSolved(false); setFlash({}); setMsg(null)
                }, 1700)
            } else {
                playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
                setFlash({ [id]: 'bad' }); setMsg({ ok: false, text: round.hints[id] ?? 'Не то 🙃 Попробуй ещё' })
                setTimeout(() => setFlash((f) => (f[id] === 'bad' ? {} : f)), 700)
            }
        }
        setOverride({ els: solved && round.after ? [...round.els, ...round.after] : round.els, onTap: solved ? undefined : tap, flash })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [r, flash, solved])
    return (
        <div className="w-full flex flex-col gap-2">
            <motion.div key={r} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]">
                {round.prompt} <span className="text-sm font-bold text-[#5C6B73]">{r + 1}/{rounds.length}</span>
            </motion.div>
            {msg && <Note ok={msg.ok}>{msg.text}</Note>}
        </div>
    )
}

// --- «Посчитай» (выбор ответа) ---
const ChoiceGame = ({ rounds, setOverride, onDone }: { rounds: ChoiceRound[]; setOverride: (o: Override) => void; onDone: () => void }) => {
    const [r, setR] = useState(0)
    const [wrong, setWrong] = useState<string[]>([])
    const [done, setDone] = useState(false)
    const [finished, setFinished] = useState(false)
    const round = rounds[r]
    useEffect(() => {
        if (round.els) setOverride({ els: done && round.after ? [...round.els, ...round.after] : round.els })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [r, done])
    const pick = (o: string) => {
        if (done || wrong.includes(o)) return
        if (o === round.correct) {
            setDone(true); showAnswerMeme(true)
            setTimeout(() => {
                if (r + 1 >= rounds.length) { setFinished(true); onDone(); return }
                setR(r + 1); setWrong([]); setDone(false)
            }, 1800)
        } else { setWrong((w) => [...w, o]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    return (
        <div className="w-full flex flex-col gap-2">
            <motion.div key={r} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]">
                <Latex>{round.prompt}</Latex>
                {rounds.length > 1 && <span className="ml-1 text-sm font-bold text-[#5C6B73]">{r + 1}/{rounds.length}</span>}
            </motion.div>
            <div key={`o${r}`} className="drop-in-options grid grid-cols-3 gap-3 w-full">
                {round.options.map((o) => {
                    const isWrong = wrong.includes(o), isRight = done && o === round.correct
                    return (
                        <button key={o} type="button" disabled={isWrong || done} onClick={() => pick(o)}
                            className={cn('min-h-[56px] rounded-xl border-2 border-b-4 text-xl font-black transition-colors',
                                isRight ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                    : isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                        : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                            {o}
                        </button>
                    )
                })}
            </div>
            {!done && wrong.length > 0 && <Note ok={false}>{round.hint}</Note>}
            {done && round.ok && !finished && <Note ok>{round.ok}</Note>}
            {finished && round.ok && <Note ok>{round.ok}</Note>}
        </div>
    )
}

// --- «Собери формулу» ---
const BuildGame = ({ prompt, tpl, chips, slots, any = [], hint, onDone }: Extract<Part, { t: 'build' }> & { onDone: () => void }) => {
    const [fill, setFill] = useState<(number | null)[]>(slots.map(() => null))
    const [state, setState] = useState<'idle' | 'bad' | 'ok'>('idle')
    const [typed, setTyped] = useState(false)
    const active = fill.indexOf(null)
    const check = (f: (number | null)[]) => {
        const vals = f.map((i) => chips[i!])
        const inAny = new Set(any.flat())
        const ok = slots.every((s, j) => inAny.has(j) || vals[j] === s)
            && any.every((g) => g.map((j) => vals[j]).sort().join('|') === g.map((j) => slots[j]).sort().join('|'))
        if (ok) { setState('ok'); showAnswerMeme(true); setTimeout(onDone, 1000) }
        else {
            setState('bad'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setTimeout(() => { setFill(slots.map(() => null)); setState('idle') }, 1500)
        }
    }
    const pickChip = (i: number) => {
        if (state !== 'idle' || active < 0 || fill.includes(i)) return
        const f = [...fill]; f[active] = i; setFill(f)
        if (!f.includes(null)) check(f)
    }
    const unpick = (j: number) => {
        if (state !== 'idle' || fill[j] === null) return
        const f = [...fill]; f[j] = null; setFill(f)
    }
    const slotColor = state === 'ok' ? OK : state === 'bad' ? BAD : null
    const renderToks = (toks: Tok[]): React.ReactNode => toks.map((tk, i) => {
        if (typeof tk === 'string') return <span key={i} className="mx-1 whitespace-nowrap">{tk}</span>
        if ('s' in tk) {
            const j = tk.s, v = fill[j]
            const isActive = state === 'idle' && j === active
            return (
                <button key={i} type="button" onClick={() => unpick(j)}
                    className={cn('mx-0.5 min-w-[46px] h-[46px] px-2 rounded-xl border-2 inline-flex items-center justify-center align-middle', isActive && 'border-dashed')}
                    style={{ borderColor: slotColor ?? (isActive ? H_COL : '#3A464E'), backgroundColor: '#161F23', color: slotColor ?? LINE }}>
                    {v === null
                        ? <span className={cn(isActive && 'animate-slot-label')} style={{ ['--slot-c' as string]: H_COL } as React.CSSProperties}>?</span>
                        : <motion.span key={v} initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 16 }}>{chips[v]}</motion.span>}
                </button>
            )
        }
        if ('frac' in tk) return (
            <span key={i} className="inline-flex flex-col items-center align-middle mx-1 gap-1">
                <span className="inline-flex items-center">{renderToks(tk.frac[0])}</span>
                <span className="block w-full h-[3px] rounded-full bg-[#F2F7FB]" />
                <span className="inline-flex items-center">{renderToks(tk.frac[1])}</span>
            </span>
        )
        return (
            <span key={i} className="inline-flex items-center mx-1">
                <span className="text-3xl mr-0.5">√</span>
                <span className="inline-flex items-center border-t-[3px] border-[#F2F7FB] pt-1">{renderToks(tk.sqrt)}</span>
            </span>
        )
    })
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]">
                <Typewriter text={prompt} onDone={() => setTyped(true)} />
            </div>
            <motion.div animate={state === 'bad' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
                className="w-full flex flex-wrap items-center justify-center text-2xl font-black text-[#F2F7FB] italic">
                {renderToks(tpl)}
            </motion.div>
            {typed && state !== 'ok' && (
                <div className="drop-in-options grid grid-cols-3 gap-2 w-full">
                    {chips.map((c, i) => (
                        <button key={i} type="button" disabled={fill.includes(i)} onClick={() => pickChip(i)}
                            className={cn('min-h-[50px] rounded-xl border-2 border-b-4 text-xl font-black italic transition-opacity',
                                'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]', fill.includes(i) && 'opacity-25')}>
                            {c}
                        </button>
                    ))}
                </div>
            )}
            {state === 'bad' && <Note ok={false}>{hint}</Note>}
            {state === 'ok' && <Note ok>Собрано! 🔥</Note>}
        </div>
    )
}

const SceneRunner = ({ parts, onSettled }: { parts: Part[]; onSettled?: () => void }) => {
    const [reached, setReached] = useState(0)
    const [override, setOverride] = useState<Override>(null)
    const done = (i: number) => () => setReached((r) => (r === i ? i + 1 : r))
    useEffect(() => { if (reached >= parts.length) onSettled?.() }, [reached]) // eslint-disable-line react-hooks/exhaustive-deps
    let figIdx = -1
    for (let i = 0; i <= Math.min(reached, parts.length - 1); i++) if (parts[i].t === 'fig') figIdx = i
    // Новый рисунок сцены сбрасывает рисунок игры. Только при СМЕНЕ: эффекты детей идут раньше родительских,
    // и сброс на монтировании затёр бы рисунок игры, которая уже стоит первым шагом.
    const prevFig = useRef(figIdx)
    useEffect(() => {
        if (prevFig.current !== figIdx) { prevFig.current = figIdx; setOverride(null) }
    }, [figIdx])
    const base = figIdx >= 0 ? (parts[figIdx] as Extract<Part, { t: 'fig' }>).els : null
    const fig = override ?? (base ? { els: base } : null)
    return (
        <>
            {fig && (
                <motion.div className="w-full flex justify-center" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                    <Fig els={fig.els} onTap={fig.onTap} flash={fig.flash} />
                </motion.div>
            )}
            {parts.map((p, i) => {
                if (i > reached) return null
                const d = done(i)
                switch (p.t) {
                    case 'fig': return i === reached ? <After key={i} ms={700} onDone={d} /> : null
                    case 'pause': return i === reached ? <After key={i} ms={p.ms} onDone={d} /> : null
                    case 'say': return <TypedLine key={i} text={p.text} big={p.big} onDone={d} />
                    case 'card': return <Fragment key={i}><FormulaCard title={p.title} tex={p.tex} />{i === reached && <After ms={1000} onDone={d} />}</Fragment>
                    case 'calc': return <Fragment key={i}><CalcLine tex={p.tex} />{i === reached && <After ms={900} onDone={d} />}</Fragment>
                    case 'remember': return (
                        <Fragment key={i}>
                            <RememberPlate title={p.title}>
                                <div className="flex flex-col gap-1 text-sm md:text-base font-bold text-[#F2F7FB]">
                                    {p.lines.map((l, j) => <div key={j}><Latex>{l}</Latex></div>)}
                                </div>
                            </RememberPlate>
                            {i === reached && <After ms={1500} onDone={d} />}
                        </Fragment>
                    )
                    case 'tap': return i === reached ? <Fragment key={i}><GameLabel>Нажми на рисунке</GameLabel><TapGame rounds={p.rounds} setOverride={setOverride} onDone={d} /></Fragment> : null
                    case 'choice': return i <= reached ? <Fragment key={i}><GameLabel>Посчитай</GameLabel><ChoiceGame rounds={p.rounds} setOverride={setOverride} onDone={d} /></Fragment> : null
                    case 'build': return <Fragment key={i}><GameLabel>Собери формулу</GameLabel><BuildGame {...p} onDone={d} /></Fragment>
                }
            })}
        </>
    )
}

// ===== Урок 1: ½·a·h =====
const T1_PLAIN: El[] = [tri(T1.A, T1.B, T1.C)]
const T1_BASE: El[] = [...T1_PLAIN, { k: 'seg', p: T1.B, q: T1.C, c: A_COL, w: 6 }, { k: 'txt', p: P(200, 240), t: 'a', c: A_COL, italic: true, pop: true }]
const T1_FULL: El[] = [...T1_BASE, ...heightAll(T1.A, T1H, T1.C, H_COL, true), { k: 'txt', p: P(124, 150), t: 'h', c: H_COL, italic: true, pop: true }]
const T1_FOOT_B = foot(T1.B, T1.A, T1.C)
const nums = (pairs: [string, Pt][]): El[] => pairs.map(([t, p]): El => ({ k: 'txt', p, t, c: '#F2C35B', s: 17 }))

const AH_SCENES: Scene[] = [
    {
        title: 'Половина прямоугольника', next: 'Половинка, понял', parts: [
            { t: 'fig', els: RECT },
            { t: 'say', text: 'Площадь прямоугольника: S = a · h. Это все помнят 😎' },
            { t: 'fig', els: RECT_CUT },
            { t: 'say', text: 'Режем по диагонали ✂️' },
            { t: 'fig', els: RECT_HALF },
            { t: 'say', text: 'Треугольник — ровно ПОЛОВИНА прямоугольника!' },
            { t: 'card', title: 'Площадь треугольника', tex: 'S = \\dfrac{1}{2}\\cdot a\\cdot h' },
        ],
    },
    {
        title: 'Что такое a и h', next: 'a и h — ясно',
        parts: [
            { t: 'fig', els: T1_PLAIN },
            { t: 'say', text: 'a — ОСНОВАНИЕ. Любая сторона, на которую треугольник «сел» 🪑' },
            { t: 'fig', els: T1_BASE },
            { t: 'pause', ms: 500 },
            { t: 'say', text: 'h — ВЫСОТА. Из вершины на основание ровно под 90° 📐' },
            { t: 'fig', els: T1_FULL },
            { t: 'say', text: 'Как рост человека: меряем строго вертикально, а не наискосок 😄' },
            { t: 'fig', els: ANY_HALF },
            { t: 'say', text: 'И любой треугольник — половина прямоугольника a на h' },
        ],
    },
    {
        title: 'Где высота?', next: 'Высоту вижу 👀', parts: [
            {
                t: 'tap', rounds: [
                    {
                        prompt: 'Нажми на ВЫСОТУ 👆',
                        els: [tri(T1.A, T1.B, T1.C), { k: 'seg', p: T1.B, q: T1.C, c: A_COL, w: 6 },
                            { k: 'seg', id: 'm', p: T1.A, q: mid(T1.B, T1.C), c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'h', p: T1.A, q: T1H, c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'x', p: T1.A, q: P(232, 220), c: NEUTRAL, w: 3.5, dash: true }],
                        target: 'h', after: [{ k: 'right', at: T1H, to1: T1.C, to2: T1.A, c: OK }],
                        hints: { m: 'Это медиана, она идёт в середину. Высота падает под 90°', x: 'Наискосок не считается 🙃' },
                        ok: 'Да! Ровно 90° 📐',
                    },
                    {
                        prompt: 'А тут где высота к голубой стороне?',
                        els: [{ k: 'seg', id: 'h', p: T2.A, q: T2.C, w: 4 }, { k: 'seg', id: 'x', p: T2.A, q: T2.B, w: 4 },
                            { k: 'seg', p: T2.C, q: T2.B, c: A_COL, w: 6 },
                            { k: 'seg', id: 'm', p: T2.A, q: mid(T2.B, T2.C), c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'right', at: T2.C, to1: T2.B, to2: T2.A }],
                        target: 'h',
                        hints: { x: 'Это гипотенуза, она наклонная 🙃', m: 'Медиана, не высота' },
                        ok: 'Ага! В прямоугольном высота — это сам катет 😏',
                    },
                    {
                        prompt: 'А здесь? Высота к голубой стороне',
                        els: [tri(T3.A, T3.B, T3.C), { k: 'seg', p: T3.B, q: T3.C, c: A_COL, w: 6 },
                            { k: 'seg', p: T3.C, q: T3H, c: '#5C6B73', w: 2.5, dash: true },
                            { k: 'seg', id: 'x', p: T3.A, q: T3.C, w: 4 },
                            { k: 'seg', id: 'm', p: T3.A, q: mid(T3.B, T3.C), c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'h', p: T3.A, q: T3H, c: NEUTRAL, w: 3.5, dash: true }],
                        target: 'h', after: [{ k: 'right', at: T3H, to1: T3.B, to2: T3.A, c: OK }],
                        hints: { x: 'Это сторона треугольника. Высота — под 90°', m: 'Медиана 🙃 Высота может упасть даже ЗА треугольник' },
                        ok: 'Да! Высота упала ЗА треугольник. У тупоугольного так бывает 😮',
                    },
                    {
                        prompt: 'Высота уже есть. Нажми на её ОСНОВАНИЕ',
                        els: [{ k: 'seg', id: 'AC', p: T1.A, q: T1.C, w: 4 }, { k: 'seg', id: 'AB', p: T1.A, q: T1.B, w: 4 },
                            { k: 'seg', id: 'BC', p: T1.B, q: T1.C, w: 4 },
                            { k: 'seg', p: T1.B, q: T1_FOOT_B, c: H_COL, w: 3.5, dash: true },
                            { k: 'right', at: T1_FOOT_B, to1: T1.C, to2: T1.B, c: H_COL }],
                        target: 'AC',
                        hints: { AB: 'Высота к этой стороне не под 90° 🙃', BC: 'Высота к этой стороне не под 90° 🙃' },
                        ok: 'Точно! Основание — та сторона, куда высота упала под 90°',
                    },
                ],
            },
        ],
    },
    {
        title: 'Собери формулу', next: 'Формула моя', parts: [
            { t: 'fig', els: T1_AH },
            { t: 'build', prompt: 'Собери площадь из кнопок 👇', tpl: ['S =', { s: 0 }, '·', { s: 1 }, '·', { s: 2 }], chips: ['a', '2', '½', 'b', 'h', '1'], slots: ['½', 'a', 'h'], any: [[0, 1, 2]], hint: 'Нужны половинка, основание и высота 🙃' },
        ],
    },
    {
        title: 'Формула с числами', next: 'С числами тоже изи', parts: [
            { t: 'fig', els: [...T1_AH.slice(0, 1), { k: 'seg', p: T1.B, q: T1.C, c: A_COL, w: 6 }, ...heightAll(T1.A, T1H, T1.C), ...nums([['12', P(200, 240)], ['5', P(124, 150)], ['13', P(250, 120)]])] },
            { t: 'build', prompt: 'А теперь с числами. 13 тут — для отвлечения 😈', tpl: ['S =', { s: 0 }, '·', { s: 1 }, '·', { s: 2 }], chips: ['13', '½', '5', '2', '12', '6'], slots: ['½', '12', '5'], any: [[0, 1, 2]], hint: 'Боковая сторона 13 не высота! Высота пунктиром 🙃' },
            { t: 'choice', rounds: [{ prompt: 'Сколько получится?', options: ['30', '60', '78'], correct: '30', hint: 'Половина от 12 · 5 🙃', ok: '½ · 12 · 5 = 30 ✅' }] },
        ],
    },
    {
        title: 'Посчитай площадь', next: 'Легчайшая', parts: [
            {
                t: 'choice', rounds: [
                    { prompt: 'Найди площадь', els: [tri(T1.A, T1.B, T1.C), ...heightAll(T1.A, T1H, T1.C), ...nums([['10', P(200, 240)], ['6', P(124, 150)]])], options: ['30', '60', '16'], correct: '30', hint: 'Не забудь ½ 🙃', ok: '½ · 10 · 6 = 30' },
                    { prompt: 'Прямоугольный. Площадь?', els: [tri(T2.A, T2.B, T2.C), { k: 'right', at: T2.C, to1: T2.B, to2: T2.A }, ...nums([['8', P(42, 140)], ['6', P(165, 240)], ['10', P(178, 124)]])], options: ['24', '40', '30'], correct: '24', hint: 'Высота — это катет. Гипотенуза тут лишняя 🙃', ok: '½ · 6 · 8 = 24, катеты сами себе высоты' },
                    { prompt: 'Тупоугольный. Площадь?', els: [tri(T3.A, T3.B, T3.C), { k: 'seg', p: T3.C, q: T3H, c: '#5C6B73', w: 2.5, dash: true }, ...heightAll(T3.A, T3H, T3.B), ...nums([['5', P(100, 240)], ['8', P(278, 142)]])], options: ['20', '40', '13'], correct: '20', hint: 'Высота снаружи, но формула та же: ½ · 5 · 8', ok: 'Высота снаружи — а формула та же 😎' },
                ],
            },
        ],
    },
]

// ===== Урок 2: синус и Герон =====
const Q = { P: P(150, 50), L: P(40, 215), R: P(270, 215) }
const angRound = (prompt: string, A: Pt, B: Pt, C: Pt, a: [Pt, Pt], b: [Pt, Pt], target: 'A' | 'B' | 'C', la: Pt, lb: Pt): TapRound => ({
    prompt, target,
    els: [tri(A, B, C),
        { k: 'arc', id: 'A', at: A, a: B, b: C, c: NEUTRAL, r: 24 }, { k: 'arc', id: 'B', at: B, a: A, b: C, c: NEUTRAL, r: 24 }, { k: 'arc', id: 'C', at: C, a: A, b: B, c: NEUTRAL, r: 24 },
        { k: 'seg', p: a[0], q: a[1], c: A_COL, w: 6 }, { k: 'seg', p: b[0], q: b[1], c: B_COL, w: 6 },
        { k: 'txt', p: la, t: 'a', c: A_COL, italic: true }, { k: 'txt', p: lb, t: 'b', c: B_COL, italic: true }],
    hints: { A: 'Угол МЕЖДУ — там, где a и b встречаются 🤝', B: 'Угол МЕЖДУ — там, где a и b встречаются 🤝', C: 'Угол МЕЖДУ — там, где a и b встречаются 🤝' },
    ok: 'Да! Стороны a и b обнимают этот угол 🤗',
})
const SIN_SCENES: Scene[] = [
    {
        title: 'Две стороны и угол', next: 'Угол между — понял', parts: [
            { t: 'fig', els: [tri(S2.A, S2.B, S2.C)] },
            { t: 'say', text: 'Бывает, высоты НЕТ 😱 Зато знаем 2 стороны и угол между ними' },
            { t: 'fig', els: SIN_BASE },
            { t: 'pause', ms: 600 },
            {
                t: 'tap', rounds: [
                    angRound('Где угол МЕЖДУ a и b? 👆', S2.A, S2.B, S2.C, [S2.B, S2.C], [S2.B, S2.A], 'B', P(165, 236), P(62, 128)),
                    angRound('А тут?', Q.P, Q.L, Q.R, [Q.P, Q.L], [Q.P, Q.R], 'A', P(78, 124), P(226, 124)),
                    angRound('И тут?', S2.A, S2.B, S2.C, [S2.C, S2.B], [S2.C, S2.A], 'C', P(165, 236), P(212, 128)),
                ],
            },
        ],
    },
    {
        title: 'Откуда синус', next: 'Синус зашёл', parts: [
            { t: 'fig', els: SIN_BASE },
            { t: 'say', text: 'Опустим высоту. Слева прямоугольный треугольник:' },
            { t: 'fig', els: SIN_H },
            { t: 'say', text: 'h = b · sin γ. Подставим в ½ · a · h 👇' },
            { t: 'card', title: 'Площадь через синус', tex: 'S = \\dfrac{1}{2}\\cdot a\\cdot b\\cdot \\sin\\gamma' },
        ],
    },
    {
        title: 'Собери синус', next: 'Синус собран', parts: [
            { t: 'fig', els: SIN_BASE },
            { t: 'build', prompt: 'Собери формулу 👇', tpl: ['S =', { s: 0 }, '·', { s: 1 }, '·', { s: 2 }, '·', { s: 3 }], chips: ['a', 'cos γ', '½', 'h', 'sin γ', 'b'], slots: ['½', 'a', 'b', 'sin γ'], any: [[0, 1, 2, 3]], hint: 'Синус, а не косинус! И высоты тут нет 🙃' },
        ],
    },
    {
        title: 'Посчитай с синусом', next: 'Синус — база', parts: [
            { t: 'fig', els: SIN_BASE },
            {
                t: 'choice', rounds: [
                    { prompt: '$a = 8,\\ b = 6,\\ \\gamma = 30°$', options: ['12', '24', '48'], correct: '12', hint: 'sin 30° = ½. И ещё одна ½ впереди 🙃', ok: '½ · 8 · 6 · ½ = 12' },
                    { prompt: '$a = 4,\\ b = 5,\\ \\gamma = 90°$', options: ['10', '20', '9'], correct: '10', hint: 'sin 90° = 1 🙃', ok: 'sin 90° = 1, это обычный прямоугольный ½ · a · h 😎' },
                    { prompt: '$a = 10,\\ b = 6,\\ \\gamma = 150°$', options: ['15', '30', '60'], correct: '15', hint: 'sin 150° = sin 30° = ½', ok: 'sin 150° = ½, тупой угол не страшен 💪' },
                ],
            },
        ],
    },
    {
        title: 'Герон: полупериметр', next: 'p найдём', parts: [
            { t: 'fig', els: HERON_556 },
            { t: 'say', text: 'А если знаем ТОЛЬКО 3 стороны? Ни высоты, ни угла 😱' },
            { t: 'say', text: 'Зовём дедушку Герона 👴 Ему 2000 лет, а формула всё ещё рабочая' },
            { t: 'say', text: 'Шаг 1: полупериметр p. Половина суммы сторон' },
            {
                t: 'choice', rounds: [
                    { prompt: '$p = \\dfrac{5 + 5 + 6}{2} = \\ ?$', options: ['8', '16', '6'], correct: '8', hint: 'Сумма 16, а нам половина 🙃', ok: 'p = 8' },
                    { prompt: 'Стороны 3, 4, 5. $p = \\ ?$', options: ['6', '12', '5'], correct: '6', hint: '3 + 4 + 5 = 12, половина 🙃', ok: 'p = 6' },
                    { prompt: 'Стороны 7, 8, 9. $p = \\ ?$', options: ['12', '24', '8'], correct: '12', hint: '7 + 8 + 9 = 24, половина 🙃', ok: 'p = 12' },
                ],
            },
        ],
    },
    {
        title: 'Герон: формула', next: 'Корень, понял', parts: [
            { t: 'fig', els: HERON_556 },
            { t: 'card', title: 'Формула Герона', tex: 'S = \\sqrt{p(p-a)(p-b)(p-c)}' },
            { t: 'say', text: 'Под корнем p и «p минус» КАЖДАЯ сторона' },
        ],
    },
    {
        title: 'Герон: собери', next: 'Герон, уважаю', parts: [
            { t: 'fig', els: HERON_556 },
            { t: 'build', prompt: 'Стороны 5, 5, 6, p = 8. Что под корнем?', tpl: ['S =', { sqrt: [{ s: 0 }, '·', { s: 1 }, '·', { s: 2 }, '·', { s: 3 }] }], chips: ['16', '3', '8', '5', '2', '3'], slots: ['8', '3', '3', '2'], any: [[0, 1, 2, 3]], hint: 'p = 8, а дальше 8 − 5, 8 − 5, 8 − 6 🙃' },
            { t: 'choice', rounds: [{ prompt: '$S = \\sqrt{8\\cdot 3\\cdot 3\\cdot 2} = \\sqrt{144} = \\ ?$', options: ['12', '72', '144'], correct: '12', hint: '12 · 12 = 144 🙃', ok: '12! Проверка: высота 4, ½ · 6 · 4 = 12 ✅' }] },
        ],
    },
]

// ===== Урок 3: окружности и Пик =====
const SUMMARY_LINES = [
    '1. $S = \\tfrac12 a h$ · есть высота',
    '2. $S = \\tfrac12 ab\\sin\\gamma$ · 2 стороны и угол',
    '3. $S = \\sqrt{p(p-a)(p-b)(p-c)}$ · 3 стороны',
    '4. $S = \\dfrac{abc}{4R}$ · описанная окружность',
    '5. $S = p\\,r$ · вписанная окружность',
    '6. $S = \\text{В} + \\tfrac{\\text{Г}}{2} - 1$ · клетки',
]
const CIRC_SCENES: Scene[] = [
    {
        title: 'Вписанная: где r', next: 'r нашёл', parts: [
            { t: 'fig', els: [tri(I3.A, I3.B, I3.C), { k: 'circle', o: IC, r: IR, c: CIR_COL, draw: true }] },
            { t: 'say', text: 'Вписанная окружность касается ВСЕХ 3 сторон 🎯' },
            {
                t: 'tap', rounds: [
                    {
                        prompt: 'Нажми на радиус r 👆',
                        els: [...IN_BASE, { k: 'seg', id: 'x', p: IC, q: I3.B, c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'r', p: IC, q: TB, c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'y', p: IC, q: P(I3.C.x - 40, I3.C.y), c: NEUTRAL, w: 3.5, dash: true }],
                        target: 'r', after: [{ k: 'right', at: TB, to1: I3.C, to2: IC, c: OK }],
                        hints: { x: 'Это до вершины, длинновато 🙃', y: 'Радиус к стороне идёт под 90°, в точку касания' },
                        ok: 'Да! Радиус в точку касания — под 90° к стороне',
                    },
                    {
                        prompt: 'А теперь к другой стороне',
                        els: [...IN_BASE, { k: 'seg', id: 'r', p: IC, q: TA, c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'x', p: IC, q: I3.A, c: NEUTRAL, w: 3.5, dash: true },
                            { k: 'seg', id: 'y', p: IC, q: I3.C, c: NEUTRAL, w: 3.5, dash: true }],
                        target: 'r', after: [{ k: 'right', at: TA, to1: I3.C, to2: IC, c: OK }],
                        hints: { x: 'Это до вершины 🙃', y: 'Это до вершины 🙃' },
                        ok: 'Изи! Все 3 радиуса одинаковые: r',
                    },
                ],
            },
        ],
    },
    {
        title: 'S = p · r', next: 'p · r — кайф', parts: [
            { t: 'fig', els: IN_PIECES },
            { t: 'say', text: 'Режем на 3 треугольника. У каждого высота r!' },
            { t: 'calc', tex: 'S = \\tfrac12 a r + \\tfrac12 b r + \\tfrac12 c r = r\\cdot\\dfrac{a+b+c}{2}' },
            { t: 'say', text: 'А (a + b + c) : 2 — это полупериметр p' },
            { t: 'card', title: 'Вписанная окружность', tex: 'S = p\\cdot r' },
        ],
    },
    {
        title: 'Собери p · r', next: 'Вписанная — изи', parts: [
            { t: 'fig', els: IN_BASE },
            { t: 'build', prompt: 'Собери 👇 (P — периметр, p — полупериметр)', tpl: ['S =', { s: 0 }, '·', { s: 1 }], chips: ['P', 'r', '½', 'p', 'R'], slots: ['p', 'r'], any: [[0, 1]], hint: 'Маленькая p — полупериметр, маленькая r — вписанная 🙃' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Периметр $30$, $r = 4$', options: ['60', '120', '34'], correct: '60', hint: 'Сначала p = 30 : 2 = 15 🙃', ok: 'p = 15, S = 15 · 4 = 60' },
                    { prompt: '$p = 21,\\ r = 4$', options: ['84', '25', '168'], correct: '84', hint: 'Просто перемножь 🙃', ok: '21 · 4 = 84' },
                ],
            },
        ],
    },
    {
        title: 'Описанная: где R', next: 'Изи, R нашёл', parts: [
            { t: 'fig', els: [{ k: 'circle', o: RO, r: 5 * K2, c: CIR_COL, draw: true }, tri(R3.A, R3.B, R3.C)] },
            { t: 'say', text: 'Описанная окружность проходит через ВСЕ 3 вершины 🔵' },
            {
                t: 'tap', rounds: [{
                    prompt: 'Нажми на радиус R 👆',
                    els: [...CIRC_BASE, { k: 'seg', id: 'R', p: RO, q: R3.B, c: NEUTRAL, w: 3.5, dash: true },
                        { k: 'seg', id: 'x', p: RO, q: mid(R3.C, R3.B), c: NEUTRAL, w: 3.5, dash: true },
                        { k: 'seg', id: 'y', p: RO, q: mid(R3.A, R3.C), c: NEUTRAL, w: 3.5, dash: true }],
                    target: 'R',
                    hints: { x: 'R идёт от центра до ВЕРШИНЫ 🙃', y: 'R идёт от центра до ВЕРШИНЫ 🙃' },
                    ok: 'Да! От центра до вершины. А центр у прямоугольного — середина гипотенузы',
                }],
            },
        ],
    },
    {
        title: 'Формула abc / 4R', next: 'R понял', parts: [
            { t: 'fig', els: CIRC_BASE },
            { t: 'card', title: 'Описанная окружность', tex: 'S = \\dfrac{a\\cdot b\\cdot c}{4R}' },
            { t: 'build', prompt: 'Собери дробь 👇', tpl: ['S =', { frac: [[{ s: 0 }, '·', { s: 1 }, '·', { s: 2 }], ['4 ·', { s: 3 }]] }], chips: ['a', 'r', 'c', 'R', 'b', '2'], slots: ['a', 'b', 'c', 'R'], any: [[0, 1, 2]], hint: 'Сверху все 3 стороны, снизу 4 и большая R 🙃' },
            { t: 'choice', rounds: [{ prompt: '$S = \\dfrac{6\\cdot 8\\cdot 10}{4\\cdot 5} = \\ ?$', options: ['24', '48', '96'], correct: '24', hint: '480 : 20 🙃', ok: '24! Проверка: ½ · 6 · 8 = 24 ✅' }] },
        ],
    },
    {
        title: 'Формула Пика', next: 'Узлы посчитал', parts: [
            { t: 'fig', els: PICK_BASE },
            { t: 'say', text: 'Треугольник на клетчатой бумаге 📄 Тут ничего мерить не надо, только считать точки!' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Сколько узлов клетки ВНУТРИ?', els: PICK_BASE, after: PICK_IN, options: ['7', '5', '9'], correct: '7', hint: 'Узел — где пересекаются линии клетки. Считай только внутри 🙃', ok: 'В = 7' },
                    { prompt: 'А сколько НА ГРАНИЦЕ (с вершинами)?', els: [...PICK_BASE, ...PICK_IN], after: PICK_BORDER, options: ['12', '9', '3'], correct: '12', hint: 'Пройдись по всем трём сторонам, вершины тоже считаются 🙃', ok: 'Г = 12' },
                ],
            },
        ],
    },
    {
        title: 'Собери Пика', next: 'Пик — топ', parts: [
            { t: 'fig', els: [...PICK_BASE, ...PICK_IN, ...PICK_BORDER] },
            { t: 'card', title: 'Формула Пика', tex: 'S = \\text{В} + \\dfrac{\\text{Г}}{2} - 1' },
            { t: 'build', prompt: 'Собери 👇', tpl: ['S =', { s: 0 }, '+', { frac: [[{ s: 1 }], ['2']] }, '− 1'], chips: ['Г', '1', 'В', '2'], slots: ['В', 'Г'], hint: 'Внутренние целиком, граничные пополам 🙃' },
            { t: 'choice', rounds: [{ prompt: '$S = 7 + \\dfrac{12}{2} - 1 = \\ ?$', options: ['12', '18', '13'], correct: '12', hint: '7 + 6 − 1 🙃', ok: 'Проверка: ½ · 6 · 4 = 12 ✅' }] },
        ],
    },
    {
        title: 'Все 6 формул', next: 'ЛЕТС ГООУ', parts: [
            { t: 'remember', title: '6 ПЛОЩАДЕЙ', lines: SUMMARY_LINES },
        ],
    },
]

// ===== Тренировка =====
type Trial = { tag: string; text: string; options: number[]; answer: number; hint: string }
const AH_TRIALS: Trial[] = [
    { tag: '½·a·h', text: 'Основание 12, высота к нему 5. Найди площадь.', options: [30, 60, 17, 15], answer: 30, hint: 'S = ½ · a · h 🙃' },
    { tag: '½·a·h', text: 'Катеты прямоугольного треугольника 7 и 4. Найди площадь.', options: [14, 28, 11, 22], answer: 14, hint: 'Катеты — сами себе основание и высота 🙃' },
    { tag: '½·a·h', text: 'Основание 9, высота к нему 4. Найди площадь.', options: [18, 36, 13, 9], answer: 18, hint: 'Половина от 9 · 4 🙃' },
    { tag: 'Наоборот', text: 'Площадь 24, основание 8. Найди высоту.', options: [6, 3, 12, 16], answer: 6, hint: '24 = ½ · 8 · h, значит 24 = 4 · h 🙃' },
]
const SIN_TRIALS: Trial[] = [
    { tag: '½·a·b·sin', text: 'Стороны 8 и 5, угол между ними 30°. Найди площадь.', options: [10, 20, 40, 13], answer: 10, hint: 'sin 30° = ½ 🙃' },
    { tag: '½·a·b·sin', text: 'Стороны 4 и 9, угол между ними 90°. Найди площадь.', options: [18, 36, 13, 9], answer: 18, hint: 'sin 90° = 1 🙃' },
    { tag: 'Герон', text: 'Стороны 3, 4 и 5. Найди площадь по Герону.', options: [6, 12, 10, 60], answer: 6, hint: 'p = 6, S = √(6 · 3 · 2 · 1) 🙃' },
    { tag: 'Герон', text: 'Стороны 13, 14 и 15. Найди площадь.', options: [84, 42, 168, 21], answer: 84, hint: 'p = 21, S = √(21 · 8 · 7 · 6) 🙃' },
]
const CIRC_TRIALS: Trial[] = [
    { tag: 'p · r', text: 'Периметр 30, радиус вписанной окружности 4. Найди площадь.', options: [60, 120, 30, 34], answer: 60, hint: 'p — это ПОЛОВИНА периметра 🙃' },
    { tag: 'p · r', text: 'Полупериметр 12, радиус вписанной окружности 2. Найди площадь.', options: [24, 48, 14, 12], answer: 24, hint: 'S = p · r 🙃' },
    { tag: 'abc / 4R', text: 'Стороны 5, 12, 13, радиус описанной окружности 6,5. Найди площадь.', options: [30, 60, 15, 65], answer: 30, hint: 'S = 5 · 12 · 13 / (4 · 6,5) 🙃' },
    { tag: 'Пик', text: 'Внутри треугольника 5 узлов, на границе 8. Найди площадь.', options: [8, 9, 12, 13], answer: 8, hint: 'S = В + Г/2 − 1 🙃' },
]

type LessonKey = 'ah' | 'sin' | 'circ'
const LESSONS: Record<LessonKey, { scenes: Scene[]; trials: Trial[]; last: string }> = {
    ah: { scenes: AH_SCENES, trials: AH_TRIALS, last: '½ · a · h — моя!' },
    sin: { scenes: SIN_SCENES, trials: SIN_TRIALS, last: 'Синус и Герон — мои!' },
    circ: { scenes: CIRC_SCENES, trials: CIRC_TRIALS, last: 'Все 6 площадей мои!' },
}
export const area6LessonKey = (q: string): LessonKey => (/синус|Герон/i.test(q) ? 'sin' : /окружн|Пик/i.test(q) ? 'circ' : 'ah')
const pickPraise = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 2) % CORRECT_FEEDBACK_PHRASES.length]

export const TypeArea6Walk = ({ question, onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const lesson = LESSONS[area6LessonKey(question.question)]
    const SCENES = lesson.scenes
    const TRIALS = lesson.trials
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    const [qShow, setQShow] = useState(false)
    const [qTyped, setQTyped] = useState(false)
    useEffect(() => {
        setQShow(false); setQTyped(false)
        if (phase !== 'practice' || checked) return
        const t = setTimeout(() => setQShow(true), 600)
        return () => clearTimeout(t)
    }, [phase, trialIndex, checked])
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
    const answer = (v: number) => {
        const t = TRIALS[trialIndex]
        if (checked || wrongTried.includes(v)) return
        if (v === t.answer) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongFlash(null)
            setChecked(true)
            setTrialNextLabel(trialIndex + 1 >= TRIALS.length ? lesson.last : pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, v])
            setWrongFlash(`${pickWrongTryPhrase()} ${t.hint}`)
        }
    }
    const nextTrial = () => {
        if (advancing) return
        if (trialIndex + 1 >= TRIALS.length) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            setTrialIndex((i) => i + 1); setChecked(false); setWrongTried([]); setWrongFlash(null)
        }, 300)
    }
    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setWrongTried([]); setWrongFlash(null)
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
        ...SCENES.map((s, i) => ({
            dotKey: `s${i}`, label: s.title, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR,
        })),
        ...TRIALS.map((tr, i) => ({
            dotKey: `t${i}`, label: `Задание ${i + 1}: ${tr.tag}`, jumpKey: `trial-${i}`, isActive: phase === 'practice' && trialIndex === i, color: MAP_PRACTICE_COLOR,
        })),
    ]

    const t = TRIALS[trialIndex]
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((s, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <SceneRunner parts={s.parts} onSettled={() => i === step && setStepReady(true)} />
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
                        <div className="w-full flex items-center justify-between">
                            <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                className="flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                style={{ borderColor: hexToRgba(H_COL, 0.55), backgroundColor: hexToRgba(H_COL, 0.16), color: H_COL }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <span className="px-3 h-9 flex items-center rounded-full border-2 text-sm font-black"
                                style={{ borderColor: 'rgba(232,182,54,0.7)', color: '#F2C35B' }}>{t.tag}</span>
                        </div>
                        <p className="w-full text-lg md:text-xl font-bold text-[#F2F7FB] text-center min-h-[3.5rem]">
                            {qShow || checked
                                ? <Typewriter key={`q-${trialIndex}`} text={t.text} onDone={() => setQTyped(true)} />
                                : ' '}
                        </p>
                        {!checked && qTyped && (
                            <div key={`opts-${trialIndex}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                {t.options.map((v) => {
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
                        {!checked && wrongFlash && (
                            <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{wrongFlash}</div>
                        )}
                        {checked && (
                            <FieryFeedbackBanner>
                                {pickPraise(trialIndex)} Ответ: {t.answer}
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
                        {SCENES[step].next}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex">
                    <button type="button" onClick={nextTrial} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
