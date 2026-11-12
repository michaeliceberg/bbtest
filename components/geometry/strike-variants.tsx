'use client'

// components/geometry/strike-variants.tsx — способы «зачеркнуть» кусок формулы (разборы логарифмов 470/471).
// Линии заданы в долях прямоугольника зачёркиваемого элемента (0..1), рисуются через pathLength.
// Вариант для уроков — STRIKE_VARIANT; все варианты можно сравнить на /test-strike.

import { motion } from 'framer-motion'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

type Seg = [number, number, number, number]
export type StrikeVariant = { id: string; name: string; color: string; width: number; lines: Seg[] }

const PINK = GGEGE_PALETTE.raspberry.button
const WHITE = '#F2F7FB'
const YELLOW = '#FFD43B'

export const STRIKE_VARIANTS: StrikeVariant[] = [
    { id: 'diag-down', name: 'Диагональ «\\», малиновая', color: PINK, width: 4, lines: [[0, 0, 1, 1]] },
    { id: 'diag-up', name: 'Диагональ «/», малиновая', color: PINK, width: 4, lines: [[0, 1, 1, 0]] },
    { id: 'cross', name: 'Крест, малиновый', color: PINK, width: 3.5, lines: [[0, 0, 1, 1], [0, 1, 1, 0]] },
    { id: 'diag-white', name: 'Диагональ «\\», белая', color: WHITE, width: 4, lines: [[0, 0, 1, 1]] },
    { id: 'cross-yellow', name: 'Крест, жёлтый', color: YELLOW, width: 3.5, lines: [[0, 0, 1, 1], [0, 1, 1, 0]] },
    { id: 'double', name: 'Две диагонали «\\\\», малиновые', color: PINK, width: 3, lines: [[0, 0.2, 0.8, 1], [0.2, 0, 1, 0.8]] },
    { id: 'flat-pink', name: 'Горизонталь, толстая малиновая', color: PINK, width: 5, lines: [[0, 0.5, 1, 0.5]] },
]

export const STRIKE_VARIANT = STRIKE_VARIANTS[0]

// Зачёркивание одного элемента: rect — его координаты в контейнере (px).
export const StrikeMark = ({ rect, variant = STRIKE_VARIANT, delay = 0 }: { rect: { x: number; y: number; w: number; h: number }; variant?: StrikeVariant; delay?: number }) => {
    const pad = 4
    const w = rect.w + pad * 2, h = rect.h + pad * 2
    return (
        <svg className="pointer-events-none absolute" style={{ left: rect.x - pad, top: rect.y - pad, width: w, height: h, overflow: 'visible', zIndex: 4 }}>
            {variant.lines.map((l, i) => (
                <motion.line
                    key={i}
                    x1={l[0] * w} y1={l[1] * h} x2={l[2] * w} y2={l[3] * h}
                    stroke={variant.color} strokeWidth={variant.width} strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: delay + i * 0.3 }}
                />
            ))}
        </svg>
    )
}
