'use client'

// Блок «Кинематика» (ЕГЭ Физика) → урок «Бросок под углом к горизонту» (SCENEWALK). Сценарий пользователя 2026-11-07:
//   Команданте бросает гранату-конфетти, траектория рисуется параболой (котик спит в траве) →
//   зум в начало броска: вектор v₀ под 60° → v₀ отдельно, его проекции vₓ = v₀cos α и vᵧ = v₀sin α
//   («понятно?» → по желанию тренировка на треугольниках) → g действует только на vᵧ, на vₓ — крестик →
//   проверка → в цифрах: v₀ = 52 м/с, 60°, vₓ = 26, vᵧ = 45 → секунда за секундой вверх (vₓ = 26 всегда,
//   vᵧ −10 каждую секунду) → вершина 4,5 с → вниз (vᵧ +10 вниз) → уравнения x(t), y(t) → тренировка.
// Числа: vₓ = 26, v₀ᵧ = 45, g = 10 → подъём 4,5 с, полёт 9 с, дальность 234 м, высота 101 м.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChoiceGame, Note, type ChoiceRound, type Scene } from '@/components/geometry/scene-engine'
import { walkthroughButtonClass, walkthroughButtonStyle } from '@/components/geometry/WalkthroughLog'
import { MathText } from '@/components/geometry/plain-math'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { playJustClick, playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { cn } from '@/lib/utils'
import type { SceneLesson } from './types'

// Цвета: v₀ — синий, vₓ — бирюзовый, vᵧ — фиолетовый, g — жёлтый. Красный — только «не влияет».
const V0_COL = GGEGE_PALETTE.blue.button
const VX_COL = GGEGE_PALETTE.teal.button
const VY_COL = GGEGE_PALETTE.purple.button
const G_COL = '#F2C35B'
const BAD = '#DC605B'
const INK = '#F2F7FB'
const FONT = 'var(--font-nunito), sans-serif'
const POP = { type: 'spring' as const, stiffness: 320, damping: 12 }

// ===== Физика броска =====
const VX = 26
const VY0 = 45
const G = 10
const T_FLIGHT = 9
const vyAt = (t: number) => VY0 - G * t

// ===== Геометрия картинки (метры → пиксели) =====
const W = 380, H = 240
const GY = 215          // земля
const OX = 62           // точка броска
const S = 1.25          // px на метр
const K = 1             // px на 1 м/с (стрелки скоростей)
const px = (t: number) => OX + S * VX * t
const py = (t: number) => GY - S * (VY0 * t - (G * t * t) / 2)
const LAND_X = px(T_FLIGHT)
const trailPath = (tMax: number) => {
    const n = Math.max(2, Math.round(tMax * 14))
    const pts: string[] = []
    for (let i = 0; i <= n; i++) { const t = (tMax * i) / n; pts.push(`${px(t).toFixed(1)},${py(t).toFixed(1)}`) }
    return `M${pts.join(' L')}`
}

// ===== Мелкие SVG-детали =====
const Arrow = ({ x1, y1, x2, y2, color, w = 3, dash, head = 7, opacity = 1 }:
    { x1: number; y1: number; x2: number; y2: number; color: string; w?: number; dash?: boolean; head?: number; opacity?: number }) => {
    const a = Math.atan2(y2 - y1, x2 - x1)
    const len = Math.hypot(x2 - x1, y2 - y1)
    if (len < 1) return null
    const ex = x2 - Math.cos(a) * head * 0.8, ey = y2 - Math.sin(a) * head * 0.8
    const p = (d: number, s: number) => `${x2 - Math.cos(a) * head * d + Math.sin(a) * head * s},${y2 - Math.sin(a) * head * d - Math.cos(a) * head * s}`
    return (
        <g opacity={opacity}>
            <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash ? `${w * 2} ${w * 1.6}` : undefined} />
            <polygon points={`${x2},${y2} ${p(1, 0.55)} ${p(1, -0.55)}`} fill={color} />
        </g>
    )
}
const arcD = (cx: number, cy: number, r: number, a1: number, a2: number) => {
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    return `M${x1},${y1} A${r},${r} 0 0 ${a2 > a1 ? 1 : 0} ${x2},${y2}`
}
// «v» с индексом и стрелочкой над буквой (вектор). anchor — левый край буквы.
const VecLabel = ({ x, y, size, color, sub, vector = true }: { x: number; y: number; size: number; color: string; sub: string; vector?: boolean }) => (
    <g>
        <text x={x} y={y} fontSize={size} fontStyle="italic" fontWeight={800} fill={color} fontFamily={FONT}>
            v<tspan fontSize={size * 0.6} dx={size * 0.06} dy={size * 0.3} fontStyle="normal">{sub}</tspan>
        </text>
        {vector && <Arrow x1={x + size * 0.02} y1={y - size * 0.86} x2={x + size * 0.6} y2={y - size * 0.86} color={color} w={size * 0.08} head={size * 0.2} />}
    </g>
)
const SubText = ({ x, y, size, color, main, sub, rest = '', anchor = 'start' }:
    { x: number; y: number; size: number; color: string; main: string; sub: string; rest?: string; anchor?: 'start' | 'middle' | 'end' }) => (
    <text x={x} y={y} fontSize={size} fontWeight={800} fill={color} fontFamily={FONT} textAnchor={anchor}>
        <tspan fontStyle="italic">{main}</tspan>
        <tspan fontSize={size * 0.62} dy={size * 0.28}>{sub}</tspan>
        {rest && <tspan dy={-size * 0.28}>{rest}</tspan>}
    </text>
)
// Граната-конфетти Команданте (игрушечная): оливковый корпус, кольцо, золотое GG.
const Grenade = ({ x, y, r = 7, rot = 0 }: { x: number; y: number; r?: number; rot?: number }) => (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
        <rect x={-r * 0.35} y={-r * 1.45} width={r * 0.7} height={r * 0.5} rx={r * 0.1} fill="#8A8F72" stroke="#1E2410" strokeWidth={r * 0.14} />
        <circle cx={r * 0.55} cy={-r * 1.35} r={r * 0.32} fill="none" stroke="#C9CDB8" strokeWidth={r * 0.14} />
        <ellipse cx={0} cy={0} rx={r * 0.85} ry={r} fill="#5B6B2F" stroke="#1E2410" strokeWidth={r * 0.16} />
        <line x1={-r * 0.85} y1={0} x2={r * 0.85} y2={0} stroke="#3E4A1E" strokeWidth={r * 0.12} />
        <line x1={0} y1={-r} x2={0} y2={r} stroke="#3E4A1E" strokeWidth={r * 0.12} />
        <text x={0} y={r * 0.38} textAnchor="middle" fontSize={r * 0.9} fontWeight={900} fill="#F2C35B" fontFamily={FONT}>GG</text>
    </g>
)
const Grass = () => (
    <g stroke="#4E8A33" strokeWidth={2} strokeLinecap="round">
        {Array.from({ length: 34 }, (_, i) => {
            const x = 8 + i * 11.3 + ((i * 7) % 5)
            const h = 5 + ((i * 13) % 6)
            return <path key={i} d={`M${x},${GY} l-2,-${h} M${x},${GY} l2,-${h - 2}`} fill="none" />
        })}
    </g>
)
const CONFETTI = ['#F2C35B', '#5CC99F', '#C385F7', '#53ADEF', '#BC418A', '#78C93C']
const Burst = ({ x, y }: { x: number; y: number }) => (
    <g>
        {Array.from({ length: 14 }, (_, i) => {
            const a = (-Math.PI * (i + 0.5)) / 14
            return (
                <motion.rect key={i} x={x - 2} y={y - 2} width={4} height={4} rx={1} fill={CONFETTI[i % CONFETTI.length]}
                    initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * (22 + (i % 3) * 9), y: Math.sin(a) * (26 + (i % 4) * 7), opacity: [1, 1, 0] }}
                    transition={{ duration: 1.3, ease: 'easeOut' }} />
            )
        })}
    </g>
)

