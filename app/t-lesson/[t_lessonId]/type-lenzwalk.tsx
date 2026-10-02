// app/t-lesson/[t_lessonId]/type-lenzwalk.tsx
//
// Тип LENZWALK — интерактивный разбор «индукционный ток и правило Ленца»
// (тема «Электродинамика», сразу после FARADAYWALK/DIRWALK). Стиль — как у
// FARADAYWALK/DIRWALK: массив сцен CONCEPT_SCENES, накопительный лог,
// мини-игры руками.
//
// Сцены: HookScene («поток Φ не должен меняться… а если нарушить?») →
// TrainCylinderScene — тянем цилиндр потока Φ, а к нему рычагом (штоком)
// приделан транспорт (🚲 велосипед / 🚙 Гелик) на рельсах; чем ТЯЖЕЛЕЕ
// выбранный транспорт, тем заметнее он отстаёт от мишени (там, где
// сейчас палец) — прямая механическая аналогия «индуктивность L = вес
// транспорта»: велосипед почти не отстаёт (слабое B инд), Гелик —
// заметно тормозит рывок (сильное B инд). Дальше WhoScene (кто делает
// B инд — само кольцо через правило правой руки) → SpeedMagnetScene
// (скорость магнита → сила тока).
//
// Физика (проверено): кольцо горизонтальное, магнит сверху. N внизу → поле
// магнита в кольце ВНИЗ. Приближаем → Φ растёт → своё поле кольца ВВЕРХ
// (против). Удаляем → своё поле ВНИЗ (как у магнита). S внизу — наоборот.
// Своё поле вверх ⇔ ток против часовой, если смотреть сверху ⇔ на экране
// (эллипс в перспективе) передняя часть кольца течёт ВПРАВО — та же
// конвенция, что в DIRWALK (ток вверх → спереди вправо).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
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
import facepalm from '@/public/Lottie/stepByStep/facepalm.json'
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
const PulseSticker = ({ text, sub, color }: { text: string; sub?: string; color: string }) => {
    const w = sub ? 50 : text.length > 1 ? 38 : 28
    return (
        <motion.g initial={{ scale: 0 }} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={7} fill="#161F23" stroke={color} strokeWidth={2.5} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={900} fill={color}>{text}{sub && <tspan fontSize={10} dy={4}>{sub}</tspan>}</text>
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
// 3б. Поток — цилиндр (дно — кольцо S, длина — поле B). ВАЖНАЯ ФИЗИЧЕСКАЯ
// ПРАВКА (поймана пользователем, 2026-09-30): цилиндр Φ = L·I — по
// электромеханической аналогии (V↔F, I↔v, L↔m) это Φ = L·I ↔ m·v = p —
// ИМПУЛЬС, не координата! Значит транспорт не должен «уезжать» по
// рельсам (координата x) — когда цилиндр перестаёт расти, машина должна
// ехать дальше с новой ПОСТОЯННОЙ скоростью, а не стоять. Рельсы для
// этого физически неверны (и упираются в край экрана — нам просто
// некуда её катить). Правильная визуализация — СПИДОМЕТР: стрелка =
// скорость v = Φ/m (при фиксированной массе — прямо пропорциональна
// цилиндру). Транспорт (🚲 Велик / 🚙 Гелик) статично стоит рядом,
// стрелка спидометра непрерывно ДОГОНЯЕТ мишень (пунктирная стрелка) —
// та же самая физика погони с задержкой, что и раньше, просто рисуется
// по кругу, а не по прямой. Разрыв между стрелками — B инд: при разгоне
// это «дуло, светящее в лицо» (мешает расти), при торможении —
// «двигатель, толкающий сзади» (мешает падать) — направление само
// переключается через тот же gap, без отдельной логики.
const TR_W = 480, TR_H = 440
const TR_X0 = 60, TR_CY = 72, TR_R = 36, TR_D = 11
const TR_LMIN = 30, TR_LMAX = 340, TR_L0 = 150
// Спидометр: центр, радиус, угловой диапазон (° в конвенции gaugePt —
// 0° = вверх, ±90° = вправо/влево, тот же приём, что уже в Ammeter этого
// файла). −100°/100° — чуть больше полукруга, как у настоящего спидометра.
const GAUGE_CX = 230, GAUGE_CY = 280, GAUGE_R = 92
const GAUGE_DEG_MIN = -100, GAUGE_DEG_MAX = 100
const GAUGE_TICKS = [-100, -75, -50, -25, 0, 25, 50, 75, 100]
const angleOf = (len: number) => GAUGE_DEG_MIN + (GAUGE_DEG_MAX - GAUGE_DEG_MIN) * (len - TR_LMIN) / (TR_LMAX - TR_LMIN)
const gaugePt = (deg: number, r: number) => {
    const t = ((deg - 90) * Math.PI) / 180
    return { x: GAUGE_CX + r * Math.cos(t), y: GAUGE_CY + r * Math.sin(t) }
}
// Дуга между двумя углами + касательная в конце (для наконечника
// стрелки-дуги B инд) — тот же аналитический приём, что уже даёт
// curlArc() выше в этом файле для RightHandHint, просто обобщён на
// произвольные from/to (не жёстко 160°/20°).
function gaugeArc(fromDeg: number, toDeg: number, r: number) {
    const steps = 16
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
        const d = fromDeg + (toDeg - fromDeg) * (i / steps)
        const p = gaugePt(d, r)
        pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    const te = ((toDeg - 90) * Math.PI) / 180
    const s = toDeg >= fromDeg ? 1 : -1
    const dx = -Math.sin(te) * s, dy = Math.cos(te) * s
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    return { d: `M ${pts.join(' L ')}`, end: gaugePt(toDeg, r), ang }
}
// Картинки — реальные фото, вырезанные Vision (без фона), см.
// public/vehicles/. Высота считается из ширины по реальным пропорциям
// файлов, чтобы не искажать транспорт.
const VEHICLE_SRC: Record<'light' | 'heavy', string> = { light: '/vehicles/bike.webp', heavy: '/vehicles/gelik.webp' }
const VEHICLE_DIMS: Record<'light' | 'heavy', { w: number; h: number }> = { light: { w: 96, h: 56 }, heavy: { w: 172, h: 78 } }
// Непрерывная погоня (первого порядка, без массы/скорости — тот же
// принцип "чистого затухания без перехлёста", что уже проверен и
// одобрен пользователем): на каждом тике проходим долю rate от
// оставшегося расстояния до мишени. rate ЗАВИСИТ ОТ ВЕСА транспорта —
// велосипед почти сразу оказывается там, где рука; Гелик заметно
// отстаёт даже от медленных движений, не говоря про резкие рывки.
// Гелик — в 1.5 раза «тяжелее» старого вагона (просьба пользователя
// после первой живой проверки): rate обратно пропорционален массе,
// поэтому темп погони поделен на 1.5 (0.026 → ~0.0173).
// 2026-09-30: Гелик ещё в 1.5 раза инертнее (просьба пользователя): 0.0173 → 0.0115.
// 2026-09-30 (2): валун ещё в 2 раза инертнее: 0.0115 → 0.00575.
const TR_RATE: Record<'light' | 'heavy', number> = { light: 0.16, heavy: 0.00575 }
const TR_SNAP = 1.2
// Шаг погони «настоящее → мишень». Шарик — обычное экспоненциальное
// приближение. Валун — с «выраженным затуханием» (просьба пользователя:
// экспонента с маленьким темпом выглядела почти линейной): шаг ∝ diff·√|diff|,
// т.е. при большом рывке валун заметно двигается сразу, а дальше всё сильнее
// вязнет и долго-долго доползает до цели. Перелёта нет (знак diff не меняется).
const TR_HEAVY_K = 0.00835, TR_HEAVY_D = 50, TR_HEAVY_SNAP = 4
const chaseStep = (actual: number, target: number, mass: 'light' | 'heavy') => {
    const diff = target - actual
    if (mass === 'light') return Math.abs(diff) < TR_SNAP ? target : actual + diff * TR_RATE.light
    if (Math.abs(diff) < TR_HEAVY_SNAP) return target
    return actual + diff * TR_HEAVY_K * Math.sqrt(Math.abs(diff) / TR_HEAVY_D)
}
// Минимальный размах рывка (в тех же единицах, что и длина цилиндра),
// чтобы засчитать попытку «потянул этим транспортом» — отсекает
// случайные микро-клики по ручке. Трасса выросла почти вдвое — порог
// тоже приподнят, чтобы остаться такой же ЛЁГКОЙ ДОЛЕЙ трассы.
const TR_DRAG_MIN = 60

// Транспорт — иконка под спидометром, которая «едет вправо»: колёса
// крутятся бегущим пунктиром (тот же приём, что у тока в кольце), корпус
// мелко трясётся. Скорость вращения/тряски = speed (0..1, та же доля, что
// у стрелки спидометра). Фаза копится своим setInterval (не rAF — не
// замирает в фоне) и продолжает крутиться при постоянной скорости, даже
// когда родитель уже не перерисовывается.
// Колёса — в долях размера картинки (замерено по альфе файлов). Гелик в
// файле смотрит ВЛЕВО — рисуем его отражённым (scale(-1,1)), координаты
// колёс даны уже для отражённой картинки.
const VEHICLE_WHEELS: Record<'light' | 'heavy', { fx: number; fy: number; fr: number }[]> = {
    light: [{ fx: 0.207, fy: 0.638, fr: 0.27 }, { fx: 0.793, fy: 0.638, fr: 0.27 }],
    heavy: [{ fx: 0.218, fy: 0.766, fr: 0.13 }, { fx: 0.816, fy: 0.766, fr: 0.13 }],
}
const VEHICLE_FLIP: Record<'light' | 'heavy', boolean> = { light: false, heavy: true }
const Vehicle = ({ x, y, tilt, mass, speed, scale = 1 }: { x: number; y: number; tilt: number; mass: 'light' | 'heavy'; speed: number; scale?: number }) => {
    const w = VEHICLE_DIMS[mass].w * scale, h = VEHICLE_DIMS[mass].h * scale
    const speedRef = useRef(speed)
    speedRef.current = speed
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        const id = setInterval(() => {
            const v = speedRef.current
            // квадратично: на малой скорости колёса еле крутятся, на большой — вихрем
            if (v > 0.01) setPhase((p) => p + v * v * 4)
        }, 16)
        return () => clearInterval(id)
    }, [])
    // Тряска растёт со скоростью. Гелик — мелкая дрожь + подскоки на кочках
    // (уменьшены: сильная рябь резала глаз). Велик — без дрожи, только
    // плавное покачивание по синусу (без «удара» |sin| внизу).
    const heavy = mass === 'heavy'
    const amp = speed * (heavy ? 0.6 : 0.25)
    const hop = heavy
        ? -Math.abs(Math.sin(phase * 0.35)) * speed * 1.7
        : (Math.cos(phase * 0.22) - 1) * speed * 1.2
    const shakeY = Math.sin(phase * (heavy ? 0.95 : 0.3)) * amp + hop
    const shakeR = Math.sin(phase * (heavy ? 0.65 : 0.2)) * amp * 0.5
    return (
        <g>
            {/* ветер — три едва заметные прямые слева (позади), вне группы
                транспорта: не наклоняются и не трясутся вместе с ним */}
            {[-0.22, 0.05, 0.3].map((fy, i) => (
                <line key={i} x1={x - w / 2 - 6} y1={y + fy * h} x2={x - w / 2 - 6 - (i === 1 ? 40 : 28)} y2={y + fy * h}
                    stroke="#9AA7B0" strokeWidth={2} strokeLinecap="round" strokeDasharray="8 7"
                    strokeDashoffset={-phase * 1.5 - i * 5} opacity={Math.min(1, speed * 1.4) * 0.35} />
            ))}
        <g transform={`translate(${x},${y + shakeY}) rotate(${tilt + shakeR})`}>
            <image href={VEHICLE_SRC[mass]} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet"
                transform={VEHICLE_FLIP[mass] ? 'scale(-1,1)' : undefined} />
            {VEHICLE_WHEELS[mass].map((wh, i) => {
                const r = wh.fr * h
                const circ = 2 * Math.PI * r
                const dash = circ / 6 // шаг за кадр (≤4) заметно меньше пол-периода — без стробоскопа
                return (
                    <g key={i}>
                        {/* SVG-окружность рисуется по часовой → уменьшаем offset = колесо крутится по часовой = едет вправо */}
                        <circle cx={-w / 2 + wh.fx * w} cy={-h / 2 + wh.fy * h} r={r} fill="none" stroke="#F2F7FB" strokeWidth={Math.max(1.6, r * 0.16)}
                            strokeDasharray={`${dash * 0.45} ${dash * 0.55}`} strokeDashoffset={-phase} strokeLinecap="round" opacity={0.85} />
                        <circle cx={-w / 2 + wh.fx * w} cy={-h / 2 + wh.fy * h} r={r * 0.55} fill="none" stroke="#F2F7FB" strokeWidth={Math.max(1.2, r * 0.1)}
                            strokeDasharray={`${dash * 0.25} ${dash * 0.3}`} strokeDashoffset={-phase * 0.55} strokeLinecap="round" opacity={0.6} />
                    </g>
                )
            })}
        </g>
        </g>
    )
}

