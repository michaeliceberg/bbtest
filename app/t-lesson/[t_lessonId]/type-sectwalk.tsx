'use client'

// «Стереометрия» → «Сечение» → «Кубик» (SECTWALK). Учим правилам построения сечения куба.
//   0. Куб (невидимые рёбра — пунктир) без подписей, на рёбрах по очереди появляются три точки M, N, K,
//      печатается «Как провести сечение через эти три точки?».
//   1. Назовём вершины: ближняя левая нижняя A, дальняя левая B, дальняя правая C, ближняя правая D; сверху A₁B₁C₁D₁.
//   2. Правило 1: две точки в ОДНОЙ грани — соединяем, отрезок — часть сечения (M и N на верхней грани).
//   3. Игра «Соедини, что можно»: ученик сам тапает две точки. M–K (передняя грань) — можно, N–K — нельзя.
// Сделано правило 1; правила 2–4 — следующие сцены этого урока (см. CLAUDE.md).
//
// Координаты: единичный куб, x вправо, y вглубь, z вверх. Проекция «как в учебнике»: передняя грань — квадрат,
// глубина уходит вправо-вверх под 45° с коэффициентом 0.5 (тот же приём, что CubeFig в type-ttpwalk.tsx).

import { Fragment, useEffect, useState } from 'react'
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
type SceneProps = { onSettled?: () => void }

const SECT_COLOR = GGEGE_PALETTE.purple.button // сечение и его точки — «то, что ищем»
const FACE_COLOR = GGEGE_PALETTE.teal.button // подсвеченная грань
const EDGE = '#C9D3D9'
const MUTED = '#9AA7B0'
const OK_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'

type V3 = [number, number, number]
const S = 150, DEPTH = 0.5, OX = 62, OY = 252
const P = (v: V3) => ({ x: OX + S * v[0] + S * DEPTH * v[1] * Math.SQRT1_2, y: OY - S * v[2] - S * DEPTH * v[1] * Math.SQRT1_2 })
const V: Record<string, V3> = {
    A: [0, 0, 0], B: [0, 1, 0], C: [1, 1, 0], D: [1, 0, 0],
    A1: [0, 0, 1], B1: [0, 1, 1], C1: [1, 1, 1], D1: [1, 0, 1],
}
const EDGES: [string, string][] = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'], ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']]
// дальняя левая нижняя вершина B не видна — её рёбра пунктиром
const hidden = (a: string, b: string) => a === 'B' || b === 'B'
const LABEL_ORDER = ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1']
const vName = (k: string) => (k.endsWith('1') ? `${k[0]}₁` : k)
const CENTER = P([0.5, 0.5, 0.5])

// Точки сечения
type PtKey = 'M' | 'N' | 'K'
const PT: Record<PtKey, V3> = {
    M: [1 / 3, 0, 1], // на A₁D₁, треть от A₁
    N: [1, 0.7, 1], // на C₁D₁, ближе к C₁
    K: [0.6, 0, 0], // на AD, чуть правее середины
}
// Грани, в которых лежит точка
const FACES_OF: Record<PtKey, string[]> = { M: ['top', 'front'], N: ['top', 'right'], K: ['bottom', 'front'] }
const FACE_POLY: Record<string, string[]> = {
    top: ['A1', 'B1', 'C1', 'D1'], bottom: ['A', 'B', 'C', 'D'], front: ['A', 'D', 'D1', 'A1'], right: ['D', 'C', 'C1', 'D1'],
}
const FACE_NAME: Record<string, string> = { top: 'верхней грани A₁B₁C₁D₁', front: 'передней грани ADD₁A₁', bottom: 'нижней грани ABCD', right: 'правой грани DCC₁D₁' }
const commonFace = (a: PtKey, b: PtKey) => FACES_OF[a].find((f) => FACES_OF[b].includes(f)) ?? null
// подпись точки — снаружи от куба
const PT_LABEL_OFFSET: Record<PtKey, [number, number]> = { M: [-2, -16], N: [16, 12], K: [0, 22] }

