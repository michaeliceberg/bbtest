'use client'

// «Сложность» задания (1 — легко, 2 — средне, 3 — тяжело). Несколько вариантов дизайна,
// сравнить их можно на /test-difficulty. Картинки — public/diff-catdogs/{easy,norm,hard}-N.webp.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Skull } from 'lucide-react'
import { hexToRgba } from '@/src/constants/lessonButtonColors'

export type DifficultyLevel = 1 | 2 | 3
export type DifficultyVariant = 'squares' | 'skulls' | 'flames' | 'meter' | 'pill' | 'bars'

export const DIFF_COLORS = { 1: '#78C93C', 2: '#F2C35B', 3: '#DC605B' } as const
const DIFF_WORDS = { 1: 'Изи', 2: 'Норм', 3: 'Хард' } as const
const DIFF_PICS = { 1: { name: 'easy', count: 9 }, 2: { name: 'norm', count: 11 }, 3: { name: 'hard', count: 9 } } as const

// Картинка выбирается после монтирования — без рассинхрона сервера и браузера.
const usePic = (level: DifficultyLevel) => {
    const [pic, setPic] = useState<string | null>(null)
    useEffect(() => {
        const d = DIFF_PICS[level]
        setPic(`/diff-catdogs/${d.name}-${1 + Math.floor(Math.random() * d.count)}.webp`)
    }, [level])
    return pic
}

const Pic = ({ level, size = 'w-12 h-12' }: { level: DifficultyLevel; size?: string }) => {
    const pic = usePic(level)
    return (
        <div className={size}>
            {pic && <motion.img key={pic} src={pic} alt="" className="w-full h-full object-contain"
                initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 12 }} />}
        </div>
    )
}

const Label = () => <span className="text-[9px] font-black uppercase text-[#9AA7B0]">сложность</span>

const Frame = ({ level, children }: { level: DifficultyLevel; children: React.ReactNode }) => (
    <div className="shrink-0 flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-xl border-2 bg-[#161F23]"
        style={{ borderColor: hexToRgba(DIFF_COLORS[level], 0.45) }}>
        {children}
    </div>
)

// Три значка: заполненные — цветом уровня (появляются по очереди с отскоком), пустые — серые.
const Icons = ({ level, icon }: { level: DifficultyLevel; icon: 'skull' | 'flame' }) => {
    const color = DIFF_COLORS[level]
    const Icon = icon === 'skull' ? Skull : Flame
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => {
                const on = i <= level
                return (
                    <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 10, delay: 0.15 + i * 0.12 }}>
                        <Icon className="w-4 h-4" strokeWidth={2.4} color={on ? color : '#3A464E'}
                            fill={on ? hexToRgba(color, 0.35) : 'transparent'} />
                    </motion.span>
                )
            })}
        </div>
    )
}

// Полукруглая шкала со стрелкой (как спидометр).
const Meter = ({ level }: { level: DifficultyLevel }) => {
    const color = DIFF_COLORS[level]
    const angle = { 1: -60, 2: 0, 3: 60 }[level]
    const seg = (a0: number, a1: number) => {
        const r = 20, cx = 26, cy = 26
        const p = (a: number) => [cx + r * Math.cos(((a - 90) * Math.PI) / 180), cy + r * Math.sin(((a - 90) * Math.PI) / 180)]
        const [x0, y0] = p(a0), [x1, y1] = p(a1)
        return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`
    }
    return (
        <svg viewBox="0 0 52 32" className="w-14 h-9">
            <path d={seg(-88, -32)} stroke={DIFF_COLORS[1]} strokeWidth={5} fill="none" strokeLinecap="round" opacity={level === 1 ? 1 : 0.3} />
            <path d={seg(-26, 26)} stroke={DIFF_COLORS[2]} strokeWidth={5} fill="none" strokeLinecap="round" opacity={level === 2 ? 1 : 0.3} />
            <path d={seg(32, 88)} stroke={DIFF_COLORS[3]} strokeWidth={5} fill="none" strokeLinecap="round" opacity={level === 3 ? 1 : 0.3} />
            <motion.g style={{ originX: '26px', originY: '26px' }} initial={{ rotate: -90 }} animate={{ rotate: angle }}
                transition={{ type: 'spring', stiffness: 140, damping: 8, delay: 0.2 }}>
                <line x1={26} y1={26} x2={26} y2={10} stroke="#F2F7FB" strokeWidth={2.5} strokeLinecap="round" />
            </motion.g>
            <circle cx={26} cy={26} r={3.2} fill={color} />
        </svg>
    )
}

// «Уровень сигнала»: три столбика растущей высоты.
const Bars = ({ level }: { level: DifficultyLevel }) => {
    const color = DIFF_COLORS[level]
    return (
        <div className="flex items-end gap-1 h-5">
            {[1, 2, 3].map((i) => (
                <motion.span key={i} className="w-2.5 rounded-sm origin-bottom"
                    style={{ height: `${i * 33}%`, backgroundColor: i <= level ? color : '#2A363D' }}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 + i * 0.12 }} />
            ))}
        </div>
    )
}

export const DifficultyBadge = ({ level, variant = 'squares' }: { level: DifficultyLevel; variant?: DifficultyVariant }) => {
    const color = DIFF_COLORS[level]
    if (variant === 'pill') {
        // Компактно в одну строку: слово + черепки, без картинки.
        return (
            <div className="shrink-0 flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full border-2"
                style={{ borderColor: hexToRgba(color, 0.55), backgroundColor: hexToRgba(color, 0.12) }}>
                <span className="text-xs font-black uppercase" style={{ color }}>{DIFF_WORDS[level]}</span>
                <Icons level={level} icon="skull" />
            </div>
        )
    }
    return (
        <Frame level={level}>
            <Label />
            <Pic level={level} />
            {variant === 'squares' && (
                <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                        <span key={i} className="w-3.5 h-3.5 rounded-[4px] border"
                            style={i <= level ? { backgroundColor: color, borderColor: color } : { backgroundColor: 'transparent', borderColor: '#3A464E' }} />
                    ))}
                </div>
            )}
            {variant === 'skulls' && <Icons level={level} icon="skull" />}
            {variant === 'flames' && <Icons level={level} icon="flame" />}
            {variant === 'meter' && <Meter level={level} />}
            {variant === 'bars' && <Bars level={level} />}
        </Frame>
    )
}
