'use client'

// components/burn-lottie.tsx — «горящие» Lottie-иконки (public/lottie-burn/): звезда для тренировок на карте, голова демона для
// босса, часы для Штурма. Лёгкий режим: анимация рисуется и крутится только пока элемент в зоне видимости (на карте их может быть
// много, а iPhone не любит десятки одновременных Lottie); вне экрана остаётся пустой блок того же размера.

import { useEffect, useRef, useState } from 'react'
import Lottie from '@/components/lottie-player'
import { cn } from '@/lib/utils'

const SRC = {
    star: '/lottie-burn/burn-star.json',
    boss: '/lottie-burn/burn-boss.json',
    oclock: '/lottie-burn/burn-oclock.json',
} as const
export type BurnKind = keyof typeof SRC

export const BurnLottie = ({ kind, className, dim = false, style }: { kind: BurnKind; className?: string; dim?: boolean; style?: React.CSSProperties }) => {
    const ref = useRef<HTMLSpanElement>(null)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return }
        const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '80px' })
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return (
        <span ref={ref} className={cn('inline-block', dim && 'grayscale opacity-50', className)} style={style} aria-hidden>
            {visible ? <Lottie animationData={SRC[kind]} loop autoplay style={{ width: '100%', height: '100%' }} /> : null}
        </span>
    )
}
