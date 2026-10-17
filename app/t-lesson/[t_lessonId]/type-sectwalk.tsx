'use client'

// «Стереометрия» → «Сечение» → «Кубик» (SECTWALK). Сечение куба через три точки — без букв у вершин:
// куб — это комната, у неё потолок, пол и четыре стены (слово «стенка» не используем — просьба пользователя).
//   0. Печать «Представь, что куб — это комната 🏠» → куб рисуется → «У комнаты есть потолок, пол и четыре стены» →
//      пауза 2 с → стены по очереди подсвечиваются с подписью.
//   1. Тест «Кликни на …» по всем шести стенам (тап засчитывается стене, чей центр на рисунке ближе), ответ «Передняя 👍».
//   2. Две точки на потолке, одна на полу, «Задача: провести сечение через эти три точки».
//   3. ПРАВИЛО 1 отдельной плашкой, без куба.
//   4. «Есть ли сейчас плоскость с двумя точками?» — выбор из 6 стен (верно: потолок и передняя). Выбрал → стена с отскоком,
//      остальные рёбра бледнеют, две точки по очереди «выпрыгивают», пауза, линия; потом «Есть ли ещё…» — вторая стена.
//   5. ПРАВИЛО 2: потолок ∥ полу — пунктирная копия линии с потолка съезжает на пол через точку; упирается в ребро — новая точка.
//   6. «Замкни сечение»: ученик сам соединяет две точки на правой стене, сечение заливается.
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
const FACE_COLOR = GGEGE_PALETTE.teal.button // подсвеченная стена
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
// Насколько бледнеют рёбра других граней, когда подсвечиваем одну (просьба пользователя: заметно бледнее)
const DIM_EDGE = 0.1
const DIM_HIDDEN = 0.07

type Face = 'ceiling' | 'floor' | 'front' | 'back' | 'left' | 'right'
const FACE_POLY: Record<Face, string[]> = {
    ceiling: ['a1', 'b1', 'c1', 'd1'], floor: ['a', 'b', 'c', 'd'],
    front: ['a', 'd', 'd1', 'a1'], back: ['b', 'c', 'c1', 'b1'],
    left: ['a', 'b', 'b1', 'a1'], right: ['d', 'c', 'c1', 'd1'],
}
const FACE_CENTER: Record<Face, V3> = {
    ceiling: [0.5, 0.5, 1], floor: [0.5, 0.5, 0], front: [0.5, 0, 0.5], back: [0.5, 1, 0.5], left: [0, 0.5, 0.5], right: [1, 0.5, 0.5],
}
const FACE_NAME: Record<Face, string> = { ceiling: 'потолок', floor: 'пол', front: 'передняя стена', back: 'задняя стена', left: 'левая стена', right: 'правая стена' }
// коротко — для кнопок и подтверждений «Передняя 👍»
const FACE_SHORT: Record<Face, string> = { ceiling: 'Потолок', floor: 'Пол', front: 'Передняя', back: 'Задняя', left: 'Левая', right: 'Правая' }
// «на потолке», «на передней стене»
const FACE_ON: Record<Face, string> = { ceiling: 'на потолке', floor: 'на полу', front: 'на передней стене', back: 'на задней стене', left: 'на левой стене', right: 'на правой стене' }
const FACE_ACC: Record<Face, string> = { ceiling: 'потолок', floor: 'пол', front: 'переднюю стену', back: 'заднюю стену', left: 'левую стену', right: 'правую стену' }
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

