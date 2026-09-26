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
// После знакомства (INTRO_CONCEPT_STEPS шагов) — фаза 'quiz'
// (ConceptQuizPhase): короткая фиксированная проверка понимания (5
// бинарных вопросов, тот же формат "1/N + огненный Lottie на каждом
// 4-м", что и в разборах логарифмов) — ей же урок и заканчивается.
// Старая интерактивная песочница "магнит+кольцо+графики Φ(t)/I(t)"
// (фаза 'hands' — магнит едет сам по 4 программам, формула ε=−ΔΦ/Δt,
// "своя очередь", финальный числовой квиз) убрана ЦЕЛИКОМ по прямой
// просьбе пользователя (2026-09-22) — дублировала уже более наглядно
// объяснённый материал.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock, TypedLine,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR, WRONG_COLOR, PENDING_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { declensionRu } from '@/usefulFunctions'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

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

// ===================================================================
// ФАЗА "concept" — знакомство с объектами, по одному, накопительный лог.
// ===================================================================

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
// bold — обычный жирный текст БЕЗ цветной рамки/подложки (отличается от
// sticker — тот всегда цветной боксовый акцент на термине-объекте вроде
// B/S/Φ/"поток"/"кольцо"; bold — просто смысловое усиление слова внутри
// обычного предложения, например "БЛИЖЕ"/"БОЛЬШЕ" в сравнении).
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

