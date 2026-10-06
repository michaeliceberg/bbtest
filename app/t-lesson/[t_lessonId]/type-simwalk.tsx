// app/t-lesson/[t_lessonId]/type-simwalk.tsx
//
// Тип SIMWALK — пошаговый разбор «Подобие треугольников» (юнит «Планиметрия
// ЕГЭ», урок 1). Самодостаточный тип, как остальные *WALK. Цель — дать всё,
// что нужно для №17 профильного ЕГЭ (анализ темы 276 на sdamgia: подобие —
// самый частый приём, ~50% задач):
//   1. Что такое подобие: копия в другом масштабе, k.
//   2. Соответствие вершин и сторон (порядок букв в ΔABC ~ ΔMNK) — мини-игра.
//   3. Пропорция из сходственных сторон (собери из кнопок).
//   4. Признак «по двум углам» — игра «подобны ли?».
//   5. Откуда берутся равные углы (вертикальные, накрест лежащие, общий угол,
//      «дополняют до 90°») — игра с чертежами.
//   6. Три типовых чертежа: «шапочка» (DE ∥ BC), «бабочка» (пересекающиеся
//      отрезки при AB ∥ CD), высота из прямого угла (h² = a·b, катет² = гип·проекция).
//   7. Площади: ×k² (отношение площадей подобных).
//   8. Алгоритм из 4 шагов → тренировка из 8 заданий (ответ собирается из кнопок).

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GeoFig, lerp, intersect, xf, outward, centroid, type FigItem, type Pt } from '@/components/geometry/GeoFig'
import { FormulaAssemble, type FormulaChip } from '@/components/geometry/FormulaAssemble'
import { InsightCard, InsightWord } from '@/components/geometry/WalkthroughCards'
import {
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}

const SCENE_TRANSITION_PAUSE_MS = 1000

const BLUE = '#53ADEF'
const ORANGE = '#F09B38'
const GREEN = '#78C93C'
const PURPLE = '#C385F7'
const TEAL = '#5CC99F'
const YEL = '#F2C35B'
const WHITE = '#F2F7FB'

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
const shuffle = <T,>(arr: T[]): T[] => {
    const c = [...arr]
    for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[c[i], c[j]] = [c[j], c[i]]
    }
    return c
}

// ===== Общие кусочки интерфейса =====

type Part = { t: string; c?: string }

// Печатаем плоский текст, после печати — та же строка с цветными словами.
const Typed = ({ parts, onDone, className }: { parts: Part[]; onDone?: () => void; className?: string }) => {
    const [typed, setTyped] = useState(false)
    const plain = parts.map((p) => p.t).join('')
    return (
        <div className={cn('w-full text-center text-lg md:text-xl font-bold text-[#F2F7FB] leading-snug', className)}>
            {!typed ? (
                <Typewriter text={plain} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), 450) }} />
            ) : (
                parts.map((p, i) => <span key={i} style={p.c ? { color: p.c } : undefined}>{p.t}</span>)
            )}
        </div>
    )
}

const ReplyBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button type="button" onClick={onClick} className={`${walkthroughButtonClass(true)} w-full`} style={walkthroughButtonStyle(true)}>
            {label}
        </button>
    </motion.div>
)

const WrongFlash = ({ text }: { text: string | null }) => (
    text ? (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
            <X className="w-5 h-5" /> {text}
        </div>
    ) : null
)

// Мини-игра «собери формулу»: ошибки не идут в зачёт урока.
const AssembleGame = ({ onSolved, ...fa }: { prefix: string; layout: 'fraction' | 'product' | 'single'; chips: FormulaChip[]; correct: [string, string]; alsoCorrect?: [string, string][]; onSolved: () => void }) => {
    const [flash, setFlash] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <FormulaAssemble
                {...fa}
                onWrong={() => { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setFlash(pickWrongTryPhrase()) }}
                onSolved={() => { setFlash(null); setDone(true); showAnswerMeme(true); setTimeout(onSolved, 700) }}
            />
            {!done && <WrongFlash text={flash} />}
        </div>
    )
}

const Fig = ({ items, maxW = 440, vb }: { items: FigItem[]; maxW?: number; vb?: [number, number] }) => (
    <div className="w-full flex justify-center">
        <div className="w-full rounded-2xl border-2 border-[#2A353B] bg-[#161F23] p-2" style={{ maxWidth: maxW }}>
            <GeoFig items={items} vb={vb} />
        </div>
    </div>
)

// ===== Чертежи =====

const T = (pts: Pt[], color: string, show = true, delay = 0, w = 4): FigItem => ({ k: 'poly', pts, color, show, delay, w })
const L = (t: string, at: Pt, color = WHITE, show = true, size = 20, delay = 0): FigItem => ({ k: 'text', at, text: t, color, show, size, delay })

// «Шапочка»: DE ∥ BC.
const HAT_A: Pt = [200, 24], HAT_B: Pt = [50, 210], HAT_C: Pt = [350, 210]
const HAT_D = lerp(HAT_A, HAT_B, 0.45), HAT_E = lerp(HAT_A, HAT_C, 0.45)
export const hatItems = (stage: number, labels = true): FigItem[] => [
    T([HAT_A, HAT_B, HAT_C], WHITE),
    { k: 'seg', a: HAT_D, b: HAT_E, color: BLUE, w: 5, show: stage >= 1 },
    { k: 'arc', v: HAT_D, p1: HAT_A, p2: HAT_E, color: YEL, show: stage >= 2, r: 24 },
    { k: 'arc', v: HAT_B, p1: HAT_A, p2: HAT_C, color: YEL, show: stage >= 2, r: 24 },
    { k: 'arc', v: HAT_E, p1: HAT_A, p2: HAT_D, color: TEAL, show: stage >= 2, r: 24 },
    { k: 'arc', v: HAT_C, p1: HAT_A, p2: HAT_B, color: TEAL, show: stage >= 2, r: 24 },
    { k: 'arc', v: HAT_A, p1: HAT_B, p2: HAT_C, color: ORANGE, show: stage >= 2, r: 30 },
    ...(labels ? [
        L('A', [HAT_A[0], HAT_A[1] - 14]), L('B', [HAT_B[0] - 16, HAT_B[1] + 8]), L('C', [HAT_C[0] + 16, HAT_C[1] + 8]),
        L('D', [HAT_D[0] - 16, HAT_D[1]], BLUE, stage >= 1), L('E', [HAT_E[0] + 16, HAT_E[1]], BLUE, stage >= 1),
    ] : []),
]

