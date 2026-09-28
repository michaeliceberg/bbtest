// app/t-lesson/[t_lessonId]/type-lenzwalk.tsx
//
// Тип LENZWALK — интерактивный разбор «индукционный ток и правило Ленца»
// (тема «Электродинамика», сразу после FARADAYWALK/DIRWALK). Стиль — как у
// FARADAYWALK/DIRWALK: массив сцен CONCEPT_SCENES, накопительный лог,
// мини-игры руками, эмоции.
//
// Главная идея — ток появляется ТОЛЬКО пока поток Φ МЕНЯЕТСЯ: ученик сам
// ЗАЖИМАЕТ кнопку, магнит едет, пока кнопка зажата — в кольце бежит ток и
// дёргается стрелка амперметра; отпустил — магнит встал, ток пропал.
// Аналогия: магнит — злой босс 😈 с армией стрелок B; кольцо — упрямый
// консерватор: «ТРЕВОГА! ПОТОК МЕНЯЕТСЯ!» 😱 → поднимает свой ток и своё
// поле B (зелёные щиты 🛡️) против натиска ⚔️; магнит уходит — кольцо
// плачет 😭 «не уходи!» и своим полем тянет поток обратно.
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

// 0. Вступление: магнит → стрелки B сквозь кольцо (поток) → «НАЖМИ и держи».
// Ученик сам двигает магнит и сам замечает: ток (стрелка на кольце и стрелка
// амперметра) есть только пока магнит едет. Никаких подсказок-реплик.
// магнит во вступлении едет медленно — успеть увидеть и движение, и ток
const INTRO_SPEED = 0.4
const IntroScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const mag = useMagnet(0)
    const [pushed, setPushed] = useState(false)
    const hadMove = useRef(false)
    useEffect(() => {
        if (mag.move !== 0) hadMove.current = true
        else if (hadMove.current && !pushed) { setPushed(true); setTimeout(() => setPhase(5), 1200) }
    }, [mag.move, pushed])
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Магнит над ' }, { sticker: 'кольцом', color: RING_COLOR }, { text: '.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1400)}>
                    {/* как в лифте: кнопки вверх/вниз справа от картинки */}
                    <div className="w-full flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <LenzView pos={mag.pos} move={mag.move} fieldLines showExt={phase >= 3} showCurrent={phase >= 3} face={false} devil={false} moveArrow={false} />
                        </div>
                        <motion.div className="mt-[18%] flex w-16 shrink-0 flex-col gap-4"
                            initial={false} animate={{ opacity: phase >= 4 ? 1 : 0, x: phase >= 4 ? 0 : 12 }}
                            style={{ pointerEvents: phase >= 4 ? 'auto' : 'none' }}>
                            <HoldBtn className="flex-none h-16 px-0" color={RULE_COLOR} pulse={phase >= 4 && !pushed} onStart={() => mag.start(-1, INTRO_SPEED)} onRelease={mag.release} disabled={mag.pos <= 0}>
                                <span className="flex justify-center"><ArrowUp size={32} strokeWidth={3} /></span>
                            </HoldBtn>
                            <HoldBtn className="flex-none h-16 px-0" color={RULE_COLOR} pulse={phase >= 4 && !pushed} onStart={() => mag.start(1, INTRO_SPEED)} onRelease={mag.release} disabled={mag.pos >= 1}>
                                <span className="flex justify-center"><ArrowDown size={32} strokeWidth={3} /></span>
                            </HoldBtn>
                            <span className="-mt-1 text-center text-[11px] font-black leading-tight text-[#9AA7B0]">нажми<br />и держи</span>
                        </motion.div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Стрелка ' }, { sticker: 'B', color: FIELD_COLOR }, { text: ' пронизывает кольцо.' }]}
                    onSettled={() => { setPhase(3); setTimeout(() => setPhase(4), 1500) }}
                />
            )}
            {phase >= 5 && (
                <TypedLineWithParts
                    parts={[{ text: 'Двигаешь — ' }, { sticker: 'ток', color: CURRENT_COLOR }, { text: ' есть. Стоишь — ' }, { bold: 'нет' }, { text: '.' }]}
                    onSettled={() => setPhase(6)}
                />
            )}
            {phase >= 6 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(7), 1600)}>
                    <InsightCard>
                        Ток — только пока Φ <InsightWord>МЕНЯЕТСЯ</InsightWord>.
                        <br /><InsightWord color="#FF9AC8">Индукционный ток</InsightWord>
                    </InsightCard>
                </DiagramBlock>
            )}
            {phase >= 7 && (
                <TypedLineWithParts parts={[{ bold: 'А почему?' }, { text: ' 🤔' }]} onSettled={onSettled} />
            )}
        </>
    )
}