// Сколько реально осядет отрисовка силовых линий (draw-in штрихов —
// см. transition в MagnetFieldLines ниже, duration 0.9с с шагом delay
// floor(i/2)*0.22с на 6 линий) — переиспользуется и самой диаграммой
// (когда начинать бегущие стрелочки/стикеры B), и сценами разбора (когда
// считать "анимация нарисована" и переходить дальше по паузе).
const FIELD_LINES_SETTLE_MS = FIELD_RX_LIST.length * 220 + 900

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
// solidBg — по умолчанию полупрозрачная цветная подложка (как и раньше);
// риски-сцена передаёт true — там стикер плавает поверх бирюзовой дуги
// кольца, и полупрозрачный фон просвечивал/сливался с ней (по прямой
// просьбе пользователя) — непрозрачный тёмный фон панели (тот же
// нейтральный `#161F23`, что везде в проекте — фон карточек/плашек)
// гарантированно не сливается ни с чем под собой, независимо от цвета.
const FieldBLabel = ({ x, y, color, delay, solidBg = false }: { x: number; y: number; color: string; delay: number; solidBg?: boolean }) => (
    <g transform={`translate(${x},${y})`}>
        <motion.g
            initial={{ opacity: 0, scale: 2.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        >
            <rect x={-14} y={-14} width={28} height={28} rx={7} fill={solidBg ? '#161F23' : hexToRgba(color, 0.18)} stroke={color} strokeWidth={2} />
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
    const entranceMs = FIELD_LINES_SETTLE_MS
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
// SVG-полотна (без кольца — оно появится в следующей сцене). Рендер-размер
// увеличен на 50% (540×405, было 360×270) по прямой просьбе пользователя —
// viewBox (внутренняя геометрия) не менялся, только то, во сколько раз она
// растянута на экране.
const MagnetIntroDiagram = ({ withField }: { withField: boolean }) => (
    <div className="flex w-full justify-center py-2">
        <svg viewBox={`0 0 ${FIELD_VIEW_W} ${FIELD_VIEW_H}`} className="h-[540px] w-[405px]">
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
// «ЗАПОМНИ!» — тёплый солнечный цвет (красный читался как «ошибка»).
const REMEMBER_COLOR = '#F2C35B'
const RedExclaim = () => (
    <motion.span
        className="inline-block ml-1 font-black"
        style={{ color: REMEMBER_COLOR }}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    >!</motion.span>
)

const DirectionRememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div
            className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg text-center"
            style={{ backgroundColor: hexToRgba(REMEMBER_COLOR, 0.16), border: `2px solid ${REMEMBER_COLOR}`, color: REMEMBER_COLOR }}
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
    cx, cy, rx, ry, hatched = false, showS, animateIn = false, uid, sScaleY = 0.6,
}: { cx: number; cy: number; rx: number; ry: number; hatched?: boolean; showS?: boolean; animateIn?: boolean; uid: string; sScaleY?: number }) => {
    const clipId = `ring-clip-${uid}`
    // showS по умолчанию совпадает со старым поведением (штриховка и
    // стикер S всегда шли вместе) — независимый проп понадобился
    // риски-сцене: там штриховка убрана (сливалась со стрелочками поля),
    // но сам стикер S нужен оставить.
    const showSFinal = showS ?? hatched
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
            {showSFinal && (
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


// Размер маленького магнита в финальной игре «сделай поток максимальным».
const DIST_MAG_W = 32
const DIST_MAG_H = 48

// Сцена «придвинь магнит» (перерисована 2026-09-26): магнит СО СВОИМИ
// силовыми линиями едет к кольцу, кольцо «объёмное» (задняя половина под
// линиями, передняя — поверх), три кнопки далеко/средне/близко вместо
// палки с рисками, шкала «поле B у кольца». Готово — когда магнит близко.
const DS_W = 360
const DS_H = 470
const DS_RING_CX = MAG_CX
const DS_RING_CY = 420
const DS_RING_RX = 95
const DS_RING_RY = 22
const DS_MAG_CENTER = [170, 280, 360] // центр магнита: далеко / средне / близко
const DS_LEVELS = ['слабое', 'среднее', 'сильное']
const DS_LEVEL_W = [22, 58, 100]
// Стрелки поля B сквозь кольцо: 9 точек внутри эллипса кольца (2 ряда —
// «глубина» кольца), видимость по близости магнита: далеко 2, средне 5, близко 9.
const DS_ARROWS = [
    { dx: -15, dy: -8, lvl: 0 }, { dx: 15, dy: 8, lvl: 0 },
    { dx: -45, dy: 8, lvl: 1 }, { dx: 45, dy: -8, lvl: 1 }, { dx: 0, dy: 0, lvl: 1 },
    { dx: -70, dy: -4, lvl: 2 }, { dx: 70, dy: 4, lvl: 2 }, { dx: -35, dy: -10, lvl: 2 }, { dx: 35, dy: 10, lvl: 2 },
]
const DS_ARROW_LEN = 46
const DistanceScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [idx, setIdx] = useState(0)
    const [done, setDone] = useState(false)
    const pick = (i: number) => {
        playSound('/click6.wav')
        setIdx(i)
        if (i === 2 && !done) { setDone(true); onSettled?.() }
    }
    const back = `M ${DS_RING_CX - DS_RING_RX} ${DS_RING_CY} A ${DS_RING_RX} ${DS_RING_RY} 0 0 1 ${DS_RING_CX + DS_RING_RX} ${DS_RING_CY}`
    const front = `M ${DS_RING_CX - DS_RING_RX} ${DS_RING_CY} A ${DS_RING_RX} ${DS_RING_RY} 0 0 0 ${DS_RING_CX + DS_RING_RX} ${DS_RING_CY}`
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <svg viewBox={`0 0 ${DS_W} ${DS_H}`} className="w-full max-w-[330px] h-auto overflow-hidden">
                <path d={back} fill="none" stroke={RING_COLOR} strokeWidth={6} />
                <motion.g animate={{ y: DS_MAG_CENTER[idx] - (MAG_TOP + MAG_H / 2) }} initial={{ y: DS_MAG_CENTER[0] - (MAG_TOP + MAG_H / 2) }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}>
                    <g opacity={0.45}>
                        <MagnetFieldLines x={MAG_CX} top={MAG_TOP} color={FIELD_COLOR} flowing />
                    </g>
                    <MagnetShape x={MAG_CX} top={MAG_TOP} />
                </motion.g>
                {DS_ARROWS.map((ar, i) => {
                    const x = DS_RING_CX + ar.dx
                    const yTip = DS_RING_CY + ar.dy + 18
                    const yTop = yTip - DS_ARROW_LEN
                    return (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: ar.lvl <= idx ? 1 : 0 }} transition={{ duration: 0.35, delay: ar.lvl <= idx ? 0.35 + i * 0.04 : 0 }}>
                            <line x1={x} y1={yTop} x2={x} y2={yTip} stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" />
                            <path d={`M${x - 7},${yTip - 11} L${x},${yTip} L${x + 7},${yTip - 11}`} fill="none" stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                    )
                })}
                <path d={front} fill="none" stroke={RING_COLOR} strokeWidth={6} />
                {idx === 2 && (
                    <motion.ellipse cx={DS_RING_CX} cy={DS_RING_CY} rx={DS_RING_RX + 8} ry={DS_RING_RY + 6} fill="none" stroke={RING_COLOR} strokeWidth={3}
                        animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }} />
                )}
            </svg>
            <div className="w-full max-w-xs flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm font-black" style={{ color: FIELD_COLOR }}>
                    <span>Поле B у кольца: {DS_LEVELS[idx]}</span>
                    <span>{DS_ARROWS.filter((a) => a.lvl <= idx).length} {declensionRu(DS_ARROWS.filter((a) => a.lvl <= idx).length, 'стрелка', 'стрелки', 'стрелок')}</span>
                </div>
                <div className="h-4 w-full rounded-full bg-[#232F34] overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: FIELD_COLOR }} animate={{ width: `${DS_LEVEL_W[idx]}%` }} transition={{ duration: 0.5 }} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {['далеко', 'средне', 'близко'].map((o, i) => (
                    <button
                        key={o}
                        type="button"
                        onClick={() => pick(i)}
                        className={cn('rounded-lg border-2 py-2.5 text-sm font-black transition-colors', i === 2 && !done && 'animate-pulse')}
                        style={{ borderColor: idx === i ? FIELD_COLOR : '#3A464E', backgroundColor: idx === i ? hexToRgba(FIELD_COLOR, 0.2) : '#161F23', color: idx === i ? FIELD_COLOR : '#9AA7B0' }}
                    >
                        {o}
                    </button>
                ))}
            </div>
        </div>
    )
}