// «Бабочка»: AB ∥ DC, диагонали AC и BD пересекаются в O.
const BF_A: Pt = [120, 54], BF_B: Pt = [280, 54], BF_D: Pt = [50, 196], BF_C: Pt = [350, 196]
const BF_O = intersect(BF_A, BF_C, BF_B, BF_D)
export const bflyItems = (stage: number, labels = true): FigItem[] => [
    { k: 'seg', a: BF_A, b: BF_B, color: WHITE, w: 4 },
    { k: 'seg', a: BF_D, b: BF_C, color: WHITE, w: 4 },
    { k: 'seg', a: BF_A, b: BF_C, color: BLUE, w: 4, show: stage >= 1 },
    { k: 'seg', a: BF_B, b: BF_D, color: ORANGE, w: 4, show: stage >= 1, delay: 0.3 },
    { k: 'arc', v: BF_O, p1: BF_A, p2: BF_B, color: YEL, show: stage >= 2, r: 15 },
    { k: 'arc', v: BF_O, p1: BF_C, p2: BF_D, color: YEL, show: stage >= 2, r: 15 },
    { k: 'arc', v: BF_A, p1: BF_B, p2: BF_O, color: TEAL, show: stage >= 2, r: 24 },
    { k: 'arc', v: BF_C, p1: BF_D, p2: BF_O, color: TEAL, show: stage >= 2, r: 24 },
    ...(labels ? [
        L('A', [BF_A[0] - 14, BF_A[1] - 12]), L('B', [BF_B[0] + 14, BF_B[1] - 12]),
        L('D', [BF_D[0] - 14, BF_D[1] + 12]), L('C', [BF_C[0] + 14, BF_C[1] + 12]),
        L('O', [BF_O[0] + 24, BF_O[1] + 2], YEL, stage >= 1),
    ] : []),
]

// Высота из прямого угла.
const H_A: Pt = [40, 204], H_B: Pt = [360, 204], H_C: Pt = [94.2, 84], H_H: Pt = [94.2, 204]
export const heightItems = (stage: number, labels = true): FigItem[] => [
    { k: 'poly', pts: [H_A, H_H, H_C], color: 'transparent', fill: hexToRgba(BLUE, 0.2), w: 0, show: stage >= 2 },
    { k: 'poly', pts: [H_H, H_B, H_C], color: 'transparent', fill: hexToRgba(ORANGE, 0.2), w: 0, show: stage >= 2 },
    T([H_A, H_B, H_C], WHITE),
    { k: 'seg', a: H_C, b: H_H, color: PURPLE, w: 5, show: stage >= 1 },
    { k: 'right', v: H_C, p1: H_A, p2: H_B, show: true },
    { k: 'right', v: H_H, p1: H_C, p2: H_B, show: stage >= 1, size: 11 },
    { k: 'arc', v: H_A, p1: H_B, p2: H_C, color: YEL, show: stage >= 3, r: 28 },
    { k: 'arc', v: H_C, p1: H_B, p2: H_H, color: YEL, show: stage >= 3, r: 22 },
    { k: 'arc', v: H_B, p1: H_A, p2: H_C, color: TEAL, show: stage >= 3, r: 28 },
    { k: 'arc', v: H_C, p1: H_A, p2: H_H, color: TEAL, show: stage >= 3, r: 30 },
    ...(labels ? [
        L('A', [H_A[0] - 14, H_A[1] + 6]), L('B', [H_B[0] + 14, H_B[1] + 6]), L('C', [H_C[0] - 4, H_C[1] - 16]),
        L('H', [H_H[0] + 4, H_H[1] + 18], PURPLE, stage >= 1),
    ] : []),
]

type SrcKind = 'v' | 'alt' | 'common' | 'comp'
const SRC_LABEL: Record<SrcKind, string> = { v: 'Вертикальные', alt: 'Накрест лежащие', common: 'Общий угол', comp: 'Дополняют до 90°' }
export const srcItems = (kind: SrcKind): FigItem[] => {
    if (kind === 'v') {
        const o: Pt = [200, 120], r1: Pt = [330, 190], r2: Pt = [70, 50], r3: Pt = [330, 50], r4: Pt = [70, 190]
        return [
            { k: 'seg', a: r2, b: r1, color: WHITE }, { k: 'seg', a: r4, b: r3, color: WHITE },
            { k: 'arc', v: o, p1: r3, p2: r1, color: YEL, r: 30 }, { k: 'arc', v: o, p1: r2, p2: r4, color: YEL, r: 30 },
        ]
    }
    if (kind === 'alt') {
        const i1: Pt = [227.5, 70], i2: Pt = [152.5, 170]
        return [
            { k: 'seg', a: [50, 70], b: [350, 70], color: BLUE }, { k: 'seg', a: [50, 170], b: [350, 170], color: BLUE },
            { k: 'seg', a: [120, 213], b: [260, 22], color: WHITE },
            { k: 'arc', v: i1, p1: [50, 70], p2: i2, color: YEL, r: 24 }, { k: 'arc', v: i2, p1: [350, 170], p2: i1, color: YEL, r: 24 },
            L('||', [330, 120], BLUE, true, 22),
        ]
    }
    if (kind === 'common') {
        const A: Pt = [200, 30], B: Pt = [80, 210], C: Pt = [320, 210]
        const D = lerp(A, B, 0.5), E = lerp(A, C, 0.5)
        return [
            T([A, B, C], WHITE), { k: 'seg', a: D, b: E, color: BLUE },
            { k: 'arc', v: A, p1: B, p2: C, color: YEL, r: 30 },
            L('A', [A[0], A[1] - 14]),
        ]
    }
    return [
        T([H_A, H_B, H_C], WHITE), { k: 'seg', a: H_C, b: H_H, color: PURPLE, w: 4 },
        { k: 'right', v: H_C, p1: H_A, p2: H_B }, { k: 'right', v: H_H, p1: H_C, p2: H_B, size: 11 },
        { k: 'arc', v: H_A, p1: H_B, p2: H_C, color: YEL, r: 28 }, { k: 'arc', v: H_C, p1: H_B, p2: H_H, color: YEL, r: 22 },
    ]
}

// ===== Сцены-разбор =====

type SceneProps = { onSettled: () => void }

