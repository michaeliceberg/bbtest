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

import { motion } from 'framer-motion'

const BG = '#161F23'
const EDGE = '#F2F7FB'
const RIGHT_ANGLE_COLOR = '#9AA7B0'
const ALPHA_COLOR = '#4A90D9'          // тот же синий, что ACTIVE_COLOR в WalkthroughLog — "вот угол, на который сейчас смотрим"
const HYPOTENUSE_COLOR = '#8B5CF6'     // тот же фиолетовый, что HYPOTENUSE_COLOR в TrapezoidDiagram
const OPPOSITE_LEG_COLOR = '#4ADE80'   // тот же зелёный, что SEGMENT_COLOR в TrapezoidDiagram — "вот сторона, которую нашли"
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

const computeArrow = (from: Pt, to: Pt, headLen = 12, headWidth = 8, tailGap = 18) => {
    const d = sub(to, from)
    const len = Math.sqrt(d.x * d.x + d.y * d.y) || 1
    const u = { x: d.x / len, y: d.y / len }
    const p = { x: -u.y, y: u.x }
    const tail = add(from, scale(u, tailGap))
    const headBack = sub(to, scale(u, headLen))
    const headPoints = [
        `${to.x},${to.y}`,
        `${headBack.x + p.x * (headWidth / 2)},${headBack.y + p.y * (headWidth / 2)}`,
        `${headBack.x - p.x * (headWidth / 2)},${headBack.y - p.y * (headWidth / 2)}`,
    ].join(' ')
    return { tail, headBack, headPoints }
}

const numberBounce = {
    initial: { opacity: 0, scale: 4 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, duration: 0.7, bounce: 0.55 },
}

// "?"-подобный приём из TrapezoidDiagram, тут — произвольный текстовый
// лейбл (не только один глиф), появляющийся вместе со стрелкой,
// указывающей на середину стороны.
const ArrowLabel = ({ from, to, active, color, text, fontSize = 17 }: { from: Pt; to: Pt; active: boolean; color: string; text: string; fontSize?: number }) => {
    const { tail, headBack, headPoints } = computeArrow(from, to)
    return (
        <>
            <motion.line
                x1={tail.x} y1={tail.y} x2={headBack.x} y2={headBack.y}
                stroke={color} strokeWidth={3} strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: active ? 0.15 : 0 }}
            />
            <motion.polygon
                points={headPoints}
                fill={color}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.4 }}
                transition={{ duration: 0.25, delay: active ? 0.45 : 0 }}
            />
            <motion.text
                x={from.x} y={from.y}
                textAnchor="middle"
                fontFamily="var(--font-nunito), sans-serif"
                fontSize={fontSize}
                fontWeight={800}
                fill={color}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.3 }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0.45, delay: active ? 0.35 : 0 }}
            >{text}</motion.text>
        </>
    )
}

export type RightTriangleVisual = {
    rotationDeg?: number
    mirror?: boolean
    rightAngleMarkShown?: boolean
    hypotenuseHighlighted?: boolean
    hypotenuseLabelShown?: boolean
    alphaVertex?: AlphaVertex | null
    oppositeLegHighlighted?: boolean
    oppositeLegLabelShown?: boolean
    // Тренировочный режим — стороны кликабельны, подсвечиваются по итогу проверки.
    interactive?: boolean
    onSideClick?: (side: SideId) => void
    selectedSide?: SideId | null
    correctSide?: SideId | null
    checked?: boolean
}