// 2. Чат прямо на арене (идея пользователя 2026-09-28): магнит и кольцо
// переписываются облачками над своими бойцами → «ROUND 1 · FIGHT!» → битва.
type ChatMsg = { who: 'magnet' | 'ring'; emoji: string; text: React.ReactNode }
const CHAT: ChatMsg[] = [
    { who: 'magnet', emoji: '😈', text: <>Нападаю! Моё поле <Sticker value="B" color={FIELD_COLOR} /> растёт!</> },
    { who: 'ring', emoji: '😱', text: <>ТРЕВОГА! Поток <Sticker value="Φ" color={GGEGE_PALETTE.purple.button} /> меняется! НЕ ДОПУЩУ!</> },
    { who: 'ring', emoji: '😤', text: <>Запускаю ток <Sticker value="I" color={CURRENT_COLOR} /> — моё <Sticker value="B инд" color={OWN_COLOR} /> против тебя!</> },
    { who: 'magnet', emoji: '😠', text: 'Ах так?! Ну держись!' },
]
const CHAT_TYPING_MS = 1100
const CHAT_GAP_MS = 700
// Три прыгающие точки «печатает…»
const TypingDots = () => (
    <span className="inline-flex items-center gap-1">
        печатает
        {[0, 1, 2].map((i) => (
            <motion.span key={i} className="inline-block w-1.5 h-1.5 rounded-full bg-current"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
        ))}
    </span>
)
// 3. Битва в стиле Mortal Kombat (вид сбоку): слева горизонтальный магнит
// бьёт своим полем B вправо, справа кольцо (ось горизонтальна, видим его
// ребром) бьёт СВОИМ полем B влево, по кольцу бежит индукционный ток.
// Физика: N смотрит на кольцо → поле магнита у кольца направлено вправо;
// магнит приближается → поток растёт → поле кольца влево (навстречу).
// Правая рука: палец влево → на ближней к нам (правой на рисунке) половине
// кольца ток идёт ВВЕРХ.
const MK_W = 360, MK_H = 250
const MK_Y = 145
const MK_RING_X = 300, MK_RING_RX = 18, MK_RING_RY = 66
const MK_MAG_W = 96, MK_MAG_H = 40
// магнит в битве едет медленнее (≈5 с на весь путь) — успеть рассмотреть поединок
const MK_SPEED = 0.33

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
const HpBar = ({ label, color, align, hit }: { label: string; color: string; align: 'left' | 'right'; hit: boolean }) => (
    <div className={cn('flex-1 flex flex-col gap-1', align === 'right' && 'items-end')}>
        <span className={cn('w-full text-xs font-black uppercase tracking-widest', align === 'right' ? 'text-right' : 'text-left')} style={{ color }}>{label}</span>
        <motion.div className="h-3 w-full rounded-sm border-2 border-[#F2C35B] bg-[#3A1414] overflow-hidden"
            animate={hit ? { x: [0, -3, 3, -2, 0] } : { x: 0 }} transition={hit ? { duration: 0.3, repeat: Infinity } : {}}>
            <div className={cn('h-full', align === 'right' && 'ml-auto')} style={{ width: '100%', background: `linear-gradient(90deg, ${color}, #F2C35B)` }} />
        </motion.div>
    </div>
)