// 0. Копия в другом масштабе.
const HookScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [copied, setCopied] = useState(false)
    const [t2, setT2] = useState(false)
    const P0: Pt = [30, 206], P1: Pt = [110, 206], P2: Pt = [30, 146]
    const Q0: Pt = [190, 216], Q1: Pt = [350, 216], Q2: Pt = [190, 96]
    const items: FigItem[] = [
        T([P0, P1, P2], BLUE),
        { k: 'right', v: P0, p1: P1, p2: P2 }, { k: 'arc', v: P1, p1: P0, p2: P2, color: YEL, r: 24 },
        L('4', [70, 224], BLUE, true, 18), L('3', [14, 176], BLUE, true, 18), L('5', [84, 168], BLUE, true, 18),
        T([Q0, Q1, Q2], ORANGE, copied),
        { k: 'right', v: Q0, p1: Q1, p2: Q2, show: copied }, { k: 'arc', v: Q1, p1: Q0, p2: Q2, color: YEL, r: 24, show: copied },
        L('8', [270, 234], ORANGE, copied, 18, 0.6), L('6', [172, 156], ORANGE, copied, 18, 0.8), L('10', [282, 148], ORANGE, copied, 18, 1),
    ]
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed
                parts={[{ t: 'Подобные треугольники — это ' }, { t: 'один и тот же', c: YEL }, { t: ' треугольник, только увеличенный или уменьшенный.' }]}
                onDone={() => setT1(true)}
            />
            {t1 && <Fig items={items} vb={[400, 250]} />}
            {t1 && !copied && <ReplyBtn label="Скопировать ×2" onClick={() => { setCopied(true); setTimeout(() => setT2(true), 2000) }} />}
            {t2 && (
                <Typed
                    parts={[{ t: 'Углы те же, а все стороны выросли в ' }, { t: 'одно и то же', c: YEL }, { t: ' число раз. Оно называется ' }, { t: 'коэффициент подобия k', c: ORANGE }, { t: ' (тут k = 2).' }]}
                    onDone={() => setTimeout(onSettled, 1200)}
                />
            )}
        </div>
    )
}

// Треугольник ABC и его подобная копия MNK (повёрнутая и зеркальная, чтобы
// соответствие не угадывалось «по положению»).
const TRI_ABC: Pt[] = [[44, 204], [190, 204], [112, 62]]
const TRI_MNK: Pt[] = (() => {
    const pts = xf(TRI_ABC, { rot: 200, mirror: true, scale: 0.72 })
    const c = centroid(pts)
    return pts.map((p) => [p[0] + (300 - c[0]), p[1] + (132 - c[1])] as Pt)
})()
const NAMES1 = ['A', 'B', 'C'], NAMES2 = ['M', 'N', 'K']

type MatchRound = { kind: 'angle'; i: number } | { kind: 'side'; i: number; j: number }
const MATCH_ROUNDS: MatchRound[] = [
    { kind: 'angle', i: 1 }, { kind: 'side', i: 1, j: 2 }, { kind: 'angle', i: 2 }, { kind: 'side', i: 0, j: 2 },
]

// 1. Соответствие вершин и сторон.
const MatchScene = ({ onSettled }: SceneProps) => {
    const [intro, setIntro] = useState(false)
    const [r, setR] = useState(0)
    const [solved, setSolved] = useState<number[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [wrongClicked, setWrongClicked] = useState<string | null>(null)
    const round = MATCH_ROUNDS[Math.min(r, MATCH_ROUNDS.length - 1)]
    const finished = r >= MATCH_ROUNDS.length
    const c1 = centroid(TRI_ABC), c2 = centroid(TRI_MNK)

    const answer = (key: string, ok: boolean) => {
        if (finished || solved.includes(r)) return
        if (ok) {
            setFlash(null); setWrongClicked(null)
            showAnswerMeme(true)
            setSolved((s) => [...s, r])
            setTimeout(() => { if (r + 1 >= MATCH_ROUNDS.length) { setR(r + 1); setTimeout(onSettled, 900) } else setR(r + 1) }, 900)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setWrongClicked(key); setFlash(pickWrongTryPhrase())
            setTimeout(() => setWrongClicked(null), 700)
        }
    }

    const items: FigItem[] = []
    items.push(T(TRI_ABC, BLUE), T(TRI_MNK, ORANGE))
    TRI_ABC.forEach((p, i) => items.push(L(NAMES1[i], outward(p, c1, 20), BLUE)))
    TRI_MNK.forEach((p, i) => items.push(L(NAMES2[i], outward(p, c2, 20), ORANGE)))
    MATCH_ROUNDS.forEach((m, idx) => {
        const done = solved.includes(idx)
        const active = idx === r && !finished
        if (m.kind === 'angle') {
            const a = TRI_ABC, b = TRI_MNK
            const i = m.i, o1 = (i + 1) % 3, o2 = (i + 2) % 3
            if (active || done) items.push({ k: 'arc', v: a[i], p1: a[o1], p2: a[o2], color: YEL, r: 26 })
            if (done) items.push({ k: 'arc', v: b[i], p1: b[o1], p2: b[o2], color: YEL, r: 22 })
        } else {
            if (active || done) items.push({ k: 'seg', a: TRI_ABC[m.i], b: TRI_ABC[m.j], color: YEL, w: 7 })
            if (done) items.push({ k: 'seg', a: TRI_MNK[m.i], b: TRI_MNK[m.j], color: YEL, w: 7 })
        }
    })
    // Кликабельные цели во втором треугольнике — только пока идёт раунд.
    if (intro && !finished) {
        if (round.kind === 'angle') {
            TRI_MNK.forEach((p, i) => items.push({
                k: 'dot', at: p, r: 9, color: wrongClicked === `v${i}` ? '#DC605B' : ORANGE, hit: 26, pulse: true,
                onClick: () => answer(`v${i}`, i === round.i),
            }))
        } else {
            ;[[0, 1], [1, 2], [0, 2]].forEach(([i, j]) => items.push({
                k: 'seg', a: TRI_MNK[i], b: TRI_MNK[j], color: wrongClicked === `s${i}${j}` ? '#DC605B' : 'transparent', w: 8, hit: true,
                onClick: () => answer(`s${i}${j}`, (i === round.i && j === round.j) || (i === round.j && j === round.i)),
            }))
        }
    }
    const question = finished ? 'Отлично — соответствие найдено!' : round.kind === 'angle'
        ? `Угол ${NAMES1[round.i]} равен какому углу в ΔMNK? Нажми на вершину.`
        : `Сторона ${NAMES1[round.i]}${NAMES1[round.j]} сходственна какой стороне ΔMNK? Нажми на неё.`
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed
                parts={[{ t: 'Запись ' }, { t: 'ΔABC ~ ΔMNK', c: YEL }, { t: ' — не просто так: ' }, { t: 'буквы идут по порядку соответствия', c: ORANGE }, { t: '. A↔M, B↔N, C↔K.' }]}
                onDone={() => setIntro(true)}
            />
            {intro && <Fig items={items} vb={[400, 250]} />}
            {intro && (
                <div className="w-full text-center text-base md:text-lg font-bold" style={{ color: finished ? GREEN : WHITE }}>{question}</div>
            )}
            {intro && !finished && <WrongFlash text={flash} />}
        </div>
    )
}

