// components/geometry/RightTriangleDiagram.tsx
//
// Анимированный прямоугольный треугольник для интерактивного разбора
// "что такое синус" (тренажёр "Геометрия: Синус, косинус, тангенс") —
// тот же принцип, что и TrapezoidDiagram.tsx (параметризуемый React-
// компонент, реагирует на явные пропы, не статичный SVG-файл), просто
// для другой фигуры и другого урока.
//
// Треугольник хранится в вершинах R (прямой угол) / P / Q (два острых
// угла) — координаты вычисляются из фиксированной "локальной" формы
// поворотом вокруг центроида на rotationDeg (+ опциональное зеркальное
// отражение mirror) — та же идея, что и ZOOM_SCALE/ZOOM_TX/ZOOM_TY в
// TrapezoidDiagram, только тут поворот произвольный, а не один фиксированный
// зум. Т.к. поворот вокруг центроида не меняет расстояние вершина-центроид,
// достаточно один раз посчитать макс. радиус и взять viewBox с запасом —
// треугольник гарантированно не выходит за канвас ни при каком повороте.
//
// Длинные текстовые подписи ("гипотенуза", "противолежащий катет") —
// ТОЛЬКО в обучающих (не повёрнутых, rotationDeg=0) кадрах: подпись
// вдоль произвольно повёрнутой стороны на длинном русском слове рисковала
// бы уехать за край канваса или оказаться нечитаемой "вверх ногами".
// В тренировочных (повёрнутых) кадрах подписывается только короткая "α"
// рядом со своей вершиной — тот же принцип устойчивости к повороту, что
// уже показал себя надёжным для однобуквенных подписей "43"/"73" в
// TrapezoidDiagram.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const BG = '#161F23'
const EDGE = '#F2F7FB'
// Цвета сторон/углов — из «Палитры ggege» (см. CLAUDE.md), по прямой
// просьбе пользователя использовать те же 6 цветов, что и у кнопок
// уроков на /learn, а не изобретать новые hex для каждой диаграммы.
// Прямой угол — оранжевый: под тёплую палитру, не занят другими
// смыслами в этой диаграмме (фиолетовый=гипотенуза, зелёный=катет,
// синий=угол α).
const RIGHT_ANGLE_COLOR = GGEGE_PALETTE.orange.button
// Угол α — ключевой элемент урока, должен бросаться в глаза на тёмном
// фоне — синий из палитры, не занят другими смыслами здесь.
const ALPHA_COLOR = GGEGE_PALETTE.blue.button
export const HYPOTENUSE_COLOR = GGEGE_PALETTE.purple.button // тот же фиолетовый, что HYPOTENUSE_COLOR в TrapezoidDiagram
// Раньше золотой/мигающий — пользователь попросил убрать этот эффект и
// вернуть "противолежащий катет" в тот же формат, что и обычный зелёный
// "катет" (см. LEG_COLOR ниже) — больше нигде не используется, оставлен
// экспортированным на случай будущей потребности в отдельном акценте.
export const OPPOSITE_LEG_COLOR = '#FBBF24'
// Зелёный — общая подпись "катет" на ОБЕИХ сторонах-катетах, а ТЕПЕРЬ и
// подпись "противолежащий катет" (та же самая сторона, просто текст
// сменился) — по прямой просьбе пользователя убрать особый золотой
// мигающий акцент и оставить единый зелёный формат. Экспортируется —
// TypeSinWalk красит тем же цветом текст соответствующей фразы.
export const LEG_COLOR = GGEGE_PALETTE.green.button
// CORRECT_COLOR/WRONG_COLOR — НЕ из палитры ggege намеренно: это тот же
// зелёный/красный, что используется ВЕЗДЕ в тренажёре для верно/неверно
// (отдельная, устоявшаяся семантическая система, см. CLAUDE.md «Палитра
// ggege — что НЕ входит в палитру») — трогать её здесь означало бы
// расходиться с остальным приложением.
const CORRECT_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'
const TEXT = '#F2F7FB'

