// components/trainer-progress-bar.tsx
//
// Верхний прогресс-бар урока тренажёра. Обычно зелёный; во время серии
// «загорается» в цвет молнии, которая её отметила:
//   5+ подряд — жёлтый (после жёлтой молнии), 8+ подряд — голубой (после синей).
// В режиме серии: градиент, бегущий блик, пульсирующее свечение и искры,
// вылетающие из кончика полоски в случайные моменты. Ошибка сбрасывает
// серию (streak = 0) — полоска плавно гаснет обратно в зелёный.
// Все анимации — только transform/opacity (дёшево на iPhone, см. CLAUDE.md).

'use client'

import { useEffect, useRef, useState } from 'react'

type Mode = 'normal' | 'yellow' | 'blue'

const MODE_STYLE: Record<Exclude<Mode, 'normal'>, { gradient: string; glow: string; spark: string }> = {
    yellow: {
        gradient: 'linear-gradient(90deg, #F5B300 0%, #FFE042 60%, #FFF6B0 100%)',
        glow: 'rgba(255,224,66,0.75)',
        spark: '#FFE042',
    },
    blue: {
        gradient: 'linear-gradient(90deg, #1C9CC4 0%, #6BFFFF 60%, #DFFFFF 100%)',
        glow: 'rgba(107,255,255,0.75)',
        spark: '#6BFFFF',
    },
}

export const streakMode = (streak: number): Mode => (streak >= 8 ? 'blue' : streak >= 5 ? 'yellow' : 'normal')

type Spark = { id: number; dx: number; dy: number; size: number; dur: number }

export const TrainerProgressBar = ({ percent, streak }: { percent: number; streak: number }) => {
    const mode = streakMode(streak)
    const [sparks, setSparks] = useState<Spark[]>([])
    const idRef = useRef(0)

    // Искры: пока горит серия — случайно, раз в 200–650 мс, 1–2 искры.
    useEffect(() => {
        if (mode === 'normal') {
            setSparks([])
            return
        }
        let timer: number
        const spawn = () => {
            const count = Math.random() < 0.35 ? 2 : 1
            const fresh: Spark[] = Array.from({ length: count }, () => ({
                id: ++idRef.current,
                dx: (Math.random() - 0.3) * 40,
                dy: -(10 + Math.random() * 26),
                size: 2 + Math.random() * 3,
                dur: 450 + Math.random() * 350,
            }))
            setSparks((prev) => [...prev.slice(-12), ...fresh])
            fresh.forEach((sp) => window.setTimeout(() => setSparks((prev) => prev.filter((p) => p.id !== sp.id)), sp.dur + 50))
            timer = window.setTimeout(spawn, 200 + Math.random() * 450)
        }
        spawn()
        return () => window.clearTimeout(timer)
    }, [mode])

    const style = mode === 'normal' ? null : MODE_STYLE[mode]

    return (
        <div className="relative flex-1">
            {/* Пульсирующее свечение под полоской (только opacity) */}
            <div
                className={`pointer-events-none absolute inset-y-[-3px] left-0 rounded-full transition-opacity duration-500 ${style ? 'animate-glow-pulse' : ''}`}
                style={{
                    width: `${percent}%`,
                    boxShadow: style ? `0 0 12px 2px ${style.glow}` : 'none',
                    opacity: style ? undefined : 0,
                }}
            />
            <div className="relative h-2 overflow-hidden rounded-full bg-[#2A3A4A]">
                <div className="relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }}>
                    {/* Слои цветов — переключаются плавной сменой прозрачности */}
                    <div className="absolute inset-0" style={{ backgroundColor: '#A1D151' }} />
                    <div
                        className="absolute inset-0 transition-opacity duration-500"
                        style={{ background: MODE_STYLE.yellow.gradient, opacity: mode === 'yellow' ? 1 : 0 }}
                    />
                    <div
                        className="absolute inset-0 transition-opacity duration-500"
                        style={{ background: MODE_STYLE.blue.gradient, opacity: mode === 'blue' ? 1 : 0 }}
                    />
                    {/* Бегущий блик в режиме серии */}
                    {style && <div className="animate-progress-shine pointer-events-none absolute inset-y-0 left-0 w-1/3" />}
                </div>
            </div>
            {/* Искры из кончика полоски */}
            {style && (
                <div className="pointer-events-none absolute top-1/2" style={{ left: `${percent}%` }}>
                    {sparks.map((sp) => (
                        <span
                            key={sp.id}
                            className="animate-progress-spark absolute rounded-full"
                            style={
                                {
                                    width: sp.size,
                                    height: sp.size,
                                    marginLeft: -sp.size / 2,
                                    marginTop: -sp.size / 2,
                                    backgroundColor: style.spark,
                                    boxShadow: `0 0 6px ${style.spark}`,
                                    animationDuration: `${sp.dur}ms`,
                                    '--spark-dx': `${sp.dx}px`,
                                    '--spark-dy': `${sp.dy}px`,
                                } as React.CSSProperties
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default TrainerProgressBar
