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
//   13. Куб 3 «Строй сам»: пульт из трёх правил, ученик строит сечение сам (SandboxScene, движок по координатам).
//
// Координаты: единичный куб, x вправо, y вглубь, z вверх. Проекция «как в учебнике»: передняя грань — квадрат,
// глубина уходит вправо-вверх под 45° с коэффициентом 0.5 (как CubeFig в type-ttpwalk.tsx).
// Невидима дальняя левая нижняя вершина — её рёбра пунктиром. Пунктир НЕ рисовать через pathLength
// (framer перезаписывает strokeDasharray) — такие линии только проявляем.

import { Fragment, createContext, useContext, useEffect, useRef, useState } from 'react'
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
import { SideMeme } from '@/components/side-meme'
import { pickMoreMeme, memeFlip, type MoreMeme } from '@/lib/moreMemes'
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
const PROJ_COLOR = GGEGE_PALETTE.blue.button // проекции на пол (точки, линия, слово «проекция»)
const AUX_COLOR = GGEGE_PALETTE.orange.button // вспомогательная линия правила 4
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
                    const lines = h.face === 'ceiling' || h.face === 'floor' ? [h.label!] : h.label!.split(' ')
                    // крупно и без рамки; боковые грани узкие — там чуть мельче, чтобы слово не вылезало за рёбра
                    const side = h.face === 'left' || h.face === 'right'
                    const fs = side ? 17 : 22, lh = side ? 21 : 26
                    return (
                        // стикер «лежит» на грани: статичный <g> с переносом и искажением, motion.g внутри — только отскок
                        <g key={`lbl-${h.face}`} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) ${FACE_LABEL_SKEW[h.face]}`}>
                            <motion.g initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 13 }}>
                                {lines.map((l, i) => (
                                    <text key={i} x={0} y={(i - (lines.length - 1) / 2) * lh} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={900} fill="#F2F7FB"
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

// Слова в цвет того, что они называют на чертеже: «линия»/«точка» — цвет сечения, «потолок»/«пол»/«стена» — цвет
// подсвеченной стены. Красим после печати (Typewriter печатает простой текст).
const W = '(?<![а-яё])'
const WE = '(?![а-яё])'
const COLOR_WORDS: [RegExp, string][] = [
    [new RegExp(`${W}(лини[яиюей]|линиями|линий|точк[аиуе]|точкой|точек)${WE}`, 'i'), SECT_COLOR],
    [new RegExp(`${W}(потол(?:ок|ке|ка|ку|ком)|пол|полу|пола|полом|стен[аеуы]|стене|стеной|стен)${WE}`, 'i'), FACE_COLOR],
]
const PROJ_WORD = new RegExp(`${W}(проекци[яиюей]|проекциями|проекций)${WE}`, 'i')
const colorize = (text: string, lineColor?: string) => {
    const words: [RegExp, string][] = [[PROJ_WORD, PROJ_COLOR], ...COLOR_WORDS]
    const re = new RegExp(words.map(([r]) => r.source).join('|'), 'gi')
    const out: React.ReactNode[] = []
    let last = 0
    for (const m of text.matchAll(re)) {
        const i = m.index ?? 0
        if (i > last) out.push(text.slice(last, i))
        let color = words.find(([r]) => r.test(m[0]))?.[1]
        if (lineColor && /^лини/i.test(m[0])) color = lineColor
        out.push(<span key={i} style={{ color }}>{m[0]}</span>)
        last = i + m[0].length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
}
// каждая мысль — с новой строки: после «.», «?» или «!» перед новым предложением ставим перенос (родитель — whitespace-pre-line)
const splitThoughts = (t: string) => t.replace(/([.?!])\s+(?=[А-ЯЁA-Z«])/g, '$1\n')
const ColorTyped = ({ text: raw, onDone, lineColor }: { text: string; onDone?: () => void; lineColor?: string }) => {
    const [done, setDone] = useState(false)
    const text = splitThoughts(raw)
    return <span className="whitespace-pre-line">{done ? colorize(text, lineColor) : <Typewriter text={text} onDone={() => { setDone(true); onDone?.() }} />}</span>
}
// meme — справа мем, развёрнутый к тексту («удивляется правилу»)
const TypedBig = ({ text, onDone, readMs = 400, small, meme, memeFixed, lineColor }: { text: string; onDone?: () => void; readMs?: number; small?: boolean; meme?: MoreMeme['mood']; memeFixed?: { src: string; flip?: boolean }; lineColor?: string }) => {
    const body = (
        <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl', (meme || memeFixed) && 'flex-1 min-w-0')}>
            <ColorTyped text={text} lineColor={lineColor} onDone={() => setTimeout(() => onDone?.(), readMs)} />
        </div>
    )
    return meme || memeFixed ? <div className="w-full flex items-center gap-2">{body}<SideMeme mood={meme} fixed={memeFixed} className={memeFixed ? 'w-32 h-32 md:w-40 md:h-40' : undefined} /></div> : body
}
// без мема: после верного ответа и так взлетает облачко-мем (showAnswerMeme) — не дублируем
// meme — после верного ответа: вместо облачка над кнопкой (showAnswerMeme) мем справа от сообщения — без перебора мемов
const Msg = ({ ok, text, meme }: { ok: boolean; text: string; meme?: boolean }) => (
    <motion.div key={text} className="w-full flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex-1 min-w-0 rounded-xl px-4 py-2 font-bold text-center"
            style={{ backgroundColor: hexToRgba(ok ? OK_COLOR : WRONG_COLOR, 0.14), color: ok ? OK_COLOR : WRONG_COLOR }}>
            {text}
        </div>
        {ok && meme && <SideMeme mood={/✗/.test(text) ? 'wow' : 'yay'} />}
    </motion.div>
)
type MsgState = { ok: boolean; text: string; meme?: boolean } | null
// Плашка «ПРАВИЛО N» со стикером-мемом справа, повёрнутым к правилу
const RulePlate = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const [m, setM] = useState<MoreMeme | null>(null)
    useEffect(() => { setM(pickMoreMeme('wow')) }, [])
    return <RememberPlate title={title} sticker={m?.src ?? 'none'} flipSticker={m ? memeFlip(m, 'left') : false}>{children}</RememberPlate>
}
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
    const [msg, setMsg] = useState<MsgState>(null)
    const [locked, setLocked] = useState(false)
    const [done, setDone] = useState(false)
    const target = FACE_TEST_ORDER[qi]
    const tap = (nearest: Face, inside: Face[]) => {
        if (!typed || locked || done) return
        // попал в контур нужной стены (даже если спереди её перекрывает другая) — засчитываем
        const f = inside.includes(target) ? target : nearest
        if (f === target) {
            setHl({ face: f, color: OK_COLOR, label: FACE_NAME[f] })
            setMsg({ ok: true, text: `${FACE_SHORT[f]} 👍`, meme: true })
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
                    {done ? 'Все стены найдены 🎉' : <ColorTyped key={`q-${qi}`} text={`Кликни на ${FACE_ACC[target]}`} onDone={() => setTyped(true)} />}
                </p>
            </div>
            <CubeSvg faces={hl ? [hl] : []} dimExcept={hl ? hl.face : null} onFace={done ? undefined : tap} />
            {msg && <Msg ok={msg.ok} text={msg.text} meme={msg.meme} />}
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
    <RulePlate title="ПРАВИЛО 1">
        <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB] min-h-[3.5rem]">
            <ColorTyped text={RULE1_TEXT} onDone={() => setTimeout(() => onSettled?.(), 400)} />
        </div>
    </RulePlate>
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
// Сколько правил в шпоре: в «Кубик: 3 правила» правило 4 не проходим — только 3; в «Кубик: 4 правило» — все 4.
const RuleCountCtx = createContext(4)
const useRules = () => RULES.slice(0, useContext(RuleCountCtx))

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
// focus — момент перехода к другому правилу: текущее правило крупнее и светится, чтобы ученик посмотрел наверх
const CheatStrip = ({ active, crossed = [], focus = false }: { active: number | null; crossed?: number[]; focus?: boolean }) => {
    const rules = useRules()
    // откат к правилу 1 (с другого правила) — правило 1 один раз подпрыгивает, чтобы привлечь внимание
    const prevActive = useRef(active)
    const [back1, setBack1] = useState(0)
    useEffect(() => {
        if (active === 1 && prevActive.current !== null && prevActive.current !== 1) setBack1((n) => n + 1)
        prevActive.current = active
    }, [active])
    return (
    <div className="relative w-full" aria-label="Шпора: 4 правила">
        {/* просто подпись «ШПОРА» сверху (с лёгким дымком, как у большой плашки), без внешней рамки */}
        <div className="relative flex items-center justify-center gap-1 pb-1">
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 w-28 h-7 rounded-full pointer-events-none animate-smoke-drift"
                style={{ background: 'radial-gradient(closest-side, rgba(176,188,202,0.22), rgba(176,188,202,0) 100%)' }} />
            <VenetianMask className="relative w-3.5 h-3.5" style={{ color: '#AEB9C4' }} />
            <span className="relative font-black tracking-[0.3em] text-[10px]" style={{ color: '#C9D3DC', textShadow: '0 0 6px rgba(190,205,220,0.35)' }}>ШПОРА</span>
        </div>
        <div className="relative grid gap-1.5" style={{ gridTemplateColumns: `repeat(${rules.length}, minmax(0, 1fr))` }}>
            {rules.map((r) => {
                const isOn = active === r.n, isX = crossed.includes(r.n)
                // пока смотрим на одно правило — остальные бледные целиком (и рамка, и текст)
                const faded = active !== null && !isOn
                return (
                    <motion.div key={r.n === 1 ? `r1-${back1}` : r.n} className="relative flex"
                        initial={r.n === 1 && back1 > 0 ? { y: 0, scale: 1 } : false}
                        animate={r.n === 1 && back1 > 0 ? { y: [0, -12, 0, -4, 0], scale: [1, 1.18, 0.97, 1.04, 1] } : undefined}
                        transition={{ duration: 0.8, ease: 'easeOut' }}>
                    <motion.div key={r.n} className="relative w-full rounded-lg border-2 px-1 py-1 text-center flex flex-col justify-center"
                        // зачёркнутое бледнеет после того, как дорисован крестик
                        animate={{ opacity: isX ? 0.4 : faded ? 0.38 : 1, scale: isOn ? (focus ? [1, 1.32, 1.18] : 1.06) : 1 }}
                        transition={{ opacity: { delay: isX ? 0.75 : 0, duration: 0.4 }, scale: { type: 'spring', stiffness: 300, damping: 18 } }}
                        style={{ borderColor: isOn ? SECT_COLOR : '#3A464E', backgroundColor: isOn ? hexToRgba(SECT_COLOR, 0.18) : '#161F23',
                            boxShadow: isOn && focus ? `0 0 18px ${hexToRgba(SECT_COLOR, 0.75)}` : undefined, zIndex: isOn ? 1 : 0 }}>
                        <div className="text-[10px] font-black leading-none flex items-center justify-center gap-0.5" style={{ color: isOn ? SECT_COLOR : MUTED }}>
                            {r.n}
                        </div>
                        <div className="text-[10px] md:text-xs font-black leading-tight hyphens-manual break-words"
                            style={{ color: faded ? MUTED : '#F2F7FB' }}>{r.short}</div>
                        {isX && <CrossX />}
                    </motion.div>
                    </motion.div>
                )
            })}
        </div>
    </div>
)
}

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
        <motion.div data-rule-row className="relative flex items-center gap-2 rounded-xl border-2 px-2 py-1.5"
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
    const rules = useRules()
    const [cur, setCur] = useState(-1) // текущее в проходе
    // 'on' — правило светится; 'crossing' — зачёркиваем; 'growing' — стрелка дорастает до следующего
    const [stage, setStage] = useState<'on' | 'crossing' | 'growing'>('on')
    const [arrowTo, setArrowTo] = useState(0) // до какого правила дошла стрелка
    const listRef = useRef<HTMLDivElement>(null)
    const [rowY, setRowY] = useState<number[]>([])
    useEffect(() => {
        const el = listRef.current
        if (!el) return
        const measure = () => setRowY([...el.querySelectorAll<HTMLElement>('[data-rule-row]')].map((r) => r.offsetTop + r.offsetHeight / 2))
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        measure()
        return () => ro.disconnect()
    }, [rows])
    useEffect(() => {
        // после стрелки ждём кнопку «Ага, идём последовательно» (фаза 7), потом объяснение (6) и только потом проход (4)
        if (phase === 3) { const t = setTimeout(() => setPhase(7), 1300); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    useEffect(() => {
        if (phase !== 4 || cur < 0) return
        // правило светится → зачёркиваем → стрелка дорастает до следующего → следующее с отскоком; последнее не зачёркиваем
        const t = stage === 'crossing' ? setTimeout(() => { setArrowTo(cur + 1); setStage('growing') }, 1000)
            : stage === 'growing' ? setTimeout(() => { setStage('on'); setCur(cur + 1) }, 900)
                : setTimeout(() => {
                    if (cur + 1 < rules.length) setStage('crossing')
                    else { setPhase(5); setCur(-1); setTimeout(() => onSettled?.(), 900) }
                }, cur === rules.length - 1 ? 1500 : 1900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, cur, stage])
    const stateOf = (i: number): 'normal' | 'on' | 'dim' | 'crossed' => {
        if (phase !== 4) return 'normal'
        if (i === cur) return stage === 'on' ? 'on' : 'crossed'
        if (i < cur) return 'crossed'
        return 'dim'
    }
    return (
        <>
            <ShporaBadge />
            <TypedBig small text={`Для сечения ${rules.length} правила:`} meme="wow" onDone={() => { setPhase(1); setRows(1) }} />
            {/* слева — место под стрелку «сверху вниз», чтобы она не закрывала номера правил */}
            <div ref={listRef} className="relative w-full flex flex-col gap-2 pl-7">
                {rules.slice(0, rows).map((r, i) => (
                    <RuleRow key={r.n} r={r} state={stateOf(i)}
                        onReady={() => { if (i + 1 < rules.length) setRows((n) => Math.max(n, i + 2)); else setPhase((p) => Math.max(p, 2)) }} />
                ))}
                {phase >= 3 && rowY[arrowTo] !== undefined && <DownArrow toY={rowY[arrowTo]} />}
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
// toY — центр правила, до которого стрелка сейчас дотянулась; при смене — плавно дорастает вниз.
const DownArrow = ({ toY }: { toY: number }) => {
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
    const end = Math.max(10, toY - 9)
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
                    <motion.g initial={{ x: 12, y: end }} animate={{ x: 12, y: end }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
                        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.85, type: 'spring', stiffness: 420, damping: 11 }}>
                            <polygon points="-11,-4 11,-4 0,18" fill="url(#shporaArrow)" stroke="#FFF1C7" strokeWidth={1.5} strokeLinejoin="round" />
                        </motion.g>
                    </motion.g>
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
// 8 линия выделяется → 9 пунктирная копия ездит с потолка на пол по кругу + после первого цикла кнопка «Параллельный перенос» →
// 10 линия на полу пунктиром → 11 новая точка → 12 чертёж бледнеет, шпора возвращается на правило 1 →
// 13 чертёж обратно, «Есть ли теперь точки в одной плоскости?» → Да.
const HIGHLIGHT = '#F2C35B'
const Rule2Scene = ({ onSettled, onMistake }: SceneProps) => {
    const { phase, go } = usePhaseState()
    useChain({ 1: 3000, 3: 750, 4: 900, 8: 1600, 10: 1800 }, phase, go)
    // после «Нет»: сначала гасим чертёж (взгляд — на шпору), и только потом зачёркиваем правило 1
    const [crossNow, setCrossNow] = useState(false)
    useEffect(() => {
        if (phase !== 1) return
        const t = setTimeout(() => setCrossNow(true), 900)
        return () => clearTimeout(t)
    }, [phase])
    // переход к правилу 2: пока зачёркиваем правило 1 и подсвечиваем 2-е, чертёж сильно гаснет — смотрим на шпору
    const [hold, setHold] = useState(false)
    useEffect(() => {
        if (phase !== 2) return
        setHold(true)
        const t = setTimeout(() => setHold(false), 2200)
        return () => clearTimeout(t)
    }, [phase])
    const focusStrip = phase === 1 || (phase === 2 && hold)
    const [typed, setTyped] = useState(false)
    const [wrong, setWrong] = useState<string[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    useEffect(() => { setTyped(false) }, [phase])
    // кнопка переноса — после первого цикла анимации копии (2 с + 0,3 с); по «typed» нельзя: подсказка не печатается заново
    const [moveBtn, setMoveBtn] = useState(false)
    useEffect(() => {
        if (phase !== 9) return
        const t = setTimeout(() => setMoveBtn(true), 2300)
        return () => clearTimeout(t)
    }, [phase])
    // «Получилось! Значит снова с правила 1» → пауза 1 с → только потом шпора переходит к правилу 1 (чертёж бледный)
    const [stripBack, setStripBack] = useState(false)
    const afterBackText = () => {
        setTimeout(() => setStripBack(true), 1000)
        setTimeout(() => go(13), 3000)
    }
    const M = P(PT.M), N = P(PT.N), K = P(PT.K)
    const dx = K.x - M.x, dy = K.y - M.y
    const ceil: FaceHL = { face: 'ceiling', color: FACE_COLOR }, floor: FaceHL = { face: 'floor', color: FACE_COLOR }
    const faces: FaceHL[] = phase === 3 ? [ceil]
        : phase >= 4 && phase <= 6 ? [ceil, floor]
            : phase === 7 || phase === 8 ? [ceil]
                : phase === 9 || phase === 10 ? [ceil, floor] : []
    const strip = phase === 0 ? { active: 1, crossed: [] as number[] }
        : phase === 1 ? { active: 1, crossed: crossNow ? [1] : [] }
            : phase <= 11 || (phase === 12 && !stripBack) ? { active: 2, crossed: [1] } : { active: 1, crossed: [] as number[] }
    const prompt = phase === 0 ? 'Можем ли снова воспользоваться правилом 1? Есть ли точки в одной плоскости?'
            : phase >= 7 && phase <= 9 ? 'Переносим эту линию параллельно — через точку на полу' : null
    // после переноса фразы не стираются, а дописываются одна под другой — с паузой, чтобы успеть прочитать
    const tail = ['Линия упёрлась в ребро: тут новая точка 📍', 'Получилось! Значит снова с правила 1', 'Есть ли теперь точки в одной плоскости?']
    const answer1 = (v: 'yes' | 'no') => {
        if (!typed) return
        if (v === 'no') { setFlash(null); go(1); return }
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
            <CheatStrip active={strip.active} crossed={strip.crossed} focus={focusStrip || phase === 12} />
            {phase === 1 && crossNow && <Msg ok meme text="Правило 1 не работает — зачёркиваем ✗" />}
            {phase === 2 && hold && <Msg ok text="Переходим к правилу 2 👆" />}
            {/* без плашки «ПРАВИЛО 2»: просто пишем над кубом, потом с отскоком потолок и пол */}
            {phase >= 2 && phase <= 6 && !hold && <TypedBig small text="Потолок и пол параллельны" meme="wow" onDone={() => go(3)} readMs={300} />}
            <motion.div className="w-full" initial={false} animate={{ opacity: phase === 12 ? 0.18 : focusStrip ? 0.08 : 1 }} transition={{ duration: 0.6 }}>
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
                        // копия линии ездит с потолка на пол снова и снова, пока не нажмут «Параллельный перенос»
                        <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: [0, dx, dx], y: [0, dy, dy], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, times: [0, 0.7, 1], ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 }}>
                            <line x1={M.x} y1={M.y} x2={N.x} y2={N.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                        </motion.g>
                    )}
                </CubeSvg>
            </motion.div>
            {prompt && <TypedBig key={`p-${prompt}`} small text={prompt} readMs={0}
                onDone={() => { setTyped(true); if (phase === 7) go(8) }} />}
            {tail.map((t, k) => phase >= 11 + k && (
                <TypedBig key={`t-${k}`} small text={t} readMs={0}
                    onDone={() => { if (11 + k === 13) setTyped(true); else if (11 + k === 12) afterBackText(); else setTimeout(() => go(12 + k), 2200) }} />
            ))}
            {phase === 0 && typed && <YesNo wrong={wrong} onPick={answer1} />}
            {(phase === 5 || phase === 6) && <NextBtn onClick={() => go(7)}>Вижу, они параллельны</NextBtn>}
            {phase === 9 && moveBtn && <NextBtn onClick={() => go(10)}>Параллельный перенос</NextBtn>}
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
    const [msg, setMsg] = useState<MsgState>(null)
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
            setMsg({ ok: true, text: `Обе точки ${FACE_ON[f]}. Сечение замкнулось!`, meme: true })
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
            {/* откат к правилу 1 уже показан в конце прошлой сцены — тут шпора сразу на правиле 1 */}
            <CheatStrip active={1} />
            <GameHeader title="Замкни сечение 🔗" />
            <TypedBig small text="Соедини две точки, которые лежат в одной плоскости" onDone={() => setTyped(true)} />
            <CubeSvg faces={face ? [face] : []} points={['M', 'N', 'K', 'L']} segs={segs} selected={sel} fill={fill} onPoint={typed && !done ? tap : undefined} />
            {msg && <Msg ok={msg.ok} text={msg.text} meme={msg.meme} />}
            {fill && <LocalAnswerConfetti />}
            {fill && <TypedBig text="Это и есть сечение! 🎉" readMs={0} />}
        </>
    )
}

// ===== Куб 2: новое сечение =====
const CUBE2_PTS: PtKey[] = ['E', 'F', 'H']
const SEG_EF: Seg = { id: 'EF', a: 'E', b: 'F', color: SECT_COLOR, instant: true }
const G_LABEL = { G: 'X' } as Partial<Record<PtKey, string>>

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
    const [efFirst, setEfFirst] = useState<PtKey>('E') // линию ведём от точки, выбранной первой
    useEffect(() => {
        const t = step === 1 ? setTimeout(() => setStep(2), 1100) : step === 3 ? setTimeout(() => { setStep(4); setTyped(false) }, 1900) : step === 5 ? setTimeout(() => onSettled?.(), 900) : null
        return () => { if (t) clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])
    const { sel, tap } = usePairPick(step === 2, (a, b) => {
        if (pairKey(a, b) === 'EF') { showAnswerMeme(true); setFlash(null); setEfFirst(a); setStep(3); return }
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
        if (v === 'no') { setFlash(null); setStep(5); return }
        badPair(onMistake); setWrongYN(['yes'])
        setFlash(`${pickWrongTryPhrase()} Других плоскостей с двумя точками нет: на остальных стенах по одной точке`)
    }
    const segs = SegsWithBad(step >= 3 ? [{ ...SEG_EF, a: efFirst, b: efFirst === 'E' ? 'F' : 'E', instant: false, slow: true }] : [], bad)
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
            {step >= 5 && <Msg ok meme text="Правило 1 больше не работает — вычёркиваем ✗" />}
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
        if (v === 'no') { setFlash(null); setDone(true); setTimeout(() => onSettled?.(), 900); return }
        badPair(onMistake); setWrong(['yes'])
        setFlash(`${pickWrongTryPhrase()} Линия есть только на потолке, а на полу нет ни одной точки — переносить некуда`)
    }
    return (
        <>
            <CheatStrip active={2} crossed={done ? [1, 2] : [1]} />
            <CubeSvg points={CUBE2_PTS} segs={[SEG_EF]} faces={[{ face: 'ceiling', color: FACE_COLOR }, { face: 'floor', color: FACE_COLOR }]} />
            <TypedBig small text="Работает ли 2-е правило? Нужна линия на стене и точка на параллельной ей стене" onDone={() => setTyped(true)} readMs={0} />
            {typed && !done && <YesNo wrong={wrong} onPick={pick} />}
            {done && <Msg ok meme text="Правило 2 тоже не работает — вычёркиваем ✗" />}
            {flash && !done && <Msg ok={false} text={flash} />}
        </>
    )
}

// Правило 3: продлеваем линию на потолке и переднее ребро потолка → точка G вне куба → «В каких плоскостях живёт G?»
const C2Rule3Scene = ({ onSettled, onMistake }: SceneProps) => {
    const { phase, go } = usePhaseState()
    useChain({ 1: 1500, 2: 300, 3: 800 }, phase, go)
    // плашка правила печатается, потом пауза, чтобы успеть прочитать, и только потом — что делаем
    const [plateRead, setPlateRead] = useState(false)
    const [chosen, setChosen] = useState<Face[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [ok, setOk] = useState(false)
    const E = P(PT.E), G = P(PT.G), A1 = P(V.a1)
    const toggle = (f: Face) => { if (ok) return; setFlash(null); setChosen((c) => (c.includes(f) ? c.filter((x) => x !== f) : c.length >= 2 ? [c[1], f] : [...c, f])) }
    const check = () => {
        const right = chosen.length === 2 && chosen.includes('ceiling') && chosen.includes('front')
        if (right) { setOk(true); setTimeout(() => onSettled?.(), 1500); return }
        badPair(onMistake)
        setFlash(`${pickWrongTryPhrase()} X лежит на продолжении линии на потолке и на продолжении переднего ребра потолка`)
    }
    return (
        <>
            <CheatStrip active={3} crossed={[1, 2]} />
            <RulePlate title="ПРАВИЛО 3">
                <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB] min-h-[3.5rem]">
                    <ColorTyped text="Продлить: продлеваем линию до пересечения с продолжением ребра" onDone={() => setTimeout(() => setPlateRead(true), 2200)} />
                </div>
            </RulePlate>
            {plateRead && <TypedBig small text="Продлим линию на потолке и переднее ребро потолка" meme="wow" onDone={() => go(1)} />}
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
            {phase >= 4 && <TypedBig small text="Встретились в точке X. В каких плоскостях живёт точка X? Выбери две" readMs={0} onDone={() => go(5)} />}
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
            {ok && <Msg ok meme text="Да! X живёт и на потолке, и на передней стене 🏠" />}
        </>
    )
}

// Снова правило 1: G и точка на ребре — на передней стене. Дальше достраиваем сечение до конца.
// Подсказка этапа «достроить»: передняя плоскость (y = 0), продолженная влево за X
const FRONT_HINT: V3[] = [[-1.02, 0, -0.08], [1.08, 0, -0.08], [1.08, 0, 1.1], [-1.02, 0, 1.1]]
const C2FinishScene = ({ onSettled, onMistake }: SceneProps) => {
    const [step, setStep] = useState(0) // 0 пара G–H, 1 пара Q–E, 2 перенос (правило 2), 3 пара F–R, 4 готово
    const [typed, setTyped] = useState(false)
    const [segs, setSegs] = useState<Seg[]>([SEG_EF])
    const [points, setPoints] = useState<PtKey[]>(['E', 'F', 'H', 'G'])
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<MsgState>(null)
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
        if (step !== 0) showAnswerMeme(true)
        setMsg(null); setBusy(true)
        if (step === 0) {
            // часть G–Q — вне куба (вспомогательная, пунктир), Q–H — уже сечение; рисуем от точки, выбранной первой
            if (a === 'G') {
                setSegs((s) => [...s, { id: 'GQ', a: 'G', b: 'Q', color: SECT_COLOR, dash: '7 6', slow: true, opacity: 0.6 }])
                setTimeout(() => { setPoints((p) => [...p, 'Q']); setSegs((s) => [...s, { id: 'QH', a: 'Q', b: 'H', color: SECT_COLOR, slow: true }]) }, 1500)
            } else {
                setSegs((s) => [...s, { id: 'QH', a: 'H', b: 'Q', color: SECT_COLOR, slow: true }])
                setTimeout(() => { setPoints((p) => [...p, 'Q']); setSegs((s) => [...s, { id: 'GQ', a: 'Q', b: 'G', color: SECT_COLOR, dash: '7 6', slow: true, opacity: 0.6 }]) }, 1500)
            }
            setTimeout(() => { setMsg({ ok: true, text: 'Линия вошла в куб — тут новая точка сечения 📍', meme: true }); setStep(1); setTyped(false); setBusy(false) }, 3200)
        } else if (step === 1) {
            setSegs((s) => [...s, { id: 'EQ', a, b, color: SECT_COLOR, slow: true, dash: segDash('Q', 'E') }])
            setTimeout(() => { setStep(2); setTyped(false); setMsg(null) }, 1900)
            setTimeout(() => setGhost(true), 3600)
            setTimeout(() => { setGhost(false); setSegs((s) => [...s, { id: 'HR', a: 'H', b: 'R', color: SECT_COLOR, slow: true }]) }, 5200)
            setTimeout(() => { setPoints((p) => [...p, 'R']); setStep(3); setTyped(false); setBusy(false) }, 6900)
        } else if (step === 3) {
            setSegs((s) => [...s, { id: 'FR', a, b, color: SECT_COLOR, slow: true, dash: segDash('F', 'R') }])
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
                {step === 0 && (
                    // подсказка: передняя стена, продолженная влево за пределы куба — в ней лежат и X, и точка на правом ребре
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.75, 1] }} transition={{ duration: 2.4, delay: 0.6 }} style={{ pointerEvents: 'none' }}>
                        <polygon points={FRONT_HINT.map((v) => { const q = P(v); return `${q.x},${q.y}` }).join(' ')}
                            fill={hexToRgba(FACE_COLOR, 0.1)} stroke={hexToRgba(FACE_COLOR, 0.45)} strokeWidth={2} strokeDasharray="8 7" strokeLinejoin="round" />
                        <text x={P([-0.94, 0, 0.22]).x} y={P([-0.94, 0, 0.22]).y} fill={hexToRgba(FACE_COLOR, 0.75)} fontSize={14} fontWeight={800}
                            style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
                            <tspan>передняя</tspan><tspan x={P([-0.94, 0, 0.22]).x} dy={16}>плоскость</tspan>
                        </text>
                    </motion.g>
                )}
                {ghost && (
                    <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: H.x - Q.x, y: H.y - Q.y, opacity: [0, 1, 1, 0.9] }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
                        <line x1={Q.x} y1={Q.y} x2={E.x} y2={E.y} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                    </motion.g>
                )}
            </CubeSvg>
            {msg && <Msg ok={msg.ok} text={msg.text} meme={msg.meme} />}
            <TypedBig key={`p-${step}`} small text={prompt} onDone={() => setTyped(true)} readMs={0} />
            {fill && <LocalAnswerConfetti />}
        </>
    )
}

// ===== Куб 3: «Строй сам» — пульт из трёх правил =====
// Ученик сам выбирает правило на пульте и применяет его прямо на кубе:
//   1 Соединить — тапни две точки: если они на одной стене, проводим линию (от первой выбранной ко второй)
//      до краёв стены; там, где линия упёрлась в ребро, — новая точка.
//   2 Параллельность — тапни линию сечения, потом точку на параллельной стене: проводим через точку параллельную линию.
//   3 Продлить — тапни линию сечения, потом ребро на той же стене: продлеваем обе до пересечения — новая точка (часто вне куба).
// Движок общий (считает по координатам), поэтому подходит любой правильный путь, не один заготовленный.
// Точки — зеркально кубу 2: на правом ребре потолка, на дальнем ребре потолка ближе к левому, середина переднего левого ребра.
type SbPt = { id: number; v: V3 }
type SbSeg = { id: number; a: V3; b: V3; face: Face }
type SbAux = { id: number; a: V3; b: V3; color?: string; width?: number; dash?: string }
type Tool = 1 | 2 | 3 | 4
const SB_START: V3[] = [[1, 0.6, 1], [0.45, 1, 1], [0, 0, 0.5]]
const OPPOSITE: Record<Face, Face> = { ceiling: 'floor', floor: 'ceiling', front: 'back', back: 'front', left: 'right', right: 'left' }
// грань = фиксированная ось k со значением c; остальные две оси — координаты внутри грани
const FACE_AXIS: Record<Face, [number, number]> = { ceiling: [2, 1], floor: [2, 0], front: [1, 0], back: [1, 1], left: [0, 0], right: [0, 1] }
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const same = (a: V3, b: V3) => dist3(a, b) < 1e-4
const facesOfV = (v: V3) => planesOf(v)
// Хорда грани: прямая p + t·d внутри квадрата грани (Лианг–Барски по двум свободным осям)
const chordIn = (face: Face, p: V3, d: V3): [V3, V3] | null => {
    const k = FACE_AXIS[face][0]
    let t0 = -Infinity, t1 = Infinity
    for (let i = 0; i < 3; i++) {
        if (i === k) continue
        if (Math.abs(d[i]) < 1e-9) { if (p[i] < -1e-6 || p[i] > 1 + 1e-6) return null; continue }
        const a = (0 - p[i]) / d[i], b = (1 - p[i]) / d[i]
        t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b))
    }
    if (t1 - t0 < 1e-6) return null
    return [add(p, mul(d, t0)), add(p, mul(d, t1))]
}
// Пересечение двух прямых в одной грани (2D по свободным осям); null — параллельны
const meetIn = (face: Face, p: V3, d: V3, q: V3, e: V3): V3 | null => {
    const k = FACE_AXIS[face][0]
    const [i, j] = [0, 1, 2].filter((x) => x !== k)
    const den = d[i] * e[j] - d[j] * e[i]
    if (Math.abs(den) < 1e-9) return null
    const t = ((q[i] - p[i]) * e[j] - (q[j] - p[j]) * e[i]) / den
    return add(p, mul(d, t))
}
const inCube = (v: V3) => v.every((c) => c > -1e-6 && c < 1 + 1e-6)
// Точка на невидимой стене (сзади, слева, на полу — и только там) — её подписывают в круглых скобках: ( • )
const hiddenPt = (v: V3) => { const f = planesOf(v); return inCube(v) && f.length > 0 && f.every((x) => HIDDEN_FACES.includes(x)) }
const ParenMarks = ({ r = 13, color = '#F2F7FB' }: { r?: number; color?: string }) => (
    <g fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
        <path d={`M ${-r * 0.55} ${-r} Q ${-r * 1.25} 0 ${-r * 0.55} ${r}`} />
        <path d={`M ${r * 0.55} ${-r} Q ${r * 1.25} 0 ${r * 0.55} ${r}`} />
    </g>
)
// Ожидаемое сечение: плоскость через 3 стартовые точки ∩ 12 рёбер куба
const sbExpectedOf = (start: V3[]) => {
    const [A, B, C] = start
    const u = sub(B, A), w = sub(C, A)
    const n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
    const dot = (x: V3) => x[0] * n[0] + x[1] * n[1] + x[2] * n[2]
    const verts: V3[] = []
    for (const [a, b] of EDGES) {
        const P0 = V[a] as V3, P1 = V[b] as V3
        const f0 = dot(sub(P0, A)), f1 = dot(sub(P1, A))
        if (Math.abs(f0 - f1) < 1e-12) continue
        const t = f0 / (f0 - f1)
        if (t < -1e-6 || t > 1 + 1e-6) continue
        const X = add(P0, mul(sub(P1, P0), t))
        if (!verts.some((v) => same(v, X))) verts.push(X)
    }
    const faces = (Object.keys(FACE_POLY) as Face[]).filter((f) => verts.filter((v) => facesOfV(v).includes(f)).length >= 2)
    return { verts, faces }
}
const sbPolyOf = (verts: V3[]) => {
    const pts = verts.map(P)
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
    return pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}
const SB_RULES: { n: Tool; name: string; hint: string }[] = [
    { n: 1, name: 'Соединить', hint: 'Тапни две точки на одной стене' },
    { n: 2, name: 'Параллельно', hint: 'Тапни линию, потом точку на параллельной стене' },
    { n: 3, name: 'Продлить', hint: 'Тапни линию, потом ребро на той же стене' },
    { n: 4, name: 'Проекция', hint: 'Тапни две точки НЕ на полу' },
]
// init — уже построенное до этого этапа (точки, линии сечения, вспомогательные пунктиры)
type SandboxCfg = { start: V3[]; title: string; text: string; rules?: Tool[]; init?: { pts: V3[]; segs: { a: V3; b: V3; face: Face }[]; aux: { a: V3; b: V3 }[] } }
// «Камера»: обычная рамка рисунка; если новая точка за краем — рамка расширяется (с тем же соотношением сторон),
// куб уменьшается. Дальше SB_MIN_SCALE не отъезжаем — такую точку не строим, предлагаем другое ребро.
const SB_VIEW = { x: -12, y: -14, w: 384, h: 306 }
const SB_MIN_SCALE = 0.6
const SB_MARGIN = 26
// Компактная рамка для задач правила 4: куб + точки с небольшим полем, без запаса сверху/снизу
const CUBE_CORNERS: V3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]
const tightViewFor = (vs: V3[]) => {
    const ps = [...CUBE_CORNERS, ...vs].map(P), m = 26
    const minX = Math.min(...ps.map((q) => q.x)) - m, maxX = Math.max(...ps.map((q) => q.x)) + m
    const minY = Math.min(...ps.map((q) => q.y)) - m, maxY = Math.max(...ps.map((q) => q.y)) + m
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, scale: SB_VIEW.w / (maxX - minX) }
}
const sbViewFor = (vs: V3[]) => {
    const ps = vs.map(P)
    const minX = Math.min(SB_VIEW.x, ...ps.map((q) => q.x - SB_MARGIN)), maxX = Math.max(SB_VIEW.x + SB_VIEW.w, ...ps.map((q) => q.x + SB_MARGIN))
    const minY = Math.min(SB_VIEW.y, ...ps.map((q) => q.y - SB_MARGIN)), maxY = Math.max(SB_VIEW.y + SB_VIEW.h, ...ps.map((q) => q.y + SB_MARGIN))
    let w = maxX - minX, h = maxY - minY
    // держим соотношение сторон, чтобы высота блока не прыгала
    const k = SB_VIEW.w / SB_VIEW.h
    if (w / h < k) w = h * k; else h = w / k
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
    return { x: cx - w / 2, y: cy - h / 2, w, h, scale: SB_VIEW.w / w }
}
const vbStr = (v: { x: number; y: number; w: number; h: number }) => `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`
const SandboxScene = ({ onSettled, onMistake, start, title, text, init, rules }: SceneProps & SandboxCfg) => {
    const [sbExpected] = useState(() => sbExpectedOf(start))
    const [sbPoly] = useState(() => sbPolyOf(sbExpected.verts))
    const [typed, setTyped] = useState(false)
    const [pts, setPts] = useState<SbPt[]>(() => [...start, ...(init?.pts ?? [])].map((v, i) => ({ id: i, v })))
    const [segs, setSegs] = useState<SbSeg[]>(() => (init?.segs ?? []).map((x, i) => ({ id: 50 + i, ...x })))
    const [aux, setAux] = useState<SbAux[]>(() => (init?.aux ?? []).map((x, i) => ({ id: 70 + i, ...x })))
    const [deco, setDeco] = useState<V3[]>([]) // проекции на пол (правило 4)
    const [tool, setTool] = useState<Tool | null>(null)
    const [selPt, setSelPt] = useState<number | null>(null)
    const [selSeg, setSelSeg] = useState<number | null>(null)
    const [msg, setMsg] = useState<MsgState>(null)
    const [ghost, setGhost] = useState<{ a: V3; b: V3; dx: number; dy: number } | null>(null)
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)
    // отскок кнопки правила: { n — какое правило, k — счётчик, чтобы отскок повторялся }
    const [bounce, setBounce] = useState<{ n: Tool; k: number } | null>(null)
    const bounceTool = (n: Tool) => setBounce((b) => ({ n, k: (b?.k ?? 0) + 1 }))
    // провели линию / нашли точку — снова с правила 1: выбираем его и он один раз подпрыгивает
    const rollback1 = () => { setTool(1); resetSel(); bounceTool(1) }
    const uid = useRef(100)
    const nid = () => ++uid.current
    const resetSel = () => { setSelPt(null); setSelSeg(null) }
    const fail = (text: string) => { badPair(onMistake); setMsg({ ok: false, text: `${pickWrongTryPhrase()} ${text}` }); resetSel() }
    const addPoints = (vs: V3[], cur: SbPt[]) => {
        const out = [...cur]
        for (const v of vs) if (!out.some((p) => same(p.v, v))) out.push({ id: nid(), v })
        return out
    }
    const checkDone = (next: SbSeg[]) => {
        if (sbExpected.faces.every((f) => next.some((s) => s.face === f))) {
            setDone(true); setTool(null)
            setMsg({ ok: true, text: 'Сечение замкнулось! 🎉', meme: true })
            setTimeout(() => onSettled?.(), 900)
        }
    }
    // провести хорду грани; first — точка, выбранная первой (от неё и рисуем)
    const drawChord = (face: Face, chord: [V3, V3], first: V3, okText: string) => {
        const [c0, c1] = dist3(chord[0], first) <= dist3(chord[1], first) ? chord : [chord[1], chord[0]]
        const seg: SbSeg = { id: nid(), a: c0, b: c1, face }
        const next = [...segs, seg]
        setSegs(next)
        setBusy(true)
        setTimeout(() => {
            setPts((cur) => addPoints([c0, c1], cur))
            setBusy(false)
            setMsg({ ok: true, text: okText, meme: true })
            rollback1()
            checkDone(next)
        }, 1300)
    }
    const tapPoint = (p: SbPt) => {
        if (busy || done || !tool) return
        if (tool === 1) {
            if (selPt === null || selPt === p.id) { setSelPt(selPt === p.id ? null : p.id); setMsg(null); return }
            const A = pts.find((x) => x.id === selPt)!.v, B = p.v
            resetSel()
            const common = facesOfV(A).filter((f) => facesOfV(B).includes(f))
            if (!common.length) return fail('Эти точки не на одной стене — линия прошла бы сквозь комнату')
            const face = common.find((f) => !segs.some((s) => s.face === f))
            if (!face) return fail('На этой стене линия уже есть')
            const chord = chordIn(face, A, sub(B, A))
            if (!chord) return fail('Здесь линия не заходит в куб')
            // если одна из точек вне куба — дорисуем вспомогательный пунктир от неё до куба
            for (const X of [A, B]) if (!inCube(X)) {
                const near = dist3(chord[0], X) < dist3(chord[1], X) ? chord[0] : chord[1]
                setAux((a) => [...a, { id: nid(), a: X, b: near }])
            }
            return drawChord(face, chord, inCube(A) ? A : dist3(chord[0], A) < dist3(chord[1], A) ? chord[0] : chord[1],
                `Правило 1 сработало: линия ${FACE_ON[face]}`)
        }
        if (tool === 2) {
            if (selSeg === null) return fail('Сначала тапни линию, которую переносим')
            const s = segs.find((x) => x.id === selSeg)!
            resetSel()
            const target = OPPOSITE[s.face]
            if (!facesOfV(p.v).includes(target)) return fail(`Эта точка не на стене, параллельной линии (линия ${FACE_ON[s.face]})`)
            if (segs.some((x) => x.face === target)) return fail(`${FACE_ON[target][0].toUpperCase()}${FACE_ON[target].slice(1)} линия уже есть`)
            const chord = chordIn(target, p.v, sub(s.b, s.a))
            if (!chord) return fail('Линия через эту точку не заходит в куб')
            const mid = P(mul(add(s.a, s.b), 0.5)), to = P(p.v)
            setGhost({ a: s.a, b: s.b, dx: to.x - mid.x, dy: to.y - mid.y })
            setBusy(true)
            setTimeout(() => { setGhost(null); setBusy(false); drawChord(target, chord, p.v, `Правило 2: ${FACE_NAME[s.face]} и ${FACE_NAME[target]} параллельны — перенесли линию`) }, 1500)
            return
        }
        if (tool === 3) fail('Для правила 3 тапни линию, а потом ребро куба')
        if (tool === 4) {
            // правило 4: две точки НЕ на полу → линия через них и её проекция на пол пересекаются в X (на полу)
            if (Math.abs(p.v[2]) < EPS) { resetSel(); return fail('Эта точка уже на полу — опускать её не нужно. Выбери две точки НЕ на полу') }
            if (selPt === null || selPt === p.id) { setSelPt(selPt === p.id ? null : p.id); setMsg(null); return }
            const A = pts.find((x) => x.id === selPt)!.v, B = p.v
            resetSel()
            if (Math.abs(A[2] - B[2]) < EPS) return fail('Эти точки на одной высоте — их линия идёт параллельно полу и пол не пересечёт')
            const X = add(A, mul(sub(B, A), A[2] / (A[2] - B[2])))
            if (pts.some((q) => same(q.v, X))) return fail('Эту точку уже нашли')
            if (sbViewFor([...pts.map((q) => q.v), X]).scale < SB_MIN_SCALE) {
                setMsg({ ok: false, text: 'Точка X слишком далеко 🔭 Выбери другую пару точек' })
                return
            }
            const AP: V3 = [A[0], A[1], 0], BP: V3 = [B[0], B[1], 0]
            const far = dist3(A, X) > dist3(B, X) ? A : B, farP: V3 = [far[0], far[1], 0]
            setBusy(true)
            setAux((x) => [...x, { id: nid(), a: far, b: X, color: AUX_COLOR, width: 3, dash: '7 6' }])
            setTimeout(() => {
                setAux((x) => [...x, { id: nid(), a: A, b: AP, color: '#F2F7FB', width: 2, dash: '4 5' }, { id: nid(), a: B, b: BP, color: '#F2F7FB', width: 2, dash: '4 5' }])
                setDeco((d) => [...d, AP, BP])
            }, 1000)
            setTimeout(() => setAux((x) => [...x, { id: nid(), a: farP, b: X, color: PROJ_COLOR, width: 3, dash: '7 6' }]), 2000)
            setTimeout(() => {
                setPts((cur) => addPoints([X], cur)); setBusy(false)
                setMsg({ ok: true, text: 'Правило 4: линия и её проекция встретились — новая точка на полу', meme: true })
                rollback1()
            }, 3100)
        }
    }
    const tapSeg = (s: SbSeg) => {
        if (busy || done || !tool) return
        if (tool === 1) return fail('Для правила 1 тапай точки, а не линии')
        setSelSeg(selSeg === s.id ? null : s.id); setSelPt(null); setMsg(null)
    }
    const tapEdge = (a: string, b: string) => {
        if (busy || done || tool !== 3) return
        if (selSeg === null) return fail('Сначала тапни линию, которую продлеваем')
        const s = segs.find((x) => x.id === selSeg)!
        resetSel()
        if (!(FACE_POLY[s.face].includes(a) && FACE_POLY[s.face].includes(b))) return fail(`Ребро должно лежать на той же стене, что и линия (${FACE_ON[s.face]})`)
        const E0 = V[a] as V3, E1 = V[b] as V3
        const X = meetIn(s.face, s.a, sub(s.b, s.a), E0, sub(E1, E0))
        if (!X) return fail('Линия и ребро параллельны — они не пересекутся')
        if (inCube(X)) return fail('Они уже пересекаются в точке сечения — продлевать не нужно')
        if (pts.some((p) => same(p.v, X))) return fail('Эту точку уже нашли')
        // слишком далеко — куб стал бы крошечным: не строим и не считаем ошибкой
        if (sbViewFor([...pts.map((p) => p.v), X]).scale < SB_MIN_SCALE) {
            setMsg({ ok: false, text: 'Точка слишком далеко 🔭 Продли другое ребро — пересечение будет ближе' })
            return
        }
        const nearS = dist3(s.a, X) < dist3(s.b, X) ? s.a : s.b, nearE = dist3(E0, X) < dist3(E1, X) ? E0 : E1
        setAux((x) => [...x, { id: nid(), a: nearS, b: X }, { id: nid(), a: nearE, b: X }])
        setBusy(true)
        setTimeout(() => {
            setPts((cur) => addPoints([X], cur)); setBusy(false)
            setMsg({ ok: true, text: 'Правило 3: продлили — новая точка. Она лежит сразу на двух стенах', meme: true })
            rollback1()
        }, 1300)
    }
    // повторный тап по уже выбранному правилу не сбрасывает выбор — правило просто подпрыгивает
    const pickTool = (t: Tool) => { if (busy || done) return; if (tool === t) { bounceTool(t); return } setTool(t); resetSel(); setMsg(null) }
    const hint = () => {
        const has = (f: Face) => segs.some((s) => s.face === f)
        const r1 = pts.some((a, i) => pts.slice(i + 1).some((b) => facesOfV(a.v).some((f) => facesOfV(b.v).includes(f) && !has(f)
            && chordIn(f, a.v, sub(b.v, a.v)) !== null)))
        const r2 = segs.some((s) => !has(OPPOSITE[s.face]) && pts.some((p) => facesOfV(p.v).includes(OPPOSITE[s.face])))
        const r4 = !r1 && !r2 && segs.length === 0 && !!rules?.includes(4)
        setMsg({ ok: true, text: r1 ? 'Подсказка: сейчас работает правило 1' : r2 ? 'Подсказка: правило 1 не работает, а правило 2 — да'
            : r4 ? 'Подсказка: линий ещё нет — опускай точки на пол, правило 4' : 'Подсказка: пора продлевать — правило 3' })
    }
    const lineOf = (a: V3, b: V3) => { const A = P(a), B = P(b); return { x1: A.x, y1: A.y, x2: B.x, y2: B.y } }
    const shownRules = SB_RULES.filter((r) => (rules ? rules.includes(r.n) : r.n <= 3))
    const edgeMode = tool === 3 && selSeg !== null
    const ptActive = tool === 1 || tool === 4 || (tool === 2 && selSeg !== null)
    // камера: показываем все точки; когда сечение готово — возвращаемся к обычному масштабу
    const view = done ? SB_VIEW : sbViewFor(pts.map((p) => p.v))
    const stepHint = !tool ? '👆 Выбери правило' : tool === 1 ? (selPt === null ? 'Тапни первую точку' : 'Теперь вторую точку на той же стене')
        : tool === 4 ? (selPt === null ? 'Тапни точку НЕ на полу' : 'Теперь вторую точку НЕ на полу')
        : selSeg === null ? 'Тапни линию сечения' : tool === 2 ? 'Теперь точку на параллельной стене' : 'Теперь ребро на той же стене'
    return (
        <>
            <GameHeader title={title} />
            <TypedBig small text={text} onDone={() => setTyped(true)} readMs={0} />
            {typed && (
                <div className={cn('w-full grid gap-2', shownRules.length === 2 ? 'grid-cols-2' : shownRules.length === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
                    {shownRules.map((r, i) => {
                        const on = tool === r.n
                        // правило ещё не выбрано — кнопки по очереди подпрыгивают и светятся: «жми сюда»
                        const call = !tool && !done && !busy
                        return (
                            <motion.div key={bounce?.n === r.n ? `b-${r.n}-${bounce.k}` : r.n} className="relative flex"
                                animate={call ? { y: [0, -6, 0] } : bounce?.n === r.n ? { y: [0, -12, 0, -4, 0], scale: [1, 1.15, 0.97, 1.03, 1] } : { y: 0 }}
                                transition={call ? { duration: 0.5, delay: i * 0.18, repeat: Infinity, repeatDelay: 1.3, ease: 'easeOut' } : bounce?.n === r.n ? { duration: 0.8, ease: 'easeOut' } : { duration: 0.2 }}>
                                {call && <span className="absolute -inset-1 rounded-2xl pointer-events-none animate-glow-pulse"
                                    style={{ boxShadow: `0 0 16px ${hexToRgba(SECT_COLOR, 0.7)}`, border: `2px solid ${hexToRgba(SECT_COLOR, 0.55)}`, animationDelay: `${i * 0.18}s` }} />}
                                <button type="button" onClick={() => pickTool(r.n)} disabled={done}
                                    className="relative w-full rounded-xl border-2 px-1 py-2 flex flex-col items-center gap-0.5 active:translate-y-[3px]"
                                    style={{ borderColor: on ? SECT_COLOR : call ? hexToRgba(SECT_COLOR, 0.6) : '#3A464E', backgroundColor: on ? hexToRgba(SECT_COLOR, 0.2) : '#161F23',
                                        boxShadow: on ? `0 3px 0 ${GGEGE_PALETTE.purple.bottom}` : '0 3px 0 #0E1518' }}>
                                    <span className="text-xs font-black" style={{ color: on || call ? SECT_COLOR : MUTED }}>{r.n}</span>
                                    <span className={cn('font-black', shownRules.length === 4 ? 'text-[11px] md:text-sm' : 'text-sm')} style={{ color: on || call ? '#F2F7FB' : '#C9D3D9' }}>{r.name}</span>
                                </button>
                            </motion.div>
                        )
                    })}
                </div>
            )}
            {/* подсказка «что делать сейчас» — при каждой смене появляется с отскоком, чтобы было видно, что она поменялась */}
            <div className="w-full flex justify-center min-h-8">
                {!done && (
                    <motion.div key={`${tool}-${stepHint}`} className="rounded-full px-3 py-1 text-sm md:text-base font-black"
                        initial={{ scale: 1.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}
                        style={{ color: tool ? '#F2F7FB' : SECT_COLOR, backgroundColor: hexToRgba(SECT_COLOR, tool ? 0.22 : 0.12), border: `1.5px solid ${hexToRgba(SECT_COLOR, 0.55)}` }}>
                        {colorize(stepHint)}
                    </motion.div>
                )}
            </div>
            <div className="w-full flex justify-center">
                <motion.svg initial={false} animate={{ viewBox: vbStr(view) }} transition={{ duration: 0.9, ease: 'easeInOut' }}
                    viewBox={vbStr(SB_VIEW)} className="w-full max-w-[440px] max-h-[34vh] overflow-visible">
                    {done && <motion.polygon points={sbPoly} fill={hexToRgba(SECT_COLOR, 0.32)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />}
                    {EDGES.map(([a, b]) => {
                        const L = lineOf(V[a] as V3, V[b] as V3)
                        return (
                            <g key={a + b}>
                                <line {...L} stroke={EDGE} strokeWidth={hidden(a, b) ? 2 : 3} strokeLinecap="round" strokeDasharray={hidden(a, b) ? '6 6' : undefined}
                                    opacity={edgeMode ? 0.95 : hidden(a, b) ? 0.6 : 1} />
                                {edgeMode && <line {...L} stroke={GGEGE_PALETTE.orange.button} strokeOpacity={0.18} strokeWidth={10} strokeLinecap="round" />}
                                {edgeMode && <line {...L} stroke="transparent" strokeWidth={22} onClick={() => tapEdge(a, b)} style={{ cursor: 'pointer' }} />}
                            </g>
                        )
                    })}
                    {aux.map((x) => {
                        const L = lineOf(x.a, x.b)
                        return <motion.line key={x.id} x1={L.x1} y1={L.y1} stroke={x.color ?? SECT_COLOR} strokeWidth={x.width ?? 2.5} strokeDasharray={x.dash ?? '6 5'} strokeLinecap="round" opacity={x.color ? 0.95 : 0.7}
                            initial={{ x2: L.x1, y2: L.y1 }} animate={{ x2: L.x2, y2: L.y2 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
                    })}
                    {/* проекции точек на пол (правило 4) — синие полые кружки */}
                    {deco.map((v, k) => { const c = P(v); return <circle key={`d${k}`} cx={c.x} cy={c.y} r={6.5} fill="#161F23" stroke={PROJ_COLOR} strokeWidth={3} /> })}
                    {segs.map((s) => {
                        const L = lineOf(s.a, s.b)
                        const sel = selSeg === s.id
                        const dash = HIDDEN_FACES.includes(s.face) ? '9 7' : undefined
                        return (
                            <g key={s.id}>
                                {sel && <line {...L} stroke="#F2C35B" strokeOpacity={0.55} strokeWidth={16} strokeLinecap="round" />}
                                <motion.line x1={L.x1} y1={L.y1} stroke={SECT_COLOR} strokeWidth={5} strokeLinecap="round" strokeDasharray={dash}
                                    initial={{ x2: L.x1, y2: L.y1 }} animate={{ x2: L.x2, y2: L.y2 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
                                {(tool === 2 || tool === 3) && <line {...L} stroke="transparent" strokeWidth={22} onClick={() => tapSeg(s)} style={{ cursor: 'pointer' }} />}
                            </g>
                        )
                    })}
                    {ghost && (
                        <motion.g initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: ghost.dx, y: ghost.dy, opacity: [0, 1, 1] }} transition={{ duration: 1.3, ease: 'easeInOut' }}>
                            <line {...lineOf(ghost.a, ghost.b)} stroke={SECT_COLOR} strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" />
                        </motion.g>
                    )}
                    {pts.map((p) => {
                        const c = P(p.v)
                        const sel = selPt === p.id
                        return (
                            // точки ловят тап только когда они нужны (правило 1, или правило 2 после выбора линии):
                            // иначе их круг-«мишень» закрывает короткую линию и тап по линии уходил в точку
                            <g key={p.id} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`} onClick={() => tapPoint(p)}
                                style={{ cursor: ptActive ? 'pointer' : undefined, pointerEvents: ptActive ? undefined : 'none' }}>
                                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }}>
                                    {sel && <circle r={18} fill={hexToRgba(SECT_COLOR, 0.35)} stroke={SECT_COLOR} strokeWidth={2} className="animate-sel-pulse" />}
                                    <circle r={sel ? 9.5 : 7.5} fill={sel ? '#FFFFFF' : SECT_COLOR} stroke={sel ? SECT_COLOR : '#F2F7FB'} strokeWidth={sel ? 3.5 : 2.5} />
                                    {hiddenPt(p.v) && <ParenMarks />}
                                    <circle r={22} fill="transparent" />
                                </motion.g>
                            </g>
                        )
                    })}
                </motion.svg>
            </div>
            {msg && <Msg ok={msg.ok} text={msg.text} meme={msg.meme} />}
            {typed && !done && (
                <button type="button" onClick={hint} className="text-sm font-bold underline underline-offset-4" style={{ color: MUTED }}>Подсказка: какое правило сейчас?</button>
            )}
            {done && <LocalAnswerConfetti />}
        </>
    )
}