// Локальная (неповёрнутая) форма — разные длины катетов, чтобы стороны
// визуально не путались друг с другом при взгляде на треугольник.
const LEG_RP = 150 // R→P (горизонтальный катет в локальной системе)
const LEG_RQ = 108 // R→Q (вертикальный катет в локальной системе)
const CANVAS = 420
const CENTER = { x: CANVAS / 2, y: CANVAS / 2 }

type Pt = { x: number; y: number }

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y })
const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k })
const norm = (a: Pt): Pt => {
    const len = Math.sqrt(a.x * a.x + a.y * a.y) || 1
    return { x: a.x / len, y: a.y / len }
}

export type AlphaVertex = 'P' | 'Q'
export type SideId = 'legRP' | 'legRQ' | 'hyp'

// Противолежащий (искомый в этом уроке) катет — сторона, которая НЕ
// касается вершины альфа: для угла при P это R-Q, для угла при Q — R-P.
export const oppositeLegOf = (alphaVertex: AlphaVertex): SideId => (alphaVertex === 'P' ? 'legRQ' : 'legRP')
export const adjacentLegOf = (alphaVertex: AlphaVertex): SideId => (alphaVertex === 'P' ? 'legRP' : 'legRQ')

export const computeTriangle = (rotationDeg: number, mirror: boolean) => {
    const rad = (rotationDeg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const mx = mirror ? -1 : 1

    const localR: Pt = { x: 0, y: 0 }
    const localP: Pt = { x: LEG_RP * mx, y: 0 }
    const localQ: Pt = { x: 0, y: -LEG_RQ }
    const centroid: Pt = { x: (localR.x + localP.x + localQ.x) / 3, y: (localR.y + localP.y + localQ.y) / 3 }

    const place = (pt: Pt): Pt => {
        const d = sub(pt, centroid)
        return { x: CENTER.x + d.x * cos - d.y * sin, y: CENTER.y + d.x * sin + d.y * cos }
    }

    return { R: place(localR), P: place(localP), Q: place(localQ) }
}

const numberBounce = {
    initial: { opacity: 0, scale: 4 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, duration: 0.7, bounce: 0.55 },
}

// Угол (в градусах) для transform="rotate(...)", разворачивающий текст
// ВДОЛЬ отрезка a→b — без стрелки, само расположение+поворот+цвет уже
// однозначно говорят, к какой стороне относится подпись (по прямой
// просьбе пользователя убрать стрелки). Считается через atan2(dy,dx) —
// та же формула, что и сама SVG rotate() использует внутри, поэтому
// rotate(angleAlongLine(a,b)) гарантированно разворачивает базовую линию
// текста ТОЧНО по вектору a→b, независимо от ориентации канваса.
// Нормализация в (-90°, 90°] выбирает из двух коллинеарных направлений
// (a→b и b→a отличаются на 180°) то, где глифы не переворачиваются вверх
// ногами — а строгие сравнения (< / >, не ≤ / ≥) сохраняют РОВНО ±90°
// без перевороту на границе, что для вертикального катета R→Q даёт
// именно -90° (поворот против часовой стрелки, как и попросил пользователь).
const angleAlongLine = (a: Pt, b: Pt): number => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI
    if (deg > 90) deg -= 180
    else if (deg < -90) deg += 180
    return deg
}

