'use client'

// Мем рядом с текстом/правилом: прыгает с отскоком, слегка покачивается и смотрит в сторону текста
// (картинка отражается, если персонаж на исходнике смотрит в другую сторону). Мемы — lib/moreMemes.ts.
// Выбор случайный, но только после монтирования — без рассинхрона SSR.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { pickMoreMeme, memeFlip, type MoreMeme } from '@/lib/moreMemes'
import { cn } from '@/lib/utils'

export const SideMeme = ({ mood, toward = 'left', className }: { mood?: MoreMeme['mood']; toward?: 'left' | 'right'; className?: string }) => {
    const [m, setM] = useState<MoreMeme | null>(null)
    useEffect(() => { setM(pickMoreMeme(mood)) }, [mood])
    return (
        <div className={cn('w-16 h-16 md:w-20 md:h-20 shrink-0 flex items-center justify-center', className)} aria-hidden>
            {m && (
                // позиционирующий/отражающий слой статичный, framer анимирует только внутренний
                <div className="w-full h-full" style={{ transform: memeFlip(m, toward) ? 'scaleX(-1)' : undefined }}>
                    <motion.img src={m.src} alt="" draggable={false}
                        className="w-full h-full object-contain pointer-events-none select-none"
                        initial={{ scale: 0.2, opacity: 0, rotate: -14 }}
                        animate={{ scale: 1, opacity: 1, rotate: [0, -5, 4, 0] }}
                        transition={{ scale: { type: 'spring', stiffness: 360, damping: 12 }, opacity: { duration: 0.2 },
                            rotate: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }} />
                </div>
            )}
        </div>
    )
}
