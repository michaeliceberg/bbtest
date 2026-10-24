'use client'

// «Графики» → «Прямая» → «y = kx + b» (LINEWALK). Первый урок блока «Графики» (задание ЕГЭ №12, база для №9).
// Сцены: два графика (вверх — зелёный, вниз — красный, стрелка вдоль прямой с подписью «идёт вверх/вниз») → знак наклона →
// формула y = kx + b → b — точка пересечения с осью Y (b = 2, b = −3) → игры «b > 0 или b < 0?» и «подвинь прямую» →
// k задаёт наклон (ЗАПОМНИ) → игра «k > 0 или k < 0?» → игра «k и b сразу» (4 плитки) → крутизна «горки» → наклон по
// клеточкам: вправо 1, вверх 5 → k = 5/1 → «какой наклон?» (вверх 3 за 2) → вниз 4 → k = −4/1 (МИНУС!) → «придумай свой
// отрицательный наклон» (знак, потом дробь) → «собери уравнение» y = [k]x + [b] → «Проверим себя» 5 заданий.
// Тон весёлый (правило CLAUDE.md «обучение весёлое»): шутки в текстах, мемы и Га-Га на ответах.
// Сетка — свой SVG (`Grid`): клетка C px, оси, прямые обрезаются по краю сетки.

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock, glassStickerStyle,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, RememberPlate, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner,
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

const UP = GGEGE_PALETTE.green.button      // график вверх, k > 0
const DOWN = '#DC605B'                      // график вниз, k < 0
const B_COL = GGEGE_PALETTE.blue.button     // b — пересечение с осью Y
const K_COL = GGEGE_PALETTE.purple.button   // буква k в формуле
const TEXT = '#F2F7FB'
const MUTED = '#9AA7B0'
const NEUTRAL = '#E6EDF2'
const OK_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'

// ===== Числа и формулы =====
const MINUS = '−'
const fmtNum = (v: number): string => {
    const s = v < 0 ? MINUS : ''
    const a = Math.abs(v)
    if (a === 0.5) return `${s}½`
    return `${s}${Number.isInteger(a) ? a : a.toString().replace('.', ',')}`
}
const kPart = (k: number) => (k === 1 ? '' : k === -1 ? MINUS : fmtNum(k))
// «y = 3x − 1», «y = −½x + 1», «y = 2x»
const eqText = (k: number, b: number) => {
    const bp = b === 0 ? '' : b > 0 ? ` + ${fmtNum(b)}` : ` ${MINUS} ${fmtNum(-b)}`
    return k === 0 ? `y = ${fmtNum(b)}` : `y = ${kPart(k)}x${bp}`
}

// ===== Сетка =====
const R = 5
const C = 30
const PAD = 18
const SZ = 2 * R * C + 2 * PAD
const sx = (x: number) => PAD + (x + R) * C
const sy = (y: number) => PAD + (R - y) * C
const clipX = (k: number, b: number): [number, number] => {
    let lo = -R, hi = R
    if (k !== 0) {
        const xa = (-R - b) / k, xb = (R - b) / k
        lo = Math.max(lo, Math.min(xa, xb)); hi = Math.min(hi, Math.max(xa, xb))
    }
    return [lo, hi]
}

type GLine = { k: number; b: number; color: string; arrow?: string; dim?: boolean; width?: number; tapId?: number; label?: string }

// Фигурная скобка вдоль горизонтального отрезка (h > 0 — выпуклость вниз)
const braceH = (x1: number, x2: number, y: number, h: number) => {
    const q = h / 2, a = Math.abs(q), m = (x1 + x2) / 2
    return `M${x1},${y} Q${x1},${y + q} ${x1 + a},${y + q} L${m - a},${y + q} Q${m},${y + q} ${m},${y + h} Q${m},${y + q} ${m + a},${y + q} L${x2 - a},${y + q} Q${x2},${y + q} ${x2},${y}`
}
// То же вдоль вертикального (h > 0 — выпуклость вправо), y1 < y2
const braceV = (x: number, y1: number, y2: number, h: number) => {
    const q = h / 2, a = Math.abs(q), m = (y1 + y2) / 2
    return `M${x},${y1} Q${x + q},${y1} ${x + q},${y1 + a} L${x + q},${m - a} Q${x + q},${m} ${x + h},${m} Q${x + q},${m} ${x + q},${m + a} L${x + q},${y2 - a} Q${x + q},${y2} ${x},${y2}`
}

const LineShape = ({ l, delay = 0, onTap }: { l: GLine; delay?: number; onTap?: (id: number) => void }) => {
    const [lo, hi] = clipX(l.k, l.b)
    const x1 = sx(lo), y1 = sy(l.k * lo + l.b), x2 = sx(hi), y2 = sy(l.k * hi + l.b)
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    // нормаль «вверх по экрану» — туда рисуем стрелку и подпись
    let nx = uy, ny = -ux
    if (ny > 0) { nx = -nx; ny = -ny }
    const off = 16
    const ax1 = x1 + dx * 0.2 + nx * off, ay1 = y1 + dy * 0.2 + ny * off
    const ax2 = x1 + dx * 0.8 + nx * off, ay2 = y1 + dy * 0.8 + ny * off
    const head = (ang: number) => {
        const c = Math.cos(ang), s = Math.sin(ang)
        return `${ax2 + (-ux * c + uy * s) * 11},${ay2 + (-ux * s - uy * c) * 11}`
    }
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI
    const mx = (ax1 + ax2) / 2 + nx * 16, my = (ay1 + ay2) / 2 + ny * 16
    return (
        <g opacity={l.dim ? 0.25 : 1} style={{ transition: 'opacity 0.4s' }}>
            <motion.path d={`M${x1},${y1} L${x2},${y2}`} stroke={l.color} strokeWidth={l.width ?? 5} strokeLinecap="round" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay, ease: 'easeOut' }} />
            {onTap && l.tapId !== undefined && (
                <path d={`M${x1},${y1} L${x2},${y2}`} stroke="transparent" strokeWidth={30} style={{ cursor: 'pointer' }} onClick={() => onTap(l.tapId!)} />
            )}
            {l.arrow && (
                <>
                    <motion.path d={`M${ax1},${ay1} L${ax2},${ay2} M${head(0.5)} L${ax2},${ay2} L${head(-0.5)}`}
                        stroke={l.color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.7, delay: delay + 0.8 }} />
                    <g transform={`translate(${mx},${my}) rotate(${deg})`}>
                        <motion.text textAnchor="middle" dominantBaseline="middle" fontSize={20} fontWeight={900} fill={l.color}
                            style={{ fontFamily: 'var(--font-nunito), sans-serif' }}
                            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 12, delay: delay + 1.4 }}>
                            {l.arrow}
                        </motion.text>
                    </g>
                </>
            )}
            {l.label && (
                <text x={x2 - 6} y={y2 + (y2 < SZ / 2 ? 18 : -10)} textAnchor="end" fontSize={17} fontWeight={900} fill={l.color}
                    style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{l.label}</text>
            )}
        </g>
    )
}

