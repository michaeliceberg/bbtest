// components/geometry/TrapezoidDiagram.tsx
//
// Анимированная равнобедренная трапеция для интерактивного разбора
// задачи (см. TrapezoidWalkthrough.tsx). НЕ статичный SVG-файл (как
// диаграммы sdamgia в public/geometry/) — параметризуемый React-
// компонент, реагирующий на явные булевы/значимые пропы (не общий
// "stage"-номер — по мере усложнения хореографии этого стало
// недостаточно: числа 43/73 должны появляться НЕЗАВИСИМО друг от друга
// и с РАЗНЫМ направлением слайда, а не одним общим флагом).
//
// Топология не в масштабе (реальная высота трапеции при этих числах
// визуально почти плоская — h=6√6≈14.7 при основаниях 43/73), высота
// осознанно завышена для читаемости чертежа.

import { motion } from 'framer-motion'

const BG = '#161F23'
const EDGE = '#F2F7FB'
const ACCENT = '#7dd3fc'   // акцент математики (см. CLAUDE.md)
const ACCENT2 = '#facc15'  // отрезки основания после проведения высот
const TEXT = '#F2F7FB'

// Координаты — не в масштабе, топология точная: отступ верхних вершин
// пропорционален разности оснований (73-43)/2 = 15 с каждой стороны.
const D = { x: 40, y: 200 }   // низ-лево
const C = { x: 660, y: 200 }  // низ-право
const A = { x: 175, y: 90 }   // верх-лево
const B = { x: 525, y: 90 }   // верх-право
const A_FOOT = { x: A.x, y: D.y } // основание левой высоты
const B_FOOT = { x: B.x, y: D.y } // основание правой высоты (правый треугольник — B, C, B_FOOT)

// Зум на правый треугольник (B-C-B_FOOT) — трансформ всего <g>, не
// анимация viewBox (framer-motion не умеет плавно интерполировать
// произвольные SVG-атрибуты вроде viewBox из коробки, а scale+translate
// на группе — стандартный, хорошо поддерживаемый приём).
//
// ВАЖНО: framer-motion для motion.g принудительно ставит CSS
// transform-origin: 50% 50% относительно fill-box (bounding box самого
// содержимого группы) и ИГНОРИРУЕТ любую попытку переопределить это
// через style-проп (проверено вживую) — поэтому translate/scale здесь
// считаются НЕ от (0,0) viewBox, а от формулы композиции CSS-трансформов
// вокруг центра bbox: result = scale·(P − O) + O + (tx,ty), где O — центр
// bbox содержимого (получен через getBBox(): x:[40,660], y:[72,231.33] →
// O=(350, 151.667)). Числа ниже подобраны решением этого уравнения так,
// чтобы центр блока "треугольник + подпись 15 под его катетом"
// (592.5, 162.5) переходил ровно в центр viewBox (350, 130) — то есть и
// сам треугольник, и подпись гарантированно остаются в кадре (проверено
// расчётом координат всех вершин после трансформа, не на глаз).
const ZOOM_SCALE = 1.5
const ZOOM_TX = -363.75
const ZOOM_TY = -37.917

export type TrapezoidVisual = {
    legsHighlighted?: boolean
    base43Shown?: boolean
    base73Shown?: boolean
    altitudesDrawn?: boolean
    segmentsHighlighted?: boolean
    segmentValue?: string | null   // "15" — подпись на отрезках D-A_FOOT/B_FOOT
    triangleHighlighted?: boolean  // подсветка правого треугольника (до зума)
    zoomTriangle?: boolean         // зум на правый треугольник
    legValue?: string | null       // "21" — подпись на боковой стороне (финал)
}

