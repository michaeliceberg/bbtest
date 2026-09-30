// app/t-lesson/[t_lessonId]/type-lenzwalk.tsx
//
// Тип LENZWALK — интерактивный разбор «индукционный ток и правило Ленца»
// (тема «Электродинамика», сразу после FARADAYWALK/DIRWALK). Стиль — как у
// FARADAYWALK/DIRWALK: массив сцен CONCEPT_SCENES, накопительный лог,
// мини-игры руками.
//
// Сцены: HookScene («поток Φ не должен меняться… а если нарушить?») →
// TrainCylinderScene — тянем цилиндр потока Φ, а к нему рычагом (штоком)
// приделан вагон 🚃 на рельсах; чем ТЯЖЕЛЕЕ вагон, тем заметнее он
// отстаёт от мишени (там, где сейчас палец) — прямая механическая
// аналогия «индуктивность L = масса вагона»: лёгкий вагон почти не
// отстаёт (слабое B инд), тяжёлый — заметно тормозит рывок (сильное
// B инд). Дальше WhoScene (кто делает B инд — само кольцо через правило
// правой руки) → SpeedMagnetScene (скорость магнита → сила тока).
//
// Физика (проверено): кольцо горизонтальное, магнит сверху. N внизу → поле
// магнита в кольце ВНИЗ. Приближаем → Φ растёт → своё поле кольца ВВЕРХ
// (против). Удаляем → своё поле ВНИЗ (как у магнита). S внизу — наоборот.
// Своё поле вверх ⇔ ток против часовой, если смотреть сверху ⇔ на экране
// (эллипс в перспективе) передняя часть кольца течёт ВПРАВО — та же
// конвенция, что в DIRWALK (ток вверх → спереди вправо).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import type { QuestionType } from './page'
import {
    DiagramBlock, TypedLine,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { InsightCard, InsightWord } from '@/components/geometry/WalkthroughCards'
import { FluxCylinder, FieldArrow } from '@/components/geometry/FluxCylinder'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

// lottie-react трогает document на импорте — только ssr:false (см. CLAUDE.md).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Цвета ролей: поле магнита B — синий (как в FARADAYWALK/DIRWALK), ток —
// малиновый (как в DIRWALK), СВОЁ поле кольца — зелёный, кольцо — бирюзовое
// (как в FARADAYWALK), полюса N красный / S синий.
const FIELD_COLOR = GGEGE_PALETTE.blue.button
const CURRENT_COLOR = GGEGE_PALETTE.raspberry.button
// Своё поле кольца — в цвет индукционного тока I (по просьбе пользователя:
// поле рождается током, одинаковый цвет даёт смысловую связь).
const OWN_COLOR = CURRENT_COLOR
const RING_COLOR = GGEGE_PALETTE.teal.button
const RULE_COLOR = GGEGE_PALETTE.orange.button
const NORTH_COLOR = '#DC605B'
const SOUTH_COLOR = '#53ADEF'
const REMEMBER_COLOR = '#F2C35B'
const CONCEPT_PAUSE_MS = 1000
const TEXT_CLS = 'w-full text-center text-base md:text-lg text-[#F2F7FB]'

// ===== Общие мелочи (своя копия в каждом *WALK — конвенция проекта) =====

const Sticker = ({ value, color }: { value: React.ReactNode; color: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 px-1.5 py-0.5 font-extrabold align-middle leading-none"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

type LinePart = { text: string } | { sticker: string; color: string } | { break: true } | { bold: string }
const TypedLineWithParts = ({ parts, onSettled }: { parts: LinePart[]; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plainText = parts.map((p) => ('text' in p ? p.text : 'sticker' in p ? p.sticker : 'bold' in p ? p.bold : ' ')).join('')
    return (
        <div className={TEXT_CLS}>
            {!typed ? (
                <Typewriter text={plainText} onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }} />
            ) : (
                <>
                    {parts.map((p, i) => ('text' in p
                        ? <span key={i}>{p.text}</span>
                        : 'sticker' in p
                            ? <Sticker key={i} value={p.sticker} color={p.color} />
                            : 'bold' in p
                                ? <strong key={i} className="font-extrabold">{p.bold}</strong>
                                : <br key={i} />
                    ))}
                </>
            )}
        </div>
    )
}

const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}>
            ЗАПОМНИ!
        </div>
    </div>
)

// ===== Модель движения магнита =====
// pos 0 (далеко) … 1 (близко). move: +1 приближается, −1 удаляется, 0 стоит.
// Движение на setInterval (не rAF) — не замирает в фоне (тот же приём,
// что в FARADAYWALK).
type Move = 1 | -1 | 0
type Pole = 'N' | 'S'
const STEP = 0.018
const TICK_MS = 30
const MIN_MOVE_MS = 450

function useMagnet(initial: number) {
    const [pos, setPos] = useState(initial)
    const [move, setMove] = useState<Move>(0)
    const [speed, setSpeed] = useState(1)
    const posRef = useRef(initial)
    const timer = useRef<ReturnType<typeof setInterval> | null>(null)
    const startedAt = useRef(0)
    const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const stop = () => {
        if (timer.current) clearInterval(timer.current)
        timer.current = null
        setMove(0)
    }
    // speed: множитель скорости (1 — обычная). От неё зависит сила тока.
    const start = (dir: 1 | -1, spd = 1) => {
        setSpeed(spd)
        if (releaseTimer.current) clearTimeout(releaseTimer.current)
        if (timer.current) clearInterval(timer.current)
        startedAt.current = Date.now()
        setMove(dir)
        timer.current = setInterval(() => {
            const next = Math.max(0, Math.min(1, posRef.current + dir * STEP * spd))
            posRef.current = next
            setPos(next)
            if (next === 0 || next === 1) stop()
        }, TICK_MS)
    }
    // Короткий тап тоже должен что-то показать — держим движение ≥ MIN_MOVE_MS.
    const release = () => {
        const left = MIN_MOVE_MS - (Date.now() - startedAt.current)
        if (left > 0) releaseTimer.current = setTimeout(stop, left)
        else stop()
    }
    const jump = (p: number) => { posRef.current = p; setPos(p) }
    useEffect(() => () => {
        if (timer.current) clearInterval(timer.current)
        if (releaseTimer.current) clearTimeout(releaseTimer.current)
    }, [])
    return { pos, move, speed, start, release, stop, jump }
}

// Направление поля магнита В КОЛЬЦЕ: N внизу → вниз (−1), S внизу → вверх (+1).
const extDirOf = (pole: Pole) => (pole === 'N' ? -1 : 1)
// Своё поле кольца: против роста потока, по его убыванию.
const ownDirOf = (pole: Pole, move: Move) => (move === 0 ? 0 : -extDirOf(pole) * move)

