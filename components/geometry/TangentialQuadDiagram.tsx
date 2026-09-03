// components/geometry/TangentialQuadDiagram.tsx
//
// Анимированный четырёхугольник ABCD с вписанной окружностью — второй
// интерактивный разбор по шагам (курс "ЕГЭ Математика Профиль" →
// Планиметрия → "Вписанная окружность" → challenge id=4594: "В
// четырёхугольник ABCD вписана окружность, AB=10, CD=16. Найдите
// периметр четырёхугольника ABCD."), тот же принцип, что и
// TrapezoidDiagram — параметризуемый React/SVG-компонент, а не
// статичный файл.
//
// Геометрия — НАСТОЯЩИЙ (не приблизительный на глаз) тангенциальный
// четырёхугольник: 4 касательные к окружности радиуса r в точках под
// углами -100°/-10°/95°/190°, вершины — пересечения соседних
// касательных (x·cosθ + y·sinθ = r). Посчитано один раз аналитически
// (Python), не подбиралось визуально — см. координаты ниже.

import { motion } from 'framer-motion'

const BG = '#161F23'
const EDGE = '#F2F7FB'
const ACCENT = '#7dd3fc'        // акцент математики — сторона AB+CD (дано)
const SEGMENT_COLOR = '#FB923C' // оранжевый — сторона BC+DA (выводим равенство)
const CIRCLE_COLOR = '#5C6B73'
const TEXT = '#F2F7FB'
const LABEL_COLOR = '#C4B5FD' // светло-фиолетовый — буквы касательных отрезков a/b/c/d

// Круг: центр O, радиус r. Вершины и точки касания — пересечение/касание
// 4 касательных линий x·cosθ+y·sinθ=r в точках под углами ниже.
const O = { x: 350, y: 175 }
const R = 100

const A = { x: 263.7, y: 88.7 }
const B = { x: 431.1, y: 59.2 }
const C = { x: 471.1, y: 286.0 }
const D = { x: 232.6, y: 265.1 }

const T_AB = { x: 332.6, y: 76.5 } // точка касания на стороне AB
const T_BC = { x: 448.5, y: 157.6 } // точка касания на стороне BC
const T_CD = { x: 341.3, y: 274.6 } // точка касания на стороне CD
const T_DA = { x: 251.5, y: 157.6 } // точка касания на стороне DA

// Середины отрезков "вершина → точка касания" — сюда сажаем буквы
// a/b/c/d (по касательному отрезку из каждой вершины).
const mid = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 })

const LABEL_A1 = mid(A, T_AB) // отрезок "a" на стороне AB со стороны A
const LABEL_A2 = mid(A, T_DA) // тот же отрезок "a" со стороны DA
const LABEL_B1 = mid(B, T_AB)
const LABEL_B2 = mid(B, T_BC)
const LABEL_C1 = mid(C, T_BC)
const LABEL_C2 = mid(C, T_CD)
const LABEL_D1 = mid(D, T_CD)
const LABEL_D2 = mid(D, T_DA)

export type TangentialQuadVisual = {
    tangentPointsShown?: boolean   // точки касания + пунктирные радиусы к ним
    tangentLabelsShown?: boolean   // буквы a/b/c/d на касательных отрезках
    abcdHighlighted?: boolean      // AB+CD подсвечены синим (дано)
    bcdaHighlighted?: boolean      // BC+DA подсвечены оранжевым (выводим)
    perimeterValue?: string | null // итоговый периметр (финальный ответ)
}

const numberBounce = {
    initial: { opacity: 0, scale: 5 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, duration: 0.8, bounce: 0.6 },
}

const TangentLabel = ({ pos, letter, shown, delay = 0 }: { pos: { x: number; y: number }; letter: string; shown: boolean; delay?: number }) => (
    <motion.text
        x={pos.x} y={pos.y}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.3 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.55, delay: shown ? delay : 0 }}
        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={17} fontWeight={800} fontStyle="italic" fill={LABEL_COLOR}
    >{letter}</motion.text>
)