// ===== Поле броска =====
type Pt = { t: number; cur: boolean }
type FieldProps = {
    trail?: number                  // до какого t нарисована траектория (сплошная)
    ghost?: boolean                 // вся траектория бледным пунктиром
    grenadeT?: number | null
    zoom?: boolean                  // приблизить начало броска
    v0?: boolean                    // вектор v₀ из точки броска
    comps?: boolean                 // проекции v₀ на оси в точке броска
    g?: boolean
    hiVy?: boolean
    crossVx?: boolean
    points?: Pt[]                   // «секунда за секундой»: точки с проекциями
    landed?: boolean                // граната упала: конфетти + котик проснулся
    view?: string                   // свой viewBox (кадр части траектории)
    maxW?: number
}
const ZOOM_T = 'translate(92px,186px) scale(2.4) translate(-62px,-215px)'
const NO_ZOOM_T = 'translate(0px,0px) scale(1) translate(0px,0px)'
export const Field = ({ trail = 0, ghost, grenadeT = null, zoom, v0, comps, g, hiVy, crossVx, points = [], landed, view, maxW = 520 }: FieldProps) => {
    const v0x = OX + K * VX, v0y = GY - K * VY0
    return (
        <svg viewBox={view ?? `0 0 ${W} ${H}`} className="w-full h-auto rounded-2xl" style={{ maxWidth: maxW, maxHeight: '44vh', backgroundColor: '#13202A' }}>
            <g style={{ transform: zoom ? ZOOM_T : NO_ZOOM_T, transition: 'transform 1.4s cubic-bezier(0.65,0,0.35,1)' }}>
                <rect x={-200} y={GY} width={W + 400} height={120} fill="#22351F" />
                <line x1={-200} y1={GY} x2={W + 200} y2={GY} stroke="#4E8A33" strokeWidth={2.5} />
                <g style={{ opacity: zoom ? 0 : 1, transition: 'opacity 1s' }}><Grass /></g>
                <image href="/miguel/miguel-base.webp" x={6} y={GY - 60} width={60} height={60} style={{ opacity: zoom ? 0.15 : 1, transition: 'opacity 1s' }} />
                {/* котик спит в траве у места падения */}
                <image href={landed ? '/hangar/life/cat-meow.webp' : '/hangar/life/cat-sleep.webp'}
                    x={landed ? 296 : 292} y={landed ? GY - 40 : GY - 27} width={landed ? 34 : 46} height={landed ? 40 : 31} />
                {!landed && (
                    <motion.text x={322} y={GY - 30} fontSize={10} fontWeight={900} fill="#8FA3AE" fontFamily={FONT}
                        animate={{ y: [GY - 30, GY - 36, GY - 30], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.4, repeat: Infinity }}>Zzz</motion.text>
                )}
                {landed && (
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...POP, delay: 0.5 }}>
                        <rect x={236} y={GY - 36} width={48} height={20} rx={8} fill="#F2F7FB" />
                        <text x={260} y={GY - 22} textAnchor="middle" fontSize={11} fontWeight={900} fill="#151F24" fontFamily={FONT}>Мяу?!</text>
                    </motion.g>
                )}
                {ghost && <path d={trailPath(T_FLIGHT)} fill="none" stroke="#8FA3AE" strokeOpacity={0.35} strokeWidth={2} strokeDasharray="4 5" />}
                {trail > 0 && <path d={trailPath(Math.min(trail, T_FLIGHT))} fill="none" stroke={INK} strokeOpacity={v0 ? 0.45 : 1} strokeWidth={zoom ? 1.4 : 2.5} strokeLinecap="round" />}

                {/* «секунда за секундой» */}
                {points.map(({ t, cur }) => {
                    const x = px(t), y = py(t), vy = vyAt(t)
                    const op = cur ? 1 : 0.3
                    return (
                        <motion.g key={t} initial={cur ? { opacity: 0 } : false} animate={{ opacity: 1 }}>
                            <Arrow x1={x} y1={y} x2={x + K * VX} y2={y} color={VX_COL} w={2.6} head={6} opacity={op} />
                            {Math.abs(vy) > 0.1 && <Arrow x1={x} y1={y} x2={x} y2={y - K * vy} color={VY_COL} w={2.6} head={6} opacity={op} />}
                            <circle cx={x} cy={y} r={3.2} fill={INK} opacity={cur ? 1 : 0.45} />
                            {cur && (
                                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={POP}>
                                    <text x={x + K * VX / 2} y={y + 13} textAnchor="middle" fontSize={11} fontWeight={900} fill={VX_COL} fontFamily={FONT}>{VX}</text>
                                    {Math.abs(vy) > 0.1
                                        ? <text x={x - 5} y={y - (K * vy) / 2 + 4} textAnchor="end" fontSize={11} fontWeight={900} fill={VY_COL} fontFamily={FONT}>{Math.abs(vy)}</text>
                                        : <text x={x} y={y - 9} textAnchor="middle" fontSize={11} fontWeight={900} fill={VY_COL} fontFamily={FONT}>0</text>}
                                </motion.g>
                            )}
                        </motion.g>
                    )
                })}

                {comps && (
                    <g>
                        <motion.g animate={crossVx ? { opacity: 0.55 } : { opacity: 1 }}>
                            <Arrow x1={OX} y1={GY} x2={v0x} y2={GY} color={VX_COL} w={2} head={4} />
                        </motion.g>
                        <motion.g animate={hiVy ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.6 }}>
                            <Arrow x1={v0x} y1={GY} x2={v0x} y2={v0y} color={VY_COL} w={hiVy ? 2.6 : 2} head={hiVy ? 4.8 : 4} />
                        </motion.g>
                        <SubText x={OX + VX / 2} y={GY + 9} size={5.4} color={VX_COL} main="v" sub="0" rest=" cos α" anchor="middle" />
                        <SubText x={v0x + 3} y={GY - VY0 / 2 + 2} size={5.4} color={VY_COL} main="v" sub="0" rest=" sin α" />
                        {crossVx && (
                            <motion.g initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                                <line x1={OX + 7} y1={GY - 6} x2={OX + 19} y2={GY + 6} stroke={BAD} strokeWidth={2.4} strokeLinecap="round" />
                                <line x1={OX + 19} y1={GY - 6} x2={OX + 7} y2={GY + 6} stroke={BAD} strokeWidth={2.4} strokeLinecap="round" />
                            </motion.g>
                        )}
                    </g>
                )}
                {g && (
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                        <Arrow x1={140} y1={150} x2={140} y2={180} color={G_COL} w={2.2} head={4.4} />
                        <text x={145} y={163} fontSize={7} fontWeight={900} fill={G_COL} fontFamily={FONT} fontStyle="italic">g</text>
                        <text x={145} y={171} fontSize={4.4} fontWeight={800} fill={G_COL} fontFamily={FONT}>= 10 м/с²</text>
                    </motion.g>
                )}
                {v0 && (
                    <g>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                            <Arrow x1={OX} y1={GY} x2={v0x} y2={v0y} color={V0_COL} w={1.8} head={4.2} />
                            <path d={arcD(OX, GY, 9, -Math.PI / 3, 0)} fill="none" stroke={V0_COL} strokeWidth={0.9} />
                            <text x={OX + 10} y={GY - 3.2} fontSize={4.4} fontWeight={800} fill={V0_COL} fontFamily={FONT}>60°</text>
                        </motion.g>
                        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...POP, delay: 0.6 }}>
                            <VecLabel x={OX - 2} y={GY - 26} size={11} color={V0_COL} sub="0" />
                        </motion.g>
                    </g>
                )}

                {grenadeT !== null && !comps && <Grenade x={px(grenadeT)} y={py(grenadeT) - 6} r={zoom ? 3 : 6.5} rot={grenadeT * 80} />}
                {landed && <Burst x={LAND_X} y={GY - 4} />}
            </g>
        </svg>
    )
}

