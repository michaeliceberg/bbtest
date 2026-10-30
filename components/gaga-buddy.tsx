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
import { pickShortJoke, ZN_RUBRIC_TITLE, znSource, type ZnJoke } from '@/lib/zaNauku'

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
// shot — Га-Га с ружьём «стреляет» в экран (удар молнии КОМБО): стикер gun, отдача, вспышка и искры из ствола
export const showGaga = (event: GagaEvent, opts?: { delayMs?: number; force?: boolean; shot?: boolean; joke?: ZnJoke }) => {
    if (typeof window === 'undefined') return
    const now = Date.now()
    if (!opts?.force && !opts?.shot && !BIG.includes(event) && now - lastShownAt < MIN_GAP_MS) return
    lastShownAt = now
    const fire = () => window.dispatchEvent(new CustomEvent(EVENT, { detail: { event, shot: !!opts?.shot, joke: opts?.joke } }))
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
    // На верный ответ иногда вместо Мигеля выезжает «звезда» и говорит шутку из газеты МФТИ «За науку»
    if (correct && Math.random() < CELEB_JOKE_CHANCE) showGaga('correct', { joke: pickShortJoke() })
    else showGaga(correct ? 'correct' : 'wrong')
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

type Shown = { id: number; event: GagaEvent; caption: string; src: string; leaving: boolean; shot: boolean; joke?: ZnJoke }

// «Звёзды»-стикеры (public/more-memes, public/remember-stickers, public/lesson-pics), которые неожиданно
// произносят шутку физтехов. Только без надписей на самой картинке.
const CELEB_JOKE_CHANCE = 0.45
const CELEBS = [
    '/lesson-pics/jason.webp', '/lesson-pics/dicaprio-point.webp', '/lesson-pics/dicaprio-walk2.webp',
    '/remember-stickers/gentelmen-notext.webp', '/more-memes/meme-2.webp', '/more-memes/meme-20.webp',
    '/more-memes/meme-3.webp', '/more-memes/meme-4.webp', '/more-memes/meme9.webp', '/more-memes/meme7.webp',
    '/more-memes/meme-10.webp', '/more-memes/saul-1.webp', '/more-memes/saul-5.webp', '/more-memes/saul-8.webp',
]
let lastCeleb = ''
const pickCeleb = () => {
    let c = CELEBS[Math.floor(Math.random() * CELEBS.length)]
    if (c === lastCeleb) c = CELEBS[(CELEBS.indexOf(c) + 1) % CELEBS.length]
    lastCeleb = c
    return c
}

// Выстрел на ударе молнии КОМБО — Мигель с базукой; вспышка и «BOOM» уже нарисованы на стикере,
// поэтому свои вспышку/дым поверх не рисуем (SHOT_HAS_OWN_FLASH).
const GUN_STICKER = '/miguel/miguel-bazooka.webp'
const SHOT_HAS_OWN_FLASH = true
// Где дуло на стикере gun (доли от размера картинки) и когда выстрел после выезда
const MUZZLE = { x: 0.64, y: 0.53 }
const SHOT_DELAY = 0.55
const SPARKS = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3
    const d = 34 + (i % 3) * 12
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, star: i % 2 === 0, c: i % 3 === 0 ? '#FFFFFF' : '#FFD400' }
})

// Дым из дула после выстрела: мягкие серые клубы поднимаются вверх, покачиваются, растут и тают
const SMOKE = [
    { d: 0.12, x: [0, -6, 4, -2], y: -70, s: 26 },
    { d: 0.26, x: [0, 7, -5, 3], y: -95, s: 32 },
    { d: 0.42, x: [0, -4, 6, -3], y: -120, s: 38 },
    { d: 0.6, x: [0, 5, -3, 2], y: -140, s: 30 },
]
const MuzzleSmoke = () => (
    <div className="absolute pointer-events-none" style={{ left: `${MUZZLE.x * 100}%`, top: `${MUZZLE.y * 100}%`, width: 0, height: 0 }}>
        {SMOKE.map((p, i) => (
            <motion.span key={i} className="absolute block rounded-full"
                style={{ width: p.s, height: p.s, left: -p.s / 2, top: -p.s / 2,
                    background: 'radial-gradient(circle at 40% 40%, rgba(235,240,243,0.95), rgba(170,182,190,0.75) 55%, rgba(170,182,190,0) 72%)' }}
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: p.x, y: [0, p.y * 0.35, p.y * 0.7, p.y], scale: [0.3, 0.9, 1.4, 1.8], opacity: [0, 0.85, 0.55, 0] }}
                transition={{ delay: SHOT_DELAY + p.d, duration: 1.5, ease: 'easeOut', times: [0, 0.25, 0.6, 1] }} />
        ))}
    </div>
)

