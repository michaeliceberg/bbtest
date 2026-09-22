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
import dynamic from 'next/dynamic'
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
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'

// lottie-react трогает document на импорте — без ssr:false падает на
// сервере (та же SSR-ловушка, что уже чинили у TrainerMascot/question-
// bubble/type-logdefwalk.tsx и др., см. CLAUDE.md).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Магнитное поле B — отдельная величина, вводимая своим цветом (та же
// роль, что синий уже играет в палитре ggege — "угол/величина, которую
// вводим отдельно от прочих", см. CLAUDE.md).
const FIELD_COLOR = GGEGE_PALETTE.blue.button

// Полюса магнита — свои цвета (сцены 2/3): северный красным, южный
// синим — стандартная раскраска компаса/магнита (по прямой просьбе
// пользователя — было наоборот, исправлено). Переиспользуют уже
// существующие в проекте hex-значения (WRONG_COLOR/FIELD_COLOR), не
// изобретают новые.
const NORTH_COLOR = WRONG_COLOR
const SOUTH_COLOR = FIELD_COLOR

// Кольцо (сцены "металлическое кольцо"/"площадь S" + DistanceScene) —
// бирюзовый, свободный от остальных ролей цвет в палитре ggege (см.
// CLAUDE.md — raspberry/teal "пока используются только на /learn...
// свободны для новой роли").
const RING_COLOR = GGEGE_PALETTE.teal.button

const FLUX_COLOR = GGEGE_PALETTE.purple.button
const CURRENT_COLOR = GGEGE_PALETTE.orange.button
const CURRENT_COLOR_REV = GGEGE_PALETTE.teal.button

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

// ===================================================================
// ФАЗА "concept" — знакомство с объектами, по одному, накопительный лог.
// ===================================================================