// ===== Кнопка-реплика внутри сцены =====
const Reply = ({ label, onDone }: { label: string; onDone: () => void }) => {
    const [gone, setGone] = useState(false)
    if (gone) return null
    return (
        <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button type="button" className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}
                onClick={() => { playJustClick(); setGone(true); onDone() }}>{label}</button>
        </motion.div>
    )
}
const reply = (label: string) => ({ t: 'custom' as const, render: (done: () => void) => <Reply label={label} onDone={done} /> })

// ===== Сцена 1: бросок =====
const ThrowGame = ({ onDone }: { onDone: () => void }) => {
    const [t, setT] = useState<number | null>(null)
    const [landed, setLanded] = useState(false)
    const fired = useRef(false)
    const go = () => {
        if (fired.current) return
        fired.current = true; playJustClick()
        let cur = 0
        setT(0)
        const id = setInterval(() => {
            cur = Math.min(T_FLIGHT, cur + T_FLIGHT / 110)
            setT(cur)
            if (cur >= T_FLIGHT) {
                clearInterval(id); setLanded(true)
                setTimeout(onDone, 1600)
            }
        }, 25)
    }
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <Field trail={t ?? 0} grenadeT={landed ? null : t ?? 0} landed={landed} />
            {t === null && (
                <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <button type="button" onClick={go} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>Бросить гранату</button>
                </motion.div>
            )}
        </div>
    )
}

