'use client'
// Анимированный логотип: три слоя (public/logo-anim) — гусь с надписью, вспышка выстрела, монстр.
// Сам по себе стреляет раз в 16 с (globals.css, .logo-anim-*). Нажатие — сразу выстрел (.logo-anim-*-once),
// наведение — золотое свечение. Только transform/opacity (свечение — filter только при наведении).
// Статичная версия целиком — public/ggege-logo-v4.webp.
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const SHOT_MS = 1400

export const AnimatedLogo = ({ className }: { className?: string }) => {
    const [shot, setShot] = useState(0)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fire = () => {
        setShot((n) => n + 1)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setShot(0), SHOT_MS)
    }
    const once = shot > 0
    return (
        <span
            className={cn('logo-anim relative block aspect-[640/400]', className)}
            role="img" aria-label="ggege" onPointerDown={fire}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-anim/base.webp" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`m${shot}`} src="/logo-anim/monster.webp" alt="" draggable={false}
                className={cn('absolute inset-0 w-full h-full', once ? 'logo-anim-monster-once' : 'logo-anim-monster')} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`f${shot}`} src="/logo-anim/flash.webp" alt="" draggable={false}
                className={cn('absolute inset-0 w-full h-full', once ? 'logo-anim-flash-once' : 'logo-anim-flash')} />
        </span>
    )
}
