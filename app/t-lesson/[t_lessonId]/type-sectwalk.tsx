'use client'

// «Стереометрия» → «Сечение» → «Кубик» (SECTWALK). Сечение куба через три точки — без букв у вершин:
// куб — это комната, у неё потолок, пол и четыре стены (слово «стенка» не используем — просьба пользователя).
//   0. Печать «Представь, что куб — это комната 🏠» → куб рисуется → «У комнаты есть потолок, пол и четыре стены» →
//      пауза 2 с → стены по очереди подсвечиваются с подписью.
//   1. Тест «Кликни на …» по всем шести стенам (тап засчитывается стене, чей центр на рисунке ближе), ответ «Передняя 👍».
//   2. Две точки на потолке, одна на полу, «Задача: провести сечение через эти три точки».
//   3. Шпора: 4 правила (Соединить, Параллельность, Продлить, Проекция) — идём сверху вниз, неработающее зачёркиваем,
//      получилось — снова с первого (стрелка вниз и проход с зачёркиванием). Дальше над рисунком узкая полоска CheatStrip (текущее подсвечено, зачёркнутые — красной чертой).
//   4. (сцена «ПРАВИЛО 1» плашкой убрана — правило видно в полоске шпоры над кубом)
//   5. «Есть ли сейчас плоскость с двумя точками?» — выбор стены, потом ученик сам выбирает две точки (первая пульсирует),
//      линия проводится медленно; «Есть ли ещё…» — вторая стена.
//   6. ПРАВИЛО 2: перенос линии с потолка на пол через точку (на полу — пунктир).
//   7. «Замкни сечение»: две точки на правой стене.
//   8–12. Куб 2 (новые точки E, F, H): правило 1 на потолке → «Работает ли ещё?» Нет → зачёркиваем → «Работает ли 2-е?» Нет →
//      правило 3: продлеваем линию и переднее ребро потолка → точка G вне куба → «В каких плоскостях живёт G?» (две) →
//      снова правило 1: G и H → новая точка Q → Q и E → правило 2 (левая ∥ правой) → R → R и F → сечение-пятиугольник.
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
import { VenetianMask } from 'lucide-react'

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
// Искажение стикера-подписи, чтобы он «лежал» на грани (косая проекция: глубина уходит вправо-вверх под 45°).
// Потолок/пол: строка вдоль ребра, «вверх» текста — в глубину (сжато). Боковые стены: строка уходит в глубину, вертикаль — как есть.
const FACE_LABEL_SKEW: Record<Face, string> = {
    ceiling: 'matrix(1 0 -0.6 0.6 0 0)', floor: 'matrix(1 0 -0.6 0.6 0 0)',
    left: 'matrix(0.7 -0.7 0 1 0 0)', right: 'matrix(0.7 -0.7 0 1 0 0)',
    front: '', back: '',
}
const FACE_INTRO_ORDER: Face[] = ['ceiling', 'floor', 'left', 'right', 'front', 'back']
const FACE_TEST_ORDER: Face[] = ['ceiling', 'floor', 'front', 'back', 'left', 'right']

// Точки сечения.
// Куб 1: две на потолке (M, N), одна на полу (K); L — где линия на полу упирается в ребро.
// Куб 2 (по ТЗ пользователя): E на левом ребре потолка ближе к дальнему углу, F на дальнем ребре потолка ближе к правому,
// H посередине переднего правого вертикального ребра. G — продолжение линии EF до прямой переднего ребра потолка
// (лежит ВНЕ куба), Q — где линия GH пересекает передний левый вертикальный край, R — где линия через H, параллельная QE,
// упирается в дальний правый вертикальный край. Всё посчитано точно: EF ∥ (0.55, 0.4); G = E − 1.5·(F − E).
type PtKey = 'M' | 'N' | 'K' | 'L' | 'E' | 'F' | 'H' | 'G' | 'Q' | 'R'
const PT: Record<PtKey, V3> = {
    M: [1 / 3, 0, 1], N: [1, 0.7, 1], K: [0.6, 0, 0], L: [1, 0.42, 0],
    E: [0, 0.6, 1], F: [0.55, 1, 1], H: [1, 0, 0.5],
    G: [-0.825, 0, 1],
    // Q: G + s·(H − G), x = 0 → s = 0.825/1.825
    Q: [0, 0, 1 - 0.5 * (0.825 / 1.825)],
    // R: H + u·(E − Q), y = 1 → u = 1/0.6; подъём по z = (1 − Q.z)/0.6
    R: [1, 1, 0.5 + (0.5 * (0.825 / 1.825)) / 0.6],
}
// Плоскости точки — по координатам (без границ грани): G вне куба, но на плоскостях потолка и передней стены.
const EPS = 1e-6
const planesOf = (v: V3): Face[] => {
    const f: Face[] = []
    if (Math.abs(v[2] - 1) < EPS) f.push('ceiling')
    if (Math.abs(v[2]) < EPS) f.push('floor')
    if (Math.abs(v[1]) < EPS) f.push('front')
    if (Math.abs(v[1] - 1) < EPS) f.push('back')
    if (Math.abs(v[0]) < EPS) f.push('left')
    if (Math.abs(v[0] - 1) < EPS) f.push('right')
    return f
}
const FACES_OF = Object.fromEntries((Object.keys(PT) as PtKey[]).map((k) => [k, planesOf(PT[k])])) as Record<PtKey, Face[]>
const commonFace = (a: PtKey, b: PtKey) => FACES_OF[a].find((f) => FACES_OF[b].includes(f)) ?? null
// Невидимые грани (смотрим сверху-справа-спереди): линии на них — пунктиром
const HIDDEN_FACES: Face[] = ['left', 'back', 'floor']
const segDash = (a: PtKey, b: PtKey) => { const f = commonFace(a, b); return f && HIDDEN_FACES.includes(f) ? '9 7' : undefined }

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

// slow — линию «проводят» медленно, чтобы было видно, как она рисуется
type Seg = { id: string; a: PtKey; b: PtKey; color: string; dash?: string; instant?: boolean; opacity?: number; slow?: boolean }
type FaceHL = { face: Face; color: string; label?: string }