const line = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`

export const TrapezoidDiagram = (props: TrapezoidVisual) => {
    const {
        legsHighlighted = false,
        base43Shown = false,
        base73Shown = false,
        altitudesDrawn = false,
        segmentsHighlighted = false,
        segmentValue = null,
        triangleHighlighted = false,
        zoomTriangle = false,
        legValue = null,
    } = props

    return (
        <div className="flex items-center justify-center py-6 px-4 mb-4 bg-[#161F23] border-2 border-[#3A464E] rounded-xl overflow-hidden">
            <svg viewBox="0 0 700 260" width="100%" height="auto" style={{ maxWidth: 480 }}>
                <rect x="0" y="0" width="700" height="260" fill={BG} />

                <motion.g
                    animate={{
                        scale: zoomTriangle ? ZOOM_SCALE : 1,
                        x: zoomTriangle ? ZOOM_TX : 0,
                        y: zoomTriangle ? ZOOM_TY : 0,
                    }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                >
                    {/* подсветка правого треугольника — под линиями трапеции */}
                    {triangleHighlighted && (
                        <motion.polygon
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.22 }}
                            transition={{ duration: 0.4 }}
                            points={`${B.x},${B.y} ${C.x},${C.y} ${B_FOOT.x},${B_FOOT.y}`}
                            fill={ACCENT}
                        />
                    )}

                    {/* верхнее основание A-B */}
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={3} strokeLinecap="round" />
                    {/* нижнее основание D-C */}
                    <line x1={D.x} y1={D.y} x2={C.x} y2={C.y} stroke={EDGE} strokeWidth={3} strokeLinecap="round" />

                    {/* боковые стороны — подсвечиваются акцентом */}
                    <motion.line
                        x1={A.x} y1={A.y} x2={D.x} y2={D.y}
                        stroke={legsHighlighted ? ACCENT : EDGE}
                        strokeWidth={legsHighlighted ? 4 : 3}
                        strokeLinecap="round"
                        animate={{ stroke: legsHighlighted ? ACCENT : EDGE }}
                        transition={{ duration: 0.4 }}
                    />
                    <motion.line
                        x1={B.x} y1={B.y} x2={C.x} y2={C.y}
                        stroke={legsHighlighted ? ACCENT : EDGE}
                        strokeWidth={legsHighlighted ? 4 : 3}
                        strokeLinecap="round"
                        animate={{ stroke: legsHighlighted ? ACCENT : EDGE }}
                        transition={{ duration: 0.4 }}
                    />

                    {/* высоты — дорисовываются анимированно (pathLength) */}
                    <motion.path
                        d={line(A, A_FOOT)}
                        stroke={EDGE}
                        strokeWidth={2}
                        strokeDasharray="7,5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: altitudesDrawn ? 1 : 0, opacity: altitudesDrawn ? 1 : 0 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <motion.path
                        d={line(B, B_FOOT)}
                        stroke={EDGE}
                        strokeWidth={2}
                        strokeDasharray="7,5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: altitudesDrawn ? 1 : 0, opacity: altitudesDrawn ? 1 : 0 }}
                        transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.15 }}
                    />

                    {/* отрезки основания слева/справа от высот — жёлтый акцент */}
                    <motion.line
                        x1={D.x} y1={D.y} x2={A_FOOT.x} y2={A_FOOT.y}
                        stroke={segmentsHighlighted ? ACCENT2 : 'transparent'}
                        strokeWidth={5}
                        strokeLinecap="round"
                        animate={{ opacity: segmentsHighlighted ? 1 : 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                    />
                    <motion.line
                        x1={B_FOOT.x} y1={B_FOOT.y} x2={C.x} y2={C.y}
                        stroke={segmentsHighlighted ? ACCENT2 : 'transparent'}
                        strokeWidth={5}
                        strokeLinecap="round"
                        animate={{ opacity: segmentsHighlighted ? 1 : 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                    />

                    {/* подпись "43" — "выныривает" СНИЗУ ВВЕРХ (стартует ближе
                        к телу трапеции и поднимается на своё место над ней). */}
                    <motion.text
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: base43Shown ? 1 : 0, y: base43Shown ? 0 : 18 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        x={(A.x + B.x) / 2} y={A.y - 14}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={22} fontWeight={700} fill={TEXT}
                    >43</motion.text>
                    {/* подпись "73" — "выныривает" СВЕРХУ ВНИЗ (стартует ближе
                        к телу трапеции и опускается на своё место под ней). */}
                    <motion.text
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: base73Shown ? 1 : 0, y: base73Shown ? 0 : -18 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        x={(D.x + C.x) / 2} y={D.y + 30}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={22} fontWeight={700} fill={TEXT}
                    >73</motion.text>

                    {/* подписи отрезков 15/15 */}
                    {segmentValue && (
                        <>
                            <motion.text
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, type: 'spring', bounce: 0.5 }}
                                x={(D.x + A_FOOT.x) / 2} y={D.y + 30}
                                textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={ACCENT2}
                            >{segmentValue}</motion.text>
                            <motion.text
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, type: 'spring', bounce: 0.5 }}
                                x={(B_FOOT.x + C.x) / 2} y={D.y + 30}
                                textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={ACCENT2}
                            >{segmentValue}</motion.text>
                        </>
                    )}

                    {/* подпись боковой стороны 21 (финал) — правая сторона B-C */}
                    {legValue && (
                        <motion.text
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, type: 'spring', bounce: 0.55 }}
                            x={(B.x + C.x) / 2 + 34} y={(B.y + C.y) / 2}
                            textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={ACCENT}
                        >{legValue}</motion.text>
                    )}
                </motion.g>
            </svg>
        </div>
    )
}
