// components/geometry/TangentialQuadDiagram.tsx
//
// Анимированный четырёхугольник ABCD с вписанной окружностью — второй
// интерактивный разбор по шагам (курс "ЕГЭ Математика Профиль" →
// Планиметрия → "Вписанная окружность" → challenge id=4594).
//
// По итогам обратной связи ("надо ЕЩЁ проще... на чертеже не нужно
// вводить маленькие стороны a,b,c,d рисовать радиусы") — диаграмма
// сильно упрощена: только сам четырёхугольник + окружность + (позже)
// крупные числа данных сторон + итоговый периметр. Точки касания и
// пунктирные радиусы, бывшие в первой версии, убраны целиком — вся
// "теорема" объясняется теперь только текстом в TangentialQuadWalkthrough,
// не на самом чертеже.
//
// Геометрия вершин/окружности — настоящий (не на глаз) тангенциальный
// четырёхугольник, посчитан аналитически один раз (см. предыдущую
// версию файла в истории коммитов) — координаты сохранены.
//
// Диаграмма увеличена (maxWidth 480→560, viewBox чуть выше — 340 вместо
// 320, для запаса под подпись у нижней стороны) по прямой просьбе
// пользователя "использовать максимально пространства".

import { motion } from 'framer-motion'

const BG = '#161F23'
const EDGE = '#F2F7FB'
const ACCENT = '#7dd3fc'
const CIRCLE_COLOR = '#5C6B73'
const TEXT = '#F2F7FB'

const O = { x: 350, y: 175 }
const R = 100

const A = { x: 263.7, y: 88.7 }
const B = { x: 431.1, y: 59.2 }
const C = { x: 471.1, y: 286.0 }
const D = { x: 232.6, y: 265.1 }

// Подписи данных сторон (10 у AB, 16 у CD) — выносятся НАРУЖУ от фигуры
// вдоль направления "из центра O через середину стороны", тот же приём,
// что уже использовался для гипотенузы в TrapezoidDiagram.
const mid = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 })
const outward = (mid: { x: number; y: number }, dist: number) => {
    const dx = mid.x - O.x
    const dy = mid.y - O.y
    const len = Math.sqrt(dx * dx + dy * dy)
    return { x: mid.x + (dx / len) * dist, y: mid.y + (dy / len) * dist }
}
const LABEL_AB = outward(mid(A, B), 32)
const LABEL_CD = outward(mid(C, D), 32)

export type TangentialQuadVisual = {
    numbersShown?: boolean          // крупные "10"/"16" у сторон AB/CD
    perimeterValue?: string | null  // итоговый периметр в центре фигуры
}

const numberBounce = {
    initial: { opacity: 0, scale: 5 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, duration: 0.8, bounce: 0.6 },
}

export const TangentialQuadDiagram = ({ numbersShown = false, perimeterValue = null }: TangentialQuadVisual) => {
    return (
        <div className="flex items-center justify-center py-2 px-2 mb-4 bg-[#161F23] rounded-xl overflow-hidden">
            <svg viewBox="0 0 700 340" width="100%" height="auto" style={{ maxWidth: 560 }}>
                <rect x="0" y="0" width="700" height="340" fill={BG} />

                <circle cx={O.x} cy={O.y} r={R} fill="none" stroke={CIRCLE_COLOR} strokeWidth={3} />

                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={5} strokeLinecap="round" />
                <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke={EDGE} strokeWidth={5} strokeLinecap="round" />
                <line x1={C.x} y1={C.y} x2={D.x} y2={D.y} stroke={EDGE} strokeWidth={5} strokeLinecap="round" />
                <line x1={D.x} y1={D.y} x2={A.x} y2={A.y} stroke={EDGE} strokeWidth={5} strokeLinecap="round" />

                <text x={A.x - 18} y={A.y - 8} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={700} fill={TEXT}>A</text>
                <text x={B.x + 18} y={B.y - 8} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={700} fill={TEXT}>B</text>
                <text x={C.x + 18} y={C.y + 8} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={700} fill={TEXT}>C</text>
                <text x={D.x - 18} y={D.y + 8} textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={700} fill={TEXT}>D</text>

                {/* крупные числа данных сторон — bounce-эффект, тот же, что и
                    у чисел в TrapezoidDiagram */}
                <motion.text
                    initial={numberBounce.initial}
                    animate={{ ...numberBounce.animate, opacity: numbersShown ? 1 : 0, scale: numbersShown ? 1 : 5 }}
                    transition={numberBounce.transition}
                    x={LABEL_AB.x} y={LABEL_AB.y}
                    textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={28} fontWeight={800} fill={ACCENT}
                >10</motion.text>
                <motion.text
                    initial={numberBounce.initial}
                    animate={{ ...numberBounce.animate, opacity: numbersShown ? 1 : 0, scale: numbersShown ? 1 : 5 }}
                    transition={numberBounce.transition}
                    x={LABEL_CD.x} y={LABEL_CD.y}
                    textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={28} fontWeight={800} fill={ACCENT}
                >16</motion.text>

                {perimeterValue && (
                    <motion.text
                        initial={numberBounce.initial}
                        animate={numberBounce.animate}
                        transition={numberBounce.transition}
                        x={O.x} y={O.y + 8}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={30} fontWeight={800} fill={ACCENT}
                    >P={perimeterValue}</motion.text>
                )}
            </svg>
        </div>
    )
}