const TrainCylinderView = ({ targetLen, actualLen, mass, svgRef, onDown, dragging }: {
    targetLen: number; actualLen: number; mass: 'light' | 'heavy'
    svgRef: React.RefObject<SVGSVGElement>; onDown: (e: React.PointerEvent) => void; dragging: boolean
}) => {
    const PHI = GGEGE_PALETTE.purple.button
    const xTarget = TR_X0 + targetLen
    const xActual = TR_X0 + actualLen
    const gap = xTarget - xActual
    const showGap = Math.abs(gap) > 8
    const targetDeg = angleOf(targetLen)
    const actualDeg = angleOf(actualLen)
    // Стрелка — цвет Φ (не по массе транспорта!): раскраска по массе
    // конфликтовала с OWN_COLOR у Гелика (тот же raspberry, что и B инд)
    // — стрелка и дуга B инд сливались в один цвет и переставали
    // различаться на глаз. Фиолетовый однозначно свободен от коллизий
    // с любым другим цветом этой сцены и физически точен — стрелка это
    // и есть Φ, просто нарисованная по кругу.
    const needleColor = PHI
    const needleTip = gaugePt(actualDeg, GAUGE_R - 16)
    const ghostTip = gaugePt(targetDeg, GAUGE_R - 16)
    const fraction = Math.max(0, Math.min(1, (actualLen - TR_LMIN) / (TR_LMAX - TR_LMIN)))
    // Наклон иконки транспорта — та же «откидывается против рывка»
    // логика, что и раньше, просто теперь применена к статичной иконке
    // (лёгкий «живой» акцент, а не имитация реального движения).
    // Гелик наклоняется меньше (тяжёлый, низкий центр тяжести)
    const tiltMax = mass === 'heavy' ? 6 : 10
    const tilt = Math.max(-tiltMax, Math.min(tiltMax, -gap * (mass === 'heavy' ? 0.12 : 0.2)))
    // транспорт — крупно под циферблатом, чтобы было видно крутящиеся колёса
    const VSCALE = 1.2
    const iconY = GAUGE_CY + 20 + VEHICLE_DIMS[mass].h * VSCALE / 2 + 12
    const dialArc = gaugeArc(GAUGE_DEG_MIN, GAUGE_DEG_MAX, GAUGE_R)
    const bArc = gaugeArc(targetDeg, actualDeg, GAUGE_R - 34)
    const bMid = gaugePt((targetDeg + actualDeg) / 2, GAUGE_R - 34)
    return (
        <svg ref={svgRef} viewBox={`0 0 ${TR_W} ${TR_H}`} className="w-full max-w-[440px] h-auto select-none" style={{ touchAction: 'none' }}>
            {/* мишень — пунктирный призрак там, где сейчас палец */}
            <FluxCylinder cx={TR_X0 + targetLen / 2} cy={TR_CY} radius={TR_R} depth={TR_D} length={targetLen} orient="h" color="#9AA7B0" fill={0} dashed />
            {/* настоящий поток — с задержкой */}
            <FluxCylinder cx={TR_X0 + actualLen / 2} cy={TR_CY} radius={TR_R} depth={TR_D} length={actualLen} orient="h" color={PHI} />
            <FieldArrow x1={TR_X0 + 4} y1={TR_CY} x2={xActual - 6} y2={TR_CY} color={FIELD_COLOR} width={5} head={8} />
            <ellipse cx={TR_X0} cy={TR_CY} rx={TR_D} ry={TR_R} fill="none" stroke={RING_COLOR} strokeWidth={5} />
            <SvgSticker x={TR_X0 - 2} y={TR_CY + TR_R + 20} text="S" color={RING_COLOR} />
            <SvgSticker x={TR_X0 + 34} y={TR_CY - TR_R - 16} text="Φ" color={PHI} />
            {/* короткий «привод» от цилиндра к спидометру — фиксированная точка, не мишень/актуал */}
            <line x1={GAUGE_CX} y1={TR_CY + TR_R + 6} x2={GAUGE_CX} y2={GAUGE_CY - GAUGE_R - 14} stroke="#5C6B73" strokeWidth={3} strokeDasharray="5 5" />
            {/* циферблат */}
            <path d={dialArc.d} fill="none" stroke="#3A464E" strokeWidth={5} strokeLinecap="round" />
            {GAUGE_TICKS.map((d) => {
                const a = gaugePt(d, GAUGE_R), b = gaugePt(d, GAUGE_R - (d === 0 ? 13 : 8))
                return <line key={d} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9AA7B0" strokeWidth={d === 0 ? 3 : 2} strokeLinecap="round" />
            })}
            <text x={gaugePt(GAUGE_DEG_MIN, GAUGE_R + 20).x} y={gaugePt(GAUGE_DEG_MIN, GAUGE_R + 20).y + 5} textAnchor="middle" fontSize={18} aria-hidden>🐢</text>
            <text x={gaugePt(GAUGE_DEG_MAX, GAUGE_R + 20).x} y={gaugePt(GAUGE_DEG_MAX, GAUGE_R + 20).y + 5} textAnchor="middle" fontSize={18} aria-hidden>💨</text>
            {/* B инд — цветная дуга между мишенью и настоящей скоростью:
                при разгоне (мишень впереди) указывает НАЗАД — «дуло в лицо»,
                при торможении (мишень позади) — ВПЕРЁД — «толкает сзади».
                Направление переключается само — тот же gap, что и раньше. */}
            {showGap && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                    <path d={bArc.d} fill="none" stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" />
                    <g transform={`translate(${bArc.end.x},${bArc.end.y}) rotate(${bArc.ang})`}>
                        <path d="M -11 -9 L 2 0 L -11 9" fill="none" stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <SvgSticker x={bMid.x} y={bMid.y - 16} text="B" color={OWN_COLOR} />
                </motion.g>
            )}
            {/* мишень — пунктирная тонкая стрелка */}
            <line x1={GAUGE_CX} y1={GAUGE_CY} x2={ghostTip.x} y2={ghostTip.y} stroke="#9AA7B0" strokeWidth={2.5} strokeDasharray="4 4" strokeLinecap="round" />
            {/* настоящая стрелка — с задержкой, цвет по выбранному транспорту */}
            <line x1={GAUGE_CX} y1={GAUGE_CY} x2={needleTip.x} y2={needleTip.y} stroke={needleColor} strokeWidth={5} strokeLinecap="round" />
            <circle cx={GAUGE_CX} cy={GAUGE_CY} r={7} fill={needleColor} stroke="#fff" strokeWidth={2} />
            {/* транспорт — статичная иконка под спидометром, с намёком на движение */}
            <Vehicle x={GAUGE_CX} y={iconY} tilt={tilt} mass={mass} speed={fraction} scale={VSCALE} />
            {/* ручка — тащим МИШЕНЬ (педаль газ/тормоз), не саму скорость */}
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
// ===== Метафора 2 (2026-09-30): жёлоб-кольцо, вид сверху =====
// Скорость шарика по кругу = длина цилиндра Φ (Φ ↔ импульс m·v). Кольцо —
// дорога без края: отпустил ручку — шарик держит новую скорость. Лёгкий
// шарик для пинг-понга догоняет «газ» почти сразу, каменный валун — лениво
// (тот же TR_RATE, что у велика/Гелика). У шарика: шлейф (длина = скорость),
// вращающиеся пятна (катится, а не скользит) и стрелка B инд по касательной:
// при разгоне смотрит назад, при торможении — вперёд.
// Прежняя метафора (велик/Гелик + спидометр) сохранена — TrainCylinderView,
// переключатель ELASTIC_METAPHOR ниже.
const ELASTIC_METAPHOR = 'groove' as 'vehicle' | 'groove'
const GR_CX = 240, GR_CY = 322, GR_R = 118, GR_W = 42, GR_H = 470
const GR_BALL_R: Record<'light' | 'heavy', number> = { light: 11, heavy: 18 }
// Цилиндр в жёлобе: кольцо S стоит правее (GR_RX), слева — МАГНИТ, северным
// полюсом к кольцу. Его поле проходит сквозь кольцо вправо = цилиндр Φ. Ручка —
// сам магнит: ближе к кольцу → B больше → цилиндр длиннее → шарик быстрее
// (просьба пользователя: «мы же двигаем магнит», а не тянем дно цилиндра).
// Длина цилиндра на экране = len · GR_SCALE (чтобы влезли магнит и цилиндр).
const GR_RX = 205, GR_SCALE = 0.78
const GR_MAG_W = 64, GR_MAG_H = 30
const GR_MAG_MIN = 42, GR_MAG_MAX = GR_RX - 16 - GR_MAG_W / 2 // центр магнита: далеко … вплотную
const lenToMagX = (len: number) => GR_MAG_MIN + ((len - TR_LMIN) / (TR_LMAX - TR_LMIN)) * (GR_MAG_MAX - GR_MAG_MIN)
const grooveXToLen = (x: number) => {
    const f = Math.max(0, Math.min(1, (x - GR_MAG_MIN) / (GR_MAG_MAX - GR_MAG_MIN)))
    return TR_LMIN + f * (TR_LMAX - TR_LMIN)
}
const GR_LAP_TICKS = 140 // полный круг на максимальной скорости ≈ 2.2 с (тик 16 мс)
const grPt = (a: number, r: number) => ({ x: GR_CX + r * Math.cos(a), y: GR_CY + r * Math.sin(a) })
// дуга по часовой (угол растёт) от a1 до a2 на радиусе r
const grArc = (a1: number, a2: number, r: number) => {
    const p1 = grPt(a1, r), p2 = grPt(a2, r)
    const large = a2 - a1 > Math.PI ? 1 : 0
    return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
}

type GrooveZone = { center: number; half: number; inside: boolean }
const GrooveView = ({ targetLen, actualLen, mass, svgRef, onDown, dragging, angRef, zone, startAng = -Math.PI / 2, center }: {
    targetLen: number; actualLen: number; mass: 'light' | 'heavy'
    svgRef: React.RefObject<SVGSVGElement>; onDown: (e: React.PointerEvent) => void; dragging: boolean
    angRef?: React.MutableRefObject<number>; zone?: GrooveZone; startAng?: number; center?: React.ReactNode
}) => {
    const PHI = GGEGE_PALETTE.purple.button
    const dT = targetLen * GR_SCALE, dA = actualLen * GR_SCALE
    const xTarget = GR_RX + dT
    const xActual = GR_RX + dA
    const magX = lenToMagX(targetLen)
    const speed = Math.max(0, Math.min(1, (actualLen - TR_LMIN) / (TR_LMAX - TR_LMIN)))
    const gap = targetLen - actualLen
    // угол шарика копится своим интервалом — катится и при постоянной скорости
    const speedRef = useRef(speed)
    speedRef.current = speed
    const [ang, setAng] = useState(startAng)
    const angLocal = useRef(startAng)
    useEffect(() => {
        const id = setInterval(() => {
            const v = speedRef.current
            if (v > 0.005) {
                angLocal.current += (v * 2 * Math.PI) / GR_LAP_TICKS
                if (angRef) angRef.current = angLocal.current
                setAng(angLocal.current)
            }
        }, 16)
        return () => clearInterval(id)
    }, [angRef])
    const br = GR_BALL_R[mass]
    const heavy = mass === 'heavy'
    // валун чуть «гуляет» поперёк жёлоба — тяжёлый, трётся о стенки
    const wobble = heavy ? Math.sin(ang * 23) * speed * 1.5 : 0
    const ball = grPt(ang, GR_R + wobble)
    // «катится»: поворот пятен = пройденный путь / радиус шарика
    const spinDeg = ((ang * GR_R) / br) * (180 / Math.PI)
    const trailLen = speed * 1.1 // рад
    // касательная по ходу движения (по часовой): (-sin, cos)
    const fx = -Math.sin(ang), fy = Math.cos(ang)
    const showB = Math.abs(gap) > 8
    const bLen = Math.min(78, Math.abs(gap) * 0.45 + 18)
    const bDir = gap > 0 ? -1 : 1 // разгон → назад, торможение → вперёд
    const bBase = grPt(ang, GR_R + GR_W / 2 + 16)
    const bTip = { x: bBase.x + fx * bDir * bLen, y: bBase.y + fy * bDir * bLen }
    const bAng = (Math.atan2(fy * bDir, fx * bDir) * 180) / Math.PI
    const ballFill = heavy ? '#7E868B' : '#F2F7FB'
    const trailColor = heavy ? '#9AA7B0' : '#F2F7FB'
    return (
        <svg ref={svgRef} viewBox={`0 0 ${TR_W} ${GR_H}`} className="w-full max-w-[440px] h-auto select-none" style={{ touchAction: 'none' }}>
            {/* цилиндр потока — «газ»: его длина = скорость, к которой стремится шарик */}
            <FluxCylinder cx={GR_RX + dT / 2} cy={TR_CY} radius={TR_R} depth={TR_D} length={dT} orient="h" color="#9AA7B0" fill={0} dashed />
            <FluxCylinder cx={GR_RX + dA / 2} cy={TR_CY} radius={TR_R} depth={TR_D} length={dA} orient="h" color={PHI} />
            <FieldArrow x1={GR_RX + 4} y1={TR_CY} x2={xActual - 6} y2={TR_CY} color={FIELD_COLOR} width={5} head={8} />
            <ellipse cx={GR_RX} cy={TR_CY} rx={TR_D} ry={TR_R} fill="none" stroke={RING_COLOR} strokeWidth={5} />
            {dA > 70 && <SvgSticker x={GR_RX + dA / 2} y={TR_CY - 17} text="B" color={FIELD_COLOR} />}
            <SvgSticker x={GR_RX - 2} y={TR_CY + TR_R + 20} text="S" color={RING_COLOR} />
            <SvgSticker x={GR_RX + 30} y={TR_CY - TR_R - 16} text="Φ" color={PHI} />
            {/* поле магнита до кольца — бледный пунктир */}
            <line x1={magX + GR_MAG_W / 2 + 4} y1={TR_CY} x2={GR_RX - 8} y2={TR_CY} stroke={FIELD_COLOR} strokeWidth={3} strokeDasharray="4 6" opacity={0.5} />
            {/* B инд у цилиндра — от «хочу» (призрак) к настоящему потоку: тянет поток назад
                при разгоне и вперёд при торможении — мешает ему меняться */}
            {Math.abs(gap) > 8 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                    <HArrow x1={xTarget} x2={xActual + (xTarget > xActual ? 3 : -3)} y={TR_CY + TR_R + 26} color={OWN_COLOR} width={5} />
                    <SvgSticker x={(xTarget + xActual) / 2} y={TR_CY + TR_R + 46} text="B" sub="инд" color={OWN_COLOR} />
                </motion.g>
            )}
            {/* жёлоб — вид сверху */}
            <circle cx={GR_CX} cy={GR_CY} r={GR_R} fill="none" stroke="#3A464E" strokeWidth={GR_W + 6} />
            <circle cx={GR_CX} cy={GR_CY} r={GR_R} fill="none" stroke="#1B262B" strokeWidth={GR_W} />
            <circle cx={GR_CX} cy={GR_CY} r={GR_R} fill="none" stroke="#26343A" strokeWidth={2} strokeDasharray="3 10" />
            {zone && (
                <path d={grArc(zone.center - zone.half, zone.center + zone.half, GR_R)} fill="none"
                    stroke={zone.inside ? GGEGE_PALETTE.green.button : RULE_COLOR} strokeWidth={GR_W - 4} opacity={0.35} />
            )}
            {center && <g transform={`translate(${GR_CX},${GR_CY})`}>{center}</g>}
            {/* шлейф — длина = скорость; три слоя, ярче у самого шарика */}
            {speed > 0.02 && [1, 0.6, 0.3].map((k, i) => (
                <path key={i} d={grArc(ang - trailLen * k, ang, GR_R)} fill="none" stroke={trailColor}
                    strokeWidth={br * 1.3} strokeLinecap="round" opacity={0.1 + i * 0.08} />
            ))}
            {/* шарик / валун */}
            <g transform={`translate(${ball.x.toFixed(1)},${ball.y.toFixed(1)})`}>
                <circle r={br + 2} fill="#000" opacity={0.25} transform="translate(2,3)" />
                <circle r={br} fill={ballFill} stroke={heavy ? '#4E5559' : '#C9D3D9'} strokeWidth={2} />
                <g transform={`rotate(${spinDeg.toFixed(1)})`}>
                    {heavy ? (
                        <>
                            <path d={`M ${-br * 0.6} ${-br * 0.2} L ${-br * 0.1} ${br * 0.15} L ${br * 0.3} ${-br * 0.35}`} fill="none" stroke="#4E5559" strokeWidth={2} strokeLinecap="round" />
                            <circle cx={br * 0.35} cy={br * 0.45} r={br * 0.18} fill="#5F676B" />
                            <circle cx={-br * 0.45} cy={br * 0.5} r={br * 0.12} fill="#5F676B" />
                        </>
                    ) : (
                        <>
                            <circle cx={br * 0.45} cy={0} r={br * 0.22} fill={GGEGE_PALETTE.orange.button} />
                            <circle cx={-br * 0.45} cy={0} r={br * 0.22} fill={GGEGE_PALETTE.orange.button} opacity={0.6} />
                        </>
                    )}
                </g>
            </g>
            {/* B инд — по касательной у шарика, снаружи жёлоба */}
            {showB && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                    <line x1={bBase.x} y1={bBase.y} x2={bTip.x} y2={bTip.y} stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" />
                    <g transform={`translate(${bTip.x},${bTip.y}) rotate(${bAng})`}>
                        <path d="M -11 -9 L 2 0 L -11 9" fill="none" stroke={OWN_COLOR} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <SvgSticker x={(bBase.x + bTip.x) / 2 + (bBase.x - GR_CX) * 0.14} y={(bBase.y + bTip.y) / 2 + (bBase.y - GR_CY) * 0.14} text="B" color={OWN_COLOR} />
                </motion.g>
            )}
            {/* МАГНИТ — ручка: двигаешь к кольцу / от кольца */}
            <g onPointerDown={onDown} style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
                {!dragging && (
                    <motion.rect x={magX - GR_MAG_W / 2 - 4} y={TR_CY - GR_MAG_H / 2 - 4} width={GR_MAG_W + 8} height={GR_MAG_H + 8} rx={10}
                        fill="none" stroke={RULE_COLOR} strokeWidth={3}
                        animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.3, repeat: Infinity }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                )}
                <rect x={magX - GR_MAG_W / 2} y={TR_CY - GR_MAG_H / 2} width={GR_MAG_W / 2} height={GR_MAG_H} rx={5} fill={SOUTH_COLOR} />
                <rect x={magX} y={TR_CY - GR_MAG_H / 2} width={GR_MAG_W / 2} height={GR_MAG_H} rx={5} fill={NORTH_COLOR} />
                <text x={magX - GR_MAG_W / 4} y={TR_CY + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff">S</text>
                <text x={magX + GR_MAG_W / 4} y={TR_CY + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff">N</text>
                <rect x={magX - GR_MAG_W / 2 - 14} y={TR_CY - GR_MAG_H / 2 - 22} width={GR_MAG_W + 28} height={GR_MAG_H + 44} fill="transparent" />
            </g>
        </svg>
    )
}

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