const INTRO_CONCEPT_STEPS = 9
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
// break:true — печатается Typewriter'ом как обычный пробел (чтобы не
// путать анимацию печати), а после onDone превращается в настоящий
// перенос строки — нужно, когда фраза должна принудительно ломаться в
// конкретном месте, а не просто естественным word-wrap по ширине.
type LinePart = { text: string } | { sticker: string; color: string } | { break: true }
const TypedLineWithParts = ({ parts, onSettled }: { parts: LinePart[]; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plainText = parts.map((p) => ('text' in p ? p.text : 'sticker' in p ? p.sticker : ' ')).join('')
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
                            : <br key={i} />
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
// По прямой просьбе пользователя — НАСТОЯЩИЙ эллипс (не окружность — та
// была первым шагом, гарантированно круглая, но пользователь попросил
// растянуть её по вертикали, сохранив ту же гладкость/симметрию, "как
// сейчас, но овалом"): для каждой линии находится ЕДИНСТВЕННЫЙ эллипс с
// заданным отношением полуосей FIELD_STRETCH=Ry/Rx, проходящий через ТРИ
// точки — полюс N, полюс S и точку максимальной ширины (rx на высоте
// центра магнита). Симметричен относительно горизонтальной оси через
// центр магнита АВТОМАТИЧЕСКИ (все три опорные точки сами симметричны).
// Строится ТОЛЬКО для правой стороны (side=+1); левая — точное
// зеркальное отражение правой по x (см. ellPoint) — та же техника, что и
// раньше для окружности (см. историю сессии — прямая подстановка
// side=-1 в общую формулу давала точку максимальной ширины на угле 180°,
// а не 0°, что ломало интерполяцию; отражение готовой правой половины
// полностью обходит эту проблему).
//
// Вывод формулы (Rx для заданного rx и stretch=Ry/Rx): из системы
// "эллипс с центром (h,cy) и полуосями (Rx,Ry=stretch*Rx) проходит через
// Q=(cx+rx,cy) и N=(cx,yN)" — Rx = rx/2 + halfSpan²/(2·stretch²·rx), где
// halfSpan = (yN-yS)/2 (половина расстояния между полюсами). При
// stretch=1 это в точности сводится к прежней формуле радиуса окружности
// (проверено численно) — эллипс, а не другая форма.
type Ellipse = { h: number; k: number; Rx: number; Ry: number; thetaN: number; thetaS: number }

const FIELD_STRETCH = 2 // Ry/Rx — во сколько раз выше окружности (по прямой просьбе пользователя)

function buildRightEllipse(cx: number, yN: number, yS: number, rx: number, stretch: number): Ellipse {
    const cy = (yN + yS) / 2
    const halfSpan = (yN - yS) / 2
    const Rx = rx / 2 + (halfSpan * halfSpan) / (2 * stretch * stretch * rx)
    const Ry = stretch * Rx
    const h = cx + rx - Rx
    const v = cx - h
    return { h, k: cy, Rx, Ry, thetaN: Math.atan2(halfSpan / Ry, v / Rx), thetaS: Math.atan2(-halfSpan / Ry, v / Rx) }
}

function arcPoint(e: Ellipse, cx: number, side: -1 | 1, t: number) {
    const theta = e.thetaN + (e.thetaS - e.thetaN) * t
    const rightX = e.h + e.Rx * Math.cos(theta)
    return { x: side === 1 ? rightX : 2 * cx - rightX, y: e.k + e.Ry * Math.sin(theta) }
}
function arcAngleDeg(e: Ellipse, cx: number, side: -1 | 1, t: number) {
    const theta = e.thetaN + (e.thetaS - e.thetaN) * t
    const dTheta = e.thetaS - e.thetaN
    const dxRight = -e.Rx * Math.sin(theta) * dTheta
    const dy = e.Ry * Math.cos(theta) * dTheta
    const dx = side === 1 ? dxRight : -dxRight
    return (Math.atan2(dy, dx) * 180) / Math.PI
}
const ARC_SAMPLES = 48
const arcPath = (e: Ellipse, cx: number, side: -1 | 1) =>
    Array.from({ length: ARC_SAMPLES + 1 }, (_, i) => arcPoint(e, cx, side, i / ARC_SAMPLES))
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ')

// "Течёт" по линии поля — маленькие стрелочки, бегущие вдоль дуги (тот же
// приём, что показывает направление тока/поля на референс-анимациях
// движения по проводу — маленькие маркеры друг за другом), а не просто
// статичный наконечник. Считается АНАЛИТИЧЕСКИ по параметру дуги (не CSS
// offset-path — тот же принцип, что и остальная физика в этом файле:
// setInterval, не requestAnimationFrame, чтобы не замирать в фоновых
// вкладках, см. комментарий у Sandbox). fade у краёв пути — маркер не
// обрывается резко на стыке.
const FLOW_PERIOD_MS = 2400
const FLOW_TICK_MS = 40
const FLOW_PHASES = [0, 1 / 3, 2 / 3]

const FlowArrows = ({ lines, cx, color }: { lines: { a: Ellipse; side: -1 | 1 }[]; cx: number; color: string }) => {
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
            {lines.map(({ a, side }, li) => FLOW_PHASES.map((phase, mi) => {
                const tt = (t + phase) % 1
                const pos = arcPoint(a, cx, side, tt)
                const angle = arcAngleDeg(a, cx, side, tt)
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

// Три вложенных линии — только ширина (rx) растёт с каждым следующим
// номером; высота/форма — не отдельный параметр, а естественное
// следствие геометрии окружности (шире линия — на бОльшую окружность
// приходится опираться, чтобы пройти через те же N/S — значит она
// автоматически "выше" тоже, без отдельной настройки).
const FIELD_RX_LIST = [60, 95, 135]

// Стикер "B" рядом с самой крайней дугой — по прямой просьбе пользователя,
// подписываем сами линии как линии поля B (тот же визуальный язык, что и
// у HTML-стикера Sticker в тексте — цветная рамка+подложка+жирная буква,
// только это SVG-версия, встроенная прямо в диаграмму).
// ВАЖНО: позиционирующий transform ("куда поставить стикер") — на
// СТАТИЧНОМ внешнем <g>, а не на самом motion.g. framer-motion для
// анимируемой группы перезаписывает transform/style СВОИМИ motion-values
// (нужными для scale) и стирает любой вручную заданный transform-атрибут
// — именно поэтому стикер уезжал в (0,0), угол canvas'а, несмотря на
// корректно посчитанные x/y (см. тот же гэтча, уже задокументированный в
// CLAUDE.md для motion.g в геометрических разборах).
const FieldBLabel = ({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) => (
    <g transform={`translate(${x},${y})`}>
        <motion.g
            initial={{ opacity: 0, scale: 2.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        >
            <rect x={-14} y={-14} width={28} height={28} rx={7} fill={hexToRgba(color, 0.18)} stroke={color} strokeWidth={2} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill={color}>B</text>
        </motion.g>
    </g>
)

// Силовые линии магнита целиком — draw-in анимация формы, затем (для
// flowing=true) бегущие стрелочки поверх и стикеры "B" у крайних дуг.
// pale=true (сцены-полюса) — тускло-серые, без движения, без стикеров —
// фокус смещён на полюса, не на поток.
const MagnetFieldLines = ({ x, top, color, flowing = false }: { x: number; top: number; color: string; flowing?: boolean }) => {
    const yN = top + MAG_H
    const yS = top
    const [started, setStarted] = useState(false)
    const entranceMs = FIELD_RX_LIST.length * 220 + 900
    useEffect(() => {
        if (!flowing) return
        const t = setTimeout(() => setStarted(true), entranceMs)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowing])

    const lines: { a: Ellipse; side: -1 | 1 }[] = []
    FIELD_RX_LIST.forEach((rx) => {
        const a = buildRightEllipse(x, yN, yS, rx, FIELD_STRETCH)
        ;([-1, 1] as const).forEach((side) => { lines.push({ a, side }) })
    })
    const outerRx = FIELD_RX_LIST[FIELD_RX_LIST.length - 1]
    const cy = (yN + yS) / 2
    const labelGap = 20

    return (
        <g>
            {lines.map(({ a, side }, i) => (
                <motion.path
                    key={i}
                    d={arcPath(a, x, side)}
                    stroke={color}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.9, ease: 'easeInOut', delay: Math.floor(i / 2) * 0.22 }}
                />
            ))}
            {flowing && (
                <>
                    <FieldBLabel x={x + outerRx + labelGap} y={cy} color={color} delay={entranceMs / 1000} />
                    <FieldBLabel x={x - outerRx - labelGap} y={cy} color={color} delay={entranceMs / 1000} />
                </>
            )}
            {flowing && started && <FlowArrows lines={lines} cx={x} color={color} />}
        </g>
    )
}

// Полотно диаграммы — увеличено (по прямой просьбе пользователя), сам
// магнит внутри — прежнего размера (MAG_W/MAG_H не менялись). Ширина
// (FIELD_VIEW_W) чуть больше 2×MAG_CX+2×outerRx — запас под стикеры "B"
// правее/левее крайних дуг.
const FIELD_VIEW_W = 360
const FIELD_VIEW_H = 480
const MAG_CX = FIELD_VIEW_W / 2
const MAG_TOP = 208

// Диаграмма-снимок сцены 0/1 — магнит по центру своего собственного
// SVG-полотна (без кольца — оно появится в следующей сцене).
const MagnetIntroDiagram = ({ withField }: { withField: boolean }) => (
    <div className="flex w-full justify-center py-2">
        <svg viewBox={`0 0 ${FIELD_VIEW_W} ${FIELD_VIEW_H}`} className="h-[360px] w-[270px]">
            {withField && <MagnetFieldLines x={MAG_CX} top={MAG_TOP} color={FIELD_COLOR} flowing />}
            <MagnetShape x={MAG_CX} top={MAG_TOP} />
        </svg>
    </div>
)

// Диаграмма сцен-полюсов (2/3) — тот же магнит, но нейтральный, с одним
// подсвеченным краем, поле бледное и неподвижное.
const MagnetPoleDiagram = ({ highlight }: { highlight: 'N' | 'S' }) => (
    <div className="flex w-full justify-center py-2">
        <svg viewBox={`0 0 ${FIELD_VIEW_W} ${FIELD_VIEW_H}`} className="h-[360px] w-[270px]">
            <MagnetFieldLines x={MAG_CX} top={MAG_TOP} color={PENDING_COLOR} />
            <MagnetPoleShape x={MAG_CX} top={MAG_TOP} highlight={highlight} />
        </svg>
    </div>
)

// "ВНИМАААААНИЕ!" — тот же визуальный язык, что уже устоялся в разборах
// "Логарифмы" (см. type-logdefwalk.tsx, RememberBanner) для важных правил:
// Lottie "полицейский с бумагой" крупно слева + плашка с мигающим "!"
// справа. По прямой просьбе пользователя — красная рамка (стандартный
// "красный" в палитре ggege — WRONG_COLOR, та же feedback-семантика, что
// уже используется по всему проекту, см. CLAUDE.md), не оранжевая. "!" —
// свой локальный (не общий BlinkingExclaim из WalkthroughLog.tsx — тот
// хардкожен в ATTENTION_COLOR/оранжевый без пропа цвета), чтобы не
// расходиться с новым красным цветом рамки.
const RedExclaim = () => (
    <motion.span
        className="inline-block ml-1 font-black"
        style={{ color: WRONG_COLOR }}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    >!</motion.span>
)

const DirectionRememberBanner = () => (
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

// Упрощённая горизонтальная схема направления поля — по прямой просьбе
// пользователя: "распиленный" магнит (N красным слева, S синим справа),
// одна прямая горизонтальная линия между ними, стрелочка бежит по ней
// слева направо (тот же принцип "течёт по линии", что и FlowArrows выше,
// но для прямого отрезка — линейная интерполяция, не эллипс).
const DIR_X1 = 68, DIR_X2 = 172, DIR_Y = 50

const DirectionDiagram = () => {
    const [t, setT] = useState(0)
    useEffect(() => {
        const start = performance.now()
        const id = setInterval(() => {
            setT(((performance.now() - start) % FLOW_PERIOD_MS) / FLOW_PERIOD_MS)
        }, FLOW_TICK_MS)
        return () => clearInterval(id)
    }, [])
    const phases = [0, 0.5]
    return (
        <div className="flex w-full justify-center py-3">
            <svg viewBox="0 0 240 100" className="h-[105px] w-[252px]">
                {/* N — красный (NORTH_COLOR), S — синий (SOUTH_COLOR) —
                    та же стандартная раскраска, что и в сценах 2/3. */}
                <rect x={20} y={30} width={40} height={40} rx={7} fill={NORTH_COLOR} />
                <text x={40} y={56} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff">N</text>
                <rect x={180} y={30} width={40} height={40} rx={7} fill={SOUTH_COLOR} />
                <text x={200} y={56} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff">S</text>
                <motion.line
                    x1={DIR_X1} y1={DIR_Y} x2={DIR_X2} y2={DIR_Y}
                    stroke={FIELD_COLOR} strokeWidth={2.5} strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                {/* Стикер "B" над бегущей стрелкой — той же техникой, что
                    и FieldBLabel выше: позиционирующий transform на
                    СТАТИЧНОМ внешнем <g>, анимация (scale/opacity) на
                    вложенном motion.g — иначе framer-motion стирает
                    вручную заданный transform (тот же баг, уже пойманный
                    и исправленный у стикеров сцены 1). */}
                <g transform={`translate(${(DIR_X1 + DIR_X2) / 2},${DIR_Y - 24})`}>
                    <motion.g
                        initial={{ opacity: 0, scale: 2.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 15, delay: 0.6 }}
                    >
                        <rect x={-13} y={-13} width={26} height={26} rx={6} fill={hexToRgba(FIELD_COLOR, 0.18)} stroke={FIELD_COLOR} strokeWidth={2} />
                        <text x={0} y={5} textAnchor="middle" fontSize={15} fontWeight={800} fill={FIELD_COLOR}>B</text>
                    </motion.g>
                </g>
                {phases.map((phase, i) => {
                    const tt = (t + phase) % 1
                    const x = DIR_X1 + (DIR_X2 - DIR_X1) * tt
                    const fade = Math.min(1, tt * 8, (1 - tt) * 8)
                    return (
                        <path key={i} d="M-4,-3 L5,0 L-4,3 Z" fill={FIELD_COLOR} opacity={fade}
                            transform={`translate(${x},${DIR_Y})`} />
                    )
                })}
            </svg>
        </div>
    )
}

// ===== Металлическое кольцо (бирюзовое) — площадь S =====
//
// Переиспользуемый визуал кольца: ellipse бирюзового цвета (draw-in
// анимация), опционально — заштрихованная область внутри (диагональные
// линии, обрезанные по эллипсу через clipPath — id уникален на каждый
// вызов через `uid`, иначе несколько одновременно смонтированных колец
// в накопительном логе разбора конфликтовали бы за один и тот же id) и
// боксовый бирюзовый стикер "S" ПОВЕРХ, слегка искажённый (skew+сжатие
// по вертикали через matrix — по прямой просьбе пользователя, "как бы
// размазана по области кольца", имитация перспективы того же типа, что
// уже даёт сжатие самого эллипса по Ry).
const TealRing = ({
    cx, cy, rx, ry, hatched = false, animateIn = false, uid, sScaleY = 0.6,
}: { cx: number; cy: number; rx: number; ry: number; hatched?: boolean; animateIn?: boolean; uid: string; sScaleY?: number }) => {
    const clipId = `ring-clip-${uid}`
    return (
        <g>
            {hatched && (
                <>
                    <defs>
                        <clipPath id={clipId}><ellipse cx={cx} cy={cy} rx={Math.max(0, rx - 3)} ry={Math.max(0, ry - 3)} /></clipPath>
                    </defs>
                    <g clipPath={`url(#${clipId})`}>
                        {Array.from({ length: 12 }, (_, i) => {
                            const t = i / 11
                            const x = cx - rx + t * 2 * rx
                            return (
                                <motion.line
                                    key={i}
                                    x1={x - ry * 1.4} y1={cy - ry * 1.6}
                                    x2={x + ry * 1.4} y2={cy + ry * 1.6}
                                    stroke={RING_COLOR} strokeWidth={1.6}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    transition={{ duration: 0.35, delay: 0.04 * i }}
                                />
                            )
                        })}
                    </g>
                </>
            )}
            {animateIn ? (
                <motion.ellipse
                    cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={RING_COLOR} strokeWidth={5}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
            ) : (
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={RING_COLOR} strokeWidth={5} />
            )}
            {hatched && (
                <motion.g
                    initial={{ opacity: 0, scale: 3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 17, delay: animateIn ? 0.9 : 0 }}
                >
                    {/* transform на СТАТИЧНОМ внутреннем <g> — не на самом
                        motion.g (тот же гэтча framer-motion, уже
                        задокументированный выше для FieldBLabel). */}
                    <g transform={`translate(${cx},${cy}) matrix(1,0,0.22,${sScaleY},0,0)`}>
                        <rect x={-16} y={-16} width={32} height={32} rx={7} fill={hexToRgba(RING_COLOR, 0.22)} stroke={RING_COLOR} strokeWidth={2.2} />
                        <text x={0} y={6} textAnchor="middle" fontSize={20} fontWeight={800} fill={RING_COLOR}>S</text>
                    </g>
                </motion.g>
            )}
        </g>
    )
}

const RING_INTRO_W = 260
const RING_INTRO_H = 160
const RING_INTRO_CX = 130
const RING_INTRO_CY = 82
const RING_INTRO_RX = 95
const RING_INTRO_RY = 30

// Диаграмма сцен "кольцо"/"площадь S" — та же геометрия, hatched=false
// (просто кольцо) для первой сцены, hatched=true (штриховка+стикер S)
// для второй.
const RingIntroDiagram = ({ hatched }: { hatched: boolean }) => (
    <div className="flex w-full justify-center py-2">
        <svg viewBox={`0 0 ${RING_INTRO_W} ${RING_INTRO_H}`} className="h-[170px] w-[276px]">
            <TealRing
                cx={RING_INTRO_CX} cy={RING_INTRO_CY} rx={RING_INTRO_RX} ry={RING_INTRO_RY}
                hatched={hatched} animateIn={!hatched} uid="intro" sScaleY={0.5}
            />
        </svg>
    </div>
)

// ===== Сцена "расстояние" — вертикальный риски-слайдер (тот же визуальный
// язык, что у тренажёрного типа SCROLL — трек + 3 риски + плавно едущий
// бегунок, только вертикально вместо горизонтали) + диаграмма плотности
// силовых линий, проходящих через кольцо снизу. По референсу пользователя
// (bs1/bs2/bs3) — не встроены как картинки (это сторонний экспорт из
// векторного редактора, судя по сигнатуре Layer0_0_FILL/Layer1_0_FILL,
// та же история, что и с прошлым присланным SVG в этой сессии), а
// переосмыслены своим кодом: чем ближе магнит (риска ближе к кольцу), тем
// БОЛЬШЕ стрелочек-силовых линий видно над кольцом — "перетекание" между
// состояниями через прозрачность каждой отдельной стрелки (не кросс-фейд
// целых картинок), плавно и без изломов.
// Все размеры увеличены (по прямой просьбе пользователя — длиннее
// вертикальная линия с рисками, бОльшего диаметра кольцо): риски
// раздвинуты вдвое дальше друг от друга (было 65, стало 110), кольцо
// заметно крупнее (rx 58→90, ry 14→24). Всё, что ниже последней риски
// (стрелочки поля, кольцо), сдвинуто вниз на ту же дельту, что выросла
// длина трека — зазор "магнит у ближней риски / верх стрелочек"
// остаётся визуально тем же, что и в исходной версии.
const DIST_TRACK_X = 120
const DIST_TICK_Y = [30, 140, 250] // далеко, средне, близко
const DIST_MAG_W = 32
const DIST_MAG_H = 48
const DIST_ARROW_Y1 = 282
const DIST_ARROW_Y2 = 306
const DIST_ARROW_TIP_Y1 = 300
const DIST_ARROW_TIP_Y2 = 310
const DIST_ARROW_MID_Y = 294
const DIST_RING_CY = 350
const DIST_RING_RX = 90
const DIST_RING_RY = 24
// 9 позиций стрелок (симметрично вокруг центра); VISIBLE_HALF — сколько
// от центра видно на каждой риске: далеко=1 стрелка, средне=5, близко=9 —
// тот же принцип "больше линий = ближе магнит", что и у bs1/bs2/bs3.
const DIST_ARROW_OFFSETS = [-56, -42, -28, -14, 0, 14, 28, 42, 56]
const DIST_VISIBLE_HALF = [0, 2, 4]
const DIST_LABEL_GAP = 22

const DistanceDiagram = ({ selectedIndex, onSelect }: { selectedIndex: number; onSelect: (i: number) => void }) => {
    const magTop = DIST_TICK_Y[selectedIndex] - DIST_MAG_H / 2
    const visibleHalf = DIST_VISIBLE_HALF[selectedIndex]
    // Стикер "B" — всегда рядом с крайней ПРАВОЙ ВИДИМОЙ стрелочкой поля
    // (по прямой просьбе пользователя): у дальней риски (visibleHalf=0)
    // видна только центральная стрелка (offset 0) — B рядом с ней; у
    // средней (visibleHalf=2) — рядом с новой крайней видимой (offset
    // 28); у ближней (visibleHalf=4, максимум поля) — как и раньше,
    // справа от самой правой из всех 9 (offset 56). Индекс 4+visibleHalf
    // в DIST_ARROW_OFFSETS всегда даёт именно этот offset, т.к. массив
    // симметричен вокруг центрального индекса 4=offset 0.
    const rightmostVisibleOffset = DIST_ARROW_OFFSETS[4 + visibleHalf]
    const bLabelX = DIST_TRACK_X + rightmostVisibleOffset + DIST_LABEL_GAP
    return (
        <div className="flex w-full justify-center py-2">
            <svg viewBox="0 0 240 400" className="h-[420px] w-[252px]">
                <line x1={DIST_TRACK_X} y1={DIST_TICK_Y[0]} x2={DIST_TRACK_X} y2={DIST_TICK_Y[2]}
                    stroke="#3A464E" strokeWidth={4} strokeLinecap="round" />
                {DIST_TICK_Y.map((y, i) => (
                    <circle
                        key={i}
                        cx={DIST_TRACK_X} cy={y} r={i === selectedIndex ? 9 : 7}
                        fill={i === selectedIndex ? FIELD_COLOR : '#161F23'}
                        stroke={i === selectedIndex ? FIELD_COLOR : '#3A464E'} strokeWidth={2.5}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSelect(i)}
                    />
                ))}

                {/* Кольцо — бирюзовое, с заштрихованной площадью и
                    стикером "S" внутри (та же визуализация, что и в
                    сценах "металлическое кольцо"/"площадь S" выше) —
                    статично, не зависит от выбранной риски. */}
                <TealRing cx={DIST_TRACK_X} cy={DIST_RING_CY} rx={DIST_RING_RX} ry={DIST_RING_RY} hatched uid="dist" sScaleY={0.55} />

                {DIST_ARROW_OFFSETS.map((dx, i) => {
                    const visible = Math.abs(i - 4) <= visibleHalf
                    const x = DIST_TRACK_X + dx
                    return (
                        <motion.g key={i} animate={{ opacity: visible ? 0.9 : 0 }} transition={{ duration: 0.4 }}>
                            <line x1={x} y1={DIST_ARROW_Y1} x2={x} y2={DIST_ARROW_Y2} stroke={FIELD_COLOR} strokeWidth={2} strokeLinecap="round" />
                            <path d={`M${x - 4},${DIST_ARROW_TIP_Y1} L${x},${DIST_ARROW_TIP_Y2} L${x + 4},${DIST_ARROW_TIP_Y1}`} fill="none"
                                stroke={FIELD_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                    )
                })}
                {/* Стикер "B" — рядом с крайней видимой стрелочкой поля,
                    подстраивается под выбранную риску (см. rightmostVisibleOffset
                    выше). Позиционирующий x/y — на motion.g через x/y
                    framer-motion motion-values (не raw transform-строка),
                    та же безопасная техника, что и у самого магнита ниже. */}
                <motion.g
                    animate={{ x: bLabelX, y: DIST_ARROW_MID_Y }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                    <FieldBLabel x={0} y={0} color={FIELD_COLOR} delay={0.3} />
                </motion.g>

                {/* Магнит — едет между рисками (framer-motion x/y-моушены
                    компонуются между собой сами, без риска затирания
                    transform-атрибута, см. фикс стикеров выше). */}
                <motion.g
                    animate={{ y: magTop }}
                    transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                    style={{ x: DIST_TRACK_X - DIST_MAG_W / 2 }}
                >
                    <rect width={DIST_MAG_W} height={DIST_MAG_H / 2} rx={5} fill={SOUTH_COLOR} />
                    <rect y={DIST_MAG_H / 2} width={DIST_MAG_W} height={DIST_MAG_H / 2} rx={5} fill={NORTH_COLOR} />
                    <text x={DIST_MAG_W / 2} y={DIST_MAG_H / 4 + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">S</text>
                    <text x={DIST_MAG_W / 2} y={DIST_MAG_H * 0.75 + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">N</text>
                </motion.g>
            </svg>
        </div>
    )
}

// Обёртка с состоянием — магнит стартует на дальней риске (слабое поле),
// готовность шага наступает после ПЕРВОГО клика пользователя по риске
// (то же требование "потрогать самому", что и у HandsPhase дальше).
const DistanceScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [hasInteracted, setHasInteracted] = useState(false)
    const handleSelect = (i: number) => {
        setSelectedIndex(i)
        if (!hasInteracted) { setHasInteracted(true); onSettled?.() }
    }
    return <DistanceDiagram selectedIndex={selectedIndex} onSelect={handleSelect} />
}

// ===== Сцена "поток Ф" — страница делится пополам: слева магнитное поле
// (стрелочки + стикер B), справа металлическое кольцо (заштрихованное,
// со стикером S) — оба уже знакомых объекта РЯДОМ, чтобы наглядно ввести
// формулу Φ=B·S как произведение того, что слева, на то, что справа.
// Пунктирный разделитель посередине — тот же визуальный язык, что уже
// использует CONNECT в тренажёре для "это две отдельные половины" (см.
// CLAUDE.md).
const FLUX_MINI_W = 130
const FLUX_MINI_H = 130

const FluxArrowsDiagram = () => (
    <svg viewBox={`0 0 ${FLUX_MINI_W} ${FLUX_MINI_H}`} className="h-[130px] w-[130px]">
        {[-20, 0, 20].map((dx, i) => {
            const x = 45 + dx
            return (
                <g key={i}>
                    <line x1={x} y1={16} x2={x} y2={82} stroke={FIELD_COLOR} strokeWidth={2.5} strokeLinecap="round" />
                    <path d={`M${x - 5},${72} L${x},${86} L${x + 5},${72}`} fill="none"
                        stroke={FIELD_COLOR} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </g>
            )
        })}
        <FieldBLabel x={45 + 20 + 26} y={49} color={FIELD_COLOR} delay={0.3} />
    </svg>
)

const FluxRingDiagram = () => (
    <svg viewBox={`0 0 ${FLUX_MINI_W} ${FLUX_MINI_H}`} className="h-[130px] w-[130px]">
        <TealRing cx={65} cy={65} rx={52} ry={16} hatched animateIn uid="flux-mini" sScaleY={0.55} />
    </svg>
)

// showRight=false — только левая половина (магнитное поле), она же
// первой попадает под DiagramBlock снаружи (см. FluxScene ниже) и
// получает свою entrance-анимацию оттуда. Правая половина + разделитель
// появляются ПОЗЖЕ, отдельным условным рендером — их СОБСТВЕННАЯ
// entrance-анимация (fade+scale, тот же язык, что и у DiagramBlock)
// нужна, т.к. DiagramBlock анимирует только СВОЙ момент монтирования, не
// последующие изменения содержимого внутри уже смонтированного блока.
const FluxSplitDiagram = ({ showRight }: { showRight: boolean }) => (
    <div className="flex w-full items-start justify-center gap-3">
        <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="text-sm font-bold text-[#F2F7FB]">Магнитное поле</div>
            <FluxArrowsDiagram />
        </div>
        {showRight && (
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                    className="mt-6 self-stretch border-l-2 border-dashed border-[#3A464E]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
                    className="flex flex-1 flex-col items-center gap-1.5"
                >
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#F2F7FB]">
                        <span>Металлическое кольцо</span>
                        <Sticker value="S" color={RING_COLOR} />
                    </div>
                    <FluxRingDiagram />
                </motion.div>
            </>
        )}
    </div>
)

// Пауза между битами сцены — тот же ≥800мс стандарт, что и везде в
// проекте для разборов по шагам (см. CLAUDE.md, "Управление шагами").
const FLUX_PAUSE_MS = 900
// Сколько реально длится entrance правой половины (fade+scale контейнера
// 0.35с + draw-in самого кольца 0.8с + spring-появление стикера S с
// задержкой 0.9с) — ждём её ПОЛНОСТЬЮ, прежде чем добавлять паузу перед
// формулой (тот же принцип "не начинать следующий бит, пока не доиграл
// предыдущий", что уже задокументирован в CLAUDE.md для zoom-циклов).
const FLUX_RIGHT_ENTRANCE_MS = 1400

// Сама сцена "поток Φ" — по прямой просьбе пользователя раскрывается
// СТРОГО последовательно (не всё сразу, как в первой версии): текст →
// пауза → левая половина → пауза → правая половина → пауза → формула →
// единица измерения. Управляется локальным phase (0..4), а не пропом
// step ConceptPhase — это внутренняя хореография ОДНОЙ сцены, верхний
// уровень (step/stepReady) знает только про итоговую готовность.
const FluxScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase !== 2) return
        const t = setTimeout(() => setPhase(3), FLUX_RIGHT_ENTRANCE_MS + FLUX_PAUSE_MS)
        return () => clearTimeout(t)
    }, [phase])

    return (
        <>
            <TypedLineWithParts
                parts={[
                    { text: 'Теперь введём ' },
                    { sticker: 'поток', color: FLUX_COLOR },
                    { text: ' магнитного поля — обозначается буквой ' },
                    { sticker: 'Φ', color: FLUX_COLOR },
                    { text: '.' },
                ]}
                onSettled={() => setTimeout(() => setPhase(1), FLUX_PAUSE_MS)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => Math.max(p, 2)), FLUX_PAUSE_MS)}>
                    <FluxSplitDiagram showRight={phase >= 2} />
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[
                        { sticker: 'Φ', color: FLUX_COLOR },
                        { text: ' = ' },
                        { sticker: 'B', color: FIELD_COLOR },
                        { text: ' · ' },
                        { sticker: 'S', color: RING_COLOR },
                        { text: '.' },
                    ]}
                    onSettled={() => setTimeout(() => setPhase(4), FLUX_PAUSE_MS)}
                />
            )}
            {phase >= 4 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Поток ' },
                        { sticker: 'Φ', color: FLUX_COLOR },
                        { text: ' измеряется в ' },
                        { sticker: 'Вб', color: FLUX_COLOR },
                        { text: ' (Веберах).' },
                    ]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

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

                {/* Шаг 4 — важное правило направления: линии поля всегда
                    идут от N к S. Баннер "ЗАПОМНИ!" (тот же стиль, что в
                    разборе логарифмов) + упрощённая горизонтальная схема
                    "распиленного" магнита с бегущей слева направо
                    стрелочкой. */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <DiagramBlock><DirectionRememberBanner /></DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'Линии магнитного поля всегда идут' },
                                    { break: true },
                                    { text: 'от ' },
                                    { sticker: 'N', color: NORTH_COLOR },
                                    { text: ' (северный) к ' },
                                    { sticker: 'S', color: SOUTH_COLOR },
                                    { text: ' (южный).' },
                                ]}
                            />
                            <DiagramBlock onSettled={() => setStepReady(true)}>
                                <DirectionDiagram />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 5 — знакомство с кольцом: просто рисуем бирюзовое
                    кольцо, объясняем, что оно металлическое (значит
                    проводит электричество) — без этого свойства кольцо
                    было бы декоративной картинкой, не частью физики. */}
                {step >= 5 && (
                    <SceneWrapper key="step-5" innerRef={sceneRef('step-5')} active={isSceneActive('step-5')}>
                        <Fragment key={`step-5-${nonceFor('step-5')}`}>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'А это металлическое ' },
                                    { sticker: 'кольцо', color: RING_COLOR },
                                    { text: '.' },
                                ]}
                            />
                            <DiagramBlock>
                                <RingIntroDiagram hatched={false} />
                            </DiagramBlock>
                            <TypedLine
                                text="Важно что оно металлическое!"
                                className="w-full text-center text-base md:text-lg font-extrabold text-[#F2F7FB]"
                            />
                            <TypedLine
                                text="Чтобы проводило электричество."
                                className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 6 — у кольца самое главное — его площадь S:
                    заштриховываем область внутри кольца, буква S —
                    бирюзовым стикером внутри, слегка искажённая
                    ("размазанная" по площади, имитация перспективы). */}
                {step >= 6 && (
                    <SceneWrapper key="step-6" innerRef={sceneRef('step-6')} active={isSceneActive('step-6')}>
                        <Fragment key={`step-6-${nonceFor('step-6')}`}>
                            <DiagramBlock>
                                <RingIntroDiagram hatched />
                            </DiagramBlock>
                            <TypedLineWithParts
                                parts={[
                                    { text: 'У кольца самое главное — его площадь ' },
                                    { sticker: 'S', color: RING_COLOR },
                                    { text: '.' },
                                ]}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 7 — сам потрогай: магнит едет между 3 рисками
                    (клик по риске — плавно, с разгоном/торможением,
                    как в тренажёрном SCROLL, только вертикально); чем
                    ближе к кольцу — тем больше силовых линий видно. */}
                {step >= 7 && (
                    <SceneWrapper key="step-7" innerRef={sceneRef('step-7')} active={isSceneActive('step-7')}>
                        <Fragment key={`step-7-${nonceFor('step-7')}`}>
                            <TypedLine
                                text="Подвинь магнит по рискам — смотри, как меняется поле у кольца."
                                className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                            />
                            <DiagramBlock>
                                <DistanceScene onSettled={() => setStepReady(true)} />
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 8 — поток Φ: строго последовательно (текст → пауза
                    → левая половина → пауза → правая половина → пауза →
                    формула → единица измерения) — вся хореография внутри
                    FluxScene (см. выше), сцена ConceptPhase лишь ждёт её
                    итоговой готовности. Единица измерения — Вебер, не
                    "Фарадеях", как было в исходной формулировке
                    пользователя: Фарад — единица ЁМКОСТИ конденсатора, а
                    не потока; похоже на путаницу из-за того, что "Ф" —
                    сокращение и греческой буквы Φ, и слова "Фарад"
                    одновременно — исправлено на физически верную
                    единицу, тот же Вебер/мкВб, что уже используется в
                    hands-on песочнице этого же файла чуть ниже. */}
                {step >= 8 && (
                    <SceneWrapper key="step-8" innerRef={sceneRef('step-8')} active={isSceneActive('step-8')}>
                        <Fragment key={`step-8-${nonceFor('step-8')}`}>
                            <FluxScene onSettled={() => setStepReady(true)} />
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
