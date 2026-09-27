// app/t-lesson/[t_lessonId]/type-dirwalk.tsx
//
// Тип DIRWALK — интерактивный разбор «направление магнитного поля вокруг
// прямого провода с током, правило правой руки» (тема «Электродинамика»).
// Стиль — как у остальных *WALK: накопительный лог сцен
// (SceneWrapper/useSceneFocus/useReplayNonces/BackButton), печатаемый текст,
// цветные стикеры. Ток — малиновый, поле B — синий (как в FARADAYWALK),
// правило/подсказки — оранжевый.
//
// Переделан 2026-09-27 (пользователь: «непонятно, анимация плохая») —
// сцены-массив CONCEPT_SCENES, как FARADAYWALK: опыт Эрстеда (компасы,
// «Включить ток») → кольца поля B → «Развернуть ток» → ЗАПОМНИ: правило
// правой руки (👍) → игра «куда поле спереди провода?» (4 раунда) → как
// рисуют • и × в задачах. Потом квиз (+бонус «Кто красавчик?»).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock, TypedLine,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

// lottie-react трогает document на импорте — без ssr:false падает на
// сервере (та же SSR-ловушка, что уже чинили у TrainerMascot/question-
// bubble/type-faradaywalk.tsx и др., см. CLAUDE.md).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Три роли — три цвета: ток (провод/кольцо) — малиновый, свободный от
// остальных ролей цвет палитры ggege (см. CLAUDE.md, "раньше используется
// только на /learn... свободен для новой роли"); поле B — синий, ТОТ ЖЕ,
// что уже устоялся для B в FARADAYWALK этой же темы (единый визуальный
// язык величины между соседними разборами курса физики); правило
// буравчика/крышечка — оранжевый (ATTENTION_COLOR-роль палитры,
// "смотри сюда/важно/внимание").
const CURRENT_COLOR = GGEGE_PALETTE.raspberry.button
const FIELD_COLOR = GGEGE_PALETTE.blue.button
const RULE_COLOR = GGEGE_PALETTE.orange.button

// ===================================================================
// ФАЗА "concept" — знакомство, по одному объекту, накопительный лог.
// ===================================================================

const CONCEPT_PAUSE_MS = 1000

// Стикер — тот же визуальный язык, что уже устоялся во всех *WALK
// разборах (bounce-появление, цветная рамка+подложка).
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

