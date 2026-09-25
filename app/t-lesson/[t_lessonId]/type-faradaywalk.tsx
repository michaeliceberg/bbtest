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
const DIST_RING_CY = 350
const DIST_RING_RX = 90
const DIST_RING_RY = 24
const DIST_VISIBLE_HALF = [0, 2, 4] // далеко/средне/близко — порог "дистанции" точки от центра сетки (см. ниже)
const DIST_LABEL_GAP = 22

// ===== Стрелочки поля — не одна плоская строка, а сетка ТОЧЕК ВНУТРИ
// самого эллипса кольца, по прямой просьбе пользователя ("не плоско, а
// трёхмерно по площади кольца"). 3 "ряда" по высоте эллипса (дальний
// край/экватор/ближний край — dy от центра кольца) + по 3 точки в каждом
// ряду по ширине, ограниченной формулой эллипса НА ЭТОЙ высоте
// (x²/rx²+y²/ry²=1 → на высоте dy доступная полуширина = rx·√(1−(dy/ry)²))
// — поэтому крайние (не средний) ряды физически УЖЕ, как и положено
// сечению эллипса не по экватору. Длина стрелки тоже растёт от дальнего
// ряда к ближнему (18→24→30) — простой, но узнаваемый намёк на
// перспективу (дальнее — короче/меньше, ближнее — длиннее/крупнее), тот
// же принцип, что уже даёт сжатие самого эллипса кольца по Ry.
const DIST_ARROW_ROW_DY = [-14, 0, 14]
const DIST_ARROW_ROW_LEN = [26, 34, 42]
const DIST_ARROW_STROKE_WIDTH = 3.2
// Раньше все 3 ряда использовали ОДИН И ТОТ ЖЕ набор долей ширины
// (cf=[-0.55,0,0.55]) — из-за этого центральная колонка (cf=0) ВСЕГДА
// давала x=0 независимо от ряда (0×что-угодно=0), и три "центральные"
// стрелки трёх рядов физически стояли на одной вертикальной линии,
// сливаясь визуально в одну — та самая жалоба пользователя ("три
// стрелки на одной вертикальной линии"/"много стрелочек по одной
// линии"). Исправлено — у КАЖДОГО ряда своя, намеренно НЕ симметричная
// тройка долей (не просто зеркальное -0.55/0/0.55) — ни один x не
// повторяется ни в одном другом ряду ни при какой комбинации рядов, то
// есть НИКАКАЯ пара точек сетки не может визуально слиться в одну
// линию, при этом сама 3×3-структура (и её "дистанция от центра" для
// логики видимости риски) не меняется — только фактические x-координаты.
const DIST_ARROW_ROW_COLS = [
    [-0.62, 0.06, 0.68],
    [-0.7, -0.1, 0.52],
    [-0.42, 0.22, 0.7],
]

type DistArrowPoint = { x: number; yBase: number; len: number; dist: number }

// "Дистанция" точки от центра сетки — 0 у самой центральной (видна
// первой, риска "далеко"), 2 у 4 соседей "крестом" (риска "средне"
// добавляет их), 4 у 4 угловых (риска "близко" добавляет и их) — та же
// семантика, что и раньше была у линейных офсетов DIST_ARROW_OFFSETS,
// просто обобщённая на 2D-сетку 3×3: сравнение `dist<=visibleHalf`
// работает без изменений (индекс (ri,ci), а не фактический x, задаёт
// группировку — поэтому смена самих x на несимметричные значения выше
// никак не ломает семантику видимости по рискам).
function buildDistArrowGrid(): DistArrowPoint[] {
    const pts: DistArrowPoint[] = []
    DIST_ARROW_ROW_DY.forEach((dy, ri) => {
        const t = dy / DIST_RING_RY
        const rowHalfWidth = DIST_RING_RX * Math.sqrt(Math.max(0, 1 - t * t))
        DIST_ARROW_ROW_COLS[ri].forEach((cf, ci) => {
            const dist = ri === 1 && ci === 1 ? 0 : ri === 1 || ci === 1 ? 2 : 4
            pts.push({ x: cf * rowHalfWidth, yBase: DIST_RING_CY + dy, len: DIST_ARROW_ROW_LEN[ri], dist })
        })
    })
    return pts
}
const DIST_ARROW_GRID = buildDistArrowGrid()