// Точка внутри многоугольника (в координатах рисунка) — чтобы тап по задней стене «сквозь» переднюю засчитывался.
const insidePoly = (pt: { x: number; y: number }, keys: string[]) => {
    const vs = keys.map((k) => P(V[k]))
    let inside = false
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const a = vs[i], b = vs[j]
        if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
    }
    return inside
}
const poly = (keys: string[]) => keys.map((k) => { const p = P(V[k]); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
const polyPts = (keys: PtKey[]) => keys.map((k) => { const p = P(PT[k]); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')

type Seg = { id: string; a: PtKey; b: PtKey; color: string; dash?: string; instant?: boolean; opacity?: number }
type FaceHL = { face: Face; color: string; label?: string }

const CubeSvg = ({ drawIn = false, faces = [], points = [], segs = [], selected = null, glowPts = [], fill = false, onFace, onPoint, children, dimExcept = null, bounceFaces = false, popKey = {} }: {
    drawIn?: boolean; faces?: FaceHL[]; points?: PtKey[]; segs?: Seg[]; selected?: PtKey | null; glowPts?: PtKey[]; fill?: boolean
    // dimExcept — рёбра, не принадлежащие этой стене, бледнеют; bounceFaces — подсветка стены появляется с отскоком;
    // popKey — смена числа заново «выпрыгивает» точку
    dimExcept?: Face | null; bounceFaces?: boolean; popKey?: Partial<Record<PtKey, number>>
    // onFace: ближайшая по центру грань + все грани, в чей контур попал тап (задние перекрыты передними)
    onFace?: (f: Face, inside: Face[]) => void; onPoint?: (k: PtKey) => void; children?: React.ReactNode
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
        const inside = (Object.keys(FACE_POLY) as Face[]).filter((f) => insidePoly(pt, FACE_POLY[f]))
        if (bd < 90 || inside.length) onFace(best, inside)
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
                        initial={bounceFaces ? { opacity: 0, scale: 0.55 } : { opacity: 0 }} animate={{ opacity: 1, scale: 1 }}
                        transition={bounceFaces ? { type: 'spring', stiffness: 340, damping: 11 } : { duration: 0.4 }} />
                ))}
                {EDGES.map(([a, b], i) => {
                    const A = P(V[a]), B = P(V[b])
                    const dim = dimExcept !== null && !(FACE_POLY[dimExcept].includes(a) && FACE_POLY[dimExcept].includes(b))
                    return (
                        <motion.line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={hidden(a, b) ? 2 : 3} strokeLinecap="round"
                            strokeDasharray={hidden(a, b) ? '6 6' : undefined}
                            initial={drawIn ? (hidden(a, b) ? { opacity: 0 } : { pathLength: 0 }) : false}
                            animate={hidden(a, b) ? { opacity: dim ? DIM_HIDDEN : 0.6 } : { pathLength: 1, opacity: dim ? DIM_EDGE : 1 }}
                            // задержка — только для первого «рисования» куба; приглушение рёбер — сразу, вместе с подсветкой грани
                            transition={{
                                pathLength: { duration: 0.35, delay: drawIn ? i * 0.09 : 0, ease: 'easeOut' },
                                opacity: { duration: 0.25, delay: drawIn && dimExcept === null && hidden(a, b) ? i * 0.09 : 0 },
                            }} />
                    )
                })}
                {segs.map((s) => {
                    const A = P(PT[s.a]), B = P(PT[s.b])
                    return (
                        <motion.g key={s.id} initial={false} animate={{ opacity: s.opacity ?? 1 }} transition={{ duration: 0.4 }}>
                            {!s.dash && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={s.color} strokeOpacity={0.3} strokeWidth={13} strokeLinecap="round" />}
                            <motion.line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={s.color} strokeWidth={5} strokeLinecap="round" strokeDasharray={s.dash}
                                initial={s.instant ? false : s.dash ? { opacity: 0 } : { pathLength: 0 }} animate={s.dash ? { opacity: 1 } : { pathLength: 1 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }} />
                        </motion.g>
                    )
                })}
                {children}
                {faces.filter((h) => h.label).map((h) => {
                    const c = P(FACE_CENTER[h.face])
                    const w = Math.round(h.label!.length * 8.4 + 24)
                    return (
                        <g key={`lbl-${h.face}`} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`}>
                            <motion.g initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 13 }}>
                                <rect x={-w / 2} y={-14} width={w} height={28} rx={9} fill="rgba(22,31,35,0.82)" stroke={h.color} strokeWidth={2} />
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
                        <g key={`${k}-${popKey[k] ?? 0}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
                            onClick={onPoint ? (e) => { e.stopPropagation(); onPoint(k) } : undefined} style={onPoint ? { cursor: 'pointer' } : undefined}>
                            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }}>
                                {(sel || glowPts.includes(k)) && <circle r={16} fill={hexToRgba(SECT_COLOR, 0.32)} />}
                                <circle r={7.5} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={2.5} />
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

// Шаги по таймеру: каждая фаза ставит только свой таймер (cleanup эффекта отменил бы таймер «на две фазы вперёд»).
function useChain(steps: Record<number, number>, phase: number, go: (n: number) => void, onEnd?: Record<number, () => void>) {
    useEffect(() => {
        if (onEnd?.[phase]) onEnd[phase]()
        const ms = steps[phase]
        if (ms === undefined) return
        const t = setTimeout(() => go(phase + 1), ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
}
const usePhaseState = () => {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    return { phase, go }
}

// ===== Сцена 0: кубик — это комната =====
// печать → куб рисуется → печать «у комнаты есть…» → пауза 2 с → стены по очереди с подписью
const RoomScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhaseState()
    const [shown, setShown] = useState(-1)
    useEffect(() => {
        if (phase === 3) { const t = setTimeout(() => go(4), 2000); return () => clearTimeout(t) }
        if (phase !== 4) return
        let i = 0
        setShown(0)
        const id = setInterval(() => {
            i += 1
            if (i >= FACE_INTRO_ORDER.length) { clearInterval(id); setShown(-1); setTimeout(() => onSettled?.(), 400); return }
            setShown(i)
        }, 1650)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    const cur = shown >= 0 ? FACE_INTRO_ORDER[shown] : null
    return (
        <>
            <TypedBig text="Представь, что куб — это комната 🏠" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => go(2), 1400)}>
                    <CubeSvg drawIn faces={cur ? [{ face: cur, color: FACE_COLOR, label: FACE_NAME[cur] }] : []} dimExcept={cur} />
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedBig small text="У комнаты есть потолок, пол и четыре стены" onDone={() => go(3)} readMs={0} />}
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
    const tap = (nearest: Face, inside: Face[]) => {
        if (!typed || locked || done) return
        // попал в контур нужной стены (даже если спереди её перекрывает другая) — засчитываем
        const f = inside.includes(target) ? target : nearest
        if (f === target) {
            showAnswerMeme(true)
            setHl({ face: f, color: OK_COLOR, label: FACE_NAME[f] })
            setMsg({ ok: true, text: `${FACE_SHORT[f]} 👍` })
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
            <GameHeader title="Тест: стены комнаты" />
            <div className="relative w-full flex items-center justify-center min-h-9">
                <motion.div key={`cnt-${qi}`} initial={qi === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                    style={{ borderColor: hexToRgba(SECT_COLOR, 0.55), backgroundColor: hexToRgba(SECT_COLOR, 0.16), color: SECT_COLOR }}>
                    <span>{Math.min(qi + 1, FACE_TEST_ORDER.length)}</span><span className="opacity-50 font-normal">/</span><span>{FACE_TEST_ORDER.length}</span>
                </motion.div>
                <p className="text-xl md:text-2xl font-black text-[#F2F7FB] text-center px-16">
                    {done ? 'Все стены найдены 🎉' : <Typewriter key={`q-${qi}`} text={`Кликни на ${FACE_ACC[target]}`} onDone={() => setTyped(true)} />}
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
    const { phase, go } = usePhaseState()
    useChain({ 1: 600, 2: 600, 5: 700 }, phase, go)
    const points: PtKey[] = [...(phase >= 2 ? ['M' as PtKey] : []), ...(phase >= 3 ? ['N' as PtKey] : []), ...(phase >= 6 ? ['K' as PtKey] : [])]
    const faces: FaceHL[] = phase >= 1 && phase < 4 ? [{ face: 'ceiling', color: FACE_COLOR }] : phase >= 5 && phase < 7 ? [{ face: 'floor', color: FACE_COLOR }] : []
    return (
        <>
            <TypedBig small text="Поставим две точки на потолке" onDone={() => go(1)} />
            <CubeSvg faces={faces} points={points} />
            {phase >= 3 && <TypedBig small text="и одну точку на полу" onDone={() => go(5)} />}
            {phase >= 6 && <TypedBig text="Задача: провести сечение через эти три точки" onDone={() => { go(7); onSettled?.() }} />}
        </>
    )
}

// ===== Сцена 3: правило 1 — отдельно, без куба; текст печатается, кнопка появляется после печати =====
const RULE1_TEXT = 'Если нашли две точки в одной плоскости — соединяем эти точки'
const Rule1PlateScene = ({ onSettled }: SceneProps) => (
    <RememberPlate title="ПРАВИЛО 1">
        <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB] min-h-[3.5rem]">
            <Typewriter text={RULE1_TEXT} onDone={() => setTimeout(() => onSettled?.(), 400)} />
        </div>
    </RememberPlate>
)

// ===== Сцена 4: пробуем правило 1 — «Есть ли плоскость с двумя точками?» =====
// Подходят потолок и передняя стена. Выбрал стену → она с отскоком подсвечивается, остальные рёбра бледнеют,
// две её точки по очереди «выпрыгивают», пауза 1 с, линия. Два раунда — по одному на каждую стену.
const PAIR_FACES: Face[] = ['ceiling', 'front']
const SEG_OF: Partial<Record<Face, Seg>> = {
    ceiling: { id: 'MN', a: 'M', b: 'N', color: SECT_COLOR },
    front: { id: 'MK', a: 'M', b: 'K', color: SECT_COLOR },
}
const PTS_ON = (f: Face) => (Object.keys(FACES_OF) as PtKey[]).filter((k) => k !== 'L' && FACES_OF[k].includes(f))
const OPTION_ORDER: Face[] = ['ceiling', 'floor', 'left', 'right', 'front', 'back']

const Rule1TryScene = ({ onSettled, onMistake }: SceneProps) => {
    const [ready, setReady] = useState(false) // пауза 1 с после куба
    const [round, setRound] = useState(0)
    const [typed, setTyped] = useState(false)
    const [done, setDone] = useState<Face[]>([])
    const [active, setActive] = useState<Face | null>(null)
    const [stage, setStage] = useState(0) // 1 стена, 2 бледные рёбра, 3 первая точка, 4 вторая, 5 линия, 6 кнопка
    const [wrong, setWrong] = useState<Face[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [popKey, setPopKey] = useState<Partial<Record<PtKey, number>>>({})
    useEffect(() => {
        if (!active) return
        const delays: Record<number, number> = { 1: 700, 2: 600, 3: 550, 4: 1000, 5: 900 }
        const ms = delays[stage]
        if (ms === undefined) return
        const t = setTimeout(() => {
            const next = stage + 1
            const pts = PTS_ON(active)
            if (next === 3) setPopKey((p) => ({ ...p, [pts[0]]: (p[pts[0]] ?? 0) + 1 }))
            if (next === 4) setPopKey((p) => ({ ...p, [pts[1]]: (p[pts[1]] ?? 0) + 1 }))
            setStage(next)
            if (next === 6 && round === 1) onSettled?.()
        }, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, active])
    const pick = (f: Face) => {
        if (!typed || active || wrong.includes(f) || done.includes(f)) return
        if (PAIR_FACES.includes(f)) {
            showAnswerMeme(true); setFlash(null)
            setActive(f); setStage(1)
            return
        }
        playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake?.()
        setWrong((w) => [...w, f])
        const n = PTS_ON(f).length
        setFlash(`${pickWrongTryPhrase()} ${FACE_ON[f][0].toUpperCase()}${FACE_ON[f].slice(1)} ${n === 0 ? 'нет ни одной точки' : 'только одна точка'}`)
    }
    const nextRound = () => {
        if (!active) return
        setDone((d) => [...d, active]); setActive(null); setStage(0); setWrong([]); setFlash(null); setTyped(false); setRound(1)
    }
    const segs: Seg[] = [...done.map((f) => ({ ...SEG_OF[f]!, instant: true })), ...(active && stage >= 5 ? [SEG_OF[active]!] : [])]
    const ptsGlow = active && stage >= 3 ? PTS_ON(active).slice(0, stage >= 4 ? 2 : 1) : []
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setReady(true), 1000)}>
                <CubeSvg points={['M', 'N', 'K']} segs={segs} faces={active && stage >= 1 ? [{ face: active, color: FACE_COLOR }] : []} bounceFaces
                    dimExcept={active && stage >= 2 ? active : null} glowPts={ptsGlow} popKey={popKey} />
            </DiagramBlock>
            {ready && (
                <TypedBig key={`q-${round}`} small text={round === 0 ? 'Есть ли сейчас плоскость с двумя точками?' : 'Есть ли ещё плоскость с двумя точками?'} onDone={() => setTyped(true)} readMs={0} />
            )}
            {ready && typed && !active && (
                <div key={`opts-${round}`} className="drop-in-options grid grid-cols-3 gap-2 w-full">
                    {OPTION_ORDER.map((f) => {
                        const isWrong = wrong.includes(f), used = done.includes(f)
                        return (
                            <button key={f} type="button" disabled={isWrong || used} onClick={() => pick(f)}
                                className={cn('min-h-[52px] rounded-xl border-2 border-b-4 text-base md:text-lg font-black transition-colors px-1',
                                    isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                        : used ? 'border-[#3A464E] bg-[#161F23] text-[#5C6B73]'
                                            : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                {FACE_SHORT[f]}{used ? ' ✓' : ''}
                            </button>
                        )
                    })}
                </div>
            )}
            {flash && !active && <Msg ok={false} text={flash} />}
            {active && stage >= 5 && <LocalAnswerConfetti />}
            {active && stage >= 6 && round === 0 && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {/* «…на передней стене» длинное — шрифт поменьше, чтобы влезло в кнопку на телефоне */}
                    <button type="button" onClick={nextRound} className={walkthroughButtonClass(true)} style={{ ...walkthroughButtonStyle(true), fontSize: 15 }}>
                        Готово. Соединили {FACE_ON[active]}
                    </button>
                </motion.div>
            )}
        </>
    )
}

// ===== Сцена 5: правило 2 — параллельная линия на полу =====
// Строго по шагам: куб рисуется → потолок с отскоком → пол с отскоком → «Потолок и пол параллельны.» → кнопка
// «Вижу, они параллельны» → только потолок (остальные рёбра бледные), «На потолке есть линия.» → линия выделяется
// жёлтым свечением с белой серединой и отскоком → пунктирная копия съезжает на пол через точку → линия на полу
// ПУНКТИРОМ (пол мы не видим) → новая точка на ребре. Линия на передней стене всю сцену бледная — сейчас она не нужна.
const HIGHLIGHT = '#F2C35B'
const Rule2Scene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhaseState()
    useChain({ 1: 750, 2: 900, 6: 1600, 7: 1700, 8: 900, 9: 700 }, phase, go)
    const M = P(PT.M), N = P(PT.N), K = P(PT.K)
    const dx = K.x - M.x, dy = K.y - M.y
    const ceil: FaceHL = { face: 'ceiling', color: FACE_COLOR }, floor: FaceHL = { face: 'floor', color: FACE_COLOR }
    const faces: FaceHL[] = phase === 1 ? [ceil]
        : phase >= 2 && phase <= 4 ? [ceil, floor]
            : phase === 5 || phase === 6 ? [ceil]
                : phase >= 7 && phase < 10 ? [ceil, floor] : []
    return (
        <>
            <RememberPlate title="ПРАВИЛО 2">
                <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                    Потолок и пол <span style={{ color: FACE_COLOR }}>параллельны!</span> — значит и линии на них <span style={{ color: SECT_COLOR }}>параллельны</span>
                </div>
            </RememberPlate>
            <DiagramBlock onSettled={() => setTimeout(() => go(1), 1300)}>
                <CubeSvg drawIn faces={faces} bounceFaces dimExcept={phase === 5 || phase === 6 ? 'ceiling' : null}
                    points={phase >= 9 ? ['M', 'N', 'K', 'L'] : ['M', 'N', 'K']}
                    segs={[{ id: 'MN', a: 'M', b: 'N', color: SECT_COLOR, instant: true }, { id: 'MK', a: 'M', b: 'K', color: SECT_COLOR, instant: true, opacity: 0.18 },
                        ...(phase >= 8 ? [{ id: 'KL', a: 'K' as PtKey, b: 'L' as PtKey, color: SECT_COLOR, dash: '9 7' }] : [])]}
                    glowPts={phase === 9 ? ['L'] : []}>
                    {phase === 6 && (
                        // выделение линии на потолке: жёлтое свечение + белая середина с отскоком
                        <g>
                            <motion.line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke={HIGHLIGHT} strokeLinecap="round"
                                initial={{ strokeWidth: 4, opacity: 0 }} animate={{ strokeWidth: [4, 30, 20, 24], opacity: [0, 0.75, 0.5, 0.6] }}
                                transition={{ duration: 1, ease: 'easeOut' }} />
                            <motion.line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke="#FFFFFF" strokeLinecap="round"
                                initial={{ strokeWidth: 3 }} animate={{ strokeWidth: [3, 10, 5, 7] }} transition={{ duration: 1, ease: 'easeOut' }} />
                        </g>
                    )}
                    {phase === 7 && (
                        <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: dx, y: dy, opacity: [0, 1, 1, 0.9] }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
                            <line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                        </motion.g>
                    )}
                </CubeSvg>
            </DiagramBlock>
            {phase >= 3 && <TypedBig small text="Потолок и пол параллельны." onDone={() => go(4)} />}
            {phase === 4 && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <button type="button" onClick={() => go(5)} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>Вижу, они параллельны</button>
                </motion.div>
            )}
            {phase >= 5 && <TypedBig small text="На потолке есть линия." onDone={() => go(6)} />}
            {phase >= 10 && <TypedBig small text="Линия упёрлась в ребро: тут новая точка 📍" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 6: замкни сечение =====
// Уже есть линии на потолке, передней стене и полу; осталось соединить две точки на правой стене.
const CloseGameScene = ({ onSettled, onMistake }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const [sel, setSel] = useState<PtKey | null>(null)
    const [segs, setSegs] = useState<Seg[]>([
        { id: 'MN', a: 'M', b: 'N', color: SECT_COLOR, instant: true },
        { id: 'KM', a: 'M', b: 'K', color: SECT_COLOR, instant: true },
        { id: 'KL', a: 'K', b: 'L', color: SECT_COLOR, instant: true, dash: '9 7' },
    ])
    const [face, setFace] = useState<FaceHL | null>(null)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [done, setDone] = useState(false)
    const tap = (k: PtKey) => {
        if (!typed || done) return
        if (sel === null || sel === k) { setSel(k === sel ? null : k); return }
        const a = sel, b = k
        setSel(null)
        const key = [a, b].sort().join('')
        if (key === 'MN' || key === 'KL' || key === 'KM') { setMsg({ ok: false, text: 'Эта линия уже есть 😉' }); return }
        const f = commonFace(a, b)
        if (f) {
            setFace({ face: f, color: FACE_COLOR })
            setSegs((s) => [...s, { id: key, a, b, color: SECT_COLOR }])
            setDone(true)
            showAnswerMeme(true)
            setMsg({ ok: true, text: `Обе точки ${FACE_ON[f]}. Сечение замкнулось!` })
            setTimeout(() => { setFace(null); onSettled?.() }, 1800)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake?.()
            setFace(null)
            const bad: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7' }
            setSegs((s) => [...s, bad])
            setTimeout(() => setSegs((s) => s.filter((x) => x.id !== bad.id)), 1400)
            setMsg({ ok: false, text: `${pickWrongTryPhrase()} Эти точки на разных стенах — так линия пройдёт сквозь комнату` })
        }
    }
    return (
        <>
            <GameHeader title="Замкни сечение 🔗" />
            <TypedBig small text="Последний шаг: соедини две точки, которые лежат на одной стене" onDone={() => setTyped(true)} />
            <CubeSvg faces={face ? [face] : []} points={['M', 'N', 'K', 'L']} segs={segs} selected={sel} fill={done} onPoint={typed && !done ? tap : undefined} />
            {msg && <Msg ok={msg.ok} text={msg.text} />}
            {done && <LocalAnswerConfetti />}
            {done && <TypedBig text="Это и есть сечение! 🎉" readMs={0} />}
        </>
    )
}

const SCENES = [RoomScene, WallTestScene, PointsScene, Rule1PlateScene, Rule1TryScene, Rule2Scene, CloseGameScene]
const SCENE_MAP_LABELS = ['Куб — комната', 'Тест: стены', 'Три точки', 'Правило 1', 'Пробуем правило 1', 'Правило 2', 'Замкни сечение']
const PRACTICE_SCENES = new Set<unknown>([WallTestScene, Rule1TryScene, CloseGameScene])
const NEXT_LABELS = ['Понял, это комната', 'Стены знаю 🧱', 'Интересненько 🤔', 'Давай попробуем 1-ое правило', 'Правило 1 — изи', 'Параллельно, понял!', 'Готово']

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
        color: PRACTICE_SCENES.has(SCENES[i]) ? MAP_PRACTICE_COLOR : MAP_INTRO_COLOR,
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
                <motion.div className="flex-1 flex" initial={false}
                    animate={{ opacity: SCENES[step] === Rule1PlateScene && !stepReady ? 0 : 1, y: SCENES[step] === Rule1PlateScene && !stepReady ? 8 : 0 }}
                    transition={{ duration: SCENES[step] === Rule1PlateScene && !stepReady ? 0 : 0.3 }}>
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {NEXT_LABELS[step]}
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
