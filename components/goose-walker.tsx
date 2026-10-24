'use client'

// components/goose-walker.tsx
//
// Га-Га идёт: покадровая анимация из 3 кадров (public/gaga/walk/walk-1..3.webp — вырезаны из листа Leonardo,
// выровнены по лапам и голове) по кругу 1 → 2 → 3 → 2, ~8 кадров в секунду, плюс покачивание вразвалку
// (CSS .animate-goose-waddle на внешней обёртке — только transform). Не идёт — стоит на кадре 2.
// flip — смотреть влево (когда путь ведёт налево).

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const FRAMES = ['/gaga/walk/walk-1.webp', '/gaga/walk/walk-2.webp', '/gaga/walk/walk-3.webp']
const CYCLE = [0, 1, 2, 1]
const FRAME_MS = 125

export const GooseWalker = ({ walking, flip = false, className }: { walking: boolean; flip?: boolean; className?: string }) => {
    const [step, setStep] = useState(0)
    useEffect(() => {
        // заранее грузим кадры, чтобы при смене не мигало
        FRAMES.forEach((src) => { const i = new Image(); i.src = src })
    }, [])
    useEffect(() => {
        if (!walking) { setStep(1); return }
        const id = setInterval(() => setStep((s) => (s + 1) % CYCLE.length), FRAME_MS)
        return () => clearInterval(id)
    }, [walking])
    const frame = walking ? CYCLE[step] : 1
    return (
        <div className={cn('relative', walking && 'animate-goose-waddle', className)}>
            <div style={{ transform: flip ? 'scaleX(-1)' : undefined }} className="relative w-full h-full">
                {FRAMES.map((src, i) => (
                    // все кадры в DOM, видим один — смена мгновенная, без перезагрузки картинки
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt={i === 1 ? 'Га-Га' : ''} draggable={false}
                        className="absolute inset-0 w-full h-full object-contain select-none"
                        style={{ opacity: frame === i ? 1 : 0 }} />
                ))}
            </div>
        </div>
    )
}