// Печатаемая строка с НЕСКОЛЬКИМИ стикерами в произвольных местах — та же
// техника, что и в LOGCOMBOWALK/FARADAYWALK: Typewriter печатает ПЛОСКУЮ
// строку (значения стикеров как обычный текст), после onDone вид
// подменяется на размеченную версию. break:true — печатается как обычный
// пробел, после onDone превращается в настоящий перенос строки (для
// принудительного разрыва в конкретном месте). bold — жирный текст БЕЗ
// цветной рамки (смысловое усиление слова, не термин-объект).
type LinePart = { text: string } | { sticker: string; color: string } | { break: true } | { bold: string }
const TypedLineWithParts = ({ parts, onSettled }: { parts: LinePart[]; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plainText = parts.map((p) => ('text' in p ? p.text : 'sticker' in p ? p.sticker : 'bold' in p ? p.bold : ' ')).join('')
    return (
        <div className="w-full text-center text-base md:text-lg text-[#F2F7FB]">
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

// SVG-версия стикера — маленькая рамка+буква, встроенная прямо в
// диаграмму (тот же визуальный язык, что и HTML-Sticker выше). ВАЖНО:
// позиционирующий transform — на СТАТИЧНОМ внешнем <g>, а не на самом
// motion.g — framer-motion для анимируемой группы перезаписывает
// transform/style своими motion-values (нужными для scale) и стирает
// вручную заданный transform-атрибут (тот же гэтча, что уже
// задокументирован в CLAUDE.md для motion.g в геометрических разборах).
const SvgTag = ({ x, y, text, color, delay = 0 }: { x: number; y: number; text: string; color: string; delay?: number }) => (
    <g transform={`translate(${x},${y})`}>
        <motion.g
            initial={{ opacity: 0, scale: 2.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        >
            <rect x={-14} y={-14} width={28} height={28} rx={7} fill={hexToRgba(color, 0.18)} stroke={color} strokeWidth={2} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill={color}>{text}</text>
        </motion.g>
    </g>
)

// ===== Провод с током (вид «сбоку-сверху», в перспективе) =====
// Провод вертикальный. Ток вверх (cur=1) → поле B крутится ПРОТИВ часовой
// стрелки, если смотреть сверху; на экране (кольцо-эллипс в перспективе)
// тоже против часовой: спереди (низ эллипса) → вправо, слева — к зрителю
// (•), справа — от зрителя (×). Проверено по B ∝ I·(ŷ × r̂).
// Ток вниз (cur=-1) — всё наоборот. cur=0 — тока нет.
type Cur = 1 | -1 | 0
const W_W = 320, W_H = 360, W_CX = 160, W_TOP = 24, W_BOT = 336
const RING_RX = 92, RING_RY = 22
const RING_YS = [104, 190, 276]
const MID_Y = 190
const REMEMBER_COLOR = '#F2C35B'

// Касательная к эллипсу в точке параметра θ (градусы, экранные) по направлению поля.
function ringTangentDeg(thetaDeg: number, cur: Cur) {
    const t = (thetaDeg * Math.PI) / 180
    const dx = RING_RX * Math.sin(t) * (cur === -1 ? -1 : 1)
    const dy = -RING_RY * Math.cos(t) * (cur === -1 ? -1 : 1)
    return (Math.atan2(dy, dx) * 180) / Math.PI
}
const ringPt = (cy: number, thetaDeg: number) => {
    const t = (thetaDeg * Math.PI) / 180
    return { x: W_CX + RING_RX * Math.cos(t), y: cy + RING_RY * Math.sin(t) }
}

// Ток — бегущие шевроны вдоль провода.
const CurrentFlow = ({ cur }: { cur: Cur }) => {
    if (cur === 0) return null
    const up = cur === 1
    const ys = Array.from({ length: 8 }, (_, i) => W_TOP - 60 + i * 60)
    return (
        <g clipPath="url(#dir-wire-clip)">
            <motion.g key={cur} animate={{ y: up ? [0, -60] : [0, 60] }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                {ys.map((y) => (
                    <path key={y} d={up ? `M${W_CX - 7},${y + 8} L${W_CX},${y} L${W_CX + 7},${y + 8}` : `M${W_CX - 7},${y - 8} L${W_CX},${y} L${W_CX + 7},${y - 8}`}
                        fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                ))}
            </motion.g>
        </g>
    )
}

// Кольцо поля: пунктир бежит в сторону поля, шеврон спереди.
const FieldRing = ({ cy, cur, dir = true, highlight = false }: { cy: number; cur: Cur; dir?: boolean; highlight?: boolean }) => {
    const front = ringPt(cy, 90)
    const ang = ringTangentDeg(90, cur)
    return (
        <g>
            <motion.ellipse cx={W_CX} cy={cy} rx={RING_RX} ry={RING_RY} fill="none" stroke={FIELD_COLOR}
                strokeWidth={highlight ? 4 : 3} strokeDasharray="10 8" strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={dir && cur !== 0 ? { opacity: 1, strokeDashoffset: cur === 1 ? [0, 36] : [0, -36] } : { opacity: 1 }}
                transition={dir && cur !== 0 ? { opacity: { duration: 0.5 }, strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: 'linear' } } : { duration: 0.5 }} />
            {dir && cur !== 0 && (
                <g transform={`translate(${front.x},${front.y}) rotate(${ang})`}>
                    <motion.path key={cur} d="M-9,-9 L3,0 L-9,9" fill="none" stroke={FIELD_COLOR} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} />
                </g>
            )}
        </g>
    )
}

// Компас: стрелка (красный конец = N) сначала вся смотрит «на север»,
// при токе — по касательной к кольцу, по направлению поля.
const COMPASS_THETAS = [0, 55, 125, 180, 235, 305]
const Compass = ({ thetaDeg, cur }: { thetaDeg: number; cur: Cur }) => {
    const p = ringPt(MID_Y, thetaDeg)
    const rot = cur === 0 ? -60 : ringTangentDeg(thetaDeg, cur)
    return (
        <g transform={`translate(${p.x},${p.y})`}>
            <circle r={14} fill="#F2F7FB" stroke="#9AA7B0" strokeWidth={2} />
            {/* CSS-поворот с «перелётом» (кривая с overshoot) — стрелка покачивается и встаёт по полю. */}
            <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: '0px 0px', transition: 'transform 1s cubic-bezier(0.34, 1.8, 0.5, 1)' }}>
                <path d="M0,-3.5 L11,0 L0,3.5 Z" fill="#DC605B" />
                <path d="M0,-3.5 L-11,0 L0,3.5 Z" fill="#53ADEF" />
            </g>
            <circle r={2} fill="#161F23" />
        </g>
    )
}

// Схема «правой руки» вместо эмодзи 👍 (эмодзи рисуется по-разному на разных
// устройствах — часто это ЛЕВАЯ рука, и направление пальцев по нему не
// прочитать). Большой палец — толстая оранжевая стрелка, согнутые пальцы —
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
const RightHandHint = ({ cx, cy, rx, ry, thumbUp, curlRight, thumbX, thumbY0, thumbY1 }: {
    cx: number; cy: number; rx: number; ry: number; thumbUp: boolean; curlRight: boolean; thumbX: number; thumbY0: number; thumbY1: number
}) => {
    const arc = curlArc(cx, cy, rx, ry, curlRight)
    const tipY = thumbUp ? Math.min(thumbY0, thumbY1) : Math.max(thumbY0, thumbY1)
    const baseY = thumbUp ? Math.max(thumbY0, thumbY1) : Math.min(thumbY0, thumbY1)
    const s = thumbUp ? 1 : -1
    return (
        <g>
            <line x1={thumbX} y1={baseY} x2={thumbX} y2={tipY} stroke={HAND_COLOR} strokeWidth={9} strokeLinecap="round" opacity={0.95} />
            <path d={`M ${thumbX - 13} ${tipY + 14 * s} L ${thumbX} ${tipY} L ${thumbX + 13} ${tipY + 14 * s}`} fill="none" stroke={HAND_COLOR} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <text x={thumbX + 16} y={tipY + 16 * s + 4} fontSize={12} fontWeight={900} fill={HAND_COLOR}>палец</text>
            <path d={arc.d} fill="none" stroke={HAND_COLOR} strokeWidth={6} strokeLinecap="round" strokeDasharray="1 0" />
            <g transform={`translate(${arc.end.x},${arc.end.y}) rotate(${arc.ang})`}>
                <path d="M -12 -10 L 2 0 L -12 10" fill="none" stroke={HAND_COLOR} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x={cx} y={cy + ry + 22} textAnchor="middle" fontSize={12} fontWeight={900} fill={HAND_COLOR}>пальцы</text>
        </g>
    )
}

const WireScene = ({ cur, rings = [], compasses = false, hand = false, dotCross = false, hideDir = false }: {
    cur: Cur; rings?: number[]; compasses?: boolean; hand?: boolean; dotCross?: boolean; hideDir?: boolean
}) => (
    <div className="flex w-full justify-center py-1">
        <svg viewBox={`0 0 ${W_W} ${W_H}`} className="w-full max-w-[300px] h-auto">
            <defs>
                <clipPath id="dir-wire-clip"><rect x={W_CX - 6} y={W_TOP} width={12} height={W_BOT - W_TOP} rx={6} /></clipPath>
            </defs>
            {rings.map((cy) => <FieldRing key={cy} cy={cy} cur={cur} dir={!hideDir} highlight={dotCross && cy === MID_Y} />)}
            {/* провод поверх колец */}
            <motion.rect x={W_CX - 6} y={W_TOP} width={12} height={W_BOT - W_TOP} rx={6}
                animate={{ fill: cur === 0 ? '#5C6B73' : CURRENT_COLOR }} transition={{ duration: 0.4 }} />
            <CurrentFlow cur={cur} />
            {/* передняя часть колец — поверх провода (провод «внутри» кольца) */}
            {rings.map((cy) => (
                <path key={`f${cy}`} d={`M ${W_CX - 14} ${cy + RING_RY - 1.2} Q ${W_CX} ${cy + RING_RY + 0.6} ${W_CX + 14} ${cy + RING_RY - 1.2}`}
                    fill="none" stroke={FIELD_COLOR} strokeWidth={3} />
            ))}
            {cur !== 0 && (
                <g transform={`translate(${W_CX + 24},${cur === 1 ? W_TOP + 16 : W_BOT - 16})`}>
                    <SvgTag x={0} y={0} text="I" color={CURRENT_COLOR} />
                </g>
            )}
            {compasses && COMPASS_THETAS.map((t) => <Compass key={t} thetaDeg={t} cur={cur} />)}
            {rings.length > 0 && !hideDir && cur !== 0 && <SvgTag x={W_CX + RING_RX + 20} y={RING_YS[0]} text="B" color={FIELD_COLOR} delay={0.6} />}
            {hand && cur !== 0 && (
                // Правая рука: палец — по току (вдоль провода), пальцы — по полю.
                // Ток вверх → поле спереди вправо (см. ringTangentDeg).
                <RightHandHint cx={W_CX} cy={MID_Y} rx={RING_RX + 14} ry={RING_RY + 10} thumbUp={cur === 1} curlRight={cur === 1}
                    thumbX={W_CX + 26} thumbY0={MID_Y - 70} thumbY1={MID_Y + 70} />
            )}
            {dotCross && (
                <>
                    <g transform={`translate(${ringPt(MID_Y, 180).x},${MID_Y})`}>
                        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.55, delay: 0.3 }}>
                            <circle r={15} fill="#161F23" stroke={FIELD_COLOR} strokeWidth={3} />
                            <circle r={5} fill={FIELD_COLOR} />
                        </motion.g>
                    </g>
                    <g transform={`translate(${ringPt(MID_Y, 0).x},${MID_Y})`}>
                        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.55, delay: 1.1 }}>
                            <circle r={15} fill="#161F23" stroke={FIELD_COLOR} strokeWidth={3} />
                            <path d="M-7,-7 L7,7 M-7,7 L7,-7" stroke={FIELD_COLOR} strokeWidth={3.5} strokeLinecap="round" />
                        </motion.g>
                    </g>
                </>
            )}
        </svg>
    </div>
)