export const RightTriangleDiagram = (props: RightTriangleVisual) => {
    const {
        rotationDeg = 0,
        mirror = false,
        rightAngleMarkShown = false,
        hypotenuseHighlighted = false,
        hypotenuseLabelShown = false,
        alphaVertex = null,
        oppositeLegHighlighted = false,
        oppositeLegLabelShown = false,
        interactive = false,
        onSideClick,
        selectedSide = null,
        correctSide = null,
        checked = false,
    } = props

    const { R, P, Q } = computeTriangle(rotationDeg, mirror)
    const hypMid = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 }
    const legRPMid = { x: (R.x + P.x) / 2, y: (R.y + P.y) / 2 }
    const legRQMid = { x: (R.x + Q.x) / 2, y: (R.y + Q.y) / 2 }

    // Наружная нормаль стороны (от третьей вершины) — нужна и для
    // стрелки-подписи, и для точки, откуда стрелка "выезжает".
    const outward = (mid: Pt, third: Pt, dist: number): Pt => add(mid, scale(norm(sub(mid, third)), dist))

    const hypLabelPt = outward(hypMid, R, 58)
    const legRQLabelPt = outward(legRQMid, P, 66)
    const legRPLabelPt = outward(legRPMid, Q, 40)

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

    const sideProps = (side: SideId) => {
        let stroke = EDGE
        let width = 6
        if (checked) {
            if (side === correctSide) { stroke = CORRECT_COLOR; width = 9 }
            else if (side === selectedSide) { stroke = WRONG_COLOR; width = 9 }
        } else if (side === selectedSide) {
            stroke = ALPHA_COLOR
            width = 9
        } else if (side === 'hyp' && hypotenuseHighlighted) {
            stroke = HYPOTENUSE_COLOR
            width = 8
        } else if (oppositeLegHighlighted && alphaVertex && side === oppositeLegOf(alphaVertex)) {
            stroke = OPPOSITE_LEG_COLOR
            width = 8
        }
        return { stroke, width }
    }

    const hypStyle = sideProps('hyp')
    const legRPStyle = sideProps('legRP')
    const legRQStyle = sideProps('legRQ')

    return (
        <div className="flex items-center justify-center py-2 px-2 mb-2 bg-[#161F23] rounded-xl overflow-hidden">
            <svg viewBox={`0 0 ${CANVAS} ${CANVAS}`} width="100%" height="auto" style={{ maxWidth: 340 }}>
                <rect x="0" y="0" width={CANVAS} height={CANVAS} fill={BG} />

                {/* Стороны — сначала широкая прозрачная "зона клика" (если
                    интерактивно), затем сама видимая линия поверх. */}
                {(['hyp', 'legRP', 'legRQ'] as SideId[]).map((side) => {
                    const [a, b] = side === 'hyp' ? [P, Q] : side === 'legRP' ? [R, P] : [R, Q]
                    const style = side === 'hyp' ? hypStyle : side === 'legRP' ? legRPStyle : legRQStyle
                    return (
                        <g key={side}>
                            {interactive && (
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
                                animate={{ stroke: style.stroke, strokeWidth: style.width }}
                                transition={{ duration: 0.3 }}
                                style={{ pointerEvents: 'none' }}
                            />
                        </g>
                    )
                })}

                {/* Прямой угол — маленький уголок-маркер у R. */}
                <motion.path
                    d={`M ${m1.x} ${m1.y} L ${m2.x} ${m2.y} L ${m3.x} ${m3.y}`}
                    fill="none"
                    stroke={RIGHT_ANGLE_COLOR}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: rightAngleMarkShown ? 1 : 0, scale: rightAngleMarkShown ? 1 : 0.4 }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.5 }}
                />

                {/* Дуга + подпись "α" у выбранной вершины. */}
                {alphaArc && (
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

                <ArrowLabel from={hypLabelPt} to={hypMid} active={hypotenuseLabelShown} color={HYPOTENUSE_COLOR} text="гипотенуза" />
                <ArrowLabel
                    from={alphaVertex === 'P' ? legRQLabelPt : legRPLabelPt}
                    to={alphaVertex === 'P' ? legRQMid : legRPMid}
                    active={oppositeLegLabelShown}
                    color={OPPOSITE_LEG_COLOR}
                    text="противолежащий катет"
                    fontSize={15}
                />

                {/* Вершины — маленькие точки, чтобы стороны читались как
                    отрезки одной фигуры, а не как три отдельные линии. */}
                {[R, P, Q].map((v, i) => (
                    <circle key={i} cx={v.x} cy={v.y} r={4} fill={TEXT} />
                ))}
            </svg>
        </div>
    )
}
