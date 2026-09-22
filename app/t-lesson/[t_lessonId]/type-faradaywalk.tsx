// app/t-lesson/[t_lessonId]/type-faradaywalk.tsx
//
// Тип FARADAYWALK — интерактивный разбор "закон Фарадея" (тема
// "Электродинамика"). По прямой просьбе пользователя — тот же стиль
// "детального знакомства", что и в математических разборах (SINWALK/
// LOGWALK и т.д.): объекты вводятся ПО ОДНОМУ, накопительным логом
// (SceneWrapper/useSceneFocus/useReplayNonces/BackButton — прошлые сцены
// тускнеют, не исчезают), с печатаемым текстом и цветными стикерами на
// ключевых терминах.
//
// Сюжет фазы 'concept' (знакомство с объектами по одному):
// 0. "Смотри — это магнит." — просто картинка магнита, без подсветки.
// 1. "Магнит создаёт вокруг себя [магнитное поле] — обозначается буквой
//    [B]." — оба стикером (синий, FIELD_COLOR); диаграмма дорисовывает
//    силовые линии магнита ТЕМ ЖЕ цветом (линии уходят сначала ВНИЗ от
//    полюса, затем большим радиусом возвращаются наверх — по прямой
//    просьбе пользователя, по мотивам визуального языка "стрелочка бежит
//    по линии", как в референсах течения тока по проводу — см.
//    FlowArrows ниже); затем "Магнитное поле измеряется в [Тесла (Тл)]."
// 2. "У магнита есть [северный] полюс [N]." — линии поля бледнеют,
//    нижний край магнита подсвечивается синим (тот же NORTH_COLOR, что
//    и стикер), верхний остаётся бледным.
// 3. "И [южный] полюс [S]." — аналогично наоборот: всё бледное, кроме
//    верхнего края — он красным (SOUTH_COLOR), тем же цветом стикер.
//
// После знакомства (INTRO_CONCEPT_STEPS шагов) — фаза 'hands':
// та же интерактивная песочница "магнит+кольцо+графики Φ(t)/I(t)", что
// была реализована раньше в этом файле (см. историю сессии) — магнит
// едет САМ по 4 программам (стоит/едет ровно/вдвое быстрее/разгоняется),
// затем формула ε=−ΔΦ/Δt, "своя очередь" (свободное перетаскивание) и
// 5 вопросов-проверок. Оставлена БЕЗ изменений — переставлена местами,
// не переписана.

