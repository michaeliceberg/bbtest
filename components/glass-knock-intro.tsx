'use client'

// Мигель за стеклом: когда стикер на карте доехал до экрана, он вырастает на весь экран, стучит по стеклу и возвращается
// на своё место. Не чаще раза в KNOCK_PAUSE_MS. Нажатие сворачивает сразу. force — тестовая страница: без паузы.

import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { KNOCK_GLASS_SOUND, playSound, preloadSound } from '@/lib/sound'

const KNOCK_PAUSE_MS = 5 * 60 * 1000
const LAST_KEY = 'glassKnockAt'
const GROW_MS = 520
const HOLD_MS = 1500
const BACK_MS = 420

type Phase = 'wait' | 'grow' | 'knock' | 'back' | 'done'

export function GlassKnockIntro({ src, targetRef, size, onActive, force = false }: { src: string; targetRef: RefObject<HTMLElement>; size: number; onActive: (on: boolean) => void; force?: boolean }) {
    const [phase, setPhase] = useState<Phase>('wait')
    const [from, setFrom] = useState({ x: 0, y: 0, scale: 0.2, side: 0 })
    const timers = useRef<number[]>([])

    useEffect(() => { preloadSound(KNOCK_GLASS_SOUND) }, [])
    useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

    const goBack = () => {
        timers.current.forEach(window.clearTimeout)
        setPhase('back')
        timers.current = [window.setTimeout(() => { setPhase('done'); onActive(false) }, BACK_MS)]
    }

    useEffect(() => {
        const el = targetRef.current
        if (!el || phase !== 'wait') return
        if (!force) {
            try {
                if (Date.now() - Number(localStorage.getItem(LAST_KEY) || 0) < KNOCK_PAUSE_MS) return
            } catch { /* нет хранилища */ }
        }
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return
            io.disconnect()
            try { localStorage.setItem(LAST_KEY, String(Date.now())) } catch { /* нет хранилища */ }
            const r = el.getBoundingClientRect()
            const side = Math.min(window.innerWidth * 0.98, window.innerHeight * 0.86)
            // картинка на карте квадратная, по центру рамки и прижата к её верху
            setFrom({ x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + size / 2 - window.innerHeight / 2, scale: size / side, side })
            onActive(true)
            setPhase('grow')
            timers.current.push(window.setTimeout(() => { setPhase('knock'); playSound(KNOCK_GLASS_SOUND, 1 / 3) }, GROW_MS))
            timers.current.push(window.setTimeout(goBack, GROW_MS + HOLD_MS))
        }, { threshold: 0.6 })
        io.observe(el)
        return () => io.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, force, size])

    if (phase === 'wait' || phase === 'done') return null
    const atRest = { x: from.x, y: from.y, scale: from.scale, rotate: 0 }
    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center" onClick={goBack}>
            <motion.div className="absolute inset-0 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: phase === 'back' ? 0 : 1 }} transition={{ duration: 0.3 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src={src} alt="" draggable={false} className="relative select-none" style={{ width: from.side, height: from.side }}
                initial={atRest}
                animate={phase === 'back' ? atRest : phase === 'knock' ? { x: [0, -10, 9, -5, 0], y: 0, scale: [1, 1.03, 1, 1.02, 1], rotate: [0, -1, 1, 0, 0] } : { x: 0, y: 0, scale: 1, rotate: 0 }}
                transition={phase === 'back' ? { duration: BACK_MS / 1000, ease: [0.55, 0, 1, 0.6] } : phase === 'knock' ? { duration: 0.55 } : { type: 'spring', bounce: 0.35, duration: GROW_MS / 1000 }} />
        </div>,
        document.body,
    )
}
