// app/t-lesson/[t_lessonId]/type-stereowalk.tsx
//
// Тип STEREOWALK — пошаговые разборы стереометрии (ЕГЭ №15) после ТТП. Режим — по тексту вопроса:
//   «Угол между прямой и плоскостью…»  → MODE 'angle'
//   «Расстояние от точки до плоскости…» → MODE 'dist'
// Общая картинка: плоскость α (бирюзовая), наклонная a (голубая) из точки A в точку O плоскости,
// перпендикуляр AH (белый), проекция OH (тёмно-зелёная, как «тень» в ТТП), угол φ (оранжевый), куб для примера ЕГЭ.
// Каркас — как в TTPWALK (накопительный лог сцен → «Проверим себя»), плюс админская карта этапов (правило проекта).

'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    useWalkthroughCombo, RememberPlate, DiagramBlock,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter, withBreaks } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}
type SceneProps = { onSettled?: (label?: string) => void }

const PAUSE_MS = 1000
const A_COLOR = GGEGE_PALETTE.blue.button
const PLANE_COLOR = GGEGE_PALETTE.teal.button
const PROJ_COLOR = '#5FCB8E' // проекция («тень») — светлее теневого цвета ТТП, чтобы читалась на тёмном фоне
const ANGLE_COLOR = GGEGE_PALETTE.orange.button
const PERP = '#F2F7FB'
const NEU = '#9AA7B0'
const OK = '#A1D151'
const BAD = '#DC605B'