// ===== Лесенка к жёлобу (2026-10-01): просьба пользователя — «проще, линейнее,
// меньше слов, на каждом шаге проверка понимания». Сначала «поток = движение»,
// потом чистая механика «лёгкое/тяжёлое», и только потом всё вместе с магнитом.

// Мини-проверка: вопросы по одному, два варианта; ошибка — красная вспышка и
// «ещё раз» (в ошибки урока НЕ идёт, как и остальные мини-игры).
type MiniQ = { q: React.ReactNode; options: React.ReactNode[]; correct: number }
const MiniQuiz = ({ questions, onDone }: { questions: MiniQ[]; onDone: () => void }) => {
    const [idx, setIdx] = useState(0)
    const [wrong, setWrong] = useState<number | null>(null)
    const [right, setRight] = useState(false)
    const doneRef = useRef(false)
    const q = questions[Math.min(idx, questions.length - 1)]
    const pick = (i: number) => {
        if (right) return
        if (i !== q.correct) {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false); setWrong(i); setTimeout(() => setWrong(null), 700); return
        }
        setRight(true)
        setTimeout(() => {
            setRight(false)
            if (idx + 1 >= questions.length) { if (!doneRef.current) { doneRef.current = true; onDone() } }
            setIdx((x) => Math.min(x + 1, questions.length))
        }, 750)
    }
    if (idx >= questions.length) {
        return <div className="w-full text-center text-lg font-black" style={{ color: GGEGE_PALETTE.green.button }}>✅ Всё верно!</div>
    }
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div className="text-xs font-black text-[#9AA7B0]">Проверка {idx + 1}/{questions.length}</div>
            <div className="text-lg font-black text-center">{q.q}</div>
            <div className="flex gap-2 w-full">
                {q.options.map((o, i) => {
                    const isRight = right && i === q.correct, isWrong = wrong === i
                    const col = isRight ? GGEGE_PALETTE.green.button : isWrong ? '#DC605B' : '#3A464E'
                    return (
                        <motion.button key={`${idx}-${i}`} type="button" onClick={() => pick(i)}
                            animate={isWrong ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.35 }}
                            className="flex-1 rounded-2xl border-2 border-b-4 px-3 py-3 text-base font-black text-white active:border-b-2"
                            style={{ borderColor: col, backgroundColor: isRight || isWrong ? hexToRgba(col, 0.2) : '#161F23' }}>
                            {o}
                        </motion.button>
                    )
                })}
            </div>
            {wrong !== null && <div className="text-sm font-black" style={{ color: '#DC605B' }}>Не-а, попробуй ещё 🙃</div>}
        </div>
    )
}