// Сцена «поток Φ» (упрощена 2026-09-26): поле B × кольцо S = поток Φ —
// три карточки появляются по очереди, потом объяснение и единица.
const FluxMiniField = () => (
    <svg viewBox="0 0 100 100" className="h-[78px] w-[78px] md:h-[92px] md:w-[92px]">
        {[30, 50, 70].map((x) => (
            <g key={x}>
                <line x1={x} y1={12} x2={x} y2={84} stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" />
                <path d={`M${x - 7},${74} L${x},${86} L${x + 7},${74}`} fill="none" stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
        ))}
    </svg>
)
const FluxMiniRing = () => (
    <svg viewBox="0 0 100 100" className="h-[78px] w-[78px] md:h-[92px] md:w-[92px]">
        <TealRing cx={50} cy={50} rx={42} ry={16} hatched uid="flux-card" />
    </svg>
)
const FluxMiniPhi = () => (
    <svg viewBox="0 0 100 100" className="h-[78px] w-[78px] md:h-[92px] md:w-[92px]">
        <path d="M 8 58 A 42 16 0 0 1 92 58" fill="none" stroke={RING_COLOR} strokeWidth={5} />
        {[32, 50, 68].map((x) => (
            <g key={x}>
                <line x1={x} y1={8} x2={x} y2={88} stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" />
                <path d={`M${x - 7},${78} L${x},${90} L${x + 7},${78}`} fill="none" stroke={FIELD_COLOR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
        ))}
        <path d="M 8 58 A 42 16 0 0 0 92 58" fill="none" stroke={RING_COLOR} strokeWidth={5} />
    </svg>
)
const FluxCard = ({ children, label, color, delay }: { children: React.ReactNode; label: string; color: string; delay: number }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16, delay }}
        className="flex flex-col items-center gap-1 rounded-xl border-2 p-1.5"
        style={{ borderColor: hexToRgba(color, 0.6), backgroundColor: hexToRgba(color, 0.08) }}
    >
        {children}
        <span className="text-lg font-black" style={{ color }}>{label}</span>
    </motion.div>
)
const FluxSign = ({ children, delay }: { children: React.ReactNode; delay: number }) => (
    <motion.span initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay }} className="text-3xl font-black text-[#F2F7FB]">
        {children}
    </motion.span>
)
const FluxSimpleScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Теперь введём ' }, { sticker: 'поток', color: FLUX_COLOR }, { text: ' магнитного поля — буква ' }, { sticker: 'Φ', color: FLUX_COLOR }, { text: '.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 2600)}>
                    <div className="w-full flex items-center justify-center gap-1.5 py-2">
                        <FluxCard label="B" color={FIELD_COLOR} delay={0.2}><FluxMiniField /></FluxCard>
                        <FluxSign delay={0.8}>×</FluxSign>
                        <FluxCard label="S" color={RING_COLOR} delay={1.2}><FluxMiniRing /></FluxCard>
                        <FluxSign delay={1.8}>=</FluxSign>
                        <FluxCard label="Φ" color={FLUX_COLOR} delay={2.2}><FluxMiniPhi /></FluxCard>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Поток — это сколько поля ' }, { sticker: 'B', color: FIELD_COLOR }, { text: ' проходит сквозь кольцо площадью ' }, { sticker: 'S', color: RING_COLOR }, { text: '.' }]}
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Чтобы найти поток — перемножь: ' }, { sticker: 'Φ = B · S', color: FLUX_COLOR }]}
                    onSettled={() => setPhase(4)}
                />
            )}
            {phase >= 4 && (
                <TypedLineWithParts
                    parts={[{ text: 'Поток ' }, { sticker: 'Φ', color: FLUX_COLOR }, { text: ' измеряется в ' }, { sticker: 'Вб', color: FLUX_COLOR }, { text: ' (Веберах).' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Шаг 1 — магнит с полем сразу → пауза (дожидаясь конца draw-in силовых
// линий) → текст про поле B → пауза → текст про единицу измерения.
const Step1Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase(1), FIELD_LINES_SETTLE_MS + CONCEPT_PAUSE_MS)}>
                <MagnetIntroDiagram withField />
            </DiagramBlock>
            {phase >= 1 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Магнит создаёт вокруг себя ' },
                        { sticker: 'магнитное поле', color: FIELD_COLOR },
                        { text: ' — обозначается буквой ' },
                        { sticker: 'B', color: FIELD_COLOR },
                        { text: '.' },
                    ]}
                    onSettled={() => setTimeout(() => setPhase(2), CONCEPT_PAUSE_MS)}
                />
            )}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Магнитное поле измеряется в ' },
                        { sticker: 'Тесла (Тл)', color: FIELD_COLOR },
                        { text: '.' },
                    ]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Полюса — ОДНА сцена, магнит не перерисовывается: сначала подсвечен N,
// потом он гаснет и подсвечивается S. Текст — сразу, без паузы.
// Картинка-ассоциация (стикер с белой обводкой, public/lesson-pics/*).
const MnemonicPic = ({ src, alt }: { src: string; alt: string }) => (
    <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 0, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="mx-auto h-32 w-32 md:h-36 md:w-36"
    />
)

const PolesScene = ({ onSettled }: { onSettled?: () => void }) => {
    // 0 N-текст, 1 фраза про компас, 2 картинка компаса, 3 S-текст, 4 картинка South Park
    const [phase, setPhase] = useState(0)
    return (
        <>
            <DiagramBlock>
                <MagnetPoleDiagram highlight={phase >= 3 ? 'S' : 'N'} />
            </DiagramBlock>
            <TypedLineWithParts
                parts={[
                    { text: 'У магнита есть ' }, { sticker: 'северный', color: NORTH_COLOR }, { text: ' полюс ' },
                    { sticker: 'N', color: NORTH_COLOR }, { text: ' — от английского North (Норт), «север».' },
                ]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <TypedLine
                    text="Красная стрелка компаса всегда смотрит на север — поэтому N красный 🧭"
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                    onSettled={() => { setPhase(2); setTimeout(() => setPhase(3), 1400) }}
                />
            )}
            {phase >= 2 && <MnemonicPic src="/lesson-pics/compass.webp" alt="Компас: красная стрелка смотрит на N" />}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'И ' }, { sticker: 'южный', color: SOUTH_COLOR }, { text: ' полюс ' },
                        { sticker: 'S', color: SOUTH_COLOR }, { text: ' — от South (Саус), «юг». Как в «South Park» 😄' },
                    ]}
                    onSettled={() => { setPhase(4); setTimeout(() => onSettled?.(), 900) }}
                />
            )}
            {phase >= 4 && <MnemonicPic src="/lesson-pics/southpark.webp" alt="South Park" />}
        </>
    )
}

// Шаг 4 — баннер "ЗАПОМНИ!" (Лотти) сразу → пауза → текст про направление
// N→S → пауза → схема "распиленного" магнита с бегущей стрелкой.
const Step4Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase(1), CONCEPT_PAUSE_MS)}>
                <DirectionRememberBanner />
            </DiagramBlock>
            {phase >= 1 && (
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
                    onSettled={() => setTimeout(() => setPhase(2), CONCEPT_PAUSE_MS)}
                />
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={onSettled}>
                    <DirectionDiagram />
                </DiagramBlock>
            )}
        </>
    )
}