// ===== Текст =====
const Sticker = ({ value, color }: { value: React.ReactNode; color: string }) => (
    <motion.span initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 px-1.5 py-0.5 font-extrabold align-middle leading-none"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}>{value}</motion.span>
)
type Part = { text: string } | { sticker: string; color: string } | { bold: string }
const Typed = ({ parts, onDone, big }: { parts: Part[]; onDone?: () => void; big?: boolean }) => {
    const [typed, setTyped] = useState(false)
    const plain = parts.map((p) => ('text' in p ? p.text : 'sticker' in p ? p.sticker : p.bold)).join('')
    return (
        <div className={cn('w-full text-center text-[#F2F7FB]', big ? 'text-xl md:text-2xl font-black' : 'text-base md:text-lg')}>
            {!typed ? <Typewriter text={plain} onDone={() => { setTyped(true); setTimeout(() => onDone?.(), 400) }} />
                : parts.map((p, i) => ('text' in p ? <span key={i}>{withBreaks(p.text)}</span>
                    : 'sticker' in p ? <Sticker key={i} value={p.sticker} color={p.color} /> : <strong key={i} className="font-extrabold">{p.bold}</strong>))}
        </div>
    )
}
const Reply = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{children}</button>
    </motion.div>
)
const Choice = ({ options, correct, onDone, hint, cols = 3 }: { options: string[]; correct: number; onDone: () => void; hint?: string; cols?: number }) => {
    const [wrong, setWrong] = useState<number[]>([])
    const [ok, setOk] = useState(false)
    const pick = (i: number) => {
        if (ok || wrong.includes(i)) return
        if (i === correct) { setOk(true); showAnswerMeme(true); setTimeout(onDone, 500) }
        else { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrong((w) => [...w, i]) }
    }
    return (
        <div className="w-full flex flex-col gap-2">
            <div className={cn('drop-in-options grid gap-3 w-full', cols === 2 ? 'grid-cols-2' : cols === 1 ? 'grid-cols-1' : 'grid-cols-3')}>
                {options.map((o, i) => (
                    <button key={o} type="button" disabled={ok || wrong.includes(i)} onClick={() => pick(i)}
                        className={cn('min-h-[56px] rounded-xl border-2 px-2 text-lg font-black transition-colors',
                            ok && i === correct ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                : wrong.includes(i) ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                        {o}
                    </button>
                ))}
            </div>
            {wrong.length > 0 && !ok && hint && <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{pickWrongTryPhrase()} {hint}</div>}
        </div>
    )
}

// ===== 3D: косая проекция =====
type V3 = [number, number, number]
const U = 30, OX = 40, OY = 200
const P = ([x, y, z]: V3) => ({ x: OX + x * U + y * U * 0.62, y: OY - z * U - y * U * 0.36 })
const PLANE: V3[] = [[0, 0, 0], [8, 0, 0], [8, 5, 0], [0, 5, 0]]
const polyStr = (pts: V3[]) => pts.map((p) => { const q = P(p); return `${q.x.toFixed(1)},${q.y.toFixed(1)}` }).join(' ')
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
const unit = (a: V3) => mul(a, 1 / (len(a) || 1))

const Line3 = ({ p, q, color, w = 4, dash, fresh = true, delay = 0, opacity = 1 }: { p: V3; q: V3; color: string; w?: number; dash?: string; fresh?: boolean; delay?: number; opacity?: number }) => {
    const a = P(p), b = P(q)
    return <motion.line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}
        initial={fresh ? { pathLength: 0, opacity } : false} animate={{ pathLength: 1, opacity }} transition={{ pathLength: { duration: 0.7, delay }, opacity: { duration: 0.4 } }} />
}
const Dot3 = ({ p, color = PERP, r = 5 }: { p: V3; color?: string; r?: number }) => { const a = P(p); return <circle cx={a.x} cy={a.y} r={r} fill={color} /> }
const Label3 = ({ p, text, color, dx = 0, dy = 0, size = 18 }: { p: V3; text: string; color: string; dx?: number; dy?: number; size?: number }) => {
    const a = P(p)
    return (
        <g transform={`translate(${a.x + dx},${a.y + dy})`}>
            <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 12 }}>
                <text textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={900} fill={color} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{text}</text>
            </motion.g>
        </g>
    )
}
// Значок прямого угла в точке o между направлениями d1, d2.
const RightMark = ({ o, d1, d2, s = 0.45 }: { o: V3; d1: V3; d2: V3; s?: number }) => {
    const a = P(add(o, mul(unit(d1), s))), c = P(add(add(o, mul(unit(d1), s)), mul(unit(d2), s))), b = P(add(o, mul(unit(d2), s)))
    return <motion.path d={`M ${a.x} ${a.y} L ${c.x} ${c.y} L ${b.x} ${b.y}`} fill="none" stroke={PERP} strokeWidth={2.5}
        initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 12 }} />
}
// Дуга угла в точке o между направлениями d1 → d2 (рисуется на экране).
const AngleArc = ({ o, d1, d2, r = 34, color = ANGLE_COLOR, label }: { o: V3; d1: V3; d2: V3; r?: number; color?: string; label?: string }) => {
    const O = P(o), A = P(add(o, d1)), B = P(add(o, d2))
    const a1 = Math.atan2(A.y - O.y, A.x - O.x), a2 = Math.atan2(B.y - O.y, B.x - O.x)
    let da = a2 - a1
    while (da > Math.PI) da -= 2 * Math.PI
    while (da < -Math.PI) da += 2 * Math.PI
    const p1 = { x: O.x + r * Math.cos(a1), y: O.y + r * Math.sin(a1) }, p2 = { x: O.x + r * Math.cos(a1 + da), y: O.y + r * Math.sin(a1 + da) }
    const mid = a1 + da / 2
    return (
        <>
            <motion.path d={`M ${O.x} ${O.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${da > 0 ? 1 : 0} ${p2.x} ${p2.y} Z`} fill={hexToRgba(color, 0.32)} stroke={color} strokeWidth={2.5}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
            {label && (
                <g transform={`translate(${O.x + (r + 16) * Math.cos(mid)},${O.y + (r + 16) * Math.sin(mid)})`}>
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 360, damping: 12, delay: 0.3 }}>
                        <text textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={900} fill={color} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{label}</text>
                    </motion.g>
                </g>
            )}
        </>
    )
}
const Svg = ({ children, h = 230 }: { children: React.ReactNode; h?: number }) => (
    <div className="w-full flex justify-center">
        <svg viewBox={`0 0 360 ${h}`} className="w-full max-w-[380px] overflow-visible">{children}</svg>
    </div>
)
const Plane = ({ dim = false }: { dim?: boolean }) => (
    <>
        <motion.polygon points={polyStr(PLANE)} fill={hexToRgba(PLANE_COLOR, dim ? 0.08 : 0.18)} stroke={hexToRgba(PLANE_COLOR, dim ? 0.4 : 0.9)} strokeWidth={2}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        <Label3 p={[7.4, 0.6, 0]} text="α" color={PLANE_COLOR} size={22} />
    </>
)

// Геометрия общей сцены: точка O на плоскости, верх наклонной A, основание перпендикуляра H.
const O3: V3 = [2.2, 1.2, 0]
const H3: V3 = [5.4, 2.6, 0]
const heightFor = (deg: number) => len(sub(H3, O3)) * Math.tan((deg * Math.PI) / 180)
const aTop = (deg: number): V3 => [H3[0], H3[1], heightFor(deg)]

