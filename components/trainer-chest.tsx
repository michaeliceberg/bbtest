// components/trainer-chest.tsx
//
// Сундук в конце дерева навыков. Открывается тремя тапами (с вибрацией
// на каждый тап), после чего показывает случайную редкость награды.
// Пока чисто визуальный элемент — начисление реальных наград (очков/гемов)
// можно подключить позже через серверный экшен.

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

const RARITIES: { key: Rarity; label: string; weight: number; color: string; glow: string }[] = [
    { key: 'common', label: 'ОБЫЧНЫЙ', weight: 55, color: '#9ca3af', glow: 'rgba(156,163,175,0.55)' },
    { key: 'rare', label: 'РЕДКИЙ', weight: 28, color: '#38bdf8', glow: 'rgba(56,189,248,0.55)' },
    { key: 'epic', label: 'ЭПИЧЕСКИЙ', weight: 13, color: '#a78bfa', glow: 'rgba(167,139,250,0.6)' },
    { key: 'legendary', label: 'ЛЕГЕНДАРНЫЙ', weight: 4, color: '#fbbf24', glow: 'rgba(251,191,36,0.65)' },
]

const rollRarity = () => {
    const total = RARITIES.reduce((a, b) => a + b.weight, 0)
    let r = Math.random() * total
    for (const item of RARITIES) {
        if (r < item.weight) return item
        r -= item.weight
    }
    return RARITIES[0]
}

const vibrate = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate(pattern)
        } catch {
            // игнорируем — вибрация не критична
        }
    }
}

type Props = {
    size?: number
}

export const TrainerChest = ({ size = 76 }: Props) => {
    const [taps, setTaps] = useState(0)
    const [opened, setOpened] = useState(false)
    const [result, setResult] = useState<(typeof RARITIES)[number] | null>(null)
    const [bump, setBump] = useState(false)

    const handleTap = () => {
        if (opened) return
        const nextTaps = taps + 1
        setTaps(nextTaps)
        setBump(true)
        window.setTimeout(() => setBump(false), 180)

        if (nextTaps >= 3) {
            vibrate([40, 30, 40, 30, 90])
            const picked = rollRarity()
            setResult(picked)
            window.setTimeout(() => setOpened(true), 120)
        } else {
            vibrate(35)
        }
    }

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            <button
                type="button"
                onClick={handleTap}
                aria-label="Открыть сундук"
                className="relative flex items-center justify-center"
                style={{ width: size + 20, height: size + 20 }}
            >
                {opened && result && (
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            boxShadow: `0 0 0 0 ${result.glow}`,
                            animation: 'chestGlow 1.4s ease-out 1',
                        }}
                    />
                )}

                <div
                    className="transition-transform"
                    style={{
                        transform: bump ? 'scale(0.9)' : 'scale(1)',
                        width: size,
                        height: size,
                    }}
                >
                    <svg viewBox="0 0 100 100" width={size} height={size}>
                        <rect x="14" y="46" width="72" height="40" rx="8" fill={opened ? (result?.color ?? '#9ca3af') : '#3a2c1e'} stroke="#20160d" strokeWidth="3" />
                        <rect x="10" y="30" width="80" height="20" rx="7"
                            fill={opened ? (result?.color ?? '#9ca3af') : '#4a3524'}
                            stroke="#20160d" strokeWidth="3"
                            style={{
                                transformBox: 'fill-box',
                                transformOrigin: 'bottom',
                                transition: 'transform 400ms ease',
                                transform: opened ? 'rotate(-55deg) translateY(-4px)' : 'rotate(0deg)',
                            }}
                        />
                        <circle cx="50" cy="58" r="7" fill="#20160d" />
                    </svg>
                </div>

                {!opened && (
                    <div className="absolute -bottom-1 flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className={cn('h-1.5 w-1.5 rounded-full', i < taps ? 'bg-amber-400' : 'bg-[#3a4358]')}
                            />
                        ))}
                    </div>
                )}
            </button>

            <style>{`
                @keyframes chestGlow {
                    0% { box-shadow: 0 0 0 0 var(--glow, rgba(255,255,255,0.5)); }
                    60% { box-shadow: 0 0 0 26px rgba(255,255,255,0); }
                    100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
                }
            `}</style>

            {!opened && (
                <span className="text-[11px] font-medium text-[#6b7280]">
                    {taps === 0 ? 'Тапни, чтобы открыть' : `${taps}/3`}
                </span>
            )}

            {opened && result && (
                <span className="text-[12px] font-bold" style={{ color: result.color }}>
                    {result.label}
                </span>
            )}
        </div>
    )
}

export default TrainerChest
