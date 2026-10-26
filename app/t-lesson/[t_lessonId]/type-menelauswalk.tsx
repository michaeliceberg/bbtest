'use client'

// Планиметрия → «Треугольник» → «Теорема Менелая» (MENELAUSWALK).
//   0. Картинка Менелая — «похоже на логотип Telegram ✈️».
//   1. Выбираем треугольник: левый или правый (ученик нажимает левый).
//   2. Его 3 угла — ВЕРШИНЫ, остальные 3 — просто ТОЧКИ (без букв).
//   3. Заклинание: (вершина → точка) / (точка → вершина) три раза = 1.
//   4. Подписываем A, B, C (вершины) и D, E, F (точки) и путешествуем стрелками: AD/DB · BF/FC · CE/EA = 1.
//   5. Шпаргалка.
// Тренировка: правый треугольник B, D, F (вершины) — путь буквами; потом те же два треугольника с длинами сторон.
// Конфигурация: D на AB (AD:DB = 1:2), E — середина AC, F на продолжении BC за C (BC = CF), D, E, F на одной прямой.

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock, RememberPlate,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner } from '@/components/geometry/WalkthroughLog'
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

const LINE = '#F2F7FB'
const V_COLOR = GGEGE_PALETTE.purple.button // вершина
const P_COLOR = GGEGE_PALETTE.teal.button   // точка
const WRONG = '#DC605B'
const FR_COLORS = [GGEGE_PALETTE.blue.button, GGEGE_PALETTE.raspberry.button, GGEGE_PALETTE.green.button]
const LEFT_FILL = GGEGE_PALETTE.blue.button
const RIGHT_FILL = GGEGE_PALETTE.raspberry.button

type Id = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
type Pt = { x: number; y: number }
const PTS: Record<Id, Pt> = {
    A: { x: 70, y: 40 }, B: { x: 20, y: 230 }, C: { x: 150, y: 230 },
    F: { x: 280, y: 230 }, D: { x: 70 - 50 / 3, y: 40 + 190 / 3 }, E: { x: 110, y: 135 },
}
const LETTER_OFF: Record<Id, Pt> = { A: { x: 0, y: -18 }, B: { x: -12, y: 16 }, C: { x: 0, y: 20 }, F: { x: 12, y: 16 }, D: { x: -17, y: -4 }, E: { x: 10, y: -16 } }
const WORD_OFF: Record<Id, Pt> = { A: { x: 0, y: -18 }, B: { x: 0, y: 20 }, C: { x: 0, y: 20 }, F: { x: 0, y: 20 }, D: { x: -30, y: -4 }, E: { x: 26, y: -14 } }
const LINES: [Id, Id][] = [['B', 'A'], ['A', 'C'], ['B', 'F'], ['D', 'F']]
const IDS: Id[] = ['A', 'B', 'C', 'D', 'E', 'F']

type Tri = { vertices: Id[]; sides: { ends: [Id, Id]; point: Id }[]; fill: string }
const LEFT: Tri = { vertices: ['A', 'B', 'C'], fill: LEFT_FILL, sides: [{ ends: ['A', 'B'], point: 'D' }, { ends: ['B', 'C'], point: 'F' }, { ends: ['C', 'A'], point: 'E' }] }
const RIGHT: Tri = { vertices: ['B', 'D', 'F'], fill: RIGHT_FILL, sides: [{ ends: ['B', 'D'], point: 'A' }, { ends: ['D', 'F'], point: 'E' }, { ends: ['F', 'B'], point: 'C' }] }
const pointsOf = (t: Tri) => IDS.filter((i) => !t.vertices.includes(i))
const sideOfPoint = (t: Tri, p: Id) => t.sides.find((s) => s.point === p)!.ends

const poly = (ids: Id[]) => ids.map((i) => `${PTS[i].x.toFixed(1)},${PTS[i].y.toFixed(1)}`).join(' ')
const segKey = (a: Id, b: Id) => [a, b].sort().join('')

