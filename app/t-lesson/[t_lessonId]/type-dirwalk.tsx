// app/t-lesson/[t_lessonId]/type-dirwalk.tsx
//
// Тип DIRWALK — интерактивный разбор "направление магнитного поля" (тема
// "Электродинамика"). По прямой просьбе пользователя — объясняет, как
// найти направление поля B вокруг ПРЯМОГО провода с током и вокруг
// провода, свёрнутого в КОЛЬЦО, через правило буравчика/отвёртки —
// объяснённое через аналогию "крышечка от бутылки колы" (крутишь по
// часовой — закручивается в бутылку, уходит от тебя; против часовой —
// выкручивается, идёт к тебе).
//
// Тот же стиль "детального знакомства", что и в остальных *WALK-разборах
// (SINWALK/LOGWALK/FARADAYWALK и т.д.): объекты вводятся ПО ОДНОМУ,
// накопительным логом (SceneWrapper/useSceneFocus/useReplayNonces/
// BackButton — прошлые сцены тускнеют, не исчезают), с печатаемым
// текстом и цветными стикерами на ключевых терминах.
//
// Физика (проверена аналитически, закон Био-Савара dB ∝ dl×r̂, не "на
// глаз"): ток вправо (в плоскости листа) → над проводом поле ВЫХОДИТ к
// зрителю (•), под проводом — УХОДИТ от зрителя (×). Вывод — через
// правило буравчика, применённое ВДОЛЬ провода (смотрим по направлению
// тока — он "уходит", как закручиваемая крышка → поле крутится ПО
// ЧАСОВОЙ с этой точки зрения → переводится в вид "сбоку" как •/× выше).
// Для КОЛЬЦА (ток по часовой, если смотреть лицом к кольцу — та же
// ориентация, что и у зрителя) — крышечная аналогия применяется НАПРЯМУЮ,
// без доп. смены точки зрения: по часовой = закручивается = поле в
// центре УХОДИТ от зрителя (×) — красивое следствие: для кольца не нужен
// шаг "посмотри вдоль", в отличие от прямого провода.
//
// Сюжет фазы 'concept' (10 шагов):
// 0. Прямой провод, ток вправо (без поля).
// 1. Вокруг провода есть магнитное поле B — тускло-пунктирные кольца
//    вдоль провода + единица измерения (Тесла).
// 2. Название правила — "буравчика" (или "отвёртки").
// 3. ЗАПОМНИ! — аналогия с крышечкой (два мини-варианта: по/против
//    часовой → уходит/идёт).
// 4. Применение: смотрим ВДОЛЬ провода (по направлению тока — он уходит,
//    как закручиваемая крышка) → поле крутится по часовой.
// 5. Перевод обратно в "вид сбоку": над проводом • (к тебе), под
//    проводом × (от тебя) + мнемоника про оперение/остриё стрелы.
// 6. Кольцо: ток по часовой (как смотрим).
// 7. Тут правило работает НАПРЯМУЮ — та же точка зрения, что и у зрителя.
// 8. Поле в центре кольца — от тебя (×).
// 9. Контраст: против часовой — поле было бы к тебе (•).
//
// После знакомства — фаза 'quiz' (тот же формат "1/N + огненный Lottie на
// каждом 4-м", что и во всех *WALK-разборах).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock, TypedLine,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR, WRONG_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import { playSound } from '@/lib/sound'

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

const INTRO_CONCEPT_STEPS = 10
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

// Символы поля — точка (поле выходит К зрителю) и крестик (поле уходит
// ОТ зрителя), тот же стандартный физический значок, что и в учебниках.
// r/size параметризованы — покрупнее для центра кольца, помельче для
// прямого провода.
const FieldDot = ({ x, y, delay, r = 9 }: { x: number; y: number; delay: number; r?: number }) => (
    <motion.circle cx={x} cy={y} r={r} fill={FIELD_COLOR}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15, delay }} />
)
const FieldCross = ({ x, y, delay, size = 7 }: { x: number; y: number; delay: number; size?: number }) => (
    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}>
        <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" />
        <line x1={x - size} y1={y + size} x2={x + size} y2={y - size} stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" />
    </motion.g>
)