const MkView = ({ pos, fighting, chat, banner }: { pos: number; fighting: boolean; chat?: React.ReactNode; banner?: React.ReactNode }) => {
    const magX = 14 + pos * 40
    const faceX = magX + MK_MAG_W
    // Метафора (идеализация «поток растёт равномерно», как в уроке Фарадея):
    //   КОЛИЧЕСТВО синих стрелок = поток Φ — растёт по мере приближения магнита;
    //   КОЛИЧЕСТВО красных = B_инд ∝ ΔΦ/Δt — зависит от того, как БЫСТРО
    //   прибавляются синие: магнит едет ровно → красных всегда 2, встал → 0.
    // Одна стрелка B (идея пользователя 2026-09-28): длина ∝ полю — растёт по
    // мере приближения. Стрелка кольца B_инд — одна и та же длина.
    const ARROW_LEN = 56
    const magTip = faceX + 6 + 36 + pos * 40
    // стрелки кольца стартуют от ЛЕВОГО края кольца, а не поверх него —
    // иначе малиновые стрелки сливаются с малиновым (током) кольцом
    const ringStart = MK_RING_X - MK_RING_RX - 6
    const ringTip = ringStart - ARROW_LEN
    const clashX = (magTip + ringTip) / 2
    const ringFront = `M ${MK_RING_X} ${MK_Y - MK_RING_RY} A ${MK_RING_RX} ${MK_RING_RY} 0 0 1 ${MK_RING_X} ${MK_Y + MK_RING_RY}`
    const ringBack = `M ${MK_RING_X} ${MK_Y - MK_RING_RY} A ${MK_RING_RX} ${MK_RING_RY} 0 0 0 ${MK_RING_X} ${MK_Y + MK_RING_RY}`
    return (
        <div className="w-full flex flex-col gap-2 rounded-2xl border-2 border-[#3A464E] bg-[#0E1418] p-3">
            <div className="flex items-start gap-3">
                <HpBar label="Магнит" color={FIELD_COLOR} align="left" hit={fighting} />
                <span className="pt-4 text-sm font-black text-[#F2C35B]">VS</span>
                <HpBar label="Кольцо" color={CURRENT_COLOR} align="right" hit={fighting} />
            </div>
            {chat}
            <div className="relative">
            {banner}
            <svg viewBox={`0 0 ${MK_W} ${MK_H}`} className="w-full h-auto">
                {/* пол арены */}
                <line x1={0} y1={MK_H - 22} x2={MK_W} y2={MK_H - 22} stroke="#3A464E" strokeWidth={2} strokeDasharray="6 8" />
                {/* задняя половина кольца */}
                <path d={ringBack} fill="none" stroke={fighting ? CURRENT_COLOR : RING_COLOR} strokeWidth={6} opacity={0.5} />
                {/* атака магнита: поле B вправо */}
                <FieldArrow x1={faceX + 6} y1={MK_Y} x2={magTip} y2={MK_Y} color={FIELD_COLOR} width={7} head={10} />
                <SvgSticker x={faceX + 30} y={MK_Y - 78} text="B" color={FIELD_COLOR} />
                {/* ответ кольца: своё поле B влево */}
                {fighting && (
                    <motion.g initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <FieldArrow x1={ringStart} y1={MK_Y} x2={ringTip} y2={MK_Y} color={OWN_COLOR} width={7} head={10} />
                    </motion.g>
                )}
                {fighting && <SvgSticker x={MK_RING_X - 52} y={MK_Y - 78} text="B" sub="инд" color={OWN_COLOR} />}
                {/* столкновение */}
                {fighting && (
                    <g transform={`translate(${clashX},${MK_Y})`}>
                        <motion.g animate={{ scale: [0.8, 1.25, 0.9], rotate: [0, 12, -8] }} transition={{ duration: 0.35, repeat: Infinity }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                            <text x={0} y={10} textAnchor="middle" fontSize={34}>💥</text>
                        </motion.g>
                    </g>
                )}
                {/* магнит: S слева, N смотрит на кольцо */}
                <motion.g animate={fighting ? { x: [0, 3, 0] } : { x: 0 }} transition={fighting ? { duration: 0.2, repeat: Infinity } : {}}>
                    <rect x={magX} y={MK_Y - MK_MAG_H / 2} width={MK_MAG_W / 2} height={MK_MAG_H} rx={6} fill={SOUTH_COLOR} />
                    <rect x={magX + MK_MAG_W / 2} y={MK_Y - MK_MAG_H / 2} width={MK_MAG_W / 2} height={MK_MAG_H} rx={6} fill={NORTH_COLOR} />
                    <rect x={magX + MK_MAG_W / 2 - 6} y={MK_Y - MK_MAG_H / 2} width={12} height={MK_MAG_H} fill={NORTH_COLOR} />
                    <text x={magX + MK_MAG_W / 4} y={MK_Y + 7} textAnchor="middle" fontSize={20} fontWeight={900} fill="#fff">S</text>
                    <text x={magX + (MK_MAG_W * 3) / 4} y={MK_Y + 7} textAnchor="middle" fontSize={20} fontWeight={900} fill="#fff">N</text>
                </motion.g>
                {/* передняя половина кольца + бегущий ток */}
                <path d={ringFront} fill="none" stroke={fighting ? CURRENT_COLOR : RING_COLOR} strokeWidth={7} strokeLinecap="round" />
                {fighting && (
                    <>
                        <motion.path d={ringFront} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="6 16" strokeLinecap="round"
                            animate={{ strokeDashoffset: [0, 44] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} />
                        <SvgSticker x={MK_RING_X + MK_RING_RX - 4} y={MK_Y + MK_RING_RY + 22} text="I" sub="инд" color={CURRENT_COLOR} />
                    </>
                )}
            </svg>
            </div>
        </div>
    )
}

const ChatBubble = ({ m, typing }: { m: ChatMsg; typing?: boolean }) => {
    const color = m.who === 'magnet' ? FIELD_COLOR : OWN_COLOR
    return (
        <motion.div key={typing ? 'typing' : String(m.text)} initial={{ opacity: 0, y: 10, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.45 }}
            className={cn('relative flex items-end gap-1.5', m.who === 'ring' && 'flex-row-reverse')}>
            <div className="text-2xl leading-none shrink-0">{m.emoji}</div>
            <div className="rounded-2xl px-2.5 py-1.5 text-xs md:text-sm font-bold text-[#F2F7FB]"
                style={{ backgroundColor: hexToRgba(color, typing ? 0.08 : 0.18), border: `2px ${typing ? 'dashed' : 'solid'} ${color}` }}>
                {typing ? <span style={{ color }}><TypingDots /></span> : m.text}
            </div>
        </motion.div>
    )
}

const BattleScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const mag = useMagnet(0)
    const [done, setDone] = useState(false)
    const hadMove = useRef(false)
    const [shown, setShown] = useState(0)
    const [typing, setTyping] = useState(false)
    const [banner, setBanner] = useState(false)
    // переписка: «печатает…» → сообщение → пауза → следующее; потом FIGHT!
    useEffect(() => {
        if (phase !== 1) return
        if (shown >= CHAT.length) {
            const t1 = setTimeout(() => setBanner(true), 500)
            const t2 = setTimeout(() => { setBanner(false); setPhase(2) }, 2100)
            return () => { clearTimeout(t1); clearTimeout(t2) }
        }
        if (!typing) {
            const t = setTimeout(() => setTyping(true), shown === 0 ? 300 : CHAT_GAP_MS)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => { setTyping(false); setShown((x) => x + 1) }, CHAT_TYPING_MS)
        return () => clearTimeout(t)
    }, [phase, shown, typing])
    useEffect(() => {
        if (mag.move === 1) hadMove.current = true
        else if (mag.move === 0 && hadMove.current && !done) { setDone(true); setTimeout(() => setPhase(3), 800) }
    }, [mag.move, done])
    const fighting = mag.move === 1
    // реплики стороной-столбиком: старые не пропадают, пока «печатает» следующая
    const sideOf = (who: ChatMsg['who']) => (
        <div className="flex flex-col gap-1.5">
            {CHAT.slice(0, shown).map((m, i) => (m.who === who ? <ChatBubble key={i} m={m} /> : null))}
            {typing && CHAT[shown]?.who === who && <ChatBubble m={CHAT[shown]} typing />}
        </div>
    )
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Магнит наступает — ' }, { sticker: 'Φ', color: GGEGE_PALETTE.purple.button }, { text: ' растёт. Кольцу это ' }, { bold: 'НЕ НРАВИТСЯ' }, { text: ' 👀' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col gap-2">
                        <MkView pos={mag.pos} fighting={fighting}
                            chat={phase < 2 ? (
                                <div className="grid grid-cols-2 gap-2 items-end">
                                    {sideOf('magnet')}
                                    {sideOf('ring')}
                                </div>
                            ) : null}
                            banner={banner ? (
                                <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                                    className="absolute inset-0 z-10 flex items-center justify-center text-center text-3xl md:text-4xl font-black tracking-widest pointer-events-none"
                                    style={{ color: '#F2C35B', textShadow: '0 3px 0 #8A4B14' }}>
                                    ROUND 1<br />FIGHT!
                                </motion.div>
                            ) : null}
                        />
                        <motion.div className="flex gap-2" initial={false} animate={{ opacity: phase >= 2 ? 1 : 0 }} style={{ pointerEvents: phase >= 2 ? 'auto' : 'none' }}>
                            <HoldBtn color={RULE_COLOR} pulse={phase >= 2 && !done} onStart={() => { if (mag.pos >= 1) mag.jump(0); mag.start(1, MK_SPEED) }} onRelease={mag.release}><span className="inline-flex items-center gap-2">В атаку на кольцо! <ArrowRight size={22} strokeWidth={3} /></span></HoldBtn>
                        </motion.div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Синяя стрелка ' }, { bold: 'растёт' }, { text: ' — кольцо ' }, { bold: 'не сдаётся' }, { text: ' 🛡️' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 3б. Куда направлено B_инд (идея пользователя 2026-09-28): поток — УПРУГИЙ
// цилиндр (дно — кольцо S, длина — поле B), как пружина. Ученик сам тянет
// правый край: растянул → отпустил → «стоп-кадр» ~1 с: пунктир от края и
// стрелка B_инд НАЗАД к исходной длине → цилиндр пружинит обратно. Потом
// то же со сжатием — стрелка B_инд вперёд. Поток хочет НЕ меняться.
const EL_W = 360, EL_H = 236
const EL_X0 = 56, EL_CY = 92, EL_R = 44, EL_D = 13
const EL_L0 = 150, EL_LMAX = 280, EL_LMIN = 52
const EL_PHOTO_MS = 1100
type ElMode = 'stretch' | 'compress' | 'done'
type ElPhoto = { x: number } | null

const ElasticView = ({ len, photo, mode, returning, svgRef, onDown, dragging }: {
    len: number; photo: ElPhoto; mode: ElMode; returning: boolean
    svgRef: React.RefObject<SVGSVGElement>; onDown: (e: React.PointerEvent) => void; dragging: boolean
}) => {
    const PHI = GGEGE_PALETTE.purple.button
    const xr = EL_X0 + len
    const xOrig = EL_X0 + EL_L0
    const showArrow = photo !== null
    const arrowFrom = photo ? photo.x : xr
    return (
        <svg ref={svgRef} viewBox={`0 0 ${EL_W} ${EL_H}`} className="w-full max-w-[380px] h-auto select-none" style={{ touchAction: 'none' }}>
            {/* призрак исходного цилиндра — в стоп-кадре */}
            {photo && <FluxCylinder cx={EL_X0 + EL_L0 / 2} cy={EL_CY} radius={EL_R} depth={EL_D} length={EL_L0} orient="h" color="#9AA7B0" fill={0} dashed />}
            <FluxCylinder cx={EL_X0 + len / 2} cy={EL_CY} radius={EL_R} depth={EL_D} length={len} orient="h" color={PHI} />
            <FieldArrow x1={EL_X0 + 4} y1={EL_CY} x2={xr - 6} y2={EL_CY} color={FIELD_COLOR} width={6} head={9} />
            {/* кольцо — дно цилиндра */}
            <ellipse cx={EL_X0} cy={EL_CY} rx={EL_D} ry={EL_R} fill="none" stroke={RING_COLOR} strokeWidth={6} />
            <SvgSticker x={EL_X0 - 4} y={EL_CY + EL_R + 22} text="S" color={RING_COLOR} />
            <SvgSticker x={EL_X0 + 40} y={EL_CY - EL_R - 18} text="Φ" color={PHI} />
            {/* стоп-кадр: пунктиры от края вниз + стрелка B_инд к исходной длине */}
            {showArrow && (
                <g>
                    {[arrowFrom, xOrig].map((x, i) => (
                        <line key={i} x1={x} y1={EL_CY - EL_R - 6} x2={x} y2={EL_H - 30} stroke="#9AA7B0" strokeWidth={1.8} strokeDasharray="4 4" />
                    ))}
                    <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                        <HArrow x1={arrowFrom} x2={xOrig + (arrowFrom > xOrig ? 3 : -3)} y={EL_H - 50} color={OWN_COLOR} width={6} />
                        <SvgSticker x={(arrowFrom + xOrig) / 2} y={EL_H - 20} text="B" sub="инд" color={OWN_COLOR} />
                    </motion.g>
                </g>
            )}
            {photo && !returning && (
                <>
                    <motion.rect x={0} y={0} width={EL_W} height={EL_H} fill="#fff" initial={{ opacity: 0.55 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }} pointerEvents="none" />
                    <text x={EL_W - 8} y={20} textAnchor="end" fontSize={14} fontWeight={900} fill="#F2C35B">📸 СТОП-КАДР</text>
                </>
            )}
            {/* ручка: правый край цилиндра */}
            {mode !== 'done' && !photo && (
                <g onPointerDown={onDown} style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
                    {!dragging && (
                        <motion.circle cx={xr} cy={EL_CY} r={22} fill="none" stroke={RULE_COLOR} strokeWidth={3}
                            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.3, repeat: Infinity }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                    )}
                    <circle cx={xr} cy={EL_CY} r={20} fill={RULE_COLOR} stroke="#fff" strokeWidth={3} />
                    <text x={xr} y={EL_CY + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff">{mode === 'stretch' ? '➡' : '⬅'}</text>
                    <circle cx={xr} cy={EL_CY} r={34} fill="transparent" />
                </g>
            )}
        </svg>
    )
}

const ElasticFluxScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [mode, setMode] = useState<ElMode>('stretch')
    const [len, setLen] = useState(EL_L0)
    const [dragging, setDragging] = useState(false)
    const [photo, setPhoto] = useState<ElPhoto>(null)
    const [returning, setReturning] = useState(false)
    const svgRef = useRef<SVGSVGElement>(null)
    const lenRef = useRef(EL_L0)
    const modeRef = useRef<ElMode>('stretch')
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const spring = useRef<ReturnType<typeof setInterval> | null>(null)
    useEffect(() => () => { timers.current.forEach(clearTimeout); if (spring.current) clearInterval(spring.current) }, [])
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }
    const setL = (v: number) => { lenRef.current = v; setLen(v) }

    const toSvgX = (clientX: number, clientY: number) => {
        const svg = svgRef.current
        const ctm = svg?.getScreenCTM()
        if (!svg || !ctm) return null
        const pt = svg.createSVGPoint()
        pt.x = clientX; pt.y = clientY
        return pt.matrixTransform(ctm.inverse()).x
    }
    // Пружина обратно к исходной длине (setInterval, не rAF — не замирает в фоне).
    const springBack = (onEnd: () => void) => {
        let v = 0
        if (spring.current) clearInterval(spring.current)
        spring.current = setInterval(() => {
            v = (v + (EL_L0 - lenRef.current) * 0.16) * 0.74
            const next = lenRef.current + v
            if (Math.abs(EL_L0 - next) < 0.6 && Math.abs(v) < 0.6) {
                if (spring.current) clearInterval(spring.current)
                spring.current = null
                setL(EL_L0); onEnd()
            } else setL(next)
        }, 16)
    }
    const onDown = (e: React.PointerEvent) => {
        if (modeRef.current === 'done' || photo) return
        e.preventDefault()
        svgRef.current?.setPointerCapture?.(e.pointerId)
        setDragging(true)
    }
    const onMove = (e: React.PointerEvent) => {
        if (!dragging) return
        const x = toSvgX(e.clientX, e.clientY)
        if (x === null) return
        const raw = x - EL_X0
        const v = modeRef.current === 'stretch' ? Math.min(EL_LMAX, Math.max(EL_L0, raw)) : Math.max(EL_LMIN, Math.min(EL_L0, raw))
        setL(v)
    }
    const onUp = () => {
        if (!dragging) return
        setDragging(false)
        const delta = lenRef.current - EL_L0
        if (Math.abs(delta) < 20) { springBack(() => {}); return }
        const m = modeRef.current
        setPhoto({ x: EL_X0 + lenRef.current })
        later(() => {
            setReturning(true)
            springBack(() => later(() => {
                setPhoto(null); setReturning(false)
                if (m === 'stretch') { modeRef.current = 'compress'; setMode('compress'); setPhase(2) }
                else { modeRef.current = 'done'; setMode('done'); setPhase(4) }
            }, 700))
        }, EL_PHOTO_MS)
    }

    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Поток ' }, { sticker: 'Φ', color: GGEGE_PALETTE.purple.button }, { text: ' — цилиндр. Он ' }, { bold: 'упругий' }, { text: ', как пружина 🌀' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-2" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: 'none' }}>
                        <ElasticView len={len} photo={photo} mode={mode} returning={returning} svgRef={svgRef} onDown={onDown} dragging={dragging} />
                        {mode !== 'done' && !photo && (
                            <p className="text-sm font-black text-center" style={{ color: RULE_COLOR }}>
                                {mode === 'stretch' ? 'Тяни край вправо ➡ и отпусти' : '⬅ Теперь сожми: тяни влево и отпусти'}
                            </p>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Растянули — ' }, { sticker: 'B инд', color: OWN_COLOR }, { text: ' тянет ' }, { bold: 'назад' }, { text: ' ⬅' }]}
                    onSettled={() => setPhase((p) => Math.max(p, 3))}
                />
            )}
            {phase >= 4 && (
                <TypedLineWithParts
                    parts={[{ text: 'Сжали — ' }, { sticker: 'B инд', color: OWN_COLOR }, { text: ' толкает ' }, { bold: 'вперёд' }, { text: ' ➡' }]}
                    onSettled={() => setPhase(5)}
                />
            )}
            {phase >= 5 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1400)}>
                    <InsightCard>
                        Поток хочет <InsightWord>НЕ МЕНЯТЬСЯ</InsightWord>.
                        <br /><InsightWord color="#FF9AC8">B инд</InsightWord> — пружина, которая возвращает его обратно.
                    </InsightCard>
                </DiagramBlock>
            )}
        </>
    )
}