const DistanceDiagram = ({ selectedIndex, onSelect }: { selectedIndex: number; onSelect: (i: number) => void }) => {
    const magTop = DIST_TICK_Y[selectedIndex] - DIST_MAG_H / 2
    const visibleHalf = DIST_VISIBLE_HALF[selectedIndex]
    // Стикер "B" — всегда рядом с крайней ПРАВОЙ ВИДИМОЙ стрелочкой поля
    // (по прямой просьбе пользователя) — теперь ищем максимум x СРЕДИ
    // ВИДИМЫХ точек сетки (не берём фиксированный индекс, т.к. у 2D-сетки
    // "самая правая видимая" может оказаться в любом из 3 рядов в
    // зависимости от того, сколько точек сейчас показано).
    const visiblePts = DIST_ARROW_GRID.filter((p) => p.dist <= visibleHalf)
    const bLabelX = DIST_TRACK_X + Math.max(...visiblePts.map((p) => p.x)) + DIST_LABEL_GAP
    const bLabelY = DIST_RING_CY - 24
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

                {/* Кольцо — бирюзовое, СО стикером "S" внутри, но БЕЗ
                    штриховки площади (по прямой просьбе пользователя —
                    штриховка визуально сливалась с синими 3D-стрелками
                    поля, которые теперь тоже лежат В ПРЕДЕЛАХ эллипса
                    кольца, см. DIST_ARROW_GRID ниже) — статично, не
                    зависит от выбранной риски. */}
                <TealRing cx={DIST_TRACK_X} cy={DIST_RING_CY} rx={DIST_RING_RX} ry={DIST_RING_RY} showS uid="dist" sScaleY={0.55} />

                {DIST_ARROW_GRID.map((pt, i) => {
                    const visible = pt.dist <= visibleHalf
                    const x = DIST_TRACK_X + pt.x
                    // Стрелка "приземляется" ровно в точку сетки (яркая
                    // часть — шеврон), шахта уходит вверх на её длину —
                    // короче у дальнего ряда, длиннее у ближнего (см.
                    // DIST_ARROW_ROW_LEN) — та же лёгкая перспектива, что
                    // и у самого сжатого по Ry эллипса кольца. Длиннее и
                    // толще (DIST_ARROW_STROKE_WIDTH), чем в первой
                    // версии, — по прямой просьбе пользователя, чтобы
                    // явно выделяться на фоне кольца.
                    // Шахта (line) раньше заканчивалась НЕ в самом острие
                    // (pt.yBase), а чуть выше — в chevronBase, тогда как
                    // "галочка" (шеврон) своими двумя лучами упирается в
                    // ТОЧКУ chevronBase (сверху) слева/справа от центра —
                    // визуально "|" повисал в промежутке между двумя
                    // рожками галочки, не касаясь ни одного из них
                    // (жалоба пользователя "| и v выглядят отдельно").
                    // Исправлено — шахта продлена до pt.yBase (самого
                    // острия), точно совпадающего со средней вершиной
                    // шеврона: оба штриха физически сходятся в ОДНОЙ
                    // точке, скруглённые концы/сочленения (round) там
                    // визуально сливаются в единую стрелку.
                    const chevronBase = pt.yBase - pt.len * 0.26
                    const shaftTop = pt.yBase - pt.len
                    const chevronHalf = 4.6
                    return (
                        <motion.g key={i} animate={{ opacity: visible ? 0.95 : 0 }} transition={{ duration: 0.4 }}>
                            <line x1={x} y1={shaftTop} x2={x} y2={pt.yBase} stroke={FIELD_COLOR} strokeWidth={DIST_ARROW_STROKE_WIDTH} strokeLinecap="round" />
                            <path d={`M${x - chevronHalf},${chevronBase} L${x},${pt.yBase} L${x + chevronHalf},${chevronBase}`} fill="none"
                                stroke={FIELD_COLOR} strokeWidth={DIST_ARROW_STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" />
                        </motion.g>
                    )
                })}
                {/* Стикер "B" — рядом с крайней видимой стрелочкой поля,
                    подстраивается под выбранную риску (см. bLabelX/Y
                    выше). Позиционирующий x/y — на motion.g через x/y
                    framer-motion motion-values (не raw transform-строка),
                    та же безопасная техника, что и у самого магнита ниже. */}
                <motion.g
                    animate={{ x: bLabelX, y: bLabelY }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                    <FieldBLabel x={0} y={0} color={FIELD_COLOR} delay={0.3} solidBg />
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
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#F2F7FB]">
                <span>Магнитное поле</span>
                <Sticker value="B" color={FIELD_COLOR} />
            </div>
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
// СТРОГО последовательно (не всё сразу): интро-текст → пауза →
// "Для этого понадобятся:" → пауза → левая половина → пауза → правая
// половина → пауза → формула → единица измерения. Управляется локальным
// phase (0..5), а не пропом step ConceptPhase — это внутренняя
// хореография ОДНОЙ сцены, верхний уровень (step/stepReady) знает
// только про итоговую готовность.
const FluxScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase !== 3) return
        const t = setTimeout(() => setPhase(4), FLUX_RIGHT_ENTRANCE_MS + FLUX_PAUSE_MS)
        return () => clearTimeout(t)
    }, [phase])

    // Эта сцена — единственная во всём файле, растущая через 6 отдельных
    // внутренних фаз (intro → "для этого понадобятся" → левая половина →
    // правая половина → формула → единица измерения) — а внешний
    // useSceneFocus (ConceptPhase) переcкроллит только ДВАЖДЫ: сразу по
    // входу в шаг (контент ещё почти пуст) и один раз в самом конце
    // (когда stepReady). На узком мобильном экране, где вся сцена целиком
    // выше высоты вьюпорта, этих двух точек мало — контент, дописанный
    // МЕЖДУ ними (диаграммы/формула), рос уже НИЖЕ того места, куда
    // проскроллило по начальному (маленькому) размеру, и ничего не
    // подтягивало эту растущую нижнюю часть в кадр до самого конца — по
    // жалобе пользователя "не влезает в экран телефона, рисуется где-то
    // снизу". Добавлен ЛОКАЛЬНЫЙ, дополнительный докскролл на КАЖДУЮ
    // смену phase — не вместо внешнего механизма, а в ДОПОЛНЕНИЕ к нему:
    // `scrollIntoView({block:'nearest'})` не дёргает вид, если элемент и
    // так виден, и лишь мягко подтягивает НИЖНИЙ (растущий) край в кадр,
    // если он успел уйти за пределы экрана — тот же принцип, что уже
    // используется по всему проекту (см. useSceneFocus), просто чаще.
    const rootRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        rootRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    }, [phase])

    return (
        <div ref={rootRef} className="w-full flex flex-col gap-4">
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
                <TypedLine
                    text="Для этого понадобятся:"
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                    onSettled={() => setTimeout(() => setPhase(2), FLUX_PAUSE_MS)}
                />
            )}
            {phase >= 2 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => Math.max(p, 3)), FLUX_PAUSE_MS)}>
                    <FluxSplitDiagram showRight={phase >= 3} />
                </DiagramBlock>
            )}
            {phase >= 4 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Поток ' },
                        { sticker: 'Φ', color: FLUX_COLOR },
                        { text: ' = ' },
                        { sticker: 'B', color: FIELD_COLOR },
                        { text: ' · ' },
                        { sticker: 'S', color: RING_COLOR },
                        { text: '.' },
                    ]}
                    onSettled={() => setTimeout(() => setPhase(5), FLUX_PAUSE_MS)}
                />
            )}
            {phase >= 5 && (
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
        </div>
    )
}