// ===== Сцена 3: вектор v₀ и его проекции =====
const VectorFig = ({ step }: { step: number }) => {
    const O = { x: 60, y: 182 }, L = 150
    const E = { x: O.x + L * Math.cos(Math.PI / 3), y: O.y - L * Math.sin(Math.PI / 3) }
    return (
        <svg viewBox="0 0 300 214" className="w-full h-auto" style={{ maxWidth: 420 }}>
            {step >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Arrow x1={O.x} y1={O.y} x2={E.x} y2={O.y} color={VX_COL} w={4} head={10} dash />
                </motion.g>
            )}
            {step >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Arrow x1={E.x} y1={O.y} x2={E.x} y2={E.y} color={VY_COL} w={4} head={10} dash />
                    <path d={`M${E.x - 11},${O.y} L${E.x - 11},${O.y - 11} L${E.x},${O.y - 11}`} fill="none" stroke="#8FA3AE" strokeWidth={2} />
                </motion.g>
            )}
            <Arrow x1={O.x} y1={O.y} x2={E.x} y2={E.y} color={V0_COL} w={5} head={13} />
            <VecLabel x={O.x + 2} y={O.y - 82} size={26} color={V0_COL} sub="0" />
            {step >= 3 && (
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                    <path d={arcD(O.x, O.y, 30, -Math.PI / 3, 0)} fill="none" stroke={G_COL} strokeWidth={3} />
                    <text x={O.x + 36} y={O.y - 9} fontSize={20} fontWeight={900} fontStyle="italic" fill={G_COL} fontFamily={FONT}>α</text>
                </motion.g>
            )}
            {step >= 4 && (
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                    <SubText x={(O.x + E.x) / 2} y={O.y + 26} size={19} color={VX_COL} main="v" sub="0" rest=" · cos α" anchor="middle" />
                </motion.g>
            )}
            {step >= 5 && (
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                    <SubText x={E.x + 10} y={(O.y + E.y) / 2 + 6} size={19} color={VY_COL} main="v" sub="0" rest=" · sin α" />
                </motion.g>
            )}
        </svg>
    )
}