// Шаг 7 — риски-диаграмма (все объекты: магнит, риски, кольцо, стрелочки
// поля) сразу → пауза → текст. "Дальше" остаётся гейтиться РЕАЛЬНЫМ
// взаимодействием пользователя с риской (DistanceScene.onSettled,
// см. её определение выше) — НЕЗАВИСИМО от таймера текста: onReady
// приходит из DistanceScene по клику, не по паузе.
const Step7Scene = ({ onReady }: { onReady: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setTextVisible(true), CONCEPT_PAUSE_MS)}>
                <DistanceScene onSettled={onReady} />
            </DiagramBlock>
            {textVisible && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Придвинь магнит к кольцу — заметь,' },
                        { break: true },
                        { text: 'чем ' },
                        { bold: 'БЛИЖЕ' },
                        { text: ' магнит к кольцу, тем ' },
                        { bold: 'БОЛЬШЕ' },
                        { break: true },
                        { text: 'магнитное поле ' },
                        { sticker: 'B', color: FIELD_COLOR },
                        { text: '.' },
                    ]}
                />
            )}
        </>
    )
}

// ===================================================================
// Интерактивные сцены (2026-09-26, по просьбе пользователя «сделай урок
// интереснее, как окружность»): нажми на магнит → подпиши полюса →
// выбери кольцо → растяни кольцо → сделай поток Φ максимальным.
// ===================================================================

const shuffleArr = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
const TAP_HINT = GGEGE_PALETTE.orange.button

// Шаг 0 — «Нажми на магнит»: к нему прилетают «железные» игровые
// предметы-стикеры (public/magnet-items/*.webp — вырезаны из картинок
// пользователя через Apple Vision, белая контурная обводка). Картинки
// взяты из игр/фильма — при желании заменить своими рисунками с теми же
// именами файлов.
const TAP_ITEM = 58
const TAP_ITEMS = [
    { src: '/magnet-items/ironman.webp', from: { x: 92, y: 172, r: -20 }, to: { x: 150, y: 214, r: -12 } },
    { src: '/magnet-items/sword.webp', from: { x: 272, y: 168, r: 25 }, to: { x: 210, y: 214, r: 10 } },
    { src: '/magnet-items/robot.webp', from: { x: 84, y: 318, r: 15 }, to: { x: 150, y: 268, r: 8 } },
    { src: '/magnet-items/rifle.webp', from: { x: 280, y: 322, r: -15 }, to: { x: 210, y: 268, r: -8 } },
]
const MagnetTapScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 текст, 1 ждём нажатия, 2 шарики прилетели
    return (
        <>
            <TypedLineWithParts parts={[{ text: 'Смотри — это ' }, { sticker: 'магнит', color: FIELD_COLOR }, { text: '. Нажми на него!' }]} onSettled={() => setPhase(1)} />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="flex w-full justify-center py-2">
                        <svg viewBox="50 130 260 230" className="h-[270px] w-[305px]">
                            <motion.g
                                style={{ cursor: phase === 1 ? 'pointer' : 'default' }}
                                onClick={() => {
                                    if (phase !== 1) return
                                    playSound('/click6.wav')
                                    setPhase(2)
                                    setTimeout(() => onSettled?.(), 1600)
                                }}
                                animate={phase >= 2 ? { rotate: [0, -6, 6, -3, 0] } : { rotate: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {phase === 1 && (
                                    <motion.rect x={MAG_CX - MAG_W / 2 - 10} y={MAG_TOP - 10} width={MAG_W + 20} height={MAG_H + 20} rx={12}
                                        fill="none" stroke={TAP_HINT} strokeWidth={3}
                                        animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }} />
                                )}
                                <MagnetShape x={MAG_CX} top={MAG_TOP} />
                            </motion.g>
                            {TAP_ITEMS.map((it, i) => (
                                <motion.g
                                    key={it.src}
                                    initial={{ x: it.from.x, y: it.from.y, rotate: it.from.r }}
                                    animate={phase >= 2
                                        ? { x: it.to.x, y: it.to.y, rotate: it.to.r }
                                        : { x: it.from.x, y: [it.from.y, it.from.y - 5, it.from.y], rotate: it.from.r }}
                                    transition={phase >= 2
                                        ? { delay: 0.15 * i, duration: 0.45, ease: [0.55, 0, 1, 0.45] }
                                        : { y: { duration: 1.6 + i * 0.2, repeat: Infinity, ease: 'easeInOut' } }}
                                >
                                    <image href={it.src} x={-TAP_ITEM / 2} y={-TAP_ITEM / 2} width={TAP_ITEM} height={TAP_ITEM} />
                                </motion.g>
                            ))}
                        </svg>
                    </div>
                    {phase === 1 && <p className="text-center text-sm font-bold" style={{ color: TAP_HINT }}>👆 нажми на магнит</p>}
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLine
                    text="Бум! Всё железное само прилипло — даже Железный человек 😄 Значит, вокруг магнита есть что-то невидимое…"
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                />
            )}
        </>
    )
}