// 4. Уходит — кольцо плачет и держит.
const PullScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const mag = useMagnet(0.95)
    const [done, setDone] = useState(false)
    const hadMove = useRef(false)
    useEffect(() => {
        if (mag.move === -1) hadMove.current = true
        else if (mag.move === 0 && hadMove.current && !done) { setDone(true); setTimeout(() => setPhase(2), 800) }
    }, [mag.move, done])
    return (
        <>
            <TypedLine text="А теперь наоборот: зажми и УВОДИ магнит от кольца." className={cn(TEXT_CLS, 'font-extrabold')} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col gap-2">
                        <LenzView pos={mag.pos} move={mag.move} showOwn />
                        <Bubble
                            text={mag.move === -1 ? '😭 НЕТ! Поток падает! Не уходи, держу!' : '🥺 …он ушёл'}
                            color={mag.move !== 0 ? CURRENT_COLOR : '#9AA7B0'}
                        />
                        <div className="flex gap-2">
                            <HoldBtn color={RULE_COLOR} pulse={!done} onStart={() => { if (mag.pos <= 0) mag.jump(0.95); mag.start(-1) }} onRelease={mag.release}>⬆ Зажми: уводи</HoldBtn>
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Видел? Теперь ' }, { sticker: 'B кольца', color: OWN_COLOR }, { text: ' смотрит ' }, { bold: 'ТУДА ЖЕ' }, { text: ', что и поле магнита — кольцо пытается удержать уходящий поток. И ' }, { sticker: 'ток', color: CURRENT_COLOR }, { text: ' побежал в другую сторону!' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 5. ЗАПОМНИ: правило Ленца.
const LenzRuleScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase(1), 500)}><RememberBanner /></DiagramBlock>
            {phase >= 1 && (
                <TypedLineWithParts
                    parts={[{ sticker: 'Правило Ленца', color: RULE_COLOR }, { text: ': индукционный ток своим полем всегда ' }, { bold: 'МЕШАЕТ' }, { text: ' изменению потока.' }]}
                    onSettled={() => setPhase(2)}
                />
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(3), 400)}>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: OWN_COLOR, backgroundColor: hexToRgba(OWN_COLOR, 0.1) }}>
                            <div className="text-3xl">😤</div>
                            <div className="font-black text-[#F2F7FB] mt-1">Поток растёт</div>
                            <div className="text-sm font-bold mt-1" style={{ color: OWN_COLOR }}>своё B — ПРОТИВ</div>
                        </div>
                        <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: CURRENT_COLOR, backgroundColor: hexToRgba(CURRENT_COLOR, 0.1) }}>
                            <div className="text-3xl">😭</div>
                            <div className="font-black text-[#F2F7FB] mt-1">Поток падает</div>
                            <div className="text-sm font-bold mt-1" style={{ color: CURRENT_COLOR }}>своё B — ТУДА ЖЕ</div>
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1400)}>
                    <InsightCard label="🍕 Кольцо — жадина">
                        Приходит — <InsightWord>не пускает</InsightWord>,<br />уходит — <InsightWord>не отпускает</InsightWord>.
                    </InsightCard>
                </DiagramBlock>
            )}
        </>
    )
}

