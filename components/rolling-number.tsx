// components/rolling-number.tsx
//
// Число, цифры которого «прокручиваются» как барабан одометра (в духе
// motion.dev «Number Trend»): каждая цифра — вертикальная лента 0–9, которая
// после старта (`start`) с пружинным затуханием доезжает до нужной цифры,
// сделав один полный оборот. Нецифровые символы («x», «:») стоят на месте.
// Анимируется только transform (дёшево на iPhone).

'use client'

import { motion } from 'framer-motion'

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10) // два оборота ленты

const DigitColumn = ({ digit, start, delay }: { digit: number; start: boolean; delay: number }) => (
    <span aria-hidden className="relative inline-block overflow-hidden align-top" style={{ height: '1em', width: '0.62em' }}>
        <motion.span
            className="absolute left-0 top-0 flex w-full flex-col items-center"
            initial={{ y: '0em' }}
            animate={{ y: start ? `${-(10 + digit)}em` : '0em' }}
            transition={{ type: 'spring', stiffness: 70, damping: 16, mass: 1, delay }}
        >
            {DIGITS.map((d, i) => (
                <span key={i} className="block" style={{ height: '1em', lineHeight: '1em' }}>
                    {d}
                </span>
            ))}
        </motion.span>
    </span>
)

export const RollingNumber = ({ value, start, className, style }: { value: string; start: boolean; className?: string; style?: React.CSSProperties }) => {
    const chars = value.split('')
    let digitIndex = 0
    return (
        <span className={`inline-flex items-start tabular-nums ${className ?? ''}`} style={{ lineHeight: '1em', ...style }} role="img" aria-label={value}>
            {chars.map((ch, i) => {
                if (/\d/.test(ch)) {
                    // Правые (младшие) цифры докручиваются чуть позже — «волна».
                    const delay = digitIndex++ * 0.06
                    return <DigitColumn key={i} digit={Number(ch)} start={start} delay={delay} />
                }
                return (
                    <span key={i} aria-hidden className="inline-block" style={{ height: '1em', lineHeight: '1em' }}>
                        {ch}
                    </span>
                )
            })}
        </span>
    )
}

export default RollingNumber