// Вспышка из ствола: белое ядро, жёлтые лучи-звезда и разлетающиеся искры (только transform/opacity)
const MuzzleFlash = () => (
    <div className="absolute pointer-events-none" style={{ left: `${MUZZLE.x * 100}%`, top: `${MUZZLE.y * 100}%`, width: 0, height: 0 }}>
        <motion.svg viewBox="-50 -50 100 100" width={96} height={96} className="absolute" style={{ left: -48, top: -48 }}
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: [0, 1.35, 0.9, 0], opacity: [0, 1, 1, 0], rotate: [0, 12, 20, 25] }}
            transition={{ delay: SHOT_DELAY, duration: 0.45, times: [0, 0.2, 0.5, 1], ease: 'easeOut' }}>
            <path d="M0,-46 L9,-12 L44,-16 L14,4 L30,38 L0,16 L-30,38 L-14,4 L-44,-16 L-9,-12 Z" fill="#FFD400" stroke="#F09B38" strokeWidth={3} strokeLinejoin="round" />
            <circle r={13} fill="#FFFFFF" />
        </motion.svg>
        {SPARKS.map((sp, i) => (
            <motion.span key={i} className="absolute block" style={{ left: -4, top: -4 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: sp.x, y: sp.y, scale: [0, 1.2, 0.4], opacity: [0, 1, 0] }}
                transition={{ delay: SHOT_DELAY + 0.05, duration: 0.6, ease: 'easeOut' }}>
                {sp.star
                    ? <svg viewBox="-5 -5 10 10" width={9} height={9}><path d="M0,-5 L1.3,-1.3 L5,0 L1.3,1.3 L0,5 L-1.3,1.3 L-5,0 L-1.3,-1.3 Z" fill={sp.c} /></svg>
                    : <span className="block w-[6px] h-[6px] rounded-full" style={{ backgroundColor: sp.c }} />}
            </motion.span>
        ))}
    </div>
)

const pickSticker = (event: GagaEvent) => {
    const list = GAGA_EMOTIONS[event]
    return list[Math.floor(Math.random() * list.length)]
}

const BubbleView = ({ s }: { s: Shown }) => {
    const wrong = s.event === 'wrong' || s.event === 'night'
    const accent = s.joke ? '#F2C35B' : wrong ? '#8FA3AE' : s.event === 'boss' ? '#DC605B' : s.event === 'rule' ? '#F2C35B' : '#C385F7'
    return (
        <motion.div
            className="pointer-events-none fixed z-[96] flex items-end gap-1"
            style={{ left: 6, bottom: 'calc(env(safe-area-inset-bottom) + 96px)', maxWidth: 'min(330px, calc(100vw - 12px))' }}
            initial={{ x: -260, opacity: 0 }}
            animate={s.leaving ? { x: -280, opacity: 0 } : { x: 0, opacity: 1 }}
            transition={s.leaving ? { duration: 0.35, ease: [0.6, 0, 1, 0.4] } : { type: 'spring', stiffness: 260, damping: 18 }}
        >
            <div className="relative shrink-0">
                {/* Отдача: выстрел в зрителя — стикер «отпрыгивает» назад (уменьшается) и дёргается */}
                <motion.div
                    initial={{ scale: 1, rotate: 0, x: 0 }}
                    animate={s.shot ? { scale: [1, 0.82, 1.06, 1], rotate: [0, -9, 4, 0], x: [0, -10, 3, 0] } : { scale: 1 }}
                    transition={s.shot ? { delay: SHOT_DELAY, duration: 0.42, times: [0, 0.18, 0.55, 1], ease: 'easeOut' } : undefined}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <motion.img
                        src={s.src}
                        alt={s.joke ? '' : 'Команданте Мигель'}
                        draggable={false}
                        className="w-[84px] h-[84px] md:w-24 md:h-24 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
                        initial={{ rotate: -14, scale: 0.7 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 10, delay: 0.1 }}
                    />
                </motion.div>
                {s.shot && !SHOT_HAS_OWN_FLASH && <MuzzleSmoke />}
                {s.shot && !SHOT_HAS_OWN_FLASH && <MuzzleFlash />}
            </div>
            <motion.div
                className="relative mb-10 rounded-2xl px-3 py-2 text-[13px] md:text-sm font-extrabold leading-snug text-[#F2F7FB]"
                style={{ backgroundColor: 'rgba(22, 31, 35, 0.92)', border: `2px solid ${accent}`, boxShadow: `0 0 16px -6px ${accent}` }}
                initial={{ scale: 0, originX: 0, originY: 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.25 }}
            >
                <span className="absolute -left-[7px] bottom-3 w-3 h-3 rotate-45"
                    style={{ backgroundColor: 'rgb(22, 31, 35)', borderLeft: `2px solid ${accent}`, borderBottom: `2px solid ${accent}` }} />
                {s.joke && <span className="mb-0.5 block text-[10px] font-black uppercase tracking-wide" style={{ color: accent }}>{ZN_RUBRIC_TITLE[s.joke.rubric]}</span>}
                {s.caption}
                {s.joke && <span className="mt-1 block text-[10px] font-bold text-[#8FA3AE]">{znSource(s.joke)}</span>}
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
            const { event, shot, joke } = (e as CustomEvent<{ event: GagaEvent; shot?: boolean; joke?: ZnJoke }>).detail
            clear()
            stopVoice.current()
            const id = Date.now() + Math.random()
            const startedAt = Date.now()
            const leave = () => {
                setShown((s) => (s && s.id === id ? { ...s, leaving: true } : s))
                timers.current.push(setTimeout(() => setShown((s) => (s && s.id === id ? null : s)), 400))
            }
            if (joke) {
                // шутку читаем глазами — без голоса, держим по длине текста
                setShown({ id, event, caption: joke.text, src: pickCeleb(), leaving: false, shot: false, joke })
                timers.current.push(setTimeout(leave, Math.min(11000, Math.max(5000, joke.text.length * 75))))
                return
            }
            const line = pickGagaLine(event)
            setShown({ id, event, caption: gagaCaption(line.text), src: shot ? GUN_STICKER : pickSticker(event), leaving: false, shot: !!shot })
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