export const TangentialQuadDiagram = (props: TangentialQuadVisual) => {
    const {
        tangentPointsShown = false,
        tangentLabelsShown = false,
        abcdHighlighted = false,
        bcdaHighlighted = false,
        perimeterValue = null,
    } = props

    return (
        <div className="flex items-center justify-center py-2 px-2 mb-4 bg-[#161F23] rounded-xl overflow-hidden">
            <svg viewBox="0 0 700 320" width="100%" height="auto" style={{ maxWidth: 480 }}>
                <rect x="0" y="0" width="700" height="320" fill={BG} />

                {/* окружность */}
                <circle cx={O.x} cy={O.y} r={R} fill="none" stroke={CIRCLE_COLOR} strokeWidth={3} />

                {/* стороны четырёхугольника */}
                <motion.line
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    stroke={abcdHighlighted ? ACCENT : EDGE}
                    strokeWidth={abcdHighlighted ? 7 : 5}
                    strokeLinecap="round"
                    animate={{ stroke: abcdHighlighted ? ACCENT : EDGE }}
                    transition={{ duration: 0.4 }}
                />
                <motion.line
                    x1={B.x} y1={B.y} x2={C.x} y2={C.y}
                    stroke={bcdaHighlighted ? SEGMENT_COLOR : EDGE}
                    strokeWidth={bcdaHighlighted ? 7 : 5}
                    strokeLinecap="round"
                    animate={{ stroke: bcdaHighlighted ? SEGMENT_COLOR : EDGE }}
                    transition={{ duration: 0.4 }}
                />
                <motion.line
                    x1={C.x} y1={C.y} x2={D.x} y2={D.y}
                    stroke={abcdHighlighted ? ACCENT : EDGE}
                    strokeWidth={abcdHighlighted ? 7 : 5}
                    strokeLinecap="round"
                    animate={{ stroke: abcdHighlighted ? ACCENT : EDGE }}
                    transition={{ duration: 0.4 }}
                />
                <motion.line
                    x1={D.x} y1={D.y} x2={A.x} y2={A.y}
                    stroke={bcdaHighlighted ? SEGMENT_COLOR : EDGE}
                    strokeWidth={bcdaHighlighted ? 7 : 5}
                    strokeLinecap="round"
                    animate={{ stroke: bcdaHighlighted ? SEGMENT_COLOR : EDGE }}
                    transition={{ duration: 0.4 }}
                />

                {/* точки касания + пунктирные радиусы к ним */}
                {[T_AB, T_BC, T_CD, T_DA].map((t, i) => (
                    <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: tangentPointsShown ? 1 : 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                        <line x1={O.x} y1={O.y} x2={t.x} y2={t.y} stroke={CIRCLE_COLOR} strokeWidth={2} strokeDasharray="5,5" />
                        <circle cx={t.x} cy={t.y} r={5} fill={TEXT} />
                    </motion.g>
                ))}

                {/* подписи вершин */}
                <text x={A.x - 16} y={A.y - 6} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={18} fontWeight={700} fill={TEXT}>A</text>
                <text x={B.x + 16} y={B.y - 6} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={18} fontWeight={700} fill={TEXT}>B</text>
                <text x={C.x + 16} y={C.y + 6} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={18} fontWeight={700} fill={TEXT}>C</text>
                <text x={D.x - 16} y={D.y + 6} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={18} fontWeight={700} fill={TEXT}>D</text>

                {/* буквы касательных отрезков — одна и та же буква на ОБОИХ
                    отрезках из одной вершины: наглядно "эти два равны". */}
                <TangentLabel pos={LABEL_A1} letter="a" shown={tangentLabelsShown} delay={0} />
                <TangentLabel pos={LABEL_A2} letter="a" shown={tangentLabelsShown} delay={0.1} />
                <TangentLabel pos={LABEL_B1} letter="b" shown={tangentLabelsShown} delay={0.2} />
                <TangentLabel pos={LABEL_B2} letter="b" shown={tangentLabelsShown} delay={0.3} />
                <TangentLabel pos={LABEL_C1} letter="c" shown={tangentLabelsShown} delay={0.4} />
                <TangentLabel pos={LABEL_C2} letter="c" shown={tangentLabelsShown} delay={0.5} />
                <TangentLabel pos={LABEL_D1} letter="d" shown={tangentLabelsShown} delay={0.6} />
                <TangentLabel pos={LABEL_D2} letter="d" shown={tangentLabelsShown} delay={0.7} />

                {/* итоговый периметр — по центру фигуры */}
                {perimeterValue && (
                    <motion.text
                        initial={numberBounce.initial}
                        animate={numberBounce.animate}
                        transition={numberBounce.transition}
                        x={O.x} y={O.y + 6}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={26} fontWeight={800} fill={ACCENT}
                    >P={perimeterValue}</motion.text>
                )}
            </svg>
        </div>
    )
}