'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import type { QuestionType } from './page'
import {
    DiagramBlock, TypedLine,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR, WRONG_COLOR, ACTIVE_COLOR, PENDING_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Магнитное поле B — отдельная величина, вводимая своим цветом (та же
// роль, что синий уже играет в палитре ggege — "угол/величина, которую
// вводим отдельно от прочих", см. CLAUDE.md).
const FIELD_COLOR = GGEGE_PALETTE.blue.button

// Полюса магнита — свои цвета (сцены 2/3): северный тем же синим, что и
// поле/буква B (одна история — "поле выходит здесь"); южный — красным
// (по прямой просьбе пользователя, "северный синим, южный красным").
const NORTH_COLOR = FIELD_COLOR
const SOUTH_COLOR = WRONG_COLOR

const FLUX_COLOR = GGEGE_PALETTE.purple.button
const CURRENT_COLOR = GGEGE_PALETTE.orange.button
const CURRENT_COLOR_REV = GGEGE_PALETTE.teal.button

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

// ===================================================================
// ФАЗА "concept" — знакомство с объектами, по одному, накопительный лог.
// ===================================================================

const INTRO_CONCEPT_STEPS = 4
const CONCEPT_PAUSE_MS = 1000

// Стикер — тот же визуальный язык, что уже устоялся во всех *WALK
// разборах (bounce-появление, цветная рамка+подложка, БЕЗ KaTeX — тут
// нет формул, только слова/буквы).
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

// Печатаемая строка с НЕСКОЛЬКИМИ стикерами в произвольных местах — та
// же техника, что и TypedLineWithParts в LOGCOMBOWALK: Typewriter
// печатает ПЛОСКУЮ строку (значения стикеров как обычный текст), после
// onDone вид подменяется на размеченную версию.
type LinePart = { text: string } | { sticker: string; color: string }
const TypedLineWithParts = ({ parts, onSettled }: { parts: LinePart[]; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plainText = parts.map((p) => ('text' in p ? p.text : p.sticker)).join('')
    return (
        <div className="w-full text-center text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter text={plainText} onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }} />
            ) : (
                <>
                    {parts.map((p, i) => ('text' in p
                        ? <span key={i}>{p.text}</span>
                        : <Sticker key={i} value={p.sticker} color={p.color} />
                    ))}
                </>
            )}
        </div>
    )
}

// Геометрия магнита (общая для intro-диаграммы и hands-on песочницы).
const MAG_W = 40
const MAG_H = 64

// Магнит сам по себе (S сверху синий, N снизу красный) — переиспользуется
// и в сцене 0 (без поля), и в сцене 1 (с полем), и в hands-on песочнице.
const MagnetShape = ({ x, top }: { x: number; top: number }) => (
    <g>
        <rect x={x - MAG_W / 2} y={top} width={MAG_W} height={MAG_H / 2} rx={5} fill="#4A90D9" />
        <rect x={x - MAG_W / 2} y={top + MAG_H / 2} width={MAG_W} height={MAG_H / 2} rx={5} fill="#DC605B" />
        <text x={x} y={top + 21} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">S</text>
        <text x={x} y={top + MAG_H - 10} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">N</text>
    </g>
)

// Магнит для сцен-полюсов (2/3) — нейтральный серый корпус (не
// путается с "постоянным" сине-красным MagnetShape из сцены 0/1), два
// подписанных края (N снизу, S сверху), АКТИВНЫЙ край подсвечивается
// своим цветом (NORTH_COLOR/SOUTH_COLOR) с пульсирующей рамкой, второй —
// бледно-серый — тот же "прожектор" приём, что уже используют угловые
// индикаторы геометрических разборов (см. WalkthroughLog.tsx).
const POLE_PALE = '#3A464E'
const MagnetPoleShape = ({ x, top, highlight }: { x: number; top: number; highlight: 'N' | 'S' }) => {
    const sColor = highlight === 'S' ? SOUTH_COLOR : POLE_PALE
    const nColor = highlight === 'N' ? NORTH_COLOR : POLE_PALE
    return (
        <g>
            <motion.rect x={x - MAG_W / 2} y={top} width={MAG_W} height={MAG_H / 2} rx={5}
                animate={{ fill: sColor }} transition={{ duration: 0.5 }} />
            <motion.rect x={x - MAG_W / 2} y={top + MAG_H / 2} width={MAG_W} height={MAG_H / 2} rx={5}
                animate={{ fill: nColor }} transition={{ duration: 0.5 }} />
            {highlight === 'S' && (
                <motion.rect x={x - MAG_W / 2 - 3} y={top - 3} width={MAG_W + 6} height={MAG_H / 2 + 6} rx={7}
                    fill="none" stroke={SOUTH_COLOR} strokeWidth={2.5}
                    animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
            )}
            {highlight === 'N' && (
                <motion.rect x={x - MAG_W / 2 - 3} y={top + MAG_H / 2 - 3} width={MAG_W + 6} height={MAG_H / 2 + 6} rx={7}
                    fill="none" stroke={NORTH_COLOR} strokeWidth={2.5}
                    animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
            )}
            <text x={x} y={top + 21} textAnchor="middle" fontSize={16} fontWeight={800} fill={highlight === 'S' ? '#fff' : '#9AA7B0'}>S</text>
            <text x={x} y={top + MAG_H - 10} textAnchor="middle" fontSize={16} fontWeight={800} fill={highlight === 'N' ? '#fff' : '#9AA7B0'}>N</text>
        </g>
    )
}

// ===== Силовые линии магнита =====
//
// По прямой просьбе пользователя — линия ПРИВЯЗАНА к самим полюсам
// (сходится РОВНО в магните, не в точке над ним): выходит из полюса N
// (снизу), какое-то время идёт почти прямо ВНИЗ (не сворачивая сразу),
// затем большим радиусом поднимается наверх и длинной дугой заходит в
// магнит сверху, в полюс S — оба конца кривой ЛЕЖАТ на самих полюсах.
//
// ВАЖНО: обычная кубическая кривая Безье с контрольными точками "далеко
// снизу"/"широко сбоку" НЕ проходит через сами контрольные точки (это
// просто "рычаги", которые лишь притягивают кривую — реальная кривая
// заметно ближе к отрезку между концами, чем кажется по расположению
// хендлов) — так получался слишком куцый результат, пойманный прямым
// замером getBBox() в браузере. Кривая построена сплайном Катмулла-Рома
// (`catmullRomSegments`) — гарантированно ПРОХОДИТ через каждую из 4
// явных опорных точек (N → точка глубоко внизу → широкая точка сбоку на
// полпути наверх → S), 3 кубических сегмента, касательные согласованы в
// стыках (G1-гладкость, без изломов).
type Pt = { x: number; y: number }
type Bezier = { p0: Pt; p1: Pt; p2: Pt; p3: Pt }

// Стандартная (uniform, tension=1/6) конверсия Катмулла-Рома в цепочку
// кубических Безье — кривая проходит через КАЖДУЮ точку `points`, концы
// зажаты дублированием крайних точек (без "перелёта" за пределы кривой).
function catmullRomSegments(points: Pt[]): Bezier[] {
    const padded = [points[0], ...points, points[points.length - 1]]
    const segments: Bezier[] = []
    for (let i = 1; i < padded.length - 2; i++) {
        const p0 = padded[i - 1], p1 = padded[i], p2 = padded[i + 1], p3 = padded[i + 2]
        segments.push({
            p0: p1,
            p1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
            p2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
            p3: p2,
        })
    }
    return segments
}

function segBezierPoint(b: Bezier, t: number): Pt {
    const mt = 1 - t
    const a = mt * mt * mt, bb = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t
    return {
        x: a * b.p0.x + bb * b.p1.x + c * b.p2.x + d * b.p3.x,
        y: a * b.p0.y + bb * b.p1.y + c * b.p2.y + d * b.p3.y,
    }
}
function segBezierAngleDeg(b: Bezier, t: number) {
    const mt = 1 - t
    const dx = 3 * mt * mt * (b.p1.x - b.p0.x) + 6 * mt * t * (b.p2.x - b.p1.x) + 3 * t * t * (b.p3.x - b.p2.x)
    const dy = 3 * mt * mt * (b.p1.y - b.p0.y) + 6 * mt * t * (b.p2.y - b.p1.y) + 3 * t * t * (b.p3.y - b.p2.y)
    return (Math.atan2(dy, dx) * 180) / Math.PI
}

// Точка/угол по ВСЕЙ цепочке сегментов сразу — t∈[0,1] линейно делится
// на сегменты (не идеально равномерно по длине дуги, но для декоративного
// "течения" стрелок этого достаточно — глазом неровность скорости между
// сегментами не читается).
function multiPoint(segs: Bezier[], t: number): Pt {
    const scaled = t * segs.length
    const idx = Math.min(segs.length - 1, Math.floor(scaled))
    return segBezierPoint(segs[idx], scaled - idx)
}
function multiAngleDeg(segs: Bezier[], t: number) {
    const scaled = t * segs.length
    const idx = Math.min(segs.length - 1, Math.floor(scaled))
    return segBezierAngleDeg(segs[idx], scaled - idx)
}
function multiPath(segs: Bezier[]) {
    const first = segs[0].p0
    const rest = segs.map((s) => `C ${s.p1.x} ${s.p1.y}, ${s.p2.x} ${s.p2.y}, ${s.p3.x} ${s.p3.y}`).join(' ')
    return `M ${first.x} ${first.y} ${rest}`
}

// Опорные точки одной силовой линии: N (ровно на полюсе) → глубоко вниз
// (почти строго под N — "не сворачивая сразу") → широкая точка сбоку на
// полпути наверх (большой радиус разворота) → S (ровно на полюсе,
// "заходит сверху").
function fieldLineWaypoints(cx: number, yN: number, yS: number, side: -1 | 1, rx: number, dip: number): Pt[] {
    const deepest = { x: cx + side * rx * 0.18, y: yN + dip }
    const wide = { x: cx + side * rx, y: yS + dip * 0.4 }
    return [{ x: cx, y: yN }, deepest, wide, { x: cx, y: yS }]
}

// "Течёт" по линии поля — маленькие стрелочки, бегущие вдоль кривой (тот
// же приём, что показывает направление тока/поля на референс-анимациях
// движения по проводу — маленькие маркеры друг за другом), а не просто
// статичный наконечник. Считается АНАЛИТИЧЕСКИ по параметру кривой (не
// CSS offset-path — тот же принцип, что и остальная физика в этом файле:
// setInterval, не requestAnimationFrame, чтобы не замирать в фоновых
// вкладках, см. комментарий у Sandbox). fade у краёв пути — маркер не
// обрывается резко на стыке.
const FLOW_PERIOD_MS = 2400
const FLOW_TICK_MS = 40
const FLOW_PHASES = [0, 1 / 3, 2 / 3]

const FlowArrows = ({ lines, color }: { lines: Bezier[][]; color: string }) => {
    const [t, setT] = useState(0)
    useEffect(() => {
        const start = performance.now()
        const id = setInterval(() => {
            setT(((performance.now() - start) % FLOW_PERIOD_MS) / FLOW_PERIOD_MS)
        }, FLOW_TICK_MS)
        return () => clearInterval(id)
    }, [])
    return (
        <g>
            {lines.map((segs, li) => FLOW_PHASES.map((phase, mi) => {
                const tt = (t + phase) % 1
                const pos = multiPoint(segs, tt)
                const angle = multiAngleDeg(segs, tt)
                const fade = Math.min(1, tt * 9, (1 - tt) * 9)
                return (
                    <path
                        key={`${li}-${mi}`}
                        d="M-4,-3 L5,0 L-4,3 Z"
                        fill={color}
                        opacity={fade}
                        transform={`translate(${pos.x},${pos.y}) rotate(${angle})`}
                    />
                )
            }))}
        </g>
    )
}

// Три вложенных линии — шире (rx) И "длиннее вниз" (dip) с каждым
// следующим номером, тот же принцип нестинга, что на референсе.
const FIELD_LOOPS: { rx: number; dip: number }[] = [
    { rx: 55, dip: 110 },
    { rx: 85, dip: 150 },
    { rx: 115, dip: 180 },
]

// Силовые линии магнита целиком — draw-in анимация формы, затем (для
// flowing=true) бегущие стрелочки поверх. pale=true (сцены-полюса) —
// тускло-серые, без движения — фокус смещён на полюса, не на поток.
const MagnetFieldLines = ({ x, top, color, flowing = false }: { x: number; top: number; color: string; flowing?: boolean }) => {
    const yN = top + MAG_H
    const yS = top
    const [started, setStarted] = useState(false)
    useEffect(() => {
        if (!flowing) return
        const t = setTimeout(() => setStarted(true), FIELD_LOOPS.length * 220 + 900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowing])

    const lines: Bezier[][] = []
    FIELD_LOOPS.forEach(({ rx, dip }) => {
        ([-1, 1] as const).forEach((side) => {
            lines.push(catmullRomSegments(fieldLineWaypoints(x, yN, yS, side, rx, dip)))
        })
    })

    return (
        <g>
            {lines.map((segs, i) => (
                <motion.path
                    key={i}
                    d={multiPath(segs)}
                    stroke={color}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.9, ease: 'easeInOut', delay: Math.floor(i / 2) * 0.22 }}
                />
            ))}
            {flowing && started && <FlowArrows lines={lines} color={color} />}
        </g>
    )
}

