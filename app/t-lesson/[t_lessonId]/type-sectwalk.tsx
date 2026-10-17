'use client'

// «Стереометрия» → «Сечение» → «Кубик» (SECTWALK). Сечение куба через три точки — без букв у вершин:
// кубик — это комната, у неё потолок, пол и четыре стенки.
//   0. Куб рисуется, «Представь, что кубик — это комната 🏠», грани по очереди подсвечиваются с подписью.
//   1. Тест «Кликни на …» по всем шести граням (тап засчитывается грани, чей центр на рисунке ближе всего).
//   2. Две точки на потолке, одна на полу, «Как провести сечение через эти три точки?».
//   3. ПРАВИЛО 1: две точки на одной стенке — соединяем (точки на потолке).
//   4. ПРАВИЛО 2: потолок ∥ полу — на полу через точку проводим линию, параллельную линии на потолке
//      (пунктирная копия линии с потолка «съезжает» на пол). Линия упирается в ребро — там новая точка.
//   5. «Замкни сечение»: ученик сам соединяет пары точек на одной стенке (правая и передняя), сечение заливается.
//
// Координаты: единичный куб, x вправо, y вглубь, z вверх. Проекция «как в учебнике»: передняя грань — квадрат,
// глубина уходит вправо-вверх под 45° с коэффициентом 0.5 (как CubeFig в type-ttpwalk.tsx).
// Невидима дальняя левая нижняя вершина — её рёбра пунктиром. Пунктир НЕ рисовать через pathLength
// (framer перезаписывает strokeDasharray) — такие линии только проявляем.

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, LocalAnswerConfetti,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, RememberPlate, type AdminMapEntry,
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
type SceneProps = { onSettled?: () => void; onMistake?: () => void }

const SECT_COLOR = GGEGE_PALETTE.purple.button // сечение и его точки — «то, что ищем»
const FACE_COLOR = GGEGE_PALETTE.teal.button // подсвеченная стенка
const EDGE = '#C9D3D9'
const MUTED = '#9AA7B0'
const OK_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'

type V3 = [number, number, number]
const S = 150, DEPTH = 0.5, OX = 62, OY = 252
const P = (v: V3) => ({ x: OX + S * v[0] + S * DEPTH * v[1] * Math.SQRT1_2, y: OY - S * v[2] - S * DEPTH * v[1] * Math.SQRT1_2 })
// вершины (имена только в коде, ученику не показываем)
const V: Record<string, V3> = {
    a: [0, 0, 0], b: [0, 1, 0], c: [1, 1, 0], d: [1, 0, 0],
    a1: [0, 0, 1], b1: [0, 1, 1], c1: [1, 1, 1], d1: [1, 0, 1],
}
const EDGES: [string, string][] = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a'], ['a1', 'b1'], ['b1', 'c1'], ['c1', 'd1'], ['d1', 'a1'], ['a', 'a1'], ['b', 'b1'], ['c', 'c1'], ['d', 'd1']]
const hidden = (a: string, b: string) => a === 'b' || b === 'b'

type Face = 'ceiling' | 'floor' | 'front' | 'back' | 'left' | 'right'
const FACE_POLY: Record<Face, string[]> = {
    ceiling: ['a1', 'b1', 'c1', 'd1'], floor: ['a', 'b', 'c', 'd'],
    front: ['a', 'd', 'd1', 'a1'], back: ['b', 'c', 'c1', 'b1'],
    left: ['a', 'b', 'b1', 'a1'], right: ['d', 'c', 'c1', 'd1'],
}
const FACE_CENTER: Record<Face, V3> = {
    ceiling: [0.5, 0.5, 1], floor: [0.5, 0.5, 0], front: [0.5, 0, 0.5], back: [0.5, 1, 0.5], left: [0, 0.5, 0.5], right: [1, 0.5, 0.5],
}
const FACE_NAME: Record<Face, string> = { ceiling: 'потолок', floor: 'пол', front: 'передняя стенка', back: 'задняя стенка', left: 'левая стенка', right: 'правая стенка' }
const FACE_ACC: Record<Face, string> = { ceiling: 'потолок', floor: 'пол', front: 'переднюю стенку', back: 'заднюю стенку', left: 'левую стенку', right: 'правую стенку' }
const FACE_INTRO_ORDER: Face[] = ['ceiling', 'floor', 'left', 'right', 'front', 'back']
const FACE_TEST_ORDER: Face[] = ['ceiling', 'floor', 'front', 'back', 'left', 'right']