// Правая рука — картинка public/hands/right-{up,down}.webp (не эмодзи 👍:
// он на многих устройствах левая рука). Согнутые пальцы —
// дуга с наконечником по передней половине эллипса. dirRight: передняя часть
// дуги идёт вправо (θ 160°→20°) или влево (20°→160°).
function curlArc(cx: number, cy: number, rx: number, ry: number, dirRight: boolean) {
    const from = dirRight ? 160 : 20, to = dirRight ? 20 : 160
    const pts: string[] = []
    for (let i = 0; i <= 24; i++) {
        const t = ((from + (to - from) * (i / 24)) * Math.PI) / 180
        pts.push(`${(cx + rx * Math.cos(t)).toFixed(1)},${(cy + ry * Math.sin(t)).toFixed(1)}`)
    }
    const te = (to * Math.PI) / 180
    const s = dirRight ? -1 : 1 // d(theta) знак
    const dx = -rx * Math.sin(te) * s, dy = ry * Math.cos(te) * s
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    return { d: `M ${pts.join(' L ')}`, end: { x: cx + rx * Math.cos(te), y: cy + ry * Math.sin(te) }, ang }
}
const HAND_COLOR = '#F09B38'
const RightHandHint = ({ cx, cy, rx, ry, thumbUp, curlRight }: {
    cx: number; cy: number; rx: number; ry: number; thumbUp: boolean; curlRight: boolean
}) => {
    const arc = curlArc(cx, cy, rx, ry, curlRight)
    // Картинка правой руки (public/hands, нарисована пользователем): большой палец
    // вверх/вниз, согнутые пальцы спереди идут вправо (палец вверх) / влево (вниз).
    const HAND = 78
    return (
        <g>
            <g transform={`translate(${cx - rx - 40},${cy - HAND - 34})`}>
                <motion.image key={thumbUp ? 'up' : 'down'} href={thumbUp ? '/hands/right-up.webp' : '/hands/right-down.webp'}
                    x={0} y={0} width={HAND} height={HAND}
                    initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
            </g>
            <path d={arc.d} fill="none" stroke={HAND_COLOR} strokeWidth={6} strokeLinecap="round" strokeDasharray="1 0" />
            <g transform={`translate(${arc.end.x},${arc.end.y}) rotate(${arc.ang})`}>
                <path d="M -12 -10 L 2 0 L -12 10" fill="none" stroke={HAND_COLOR} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x={cx} y={cy + ry + 22} textAnchor="middle" fontSize={12} fontWeight={900} fill={HAND_COLOR}>пальцы</text>
        </g>
    )
}

// ===== Диаграмма: магнит над кольцом =====
const V_W = 320, V_H = 478, CX = 160
const RING_CY = 300, RING_RX = 92, RING_RY = 24
const MAG_W = 48, MAG_H = 104
const magTopOf = (pos: number) => 20 + pos * 128

const OWN_XS = [-44, 0, 44]

const ringBackPath = `M ${CX - RING_RX} ${RING_CY} A ${RING_RX} ${RING_RY} 0 0 1 ${CX + RING_RX} ${RING_CY}`
const ringFrontPath = `M ${CX - RING_RX} ${RING_CY} A ${RING_RX} ${RING_RY} 0 0 0 ${CX + RING_RX} ${RING_CY}`

