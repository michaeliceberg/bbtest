// components/geometry/TrapezoidDiagram.tsx
//
// Анимированная равнобедренная трапеция для интерактивного разбора
// задачи (см. TrapezoidWalkthrough.tsx). НЕ статичный SVG-файл (как
// диаграммы sdamgia в public/geometry/) — параметризуемый React-
// компонент, реагирующий на `stage`, потому что подсветка/подписи должны
// появляться ПОСТЕПЕННО по ходу разбора, а не быть готовыми сразу.
//
// Топология не в масштабе (реальная высота трапеции при этих числах
// визуально почти плоская — h=6√6≈14.7 при основаниях 43/73), высота
// осознанно завышена для читаемости чертежа, как и остальные "не совсем
// в масштабе" геометрические иллюстрации в проекте — здесь это
// приемлемо, т.к. цель диаграммы учебная (показать структуру
// рассуждения), а не техническая точность отрисовки.

import { motion } from 'framer-motion'

const BG = '#161F23'
const EDGE = '#F2F7FB'
const ACCENT = '#7dd3fc'   // акцент математики (см. CLAUDE.md)
const ACCENT2 = '#facc15'  // отрезки основания после проведения высот
const TEXT = '#F2F7FB'

// Координаты — не в масштабе (см. шапку файла), топология точная:
// изначальные точки основания D-C и вершины A-B, отступ верхних вершин
// пропорционален разности оснований (73-43)/2 = 15 с каждой стороны.
const D = { x: 40, y: 200 }
const C = { x: 660, y: 200 }
const A = { x: 175, y: 90 }
const B = { x: 525, y: 90 }
const A_FOOT = { x: A.x, y: D.y } // основание левой высоты
const B_FOOT = { x: B.x, y: D.y } // основание правой высоты

export type TrapezoidStage = 0 | 1 | 2 | 3 | 4 | 5

type Props = {
    stage: TrapezoidStage
    segmentValue?: string | null   // "15" — подпись на отрезках D-A_FOOT/B_FOOT (этап 3+)
    legValue?: string | null       // "21" — подпись на боковой стороне A-D (этап 5)
}

const line = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`

export const TrapezoidDiagram = ({ stage, segmentValue, legValue }: Props) => {
    const legsHighlighted = stage >= 1
    const basesLabeled = stage >= 1
    const altitudesDrawn = stage >= 2
    const segmentsHighlighted = stage >= 2
    const segmentsLabeled = stage >= 3 && !!segmentValue
    const triangleHighlighted = stage >= 4
    const legLabeled = stage >= 5 && !!legValue

    return (
        <div className="flex items-center justify-center py-6 px-4 mb-4 bg-[#161F23] border-2 border-[#3A464E] rounded-xl overflow-hidden">
            <svg viewBox="0 0 700 260" width="100%" height="auto" style={{ maxWidth: 480 }}>
                <rect x="0" y="0" width="700" height="260" fill={BG} />

                {/* подсветка правого треугольника (этап 4) — под линиями трапеции */}
                {triangleHighlighted && (
                    <motion.polygon
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.22 }}
                        transition={{ duration: 0.4 }}
                        points={`${A.x},${A.y} ${D.x},${D.y} ${A_FOOT.x},${A_FOOT.y}`}
                        fill={ACCENT}
                    />
                )}

                {/* верхнее основание A-B */}
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={3} strokeLinecap="round" />
                {/* нижнее основание D-C */}
                <line x1={D.x} y1={D.y} x2={C.x} y2={C.y} stroke={EDGE} strokeWidth={3} strokeLinecap="round" />

                {/* боковые стороны — подсвечиваются акцентом с этапа 1 */}
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

                {/* высоты — дорисовываются анимированно (pathLength) на этапе 2 */}
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

                {/* отрезки основания слева/справа от высот — жёлтый акцент с этапа 2 */}
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

                {/* подписи оснований 43/73 */}
                {basesLabeled && (
                    <>
                        <motion.text
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            x={(A.x + B.x) / 2} y={A.y - 14}
                            textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={22} fontWeight={700} fill={TEXT}
                        >43</motion.text>
                        <motion.text
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            x={(D.x + C.x) / 2} y={D.y + 30}
                            textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={22} fontWeight={700} fill={TEXT}
                        >73</motion.text>
                    </>
                )}

                {/* подписи отрезков 15/15 */}
                {segmentsLabeled && (
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

                {/* подпись боковой стороны 21 (финал) */}
                {legLabeled && (
                    <motion.text
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, type: 'spring', bounce: 0.55 }}
                        x={(A.x + D.x) / 2 - 30} y={(A.y + D.y) / 2}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={ACCENT}
                    >{legValue}</motion.text>
                )}
            </svg>
        </div>
    )
}