// 6. Куда бежит ток: правая рука, большой палец по СВОЕМУ полю кольца.
const HandScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [move, setMove] = useState<Move>(1)
    useEffect(() => {
        if (phase < 1) return
        const t = setInterval(() => setMove((m) => (m === 1 ? -1 : 1)), 2600)
        return () => clearInterval(t)
    }, [phase])
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'А куда бежит ток? ' }, { sticker: 'Правая рука', color: RULE_COLOR }, { text: ' ✋: большой палец — по ' }, { sticker: 'B кольца', color: OWN_COLOR }, { text: ', согнутые пальцы покажут ' }, { sticker: 'ток', color: CURRENT_COLOR }, { text: '.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 2400)}>
                    <div className="w-full flex flex-col items-center gap-1">
                        <LenzView pos={0.55} move={move} showOwn face={false} handHint />
                        <p className="text-sm font-bold text-[#9AA7B0] text-center">
                            {move === 1 ? 'Магнит приближается: B кольца вверх → ток спереди вправо' : 'Магнит уходит: B кольца вниз → ток спереди влево'}
                        </p>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLine text="То же правило правой руки, что и в уроке про направление поля, — только теперь большой палец смотрит по полю кольца." className={TEXT_CLS} onSettled={onSettled} />
            )}
        </>
    )
}