// 2. Пропорция из сходственных сторон.
const ProportionScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [solved, setSolved] = useState(false)
    const chips: FormulaChip[] = shuffle(['BC', 'NK', 'AC', 'MK', 'AB', 'MN'].map((s) => ({ id: s, label: s })))
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed parts={[{ t: 'Если ΔABC ~ ΔMNK, то ' }, { t: 'отношения сходственных сторон равны', c: YEL }, { t: ' — это и есть k:' }]} onDone={() => setT1(true)} />
            {t1 && (
                <div className="text-xl md:text-2xl font-black text-[#F2F7FB] tracking-wide">
                    <span style={{ color: BLUE }}>AB</span>/<span style={{ color: ORANGE }}>MN</span> = <span style={{ color: BLUE }}>BC</span>/<span style={{ color: ORANGE }}>NK</span> = <span style={{ color: BLUE }}>AC</span>/<span style={{ color: ORANGE }}>MK</span> = k
                </div>
            )}
            {t1 && (
                <>
                    <p className="text-base md:text-lg text-[#F2F7FB] text-center">Дополни пропорцию — выбери вторую дробь:</p>
                    <AssembleGame
                        prefix="AB / MN =" layout="fraction" chips={chips} correct={['BC', 'NK']} alsoCorrect={[['AC', 'MK']]}
                        onSolved={() => setSolved(true)}
                    />
                </>
            )}
            {solved && (
                <InsightCard>
                    В каждой дроби — <InsightWord>сторона первого</InsightWord> / <InsightWord>сходственная второго</InsightWord>. Не переворачивай одну дробь!
                </InsightCard>
            )}
            {solved && <Settle onSettled={onSettled} ms={2200} />}
        </div>
    )
}

// Невидимый «таймер готовности» сцены.
const Settle = ({ onSettled, ms }: { onSettled: () => void; ms: number }) => {
    useEffect(() => { const t = setTimeout(onSettled, ms); return () => clearTimeout(t) }, [])
    return null
}

// 3. Признак «по двум углам».
type SimRound = { a: [number, number]; b: [number, number] }
const SIM_ROUNDS_BASE: SimRound[] = [
    { a: [40, 70], b: [70, 70] },
    { a: [50, 60], b: [60, 80] },
    { a: [30, 80], b: [70, 30] },
    { a: [40, 60], b: [60, 70] },
]
const third = (p: [number, number]) => 180 - p[0] - p[1]
const isSimilar = (r: SimRound) => {
    const x = [...r.a, third(r.a)].sort((m, n) => m - n).join(','), y = [...r.b, third(r.b)].sort((m, n) => m - n).join(',')
    return x === y
}

const AngleScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [rounds] = useState(() => shuffle(SIM_ROUNDS_BASE))
    const [r, setR] = useState(0)
    const [answered, setAnswered] = useState<boolean | null>(null)
    const [flash, setFlash] = useState<string | null>(null)
    const [ins, setIns] = useState(false)
    const cur = rounds[Math.min(r, rounds.length - 1)]
    const finished = r >= rounds.length

    const choose = (yes: boolean) => {
        if (answered !== null || finished) return
        if (yes === isSimilar(cur)) {
            setFlash(null); showAnswerMeme(true); setAnswered(yes)
            setTimeout(() => {
                setAnswered(null)
                if (r + 1 >= rounds.length) { setR(r + 1); setIns(true) } else setR(r + 1)
            }, 2200)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setFlash(pickWrongTryPhrase())
        }
    }
    const btn = (yes: boolean, label: string) => (
        <button type="button" onClick={() => choose(yes)} disabled={answered !== null}
            className="flex-1 h-12 rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#1B252B] text-[#F2F7FB] font-extrabold hover:border-[#4A90D9] active:border-b-2 disabled:opacity-50">
            {label}
        </button>
    )
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed
                parts={[{ t: 'Чтобы доказать подобие, не нужно проверять всё: достаточно ' }, { t: 'двух равных углов', c: YEL }, { t: '. Третий найдётся сам — сумма углов 180°.' }]}
                onDone={() => setT1(true)}
            />
            {t1 && !finished && (
                <div className="w-full rounded-2xl border-2 border-[#2A353B] bg-[#161F23] p-3 flex flex-col gap-2 text-base md:text-lg font-bold">
                    <div className="flex justify-between"><span style={{ color: BLUE }}>ΔABC: ∠A = {cur.a[0]}°, ∠B = {cur.a[1]}°</span><span className="text-[#5C6B73]">{r + 1}/{rounds.length}</span></div>
                    <div style={{ color: ORANGE }}>ΔMNK: ∠M = {cur.b[0]}°, ∠N = {cur.b[1]}°</div>
                    {answered !== null && (
                        <div className="text-[#9AA7B0] text-sm md:text-base font-semibold">
                            Третьи углы: {third(cur.a)}° и {third(cur.b)}° → наборы {[...cur.a, third(cur.a)].join('°, ')}° и {[...cur.b, third(cur.b)].join('°, ')}° {isSimilar(cur) ? 'совпали' : 'разные'}.
                        </div>
                    )}
                </div>
            )}
            {t1 && !finished && (
                <>
                    <p className="text-base md:text-lg text-[#F2F7FB]">Эти треугольники подобны?</p>
                    <div className="w-full flex gap-3">{btn(true, 'Подобны')}{btn(false, 'Не подобны')}</div>
                    <WrongFlash text={answered === null ? flash : null} />
                </>
            )}
            {ins && (
                <InsightCard>
                    <InsightWord>Два угла равны</InsightWord> → треугольники <InsightWord>подобны</InsightWord>. Это работает в 9 задачах из 10!
                </InsightCard>
            )}
            {ins && <Settle onSettled={onSettled} ms={2000} />}
        </div>
    )
}

