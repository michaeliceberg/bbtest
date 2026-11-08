'use client'

// Шаблон «Задача ЕГЭ» для пошаговых разборов: условие на штабной карте (та же картинка, что в Сетометре),
// трафаретный заголовок, красный штамп с номером задания и Команданте с указкой в углу.
// Любую задачу из ЕГЭ в разборах показываем ТОЛЬКО так (Part { t: 'ege' } в scene-engine).

import { motion } from 'framer-motion'
import { Crosshair } from 'lucide-react'
import { stencilFont } from '@/lib/fonts'
import { MathText } from '@/components/geometry/plain-math'

const MAP_EDGE = 34   // нерастянутый край карты на экране
const MAP_SLICE = 110 // тот же край в пикселях public/meter/map.webp
const INK = '#3B2A14'
const STAMP = '#B23A2E'

export function EgeTaskCard({ num, text }: { num?: number; text: string }) {
    return (
        <motion.div className="relative w-full mt-6"
            initial={{ opacity: 0, y: 18, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <div className="relative px-1 py-1"
                style={{ boxSizing: 'border-box', borderStyle: 'solid', borderWidth: MAP_EDGE, borderImageSource: 'url(/meter/map.webp)', borderImageSlice: `${MAP_SLICE} fill`, borderImageRepeat: 'stretch round' }}>
                <div className="-mt-2 mb-2 flex items-center gap-2 pr-14">
                    <Crosshair className="h-5 w-5 shrink-0" style={{ color: STAMP }} strokeWidth={2.6} />
                    <span className={`${stencilFont.className} text-lg uppercase tracking-wide`} style={{ color: INK }}>Задача ЕГЭ</span>
                    {num !== undefined && (
                        <motion.span className={`${stencilFont.className} ml-1 rounded-md border-2 px-1.5 text-sm`}
                            style={{ color: STAMP, borderColor: STAMP }}
                            initial={{ scale: 2.4, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }}
                            transition={{ delay: 0.35, type: 'spring', stiffness: 420, damping: 14 }}>
                            №{num}
                        </motion.span>
                    )}
                </div>
                <div className="text-left text-base md:text-lg font-bold leading-snug whitespace-pre-line" style={{ color: INK }}>
                    <MathText>{text}</MathText>
                </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src="/miguel/miguel-point.webp" alt="" draggable={false}
                className="pointer-events-none absolute -right-3 -top-12 h-20 w-20 select-none"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 16 }} />
        </motion.div>
    )
}