// 7. Игра: куда смотрит своё поле кольца (или тока нет).
type Round = { pole: Pole; move: Move }
const GAME_BASE: Round[] = [
    { pole: 'N', move: 1 }, { pole: 'N', move: -1 }, { pole: 'S', move: 1 }, { pole: 'S', move: -1 }, { pole: 'N', move: 0 },
]
type Ans = 'up' | 'down' | 'none'
const answerOf = (r: Round): Ans => {
    const o = ownDirOf(r.pole, r.move)
    return o === 0 ? 'none' : o > 0 ? 'up' : 'down'
}
const hintOf = (r: Round) => {
    if (r.move === 0) return 'Магнит стоит — поток не меняется, кольцу не с чем бороться 😴'
    const growing = r.move === 1
    const ext = extDirOf(r.pole) > 0 ? 'вверх' : 'вниз'
    return growing
        ? `Поле магнита в кольце ${ext}, поток растёт — своё поле ПРОТИВ`
        : `Поле магнита в кольце ${ext}, поток падает — своё поле ТУДА ЖЕ`
}
const GameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [rounds] = useState<Round[]>(() => {
        const r = [...GAME_BASE]
        for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
        return r
    })
    const [round, setRound] = useState(0)
    const [solved, setSolved] = useState(false)
    const [wrong, setWrong] = useState<string | null>(null)
    const [wrongBtn, setWrongBtn] = useState<Ans | null>(null)
    const [pos, setPos] = useState(0.5)
    const done = round >= rounds.length
    const r = rounds[Math.min(round, rounds.length - 1)]

    // Магнит «ездит» по кругу: приближается/удаляется, стоит — стоит.
    useEffect(() => {
        if (done) return
        if (r.move === 0) { setPos(0.55); return }
        let p = r.move === 1 ? 0.15 : 0.9
        setPos(p)
        const t = setInterval(() => {
            p += r.move * 0.02
            if (r.move === 1 && p > 0.9) p = 0.15
            if (r.move === -1 && p < 0.15) p = 0.9
            setPos(p)
        }, 40)
        return () => clearInterval(t)
    }, [round, done, r.move])

    const pick = (a: Ans) => {
        if (solved || done) return
        if (a === answerOf(r)) {
            setSolved(true); setWrong(null); setWrongBtn(null)
            setTimeout(() => {
                setSolved(false)
                setRound((x) => x + 1)
                if (round + 1 >= rounds.length) setTimeout(() => onSettled?.(), 600)
            }, 1500)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrongBtn(a)
            setWrong(`Мимо! ${hintOf(r)}`)
        }
    }
    const BTNS: { a: Ans; label: string }[] = [{ a: 'up', label: '⬆ вверх' }, { a: 'down', label: '⬇ вниз' }, { a: 'none', label: '😴 тока нет' }]
    return (
        <>
            <TypedLine text="Проверь себя! Куда смотрит СВОЁ поле кольца?" className={cn(TEXT_CLS, 'font-extrabold')} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-2">
                        <p className="text-sm font-black text-center" style={{ color: '#9AA7B0' }}>
                            {done ? 'Все раунды пройдены!' : `Раунд ${round + 1} из ${rounds.length} · внизу полюс ${r.pole} · магнит ${r.move === 1 ? 'приближается ⬇' : r.move === -1 ? 'удаляется ⬆' : 'стоит'}`}
                        </p>
                        <LenzView key={round} pos={pos} move={r.move} pole={r.pole} showOwn hideAnswer={!solved && !done} />
                        {!done && (
                            <div className="grid grid-cols-3 gap-2 w-full">
                                {BTNS.map(({ a, label }) => (
                                    <button key={a} type="button" onClick={() => pick(a)} disabled={solved}
                                        className={cn('min-h-[56px] rounded-xl border-2 text-base font-black transition-colors',
                                            solved && a === answerOf(r) ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                                : wrongBtn === a ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {wrong && !solved && <div className="rounded-xl px-4 py-2 text-sm font-bold text-center bg-[#DC605B22] text-[#DC605B]">{wrong}</div>}
                        {done && <p className="text-lg font-black text-[#A1D151]">Ты понял кольцо лучше, чем оно само 🧠</p>}
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// «Кольцо отталкивает магнит» — следствие правила Ленца. Показываем ОДИН
// причинно-следственный цикл, а не непрерывное дрожание (пользователь: «не
// понятно, почему магнит дёргается»): толчок → СТОП-КАДР (ток бежит, своё поле
// кольца стоит, стрелка силы) → реплика кольца (Гэндальф «You shall not pass»)
// → магнит отбрасывает назад. С уводом — «Вернись! Не отпутю!» → тянет обратно.
type RepelStage = 'idle' | 'moving' | 'freeze' | 'recoil'
const RepelSpeech = ({ dir }: { dir: 1 | -1 }) => (
    <motion.div initial={{ scale: 0.4, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.55 }}
        className="relative mx-auto w-full rounded-2xl border-2 px-4 py-3"
        style={{ borderColor: OWN_COLOR, backgroundColor: hexToRgba(OWN_COLOR, 0.14) }}>
        <div className="flex items-center gap-3">
            <motion.div className="text-5xl leading-none shrink-0"
                animate={{ rotate: dir === 1 ? [0, -12, 8, 0] : [0, 10, -10, 0] }} transition={{ duration: 0.6, delay: 0.2 }}>
                {dir === 1 ? '🧙‍♂️' : '😭'}
            </motion.div>
            <div className="text-left">
                <div className="text-[11px] font-black opacity-70 text-[#F2F7FB]">Кольцо</div>
                {dir === 1 ? (
                    <>
                        <p className="font-black text-[#F2F7FB]">СТОПЭ! ✋ Не надо мне тут увеличивать поток через меня! НЕ ХОТЮЮ! НЕ ПУТЮЮЮ! 😤</p>
                        <p className="mt-1 text-lg font-black" style={{ color: '#FFE08A' }}>YOU SHALL NOT PASS! 🪄💥</p>
                    </>
                ) : (
                    <>
                        <p className="font-black text-[#F2F7FB]">НУ КУДА ЖЕ ТЫ?! 🥺 Поток, не уходи! ВЕРНИСЬ!</p>
                        <p className="mt-1 text-lg font-black" style={{ color: '#FFE08A' }}>НЕ ОТПУТЮ!!! 🫂💔</p>
                    </>
                )}
            </div>
        </div>
    </motion.div>
)
const RepelScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [pos, setPos] = useState(0.35)
    const [dir, setDir] = useState<1 | -1>(1)
    const [stage, setStage] = useState<RepelStage>('idle')
    const [tried, setTried] = useState<{ push: boolean; pull: boolean }>({ push: false, pull: false })
    const posRef = useRef(0.35)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const tick = useRef<ReturnType<typeof setInterval> | null>(null)
    useEffect(() => () => { timers.current.forEach(clearTimeout); if (tick.current) clearInterval(tick.current) }, [])
    const glide = (to: number, ms: number) => {
        if (tick.current) clearInterval(tick.current)
        const from = posRef.current, t0 = Date.now()
        tick.current = setInterval(() => {
            const k = Math.min(1, (Date.now() - t0) / ms)
            const eased = 1 - (1 - k) * (1 - k)
            posRef.current = from + (to - from) * eased
            setPos(posRef.current)
            if (k >= 1 && tick.current) { clearInterval(tick.current); tick.current = null }
        }, 30)
    }
    const run = (d: 1 | -1) => {
        if (stage !== 'idle') return
        setDir(d)
        // стартуем с понятной позиции
        posRef.current = d === 1 ? 0.3 : 0.75; setPos(posRef.current)
        setStage('moving')
        glide(d === 1 ? 0.62 : 0.45, 700)
        const at = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms))
        at(750, () => setStage('freeze'))                                  // стоп-кадр: кольцо отвечает
        at(3900, () => { setStage('recoil'); glide(d === 1 ? 0.5 : 0.58, 350) }) // отдача: отбросило / притянуло
        at(4700, () => { setStage('idle'); setTried((t) => (d === 1 ? { ...t, push: true } : { ...t, pull: true })) })
    }
    const both = tried.push && tried.pull
    useEffect(() => { if (both && phase === 1) { const t = setTimeout(() => setPhase(2), 600); return () => clearTimeout(t) } }, [both, phase])
    // В стоп-кадре показываем, что происходит «в эту долю секунды»: ток бежит, своё поле стоит, сила от кольца.
    const viewMove: Move = stage === 'moving' || stage === 'freeze' ? dir : 0
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'А ещё кольцо не просто защищается — оно ' }, { bold: 'ТОЛКАЕТСЯ' }, { text: '! Разберём по кадрам 🎬' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col gap-2">
                        <div className="relative">
                            <LenzView pos={pos} move={viewMove} showOwn showForce={stage === 'freeze'} wobble={false} />
                            {stage === 'freeze' && (
                                <motion.div initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                                    className="absolute left-2 top-2 rounded-lg px-2 py-1 text-xs font-black"
                                    style={{ background: '#FFE08A', color: '#3A2412', boxShadow: '0 3px 0 #8A4B14' }}>
                                    ⏸ СТОП-КАДР
                                </motion.div>
                            )}
                            {stage === 'recoil' && (
                                <motion.div initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    className="absolute left-2 top-2 rounded-lg px-2 py-1 text-xs font-black"
                                    style={{ background: OWN_COLOR, color: '#fff' }}>
                                    {dir === 1 ? '💥 БАМ! Отбросило' : '🧲 Вжух! Притянуло'}
                                </motion.div>
                            )}
                        </div>
                        {stage === 'freeze' || stage === 'recoil'
                            ? <RepelSpeech key={dir} dir={dir} />
                            : <Bubble text={stage === 'moving' ? (dir === 1 ? '😈 Вперёд, к кольцу!' : '😈 Ухожу…') : both ? '😌 Ну вот, всё понятно' : '👇 Жми кнопку и смотри по кадрам'} color={stage === 'moving' ? CURRENT_COLOR : '#9AA7B0'} />}
                        <div className="flex gap-2">
                            <button type="button" onClick={() => run(1)} disabled={stage !== 'idle'}
                                className={cn('flex-1 rounded-xl border-2 px-3 py-3 text-base font-black disabled:opacity-40', !tried.push && stage === 'idle' && 'animate-pulse')}
                                style={{ borderColor: RULE_COLOR, backgroundColor: hexToRgba(RULE_COLOR, 0.16), color: RULE_COLOR }}>⬇ Толкни к кольцу</button>
                            <button type="button" onClick={() => run(-1)} disabled={stage !== 'idle' || !tried.push}
                                className={cn('flex-1 rounded-xl border-2 px-3 py-3 text-base font-black disabled:opacity-40', tried.push && !tried.pull && stage === 'idle' && 'animate-pulse')}
                                style={{ borderColor: RULE_COLOR, backgroundColor: hexToRgba(RULE_COLOR, 0.16), color: RULE_COLOR }}>⬆ Утащи от кольца</button>
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1600)}>
                    <InsightCard>
                        Приближаешь — кольцо <InsightWord>отталкивает</InsightWord> 🧙‍♂️, уводишь — <InsightWord>тянет назад</InsightWord> 😭.
                        <br /><span className="text-base font-bold">Вот почему магнит «дёргается». Двигать его тяжелее — твоя работа и превращается в энергию тока ⚡ Энергия из ниоткуда не берётся!</span>
                    </InsightCard>
                </DiagramBlock>
            )}
        </>
    )
}