// Кольцо-жёлоб с шариком (вид сверху) — простая версия без магнита/цилиндра.
// speed 0..1 = линейная скорость (одинаковая «на вид» при любом радиусе).
const MiniRingTrack = ({ cx, cy, r, mass, speed }: { cx: number; cy: number; r: number; mass: 'light' | 'heavy'; speed: number }) => {
    const speedRef = useRef(speed)
    speedRef.current = speed
    const angRef = useRef(-Math.PI / 2)
    const [ang, setAng] = useState(-Math.PI / 2)
    useEffect(() => {
        const id = setInterval(() => {
            const v = speedRef.current
            if (v > 0.005) { angRef.current += ((v * 2 * Math.PI) / GR_LAP_TICKS) * (GR_R / r); setAng(angRef.current) }
        }, 16)
        return () => clearInterval(id)
    }, [r])
    const heavy = mass === 'heavy', br = GR_BALL_R[mass] * (r < 100 ? 0.85 : 1), W = 34
    const p = { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) }
    const trail = speed * 1.1 * (GR_R / r)
    const t0 = { x: cx + r * Math.cos(ang - trail), y: cy + r * Math.sin(ang - trail) }
    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3A464E" strokeWidth={W + 6} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1B262B" strokeWidth={W} />
            {speed > 0.02 && <path d={`M ${t0.x} ${t0.y} A ${r} ${r} 0 ${trail > Math.PI ? 1 : 0} 1 ${p.x} ${p.y}`} fill="none"
                stroke={heavy ? '#9AA7B0' : '#F2F7FB'} strokeWidth={br * 1.3} strokeLinecap="round" opacity={0.22} />}
            <circle cx={p.x} cy={p.y} r={br} fill={heavy ? '#7E868B' : '#F2F7FB'} stroke={heavy ? '#4E5559' : '#C9D3D9'} strokeWidth={2} />
        </g>
    )
}
const SpeedBar = ({ v, color, label }: { v: number; color: string; label: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-sm font-black w-full">
        <span className="shrink-0 w-16">{label}</span>
        <div className="h-3 flex-1 rounded-full bg-[#26343A] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.round(v * 100)}%`, backgroundColor: color }} />
        </div>
    </div>
)

// Ступенька 1: «Есть поток — есть движение». Три уровня Φ, шарик едет с той же скоростью.
const PHI_LEVELS = [0, 0.3, 0.9]
const FLUX_MOTION_QUIZ: MiniQ[] = [
    { q: <>Поток <b>Φ = 0</b>. Шарик…</>, options: ['😴 стоит', '🏃 катится'], correct: 0 },
    { q: <>Поток <b>больше</b> → шарик…</>, options: ['🐢 медленнее', '🚀 быстрее'], correct: 1 },
]
const FluxMotionScene = ({ onSettled }: { onSettled?: () => void }) => {
    const PHI = GGEGE_PALETTE.purple.button
    const [phase, setPhase] = useState(0)
    const [level, setLevel] = useState(0)
    const [tried, setTried] = useState<boolean[]>([false, false, false])
    const [v, setV] = useState(0)
    const vRef = useRef(0), tgtRef = useRef(0)
    useEffect(() => {
        const id = setInterval(() => {
            const d = tgtRef.current - vRef.current
            if (Math.abs(d) < 0.003) return
            vRef.current += d * 0.12; setV(vRef.current)
        }, 16)
        return () => clearInterval(id)
    }, [])
    const pick = (i: number) => { setLevel(i); tgtRef.current = PHI_LEVELS[i]; setTried((t) => t.map((x, k) => x || k === i)) }
    const allTried = tried.every(Boolean)
    useEffect(() => { if (allTried && phase === 1) { const t = setTimeout(() => setPhase(2), 900); return () => clearTimeout(t) } }, [allTried, phase])
    const len = 12 + v * 230
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Поток ' }, { sticker: 'Φ', color: PHI }, { text: ' — как скорость шарика. Есть поток — есть ' }, { bold: 'движение' }, { text: '.' }]}
                onSettled={() => setPhase((p) => Math.max(p, 1))}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <svg viewBox="0 0 480 400" className="w-full max-w-[400px] h-auto select-none">
                            <FluxCylinder cx={120 + len / 2} cy={56} radius={30} depth={9} length={len} orient="h" color={PHI} />
                            <ellipse cx={120} cy={56} rx={9} ry={30} fill="none" stroke={RING_COLOR} strokeWidth={4} />
                            <SvgSticker x={92} y={56} text="Φ" color={PHI} />
                            <MiniRingTrack cx={240} cy={255} r={110} mass="light" speed={v} />
                        </svg>
                        <div className="flex gap-2 w-full">
                            {['Φ = 0', 'мало', 'много'].map((t, i) => (
                                <MassBtn key={i} active={level === i} pulse={!tried[i]} color={PHI} onClick={() => pick(i)}>{t}</MassBtn>
                            ))}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <DiagramBlock>
                    <MiniQuiz questions={FLUX_MOTION_QUIZ} onDone={() => setTimeout(() => onSettled?.(), 600)} />
                </DiagramBlock>
            )}
        </>
    )
}

