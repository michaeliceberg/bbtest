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
const TRACK_WIDTH = 96
// Скругление углов трека/заливки — было rounded-full (капсула), по
// просьбе пользователя сделано более плоским, "похожим на прямоугольник
// с небольшим скруглением" (не зависит от TRACK_WIDTH, в отличие от
// rounded-full — фиксированный пиксельный радиус).
const TRACK_RADIUS = 'rounded-[18px]'
// Максимальный визуальный "перетяг" в проценты значения — насколько
// дальше 0/100 можно утянуть плашку, прежде чем сопротивление станет
// ощутимым (сам эффект — chisto визуальный, value всегда остаётся 0..100).
const MAX_OVERPULL = 26

// Порог, начиная с которого трек получает медленную пульсирующую
// подсветку (см. .animate-slider-glow-pulse в app/globals.css) — тот же
// фиолетово-фуксия акцент, что и у самой заливки слайдера.
const GLOW_THRESHOLD = 80

export type SliderTick = { value: number; label: string }

type Props = {
    value: number
    onChange: (value: number) => void
    // Риски-метки слева от слайдера (например вузовские ориентиры по
    // баллам ЕГЭ) — необязательные, компонент без них ведёт себя как
    // раньше.
    ticks?: SliderTick[]
}

export const IOSVerticalSlider = ({ value, onChange, ticks }: Props) => {
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
        <div className="flex items-center gap-2">
            {/* Риски-метки слева от трека — подпись справа от риски, сама
                риска слева от трека (порядок как просил пользователь:
                "слева от скроллбара риски, и слева от рисок подписи"). */}
            {ticks && ticks.length > 0 && (
                <div className="relative shrink-0" style={{ width: 84, height: TRACK_HEIGHT }}>
                    {ticks.map((tick) => {
                        // Достигнутая риска (значение доехало до/выше неё) —
                        // подпись и сама риска ярче, тот же фиолетовый акцент,
                        // что и у заливки слайдера, по прямой просьбе
                        // пользователя ("при достижении рисок писать названия
                        // более яркими").
                        const reached = value >= tick.value
                        return (
                            <div
                                key={tick.value}
                                className="absolute right-0 flex items-center gap-1.5"
                                style={{ top: TRACK_HEIGHT * (1 - tick.value / 100), transform: 'translateY(-50%)' }}
                            >
                                {/* key меняется РОВНО в момент пересечения порога —
                                    React ремонтирует span и проигрывает entrance
                                    заново (тот же приём key-ремонта, что везде в
                                    проекте вместо AnimatePresence). initial=false
                                    на "недостигнутой" ветке — при уходе НИЖЕ порога
                                    никакого bounce, просто мгновенно меньше/тусклее. */}
                                <motion.span
                                    key={reached ? 'reached' : 'base'}
                                    initial={reached ? { scale: 2.4 } : false}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 14, bounce: 0.6 }}
                                    className={`whitespace-nowrap ${
                                        reached ? 'text-sm font-bold text-white' : 'text-[10px] font-semibold text-[#9AA7B0]'
                                    }`}
                                >
                                    {tick.label}
                                </motion.span>
                                <span
                                    className={`h-[2px] w-3 rounded-full transition-colors duration-300 ${
                                        reached ? 'bg-violet-400' : 'bg-[#5C6B73]'
                                    }`}
                                />
                            </div>
                        )
                    })}
                </div>
            )}

            <div
                className="relative select-none touch-none"
                style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
            >
                <motion.div
                    onPanStart={handlePanStart}
                    onPan={handlePan}
                    onPanEnd={handlePanEnd}
                    className={`absolute inset-0 ${TRACK_RADIUS} bg-[#1A252B] border-2 border-[#3A464E] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner ${
                        value > GLOW_THRESHOLD ? 'animate-slider-glow-pulse' : ''
                    }`}
                >
                    {/* Заливка снизу — высота = value%, растягивается вверх/вниз
                        при перетяге (transform-origin у соответствующего края). */}
                    <motion.div
                        className={`absolute left-0 right-0 bottom-0 bg-gradient-to-t from-violet-600 via-fuchsia-500 to-violet-400 ${TRACK_RADIUS}`}
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
        </div>
    )
}