const VArrow = ({ x, dir, color, len = 70, width = 3.2 }: { x: number; dir: number; color: string; len?: number; width?: number }) => {
    const y1 = RING_CY - len / 2, y2 = RING_CY + len / 2
    const tip = dir < 0 ? y2 : y1
    const s = dir < 0 ? -1 : 1
    return (
        <g>
            <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
            <path d={`M ${x - 7} ${tip + 9 * s} L ${x} ${tip} L ${x + 7} ${tip + 9 * s}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
        </g>
    )
}

// Бледные силовые линии вокруг магнита (как на схеме полосового магнита):
// каждая петля выходит из нижнего полюса, огибает магнит сбоку и входит в верхний.
const MagnetFieldLoops = ({ magTop, pole }: { magTop: number; pole: Pole }) => {
    const yb = magTop + MAG_H - 4, yt = magTop + 4
    const loops = [34, 62, 92]
    return (
        <g opacity={0.35}>
            {loops.flatMap((w, i) => [1, -1].map((side) => (
                <motion.path key={`${w}${side}`}
                    d={`M ${CX} ${yb} C ${CX + side * w * 1.35} ${yb + 40 + i * 30}, ${CX + side * w * 1.35} ${yt - 40 - i * 30}, ${CX} ${yt}`}
                    fill="none" stroke={FIELD_COLOR} strokeWidth={2.2}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: i * 0.15 }} />
            )))}
            <text x={CX + 62 * 1.35 + 18} y={magTop + MAG_H / 2 + 5} fontSize={14} fontWeight={900} fill={FIELD_COLOR}>B</text>
        </g>
    )
}

type LenzViewProps = {
    pos: number
    move: Move
    pole?: Pole
    showCurrent?: boolean   // ток в кольце + амперметр
    showOwn?: boolean       // своё поле кольца (зелёные щиты)
    battle?: boolean        // мечи в центре при столкновении
    hideAnswer?: boolean    // игра: прячем ток/своё поле до ответа
    face?: boolean          // эмоция кольца
    speed?: number          // скорость магнита → сила тока (стрелка, бег тока)
    showForce?: boolean     // кольцо отталкивает/тянет магнит (следствие Ленца)
    wobble?: boolean        // дрожание магнита при showForce (в стоп-кадре выключаем)
    handHint?: boolean      // схема правой руки: палец по своему B, пальцы по току
    showExt?: boolean       // стрелки поля магнита сквозь кольцо (поток)
    fieldLines?: boolean    // бледные силовые линии вокруг магнита
    devil?: boolean         // рожица на магните (в спокойных вступительных сценах выключаем)
    moveArrow?: boolean     // стрелка ⬆/⬇ у магнита (направление движения)
}

const faceOf = (move: Move, pole: Pole, battle: boolean) => {
    if (move === 0) return '😌'
    const own = ownDirOf(pole, move)
    const growing = own === -extDirOf(pole)
    if (growing) return battle ? '😤' : '😱'
    return '😭'
}

const LenzView = ({ pos, move, pole = 'N', showCurrent = true, showOwn = false, battle = false, hideAnswer = false, face = true, speed = 1, showForce = false, wobble = true, handHint = false, showExt = true, fieldLines = false, devil = true, moveArrow = true }: LenzViewProps) => {
    const magTop = magTopOf(pos)
    const ext = extDirOf(pole)
    const own = ownDirOf(pole, move)
    const moving = move !== 0
    const currentOn = showCurrent && moving && !hideAnswer
    const bottomColor = pole === 'N' ? NORTH_COLOR : SOUTH_COLOR
    const topColor = pole === 'N' ? SOUTH_COLOR : NORTH_COLOR
    // поле B сквозь кольцо — одна стрелка, длина ∝ близости магнита, середина — в центре кольца
    const extLen = 34 + pos * 58
    // ток: своё поле вверх → спереди вправо (см. шапку файла)
    const flowRight = own > 0
    // ЭДС ∝ ΔΦ/Δt: чем быстрее едет магнит, тем сильнее отклоняется стрелка.
    const amp = Math.min(82, 40 * speed)
    const needle = currentOn ? (flowRight ? amp : -amp) : 0

    return (
        <div className="relative flex w-full justify-center py-1">
            <svg viewBox={`0 0 ${V_W} ${V_H}`} className="w-full max-w-[320px] h-auto">
                {/* задняя половина кольца */}
                <path d={ringBackPath} fill="none" stroke={currentOn ? CURRENT_COLOR : RING_COLOR} strokeWidth={7} strokeLinecap="round" />
                {/* бледные силовые линии магнита: выходят из N, огибают магнит и входят в S */}
                {fieldLines && <MagnetFieldLoops magTop={magTop} pole={pole} />}
                {/* поле магнита сквозь кольцо */}
                {showExt && (
                    <FieldArrow x1={CX} y1={ext < 0 ? RING_CY - extLen / 2 : RING_CY + extLen / 2} x2={CX} y2={ext < 0 ? RING_CY + extLen / 2 : RING_CY - extLen / 2}
                        color={FIELD_COLOR} width={7} />
                )}
                {/* своё поле кольца — зелёные щиты */}
                {showOwn && moving && !hideAnswer && OWN_XS.map((dx, i) => (
                    <g key={`o${dx}`}>
                        <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5, delay: i * 0.08 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                            <VArrow x={CX + dx + 12} dir={own} color={OWN_COLOR} len={92} width={4.5} />
                            <text x={CX + dx + 12} y={own > 0 ? RING_CY + 62 : RING_CY - 52} textAnchor="middle" fontSize={18}>🛡️</text>
                        </motion.g>
                    </g>
                ))}
                {/* передняя половина кольца */}
                <path d={ringFrontPath} fill="none" stroke={currentOn ? CURRENT_COLOR : RING_COLOR} strokeWidth={7} strokeLinecap="round" />
                {currentOn && (
                    <>
                        <motion.path key={`flow${own}`} d={ringFrontPath} fill="none" stroke="#fff" strokeWidth={3}
                            strokeDasharray="6 18" strokeLinecap="round"
                            animate={{ strokeDashoffset: flowRight ? [0, -48] : [0, 48] }}
                            transition={{ duration: 0.6 / speed, repeat: Infinity, ease: 'linear' }} />
                        <g transform={`translate(${CX + RING_RX + 18},${RING_CY + RING_RY + 14})`}>
                            <PulseSticker text="I" color={CURRENT_COLOR} />
                        </g>
                    </>
                )}
                {handHint && moving && !hideAnswer && (
                    <RightHandHint cx={CX} cy={RING_CY} rx={RING_RX + 18} ry={RING_RY + 12} thumbUp={own > 0} curlRight={own > 0} />
                )}
                {battle && moving && showOwn && !hideAnswer && (
                    <g transform={`translate(${CX - 12},${RING_CY - 4})`}>
                        <motion.g animate={{ rotate: [-12, 12, -12], scale: [1, 1.18, 1] }} transition={{ duration: 0.35, repeat: Infinity }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                            <image href="/magnet-items/sword.webp" x={-26} y={-26} width={52} height={52} />
                        </motion.g>
                        <text x={0} y={-34} textAnchor="middle" fontSize={22}>💥</text>
                    </g>
                )}
                {/* магнит */}
                <g transform={`translate(${CX - MAG_W / 2},${magTop})`}>
                  {/* Отдача: кольцо толкает магнит назад (приближаем) или тянет (уводим) — магнит «дрожит» навстречу силе. */}
                  <motion.g key={`recoil${showForce && wobble && moving ? move : 0}`}
                    animate={showForce && wobble && moving ? { y: move > 0 ? [0, -6, 0] : [0, 6, 0] } : { y: 0 }}
                    transition={showForce && wobble && moving ? { duration: 0.22, repeat: Infinity } : { duration: 0.2 }}>
                    <rect x={0} y={0} width={MAG_W} height={MAG_H / 2} rx={6} fill={topColor} />
                    <rect x={0} y={MAG_H / 2} width={MAG_W} height={MAG_H / 2} rx={6} fill={bottomColor} />
                    <rect x={0} y={MAG_H / 2 - 6} width={MAG_W} height={12} fill={bottomColor} />
                    <text x={MAG_W / 2} y={MAG_H / 4 + 7} textAnchor="middle" fontSize={20} fontWeight={900} fill="#fff">{pole === 'N' ? 'S' : 'N'}</text>
                    <text x={MAG_W / 2} y={(MAG_H * 3) / 4 + 7} textAnchor="middle" fontSize={20} fontWeight={900} fill="#fff">{pole}</text>
                    {devil && <motion.text key={showForce && moving ? `f${move}` : 'devil'} x={MAG_W + 22} y={30} textAnchor="middle" fontSize={34}
                        initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, duration: 0.45 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                        {showForce && moving ? (move > 0 ? '😣' : '😯') : '😈'}
                    </motion.text>}
                  </motion.g>
                </g>
                {/* сила от кольца на магнит */}
                {showForce && moving && (
                    <g>
                        {move > 0 ? (
                            <>
                                <line x1={CX} y1={magTop - 4} x2={CX} y2={magTop - 34} stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" />
                                <path d={`M ${CX - 9} ${magTop - 24} L ${CX} ${magTop - 36} L ${CX + 9} ${magTop - 24}`} fill="none" stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                                <text x={CX - 46} y={magTop + 4} textAnchor="end" fontSize={14} fontWeight={900} fill={OWN_COLOR}>отталкивает!</text>
                            </>
                        ) : (
                            <>
                                <line x1={CX} y1={magTop + MAG_H + 4} x2={CX} y2={magTop + MAG_H + 34} stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" />
                                <path d={`M ${CX - 9} ${magTop + MAG_H + 24} L ${CX} ${magTop + MAG_H + 36} L ${CX + 9} ${magTop + MAG_H + 24}`} fill="none" stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                                <text x={CX - 46} y={magTop + MAG_H + 26} textAnchor="end" fontSize={14} fontWeight={900} fill={OWN_COLOR}>тянет назад!</text>
                            </>
                        )}
                    </g>
                )}
                {/* стрелка движения магнита */}
                {moving && moveArrow && (
                    <text x={CX - MAG_W / 2 - 26} y={magTop + MAG_H / 2 + 8} textAnchor="middle" fontSize={24} fontWeight={900} fill={RULE_COLOR}>
                        {move > 0 ? '⬇' : '⬆'}
                    </text>
                )}
                {/* эмоция кольца */}
                {face && (
                    <g transform={`translate(${CX + RING_RX + 28},${RING_CY - 12})`}>
                        {/* эмодзи-эмоция кольца: крупно, «прыгает» при каждой смене */}
                        <motion.text key={hideAnswer ? 'q' : faceOf(move, pole, battle)} x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={46}
                            initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, duration: 0.45 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                            {hideAnswer ? '🤔' : faceOf(move, pole, battle)}
                        </motion.text>
                    </g>
                )}
                {/* амперметр: крупно, под кольцом, подключён к кольцу проводами */}
                {showCurrent && <Ammeter needle={hideAnswer ? 0 : needle} on={currentOn} />}
            </svg>
        </div>
    )
}

// Стикер, который пульсирует, пока идёт ток (исчезает вместе с током).
const PulseSticker = ({ text, color }: { text: string; color: string }) => {
    const w = text.length > 1 ? 38 : 28
    return (
        <motion.g initial={{ scale: 0 }} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={7} fill="#161F23" stroke={color} strokeWidth={2.5} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={900} fill={color}>{text}</text>
        </motion.g>
    )
}

// Амперметр под кольцом: провода от кольца, шкала «− 0 +», толстая стрелка.
// При токе стрелка отклоняется (вправо/влево по направлению тока), шкала подсвечивается.
const AM_CX = CX, AM_CY = 458, AM_R = 50
const Ammeter = ({ needle, on }: { needle: number; on: boolean }) => {
    const ticks = [-80, -60, -40, -20, 0, 20, 40, 60, 80]
    const pt = (deg: number, r: number) => {
        const t = ((deg - 90) * Math.PI) / 180
        return { x: AM_CX + r * Math.cos(t), y: AM_CY + r * Math.sin(t) }
    }
    const wireCol = on ? CURRENT_COLOR : '#5C6B73'
    return (
        <g>
            {/* провода от кольца к клеммам */}
            <path d={`M ${CX - RING_RX + 6} ${RING_CY + 8} L ${CX - RING_RX + 6} ${AM_CY - 8} L ${AM_CX - AM_R - 8} ${AM_CY - 8}`} fill="none" stroke={wireCol} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M ${CX + RING_RX - 6} ${RING_CY + 8} L ${CX + RING_RX - 6} ${AM_CY - 8} L ${AM_CX + AM_R + 8} ${AM_CY - 8}`} fill="none" stroke={wireCol} strokeWidth={3} strokeLinejoin="round" />
            {/* корпус */}
            <rect x={AM_CX - AM_R - 12} y={AM_CY - AM_R - 12} width={(AM_R + 12) * 2} height={AM_R + 24} rx={12}
                fill="#11191D" stroke={on ? CURRENT_COLOR : '#3A464E'} strokeWidth={3} />
            {/* шкала */}
            <path d={`M ${pt(-80, AM_R).x} ${pt(-80, AM_R).y} A ${AM_R} ${AM_R} 0 0 1 ${pt(80, AM_R).x} ${pt(80, AM_R).y}`}
                fill="none" stroke={on ? CURRENT_COLOR : '#5C6B73'} strokeWidth={3} />
            {ticks.map((d) => {
                const a = pt(d, AM_R), b = pt(d, d === 0 ? AM_R - 12 : AM_R - 7)
                return <line key={d} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9AA7B0" strokeWidth={d === 0 ? 3 : 2} strokeLinecap="round" />
            })}
            <text x={pt(-70, AM_R - 18).x} y={pt(-70, AM_R - 18).y + 5} textAnchor="middle" fontSize={14} fontWeight={900} fill="#9AA7B0">−</text>
            <text x={pt(0, AM_R - 22).x} y={pt(0, AM_R - 22).y + 5} textAnchor="middle" fontSize={13} fontWeight={900} fill="#F2F7FB">0</text>
            <text x={pt(70, AM_R - 18).x} y={pt(70, AM_R - 18).y + 5} textAnchor="middle" fontSize={14} fontWeight={900} fill="#9AA7B0">+</text>
            {/* стрелка */}
            <g style={{ transform: `rotate(${needle}deg)`, transformOrigin: `${AM_CX}px ${AM_CY}px`, transition: 'transform 0.3s cubic-bezier(0.34, 1.6, 0.5, 1)' }}>
                <line x1={AM_CX} y1={AM_CY + 6} x2={AM_CX} y2={AM_CY - AM_R + 4} stroke={CURRENT_COLOR} strokeWidth={5} strokeLinecap="round" />
            </g>
            <circle cx={AM_CX} cy={AM_CY} r={6} fill="#F2F7FB" />
            {/* пульсирующий стикер направления тока: стрелка вправо → I+ справа, влево → I− слева */}
            {needle !== 0 && (
                <g transform={`translate(${AM_CX + (needle > 0 ? 32 : -32)},${AM_CY - 8})`}>
                    <PulseSticker text={needle > 0 ? 'I+' : 'I−'} color={CURRENT_COLOR} />
                </g>
            )}
        </g>
    )
}