// Скорость → сила тока: ε = −ΔΦ/Δt.
const SpeedScene = ({ onSettled }: { onSettled?: () => void }) => {
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
    const moving = mag.move !== 0
    const bubble = !moving
        ? (both ? '😌 Разница видна?' : '😌 Сравни медленно и быстро')
        : mag.move === -1 ? '🙂 Возвращаем магнит'
            : mag.speed < 1 ? '🐢 Медленно… ток слабенький, стрелка чуть дрогнула' : '🚀 БЫСТРО! Ток ОГОГО, стрелка улетела!'
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Эксперимент: толкни магнит ' }, { bold: 'МЕДЛЕННО' }, { text: ', а потом ' }, { bold: 'БЫСТРО' }, { text: '. Где ' }, { sticker: 'ток', color: CURRENT_COLOR }, { text: ' сильнее?' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col gap-2">
                        <LenzView pos={mag.pos} move={mag.move} speed={mag.speed} showOwn />
                        <Bubble text={bubble} color={moving ? CURRENT_COLOR : '#9AA7B0'} />
                        <div className="flex gap-2">
                            <HoldBtn color={GGEGE_PALETTE.green.button} pulse={!tried.slow} onStart={() => mag.start(1, 0.45)} onRelease={mag.release} disabled={mag.pos >= 1}>🐢 Медленно</HoldBtn>
                            <HoldBtn color={CURRENT_COLOR} pulse={tried.slow && !tried.fast} onStart={() => mag.start(1, 2.1)} onRelease={mag.release} disabled={mag.pos >= 1}>🚀 Быстро</HoldBtn>
                        </div>
                        <HoldBtn color="#9AA7B0" onStart={() => mag.start(-1, 1.6)} onRelease={mag.release} disabled={mag.pos <= 0}>⬆ Зажми: вернуть магнит наверх</HoldBtn>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Чем ' }, { bold: 'БЫСТРЕЕ' }, { text: ' меняется поток, тем сильнее ток. Это и есть закон Фарадея:' }]}
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 3 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(4), 500)}>
                    <InsightCard label="⚡ Закон Фарадея">
                        <span className="text-3xl md:text-4xl font-black">
                            ε = <InsightWord color="#FF9AC8">−</InsightWord> <InsightWord color="#D8BBFF">ΔΦ</InsightWord> / <InsightWord>Δt</InsightWord>
                        </span>
                    </InsightCard>
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <TypedLineWithParts
                    parts={[{ sticker: 'ΔΦ', color: GGEGE_PALETTE.purple.button }, { text: ' — насколько изменился поток, ' }, { sticker: 'Δt', color: RULE_COLOR }, { text: ' — за сколько времени. А ' }, { sticker: 'минус', color: OWN_COLOR }, { text: ' — это и есть правило Ленца: кольцо сопротивляется 🛡️' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

const CONCEPT_SCENES = [IntroScene, ElasticFluxScene, BattleScene, PullScene, LenzRuleScene, RepelScene, SpeedScene, HandScene, GameScene]
const INTRO_CONCEPT_STEPS = CONCEPT_SCENES.length

const ConceptPhase = ({ onDone }: { onDone: () => void }) => {
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    useEffect(() => { setNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

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
        feedback: 'Магнит стоит → поток постоянный → тока нет.',
    },
    {
        renderPrompt: () => <>Индукционный ток своим полем…</>,
        renderOptions: () => ['помогает потоку меняться', 'мешает потоку меняться'],
        correct: 1,
        feedback: 'Правило Ленца: всегда МЕШАЕТ изменению потока.',
    },
    {
        renderPrompt: () => <>Магнит <b>приближают</b> к кольцу. Своё поле кольца направлено…</>,
        renderOptions: () => ['против поля магнита', 'так же, как поле магнита'],
        correct: 0,
        feedback: 'Поток растёт → кольцо ставит щиты против 🛡️',
    },
    {
        renderPrompt: () => <>Магнит <b>уводят</b> от кольца. Своё поле кольца направлено…</>,
        renderOptions: () => ['против поля магнита', 'так же, как поле магнита'],
        correct: 1,
        feedback: 'Поток падает → кольцо «держит» его, поле туда же 😭',
    },
    {
        renderPrompt: () => <>Магнит толкнули к кольцу в 2 раза <b>быстрее</b>. Ток в кольце…</>,
        renderOptions: () => ['такой же', 'сильнее'],
        correct: 1,
        feedback: 'ΔΦ та же, а Δt меньше → ε = −ΔΦ/Δt больше 🚀',
    },
    {
        renderPrompt: () => <>Магнит приближают к кольцу. Кольцо магнит…</>,
        renderOptions: () => ['отталкивает', 'притягивает'],
        correct: 0,
        feedback: 'Приходит — не пускает: кольцо толкает магнит назад 😤',
    },
    {
        renderPrompt: () => <>Как называется это правило?</>,
        renderOptions: () => ['Правило Ленца', 'Правило ленивца 🦥'],
        correct: 0,
        feedback: 'Эмилий Ленц, 1834 год. Хотя ленивец тоже не любит перемены 😄',
    },
    {
        renderPrompt: () => <>Бонус! Кто сопротивляется изменениям круче кольца? 😏</>,
        renderOptions: () => ['Я, когда будильник звонит в 7:00 😴'],
        correct: 0,
        feedback: 'Правило Ленца в чистом виде — ты своим полем мешаешь утру наступить 😂',
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
