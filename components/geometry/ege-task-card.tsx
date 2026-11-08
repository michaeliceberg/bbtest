'use client'

// Шаблон «Задача из ЕГЭ» для пошаговых разборов: условие на штабной карте (та же картинка, что в Сетометре),
// трафаретный заголовок, красный штамп с номером задания и Команданте с указкой в углу.
// Любую задачу из ЕГЭ в разборах показываем ТОЛЬКО так (Part { t: 'ege' } в scene-engine).
//
// Текст интерактивный: куски условия размечаются {{ключ|текст}}, а проп focus подсвечивает нужный кусок —
// так ученик учится видеть в условии главное. Два вида подсветки (focusMode):
//   'marker' — жёлтый текстовыделитель под куском, остальной текст как был;
//   'dim'    — весь остальной текст бледнеет, кусок остаётся ярким.

import { motion } from 'framer-motion'
import { Crosshair } from 'lucide-react'
import { stencilFont } from '@/lib/fonts'
import { MathText } from '@/components/geometry/plain-math'

const MAP_EDGE = 34   // нерастянутый край карты на экране
const MAP_SLICE = 110 // тот же край в пикселях public/meter/map.webp
const INK = '#3B2A14'
const STAMP = '#B23A2E'
const MARKER = 'rgba(242, 195, 91, 0.85)'

export type EgeFocusMode = 'marker' | 'dim'

type Seg = { key: string | null; text: string }
const parseSegs = (text: string): Seg[] => {
    const out: Seg[] = []
    const re = /\{\{([^|}]+)\|([^}]+)\}\}/g
    let last = 0, m: RegExpExecArray | null
    while ((m = re.exec(text))) {
        if (m.index > last) out.push({ key: null, text: text.slice(last, m.index) })
        out.push({ key: m[1], text: m[2] })
        last = m.index + m[0].length
    }
    if (last < text.length) out.push({ key: null, text: text.slice(last) })
    return out
}

export function EgeTaskCard({ num, text, focus, focusMode = 'marker' }: { num?: number; text: string; focus?: string | null; focusMode?: EgeFocusMode }) {
    const segs = parseSegs(text)
    return (
        <motion.div className="relative w-full mt-6"
            initial={{ opacity: 0, y: 18, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <div className="relative px-1 py-1"
                style={{ boxSizing: 'border-box', borderStyle: 'solid', borderWidth: MAP_EDGE, borderImageSource: 'url(/meter/map.webp)', borderImageSlice: `${MAP_SLICE} fill`, borderImageRepeat: 'stretch round' }}>
                {/* светлая подложка поверх рисунка карты — чтобы условие читалось везде */}
                <div className="pointer-events-none absolute -inset-3 rounded-lg" style={{ background: 'rgba(250, 240, 214, 0.72)' }} />
                <div className="relative -mt-2 mb-2 flex items-center gap-2 pr-14">
                    <Crosshair className="h-5 w-5 shrink-0" style={{ color: STAMP }} strokeWidth={2.6} />
                    <span className={`${stencilFont.className} text-lg uppercase tracking-wide`} style={{ color: INK }}>Задача из ЕГЭ</span>
                    {num !== undefined && (
                        <motion.span className={`${stencilFont.className} ml-1 rounded-md border-2 px-1.5 text-sm`}
                            style={{ color: STAMP, borderColor: STAMP }}
                            initial={{ scale: 2.4, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }}
                            transition={{ delay: 0.35, type: 'spring', stiffness: 420, damping: 14 }}>
                            №{num}
                        </motion.span>
                    )}
                </div>
                <div className="relative text-left text-base md:text-lg font-bold leading-snug whitespace-pre-line" style={{ color: INK }}>
                    {segs.map((s, i) => {
                        const on = !!focus && s.key === focus
                        const dim = focusMode === 'dim' && !!focus && !on
                        return (
                            <span key={i} className="relative transition-opacity duration-500" style={{ opacity: dim ? 0.22 : 1 }}>
                                {on && focusMode === 'marker' && (
                                    <motion.span key={focus} aria-hidden className="absolute -inset-x-1 inset-y-0 -z-0 rounded-sm"
                                        style={{ background: MARKER, transformOrigin: 'left' }}
                                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                                )}
                                {on && focusMode === 'dim' ? (
                                    <motion.span key={focus} className="relative inline-block"
                                        initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}>
                                        <MathText>{s.text}</MathText>
                                    </motion.span>
                                ) : <span className="relative"><MathText>{s.text}</MathText></span>}
                            </span>
                        )
                    })}
                </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src="/miguel/miguel-point.webp" alt="" draggable={false}
                className="pointer-events-none absolute -right-3 -top-12 h-20 w-20 select-none"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 16 }} />
        </motion.div>
    )
}
