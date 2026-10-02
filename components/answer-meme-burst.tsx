'use client'

// components/answer-meme-burst.tsx
//
// Облачко-мем после ответа: вылетает из точки, куда нажал ученик, с bounce
// поднимается вверх, пару раз мигает подсветкой (красной — неверно, зелёной —
// верно) и через 3 секунды исчезает. Картинки — public/answer-meme-right/N.webp
// и public/answer-meme-wrong/N.webp (стикеры 512×512).
// На неверный ответ — всегда, на верный — с шансом 20%.
//
// Использование: на странице один раз <AnswerMemeLayer />, дальше
// showAnswerMeme(isCorrect) в обработчике ответа. Точку берём из последнего
// касания/клика (слушаем pointerdown на window), координаты передавать не надо.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

const RIGHT_COUNT = 21
const WRONG_COUNT = 39
const RIGHT_CHANCE = 0.2
const SHOW_MS = 3000
const SIZE = 132

const RIGHT_GLOW = '#A1D151'
const WRONG_GLOW = '#DC605B'

type Burst = { id: number; x: number; y: number; correct: boolean; src: string }

let lastPoint = { x: 0, y: 0 }
let lastSrc: Record<'right' | 'wrong', string> = { right: '', wrong: '' }
const EVENT = 'answer-meme'

const pickSrc = (correct: boolean) => {
    const kind = correct ? 'right' : 'wrong'
    const n = correct ? RIGHT_COUNT : WRONG_COUNT
    let src = ''
    do {
        src = `/answer-meme-${kind}/${1 + Math.floor(Math.random() * n)}.webp`
    } while (src === lastSrc[kind] && n > 1)
    lastSrc[kind] = src
    return src
}

// force — показать в любом случае (для тестовой страницы).
export const showAnswerMeme = (correct: boolean, opts?: { force?: boolean; x?: number; y?: number }) => {
    if (typeof window === 'undefined') return
    if (correct && !opts?.force && Math.random() >= RIGHT_CHANCE) return
    window.dispatchEvent(new CustomEvent(EVENT, {
        detail: { correct, x: opts?.x ?? lastPoint.x, y: opts?.y ?? lastPoint.y, src: pickSrc(correct) },
    }))
}

const BurstView = ({ b, onDone }: { b: Burst; onDone: () => void }) => {
    const [leaving, setLeaving] = useState(false)
    useEffect(() => {
        const t1 = setTimeout(() => setLeaving(true), SHOW_MS)
        const t2 = setTimeout(onDone, SHOW_MS + 450)
        return () => { clearTimeout(t1); clearTimeout(t2) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const glow = b.correct ? RIGHT_GLOW : WRONG_GLOW
    // Не даём облачку уехать за край экрана.
    const vw = window.innerWidth
    const x = Math.min(Math.max(b.x, SIZE / 2 + 8), vw - SIZE / 2 - 8)
    const y = Math.max(b.y, SIZE + 70)
    return (
        <div className="pointer-events-none fixed z-[90]" style={{ left: x, top: y, width: 0, height: 0 }}>
            <motion.div
                className="absolute"
                style={{ width: SIZE, height: SIZE, left: -SIZE / 2, top: -SIZE / 2 }}
                initial={{ scale: 0, y: 0, opacity: 0 }}
                animate={leaving ? { scale: 0.5, y: -110, opacity: 0 } : { scale: 1, y: -80, opacity: 1 }}
                transition={leaving ? { duration: 0.4, ease: 'easeIn' } : { type: 'spring', stiffness: 260, damping: 13 }}
            >
                {/* Подсветка: мигает пару раз */}
                <motion.div
                    className="absolute inset-[-14%] rounded-full"
                    style={{ background: `radial-gradient(circle, ${glow}AA 0%, ${glow}55 45%, transparent 70%)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.25, 1, 0.25, 0.7] }}
                    transition={{ duration: 1.4, times: [0, 0.15, 0.35, 0.55, 0.75, 1] }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt="" className="relative w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]" draggable={false} />
            </motion.div>
        </div>
    )
}

export const AnswerMemeLayer = () => {
    const [bursts, setBursts] = useState<Burst[]>([])
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
        const onDown = (e: PointerEvent) => { lastPoint = { x: e.clientX, y: e.clientY } }
        const onMeme = (e: Event) => {
            const d = (e as CustomEvent).detail as Omit<Burst, 'id'>
            // Одновременно максимум одно облачко — новое заменяет старое.
            setBursts([{ id: Date.now() + Math.random(), ...d }])
        }
        window.addEventListener('pointerdown', onDown, true)
        window.addEventListener(EVENT, onMeme)
        return () => {
            window.removeEventListener('pointerdown', onDown, true)
            window.removeEventListener(EVENT, onMeme)
        }
    }, [])
    if (!mounted) return null
    return createPortal(
        <>
            {bursts.map((b) => (
                <BurstView key={b.id} b={b} onDone={() => setBursts((list) => list.filter((x) => x.id !== b.id))} />
            ))}
        </>,
        document.body,
    )
}