// Полотно диаграммы — увеличено (по прямой просьбе пользователя), сам
// магнит внутри — прежнего размера (MAG_W/MAG_H не менялись).
const FIELD_VIEW_W = 320
const FIELD_VIEW_H = 480
const MAG_CX = FIELD_VIEW_W / 2
const MAG_TOP = 208

// Диаграмма-снимок сцены 0/1 — магнит по центру своего собственного
// SVG-полотна (без кольца — оно появится в следующей сцене).
const MagnetIntroDiagram = ({ withField }: { withField: boolean }) => (
    <div className="flex w-full justify-center py-2">
        <svg viewBox={`0 0 ${FIELD_VIEW_W} ${FIELD_VIEW_H}`} className="h-[360px] w-[240px]">
            {withField && <MagnetFieldLines x={MAG_CX} top={MAG_TOP} color={FIELD_COLOR} flowing />}
            <MagnetShape x={MAG_CX} top={MAG_TOP} />
        </svg>
    </div>
)

// Диаграмма сцен-полюсов (2/3) — тот же магнит, но нейтральный, с одним
// подсвеченным краем, поле бледное и неподвижное.
const MagnetPoleDiagram = ({ highlight }: { highlight: 'N' | 'S' }) => (
    <div className="flex w-full justify-center py-2">
        <svg viewBox={`0 0 ${FIELD_VIEW_W} ${FIELD_VIEW_H}`} className="h-[360px] w-[240px]">
            <MagnetFieldLines x={MAG_CX} top={MAG_TOP} color={PENDING_COLOR} />
            <MagnetPoleShape x={MAG_CX} top={MAG_TOP} highlight={highlight} />
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
                {/* Шаг 0 — просто знакомство с магнитом, без подсветки. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <TypedLine text="Смотри — это магнит." className="w-full text-center text-base md:text-lg text-[#F2F7FB]" />
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <MagnetIntroDiagram withField={false} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — магнит создаёт вокруг себя магнитное поле B;
                    диаграмма дорисовывает силовые линии тем же цветом;
                    затем единица измерения — Тесла (Тл). */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Магнит создаёт вокруг себя ' },
                                    { sticker: 'магнитное поле', color: FIELD_COLOR },
                                    { text: ' — обозначается буквой ' },
                                    { sticker: 'B', color: FIELD_COLOR },
                                    { text: '.' },
                                ]}
                            />
                            <DiagramBlock>
                                <MagnetIntroDiagram withField />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Магнитное поле измеряется в ' },
                                    { sticker: 'Тесла (Тл)', color: FIELD_COLOR },
                                    { text: '.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — у магнита есть северный полюс N (линии
                    бледнеют, подсвечивается нижний край магнита синим). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                <MagnetPoleDiagram highlight="N" />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'У магнита есть ' },
                                    { sticker: 'северный', color: NORTH_COLOR },
                                    { text: ' полюс ' },
                                    { sticker: 'N', color: NORTH_COLOR },
                                    { text: '.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — и южный полюс S (наоборот: всё бледное, кроме
                    верхнего края магнита, он красный). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                <MagnetPoleDiagram highlight="S" />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'И ' },
                                    { sticker: 'южный', color: SOUTH_COLOR },
                                    { text: ' полюс ' },
                                    { sticker: 'S', color: SOUTH_COLOR },
                                    { text: '.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
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
// ФАЗА "hands" — интерактивная песочница (магнит едет сам по программе,
// затем формула, затем своя очередь, затем вопросы). Без изменений
// относительно предыдущей версии файла — просто вынесена под свою фазу.
// ===================================================================

// Геометрия сцены (viewBox 0 0 200 250).
const SCENE_H = 250
const TOP_MIN = 6
const TOP_MAX = 118
const RING_CY = 176
const RING_RX = 64
const RING_RY = 11

const HISTORY = 150 // окно ~5 c при 30 Гц (ручной режим)
const TICK_MS = 33
const B_MAX_MT = 50
const PHI_MAX_MKWB = 100

const V_REF = 0.4 // скорость p/с, при которой I = 1
type Profile = { T: number; p: (t: number) => number; v: (t: number) => number }
const PROFILES: Profile[] = [
    { T: 4, p: () => 0.5, v: () => 0 }, // стоит
    { T: 5, p: (t) => 0.1 + 0.15 * t, v: () => 0.15 }, // ровно
    { T: 6, p: (t) => (t < 3 ? 0.05 + 0.08 * t : 0.29 + 0.16 * (t - 3)), v: (t) => (t < 3 ? 0.08 : 0.16) }, // вдвое быстрее
    { T: 5, p: (t) => 0.05 + 0.03 * t * t, v: (t) => 0.06 * t }, // разгон
]

type SandboxProps = {
    mode: 'auto' | 'manual'
    profile?: Profile
    runKey: number // смена запускает программу заново
    onFinish?: () => void
    onLamp?: () => void
}

const Sandbox = ({ mode, profile, runKey, onFinish, onLamp }: SandboxProps) => {
    const pRef = useRef(0.3) // положение магнита 0 (далеко) .. 1 (у кольца)
    const draggingRef = useRef(false)
    const grabRef = useRef(0)
    const svgRef = useRef<SVGSVGElement>(null)
    const prevPRef = useRef<number | null>(null)
    const prevTimeRef = useRef(0)
    const curRef = useRef(0)
    const phaseRef = useRef(0)
    const tRef = useRef(0)
    const runningRef = useRef(false)
    const phiHist = useRef<number[]>([])
    const curHist = useRef<number[]>([])
    const [, setTick] = useState(0)
    const [touched, setTouched] = useState(false)
    const modeRef = useRef(mode); modeRef.current = mode
    const profRef = useRef(profile); profRef.current = profile
    const cb = useRef({ onFinish, onLamp }); cb.current = { onFinish, onLamp }

    useEffect(() => {
        phiHist.current = []; curHist.current = []; tRef.current = 0; curRef.current = 0; prevPRef.current = null
        if (mode === 'auto' && profile) {
            pRef.current = profile.p(0)
            runningRef.current = runKey > 0
        } else {
            runningRef.current = false
            if (mode === 'manual') pRef.current = 0.3
        }
        setTick((x) => x + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runKey, mode])

    useEffect(() => {
        prevTimeRef.current = performance.now()
        const id = setInterval(() => {
            const now = performance.now()
            const dt = Math.max(0.001, (now - prevTimeRef.current) / 1000)
            prevTimeRef.current = now
            if (modeRef.current === 'auto') {
                const pr = profRef.current
                if (!pr || !runningRef.current) return
                tRef.current = Math.min(pr.T, tRef.current + dt)
                pRef.current = pr.p(tRef.current)
                curRef.current = pr.v(tRef.current) / V_REF
                phiHist.current.push(pRef.current); curHist.current.push(curRef.current)
                phaseRef.current += curRef.current * 40 * dt * 8
                if (tRef.current >= pr.T) { runningRef.current = false; cb.current.onFinish?.() }
            } else {
                const p = pRef.current
                const rate = prevPRef.current == null ? 0 : (p - prevPRef.current) / dt
                prevPRef.current = p
                curRef.current = curRef.current * 0.55 + clamp(rate / V_REF, -1, 1) * 0.45
                if (Math.abs(curRef.current) < 0.01) curRef.current = 0
                phaseRef.current += curRef.current * 40 * dt * 8
                phiHist.current.push(p); curHist.current.push(curRef.current)
                if (phiHist.current.length > HISTORY) { phiHist.current.shift(); curHist.current.shift() }
                if (Math.abs(curRef.current) > 0.3) cb.current.onLamp?.()
            }
            setTick((x) => x + 1)
        }, TICK_MS)
        return () => clearInterval(id)
    }, [])

    const toSvgY = (clientY: number) => {
        const r = svgRef.current!.getBoundingClientRect()
        return (clientY - r.top) * (SCENE_H / r.height)
    }
    const topOf = (p: number) => TOP_MIN + p * (TOP_MAX - TOP_MIN)
    const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (mode !== 'manual') return
        const y = toSvgY(e.clientY)
        const top = topOf(pRef.current)
        if (y < top - 14 || y > top + MAG_H + 14) return
        draggingRef.current = true
        grabRef.current = y - top
        try { svgRef.current!.setPointerCapture(e.pointerId) } catch { /* синтетические события */ }
        setTouched(true)
    }
    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!draggingRef.current) return
        pRef.current = clamp((toSvgY(e.clientY) - grabRef.current - TOP_MIN) / (TOP_MAX - TOP_MIN), 0, 1)
    }
    const onUp = () => { draggingRef.current = false }

    const p = pRef.current
    const top = topOf(p)
    const I = curRef.current
    const absI = Math.abs(I)
    const curColor = I >= 0 ? CURRENT_COLOR : CURRENT_COLOR_REV
    const magBottom = top + MAG_H
    const bMt = p * B_MAX_MT
    const phiMk = p * PHI_MAX_MKWB

    const auto = mode === 'auto'
    const total = auto && profile ? Math.round((profile.T * 1000) / TICK_MS) : HISTORY
    const chartPath = (arr: number[], w: number, h: number, lo: number, hi: number) =>
        arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (total - 1)) * w).toFixed(1)},${(h - ((v - lo) / (hi - lo)) * h).toFixed(1)}`).join(' ')
    const iLo = auto ? -0.1 : -1

    const lines = [-24, -12, 0, 12, 24]
    const showThrough = magBottom < RING_CY - 4

    return (
        <div className="w-full rounded-2xl border-2 border-[#3A464E] bg-[#161F23] p-2">
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-bold text-[#9AA7B0]">
                <span>B = <span className="text-white">{bMt.toFixed(0)} мТ</span></span>
                <span>Φ = B·S = <span style={{ color: FLUX_COLOR }}>{phiMk.toFixed(0)} мкВб</span></span>
                <span>S = const</span>
            </div>
            <div className="flex items-stretch gap-2">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 200 ${SCENE_H}`}
                    className="w-[44%] shrink-0 select-none"
                    style={{ touchAction: mode === 'manual' ? 'none' : 'auto' }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                >
                    {showThrough && lines.map((dx, i) => (
                        <g key={i} opacity={0.12 + 0.88 * p}>
                            <line x1={100 + dx * 0.6} y1={magBottom} x2={100 + dx} y2={RING_CY + 22}
                                stroke={FLUX_COLOR} strokeWidth={1.6} strokeDasharray="4 4" />
                            <path d={`M${100 + dx - 4},${RING_CY + 12} L${100 + dx},${RING_CY + 22} L${100 + dx + 4},${RING_CY + 12}`}
                                fill="none" stroke={FLUX_COLOR} strokeWidth={1.6} />
                        </g>
                    ))}
                    <ellipse cx={100} cy={RING_CY} rx={RING_RX} ry={RING_RY} fill="none" stroke="#4A5760" strokeWidth={5} />
                    {absI > 0.02 && (
                        <>
                            <ellipse cx={100} cy={RING_CY} rx={RING_RX} ry={RING_RY} fill="none"
                                stroke={curColor} strokeWidth={4 + 8 * absI} opacity={0.15 + 0.3 * absI} />
                            <ellipse cx={100} cy={RING_CY} rx={RING_RX} ry={RING_RY} fill="none"
                                stroke={curColor} strokeWidth={3 + 3 * absI} strokeLinecap="round"
                                strokeDasharray="14 14" strokeDashoffset={phaseRef.current}
                                opacity={Math.min(1, 0.4 + absI * 2)} />
                        </>
                    )}
                    <line x1={100} y1={RING_CY + RING_RY} x2={100} y2={218} stroke="#4A5760" strokeWidth={3} />
                    <circle cx={100} cy={232} r={10 + 10 * absI} fill={CURRENT_COLOR} opacity={Math.min(0.5, absI * 0.6)} />
                    <circle cx={100} cy={232} r={11} fill={absI > 0.08 ? '#FFE9A8' : '#2A343A'}
                        stroke={absI > 0.08 ? CURRENT_COLOR : '#4A5760'} strokeWidth={3}
                        opacity={absI > 0.08 ? 0.5 + 0.5 * Math.min(1, absI * 1.6) : 1} />
                    <MagnetShape x={100} top={top} />
                    {mode === 'manual' && !touched && (
                        <text x={100 + MAG_W / 2 + 8} y={top + MAG_H / 2 + 4} fontSize={13} fontWeight={800} fill="#F2F7FB">↕ тяни</text>
                    )}
                </svg>

                <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="rounded-xl bg-[#0F171A] p-1">
                        <div className="px-1 text-[11px] font-bold" style={{ color: FLUX_COLOR }}>Φ(t) — поток</div>
                        <svg viewBox="0 0 180 80" className="w-full">
                            <line x1={0} y1={79} x2={180} y2={79} stroke="#3A464E" />
                            <path d={chartPath(phiHist.current, 180, 76, 0, 1)} fill="none" stroke={FLUX_COLOR} strokeWidth={2.4} strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="rounded-xl bg-[#0F171A] p-1">
                        <div className="px-1 text-[11px] font-bold" style={{ color: curColor }}>I(t) — ток в кольце</div>
                        <svg viewBox="0 0 180 80" className="w-full">
                            <line x1={0} y1={76 - ((0 - iLo) / (1 - iLo)) * 76} x2={180} y2={76 - ((0 - iLo) / (1 - iLo)) * 76} stroke="#3A464E" strokeDasharray="3 3" />
                            <path d={chartPath(curHist.current, 180, 76, iLo, 1)} fill="none" stroke={CURRENT_COLOR} strokeWidth={2.4} strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}

