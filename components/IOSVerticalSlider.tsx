// components/IOSVerticalSlider.tsx
//
// Вертикальный слайдер в духе iOS-слайдера яркости (motion.dev/examples/
// react-ios-slider) — тянешь вверх/вниз, заливка растёт/убывает снизу,
// на перетяге за край — упругое "сжатие/растяжение" (squish/stretch), как
// в оригинале. Значение — 0..100, вместо иконки солнца в оригинале здесь
// число самого значения (по прямой просьбе пользователя, для вопроса
// "на какой балл планируешь сдать ЕГЭ?").
//
// Полный авторский исходник примера платный (Motion+) — этот компонент
// написан с нуля, повторяя ТОЛЬКО описанное поведение (drag по всей
// плашке, упругий перетяг на краях, число на фиксированном месте), не
// копирует чужой код.

'use client'

import { useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'

const TRACK_HEIGHT = 260
const TRACK_WIDTH = 76
// Максимальный визуальный "перетяг" в проценты значения — насколько
// дальше 0/100 можно утянуть плашку, прежде чем сопротивление станет
// ощутимым (сам эффект — chisto визуальный, value всегда остаётся 0..100).
const MAX_OVERPULL = 26

type Props = {
    value: number
    onChange: (value: number) => void
}

export const IOSVerticalSlider = ({ value, onChange }: Props) => {
    // overpull — насколько дальше границы утянута плашка ПРЯМО СЕЙЧАС
    // (0 — в пределах трека, >0 — тянут выше 100, <0 — тянут ниже 0).
    // Используется только для squish/stretch-анимации заливки, не влияет
    // на само value (то всегда честно зажато в 0..100).
    const [overpull, setOverpull] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startValueRef = useRef(value)

    const handlePanStart = () => {
        setIsDragging(true)
        startValueRef.current = value
    }

    const handlePan = (_: unknown, info: PanInfo) => {
        // Движение вверх (info.offset.y < 0) увеличивает значение.
        const deltaValue = (-info.offset.y / TRACK_HEIGHT) * 100
        const raw = startValueRef.current + deltaValue
        const clamped = Math.max(0, Math.min(100, raw))
        onChange(Math.round(clamped))
        setOverpull(raw < 0 ? raw : raw > 100 ? raw - 100 : 0)
    }

    const handlePanEnd = () => {
        setIsDragging(false)
        setOverpull(0)
    }

    // Растяжение заливки при перетяге — та же идея, что squish/stretch в
    // оригинале: чем сильнее тянут за край, тем заметнее плашка "тянется"
    // в ту же сторону, пружинисто возвращаясь на месте отпускания.
    const stretch = 1 + Math.min(Math.abs(overpull), MAX_OVERPULL) / MAX_OVERPULL * 0.18

    return (
        <div
            className="relative select-none touch-none"
            style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
        >
            <motion.div
                onPanStart={handlePanStart}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                className="absolute inset-0 rounded-full bg-[#1A252B] border-2 border-[#3A464E] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner"
            >
                {/* Заливка снизу — высота = value%, растягивается вверх/вниз
                    при перетяге (transform-origin у соответствующего края). */}
                <motion.div
                    className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-violet-600 via-fuchsia-500 to-violet-400 rounded-full"
                    animate={{
                        height: `${value}%`,
                        scaleY: isDragging ? stretch : 1,
                    }}
                    transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 24 }}
                    style={{ transformOrigin: overpull > 0 ? 'top' : 'bottom' }}
                />

                {/* Число — фиксировано у нижнего края плашки (там же, где в
                    оригинале сидит иконка солнца), поверх заливки. */}
                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center pointer-events-none">
                    <span className="text-lg font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
                        {value}
                    </span>
                </div>
            </motion.div>
        </div>
    )
}
