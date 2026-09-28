// app/t-lesson/[t_lessonId]/type-dirwalk.tsx
//
// Тип DIRWALK — интерактивный разбор «направление магнитного поля вокруг
// прямого провода с током, правило правой руки» (тема «Электродинамика»).
// Стиль — как у остальных *WALK: накопительный лог сцен
// (SceneWrapper/useSceneFocus/useReplayNonces/BackButton), печатаемый текст,
// цветные стикеры. Ток — малиновый, поле B — синий (как в FARADAYWALK),
// правило/подсказки — оранжевый.
//
// Переделан 2026-09-29 (пользователь: «сложно, хочу проще, с юмором, меньше слов»):
// один БОЛЬШОЙ компас перед проводом → кольца поля + «Развернуть ток» →
// правая рука-стикер, продетая проводом (кольцо поля вокруг кулака) →
// игра «Хватай провод»: выбрать руку (палец по току), потом кольцо (куда
// крутится поле) — без слова «спереди» → значки • и ×. Квиз с кольцами-
// картинками вместо «куда поле спереди провода».

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
import { InsightCard, InsightWord } from '@/components/geometry/WalkthroughCards'
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

const WireScene = ({ cur, rings = [], dotCross = false, hideDir = false }: {
    cur: Cur; rings?: number[]; dotCross?: boolean; hideDir?: boolean
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
            {rings.length > 0 && !hideDir && cur !== 0 && <SvgTag x={W_CX + RING_RX + 20} y={RING_YS[0]} text="B" color={FIELD_COLOR} delay={0.6} />}
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


// ===== Рука-стикер, продетая проводом (идея пользователя 2026-09-29) =====
// Картинки public/hands/right-{up,down}.webp, повёрнуты на ±22°, чтобы
// большой палец стоял ровно вдоль провода. Провод рисуется ЗА рукой —
// кулак его закрывает, выглядит как «провод продет сквозь кулак».
// Поле B — кольцо вокруг кулака: задняя половина за рукой, передняя
// поверх, по ней бегут чёрточки и шеврон в сторону согнутых пальцев.
// Ток вверх → пальцы спереди идут вправо; ток вниз → влево.
const HG_W = 320, HG_H = 400
const HG_OX = 30, HG_OY = 70, HG_IMG = 256
const HG_WX = HG_OX + 98
const HG_RX = 84, HG_RY = 22
const hgRingY = (cur: Cur) => (cur === 1 ? HG_OY + 134 : HG_OY + 106)

// Кольцо поля вокруг провода: back — задняя половина, front — передняя с бегущими чёрточками.
const GripRing = ({ cx, cy, rx, ry, dirRight, part, color = FIELD_COLOR, width = 5 }: {
    cx: number; cy: number; rx: number; ry: number; dirRight: boolean; part: 'back' | 'front'; color?: string; width?: number
}) => {
    if (part === 'back') {
        return <path d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`} fill="none" stroke={color} strokeWidth={width - 1} strokeDasharray="6 7" opacity={0.55} />
    }
    const d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`
    return (
        <g>
            <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
            <motion.path d={d} fill="none" stroke="#fff" strokeWidth={width * 0.5} strokeLinecap="round" strokeDasharray="4 14"
                animate={{ strokeDashoffset: dirRight ? [0, -36] : [0, 36] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            {/* шеврон сбоку от провода (не на нём) — по касательной, в сторону движения */}
            {(() => {
                const th = ((dirRight ? 50 : 130) * Math.PI) / 180
                const px = cx + rx * Math.cos(th), py = cy + ry * Math.sin(th)
                const dx = dirRight ? rx * Math.sin(th) : -rx * Math.sin(th)
                const dy = dirRight ? -ry * Math.cos(th) : ry * Math.cos(th)
                const ang = (Math.atan2(dy, dx) * 180) / Math.PI
                return (
                    <g transform={`translate(${px},${py}) rotate(${ang})`}>
                        <path d="M -8 -10 L 6 0 L -8 10" fill="none" stroke={color} strokeWidth={width + 1} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                )
            })()}
        </g>
    )
}

// Бегущий ток по вертикальному проводу (шевроны), в пределах [y1, y2].
const WireChevrons = ({ x, y1, y2, up, id }: { x: number; y1: number; y2: number; up: boolean; id: string }) => {
    const ys = Array.from({ length: Math.ceil((y2 - y1) / 44) + 3 }, (_, i) => y1 - 44 + i * 44)
    return (
        <g clipPath={`url(#${id})`}>
            <defs><clipPath id={id}><rect x={x - 8} y={y1} width={16} height={y2 - y1} /></clipPath></defs>
            <motion.g key={up ? 'u' : 'd'} animate={{ y: up ? [0, -44] : [0, 44] }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                {ys.map((y) => (
                    <path key={y} d={up ? `M${x - 6},${y + 7} L${x},${y} L${x + 6},${y + 7}` : `M${x - 6},${y - 7} L${x},${y} L${x + 6},${y - 7}`}
                        fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                ))}
            </motion.g>
        </g>
    )
}

const HandGrip = ({ cur, showRing = true, showHand = true }: { cur: Cur; showRing?: boolean; showHand?: boolean }) => {
    const up = cur === 1
    const cy = hgRingY(cur)
    return (
        <svg viewBox={`0 0 ${HG_W} ${HG_H}`} className="w-full max-w-[300px] h-auto">
            {showRing && <GripRing cx={HG_WX} cy={cy} rx={HG_RX} ry={HG_RY} dirRight={up} part="back" />}
            <rect x={HG_WX - 7} y={10} width={14} height={HG_H - 20} rx={7} fill={CURRENT_COLOR} />
            <WireChevrons x={HG_WX} y1={10} y2={HG_H - 10} up={up} id={`hg-wire-${up ? 'u' : 'd'}`} />
            {showHand && (
                <motion.image key={up ? 'up' : 'down'} href={up ? '/hands/right-up.webp' : '/hands/right-down.webp'}
                    x={HG_OX} y={HG_OY} width={HG_IMG} height={HG_IMG}
                    transform={`rotate(${up ? 22 : -22} ${HG_OX + HG_IMG / 2} ${HG_OY + HG_IMG / 2})`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} />
            )}
            {showRing && (
                <motion.g key={`ring${cur}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
                    <GripRing cx={HG_WX} cy={cy} rx={HG_RX} ry={HG_RY} dirRight={up} part="front" />
                    <SvgTag x={HG_WX + HG_RX + 18} y={cy} text="B" color={FIELD_COLOR} />
                </motion.g>
            )}
            <SvgTag x={HG_WX - 28} y={up ? 30 : HG_H - 30} text="I" color={CURRENT_COLOR} />
        </svg>
    )
}

// Маленькое кольцо-вариант ответа: куда бегут чёрточки спереди.
const MiniRing = ({ dirRight }: { dirRight: boolean }) => (
    <svg viewBox="0 0 150 70" className="h-16 w-auto">
        <GripRing cx={75} cy={35} rx={56} ry={15} dirRight={dirRight} part="back" width={4} />
        <rect x={71} y={4} width={8} height={62} rx={4} fill="#5C6B73" />
        <GripRing cx={75} cy={35} rx={56} ry={15} dirRight={dirRight} part="front" width={4} />
    </svg>
)

const BigBtn = ({ children, onClick, color, pulse = true }: { children: React.ReactNode; onClick: () => void; color: string; pulse?: boolean }) => (
    <button
        type="button"
        onClick={() => { onClick() }}
        className={cn('mx-auto flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-lg font-black', pulse && 'animate-pulse')}
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.16), color }}
    >
        {children}
    </button>
)

const TEXT_CLS = 'w-full text-center text-base md:text-lg text-[#F2F7FB]'

// 0. Один БОЛЬШОЙ компас перед проводом. Включил ток — стрелку повернуло.
// Компас стоит прямо перед проводом: при токе вверх поле там идёт вправо.
const BC_W = 320, BC_H = 320, BC_WX = 160, BC_CY = 215, BC_R = 70
const BigCompassScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [on, setOn] = useState(false)
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Провод 🔌 и ' }, { sticker: 'компас', color: RULE_COLOR }, { text: '. Стрелка смотрит на север.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <svg viewBox={`0 0 ${BC_W} ${BC_H}`} className="w-full max-w-[300px] h-auto">
                            <motion.rect x={BC_WX - 7} y={10} width={14} height={BC_H - 20} rx={7}
                                animate={{ fill: on ? CURRENT_COLOR : '#5C6B73' }} transition={{ duration: 0.4 }} />
                            {on && <WireChevrons x={BC_WX} y1={10} y2={BC_H - 10} up id="bc-wire" />}
                            {on && <SvgTag x={BC_WX + 26} y={34} text="I" color={CURRENT_COLOR} />}
                            {/* компас перед проводом */}
                            <circle cx={BC_WX} cy={BC_CY} r={BC_R + 8} fill="#C9CFD3" />
                            <circle cx={BC_WX} cy={BC_CY} r={BC_R} fill="#F2F7FB" stroke="#9AA7B0" strokeWidth={3} />
                            {['С', 'В', 'Ю', 'З'].map((t, i) => {
                                const a = (i * Math.PI) / 2
                                return <text key={t} x={BC_WX + Math.sin(a) * (BC_R - 16)} y={BC_CY - Math.cos(a) * (BC_R - 16) + 6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#5C6B73">{t}</text>
                            })}
                            {/* стрелка: CSS-поворот с перелётом (как у компасов раньше) */}
                            <g style={{ transform: `translate(${BC_WX}px, ${BC_CY}px) rotate(${on ? 90 : 0}deg)`, transition: 'transform 1.2s cubic-bezier(0.34, 1.8, 0.5, 1)' }}>
                                <path d="M -9 0 L 0 -52 L 9 0 Z" fill="#DC605B" />
                                <path d="M -9 0 L 0 52 L 9 0 Z" fill="#53ADEF" />
                                <circle r={6} fill="#161F23" />
                            </g>
                        </svg>
                        {!on && <BigBtn color={CURRENT_COLOR} onClick={() => { setOn(true); setTimeout(() => setPhase(2), 1600) }}>⚡ Включить ток</BigBtn>}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Опа! Стрелку ' }, { bold: 'повернуло' }, { text: ' 😳 Значит, вокруг тока есть ' }, { sticker: 'магнитное поле B', color: FIELD_COLOR }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 1. Поле кольцами вокруг провода + «Развернуть ток».
const RingsFlipScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [cur, setCur] = useState<Cur>(1)
    const [flipped, setFlipped] = useState(false)
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Поле ' }, { sticker: 'B', color: FIELD_COLOR }, { text: ' крутится вокруг провода — как хула-хуп 🌀' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <WireScene cur={cur} rings={RING_YS} />
                    <BigBtn color={CURRENT_COLOR} pulse={!flipped} onClick={() => {
                        setCur((c) => (c === 1 ? -1 : 1))
                        if (!flipped) { setFlipped(true); setTimeout(() => setPhase(2), 1400) }
                    }}>⇅ Развернуть ток</BigBtn>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Ток в другую сторону — поле крутится в ' }, { bold: 'другую сторону' }, { text: ' 🔄' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// 2. ЗАПОМНИ: правая рука, продетая проводом.
const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}>
            ЗАПОМНИ!
        </div>
    </div>
)
const HandRuleScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [cur, setCur] = useState<Cur>(1)
    const [flipped, setFlipped] = useState(false)
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'А куда крутится? Спросим ' }, { sticker: 'правую руку', color: RULE_COLOR }, { text: ' ✋' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 900)}>
                    <div className="w-full flex flex-col items-center gap-2">
                        <HandGrip cur={cur} />
                        {phase >= 3 && (
                            <BigBtn color={CURRENT_COLOR} pulse={!flipped} onClick={() => {
                                setCur((c) => (c === 1 ? -1 : 1))
                                if (!flipped) { setFlipped(true); setTimeout(() => setPhase(4), 1500) }
                            }}>⇅ Развернуть ток</BigBtn>
                        )}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Большой палец — по ' }, { sticker: 'току I', color: CURRENT_COLOR }, { break: true }, { text: 'Пальцы крутят ' }, { sticker: 'поле B', color: FIELD_COLOR }]}
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 4 && (
                <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 900)}>
                    <RememberBanner />
                    <div className="mt-3">
                        <InsightCard label="✋ Правило правой руки">
                            Большой палец — <InsightWord color="#FF9AC8">по току</InsightWord>,
                            <br />пальцы — <InsightWord color="#8FD0FF">как крутится поле</InsightWord>
                        </InsightCard>
                    </div>
                </DiagramBlock>
            )}
        </>
    )
}

// 3. Игра «Хватай провод»: 1) какой рукой схватить (палец по току),
// 2) куда закрутится поле — выбрать кольцо. Никаких «спереди».
const GRIP_ROUNDS: Cur[] = [1, -1, 1]
const GripGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [rounds] = useState<Cur[]>(() => (Math.random() < 0.5 ? GRIP_ROUNDS : GRIP_ROUNDS.map((c) => (c === 1 ? -1 : 1) as Cur)))
    const [round, setRound] = useState(0)
    const [step, setStep] = useState<'hand' | 'ring' | 'ok'>('hand')
    const [wrong, setWrong] = useState<string | null>(null)
    const [wrongKey, setWrongKey] = useState<string | null>(null)
    const done = round >= rounds.length
    const cur = rounds[Math.min(round, rounds.length - 1)]
    // порядок вариантов перемешан, но стабилен в пределах раунда
    const [flipOpts] = useState<boolean[]>(() => rounds.map(() => Math.random() < 0.5))
    const miss = (key: string, text: string) => { playSound(WRONG_ANSWER_SOUND); setWrongKey(key); setWrong(text) }
    const pickHand = (thumbUp: boolean) => {
        if (step !== 'hand') return
        if (thumbUp === (cur === 1)) { setWrong(null); setWrongKey(null); setStep('ring') }
        else miss(`h${thumbUp}`, 'Большой палец должен смотреть туда, куда бежит ток ⚡')
    }
    const pickRing = (right: boolean) => {
        if (step !== 'ring') return
        if (right === (cur === 1)) {
            setWrong(null); setWrongKey(null); setStep('ok')
            setTimeout(() => {
                setRound((r) => r + 1); setStep('hand')
                if (round + 1 >= rounds.length) setTimeout(() => onSettled?.(), 700)
            }, 1500)
        } else miss(`r${right}`, 'Посмотри, куда загнуты пальцы 👀')
    }
    const optBtn = (key: string, onClick: () => void, children: React.ReactNode) => (
        <button key={key} type="button" onClick={onClick}
            className={cn('flex min-h-[72px] items-center justify-center rounded-xl border-2 p-1 transition-colors',
                wrongKey === key ? 'border-[#DC605B] bg-[#DC605B22]' : 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]')}>
            {children}
        </button>
    )
    const hands = [true, false]
    const rings = [true, false]
    const ordered = <T,>(arr: T[]) => (flipOpts[Math.min(round, rounds.length - 1)] ? [...arr].reverse() : arr)
    return (
        <>
            <TypedLine text="Твоя очередь! Хватай провод 🤜" className={cn(TEXT_CLS, 'font-extrabold')} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <p className="text-sm font-black text-[#9AA7B0]">{done ? 'Все раунды пройдены!' : `Раунд ${round + 1} из ${rounds.length}`}</p>
                        <HandGrip key={`${round}-${cur}`} cur={cur} showHand={step !== 'hand'} showRing={step === 'ok' || done} />
                        {!done && step === 'hand' && (
                            <>
                                <p className="text-base font-black text-[#F2F7FB]">Как схватить провод?</p>
                                <div className="grid w-full max-w-xs grid-cols-2 gap-3">
                                    {ordered(hands).map((up) => optBtn(`h${up}`, () => pickHand(up),
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={up ? '/hands/right-up.webp' : '/hands/right-down.webp'} alt={up ? 'палец вверх' : 'палец вниз'} className="h-16 w-16" draggable={false} />))}
                                </div>
                            </>
                        )}
                        {!done && step === 'ring' && (
                            <>
                                <p className="text-base font-black text-[#F2F7FB]">Куда крутится поле <span style={{ color: FIELD_COLOR }}>B</span>?</p>
                                <div className="grid w-full max-w-xs grid-cols-2 gap-3">
                                    {ordered(rings).map((right) => optBtn(`r${right}`, () => pickRing(right), <MiniRing dirRight={right} />))}
                                </div>
                            </>
                        )}
                        {step === 'ok' && !done && <p className="text-lg font-black text-[#A1D151]">Точно! 🔥</p>}
                        {wrong && step !== 'ok' && <div className="rounded-xl px-4 py-2 text-sm font-bold text-center bg-[#DC605B22] text-[#DC605B]">{wrong}</div>}
                        {done && <p className="text-lg font-black text-[#A1D151]">Правая рука прокачана 💪</p>}
                    </div>
                    {(step === 'ok' || done) && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// 4. Как рисуют в задачах: • и ×.
const DotCrossScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedLine text="В задачах ЕГЭ поле рисуют значками:" className={TEXT_CLS} onSettled={() => setPhase(1)} delayAfter={200} />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1600)}>
                    <WireScene cur={1} rings={[MID_Y]} dotCross />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ sticker: '•', color: FIELD_COLOR }, { text: ' — поле летит ' }, { bold: 'НА ТЕБЯ' }, { break: true }, { sticker: '×', color: FIELD_COLOR }, { text: ' — поле летит ' }, { bold: 'ОТ ТЕБЯ' }]}
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 3 && (
                <TypedLine text="Как стрела 🏹: видишь остриё — точка, видишь хвост — крестик." className={TEXT_CLS} onSettled={onSettled} />
            )}
        </>
    )
}

const CONCEPT_SCENES = [BigCompassScene, RingsFlipScene, HandRuleScene, GripGameScene, DotCrossScene]

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
        feedback: 'Палец — по току, пальцы — как крутится поле.',
    },
    {
        renderPrompt: () => <>Ток бежит <b>ВВЕРХ ⬆</b>. Как закрутится поле <Sticker value="B" color={FIELD_COLOR} />?</>,
        renderOptions: () => [<MiniRing key="r" dirRight />, <MiniRing key="l" dirRight={false} />],
        correct: 0,
        feedback: 'Палец вверх — пальцы крутят поле вот так.',
    },
    {
        renderPrompt: () => <>Ток бежит <b>ВНИЗ ⬇</b>. Как закрутится поле <Sticker value="B" color={FIELD_COLOR} />?</>,
        renderOptions: () => [<MiniRing key="r" dirRight />, <MiniRing key="l" dirRight={false} />],
        correct: 1,
        feedback: 'Палец вниз — поле крутится в другую сторону.',
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
                                    <p className="w-full px-16 text-base md:text-lg text-[#F2F7FB] text-center font-bold">
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