// ===== Прямой провод =====
const WIRE_VIEW_W = 340
const WIRE_VIEW_H = 200
const WIRE_X1 = 50
const WIRE_X2 = 290
const WIRE_Y = 100

type WireDir = 'right' | 'left'

const WireArrow = ({ dir }: { dir: WireDir }) => {
    const headX = dir === 'right' ? WIRE_X2 : WIRE_X1
    const tailX = dir === 'right' ? WIRE_X1 : WIRE_X2
    const sign = dir === 'right' ? 1 : -1
    return (
        <g>
            <motion.line
                x1={tailX} y1={WIRE_Y} x2={headX - 14 * sign} y2={WIRE_Y}
                stroke={CURRENT_COLOR} strokeWidth={6} strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <path d={`M ${headX - 14 * sign},${WIRE_Y - 8} L ${headX},${WIRE_Y} L ${headX - 14 * sign},${WIRE_Y + 8} Z`} fill={CURRENT_COLOR} />
            <text x={(WIRE_X1 + WIRE_X2) / 2} y={WIRE_Y - 20} textAnchor="middle" fontSize={17} fontWeight={800} fill={CURRENT_COLOR}>I</text>
        </g>
    )
}

// Тускло-пунктирные кольца вдоль провода — не буквально круг (в 2D-виде
// сбоку кольца поля вокруг ГОРИЗОНТАЛЬНОГО провода видны рёбром, как
// узкие вертикальные эллипсы) — просто намёк на "поле обвивает провод",
// без претензии на точную 3D-проекцию.
const WireRings = () => {
    const cxs = [WIRE_X1 + (WIRE_X2 - WIRE_X1) * 0.25, WIRE_X1 + (WIRE_X2 - WIRE_X1) * 0.5, WIRE_X1 + (WIRE_X2 - WIRE_X1) * 0.75]
    return (
        <g>
            {cxs.map((cx, i) => (
                <motion.ellipse key={i} cx={cx} cy={WIRE_Y} rx={14} ry={48} fill="none" stroke={FIELD_COLOR} strokeWidth={2}
                    strokeDasharray="6 5" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.55 }}
                    transition={{ duration: 0.7, ease: 'easeInOut', delay: i * 0.15 }} />
            ))}
        </g>
    )
}

const WireDiagram = ({ direction, showRings = false, showResult = false }: { direction: WireDir; showRings?: boolean; showResult?: boolean }) => {
    const midX = (WIRE_X1 + WIRE_X2) / 2
    return (
        <div className="flex w-full justify-center py-3">
            <svg viewBox={`0 0 ${WIRE_VIEW_W} ${WIRE_VIEW_H}`} className="h-[190px] w-[323px]">
                {showRings && <WireRings />}
                {showResult && (
                    <>
                        <FieldDot x={midX} y={WIRE_Y - 60} delay={0.2} />
                        <text x={midX} y={WIRE_Y - 78} textAnchor="middle" fontSize={13} fontWeight={700} fill={FIELD_COLOR}>К тебе</text>
                        <FieldCross x={midX} y={WIRE_Y + 60} delay={0.5} />
                        <text x={midX} y={WIRE_Y + 92} textAnchor="middle" fontSize={13} fontWeight={700} fill={FIELD_COLOR}>От тебя</text>
                    </>
                )}
                <WireArrow dir={direction} />
            </svg>
        </div>
    )
}