// ===== Сцены ConceptPhase — по прямой просьбе пользователя (2026-09-23)
// каждая раскрывается СТРОГО последовательно: сначала диаграмма/анимация,
// пауза, потом текст (а не всё разом, как раньше) — тот же принцип,
// уже применённый ко всем *WALK-разборам логарифмов. Длительность паузы
// до/после текста — уже существующий CONCEPT_PAUSE_MS; для сцен, где
// диаграмма сама что-то рисует (не просто fade-in), пауза до текста
// дополнительно ждёт FIELD_LINES_SETTLE_MS/время draw-in кольца — чтобы
// текст появлялся ПОСЛЕ того, как анимация реально дорисовалась, а не
// поверх ещё рисующейся картинки.

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

// Шаги 2/3 — общий компонент (структура идентична, отличаются только
// highlight/подсвечиваемое слово/цвет): диаграмма сразу → пауза (ждём
// draw-in бледных силовых линий) → текст.
const PoleScene = ({
    highlight, leadWord, color, onSettled,
}: { highlight: 'N' | 'S'; leadWord: string; color: string; onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setTextVisible(true), FIELD_LINES_SETTLE_MS + CONCEPT_PAUSE_MS)}>
                <MagnetPoleDiagram highlight={highlight} />
            </DiagramBlock>
            {textVisible && (
                <TypedLineWithParts
                    parts={[
                        { text: highlight === 'N' ? 'У магнита есть ' : 'И ' },
                        { sticker: leadWord, color },
                        { text: ' полюс ' },
                        { sticker: highlight, color },
                        { text: '.' },
                    ]}
                    onSettled={onSettled}
                />
            )}
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