// Подпись стороны, развёрнутая вдоль неё (гипотенуза/противолежащий
// катет) — сама позиция+поворот+цвет читаются как принадлежность к
// конкретной стороне, отдельная стрелка больше не нужна. `pulse` —
// золотая мигающая версия для "противолежащего катета" (ключевая фраза,
// привлекающая внимание, см. TypeSinWalk). `delay` (сек) — чтобы подпись
// появлялась ПОСЛЕ того, как линия стороны уже дорисовалась (см. "стандарт"
// подсветки стороны ниже), не одновременно с ней.
//
// ВАЖНО: поворот вынесен на ОТДЕЛЬНЫЙ статичный <g> вокруг motion.text, а
// не передан прямо motion.text'у через проп `transform` — framer-motion
// для анимируемых SVG-элементов сам вычисляет и перезаписывает атрибут
// `transform` из своих motion-values (тут — scale), и полностью
// ИГНОРИРУЕТ/затирает любой вручную заданный `transform`-проп на ТОМ ЖЕ
// узле, как только анимация реально начинает тикать (это не проявлялось
// при живой проверке в этом инструментарии ровно потому, что там
// requestAnimationFrame заморожен — см. класс артефактов, документированный
// в CLAUDE.md — а в браузере пользователя, где rAF тикает нормально, поворот
// стирался). Обёртка-<g> не анимируется framer'ом вообще, поэтому её
// transform гарантированно остаётся как задано.
const SideLabel = ({
    a, b, labelPt, active, color, text, fontSize = 17, pulse = false, delay = 0,
}: { a: Pt; b: Pt; labelPt: Pt; active: boolean; color: string; text: string; fontSize?: number; pulse?: boolean; delay?: number }) => {
    const rotation = angleAlongLine(a, b)
    return (
        <g transform={`rotate(${rotation} ${labelPt.x} ${labelPt.y})`}>
            <motion.text
                x={labelPt.x} y={labelPt.y}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="var(--font-nunito), sans-serif"
                fontSize={fontSize}
                fontWeight={800}
                fill={color}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={
                    !active
                        ? { opacity: 0, scale: 0.3 }
                        : pulse
                            ? { opacity: [1, 0.4, 1], scale: 1 }
                            : { opacity: 1, scale: 1 }
                }
                transition={
                    active && pulse
                        ? { opacity: { duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay }, scale: { type: 'spring', duration: 0.6, bounce: 0.45, delay } }
                        : { type: 'spring', duration: 0.6, bounce: 0.45, delay: active ? delay : 0 }
                }
            >{text}</motion.text>
        </g>
    )
}

// "Куда наводит камеру" при монтировании этого конкретного снимка
// диаграммы — по прямой просьбе пользователя: пока рисуется прямой угол
// или угол α, всё поле зрения на мгновение приближается именно к этой
// вершине (эффект "смотри сюда"), сама фигура рисуется уже в приближении,
// затем камера отдаляется обратно. Задаётся ОДИН раз на конкретный
// снимок лога (см. TypeSinWalk — только шаги, где элемент появляется
// впервые, получают zoomFocus, остальные показывают уже устоявшийся вид
// сразу). 'alphaToOppositeLeg' — отдельный вариант: камера сначала
// приближается к α, ЗАТЕМ (не отдаляясь) панорамируется к противолежащему
// катету, держит кадр там, и только потом отдаляется — используется в
// момент, когда "катет" (уже подписанный зелёным на предыдущем шаге)
// переименовывается в "противолежащий катет" (золотой, см. legSwap-логику
// ниже).
export type ZoomFocus = 'rightAngle' | 'alpha' | 'alphaToOppositeLeg' | null

export type RightTriangleVisual = {
    rotationDeg?: number
    mirror?: boolean
    rightAngleMarkShown?: boolean
    // Общая подпись "катет" зелёным на ОБЕИХ сторонах-катетах сразу — до
    // того, как одна из них "переименовывается" в противолежащий катет
    // (см. oppositeLegHighlighted/легSwap-логику в JSX).
    legsLabelShown?: boolean
    hypotenuseHighlighted?: boolean
    hypotenuseLabelShown?: boolean
    alphaVertex?: AlphaVertex | null
    oppositeLegHighlighted?: boolean
    oppositeLegLabelShown?: boolean
    zoomFocus?: ZoomFocus
    // Тренировочный режим — стороны кликабельны, подсвечиваются по итогу проверки.
    interactive?: boolean
    onSideClick?: (side: SideId) => void
    // Режим "пробуй, пока не угадаешь" (та же механика, что и у
    // log-разборов, см. type-logcombowalk.tsx) — стороны, уже нажатые
    // НЕВЕРНО в ТЕКУЩЕЙ попытке: красятся красным и перестают быть
    // кликабельны, остальные (включая правильную) остаются активными, пока
    // пользователь не найдёт верную. correctSide зеленеет только когда
    // checked=true (правильная сторона наконец найдена).
    wrongSides?: SideId[]
    correctSide?: SideId | null
    checked?: boolean
}