const CubeSvg = ({ drawIn = false, faces = [], points = [], segs = [], selected = null, glowPts = [], fill = false, fillPts = ['M', 'N', 'L', 'K'], onFace, onPoint, children, dimExcept = null, bounceFaces = false, popKey = {}, wide = false, labels = {} }: {
    drawIn?: boolean; faces?: FaceHL[]; points?: PtKey[]; segs?: Seg[]; selected?: PtKey | null; glowPts?: PtKey[]; fill?: boolean; fillPts?: PtKey[]
    // wide — место слева под точку вне куба (G); labels — подписи у точек
    wide?: boolean; labels?: Partial<Record<PtKey, string>>
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
            <svg ref={ref} viewBox={wide ? '-92 0 422 292' : '0 0 330 292'} className={cn('w-full max-w-[360px] overflow-visible', onFace && 'cursor-pointer')} onClick={handleClick}>
                {fill && (
                    <motion.polygon points={polyPts(fillPts)} fill={hexToRgba(SECT_COLOR, 0.32)} stroke="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
                )}
                {faces.map((h) => {
                    const vs = FACE_POLY[h.face]
                    return (
                        // заливка + края стены по одному: невидимые края (у скрытой вершины) — пунктиром
                        <motion.g key={`${h.face}-${h.color}`} initial={bounceFaces ? { opacity: 0, scale: 0.55 } : { opacity: 0 }} animate={{ opacity: 1, scale: 1 }}
                            transition={bounceFaces ? { type: 'spring', stiffness: 340, damping: 11 } : { duration: 0.4 }}>
                            <polygon points={poly(vs)} fill={hexToRgba(h.color, 0.28)} stroke="none" />
                            {vs.map((a, i) => {
                                const b = vs[(i + 1) % vs.length], A = P(V[a]), B = P(V[b])
                                return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={h.color} strokeWidth={2.5} strokeLinecap="round"
                                    strokeDasharray={hidden(a, b) ? '6 6' : undefined} />
                            })}
                        </motion.g>
                    )
                })}
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
                            {!s.dash && (
                                <motion.line x1={A.x} y1={A.y} stroke={s.color} strokeOpacity={0.3} strokeWidth={13} strokeLinecap="round"
                                    initial={s.instant ? { x2: B.x, y2: B.y } : { x2: A.x, y2: A.y }} animate={{ x2: B.x, y2: B.y }}
                                    transition={{ duration: s.slow ? 1.5 : 0.6, ease: 'easeInOut' }} />
                            )}
                            {/* «прорисовываем» концом линии от A к B (а не pathLength — тот стирает пунктир) */}
                            <motion.line x1={A.x} y1={A.y} stroke={s.color} strokeWidth={5} strokeLinecap="round" strokeDasharray={s.dash}
                                initial={s.instant ? { x2: B.x, y2: B.y } : { x2: A.x, y2: A.y }} animate={{ x2: B.x, y2: B.y }}
                                transition={{ duration: s.slow ? 1.5 : 0.6, ease: 'easeInOut' }} />
                        </motion.g>
                    )
                })}
                {children}
                {faces.filter((h) => h.label).map((h) => {
                    const c = P(FACE_CENTER[h.face])
                    // боковые стены — в две строки (стикер ближе к квадрату и лучше влезает в узкую грань)
                    const lines = h.face === 'left' || h.face === 'right' ? h.label!.split(' ') : [h.label!]
                    const w = Math.round(Math.max(...lines.map((l) => l.length)) * 8.4 + 24)
                    const lh = 18, hgt = lines.length * lh + 10
                    return (
                        // стикер «лежит» на грани: статичный <g> с переносом и искажением, motion.g внутри — только отскок
                        <g key={`lbl-${h.face}`} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) ${FACE_LABEL_SKEW[h.face]}`}>
                            <motion.g initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 13 }}>
                                <rect x={-w / 2} y={-hgt / 2} width={w} height={hgt} rx={9} fill="rgba(22,31,35,0.82)" stroke={h.color} strokeWidth={2} />
                                {lines.map((l, i) => (
                                    <text key={i} x={0} y={(i - (lines.length - 1) / 2) * lh} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={900} fill="#F2F7FB"
                                        style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{l}</text>
                                ))}
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
                                {glowPts.includes(k) && !sel && <circle r={16} fill={hexToRgba(SECT_COLOR, 0.32)} />}
                                {/* выбранная точка — пульсирующее кольцо и сама точка чуть крупнее (CSS: .animate-sel-pulse) */}
                                {sel && <circle r={18} fill={hexToRgba(SECT_COLOR, 0.35)} stroke={SECT_COLOR} strokeWidth={2} className="animate-sel-pulse" />}
                                <circle r={sel ? 9.5 : 7.5} fill={sel ? '#FFFFFF' : SECT_COLOR} stroke={sel ? SECT_COLOR : '#F2F7FB'} strokeWidth={sel ? 3.5 : 2.5} />
                                {labels[k] && (
                                    <text x={0} y={-17} textAnchor="middle" fontSize={17} fontWeight={900} fill={SECT_COLOR}
                                        style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{labels[k]}</text>
                                )}
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
            <CubeSvg faces={hl ? [hl] : []} dimExcept={hl ? hl.face : null} onFace={done ? undefined : tap} />
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
            {phase >= 6 && <TaskLine onDone={() => { go(7); onSettled?.() }} />}
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

// «Задача: провести сечение через эти три •» — вместо слова «точки» рисуем саму точку, как на чертеже
const PointIcon = () => (
    <motion.span className="inline-block align-middle rounded-full" style={{ width: '0.8em', height: '0.8em', backgroundColor: SECT_COLOR, border: '0.14em solid #F2F7FB' }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }} />
)
const TaskLine = ({ onDone }: { onDone?: () => void }) => {
    const [dot, setDot] = useState(false)
    return (
        <div className="w-full text-center font-black text-[#F2F7FB] text-2xl md:text-3xl">
            <Typewriter text="Задача: провести сечение через эти три" onDone={() => { setDot(true); setTimeout(() => onDone?.(), 700) }} />
            {dot && <>{' '}<PointIcon /></>}
        </div>
    )
}

// ===== Шпора: 4 правила сечения =====
// Идём сверху вниз: правило не работает — зачёркиваем и смотрим следующее; получилось — снова с первого.
const RULES = [
    { n: 1, short: 'Соединить', long: 'Две точки в одной плоскости — соединяем' },
    { n: 2, short: 'Параллель­ность', long: 'На параллельной стене — параллельная линия' },
    { n: 3, short: 'Продлить', long: 'Продлеваем линию до пересечения с продолжением ребра' },
    { n: 4, short: 'Проекция', long: 'Опускаем перпендикуляр на плоскость' },
]

// «Шпора» — тёмная таинственная плашка: тень, маска, дым вокруг (клубы — радиальные градиенты, двигаем только transform/opacity).
const SMOKE = [
    { l: '-14%', t: '-60%', w: 70, d: 0 }, { l: '62%', t: '-55%', w: 80, d: 1.3 },
    { l: '-8%', t: '35%', w: 64, d: 2.1 }, { l: '70%', t: '30%', w: 72, d: 0.7 },
]
const ShporaBadge = () => (
    <div className="w-full flex justify-center">
        <div className="relative">
            {SMOKE.map((sm, i) => (
                <span key={i} className="absolute rounded-full pointer-events-none animate-smoke-drift"
                    style={{ left: sm.l, top: sm.t, width: sm.w, height: sm.w * 0.62, animationDelay: `${sm.d}s`,
                        background: 'radial-gradient(closest-side, rgba(176,188,202,0.42), rgba(176,188,202,0.16) 55%, rgba(176,188,202,0) 100%)' }} />
            ))}
            <div className="relative flex items-center gap-2 rounded-2xl px-4 py-1.5 border"
                style={{ background: 'linear-gradient(135deg, #07090B 0%, #1A2228 55%, #0B0F12 100%)', borderColor: 'rgba(160,172,186,0.28)',
                    boxShadow: '0 0 18px rgba(0,0,0,0.65), inset 0 0 12px rgba(150,165,180,0.08)' }}>
                <VenetianMask className="w-5 h-5" style={{ color: '#AEB9C4' }} />
                <span className="font-black tracking-[0.3em] text-sm" style={{ color: '#C9D3DC', textShadow: '0 0 8px rgba(190,205,220,0.35)' }}>ШПОРА</span>
            </div>
        </div>
    </div>
)

// Мини-анимации правил (зациклены). Цикл ~2.6 с, всё на transform/opacity и концах линий.
const ICON_CYCLE = 2.6
const loop = (times: number[]) => ({ duration: ICON_CYCLE, times, repeat: Infinity, ease: 'easeOut' as const })
const Dot = ({ cx, cy, scale, times }: { cx: number; cy: number; scale: number[]; times: number[] }) => (
    <g transform={`translate(${cx} ${cy})`}>
        <motion.circle r={4} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={1.5} initial={{ scale: 0 }} animate={{ scale }} transition={loop(times)} />
    </g>
)
const RuleIcon = ({ n }: { n: number }) => {
    return (
        <svg viewBox="0 0 60 40" className="w-[60px] h-[40px] overflow-visible">
            {n === 1 && (
                <>
                    {/* две точки по диагонали (как «двойка» на кубике): левая нижняя, правая верхняя, потом линия */}
                    <motion.line x1={12} y1={30} stroke={SECT_COLOR} strokeWidth={3} strokeLinecap="round"
                        initial={{ x2: 12, y2: 30, opacity: 0 }} animate={{ x2: [12, 12, 12, 48, 48, 48], y2: [30, 30, 30, 10, 10, 10], opacity: [0, 0, 1, 1, 1, 0] }}
                        transition={loop([0, 0.36, 0.4, 0.72, 0.92, 1])} />
                    <Dot cx={12} cy={30} scale={[0, 1.4, 1, 1, 1, 0]} times={[0, 0.1, 0.18, 0.8, 0.92, 1]} />
                    <Dot cx={48} cy={10} scale={[0, 0, 1.4, 1, 1, 0]} times={[0, 0.18, 0.28, 0.36, 0.92, 1]} />
                </>
            )}
            {n === 2 && (
                <>
                    {/* сверху линия между двумя точками, её пунктирная копия съезжает к нижней точке, из неё идёт линия */}
                    <line x1={10} y1={9} x2={40} y2={9} stroke={SECT_COLOR} strokeWidth={3} strokeLinecap="round" />
                    <circle cx={10} cy={9} r={4} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={1.5} />
                    <circle cx={40} cy={9} r={4} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={1.5} />
                    <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: [0, 0, 8, 8, 8], y: [0, 0, 22, 22, 22], opacity: [0, 1, 1, 0, 0] }}
                        transition={loop([0, 0.1, 0.45, 0.55, 1])}>
                        <line x1={10} y1={9} x2={40} y2={9} stroke={SECT_COLOR} strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
                    </motion.g>
                    <motion.line x1={18} y1={31} stroke={SECT_COLOR} strokeWidth={3} strokeLinecap="round" strokeDasharray="5 3"
                        initial={{ x2: 18, opacity: 0 }} animate={{ x2: [18, 18, 48, 48, 48], y2: [31, 31, 31, 31, 31], opacity: [0, 1, 1, 1, 0] }}
                        transition={loop([0, 0.5, 0.78, 0.92, 1])} />
                    <circle cx={18} cy={31} r={4} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={1.5} />
                </>
            )}
            {n === 4 && (
                <>
                    {/* проекция: точка с отскоком, от неё пунктир вниз, внизу перпендикуляр (значок прямого угла) и точка-основание */}
                    <line x1={8} y1={34} x2={52} y2={34} stroke={EDGE} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
                    <motion.line x1={30} y1={6} x2={30} stroke={SECT_COLOR} strokeWidth={2.5} strokeDasharray="4 3" strokeLinecap="round"
                        initial={{ y2: 6, opacity: 0 }} animate={{ y2: [6, 6, 34, 34, 34], opacity: [0, 1, 1, 1, 0] }}
                        transition={loop([0, 0.22, 0.55, 0.9, 1])} />
                    <motion.path d="M30 27 L37 27 L37 34" fill="none" stroke="#F2F7FB" strokeWidth={1.8} strokeLinejoin="round"
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={loop([0, 0.55, 0.62, 0.9, 1])} />
                    <Dot cx={30} cy={6} scale={[0, 1.5, 1, 1, 0]} times={[0, 0.1, 0.2, 0.9, 1]} />
                    <Dot cx={30} cy={34} scale={[0, 0, 1.5, 1, 0]} times={[0, 0.55, 0.65, 0.9, 1]} />
                </>
            )}
            {n === 3 && (
                <>
                    {/* линия между точками продлевается пунктиром до прямой ребра — там новая точка */}
                    <line x1={46} y1={1} x2={46} y2={39} stroke={EDGE} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
                    <line x1={8} y1={33} x2={24} y2={21} stroke={SECT_COLOR} strokeWidth={3} strokeLinecap="round" />
                    <circle cx={8} cy={33} r={4} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={1.5} />
                    <circle cx={24} cy={21} r={4} fill={SECT_COLOR} stroke="#F2F7FB" strokeWidth={1.5} />
                    <motion.line x1={24} y1={21} stroke={SECT_COLOR} strokeWidth={2.5} strokeDasharray="4 3" strokeLinecap="round"
                        initial={{ x2: 24, y2: 21, opacity: 0 }} animate={{ x2: [24, 24, 46, 46, 46], y2: [21, 21, 4.5, 4.5, 4.5], opacity: [0, 1, 1, 1, 0] }}
                        transition={loop([0, 0.12, 0.55, 0.9, 1])} />
                    <Dot cx={46} cy={4.5} scale={[0, 0, 1.5, 1, 0]} times={[0, 0.55, 0.65, 0.9, 1]} />
                </>
            )}
        </svg>
    )
}

// Узкая полоска над рисунком: текущее правило подсвечено, неработающие зачёркнуты.
const CheatStrip = ({ active, crossed = [] }: { active: number | null; crossed?: number[] }) => (
    <div className="relative w-full" aria-label="Шпора: 4 правила">
        {/* просто подпись «ШПОРА» сверху (с лёгким дымком, как у большой плашки), без внешней рамки */}
        <div className="relative flex items-center justify-center gap-1 pb-1">
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 w-28 h-7 rounded-full pointer-events-none animate-smoke-drift"
                style={{ background: 'radial-gradient(closest-side, rgba(176,188,202,0.22), rgba(176,188,202,0) 100%)' }} />
            <VenetianMask className="relative w-3.5 h-3.5" style={{ color: '#AEB9C4' }} />
            <span className="relative font-black tracking-[0.3em] text-[10px]" style={{ color: '#C9D3DC', textShadow: '0 0 6px rgba(190,205,220,0.35)' }}>ШПОРА</span>
        </div>
        <div className="relative grid grid-cols-4 gap-1.5">
            {RULES.map((r) => {
                const isOn = active === r.n, isX = crossed.includes(r.n)
                // пока смотрим на одно правило — остальные бледные целиком (и рамка, и текст)
                const faded = active !== null && !isOn
                return (
                    <motion.div key={r.n} className="relative rounded-lg border-2 px-1 py-1 text-center flex flex-col justify-center"
                        // зачёркнутое бледнеет после того, как дорисован крестик
                        animate={{ opacity: isX ? 0.4 : faded ? 0.38 : 1, scale: isOn ? 1.06 : 1 }}
                        transition={{ opacity: { delay: isX ? 0.75 : 0, duration: 0.4 }, scale: { type: 'spring', stiffness: 300, damping: 18 } }}
                        style={{ borderColor: isOn ? SECT_COLOR : '#3A464E', backgroundColor: isOn ? hexToRgba(SECT_COLOR, 0.18) : '#161F23' }}>
                        <div className="text-[10px] font-black leading-none flex items-center justify-center gap-0.5" style={{ color: isOn ? SECT_COLOR : MUTED }}>
                            {r.n}
                        </div>
                        <div className="text-[10px] md:text-xs font-black leading-tight hyphens-manual break-words"
                            style={{ color: faded ? MUTED : '#F2F7FB' }}>{r.short}</div>
                        {isX && <CrossX />}
                    </motion.div>
                )
            })}
        </div>
    </div>
)
// Крестик из двух диагоналей, рисуются по очереди
const CrossX = () => (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {/* растём концами линий: pathLength в растянутом viewBox с non-scaling-stroke рисовал линию с разрывами */}
        <motion.line x1={6} y1={10} stroke={WRONG_COLOR} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke"
            initial={{ x2: 6, y2: 10 }} animate={{ x2: 94, y2: 90 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
        <motion.line x1={94} y1={10} stroke={WRONG_COLOR} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke"
            initial={{ x2: 94, y2: 10 }} animate={{ x2: 6, y2: 90 }} transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }} />
    </svg>
)

// Строка правила: номер с отскоком → мини-анимация (один цикл) → текст.
const RuleRow = ({ r, onReady, state }: { r: typeof RULES[number]; onReady?: () => void; state: 'normal' | 'on' | 'dim' | 'crossed' }) => {
    const [textOn, setTextOn] = useState(false)
    useEffect(() => {
        // номер → один цикл анимации → текст → пауза 2 с → следующее правило
        const t = setTimeout(() => { setTextOn(true); setTimeout(() => onReady?.(), 2000) }, ICON_CYCLE * 1000)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const on = state === 'on'
    return (
        <motion.div className="relative flex items-center gap-2 rounded-xl border-2 px-2 py-1.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: state === 'dim' ? 0.28 : state === 'crossed' ? 0.35 : 1, x: 0, scale: on ? [1, 1.12, 0.97, 1] : 1 }}
            transition={{ opacity: { duration: 0.4, delay: state === 'crossed' ? 0.75 : 0 }, x: { type: 'spring', stiffness: 320, damping: 20 }, scale: { duration: 0.5 } }}
            style={{ borderColor: on ? SECT_COLOR : '#3A464E', backgroundColor: on ? hexToRgba(SECT_COLOR, 0.14) : '#161F23' }}>
            <motion.span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-black text-sm"
                initial={{ scale: 2.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}
                style={{ backgroundColor: hexToRgba(SECT_COLOR, 0.25), color: SECT_COLOR }}>{r.n}</motion.span>
            <div className="shrink-0"><RuleIcon n={r.n} /></div>
            <div className="min-w-0 text-left">
                {textOn && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="font-black text-[#F2F7FB] leading-tight">{r.short.replace('­', '')}</div>
                        <div className="text-xs md:text-sm font-bold leading-snug" style={{ color: MUTED }}>{r.long}</div>
                    </motion.div>
                )}
            </div>
            {state === 'crossed' && <CrossX />}
        </motion.div>
    )
}

// Сцена шпоры: «Для сечения 4 правила» → правила по одному → «Идём по ним сверху вниз» → жирная стрелка вниз →
// по очереди: правило ярко, остальные бледные → зачёркиваем → следующее с отскоком … до проекции → все снова обычные.
const CheatIntroScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0) // 0 печать, 1 правила, 2 «идём сверху вниз», 3 стрелка, 6 «если не работает…», 4 проход, 5 конец
    const [rows, setRows] = useState(0)
    const [cur, setCur] = useState(-1) // текущее в проходе
    const [crossing, setCrossing] = useState(false) // текущее уже зачёркиваем, следующее ещё не показываем
    useEffect(() => {
        // после стрелки ждём кнопку «Ага, идём последовательно» (фаза 7), потом объяснение (6) и только потом проход (4)
        if (phase === 3) { const t = setTimeout(() => setPhase(7), 1300); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    useEffect(() => {
        if (phase !== 4 || cur < 0) return
        // сначала зачёркиваем текущее (крестик ~0,7 с), и только потом с отскоком появляется следующее
        if (crossing) {
            const t = setTimeout(() => { setCrossing(false); setCur(cur + 1) }, 1000)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => {
            if (cur + 1 < RULES.length) setCrossing(true)
            else { setPhase(5); setCur(-1); setTimeout(() => onSettled?.(), 900) }
        }, cur === RULES.length - 1 ? 1500 : 1900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, cur, crossing])
    const stateOf = (i: number): 'normal' | 'on' | 'dim' | 'crossed' => {
        if (phase !== 4) return 'normal'
        if (i === cur) return crossing ? 'crossed' : 'on'
        if (i < cur) return 'crossed'
        return 'dim'
    }
    return (
        <>
            <ShporaBadge />
            <TypedBig small text="Для сечения 4 правила:" onDone={() => { setPhase(1); setRows(1) }} />
            {/* слева — место под стрелку «сверху вниз», чтобы она не закрывала номера правил */}
            <div className="relative w-full flex flex-col gap-2 pl-7">
                {RULES.slice(0, rows).map((r, i) => (
                    <RuleRow key={r.n} r={r} state={stateOf(i)}
                        onReady={() => { if (i + 1 < RULES.length) setRows((n) => Math.max(n, i + 2)); else setPhase((p) => Math.max(p, 2)) }} />
                ))}
                {phase >= 3 && <DownArrow />}
            </div>
            {phase >= 2 && <TypedBig small text="Идём по правилам сверху вниз" onDone={() => setPhase((p) => (p === 2 ? 3 : p))} readMs={200} />}
            {phase === 7 && <NextBtn onClick={() => setPhase(6)}>Принял, идём последовательно</NextBtn>}
            {(phase === 6 || phase === 4 || phase === 5) && (
                <TypedBig small text="Если правило не работает — вычёркиваем и смотрим следующее. И всегда начинаем с правила 1"
                    onDone={() => { setPhase((p) => (p === 6 ? 4 : p)); setCur((c) => (c < 0 ? 0 : c)) }} readMs={2000} />
            )}
        </>
    )
}
const HIGHLIGHT_ARROW = '#F2C35B'
// Стрелка «сверху вниз»: золотой градиент, мягкое свечение, сужающееся древко и залитый наконечник. Растёт концом,
// наконечник появляется с отскоком. Высоту берём реальную (ResizeObserver) — viewBox без растяжения, ничего не искажается.
const DownArrow = () => {
    const ref = useRef<HTMLDivElement>(null)
    const [h, setH] = useState(0)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(() => setH(el.getBoundingClientRect().height))
        ro.observe(el)
        setH(el.getBoundingClientRect().height)
        return () => ro.disconnect()
    }, [])
    const end = Math.max(0, h - 22)
    return (
        <div ref={ref} className="absolute left-0 top-0 h-full w-6 pointer-events-none">
            {h > 0 && (
                <svg width={24} height={h} viewBox={`0 0 24 ${h}`} className="overflow-visible">
                    <defs>
                        <linearGradient id="shporaArrow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FFE7A3" />
                            <stop offset="55%" stopColor={HIGHLIGHT_ARROW} />
                            <stop offset="100%" stopColor="#D9932B" />
                        </linearGradient>
                    </defs>
                    {/* мягкое свечение под древком */}
                    <motion.line x1={12} y1={6} x2={12} stroke={HIGHLIGHT_ARROW} strokeOpacity={0.22} strokeWidth={14} strokeLinecap="round"
                        initial={{ y2: 6 }} animate={{ y2: end }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
                    {/* древко: тонко сверху, толще к низу */}
                    <motion.polygon fill="url(#shporaArrow)"
                        initial={{ points: `11,4 13,4 13,6 11,6` }} animate={{ points: `11,4 13,4 15,${end} 9,${end}` }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
                    <g transform={`translate(12 ${end})`}>
                        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.85, type: 'spring', stiffness: 420, damping: 11 }}>
                            <polygon points="-11,-4 11,-4 0,18" fill="url(#shporaArrow)" stroke="#FFF1C7" strokeWidth={1.5} strokeLinejoin="round" />
                        </motion.g>
                    </g>
                </svg>
            )}
        </div>
    )
}

// Выбор пары точек тапами: первая точка пульсирует, вторая — проверяем пару.
function usePairPick(enabled: boolean, onPair: (a: PtKey, b: PtKey) => void) {
    const [sel, setSel] = useState<PtKey | null>(null)
    const tap = (k: PtKey) => {
        if (!enabled) return
        if (sel === null || sel === k) { setSel(sel === k ? null : k); return }
        const a = sel
        setSel(null)
        onPair(a, k)
    }
    return { sel, tap, clear: () => setSel(null) }
}
const pairKey = (a: PtKey, b: PtKey) => [a, b].sort().join('')
const badPair = (onMistake?: () => void) => { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake?.() }
const SegsWithBad = (segs: Seg[], bad: Seg | null) => (bad ? [...segs, bad] : segs)

// Кнопки «какая стена» для вопросов «Есть ли плоскость с двумя точками?»
const OPTION_ORDER: Face[] = ['ceiling', 'floor', 'left', 'right', 'front', 'back']
const FaceOptions = ({ wrong, used = [], onPick }: { wrong: Face[]; used?: Face[]; onPick: (f: Face) => void }) => (
    <div className="drop-in-options grid grid-cols-3 gap-2 w-full">
        {OPTION_ORDER.map((f) => {
            const isWrong = wrong.includes(f), isUsed = used.includes(f)
            return (
                <button key={f} type="button" disabled={isWrong || isUsed} onClick={() => onPick(f)}
                    className={cn('min-h-[50px] rounded-xl border-2 border-b-4 text-base md:text-lg font-black transition-colors px-1',
                        isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                            : isUsed ? 'border-[#3A464E] bg-[#161F23] text-[#5C6B73]'
                                : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                    {FACE_SHORT[f]}{isUsed ? ' ✓' : ''}
                </button>
            )
        })}
    </div>
)
const YesNo = ({ wrong, onPick }: { wrong: string[]; onPick: (v: 'yes' | 'no') => void }) => (
    <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
        {(['yes', 'no'] as const).map((v) => (
            <button key={v} type="button" disabled={wrong.includes(v)} onClick={() => onPick(v)}
                className={cn('min-h-[52px] rounded-xl border-2 border-b-4 text-lg font-black',
                    wrong.includes(v) ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                {v === 'yes' ? 'Да' : 'Нет'}
            </button>
        ))}
    </div>
)
const NextBtn = ({ onClick, children, small }: { onClick: () => void; children: React.ReactNode; small?: boolean }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={{ ...walkthroughButtonStyle(true), ...(small ? { fontSize: 15 } : {}) }}>{children}</button>
    </motion.div>
)

// ===== Сцена 5: пробуем правило 1 — «Есть ли плоскость с двумя точками?» =====
// Подходят потолок и передняя стена. Выбрал стену → она с отскоком подсвечивается, остальные рёбра бледнеют →
// «Выбери точки, которые можно соединить» → ученик сам тапает две точки, линия проводится медленно.
const PAIR_FACES: Face[] = ['ceiling', 'front']
const SEG_OF: Partial<Record<Face, Seg>> = {
    ceiling: { id: 'MN', a: 'M', b: 'N', color: SECT_COLOR },
    front: { id: 'KM', a: 'M', b: 'K', color: SECT_COLOR },
}
const CUBE1_PTS: PtKey[] = ['M', 'N', 'K']
const ptsOn = (f: Face, pool: PtKey[]) => pool.filter((k) => FACES_OF[k].includes(f))

const Rule1TryScene = ({ onSettled, onMistake }: SceneProps) => {
    const [ready, setReady] = useState(false) // пауза 1 с после куба
    const [round, setRound] = useState(0)
    const [typed, setTyped] = useState(false)
    const [done, setDone] = useState<Face[]>([])
    const [active, setActive] = useState<Face | null>(null)
    const [stage, setStage] = useState(0) // 1 стена, 2 бледные рёбра, 3 «выбери точки», 4 линия проводится, 5 кнопка
    const [wrong, setWrong] = useState<Face[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [bad, setBad] = useState<Seg | null>(null)
    // линию ведём от точки, выбранной первой, ко второй
    const [order, setOrder] = useState<Partial<Record<Face, [PtKey, PtKey]>>>({})
    useEffect(() => {
        if (!active) return
        const delays: Record<number, number> = { 1: 700, 2: 500, 4: 1800 }
        const ms = delays[stage]
        if (ms === undefined) return
        const t = setTimeout(() => {
            const next = stage + 1
            setStage(next)
            if (next === 5 && round === 1) onSettled?.()
        }, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, active])
    const { sel, tap } = usePairPick(!!active && stage === 3, (a, b) => {
        const want = SEG_OF[active!]!
        if (pairKey(a, b) === pairKey(want.a, want.b)) { showAnswerMeme(true); setFlash(null); setOrder((o) => ({ ...o, [active!]: [a, b] })); setStage(4); return }
        badPair(onMistake)
        const f = commonFace(a, b)
        setFlash(f ? `${pickWrongTryPhrase()} Эти точки ${FACE_ON[f]}, а мы смотрим ${FACE_ON[active!]}` : `${pickWrongTryPhrase()} Эти точки на разных стенах`)
        const b2: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7', instant: true }
        setBad(b2); setTimeout(() => setBad(null), 1200)
    })
    const pick = (f: Face) => {
        if (!typed || active || wrong.includes(f) || done.includes(f)) return
        if (PAIR_FACES.includes(f)) { showAnswerMeme(true); setFlash(null); setActive(f); setStage(1); return }
        badPair(onMistake)
        setWrong((w) => [...w, f])
        const n = ptsOn(f, CUBE1_PTS).length
        setFlash(`${pickWrongTryPhrase()} ${FACE_ON[f][0].toUpperCase()}${FACE_ON[f].slice(1)} ${n === 0 ? 'нет ни одной точки' : 'только одна точка'}`)
    }
    const nextRound = () => {
        if (!active) return
        setDone((d) => [...d, active]); setActive(null); setStage(0); setWrong([]); setFlash(null); setTyped(false); setRound(1)
    }
    const segOf = (f: Face): Seg => { const o = order[f]; return o ? { ...SEG_OF[f]!, a: o[0], b: o[1] } : SEG_OF[f]! }
    const segs: Seg[] = SegsWithBad([...done.map((f) => ({ ...segOf(f), instant: true })), ...(active && stage >= 4 ? [{ ...segOf(active), slow: true }] : [])], bad)
    return (
        <>
            <CheatStrip active={1} />
            <DiagramBlock onSettled={() => setTimeout(() => setReady(true), 1000)}>
                <CubeSvg points={CUBE1_PTS} segs={segs} faces={active && stage >= 1 ? [{ face: active, color: FACE_COLOR }] : []} bounceFaces
                    dimExcept={active && stage >= 2 ? active : null} selected={sel} onPoint={active && stage === 3 ? tap : undefined} />
            </DiagramBlock>
            {ready && !active && (
                <TypedBig key={`q-${round}`} small text={round === 0 ? 'Есть ли сейчас плоскость с двумя точками?' : 'Есть ли ещё плоскость с двумя точками?'} onDone={() => setTyped(true)} readMs={0} />
            )}
            {ready && typed && !active && <FaceOptions wrong={wrong} used={done} onPick={pick} />}
            {active && stage >= 3 && <TypedBig key={`pick-${round}`} small text="Выбери точки, которые можно соединить" readMs={0} />}
            {flash && <Msg ok={false} text={flash} />}
            {active && stage >= 4 && <LocalAnswerConfetti />}
            {active && stage >= 5 && round === 0 && <NextBtn small onClick={nextRound}>Готово. Соединили {FACE_ON[active]}</NextBtn>}
        </>
    )
}

// ===== Сцена 6: правило 2 «Параллельность» =====
// 0 «Можем ли снова воспользоваться правилом 1?» → Нет → 1 крестик на правиле 1 → 2 переходим к правилу 2 (плашка) →
// 3 потолок, 4 пол с отскоком → 5 «Потолок и пол параллельны.» → 6 «Вижу, они параллельны» → 7 «На потолке есть линия.» →
// 8 линия выделяется → 9 пунктирная копия ездит с потолка на пол по кругу + кнопка «Параллельно переносим» →
// 10 линия на полу пунктиром → 11 новая точка → 12 чертёж бледнеет, шпора возвращается на правило 1 →
// 13 чертёж обратно, «Есть ли теперь точки в одной плоскости?» → Да.
const HIGHLIGHT = '#F2C35B'
const Rule2Scene = ({ onSettled, onMistake }: SceneProps) => {
    const { phase, go } = usePhaseState()
    useChain({ 1: 1500, 3: 750, 4: 900, 8: 1600, 10: 1800 }, phase, go)
    const [typed, setTyped] = useState(false)
    const [wrong, setWrong] = useState<string[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    useEffect(() => { setTyped(false) }, [phase])
    const M = P(PT.M), N = P(PT.N), K = P(PT.K)
    const dx = K.x - M.x, dy = K.y - M.y
    const ceil: FaceHL = { face: 'ceiling', color: FACE_COLOR }, floor: FaceHL = { face: 'floor', color: FACE_COLOR }
    const faces: FaceHL[] = phase === 3 ? [ceil]
        : phase >= 4 && phase <= 6 ? [ceil, floor]
            : phase === 7 || phase === 8 ? [ceil]
                : phase === 9 || phase === 10 ? [ceil, floor] : []
    const strip = phase === 0 ? { active: 1, crossed: [] as number[] }
        : phase === 1 ? { active: 1, crossed: [1] }
            : phase <= 11 ? { active: 2, crossed: [1] } : { active: 1, crossed: [] as number[] }
    const prompt = phase === 0 ? 'Можем ли снова воспользоваться правилом 1? Есть ли точки в одной плоскости?'
            : phase === 7 || phase === 8 ? 'На потолке есть линия.'
                : phase === 9 ? 'Переносим эту линию параллельно — через точку на полу'
                    : phase === 11 ? 'Линия упёрлась в ребро: тут новая точка 📍'
                        : phase === 12 ? 'Получилось! Значит снова с правила 1'
                            : phase >= 13 ? 'Есть ли теперь точки в одной плоскости?' : null
    const answer1 = (v: 'yes' | 'no') => {
        if (!typed) return
        if (v === 'no') { showAnswerMeme(true); setFlash(null); go(1); return }
        badPair(onMistake); setWrong(['yes'])
        setFlash(`${pickWrongTryPhrase()} На потолке и передней стене уже соединили, а на остальных стенах по одной точке`)
    }
    const answer2 = (v: 'yes' | 'no') => {
        if (!typed || phase !== 13) return
        if (v === 'yes') { showAnswerMeme(true); setFlash(null); go(14); onSettled?.(); return }
        badPair(onMistake); setWrong((w) => [...w, 'no2'])
        setFlash(`${pickWrongTryPhrase()} Посмотри на правую стену: там теперь две точки`)
    }
    return (
        <>
            <CheatStrip active={strip.active} crossed={strip.crossed} />
            {/* без плашки «ПРАВИЛО 2»: просто пишем над кубом, потом с отскоком потолок и пол */}
            {phase >= 2 && phase <= 6 && <TypedBig small text="Потолок и пол параллельны" onDone={() => go(3)} readMs={300} />}
            <motion.div className="w-full" initial={false} animate={{ opacity: phase === 12 ? 0.18 : 1 }} transition={{ duration: 0.6 }}>
                <CubeSvg faces={faces} bounceFaces dimExcept={phase === 7 || phase === 8 ? 'ceiling' : null}
                    points={phase >= 11 ? ['M', 'N', 'K', 'L'] : ['M', 'N', 'K']}
                    segs={[{ id: 'MN', a: 'M', b: 'N', color: SECT_COLOR, instant: true }, { id: 'KM', a: 'M', b: 'K', color: SECT_COLOR, instant: true, opacity: phase >= 2 && phase <= 11 ? 0.18 : 1 },
                        ...(phase >= 10 ? [{ id: 'KL', a: 'K' as PtKey, b: 'L' as PtKey, color: SECT_COLOR, dash: '9 7', slow: true }] : [])]}
                    glowPts={phase === 11 ? ['L'] : []}>
                    {phase === 8 && (
                        // выделение линии на потолке: жёлтое свечение + белая середина с отскоком
                        <g>
                            <motion.line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke={HIGHLIGHT} strokeLinecap="round"
                                initial={{ strokeWidth: 4, opacity: 0 }} animate={{ strokeWidth: [4, 30, 20, 24], opacity: [0, 0.75, 0.5, 0.6] }}
                                transition={{ duration: 1, ease: 'easeOut' }} />
                            <motion.line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke="#FFFFFF" strokeLinecap="round"
                                initial={{ strokeWidth: 3 }} animate={{ strokeWidth: [3, 10, 5, 7] }} transition={{ duration: 1, ease: 'easeOut' }} />
                        </g>
                    )}
                    {phase === 9 && (
                        // копия линии ездит с потолка на пол снова и снова, пока не нажмут «Параллельно переносим»
                        <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: [0, dx, dx], y: [0, dy, dy], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, times: [0, 0.7, 1], ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 }}>
                            <line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                        </motion.g>
                    )}
                </CubeSvg>
            </motion.div>
            {prompt && <TypedBig key={`p-${phase}`} small text={prompt} readMs={0}
                onDone={() => { setTyped(true); if (phase === 7) go(8); if (phase === 11) setTimeout(() => go(12), 900); if (phase === 12) setTimeout(() => go(13), 900) }} />}
            {phase === 0 && typed && <YesNo wrong={wrong} onPick={answer1} />}
            {phase === 1 && <Msg ok text="Правило 1 не работает — зачёркиваем ✗" />}
            {(phase === 5 || phase === 6) && <NextBtn onClick={() => go(7)}>Вижу, они параллельны</NextBtn>}
            {phase === 9 && typed && <NextBtn onClick={() => go(10)}>Параллельно переносим</NextBtn>}
            {phase === 13 && typed && <YesNo wrong={wrong.filter((w) => w === 'no2').map(() => 'no')} onPick={answer2} />}
            {flash && (phase === 0 || phase === 13) && <Msg ok={false} text={flash} />}
        </>
    )
}

// ===== Сцена 7: замкни сечение =====
// Уже есть линии на потолке, передней стене и полу; осталось соединить две точки на правой стене.
const CloseGameScene = ({ onSettled, onMistake }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const [segs, setSegs] = useState<Seg[]>([
        { id: 'MN', a: 'M', b: 'N', color: SECT_COLOR, instant: true },
        { id: 'KM', a: 'M', b: 'K', color: SECT_COLOR, instant: true },
        { id: 'KL', a: 'K', b: 'L', color: SECT_COLOR, instant: true, dash: '9 7' },
    ])
    const [face, setFace] = useState<FaceHL | null>(null)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [done, setDone] = useState(false)
    const [fill, setFill] = useState(false)
    const { sel, tap } = usePairPick(typed && !done, (a, b) => {
        const key = pairKey(a, b)
        if (key === 'MN' || key === 'KL' || key === 'KM') { setMsg({ ok: false, text: 'Эта линия уже есть 😉' }); return }
        const f = commonFace(a, b)
        if (f) {
            setFace({ face: f, color: FACE_COLOR })
            setSegs((s) => [...s, { id: key, a, b, color: SECT_COLOR, slow: true, dash: segDash(a, b) }])
            setDone(true)
            showAnswerMeme(true)
            setMsg({ ok: true, text: `Обе точки ${FACE_ON[f]}. Сечение замкнулось!` })
            setTimeout(() => { setFace(null); setFill(true); onSettled?.() }, 1900)
        } else {
            badPair(onMistake)
            setFace(null)
            const bad: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7', instant: true }
            setSegs((s) => [...s, bad])
            setTimeout(() => setSegs((s) => s.filter((x) => x.id !== bad.id)), 1400)
            setMsg({ ok: false, text: `${pickWrongTryPhrase()} Эти точки на разных стенах — так линия пройдёт сквозь комнату` })
        }
    })
    return (
        <>
            <CheatStrip active={1} />
            <GameHeader title="Замкни сечение 🔗" />
            <TypedBig small text="Соедини две точки, которые лежат в одной плоскости" onDone={() => setTyped(true)} />
            <CubeSvg faces={face ? [face] : []} points={['M', 'N', 'K', 'L']} segs={segs} selected={sel} fill={fill} onPoint={typed && !done ? tap : undefined} />
            {msg && <Msg ok={msg.ok} text={msg.text} />}
            {fill && <LocalAnswerConfetti />}
            {fill && <TypedBig text="Это и есть сечение! 🎉" readMs={0} />}
        </>
    )
}

// ===== Куб 2: новое сечение =====
const CUBE2_PTS: PtKey[] = ['E', 'F', 'H']
const SEG_EF: Seg = { id: 'EF', a: 'E', b: 'F', color: SECT_COLOR, instant: true }
const G_LABEL = { G: 'G' } as Partial<Record<PtKey, string>>

const C2TaskScene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const [n, setN] = useState(0)
    useEffect(() => {
        if (phase !== 2) return
        let i = 0
        const id = setInterval(() => { i += 1; setN(i); if (i >= 3) { clearInterval(id); setTimeout(() => setPhase(3), 700) } }, 600)
        return () => clearInterval(id)
    }, [phase])
    return (
        <>
            <TypedBig text="Новое сечение! 🔥" onDone={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1300)}>
                    <CubeSvg drawIn points={CUBE2_PTS.slice(0, n)} />
                </DiagramBlock>
            )}
            {phase >= 3 && <TaskLine onDone={() => onSettled?.()} />}
        </>
    )
}

// Правило 1 на новом кубе: потолок → ученик соединяет точки → «Работает ли 1-е правило ещё?» → Нет → вычёркиваем.
const C2Rule1Scene = ({ onSettled, onMistake }: SceneProps) => {
    const [step, setStep] = useState(0) // 0 вопрос стены, 1 стена, 2 «выбери точки», 3 линия, 4 «работает ещё?», 5 вычеркнули
    const [typed, setTyped] = useState(false)
    const [wrong, setWrong] = useState<Face[]>([])
    const [wrongYN, setWrongYN] = useState<string[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [bad, setBad] = useState<Seg | null>(null)
    useEffect(() => {
        const t = step === 1 ? setTimeout(() => setStep(2), 1100) : step === 3 ? setTimeout(() => { setStep(4); setTyped(false) }, 1900) : step === 5 ? setTimeout(() => onSettled?.(), 900) : null
        return () => { if (t) clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])
    const { sel, tap } = usePairPick(step === 2, (a, b) => {
        if (pairKey(a, b) === 'EF') { showAnswerMeme(true); setFlash(null); setStep(3); return }
        badPair(onMistake)
        setFlash(`${pickWrongTryPhrase()} Нужны две точки на потолке`)
        const b2: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7', instant: true }
        setBad(b2); setTimeout(() => setBad(null), 1200)
    })
    const pickFace = (f: Face) => {
        if (!typed || step !== 0 || wrong.includes(f)) return
        if (f === 'ceiling') { showAnswerMeme(true); setFlash(null); setStep(1); return }
        badPair(onMistake); setWrong((w) => [...w, f])
        const k = ptsOn(f, CUBE2_PTS).length
        setFlash(`${pickWrongTryPhrase()} ${FACE_ON[f][0].toUpperCase()}${FACE_ON[f].slice(1)} ${k === 0 ? 'нет ни одной точки' : 'только одна точка'}`)
    }
    const pickYN = (v: 'yes' | 'no') => {
        if (step !== 4 || !typed) return
        if (v === 'no') { showAnswerMeme(true); setFlash(null); setStep(5); return }
        badPair(onMistake); setWrongYN(['yes'])
        setFlash(`${pickWrongTryPhrase()} Других плоскостей с двумя точками нет: на остальных стенах по одной точке`)
    }
    const segs = SegsWithBad(step >= 3 ? [{ ...SEG_EF, instant: false, slow: true }] : [], bad)
    return (
        <>
            <CheatStrip active={1} crossed={step >= 5 ? [1] : []} />
            <CubeSvg points={CUBE2_PTS} segs={segs} faces={step >= 1 && step <= 3 ? [{ face: 'ceiling', color: FACE_COLOR }] : []} bounceFaces
                dimExcept={step >= 1 && step <= 3 ? 'ceiling' : null} selected={sel} onPoint={step === 2 ? tap : undefined} />
            {step === 0 && <TypedBig small text="Правило 1: есть ли плоскость с двумя точками?" onDone={() => setTyped(true)} readMs={0} />}
            {step === 0 && typed && <FaceOptions wrong={wrong} onPick={pickFace} />}
            {(step === 2 || step === 3) && <TypedBig small text="Выбери точки, которые можно соединить" readMs={0} />}
            {step >= 4 && <TypedBig small text="Работает ли 1-е правило ещё?" onDone={() => setTyped(true)} readMs={0} />}
            {step === 4 && typed && <YesNo wrong={wrongYN} onPick={pickYN} />}
            {step >= 5 && <Msg ok text="Правило 1 больше не работает — вычёркиваем ✗" />}
            {flash && <Msg ok={false} text={flash} />}
        </>
    )
}

const C2Rule2Scene = ({ onSettled, onMistake }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const [done, setDone] = useState(false)
    const [wrong, setWrong] = useState<string[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const pick = (v: 'yes' | 'no') => {
        if (!typed || done) return
        if (v === 'no') { showAnswerMeme(true); setFlash(null); setDone(true); setTimeout(() => onSettled?.(), 900); return }
        badPair(onMistake); setWrong(['yes'])
        setFlash(`${pickWrongTryPhrase()} Линия есть только на потолке, а на полу нет ни одной точки — переносить некуда`)
    }
    return (
        <>
            <CheatStrip active={2} crossed={done ? [1, 2] : [1]} />
            <CubeSvg points={CUBE2_PTS} segs={[SEG_EF]} faces={[{ face: 'ceiling', color: FACE_COLOR }, { face: 'floor', color: FACE_COLOR }]} />
            <TypedBig small text="Работает ли 2-е правило? Нужна линия на стене и точка на параллельной ей стене" onDone={() => setTyped(true)} readMs={0} />
            {typed && !done && <YesNo wrong={wrong} onPick={pick} />}
            {done && <Msg ok text="Правило 2 тоже не работает — вычёркиваем ✗" />}
            {flash && !done && <Msg ok={false} text={flash} />}
        </>
    )
}

// Правило 3: продлеваем линию на потолке и переднее ребро потолка → точка G вне куба → «В каких плоскостях живёт G?»
const C2Rule3Scene = ({ onSettled, onMistake }: SceneProps) => {
    const { phase, go } = usePhaseState()
    useChain({ 1: 1500, 2: 300, 3: 800 }, phase, go)
    const [chosen, setChosen] = useState<Face[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [ok, setOk] = useState(false)
    const E = P(PT.E), G = P(PT.G), A1 = P(V.a1)
    const toggle = (f: Face) => { if (ok) return; setFlash(null); setChosen((c) => (c.includes(f) ? c.filter((x) => x !== f) : c.length >= 2 ? [c[1], f] : [...c, f])) }
    const check = () => {
        const right = chosen.length === 2 && chosen.includes('ceiling') && chosen.includes('front')
        if (right) { showAnswerMeme(true); setOk(true); setTimeout(() => onSettled?.(), 1500); return }
        badPair(onMistake)
        setFlash(`${pickWrongTryPhrase()} G лежит на продолжении линии на потолке и на продолжении переднего ребра потолка`)
    }
    return (
        <>
            <CheatStrip active={3} crossed={[1, 2]} />
            <RememberPlate title="ПРАВИЛО 3">
                <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                    <span style={{ color: SECT_COLOR }}>Продлить</span>: продлеваем линию до пересечения с продолжением ребра
                </div>
            </RememberPlate>
            <TypedBig small text="Продлим линию на потолке и переднее ребро потолка" onDone={() => go(1)} />
            <CubeSvg wide points={phase >= 3 ? [...CUBE2_PTS, 'G'] : CUBE2_PTS} segs={[SEG_EF]} labels={G_LABEL}
                faces={ok ? [{ face: 'ceiling', color: OK_COLOR }, { face: 'front', color: OK_COLOR }] : phase >= 1 && phase < 4 ? [{ face: 'ceiling', color: FACE_COLOR }] : []}
                dimExcept={phase >= 1 && phase < 4 ? 'ceiling' : null}>
                {phase >= 1 && (
                    <>
                        {/* продолжение линии на потолке — от E к G */}
                        <motion.line x1={E.x} y1={E.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round"
                            initial={{ x2: E.x, y2: E.y }} animate={{ x2: G.x, y2: G.y }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
                        {/* продолжение переднего ребра потолка — от левого переднего угла к G */}
                        <motion.line x1={A1.x} y1={A1.y} stroke={EDGE} strokeWidth={2.5} strokeDasharray="5 6" strokeLinecap="round"
                            initial={{ x2: A1.x, y2: A1.y }} animate={{ x2: G.x, y2: G.y }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
                    </>
                )}
            </CubeSvg>
            {phase >= 4 && <TypedBig small text="Встретились в точке G. В каких плоскостях живёт точка G? Выбери две" readMs={0} onDone={() => go(5)} />}
            {phase >= 5 && !ok && (
                <div className="w-full flex flex-col gap-2">
                    <div className="drop-in-options grid grid-cols-3 gap-2 w-full">
                        {OPTION_ORDER.map((f) => {
                            const on = chosen.includes(f)
                            return (
                                <button key={f} type="button" onClick={() => toggle(f)}
                                    className="min-h-[48px] rounded-xl border-2 border-b-4 text-base font-black transition-colors px-1"
                                    style={{ borderColor: on ? SECT_COLOR : '#3A464E', backgroundColor: on ? hexToRgba(SECT_COLOR, 0.22) : '#161F23', color: '#F2F7FB' }}>
                                    {FACE_SHORT[f]}{on ? ' ✓' : ''}
                                </button>
                            )
                        })}
                    </div>
                    <button type="button" disabled={chosen.length !== 2} onClick={check}
                        className={walkthroughButtonClass(chosen.length === 2)} style={walkthroughButtonStyle(chosen.length === 2)}>Проверить</button>
                </div>
            )}
            {flash && !ok && <Msg ok={false} text={flash} />}
            {ok && <Msg ok text="Да! G живёт и на потолке, и на передней стене 🏠" />}
        </>
    )
}

// Снова правило 1: G и точка на ребре — на передней стене. Дальше достраиваем сечение до конца.
const C2FinishScene = ({ onSettled, onMistake }: SceneProps) => {
    const [step, setStep] = useState(0) // 0 пара G–H, 1 пара Q–E, 2 перенос (правило 2), 3 пара F–R, 4 готово
    const [typed, setTyped] = useState(false)
    const [segs, setSegs] = useState<Seg[]>([SEG_EF])
    const [points, setPoints] = useState<PtKey[]>(['E', 'F', 'H', 'G'])
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [ghost, setGhost] = useState(false)
    const [fill, setFill] = useState(false)
    const WANT: Record<number, string> = { 0: 'GH', 1: 'EQ', 3: 'FR' }
    const wrongPair = (a: PtKey, b: PtKey) => {
        badPair(onMistake)
        const bad: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7', instant: true }
        setSegs((s) => [...s, bad]); setTimeout(() => setSegs((s) => s.filter((x) => x.id !== bad.id)), 1300)
        const f = commonFace(a, b)
        setMsg({ ok: false, text: f ? `${pickWrongTryPhrase()} Эта линия уже есть или ничего нового не даст` : `${pickWrongTryPhrase()} Эти точки на разных стенах` })
    }
    const { sel, tap } = usePairPick(typed && !busy && WANT[step] !== undefined, (a, b) => {
        if (pairKey(a, b) !== WANT[step]) return wrongPair(a, b)
        showAnswerMeme(true); setMsg(null); setBusy(true)
        if (step === 0) {
            // часть G→Q — вне куба (вспомогательная, пунктир), Q→H — уже сечение
            setSegs((s) => [...s, { id: 'GQ', a: 'G', b: 'Q', color: SECT_COLOR, dash: '7 6', slow: true, opacity: 0.6 }])
            setTimeout(() => { setPoints((p) => [...p, 'Q']); setSegs((s) => [...s, { id: 'QH', a: 'Q', b: 'H', color: SECT_COLOR, slow: true }]) }, 1500)
            setTimeout(() => { setMsg({ ok: true, text: 'Линия вошла в куб — тут новая точка сечения 📍' }); setStep(1); setTyped(false); setBusy(false) }, 3200)
        } else if (step === 1) {
            setSegs((s) => [...s, { id: 'EQ', a: 'Q', b: 'E', color: SECT_COLOR, slow: true, dash: segDash('Q', 'E') }])
            setTimeout(() => { setStep(2); setTyped(false); setMsg(null) }, 1900)
            setTimeout(() => setGhost(true), 3600)
            setTimeout(() => { setGhost(false); setSegs((s) => [...s, { id: 'HR', a: 'H', b: 'R', color: SECT_COLOR, slow: true }]) }, 5200)
            setTimeout(() => { setPoints((p) => [...p, 'R']); setStep(3); setTyped(false); setBusy(false) }, 6900)
        } else if (step === 3) {
            setSegs((s) => [...s, { id: 'FR', a: 'F', b: 'R', color: SECT_COLOR, slow: true, dash: segDash('F', 'R') }])
            setTimeout(() => { setFill(true); setStep(4); onSettled?.() }, 1900)
        }
    })
    const Q = P(PT.Q), H = P(PT.H), E = P(PT.E)
    const prompt = step === 0 ? 'Снова правило 1: выбери две точки в одной плоскости'
        : step === 1 ? 'Есть ещё две точки в одной плоскости?'
            : step === 2 ? 'Правило 1 больше не работает. Правило 2: левая стена параллельна правой'
                : step === 3 ? 'И снова правило 1: выбери две точки в одной плоскости' : 'Это и есть сечение! 🎉'
    return (
        <>
            <CheatStrip active={step === 2 ? 2 : step >= 4 ? null : 1} crossed={step === 2 ? [1] : []} />
            <CubeSvg wide points={points} segs={segs} labels={G_LABEL} selected={sel} fill={fill} fillPts={['E', 'F', 'R', 'H', 'Q']}
                onPoint={typed && !busy && WANT[step] !== undefined ? tap : undefined}>
                {ghost && (
                    <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: H.x - Q.x, y: H.y - Q.y, opacity: [0, 1, 1, 0.9] }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
                        <line x1={Q.x} y1={Q.y} x2={E.x} y2={E.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                    </motion.g>
                )}
            </CubeSvg>
            <TypedBig key={`p-${step}`} small text={prompt} onDone={() => setTyped(true)} readMs={0} />
            {msg && <Msg ok={msg.ok} text={msg.text} />}
            {fill && <LocalAnswerConfetti />}
        </>
    )
}

const SCENES = [RoomScene, WallTestScene, PointsScene, CheatIntroScene, Rule1TryScene, Rule2Scene, CloseGameScene,
    C2TaskScene, C2Rule1Scene, C2Rule2Scene, C2Rule3Scene, C2FinishScene]
const SCENE_MAP_LABELS = ['Куб — комната', 'Тест: стены', 'Три точки', 'Шпора', 'Пробуем правило 1', 'Правило 2', 'Замкни сечение',
    'Новое сечение', 'Куб 2: правило 1', 'Куб 2: правило 2', 'Куб 2: правило 3 (G)', 'Куб 2: достроить']
const PRACTICE_SCENES = new Set<unknown>([WallTestScene, Rule1TryScene, CloseGameScene, C2Rule1Scene, C2Rule2Scene, C2Rule3Scene, C2FinishScene])
const NEXT_LABELS = ['Понял, это комната', 'Стены знаю 🧱', 'Строим сечение ✂️', 'Давай попробуем 1-ое правило', 'Правило 1 — изи',
    'Соединим их!', 'Ещё сечение!', 'Погнали', 'Дальше — правило 2', 'Дальше — правило 3', 'G найдена!', 'Готово']

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
