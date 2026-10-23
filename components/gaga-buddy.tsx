'use client'

// components/gaga-buddy.tsx
//
// Га-Га — наставник приложения (см. CLAUDE.md «Персонаж Га-Га»). В значимые моменты в левом нижнем
// углу выезжает его стикер с облачком-репликой и звучит готовая озвучка (lib/gagaVoice.ts).
//
// Использование: <GagaBuddyLayer /> один раз в app/layout.tsx, дальше showGaga(event) из любого места.
// На ответы — reportGagaAnswer(correct): Га-Га появляется не на каждый ответ, а примерно раз в 4–6 ответов
// (в уроке и так много звуков). Голос выключается в аккаунте (localStorage gagaVoice = 'off'),
// стикер с облачком показывается и без голоса.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { GAGA_EMOTIONS, gagaAudio, gagaCaption, pickGagaLine, type GagaEvent } from '@/lib/gagaVoice'
import { playSoundTracked } from '@/lib/sound'

const EVENT = 'gaga-show'
const VOICE_KEY = 'gagaVoice'
const MIN_SHOW_MS = 3200
const MAX_SHOW_MS = 7000
// Одна реплика «по делу» не чаще раза в N мс (кроме больших моментов — сундук, уровень, итог урока, босс)
const MIN_GAP_MS = 9000
const BIG: GagaEvent[] = ['chest', 'levelup', 'done', 'boss']

export const isGagaVoiceOn = () => {
    try { return localStorage.getItem(VOICE_KEY) !== 'off' } catch { return true }
}
export const setGagaVoiceOn = (on: boolean) => {
    try { localStorage.setItem(VOICE_KEY, on ? 'on' : 'off') } catch { /* приватный режим */ }
}

let lastShownAt = 0
export const showGaga = (event: GagaEvent, opts?: { delayMs?: number; force?: boolean }) => {
    if (typeof window === 'undefined') return
    const now = Date.now()
    if (!opts?.force && !BIG.includes(event) && now - lastShownAt < MIN_GAP_MS) return
    lastShownAt = now
    const fire = () => window.dispatchEvent(new CustomEvent(EVENT, { detail: { event } }))
    if (opts?.delayMs) setTimeout(fire, opts.delayMs)
    else fire()
}

// Ответы: Га-Га приходит на каждый 4–6-й ответ. Возвращает true, если показался (мем-облачко тогда не нужно).
let answers = 0
let nextAt = 2 + Math.floor(Math.random() * 2)
export const reportGagaAnswer = (correct: boolean): boolean => {
    answers++
    if (answers < nextAt) return false
    if (Date.now() - lastShownAt < MIN_GAP_MS) return false
    answers = 0
    nextAt = 4 + Math.floor(Math.random() * 3)
    showGaga(correct ? 'correct' : 'wrong')
    return true
}

// Раз в день (по локальной дате) — для «привет» и «пора спать»
export const showGagaOncePerDay = (event: GagaEvent, delayMs?: number) => {
    try {
        const key = `gagaDay:${event}`
        const today = new Date().toDateString()
        if (localStorage.getItem(key) === today) return
        localStorage.setItem(key, today)
    } catch { /* без localStorage — просто показываем */ }
    showGaga(event, { delayMs })
}

type Shown = { id: number; event: GagaEvent; caption: string; src: string; leaving: boolean }

const pickSticker = (event: GagaEvent) => {
    const list = GAGA_EMOTIONS[event]
    return list[Math.floor(Math.random() * list.length)]
}

const BubbleView = ({ s }: { s: Shown }) => {
    const wrong = s.event === 'wrong' || s.event === 'night'
    const accent = wrong ? '#8FA3AE' : s.event === 'boss' ? '#DC605B' : s.event === 'rule' ? '#F2C35B' : '#C385F7'
    return (
        <motion.div
            className="pointer-events-none fixed z-[96] flex items-end gap-1"
            style={{ left: 6, bottom: 'calc(env(safe-area-inset-bottom) + 96px)', maxWidth: 'min(330px, calc(100vw - 12px))' }}
            initial={{ x: -260, opacity: 0 }}
            animate={s.leaving ? { x: -280, opacity: 0 } : { x: 0, opacity: 1 }}
            transition={s.leaving ? { duration: 0.35, ease: [0.6, 0, 1, 0.4] } : { type: 'spring', stiffness: 260, damping: 18 }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
                src={s.src}
                alt="Га-Га"
                draggable={false}
                className="w-[84px] h-[84px] md:w-24 md:h-24 object-contain shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
                initial={{ rotate: -14, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 10, delay: 0.1 }}
            />
            <motion.div
                className="relative mb-10 rounded-2xl px-3 py-2 text-[13px] md:text-sm font-extrabold leading-snug text-[#F2F7FB]"
                style={{ backgroundColor: 'rgba(22, 31, 35, 0.92)', border: `2px solid ${accent}`, boxShadow: `0 0 16px -6px ${accent}` }}
                initial={{ scale: 0, originX: 0, originY: 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.25 }}
            >
                <span className="absolute -left-[7px] bottom-3 w-3 h-3 rotate-45"
                    style={{ backgroundColor: 'rgb(22, 31, 35)', borderLeft: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }} />
                {s.caption}
            </motion.div>
        </motion.div>
    )
}

export const GagaBuddyLayer = () => {
    const [mounted, setMounted] = useState(false)
    const [shown, setShown] = useState<Shown | null>(null)
    const stopVoice = useRef<() => void>(() => {})
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])

    useEffect(() => {
        setMounted(true)
        const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
        const onShow = (e: Event) => {
            const event = (e as CustomEvent<{ event: GagaEvent }>).detail.event
            const line = pickGagaLine(event)
            clear()
            stopVoice.current()
            const id = Date.now() + Math.random()
            const startedAt = Date.now()
            setShown({ id, event, caption: gagaCaption(line.text), src: pickSticker(event), leaving: false })
            const leave = () => {
                setShown((s) => (s && s.id === id ? { ...s, leaving: true } : s))
                timers.current.push(setTimeout(() => setShown((s) => (s && s.id === id ? null : s)), 400))
            }
            // Держим облачко, пока звучит голос (но не меньше MIN и не больше MAX)
            let voiceDone = !isGagaVoiceOn()
            if (!voiceDone) {
                stopVoice.current = playSoundTracked(gagaAudio(line.id), () => {
                    voiceDone = true
                    const rest = MIN_SHOW_MS - (Date.now() - startedAt)
                    timers.current.push(setTimeout(leave, Math.max(400, rest)))
                }, 0.9)
            }
            timers.current.push(setTimeout(() => { if (voiceDone) leave() }, MIN_SHOW_MS))
            timers.current.push(setTimeout(leave, MAX_SHOW_MS))
        }
        window.addEventListener(EVENT, onShow)
        return () => { window.removeEventListener(EVENT, onShow); clear(); stopVoice.current() }
    }, [])

    if (!mounted || !shown) return null
    return createPortal(<BubbleView key={shown.id} s={shown} />, document.body)
}