// Шаг 5 — текст "это кольцо" сразу → пауза → рисуем кольцо (draw-in) →
// пауза (ждём завершения draw-in) → пара текстов "Важно.../Чтобы..."
// (печатаются друг за другом, не параллельно).
const Step5Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    return (
        <>
            <TypedLineWithParts
                parts={[
                    { text: 'А это металлическое ' },
                    { sticker: 'кольцо', color: RING_COLOR },
                    { text: '.' },
                ]}
                onSettled={() => setTimeout(() => setPhase(1), CONCEPT_PAUSE_MS)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 800 + CONCEPT_PAUSE_MS)}>
                    <RingIntroDiagram hatched={false} />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <TypedLine
                    text="Важно что оно металлическое!"
                    className="w-full text-center text-base md:text-lg font-extrabold text-[#F2F7FB]"
                    onSettled={() => setPhase(3)}
                />
            )}
            {phase >= 3 && (
                <TypedLine
                    text="Чтобы проводило электричество."
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Шаг 6 — кольцо (заштрихованное, со стикером S) сразу → пауза → текст.
const Step6Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setTextVisible(true), 800 + CONCEPT_PAUSE_MS)}>
                <RingIntroDiagram hatched />
            </DiagramBlock>
            {textVisible && (
                <TypedLineWithParts
                    parts={[
                        { text: 'У кольца самое главное — его площадь ' },
                        { sticker: 'S', color: RING_COLOR },
                        { text: '.' },
                    ]}
                    onSettled={onSettled}
                />
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

                {/* Шаг 1 — магнит с полем → пауза → "магнитное поле B" →
                    пауза → единица измерения (Step1Scene). */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <Step1Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — северный полюс N → пауза → текст (PoleScene). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <PoleScene highlight="N" leadWord="северный" color={NORTH_COLOR} onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — южный полюс S → пауза → текст (PoleScene). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <PoleScene highlight="S" leadWord="южный" color={SOUTH_COLOR} onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — баннер ЗАПОМНИ → пауза → текст N→S → пауза →
                    схема направления (Step4Scene). */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <Step4Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 5 — "это кольцо" → пауза → кольцо → пауза →
                    "Важно.../Чтобы..." (Step5Scene). */}
                {step >= 5 && (
                    <SceneWrapper key="step-5" innerRef={sceneRef('step-5')} active={isSceneActive('step-5')}>
                        <Fragment key={`step-5-${nonceFor('step-5')}`}>
                            <Step5Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 6 — кольцо (площадь S) → пауза → текст (Step6Scene). */}
                {step >= 6 && (
                    <SceneWrapper key="step-6" innerRef={sceneRef('step-6')} active={isSceneActive('step-6')}>
                        <Fragment key={`step-6-${nonceFor('step-6')}`}>
                            <Step6Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 7 — сам потрогай: риски-диаграмма → пауза → текст
                    (Step7Scene). "Дальше" гейтится реальным кликом по
                    риске (DistanceScene.onSettled), не таймером. */}
                {step >= 7 && (
                    <SceneWrapper key="step-7" innerRef={sceneRef('step-7')} active={isSceneActive('step-7')}>
                        <Fragment key={`step-7-${nonceFor('step-7')}`}>
                            <Step7Scene onReady={() => setStepReady(true)} />
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
    renderOptions: () => [React.ReactNode, React.ReactNode]
    correct: 0 | 1
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
        renderPrompt: () => <><Sticker value="Φ" color={FLUX_COLOR} /> = </>,
        renderOptions: () => ['B · S', 'B : S'],
        correct: 0,
        feedback: 'Поток Φ = B · S — умножение, не деление.',
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