// 4. Откуда берутся равные углы.
const SourcesScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [order] = useState<SrcKind[]>(() => shuffle<SrcKind>(['v', 'alt', 'common', 'comp']))
    const [r, setR] = useState(0)
    const [solved, setSolved] = useState(false)
    const [flash, setFlash] = useState<string | null>(null)
    const [ins, setIns] = useState(false)
    const finished = r >= order.length
    const kind = order[Math.min(r, order.length - 1)]
    const choose = (k: SrcKind) => {
        if (solved || finished) return
        if (k === kind) {
            setFlash(null); showAnswerMeme(true); setSolved(true)
            setTimeout(() => { setSolved(false); if (r + 1 >= order.length) { setR(r + 1); setIns(true) } else setR(r + 1) }, 1000)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setFlash(pickWrongTryPhrase())
        }
    }
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed
                parts={[{ t: 'Откуда взять равные углы? Их ' }, { t: 'всего 4 источника', c: YEL }, { t: '. Угадай, какой из них на чертеже.' }]}
                onDone={() => setT1(true)}
            />
            {t1 && !finished && <Fig items={srcItems(kind)} maxW={380} />}
            {t1 && !finished && (
                <>
                    <p className="text-base md:text-lg text-[#F2F7FB] text-center">Почему выделенные углы равны?</p>
                    <div className="w-full grid grid-cols-2 gap-2">
                        {(Object.keys(SRC_LABEL) as SrcKind[]).map((k) => (
                            <button key={k} type="button" onClick={() => choose(k)}
                                className={cn('min-h-12 rounded-xl border-2 border-b-4 px-2 font-extrabold text-sm md:text-base active:border-b-2',
                                    solved && k === kind ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]' : 'border-[#3A464E] bg-[#1B252B] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                {SRC_LABEL[k]}
                            </button>
                        ))}
                    </div>
                    <WrongFlash text={flash} />
                </>
            )}
            {ins && (
                <InsightCard label="💡 Шпаргалка">
                    <InsightWord>Вертикальные · накрест лежащие · общий угол · дополняют до 90°</InsightWord> — ищи равные углы среди этих четырёх.
                </InsightCard>
            )}
            {ins && <Settle onSettled={onSettled} ms={2200} />}
        </div>
    )
}

// 5. «Шапочка» (DE ∥ BC).
const HatScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [stage, setStage] = useState(0)
    const [t2, setT2] = useState(false)
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed parts={[{ t: 'Самый частый чертёж: ' }, { t: 'прямая, параллельная стороне', c: BLUE }, { t: ', отрезает «шапочку».' }]} onDone={() => setT1(true)} />
            {t1 && <Fig items={hatItems(stage)} vb={[400, 240]} />}
            {t1 && stage === 0 && <ReplyBtn label="Проведи DE параллельно BC" onClick={() => { setStage(1); setTimeout(() => setStage(2), 1500); setTimeout(() => setT2(true), 2600) }} />}
            {t2 && (
                <Typed
                    parts={[{ t: '∠ADE = ∠ABC', c: YEL }, { t: ' (соответственные), ' }, { t: '∠A — общий', c: ORANGE }, { t: ' → ΔADE ~ ΔABC.' }]}
                    onDone={() => setTimeout(() => setStage(3), 300)}
                />
            )}
            {stage === 3 && (
                <>
                    <InsightCard>
                        <InsightWord>Параллельно стороне → подобный треугольник.</InsightWord>
                        <div className="mt-2 text-lg">AD/AB = AE/AC = DE/BC</div>
                    </InsightCard>
                    <Settle onSettled={onSettled} ms={2000} />
                </>
            )}
        </div>
    )
}

// 6. «Бабочка» (AB ∥ DC, пересекающиеся отрезки).
const ButterflyScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [stage, setStage] = useState(0)
    const [t2, setT2] = useState(false)
    const [ins, setIns] = useState(false)
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed parts={[{ t: 'Два параллельных отрезка и ' }, { t: 'пересекающиеся диагонали', c: YEL }, { t: ' — это «бабочка».' }]} onDone={() => setT1(true)} />
            {t1 && <Fig items={bflyItems(stage)} vb={[400, 240]} />}
            {t1 && stage === 0 && <ReplyBtn label="Проведи AC и BD" onClick={() => { setStage(1); setTimeout(() => setStage(2), 1800); setTimeout(() => setT2(true), 2800) }} />}
            {t2 && (
                <Typed
                    parts={[{ t: '∠AOB = ∠COD', c: YEL }, { t: ' (вертикальные), ' }, { t: '∠OAB = ∠OCD', c: TEAL }, { t: ' (накрест лежащие) → ΔOAB ~ ΔOCD.' }]}
                    onDone={() => setIns(true)}
                />
            )}
            {ins && (
                <>
                    <InsightCard>
                        <InsightWord>Параллельные + пересечение → «бабочка».</InsightWord>
                        <div className="mt-2 text-lg">OA/OC = OB/OD = AB/CD</div>
                    </InsightCard>
                    <Settle onSettled={onSettled} ms={2000} />
                </>
            )}
        </div>
    )
}

// 7. Высота из прямого угла.
const HeightScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [stage, setStage] = useState(0)
    const [t2, setT2] = useState(false)
    const [g1, setG1] = useState(false)
    const [g2, setG2] = useState(false)
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed parts={[{ t: 'В прямоугольном треугольнике ' }, { t: 'высота из прямого угла', c: PURPLE }, { t: ' делит его на два подобных треугольника.' }]} onDone={() => setT1(true)} />
            {t1 && <Fig items={heightItems(stage)} vb={[400, 240]} />}
            {t1 && stage === 0 && <ReplyBtn label="Проведи высоту CH" onClick={() => { setStage(1); setTimeout(() => setStage(2), 1300); setTimeout(() => setStage(3), 2600); setTimeout(() => setT2(true), 3600) }} />}
            {t2 && (
                <Typed
                    parts={[{ t: 'ΔACH ~ ΔCBH ~ ΔABC', c: YEL }, { t: ' — у всех равные острые углы ' }, { t: '(α и 90° − α)', c: TEAL }, { t: '. Из подобия получаем две формулы.' }]}
                    onDone={() => setG1(true)}
                />
            )}
            {g1 && (
                <>
                    <p className="text-base md:text-lg text-[#F2F7FB] text-center">Квадрат катета = ?</p>
                    <AssembleGame
                        prefix="AC² =" layout="product" correct={['AH', 'AB']} alsoCorrect={[['AB', 'AH']]}
                        chips={shuffle(['AH', 'HB', 'AB', 'CH'].map((s) => ({ id: s, label: s })))}
                        onSolved={() => setG2(true)}
                    />
                </>
            )}
            {g2 && (
                <>
                    <p className="text-base md:text-lg text-[#F2F7FB] text-center">А квадрат высоты?</p>
                    <AssembleGameLast onSettled={onSettled} />
                </>
            )}
        </div>
    )
}