// Длины для «числовых» заданий (у каждого задания свои подписи; каждое по Менелаю сходится к 1).
type Len = { label: string; v: number }
const LEN_LEFT: Record<string, Len> = {
    AD: { label: '2', v: 2 }, BD: { label: '4', v: 4 }, BF: { label: '5 + 5', v: 10 }, CF: { label: '5', v: 5 },
    CE: { label: '3', v: 3 }, AE: { label: '3', v: 3 },
}
const LEN_RIGHT: Record<string, Len> = {
    AB: { label: '4 + 2', v: 6 }, AD: { label: '2', v: 2 }, DE: { label: '2', v: 2 }, EF: { label: '6', v: 6 },
    CF: { label: '5', v: 5 }, BC: { label: '5', v: 5 },
}
// Подписи длин на рисунке: какой отрезок, где число.
type SegLabel = { key: string; text: string; at: Pt }
const LABELS_LEFT: SegLabel[] = [
    { key: 'AD', text: '2', at: { x: 50, y: 66 } }, { key: 'BD', text: '4', at: { x: 26, y: 166 } },
    { key: 'BC', text: '5', at: { x: 85, y: 249 } }, { key: 'CF', text: '5', at: { x: 215, y: 249 } },
    { key: 'CE', text: '3', at: { x: 143, y: 186 } }, { key: 'AE', text: '3', at: { x: 102, y: 78 } },
]
const LABELS_RIGHT: SegLabel[] = [
    { key: 'AD', text: '2', at: { x: 50, y: 66 } }, { key: 'BD', text: '4', at: { x: 26, y: 166 } },
    { key: 'DE', text: '2', at: { x: 80, y: 108 } }, { key: 'EF', text: '6', at: { x: 198, y: 168 } },
    { key: 'BC', text: '5', at: { x: 85, y: 249 } }, { key: 'CF', text: '5', at: { x: 215, y: 249 } },
]

const Txt = ({ p, children, color = LINE, size = 18 }: { p: Pt; children: React.ReactNode; color?: string; size?: number }) => (
    <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size} fontWeight={900}
        style={{ fontFamily: 'var(--font-nunito), sans-serif', paintOrder: 'stroke', stroke: '#131D22', strokeWidth: 4 }}>{children}</text>
)
// Текст/точка с отскоком: позиция на статичном <g>, framer у motion-узла перезаписывает transform.
const Pop = ({ p, delay = 0, children }: { p: Pt; delay?: number; children: React.ReactNode }) => (
    <g transform={`translate(${p.x} ${p.y})`}>
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 11, delay }}>
            {children}
        </motion.g>
    </g>
)

// Один шаг путешествия: цветная линия «едет» от p к q, в конце наконечник.
const Leg = ({ from, to, color, instant }: { from: Id; to: Id; color: string; instant?: boolean }) => {
    const len = Math.hypot(PTS[to].x - PTS[from].x, PTS[to].y - PTS[from].y)
    const ux = (PTS[to].x - PTS[from].x) / len, uy = (PTS[to].y - PTS[from].y) / len
    // сдвиг влево от направления: шаги туда и обратно по одной прямой (B → F, F → C) не сливаются
    const o = { x: uy * 4, y: -ux * 4 }
    const p = { x: PTS[from].x + o.x, y: PTS[from].y + o.y }, q = { x: PTS[to].x + o.x, y: PTS[to].y + o.y }
    const e = { x: q.x - ux * 10, y: q.y - uy * 10 }
    const ang = (Math.atan2(uy, ux) * 180) / Math.PI
    return (
        <g>
            <motion.line x1={p.x} y1={p.y} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.9}
                initial={instant ? { x2: e.x, y2: e.y } : { x2: p.x, y2: p.y }} animate={{ x2: e.x, y2: e.y }}
                transition={{ duration: instant ? 0 : 0.5, ease: 'easeInOut' }} />
            <g transform={`translate(${e.x} ${e.y}) rotate(${ang})`}>
                <motion.path d="M 4 0 L -8 -7 L -8 7 Z" fill={color}
                    initial={{ opacity: instant ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: instant ? 0 : 0.45, duration: 0.15 }} />
            </g>
        </g>
    )
}