// ===== «Понятно?» → по желанию тренировка на треугольниках =====
type TriRound = { angleAt: 'bottom' | 'top'; leg: 'h' | 'v'; correct: string; hint: string }
const TRI_OPTS = ['$v\\cos\\alpha$', '$v\\sin\\alpha$', '$v\\,\\mathrm{tg}\\,\\alpha$', '$\\dfrac{v}{\\cos\\alpha}$']
const TRI_ROUNDS: TriRound[] = [
    { angleAt: 'bottom', leg: 'h', correct: '$v\\cos\\alpha$', hint: 'Этот катет касается угла α: прилежащий → cos 🙃' },
    { angleAt: 'bottom', leg: 'v', correct: '$v\\sin\\alpha$', hint: 'Этот катет напротив угла α: противолежащий → sin 🙃' },
    { angleAt: 'top', leg: 'v', correct: '$v\\cos\\alpha$', hint: 'Угол теперь сверху! Вертикальный катет его касается → cos 🙃' },
    { angleAt: 'top', leg: 'h', correct: '$v\\sin\\alpha$', hint: 'Горизонтальный катет напротив верхнего угла → sin 🙃' },
]
const TriFig = ({ r }: { r: TriRound }) => {
    const A = { x: 40, y: 150 }, B = { x: 210, y: 150 }, C = { x: 210, y: 46 }
    const hiH = r.leg === 'h', hiV = r.leg === 'v'
    const aA = Math.atan2(C.y - A.y, C.x - A.x)
    const aC = Math.atan2(A.y - C.y, A.x - C.x)
    return (
        <svg viewBox="0 0 260 180" className="w-full h-auto" style={{ maxWidth: 340 }}>
            <path d={`M${B.x - 12},${B.y} L${B.x - 12},${B.y - 12} L${B.x},${B.y - 12}`} fill="none" stroke="#8FA3AE" strokeWidth={2} />
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={hiH ? G_COL : '#5C6B73'} strokeWidth={hiH ? 7 : 4} strokeLinecap="round" />
            <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke={hiV ? G_COL : '#5C6B73'} strokeWidth={hiV ? 7 : 4} strokeLinecap="round" />
            <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke={V0_COL} strokeWidth={5} strokeLinecap="round" />
            <text x={(A.x + C.x) / 2 - 12} y={(A.y + C.y) / 2 - 8} fontSize={22} fontWeight={900} fontStyle="italic" fill={V0_COL} fontFamily={FONT}>v</text>
            {r.angleAt === 'bottom'
                ? <><path d={arcD(A.x, A.y, 30, aA, 0)} fill="none" stroke={INK} strokeWidth={2.5} /><text x={A.x + 36} y={A.y - 6} fontSize={18} fontStyle="italic" fontWeight={900} fill={INK} fontFamily={FONT}>α</text></>
                : <><path d={arcD(C.x, C.y, 26, Math.PI / 2, aC)} fill="none" stroke={INK} strokeWidth={2.5} /><text x={C.x - 22} y={C.y + 40} fontSize={18} fontStyle="italic" fontWeight={900} fill={INK} fontFamily={FONT}>α</text></>}
            {hiH && <text x={(A.x + B.x) / 2} y={B.y + 24} textAnchor="middle" fontSize={20} fontWeight={900} fill={G_COL} fontFamily={FONT}>?</text>}
            {hiV && <text x={B.x + 14} y={(B.y + C.y) / 2 + 7} fontSize={20} fontWeight={900} fill={G_COL} fontFamily={FONT}>?</text>}
        </svg>
    )
}
const TriGame = ({ onDone }: { onDone: () => void }) => {
    const [i, setI] = useState(0)
    const [wrong, setWrong] = useState<string[]>([])
    const [ok, setOk] = useState(false)
    const r = TRI_ROUNDS[i]
    const pick = (o: string) => {
        if (ok || wrong.includes(o)) return
        if (o === r.correct) {
            setOk(true); showAnswerMeme(true)
            setTimeout(() => { if (i + 1 >= TRI_ROUNDS.length) onDone(); else { setI(i + 1); setWrong([]); setOk(false) } }, 1500)
        } else { setWrong((w) => [...w, o]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="text-lg md:text-xl font-black text-[#F2F7FB] text-center">
                Чему равна жёлтая сторона? <span className="text-sm font-bold text-[#5C6B73]">{i + 1}/{TRI_ROUNDS.length}</span>
            </div>
            <TriFig r={r} />
            <div key={i} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                {TRI_OPTS.map((o) => {
                    const isW = wrong.includes(o), isR = ok && o === r.correct
                    return (
                        <button key={o} type="button" disabled={isW || ok} onClick={() => pick(o)}
                            className={cn('min-h-[56px] px-2 rounded-xl border-2 border-b-4 text-xl font-black transition-colors',
                                isR ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]' : isW ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                            <MathText>{o}</MathText>
                        </button>
                    )
                })}
            </div>
            {!ok && wrong.length > 0 && <Note ok={false}>{r.hint}</Note>}
        </div>
    )
}
const UnderstoodAsk = ({ onDone }: { onDone: () => void }) => {
    const [mode, setMode] = useState<'ask' | 'train' | 'done'>('ask')
    if (mode === 'done') return null
    if (mode === 'train') return (
        <div className="w-full flex flex-col gap-3">
            <div className="w-full text-center text-sm font-bold text-[#8FA3AE]">
                Подробно это разобрано в тренажёре «Геометрия: sin, cos, tg» (ЕГЭ Математика). А пока — быстрая разминка:
            </div>
            <TriGame onDone={() => { setMode('done'); onDone() }} />
        </div>
    )
    return (
        <motion.div className="w-full grid grid-cols-2 gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button type="button" onClick={() => { playJustClick(); setMode('done'); onDone() }}
                className="min-h-[56px] rounded-xl border-2 border-b-4 active:border-b-0 border-[#5FA12F] bg-[#78C93C] text-lg font-black text-[#151F24]">
                Да, понял
            </button>
            <button type="button" onClick={() => { playJustClick(); setMode('train') }}
                className="min-h-[56px] rounded-xl border-2 border-b-4 active:border-b-0 border-[#3A464E] bg-[#161F23] text-base font-black text-[#F2F7FB]">
                Нет, давай потренируемся
            </button>
        </motion.div>
    )
}

// ===== «Секунда за секундой» =====
const vyCell = (t: number) => {
    const v = vyAt(t)
    if (Math.abs(v) < 0.01) return '0'
    return `${Math.abs(v)} ${v > 0 ? '↑' : '↓'}`
}
const fmtT = (t: number) => String(t).replace('.', ',')
const FlightSteps = ({ times, stops = {}, view, onDone }:
    { times: number[]; stops?: Record<number, ChoiceRound>; view: string; onDone: () => void }) => {
    const [shown, setShown] = useState(1)       // сколько моментов уже показано
    const [gT, setGT] = useState(times[0])
    const [moving, setMoving] = useState(false)
    const [stopDone, setStopDone] = useState<number[]>([])
    const finished = useRef(false)
    const curT = times[shown - 1]
    const pendingStop = stops[curT] && !stopDone.includes(curT) ? stops[curT] : null
    const atEnd = shown >= times.length
    const landed = atEnd && Math.abs(curT - T_FLIGHT) < 0.01 && !moving
    useEffect(() => {
        if (atEnd && !pendingStop && !moving && !finished.current) {
            finished.current = true
            const id = setTimeout(onDone, landed ? 1400 : 700)
            return () => clearTimeout(id)
        }
    }, [atEnd, pendingStop, moving]) // eslint-disable-line react-hooks/exhaustive-deps
    const step = () => {
        if (moving || atEnd) return
        playJustClick()
        const from = times[shown - 1], to = times[shown]
        let cur = from
        setMoving(true)
        const id = setInterval(() => {
            cur = Math.min(to, cur + (to - from) / 26)
            setGT(cur)
            if (cur >= to) { clearInterval(id); setMoving(false); setShown((s) => s + 1) }
        }, 25)
    }
    const pts: Pt[] = times.slice(0, shown).map((t, i) => ({ t, cur: i === shown - 1 && !moving }))
    const nextGap = atEnd ? 0 : times[shown] - times[shown - 1]
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <Field ghost trail={gT} grenadeT={moving ? gT : null} points={pts} view={view} landed={landed} />
            {/* табличка: vₓ всегда одна и та же, vᵧ каждую секунду меняется на 10 */}
            <div className="w-full max-w-[360px] rounded-xl border-2 border-[#3A464E] overflow-hidden text-center text-sm font-black tabular-nums">
                <div className="grid grid-cols-3 bg-[#1B2830] text-[#8FA3AE] text-sm py-1">
                    <span>t, с</span><span style={{ color: VX_COL }}><MathText>{'$v_x$'}</MathText>, м/с</span><span style={{ color: VY_COL }}><MathText>{'$v_y$'}</MathText>, м/с</span>
                </div>
                {times.slice(0, shown).map((t) => (
                    <motion.div key={t} className="grid grid-cols-3 py-0.5 border-t border-[#2A363D]" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}>
                        <span className="text-[#F2F7FB]">{fmtT(t)}</span>
                        <span style={{ color: VX_COL }}>{VX}</span>
                        <span style={{ color: VY_COL }}>{vyCell(t)}</span>
                    </motion.div>
                ))}
            </div>
            {pendingStop && !moving && (
                <div className="w-full">
                    <ChoiceGame rounds={[pendingStop]} onDone={() => setStopDone((d) => [...d, curT])} />
                </div>
            )}
            {!atEnd && !pendingStop && (
                <motion.div className="w-full flex" initial={{ opacity: 0 }} animate={{ opacity: moving ? 0.4 : 1 }}>
                    <button type="button" onClick={step} disabled={moving} className={walkthroughButtonClass(!moving)} style={walkthroughButtonStyle(!moving)}>
                        {nextGap === 1 ? 'Через 1 секунду' : `Через ${fmtT(nextGap)} секунды`}
                    </button>
                </motion.div>
            )}
        </div>
    )
}
const UP_VIEW = '20 60 232 172'
const DOWN_VIEW = '176 60 204 190'

// ===== Сцены =====
const SCENES: Scene[] = [
    {
        title: 'Бросок', next: 'Вижу: летит по параболе', parts: [
            { t: 'say', text: 'Команданте Мигель бросает гранату-конфетти под углом к горизонту 🎉 Котик спит в траве — он в курсе, это учебная' },
            { t: 'custom', render: (done) => <ThrowGame onDone={done} /> },
            { t: 'say', text: 'Граната летела по ПАРАБОЛЕ. Как и любое тело, брошенное под углом' },
        ],
    },
    {
        title: 'Начальная скорость', next: 'Понял: это вектор v₀', parts: [
            { t: 'say', text: 'А давай кое-что заметим 👀' },
            { t: 'fig', node: <Field trail={T_FLIGHT} grenadeT={0} /> },
            { t: 'pause', ms: 700 },
            { t: 'fig', node: <Field trail={T_FLIGHT} grenadeT={0} zoom /> },
            { t: 'pause', ms: 1500 },
            { t: 'fig', node: <Field trail={T_FLIGHT} grenadeT={0} zoom v0 /> },
            { t: 'pause', ms: 900 },
            { t: 'say', text: 'Приблизили самое начало броска. Стрелка — начальная скорость v₀. Угол 60°, и она касается параболы' },
        ],
    },
    {
        title: 'Две проекции', next: 'Вижу две проекции', parts: [
            { t: 'say', text: 'Уберём всё лишнее. Останется только вектор v₀' },
            { t: 'fig', node: <VectorFig step={0} /> },
            { t: 'say', text: 'У него есть ГОРИЗОНТАЛЬНАЯ проекция vₓ 👉' },
            { t: 'fig', node: <VectorFig step={1} /> },
            { t: 'say', text: 'И ВЕРТИКАЛЬНАЯ проекция vᵧ 👆' },
            { t: 'fig', node: <VectorFig step={2} /> },
            { t: 'say', text: 'А это угол α между v₀ и горизонтом' },
            { t: 'fig', node: <VectorFig step={3} /> },
        ],
    },
    {
        title: 'Чему равны проекции', next: 'Дальше', parts: [
            { t: 'fig', node: <VectorFig step={3} /> },
            {
                t: 'choice', label: 'Вопрос', rounds: [
                    { prompt: 'Чему равна горизонтальная проекция?', options: ['$v_0\\cos\\alpha$', '$v_0\\sin\\alpha$', '$v_0\\,\\mathrm{tg}\\,\\alpha$'],
                        correct: '$v_0\\cos\\alpha$', hint: 'Горизонтальный катет касается угла α, он прилежащий 🙃', ok: 'Прилежащий катет → косинус ✅' },
                ],
            },
            { t: 'fig', node: <VectorFig step={4} /> },
            { t: 'fig', node: <VectorFig step={5} /> },
            { t: 'remember', title: 'ЗАПОМНИ', lines: ['Горизонтальная, прилежащий катет: $v_x = v_0\\cos\\alpha$', 'Вертикальная, противолежащий: $v_y = v_0\\sin\\alpha$'] },
            { t: 'say', text: 'Тебе это понятно?' },
            { t: 'custom', render: (done) => <UnderstoodAsk onDone={done} /> },
        ],
    },
    {
        title: 'Гравитация', next: 'Понял: на vₓ g не влияет', parts: [
            { t: 'say', text: 'Вернёмся к броску. В самом начале скорость разложилась на две проекции' },
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps /> },
            { t: 'say', text: 'А ещё на гранату действует гравитация. Она тянет ВНИЗ ⬇️' },
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps g /> },
            { t: 'pause', ms: 600 },
            { t: 'say', text: 'Значит, g меняет только вертикальную проекцию vᵧ' },
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps g hiVy /> },
            reply('Ага, понял: g меняет только vᵧ'),
            { t: 'say', text: 'А vₓ от g НЕ зависит: g тянет вниз, а не вбок' },
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps g hiVy crossVx /> },
        ],
    },
    {
        title: 'Проверка: g', next: 'База', parts: [
            {
                t: 'choice', label: 'Проверим', rounds: [
                    { prompt: 'По какой оси действует $g$?', options: ['по оси y, вниз', 'по оси x', 'вдоль скорости'], correct: 'по оси y, вниз', hint: 'Гравитация всегда тянет вниз 🙃', ok: 'Вниз, по оси y ✅' },
                    { prompt: 'Влияет ли $g$ на $v_x$?', options: ['нет', 'да'], correct: 'нет', hint: 'g тянет вниз, а не вбок 🙃', ok: '$v_x$ живёт своей жизнью 😎' },
                    { prompt: 'Влияет ли $g$ на $v_y$?', options: ['да', 'нет'], correct: 'да', hint: 'g и $v_y$ на одной оси 🙃', ok: 'Ещё как влияет ✅' },
                ],
            },
        ],
    },
    {
        title: 'В цифрах', next: 'Давай кое-что заметим', parts: [
            { t: 'say', text: 'А теперь в цифрах. Команданте бросил гранату со скоростью 52 м/с под углом 60°' },
            { t: 'calc', tex: 'v_x = 52\\cdot\\cos 60^\\circ = 26 \\text{ м/с}' },
            { t: 'calc', tex: 'v_y = 52\\cdot\\sin 60^\\circ \\approx 45 \\text{ м/с}' },
            { t: 'say', text: 'Запомнили: вбок 26, вверх 45. Пусть g = 10 м/с²' },
        ],
    },
    {
        title: 'Секунда за секундой', next: 'Вижу: vₓ не меняется', parts: [
            { t: 'say', text: 'Смотрим на гранату каждую секунду. Жми кнопку ⏱' },
            {
                t: 'custom', render: (done) => (
                    <FlightSteps times={[0, 1, 2, 3, 4]} view={UP_VIEW} onDone={done} stops={{
                        2: { prompt: 'Почему $v_x$ всё время 26?', options: ['g тянет только вниз', 'граната тяжёлая', 'так повезло'], correct: 'g тянет только вниз',
                            hint: 'Вспомни, куда направлена гравитация 🙃', ok: 'По оси x ускорения нет, поэтому $v_x$ не меняется ✅' },
                    }} />
                ),
            },
        ],
    },
    {
        title: 'Сколько ещё вверх', next: 'Дальше', parts: [
            { t: 'say', text: 'Сейчас vᵧ = 5 м/с вверх. А каждую секунду она теряет 10' },
            {
                t: 'choice', label: 'Подумай', rounds: [
                    { prompt: 'Сколько ещё граната будет подниматься?', options: ['0,5 с', '1 с', '5 с', '2 с'], correct: '0,5 с', hint: 'Чтобы потерять 5 м/с, нужно полсекунды 🙃', ok: '5 м/с уйдут за 0,5 с ✅' },
                    { prompt: 'Сколько всего граната летела вверх?', options: ['4,5 с', '4 с', '5 с', '9 с'], correct: '4,5 с', hint: '4 секунды мы уже видели, плюс ещё 0,5 🙃', ok: '4 + 0,5 = 4,5 с ✅' },
                    { prompt: 'Как менялась $v_y$?', options: ['уменьшалась на 10 каждую секунду', 'не менялась', 'росла на 10 каждую секунду'], correct: 'уменьшалась на 10 каждую секунду',
                        hint: 'Посмотри в табличку: 45, 35, 25… 🙃', ok: 'Каждую секунду минус $g = 10$ ✅' },
                    { prompt: 'А как менялась $v_x$?', options: ['не менялась', 'уменьшалась', 'росла'], correct: 'не менялась', hint: 'В табличке везде 26 🙃', ok: 'Всегда 26 м/с 😎' },
                ],
            },
        ],
    },
    {
        title: 'Вершина', next: 'А что дальше?', parts: [
            { t: 'fig', node: <Field ghost trail={4.5} points={[{ t: 4.5, cur: true }]} view={UP_VIEW} /> },
            { t: 'say', text: 'Через 4,5 с граната в самой верхней точке. Тут vᵧ = 0: на миг она «зависла» по вертикали' },
            { t: 'say', text: 'А vₓ = 26 м/с никуда не делась: граната летит вбок' },
            {
                t: 'choice', label: 'Подумай', rounds: [
                    { prompt: 'Чему равна скорость гранаты в верхней точке?', options: ['26 м/с', '0', '52 м/с', '45 м/с'], correct: '26 м/с',
                        hint: '$v_y = 0$, но $v_x$ осталась 🙃', ok: 'Остаётся только $v_x = 26$ м/с ✅' },
                ],
            },
        ],
    },
    {
        title: 'Вниз', next: 'Мяу, понял', parts: [
            { t: 'say', text: 'А теперь граната развернётся и полетит вниз, разгоняясь. Котик, держись 🐾' },
            {
                t: 'custom', render: (done) => (
                    <FlightSteps times={[4.5, 5, 6, 7, 8, 9]} view={DOWN_VIEW} onDone={done} stops={{
                        7: { prompt: 'Что теперь происходит с $v_y$?', options: ['растёт на 10 каждую секунду вниз', 'уменьшается', 'не меняется'], correct: 'растёт на 10 каждую секунду вниз',
                            hint: 'Посмотри в табличку: 5, 15, 25… 🙃', ok: 'g разгоняет вниз ✅' },
                    }} />
                ),
            },
        ],
    },
    {
        title: 'Приземление', next: 'Всё понятно', parts: [
            { t: 'say', text: 'Приземлилась с vᵧ = 45 м/с вниз. Ровно с той же, с какой бросали вверх! И вниз летела тоже 4,5 с' },
            {
                t: 'choice', label: 'Подумай', rounds: [
                    { prompt: 'Сколько граната была в полёте?', options: ['9 с', '4,5 с', '10 с'], correct: '9 с', hint: '4,5 с вверх и 4,5 с вниз 🙃', ok: '4,5 + 4,5 = 9 с ✅' },
                    { prompt: 'А $v_x$ при падении?', options: ['26 м/с', '0', '52 м/с'], correct: '26 м/с', hint: 'g на $v_x$ не влияет 🙃', ok: 'Всё те же 26 м/с 😎' },
                ],
            },
        ],
    },
    {
        title: 'Уравнения', next: 'Формулы собраны', parts: [
            { t: 'say', text: 'Соберём всё в формулы. По оси x скорость постоянная — значит, путь = скорость × время' },
            { t: 'build', prompt: 'Собери координату x', tpl: ['$x =$', { s: 0 }, '$\\cdot$', { s: 1 }],
                chips: ['$v_0\\cos\\alpha$', '$v_0\\sin\\alpha$', '$t$', '$g$', '$t^2$', '$2$'], slots: ['$v_0\\cos\\alpha$', '$t$'], any: [[0, 1]],
                hint: 'По оси x — горизонтальная проекция, умноженная на время 🙃' },
            { t: 'say', text: 'По оси y ещё и гравитация: она отнимает gt²/2' },
            { t: 'build', prompt: 'Собери координату y', tpl: ['$y =$', { s: 0 }, '$\\cdot t \\ -$', { frac: [[{ s: 1 }], [{ s: 2 }]] }],
                chips: ['$v_0\\sin\\alpha$', '$v_0\\cos\\alpha$', '$gt^2$', '$gt$', '$2$', '$10$'], slots: ['$v_0\\sin\\alpha$', '$gt^2$', '$2$'],
                hint: 'Вверх — вертикальная проекция, а вычитаем $\\dfrac{gt^2}{2}$ 🙃' },
        ],
    },
    {
        title: 'Формулы броска', next: 'Я баллистик', parts: [
            { t: 'remember', title: 'ЗАПОМНИ', lines: [
                '$v_x = v_0\\cos\\alpha$ (не меняется)',
                '$v_y = v_0\\sin\\alpha - gt$',
                '$x = v_0\\cos\\alpha\\cdot t$',
                '$y = v_0\\sin\\alpha\\cdot t - \\dfrac{gt^2}{2}$',
            ] },
            {
                t: 'choice', label: 'Посчитай', rounds: [
                    { prompt: 'Где граната по x через 2 с? $x = 26\\cdot 2$', options: ['52 м', '28 м', '26 м'], correct: '52 м', hint: 'Просто умножь 26 на 2 🙃', ok: '52 м вбок ✅' },
                    { prompt: 'А на какой высоте через 1 с? $y = 45\\cdot 1 - \\dfrac{10\\cdot 1^2}{2}$', options: ['40 м', '45 м', '35 м'], correct: '40 м', hint: '45 − 5 🙃', ok: '40 м, как на картинке ✅' },
                ],
            },
        ],
    },
]