// ===== Режим «Угол между прямой и плоскостью» =====
// stage: 1 плоскость · 2 наклонная · 3 перпендикуляр+H · 4 проекция OH · 5 угол φ
const AngleFigure = ({ stage, deg = 35, wrongLine = false, label = 'φ' }: { stage: number; deg?: number; wrongLine?: boolean; label?: string }) => {
    const A = aTop(deg)
    return (
        <Svg>
            <Plane />
            {wrongLine && <Line3 p={O3} q={[O3[0] + 1.5, O3[1] + 3.4, 0]} color={BAD} w={3} dash="6 5" />}
            {stage >= 4 && <Line3 p={O3} q={H3} color={PROJ_COLOR} w={6} />}
            {stage >= 3 && <><Line3 p={A} q={H3} color={PERP} w={3} dash="6 5" /><RightMark o={H3} d1={sub(A, H3)} d2={sub(O3, H3)} /><Dot3 p={H3} /><Label3 p={H3} text="H" color={PERP} dx={14} dy={10} /></>}
            {stage >= 5 && <AngleArc o={O3} d1={sub(H3, O3)} d2={sub(A, O3)} label={label} />}
            {stage >= 2 && <><Line3 p={O3} q={A} color={A_COLOR} w={5} /><Dot3 p={A} color={A_COLOR} /><Label3 p={A} text="A" color={A_COLOR} dx={0} dy={-16} /><Dot3 p={O3} /><Label3 p={O3} text="O" color={PERP} dx={-14} dy={8} /></>}
            {stage >= 4 && <Label3 p={mul(add(O3, H3), 0.5)} text="проекция" color={PROJ_COLOR} dy={16} size={13} />}
        </Svg>
    )
}

const AIntroScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><AngleFigure stage={ph >= 1 ? 2 : 1} /></DiagramBlock>
            {ph >= 1 && <Typed parts={[{ text: 'Наклонная ' }, { sticker: 'a', color: A_COLOR }, { text: ' втыкается в плоскость ' }, { sticker: 'α', color: PLANE_COLOR }, { text: ' в точке O' }]} onDone={() => setPh(2)} />}
            {ph >= 2 && <Typed big parts={[{ text: 'А какой у неё угол с плоскостью? 🤔' }]} onDone={() => onSettled?.('Интересно…')} />}
        </>
    )
}
const AWrongScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><AngleFigure stage={2} wrongLine /></DiagramBlock>
            {ph >= 1 && <Typed parts={[{ text: 'Через O на плоскости можно провести сколько угодно прямых — и с каждой у ' }, { sticker: 'a', color: A_COLOR }, { text: ' свой угол' }]} onDone={() => setPh(2)} />}
            {ph >= 2 && <Typed parts={[{ text: 'Какую же взять? Ту, что «под» наклонной — её ' }, { bold: 'ТЕНЬ' }, { text: ' 👇' }]} onDone={() => onSettled?.('Как её найти?')} />}
        </>
    )
}
const APerpScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><AngleFigure stage={ph >= 2 ? 3 : 2} /></DiagramBlock>
            {ph >= 1 && ph < 2 && <Typed parts={[{ text: 'Опустим из A ' }, { bold: 'ПЕРПЕНДИКУЛЯР' }, { text: ' на плоскость' }]} onDone={() => setPh(1.5)} />}
            {ph === 1.5 && <Reply onClick={() => setPh(2)}>⬇ Опустить перпендикуляр</Reply>}
            {ph >= 2 && <Typed parts={[{ text: 'Он упал в точку H. AH ⟂ плоскости — угол 90°' }]} onDone={() => onSettled?.('Понял-принял')} />}
        </>
    )
}
const AProjScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><AngleFigure stage={ph >= 2 ? 4 : 3} /></DiagramBlock>
            {ph >= 1 && ph < 2 && <Typed parts={[{ text: 'Соединим O и H' }]} onDone={() => setPh(1.5)} />}
            {ph === 1.5 && <Reply onClick={() => setPh(2)}>✏ Соединить O и H</Reply>}
            {ph >= 2 && <Typed parts={[{ sticker: 'OH', color: PROJ_COLOR }, { text: ' — это ' }, { bold: 'ПРОЕКЦИЯ' }, { text: ' наклонной (её тень, если солнце в зените ☀️)' }]} onDone={() => onSettled?.('Вижу тень')} />}
        </>
    )
}
const ARuleScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><AngleFigure stage={5} /></DiagramBlock>
            {ph >= 1 && (
                <RememberPlate>
                    <span>Угол между прямой и плоскостью =</span>
                    <span>угол между прямой и её <span style={{ color: '#5FCB8E' }}>ПРОЕКЦИЕЙ</span></span>
                </RememberPlate>
            )}
            {ph >= 1 && <PauseThen ms={1500} onDone={() => onSettled?.('Запомнил')} />}
        </>
    )
}
// Наклон: 3 положения, угол φ пересчитывается.
const ATiltScene = ({ onSettled }: SceneProps) => {
    const DEGS = [25, 45, 65]
    const [i, setI] = useState(0)
    const [seen, setSeen] = useState<number[]>([0])
    useEffect(() => { if (seen.length >= 3) { const t = setTimeout(() => onSettled?.('Чем круче — тем больше φ'), 900); return () => clearTimeout(t) } }, [seen.length]) // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <>
            <Typed parts={[{ text: 'Наклони наклонную — смотри на угол φ' }]} />
            <DiagramBlock><AngleFigure key={i} stage={5} deg={DEGS[i]} label={`${DEGS[i]}°`} /></DiagramBlock>
            <div className="grid grid-cols-3 gap-3 w-full">
                {['Пологая', 'Средняя', 'Крутая'].map((t, k) => (
                    <button key={t} type="button" onClick={() => { setI(k); setSeen((s) => (s.includes(k) ? s : [...s, k])) }}
                        className={cn('min-h-[52px] rounded-xl border-2 font-black transition-colors', i === k ? 'border-[#F09B38] bg-[#F09B3822] text-[#F09B38]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB]')}>{t}</button>
                ))}
            </div>
            {seen.length >= 3 && <Typed parts={[{ text: 'Перпендикуляр к плоскости — это 90°, а лежит в плоскости — 0°' }]} />}
        </>
    )
}
const ACalcScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <Typed parts={[{ text: 'Как посчитать? Смотрим на треугольник ' }, { bold: 'AHO' }, { text: ' — он прямоугольный!' }]} onDone={() => setPh(1)} />
            {ph >= 1 && <DiagramBlock><AngleFigure stage={5} deg={30} /><div className="text-center font-black text-lg text-[#F2F7FB]">AO = 10, AH = 5</div></DiagramBlock>}
            {ph >= 1 && <Typed parts={[{ text: 'sin φ = AH / AO = ? Чему равен φ?' }]} onDone={() => setPh(2)} />}
            {ph >= 2 && <Choice options={['30°', '45°', '60°']} correct={0} hint="sin φ = 5/10 = 1/2" onDone={() => setPh(3)} />}
            {ph >= 3 && <Typed parts={[{ text: 'sin φ = 1/2 → ' }, { sticker: 'φ = 30°', color: ANGLE_COLOR }]} onDone={() => onSettled?.('Изи')} />}
        </>
    )
}

