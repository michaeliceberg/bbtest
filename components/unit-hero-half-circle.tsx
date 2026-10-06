'use client'

// Анимация в шапке карточки юнита «Тригонометрическая окружность (БАЗА)»:
// та же сцена, что в уроке «Знакомство с окружностью» — «π — это ПОЛОВИНА
// окружности», π = 180°. Проигрывается один раз, когда карточка попала в экран.

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// В t_units.image_src этого юнита лежит этот маркер вместо пути к картинке.
export const HERO_HALF_CIRCLE = '__anim_half_circle__'
export const HERO_HALF_CIRCLE_TITLE = ['Тригонометрическая', 'окружность (БАЗА)']

const COLOR = GGEGE_PALETTE.purple.button
const CX = 60
const CY = 60
const R = 52
const ARC = `M ${CX + R} ${CY} A ${R} ${R} 0 0 0 ${CX - R} ${CY}`
const DRAW_S = 1.3

export const HalfCircleHero = () => {
    const ref = useRef<SVGSVGElement>(null)
    const seen = useInView(ref, { once: true, amount: 0.6 })
    return (
        <svg ref={ref} viewBox="0 0 120 68" className="w-[118px] h-auto flex-shrink-0 overflow-visible">
            {seen && (
                <>
                    <motion.path
                        d={`${ARC} L ${CX + R} ${CY} Z`} fill={hexToRgba(COLOR, 0.2)} stroke="none"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: DRAW_S * 0.8, duration: 0.5 }}
                    />
                    <motion.path
                        d={ARC} fill="none" stroke={COLOR} strokeWidth={5} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: DRAW_S, ease: 'easeInOut' }}
                    />
                    <motion.line
                        x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="#F2F7FB" strokeWidth={2} strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: DRAW_S * 0.8 }}
                    />
                    <g transform={`translate(${CX} ${CY - 22})`}>
                        <motion.g
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: DRAW_S + 0.1, type: 'spring', bounce: 0.6 }}
                        >
                            <text textAnchor="middle" dominantBaseline="central" fontSize={16} fill="#F2F7FB"
                                style={{ fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 }}>
                                π = 180°
                            </text>
                        </motion.g>
                    </g>
                </>
            )}
        </svg>
    )
}