type FigureProps = {
    fill?: 'left' | 'right' | null
    fillPulse?: boolean
    onPickTri?: (side: 'left' | 'right') => void
    vertices?: Id[]          // жирные фиолетовые
    points?: Id[]            // бирюзовые
    words?: boolean          // подписи «вершина / точка» вместо букв
    letters?: boolean
    legs?: { from: Id; to: Id; color: string }[]
    instantLegs?: number     // сколько первых шагов рисовать сразу (без анимации)
    lengths?: SegLabel[]
    onPick?: (id: Id) => void
    flash?: { id: Id; ok: boolean } | null
    current?: Id | null
    picked?: Id[]
}
const Figure = ({ fill, fillPulse, onPickTri, vertices = [], points = [], words, letters, legs = [], instantLegs = 0, lengths = [], onPick, flash, current, picked = [] }: FigureProps) => {
    const triFill = (which: 'left' | 'right') => {
        const t = which === 'left' ? LEFT : RIGHT
        const on = fill === which
        return (
            <motion.polygon key={which} points={poly(t.vertices)} fill={t.fill}
                style={{ cursor: onPickTri ? 'pointer' : undefined }}
                onClick={onPickTri ? () => onPickTri(which) : undefined}
                initial={false}
                animate={{ opacity: on ? (fillPulse ? [0.15, 0.4, 0.15] : 0.28) : onPickTri ? 0.05 : 0 }}
                transition={on && fillPulse ? { duration: 1.4, repeat: Infinity } : { duration: 0.4 }} />
        )
    }
    return (
        <svg viewBox="0 0 300 262" className="w-full max-w-[340px] overflow-visible select-none">
            {/* правый снизу: общая часть кликается как левый (его и просим нажать) */}
            {triFill('right')}
            {triFill('left')}
            {LINES.map(([a, b]) => (
                <line key={a + b} x1={PTS[a].x} y1={PTS[a].y} x2={PTS[b].x} y2={PTS[b].y} stroke={LINE} strokeWidth={3.5} strokeLinecap="round"
                    style={{ pointerEvents: 'none' }} />
            ))}
            {legs.map((l, i) => <Leg key={`${i}-${l.from}${l.to}`} {...l} instant={i < instantLegs} />)}
            {lengths.map((s) => (
                <g key={s.key} style={{ pointerEvents: 'none' }}><Txt p={s.at} size={16} color="#F2C35B">{s.text}</Txt></g>
            ))}
            {IDS.map((id) => {
                const isV = vertices.includes(id), isP = points.includes(id)
                if (!isV && !isP && !onPick && !picked.includes(id)) return null
                const p = PTS[id]
                const fl = flash?.id === id ? flash : null
                const color = fl && !fl.ok ? WRONG : isV || picked.includes(id) ? V_COLOR : isP ? P_COLOR : '#8FA3AE'
                return (
                    <g key={id} style={{ pointerEvents: 'none' }}>
                        {current === id && (
                            <circle cx={p.x} cy={p.y} r={13} fill="none" stroke={LINE} strokeWidth={2.5} className="animate-sel-pulse" />
                        )}
                        <Pop p={p}><circle r={isV || picked.includes(id) ? 7.5 : 6} fill={color} stroke="#131D22" strokeWidth={2} /></Pop>
                    </g>
                )
            })}
            {words && IDS.map((id) => {
                const isV = vertices.includes(id), isP = points.includes(id)
                if (!isV && !isP) return null
                const p = PTS[id], o = WORD_OFF[id]
                return <Pop key={`w${id}`} p={{ x: p.x + o.x, y: p.y + o.y }} delay={0.15}>
                    <Txt p={{ x: 0, y: 0 }} size={12} color={isV ? V_COLOR : P_COLOR}>{isV ? 'вершина' : 'точка'}</Txt>
                </Pop>
            })}
            {letters && IDS.map((id) => {
                const p = PTS[id], o = LETTER_OFF[id]
                const isV = vertices.includes(id)
                return <Pop key={`l${id}`} p={{ x: p.x + o.x, y: p.y + o.y }}>
                    <Txt p={{ x: 0, y: 0 }} size={19} color={isV ? '#D9B8FF' : points.includes(id) ? '#9FE5C9' : LINE}>{id}</Txt>
                </Pop>
            })}
            {onPick && IDS.map((id) => (
                <circle key={`h${id}`} cx={PTS[id].x} cy={PTS[id].y} r={20} fill="transparent" style={{ cursor: 'pointer' }}
                    onClick={() => onPick(id)} />
            ))}
        </svg>
    )
}