const Grid = ({ lines, numbers = false, bDot, steps, className, onLineTap, glowY }: {
    lines: GLine[]
    numbers?: boolean
    bDot?: { b: number; label?: string; pulse?: boolean }
    steps?: { k: number; b: number; x0: number; run: number; color: string; show: 0 | 1 | 2 }
    className?: string
    onLineTap?: (id: number) => void
    glowY?: boolean
}) => {
    const ticks = Array.from({ length: 2 * R + 1 }, (_, i) => i - R)
    return (
        <svg viewBox={`0 0 ${SZ} ${SZ}`} className={cn('w-full h-auto select-none', className)} style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
            <rect x={PAD} y={PAD} width={2 * R * C} height={2 * R * C} rx={8} fill="#121A1E" />
            {ticks.map((t) => (
                <g key={t}>
                    <line x1={sx(t)} y1={PAD} x2={sx(t)} y2={SZ - PAD} stroke="#24323A" strokeWidth={1} />
                    <line x1={PAD} y1={sy(t)} x2={SZ - PAD} y2={sy(t)} stroke="#24323A" strokeWidth={1} />
                </g>
            ))}
            {glowY && <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={SZ - PAD} stroke={B_COL} strokeWidth={6} opacity={0.35} />}
            <line x1={PAD} y1={sy(0)} x2={SZ - PAD + 4} y2={sy(0)} stroke="#8B98A1" strokeWidth={2} />
            <line x1={sx(0)} y1={SZ - PAD} x2={sx(0)} y2={PAD - 4} stroke="#8B98A1" strokeWidth={2} />
            <path d={`M${SZ - PAD + 4},${sy(0)} l-8,-5 M${SZ - PAD + 4},${sy(0)} l-8,5`} stroke="#8B98A1" strokeWidth={2} />
            <path d={`M${sx(0)},${PAD - 4} l-5,8 M${sx(0)},${PAD - 4} l5,8`} stroke="#8B98A1" strokeWidth={2} />
            <text x={SZ - PAD - 4} y={sy(0) + 18} fontSize={15} fontWeight={800} fill="#8B98A1" textAnchor="end">x</text>
            <text x={sx(0) + 8} y={PAD + 10} fontSize={15} fontWeight={800} fill="#8B98A1">y</text>
            {numbers && ticks.filter((t) => t !== 0 && t % 1 === 0).map((t) => (
                <g key={`n${t}`}>
                    <text x={sx(t)} y={sy(0) + 14} fontSize={10} fill="#5C6B73" textAnchor="middle">{t}</text>
                    <text x={sx(0) - 5} y={sy(t) + 4} fontSize={10} fill="#5C6B73" textAnchor="end">{t}</text>
                </g>
            ))}
            {lines.map((l, i) => <LineShape key={`${i}-${l.k}-${l.b}`} l={l} delay={i * 0.2} onTap={onLineTap} />)}
            {steps && <StepsDraw {...steps} />}
            {bDot && (
                <g>
                    <motion.circle cx={sx(0)} cy={sy(bDot.b)} fill={B_COL} stroke="#0E1518" strokeWidth={2}
                        initial={{ r: 0 }} animate={{ r: 8 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }} />
                    {bDot.pulse && (
                        <motion.circle cx={sx(0)} cy={sy(bDot.b)} r={8} fill="none" stroke={B_COL} strokeWidth={3}
                            animate={{ r: [8, 22], opacity: [0.9, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    )}
                    {bDot.label && (
                        <g transform={`translate(${sx(0) + (bDot.b >= 0 ? -16 : 16)},${sy(bDot.b)})`}>
                            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 11, delay: 0.3 }}>
                                <rect x={bDot.b >= 0 ? -74 : 0} y={-16} width={74} height={32} rx={9} fill="#161F23" stroke={B_COL} strokeWidth={2.5} />
                                <text x={bDot.b >= 0 ? -37 : 37} y={6} textAnchor="middle" fontSize={18} fontWeight={900} fill={B_COL}>{bDot.label}</text>
                            </motion.g>
                        </g>
                    )}
                </g>
            )}
        </svg>
    )
}

// «Вправо на run, вверх (или вниз) на rise» — линии-катеты, скобки и числа
const StepsDraw = ({ k, b, x0, run, color, show }: { k: number; b: number; x0: number; run: number; color: string; show: 0 | 1 | 2 }) => {
    const rise = k * run
    const y0 = k * x0 + b
    const ax = sx(x0), ay = sy(y0), bx = sx(x0 + run), by = sy(y0 + rise)
    const top = Math.min(ay, by), bot = Math.max(ay, by)
    const below = rise >= 0 // горизонталь внизу треугольника — скобку рисуем под ней
    return (
        <g>
            {show >= 1 && (
                <g>
                    <motion.path d={`M${ax},${ay} L${bx},${ay}`} stroke={TEXT} strokeWidth={3.5} strokeDasharray="7 6" fill="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
                    <motion.path d={braceH(ax, bx, ay + (below ? 6 : -6), below ? 12 : -12)} stroke={TEXT} strokeWidth={2.5} fill="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />
                    <motion.text x={(ax + bx) / 2} y={ay + (below ? 38 : -26)} textAnchor="middle" fontSize={22} fontWeight={900} fill={TEXT}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{run}</motion.text>
                </g>
            )}
            {show >= 2 && (
                <g>
                    <motion.path d={`M${bx},${ay} L${bx},${by}`} stroke={color} strokeWidth={4.5} fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
                    <motion.path d={braceV(bx + 6, top, bot, 12)} stroke={color} strokeWidth={2.5} fill="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
                    <motion.text x={bx + 30} y={(top + bot) / 2 + 8} fontSize={22} fontWeight={900} fill={color}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{Math.abs(rise)}</motion.text>
                </g>
            )}
            <circle cx={ax} cy={ay} r={5} fill={TEXT} />
            {show >= 2 && <circle cx={bx} cy={by} r={5} fill={color} />}
        </g>
    )
}

// ===== Мелочи сцен =====
const TLine = ({ text, onDone, readMs = 450, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-xl md:text-2xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)
const ReplyButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <motion.div className="w-full flex" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button type="button" onClick={onClick} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{children}</button>
    </motion.div>
)
function usePhase() {
    const [phase, setPhase] = useState(0)
    const go = (n: number) => setPhase((p) => Math.max(p, n))
    return { phase, go }
}
const SettleOnMount = ({ onSettled }: SceneProps) => {
    useEffect(() => { const t = setTimeout(() => onSettled?.(), 500); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return null
}
const Counter = ({ i, n, color = K_COL }: { i: number; n: number; color?: string }) => (
    <span className="px-2.5 h-7 inline-flex items-center rounded-full border-2 text-sm font-black tabular-nums"
        style={{ borderColor: hexToRgba(color, 0.55), backgroundColor: hexToRgba(color, 0.16), color }}>{i + 1}/{n}</span>
)
const WrongBox = ({ text }: { text: string }) => (
    <div className="w-full text-center text-sm md:text-base font-bold rounded-xl px-3 py-2" style={{ color: WRONG_COLOR, backgroundColor: hexToRgba(WRONG_COLOR, 0.13) }}>{text}</div>
)
const Sticker = ({ color, children, big }: { color: string; children: React.ReactNode; big?: boolean }) => (
    <span className={cn('inline-flex items-center justify-center rounded-lg border-2 font-black px-1.5 mx-0.5 align-middle', big ? 'text-2xl md:text-3xl py-0.5' : 'text-lg md:text-xl')}
        style={glassStickerStyle(color)}>{children}</span>
)
// Дробь: числитель над знаменателем (правило проекта — дроби всегда дробью)
const Frac = ({ n, d, color = TEXT, size = 'text-3xl md:text-4xl' }: { n: React.ReactNode; d: React.ReactNode; color?: string; size?: string }) => (
    <span className={cn('inline-flex flex-col items-center font-black leading-none align-middle', size)} style={{ color }}>
        <span>{n}</span>
        <span className="w-full min-w-[1.2em] h-[3px] my-1 rounded-full" style={{ backgroundColor: color }} />
        <span>{d}</span>
    </span>
)
const Formula = ({ k, b }: { k?: React.ReactNode; b?: React.ReactNode }) => (
    <div className="flex items-center justify-center gap-2 text-4xl md:text-5xl font-black text-[#F2F7FB]">
        <span>y</span><span style={{ color: MUTED }}>=</span>
        <span style={{ color: K_COL }}>{k ?? 'k'}</span><span>x</span>
        <span style={{ color: MUTED }}>+</span>
        <span style={{ color: B_COL }}>{b ?? 'b'}</span>
    </div>
)

// ===== Сцена 0: вверх и вниз =====
const UpDownScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="Смотри — два графика 👀" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full grid grid-cols-2 gap-2">
                        <Grid lines={[{ k: 0.8, b: 0, color: UP, arrow: 'идёт вверх' }]} />
                        {phase >= 3 ? <Grid lines={[{ k: -0.8, b: 0, color: DOWN, arrow: 'идёт вниз' }]} /> : <div />}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Этот график идёт ВВЕРХ 📈 — как твоё настроение после этого урока." onDone={() => go(3)} />}
            {phase >= 3 && <TLine small text="А этот идёт ВНИЗ 📉 — как заряд телефона на уроке." onDone={() => go(4)} readMs={1700} />}
            {phase >= 4 && <TLine small text="Читаем график всегда слева направо, как книжку 📖" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 1: знак наклона =====
const SignScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="У прямой есть НАКЛОН." onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full grid grid-cols-2 gap-2">
                        {[{ k: 0.8, c: UP, s: '+', t: 'положительный' }, { k: -0.8, c: DOWN, s: MINUS, t: 'отрицательный' }].map((g, i) => (
                            <div key={i} className="relative">
                                <Grid lines={[{ k: g.k, b: 0, color: g.c }]} />
                                {phase >= 2 + i && (
                                    <motion.div className="absolute top-2 left-1/2 -translate-x-1/2" initial={{ scale: 5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 11 }}>
                                        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl border-2 text-3xl font-black"
                                            style={glassStickerStyle(g.c)}>{g.s}</span>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Вверх — наклон ПОЛОЖИТЕЛЬНЫЙ ➕" onDone={() => go(3)} />}
            {phase >= 3 && <TLine small text="Вниз — наклон ОТРИЦАТЕЛЬНЫЙ ➖" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 2: формула =====
const FormulaScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="У каждой прямой есть свой паспорт — формула 🪪" onDone={() => go(1)} />
            {phase >= 1 && (
                <motion.div className="w-full py-3 rounded-2xl border-2 border-[#3A464E] bg-[#161F23]" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 14 }} onAnimationComplete={() => setTimeout(() => go(2), 500)}>
                    <Formula />
                </motion.div>
            )}
            {phase >= 2 && <TLine small text="В ней два секрета: k и b. Начнём с b — он попроще 😏" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 3: что такое b =====
const BScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="b — это где прямая врезается в ось Y. Бум! 💥" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full max-w-[300px] mx-auto">
                        <Grid numbers glowY lines={[{ k: 1, b: 2, color: NEUTRAL }]} bDot={phase >= 2 ? { b: 2, label: 'b = 2', pulse: phase < 3 } : undefined} />
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Прямая пересекла ось Y на высоте 2 — значит b = 2." onDone={() => go(3)} />}
            {phase === 3 && <ReplyButton onClick={() => go(4)}>А если ниже нуля?</ReplyButton>}
            {phase >= 4 && (
                <DiagramBlock onSettled={() => go(5)}>
                    <div className="w-full max-w-[300px] mx-auto">
                        <Grid numbers glowY lines={[{ k: -1, b: -3, color: NEUTRAL }]} bDot={phase >= 5 ? { b: -3, label: `b = ${MINUS}3` } : undefined} />
                    </div>
                </DiagramBlock>
            )}
            {phase >= 5 && <TLine small text={`Тут ось Y пробита на −3, значит b = −3.`} onDone={() => go(6)} />}
            {phase >= 6 && (
                <motion.div className="w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onAnimationComplete={() => onSettled?.()}>
                    <RememberPlate>
                        <div className="text-lg md:text-xl">Пересекла ось Y <span style={{ color: B_COL }}>выше нуля</span> — b &gt; 0</div>
                        <div className="text-lg md:text-xl">Пересекла <span style={{ color: B_COL }}>ниже нуля</span> — b &lt; 0</div>
                    </RememberPlate>
                </motion.div>
            )}
        </>
    )
}

// ===== Универсальная мини-игра «выбери ответ по картинке» =====
type ChoiceRound = { lines: GLine[]; numbers?: boolean; question: string; options: string[]; correct: number; after: string; hint: string }
const ChoiceRounds = ({ title, rounds, color, onSettled, cols = 2 }: { title: string; rounds: ChoiceRound[]; color: string; onSettled?: () => void; cols?: number }) => {
    const { phase, go } = usePhase()
    const [ri, setRi] = useState(0)
    const [done, setDone] = useState(false)
    const [wrong, setWrong] = useState<number[]>([])
    const [msg, setMsg] = useState<string | null>(null)
    const r = rounds[ri]
    const last = ri + 1 >= rounds.length
    const pick = (i: number) => {
        if (done || wrong.includes(i)) return
        if (i === r.correct) { setDone(true); setMsg(null); showAnswerMeme(true) }
        else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setWrong((w) => [...w, i]); setMsg(`${pickWrongTryPhrase()} ${r.hint}`)
        }
    }
    const next = () => { setRi((x) => x + 1); setDone(false); setWrong([]); setMsg(null) }
    return (
        <>
            <TLine text={title} onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div key={ri} className="w-full flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2"><Counter i={ri} n={rounds.length} color={color} /></div>
                        <div className="w-full max-w-[280px] mx-auto"><Grid numbers={r.numbers} lines={r.lines} /></div>
                        <div className="text-lg md:text-xl font-black text-center text-[#F2F7FB]">{r.question}</div>
                        <div className={cn('drop-in-options grid gap-3 w-full', cols === 2 ? 'grid-cols-2' : 'grid-cols-4')}>
                            {r.options.map((o, i) => {
                                const isWrong = wrong.includes(i), isRight = done && i === r.correct
                                return (
                                    <button key={i} type="button" onClick={() => pick(i)} disabled={done || isWrong}
                                        className={cn('min-h-[56px] rounded-xl border-2 border-b-4 text-xl md:text-2xl font-black transition-colors',
                                            isRight ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]' : isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B] opacity-60' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                        {o}
                                    </button>
                                )
                            })}
                        </div>
                        {!done && msg && <WrongBox text={msg} />}
                        {done && (
                            <>
                                <FieryFeedbackBanner>{r.after}</FieryFeedbackBanner>
                                <LocalAnswerConfetti />
                                {last ? <SettleOnMount onSettled={onSettled} /> : <ReplyButton onClick={next}>Следующий →</ReplyButton>}
                            </>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// ===== Сцена 4: «b > 0 или b < 0?» =====
const B_SIGN: [number, number][] = [[1, 2], [-1, -3], [2, -1], [-0.5, 3], [0.5, -2]]
const BSignScene = ({ onSettled }: SceneProps) => (
    <ChoiceRounds title="Мини-игра: b больше нуля или меньше? 🎯" color={B_COL} onSettled={onSettled}
        rounds={B_SIGN.map(([k, b], i) => ({
            lines: [{ k, b, color: NEUTRAL }], numbers: true, question: 'Где прямая пробила ось Y?',
            options: ['b > 0', 'b < 0'], correct: b > 0 ? 0 : 1,
            after: b > 0 ? ['Выше нуля — b > 0. Красава!', 'Сверху! b > 0 🔥', 'Изи: b > 0'][i % 3] : ['Ниже нуля — b < 0. Шаришь!', 'Подвал! b < 0 😎', 'Точно: b < 0'][i % 3],
            hint: 'Смотри только на ось Y: выше нуля или ниже?',
        }))} />
)

// ===== Сцена 5: подвинь прямую =====
const B_TARGETS = [2, -3]
const BMoveScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [ri, setRi] = useState(0)
    const [b, setB] = useState(0)
    const target = B_TARGETS[ri]
    const done = b === target
    const last = ri + 1 >= B_TARGETS.length
    useEffect(() => { if (done) showAnswerMeme(true) }, [done])
    return (
        <>
            <TLine text="Теперь ты рулишь прямой 🕹️" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div key={ri} className="w-full flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2"><Counter i={ri} n={B_TARGETS.length} color={B_COL} /></div>
                        <div className="text-lg md:text-xl font-black text-center text-[#F2F7FB]">
                            Подвинь прямую так, чтобы <Sticker color={B_COL}>b = {fmtNum(target)}</Sticker>
                        </div>
                        <div className="w-full max-w-[280px] mx-auto">
                            <Grid numbers glowY lines={[{ k: ri === 0 ? 1 : -0.5, b, color: done ? OK_COLOR : NEUTRAL }]} bDot={{ b, label: `b = ${fmtNum(b)}` }} />
                        </div>
                        {!done ? (
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button type="button" onClick={() => setB((v) => Math.min(4, v + 1))}
                                    className="min-h-[56px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-xl font-black text-[#F2F7FB]">▲ Выше</button>
                                <button type="button" onClick={() => setB((v) => Math.max(-4, v - 1))}
                                    className="min-h-[56px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-xl font-black text-[#F2F7FB]">▼ Ниже</button>
                            </div>
                        ) : (
                            <>
                                <FieryFeedbackBanner>{target > 0 ? 'b = 2 — выше нуля. Ты повелитель прямых 👑' : 'b = −3 — в подвале. Идеально!'}</FieryFeedbackBanner>
                                <LocalAnswerConfetti />
                                {last ? <SettleOnMount onSettled={onSettled} /> : <ReplyButton onClick={() => { setRi(1); setB(0) }}>Следующий →</ReplyButton>}
                            </>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// ===== Сцена 6: k — наклон =====
const KScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="А теперь k — коэффициент наклона." onDone={() => go(1)} />
            {phase >= 1 && (
                <motion.div className="w-full py-3 rounded-2xl border-2 border-[#3A464E] bg-[#161F23]" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 14 }} onAnimationComplete={() => setTimeout(() => go(2), 400)}>
                    <Formula b={<span style={{ opacity: 0.35 }}>b</span>} />
                </motion.div>
            )}
            {phase >= 2 && <TLine small text="Именно k решает, куда идёт прямая — вверх или вниз." onDone={() => go(3)} />}
            {phase >= 3 && (
                <motion.div className="w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onAnimationComplete={() => onSettled?.()}>
                    <RememberPlate>
                        <div className="text-lg md:text-xl"><span style={{ color: UP }}>k &gt; 0</span> ⇄ график идёт <span style={{ color: UP }}>вверх 📈</span></div>
                        <div className="text-lg md:text-xl"><span style={{ color: DOWN }}>k &lt; 0</span> ⇄ график идёт <span style={{ color: DOWN }}>вниз 📉</span></div>
                        <div className="text-base" style={{ color: MUTED }}>и в обратную сторону: видишь вверх — значит k &gt; 0</div>
                    </RememberPlate>
                </motion.div>
            )}
        </>
    )
}

// ===== Сцена 7: «k > 0 или k < 0?» =====
const K_SIGN: [number, number][] = [[2, 1], [-1, 2], [0.5, -1], [-3, 0], [1, -2]]
const KSignScene = ({ onSettled }: SceneProps) => (
    <ChoiceRounds title="Мини-игра: k больше нуля или меньше? 🎯" color={K_COL} onSettled={onSettled}
        rounds={K_SIGN.map(([k, b], i) => ({
            lines: [{ k, b, color: NEUTRAL }], question: 'Куда идёт прямая (слева направо)?',
            options: ['k > 0', 'k < 0'], correct: k > 0 ? 0 : 1,
            after: k > 0 ? ['Вверх — k > 0 📈', 'Растёт! k > 0, красава', 'В гору — k > 0 🧗'][i % 3] : ['Вниз — k < 0 📉', 'Катится вниз — k < 0', 'Под горку — k < 0 🛷'][i % 3],
            hint: 'Веди пальцем слева направо: поднимаешься или спускаешься?',
        }))} />
)

// ===== Сцена 8: k и b сразу =====
const KB: [number, number][] = [[1, 2], [-2, -1], [0.5, -3], [-1, 3]]
const KBScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [ri, setRi] = useState(0)
    const [selK, setSelK] = useState<'+' | '-' | null>(null)
    const [selB, setSelB] = useState<'+' | '-' | null>(null)
    const [state, setState] = useState<'idle' | 'wrong' | 'ok'>('idle')
    const [k, b] = KB[ri]
    const last = ri + 1 >= KB.length
    useEffect(() => {
        if (!selK || !selB || state !== 'idle') return
        const okK = (selK === '+') === (k > 0), okB = (selB === '+') === (b > 0)
        if (okK && okB) { setState('ok'); showAnswerMeme(true); return }
        setState('wrong'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
        const t = setTimeout(() => {
            if (!okK) setSelK(null)
            if (!okB) setSelB(null)
            setState('idle')
        }, 1300)
        return () => clearTimeout(t)
    }, [selK, selB]) // eslint-disable-line react-hooks/exhaustive-deps
    const next = () => { setRi((x) => x + 1); setSelK(null); setSelB(null); setState('idle') }
    const Tile = ({ label, active, onClick, color, bad }: { label: string; active: boolean; onClick: () => void; color: string; bad: boolean }) => (
        <button type="button" onClick={onClick} disabled={state === 'ok'}
            className="min-h-[56px] rounded-xl border-2 border-b-4 text-xl font-black transition-colors"
            style={active
                ? { borderColor: bad ? WRONG_COLOR : color, backgroundColor: hexToRgba(bad ? WRONG_COLOR : color, 0.2), color: bad ? WRONG_COLOR : color }
                : { borderColor: '#3A464E', backgroundColor: '#161F23', color: TEXT }}>
            {label}
        </button>
    )
    const okK = selK !== null && (selK === '+') === (k > 0)
    const okB = selB !== null && (selB === '+') === (b > 0)
    return (
        <>
            <TLine text="Комбо-уровень: и k, и b сразу 🔥" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div key={ri} className="w-full flex flex-col items-center gap-3">
                        <Counter i={ri} n={KB.length} />
                        <div className="w-full max-w-[280px] mx-auto"><Grid numbers lines={[{ k, b, color: state === 'ok' ? OK_COLOR : NEUTRAL }]} /></div>
                        <div className="text-base md:text-lg font-black text-center" style={{ color: MUTED }}>Выбери одну плитку про k и одну про b</div>
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Tile label="k > 0" color={K_COL} active={selK === '+'} bad={state === 'wrong' && selK === '+' && !okK} onClick={() => setSelK('+')} />
                            <Tile label="k < 0" color={K_COL} active={selK === '-'} bad={state === 'wrong' && selK === '-' && !okK} onClick={() => setSelK('-')} />
                            <Tile label="b > 0" color={B_COL} active={selB === '+'} bad={state === 'wrong' && selB === '+' && !okB} onClick={() => setSelB('+')} />
                            <Tile label="b < 0" color={B_COL} active={selB === '-'} bad={state === 'wrong' && selB === '-' && !okB} onClick={() => setSelB('-')} />
                        </div>
                        {state === 'wrong' && <WrongBox text={`${pickWrongTryPhrase()} ${!okK ? 'k — смотри, куда идёт прямая.' : 'b — смотри, где пробита ось Y.'}`} />}
                        {state === 'ok' && (
                            <>
                                <FieryFeedbackBanner>{['Оба в точку! 🎯', 'Двойное попадание 🔥', 'Комбо засчитано!', 'Ты читаешь графики как мемы 😎'][ri]}</FieryFeedbackBanner>
                                <LocalAnswerConfetti />
                                {last ? <SettleOnMount onSettled={onSettled} /> : <ReplyButton onClick={next}>Следующий →</ReplyButton>}
                            </>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// ===== Сцена 9: крутизна — «горка» =====
const STEEP = [0.5, 1, 3]
const SteepScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [picked, setPicked] = useState<number | null>(null)
    const [wrong, setWrong] = useState<number[]>([])
    const tap = (id: number) => {
        if (picked !== null) return
        if (id === 2) { setPicked(id); showAnswerMeme(true); go(3) }
        else if (!wrong.includes(id)) { setWrong((w) => [...w, id]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    return (
        <>
            <TLine text="Наклон бывает разный. Представь горку 🛝" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full max-w-[300px] mx-auto">
                        <Grid onLineTap={phase >= 2 ? tap : undefined} lines={STEEP.map((k, i) => ({
                            k, b: 0, tapId: i, label: `k = ${fmtNum(k)}`, width: picked === i ? 7 : 5,
                            color: picked === i ? OK_COLOR : wrong.includes(i) ? WRONG_COLOR : hexToRgba(UP, 0.45 + i * 0.27),
                        }))} />
                    </div>
                </DiagramBlock>
            )}
            {phase === 2 && <TLine small text="Нажми на самую КРУТУЮ горку 👆" />}
            {phase >= 2 && wrong.length > 0 && picked === null && <WrongBox text={`${pickWrongTryPhrase()} На самой крутой горке страшнее всего кататься 😱`} />}
            {phase >= 3 && <FieryFeedbackBanner>k = 3 — это уже не горка, а стена для скалолазов 🧗</FieryFeedbackBanner>}
            {phase >= 3 && <TLine small text="Чем больше k — тем круче. Чем меньше — тем положе." onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 10: наклон по клеточкам, k = 5/1 =====
const RiseRunScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="Как узнать наклон точно? Считаем клеточки!" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full max-w-[300px] mx-auto">
                        <Grid lines={[{ k: 5, b: 2, color: UP }]} steps={{ k: 5, b: 2, x0: -1, run: 1, color: UP, show: phase >= 5 ? 2 : phase >= 3 ? 1 : 0 }} />
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Встаём на прямую и шагаем вправо на 1 клетку →" onDone={() => go(3)} />}
            {phase >= 3 && <TLine small text="…и поднимаемся до прямой: вверх на 5 клеток ↑" onDone={() => go(5)} readMs={1200} />}
            {phase >= 5 && (
                <div className="w-full flex items-center justify-center gap-3">
                    <span className="text-4xl font-black" style={{ color: K_COL }}>k</span>
                    <span className="text-4xl font-black" style={{ color: MUTED }}>=</span>
                    <motion.span initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 13, delay: 0.8 }}
                        onAnimationComplete={() => go(6)}>
                        <Frac n={<span style={{ color: UP }}>5</span>} d="1" />
                    </motion.span>
                    {phase >= 6 && (
                        <motion.span className="text-4xl font-black text-[#F2F7FB]" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 12 }}>= <span style={{ color: UP }}>5</span></motion.span>
                    )}
                </div>
            )}
            {phase >= 6 && (
                <motion.div className="w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} onAnimationComplete={() => onSettled?.()}>
                    <RememberPlate>
                        <div className="flex items-center gap-3 text-lg md:text-xl">
                            <span>Наклон</span> <span style={{ color: K_COL }}>k</span> <span>=</span>
                            <Frac n="сколько вверх" d="сколько вправо" size="text-base md:text-lg" />
                        </div>
                    </RememberPlate>
                </motion.div>
            )}
        </>
    )
}

// ===== Сцена 11: «какой здесь наклон?» вверх 3 за 2 =====
const RiseRunQuizScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [wrong, setWrong] = useState<number[]>([])
    const [done, setDone] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const OPTS: [React.ReactNode, boolean][] = [
        [<Frac key="a" n="2" d="3" size="text-2xl" />, false],
        [<Frac key="b" n="3" d="2" size="text-2xl" />, true],
        ['3', false],
        ['5', false],
    ]
    const pick = (i: number) => {
        if (done || wrong.includes(i)) return
        if (OPTS[i][1]) { setDone(true); showAnswerMeme(true); go(3) }
        else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrong((w) => [...w, i])
            setMsg(`${pickWrongTryPhrase()} Наверху — сколько вверх, внизу — сколько вправо.`)
        }
    }
    return (
        <>
            <TLine text="Твоя очередь! Какой здесь наклон k?" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full max-w-[300px] mx-auto">
                        <Grid lines={[{ k: 1.5, b: -2, color: UP }]} steps={{ k: 1.5, b: -2, x0: 0, run: 2, color: UP, show: 2 }} />
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <div className="drop-in-options grid grid-cols-4 gap-2 w-full">
                    {OPTS.map(([o], i) => {
                        const isWrong = wrong.includes(i), isRight = done && OPTS[i][1]
                        return (
                            <button key={i} type="button" onClick={() => pick(i)} disabled={done || isWrong}
                                className={cn('min-h-[76px] rounded-xl border-2 border-b-4 text-2xl font-black flex items-center justify-center',
                                    isRight ? 'border-[#A1D151] bg-[#A1D15122]' : isWrong ? 'border-[#DC605B] bg-[#DC605B22] opacity-60' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB]')}>
                                {o}
                            </button>
                        )
                    })}
                </div>
            )}
            {phase >= 2 && !done && msg && <WrongBox text={msg} />}
            {phase >= 3 && <FieryFeedbackBanner>Вверх 3, вправо 2 → k = 3/2. Ты клеточный гений 🧠</FieryFeedbackBanner>}
            {phase >= 3 && <LocalAnswerConfetti />}
            {phase >= 3 && <SettleOnMount onSettled={onSettled} />}
        </>
    )
}

// ===== Сцена 12: наклон вниз, k = −4 =====
const NegScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    return (
        <>
            <TLine text="А теперь горка вниз 🛷" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => go(2)}>
                    <div className="w-full max-w-[300px] mx-auto">
                        <Grid lines={[{ k: -4, b: 3, color: DOWN }]} steps={{ k: -4, b: 3, x0: 0, run: 1, color: DOWN, show: phase >= 3 ? 2 : phase >= 2 ? 1 : 0 }} />
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TLine small text="Вправо на 1 → а потом ВНИЗ на 4 клетки ↓" onDone={() => go(3)} readMs={1100} />}
            {phase >= 3 && (
                <div className="w-full flex items-center justify-center gap-2">
                    <span className="text-4xl font-black" style={{ color: K_COL }}>k</span>
                    <span className="text-4xl font-black" style={{ color: MUTED }}>=</span>
                    <motion.span className="text-6xl font-black" style={{ color: DOWN, textShadow: `0 0 18px ${DOWN}` }}
                        initial={{ scale: 6, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 9, delay: 1.4 }} onAnimationComplete={() => go(4)}>{MINUS}</motion.span>
                    <motion.span initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 13, delay: 0.5 }}>
                        <Frac n={<span style={{ color: DOWN }}>4</span>} d="1" />
                    </motion.span>
                    {phase >= 4 && <motion.span className="text-4xl font-black text-[#F2F7FB]" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>= <span style={{ color: DOWN }}>{MINUS}4</span></motion.span>}
                </div>
            )}
            {phase >= 4 && <TLine small text="Пошли ВНИЗ — значит МИНУС. Не теряй его: минус обидчивый 😤" onDone={() => onSettled?.()} />}
        </>
    )
}

// ===== Сцена 13: придумай отрицательный наклон =====
const DIGITS = [1, 2, 3, 4, 5, 6]
const BuildNegScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [sign, setSign] = useState<'+' | '-' | null>(null)
    const [badPlus, setBadPlus] = useState(false)
    const [n, setN] = useState<number | null>(null)
    const [d, setD] = useState<number | null>(null)
    const done = sign === '-' && n !== null && d !== null
    useEffect(() => { if (done) { showAnswerMeme(true); go(3) } }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
    const pickSign = (s: '+' | '-') => {
        if (sign === '-') return
        if (s === '+') { setBadPlus(true); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); return }
        setSign('-'); setBadPlus(false); go(2)
    }
    const digit = (v: number) => { if (done) return; if (n === null) setN(v); else setD(v) }
    const Slot = ({ v, active }: { v: number | null; active: boolean }) => (
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 text-3xl font-black"
            style={{ borderColor: active ? DOWN : '#3A464E', borderStyle: v === null ? 'dashed' : 'solid', color: v === null ? hexToRgba(DOWN, 0.8) : TEXT, backgroundColor: '#161F23' }}>
            {v === null ? '?' : <motion.span key={v} initial={{ scale: 0.3, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>{v}</motion.span>}
        </span>
    )
    return (
        <>
            <TLine text="Придумай свой ОТРИЦАТЕЛЬНЫЙ наклон 😈" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-black" style={{ color: K_COL }}>k</span>
                            <span className="text-4xl font-black" style={{ color: MUTED }}>=</span>
                            {sign === '-' && <motion.span className="text-5xl font-black" style={{ color: DOWN }} initial={{ scale: 4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 10 }}>{MINUS}</motion.span>}
                            {sign === '-' && (
                                <span className="inline-flex flex-col items-center gap-1">
                                    <Slot v={n} active={n === null} />
                                    <span className="w-14 h-[3px] rounded-full bg-[#F2F7FB]" />
                                    <Slot v={d} active={n !== null && d === null} />
                                </span>
                            )}
                            {sign === null && <span className="text-4xl font-black" style={{ color: MUTED }}>?</span>}
                        </div>
                        {sign !== '-' && (
                            <>
                                <div className="text-base md:text-lg font-black text-center" style={{ color: MUTED }}>Сначала знак:</div>
                                <div className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                    <button type="button" onClick={() => pickSign('+')} className="min-h-[60px] rounded-xl border-2 border-b-4 text-4xl font-black"
                                        style={badPlus ? { borderColor: WRONG_COLOR, color: WRONG_COLOR, backgroundColor: hexToRgba(WRONG_COLOR, 0.13) } : { borderColor: '#3A464E', color: UP, backgroundColor: '#161F23' }}>+</button>
                                    <button type="button" onClick={() => pickSign('-')} className="min-h-[60px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-4xl font-black" style={{ color: DOWN }}>{MINUS}</button>
                                </div>
                                {badPlus && <WrongBox text="Плюс — это горка ВВЕРХ. А нам нужно вниз 📉" />}
                            </>
                        )}
                        {sign === '-' && !done && (
                            <>
                                <div className="text-base md:text-lg font-black text-center" style={{ color: MUTED }}>{n === null ? 'Сколько клеток ВНИЗ? (наверх дроби)' : 'Сколько клеток ВПРАВО? (вниз дроби)'}</div>
                                <div className="drop-in-options grid grid-cols-6 gap-2 w-full">
                                    {DIGITS.map((v) => (
                                        <button key={v} type="button" onClick={() => digit(v)}
                                            className="min-h-[52px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-2xl font-black text-[#F2F7FB]">{v}</button>
                                    ))}
                                </div>
                            </>
                        )}
                        {done && (
                            <div className="w-full max-w-[280px] mx-auto">
                                <Grid lines={[{ k: -(n! / d!), b: 0, color: DOWN }]} steps={{ k: -(n! / d!), b: 0, x0: -d! / 2, run: d!, color: DOWN, show: 2 }} />
                            </div>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && <FieryFeedbackBanner>Твоя горка вниз готова! Вправо {d}, вниз {n} 🛷</FieryFeedbackBanner>}
            {phase >= 3 && <LocalAnswerConfetti />}
            {phase >= 3 && <SettleOnMount onSettled={onSettled} />}
        </>
    )
}

// ===== Сцена 14: собери уравнение =====
type EqRound = { k: number; b: number; x0: number; run: number; tiles: number[] }
const EQ_ROUNDS: EqRound[] = [
    { k: 2, b: 1, x0: 0, run: 1, tiles: [2, -2, 1, -1, 3, 0.5] },
    { k: -1, b: 3, x0: 0, run: 1, tiles: [1, -1, 3, -3, 2, 0.5] },
    { k: 0.5, b: -2, x0: 0, run: 2, tiles: [0.5, 2, -2, -0.5, 1, 3] },
]
const EqScene = ({ onSettled }: SceneProps) => {
    const { phase, go } = usePhase()
    const [ri, setRi] = useState(0)
    const [k, setK] = useState<number | null>(null)
    const [b, setB] = useState<number | null>(null)
    const [state, setState] = useState<'idle' | 'wrong' | 'ok'>('idle')
    const r = EQ_ROUNDS[ri]
    const last = ri + 1 >= EQ_ROUNDS.length
    useEffect(() => {
        if (k === null || b === null || state !== 'idle') return
        if (k === r.k && b === r.b) { setState('ok'); showAnswerMeme(true); return }
        setState('wrong'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
        const okK = k === r.k
        const t = setTimeout(() => { if (!okK) setK(null); setB(null); setState('idle') }, 1400)
        return () => clearTimeout(t)
    }, [k, b]) // eslint-disable-line react-hooks/exhaustive-deps
    const tile = (v: number) => { if (state !== 'idle') return; if (k === null) setK(v); else if (b === null) setB(v) }
    const next = () => { setRi((x) => x + 1); setK(null); setB(null); setState('idle') }
    const Slot = ({ v, color, active }: { v: number | null; color: string; active: boolean }) => (
        <span className="inline-flex items-center justify-center min-w-[52px] h-12 px-1 rounded-xl border-2 text-2xl font-black"
            style={{ borderColor: state === 'wrong' ? WRONG_COLOR : active || v !== null ? color : '#3A464E', borderStyle: v === null ? 'dashed' : 'solid',
                color: v === null ? hexToRgba(color, 0.8) : color, backgroundColor: '#161F23' }}>
            {v === null ? '?' : <motion.span key={v} initial={{ scale: 0.3, y: -20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>{fmtNum(v)}</motion.span>}
        </span>
    )
    return (
        <>
            <TLine text="Финальный босс: составь уравнение прямой 👹" onDone={() => go(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div key={ri} className="w-full flex flex-col items-center gap-3">
                        <Counter i={ri} n={EQ_ROUNDS.length} />
                        <div className="w-full max-w-[280px] mx-auto">
                            <Grid numbers lines={[{ k: r.k, b: r.b, color: state === 'ok' ? OK_COLOR : r.k > 0 ? UP : DOWN }]}
                                bDot={state === 'ok' ? { b: r.b } : undefined}
                                steps={state === 'ok' ? { k: r.k, b: r.b, x0: r.x0, run: r.run, color: r.k > 0 ? UP : DOWN, show: 2 } : undefined} />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-3xl font-black text-[#F2F7FB]">
                            <span>y</span><span style={{ color: MUTED }}>=</span>
                            <Slot v={k} color={K_COL} active={k === null} /><span>x</span>
                            <span style={{ color: MUTED }}>+</span>
                            <Slot v={b} color={B_COL} active={k !== null && b === null} />
                        </div>
                        {state !== 'ok' && (
                            <>
                                <div className="text-sm md:text-base font-black text-center" style={{ color: MUTED }}>{k === null ? 'Сначала k (наклон)' : 'Теперь b (где пробита ось Y)'}</div>
                                <div className="drop-in-options grid grid-cols-6 gap-2 w-full">
                                    {r.tiles.map((v) => (
                                        <button key={v} type="button" onClick={() => tile(v)}
                                            className="min-h-[52px] rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-xl font-black text-[#F2F7FB]">{fmtNum(v)}</button>
                                    ))}
                                </div>
                            </>
                        )}
                        {state === 'wrong' && <WrongBox text={`${pickWrongTryPhrase()} ${k !== r.k ? 'k: вверх/вниз и клеточки «вверх / вправо».' : 'b: где прямая пробила ось Y?'}`} />}
                        {state === 'ok' && (
                            <>
                                <FieryFeedbackBanner>{eqText(r.k, r.b)} — {['паспорт выдан 🪪', 'уравнение в кармане 😎', 'босс повержен 👹💥'][ri]}</FieryFeedbackBanner>
                                <LocalAnswerConfetti />
                                {last ? <SettleOnMount onSettled={onSettled} /> : <ReplyButton onClick={next}>Следующий →</ReplyButton>}
                            </>
                        )}
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

const SCENES = [UpDownScene, SignScene, FormulaScene, BScene, BSignScene, BMoveScene, KScene, KSignScene, KBScene, SteepScene, RiseRunScene, RiseRunQuizScene, NegScene, BuildNegScene, EqScene]
const SCENE_MAP_LABELS = ['Вверх и вниз', 'Знак наклона', 'Формула', 'Что такое b', 'Игра: знак b', 'Подвинь прямую', 'Что такое k', 'Игра: знак k', 'k и b сразу', 'Горка', 'Клеточки: k = 5', 'Какой наклон?', 'Вниз: k = −4', 'Свой наклон', 'Собери уравнение']
const NEXT_LABELS = ['Вверх и вниз — понял', 'Плюс и минус!', 'Где тут b?', 'b — это бум об ось Y', 'Знак b — изи', 'Я рулю прямыми', 'k решает', 'Знак k — изи', 'Комбо!', 'Чем круче — тем больше k', 'Вверх делить на вправо!', 'Клеточки — топ', 'Минус не потеряю', 'Моя горка 🛷', 'Я составлю любое']

// ===== Проверим себя =====
type Trial = { k: number; b: number; options: [number, number][]; hint: string }
const TRIALS: Trial[] = [
    { k: 3, b: -1, options: [[3, -1], [-3, -1], [3, 1], [-1, 3]], hint: 'Идёт вверх — k > 0. Ось Y пробита ниже нуля.' },
    { k: -2, b: 2, options: [[2, 2], [-2, 2], [-2, -2], [2, -2]], hint: 'Идёт вниз — значит минус у k.' },
    { k: 1, b: 4, options: [[4, 1], [-1, 4], [1, 4], [1, -4]], hint: 'b — где прямая пробила ось Y.' },
    { k: -0.5, b: 1, options: [[-0.5, 1], [0.5, 1], [-2, 1], [-0.5, -1]], hint: 'Вниз на 1 за 2 клетки вправо — k = −½.' },
    { k: 2, b: 0, options: [[0, 2], [2, 0], [-2, 0], [2, 2]], hint: 'Прямая проходит через центр — b = 0.' },
]

export const TypeLineWalk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [typed, setTyped] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
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

    const trial = TRIALS[trialIndex]
    const correctIdx = trial.options.findIndex(([k, b]) => k === trial.k && b === trial.b)
    const answer = (i: number) => {
        if (checked || wrongTried.includes(i)) return
        if (i === correctIdx) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongFlash(null); setChecked(true); setTrialNextLabel(pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, i])
            setWrongFlash(`${pickWrongTryPhrase()} ${trial.hint}`)
        }
    }
    const nextTrial = () => {
        if (advancing) return
        if (trialIndex + 1 >= TRIALS.length) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            setTrialIndex((i) => i + 1); setChecked(false); setTyped(false); setWrongTried([]); setWrongFlash(null)
        }, 300)
    }

    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setTyped(false); setWrongTried([]); setWrongFlash(null)
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
        ...SCENE_MAP_LABELS.map((label, i) => ({ dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR })),
        ...TRIALS.map((_, i) => ({ dotKey: `t${i}`, label: `Задание ${i + 1}/${TRIALS.length}`, jumpKey: `trial-${i}`, isActive: phase === 'practice' && trialIndex === i, color: MAP_PRACTICE_COLOR })),
    ]

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
                            <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                        </div>
                        <div className="relative w-full flex items-center justify-center min-h-9">
                            <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                style={{ borderColor: hexToRgba(K_COL, 0.55), backgroundColor: hexToRgba(K_COL, 0.16), color: K_COL }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <p className="text-base md:text-lg font-bold text-[#F2F7FB] text-center px-16">
                                <Typewriter key={`q-${trialIndex}`} text="Какое уравнение у этой прямой?" onDone={() => setTyped(true)} />
                            </p>
                        </div>
                        <div className="w-full max-w-[280px] mx-auto">
                            <Grid numbers lines={[{ k: trial.k, b: trial.b, color: checked ? OK_COLOR : NEUTRAL }]} />
                        </div>
                        {!checked && typed && (
                            <div key={`opts-${trialIndex}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                {trial.options.map(([k, b], i) => {
                                    const isWrong = wrongTried.includes(i)
                                    return (
                                        <button key={i} type="button" disabled={isWrong} onClick={() => answer(i)}
                                            className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-xl md:text-2xl font-black transition-colors',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B] opacity-60' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                            {eqText(k, b)}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {!checked && wrongFlash && <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.13), color: WRONG_COLOR }}>{wrongFlash}</div>}
                        {checked && (
                            <motion.div className="w-full text-center text-3xl md:text-4xl font-black" style={{ color: OK_COLOR }}
                                initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}>
                                {eqText(trial.k, trial.b)}
                            </motion.div>
                        )}
                        {checked && <FieryFeedbackBanner>{CORRECT_FEEDBACK_PHRASES[(trialIndex + 5) % CORRECT_FEEDBACK_PHRASES.length]}</FieryFeedbackBanner>}
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
                        {trialIndex + 1 >= TRIALS.length ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