// ===== Абстрактная "крутящаяся" стрелка (для крышечки/взгляда вдоль
// провода) — партиальная дуга с наконечником НА КОНЦЕ, направление
// вращения задаётся sweep-flag (в SVG с y-вниз возрастание угла по
// часовой стрелке на экране — проверено аналитически). =====
function polarPoint(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
type RotDir = 'cw' | 'ccw'
const RotArrow = ({ cx, cy, r, dir, color, startDeg = -100, sweepDeg = 300, delay = 0 }: {
    cx: number; cy: number; r: number; dir: RotDir; color: string; startDeg?: number; sweepDeg?: number; delay?: number
}) => {
    const endDeg = dir === 'cw' ? startDeg + sweepDeg : startDeg - sweepDeg
    const start = polarPoint(cx, cy, r, startDeg)
    const end = polarPoint(cx, cy, r, endDeg)
    const sweepFlag = dir === 'cw' ? 1 : 0
    const largeArc = sweepDeg > 180 ? 1 : 0
    const rad = (endDeg * Math.PI) / 180
    const sign = dir === 'cw' ? 1 : -1
    const tdx = -Math.sin(rad) * sign
    const tdy = Math.cos(rad) * sign
    const angleDeg = (Math.atan2(tdy, tdx) * 180) / Math.PI
    return (
        <g>
            <motion.path
                d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`}
                stroke={color} strokeWidth={5} fill="none" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay }}
            />
            <motion.path
                d="M-7,-6 L8,0 L-7,6 Z" fill={color}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.8, type: 'spring', stiffness: 300, damping: 14 }}
                transform={`translate(${end.x},${end.y}) rotate(${angleDeg})`}
            />
        </g>
    )
}

// ===== Крышечка от бутылки колы — мини-иконка, переиспользуется и в
// сцене-объяснении (S3, два варианта рядом), и в сцене-напоминании перед
// кольцом (S7, один вариант). =====
const CapMiniDiagram = ({ dir, label }: { dir: RotDir; label: string }) => (
    <div className="flex flex-col items-center gap-1.5">
        <svg viewBox="0 0 100 110" className="h-[110px] w-[100px]">
            {dir === 'ccw' && <path d="M50,8 L42,24 L58,24 Z" fill={RULE_COLOR} />}
            {[0, 60, 120, 180, 240, 300].map((deg) => {
                const p1 = polarPoint(50, 55, 16, deg)
                const p2 = polarPoint(50, 55, 22, deg)
                return <line key={deg} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={RULE_COLOR} strokeWidth={2} opacity={0.5} />
            })}
            <circle cx={50} cy={55} r={16} fill="none" stroke={RULE_COLOR} strokeWidth={3} />
            <RotArrow cx={50} cy={55} r={30} dir={dir} color={RULE_COLOR} startDeg={-70} sweepDeg={280} />
            {dir === 'cw' && <path d="M50,102 L42,86 L58,86 Z" fill={RULE_COLOR} />}
        </svg>
        <span className="text-xs font-bold text-center" style={{ color: RULE_COLOR }}>{label}</span>
    </div>
)

// "ЗАПОМНИ!" — тот же визуальный язык, что уже устоялся в разборах
// "Логарифмы"/FARADAYWALK: Lottie "полицейский с бумагой" крупно слева +
// плашка с мигающим "!" справа, красная рамка (стандартный "красный"
// feedback-палитры проекта — WRONG_COLOR, см. CLAUDE.md).
const RedExclaim = () => (
    <motion.span
        className="inline-block ml-1 font-black"
        style={{ color: WRONG_COLOR }}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    >!</motion.span>
)
const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div
            className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(WRONG_COLOR, 0.16), border: `2px solid ${WRONG_COLOR}`, color: WRONG_COLOR }}
        >
            <span>ЗАПОМНИ<RedExclaim /></span>
        </div>
    </div>
)

const CapDiagram = () => (
    <div className="flex w-full items-start justify-center gap-6 py-2">
        <CapMiniDiagram dir="cw" label="По часовой — уходит от тебя" />
        <CapMiniDiagram dir="ccw" label="Против часовой — идёт к тебе" />
    </div>
)

// ===== Вид "вдоль провода" — по направлению тока: круглый значок
// провода (⊗-стиль — круг+крест, малиновым — это ток, уходящий от
// зрителя этого вида) + крутящаяся синяя стрелка вокруг него (поле B). =====
const EndViewDiagram = () => (
    <div className="flex w-full justify-center py-3">
        <svg viewBox="0 0 220 220" className="h-[200px] w-[200px]">
            <RotArrow cx={110} cy={110} r={62} dir="cw" color={FIELD_COLOR} />
            <circle cx={110} cy={110} r={17} fill="none" stroke={CURRENT_COLOR} strokeWidth={3} />
            <line x1={101} y1={101} x2={119} y2={119} stroke={CURRENT_COLOR} strokeWidth={3} strokeLinecap="round" />
            <line x1={101} y1={119} x2={119} y2={101} stroke={CURRENT_COLOR} strokeWidth={3} strokeLinecap="round" />
            <SvgTag x={110 + 62 + 22} y={110 - 44} text="B" color={FIELD_COLOR} delay={1.1} />
            <text x={110} y={195} textAnchor="middle" fontSize={13} fontWeight={700} fill={CURRENT_COLOR}>ток (уходит от тебя)</text>
        </svg>
    </div>
)

// ===== Кольцо — полноценная замкнутая петля (не дуга) + направляющие
// шевроны-стрелочки вдоль неё, статичные, но с bounce-появлением. =====
function ellipsePoint(cx: number, cy: number, rx: number, ry: number, deg: number) {
    const rad = (deg * Math.PI) / 180
    return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) }
}
function ellipseTangentDeg(deg: number, dir: RotDir) {
    const rad = (deg * Math.PI) / 180
    const sign = dir === 'cw' ? 1 : -1
    const dx = -Math.sin(rad) * sign
    const dy = Math.cos(rad) * sign
    return (Math.atan2(dy, dx) * 180) / Math.PI
}
const LOOP_CHEVRON_ANGLES = [-60, 60, 180]
const LoopWire = ({ cx, cy, rx, ry, dir }: { cx: number; cy: number; rx: number; ry: number; dir: RotDir }) => (
    <g>
        <motion.ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={CURRENT_COLOR} strokeWidth={5}
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.8, ease: 'easeInOut' }} />
        {LOOP_CHEVRON_ANGLES.map((deg, i) => {
            const p = ellipsePoint(cx, cy, rx, ry, deg)
            const rot = ellipseTangentDeg(deg, dir)
            return (
                <motion.path key={i} d="M-6,-5 L7,0 L-6,5 Z" fill={CURRENT_COLOR}
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.15, type: 'spring', stiffness: 300, damping: 14 }}
                    transform={`translate(${p.x},${p.y}) rotate(${rot})`} />
            )
        })}
    </g>
)

const LOOP_CX = 110, LOOP_CY = 100, LOOP_RX = 85, LOOP_RY = 55

const LoopDiagram = ({ dir, centerSymbol }: { dir: RotDir; centerSymbol?: 'dot' | 'cross' }) => (
    <div className="flex w-full justify-center py-3">
        <svg viewBox="0 0 220 200" className="h-[182px] w-[200px]">
            <LoopWire cx={LOOP_CX} cy={LOOP_CY} rx={LOOP_RX} ry={LOOP_RY} dir={dir} />
            {centerSymbol === 'cross' && <FieldCross x={LOOP_CX} y={LOOP_CY} delay={1.4} size={13} />}
            {centerSymbol === 'dot' && <FieldDot x={LOOP_CX} y={LOOP_CY} delay={1.4} r={15} />}
            {centerSymbol && <SvgTag x={LOOP_CX + 44} y={LOOP_CY - 40} text="B" color={FIELD_COLOR} delay={1.6} />}
        </svg>
    </div>
)

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
    const handleReplay = () => bumpNonce(latestSceneKey)
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
            if (step + 1 >= INTRO_CONCEPT_STEPS) {
                onDone()
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, CONCEPT_PAUSE_MS)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто прямой провод, ток вправо, без поля. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <TypedLineWithParts
                            parts={[
                                { text: 'Вот прямой провод — по нему течёт ' },
                                { sticker: 'ток', color: CURRENT_COLOR },
                                { text: ', например, вправо.' },
                            ]}
                        />
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <WireDiagram direction="right" />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — вокруг любого провода с током есть магнитное
                    поле B (тускло-пунктирные кольца), единица — Тесла. */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Вокруг ЛЮБОГО провода с ' },
                                    { sticker: 'током', color: CURRENT_COLOR },
                                    { text: ' есть ' },
                                    { sticker: 'магнитное поле', color: FIELD_COLOR },
                                    { text: ' — оно как бы обвивает провод кольцами.' },
                                ]}
                            />
                            <DiagramBlock>
                                <WireDiagram direction="right" showRings />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Измеряется в ' },
                                    { sticker: 'Тесла (Тл)', color: FIELD_COLOR },
                                    { text: '.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — название правила. */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Куда именно закручивается ' },
                                    { sticker: 'поле', color: FIELD_COLOR },
                                    { text: ' — покажет правило ' },
                                    { sticker: 'буравчика', color: RULE_COLOR },
                                    { text: ' (или «отвёртки»).' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — ЗАПОМНИ! Аналогия с крышечкой от бутылки колы:
                    по часовой — закручивается, уходит от тебя; против
                    часовой — выкручивается, идёт к тебе. */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock><RememberBanner /></DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Представь, что закручиваешь ' },
                                    { sticker: 'крышечку', color: RULE_COLOR },
                                    { text: ' от бутылки колы:' },
                                ]}
                            />
                            <DiagramBlock onSettled={() => setStepReady(true)}>
                                <CapDiagram />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — применяем к проводу: смотрим ВДОЛЬ него, по
                    направлению тока (он уходит от нас, как закручиваемая
                    крышка) → поле крутится по часовой. */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Представь, что смотришь ' },
                                    { bold: 'ВДОЛЬ' },
                                    { text: ' провода —' },
                                    { break: true },
                                    { text: 'по направлению тока (он уходит от тебя, как закручиваемая крышка).' },
                                ]}
                            />
                            <DiagramBlock>
                                <EndViewDiagram />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Значит поле ' },
                                    { sticker: 'B', color: FIELD_COLOR },
                                    { text: ' крутится ' },
                                    { bold: 'ПО ЧАСОВОЙ' },
                                    { text: '.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 5 — переводим обратно в "вид сбоку" (как рисуем
                    обычно): над проводом поле выходит к тебе (•), под
                    проводом — уходит от тебя (×) + мнемоника про
                    оперение/остриё стрелы. */}
                {step >= 5 && (
                    <SceneWrapper key="step-5" innerRef={sceneRef('step-5')} active={isSceneActive('step-5')}>
                        <Fragment key={`step-5-${nonceFor('step-5')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'А если посмотреть на провод ' },
                                    { bold: 'СБОКУ' },
                                    { text: ' (как мы обычно рисуем) — получится вот что:' },
                                ]}
                            />
                            <DiagramBlock>
                                <WireDiagram direction="right" showResult />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Значок ' },
                                    { sticker: '×', color: FIELD_COLOR },
                                    { text: ' — как оперение улетающей стрелы, ' },
                                    { sticker: '•', color: FIELD_COLOR },
                                    { text: ' — остриё летящей на тебя.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 6 — провод, свёрнутый в кольцо, ток по часовой
                    (как мы смотрим на рисунок). */}
                {step >= 6 && (
                    <SceneWrapper key="step-6" innerRef={sceneRef('step-6')} active={isSceneActive('step-6')}>
                        <Fragment key={`step-6-${nonceFor('step-6')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Теперь — провод, свёрнутый в ' },
                                    { sticker: 'кольцо', color: CURRENT_COLOR },
                                    { text: '. Ток идёт ' },
                                    { sticker: 'по часовой', color: CURRENT_COLOR },
                                    { text: '.' },
                                ]}
                            />
                            <DiagramBlock onSettled={() => setStepReady(true)}>
                                <LoopDiagram dir="cw" />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 7 — тут правило "крышечки" работает НАПРЯМУЮ, без
                    доп. смены точки зрения — ты и так смотришь на кольцо
                    лицом к нему, прямо как на крышку сверху. */}
                {step >= 7 && (
                    <SceneWrapper key="step-7" innerRef={sceneRef('step-7')} active={isSceneActive('step-7')}>
                        <Fragment key={`step-7-${nonceFor('step-7')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Тут правило ' },
                                    { sticker: 'крышечки', color: RULE_COLOR },
                                    { text: ' работает ' },
                                    { bold: 'НАПРЯМУЮ' },
                                    { text: ' — ты и так смотришь на кольцо лицом к нему, прямо как на крышку сверху!' },
                                ]}
                            />
                            <DiagramBlock onSettled={() => setStepReady(true)}>
                                <CapMiniDiagram dir="cw" label="По часовой — уходит от тебя" />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 8 — значит поле в центре кольца направлено от
                    тебя, вглубь страницы (×). */}
                {step >= 8 && (
                    <SceneWrapper key="step-8" innerRef={sceneRef('step-8')} active={isSceneActive('step-8')}>
                        <Fragment key={`step-8-${nonceFor('step-8')}`}>
                            <DiagramBlock>
                                <LoopDiagram dir="cw" centerSymbol="cross" />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Значит ' },
                                    { sticker: 'B', color: FIELD_COLOR },
                                    { text: ' в центре кольца направлено ' },
                                    { bold: 'ОТ ТЕБЯ' },
                                    { text: ' — в глубь страницы.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 9 — контраст: против часовой поле было бы к тебе. */}
                {step >= 9 && (
                    <SceneWrapper key="step-9" innerRef={sceneRef('step-9')} active={isSceneActive('step-9')}>
                        <Fragment key={`step-9-${nonceFor('step-9')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'А если бы ток шёл ' },
                                    { bold: 'ПРОТИВ' },
                                    { text: ' часовой — поле было бы направлено ' },
                                    { bold: 'К ТЕБЕ' },
                                    { text: '.' },
                                ]}
                            />
                            <DiagramBlock onSettled={() => setStepReady(true)}>
                                <LoopDiagram dir="ccw" centerSymbol="dot" />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}
            </div>

            <div className="w-full flex items-center gap-2">
                <ReplayButton onClick={handleReplay} disabled={advancing} />
                <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!stepReady || advancing}
                    className={walkthroughButtonClass(stepReady && !advancing)}
                    style={walkthroughButtonStyle(stepReady && !advancing)}
                >
                    {nextLabel}
                </button>
            </div>
        </div>
    )
}

// ===================================================================
// ФАЗА "quiz" — короткая фиксированная проверка понимания (5 бинарных
// вопросов, тот же формат "1/N + огненный Lottie на каждом 4-м", что и
// во всех остальных *WALK-разборах). Переиспользует те же хелперы.
// ===================================================================

type ConceptQuizItem = {
    renderPrompt: () => React.ReactNode
    renderOptions: () => [React.ReactNode, React.ReactNode]
    correct: 0 | 1
    feedback: string
}

const CONCEPT_QUIZ: ConceptQuizItem[] = [
    {
        renderPrompt: () => <>Ток в проводе течёт <b>ВЛЕВО</b>. Что <b>НАД</b> проводом?</>,
        renderOptions: () => [
            <span key="a" className="inline-flex items-center gap-1.5">Поле уходит от тебя (<Sticker value="×" color={FIELD_COLOR} />)</span>,
            <span key="b" className="inline-flex items-center gap-1.5">Поле идёт к тебе (<Sticker value="•" color={FIELD_COLOR} />)</span>,
        ],
        correct: 0,
        feedback: 'Ток влево — противоположность нашему примеру, значит над проводом всё наоборот: поле уходит от тебя (×).',
    },
    {
        renderPrompt: () => <>Ток течёт <b>ВПРАВО</b> (как в нашем примере). Что <b>ПОД</b> проводом?</>,
        renderOptions: () => [
            <span key="a" className="inline-flex items-center gap-1.5">Поле уходит от тебя (<Sticker value="×" color={FIELD_COLOR} />)</span>,
            <span key="b" className="inline-flex items-center gap-1.5">Поле идёт к тебе (<Sticker value="•" color={FIELD_COLOR} />)</span>,
        ],
        correct: 0,
        feedback: 'Под проводом (ток вправо) поле уходит от тебя — туда же, куда указывает крестик ×.',
    },
    {
        renderPrompt: () => <>В кольце ток течёт <b>ПРОТИВ</b> часовой стрелки. Куда направлено поле в центре?</>,
        renderOptions: () => [
            <span key="a" className="inline-flex items-center gap-1.5">К тебе (<Sticker value="•" color={FIELD_COLOR} />)</span>,
            <span key="b" className="inline-flex items-center gap-1.5">От тебя (<Sticker value="×" color={FIELD_COLOR} />)</span>,
        ],
        correct: 0,
        feedback: 'Против часовой — крышка выкручивается, идёт к тебе. Поле в центре — тоже к тебе (•).',
    },
    {
        renderPrompt: () => <>Как называется это правило?</>,
        renderOptions: () => ['Правило буравчика', 'Правило Ленца'],
        correct: 0,
        feedback: 'Верно — правило буравчика (или «отвёртки»).',
    },
    {
        renderPrompt: () => <>Что означает значок <Sticker value="×" color={FIELD_COLOR} /> на рисунке поля?</>,
        renderOptions: () => ['Поле уходит от тебя, в глубь страницы', 'Поле идёт к тебе, из страницы'],
        correct: 0,
        feedback: '× — как оперение стрелы, летящей от тебя.',
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