const T = (tag: string, text: string, options: string[], answer: string, hint: string) => ({ tag, text, options, answer, hint })

export const PROJECTILE_BASIC: SceneLesson = {
    question: 'Бросок под углом к горизонту',
    mascot: 'Бросок под углом',
    last: 'Я баллистик!',
    scenes: SCENES,
    trials: [
        T('vₓ', 'Тело бросили, $v_x = 20$ м/с. Чему равна $v_x$ через 3 с?', ['20 м/с', '50 м/с', '0', '10 м/с'], '20 м/с', 'g на $v_x$ не влияет 🙃'),
        T('vᵧ', 'В начале $v_y = 30$ м/с вверх. Чему $v_y$ через 2 с? ($g = 10$)', ['10 м/с', '30 м/с', '50 м/с', '20 м/с'], '10 м/с', '$30 - 10\\cdot 2$ 🙃'),
        T('Время', 'В начале $v_y = 40$ м/с вверх. Сколько тело поднимается?', ['4 с', '40 с', '2 с', '8 с'], '4 с', 'Каждую секунду минус 10, пока не станет 0 🙃'),
        T('Время', 'Тогда сколько оно летит до земли?', ['8 с', '4 с', '16 с', '10 с'], '8 с', 'Вверх 4 с и вниз столько же 🙃'),
        T('Дальность', '$v_x = 15$ м/с, тело в полёте 6 с. Как далеко оно улетит?', ['90 м', '21 м', '15 м', '45 м'], '90 м', '$x = v_x\\cdot t$ 🙃'),
        T('Проекция', '$v_0 = 20$ м/с, $\\alpha = 30^\\circ$. Чему равна $v_x$?', ['$10\\sqrt3$ м/с', '10 м/с', '20 м/с', '$20\\sqrt3$ м/с'], '$10\\sqrt3$ м/с', '$v_x = v_0\\cos\\alpha$, $\\cos 30^\\circ = \\dfrac{\\sqrt3}{2}$ 🙃'),
        T('Вершина', 'Что равно нулю в верхней точке траектории?', ['$v_y$', '$v_x$', '$g$', 'всё сразу'], '$v_y$', 'Тело на миг перестаёт подниматься 🙃'),
        T('Котик', 'Граната-конфетти летит 9 с, $v_x = 26$ м/с. На каком расстоянии от Команданте спит котик, если она упала рядом с ним?', ['234 м', '35 м', '117 м', '26 м'], '234 м', '$26\\cdot 9$ 🙃'),
    ],
}