// ===== Куб (пример ЕГЭ) =====
// Куб «учебниковой» проекцией: передняя грань квадратом, глубина под 45°×0.5.
const CS = 120, CX0 = 90, CY0 = 205
const CPt = (x: number, y: number, z: number) => ({ x: CX0 + x * CS + y * CS * 0.45, y: CY0 - z * CS - y * CS * 0.4 })
const CUBE: Record<string, [number, number, number]> = {
    A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0], A1: [0, 0, 1], B1: [1, 0, 1], C1: [1, 1, 1], D1: [0, 1, 1],
}
const EDGES = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'], ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']]
const vName = (k: string) => (k.endsWith('1') ? `${k[0]}₁` : k)
const CubeFig = ({ children }: { children?: React.ReactNode }) => (
    <Svg h={250}>
        <polygon points={['A', 'B', 'C', 'D'].map((k) => { const p = CPt(...CUBE[k]); return `${p.x},${p.y}` }).join(' ')} fill={hexToRgba(PLANE_COLOR, 0.16)} />
        {EDGES.map(([a, b]) => {
            const p = CPt(...CUBE[a]), q = CPt(...CUBE[b])
            const hidden = a === 'D' || b === 'D'
            return <line key={a + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={NEU} strokeWidth={2.5} strokeDasharray={hidden ? '5 5' : undefined} opacity={0.8} />
        })}
        {children}
        {Object.entries(CUBE).map(([k, v]) => { const p = CPt(...v); return <text key={k} x={p.x + (v[0] ? 12 : -14)} y={p.y + (v[2] ? -8 : 16)} textAnchor="middle" fontSize={15} fontWeight={900} fill={PERP} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{vName(k)}</text> })}
    </Svg>
)
const CLine = ({ a, b, color, w = 5, dash }: { a: string; b: string; color: string; w?: number; dash?: string }) => {
    const p = CPt(...CUBE[a]), q = CPt(...CUBE[b])
    return <motion.line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
}
const ACubeScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <Typed big parts={[{ text: 'Задача ЕГЭ: куб' }]} onDone={() => setPh(1)} />
            {ph >= 1 && <Typed parts={[{ text: 'Угол между диагональю ' }, { sticker: 'A₁B', color: A_COLOR }, { text: ' и плоскостью основания ABCD?' }]} onDone={() => setPh(2)} />}
            {ph >= 1 && (
                <DiagramBlock>
                    <CubeFig>
                        <CLine a="A1" b="B" color={A_COLOR} />
                        {ph >= 2 && <CLine a="A1" b="A" color={PERP} w={3} dash="6 5" />}
                        {ph >= 3 && <CLine a="A" b="B" color="#5FCB8E" w={6} />}
                    </CubeFig>
                </DiagramBlock>
            )}
            {ph >= 2 && ph < 3 && <Typed parts={[{ text: 'Перпендикуляр из A₁ на основание — ребро ' }, { bold: 'A₁A' }, { text: '. Значит проекция — ?' }]} onDone={() => setPh(2.5)} />}
            {ph === 2.5 && <Choice options={['AB', 'BC', 'A₁B₁']} correct={0} hint="Проекция идёт от основания перпендикуляра (A) к B" onDone={() => setPh(3)} />}
            {ph >= 3 && <Typed parts={[{ text: 'Треугольник A₁AB прямоугольный и равнобедренный (AA₁ = AB). Угол = ?' }]} onDone={() => setPh(4)} />}
            {ph >= 4 && ph < 5 && <Choice options={['30°', '45°', '60°']} correct={1} hint="Катеты равны — углы при гипотенузе по 45°" onDone={() => setPh(5)} />}
            {ph >= 5 && <Typed parts={[{ text: 'Ответ: ' }, { sticker: '45°', color: ANGLE_COLOR }]} onDone={() => onSettled?.('Задача ЕГЭ решена 🔥')} />}
        </>
    )
}