const AssembleGameLast = ({ onSettled }: { onSettled: () => void }) => {
    const [done, setDone] = useState(false)
    return (
        <>
            <AssembleGame
                prefix="CH² =" layout="product" correct={['AH', 'HB']} alsoCorrect={[['HB', 'AH']]}
                chips={shuffle(['AH', 'HB', 'AB', 'AC'].map((s) => ({ id: s, label: s })))}
                onSolved={() => setDone(true)}
            />
            {done && (
                <>
                    <InsightCard>
                        <InsightWord>Катет² = гипотенуза · его проекция</InsightWord>
                        <div className="mt-2 text-lg">AC² = AH·AB, BC² = BH·AB</div>
                        <InsightWord>Высота² = произведение проекций</InsightWord>
                        <div className="mt-1 text-lg">CH² = AH·HB</div>
                    </InsightCard>
                    <Settle onSettled={onSettled} ms={2500} />
                </>
            )}
        </>
    )
}

// 8. Площади: ×k².
const AREA_A: Pt = [60, 216], AREA_B: Pt = [340, 216], AREA_C: Pt = [200, 34]
export const areaItems = (k: number): FigItem[] => {
    const items: FigItem[] = [T([AREA_A, AREA_B, AREA_C], WHITE)]
    for (let i = 1; i < k; i++) {
        const t = i / k
        items.push({ k: 'seg', a: lerp(AREA_A, AREA_C, t), b: lerp(AREA_B, AREA_C, t), color: BLUE, w: 2.5 })
        items.push({ k: 'seg', a: lerp(AREA_A, AREA_B, t), b: lerp(AREA_B, AREA_C, 1 - t), color: BLUE, w: 2.5 })
        items.push({ k: 'seg', a: lerp(AREA_B, AREA_A, t), b: lerp(AREA_A, AREA_C, 1 - t), color: BLUE, w: 2.5 })
    }
    items.push({ k: 'poly', pts: [AREA_A, lerp(AREA_A, AREA_B, 1 / k), lerp(AREA_A, AREA_C, 1 / k)], color: ORANGE, fill: hexToRgba(ORANGE, 0.35), w: 3 })
    return items
}

const AreaScene = ({ onSettled }: SceneProps) => {
    const [t1, setT1] = useState(false)
    const [k, setK] = useState(1)
    const [seen, setSeen] = useState<number[]>([1])
    const [game, setGame] = useState(false)
    const [done, setDone] = useState(false)
    const pickK = (n: number) => { setK(n); setSeen((s) => (s.includes(n) ? s : [...s, n])) }
    useEffect(() => {
        if (seen.includes(2) && seen.includes(3) && !game) { const t = setTimeout(() => setGame(true), 1500); return () => clearTimeout(t) }
    }, [seen, game])
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Typed parts={[{ t: 'Стороны подобных треугольников отличаются в ' }, { t: 'k', c: ORANGE }, { t: ' раз. А площади? Посмотри сам: нажми k = 2 и k = 3.' }]} onDone={() => setT1(true)} />
            {t1 && <Fig items={areaItems(k)} vb={[400, 250]} maxW={380} />}
            {t1 && (
                <div className="flex gap-3 w-full">
                    {[1, 2, 3].map((n) => (
                        <button key={n} type="button" onClick={() => pickK(n)}
                            className={cn('flex-1 h-12 rounded-xl border-2 border-b-4 font-extrabold active:border-b-2', k === n ? 'border-[#F09B38] bg-[#F09B3822] text-[#F09B38]' : 'border-[#3A464E] bg-[#1B252B] text-[#F2F7FB]')}>
                            k = {n}
                        </button>
                    ))}
                </div>
            )}
            {t1 && (
                <div className="text-lg md:text-xl font-bold text-center" style={{ color: ORANGE }}>
                    Сторона ×{k} → в большой треугольник помещается {k * k} малых (площадь ×{k * k})
                </div>
            )}
            {game && (
                <>
                    <p className="text-base md:text-lg text-[#F2F7FB] text-center">Во сколько раз площадь больше, если стороны больше в k раз?</p>
                    <AssembleGame
                        prefix="S₂ / S₁ =" layout="single" correct={['k2', 'k2']}
                        chips={shuffle([{ id: 'k', label: 'k' }, { id: 'k2', label: 'k²' }, { id: '2k', label: '2k' }, { id: 'k1', label: 'k + 1' }])}
                        onSolved={() => setDone(true)}
                    />
                </>
            )}
            {done && (
                <>
                    <InsightCard>
                        Длины (стороны, периметр, высоты, медианы) — <InsightWord>×k</InsightWord>. Площади — <InsightWord>×k²</InsightWord>.
                    </InsightCard>
                    <Settle onSettled={onSettled} ms={2200} />
                </>
            )}
        </div>
    )
}

// 9. Алгоритм.
const AlgoScene = ({ onSettled }: SceneProps) => {
    const [step, setStep] = useState(0)
    const STEPS = ['Найди два равных угла', 'Запиши подобие — буквы по порядку', 'Составь пропорцию из сходственных сторон', 'Реши. Площади — через k²']
    useEffect(() => {
        if (step >= STEPS.length) { const t = setTimeout(onSettled, 1200); return () => clearTimeout(t) }
        const t = setTimeout(() => setStep((s) => s + 1), 1100)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <InsightCard label="💡 Алгоритм подобия">
                <div className="flex flex-col gap-2 text-left text-lg">
                    {STEPS.map((s, i) => (
                        <motion.div key={s} initial={{ opacity: 0, x: -16 }} animate={i < step ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }} transition={{ duration: 0.4 }}>
                            <InsightWord>{i + 1}.</InsightWord> {s}
                        </motion.div>
                    ))}
                </div>
            </InsightCard>
        </div>
    )
}

// ===== Тренировка =====