// Ступенька 2: чистая механика. Два одинаковых кольца: ⚪ шарик и 🪨 валун.
// «Разогнать» — оба тянутся к максимуму, «Тормоз» — к нулю. Шарик — сразу, валун — лениво.
const MASS_RATE: Record<'light' | 'heavy', number> = { light: 0.09, heavy: 0.012 }
const MASS_QUIZ: MiniQ[] = [
    { q: 'Кого легче разогнать?', options: ['⚪ шарик', '🪨 валун'], correct: 0 },
    { q: 'Кого труднее остановить?', options: ['⚪ шарик', '🪨 валун'], correct: 1 },
]
const MassScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 интро · 1 «разогнать» · 2 разгон · 3 «тормоз» · 4 тормозят · 5 проверка
    const [vs, setVs] = useState({ light: 0, heavy: 0 })
    const vRef = useRef({ light: 0, heavy: 0 }), tgt = useRef(0)
    useEffect(() => {
        const id = setInterval(() => {
            const n = { ...vRef.current }
            let changed = false
            for (const m of ['light', 'heavy'] as const) {
                const d = tgt.current - n[m]
                if (Math.abs(d) < 0.004) { if (n[m] !== tgt.current) { n[m] = tgt.current; changed = true } continue }
                n[m] += d * MASS_RATE[m]; changed = true
            }
            if (changed) { vRef.current = n; setVs(n) }
        }, 16)
        return () => clearInterval(id)
    }, [])
    useEffect(() => { if (phase === 2 && vs.heavy > 0.9) setPhase(3) }, [phase, vs.heavy])
    useEffect(() => { if (phase === 4 && vs.heavy < 0.04) setPhase(5) }, [phase, vs.heavy])
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Теперь просто механика. ⚪ Лёгкий шарик и 🪨 тяжёлый валун.' }]}
                onSettled={() => setPhase((p) => Math.max(p, 1))}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <svg viewBox="0 0 480 220" className="w-full max-w-[420px] h-auto select-none">
                            <MiniRingTrack cx={122} cy={110} r={82} mass="light" speed={vs.light} />
                            <MiniRingTrack cx={358} cy={110} r={82} mass="heavy" speed={vs.heavy} />
                            <text x={122} y={116} textAnchor="middle" fontSize={26}>⚪</text>
                            <text x={358} y={118} textAnchor="middle" fontSize={26}>🪨</text>
                        </svg>
                        <div className="w-full max-w-[360px] space-y-1.5">
                            <SpeedBar v={vs.light} color="#F2F7FB" label="⚪ скорость" />
                            <SpeedBar v={vs.heavy} color="#9AA7B0" label="🪨 скорость" />
                        </div>
                        {phase === 1 && <ReplyBtn color={GGEGE_PALETTE.green.button} onClick={() => { tgt.current = 1; setPhase(2) }}>💨 Разогнать</ReplyBtn>}
                        {phase === 3 && <ReplyBtn color="#DC605B" onClick={() => { tgt.current = 0; setPhase(4) }}>🛑 Тормоз</ReplyBtn>}
                        {(phase === 2 || phase === 4) && <p className="text-sm font-black text-[#9AA7B0]">Смотри на валун 👀</p>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 5 && (
                <DiagramBlock>
                    <MiniQuiz questions={MASS_QUIZ} onDone={() => setTimeout(() => onSettled?.(), 600)} />
                </DiagramBlock>
            )}
        </>
    )
}