// Кнопка «зажми, чтобы двигать».
const HoldBtn = ({ children, color, onStart, onRelease, pulse = false, disabled = false, className }: {
    children: React.ReactNode; color: string; onStart: () => void; onRelease: () => void; pulse?: boolean; disabled?: boolean; className?: string
}) => (
    <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => { e.preventDefault(); if (!disabled) { onStart() } }}
        onPointerUp={onRelease}
        onPointerLeave={onRelease}
        onPointerCancel={onRelease}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
            'relative flex-1 select-none touch-none rounded-2xl px-3 py-3 text-base font-black text-white disabled:opacity-40',
            'shadow-[0_5px_0_var(--edge)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--edge)] transition-[transform,box-shadow] duration-75',
            className,
        )}
        style={{ backgroundColor: color, ['--edge' as string]: darken(color) }}
    >
        {/* мягкое «дыхание» кнопки, пока её ещё не нажимали: кольцо свечения (только opacity/transform) */}
        {pulse && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[18px] border-2 animate-ping opacity-40" style={{ borderColor: color }} />}
        <span className="relative">{children}</span>
    </button>
)
// Цвет нижней грани объёмной кнопки: тот же тон, темнее на ~25%.
function darken(hex: string) {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.round(((n >> 16) & 255) * 0.72), g = Math.round(((n >> 8) & 255) * 0.72), b = Math.round((n & 255) * 0.72)
    return `rgb(${r}, ${g}, ${b})`
}

// Реплика кольца под картинкой (живёт по состоянию движения).
const Bubble = ({ text, color }: { text: string; color: string }) => (
    <motion.div key={text} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
        className="mx-auto rounded-2xl border-2 px-4 py-2 text-center text-sm md:text-base font-black"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.14), color }}>
        {text}
    </motion.div>
)

// ===== Сцены =====