// Точки сечения: две на потолке, одна на полу; L — где линия на полу упирается в ребро.
type PtKey = 'M' | 'N' | 'K' | 'L'
const PT: Record<PtKey, V3> = {
    M: [1 / 3, 0, 1], // потолок, переднее ребро — треть от левого края
    N: [1, 0.7, 1], // потолок, правое ребро — ближе к дальнему углу
    K: [0.6, 0, 0], // пол, переднее ребро — чуть правее середины
    L: [1, 0.42, 0], // пол, правое ребро: K + t·(N − M), t = 0.6
}
const FACES_OF: Record<PtKey, Face[]> = { M: ['ceiling', 'front'], N: ['ceiling', 'right'], K: ['floor', 'front'], L: ['floor', 'right'] }
const commonFace = (a: PtKey, b: PtKey) => FACES_OF[a].find((f) => FACES_OF[b].includes(f)) ?? null

const poly = (keys: string[]) => keys.map((k) => { const p = P(V[k]); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
const polyPts = (keys: PtKey[]) => keys.map((k) => { const p = P(PT[k]); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')

type Seg = { id: string; a: PtKey; b: PtKey; color: string; dash?: string; instant?: boolean }
type FaceHL = { face: Face; color: string; label?: string }

const CubeSvg = ({ drawIn = false, faces = [], points = [], segs = [], selected = null, glowPts = [], fill = false, onFace, onPoint, children }: {
    drawIn?: boolean; faces?: FaceHL[]; points?: PtKey[]; segs?: Seg[]; selected?: PtKey | null; glowPts?: PtKey[]; fill?: boolean
    onFace?: (f: Face) => void; onPoint?: (k: PtKey) => void; children?: React.ReactNode
}) => {
    const ref = useRef<SVGSVGElement>(null)
    // Тап по кубу → грань, чей центр на рисунке ближе всего (так «достаются» и задние грани).
    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!onFace || !ref.current) return
        const ctm = ref.current.getScreenCTM()
        if (!ctm) return
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
        let best: Face = 'front', bd = Infinity
        for (const f of Object.keys(FACE_CENTER) as Face[]) {
            const c = P(FACE_CENTER[f])
            const d = Math.hypot(c.x - pt.x, c.y - pt.y)
            if (d < bd) { bd = d; best = f }
        }
        if (bd < 90) onFace(best)
    }
    return (
        <div className="w-full flex justify-center">
            <svg ref={ref} viewBox="0 0 330 292" className={cn('w-full max-w-[360px] overflow-visible', onFace && 'cursor-pointer')} onClick={handleClick}>
                {fill && (
                    <motion.polygon points={polyPts(['M', 'N', 'L', 'K'])} fill={hexToRgba(SECT_COLOR, 0.32)} stroke="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
                )}
                {faces.map((h) => (
                    <motion.polygon key={`${h.face}-${h.color}`} points={poly(FACE_POLY[h.face])} fill={hexToRgba(h.color, 0.28)} stroke={h.color} strokeWidth={2.5}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
                ))}
                {EDGES.map(([a, b], i) => {
                    const A = P(V[a]), B = P(V[b])
                    return (
                        <motion.line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={hidden(a, b) ? 2 : 3} strokeLinecap="round"
                            strokeDasharray={hidden(a, b) ? '6 6' : undefined}
                            initial={drawIn ? (hidden(a, b) ? { opacity: 0 } : { pathLength: 0 }) : false}
                            animate={hidden(a, b) ? { opacity: 0.6 } : { pathLength: 1 }}
                            transition={{ duration: 0.35, delay: drawIn ? i * 0.09 : 0, ease: 'easeOut' }} />
                    )
                })}
                {segs.map((s) => {
                    const A = P(PT[s.a]), B = P(PT[s.b])
                    return (
                        <g key={s.id}>
                            {!s.dash && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={s.color} strokeOpacity={0.3} strokeWidth={13} strokeLinecap="round" />}
                            <motion.line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={s.color} strokeWidth={5} strokeLinecap="round" strokeDasharray={s.dash}
                                initial={s.instant ? false : s.dash ? { opacity: 0 } : { pathLength: 0 }} animate={s.dash ? { opacity: 1 } : { pathLength: 1 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }} />
                        </g>
                    )
                })}
                {children}
                {faces.filter((h) => h.label).map((h) => {
                    const c = P(FACE_CENTER[h.face])
                    return (
                        <g key={`lbl-${h.face}`} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`}>
                            <motion.g initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 13 }}>
                                <rect x={-50} y={-14} width={100} height={28} rx={9} fill="rgba(22,31,35,0.82)" stroke={h.color} strokeWidth={2} />
                                <text textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={900} fill="#F2F7FB"
                                    style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{h.label}</text>
                            </motion.g>
                        </g>
                    )
                })}
                {points.map((k) => {
                    const p = P(PT[k])
                    const sel = selected === k
                    return (
                        <g key={k} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
                            onClick={onPoint ? (e) => { e.stopPropagation(); onPoint(k) } : undefined} style={onPoint ? { cursor: 'pointer' } : undefined}>
                            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }}>
                                {(sel || glowPts.includes(k)) && <circle r={16} fill={hexToRgba(SECT_COLOR, 0.32)} />}
                                <circle r={7.5} fill={SECT_COLOR} stroke="#161F23" strokeWidth={2.5} />
                                {onPoint && <circle r={24} fill="transparent" />}
                            </motion.g>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

const TypedBig = ({ text, onDone, readMs = 400, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)
const Msg = ({ ok, text }: { ok: boolean; text: string }) => (
    <motion.div key={text} className="rounded-xl px-4 py-2 font-bold w-full text-center" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: hexToRgba(ok ? OK_COLOR : WRONG_COLOR, 0.14), color: ok ? OK_COLOR : WRONG_COLOR }}>
        {text}
    </motion.div>
)
const GameHeader = ({ title }: { title: string }) => (
    <div className="w-full flex items-center gap-3" aria-hidden>
        <div className="flex-1 h-px bg-[#3A464E]" />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: SECT_COLOR }}>{title}</span>
        <div className="flex-1 h-px bg-[#3A464E]" />
    </div>
)

// ===== Сцена 0: кубик — это комната =====
const RoomScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [shown, setShown] = useState(-1)
    useEffect(() => {
        if (phase !== 2) return
        let i = 0
        setShown(0)
        const id = setInterval(() => {
            i += 1
            if (i >= FACE_INTRO_ORDER.length) { clearInterval(id); setShown(-1); setTimeout(() => onSettled?.(), 400); return }
            setShown(i)
        }, 1100)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const cur = shown >= 0 ? FACE_INTRO_ORDER[shown] : null
    return (
        <>
            <TypedBig text="Представь, что кубик — это комната 🏠" onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1400)}>
                    <CubeSvg drawIn faces={cur ? [{ face: cur, color: FACE_COLOR, label: FACE_NAME[cur] }] : []} />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <motion.p className="text-center text-base md:text-lg font-bold" style={{ color: MUTED }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    У комнаты есть <b className="text-[#F2F7FB]">потолок</b>, <b className="text-[#F2F7FB]">пол</b> и четыре стенки: левая, правая, передняя и задняя
                </motion.p>
            )}
        </>
    )
}

// ===== Сцена 1: тест «Кликни на …» =====
const WallTestScene = ({ onSettled, onMistake }: SceneProps) => {
    const [qi, setQi] = useState(0)
    const [typed, setTyped] = useState(false)
    const [hl, setHl] = useState<FaceHL | null>(null)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [locked, setLocked] = useState(false)
    const [done, setDone] = useState(false)
    const target = FACE_TEST_ORDER[qi]
    const tap = (f: Face) => {
        if (!typed || locked || done) return
        if (f === target) {
            showAnswerMeme(true)
            setHl({ face: f, color: OK_COLOR, label: FACE_NAME[f] })
            setMsg({ ok: true, text: 'Да, правильно! ✅' })
            setLocked(true)
            setTimeout(() => {
                setLocked(false); setHl(null); setMsg(null)
                if (qi + 1 >= FACE_TEST_ORDER.length) { setDone(true); setTimeout(() => onSettled?.(), 500) }
                else { setQi(qi + 1); setTyped(false) }
            }, 1400)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake?.()
            setHl({ face: f, color: WRONG_COLOR, label: FACE_NAME[f] })
            setMsg({ ok: false, text: `${pickWrongTryPhrase()} Это ${FACE_NAME[f]}. Найди ${FACE_ACC[target]}` })
        }
    }
    return (
        <>
            <GameHeader title="Тест: стенки комнаты" />
            <div className="relative w-full flex items-center justify-center min-h-9">
                <motion.div key={`cnt-${qi}`} initial={qi === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                    style={{ borderColor: hexToRgba(SECT_COLOR, 0.55), backgroundColor: hexToRgba(SECT_COLOR, 0.16), color: SECT_COLOR }}>
                    <span>{Math.min(qi + 1, FACE_TEST_ORDER.length)}</span><span className="opacity-50 font-normal">/</span><span>{FACE_TEST_ORDER.length}</span>
                </motion.div>
                <p className="text-xl md:text-2xl font-black text-[#F2F7FB] text-center px-16">
                    {done ? 'Все стенки найдены 🎉' : <Typewriter key={`q-${qi}`} text={`Кликни на ${FACE_ACC[target]}`} onDone={() => setTyped(true)} />}
                </p>
            </div>
            <CubeSvg faces={hl ? [hl] : []} onFace={done ? undefined : tap} />
            {msg && <Msg ok={msg.ok} text={msg.text} />}
            {done && <LocalAnswerConfetti />}
        </>
    )
}

// ===== Сцена 2: точки =====
const PointsScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = []
        // каждая фаза ставит свой таймер: cleanup эффекта отменил бы таймер, поставленный «на две фазы вперёд»
        if (phase === 1) timers.push(setTimeout(() => go(2), 600))
        if (phase === 2) timers.push(setTimeout(() => go(3), 600))
        if (phase === 5) timers.push(setTimeout(() => go(6), 700))
        return () => timers.forEach(clearTimeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const points: PtKey[] = [...(phase >= 2 ? ['M' as PtKey] : []), ...(phase >= 3 ? ['N' as PtKey] : []), ...(phase >= 6 ? ['K' as PtKey] : [])]
    const faces: FaceHL[] = phase >= 1 && phase < 4 ? [{ face: 'ceiling', color: FACE_COLOR }] : phase >= 5 && phase < 7 ? [{ face: 'floor', color: FACE_COLOR }] : []
    return (
        <>
            <TypedBig small text="Поставим две точки на потолок" onDone={() => go(1)} />
            <CubeSvg faces={faces} points={points} />
            {phase >= 3 && <TypedBig small text="и одну точку на пол" onDone={() => go(5)} />}
            {phase >= 6 && <TypedBig text="Как провести сечение через эти три точки?" onDone={() => { go(7); onSettled?.() }} />}
        </>
    )
}

// ===== Сцена 3: правило 1 =====
const Rule1Scene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    useEffect(() => {
        if (phase === 1) { const t = setTimeout(() => go(2), 1100); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <RememberPlate title="ПРАВИЛО 1">
                <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                    Две точки на <span style={{ color: FACE_COLOR }}>одной стенке</span> — соединяем
                </div>
            </RememberPlate>
            <TypedBig small text="Обе верхние точки на потолке — соединяем их" onDone={() => go(1)} />
            <CubeSvg faces={phase >= 1 ? [{ face: 'ceiling', color: FACE_COLOR }] : []} points={['M', 'N', 'K']} glowPts={phase === 1 ? ['M', 'N'] : []}
                segs={phase >= 2 ? [{ id: 'MN', a: 'M', b: 'N', color: SECT_COLOR }] : []} />
            {phase >= 2 && <TypedBig small text="Эта линия — уже кусочек сечения ✂️" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 4: правило 2 — параллельная линия на полу =====
// Пунктирная копия линии с потолка съезжает вниз так, что её начало попадает в точку на полу.
const Rule2Scene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = []
        if (phase === 1) timers.push(setTimeout(() => go(2), 900))
        if (phase === 2) timers.push(setTimeout(() => go(3), 1700))
        if (phase === 3) timers.push(setTimeout(() => go(4), 900))
        if (phase === 4) timers.push(setTimeout(() => go(5), 700))
        return () => timers.forEach(clearTimeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const M = P(PT.M), N = P(PT.N), K = P(PT.K)
    const dx = K.x - M.x, dy = K.y - M.y
    const faces: FaceHL[] = phase >= 1 && phase < 5 ? [{ face: 'ceiling', color: FACE_COLOR }, { face: 'floor', color: FACE_COLOR }] : []
    return (
        <>
            <RememberPlate title="ПРАВИЛО 2">
                <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                    Потолок <span style={{ color: FACE_COLOR }}>параллелен</span> полу — линии на них <span style={{ color: SECT_COLOR }}>параллельны</span>
                </div>
            </RememberPlate>
            <TypedBig small text="Переносим линию с потолка на пол через точку на полу" onDone={() => go(1)} />
            <CubeSvg faces={faces} points={phase >= 4 ? ['M', 'N', 'K', 'L'] : ['M', 'N', 'K']}
                segs={[{ id: 'MN', a: 'M', b: 'N', color: SECT_COLOR, instant: true }, ...(phase >= 3 ? [{ id: 'KL', a: 'K' as PtKey, b: 'L' as PtKey, color: SECT_COLOR }] : [])]}
                glowPts={phase === 4 ? ['L'] : []}>
                {phase >= 2 && phase < 4 && (
                    <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: dx, y: dy, opacity: [0, 1, 1, 0.9] }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
                        <line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                    </motion.g>
                )}
            </CubeSvg>
            {phase >= 5 && <TypedBig small text="Линия упёрлась в ребро: тут новая точка 📍" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 5: замкни сечение =====
const CloseGameScene = ({ onSettled, onMistake }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const [sel, setSel] = useState<PtKey | null>(null)
    const [segs, setSegs] = useState<Seg[]>([
        { id: 'MN', a: 'M', b: 'N', color: SECT_COLOR, instant: true },
        { id: 'KL', a: 'K', b: 'L', color: SECT_COLOR, instant: true },
    ])
    const [face, setFace] = useState<FaceHL | null>(null)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [found, setFound] = useState<string[]>([])
    const done = found.length >= 2
    const tap = (k: PtKey) => {
        if (!typed || done) return
        if (sel === null || sel === k) { setSel(k === sel ? null : k); return }
        const a = sel, b = k
        setSel(null)
        const key = [a, b].sort().join('')
        if (key === 'MN' || key === 'KL' || found.includes(key)) { setMsg({ ok: false, text: 'Эта линия уже есть 😉' }); return }
        const f = commonFace(a, b)
        if (f) {
            setFace({ face: f, color: FACE_COLOR })
            setSegs((s) => [...s, { id: key, a, b, color: SECT_COLOR }])
            const next = [...found, key]
            setFound(next)
            showAnswerMeme(true)
            if (next.length >= 2) {
                setMsg({ ok: true, text: `Обе точки — ${FACE_NAME[f]}. Сечение замкнулось!` })
                setTimeout(() => { setFace(null); onSettled?.() }, 1800)
            } else setMsg({ ok: true, text: `Да! Обе точки — ${FACE_NAME[f]}. Осталась ещё одна пара` })
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake?.()
            setFace(null)
            const bad: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7' }
            setSegs((s) => [...s, bad])
            setTimeout(() => setSegs((s) => s.filter((x) => x.id !== bad.id)), 1400)
            setMsg({ ok: false, text: `${pickWrongTryPhrase()} Эти точки на разных стенках — так линия пройдёт сквозь комнату` })
        }
    }
    return (
        <>
            <GameHeader title="Замкни сечение 🔗" />
            <TypedBig small text="Соедини точки, которые лежат на одной стенке. Тапни их по очереди" onDone={() => setTyped(true)} />
            <CubeSvg faces={face ? [face] : []} points={['M', 'N', 'K', 'L']} segs={segs} selected={sel} fill={done} onPoint={typed && !done ? tap : undefined} />
            {msg && <Msg ok={msg.ok} text={msg.text} />}
            {done && <LocalAnswerConfetti />}
            {done && <TypedBig text="Это и есть сечение! 🎉" readMs={0} />}
        </>
    )
}

const SCENES = [RoomScene, WallTestScene, PointsScene, Rule1Scene, Rule2Scene, CloseGameScene]
const SCENE_MAP_LABELS = ['Кубик — комната', 'Тест: стенки', 'Три точки', 'Правило 1', 'Правило 2', 'Замкни сечение']
const NEXT_LABELS = ['Понял, это комната', 'Стенки знаю', 'Интересненько 🤔', 'Одна стенка — соединяем', 'Параллельно, понял!', 'Готово']

export const TypeSectWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const [startStep, setStartStep] = useState(0)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `step-${step}`
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, stepReady)
    const last = step === SCENES.length - 1

    const handleNext = () => {
        if (advancing) return
        if (last) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => { setAdvancing(false); setStep((s) => s + 1); setStepReady(false) }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        bumpNonce(`step-${step - 1}`)
        setStep(step - 1)
        setStepReady(false)
    }
    const jumpTo = (key: string) => {
        const i = Number(key.slice(5))
        bumpNonce(key)
        setAdvancing(false); setStartStep(i); setStep(i); setStepReady(false)
    }
    const mapEntries: AdminMapEntry[] = SCENE_MAP_LABELS.map((label, i) => ({
        dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: step === i,
        color: SCENES[i] === WallTestScene || SCENES[i] === CloseGameScene ? MAP_PRACTICE_COLOR : MAP_INTRO_COLOR,
    }))

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <Scene onSettled={() => i === step && setStepReady(true)} onMistake={() => setHadMistake(true)} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}
            </div>
            <div className="w-full flex items-center gap-2">
                <ReplayButton onClick={handleReplay} disabled={advancing} />
                <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                    className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                    {NEXT_LABELS[step]}
                </button>
            </div>
        </div>
    )
}