type QuizQ = { q: string; options: string[]; correct: number; explain: string }
const QUIZ: QuizQ[] = [
    {
        q: 'Магнит неподвижно лежит на кольце. Есть ли ток в кольце?',
        options: ['Нет — поток не меняется', 'Да — поток же большой', 'Да, но слабый', 'Зависит от цвета магнита'],
        correct: 0,
        explain: 'ΔΦ = 0, значит ε = 0. Ток создаёт только изменение потока.',
    },
    {
        q: 'Магнит едет с постоянной скоростью — график Φ(t) прямая наклонная линия. Какой ток?',
        options: ['Постоянный, не равный нулю', 'Нулевой', 'Растёт всё сильнее', 'Убывает до нуля'],
        correct: 0,
        explain: 'Прямая — поток растёт равномерно, ΔΦ/Δt одинаково всё время, значит ток постоянный.',
    },
    {
        q: 'Магнит стал ехать вдвое быстрее. Что стало с током?',
        options: ['Не изменился', 'Уменьшился вдвое', 'Стал вдвое больше', 'Пропал'],
        correct: 2,
        explain: 'Поток меняется вдвое быстрее — ΔΦ/Δt вдвое больше, и ток вдвое больше.',
    },
    {
        q: 'Магнит разгоняется, график Φ(t) — парабола (круче и круче). Что с током?',
        options: ['Постоянный', 'Линейно растёт', 'Равен нулю', 'Линейно убывает'],
        correct: 1,
        explain: 'Наклон Φ(t) всё время растёт — значит и ток (ЭДС) растёт.',
    },
    {
        q: 'Поток через контур вырос с 2 Вб до 8 Вб за 3 с. Чему равна ЭДС индукции (по модулю)?',
        options: ['2 В', '6 В', '3 В', '0,5 В'],
        correct: 0,
        explain: 'ε = ΔΦ/Δt = (8 − 2)/3 = 2 В.',
    },
]

