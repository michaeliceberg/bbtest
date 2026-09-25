// components/trainer-progress-bar.tsx
//
// Верхний прогресс-бар урока тренажёра. Обычно зелёный; во время серии
// «загорается» в цвет молнии, которая её отметила:
//   5+ подряд — жёлтый (после жёлтой молнии), 8+ подряд — голубой (после синей).
// В режиме серии:
//   - градиент + бегущий блик + пульсирующее свечение;
//   - светящийся пульсирующий «наконечник» на кончике полоски;
//   - искры из кончика (чаще, по 1–3, часть крупных и дальних);
//   - угольки, поднимающиеся из случайных мест заполненной части;
//   - вспышка-кольцо в момент, когда серия загорается / переходит в голубой.
// Голубой режим интенсивнее жёлтого. Ошибка сбрасывает серию → плавно
// обратно в зелёный. Всё только на transform/opacity (дёшево на iPhone),
// число частиц ограничено (MAX_PARTICLES).

'use client'

import { useEffect, useRef, useState } from 'react'

type Mode = 'normal' | 'yellow' | 'blue'

const MODE_STYLE: Record<Exclude<Mode, 'normal'>, { gradient: string; glow: string; spark: string; hot: string }> = {
    yellow: {
        gradient: 'linear-gradient(90deg, #F5B300 0%, #FFE042 60%, #FFF6B0 100%)',
        glow: 'rgba(255,224,66,0.75)',
        spark: '#FFE042',
        hot: '#FFF8D0',
    },
    blue: {
        gradient: 'linear-gradient(90deg, #1C9CC4 0%, #6BFFFF 60%, #DFFFFF 100%)',
        glow: 'rgba(107,255,255,0.75)',
        spark: '#6BFFFF',
        hot: '#E8FFFF',
    },
}

// Частота/интенсивность по режиму: [мин. пауза, разброс паузы] в мс.
const INTENSITY: Record<Exclude<Mode, 'normal'>, { tipDelay: [number, number]; emberDelay: [number, number]; maxBurst: number }> = {
    yellow: { tipDelay: [110, 260], emberDelay: [180, 380], maxBurst: 2 },
    blue: { tipDelay: [70, 180], emberDelay: [110, 260], maxBurst: 3 },
}

const MAX_PARTICLES = 28

export const streakMode = (streak: number): Mode => (streak >= 8 ? 'blue' : streak >= 5 ? 'yellow' : 'normal')

// x — позиция старта в % ширины полоски; dx/dy — куда летит (px).
type Particle = { id: number; x: number; dx: number; dy: number; size: number; dur: number; hot: boolean }

export const TrainerProgressBar = ({ percent, streak }: { percent: number; streak: number }) => {
    const mode = streakMode(streak)
    const [particles, setParticles] = useState<Particle[]>([])
    const [flareKey, setFlareKey] = useState(0)
    const idRef = useRef(0)
    const percentRef = useRef(percent)
    percentRef.current = percent

    // Вспышка-кольцо при включении серии и при переходе жёлтый → голубой.
    useEffect(() => {
        if (mode !== 'normal') setFlareKey((k) => k + 1)
    }, [mode])

    useEffect(() => {
        if (mode === 'normal') {
            setParticles([])
            return
        }
        const cfg = INTENSITY[mode]
        const timers: number[] = []
        const add = (fresh: Particle[]) => {
            setParticles((prev) => [...prev, ...fresh].slice(-MAX_PARTICLES))
            fresh.forEach((p) =>
                timers.push(window.setTimeout(() => setParticles((prev) => prev.filter((q) => q.id !== p.id)), p.dur + 60)),
            )
        }

        // Искры из кончика
        const spawnTip = () => {
            const count = 1 + Math.floor(Math.random() * cfg.maxBurst)
            add(
                Array.from({ length: count }, () => {
                    const big = Math.random() < 0.25
                    return {
                        id: ++idRef.current,
                        x: percentRef.current,
                        dx: (Math.random() - 0.25) * (big ? 70 : 44),
                        dy: -((big ? 22 : 10) + Math.random() * (big ? 30 : 24)),
                        size: big ? 4 + Math.random() * 2 : 2 + Math.random() * 2.5,
                        dur: (big ? 700 : 450) + Math.random() * 350,
                        hot: big,
                    }
                }),
            )
            timers.push(window.setTimeout(spawnTip, cfg.tipDelay[0] + Math.random() * cfg.tipDelay[1]))
        }

        // Угольки вдоль заполненной части
        const spawnEmber = () => {
            add([
                {
                    id: ++idRef.current,
                    x: Math.random() * percentRef.current,
                    dx: (Math.random() - 0.5) * 10,
                    dy: -(8 + Math.random() * 14),
                    size: 1.5 + Math.random() * 1.5,
                    dur: 600 + Math.random() * 500,
                    hot: false,
                },
            ])
            timers.push(window.setTimeout(spawnEmber, cfg.emberDelay[0] + Math.random() * cfg.emberDelay[1]))
        }

        spawnTip()
        spawnEmber()
        return () => timers.forEach((t) => window.clearTimeout(t))
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

            {style && (
                <div className="pointer-events-none absolute inset-0">
                    {/* Светящийся наконечник на кончике полоски */}
                    <div className="absolute top-1/2 transition-[left] duration-300 ease-out" style={{ left: `${percent}%` }}>
                        <span
                            className="animate-progress-tip absolute block rounded-full"
                            style={{
                                width: 10,
                                height: 10,
                                marginLeft: -5,
                                marginTop: -5,
                                background: `radial-gradient(circle, ${style.hot} 0%, ${style.spark} 45%, transparent 75%)`,
                            }}
                        />
                        {/* Вспышка-кольцо при загорании серии */}
                        <span
                            key={flareKey}
                            className="animate-progress-flare absolute block rounded-full"
                            style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, border: `2px solid ${style.spark}` }}
                        />
                    </div>

                    {/* Искры и угольки */}
                    {particles.map((p) => (
                        <span
                            key={p.id}
                            className="animate-progress-spark absolute top-1/2 rounded-full"
                            style={
                                {
                                    left: `${p.x}%`,
                                    width: p.size,
                                    height: p.size,
                                    marginLeft: -p.size / 2,
                                    marginTop: -p.size / 2,
                                    backgroundColor: p.hot ? style.hot : style.spark,
                                    boxShadow: `0 0 ${p.hot ? 8 : 5}px ${style.spark}`,
                                    animationDuration: `${p.dur}ms`,
                                    '--spark-dx': `${p.dx}px`,
                                    '--spark-dy': `${p.dy}px`,
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