// ===== Формула-заклинание: три дроби HTML (числитель над знаменателем) =====
const Frac = ({ num, den, color, dimNum, dimDen }: { num: React.ReactNode; den: React.ReactNode; color: string; dimNum?: boolean; dimDen?: boolean }) => (
    <span className="inline-flex flex-col items-center align-middle leading-none mx-0.5">
        <span className={cn('px-1.5 pb-1 transition-opacity', dimNum && 'opacity-30')}>{num}</span>
        <span className="block w-full h-[3px] rounded-full" style={{ backgroundColor: color }} />
        <span className={cn('px-1.5 pt-1 transition-opacity', dimDen && 'opacity-30')}>{den}</span>
    </span>
)
const Slot = ({ text, color }: { text: string | null; color: string }) => text === null
    ? <span className="text-[#5C6B73]">?</span>
    : <motion.span key={text} initial={{ scale: 0.3, y: -16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 16 }} style={{ color }} className="inline-block whitespace-nowrap">{text}</motion.span>
const Spell = ({ slots, showOne, big }: { slots: (string | null)[]; showOne?: boolean; big?: boolean }) => (
    <div className={cn('w-full flex items-center justify-center flex-wrap font-black text-[#F2F7FB]', big ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl')}>
        {[0, 1, 2].map((k) => (
            <Fragment key={k}>
                {k > 0 && <span className="mx-1 text-[#8FA3AE]">·</span>}
                <Frac color={FR_COLORS[k]} num={<Slot text={slots[2 * k]} color={FR_COLORS[k]} />} den={<Slot text={slots[2 * k + 1]} color={FR_COLORS[k]} />} />
            </Fragment>
        ))}
        {showOne && (
            <motion.span className="ml-2 text-[#A1D151]" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}>= 1</motion.span>
        )}
    </div>
)

const TypedBig = ({ text, onDone, readMs = 400, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)
const PauseThen = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}
const useSteps = () => {
    const [phase, setPhase] = useState(0)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    return { phase, setPhase, next }
}
const Center = ({ children }: { children: React.ReactNode }) => <div className="w-full flex justify-center">{children}</div>
// ===== 0. Картинка =====
const PictureScene = ({ onSettled }: SceneProps) => {
    const { phase, next } = useSteps()
    return (
        <>
            <TypedBig text="Теорема Менелая 🧙" onDone={next(1)} readMs={300} />
            {phase >= 1 && <DiagramBlock onSettled={() => setTimeout(next(2), 600)}><Center><Figure /></Center></DiagramBlock>}
            {phase >= 2 && <TypedBig small text="Вот так она выглядит. Похоже на логотип Telegram ✈️" onDone={next(3)} />}
            {phase >= 3 && <TypedBig small text="Только вместо чатика здесь — магия 🪄" onDone={() => onSettled?.()} readMs={200} />}
        </>
    )
}

// ===== 1. Левый или правый треугольник =====
const ChooseScene = ({ onSettled }: SceneProps) => {
    const { phase, next } = useSteps()
    const [fill, setFill] = useState<'left' | 'right' | null>(null)
    const [wrong, setWrong] = useState(false)
    useEffect(() => {
        if (phase !== 1) return
        const t1 = setTimeout(() => setFill('left'), 300)
        const t2 = setTimeout(() => setFill('right'), 1700)
        const t3 = setTimeout(() => { setFill(null); next(2)() }, 3100)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const pick = (s: 'left' | 'right') => {
        if (phase !== 3) return
        if (s === 'left') { setFill('left'); setWrong(false); showAnswerMeme(true); next(4)() }
        else { setFill('right'); setWrong(true); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setTimeout(() => setFill(null), 700) }
    }
    return (
        <>
            <TypedBig small text="Сначала выбираем ТРЕУГОЛЬНИК: левый или правый" onDone={next(1)} readMs={200} />
            <Center><Figure fill={fill} fillPulse={phase === 1} onPickTri={phase === 3 ? pick : undefined} /></Center>
            {phase >= 2 && <TypedBig small text="Нажми на ЛЕВЫЙ 👆" onDone={next(3)} readMs={100} />}
            {phase === 3 && wrong && <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">Это правый 🙃 Левый — тот, что с острой макушкой</div>}
            {phase >= 4 && <TypedBig small text="Отлично, работаем с ним 👌" onDone={() => onSettled?.()} readMs={200} />}
        </>
    )
}

// ===== 2. Вершины и точки =====
const VerticesScene = ({ onSettled }: SceneProps) => {
    const { phase, next } = useSteps()
    const [vShown, setVShown] = useState(0)
    const [pShown, setPShown] = useState(0)
    const V: Id[] = ['A', 'B', 'C'], P: Id[] = ['D', 'E', 'F']
    useEffect(() => {
        if (phase === 1 && vShown < 3) { const t = setTimeout(() => setVShown((n) => n + 1), 650); return () => clearTimeout(t) }
        if (phase === 1 && vShown >= 3) { const t = setTimeout(next(2), 500); return () => clearTimeout(t) }
        if (phase === 3 && pShown < 3) { const t = setTimeout(() => setPShown((n) => n + 1), 650); return () => clearTimeout(t) }
        if (phase === 3 && pShown >= 3) { const t = setTimeout(next(4), 500); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, vShown, pShown])
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 400)}>
                <Center><Figure fill="left" vertices={V.slice(0, vShown)} points={P.slice(0, pShown)} words /></Center>
            </DiagramBlock>
            {phase >= 2 && <TypedBig small text="Его 3 угла — ВЕРШИНЫ" onDone={next(3)} readMs={200} />}
            {phase >= 4 && <TypedBig small text="А 3 другие точки — просто ТОЧКИ. Итого 3 вершины и 3 точки" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 3. Заклинание =====
const SpellScene = ({ onSettled }: SceneProps) => {
    const { phase, next } = useSteps()
    const W = ({ v }: { v: boolean }) => <span style={{ color: v ? V_COLOR : P_COLOR }}>{v ? 'вершина' : 'точка'}</span>
    return (
        <>
            <TypedBig small text="Сама теорема — это волшебное заклинание 🪄" onDone={next(1)} readMs={300} />
            {phase >= 1 && (
                <motion.div className="w-full rounded-2xl border-2 px-3 py-4 flex flex-col items-center gap-3"
                    style={{ borderColor: 'rgba(232,182,54,0.85)', backgroundColor: '#161F23', boxShadow: '0 0 14px -4px rgba(232,182,54,0.45)' }}
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 13 }}
                    onAnimationComplete={() => setTimeout(next(2), 600)}>
                    <div className="text-xs font-black uppercase tracking-wide text-[#F2C35B]">Заклинание</div>
                    <div className="text-lg md:text-xl font-black text-[#F2F7FB]">
                        <Frac color={FR_COLORS[0]} num={<><W v /> → <W v={false} /></>} den={<><W v={false} /> → <W v /></>} />
                    </div>
                </motion.div>
            )}
            {phase >= 2 && <PauseThen ms={800} onDone={next(3)} />}
            {phase >= 3 && <TypedBig small text="Сверху идём из вершины в точку, снизу — из точки в следующую вершину" onDone={next(4)} />}
            {phase >= 4 && <TypedBig small text="Повторяем 3 раза, пока не вернёмся домой 🏠 И получается ровно 1" onDone={next(5)} readMs={200} />}
            {phase >= 5 && <Spell big slots={[null, null, null, null, null, null]} showOne />}
            {phase >= 5 && <PauseThen ms={1200} onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== 4. Буквы и путешествие =====
const PATH_LEFT: Id[] = ['A', 'D', 'B', 'F', 'C', 'E', 'A']
const legsOf = (path: Id[]) => path.slice(1).map((to, i) => ({ from: path[i], to, color: FR_COLORS[Math.floor(i / 2)] }))
const slotsOf = (path: Id[], lens?: Record<string, Len>) => Array.from({ length: 6 }, (_, i) => {
    if (i + 1 >= path.length) return null
    const a = path[i], b = path[i + 1]
    return lens ? lens[segKey(a, b)]?.label ?? '?' : a + b
})
const TravelScene = ({ onSettled }: SceneProps) => {
    const { phase, next } = useSteps()
    const [legs, setLegs] = useState(0)
    useEffect(() => {
        if (phase !== 3) return
        if (legs < 6) { const t = setTimeout(() => setLegs((n) => n + 1), legs === 0 ? 300 : 1400); return () => clearTimeout(t) }
        const t = setTimeout(next(4), 900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, legs])
    const path = PATH_LEFT.slice(0, legs + 1)
    const cur = legs >= 1 ? legs - 1 : -1
    const role = (id: Id) => (LEFT.vertices.includes(id) ? 'вершина' : 'точка')
    return (
        <>
            <TypedBig small text="Подпишем: вершины A, B, C, а точки D, E, F" onDone={next(1)} readMs={200} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(next(2), 400)}>
                    <Center><Figure fill="left" vertices={LEFT.vertices} points={pointsOf(LEFT)} letters legs={legsOf(path)}
                        current={phase >= 3 ? path[path.length - 1] : null} /></Center>
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedBig small text="Стартуем из вершины A и колдуем!" onDone={next(3)} readMs={300} />}
            {phase >= 3 && <Spell big slots={slotsOf(path)} showOne={phase >= 4} />}
            {phase >= 3 && cur >= 0 && phase < 4 && (
                <motion.div key={cur} className="w-full text-center font-bold text-base md:text-lg"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ color: FR_COLORS[Math.floor(cur / 2)] }}>
                    {PATH_LEFT[cur]} → {PATH_LEFT[cur + 1]} · {role(PATH_LEFT[cur])} → {role(PATH_LEFT[cur + 1])}
                </motion.div>
            )}
            {phase >= 4 && <TypedBig small text="Вернулись в A — заклинание сработало! Всегда ровно 1 ✨" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 5. Шпаргалка =====
const SummaryScene = ({ onSettled }: SceneProps) => {
    useEffect(() => {
        const t = setTimeout(() => onSettled?.(), 1800)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <RememberPlate title="ТЕОРЕМА МЕНЕЛАЯ">
            <div className="flex flex-col gap-2 items-center">
                <Spell slots={slotsOf(PATH_LEFT)} showOne />
                <ul className="text-sm md:text-base font-bold text-[#F2F7FB] flex flex-col gap-1 self-stretch">
                    <li>1. Выбери треугольник: его углы — <span style={{ color: V_COLOR }}>вершины</span>, остальные 3 — <span style={{ color: P_COLOR }}>точки</span></li>
                    <li>2. Стартуй из любой вершины</li>
                    <li>3. Вершина → точка, точка → вершина. Шагай по прямым</li>
                    <li>4. Вернулся домой — произведение = 1</li>
                </ul>
            </div>
        </RememberPlate>
    )
}

const SCENES = [PictureScene, ChooseScene, VerticesScene, SpellScene, TravelScene, SummaryScene]
const SCENE_TITLES = ['Картинка', 'Левый или правый', 'Вершины и точки', 'Заклинание', 'Путешествие', 'Шпаргалка']
const NEXT_LABELS = ['Телега, понял ✈️', 'Левый, ок', 'Вершины и точки — ясно', 'Колдуем!', 'Магия работает', 'ЛЕТС ГООУ']

// ===== Тренировка =====
type Trial = { tag: string; tri: Tri; mode: 'letters' | 'numbers'; pickFirst?: boolean; lens?: Record<string, Len>; labels?: SegLabel[]; intro: string }
const TRIALS: Trial[] = [
    { tag: 'Правый треугольник', tri: RIGHT, mode: 'letters', pickFirst: true, intro: 'Теперь берём ПРАВЫЙ треугольник. Нажми 3 его вершины 👆' },
    { tag: 'Длины сторон', tri: LEFT, mode: 'numbers', lens: LEN_LEFT, labels: LABELS_LEFT, intro: 'Левый треугольник, но теперь с длинами. Пройди заклинание — соберём числа' },
    { tag: 'Длины сторон', tri: RIGHT, mode: 'numbers', lens: LEN_RIGHT, labels: LABELS_RIGHT, intro: 'Правый треугольник с длинами. Внимательно: некоторые отрезки состоят из двух кусочков 😏' },
]
const pickPraise = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 3) % CORRECT_FEEDBACK_PHRASES.length]

const checkStep = (tri: Tri, path: Id[], id: Id): string | null => {
    const n = path.length
    const isV = tri.vertices.includes(id)
    if (n === 0) return isV ? null : 'Начинаем с ВЕРШИНЫ 🟣'
    if (n % 2 === 1) {
        const v = path[n - 1]
        if (isV) return 'После вершины идём в ТОЧКУ 🟢'
        if (path.includes(id)) return 'В этой точке мы уже были 😉'
        if (!sideOfPoint(tri, id).includes(v)) return 'Эта точка не на прямой, которая выходит из нашей вершины'
        return null
    }
    if (!isV) return 'Теперь нужна ВЕРШИНА 🟣'
    const p = path[n - 1], prev = path[n - 2]
    const expected = sideOfPoint(tri, p).find((x) => x !== prev)
    if (id !== expected) return 'Шагай по ТОЙ ЖЕ прямой дальше — до следующей вершины'
    return null
}

const PathTrial = ({ trial, onMistake, onSolved }: { trial: Trial; onMistake: () => void; onSolved: (clean: boolean) => void }) => {
    const [typed, setTyped] = useState(false)
    const [picked, setPicked] = useState<Id[]>(trial.pickFirst ? [] : trial.tri.vertices)
    const [path, setPath] = useState<Id[]>([])
    const [flash, setFlash] = useState<{ id: Id; ok: boolean } | null>(null)
    const [msg, setMsg] = useState<string | null>(null)
    const [mistakes, setMistakes] = useState(0)
    const [walkTyped, setWalkTyped] = useState(!trial.pickFirst)
    const picking = picked.length < 3
    const done = path.length === 7

    const flashFor = (id: Id, ok: boolean) => { setFlash({ id, ok }); setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 700) }
    const miss = (id: Id, text: string) => {
        playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake(); setMistakes((m) => m + 1)
        flashFor(id, false); setMsg(`${pickWrongTryPhrase()} ${text}`)
    }
    const click = (id: Id) => {
        if (!typed || done) return
        if (picking) {
            if (picked.includes(id)) return
            if (!trial.tri.vertices.includes(id)) { miss(id, 'Это не вершина правого треугольника'); return }
            setMsg(null); setPicked((p) => [...p, id])
            return
        }
        if (!walkTyped) return
        const err = checkStep(trial.tri, path, id)
        if (err) { miss(id, err); return }
        setMsg(null)
        const nextPath = [...path, id]
        setPath(nextPath)
        if (nextPath.length === 7) {
            showAnswerMeme(true)
            onSolved(mistakes === 0)
        }
    }
    const product = trial.lens && done
        ? [0, 1, 2].reduce((acc, k) => acc * trial.lens![segKey(path[2 * k], path[2 * k + 1])].v / trial.lens![segKey(path[2 * k + 1], path[2 * k + 2])].v, 1)
        : 1
    return (
        <>
            <Center>
                <Figure fill={trial.tri === LEFT ? 'left' : 'right'}
                    vertices={picking ? [] : trial.tri.vertices} points={picking ? [] : pointsOf(trial.tri)}
                    picked={picking ? picked : []}
                    letters lengths={trial.labels} legs={legsOf(path)}
                    onPick={typed && !done ? click : undefined} flash={flash}
                    current={!picking && path.length > 0 && !done ? path[path.length - 1] : null} />
            </Center>
            <p className="w-full text-lg md:text-xl font-bold text-[#F2F7FB] text-center">
                <Typewriter text={trial.intro} onDone={() => setTyped(true)} />
            </p>
            {!picking && trial.pickFirst && (
                <p className="w-full text-lg md:text-xl font-bold text-center text-[#A1D151]">
                    <Typewriter text="Есть! Вершины B, D, F. Значит A, E, C — точки. Теперь колдуй: нажимай по пути 👆" onDone={() => setWalkTyped(true)} />
                </p>
            )}
            {!picking && <Spell big slots={slotsOf(path, trial.lens)} showOne={done} />}
            {msg && !done && <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{msg}</div>}
            {done && trial.lens && (
                <motion.div className="w-full text-center font-bold text-base md:text-lg text-[#8FA3AE]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Проверка: {[0, 1, 2].map((k) => {
                        const a = trial.lens![segKey(path[2 * k], path[2 * k + 1])].v, b = trial.lens![segKey(path[2 * k + 1], path[2 * k + 2])].v
                        return `${a}/${b}`
                    }).join(' · ')} = {Math.round(product * 100) / 100} ✅
                </motion.div>
            )}
        </>
    )
}

export const TypeMenelausWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
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
    const solved = (clean: boolean) => {
        registerCombo(clean)
        setChecked(true)
        setTrialNextLabel(trialIndex + 1 >= TRIALS.length ? 'Менелай покорён 🧙' : pickFunNextLabel())
    }
    const nextTrial = () => {
        if (advancing) return
        if (trialIndex + 1 >= TRIALS.length) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => { setAdvancing(false); setTrialIndex((i) => i + 1); setChecked(false) }, 300)
    }
    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false)
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
        ...SCENE_TITLES.map((label, i) => ({
            dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR,
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
                            <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                        </div>
                        <div className="w-full flex items-center justify-between">
                            <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                className="flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                style={{ borderColor: hexToRgba(V_COLOR, 0.55), backgroundColor: hexToRgba(V_COLOR, 0.16), color: V_COLOR }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <span className="px-3 h-9 flex items-center rounded-full border-2 text-sm font-black"
                                style={{ borderColor: 'rgba(232,182,54,0.7)', color: '#F2C35B' }}>{t.tag}</span>
                        </div>
                        <PathTrial key={`pt-${trialIndex}`} trial={t} onMistake={() => setHadMistake(true)} onSolved={solved} />
                        {checked && (
                            <FieryFeedbackBanner>
                                {pickPraise(trialIndex)} Заклинание сработало — ровно 1 ✨
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
                        {trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