const pts = (keys: string[]) => keys.map((k) => { const p = P(V[k]); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')

type Seg = { id: string; a: PtKey; b: PtKey; color: string; dash?: string }
const CubeSvg = ({ drawIn = false, labels = 0, points = 0, face = null, segs = [], selected = null, onPoint, glowPts = [] }: {
    drawIn?: boolean; labels?: number; points?: number; face?: string | null; segs?: Seg[]; selected?: PtKey | null; onPoint?: (k: PtKey) => void; glowPts?: PtKey[]
}) => (
    <div className="w-full flex justify-center">
        <svg viewBox="0 0 330 292" className="w-full max-w-[360px] overflow-visible">
            {face && (
                <motion.polygon key={face} points={pts(FACE_POLY[face])} fill={hexToRgba(FACE_COLOR, 0.24)} stroke={FACE_COLOR} strokeWidth={2.5}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
            )}
            {EDGES.map(([a, b], i) => {
                const A = P(V[a]), B = P(V[b])
                return (
                    <motion.line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={hidden(a, b) ? 2 : 3} strokeLinecap="round"
                        strokeDasharray={hidden(a, b) ? '6 6' : undefined}
                        // framer перезаписывает strokeDasharray при анимации pathLength — пунктирные рёбра просто проявляем
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
                            initial={s.dash ? { opacity: 0 } : { pathLength: 0 }} animate={s.dash ? { opacity: 1 } : { pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                    </g>
                )
            })}
            {LABEL_ORDER.slice(0, labels).map((k) => {
                const p = P(V[k])
                const dx = p.x - CENTER.x, dy = p.y - CENTER.y, l = Math.hypot(dx, dy) || 1
                return (
                    <g key={k} transform={`translate(${(p.x + (dx / l) * 18).toFixed(1)} ${(p.y + (dy / l) * 18).toFixed(1)})`}>
                        <motion.text textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={900} fill={MUTED}
                            style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
                            initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}>
                            {vName(k)}
                        </motion.text>
                    </g>
                )
            })}
            {(['M', 'N', 'K'] as PtKey[]).slice(0, points).map((k) => {
                const p = P(PT[k])
                const [lx, ly] = PT_LABEL_OFFSET[k]
                const sel = selected === k
                return (
                    <g key={k} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} onClick={onPoint ? () => onPoint(k) : undefined}
                        style={onPoint ? { cursor: 'pointer' } : undefined}>
                        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 10 }}>
                            {(sel || glowPts.includes(k)) && <circle r={15} fill={hexToRgba(SECT_COLOR, 0.3)} />}
                            <circle r={7} fill={SECT_COLOR} stroke="#161F23" strokeWidth={2.5} />
                            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={900} fill={SECT_COLOR}
                                style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{k}</text>
                            {onPoint && <circle r={22} fill="transparent" />}
                        </motion.g>
                    </g>
                )
            })}
        </svg>
    </div>
)