// ===== Режим «Расстояние от точки до плоскости» =====
const D_A: V3 = [4.6, 2.4, 3.2]
const D_H: V3 = [4.6, 2.4, 0]
const SLANTS: V3[] = [[1.4, 1.0, 0], [7.2, 3.0, 0], [2.4, 4.4, 0]]
const DistFigure = ({ stage, pickOk, wrong = [] }: { stage: number; pickOk?: boolean; wrong?: number[] }) => (
    <Svg>
        <Plane />
        {stage >= 2 && SLANTS.map((s, i) => <Line3 key={i} p={D_A} q={s} color={wrong.includes(i) ? BAD : NEU} w={3} opacity={stage >= 4 ? 0.35 : 1} />)}
        {stage === 2 && SLANTS.map((s, i) => <Fragment key={`n${i}`}><Dot3 p={s} color={NEU} r={4} /><Label3 p={s} text={String(i + 1)} color={wrong.includes(i) ? BAD : NEU} dy={16} size={16} /></Fragment>)}
        {stage >= 2 && <Line3 p={D_A} q={D_H} color={pickOk || stage >= 3 ? OK : NEU} w={pickOk || stage >= 3 ? 5 : 3} />}
        {stage >= 3 && <RightMark o={D_H} d1={sub(D_A, D_H)} d2={[1, 0, 0]} />}
        <Dot3 p={D_A} color={A_COLOR} r={6} /><Label3 p={D_A} text="A" color={A_COLOR} dy={-16} />
        {stage >= 2 && <><Dot3 p={D_H} /><Label3 p={D_H} text="H" color={PERP} dx={14} dy={10} /></>}
    </Svg>
)
const DIntroScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><DistFigure stage={1} /></DiagramBlock>
            {ph >= 1 && <Typed parts={[{ text: 'Над плоскостью ' }, { sticker: 'α', color: PLANE_COLOR }, { text: ' висит точка ' }, { sticker: 'A', color: A_COLOR }]} onDone={() => setPh(2)} />}
            {ph >= 2 && <Typed big parts={[{ text: 'Какое у неё расстояние до плоскости? 🤔' }]} onDone={() => onSettled?.('Интересно…')} />}
        </>
    )
}
// Игра: какой из 4 отрезков самый короткий (длины подписаны после ответа).
const DGameScene = ({ onSettled }: SceneProps) => {
    const [wrong, setWrong] = useState<number[]>([])
    const [ok, setOk] = useState(false)
    const lens = [...SLANTS, D_H].map((s) => len(sub(D_A, s)))
    const pick = (i: number) => {
        if (ok) return
        if (i === 3) { setOk(true); showAnswerMeme(true); setTimeout(() => onSettled?.('Перпендикуляр — короче всех!'), 1200) }
        else if (!wrong.includes(i)) { playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrong((w) => [...w, i]) }
    }
    return (
        <>
            <Typed parts={[{ text: 'Из A на плоскость ведёт много отрезков. Какой ' }, { bold: 'САМЫЙ КОРОТКИЙ' }, { text: '?' }]} />
            <DiagramBlock><DistFigure stage={2} pickOk={ok} wrong={wrong} /></DiagramBlock>
            <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
                {['1', '2', '3', 'AH'].map((t, i) => (
                    <button key={t} type="button" disabled={ok || wrong.includes(i)} onClick={() => pick(i)}
                        className={cn('min-h-[52px] rounded-xl border-2 font-black transition-colors',
                            ok && i === 3 ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]' : wrong.includes(i) ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB]')}>
                        {i < 3 ? `Отрезок ${t}` : 'AH'}{(ok || wrong.includes(i)) ? ` · ${lens[i].toFixed(1)}` : ''}
                    </button>
                ))}
            </div>
        </>
    )
}
const DRuleScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setPh(1)}><DistFigure stage={4} /></DiagramBlock>
            {ph >= 1 && (
                <RememberPlate>
                    <span>Расстояние от точки до плоскости =</span>
                    <span>длина <span style={{ color: OK }}>ПЕРПЕНДИКУЛЯРА</span> на неё</span>
                </RememberPlate>
            )}
            {ph >= 1 && <PauseThen ms={1500} onDone={() => onSettled?.('Запомнил')} />}
        </>
    )
}
const DCalcScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <Typed parts={[{ text: 'Наклонная AO = 10, её проекция OH = 8. Найди расстояние AH' }]} onDone={() => setPh(1)} />
            {ph >= 1 && <DiagramBlock><AngleFigure stage={4} deg={37} /></DiagramBlock>}
            {ph >= 1 && <Typed parts={[{ text: 'Треугольник AHO прямоугольный → Пифагор' }]} onDone={() => setPh(2)} />}
            {ph >= 2 && ph < 3 && <Choice options={['2', '6', '18']} correct={1} hint="AH² = 10² − 8² = 36" onDone={() => setPh(3)} />}
            {ph >= 3 && <Typed parts={[{ text: 'AH = √(100 − 64) = ' }, { sticker: '6', color: OK }]} onDone={() => onSettled?.('Изи')} />}
        </>
    )
}
const DCubeScene = ({ onSettled }: SceneProps) => {
    const [ph, setPh] = useState(0)
    return (
        <>
            <Typed big parts={[{ text: 'Задача ЕГЭ: куб с ребром 4' }]} onDone={() => setPh(1)} />
            {ph >= 1 && <Typed parts={[{ text: 'Расстояние от ' }, { sticker: 'B₁', color: A_COLOR }, { text: ' до плоскости основания ABCD?' }]} onDone={() => setPh(2)} />}
            {ph >= 1 && (
                <DiagramBlock>
                    <CubeFig>{ph >= 3 && <CLine a="B1" b="B" color={OK} w={6} />}</CubeFig>
                </DiagramBlock>
            )}
            {ph >= 2 && ph < 3 && <Choice options={['B₁B', 'B₁D', 'B₁C']} correct={0} cols={3} hint="Нужен перпендикуляр к основанию — это вертикальное ребро" onDone={() => setPh(3)} />}
            {ph >= 3 && <Typed parts={[{ text: 'Перпендикуляр — ребро B₁B. Расстояние = ' }, { sticker: '4', color: OK }]} onDone={() => onSettled?.('Задача ЕГЭ решена 🔥')} />}
        </>
    )
}