type Trial = {
    kind: 'hat' | 'bfly' | 'reason' | 'sim' | 'alt1' | 'alt2' | 'area'
    legend: string
    prompt: string
    figure: FigItem[] | null
    prefix: string
    layout: 'fraction' | 'product' | 'single'
    chips: FormulaChip[]
    correct: [string, string]
    alsoCorrect?: [string, string][]
    result?: string
}

const numChips = (list: [string, number][]): FormulaChip[] => shuffle(list.map(([id, v]) => ({ id, label: String(v) })))

const makeHat = (): Trial => {
    const k = pick([3, 4]), a = pick([2, 3, 4, 5]), d = pick([2, 3, 5, 6])
    return {
        kind: 'hat', legend: `AD = ${a}, AB = ${a * k}, DE = ${d}`, prompt: 'DE параллельна BC. Найди BC.',
        figure: hatItems(3),
        prefix: `BC / ${d} =`, layout: 'fraction',
        chips: numChips([['ab', a * k], ['ad', a], ['bd', a * k - a], ['sum', a + a * k]]), correct: ['ab', 'ad'],
        result: `BC = ${d} · ${a * k} / ${a} = ${d * k}`,
    }
}
const makeBfly = (): Trial => {
    const k = pick([3, 4]), a = pick([2, 3, 4]), p = pick([2, 3, 4, 5])
    return {
        kind: 'bfly', legend: `OA = ${a}, OC = ${a * k}, AB = ${p}`, prompt: 'AB параллельна DC. Найди DC.',
        figure: bflyItems(2),
        prefix: `DC / ${p} =`, layout: 'fraction',
        chips: numChips([['oc', a * k], ['oa', a], ['ac', a + a * k], ['df', a * k - a]]), correct: ['oc', 'oa'],
        result: `DC = ${p} · ${a * k} / ${a} = ${p * k}`,
    }
}
const ALT_PAIRS: [number, number, number][] = [[4, 9, 6], [2, 8, 4], [1, 4, 2], [3, 12, 6], [9, 16, 12], [4, 16, 8]]
const makeAlt1 = (): Trial => {
    const [a, b, h] = pick(ALT_PAIRS)
    return {
        kind: 'alt1', legend: `AH = ${a}, HB = ${b}`, prompt: 'CH — высота из прямого угла. Найди CH.',
        figure: heightItems(3),
        prefix: 'CH² =', layout: 'product',
        chips: shuffle(['AH', 'HB', 'AB', 'AC'].map((s) => ({ id: s, label: s }))), correct: ['AH', 'HB'], alsoCorrect: [['HB', 'AH']],
        result: `CH² = ${a} · ${b} = ${a * b}, CH = ${h}`,
    }
}
const ALT2: [number, number, number][] = [[4, 9, 6], [2, 8, 4], [3, 12, 6], [1, 4, 2]]
const makeAlt2 = (): Trial => {
    const [a, c, ac] = pick(ALT2)
    return {
        kind: 'alt2', legend: `AH = ${a}, AB = ${c}`, prompt: 'CH — высота из прямого угла. Найди AC.',
        figure: heightItems(3),
        prefix: 'AC² =', layout: 'product',
        chips: shuffle(['AH', 'HB', 'AB', 'CH'].map((s) => ({ id: s, label: s }))), correct: ['AH', 'AB'], alsoCorrect: [['AB', 'AH']],
        result: `AC² = ${a} · ${c} = ${a * c}, AC = ${ac}`,
    }
}
const makeReason = (): Trial => {
    const kind = pick<SrcKind>(['v', 'alt', 'common', 'comp'])
    return {
        kind: 'reason', legend: '', prompt: 'Почему выделенные углы равны?', figure: srcItems(kind),
        prefix: 'Потому что', layout: 'single',
        chips: shuffle((Object.keys(SRC_LABEL) as SrcKind[]).map((k) => ({ id: k, label: SRC_LABEL[k].toLowerCase() }))), correct: [kind, kind],
    }
}
const makeSim = (): Trial => {
    const r = pick(SIM_ROUNDS_BASE)
    const yes = isSimilar(r)
    return {
        kind: 'sim', legend: `ΔABC: ∠A = ${r.a[0]}°, ∠B = ${r.a[1]}°;  ΔMNK: ∠M = ${r.b[0]}°, ∠N = ${r.b[1]}°`, prompt: 'Подобны ли эти треугольники?', figure: null,
        prefix: 'Они', layout: 'single',
        chips: [{ id: 'yes', label: 'подобны' }, { id: 'no', label: 'не подобны' }], correct: [yes ? 'yes' : 'no', yes ? 'yes' : 'no'],
        result: `Третьи углы: ${third(r.a)}° и ${third(r.b)}°`,
    }
}
const makeArea = (): Trial => {
    const k = pick([2, 3]), s = pick([4, 5, 6, 8])
    return {
        kind: 'area', legend: `ΔABC ~ ΔMNK, k = ${k}, S(ABC) = ${s}`, prompt: 'Во сколько раз площадь MNK больше площади ABC?', figure: null,
        prefix: 'S₂ / S₁ =', layout: 'single',
        chips: shuffle([{ id: 'k', label: 'k' }, { id: 'k2', label: 'k²' }, { id: '2k', label: '2k' }, { id: 'k1', label: 'k + 1' }]), correct: ['k2', 'k2'],
        result: `S(MNK) = ${s} · ${k}² = ${s * k * k}`,
    }
}
const makeTrials = (): Trial[] => [makeHat(), makeBfly(), makeReason(), makeSim(), makeAlt1(), makeAlt2(), makeArea(), makeHat()]
const TRIAL_COUNT = 8

const SCENE_COMPONENTS = [HookScene, MatchScene, ProportionScene, AngleScene, SourcesScene, HatScene, ButterflyScene, HeightScene, AreaScene, AlgoScene]
const INTRO_COUNT = SCENE_COMPONENTS.length
const SCENES: string[] = [
    ...Array.from({ length: INTRO_COUNT }, (_, i) => `i${i}`),
    ...Array.from({ length: TRIAL_COUNT }, (_, i) => `t${i}`),
]
const isTrialKey = (k: string) => k.startsWith('t')
const numOf = (k: string) => Number(k.slice(1))

const INTRO_LABELS = ['Копия в другом масштабе', 'Соответствие вершин и сторон', 'Пропорция сторон', 'Признак «два угла»', 'Откуда равные углы', '«Шапочка»', '«Бабочка»', 'Высота из прямого угла', 'Площади ×k²', 'Алгоритм']