// Проверка после «всё вместе» (жёлоб с магнитом).
const MASS_LINK_QUIZ: MiniQ[] = [
    { q: 'Индуктивность — это как…', options: ['🏋️ масса', '🎨 цвет'], correct: 0 },
    { q: 'Индуктивность большая. Поток меняется…', options: ['⚡ мгновенно', '😴 лениво'], correct: 1 },
]

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
            if (actualRef.current === targetRef.current) return
            actualRef.current = chaseStep(actualRef.current, targetRef.current, massRef.current)
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
        const raw = ELASTIC_METAPHOR === 'groove' ? grooveXToLen(x) : Math.max(TR_LMIN, Math.min(TR_LMAX, x - TR_X0))
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

    const G = ELASTIC_METAPHOR === 'groove'
    const hint = !tried.light ? (G ? '⚪ Шарик уже выбран — двигай магнит к кольцу (газ) или от кольца (тормоз)' : '🚲 Велик уже выбран — тяни цилиндр вправо (газ) или влево (тормоз)')
        : !tried.heavy ? (G ? 'Теперь переключи на 🪨 Валун и дёрни резко' : 'Теперь переключи на 🚙 Гелик и дёрни резко')
            : ''

    return (
        <>
            <TypedLineWithParts
                parts={G
                    ? [{ text: 'Всё вместе: двигай 🧲 магнит → меняется поток ' }, { sticker: 'Φ', color: GGEGE_PALETTE.purple.button }, { text: '.' }]
                    : [{ text: 'Приделаем к потоку ' }, { sticker: 'Φ', color: GGEGE_PALETTE.purple.button }, { text: ' спидометр 🚲🚙 — тянешь цилиндр, стрелка следует за рукой' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: 'none' }}>
                        {G
                            ? <GrooveView targetLen={targetLen} actualLen={actualLen} mass={mass} svgRef={svgRef} onDown={onDown} dragging={dragging} />
                            : <TrainCylinderView targetLen={targetLen} actualLen={actualLen} mass={mass} svgRef={svgRef} onDown={onDown} dragging={dragging} />}
                        <div className="flex gap-2 w-full">
                            <MassBtn active={mass === 'light'} pulse={!tried.light} color={GGEGE_PALETTE.green.button} onClick={() => pickMass('light')}>{G ? '⚪ Шарик' : '🚲 Велик'}</MassBtn>
                            <MassBtn active={mass === 'heavy'} pulse={tried.light && !tried.heavy} color={CURRENT_COLOR} onClick={() => pickMass('heavy')}>{G ? '🪨 Валун' : '🚙 Гелик'}</MassBtn>
                        </div>
                        {hint && <p className="text-sm font-black text-center" style={{ color: RULE_COLOR }}>{hint}</p>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(3), 1200)}>
                    <InsightCard>
                        <InsightWord color="#FF9AC8">Индуктивность</InsightWord> — как <InsightWord color="#D8BBFF">МАССА</InsightWord>.
                        <br />{G ? '⚪ Лёгкий шарик' : '🚲 Велик лёгкий'} — его скорость менять <InsightWord>легко</InsightWord>.
                        <br />{G ? '🪨 Тяжёлый валун' : '🚙 Гелик тяжёлый'} — его тяжело разогнать/затормозить.
                        <br />Именно <InsightWord color="#FF9AC8">ИНДУКТИВНОСТЬ</InsightWord> мешает <InsightWord>РЕЗКО</InsightWord> менять скорость.
                    </InsightCard>
                </DiagramBlock>
            )}
            {/* Закрываем крючок из HookScene: старый «закон» (поток НЕ должен
                меняться) на самом деле неточный — исправляем его тем же
                визуальным языком (перечёркнутая красная плашка → новая). */}
            {phase >= 3 && (
                <DiagramBlock>
                    <MiniQuiz questions={MASS_LINK_QUIZ} onDone={() => setPhase((p) => Math.max(p, 4))} />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1600)}>
                    <div className="w-full rounded-xl border-2 px-4 py-3 text-center" style={{ borderColor: REMEMBER_COLOR, backgroundColor: hexToRgba(REMEMBER_COLOR, 0.12) }}>
                        <div className="text-sm font-bold" style={{ color: '#F2F7FB' }}>
                            Поток НЕ ЛЮБИТ МЕНЯТЬСЯ
                        </div>
                        <div className="mt-1 text-lg font-black" style={{ color: REMEMBER_COLOR }}>
                            Меняется очень неохотно, <span className="underline">лениво</span> 😴
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
                parts={[{ text: 'Помнишь? Поток ' }, { sticker: 'Φ', color: PHI }, { text: ' ' }, { bold: 'НЕ ЛЮБИТ МЕНЯТЬСЯ' }, { text: '!' }]}
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
                    parts={[{ text: 'Но что если… нам ' }, { bold: 'захочется' }, { text: ' его всё-таки поменять? 😈' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 1.5. «Индуктивность у человека» — та же идея, но с ДРУГОГО угла
// (просьба пользователя, жизненная метафора). Ключевая мысль: индуктивность
// мешает не самому потоку (человек прекрасно «живёт» и сидя, и гуляя), а
// именно РЕЗКОЙ СМЕНЕ потока — в любую сторону. Ровно как залипание в
// скролле: пока действие устоялось — сопротивления нет вообще, оно
// появляется только в момент резкого «выключить»/«включить».
// Видео-реакция внутри сцены «залипания»: играет ОДИН раз и останавливается
// на последнем кадре; по окончании — следующая фраза (страховочный таймер, если
// автозапуск заблокирован). Всё, что уже было, тускнеет — внимание на новом.
const StuckVideo = ({ src, onEnded }: { src: string; onEnded: () => void }) => {
    const done = useRef(false)
    const fire = () => { if (!done.current) { done.current = true; setTimeout(onEnded, 400) } }
    useEffect(() => { const t = setTimeout(fire, 9000); return () => clearTimeout(t) })
    return (
        <video src={src} autoPlay muted playsInline onEnded={fire}
            className="pointer-events-none mx-auto w-full max-w-[240px] rounded-2xl object-cover" />
    )
}
const StuckScene = ({ onSettled }: { onSettled?: () => void }) => {
    // 0 интро · 1 «залип» · 2 капибара · 3 «выдёргивают» · 4 чику · 5 «гулять» · 6 Понасенков · 7 «тащат обратно» · 8 злой Понасенков · 9 вывод
    const [phase, setPhase] = useState(0)
    const next = (n: number, delay = 0) => () => setTimeout(() => setPhase((p) => Math.max(p, n)), delay)
    // «такт» = фраза + её видео; всё из прошлых тактов — тусклое
    const beat = (ph: number) => (ph === 0 ? -1 : Math.floor((ph - 1) / 2))
    const curBeat = phase >= 9 ? 99 : beat(phase)
    const dim = (ph: number) => ({ opacity: beat(ph) < curBeat ? 0.35 : 1, transition: 'opacity 0.5s' })
    const vid = (at: number, src: string) => phase >= at && (
        <div style={dim(at)}>
            <DiagramBlock>
                <StuckVideo src={src} onEnded={next(at + 1)} />
            </DiagramBlock>
        </div>
    )
    const line = (at: number, text: string, then: number) => phase >= at && (
        <div style={dim(at)}>
            <TypedLineWithParts parts={[{ text }]} onSettled={next(then)} />
        </div>
    )
    return (
        <>
            <div style={dim(0)}>
                <TypedLineWithParts
                    parts={[{ text: 'А теперь та же ' }, { sticker: 'индуктивность', color: OWN_COLOR }, { text: ', только у ЧЕЛОВЕКА 📱' }]}
                    onSettled={next(1)}
                />
            </div>
            {line(1, 'Ты на пару часов залип на чиле — поток идёт ровно, никто не мешает 😌', 2)}
            {vid(2, '/video/stuck-kapibara.webm')}
            {line(3, 'Тебя РЕЗКО выдёргивают — «Хорош сидеть!» Ты сопротивляешься 😤', 4)}
            {vid(4, '/video/stuck-angry-chikoo.mp4')}
            {line(5, 'Встал, пошёл гулять — наслаждаешься прогулочкой 🚶', 6)}
            {vid(6, '/video/stuck-ponasenkov.mp4')}
            {line(7, 'И тут тебя РЕЗКО тащат обратно ДОМОЙ. Ты СНОВА сопротивляешься 😤', 8)}
            {vid(8, '/video/stuck-ponasenkov-angry.mp4')}
            {phase >= 9 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1400)}>
                    <InsightCard>
                        Дело не в том, что лень <InsightWord>ДВИГАТЬСЯ</InsightWord> — ты и сидел, и шёл, оба состояния «жили» спокойно.
                        <br />Дело в том, что лень <InsightWord color="#FF9AC8">МЕНЯТЬ</InsightWord> то, что уже идёт — в любую сторону.
                        <br />Это и есть <InsightWord color="#D8BBFF">индуктивность</InsightWord>: сопротивление РЕЗКОЙ смене, а не самому потоку.
                    </InsightCard>
                </DiagramBlock>
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
// Рука — как в уроке «Направление магнитного поля» (DIRWALK): та же картинка
// public/hands/grip-up.webp (обхват, большой палец строго вертикален, пальцы
// спереди идут вправо). Здесь «провод» — ось кольца со стрелкой B инд: палец
// вдоль B инд, пальцы — по току кольца. Доли axis/ring — из DIRWALK (HG_IMG.up).
const WHO_HAND_W = 200, WHO_HAND_H = WHO_HAND_W * 442 / 380
const WHO_HAND_X = WHO_CX - 0.471 * WHO_HAND_W, WHO_HAND_Y = WHO_CY - 0.5 * WHO_HAND_H
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
                        <svg viewBox="0 0 320 290" className="w-full max-w-[320px] h-auto">
                            <path d={back} fill="none" stroke={ringCol} strokeWidth={7} strokeLinecap="round" />
                            {handPhase >= 1 && (
                                <motion.image href="/hands/grip-up.webp" x={WHO_HAND_X} y={WHO_HAND_Y} width={WHO_HAND_W} height={WHO_HAND_H}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} />
                            )}
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
                                    <g transform={`translate(${WHO_CX - WHO_RX - 2},${WHO_CY + WHO_RY + 22})`}>
                                        <PulseSticker text="I" sub="инд" color={CURRENT_COLOR} />
                                    </g>
                                </>
                            )}
                            {handPhase >= 2 && (
                                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                                    <SvgSticker x={WHO_CX - 50} y={WHO_CY - 96} text="B" sub="инд" color={OWN_COLOR} />
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
                    <InsightCard label="Цепочка защиты">
                        Φ пытается измениться →<br />
                        в кольце включается <Sticker value="ток I" color={CURRENT_COLOR} /> →<br />
                        ток создаёт <Sticker value="ИНДУКЦИОННОЕ ПОЛЕ B" color={OWN_COLOR} /> →<br />
                        и поток <InsightWord>мЕЕЕЕдленно, неохотно</InsightWord> начинает меняться.
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

// ===== Игры на жёлобе (2026-09-30) =====
// Общая ручка цилиндра Φ + погоня настоящего потока за «газом».
const useFluxHandle = (mass: 'light' | 'heavy', initial = TR_L0, initialActual = initial) => {
    const [targetLen, setTargetLen] = useState(initial)
    const [actualLen, setActualLen] = useState(initialActual)
    const [dragging, setDragging] = useState(false)
    const svgRef = useRef<SVGSVGElement>(null)
    const targetRef = useRef(initial)
    const actualRef = useRef(initialActual)
    const massRef = useRef(mass)
    massRef.current = mass
    useEffect(() => {
        const timer = setInterval(() => {
            if (actualRef.current === targetRef.current) return
            actualRef.current = chaseStep(actualRef.current, targetRef.current, massRef.current)
            setActualLen(actualRef.current)
        }, 16)
        return () => clearInterval(timer)
    }, [])
    const reset = (len: number) => {
        targetRef.current = len; actualRef.current = len
        setTargetLen(len); setActualLen(len)
    }
    const onDown = (e: React.PointerEvent) => {
        e.preventDefault()
        svgRef.current?.setPointerCapture?.(e.pointerId)
        setDragging(true)
    }
    const onMove = (e: React.PointerEvent) => {
        if (!dragging) return
        const svg = svgRef.current, ctm = svg?.getScreenCTM()
        if (!svg || !ctm) return
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
        const x = pt.matrixTransform(ctm.inverse()).x
        const raw = grooveXToLen(x)
        targetRef.current = raw; setTargetLen(raw)
    }
    const onUp = () => setDragging(false)
    return { targetLen, actualLen, dragging, svgRef, onDown, onMove, onUp, reset, actualRef }
}
const lenToSpeed = (len: number) => Math.max(0, Math.min(1, (len - TR_LMIN) / (TR_LMAX - TR_LMIN)))
const speedToLen = (v: number) => TR_LMIN + v * (TR_LMAX - TR_LMIN)

// Мини-игра «Удержи в зоне»: по жёлобу едет подсвеченный сектор, его скорость
// плавно меняется. Ручкой Φ держи шарик внутри 5 секунд. С шариком легко, с
// валуном — надо газовать и тормозить ЗАРАНЕЕ.
const ZONE_GOAL_TICKS = 5000 / 16
// 2026-09-30: шарику зону шире (легче), валуну уже (труднее) — по просьбе пользователя.
const ZONE_HALF: Record<'light' | 'heavy', number> = { light: 0.55, heavy: 0.45 }
// Скорость зоны меняется РЫВКАМИ каждые 3.5 с (за 0.5 с). Шарик успевает сразу,
// валун — только если газовать/тормозить с запасом (проверено симуляцией:
// «повторяй скорость зоны» на валуне не проходит, «перегазуй» — за ~10 с).
const ZONE_SEQ = [0.35, 0.8, 0.3, 0.9, 0.25, 0.75, 0.4, 0.85]
const ZONE_SEG = 3.5, ZONE_RAMP = 0.5
const zoneSpeedAt = (t: number) => {
    const i = Math.floor(t / ZONE_SEG), f = t - i * ZONE_SEG
    const cur = ZONE_SEQ[i % ZONE_SEQ.length]
    if (i === 0 || f >= ZONE_RAMP) return cur
    const prev = ZONE_SEQ[(i - 1) % ZONE_SEQ.length]
    return prev + (cur - prev) * (f / ZONE_RAMP)
}
// Индикатор в центре кольца (туда и смотрит игрок): зелёная галочка / красный
// пульсирующий крестик + кольцо прогресса 5 секунд вокруг.
const ZoneCenter = ({ inside, prog, won }: { inside: boolean; prog: number; won: boolean }) => {
    const R = 46, C = 2 * Math.PI * R
    const ok = inside || won
    const col = ok ? GGEGE_PALETTE.green.button : '#DC605B'
    return (
        <g>
            <circle r={R} fill="none" stroke="#26343A" strokeWidth={8} />
            <circle r={R} fill="none" stroke={GGEGE_PALETTE.green.button} strokeWidth={8} strokeLinecap="round"
                strokeDasharray={`${C * prog} ${C}`} transform="rotate(-90)" />
            {ok ? (
                <path d="M -18 0 L -5 13 L 20 -14" fill="none" stroke={col} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
                <motion.g animate={{ scale: [1, 1.25, 1], opacity: [1, 0.55, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                    <path d="M -15 -15 L 15 15 M 15 -15 L -15 15" fill="none" stroke={col} strokeWidth={9} strokeLinecap="round" />
                </motion.g>
            )}
            {won && <text y={R + 30} textAnchor="middle" fontSize={18} fontWeight={900} fill={GGEGE_PALETTE.green.button}>🏆 Зачёт!</text>}
        </g>
    )
}
const ZoneRound = ({ mass, onWin }: { mass: 'light' | 'heavy'; onWin: () => void }) => {
    const V0 = 0.35
    // Старт со случайным СИЛЬНЫМ толчком: шарик на другой стороне кольца от зоны
    // и летит либо почти на максимуме, либо почти стоит — сразу надо бороться.
    const [kick] = useState(() => ({
        ang: -Math.PI / 2 + Math.PI * (0.65 + Math.random() * 0.7),
        v: Math.random() < 0.5 ? 0.9 + Math.random() * 0.1 : Math.random() * 0.08,
    }))
    const h = useFluxHandle(mass, speedToLen(V0), speedToLen(kick.v))
    const angRef = useRef(kick.ang)
    const zoneRef = useRef(-Math.PI / 2)
    const tRef = useRef(0)
    const progRef = useRef(0)
    const wonRef = useRef(false)
    const [zone, setZone] = useState<GrooveZone>({ center: -Math.PI / 2, half: ZONE_HALF[mass], inside: false })
    const [prog, setProg] = useState(0)
    const [giveUp, setGiveUp] = useState(false)
    useEffect(() => {
        const id = setInterval(() => {
            tRef.current += 1
            const t = tRef.current / 62.5 // секунды
            const v = zoneSpeedAt(t)
            zoneRef.current += (v * 2 * Math.PI) / GR_LAP_TICKS
            let d = angRef.current - zoneRef.current
            d = Math.atan2(Math.sin(d), Math.cos(d))
            const inside = Math.abs(d) <= ZONE_HALF[mass]
            if (!wonRef.current) {
                progRef.current = inside ? progRef.current + 1 : Math.max(0, progRef.current - 0.5)
                if (progRef.current >= ZONE_GOAL_TICKS) { wonRef.current = true; setTimeout(onWin, 600) }
            }
            setZone({ center: zoneRef.current, half: ZONE_HALF[mass], inside })
            setProg(Math.min(1, progRef.current / ZONE_GOAL_TICKS))
        }, 16)
        const g = setTimeout(() => setGiveUp(true), 30000)
        return () => { clearInterval(id); clearTimeout(g) }
    }, [mass, onWin])
    const won = prog >= 1
    return (
        <div className="w-full flex flex-col items-center gap-3" onPointerMove={h.onMove} onPointerUp={h.onUp} onPointerCancel={h.onUp} style={{ touchAction: 'none' }}>
            <GrooveView targetLen={h.targetLen} actualLen={h.actualLen} mass={mass} svgRef={h.svgRef} onDown={h.onDown} dragging={h.dragging} angRef={angRef} zone={zone}
                startAng={kick.ang} center={<ZoneCenter inside={zone.inside} prog={prog} won={won} />} />
            {giveUp && !won && (
                <ReplyBtn color="#5C6B73" onClick={onWin}>
                    <span className="flex items-center gap-2">
                        <Lottie animationData={facepalm} loop autoplay className="w-9 h-9 -my-2 shrink-0" />
                        Сдаюсь 🏳️
                    </span>
                </ReplyBtn>
            )}
        </div>
    )
}
const ZoneGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 интро · 1 шарик · 2 текст валун · 3 валун · 4 вывод
    const winLight = useRef(() => setPhase((p) => Math.max(p, 2))).current
    const winHeavy = useRef(() => setPhase((p) => Math.max(p, 4))).current
    return (
        <>
            <TypedLineWithParts
                parts={[{ bold: '⚔️ СРАЗИСЬ С ИНДУКТИВНОСТЬЮ!' }, { break: true }, { text: 'Держи ⚪ шарик в ' }, { sticker: 'зелёной зоне', color: GGEGE_PALETTE.green.button }, { text: ' 5 секунд. Зона то ускоряется, то тормозит 😏' }]}
                onSettled={() => setPhase((p) => Math.max(p, 1))}
            />
            {phase >= 1 && phase < 3 && (
                <DiagramBlock><ZoneRound mass="light" onWin={winLight} /></DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Легко? А теперь то же самое с 🪨 ' }, { bold: 'ВАЛУНОМ' }, { text: ' 😈' }]}
                    onSettled={() => setPhase((p) => Math.max(p, 3))}
                />
            )}
            {phase >= 3 && phase < 4 && (
                <DiagramBlock><ZoneRound mass="heavy" onWin={winHeavy} /></DiagramBlock>
            )}
            {phase >= 4 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1200)}>
                    <InsightCard>
                        С валуном приходится газовать и тормозить <InsightWord>ЗАРАНЕЕ</InsightWord> 🧠
                        <br />Большая <InsightWord color="#FF9AC8">индуктивность</InsightWord> не даёт потоку меняться резко.
                    </InsightCard>
                </DiagramBlock>
            )}
        </>
    )
}


// ===== Сцена «Стоп-кадр: кто мешает потоку» (2026-10-01) =====
// Без метафор (просьба пользователя). Честная картинка:
//  • синяя стрелка B — поле МАГНИТА у кольца: двинул магнит — выросла СРАЗУ;
//  • фиолетовый цилиндр Φ — настоящий поток: растёт медленно (индуктивность огромная);
//  • красная стрелка B инд — разница «хочет − есть», направлена ПРОТИВ изменения.
// Раунд 1: придвинуть магнит → ~1 с роста → СТОП-КАДР, обводка «фломастером»
// вокруг B инд + «Нам мешает ИНДУКЦИОННОЕ поле» → «Понятно» → доезжает.
// Раунд 2: отодвинуть — то же зеркально (B инд смотрит вперёд).
const FR_W = 480, FR_H = 270
const FR_RX = 210, FR_CY = 92, FR_R = 34, FR_D = 10
const FR_LEN_FAR = 40, FR_LEN_NEAR = 240          // длина цилиндра на экране: магнит далеко / близко
const FR_MAG_FAR = 70, FR_MAG_NEAR = 158          // центр магнита
const FR_MAG_W = 64, FR_MAG_H = 30
const FR_RATE = 0.008                             // огромная индуктивность: τ ≈ 2 с
const FR_FREEZE_PROGRESS = 0.25, FR_FREEZE_MIN_MS = 900
const FR_ARROW_Y = FR_CY + FR_R + 26
// «фломастер»: чуть неровный овал с нахлёстом концов
const markerLoop = (cx: number, cy: number, rx: number, ry: number) => {
    const pts: string[] = []
    const a0 = -2.2, a1 = a0 + Math.PI * 2 + 0.55
    for (let i = 0; i <= 64; i++) {
        const a = a0 + ((a1 - a0) * i) / 64
        const k = 1 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7) + (i / 64) * 0.07
        pts.push(`${(cx + rx * k * Math.cos(a)).toFixed(1)} ${(cy + ry * k * Math.sin(a)).toFixed(1)}`)
    }
    return `M ${pts.join(' L ')}`
}
type FrStage = 'intro' | 'ready' | 'r1' | 'freeze1' | 'go1' | 'mid' | 'r2' | 'freeze2' | 'go2' | 'done'
const FreezeFrameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const PHI = GGEGE_PALETTE.purple.button
    const [stage, setStage] = useState<FrStage>('intro')
    const [ext, setExt] = useState(FR_LEN_FAR)      // поле магнита (сразу)
    const [net, setNet] = useState(FR_LEN_FAR)      // настоящий поток (лениво)
    const [textReady, setTextReady] = useState(false)
    const extRef = useRef(FR_LEN_FAR), netRef = useRef(FR_LEN_FAR)
    const stageRef = useRef<FrStage>('intro')
    stageRef.current = stage
    const roundStart = useRef({ t: 0, from: FR_LEN_FAR })
    useEffect(() => {
        const id = setInterval(() => {
            const st = stageRef.current
            if (st !== 'r1' && st !== 'go1' && st !== 'r2' && st !== 'go2') return
            const d = extRef.current - netRef.current
            if (Math.abs(d) < 1.5) {
                netRef.current = extRef.current; setNet(netRef.current)
                if (st === 'go1') setStage('mid')
                if (st === 'go2') setStage('done')
                return
            }
            netRef.current += d * FR_RATE
            setNet(netRef.current)
            if (st === 'r1' || st === 'r2') {
                const total = extRef.current - roundStart.current.from
                const prog = (netRef.current - roundStart.current.from) / total
                if (prog >= FR_FREEZE_PROGRESS && Date.now() - roundStart.current.t >= FR_FREEZE_MIN_MS) {
                    setTextReady(false)
                    setStage(st === 'r1' ? 'freeze1' : 'freeze2')
                }
            }
        }, 16)
        return () => clearInterval(id)
    }, [])
    const move = (near: boolean) => {
        const target = near ? FR_LEN_NEAR : FR_LEN_FAR
        roundStart.current = { t: Date.now(), from: netRef.current }
        extRef.current = target; setExt(target)
        setStage(near ? 'r1' : 'r2')
    }
    const frozen = stage === 'freeze1' || stage === 'freeze2'
    const magX = FR_MAG_FAR + ((ext - FR_LEN_FAR) / (FR_LEN_NEAR - FR_LEN_FAR)) * (FR_MAG_NEAR - FR_MAG_FAR)
    const xExt = FR_RX + ext, xNet = FR_RX + net
    const gap = ext - net
    const showInd = Math.abs(gap) > 6
    const arrowL = Math.min(xExt, xNet), arrowR = Math.max(xExt, xNet)
    const dim = frozen ? 0.35 : 1
    const after = (s: FrStage[]) => s.includes(stage)
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Придвинь 🧲 магнит к кольцу — увеличим поток ' }, { sticker: 'Φ', color: PHI }, { text: '.' }]}
                onSettled={() => setStage((s) => (s === 'intro' ? 'ready' : s))}
            />
            <DiagramBlock>
                <svg viewBox={`0 0 ${FR_W} ${FR_H}`} className="w-full max-w-[460px] h-auto select-none">
                    <g opacity={dim} style={{ transition: 'opacity 0.35s' }}>
                        {/* магнит (едет быстро) */}
                        <motion.g animate={{ x: magX }} transition={{ type: 'spring', stiffness: 170, damping: 20 }}>
                            <rect x={-FR_MAG_W / 2} y={FR_CY - FR_MAG_H / 2} width={FR_MAG_W / 2} height={FR_MAG_H} rx={5} fill={SOUTH_COLOR} />
                            <rect x={0} y={FR_CY - FR_MAG_H / 2} width={FR_MAG_W / 2} height={FR_MAG_H} rx={5} fill={NORTH_COLOR} />
                            <text x={-FR_MAG_W / 4} y={FR_CY + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff">S</text>
                            <text x={FR_MAG_W / 4} y={FR_CY + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff">N</text>
                        </motion.g>
                        {/* настоящий поток */}
                        <FluxCylinder cx={FR_RX + net / 2} cy={FR_CY} radius={FR_R} depth={FR_D} length={net} orient="h" color={PHI} />
                        <ellipse cx={FR_RX} cy={FR_CY} rx={FR_D} ry={FR_R} fill="none" stroke={RING_COLOR} strokeWidth={5} />
                        {/* поле магнита — сразу */}
                        <FieldArrow x1={FR_RX + 4} y1={FR_CY} x2={xExt - 4} y2={FR_CY} color={FIELD_COLOR} width={5} head={9} />
                        <SvgSticker x={Math.min(xExt + 20, FR_W - 18)} y={FR_CY} text="B" color={FIELD_COLOR} />
                        <SvgSticker x={FR_RX + 28} y={FR_CY - FR_R - 16} text="Φ" color={PHI} />
                        <SvgSticker x={FR_RX - 2} y={FR_CY + FR_R + 58} text="S" color={RING_COLOR} />
                    </g>
                    {/* B инд — не тускнеет на стоп-кадре: на неё смотрим */}
                    {showInd && (
                        <g>
                            <HArrow x1={xExt} x2={xNet + (xExt > xNet ? 3 : -3)} y={FR_ARROW_Y} color={OWN_COLOR} width={6} />
                            <SvgSticker x={(arrowL + arrowR) / 2} y={FR_ARROW_Y + 26} text="B" sub="инд" color={OWN_COLOR} />
                        </g>
                    )}
                    {/* обводка фломастером */}
                    {frozen && (
                        <motion.path d={markerLoop((arrowL + arrowR) / 2, FR_ARROW_Y + 12, (arrowR - arrowL) / 2 + 26, 34)}
                            fill="none" stroke="#FF4D4D" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.25 }} />
                    )}
                    {frozen && (
                        <motion.g initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                            <rect x={12} y={10} width={118} height={28} rx={8} fill="#161F23" stroke="#F2F7FB" strokeWidth={2} />
                            <text x={71} y={29} textAnchor="middle" fontSize={14} fontWeight={900} fill="#F2F7FB">⏸ СТОП-КАДР</text>
                        </motion.g>
                    )}
                </svg>
            </DiagramBlock>
            {(frozen || after(['go1', 'mid', 'r2', 'freeze2', 'go2', 'done'])) && (
                <div style={{ opacity: stage === 'freeze1' ? 1 : 0.4, transition: 'opacity 0.5s' }}>
                    <TypedLineWithParts
                        parts={[{ text: 'Нам мешает ' }, { bold: 'ИНДУКЦИОННОЕ' }, { text: ' поле ' }, { sticker: 'B инд', color: OWN_COLOR }]}
                        onSettled={() => setTextReady(true)}
                    />
                </div>
            )}
            {after(['mid', 'r2', 'freeze2', 'go2', 'done']) && (
                <div style={{ opacity: stage === 'mid' ? 1 : 0.4, transition: 'opacity 0.5s' }}>
                    <TypedLineWithParts parts={[{ text: 'Дотянулся — но медленно 😴 А теперь ' }, { bold: 'отодвинь' }, { text: ' магнит.' }]} />
                </div>
            )}
            {after(['freeze2', 'go2', 'done']) && (
                <div style={{ opacity: stage === 'freeze2' ? 1 : 0.4, transition: 'opacity 0.5s' }}>
                    <TypedLineWithParts
                        parts={[{ text: 'Опять ' }, { sticker: 'B инд', color: OWN_COLOR }, { text: '! Теперь не даёт потоку ' }, { bold: 'уменьшиться' }, { text: '.' }]}
                        onSettled={() => setTextReady(true)}
                    />
                </div>
            )}
            {stage === 'done' && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1200)}>
                    <InsightCard>
                        Поток меняется — но <InsightWord>медленно</InsightWord> 😴
                        <br />Мешает <InsightWord color="#FF9AC8">ИНДУКЦИОННОЕ поле B инд</InsightWord> — в любую сторону.
                    </InsightCard>
                </DiagramBlock>
            )}
            {stage === 'ready' && <ReplyBtn color={FIELD_COLOR} onClick={() => move(true)}>🧲 Придвинуть</ReplyBtn>}
            {stage === 'mid' && <ReplyBtn color={FIELD_COLOR} onClick={() => move(false)}>🧲 Отодвинуть</ReplyBtn>}
            {frozen && textReady && (
                <ReplyBtn onClick={() => setStage(stage === 'freeze1' ? 'go1' : 'go2')}>Понятно ▶️</ReplyBtn>
            )}
        </>
    )
}

// Метафоры (шарик/валун/жёлоб/игра) сняты с показа 2026-10-01 — код сохранён, вернуть можно сюда.
export const LENZ_SHELVED_SCENES = [FluxMotionScene, MassScene, TrainCylinderScene, ZoneGameScene]
const CONCEPT_SCENES = [HookScene, FreezeFrameScene, StuckScene, WhoScene, SpeedMagnetScene]
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
        renderPrompt: () => <>Ты спокойно скроллишь ленту (поток действий не меняется). Индуктивность в этот момент…</>,
        renderOptions: () => ['мешает — сопротивление есть всегда', 'не мешает — сопротивления нет вообще'],
        correct: 1,
        feedback: 'Ровно как в кольце: пока поток НЕ меняется — сопротивления нет, даже если сам поток огромный.',
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
            showAnswerMeme(true)
            setChecked(true)
            setNextLabel(pickWalkthroughNextLabel(trialIndex + 1 >= CONCEPT_QUIZ.length ? 'Готово' : 'Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
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