const TypedBig = ({ text, onDone, readMs = 400, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)

// ===== Сцена 0: куб и три точки =====
const CubeScene = ({ onSettled }: SceneProps) => {
    const [points, setPoints] = useState(0)
    const [ask, setAsk] = useState(false)
    const startPoints = () => {
        let n = 0
        const id = setInterval(() => { n += 1; setPoints(n); if (n >= 3) { clearInterval(id); setTimeout(() => setAsk(true), 700) } }, 650)
    }
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(startPoints, 1300)}>
                <CubeSvg drawIn points={points} />
            </DiagramBlock>
            {ask && <TypedBig text="Как провести сечение через эти три точки?" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 1: имена вершин =====
const NamesScene = ({ onSettled }: SceneProps) => {
    const [labels, setLabels] = useState(0)
    const [typed, setTyped] = useState(false)
    useEffect(() => {
        if (!typed) return
        let n = 0
        const id = setInterval(() => { n += 1; setLabels(n); if (n >= LABEL_ORDER.length) { clearInterval(id); setTimeout(() => onSettled?.(), 900) } }, 420)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typed])
    return (
        <>
            <TypedBig small text="Сначала назовём вершины куба" onDone={() => setTyped(true)} />
            <CubeSvg labels={labels} points={3} />
            {labels >= LABEL_ORDER.length && (
                <motion.p className="text-center text-base md:text-lg font-bold" style={{ color: MUTED }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Снизу квадрат <b className="text-[#F2F7FB]">ABCD</b>, сверху — <b className="text-[#F2F7FB]">A₁B₁C₁D₁</b>
                </motion.p>
            )}
        </>
    )
}

// ===== Сцена 2: правило 1 =====
const Rule1Scene = ({ onSettled }: SceneProps) => {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    useEffect(() => {
        if (phase === 1) { const t = setTimeout(() => go(2), 1200); return () => clearTimeout(t) }
        if (phase === 2) { const t = setTimeout(() => go(3), 1100); return () => clearTimeout(t) }
        if (phase === 4) { const t = setTimeout(() => onSettled?.(), 1200); return () => clearTimeout(t) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <RememberPlate title="ПРАВИЛО 1">
                <div className="text-center font-black text-lg md:text-xl text-[#F2F7FB]">
                    Если две точки лежат в <span style={{ color: FACE_COLOR }}>ОДНОЙ грани</span> — соединяем их
                </div>
            </RememberPlate>
            <TypedBig small text="Смотри: M и N обе лежат на верхней грани" onDone={() => go(1)} />
            <CubeSvg labels={8} points={3} face={phase >= 1 ? 'top' : null} glowPts={phase >= 1 && phase < 2 ? ['M', 'N'] : []}
                segs={phase >= 2 ? [{ id: 'MN', a: 'M', b: 'N', color: SECT_COLOR }] : []} />
            {phase >= 3 && <TypedBig small text="Отрезок MN — уже кусочек сечения ✂️" onDone={() => go(4)} />}
        </>
    )
}

// ===== Сцена 3: игра «Соедини, что можно» =====
// MN уже проведён. Нужно найти вторую пару из одной грани (M–K). N–K — ловушка: разные грани.
const ConnectGameScene = ({ onSettled, onMistake }: SceneProps & { onMistake?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const [sel, setSel] = useState<PtKey | null>(null)
    const [segs, setSegs] = useState<Seg[]>([{ id: 'MN', a: 'M', b: 'N', color: SECT_COLOR }])
    const [face, setFace] = useState<string | null>(null)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const [done, setDone] = useState(false)
    const tap = (k: PtKey) => {
        if (!typed || done) return
        if (sel === null || sel === k) { setSel(k === sel ? null : k); return }
        const a = sel, b = k
        setSel(null)
        const key = [a, b].sort().join('')
        if (key === 'MN') { setMsg({ ok: false, text: 'MN уже есть 😉 Найди другую пару' }); return }
        const f = commonFace(a, b)
        if (f) {
            setFace(f)
            setSegs((s) => [...s, { id: key, a, b, color: SECT_COLOR }])
            setMsg({ ok: true, text: `Да! ${a} и ${b} обе на ${FACE_NAME[f]}` })
            showAnswerMeme(true)
            setDone(true)
            setTimeout(() => onSettled?.(), 2200)
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); onMistake?.()
            setFace(null)
            const bad: Seg = { id: `bad-${Date.now()}`, a, b, color: WRONG_COLOR, dash: '7 7' }
            setSegs((s) => [...s, bad])
            setTimeout(() => setSegs((s) => s.filter((x) => x.id !== bad.id)), 1400)
            setMsg({ ok: false, text: `${pickWrongTryPhrase()} ${a} и ${b} не лежат в одной грани — так соединять нельзя (пока!)` })
        }
    }
    return (
        <>
            <div className="w-full flex items-center gap-3" aria-hidden>
                <div className="flex-1 h-px bg-[#3A464E]" />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: SECT_COLOR }}>Соединялка 🔗</span>
                <div className="flex-1 h-px bg-[#3A464E]" />
            </div>
            <TypedBig small text="Какие ещё две точки можно соединить по правилу 1? Тапни их по очереди" onDone={() => setTyped(true)} />
            <CubeSvg labels={8} points={3} face={face} segs={segs} selected={sel} onPoint={typed ? tap : undefined} />
            {msg && (
                <motion.div key={msg.text} className="rounded-xl px-4 py-2 font-bold w-full text-center" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ backgroundColor: hexToRgba(msg.ok ? OK_COLOR : WRONG_COLOR, 0.14), color: msg.ok ? OK_COLOR : WRONG_COLOR }}>
                    {msg.text}
                </motion.div>
            )}
            {done && <LocalAnswerConfetti />}
            {done && <TypedBig small text="А N и K — в разных гранях. Для них понадобятся следующие правила 👀" readMs={0} />}
        </>
    )
}

const SCENES = [CubeScene, NamesScene, Rule1Scene, ConnectGameScene]
const SCENE_MAP_LABELS = ['Куб и три точки', 'Имена вершин', 'Правило 1', 'Соединялка']
const NEXT_LABELS = ['Интересненько 🤔', 'Запомнил вершины', 'Одна грань — соединяем', 'Готово']

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
        dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: step === i, color: i === SCENES.length - 1 ? MAP_PRACTICE_COLOR : MAP_INTRO_COLOR,
    }))

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            {Scene === ConnectGameScene
                                ? <ConnectGameScene onSettled={() => i === step && setStepReady(true)} onMistake={() => setHadMistake(true)} />
                                : <Scene onSettled={() => i === step && setStepReady(true)} />}
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