// Игра «Подпиши полюса сам»: подсвечена половина магнита — выбери N или S.
type Pole = 'N' | 'S'
const PoleGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [ready, setReady] = useState(false)
    const [order] = useState<Pole[]>(() => shuffleArr<Pole>(['N', 'S']))
    const [chips] = useState<Pole[]>(() => shuffleArr<Pole>(['N', 'S']))
    // Магнит может быть перевёрнут — N не «всегда снизу», узнаём по цвету.
    const [nTop] = useState(() => Math.random() < 0.5)
    const [filled, setFilled] = useState(0)
    const [wrong, setWrong] = useState<Pole | null>(null)
    const done = filled >= 2
    const cur = done ? null : order[filled]
    const labeled = (p: Pole) => order.slice(0, filled).includes(p)
    useEffect(() => {
        if (!wrong) return
        const t = setTimeout(() => setWrong(null), 700)
        return () => clearTimeout(t)
    }, [wrong])
    const tap = (p: Pole) => {
        if (done) return
        playSound('/click6.wav')
        if (p === cur) {
            setFilled(filled + 1)
            setWrong(null)
            if (filled + 1 >= 2) setTimeout(() => onSettled?.(), 1100)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrong(p)
        }
    }
    const half = (p: Pole) => {
        const onTop = (p === 'N') === nTop
        const y = onTop ? MAG_TOP : MAG_TOP + MAG_H / 2
        const col = p === 'N' ? NORTH_COLOR : SOUTH_COLOR
        const isCur = cur === p
        const glow = isCur ? (wrong ? WRONG_COLOR : '#F2F7FB') : null
        return (
            <g key={p}>
                <rect x={MAG_CX - MAG_W / 2} y={y} width={MAG_W} height={MAG_H / 2} rx={5} fill={col} />
                {glow && (
                    <motion.rect x={MAG_CX - MAG_W / 2 - 4} y={y - 4} width={MAG_W + 8} height={MAG_H / 2 + 8} rx={8}
                        fill="none" stroke={glow} strokeWidth={3}
                        animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.1, repeat: Infinity }} />
                )}
                <text x={MAG_CX} y={y + 22} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">
                    {labeled(p) ? p : isCur ? '?' : ''}
                </text>
            </g>
        )
    }
    return (
        <>
            <TypedLine text="Подпиши полюса сам!" className="w-full text-center text-xl md:text-2xl font-black text-[#F2F7FB]" onSettled={() => setReady(true)} delayAfter={200} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <p className="text-sm text-[#9AA7B0] text-center">{done ? ' ' : 'Какая буква у выделенного полюса? Подсказка — цвет!'}</p>
                        <svg viewBox="110 170 140 140" className="h-[200px] w-[200px]">
                            {half('S')}
                            {half('N')}
                            {nTop && <text x={MAG_CX} y={MAG_TOP + MAG_H + 26} textAnchor="middle" fontSize={11} fill="#9AA7B0">(магнит перевернули)</text>}
                        </svg>
                        {!done ? (
                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                {chips.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => tap(p)}
                                        disabled={labeled(p)}
                                        className={cn(
                                            'min-h-[64px] rounded-xl border-2 text-2xl font-black transition-[opacity,border-color,background-color] duration-200',
                                            labeled(p) && 'opacity-0 pointer-events-none',
                                            wrong === p ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] hover:border-[#4A90D9]',
                                        )}
                                        style={wrong === p ? undefined : { color: p === 'N' ? NORTH_COLOR : SOUTH_COLOR }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-lg font-black text-[#A1D151]">Красный — N, синий — S. Ты гений 🧠</p>
                        )}
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// «Какое кольцо подойдёт?» — дерево / резина / металл.
type RingKind = 'wood' | 'rubber' | 'metal'
const RING_KINDS: Record<RingKind, { title: string; color: string; wrong?: string }> = {
    wood: { title: 'деревянное', color: '#A0703F', wrong: 'Дерево не проводит ток! Зато из него классные табуретки 🪑' },
    rubber: { title: 'резиновое', color: '#6B7079', wrong: 'Резина не проводит ток — она для мячиков и калош 🏀' },
    metal: { title: 'металлическое', color: RING_COLOR },
}
const RingChoiceScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [kinds] = useState<RingKind[]>(() => shuffleArr<RingKind>(['wood', 'rubber', 'metal']))
    const [wrongTried, setWrongTried] = useState<RingKind[]>([])
    const [msg, setMsg] = useState<string | null>(null)
    const [picked, setPicked] = useState(false)
    const pick = (k: RingKind) => {
        if (picked || wrongTried.includes(k)) return
        playSound('/click6.wav')
        if (k === 'metal') {
            setPicked(true)
            setMsg(null)
            setTimeout(() => setPhase(2), 900)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrongTried((w) => [...w, k])
            setMsg(RING_KINDS[k].wrong!)
        }
    }
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Для опыта нужно ' }, { sticker: 'кольцо', color: RING_COLOR }, { text: '. Какое подойдёт?' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="grid grid-cols-3 gap-2 w-full">
                            {kinds.map((k) => {
                                const isWrong = wrongTried.includes(k)
                                const isRight = picked && k === 'metal'
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => pick(k)}
                                        disabled={isWrong || picked}
                                        className={cn(
                                            'flex flex-col items-center gap-1 rounded-xl border-2 py-3 font-bold text-sm transition-colors',
                                            isRight ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                                : isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                    : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                        )}
                                    >
                                        <svg viewBox="0 0 80 40" className="w-20 h-10">
                                            <ellipse cx={40} cy={20} rx={32} ry={12} fill="none" stroke={RING_KINDS[k].color} strokeWidth={7} />
                                            {k === 'metal' && <ellipse cx={40} cy={20} rx={32} ry={12} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="10 60" />}
                                        </svg>
                                        {RING_KINDS[k].title}
                                    </button>
                                )
                            })}
                        </div>
                        {msg && <div className="rounded-xl px-4 py-2 font-bold bg-[#DC605B22] text-[#DC605B]">{msg}</div>}
                    </div>
                    {picked && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLine
                    text="Верно! Металл проводит электричество — это нам и нужно."
                    className="w-full text-center text-base md:text-lg font-extrabold text-[#F2F7FB]"
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// «Растяни кольцо» — площадь S растёт.
const RING_SIZES = [0.45, 0.72, 1]
const RING_SIZE_NAMES = ['маленькая', 'средняя', 'большая']
const RingSizeScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [size, setSize] = useState(0)
    const [maxed, setMaxed] = useState(false)
    const change = (d: number) => {
        const n = Math.max(0, Math.min(RING_SIZES.length - 1, size + d))
        if (n === size) return
        playSound('/click6.wav')
        setSize(n)
        if (n === RING_SIZES.length - 1 && !maxed) {
            setMaxed(true)
            setTimeout(() => setPhase(3), 900)
        }
    }
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'У кольца самое главное — его площадь ' }, { sticker: 'S', color: RING_COLOR }, { text: '.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <TypedLine text="Растяни кольцо до самого большого!" className="w-full text-center text-base md:text-lg font-extrabold text-[#F2F7FB]" onSettled={() => setPhase(2)} delayAfter={200} />
            )}
            {phase >= 2 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <svg viewBox={`0 0 ${RING_INTRO_W} ${RING_INTRO_H}`} className="h-[170px] w-[276px]">
                            <motion.g animate={{ scale: RING_SIZES[size] }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
                                <TealRing cx={RING_INTRO_CX} cy={RING_INTRO_CY} rx={RING_INTRO_RX} ry={RING_INTRO_RY} hatched uid="size" sScaleY={0.5} />
                            </motion.g>
                        </svg>
                        <p className="text-lg font-black" style={{ color: RING_COLOR }}>S — {RING_SIZE_NAMES[size]}</p>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                            {[-1, 1].map((d) => {
                                const disabled = d < 0 ? size === 0 : size === RING_SIZES.length - 1
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => change(d)}
                                        disabled={disabled}
                                        className={cn(
                                            'min-h-[56px] rounded-xl border-2 text-lg font-black transition-opacity',
                                            disabled && 'opacity-40',
                                            d > 0 && !maxed && 'animate-pulse',
                                        )}
                                        style={{ borderColor: RING_COLOR, backgroundColor: hexToRgba(RING_COLOR, 0.14), color: RING_COLOR }}
                                    >
                                        {d < 0 ? '− меньше' : '+ больше'}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Чем больше кольцо — тем ' }, { bold: 'БОЛЬШЕ' }, { text: ' площадь ' }, { sticker: 'S', color: RING_COLOR }, { text: '.' }]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Финал: «Сделай поток Φ максимальным» — магнит близко/далеко, кольцо
// маленькое/большое. Поле — сетка стрелок (плотность = B), через кольцо
// проходят только те, что внутри эллипса (= поток Φ = B·S).
const FG_W = 260
const FG_RING_CY = 212
const FG_RINGS = [{ rx: 52, ry: 15 }, { rx: 78, ry: 22 }, { rx: 102, ry: 28 }]
const FG_COLS = Array.from({ length: 11 }, (_, i) => -110 + i * 22)
const FG_ROWS = [-14, 0, 14]
const FG_MAG_TOPS = [16, 56, 96] // далеко / средне / близко
// Плотность поля: какие столбцы стрелок есть при каждом положении магнита.
const fgColumnExists = (mag: number, c: number) => (mag === 2 ? true : mag === 1 ? c % 2 === 0 : c % 4 === 0)
const FluxGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    const [mag, setMag] = useState(0)
    const [ringIdx, setRingIdx] = useState(0)
    const [won, setWon] = useState(false)
    const ring = FG_RINGS[ringIdx]
    const arrows = FG_ROWS.flatMap((dy, r) => FG_COLS.map((x, c) => {
        const xs = x + (r % 2 ? 11 : 0)
        const exists = fgColumnExists(mag, c)
        const inside = (xs / ring.rx) ** 2 + (dy / ring.ry) ** 2 <= 1
        return { key: `${r}-${c}`, x: FG_W / 2 + xs, y: FG_RING_CY + dy, exists, inside }
    })).filter((a) => a.x > 8 && a.x < FG_W - 8)
    const count = arrows.filter((a) => a.exists && a.inside).length
    const maxCount = FG_ROWS.flatMap((dy, r) => FG_COLS.map((x) => x + (r % 2 ? 11 : 0))
        .filter((xs) => (xs / FG_RINGS[2].rx) ** 2 + (dy / FG_RINGS[2].ry) ** 2 <= 1)).length
    useEffect(() => {
        if (mag === 2 && ringIdx === 2) setWon(true)
    }, [mag, ringIdx])
    useEffect(() => {
        if (!won) return
        const t = setTimeout(() => setPhase(3), 1200)
        return () => clearTimeout(t)
    }, [won])
    const toggle = (kind: 'mag' | 'ring', v: number) => {
        if (won) return
        playSound('/click6.wav')
        if (kind === 'mag') setMag(v)
        else setRingIdx(v)
    }
    const Seg = ({ label, value, options, onPick, color }: { label: string; value: number; options: string[]; onPick: (v: number) => void; color: string }) => (
        <div className="flex flex-col gap-1 w-full">
            <span className="text-xs font-bold text-[#9AA7B0] text-center">{label}</span>
            <div className="grid grid-cols-3 gap-1.5">
                {options.map((o, i) => {
                    const on = value === i
                    return (
                        <button
                            key={o}
                            type="button"
                            onClick={() => onPick(i)}
                            className="rounded-lg border-2 py-2 text-sm font-black transition-colors"
                            style={{ borderColor: on ? color : '#3A464E', backgroundColor: on ? hexToRgba(color, 0.2) : '#161F23', color: on ? color : '#9AA7B0' }}
                        >
                            {o}
                        </button>
                    )
                })}
            </div>
        </div>
    )
    return (
        <>
            <TypedLineWithParts
                parts={[{ text: 'Финал! Сделай поток ' }, { sticker: 'Φ', color: FLUX_COLOR }, { text: ' МАКСИМАЛЬНЫМ.' }]}
                onSettled={() => setPhase(1)}
            />
            {phase >= 1 && (
                <TypedLine text="Двигай магнит и меняй кольцо — считай стрелки, которые проходят сквозь него." className="w-full text-center text-base text-[#F2F7FB]" onSettled={() => setPhase(2)} delayAfter={200} />
            )}
            {phase >= 2 && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-3">
                        <svg viewBox={`0 0 ${FG_W} 250`} className="h-[250px] w-[260px]">
                            <motion.g animate={{ y: FG_MAG_TOPS[mag] }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} style={{ x: FG_W / 2 - DIST_MAG_W / 2 }}>
                                {/* Бледные силовые линии магнита (как в сцене про поле B) — фон, яркие только стрелки, которые считаем. */}
                                <g opacity={0.28} transform={`translate(${DIST_MAG_W / 2},${DIST_MAG_H / 2}) scale(0.75) translate(${-MAG_CX},${-(MAG_TOP + MAG_H / 2)})`}>
                                    <MagnetFieldLines x={MAG_CX} top={MAG_TOP} color={FIELD_COLOR} />
                                </g>
                                <rect width={DIST_MAG_W} height={DIST_MAG_H / 2} rx={5} fill={SOUTH_COLOR} />
                                <rect y={DIST_MAG_H / 2} width={DIST_MAG_W} height={DIST_MAG_H / 2} rx={5} fill={NORTH_COLOR} />
                                <text x={DIST_MAG_W / 2} y={DIST_MAG_H / 4 + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">S</text>
                                <text x={DIST_MAG_W / 2} y={DIST_MAG_H * 0.75 + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">N</text>
                            </motion.g>
                            <motion.ellipse cx={FG_W / 2} cy={FG_RING_CY} fill={hexToRgba(RING_COLOR, 0.1)} stroke={RING_COLOR} strokeWidth={5}
                                animate={{ rx: ring.rx, ry: ring.ry }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} />
                            {arrows.map((a) => {
                                const len = 30
                                const color = a.inside ? FIELD_COLOR : '#5C6B73'
                                return (
                                    <motion.g key={a.key} animate={{ opacity: a.exists ? (a.inside ? 1 : 0.35) : 0 }} transition={{ duration: 0.35 }}>
                                        <line x1={a.x} y1={a.y - len} x2={a.x} y2={a.y} stroke={color} strokeWidth={2.8} strokeLinecap="round" />
                                        <path d={`M${a.x - 4},${a.y - 8} L${a.x},${a.y} L${a.x + 4},${a.y - 8}`} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                                    </motion.g>
                                )
                            })}
                        </svg>
                        <div className="w-full max-w-xs flex flex-col gap-1">
                            <div className="flex items-center justify-between text-sm font-black">
                                <span style={{ color: FLUX_COLOR }}>Поток Φ</span>
                                <span style={{ color: FLUX_COLOR }}>{count} {declensionRu(count, 'стрелка', 'стрелки', 'стрелок')}</span>
                            </div>
                            <div className="h-4 w-full rounded-full bg-[#232F34] overflow-hidden">
                                <motion.div className="h-full rounded-full" style={{ backgroundColor: FLUX_COLOR }}
                                    animate={{ width: `${Math.round((count / maxCount) * 100)}%` }} transition={{ duration: 0.45 }} />
                            </div>
                        </div>
                        <div className="w-full max-w-xs flex flex-col gap-2">
                            <Seg label="Магнит (поле B)" value={mag} options={['далеко', 'средне', 'близко']} onPick={(v) => toggle('mag', v)} color={FIELD_COLOR} />
                            <Seg label="Кольцо (площадь S)" value={ringIdx} options={['маленькое', 'среднее', 'большое']} onPick={(v) => toggle('ring', v)} color={RING_COLOR} />
                        </div>
                        {won && <p className="text-lg font-black text-[#A1D151] text-center">Максимум! 🔥 Ты повелитель магнитов 🧲</p>}
                    </div>
                    {won && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Больше ' }, { sticker: 'B', color: FIELD_COLOR }, { text: ' и больше ' }, { sticker: 'S', color: RING_COLOR },
                        { text: ' — больше поток: ' }, { sticker: 'Φ = B · S', color: FLUX_COLOR },
                    ]}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

const DistanceStep = ({ onSettled }: { onSettled?: () => void }) => <Step7Scene onReady={() => onSettled?.()} />

const CONCEPT_SCENES = [
    MagnetTapScene, Step1Scene, PolesScene, PoleGameScene, Step4Scene,
    RingChoiceScene, RingSizeScene, DistanceStep, FluxSimpleScene, FluxGameScene,
]

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
// ФАЗА "quiz" — короткая проверка понимания СРАЗУ после знакомства с
// объектами (ConceptPhase), ДО практической песочницы (HandsPhase) — по
// прямой просьбе пользователя, тот же формат "1/N, 2/N..." + огненная
// Lottie-анимация на каждом 4-м задании, что уже устоялся в разборах
// логарифмов (LOGCOMBOWALK/LOGDIVWALK и др., см. CLAUDE.md) —
// переиспользует ТЕ ЖЕ хелперы (SceneWrapper/useSceneFocus/
// useReplayNonces/BackButton/ReplayButton/isFieryMilestoneTrial/
// FieryFeedbackBanner/pickWrongTryPhrase/pickWalkthroughNextLabel), уже
// импортированные в начало этого файла.
//
// Вопросы — ФИКСИРОВАННЫЙ набор (в отличие от LOGCOMBOWALK, который
// генерирует новые случайные числа на каждую попытку) — это прямая
// проверка того, что только что рассказано в ConceptPhase (цвет N,
// направление B, единицы B/Φ, формула Φ), а не тренировка на новых
// данных, поэтому набор один и тот же при каждом прохождении.
// ===================================================================

type ConceptQuizItem = {
    renderPrompt: () => React.ReactNode
    renderOptions: () => React.ReactNode[]
    correct: number
    feedback: string
}

const CONCEPT_QUIZ: ConceptQuizItem[] = [
    {
        renderPrompt: () => <>Буква <Sticker value="N" color={NORTH_COLOR} /> — это</>,
        renderOptions: () => ['Северный полюс', 'Южный полюс'],
        correct: 0,
        feedback: 'N — это северный полюс, красный стикер.',
    },
    {
        renderPrompt: () => <>Линии поля <Sticker value="B" color={FIELD_COLOR} /> направлены</>,
        renderOptions: () => [
            <span key="ns" className="inline-flex items-center gap-1.5">от <Sticker value="N" color={NORTH_COLOR} /> к <Sticker value="S" color={SOUTH_COLOR} /></span>,
            <span key="sn" className="inline-flex items-center gap-1.5">от <Sticker value="S" color={SOUTH_COLOR} /> к <Sticker value="N" color={NORTH_COLOR} /></span>,
        ],
        correct: 0,
        feedback: 'Линии магнитного поля всегда идут от N к S.',
    },
    {
        renderPrompt: () => <><Sticker value="B" color={FIELD_COLOR} /> измеряется в</>,
        renderOptions: () => ['Тесла', 'Вебер'],
        correct: 0,
        feedback: 'B измеряется в Тесла (Тл).',
    },
    {
        renderPrompt: () => <><Sticker value="Φ" color={FLUX_COLOR} /> измеряется в</>,
        renderOptions: () => ['Тесла', 'Вебер'],
        correct: 1,
        feedback: 'Φ (поток) измеряется в Веберах (Вб).',
    },
    {
        renderPrompt: () => <>Какое <Sticker value="кольцо" color={RING_COLOR} /> подойдёт для опыта?</>,
        renderOptions: () => ['Деревянное', 'Металлическое'],
        correct: 1,
        feedback: 'Металл проводит электричество — дерево нет.',
    },
    {
        renderPrompt: () => <><Sticker value="Φ" color={FLUX_COLOR} /> = </>,
        renderOptions: () => ['B · S', 'B : S'],
        correct: 0,
        feedback: 'Поток Φ = B · S — умножение, не деление.',
    },
    {
        // Бонус — для хорошего настроения: единственный вариант ответа.
        renderPrompt: () => <>Бонус! Кто молодец? 😎</>,
        renderOptions: () => ['Я молодец! 🎉'],
        correct: 0,
        feedback: 'Конечно ты! Закон Фарадея покорён 🏆',
    },
]

// Зумерская похвала при верном ответе — та же общая CORRECT_FEEDBACK_
// PHRASES, что уже используется ВЕЗДЕ в степбайстеп-разборах (по прямой
// просьбе пользователя — раньше здесь показывался только сухой
// разъясняющий текст qq.feedback, без неё). Детерминированный выбор по
// индексу вопроса (не Math.random() внутри рендера — тот перевыбирал бы
// новую фразу на каждый посторонний ре-рендер, пока фидбек уже показан)
// — тот же принцип, что и у pickTrialFeedback в LOGCOMBOWALK: набор
// вопросов здесь фиксирован (не генерируется заново), поэтому простого
// mod по индексу достаточно для стабильного результата.
const pickQuizFeedbackPhrase = (i: number): string =>
    CORRECT_FEEDBACK_PHRASES[i % CORRECT_FEEDBACK_PHRASES.length]

const CONCEPT_QUIZ_TITLE = 'Проверим себя'

// Кнопка-вариант — та же псевдо-3D-рамка/палитра, что и у MiniAnswerButton
// в LOGCOMBOWALK/LOGDIVWALK, но принимает произвольный ReactNode (не
// только "формулу"), т.к. варианты здесь — короткие фразы и мини-строки
// со стикерами N/S.
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
    // "Пробуй, пока не угадаешь" — тот же режим, что и у всех остальных
    // *WALK-тренировок: неверно нажатый вариант красится красным и
    // блокируется, остальные остаются кликабельны.
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [hadMistake, setHadMistake] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `q-${trialIndex}`
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, checked)
    // Back ограничен ЭТОЙ фазой (не переходит обратно в ConceptPhase) —
    // это два самостоятельных top-level шага state-машины TypeFaradayWalk
    // (см. ниже), не одна общая цепочка сцен, как в LOGCOMBOWALK, где
    // intro/practice — части ОДНОГО компонента с общим списком сцен.
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

export const TypeFaradayWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'concept' | 'quiz'>('concept')
    const finishedRef = useRef(false)

    // По прямой просьбе пользователя (2026-09-22) — старая фаза 'hands'
    // (интерактивная песочница: 4 авто-программы + формула ε=-ΔΦ/Δt +
    // "своя очередь" + финальный числовой квиз про расчёт ЭДС) убрана
    // ЦЕЛИКОМ — новые сцены ConceptPhase (детальное знакомство) и
    // ConceptQuizPhase (проверка понимания) уже покрывают материал
    // подробнее и нагляднее, а старая песочница дублировала его же более
    // грубым способом. Вместе с фазой удалены ВСЕ её приватные
    // зависимости, ставшие мёртвым кодом (Sandbox/HandsPhase/QuizPart/
    // QUIZ/STAGE_TEXT/PROFILES и связанные геометрические константы) —
    // не оставлены как "неиспользуемый, но рабочий" код (см. другие
    // прецеденты в CLAUDE.md), т.к. это сотни строк, которые иначе
    // гарантированно завалили бы eslint no-unused-vars.
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