const PauseThen = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => { const t = setTimeout(onDone, ms); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return null
}

type SceneDef = { C: (p: SceneProps) => JSX.Element; label: string }
const ANGLE_SCENES: SceneDef[] = [
    { C: AIntroScene, label: 'Наклонная и плоскость' }, { C: AWrongScene, label: 'Какую прямую взять' },
    { C: APerpScene, label: 'Перпендикуляр AH' }, { C: AProjScene, label: 'Проекция OH' }, { C: ARuleScene, label: 'ЗАПОМНИ: угол с проекцией' },
    { C: ATiltScene, label: 'Наклони наклонную' }, { C: ACalcScene, label: 'Считаем: sin φ' }, { C: ACubeScene, label: 'Куб: A₁B и основание' },
]
const DIST_SCENES: SceneDef[] = [
    { C: DIntroScene, label: 'Точка над плоскостью' }, { C: DGameScene, label: 'Игра: самый короткий' },
    { C: DRuleScene, label: 'ЗАПОМНИ: перпендикуляр' }, { C: DCalcScene, label: 'Считаем: Пифагор' }, { C: DCubeScene, label: 'Куб: B₁ до основания' },
]

type QuizItem = { prompt: React.ReactNode; options: string[]; correct: number; feedback: string }
const ANGLE_QUIZ: QuizItem[] = [
    { prompt: 'Угол между прямой и плоскостью — это угол между прямой и…', options: ['её проекцией на плоскость', 'любой прямой плоскости'], correct: 0, feedback: 'Именно с проекцией (тенью).' },
    { prompt: 'Прямая перпендикулярна плоскости. Угол с плоскостью = ?', options: ['90°', '0°'], correct: 0, feedback: 'Перпендикуляр — самый крутой: 90°.' },
    { prompt: 'Прямая лежит в плоскости. Угол = ?', options: ['0°', '90°'], correct: 0, feedback: 'Лежит в плоскости — угла нет: 0°.' },
    { prompt: 'AO = 8, AH = 4 (AH ⟂ плоскости). Угол φ = ?', options: ['30°', '60°'], correct: 0, feedback: 'sin φ = 4/8 = 1/2 → 30°.' },
    { prompt: 'Чтобы найти проекцию наклонной, сначала…', options: ['опускаем перпендикуляр из её точки на плоскость', 'продлеваем наклонную'], correct: 0, feedback: 'Перпендикуляр даёт точку H, а OH — проекция.' },
    { prompt: 'Бонус! Кто теперь шарит в стереометрии? 🧊', options: ['Я! 🔥'], correct: 0, feedback: 'Без вариантов — ты!' },
]
const DIST_QUIZ: QuizItem[] = [
    { prompt: 'Расстояние от точки до плоскости — это длина…', options: ['перпендикуляра на плоскость', 'любого отрезка до плоскости'], correct: 0, feedback: 'Перпендикуляр — самый короткий путь.' },
    { prompt: 'Наклонная из A длиннее перпендикуляра из A?', options: ['Да, всегда', 'Нет, короче'], correct: 0, feedback: 'Перпендикуляр — катет, наклонная — гипотенуза.' },
    { prompt: 'Наклонная 13, проекция 12. Расстояние = ?', options: ['5', '1'], correct: 0, feedback: '√(169 − 144) = 5.' },
    { prompt: 'Куб с ребром 7. Расстояние от C₁ до плоскости ABCD = ?', options: ['7', '7√2'], correct: 0, feedback: 'Это ребро C₁C — 7.' },
    { prompt: 'Бонус! Кто молодец? 📏', options: ['Я! 🔥'], correct: 0, feedback: 'Конечно ты!' },
]