export const TypeSimWalk = ({ onAnswer, onComplete, isAdmin = false }: Props) => {
    const [sceneIdx, setSceneIdx] = useState(0)
    const [ready, setReady] = useState<Record<string, boolean>>({})
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trials] = useState<Trial[]>(() => makeTrials())
    const registerCombo = useWalkthroughCombo()
    const [checked, setChecked] = useState(false)
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [nextLabel, setNextLabel] = useState('Дальше')

    const latestKey = SCENES[sceneIdx]
    const isIntro = !isTrialKey(latestKey)
    const isLastScene = sceneIdx + 1 >= SCENES.length
    const { bump: bumpNonce, nonceFor: replayNonceFor } = useReplayNonces()
    const contentSettled = isIntro ? !!ready[latestKey] : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestKey, contentSettled)

    const resetTrial = () => { setChecked(false); setWrongFlash(null) }
    const jumpTo = (idx: number) => {
        if (advancing || idx < 0 || idx >= SCENES.length) return
        const key = SCENES[idx]
        bumpNonce(key)
        resetTrial()
        setReady((r) => ({ ...r, [key]: false }))
        setSceneIdx(idx)
    }
    const handleReplay = () => jumpTo(sceneIdx)
    const handleBack = () => jumpTo(sceneIdx - 1)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (isLastScene) {
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
                return
            }
            resetTrial()
            setSceneIdx((i) => i + 1)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleWrong = () => {
        playSound(WRONG_ANSWER_SOUND)
        setHadMistake(true)
        showAnswerMeme(false)
        setWrongFlash(pickWrongTryPhrase())
    }
    const handleSolved = (firstTry: boolean) => {
        registerCombo(firstTry)
        showAnswerMeme(true)
        setChecked(true)
        setWrongFlash(null)
        setNextLabel(pickWalkthroughNextLabel(isLastScene ? 'Готово' : 'Дальше'))
    }

    const markReady = (key: string) => () => setReady((r) => ({ ...r, [key]: true }))

    const renderIntro = (i: number) => {
        const key = `i${i}`
        const Scene = SCENE_COMPONENTS[i]
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <div key={`${key}-${replayNonceFor(key)}`} className="w-full">
                    <Scene onSettled={markReady(key)} />
                </div>
            </SceneWrapper>
        )
    }

    const renderTrial = (i: number) => {
        const t = trials[i]
        const key = `t${i}`
        const isCurrent = key === latestKey
        const isDone = !isCurrent || checked
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <div key={`${key}-${replayNonceFor(key)}`} className="w-full flex flex-col gap-3">
                    <div className="flex items-center gap-3 w-full">
                        <div className="shrink-0 flex items-center gap-0.5 px-3 h-8 rounded-full border-2 font-black text-sm tabular-nums"
                            style={{ borderColor: hexToRgba('#C385F7', 0.55), backgroundColor: hexToRgba('#C385F7', 0.16), color: '#C385F7' }}>
                            <span>{i + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIAL_COUNT}</span>
                        </div>
                        <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">{t.prompt}</p>
                    </div>
                    {t.legend && <div className="w-full text-center text-base md:text-lg font-bold" style={{ color: YEL }}>{t.legend}</div>}
                    {t.figure && <Fig items={t.figure} vb={[400, 240]} maxW={400} />}
                    <FormulaAssemble
                        prefix={t.prefix} layout={t.layout} chips={t.chips} correct={t.correct} alsoCorrect={t.alsoCorrect}
                        frozen={!isCurrent} onWrong={handleWrong} onSolved={handleSolved}
                    />
                    {isCurrent && !checked && wrongFlash && <WrongFlash text={wrongFlash} />}
                    {isDone && t.result && <div className="w-full text-center text-lg font-extrabold" style={{ color: GREEN }}>{t.result}</div>}
                    {isDone && (
                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                            <Check className="w-5 h-5" /> {CORRECT_FEEDBACK_PHRASES[(i * 7 + 3) % CORRECT_FEEDBACK_PHRASES.length]}
                        </FieryFeedbackBanner>
                    )}
                    {isCurrent && isDone && <LocalAnswerConfetti />}
                </div>
            </SceneWrapper>
        )
    }

    const nextEnabled = (isIntro ? !!ready[latestKey] : checked) && !advancing
    const mapEntries: AdminMapEntry[] = useMemo(() => [
        ...INTRO_LABELS.map((label, i) => ({ dotKey: `i${i}`, label, jumpKey: `i${i}`, isActive: latestKey === `i${i}`, color: MAP_INTRO_COLOR })),
        { dotKey: 'practice', label: `Тренировка (${TRIAL_COUNT})`, jumpKey: 't0', isActive: isTrialKey(latestKey), color: MAP_PRACTICE_COLOR },
    ], [latestKey])
    const jumpToKey = (key: string) => jumpTo(SCENES.indexOf(key))

    const nextText = isIntro
        ? (latestKey === `i${INTRO_COUNT - 1}` ? 'Го тренироваться' : 'Дальше')
        : isLastScene ? 'Теперь я мастер подобия' : nextLabel

    return (
        <div className={`w-full mx-auto flex flex-row items-start gap-3 ${isAdmin ? 'max-w-[46rem]' : 'max-w-2xl'}`}>
            <div className="min-w-0 flex-1 flex flex-col items-center gap-4">
                <div className="w-full flex flex-col gap-6">
                    {SCENES.slice(0, sceneIdx + 1).map((key) => (isTrialKey(key) ? renderTrial(numOf(key)) : renderIntro(numOf(key))))}
                </div>

                {isIntro || checked ? (
                    <div className="w-full flex items-center gap-2">
                        <ReplayButton onClick={handleReplay} disabled={advancing} />
                        <BackButton onClick={handleBack} disabled={advancing || sceneIdx === 0} />
                        <button
                            type="button" onClick={handleNext} disabled={!nextEnabled}
                            className={cn(walkthroughButtonClass(nextEnabled), isLastScene && !isIntro && 'text-sm sm:text-lg leading-tight px-2 text-center')}
                            style={walkthroughButtonStyle(nextEnabled)}
                        >
                            {nextText}
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex items-center gap-2">
                        <BackButton onClick={handleBack} disabled={advancing} />
                    </div>
                )}
            </div>
            {isAdmin && <AdminSceneMap entries={mapEntries} onJump={jumpToKey} disabled={advancing} enabled />}
        </div>
    )
}
