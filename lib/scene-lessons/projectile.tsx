'use client'

// Блок «Кинематика» (ЕГЭ Физика) → урок «Бросок под углом к горизонту» (SCENEWALK). Сценарий пользователя 2026-11-07:
//   Команданте бросает колбаску-конфетти, траектория рисуется параболой (котик спит в траве) →
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
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import { Typewriter } from '@/components/geometry/Typewriter'
import type { SceneLesson } from './types'

// Цвета: v₀ — синий, vₓ — бирюзовый, vᵧ — фиолетовый, g — жёлтый. Красный — только «не влияет».
const V0_COL = GGEGE_PALETTE.blue.button
const VX_COL = GGEGE_PALETTE.teal.button
const VY_COL = GGEGE_PALETTE.purple.button
const G_COL = '#F2C35B'
const BAD = '#DC605B'
const INK = '#F2F7FB'
const FONT = 'var(--font-nunito), sans-serif'
// Сцена в стиле ангара: приглушённое небо как в его окне, трава с тёмно-коричневым контуром.
const HALO = '#1E2A30'
const OUTLINE = '#3B2A1C'
const TXT = { stroke: HALO, strokeWidth: 2.4, strokeOpacity: 0.6, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const }
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
const S = 1.15          // px на метр
const K = 1             // px на 1 м/с (стрелки скоростей)
const px = (t: number) => OX + S * VX * t
const py = (t: number) => GY - S * (VY0 * t - (G * t * t) / 2)
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
            <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={HALO} strokeOpacity={0.55} strokeWidth={w + 2} strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash ? `${w * 2} ${w * 1.6}` : undefined} />
            <polygon points={`${x2},${y2} ${p(1, 0.55)} ${p(1, -0.55)}`} fill={color} stroke={HALO} strokeOpacity={0.55} strokeWidth={1} strokeLinejoin="round" />
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
        <text x={x} y={y} fontSize={size} fontStyle="italic" fontWeight={800} fill={color} fontFamily={FONT} {...TXT} strokeWidth={size * 0.16}>
            v<tspan fontSize={size * 0.6} dx={size * 0.06} dy={size * 0.3} fontStyle="normal">{sub}</tspan>
        </text>
        {vector && <Arrow x1={x + size * 0.02} y1={y - size * 0.86} x2={x + size * 0.6} y2={y - size * 0.86} color={color} w={size * 0.08} head={size * 0.2} />}
    </g>
)
const SubText = ({ x, y, size, color, main, sub, rest = '', anchor = 'start' }:
    { x: number; y: number; size: number; color: string; main: string; sub: string; rest?: string; anchor?: 'start' | 'middle' | 'end' }) => (
    <text x={x} y={y} fontSize={size} fontWeight={800} fill={color} fontFamily={FONT} textAnchor={anchor} {...TXT} strokeWidth={size * 0.16}>
        <tspan fontStyle="italic">{main}</tspan>
        <tspan fontSize={size * 0.62} dy={size * 0.28}>{sub}</tspan>
        {rest && <tspan dy={-size * 0.28}>{rest}</tspan>}
    </text>
)
// Колбаска котику (та же картинка, что в холодильнике ангара), крутится в полёте.
const Sausage = ({ x, y, r = 7, rot = 0 }: { x: number; y: number; r?: number; rot?: number }) => (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
        <image href="/hangar/life/cat-sausage.webp" x={-r * 1.8} y={-r * 0.9} width={r * 3.6} height={r * 1.8} />
    </g>
)
// Пучки травы с тёмным контуром (пока кодом; картинка Leonardo — промпт в docs/hangar/leonardo-prompts-life.md).
const Grass = () => (
    <g fill="#8DAE5C" stroke={OUTLINE} strokeOpacity={0.7} strokeWidth={0.9} strokeLinejoin="round">
        {Array.from({ length: 22 }, (_, i) => {
            const x = 6 + i * 17.5 + ((i * 7) % 6)
            const h = 5 + ((i * 13) % 4)
            return <path key={i} d={`M${x - 4},${GY + 1} L${x - 3},${GY - h * 0.6} L${x - 1},${GY - 2} L${x},${GY - h} L${x + 1.5},${GY - 2} L${x + 3.5},${GY - h * 0.7} L${x + 4},${GY + 1} Z`} />
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
    landed?: boolean                // колбаска упала: конфетти + котик проснулся
    view?: string                   // свой viewBox (кадр части траектории)
    maxW?: number
}
const SKY_TOP = '#4F7E8C'
const ZOOM_T = 'translate(92px,186px) scale(2.4) translate(-62px,-215px)'
const NO_ZOOM_T = 'translate(0px,0px) scale(1) translate(0px,0px)'
export const Field = ({ trail = 0, ghost, grenadeT = null, zoom, v0, comps, g, hiVy, crossVx, points = [], landed, view, maxW = 520 }: FieldProps) => {
    const v0x = OX + K * VX, v0y = GY - K * VY0
    return (
        <svg viewBox={view ?? `0 0 ${W} ${H}`} className="w-full h-auto rounded-2xl" style={{ maxWidth: maxW, maxHeight: '44vh', backgroundColor: SKY_TOP }}>
            <defs>
                <linearGradient id="proj-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={SKY_TOP} /><stop offset="0.65" stopColor="#7FA6A2" /><stop offset="1" stopColor="#A9C3AC" />
                </linearGradient>
            </defs>
            <g style={{ transform: zoom ? ZOOM_T : NO_ZOOM_T, transition: 'transform 1.4s cubic-bezier(0.65,0,0.35,1)' }}>
                <rect x={-200} y={-200} width={W + 400} height={GY + 200} fill="url(#proj-sky)" />
                <image href="/hangar/life/sun.webp" x={318} y={10} width={42} height={42} opacity={0.95} />
                <image href="/hangar/life/cloud-puffy.webp" x={22} y={18} width={74} height={38} opacity={0.9} />
                <image href="/hangar/life/cloud-round.webp" x={228} y={44} width={52} height={31} opacity={0.8} />
                {/* земля: полоска травы и полоска почвы с тёмным контуром */}
                <rect x={-200} y={GY} width={W + 400} height={120} fill="#8C6A4F" />
                <rect x={-200} y={GY} width={W + 400} height={9} fill="#6F8E47" />
                <line x1={-200} y1={GY + 9} x2={W + 200} y2={GY + 9} stroke={OUTLINE} strokeWidth={1.2} strokeOpacity={0.6} />
                <line x1={-200} y1={GY} x2={W + 200} y2={GY} stroke={OUTLINE} strokeWidth={1.8} />
                {/* Команданте смотрит вправо, туда, куда бросает */}
                <image href="/miguel/miguel-base.webp" x={-70} y={GY - 72} width={70} height={70} transform="scale(-1,1)"
                    style={{ opacity: zoom ? 0.15 : 1, transition: 'opacity 1s' }} />
                {/* котик ждёт колбаску у места падения, потом ест */}
                {landed
                    ? <image href="/hangar/life/cat-eat.webp" x={326} y={GY - 37} width={52} height={39} />
                    : <image href="/hangar/life/cat-sit.webp" x={336} y={GY - 49} width={40} height={49} />}
                {landed && (
                    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...POP, delay: 0.4 }}>
                        <rect x={332} y={GY - 66} width={44} height={20} rx={8} fill="#F4EEDC" stroke={OUTLINE} strokeWidth={1.2} />
                        <text x={354} y={GY - 52} textAnchor="middle" fontSize={11} fontWeight={900} fill={OUTLINE} fontFamily={FONT}>Ням!</text>
                    </motion.g>
                )}
                {/* трава поверх ног Команданте и лап котика: они стоят В траве */}
                <g style={{ opacity: zoom ? 0 : 1, transition: 'opacity 1s' }}><Grass /></g>
                {ghost && <path d={trailPath(T_FLIGHT)} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="4 5" />}
                {trail > 0 && <path d={trailPath(Math.min(trail, T_FLIGHT))} fill="none" stroke={INK} strokeOpacity={v0 ? 0.5 : 1} strokeWidth={zoom ? 1.4 : 2.6} strokeLinecap="round" />}

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
                                    <text x={x + K * VX / 2} y={y + 13} textAnchor="middle" fontSize={11} fontWeight={900} fill={VX_COL} fontFamily={FONT} {...TXT}>{VX}</text>
                                    {Math.abs(vy) > 0.1
                                        ? <text x={x - 5} y={y - (K * vy) / 2 + 4} textAnchor="end" fontSize={11} fontWeight={900} fill={VY_COL} fontFamily={FONT} {...TXT}>{Math.abs(vy)}</text>
                                        : <text x={x} y={y - 9} textAnchor="middle" fontSize={11} fontWeight={900} fill={VY_COL} fontFamily={FONT} {...TXT}>0</text>}
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
                        <text x={145} y={163} fontSize={7} fontWeight={900} fill={G_COL} fontFamily={FONT} fontStyle="italic" {...TXT} strokeWidth={1.2}>g</text>
                        <text x={145} y={171} fontSize={4.4} fontWeight={800} fill={G_COL} fontFamily={FONT} {...TXT} strokeWidth={0.9}>= 10 м/с²</text>
                    </motion.g>
                )}
                {v0 && (
                    <g>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                            <Arrow x1={OX} y1={GY} x2={v0x} y2={v0y} color={V0_COL} w={1.8} head={4.2} />
                            <path d={arcD(OX, GY, 9, -Math.PI / 3, 0)} fill="none" stroke={V0_COL} strokeWidth={0.9} />
                            <text x={OX + 10} y={GY - 3.2} fontSize={4.4} fontWeight={800} fill={V0_COL} fontFamily={FONT} {...TXT} strokeWidth={0.9}>60°</text>
                        </motion.g>
                        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...POP, delay: 0.6 }}>
                            <VecLabel x={OX - 2} y={GY - 26} size={11} color={V0_COL} sub="0" />
                        </motion.g>
                    </g>
                )}

                {grenadeT !== null && !comps && <Sausage x={px(grenadeT)} y={py(grenadeT) - 6} r={zoom ? 3 : 6} rot={grenadeT * 80} />}
                
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
                    <button type="button" onClick={go} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>Бросить колбаску</button>
                </motion.div>
            )}
        </div>
    )
}

