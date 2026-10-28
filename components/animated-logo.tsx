'use client'
// Анимированный логотип: слои (public/logo-anim) — надпись, гусь (отдача при выстреле), монстр, вспышка.
// Сам по себе стреляет раз в 16 с (globals.css, .logo-anim-*). Нажатие — сразу выстрел (.logo-anim-*-once),
// наведение — золотое свечение. Только transform/opacity (свечение — filter только при наведении).
// Статичная версия целиком — public/ggege-logo-v4.webp.
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const SHOT_MS = 1400

export const AnimatedLogo = ({ className }: { className?: string }) => {
    const [shot, setShot] = useState(0)
    // После выстрела по нажатию цикл начинается заново — сдвигаем его, чтобы сам он не выстрелил ещё раз через секунду.
    const [clicked, setClicked] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fire = () => {
        setShot((n) => n + 1)
        setClicked(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setShot(0), SHOT_MS)
    }
    const once = shot > 0
    const loopStyle = !once && clicked ? { animationDelay: '-2.2s' } : undefined
    return (
        <span
            className={cn('logo-anim relative block aspect-[640/400]', className)}
            role="img" aria-label="ggege" onPointerDown={fire}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-anim/base.webp" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`g${shot}`} src="/logo-anim/goose.webp" alt="" draggable={false} style={loopStyle}
                className={cn('absolute inset-0 w-full h-full', once ? 'logo-anim-goose-once' : 'logo-anim-goose')} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`m${shot}`} src="/logo-anim/monster.webp" alt="" draggable={false} style={loopStyle}
                className={cn('absolute inset-0 w-full h-full', once ? 'logo-anim-monster-once' : 'logo-anim-monster')} />
            {/* Вспышка в обёртке с той же отдачей, что у гуся — остаётся у дула, когда гуся отбрасывает. */}
            <span key={`fw${shot}`} style={loopStyle} className={cn('absolute inset-0', once ? 'logo-anim-goose-once' : 'logo-anim-goose')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={`f${shot}`} src="/logo-anim/flash.webp" alt="" draggable={false} style={loopStyle}
                    className={cn('absolute inset-0 w-full h-full', once ? 'logo-anim-flash-once' : 'logo-anim-flash')} />
            </span>
        </span>
    )
}