// Тайминг zoom-эффекта — камера зумит внутрь, держит кадр, пока элемент
// рисуется, затем отдаляется обратно. Доли времени (times) заданы под
// framer-motion keyframe-анимацию с общей длительностью ZOOM_TOTAL_S.
const ZOOM_SCALE = 2.3
const ZOOM_TOTAL_S = 2.7 // было 1.8, +50% по просьбе пользователя — резче не читалась смена картинки
const ZOOM_IN_FRACTION = 0.35   // к этому моменту камера уже приблизилась
const ZOOM_OUT_START_FRACTION = 0.65 // с этого момента начинает отдаляться

// Тайминг для 'alphaToOppositeLeg' — отдельный, подольше (два "дубля"
// камеры вместо одного): зум на α → пауза → панорама к катету → держим
// кадр → отдаляемся.
const PAN_TOTAL_S = 3.6 // было 2.4, +50% — тот же принцип, что и у ZOOM_TOTAL_S выше
const PAN_ARRIVE_ALPHA_FRACTION = 0.2   // камера уже у α
const PAN_ARRIVE_LEG_FRACTION = 0.55    // панорама к катету завершена — здесь проявляется "swap"
const PAN_OUT_START_FRACTION = 0.8      // отсюда начинает отдаляться

// Длительность "дорисовки" подсвеченной обучающей стороны (гипотенуза/
// противолежащий катет) — см. "стандарт" подсветки стороны в JSX ниже.
const SIDE_DRAW_DURATION = 0.9

// Задержка между появлением подписи "катет" на первой и на второй стороне
// — по прямой просьбе пользователя, обе подписи должны появляться
// ПООЧЕРЁДНО, не одновременно.
const LEGS_LABEL_STAGGER_S = 0.6

