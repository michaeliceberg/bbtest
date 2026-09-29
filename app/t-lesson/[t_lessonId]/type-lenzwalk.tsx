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
                parts={[{ text: 'Окей, нарушаем! Поток ' }, { sticker: 'Φ', color: GGEGE_PALETTE.purple.button }, { text: ' — наш цилиндр. Попробуй его ' }, { bold: 'растянуть' }, { text: ' 💪' }]}
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
                        Не вышло 😅 Поток <InsightWord>НЕ ДАЁТ</InsightWord> себя менять.
                        <br />Его возвращает обратно <InsightWord color="#FF9AC8">B инд</InsightWord> — поле-«пружина».
                    </InsightCard>
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
                <TypedLineWithParts
                    parts={[{ text: 'Но что если… нам ' }, { bold: 'захочется' }, { text: ' его нарушить? 😈' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 2. Кто делает B инд? Само кольцо: в нём включается ТОК, а ток создаёт поле
// (как в уроке про правую руку). Ученик сам жмёт «включить ток».
// Ток спереди вправо ⇔ поле кольца вверх (конвенция файла, см. шапку).
const WHO_CX = 160, WHO_CY = 150, WHO_RX = 96, WHO_RY = 26
const WhoScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [on, setOn] = useState(false)
    const back = `M ${WHO_CX - WHO_RX} ${WHO_CY} A ${WHO_RX} ${WHO_RY} 0 0 1 ${WHO_CX + WHO_RX} ${WHO_CY}`
    const front = `M ${WHO_CX - WHO_RX} ${WHO_CY} A ${WHO_RX} ${WHO_RY} 0 0 0 ${WHO_CX + WHO_RX} ${WHO_CY}`
    const ringCol = on ? CURRENT_COLOR : RING_COLOR
    const turnOn = () => {
        if (on) return
        setOn(true)
        setTimeout(() => setPhase(3), 1800)
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
                            {on && (
                                <motion.g initial={{ opacity: 0, scaleY: 0.1 }} animate={{ opacity: 1, scaleY: 1 }}
                                    transition={{ delay: 0.7, type: 'spring', bounce: 0.4 }}
                                    style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
                                    <FieldArrow x1={WHO_CX} y1={WHO_CY + 60} x2={WHO_CX} y2={WHO_CY - 110} color={OWN_COLOR} width={7} head={11} />
                                </motion.g>
                            )}
                            <path d={front} fill="none" stroke={ringCol} strokeWidth={7} strokeLinecap="round" />
                            {on && (
                                <>
                                    <motion.path d={front} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="6 18" strokeLinecap="round"
                                        animate={{ strokeDashoffset: [0, -48] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
                                    <g transform={`translate(${WHO_CX + WHO_RX + 4},${WHO_CY + WHO_RY + 18})`}>
                                        <PulseSticker text="I инд" color={CURRENT_COLOR} />
                                    </g>
                                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
                                        <SvgSticker x={WHO_CX + 44} y={WHO_CY - 92} text="B" sub="инд" color={OWN_COLOR} />
                                    </motion.g>
                                </>
                            )}
                        </svg>
                        {!on && <ReplyBtn onClick={turnOn} color={CURRENT_COLOR}>⚡ Включить ток</ReplyBtn>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Ток бежит по кольцу — и рождает поле ' }, { sticker: 'B инд', color: OWN_COLOR }, { text: '. Как в уроке про правую руку 🤙' }]}
                    onSettled={() => setPhase(4)}
                />
            )}
            {phase >= 4 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1400)}>
                    <InsightCard label="🛡️ Цепочка защиты">
                        Φ пытается измениться →<br />в кольце включается <InsightWord color="#FF9AC8">ток I инд</InsightWord> →<br />
                        он делает <InsightWord color="#FF9AC8">B инд</InsightWord> → поток <InsightWord>держится</InsightWord>.
                        <br /><span className="text-base font-bold">Этот ток — <b>индукционный</b>.</span>
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

const CONCEPT_SCENES = [HookScene, ElasticFluxScene, WhoScene, SpeedMagnetScene]
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