// ===== Основной компонент =====
export const TypeStereoWalk = ({ question, onAnswer, onComplete, isAdmin = false }: Props) => {
    const mode: 'angle' | 'dist' = question.question.startsWith('Расстояние') ? 'dist' : 'angle'
    const scenes = mode === 'dist' ? DIST_SCENES : ANGLE_SCENES
    const quiz = mode === 'dist' ? DIST_QUIZ : ANGLE_QUIZ

    const [phase, setPhase] = useState<'intro' | 'quiz'>('intro')
    const [startStep, setStartStep] = useState(0)
    const [startQ, setStartQ] = useState(0)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    const [qi, setQi] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [hadMistake, setHadMistake] = useState(false)
    const registerCombo = useWalkthroughCombo()
    useEffect(() => { setNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `q-${qi}`
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, phase === 'intro' ? stepReady : checked)

    const next = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (phase === 'intro') {
                if (step + 1 >= scenes.length) { setPhase('quiz'); return }
                setStep((s) => s + 1); setStepReady(false); return
            }
            if (qi + 1 >= quiz.length) { const ok = !hadMistake; onComplete(ok); onAnswer(ok ? 'right' : 'wrong'); return }
            setQi((i) => i + 1); setChecked(false); setWrongTried([]); setWrongFlash(null)
        }, PAUSE_MS)
    }
    const back = () => {
        if (advancing) return
        if (phase === 'quiz') {
            if (qi > startQ) { bumpNonce(`q-${qi - 1}`); setQi(qi - 1); setChecked(false); setWrongTried([]); setWrongFlash(null) }
            else { setPhase('intro'); bumpNonce(`step-${step}`); setStepReady(false) }
            return
        }
        if (step > startStep) { bumpNonce(`step-${step - 1}`); setStep(step - 1); setStepReady(false) }
    }
    const replay = () => { bumpNonce(latestSceneKey); if (phase === 'intro') setStepReady(false) }
    const pick = (k: number) => {
        if (checked || wrongTried.includes(k)) return
        if (k === quiz[qi].correct) {
            registerCombo(wrongTried.length === 0); showAnswerMeme(true); setChecked(true)
            setNextLabel(pickWalkthroughNextLabel(qi + 1 >= quiz.length ? 'Готово' : 'Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setHadMistake(true)
            setWrongTried((w) => [...w, k]); setWrongFlash(pickWrongTryPhrase())
        }
    }
    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setWrongTried([]); setWrongFlash(null)
        bumpNonce(key)
        if (key.startsWith('step-')) { const i = Number(key.slice(5)); setPhase('intro'); setStartStep(i); setStep(i); setStepReady(false); setStartQ(0); setQi(0); return }
        const k = Number(key.slice(2)); setStartStep(scenes.length); setStep(scenes.length - 1); setStartQ(k); setQi(k); setPhase('quiz')
    }
    const mapEntries: AdminMapEntry[] = [
        ...scenes.map((s, i) => ({ dotKey: `s${i}`, label: s.label, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR })),
        ...quiz.map((_, i) => ({ dotKey: `q${i}`, label: `Вопрос ${i + 1}/${quiz.length}`, jumpKey: `q-${i}`, isActive: phase === 'quiz' && qi === i, color: MAP_PRACTICE_COLOR })),
    ]
    const canBack = phase === 'quiz' ? true : step > startStep

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {scenes.map(({ C }, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <C onSettled={(label?: string) => { if (i !== step) return; if (label) setNextLabel(label); setStepReady(true) }} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}
                {phase === 'quiz' && Array.from({ length: qi + 1 }).map((_, i) => {
                    if (i < startQ) return null
                    const q = quiz[i]
                    const isCur = i === qi
                    const done = i < qi || (isCur && checked)
                    return (
                        <SceneWrapper key={`q-${i}`} innerRef={sceneRef(`q-${i}`)} active={isActive(`q-${i}`)}>
                            <Fragment key={`q-${i}-${nonceFor(`q-${i}`)}`}>
                                {i === startQ && (
                                    <div className="w-full flex items-center gap-3" aria-hidden>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                    </div>
                                )}
                                <div className="relative w-full flex items-center">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{ borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55), backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16), color: GGEGE_PALETTE.purple.button }}>
                                        <span>{i + 1}</span><span className="opacity-50 font-normal">/</span><span>{quiz.length}</span>
                                    </div>
                                    <p className="flex-1 pl-16 pr-2 text-base md:text-lg text-[#F2F7FB] text-center font-bold">{q.prompt}</p>
                                </div>
                                <div className={cn('grid grid-cols-1 gap-3', isCur && !done && 'drop-in-options')}>
                                    {q.options.map((o, k) => {
                                        const wrong = isCur && wrongTried.includes(k)
                                        const state = done && k === q.correct ? 'ok' : wrong ? 'bad' : 'idle'
                                        return (
                                            <button key={o} type="button" disabled={done || wrong} onClick={() => pick(k)}
                                                className={cn('py-3 px-4 rounded-xl border-2 text-base md:text-lg font-bold text-center transition-colors',
                                                    state === 'ok' ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]' : state === 'bad' ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                                {o}
                                            </button>
                                        )
                                    })}
                                </div>
                                {isCur && !checked && wrongFlash && <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{wrongFlash}</div>}
                                {done && (
                                    <FieryFeedbackBanner fiery={isCur && isFieryMilestoneTrial(i)}>
                                        <div className="text-center">
                                            <div className="font-extrabold" style={{ color: CORRECT_COLOR }}>{CORRECT_FEEDBACK_PHRASES[i % CORRECT_FEEDBACK_PHRASES.length]}</div>
                                            <div className="mt-1 text-sm text-[#F2F7FB]">{q.feedback}</div>
                                        </div>
                                    </FieryFeedbackBanner>
                                )}
                                {isCur && checked && <LocalAnswerConfetti />}
                            </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>
            {(phase === 'intro' || checked) && (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={replay} disabled={advancing} />
                    <BackButton onClick={back} disabled={advancing || !canBack} />
                    <button type="button" onClick={next} disabled={(phase === 'intro' && !stepReady) || advancing}
                        className={walkthroughButtonClass((phase !== 'intro' || stepReady) && !advancing)} style={walkthroughButtonStyle((phase !== 'intro' || stepReady) && !advancing)}>
                        {phase === 'quiz' && qi + 1 >= quiz.length ? 'Готово' : nextLabel}
                    </button>
                </div>
            )}
        </div>
    )
}