const QuizPart = ({ onFinish }: { onFinish: (hadMistake: boolean) => void }) => {
    const [i, setI] = useState(0)
    const orders = useMemo(() => QUIZ.map((qq) => shuffle(qq.options.map((_, k) => k))), [])
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    const qq = QUIZ[i]
    const isLast = i === QUIZ.length - 1

    const pickOpt = (k: number) => {
        if (done || wrongTried.includes(k)) return
        if (k === qq.correct) {
            setDone(true); setFlash(null)
            setNextLabel(pickWalkthroughNextLabel(isLast ? 'Готово' : 'Дальше'))
        } else {
            setHadMistake(true)
            setWrongTried((w) => [...w, k])
            setFlash(pickWrongTryPhrase())
        }
    }
    const next = () => {
        if (isLast) { onFinish(hadMistake); return }
        setI(i + 1); setWrongTried([]); setFlash(null); setDone(false)
    }

    return (
        <div className="flex w-full flex-col gap-3">
            <div className="text-center text-xs font-bold text-[#9AA7B0]">Проверим себя · {i + 1}/{QUIZ.length}</div>
            <div className="rounded-2xl border-2 border-[#3A464E] bg-[#161F23] p-4 text-center text-lg font-bold text-white">{qq.q}</div>
            <div className="grid grid-cols-1 gap-2">
                {orders[i].map((k) => {
                    const isWrong = wrongTried.includes(k)
                    const isRight = done && k === qq.correct
                    return (
                        <button
                            key={k}
                            disabled={isWrong || done}
                            onClick={() => pickOpt(k)}
                            className={cn('rounded-xl border-2 px-3 py-3 text-left font-bold transition-colors',
                                isRight ? 'text-[#A1D151]' : isWrong ? 'text-[#DC605B]' : 'text-white')}
                            style={{
                                borderColor: isRight ? CORRECT_COLOR : isWrong ? WRONG_COLOR : '#3A464E',
                                background: isRight ? `${CORRECT_COLOR}22` : isWrong ? `${WRONG_COLOR}22` : '#161F23',
                            }}
                        >
                            {qq.options[k]}
                        </button>
                    )
                })}
            </div>
            {flash && !done && (
                <div className="rounded-xl px-3 py-2 text-center text-sm font-bold" style={{ background: `${WRONG_COLOR}22`, color: WRONG_COLOR }}>{flash}</div>
            )}
            {done && (
                <>
                    <LocalAnswerConfetti />
                    <FieryFeedbackBanner fiery={isFieryMilestoneTrial(i)}>
                        <div className="text-center">
                            <div className="font-extrabold" style={{ color: CORRECT_COLOR }}>
                                {CORRECT_FEEDBACK_PHRASES[Math.floor(Math.random() * CORRECT_FEEDBACK_PHRASES.length)]}
                            </div>
                            <div className="mt-1 text-sm text-[#F2F7FB]">{qq.explain}</div>
                        </div>
                    </FieryFeedbackBanner>
                    <button onClick={next} className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>{nextLabel}</button>
                </>
            )}
        </div>
    )
}