const BigBtn = ({ children, onClick, color, pulse = true }: { children: React.ReactNode; onClick: () => void; color: string; pulse?: boolean }) => (
    <button
        type="button"
        onClick={() => { playSound('/click6.wav'); onClick() }}
        className={cn('mx-auto flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-lg font-black', pulse && 'animate-pulse')}
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.16), color }}
    >
        {children}
    </button>
)

const TEXT_CLS = 'w-full text-center text-base md:text-lg text-[#F2F7FB]'

// 0. Опыт Эрстеда: компасы вокруг провода, «Включить ток».
const OerstedScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [cur, setCur] = useState<Cur>(0)
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Провод торчит из стола, вокруг лежат ' }, { sticker: 'компасы', color: RULE_COLOR }, { text: '. Все смотрят на север.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <WireScene cur={cur} compasses />
                    {cur === 0 && (
                        <BigBtn color={CURRENT_COLOR} onClick={() => { setCur(1); setTimeout(() => setPhase(2), 1600) }}>⚡ Включить ток</BigBtn>
                    )}
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Вжух! Стрелки компасов развернулись ' }, { bold: 'ПО КРУГУ' }, { text: ' вокруг провода 🧭' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 1. Поле B кольцами вокруг провода.
const RingsScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase(1), 700)}>
                <WireScene cur={1} rings={RING_YS} />
            </DiagramBlock>
            {phase >= 1 && (
                <TypedLineWithParts
                    parts={[{ text: 'Значит, ' }, { sticker: 'ток', color: CURRENT_COLOR }, { text: ' создаёт вокруг провода ' }, { sticker: 'магнитное поле B', color: FIELD_COLOR }, { text: '. Оно обвивает провод кольцами — как хула-хуп 😄' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 2. Поменяй направление тока.
const FlipScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [cur, setCur] = useState<Cur>(1)
    const [flipped, setFlipped] = useState(false)
    return (
        <>
            <TypedLine text="А что будет, если пустить ток в другую сторону? Жми!" className={TEXT_CLS} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <WireScene cur={cur} rings={RING_YS} compasses />
                    <BigBtn color={CURRENT_COLOR} pulse={!flipped} onClick={() => {
                        setCur((c) => (c === 1 ? -1 : 1))
                        if (!flipped) { setFlipped(true); setTimeout(() => setPhase(2), 1400) }
                    }}>⇅ Развернуть ток</BigBtn>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Ток развернулся — и поле закрутилось в ' }, { bold: 'ДРУГУЮ СТОРОНУ' }, { text: '! И компасы тоже.' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 3. ЗАПОМНИ: правило правой руки.
const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}>
            ЗАПОМНИ!
        </div>
    </div>
)
const HandScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase(1), 500)}><RememberBanner /></DiagramBlock>
            {phase >= 1 && (
                <TypedLineWithParts
                    parts={[{ text: 'Правило ' }, { sticker: 'правой руки', color: RULE_COLOR }, { text: ': обхвати провод правой рукой — большой палец по ' }, { sticker: 'току', color: CURRENT_COLOR }, { text: '.' }]}
                    onSettled={() => setPhase(2)}
                />
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(3), 1200)}>
                    <WireScene cur={1} rings={[MID_Y]} hand />
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Согнутые пальцы покажут, куда крутится ' }, { sticker: 'поле B', color: FIELD_COLOR }, { text: '. Палец вверх — пальцы спереди идут вправо ✋' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 4. Игра: куда направлено поле спереди провода?
const GAME_ROUNDS = 4
const FieldGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [rounds] = useState<Cur[]>(() => {
        const r: Cur[] = [1, -1, 1, -1]
        for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
        return r
    })
    const [round, setRound] = useState(0)
    const [solved, setSolved] = useState(false)
    const [wrong, setWrong] = useState<string | null>(null)
    const [wrongBtn, setWrongBtn] = useState<'L' | 'R' | null>(null)
    const done = round >= GAME_ROUNDS
    const cur = rounds[Math.min(round, GAME_ROUNDS - 1)]
    const pick = (side: 'L' | 'R') => {
        if (solved || done) return
        playSound('/click6.wav')
        const correct = cur === 1 ? 'R' : 'L'
        if (side === correct) {
            setSolved(true); setWrong(null); setWrongBtn(null)
            setTimeout(() => {
                setSolved(false)
                setRound((r) => r + 1)
                if (round + 1 >= GAME_ROUNDS) setTimeout(() => onSettled?.(), 600)
            }, 1200)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrongBtn(side)
            setWrong(cur === 1 ? 'Мимо! Большой палец ВВЕРХ — согнутые пальцы спереди идут вправо' : 'Мимо! Большой палец ВНИЗ — согнутые пальцы спереди идут влево')
        }
    }
    return (
        <>
            <TypedLine text="Проверь себя! Куда направлено поле СПЕРЕДИ провода?" className={cn(TEXT_CLS, 'font-extrabold')} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <p className="text-sm font-black" style={{ color: '#9AA7B0' }}>{done ? 'Все 4 угаданы!' : `Раунд ${round + 1} из ${GAME_ROUNDS} · ток ${cur === 1 ? 'ВВЕРХ' : 'ВНИЗ'}`}</p>
                        <WireScene key={round} cur={cur} rings={[MID_Y]} hideDir={!solved && !done} />
                        {!done && (
                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                {(['L', 'R'] as const).map((s) => (
                                    <button key={s} type="button" onClick={() => pick(s)} disabled={solved}
                                        className={cn('min-h-[60px] rounded-xl border-2 text-xl font-black transition-colors',
                                            solved && (s === (cur === 1 ? 'R' : 'L')) ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                                : wrongBtn === s ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                        {s === 'L' ? '← влево' : 'вправо →'}
                                    </button>
                                ))}
                            </div>
                        )}
                        {wrong && !solved && <div className="rounded-xl px-4 py-2 text-sm font-bold text-center bg-[#DC605B22] text-[#DC605B]">{wrong}</div>}
                        {done && <p className="text-lg font-black text-[#A1D151]">Ты мастер правой руки 🤙</p>}
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// 5. Как рисуют в задачах: • и ×.
const DotCrossScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedLine text="В задачах ЕГЭ поле рисуют значками. Смотри:" className={TEXT_CLS} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1600)}>
                    <WireScene cur={1} rings={[MID_Y]} dotCross />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Слева поле летит ' }, { bold: 'НА ТЕБЯ' }, { text: ' — рисуют точкой ' }, { sticker: '•', color: FIELD_COLOR }, { text: '. Справа — ' }, { bold: 'ОТ ТЕБЯ' }, { text: ', крестиком ' }, { sticker: '×', color: FIELD_COLOR }, { text: '.' }]}
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 3 && (
                <TypedLine
                    text="Как стрела 🏹: остриё летит на тебя — точка, оперение улетает от тебя — крестик."
                    className={TEXT_CLS}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

const CONCEPT_SCENES = [OerstedScene, RingsScene, FlipScene, HandScene, FieldGameScene, DotCrossScene]
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
        renderPrompt: () => <>Как называется правило для направления поля вокруг провода?</>,
        renderOptions: () => ['Правило правой руки', 'Правило левой ноги'],
        correct: 0,
        feedback: 'Правило правой руки: большой палец — по току.',
    },
    {
        renderPrompt: () => <>Большой палец правой руки показывает направление…</>,
        renderOptions: () => [<span key="a">тока <Sticker value="I" color={CURRENT_COLOR} /></span>, <span key="b">поля <Sticker value="B" color={FIELD_COLOR} /></span>],
        correct: 0,
        feedback: 'Палец — по току, согнутые пальцы — по полю.',
    },
    {
        renderPrompt: () => <>Ток в вертикальном проводе течёт <b>ВВЕРХ</b>. Куда направлено поле <b>спереди</b> провода?</>,
        renderOptions: () => ['вправо →', '← влево'],
        correct: 0,
        feedback: 'Палец вверх — согнутые пальцы спереди идут вправо.',
    },
    {
        renderPrompt: () => <>Ток течёт <b>ВНИЗ</b>. Куда направлено поле <b>спереди</b> провода?</>,
        renderOptions: () => ['вправо →', '← влево'],
        correct: 1,
        feedback: 'Палец вниз — поле крутится в другую сторону, спереди влево.',
    },
    {
        renderPrompt: () => <>Что означает значок <Sticker value="×" color={FIELD_COLOR} /> на рисунке поля?</>,
        renderOptions: () => ['Поле уходит от тебя', 'Поле летит на тебя'],
        correct: 0,
        feedback: '× — оперение стрелы, которая улетает от тебя.',
    },
    {
        renderPrompt: () => <>Бонус! Кто красавчик? 😎</>,
        renderOptions: () => ['Я красавчик! 🔥'],
        correct: 0,
        feedback: 'Без вариантов — ты! Правая рука теперь твоё секретное оружие 🤙',
    },
]

const pickQuizFeedbackPhrase = (i: number): string =>
    CORRECT_FEEDBACK_PHRASES[i % CORRECT_FEEDBACK_PHRASES.length]

const CONCEPT_QUIZ_TITLE = 'Проверим себя'

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
        playSound('/click6.wav')
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
            const isLast = trialIndex + 1 >= CONCEPT_QUIZ.length
            if (isLast) {
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
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">{CONCEPT_QUIZ_TITLE}</span>
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
                                    <p className="w-full text-base md:text-lg text-[#F2F7FB] text-center font-bold">
                                        {qq.renderPrompt()}
                                    </p>
                                </div>
                                {isCurrent && !checked && (
                                    <>
                                        <div className="grid grid-cols-1 gap-3">
                                            {opts.map((opt, oi) => {
                                                const isWrongTriedOpt = wrongTried.includes(oi)
                                                return (
                                                    <QuizAnswerButton
                                                        key={oi}
                                                        state={isWrongTriedOpt ? 'wrong' : 'idle'}
                                                        disabled={isWrongTriedOpt}
                                                        onClick={() => handlePick(i, oi)}
                                                    >
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
                                                    <QuizAnswerButton
                                                        key={oi}
                                                        disabled
                                                        state={isCorrectOpt ? 'correct' : (isWrongTriedOpt ? 'wrong' : 'idle')}
                                                    >
                                                        {opt}
                                                    </QuizAnswerButton>
                                                )
                                            })}
                                        </div>
                                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                            <div className="text-center">
                                                <div className="font-extrabold" style={{ color: CORRECT_COLOR }}>
                                                    {pickQuizFeedbackPhrase(i)}
                                                </div>
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
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={advancing}
                        className={walkthroughButtonClass(!advancing)}
                        style={walkthroughButtonStyle(!advancing)}
                    >
                        {trialIndex + 1 >= CONCEPT_QUIZ.length ? 'Готово' : nextLabel}
                    </button>
                </div>
            )}
        </div>
    )
}

// ===== Основной компонент =====

export const TypeDirWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'concept' | 'quiz'>('concept')
    const finishedRef = useRef(false)

    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    if (phase === 'concept') {
        return <ConceptPhase onDone={() => setPhase('quiz')} />
    }
    return <ConceptQuizPhase onDone={handleFinish} />
}