// Куб 3 и ещё пять расстановок (подобраны и проверены скриптом: сечение строится правилами 1–3).
// Сначала три четырёхугольника (правила 1 и 2), потом пятиугольник и шестиугольник (нужно и правило 3).
const SANDBOXES: SandboxCfg[] = [
    // от простого к сложному: первые 2 куба — только правила 1 и 2 (кнопки «Продлить» нет), с куба 5 доступно правило 3
    { start: [[0.4, 0, 1], [1, 0.5, 1], [0.3, 0, 0]], title: 'Строй сам ⚡', text: 'Выбирай правило и строй сечение', rules: [1, 2] },
    { start: [[1, 0, 0.6], [1, 1, 0.3], [0.5, 1, 1]], title: 'Куб 4 ⚡', text: 'Новые точки — построй сечение', rules: [1, 2] },
    { start: [[0, 0, 0.4], [0, 1, 0.7], [1, 0, 0.6]], title: 'Куб 5 ⚡', text: 'Построй сечение' },
    { start: SB_START, title: 'Куб 6 🔥', text: 'Посложнее: появляется правило 3 — продлевать' },
    { start: [[0.7, 0, 0], [1, 0, 0.3], [0, 0.7, 1]], title: 'Куб 7 🔥', text: 'Снова понадобится продлевать' },
    { start: [[1, 1, 0.6], [0, 0, 0.6], [1, 0.4, 1]], title: 'Куб 8 💀', text: 'Босс: самое сложное сечение' },
]
// ===== Урок «Кубик: 4 правило» (тот же SECTWALK, режим по тексту задания) =====
// Точки: на переднем нижнем ребре (65/35, ближе к правому углу), на дальнем правом вертикальном ребре чуть ниже середины,
// на левом ребре потолка ближе к дальнему углу. Ни одна пара не на одной стене, линий нет → правила 1–3 не работают.
// Правило 4 (проекция): две точки НЕ на полу → вспомогательная линия сквозь комнату → опускаем их на пол → соединяем
// проекции → продлеваем линию и её проекцию до пересечения X (на плоскости пола) → X и точка на полу — правило 1.
// Дальше правилами 1–2 достраивается шестиугольник. Всё посчитано по координатам.
const R4_FLOOR: V3 = [0.65, 0, 0]
const R4_EDGE: V3 = [1, 1, 0.45]
const R4_CEIL: V3 = [0, 0.6, 1]
const R4_START: V3[] = [R4_FLOOR, R4_EDGE, R4_CEIL]
const R4_EDGE_P: V3 = [1, 1, 0] // проекция точки на ребре — сам угол пола
const R4_CEIL_P: V3 = [0, 0.6, 0]
// линия R4_CEIL → R4_EDGE доходит до пола (z = 0) при t = 1 / (1 − 0.45)
const R4_X: V3 = add(R4_CEIL, mul(sub(R4_EDGE, R4_CEIL), 1 / (1 - 0.45)))
const R4_FLOOR_CHORD = chordIn('floor', R4_FLOOR, sub(R4_X, R4_FLOOR))!
const R4_N1: V3 = same(R4_FLOOR_CHORD[0], R4_FLOOR) ? R4_FLOOR_CHORD[1] : R4_FLOOR_CHORD[0]
type R4Line = { id: string; a: V3; b: V3; color: string; dash?: string; width?: number; opacity?: number; slow?: boolean }
type R4Pt = { id: string; v: V3; hollow?: boolean; label?: string }
// focusId — всё бледное, кроме этой точки (обведена пульсирующим кольцом)
const R4Svg = ({ pts, lines, zoomTo = [], onPoint, sel = null, ptActive = false, dim = false, focusId = null }: {
    pts: R4Pt[]; lines: R4Line[]; zoomTo?: V3[]; onPoint?: (id: string) => void; sel?: string | null; ptActive?: boolean; dim?: boolean; focusId?: string | null
}) => {
    const view = tightViewFor([...pts.map((p) => p.v), ...zoomTo])
    const lineOf = (a: V3, b: V3) => { const A = P(a), B = P(b); return { x1: A.x, y1: A.y, x2: B.x, y2: B.y } }
    return (
        <motion.div className="w-full flex justify-center" initial={false} animate={{ opacity: dim ? 0.08 : 1 }} transition={{ duration: 0.6 }}>
            <motion.svg initial={false} animate={{ viewBox: vbStr(view) }} transition={{ duration: 0.9, ease: 'easeInOut' }}
                viewBox={vbStr(tightViewFor([]))} className="w-full max-w-[440px] max-h-[34vh] overflow-visible">
                {EDGES.map(([a, b]) => (
                    <motion.line key={a + b} {...lineOf(V[a] as V3, V[b] as V3)} stroke={EDGE} strokeWidth={hidden(a, b) ? 2 : 3} strokeLinecap="round"
                        strokeDasharray={hidden(a, b) ? '6 6' : undefined} initial={false} animate={{ opacity: focusId ? 0.12 : hidden(a, b) ? 0.6 : 1 }} transition={{ duration: 0.6 }} />
                ))}
                {lines.map((l) => {
                    const L = lineOf(l.a, l.b)
                    return <motion.line key={l.id} x1={L.x1} y1={L.y1} stroke={l.color} strokeWidth={l.width ?? 5} strokeLinecap="round" strokeDasharray={l.dash}
                        opacity={l.opacity ?? 1} initial={{ x2: L.x1, y2: L.y1 }} animate={{ x2: L.x2, y2: L.y2 }} transition={{ duration: l.slow ? 1.4 : 0.9, ease: 'easeInOut' }} />
                })}
                {pts.map((p) => {
                    const c = P(p.v)
                    const isSel = sel === p.id
                    return (
                        <g key={p.id} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`} onClick={() => onPoint?.(p.id)}
                            style={{ cursor: ptActive ? 'pointer' : undefined, pointerEvents: ptActive ? undefined : 'none', opacity: focusId && focusId !== p.id ? 0.15 : 1, transition: 'opacity 0.6s' }}>
                            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }}>
                                {focusId === p.id && <circle r={24} fill={hexToRgba(SECT_COLOR, 0.25)} stroke={SECT_COLOR} strokeWidth={2.5} className="animate-sel-pulse" />}
                                {isSel && <circle r={18} fill={hexToRgba(SECT_COLOR, 0.35)} stroke={SECT_COLOR} strokeWidth={2} className="animate-sel-pulse" />}
                                {p.hollow
                                    ? <circle r={6.5} fill="#161F23" stroke={PROJ_COLOR} strokeWidth={3} />
                                    : <circle r={isSel ? 9.5 : 7.5} fill={isSel ? '#FFFFFF' : SECT_COLOR} stroke={isSel ? SECT_COLOR : '#F2F7FB'} strokeWidth={isSel ? 3.5 : 2.5} />}
                                {!p.hollow && hiddenPt(p.v) && <ParenMarks />}
                                {p.label && <text x={0} y={-17} textAnchor="middle" fontSize={17} fontWeight={900} fill={SECT_COLOR}
                                    style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{p.label}</text>}
                                <circle r={22} fill="transparent" />
                            </motion.g>
                        </g>
                    )
                })}
            </motion.svg>
        </motion.div>
    )
}
const JACKIE = { src: '/more-memes/meme-20.webp', flip: true }
// Расстановка задачи на правило 4: floor — точка на ребре пола, a и b — две точки НЕ на полу (никакие две не на одной стене).
// Всё остальное считаем: проекции на пол, X — где прямая ab пересекает плоскость пола, вторая точка сечения на полу.
// plane — куда проецируем: на пол (z = 0) или на потолок (z = 1), если одна точка уже на потолке («Точки на гранях»).
// floor — точка, которая уже лежит в этой плоскости (имя поля историческое); ends — концы следа сечения в этой плоскости,
// кроме самой точки (если она на ребре — один конец, если внутри грани — оба).
type R4Geo = { plane: 'floor' | 'ceiling'; floor: V3; a: V3; b: V3; aP: V3; bP: V3; X: V3; chord: [V3, V3]; N1: V3; ends: V3[]; base: R4Pt[]; start: V3[] }
const makeR4Geo = (floor: V3, a: V3, b: V3, plane: 'floor' | 'ceiling' = 'floor'): R4Geo => {
    const zt = plane === 'floor' ? 0 : 1
    const X = add(a, mul(sub(b, a), (zt - a[2]) / (b[2] - a[2])))
    const chord = chordIn(plane, floor, sub(X, floor))!
    const ends = chord.filter((c) => !same(c, floor))
    const N1 = dist3(chord[0], X) < dist3(chord[1], X) ? chord[0] : chord[1] // конец следа ближе к X
    return { plane, floor, a, b, aP: [a[0], a[1], zt], bP: [b[0], b[1], zt], X, chord, N1, ends,
        base: [{ id: 'floor', v: floor }, { id: 'edge', v: a }, { id: 'ceil', v: b }], start: [floor, a, b] }
}
const R4_GEO = makeR4Geo(R4_FLOOR, R4_EDGE, R4_CEIL)
// Ещё 3 задачи на правило 4 — подобраны скриптом: никакие две точки не на одной стене, X на полу вне куба,
// сечение — шестиугольник без вершин в углах, после правила 4 достраивается правилами 1–2.
const R4_MORE: { geo: R4Geo; title: string }[] = [
    { geo: makeR4Geo([0, 0.75, 0], [0.4, 0, 1], [1, 1, 0.3]), title: 'Сечение 2' },
    { geo: makeR4Geo([0.35, 0, 0], [0, 1, 0.3], [1, 0.35, 1]), title: 'Сечение 3' },
    { geo: makeR4Geo([0.65, 1, 0], [0, 0, 0.3], [1, 0.75, 1]), title: 'Сечение 4 — финал' },
]

// «Точки на гранях»: M — на потолке, K — на правой стене, N — на задней (её не видно → в скобках).
// Проецируем K и N на потолок (там уже M): прямая KN и её проекция встречаются в X на потолке; X и M — след на потолке.
// Подобрано скриптом: X рядом с кубом, след пересекает потолок по двум рёбрам, сечение — пятиугольник без углов.
const FACES_GEO = makeR4Geo([0.45, 0.55, 1], [1, 0.4, 0.7], [0.35, 1, 0.4], 'ceiling')

// Сцена 1: задача
const R4TaskScene = ({ onSettled, g = R4_GEO, title = 'Новое сечение' }: SceneProps & { g?: R4Geo; title?: string }) => {
    const [cube, setCube] = useState(false)
    return (
        <>
            <TypedBig text={title} memeFixed={JACKIE} onDone={() => setCube(true)} />
            {cube && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 600)}>
                    <R4Svg pts={g.base} lines={[]} />
                </DiagramBlock>
            )}
            {cube && <TaskLine />}
        </>
    )
}

// Сцена 2: правило 1 не работает, правил 2 и 3 тоже — линий нет → правило 4
const R4CheckScene = ({ onSettled, onMistake, g = R4_GEO }: SceneProps & { g?: R4Geo }) => {
    const onCeil = g.plane === 'ceiling'
    const [phase, setPhase] = useState(0) // 0 вопрос, 1 зачёркиваем 1, 2 «линий нет», 3 зачёркиваем 2 и 3, 4 правило 4
    const [typed, setTyped] = useState(false)
    const [wrong, setWrong] = useState<string[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    useEffect(() => {
        const t = phase === 1 ? setTimeout(() => setPhase(2), 2200) : phase === 3 ? setTimeout(() => setPhase(4), 2400) : null
        return () => { if (t) clearTimeout(t) }
    }, [phase])
    const answer = (v: 'yes' | 'no') => {
        if (!typed || phase !== 0) return
        if (v === 'no') { setFlash(null); setPhase(1); return }
        badPair(onMistake); setWrong(['yes'])
        setFlash(`${pickWrongTryPhrase()} Посмотри: каждая точка на своих стенах — общей стены ни у одной пары нет`)
    }
    useEffect(() => { if (phase === 2) setTyped(false) }, [phase])
    const crossed = phase >= 3 ? [1, 2, 3] : phase >= 1 ? [1] : []
    const active = phase >= 4 ? 4 : phase >= 3 ? 3 : 1
    return (
        <>
            <CheatStrip active={active} crossed={crossed} focus={phase === 1 || phase === 3 || phase === 4} />
            {phase === 1 && <Msg ok meme text="Правило 1 не работает — зачёркиваем ✗" />}
            {phase === 3 && <Msg ok text="Правила 2 и 3 тоже не помогут — зачёркиваем ✗" />}
            {phase >= 4 && <Msg ok text="Остаётся правило 4 — проекция 👆" />}
            <R4Svg pts={g.base} lines={[]} dim={phase === 1 || phase === 3} />
            {phase === 0 && <TypedBig small text="Можем ли воспользоваться правилом 1? Есть две точки на одной стене?" meme="wow" onDone={() => setTyped(true)} readMs={0} />}
            {phase === 0 && typed && <YesNo wrong={wrong} onPick={answer} />}
            {phase === 2 && <TypedBig small text="Правила 2 и 3 работают с готовой линией. А линий у нас пока нет" meme="wow" onDone={() => setTyped(true)} readMs={0} />}
            {phase === 2 && typed && <NextBtn onClick={() => setPhase(3)}>Реально — 2 и 3 не катят</NextBtn>}
            {phase >= 4 && <TypedBig small text={onCeil ? 'Правило 4 — проекция. Одна точка уже на потолке. Значит проецируем не на пол, а на потолок!' : 'Правило 4: опускаем точки на пол и ищем, где сечение пересекает пол'} meme="wow" onDone={() => setTimeout(() => onSettled?.(), 500)} readMs={0} />}
            {flash && phase === 0 && <Msg ok={false} text={flash} />}
        </>
    )
}

// Сцена 3: само правило 4 — по шагам, ученик делает руками
const R4ProjScene = ({ onSettled, onMistake, g = R4_GEO }: SceneProps & { g?: R4Geo }) => {
    const ceil = g.plane === 'ceiling'
    const W = ceil ? { on: 'на потолке', to: 'на потолок', name: 'потолок', move: 'Подняли', moveBtn: 'Поднимем их на потолок ⬆', reached: 'дошли до потолка' }
        : { on: 'на полу', to: 'на пол', name: 'пол', move: 'Опустили', moveBtn: 'Опустим их на пол ⬇', reached: 'дошли до пола' }
    const [phase, setPhase] = useState(0)
    // 0 выбери две точки не на полу, 1 линия сквозь комнату, 2 опустили на пол, 3 соединили проекции,
    // 4 продлили → X, 5 соедини X и точку на полу, 6 готово
    const [typed, setTyped] = useState(false)
    const [sel, setSel] = useState<string | null>(null)
    const [pair, setPair] = useState<[V3, V3] | null>(null) // порядок выбора: от первой ко второй
    const [floorFirst, setFloorFirst] = useState<V3>(g.X)
    const [msg, setMsg] = useState<MsgState>(null)
    const [xWrong, setXWrong] = useState<Face[]>([])
    const [xOk, setXOk] = useState(false)
    useEffect(() => { setTyped(false) }, [phase])
    // «В какой плоскости точка X?» — нужен пол
    const pickXFace = (f: Face) => {
        if (xOk || xWrong.includes(f)) return
        if (f === g.plane) { setXOk(true); setMsg({ ok: true, text: `Да! X ${W.on} — и при этом в плоскости сечения`, meme: true }); return }
        badPair(onMistake); setXWrong((w) => [...w, f])
        setMsg({ ok: false, text: `${pickWrongTryPhrase()} Обе линии, которые мы продлевали, ${W.reached}` })
    }
    const pick = (id: string) => {
        if (phase === 0) {
            if (id === 'floor') { badPair(onMistake); setMsg({ ok: false, text: `${pickWrongTryPhrase()} Эта точка уже ${W.on} — её проецировать не нужно` }); setSel(null); return }
            if (sel === null || sel === id) { setSel(sel === id ? null : id); setMsg(null); return }
            const v = (k: string) => (k === 'edge' ? g.a : g.b)
            setPair([v(sel), v(id)]); setSel(null); setMsg(null); showAnswerMeme(true); setPhase(1)
            return
        }
        if (phase === 5) {
            if (id !== 'X' && id !== 'floor') { badPair(onMistake); setMsg({ ok: false, text: `${pickWrongTryPhrase()} Нужны две точки ${W.on}: X и точка, которая там уже была` }); setSel(null); return }
            if (sel === null || sel === id) { setSel(sel === id ? null : id); setMsg(null); return }
            setFloorFirst(sel === 'X' ? g.X : g.floor); setSel(null); setPhase(6)
            setMsg({ ok: true, text: `Правило 1: обе точки ${W.on} — соединили. Линия упёрлась в ${g.ends.length > 1 ? 'рёбра — новые точки' : 'ребро — новая точка'} 📍`, meme: true })
            setTimeout(() => onSettled?.(), 1800)
        }
    }
    const pts: R4Pt[] = [...g.base]
    if (phase >= 2) pts.push({ id: 'ceilP', v: g.bP, hollow: true }, { id: 'edgeP', v: g.aP, hollow: true })
    if (phase >= 4) pts.push({ id: 'X', v: g.X, label: 'X' })
    if (phase >= 6) g.ends.forEach((v, k) => pts.push({ id: `n${k}`, v }))
    const lines: R4Line[] = []
    if (phase >= 1 && pair) lines.push({ id: 'aux', a: pair[0], b: pair[1], color: AUX_COLOR, dash: '7 6', width: 3, slow: true })
    if (phase >= 2) {
        lines.push({ id: 'dropC', a: g.b, b: g.bP, color: '#F2F7FB', dash: '4 5', width: 2, opacity: 0.8 })
        lines.push({ id: 'dropE', a: g.a, b: g.aP, color: '#F2F7FB', dash: '4 5', width: 2, opacity: 0.8 })
    }
    if (phase >= 3) lines.push({ id: 'proj', a: g.bP, b: g.aP, color: PROJ_COLOR, dash: '7 6', width: 3, slow: true })
    if (phase >= 4) {
        lines.push({ id: 'extAux', a: g.a, b: g.X, color: AUX_COLOR, dash: '7 6', width: 3, slow: true })
        lines.push({ id: 'extProj', a: g.aP, b: g.X, color: PROJ_COLOR, dash: '7 6', width: 3, slow: true })
    }
    if (phase >= 6) {
        const near = dist3(g.chord[0], floorFirst) <= dist3(g.chord[1], floorFirst)
        const [c0, c1] = near ? g.chord : [g.chord[1], g.chord[0]]
        const segDashP = ceil ? undefined : '9 7' // потолок виден — сплошная, пол не виден — пунктир
        if (same(floorFirst, g.X)) lines.push({ id: 'xFloor', a: g.X, b: g.N1, color: SECT_COLOR, dash: '6 5', width: 2.5, opacity: 0.7 })
        lines.push({ id: 'floorSeg', a: c0, b: c1, color: SECT_COLOR, dash: segDashP, slow: true })
        if (!same(floorFirst, g.X)) lines.push({ id: 'xFloor', a: g.N1, b: g.X, color: SECT_COLOR, dash: '6 5', width: 2.5, opacity: 0.7 })
    }
    const prompt = phase === 0 ? `Выбери две точки, которые НЕ ${W.on}`
        : phase === 1 ? 'Проведём через них вспомогательную линию — она идёт сквозь куб'
            : phase === 2 ? `${W.move} обе точки ${W.to} — это их проекции`
                : phase === 3 ? 'Соединили проекции. Линия и её проекция лежат в одной плоскости — значит пересекутся'
                    : phase === 4 ? 'Продлили обе — вот точка X. В какой плоскости она находится?'
                        : phase === 5 ? `Теперь ${W.on} две точки — соедини их (правило 1)` : null
    const next: Record<number, string> = { 1: W.moveBtn, 2: 'Соединим проекции', 3: 'Продлим обе!', 4: 'Используем X' }
    return (
        <>
            <CheatStrip active={phase >= 5 ? 1 : 4} crossed={phase >= 5 ? [] : [1, 2, 3]} />
            <R4Svg pts={pts} lines={lines} zoomTo={phase >= 4 ? [g.X] : []} onPoint={pick} sel={sel} ptActive={phase === 0 || phase === 5} />
            {prompt && <TypedBig key={`p-${phase}`} small text={prompt} lineColor={phase >= 1 && phase <= 4 ? AUX_COLOR : undefined} onDone={() => setTyped(true)} readMs={0} />}
            {/* после «это их проекции» — значок, которым проекции нарисованы на кубе */}
            {phase === 2 && typed && (
                <motion.div className="flex justify-center -mt-2" initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}>
                    <svg viewBox="-12 -12 24 24" className="w-7 h-7"><circle r={7.5} fill="#161F23" stroke={PROJ_COLOR} strokeWidth={3} /></svg>
                </motion.div>
            )}
            {phase === 4 && typed && !xOk && <FaceOptions wrong={xWrong} onPick={pickXFace} />}
            {next[phase] && typed && (phase !== 4 || xOk) && <NextBtn onClick={() => { setMsg(null); setPhase(phase + 1) }}>{next[phase]}</NextBtn>}
            {msg && <Msg ok={msg.ok} text={msg.text} meme={msg.meme} />}
            {phase >= 6 && <LocalAnswerConfetti />}
        </>
    )
}

// Достройка после правила 4 — тот же пульт, уже есть X и линия на полу
const R4FinishScene = ({ g = R4_GEO, ...props }: SceneProps & { g?: R4Geo }) => (
    <SandboxScene {...props} start={g.start} title="Достраиваем ⚡" text="Дальше — правила 1, 2 и 3 на пульте. Дострой сечение"
        init={{ pts: [g.X, ...g.ends], segs: [{ a: g.chord[0], b: g.chord[1], face: g.plane }], aux: [{ a: g.N1, b: g.X }] }} />
)
// Сечения 2–4: сразу «Строй сам» — на пульте все 4 правила, без повторного подробного рассказа
const R4_MORE_SCENES = R4_MORE.map(({ geo, title }, k) => {
    const Scene = (pr: SceneProps) => <SandboxScene {...pr} start={geo.start} rules={[1, 2, 3, 4]} title={`${title} ⚡`} text="Строй сам — на пульте 4 правила" />
    Scene.displayName = `R4More${k}`
    return Scene
})
// ===== Урок «Точки на гранях» (тот же SECTWALK, режим по тексту задания) =====
// Точка на невидимой стене — в круглых скобках ( • ). Строим почти по правилу 4, только проецируем на потолок, где уже лежит M.
const ParenPoint = () => (
    <span className="inline-flex items-center align-middle font-black" style={{ color: '#F2F7FB' }}>
        (<span className="inline-block rounded-full mx-0.5" style={{ width: '0.7em', height: '0.7em', backgroundColor: SECT_COLOR, border: '0.13em solid #F2F7FB' }} />)
    </span>
)
const FacesTaskScene = ({ onSettled }: SceneProps) => {
    const [step, setStep] = useState(0)
    return (
        <>
            <TypedBig text="Точки на гранях" memeFixed={JACKIE} onDone={() => setStep(1)} />
            {step >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setStep(2), 500)}>
                    <R4Svg pts={FACES_GEO.base} lines={[]} />
                </DiagramBlock>
            )}
            {step >= 2 && <TypedBig small text="Теперь точки лежат не на рёбрах, а прямо на стенах" meme="wow" onDone={() => setStep(3)} readMs={300} />}
            {step >= 3 && <TaskLine onDone={() => onSettled?.()} />}
        </>
    )
}
// Точка на задней стене: всё бледное, кроме неё; объясняем скобки
const BackPointScene = ({ onSettled }: SceneProps) => {
    const [step, setStep] = useState(0)
    useEffect(() => {
        if (step !== 1) return
        const t = setTimeout(() => onSettled?.(), 1200)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])
    return (
        <>
            <R4Svg pts={FACES_GEO.base} lines={[]} focusId="ceil" />
            <TypedBig small text="Эта точка лежит на задней стене — её не видно" onDone={() => setStep(1)} readMs={300} />
            {step >= 1 && (
                <motion.div className="w-full text-center font-black text-lg md:text-xl text-[#F2F7FB]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    Поэтому у неё особое обозначение — в круглых скобках: <ParenPoint />
                </motion.div>
            )}
        </>
    )
}
const FacesCheckScene = (pr: SceneProps) => <R4CheckScene {...pr} g={FACES_GEO} />
const FacesProjScene = (pr: SceneProps) => <R4ProjScene {...pr} g={FACES_GEO} />
const FacesFinishScene = (pr: SceneProps) => <R4FinishScene {...pr} g={FACES_GEO} />
const FACES_SCENES = [FacesTaskScene, BackPointScene, FacesCheckScene, FacesProjScene, FacesFinishScene]
const FACES_MAP_LABELS = ['Задача', 'Точка сзади ( • )', 'Правила 1–3 не работают', 'Проекция на потолок', 'Достраиваем']
const FACES_PRACTICE = new Set<unknown>([FacesCheckScene, FacesProjScene, FacesFinishScene])
const FACES_NEXT_LABELS: React.ReactNode[] = ['Погнали', <span key="bp" className="inline-flex items-center gap-1">Понял, точка сзади — <ParenPoint /></span>,
    'Как это — на потолок?', 'Достроим!', 'Готово']

const R4_SCENES = [R4TaskScene, R4CheckScene, R4ProjScene, R4FinishScene, ...R4_MORE_SCENES]
const R4_MAP_LABELS = ['Задача', 'Правила 1–3 не работают', 'Правило 4: проекция', 'Достраиваем',
    ...R4_MORE.map((_, k) => `Сечение ${k + 2}: строй сам`)]
const R4_PRACTICE = new Set<unknown>([R4CheckScene, R4ProjScene, R4FinishScene, ...R4_MORE_SCENES])
const R4_NEXT_LABELS = ['Погнали', 'Как это — проекция?', 'Достроим!', 'Ещё сечение! 🔥', 'Ещё одно!', 'Финальное! 💀', 'Готово']

const SANDBOX_SCENES = SANDBOXES.map((cfg) => {
    const Scene = (props: SceneProps) => <SandboxScene {...props} {...cfg} />
    Scene.displayName = `Sandbox-${cfg.title}`
    return Scene
})

const BASE_SCENES = [RoomScene, WallTestScene, PointsScene, CheatIntroScene, Rule1TryScene, Rule2Scene, CloseGameScene,
    C2TaskScene, C2Rule1Scene, C2Rule2Scene, C2Rule3Scene, C2FinishScene, ...SANDBOX_SCENES]
const BASE_MAP_LABELS = ['Куб — комната', 'Тест: стены', 'Три точки', 'Шпора', 'Пробуем правило 1', 'Правило 2', 'Замкни сечение',
    'Новое сечение', 'Куб 2: правило 1', 'Куб 2: правило 2', 'Куб 2: правило 3 (X)', 'Куб 2: достроить', 'Куб 3: строй сам (4 точки)', 'Куб 4 (4 точки)', 'Куб 5 (4 точки)', 'Куб 6: правило 3 (5 точек)', 'Куб 7 (5 точек)', 'Куб 8 (6 точек)']
const BASE_PRACTICE = new Set<unknown>([WallTestScene, Rule1TryScene, CloseGameScene, C2Rule1Scene, C2Rule2Scene, C2Rule3Scene, C2FinishScene, ...SANDBOX_SCENES])
const BASE_NEXT_LABELS = ['Понял, это комната', 'Стены знаю 🧱', 'Строим сечение ✂️', 'Попробуем правило №1', 'Правило 1 — изи',
    'Соединим их!', 'Ещё сечение!', 'Погнали', 'Дальше — правило 2', 'Дальше — правило 3', 'X найдена!', 'Теперь сам! ⚡', 'Ещё куб!', 'Ещё куб!', 'Давай сложнее 🔥', 'Дальше', 'Го на 6 точек', 'Готово']

export const TypeSectWalk = ({ question, onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    // «Кубик: 4 правило» — отдельный урок на том же типе, выбираем по тексту задания
    const rule4 = /4 правило/i.test(question.question)
    // «Точки на гранях» — тоже отдельный урок на этом типе
    const faces = /Точки на гранях/i.test(question.question)
    const SCENES = faces ? FACES_SCENES : rule4 ? R4_SCENES : BASE_SCENES
    const SCENE_MAP_LABELS = faces ? FACES_MAP_LABELS : rule4 ? R4_MAP_LABELS : BASE_MAP_LABELS
    const PRACTICE_SCENES = faces ? FACES_PRACTICE : rule4 ? R4_PRACTICE : BASE_PRACTICE
    const NEXT_LABELS: React.ReactNode[] = faces ? FACES_NEXT_LABELS : rule4 ? R4_NEXT_LABELS : BASE_NEXT_LABELS
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
        <RuleCountCtx.Provider value={rule4 || faces ? 4 : 3}>
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
                    animate={{ opacity: (SCENES as unknown[])[step] === Rule1PlateScene && !stepReady ? 0 : 1, y: (SCENES as unknown[])[step] === Rule1PlateScene && !stepReady ? 8 : 0 }}
                    transition={{ duration: (SCENES as unknown[])[step] === Rule1PlateScene && !stepReady ? 0 : 0.3 }}>
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {NEXT_LABELS[step]}
                    </button>
                </motion.div>
                {/* упражнение пройдено — рядом с кнопкой «Стены знаю» и т.п. радуется мем, смотрит на кнопку */}
                {stepReady && !advancing && PRACTICE_SCENES.has(SCENES[step]) && <SideMeme key={`meme-${step}`} mood="yay" toward="left" />}
            </div>
        </div>
        </RuleCountCtx.Provider>
    )
}