// ===== Сцена 3: вектор v₀ и его проекции =====
// step: 0 только v₀; 1 горизонтальная проекция из начала; 2 вертикальная из начала; 3 вертикальная едет вправо,
// получается треугольник; 4 угол α; 5 подпись v₀·cos α; 6 подпись v₀·sin α.
const VectorFig = ({ step }: { step: number }) => {
    const O = { x: 60, y: 182 }, L = 150
    const E = { x: O.x + L * Math.cos(Math.PI / 3), y: O.y - L * Math.sin(Math.PI / 3) }
    const dx = E.x - O.x
    return (
        <svg viewBox="0 0 300 214" className="w-full h-auto" style={{ maxWidth: 420 }}>
            {step >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Arrow x1={O.x} y1={O.y} x2={E.x} y2={O.y} color={VX_COL} w={4} head={10} dash />
                </motion.g>
            )}
            {step >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* та же стрелка, переносится параллельно вправо (CSS-переход) */}
                    <g style={{ transform: `translateX(${step >= 3 ? dx : 0}px)`, transition: 'transform 1.1s cubic-bezier(0.65,0,0.35,1)' }}>
                        <Arrow x1={O.x} y1={O.y} x2={O.x} y2={E.y} color={VY_COL} w={4} head={10} dash />
                    </g>
                </motion.g>
            )}
            {step >= 3 && (
                <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                    d={`M${E.x - 11},${O.y} L${E.x - 11},${O.y - 11} L${E.x},${O.y - 11}`} fill="none" stroke="#8FA3AE" strokeWidth={2} />
            )}
            <Arrow x1={O.x} y1={O.y} x2={E.x} y2={E.y} color={V0_COL} w={5} head={13} />
            <VecLabel x={O.x + 12} y={O.y - 86} size={26} color={V0_COL} sub="0" />
            {step >= 4 && (
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                    <path d={arcD(O.x, O.y, 30, -Math.PI / 3, 0)} fill="none" stroke={G_COL} strokeWidth={3} />
                    <text x={O.x + 36} y={O.y - 9} fontSize={20} fontWeight={900} fontStyle="italic" fill={G_COL} fontFamily={FONT}>α</text>
                </motion.g>
            )}
            {step >= 5 && (
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={POP}>
                    <SubText x={(O.x + E.x) / 2} y={O.y + 26} size={19} color={VX_COL} main="v" sub="0" rest=" · cos α" anchor="middle" />
                </motion.g>
            )}
            {step >= 6 && (
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

// ===== Фраза со стикерами (просьба пользователя: меньше белого текста, ключевые слова — цветными стикерами) =====
type LinePart = string | [string, string]
const Stk = ({ text, color }: { text: string; color: string }) => (
    <motion.span initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center rounded-lg border-2 px-1.5 py-0.5 mx-0.5 font-extrabold align-middle leading-none"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}>{text}</motion.span>
)
const StickerLine = ({ parts, onDone }: { parts: LinePart[]; onDone: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plain = parts.map((p) => (typeof p === 'string' ? p : p[0])).join('')
    return (
        <div className="w-full text-center font-black text-lg md:text-xl text-[#F2F7FB] leading-relaxed">
            {!typed
                ? <Typewriter text={plain} onDone={() => { setTyped(true); setTimeout(onDone, 350) }} />
                : parts.map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : <Stk key={i} text={p[0]} color={p[1]} />))}
        </div>
    )
}
const ln = (...parts: LinePart[]) => ({ t: 'custom' as const, render: (done: () => void) => <StickerLine parts={parts} onDone={done} /> })
const Y = G_COL
const PAR_COL = '#F2F7FB'

// ===== Сцены =====
const SCENES: Scene[] = [
    {
        title: 'Бросок', next: 'Вижу: летит по параболе', parts: [
            ln('Котик проголодался 🐾 Бросаем ему ', ['колбаску', '#E07A5F']),
            { t: 'custom', render: (done) => <ThrowGame onDone={done} /> },
            ln('Летит по ', ['параболе', PAR_COL], ' 😺'),
        ],
    },
    {
        title: 'Начальная скорость', next: 'Понял: это вектор v₀', parts: [
            ln('Приблизим начало 🔍'),
            { t: 'fig', node: <Field trail={T_FLIGHT} grenadeT={0} /> },
            { t: 'pause', ms: 700 },
            { t: 'fig', node: <Field trail={T_FLIGHT} grenadeT={0} zoom /> },
            { t: 'pause', ms: 1500 },
            { t: 'fig', node: <Field trail={T_FLIGHT} grenadeT={0} zoom v0 /> },
            { t: 'pause', ms: 900 },
            ln('Это ', ['начальная скорость v₀', V0_COL]),
        ],
    },
    {
        title: 'Две проекции', next: 'Вижу две проекции', parts: [
            { t: 'fig', node: <VectorFig step={0} /> },
            ln('У ', ['v₀', V0_COL], ' есть две проекции'),
            ln(['горизонтальная vₓ', VX_COL]),
            { t: 'fig', node: <VectorFig step={1} /> },
            { t: 'pause', ms: 500 },
            ln(['вертикальная vᵧ', VY_COL]),
            { t: 'fig', node: <VectorFig step={2} /> },
            { t: 'pause', ms: 900 },
            { t: 'fig', node: <VectorFig step={3} /> },
            { t: 'pause', ms: 1300 },
            ln('Получился треугольник 📐'),
            { t: 'fig', node: <VectorFig step={4} /> },
            ln(['угол α', Y]),
        ],
    },
    {
        title: 'Чему равны проекции', next: 'Дальше', parts: [
            { t: 'fig', node: <VectorFig step={4} /> },
            {
                t: 'choice', label: 'Вопрос', rounds: [
                    { prompt: 'Чему равна горизонтальная проекция?', options: ['$v_0\\cos\\alpha$', '$v_0\\sin\\alpha$', '$v_0\\,\\mathrm{tg}\\,\\alpha$'],
                        correct: '$v_0\\cos\\alpha$', hint: 'Горизонтальный катет касается угла α, он прилежащий 🙃', ok: 'Прилежащий катет → косинус ✅' },
                ],
            },
            { t: 'fig', node: <VectorFig step={5} /> },
            { t: 'fig', node: <VectorFig step={6} /> },
            { t: 'remember', title: 'ЗАПОМНИ', lines: ['Горизонтальная, прилежащий катет: $v_x = v_0\\cos\\alpha$', 'Вертикальная, противолежащий: $v_y = v_0\\sin\\alpha$'] },
            ln('Понятно? 🤔'),
            { t: 'custom', render: (done) => <UnderstoodAsk onDone={done} /> },
        ],
    },
    {
        title: 'Гравитация', next: 'Понял: на vₓ g не влияет', parts: [
            ln('Снова бросок: ', ['vₓ', VX_COL], ' и ', ['vᵧ', VY_COL]),
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps /> },
            ln(['g', Y], ' тянет ВНИЗ ⬇️'),
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps g /> },
            { t: 'pause', ms: 600 },
            ln(['g', Y], ' меняет только ', ['vᵧ', VY_COL]),
            { t: 'fig', node: <Field ghost grenadeT={0} zoom comps g hiVy /> },
            reply('Ага, понял: g меняет только vᵧ'),
            ln(['g', Y], ' НЕ трогает ', ['vₓ', VX_COL]),
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
            ln('В цифрах: ', ['52 м/с', V0_COL], ' под ', ['60°', Y]),
            { t: 'calc', tex: 'v_x = 52\\cdot\\cos 60^\\circ = 26 \\text{ м/с}' },
            { t: 'calc', tex: 'v_y = 52\\cdot\\sin 60^\\circ \\approx 45 \\text{ м/с}' },
            ln(['vₓ = 26', VX_COL], ' ', ['vᵧ = 45', VY_COL], ' ', ['g = 10', Y]),
        ],
    },
    {
        title: 'Секунда за секундой', next: 'Вижу: vₓ не меняется', parts: [
            ln('Жми ⏱ и следи за ', ['vₓ', VX_COL], ' и ', ['vᵧ', VY_COL]),
            {
                t: 'custom', render: (done) => (
                    <FlightSteps times={[0, 1, 2, 3, 4]} view={UP_VIEW} onDone={done} stops={{
                        2: { prompt: 'Почему $v_x$ всё время 26?', options: ['g тянет только вниз', 'колбаска вкусная', 'так повезло'], correct: 'g тянет только вниз',
                            hint: 'Вспомни, куда направлена гравитация 🙃', ok: 'По оси x ускорения нет, поэтому $v_x$ не меняется ✅' },
                    }} />
                ),
            },
        ],
    },
    {
        title: 'Сколько ещё вверх', next: 'Дальше', parts: [
            ln(['vᵧ = 5 ↑', VY_COL], ' теряет ', ['10 за секунду', Y]),
            {
                t: 'choice', label: 'Подумай', rounds: [
                    { prompt: 'Сколько ещё колбаска будет подниматься?', options: ['0,5 с', '1 с', '5 с', '2 с'], correct: '0,5 с', hint: 'Чтобы потерять 5 м/с, нужно полсекунды 🙃', ok: '5 м/с уйдут за 0,5 с ✅' },
                    { prompt: 'Сколько всего колбаска летела вверх?', options: ['4,5 с', '4 с', '5 с', '9 с'], correct: '4,5 с', hint: '4 секунды мы уже видели, плюс ещё 0,5 🙃', ok: '4 + 0,5 = 4,5 с ✅' },
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
            ln('Вершина: ', ['vᵧ = 0', VY_COL]),
            ln('А ', ['vₓ = 26', VX_COL], ' летит дальше 😎'),
            {
                t: 'choice', label: 'Подумай', rounds: [
                    { prompt: 'Чему равна скорость колбаски в верхней точке?', options: ['26 м/с', '0', '52 м/с', '45 м/с'], correct: '26 м/с',
                        hint: '$v_y = 0$, но $v_x$ осталась 🙃', ok: 'Остаётся только $v_x = 26$ м/с ✅' },
                ],
            },
        ],
    },
    {
        title: 'Вниз', next: 'Мяу, понял', parts: [
            ln('Вниз! ', ['vᵧ растёт', VY_COL], ' Котик, лови 🐾'),
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
            ln('Упала с ', ['vᵧ = 45 ↓', VY_COL], ' как бросали ↑'), ln('Вверх ', ['4,5 с', Y], ' вниз ', ['4,5 с', Y]),
            {
                t: 'choice', label: 'Подумай', rounds: [
                    { prompt: 'Сколько колбаска была в полёте?', options: ['9 с', '4,5 с', '10 с'], correct: '9 с', hint: '4,5 с вверх и 4,5 с вниз 🙃', ok: '4,5 + 4,5 = 9 с ✅' },
                    { prompt: 'А $v_x$ при падении?', options: ['26 м/с', '0', '52 м/с'], correct: '26 м/с', hint: 'g на $v_x$ не влияет 🙃', ok: 'Всё те же 26 м/с 😎' },
                ],
            },
        ],
    },
    {
        title: 'Уравнения', next: 'Формулы собраны', parts: [
            ln('По x: ', ['скорость × время', VX_COL]),
            { t: 'build', prompt: 'Собери координату x', tpl: ['$x =$', { s: 0 }, '$\\cdot$', { s: 1 }],
                chips: ['$v_0\\cos\\alpha$', '$v_0\\sin\\alpha$', '$t$', '$g$', '$t^2$', '$2$'], slots: ['$v_0\\cos\\alpha$', '$t$'], any: [[0, 1]],
                hint: 'По оси x — горизонтальная проекция, умноженная на время 🙃' },
            ln('По y ещё ', ['g', Y], ' отнимает ', ['gt²/2', Y]),
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
                    { prompt: 'Где колбаска по x через 2 с? $x = 26\\cdot 2$', options: ['52 м', '28 м', '26 м'], correct: '52 м', hint: 'Просто умножь 26 на 2 🙃', ok: '52 м вбок ✅' },
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
        T('Котик', 'Колбаска летит 9 с, $v_x = 26$ м/с, и падает прямо к котику. На каком расстоянии от Команданте сидит котик?', ['234 м', '35 м', '117 м', '26 м'], '234 м', '$26\\cdot 9$ 🙃'),
    ],
}