const STAGE_TEXT: { title: string; hint: string; done: string }[] = [
    {
        title: 'Магнит и кольцо',
        hint: 'Нажми «Запустить» и смотри на графики: магнит просто лежит над кольцом.',
        done: 'Поток Φ не меняется — график ровный, тока нет. Лампочка не горит.',
    },
    {
        title: 'Магнит едет ровно',
        hint: 'Теперь магнит движется с постоянной скоростью. Что будет с потоком и током?',
        done: 'Поток растёт равномерно (прямая), а ток постоянный: ровная линия, но не ноль!',
    },
    {
        title: 'А если быстрее?',
        hint: 'Сначала магнит едет медленно, потом вдвое быстрее. Смотри на график тока.',
        done: 'Быстрее — круче Φ(t) — больше ток. Вдвое быстрее — вдвое больше ток.',
    },
    {
        title: 'Магнит разгоняется',
        hint: 'Скорость магнита всё время растёт. Что с током?',
        done: 'Φ(t) — парабола, круче и круче. Ток растёт линейно: ток — это наклон графика потока.',
    },
]

const HandsPhase = ({ onFinish }: { onFinish: (hadMistake: boolean) => void }) => {
    const [stage, setStage] = useState(0)
    const [runKey, setRunKey] = useState(0)
    const [ran, setRan] = useState(false)
    const [running, setRunning] = useState(false)
    const [lamp, setLamp] = useState(false)
    const [label, setLabel] = useState('Дальше')
    useEffect(() => { setLabel(pickWalkthroughNextLabel('Дальше')) }, [stage])

    const go = (n: number) => { setStage(n); setRan(false); setRunning(false); setLamp(false); setRunKey(0) }
    const start = () => { setRunning(true); setRunKey((k) => k + 1) }

    if (stage === 6) {
        return (
            <div className="mx-auto w-full max-w-md px-1 pb-8">
                <QuizPart onFinish={onFinish} />
            </div>
        )
    }

    const st = stage < 4 ? STAGE_TEXT[stage] : null
    const canNext = stage < 4 ? ran : stage === 4 ? true : lamp
    const isAuto = stage < 4

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-1 pb-8">
            {stage !== 4 && (
                <Sandbox
                    key={`sb-${stage}`}
                    mode={isAuto ? 'auto' : 'manual'}
                    profile={isAuto ? PROFILES[stage] : undefined}
                    runKey={runKey}
                    onFinish={() => { setRan(true); setRunning(false) }}
                    onLamp={() => setLamp(true)}
                />
            )}

            {st && (
                <motion.div key={`tx-${stage}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                    <div className="text-center text-xs font-bold text-[#9AA7B0]">Шаг {stage + 1} из 6</div>
                    <div className="text-center text-xl font-extrabold text-white">{st.title}</div>
                    <div className="text-center text-base text-[#D5DEE3]">{st.hint}</div>
                    {ran && (
                        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl border-2 px-3 py-2 text-center font-bold"
                            style={{ borderColor: CORRECT_COLOR, background: `${CORRECT_COLOR}1A`, color: '#E7F5C8' }}>
                            {st.done}
                        </motion.div>
                    )}
                    <button
                        disabled={running}
                        onClick={start}
                        className={walkthroughButtonClass(!running)}
                        style={walkthroughButtonStyle(!running)}
                    >
                        {running ? 'Идёт…' : ran ? '↻ Ещё раз' : '▶ Запустить'}
                    </button>
                </motion.div>
            )}

            {stage === 4 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                    <div className="text-center text-xs font-bold text-[#9AA7B0]">Шаг 5 из 6</div>
                    <div className="text-center text-xl font-extrabold text-white">Закон Фарадея</div>
                    <div className="rounded-2xl border-2 p-4 text-center text-2xl" style={{ borderColor: ACTIVE_COLOR, background: `${ACTIVE_COLOR}14` }}>
                        <Latex>{'$\\varepsilon = -\\dfrac{\\Delta\\Phi}{\\Delta t}$'}</Latex>
                    </div>
                    <div className="text-center text-base text-[#D5DEE3]">
                        ЭДС индукции — это <b style={{ color: FLUX_COLOR }}>скорость изменения потока</b>, то есть
                        «наклон» графика Φ(t). Ровная линия — тока нет, прямая наклонная — ток постоянный,
                        круче — ток больше. Знак «−» только про направление тока.
                    </div>
                </motion.div>
            )}

            {stage === 5 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                    <div className="text-center text-xs font-bold text-[#9AA7B0]">Шаг 6 из 6</div>
                    <div className="text-center text-xl font-extrabold text-white">Твоя очередь</div>
                    <div className="text-center text-base text-[#D5DEE3]">Потяни магнит сам — зажги лампочку и посмотри, как ток повторяет наклон потока.</div>
                    {lamp && (
                        <div className="rounded-xl border-2 px-3 py-2 text-center font-bold"
                            style={{ borderColor: CORRECT_COLOR, background: `${CORRECT_COLOR}1A`, color: '#E7F5C8' }}>
                            Лампочка горит! Движешь магнит — поток меняется — есть ток.
                        </div>
                    )}
                </motion.div>
            )}

            <button
                disabled={!canNext}
                onClick={() => go(stage + 1)}
                className={walkthroughButtonClass(canNext)}
                style={walkthroughButtonStyle(canNext)}
            >
                {stage === 5 ? 'Проверим себя' : stage === 4 ? 'Попробовать самому' : label}
            </button>
        </div>
    )
}

// ===== Основной компонент =====

export const TypeFaradayWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'concept' | 'hands'>('concept')
    const finishedRef = useRef(false)

    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    if (phase === 'concept') {
        return <ConceptPhase onDone={() => setPhase('hands')} />
    }
    return <HandsPhase onFinish={handleFinish} />
}