export const RightTriangleDiagram = (props: RightTriangleVisual) => {
    const {
        rotationDeg = 0,
        mirror = false,
        rightAngleMarkShown = false,
        legsLabelShown = false,
        hypotenuseHighlighted = false,
        hypotenuseLabelShown = false,
        alphaVertex = null,
        oppositeLegHighlighted = false,
        oppositeLegLabelShown = false,
        zoomFocus = null,
        interactive = false,
        onSideClick,
        wrongSides = [],
        correctSide = null,
        checked = false,
    } = props

    // Пока камера не "доехала" до цели (zoomFocus задан) — элемент,
    // который сейчас рисуется, ещё не показан; как только зум-анимация
    // доходит до фазы "держим кадр" (для 'alphaToOppositeLeg' — как только
    // панорама долетела до катета) — элемент проявляется (см. JSX ниже,
    // effectiveRightAngleMarkShown/showAlphaArc/effectiveOppositeLegHighlighted).
    // Без zoomFocus — сразу true.
    const [revealed, setRevealed] = useState(!zoomFocus)
    useEffect(() => {
        if (!zoomFocus) return
        const delayMs = zoomFocus === 'alphaToOppositeLeg'
            ? PAN_ARRIVE_LEG_FRACTION * PAN_TOTAL_S * 1000
            : ZOOM_IN_FRACTION * ZOOM_TOTAL_S * 1000
        const t = setTimeout(() => setRevealed(true), delayMs)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const { R, P, Q } = computeTriangle(rotationDeg, mirror)
    const hypMid = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 }
    const legRPMid = { x: (R.x + P.x) / 2, y: (R.y + P.y) / 2 }
    const legRQMid = { x: (R.x + Q.x) / 2, y: (R.y + Q.y) / 2 }

    // Наружная нормаль стороны (от третьей вершины) — нужна и для
    // стрелки-подписи, и для точки, откуда стрелка "выезжает".
    const outward = (mid: Pt, third: Pt, dist: number): Pt => add(mid, scale(norm(sub(mid, third)), dist))

    // Отступы уменьшены относительно прежней версии со стрелками — без
    // стрелки подписи не нужно держать далеко от линии, только не
    // перекрывать саму сторону. По прямой просьбе пользователя ("подписи
    // чуть далековато") — уменьшены ЕЩЁ раз, подписи теперь ближе к самим
    // сторонам (минимальный зазор — половина ширины подсвеченной линии
    // (11px) плюс небольшой запас под сам текст).
    const hypLabelPt = outward(hypMid, R, 26)
    const legRQLabelPt = outward(legRQMid, P, 22)
    const legRPLabelPt = outward(legRPMid, Q, 18)

    // Маленький квадратик прямого угла — из единичных векторов вдоль
    // обеих сторон, исходящих из R (корректно поворачивается вместе с
    // треугольником, т.к. считается из уже повёрнутых координат, не из
    // фиксированных offset'ов).
    const uRP = norm(sub(P, R))
    const uRQ = norm(sub(Q, R))
    const s = 20
    const m1 = add(R, scale(uRP, s))
    const m2 = add(add(R, scale(uRP, s)), scale(uRQ, s))
    const m3 = add(R, scale(uRQ, s))

    // Дуга угла альфа — квадратичная кривая между точками на биссектрисе,
    // тот же приём приближения дуги без арк-флагов, что уже используется
    // для похожих маленьких индикаторов в проекте.
    const alphaArc = (() => {
        if (!alphaVertex) return null
        const V = alphaVertex === 'P' ? P : Q
        const other = alphaVertex === 'P' ? Q : P
        const dir1 = norm(sub(R, V))
        const dir2 = norm(sub(other, V))
        const r = 30
        const p1 = add(V, scale(dir1, r))
        const p2 = add(V, scale(dir2, r))
        const bis = norm(add(dir1, dir2))
        const control = add(V, scale(bis, r * 1.3))
        const labelPt = add(V, scale(bis, r + 22))
        return { p1, p2, control, labelPt }
    })()

    // Показывать элемент СРАЗУ, если он не является целью текущего zoom
    // (например уже введённая гипотенуза на шаге "выбираем угол α" — не
    // ждёт никакого зума), либо только когда камера уже "доехала" до
    // цели (revealed) — если ИМЕННО этот элемент и есть цель зума.
    const effectiveRightAngleMarkShown = zoomFocus === 'rightAngle' ? rightAngleMarkShown && revealed : rightAngleMarkShown
    const showAlphaArc = alphaArc !== null && (zoomFocus === 'alpha' ? revealed : true)
    // Золотая подсветка противолежащего катета (линия+подпись) — если
    // ИМЕННО в этом снимке камера панорамирует к нему ('alphaToOppositeLeg'),
    // ждёт, пока панорама доедет (revealed); иначе, как и раньше, сразу.
    const effectiveOppositeLegHighlighted = zoomFocus === 'alphaToOppositeLeg' ? oppositeLegHighlighted && revealed : oppositeLegHighlighted

    // Точка(и), куда "наводит камеру" зум-эффект, и рассчитанный по ним
    // сдвиг motion.g — см. комментарий у <rect>: bbox группы всегда РОВНО
    // canvas 0..CANVAS (сам rect — первый и самый большой элемент группы),
    // значит центр bbox = CENTER всегда, независимо от того, что ещё
    // видно/скрыто — framer-motion's forced fill-box transform-origin
    // (см. аналогичный комментарий в TrapezoidDiagram.tsx) поэтому даёт
    // ИЗВЕСТНУЮ константу, не требует измерения через getBBox(). Формула
    // для смещения такая, чтобы точка фокуса ПОСЛЕ увеличения оказалась в
    // центре канваса: tx,ty = -ZOOM_SCALE·(focus-CENTER).
    const focusOffset = (pt: Pt) => ({ x: -ZOOM_SCALE * (pt.x - CENTER.x), y: -ZOOM_SCALE * (pt.y - CENTER.y) })
    const alphaPoint = alphaVertex === 'P' ? P : Q
    const oppositeLegMid = alphaVertex === 'P' ? legRQMid : legRPMid
    const zoomFocusPoint = zoomFocus === 'rightAngle' ? R : zoomFocus === 'alpha' || zoomFocus === 'alphaToOppositeLeg' ? alphaPoint : null
    const zoomTx = zoomFocusPoint ? focusOffset(zoomFocusPoint).x : 0
    const zoomTy = zoomFocusPoint ? focusOffset(zoomFocusPoint).y : 0
    const panOffset = zoomFocus === 'alphaToOppositeLeg' ? focusOffset(oppositeLegMid) : null

    // Базовая задержка появления подписей "катет" — раньше срабатывала
    // ещё ВО ВРЕМЯ зум-эффекта (одновременно с зум-аутом), по прямой
    // просьбе пользователя теперь ждёт, пока камера ПОЛНОСТЬЮ вернётся
    // в исходное положение (весь ZOOM_TOTAL_S), а не только фазу
    // "приблизились" (ZOOM_IN_FRACTION). Вторая подпись — ещё позже, см.
    // LEGS_LABEL_STAGGER_S у каждого вызова SideLabel ниже.
    const legsBaseDelay = zoomFocus === 'rightAngle' ? ZOOM_TOTAL_S : 0

    // Подсветка гипотенузы/противолежащего катета в обучающих кадрах
    // ТЕПЕРЬ не здесь — см. отдельные overlay-линии в JSX ниже ("стандарт"
    // подсветки стороны: базовая белая линия остаётся видна, поверх
    // дорисовывается цветная с эффектом замедления). sideProps отвечает
    // только за интерактивные (тренировочные) состояния — клик/проверка.
    const sideProps = (side: SideId) => {
        let stroke = EDGE
        let width = 6
        if (checked && side === correctSide) {
            stroke = CORRECT_COLOR
            width = 9
        } else if (wrongSides.includes(side)) {
            stroke = WRONG_COLOR
            width = 9
        }
        return { stroke, width }
    }

    const hypStyle = sideProps('hyp')
    const legRPStyle = sideProps('legRP')
    const legRQStyle = sideProps('legRQ')

    return (
        <div className="flex items-center justify-center py-2 px-2 mb-2 bg-[#161F23] rounded-xl overflow-hidden">
            <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} width="100%" height="auto" style={{ maxWidth: 580 }}>
                <motion.g
                    animate={panOffset ? {
                        // Зум на α → пауза → панорама (тот же scale, x/y едут
                        // к катету) → держим кадр там → отдаляемся.
                        scale: [1, ZOOM_SCALE, ZOOM_SCALE, ZOOM_SCALE, 1],
                        x: [0, zoomTx, panOffset.x, panOffset.x, 0],
                        y: [0, zoomTy, panOffset.y, panOffset.y, 0],
                    } : zoomFocusPoint ? {
                        scale: [1, ZOOM_SCALE, ZOOM_SCALE, 1],
                        x: [0, zoomTx, zoomTx, 0],
                        y: [0, zoomTy, zoomTy, 0],
                    } : undefined}
                    transition={panOffset ? {
                        duration: PAN_TOTAL_S,
                        times: [0, PAN_ARRIVE_ALPHA_FRACTION, PAN_ARRIVE_LEG_FRACTION, PAN_OUT_START_FRACTION, 1],
                        ease: 'easeInOut',
                    } : zoomFocusPoint ? {
                        duration: ZOOM_TOTAL_S,
                        times: [0, ZOOM_IN_FRACTION, ZOOM_OUT_START_FRACTION, 1],
                        ease: 'easeInOut',
                    } : undefined}
                >
                {/* bbox этого <rect> (0..CANVAS по обеим осям) — САМЫЙ
                    крупный элемент группы, поэтому framer-motion'овский
                    fill-box-центр transform-origin у motion.g ВСЕГДА равен
                    ровно CENTER, независимо от того, что ещё видно/скрыто
                    внутри (см. комментарий у zoomFocusPoint выше). */}
                <rect x="0" y="0" width={CANVAS} height={CANVAS} fill={BG} />

                {/* Прямой угол И дуга угла α — рисуются ПЕРВЫМИ (под линиями
                    сторон), а не поверх них, по прямой просьбе пользователя. */}
                <motion.path
                    d={`M ${m1.x} ${m1.y} L ${m2.x} ${m2.y} L ${m3.x} ${m3.y}`}
                    fill="none"
                    stroke={RIGHT_ANGLE_COLOR}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: effectiveRightAngleMarkShown ? 1 : 0, scale: effectiveRightAngleMarkShown ? 1 : 0.4 }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.5 }}
                />

                {showAlphaArc && alphaArc && (
                    <>
                        <motion.path
                            d={`M ${alphaArc.p1.x} ${alphaArc.p1.y} Q ${alphaArc.control.x} ${alphaArc.control.y} ${alphaArc.p2.x} ${alphaArc.p2.y}`}
                            fill="none"
                            stroke={ALPHA_COLOR}
                            strokeWidth={3}
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                        <motion.text
                            x={alphaArc.labelPt.x} y={alphaArc.labelPt.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fontFamily="Georgia, serif" fontStyle="italic" fontSize={24} fontWeight={700}
                            fill={ALPHA_COLOR}
                            initial={numberBounce.initial}
                            animate={numberBounce.animate}
                            transition={numberBounce.transition}
                        >α</motion.text>
                    </>
                )}

                {/* Стороны — сначала широкая прозрачная "зона клика" (если
                    интерактивно), затем сама видимая линия поверх (в т.ч.
                    поверх маркера прямого угла/дуги α выше). Пока сторона
                    кликабельна, но ещё не выбрана — лёгкое "дыхание"
                    прозрачности вдоль неё сигналит "это можно нажать" без
                    единого слова текста (по прямой просьбе пользователя —
                    непонятно было, что стороны кликабельны). Реакция на
                    сам клик (переход в checked) — пружинный "bounce" по
                    ширине линии, не плоское появление. */}
                {(['hyp', 'legRP', 'legRQ'] as SideId[]).map((side, sideIdx) => {
                    const [a, b] = side === 'hyp' ? [P, Q] : side === 'legRP' ? [R, P] : [R, Q]
                    const style = side === 'hyp' ? hypStyle : side === 'legRP' ? legRPStyle : legRQStyle
                    const showClickHint = interactive && !checked && !wrongSides.includes(side)
                    return (
                        <g key={side}>
                            {showClickHint && (
                                <motion.line
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke={TEXT} strokeWidth={16} strokeLinecap="round"
                                    style={{ pointerEvents: 'none' }}
                                    animate={{ opacity: [0.08, 0.4, 0.08] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: sideIdx * 0.18 }}
                                />
                            )}
                            {interactive && !wrongSides.includes(side) && (
                                <line
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke="transparent" strokeWidth={28} strokeLinecap="round"
                                    className="cursor-pointer"
                                    onClick={() => !checked && onSideClick?.(side)}
                                />
                            )}
                            <motion.line
                                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                stroke={style.stroke}
                                strokeWidth={style.width}
                                strokeLinecap="round"
                                // По прямой просьбе пользователя — заметный
                                // bounce в момент клика: линия ЯВНО толще
                                // конечной ширины (1.7×), затем оседает до
                                // нормального размера. Явные keyframe'ы
                                // [peak, target], а не spring-overshoot от
                                // stiffness/damping — гарантированный,
                                // предсказуемый "хлопок", не зависящий от
                                // тонкой настройки пружины.
                                animate={{
                                    stroke: style.stroke,
                                    strokeWidth: checked ? [style.width * 1.7, style.width] : style.width,
                                }}
                                transition={checked
                                    ? { strokeWidth: { duration: 0.5, times: [0.35, 1], ease: 'easeOut' }, stroke: { duration: 0.2 } }
                                    : { duration: 0.3 }}
                                style={{ pointerEvents: 'none' }}
                            />
                        </g>
                    )
                })}

                {/* "Стандарт" подсветки обучающей стороны (гипотенуза/
                    противолежащий катет): базовая белая линия выше остаётся
                    видна, а ПОВЕРХ нЕё дорисовывается отдельная цветная —
                    pathLength 0→1 с ease-out (эффект замедления к концу),
                    заметно толще базовой. Подпись появляется bounce'ом
                    ТОЛЬКО ПОСЛЕ того как линия уже дорисовалась (delay). */}
                <motion.line
                    x1={P.x} y1={P.y} x2={Q.x} y2={Q.y}
                    stroke={HYPOTENUSE_COLOR} strokeWidth={11} strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: hypotenuseHighlighted ? 1 : 0, opacity: hypotenuseHighlighted ? 1 : 0 }}
                    transition={{ duration: SIDE_DRAW_DURATION, ease: 'easeOut' }}
                />
                <SideLabel
                    a={P} b={Q} labelPt={hypLabelPt}
                    active={hypotenuseLabelShown} color={HYPOTENUSE_COLOR} text="гипотенуза"
                    delay={hypotenuseHighlighted ? SIDE_DRAW_DURATION : 0}
                />

                <motion.line
                    x1={R.x} y1={R.y}
                    x2={alphaVertex === 'P' ? Q.x : P.x} y2={alphaVertex === 'P' ? Q.y : P.y}
                    stroke={LEG_COLOR} strokeWidth={11} strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: effectiveOppositeLegHighlighted ? 1 : 0, opacity: effectiveOppositeLegHighlighted ? 1 : 0 }}
                    transition={{ duration: SIDE_DRAW_DURATION, ease: 'easeOut' }}
                />
                {/* Раньше золотая и мигающая — по прямой просьбе пользователя
                    убран этот акцент, "противолежащий катет" теперь в ТОМ ЖЕ
                    формате, что и обычный зелёный "катет" ниже (тот же цвет,
                    без pulse) — просто другой текст на той же стороне. */}
                <SideLabel
                    a={R}
                    b={alphaVertex === 'P' ? Q : P}
                    labelPt={alphaVertex === 'P' ? legRQLabelPt : legRPLabelPt}
                    active={oppositeLegLabelShown && effectiveOppositeLegHighlighted}
                    color={LEG_COLOR}
                    text="противолежащий катет"
                    fontSize={15}
                    delay={effectiveOppositeLegHighlighted ? SIDE_DRAW_DURATION : 0}
                />

                {/* Общая зелёная подпись "катет" на КАЖДОЙ стороне-катете —
                    появляется ПОСЛЕ того, как камера полностью отдалилась
                    (не одновременно с зум-аутом — по прямой просьбе
                    пользователя), и на ДВУХ сторонах ПООЧЕРЁДНО (вторая с
                    задержкой LEGS_LABEL_STAGGER_S относительно первой), а
                    не одновременно. Когда одна из сторон "переименовывается"
                    в противолежащий катет (см. выше) — ИМЕННО на этой
                    стороне зелёная подпись гаснет РОВНО в тот же момент,
                    когда новая появляется — читается как один и тот же
                    ярлык, сменивший только текст. */}
                <SideLabel
                    a={R} b={P} labelPt={legRPLabelPt}
                    active={legsLabelShown && !(alphaVertex && oppositeLegOf(alphaVertex) === 'legRP' && effectiveOppositeLegHighlighted)}
                    color={LEG_COLOR} text="катет" fontSize={16}
                    delay={legsBaseDelay}
                />
                <SideLabel
                    a={R} b={Q} labelPt={legRQLabelPt}
                    active={legsLabelShown && !(alphaVertex && oppositeLegOf(alphaVertex) === 'legRQ' && effectiveOppositeLegHighlighted)}
                    color={LEG_COLOR} text="катет" fontSize={16}
                    delay={legsBaseDelay + LEGS_LABEL_STAGGER_S}
                />

                {/* Вершины — маленькие точки, чтобы стороны читались как
                    отрезки одной фигуры, а не как три отдельные линии. */}
                {[R, P, Q].map((v, i) => (
                    <circle key={i} cx={v.x} cy={v.y} r={4} fill={TEXT} />
                ))}
                </motion.g>
            </svg>
        </div>
    )
}
