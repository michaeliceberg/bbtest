// components/LightningStrike.tsx
//
// Удар молнии в тренажёре — покадровая анимация из SVG-кадров пользователя,
// 24 fps (кадры: components/lightning-frames.ts, генерируются
// scripts/genLightningFrames.py из public/SVGs/manyStrikes[Blue]/*.svg).
//   yellow — 24 кадра (1с), 5 подряд, звук /StrikeSnd.wav
//   blue   — 36 кадров (1.5с), 8 подряд, звук /StrikeBlueSound.wav
// Кадры переключаются setInterval'ом (не rAF): одна смена <path> за кадр —
// дёшево и на iPhone. Показывается поверх экрана (TQUIZ.tsx).

'use client'

import { useEffect, useRef, useState } from 'react'
import { playSound } from '@/lib/sound'
import { LIGHTNING_BLUE, LIGHTNING_YELLOW, type LightningSet } from '@/components/lightning-frames'

export type LightningVariant = 'yellow' | 'blue'

const VARIANTS: Record<LightningVariant, { set: LightningSet; sound: string; flash: string }> = {
    yellow: { set: LIGHTNING_YELLOW, sound: '/StrikeSnd.wav', flash: '#FFE042' },
    blue: { set: LIGHTNING_BLUE, sound: '/StrikeBlueSound.wav', flash: '#6BFFFF' },
}

const FPS = 24

export const LightningStrike = ({ variant = 'yellow', onDone }: { variant?: LightningVariant; onDone: () => void }) => {
    const { set, sound, flash } = VARIANTS[variant]
    const [frame, setFrame] = useState(0)
    // onDone в ref — иначе новый колбэк на каждом рендере перезапускал бы таймер.
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone

    useEffect(() => {
        playSound(sound)
        let i = 0
        const id = window.setInterval(() => {
            i += 1
            if (i >= set.frames.length) {
                window.clearInterval(id)
                onDoneRef.current()
                return
            }
            setFrame(i)
        }, 1000 / FPS)
        return () => window.clearInterval(id)
    }, [set, sound])

    const f = set.frames[frame]
    const durationS = set.frames.length / FPS
    return (
        <div className="pointer-events-none fixed inset-0 z-[65]">
            {/* Короткая вспышка экрана в цвет молнии */}
            <div
                className="animate-lightning-flash absolute inset-0"
                style={{ background: `radial-gradient(ellipse at 50% 70%, ${flash}55, transparent 65%)`, animationDuration: `${durationS}s` }}
            />
            {/* Явные размеры на весь экран: при h-full + w-auto Safari на iPhone
                считал ширину инлайн-SVG нулевой. */}
            <svg viewBox={set.viewBox} preserveAspectRatio="xMidYMax meet" width="100%" height="100%" className="absolute inset-0 h-full w-full">
                <g transform={`translate(${f.tx} ${f.ty})`}>
                    {f.paths.map((p, i) => (
                        <path key={i} d={p.d} fill={p.fill} />
                    ))}
                </g>
            </svg>
        </div>
    )
}

export default LightningStrike
