// components/LightningStrike.tsx
//
// Удар молнии в тренажёре — покадровая анимация из SVG-кадров пользователя,
// 24 fps (кадры: components/lightning-frames.ts, генерируются
// scripts/genLightningFrames.py из public/SVGs/manyStrikes[Blue]/*.svg).
//   yellow — 24 кадра (1с), 5 подряд, звук /StrikeSnd.m4a
//   blue   — 36 кадров (1.5с), 8 подряд, звук /StrikeBlueSound.m4a
// Кадры переключаются setInterval'ом (не rAF): одна смена <path> за кадр —
// дёшево и на iPhone. Показывается поверх экрана (TQUIZ.tsx).

'use client'

import { useEffect, useRef, useState } from 'react'
import { playSound, preloadSound } from '@/lib/sound'
import { nunitoCyrillicBlack } from '@/lib/fonts'
import { LIGHTNING_BLUE, LIGHTNING_YELLOW, type LightningSet } from '@/components/lightning-frames'

export type LightningVariant = 'yellow' | 'blue'

// stroke — обводка надписи: цвет молнии, но заметно темнее, чтобы белые
// буквы не сливались с самой молнией.
const VARIANTS: Record<LightningVariant, { set: LightningSet; sound: string; flash: string; stroke: string }> = {
    yellow: { set: LIGHTNING_YELLOW, sound: '/StrikeSnd.m4a', flash: '#FFE042', stroke: '#D69C12' },
    blue: { set: LIGHTNING_BLUE, sound: '/StrikeBlueSound.m4a', flash: '#6BFFFF', stroke: '#1C9CC4' },
}

// Надпись (label) держится ещё столько после окончания молнии (по просьбе
// пользователя — 0: уходит сразу, как кончилась молния), затем
// bounce-исчезает (LABEL_OUT_MS), и только потом onDone.
const LABEL_HOLD_MS = 0
const LABEL_OUT_MS = 400

const FPS = 24

// Толщина обводки надписи и её построение кольцом из 16 теней.
const OUTLINE_PX = 4
const outlineShadow = (color: string, r: number) =>
    Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return `${(Math.cos(a) * r).toFixed(2)}px ${(Math.sin(a) * r).toFixed(2)}px 0 ${color}`
    }).join(', ')

// Звуки молний (AAC 192 кбит/с из WAV-оригиналов, public/sounds-originals/) —
// вызывать при открытии урока, чтобы первый удар не ждал загрузки звука.
export const preloadLightningSounds = () => {
    Object.values(VARIANTS).forEach((v) => preloadSound(v.sound))
}

export const LightningStrike = ({ variant = 'yellow', label, onDone }: { variant?: LightningVariant; label?: string; onDone: () => void }) => {
    const { set, sound, flash, stroke } = VARIANTS[variant]
    const [frame, setFrame] = useState(0)
    const [boltDone, setBoltDone] = useState(false)
    const [labelOut, setLabelOut] = useState(false)
    // onDone в ref — иначе новый колбэк на каждом рендере перезапускал бы таймер.
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone

    useEffect(() => {
        playSound(sound)
        const timers: number[] = []
        let i = 0
        const id = window.setInterval(() => {
            i += 1
            if (i >= set.frames.length) {
                window.clearInterval(id)
                setBoltDone(true)
                if (!label) {
                    onDoneRef.current()
                    return
                }
                // Надпись висит ещё секунду, потом bounce-исчезает.
                timers.push(window.setTimeout(() => {
                    setLabelOut(true)
                    timers.push(window.setTimeout(() => onDoneRef.current(), LABEL_OUT_MS))
                }, LABEL_HOLD_MS))
                return
            }
            setFrame(i)
        }, 1000 / FPS)
        return () => {
            window.clearInterval(id)
            timers.forEach((t) => window.clearTimeout(t))
        }
    }, [set, sound, label])

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
            {!boltDone && <svg viewBox={set.viewBox} preserveAspectRatio="xMidYMax meet" width="100%" height="100%" className="absolute inset-0 h-full w-full">
                <g transform={`translate(${f.tx} ${f.ty})`}>
                    {f.paths.map((p, i) => (
                        <path key={i} d={p.d} fill={p.fill} />
                    ))}
                </g>
            </svg>}
            {label && (
                <div className="absolute inset-0 flex items-center justify-center px-4">
                    <span
                        className={`${nunitoCyrillicBlack.className} ${labelOut ? 'animate-combo-label-out' : 'animate-combo-label-in'} select-none whitespace-nowrap text-white`}
                        style={{
                            // Обводка — кольцо теней (без -webkit-text-stroke: тот рисует
                            // острые стыки и даёт «шипы» на углах жирных букв).
                            textShadow: `${outlineShadow(stroke, OUTLINE_PX)}, 0 ${OUTLINE_PX + 2}px 0 ${stroke}, 0 6px 16px rgba(0,0,0,0.45)`,
                            letterSpacing: '0.02em',
                            fontSize: 'clamp(22px, 7vw, 44px)',
                            lineHeight: 1,
                        }}
                    >
                        {label}
                    </span>
                </div>
            )}
        </div>
    )
}

export default LightningStrike