const HArrow = ({ x1, x2, y, color, width = 4 }: { x1: number; x2: number; y: number; color: string; width?: number }) => {
    const s = x2 > x1 ? 1 : -1
    return (
        <g>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
            <path d={`M ${x2 - 10 * s} ${y - 8} L ${x2} ${y} L ${x2 - 10 * s} ${y + 8}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
        </g>
    )
}
const SvgSticker = ({ x, y, text, sub, color }: { x: number; y: number; text: string; sub?: string; color: string }) => {
    const w = sub ? 50 : 28
    return (
        <g transform={`translate(${x},${y})`}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={7} fill="#161F23" stroke={color} strokeWidth={2.5} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={900} fill={color}>
                {text}{sub && <tspan fontSize={10} dy={4}>{sub}</tspan>}
            </text>
        </g>
    )
}
// 3б. Поток — цилиндр (дно — кольцо S, длина — поле B), а к его поршню
// ШТОКОМ приделан вагон 🚃 на рельсах — прямая механическая аналогия
// «инерция вагона = индуктивность L» (обсуждение с пользователем,
// метафора «поршень+вагон» из ChatGPT-диалога, 2026-09-30). Тянешь
// цилиндр рукой — рука двигает МИШЕНЬ (пунктирный призрак) мгновенно, а
// НАСТОЯЩИЙ поток (сплошной цилиндр + вагон под ним) непрерывно ДОГОНЯЕТ
// мишень с задержкой — темп погони зависит от массы вагона (переключатель
// 🪶/🚂). Разрыв между мишенью и настоящим значением — это и есть B инд:
// пока он есть, вагон дёргается/отстаёт; лёгкий вагон почти не отстаёт
// (слабая индуктивность), тяжёлый — заметно тормозит любой рывок.
const TR_W = 320, TR_H = 300
const TR_X0 = 60, TR_CY = 72, TR_R = 36, TR_D = 11
const TR_LMIN = 30, TR_LMAX = 210, TR_L0 = 110
const TR_RAIL_Y = 252
const WAGON_W = 74, WAGON_H = 44
// Непрерывная погоня (первого порядка, без массы/скорости — тот же
// принцип "чистого затухания без перехлёста", что уже проверен и
// одобрен пользователем): на каждом тике проходим долю rate от
// оставшегося расстояния до мишени. rate ЗАВИСИТ ОТ МАССЫ вагона —
// лёгкий вагон почти сразу оказывается там, где рука; тяжёлый заметно
// отстаёт даже от медленных движений, не говоря про резкие рывки.
// Тяжёлый вагон — в 1.5 раза тяжелее (просьба пользователя после первой
// живой проверки): rate обратно пропорционален массе, поэтому темп
// погони поделен на 1.5 (0.026 → ~0.0173) — тот же вагон отстаёт заметно
// сильнее и дольше при том же рывке.
const TR_RATE: Record<'light' | 'heavy', number> = { light: 0.16, heavy: 0.0173 }
const TR_SNAP = 1.2
// Минимальный размах рывка (в тех же единицах, что и длина цилиндра),
// чтобы засчитать попытку «потянул этой массой» — отсекает случайные
// микро-клики по ручке.
const TR_DRAG_MIN = 34

// Вагон на рельсах: наклон (SVG rotate вокруг точки контакта с рельсом —
// НЕ CSS transform-origin, чтобы не словить гэтчу transformBox для SVG,
// см. комментарии в других *WALK этого проекта) пропорционален разрыву
// между мишенью и настоящим положением — вагон «откидывается» назад при
// резком рывке, как пассажир при разгоне.
const Wagon = ({ x, tilt }: { x: number; tilt: number }) => (
    <g transform={`translate(${x},${TR_RAIL_Y}) rotate(${tilt})`}>
        <rect x={-WAGON_W / 2} y={-WAGON_H} width={WAGON_W} height={WAGON_H} rx={8} fill="#5C6B73" stroke="#F2F7FB" strokeWidth={2} />
        <rect x={-WAGON_W / 2 + 6} y={-WAGON_H + 8} width={WAGON_W - 12} height={16} rx={4} fill="#3A464E" />
        <circle cx={-WAGON_W / 2 + 16} cy={0} r={9} fill="#161F23" stroke="#F2F7FB" strokeWidth={2} />
        <circle cx={WAGON_W / 2 - 16} cy={0} r={9} fill="#161F23" stroke="#F2F7FB" strokeWidth={2} />
        <text x={0} y={-WAGON_H / 2 + 6} textAnchor="middle" fontSize={22}>🚃</text>
    </g>
)

const TrainCylinderView = ({ targetLen, actualLen, svgRef, onDown, dragging }: {
    targetLen: number; actualLen: number
    svgRef: React.RefObject<SVGSVGElement>; onDown: (e: React.PointerEvent) => void; dragging: boolean
}) => {
    const PHI = GGEGE_PALETTE.purple.button
    const xTarget = TR_X0 + targetLen
    const xActual = TR_X0 + actualLen
    const gap = xTarget - xActual
    const showGap = Math.abs(gap) > 8
    // Наклон вагона — «откидывается» против направления рывка (инерция).
    const tilt = Math.max(-16, Math.min(16, -gap * 0.3))
    return (
        <svg ref={svgRef} viewBox={`0 0 ${TR_W} ${TR_H}`} className="w-full max-w-[340px] h-auto select-none" style={{ touchAction: 'none' }}>
            {/* мишень — пунктирный призрак там, где сейчас палец */}
            <FluxCylinder cx={TR_X0 + targetLen / 2} cy={TR_CY} radius={TR_R} depth={TR_D} length={targetLen} orient="h" color="#9AA7B0" fill={0} dashed />
            {/* настоящий поток — с задержкой */}
            <FluxCylinder cx={TR_X0 + actualLen / 2} cy={TR_CY} radius={TR_R} depth={TR_D} length={actualLen} orient="h" color={PHI} />
            <FieldArrow x1={TR_X0 + 4} y1={TR_CY} x2={xActual - 6} y2={TR_CY} color={FIELD_COLOR} width={5} head={8} />
            <ellipse cx={TR_X0} cy={TR_CY} rx={TR_D} ry={TR_R} fill="none" stroke={RING_COLOR} strokeWidth={5} />
            <SvgSticker x={TR_X0 - 2} y={TR_CY + TR_R + 20} text="S" color={RING_COLOR} />
            <SvgSticker x={TR_X0 + 34} y={TR_CY - TR_R - 16} text="Φ" color={PHI} />
            {showGap && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                    <HArrow x1={xTarget} x2={xActual + (xTarget > xActual ? 3 : -3)} y={TR_CY + TR_R + 34} color={OWN_COLOR} width={5} />
                    <SvgSticker x={(xTarget + xActual) / 2} y={TR_CY + TR_R + 52} text="B" sub="инд" color={OWN_COLOR} />
                </motion.g>
            )}
            {/* шток — от поршня (настоящего, не целевого значения) вниз к вагону */}
            <line x1={xActual} y1={TR_CY + TR_R + 6} x2={xActual} y2={TR_RAIL_Y - 46} stroke="#5C6B73" strokeWidth={3} strokeDasharray="5 5" />
            {/* рельс + тень вагона */}
            <line x1={TR_X0 + TR_LMIN - 20} y1={TR_RAIL_Y + 9} x2={TR_X0 + TR_LMAX + 20} y2={TR_RAIL_Y + 9} stroke="#3A464E" strokeWidth={4} strokeLinecap="round" />
            <ellipse cx={xActual} cy={TR_RAIL_Y + 5} rx={WAGON_W / 2 + 6} ry={6} fill="#000" opacity={0.22} />
            <Wagon x={xActual} tilt={tilt} />
            {/* ручка — тащим МИШЕНЬ, не сам поток */}
            <g onPointerDown={onDown} style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
                {!dragging && (
                    <motion.circle cx={xTarget} cy={TR_CY} r={22} fill="none" stroke={RULE_COLOR} strokeWidth={3}
                        animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.3, repeat: Infinity }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                )}
                <circle cx={xTarget} cy={TR_CY} r={20} fill={RULE_COLOR} stroke="#fff" strokeWidth={3} />
                <text x={xTarget} y={TR_CY + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff">✋</text>
                <circle cx={xTarget} cy={TR_CY} r={34} fill="transparent" />
            </g>
        </svg>
    )
}

// Кнопка-переключатель массы вагона (клик, не зажим — в отличие от HoldBtn).
const MassBtn = ({ active, pulse, color, onClick, children }: {
    active: boolean; pulse?: boolean; color: string; onClick: () => void; children: React.ReactNode
}) => (
    <button type="button" onClick={onClick}
        className={cn(
            'relative flex-1 select-none rounded-2xl px-3 py-3 text-base font-black shadow-[0_5px_0_var(--edge)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--edge)] transition-[transform,box-shadow,background-color] duration-75',
            active ? 'text-white' : 'text-[#F2F7FB]',
        )}
        style={{ backgroundColor: active ? color : '#161F23', border: active ? 'none' : `2px solid ${color}`, ['--edge' as string]: active ? darken(color) : '#0C1215' }}
    >
        {pulse && !active && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[18px] border-2 animate-ping opacity-40" style={{ borderColor: color }} />}
        <span className="relative">{children}</span>
    </button>
)

const TrainCylinderScene = ({ onSettled }: { onSettled?: () => void }) => {
    // phase: 0 интро · 1 диаграмма · 2 вывод
    const [phase, setPhase] = useState(0)
    const [targetLen, setTargetLen] = useState(TR_L0)
    const [actualLen, setActualLen] = useState(TR_L0)
    const [mass, setMass] = useState<'light' | 'heavy'>('light')
    const [dragging, setDragging] = useState(false)
    const [tried, setTried] = useState<{ light: boolean; heavy: boolean }>({ light: false, heavy: false })
    const svgRef = useRef<SVGSVGElement>(null)
    const targetRef = useRef(TR_L0)
    const actualRef = useRef(TR_L0)
    const massRef = useRef<'light' | 'heavy'>('light')
    const dragStartRef = useRef(TR_L0)

    // Непрерывная погоня: настоящее значение всегда стремится к мишени,
    // темп зависит от текущей массы. После того как разрыв схлопнулся до
    // TR_SNAP — просто ничего не делаем (без лишних setState).
    useEffect(() => {
        const timer = setInterval(() => {
            const diff = targetRef.current - actualRef.current
            if (Math.abs(diff) < TR_SNAP) {
                if (actualRef.current !== targetRef.current) { actualRef.current = targetRef.current; setActualLen(actualRef.current) }
                return
            }
            actualRef.current += diff * TR_RATE[massRef.current]
            setActualLen(actualRef.current)
        }, 16)
        return () => clearInterval(timer)
    }, [])

    const toSvgX = (clientX: number, clientY: number) => {
        const svg = svgRef.current
        const ctm = svg?.getScreenCTM()
        if (!svg || !ctm) return null
        const pt = svg.createSVGPoint()
        pt.x = clientX; pt.y = clientY
        return pt.matrixTransform(ctm.inverse()).x
    }
    const onDown = (e: React.PointerEvent) => {
        e.preventDefault()
        svgRef.current?.setPointerCapture?.(e.pointerId)
        dragStartRef.current = targetRef.current
        setDragging(true)
    }
    const onMove = (e: React.PointerEvent) => {
        if (!dragging) return
        const x = toSvgX(e.clientX, e.clientY)
        if (x === null) return
        const raw = Math.max(TR_LMIN, Math.min(TR_LMAX, x - TR_X0))
        targetRef.current = raw
        setTargetLen(raw)
    }
    const onUp = () => {
        if (!dragging) return
        setDragging(false)
        const delta = Math.abs(targetRef.current - dragStartRef.current)
        if (delta >= TR_DRAG_MIN) setTried((t) => (t[massRef.current] ? t : { ...t, [massRef.current]: true }))
    }
    const pickMass = (m: 'light' | 'heavy') => { massRef.current = m; setMass(m) }

    const both = tried.light && tried.heavy
    useEffect(() => { if (both && phase === 1) { const t = setTimeout(() => setPhase(2), 700); return () => clearTimeout(t) } }, [both, phase])

    const hint = !tried.light ? '🪶 Лёгкий вагон уже выбран — потяни цилиндр туда-сюда'
        : !tried.heavy ? 'Теперь переключи на 🚂 тяжёлый и дёрни резко'
            : ''

    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Приделаем к потоку ' }, { sticker: 'Φ', color: GGEGE_PALETTE.purple.button }, { text: ' вагон 🚃 — потянешь цилиндр, вагон поедет следом' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: 'none' }}>
                        <TrainCylinderView targetLen={targetLen} actualLen={actualLen} svgRef={svgRef} onDown={onDown} dragging={dragging} />
                        <div className="flex gap-2 w-full">
                            <MassBtn active={mass === 'light'} pulse={!tried.light} color={GGEGE_PALETTE.green.button} onClick={() => pickMass('light')}>🪶 Лёгкий вагон</MassBtn>
                            <MassBtn active={mass === 'heavy'} pulse={tried.light && !tried.heavy} color={CURRENT_COLOR} onClick={() => pickMass('heavy')}>🚂 Тяжёлый вагон</MassBtn>
                        </div>
                        {hint && <p className="text-sm font-black text-center" style={{ color: RULE_COLOR }}>{hint}</p>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(3), 1600)}>
                    <InsightCard>
                        Масса вагона — это <InsightWord color="#FF9AC8">индуктивность</InsightWord>.
                        <br />🪶 Лёгкий вагон почти не отстаёт — <InsightWord>B инд</InsightWord> слабое.
                        <br />🚂 Тяжёлый сильно тормозит рывок — <InsightWord color="#D8BBFF">B инд</InsightWord> мощное.
                    </InsightCard>
                </DiagramBlock>
            )}
            {/* Закрываем крючок из HookScene: старый «закон» (поток НЕ должен
                меняться) на самом деле неточный — исправляем его тем же
                визуальным языком (перечёркнутая красная плашка → новая). */}
            {phase >= 3 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1600)}>
                    <div className="w-full rounded-xl border-2 px-4 py-3 text-center" style={{ borderColor: REMEMBER_COLOR, backgroundColor: hexToRgba(REMEMBER_COLOR, 0.12) }}>
                        <div className="text-sm font-bold line-through opacity-50" style={{ color: '#DC605B' }}>
                            🔒 Поток должен НЕ МЕНЯТЬСЯ
                        </div>
                        <div className="mt-1 text-lg font-black" style={{ color: REMEMBER_COLOR }}>
                            🔄 На самом деле: поток МЕНЯЕТСЯ — просто <span className="underline">лениво</span> 😴
                        </div>
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// ===== Новое начало (2026-09-29): от закона урока Фарадея к индукционному току =====

// Кнопка-реплика ученика (продолжить сцену своим «ответом»).
const ReplyBtn = ({ children, onClick, color = RULE_COLOR }: { children: React.ReactNode; onClick: () => void; color?: string }) => (
    <motion.button type="button" onClick={onClick}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55 }}
        className="mx-auto rounded-2xl px-6 py-3 text-lg font-black text-white shadow-[0_5px_0_var(--edge)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--edge)] transition-[transform,box-shadow] duration-75"
        style={{ backgroundColor: color, ['--edge' as string]: darken(color) }}>
        {children}
    </motion.button>
)

// 0. «Помнишь? Поток НЕ должен меняться. Это закон. …А если захочется поменять?»
const HookScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const PHI = GGEGE_PALETTE.purple.button
    const videoRef = useRef<HTMLVideoElement>(null)
    // Видео Амбридж играет РОВНО 2 раза и останавливается — по прямой
    // просьбе пользователя, вместо бесконечного `loop` (тот грузил CPU в
    // фоне, см. более раннюю запись). Без `loop`-атрибута видео само
    // ставится на паузу на последнем кадре после 2-го `ended`, отдельного
    // `pause()` не нужно — просто не вызываем play() снова.
    const playCountRef = useRef(0)
    const handleEnded = () => {
        playCountRef.current += 1
        if (playCountRef.current < 2) {
            videoRef.current?.play()
        } else {
            setPhase((p) => Math.max(p, 4))
        }
    }
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Помнишь? Поток ' }, { sticker: 'Φ', color: PHI }, { text: ' должен ' }, { bold: 'НЕ МЕНЯТЬСЯ' }, { text: '!' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 900)}>
                    <div className="relative w-full flex justify-center">
                        <svg viewBox="0 0 320 200" className="w-full max-w-[300px] h-auto">
                            <FluxCylinder cx={160} cy={96} radius={62} depth={16} length={130} orient="v" color={PHI} />
                            <FieldArrow x1={160} y1={40} x2={160} y2={156} color={FIELD_COLOR} width={6} head={10} />
                            <ellipse cx={160} cy={161} rx={62} ry={16} fill="none" stroke={RING_COLOR} strokeWidth={6} />
                            <SvgSticker x={250} y={96} text="Φ" color={PHI} />
                        </svg>
                        {/* печать «ЗАКОН» */}
                        <motion.div initial={{ scale: 3.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }}
                            transition={{ delay: 0.5, type: 'spring', bounce: 0.45 }}
                            className="absolute left-2 top-3 rounded-lg border-[3px] px-2 py-1 text-base font-black tracking-widest"
                            style={{ borderColor: '#DC605B', color: '#DC605B', backgroundColor: 'rgba(220,96,91,0.12)' }}>
                            🔒 ЗАКОН
                        </motion.div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Это закон. Природа за ним следит строже, чем завуч на входе 👮' }]}
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 3 && (
                <DiagramBlock>
                    <video ref={videoRef} src="/video/umbridge.mp4" autoPlay muted playsInline onEnded={handleEnded}
                        className="pointer-events-none mx-auto w-full max-w-[220px] aspect-square rounded-2xl object-cover" />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <TypedLineWithParts
                    parts={[{ text: 'Но что если… нам ' }, { bold: 'захочется' }, { text: ' его нарушить? 😈' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 2. Кто делает B инд? Само кольцо: сначала в нём включается ТОК (ученик сам
// жмёт «включить ток»), затем по ПРАВИЛУ ПРАВОЙ РУКИ этот ток создаёт своё
// поле B инд (сначала рисуем руку, потом, с паузой, само поле). Каждый шаг
// подтверждается нашей стандартной кнопкой-реплаем «Понятно» (как «Агась»
// в ElasticFluxScene), не автотаймером.
// Ток спереди вправо ⇔ поле кольца вверх (конвенция файла, см. шапку).
const WHO_CX = 160, WHO_CY = 150, WHO_RX = 96, WHO_RY = 26
const WhoScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [currentOn, setCurrentOn] = useState(false)
    // 0 — ничего · 1 — рука нарисована · 2 — рука + поле B инд
    const [handPhase, setHandPhase] = useState<0 | 1 | 2>(0)
    const [ruleTextDone, setRuleTextDone] = useState(false)
    const back = `M ${WHO_CX - WHO_RX} ${WHO_CY} A ${WHO_RX} ${WHO_RY} 0 0 1 ${WHO_CX + WHO_RX} ${WHO_CY}`
    const front = `M ${WHO_CX - WHO_RX} ${WHO_CY} A ${WHO_RX} ${WHO_RY} 0 0 0 ${WHO_CX + WHO_RX} ${WHO_CY}`
    const ringCol = currentOn ? CURRENT_COLOR : RING_COLOR
    const startCurrent = () => {
        if (currentOn) return
        setCurrentOn(true)
    }
    // Первое «Понятно» — включает разбор правила правой руки: сразу рисуем
    // руку, а через паузу — поле B инд (просьба пользователя).
    const showRule = () => {
        setPhase(3)
        setHandPhase(1)
        setTimeout(() => setHandPhase(2), 1100)
    }
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Стоп. А кто вообще делает это ' }, { sticker: 'B инд', color: OWN_COLOR }, { text: '? 🤔' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <TypedLineWithParts
                    parts={[{ text: 'Само ' }, { sticker: 'кольцо', color: RING_COLOR }, { text: '! Сначала в нём включается ' }, { sticker: 'ток', color: CURRENT_COLOR }, { text: '. Жми 👇' }]}
                    onSettled={() => setPhase(2)}
                />
            )}
            {phase >= 2 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <svg viewBox="0 0 320 250" className="w-full max-w-[320px] h-auto">
                            <path d={back} fill="none" stroke={ringCol} strokeWidth={7} strokeLinecap="round" />
                            {handPhase >= 2 && (
                                <motion.g initial={{ opacity: 0, scaleY: 0.1 }} animate={{ opacity: 1, scaleY: 1 }}
                                    transition={{ type: 'spring', bounce: 0.4 }}
                                    style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
                                    <FieldArrow x1={WHO_CX} y1={WHO_CY + 60} x2={WHO_CX} y2={WHO_CY - 110} color={OWN_COLOR} width={7} head={11} />
                                </motion.g>
                            )}
                            <path d={front} fill="none" stroke={ringCol} strokeWidth={7} strokeLinecap="round" />
                            {currentOn && (
                                <>
                                    <motion.path d={front} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="6 18" strokeLinecap="round"
                                        animate={{ strokeDashoffset: [0, -48] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
                                    <g transform={`translate(${WHO_CX + WHO_RX + 4},${WHO_CY + WHO_RY + 18})`}>
                                        <PulseSticker text="I инд" color={CURRENT_COLOR} />
                                    </g>
                                </>
                            )}
                            {handPhase >= 1 && (
                                <RightHandHint cx={WHO_CX} cy={WHO_CY} rx={WHO_RX + 18} ry={WHO_RY + 12} thumbUp curlRight />
                            )}
                            {handPhase >= 2 && (
                                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                                    <SvgSticker x={WHO_CX + 44} y={WHO_CY - 92} text="B" sub="инд" color={OWN_COLOR} />
                                </motion.g>
                            )}
                        </svg>
                        {!currentOn && <ReplyBtn onClick={startCurrent} color={CURRENT_COLOR}>⚡ Включить ток</ReplyBtn>}
                        {currentOn && phase === 2 && <ReplyBtn onClick={showRule}>Понятно</ReplyBtn>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'По ' }, { sticker: 'ПРАВИЛУ ПРАВОЙ РУКИ', color: REMEMBER_COLOR }, { text: ' включается ' }, { sticker: 'B инд', color: OWN_COLOR }, { text: '!' }]}
                    onSettled={() => setRuleTextDone(true)}
                />
            )}
            {phase === 3 && ruleTextDone && handPhase === 2 && (
                <ReplyBtn onClick={() => setPhase(4)}>Понятно</ReplyBtn>
            )}
            {phase >= 4 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1400)}>
                    <InsightCard label="🛡️ Цепочка защиты">
                        Φ пытается измениться →<br />
                        в кольце включается <Sticker value="ток I" color={CURRENT_COLOR} /> →<br />
                        ток создаёт <Sticker value="ИНДУКЦИОННОЕ ПОЛЕ B" color={OWN_COLOR} /> →<br />
                        поток <InsightWord>восстанавливается</InsightWord>.
                    </InsightCard>
                </DiagramBlock>
            )}
        </>
    )
}

// 3. Скорость → сила тока. Один экран: 🐢 медленно / 🚀 быстро, смотри на амперметр.
const SpeedMagnetScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const mag = useMagnet(0.05)
    const [tried, setTried] = useState<{ slow: boolean; fast: boolean }>({ slow: false, fast: false })
    const lastSpeed = useRef(0)
    useEffect(() => {
        if (mag.move === 1) { lastSpeed.current = mag.speed; return }
        if (mag.move === 0 && lastSpeed.current) {
            if (lastSpeed.current < 1) setTried((t) => ({ ...t, slow: true }))
            if (lastSpeed.current > 1) setTried((t) => ({ ...t, fast: true }))
            lastSpeed.current = 0
        }
    }, [mag.move, mag.speed])
    const both = tried.slow && tried.fast
    useEffect(() => { if (both && phase === 1) { const t = setTimeout(() => setPhase(2), 700); return () => clearTimeout(t) } }, [both, phase])
    // магнит доехал до кольца — тихо возвращаем наверх, чтобы можно было пробовать ещё
    useEffect(() => {
        if (mag.move === 0 && mag.pos >= 1) { const t = setTimeout(() => mag.jump(0.05), 700); return () => clearTimeout(t) }
    }, [mag.move, mag.pos, mag])
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Теперь настоящий магнит 🧲 Толкни его ' }, { bold: 'медленно' }, { text: ', потом ' }, { bold: 'быстро' }, { text: '.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col gap-2">
                        <LenzView pos={mag.pos} move={mag.move} speed={mag.speed} face={false} devil={false} />
                        <div className="flex gap-2">
                            <HoldBtn color={GGEGE_PALETTE.green.button} pulse={!tried.slow} onStart={() => mag.start(1, 0.45)} onRelease={mag.release} disabled={mag.pos >= 1}>🐢 Медленно</HoldBtn>
                            <HoldBtn color={CURRENT_COLOR} pulse={tried.slow && !tried.fast} onStart={() => mag.start(1, 2.1)} onRelease={mag.release} disabled={mag.pos >= 1}>🚀 Быстро</HoldBtn>
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1200)}>
                    <InsightCard>
                        🐢 Медленно — ток <InsightWord>слабенький</InsightWord><br />
                        🚀 Быстро — ток <InsightWord color="#FF9AC8">ОГОГО</InsightWord><br />
                        😴 Стоит — тока нет
                    </InsightCard>
                </DiagramBlock>
            )}
        </>
    )
}

const CONCEPT_SCENES = [HookScene, TrainCylinderScene, WhoScene, SpeedMagnetScene]
const INTRO_CONCEPT_STEPS = CONCEPT_SCENES.length

const ConceptPhase = ({ onDone }: { onDone: () => void }) => {
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    useEffect(() => { setNextLabel(step === 0 ? 'Го по-тихому 🤫' : pickWalkthroughNextLabel('Дальше')) }, [step])

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `step-${step}`
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, stepReady)
    const canGoBack = step > 0
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        const target = step - 1
        bumpNonce(`step-${target}`)
        setStep(target)
        setStepReady(false)
    }
    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_CONCEPT_STEPS) onDone()
            else { setStep((s) => s + 1); setStepReady(false) }
            setAdvancing(false)
        }, CONCEPT_PAUSE_MS)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            <div className="w-full flex flex-col gap-4">
                {CONCEPT_SCENES.map((Scene, i) =>
                    step >= i ? (
                        <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                            <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                                <Scene onSettled={() => i === step && setStepReady(true)} />
                            </Fragment>
                        </SceneWrapper>
                    ) : null,
                )}
            </div>
            <div className="w-full flex items-center gap-2">
                <ReplayButton onClick={handleReplay} disabled={advancing} />
                <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                    className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                    {nextLabel}
                </button>
            </div>
        </div>
    )
}

// ===================================================================
// ФАЗА "quiz"
// ===================================================================

type ConceptQuizItem = {
    renderPrompt: () => React.ReactNode
    renderOptions: () => React.ReactNode[]
    correct: number
    feedback: string
}

const CONCEPT_QUIZ: ConceptQuizItem[] = [
    {
        renderPrompt: () => <>Когда в кольце появляется индукционный ток?</>,
        renderOptions: () => ['Когда поток Φ большой', 'Когда поток Φ меняется'],
        correct: 1,
        feedback: 'Ток есть, только пока поток МЕНЯЕТСЯ.',
    },
    {
        renderPrompt: () => <>Сильный магнит лежит неподвижно прямо в кольце. Ток в кольце есть?</>,
        renderOptions: () => ['Нет — поток не меняется', 'Да — поле же огромное'],
        correct: 0,
        feedback: 'Магнит стоит → поток постоянный → тока нет 😴',
    },
    {
        renderPrompt: () => <>Магнит толкнули к кольцу в 2 раза <b>быстрее</b>. Ток в кольце…</>,
        renderOptions: () => ['такой же', 'сильнее'],
        correct: 1,
        feedback: 'Быстрее меняешь поток — сильнее ток 🚀',
    },
    {
        renderPrompt: () => <>Магнит двигают <b>очень-очень медленно</b> 🐢 Ток…</>,
        renderOptions: () => ['слабенький', 'огромный'],
        correct: 0,
        feedback: 'Поток меняется еле-еле — и ток еле-еле 🐢',
    },
    {
        renderPrompt: () => <>Бонус! Как получить ток побольше? 😏</>,
        renderOptions: () => ['Дёрнуть магнит, как будто опаздываешь на автобус 🏃💨'],
        correct: 0,
        feedback: 'Именно! Резко меняешь поток — ток ОГОГО ⚡',
    },
]

const pickQuizFeedbackPhrase = (i: number): string =>
    CORRECT_FEEDBACK_PHRASES[i % CORRECT_FEEDBACK_PHRASES.length]

const QuizAnswerButton = ({
    children, onClick, disabled, state,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border-2 text-base md:text-lg font-bold text-center transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        {children}
    </button>
)

const ConceptQuizPhase = ({ onDone }: { onDone: (hadMistake: boolean) => void }) => {
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [hadMistake, setHadMistake] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `q-${trialIndex}`
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, checked)
    const canGoBack = trialIndex > 0
    const handleReplay = () => bumpNonce(latestSceneKey)
    const handleBack = () => {
        if (advancing || trialIndex === 0) return
        const target = trialIndex - 1
        bumpNonce(`q-${target}`)
        setTrialIndex(target)
        setChecked(false)
        setWrongTried([])
        setWrongFlash(null)
    }

    const handlePick = (i: number, k: number) => {
        if (checked || wrongTried.includes(k)) return
        if (k === CONCEPT_QUIZ[i].correct) {
            registerCombo(wrongTried.length === 0)
            setChecked(true)
            setNextLabel(pickWalkthroughNextLabel(trialIndex + 1 >= CONCEPT_QUIZ.length ? 'Готово' : 'Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            setWrongTried((w) => [...w, k])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (trialIndex + 1 >= CONCEPT_QUIZ.length) {
                setAdvancing(false)
                onDone(hadMistake)
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
            setAdvancing(false)
        }, CONCEPT_PAUSE_MS)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            <div className="w-full flex flex-col gap-4">
                {Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const qq = CONCEPT_QUIZ[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const opts = qq.renderOptions()
                    return (
                        <SceneWrapper key={`q-${i}`} innerRef={sceneRef(`q-${i}`)} active={isSceneActive(`q-${i}`)}>
                            <Fragment key={`q-${i}-${nonceFor(`q-${i}`)}`}>
                                {i === 0 && (
                                    <div className="w-full flex items-center gap-3" aria-hidden>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                    </div>
                                )}
                                <div className="relative w-full flex items-center justify-center">
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{
                                            borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                            backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                            color: GGEGE_PALETTE.purple.button,
                                        }}
                                    >
                                        <span>{i + 1}</span>
                                        <span className="opacity-50 font-normal">/</span>
                                        <span>{CONCEPT_QUIZ.length}</span>
                                    </div>
                                    <p className="w-full pl-16 text-base md:text-lg text-[#F2F7FB] text-center font-bold">
                                        {qq.renderPrompt()}
                                    </p>
                                </div>
                                {isCurrent && !checked && (
                                    <>
                                        <div className="grid grid-cols-1 gap-3">
                                            {opts.map((opt, oi) => {
                                                const isWrongTriedOpt = wrongTried.includes(oi)
                                                return (
                                                    <QuizAnswerButton key={oi} state={isWrongTriedOpt ? 'wrong' : 'idle'}
                                                        disabled={isWrongTriedOpt} onClick={() => handlePick(i, oi)}>
                                                        {opt}
                                                    </QuizAnswerButton>
                                                )
                                            })}
                                        </div>
                                        {wrongFlash && (
                                            <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                                {wrongFlash}
                                            </div>
                                        )}
                                    </>
                                )}
                                {isDone && (
                                    <>
                                        <div className="grid grid-cols-1 gap-3">
                                            {opts.map((opt, oi) => {
                                                const isCorrectOpt = oi === qq.correct
                                                const isWrongTriedOpt = isCurrent && wrongTried.includes(oi)
                                                return (
                                                    <QuizAnswerButton key={oi} disabled
                                                        state={isCorrectOpt ? 'correct' : (isWrongTriedOpt ? 'wrong' : 'idle')}>
                                                        {opt}
                                                    </QuizAnswerButton>
                                                )
                                            })}
                                        </div>
                                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                            <div className="text-center">
                                                <div className="font-extrabold" style={{ color: CORRECT_COLOR }}>{pickQuizFeedbackPhrase(i)}</div>
                                                <div className="mt-1 text-sm text-[#F2F7FB]">{qq.feedback}</div>
                                            </div>
                                        </FieryFeedbackBanner>
                                    </>
                                )}
                                {isCurrent && checked && <LocalAnswerConfetti />}
                            </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {checked && (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNext} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= CONCEPT_QUIZ.length ? 'Готово' : nextLabel}
                    </button>
                </div>
            )}
        </div>
    )
}

// ===== Основной компонент =====

export const TypeLenzWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'concept' | 'quiz'>('concept')
    const finishedRef = useRef(false)
    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }
    if (phase === 'concept') return <ConceptPhase onDone={() => setPhase('quiz')} />
    return <ConceptQuizPhase onDone={handleFinish} />
}
