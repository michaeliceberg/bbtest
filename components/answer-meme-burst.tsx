'use client'

// components/answer-meme-burst.tsx
//
// Облачко-мем после ответа: появляется с bounce из точки, куда нажал ученик, и
// плавно поднимается вверх, мигая подсветкой (красной — неверно, зелёной — верно);
// через 2 секунды резко, с ускорением, улетает вверх и схлопывается в точку. Картинки — public/answer-meme-right/N.webp
// и public/answer-meme-wrong/N.webp (стикеры 512×512).
// На неверный ответ — всегда, на верный — с шансом 50%.
//
// Использование: на странице один раз <AnswerMemeLayer />, дальше
// showAnswerMeme(isCorrect) в обработчике ответа. Точку берём из последнего
// касания/клика (слушаем pointerdown на window), координаты передавать не надо.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

const RIGHT_COUNT = 21
const WRONG_COUNT = 39
const RIGHT_CHANCE = 0.5
const SHOW_MS = 2000
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
    useEffect(() => {
        const t = setTimeout(onDone, SHOW_MS + 200)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const glow = b.correct ? RIGHT_GLOW : WRONG_GLOW
    // Не даём облачку уехать за край экрана.
    const vw = window.innerWidth
    const x = Math.min(Math.max(b.x, SIZE / 2 + 8), vw - SIZE / 2 - 8)
    const y = Math.max(b.y, SIZE + 40)
    const sec = SHOW_MS / 1000
    return (
        <div className="pointer-events-none fixed z-[90]" style={{ left: x, top: y, width: 0, height: 0 }}>
            {/* Плавно поднимается вверх, в конце рывком улетает вверх и схлопывается в точку. */}
            <motion.div
                className="absolute"
                style={{ width: SIZE, height: SIZE, left: -SIZE / 2, top: -SIZE / 2 }}
                initial={{ y: 0, x: 0, scale: 1, opacity: 1 }}
                animate={{ y: [0, -130, -240], scale: [1, 1, 0], opacity: [1, 1, 0] }}
                transition={{
                    // Плавный подъём, а в конце — рывок вверх с ускорением.
                    y: { duration: sec, times: [0, 0.9, 1], ease: ['linear', [0.7, 0, 1, 0.3]] },
                    // Держит размер, а в конце резко, с ускорением, схлопывается в точку.
                    scale: { duration: sec, times: [0, 0.9, 1], ease: ['linear', [0.7, 0, 1, 0.3]] },
                    opacity: { duration: sec, times: [0, 0.97, 1] },
                }}
            >
                {/* Появление из точки — с bounce */}
                <motion.div
                    className="relative w-full h-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 12 }}
                >
                    {/* Подсветка: мигает пару раз */}
                    <motion.div
                        className="absolute inset-[-14%] rounded-full"
                        style={{ background: `radial-gradient(circle, ${glow}AA 0%, ${glow}55 45%, transparent 70%)` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0.25, 1, 0.25, 0.6] }}
                        transition={{ duration: 1.4, times: [0, 0.15, 0.35, 0.55, 0.75, 1] }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.src} alt="" className="relative w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]" draggable={false} />
                </motion.div>
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
