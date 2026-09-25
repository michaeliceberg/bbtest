// components/level-up-screen.tsx
//
// Экран «Новый уровень!» во весь экран (2026-09-25, вместо центральной
// модалки level-up-modal.tsx). Два стиля — 'metal' (игровой) и 'cozy'
// (тёплый), общий каркас components/celebration-shell.tsx. Персонаж уровня —
// тот же Lottie, что на карточке уровня (public/Lottie/lvl/lvlN.json, 3 уровня
// на персонажа). При показе играет /snd-lvlup.mp3. Тест: /test-level-up.

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowRight, Gem } from 'lucide-react'
import { CelebrationShell } from '@/components/celebration-shell'
import { COZY, type UiTheme } from '@/lib/cozyTheme'
import { playSound, preloadSound, LEVEL_UP_SOUND } from '@/lib/sound'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// Сколько персонажей lvlN.json лежит в public/Lottie/lvl (если добавятся —
// поднять; несуществующий файл всё равно откатится на lvl1).
const LVL_LOTTIE_COUNT = 5
const ACCENT = '#A78BFA'

export type LevelUpEvent = { id: number; oldLevel: number; newLevel: number; gemsAwarded: number }

type Props = {
    event: LevelUpEvent | null
    onClose: () => void
    theme?: UiTheme
    // fixed поверх приложения (глобальный провайдер) или обычный блок.
    overlay?: boolean
}

const useLevelLottie = (level: number) => {
    const [data, setData] = useState<object | null>(null)
    useEffect(() => {
        let alive = true
        const idx = Math.min(Math.max(1, Math.ceil(level / 3)), LVL_LOTTIE_COUNT)
        const load = (src: string) => fetch(src).then((r) => (r.ok ? r.json() : Promise.reject()))
        load(`/Lottie/lvl/lvl${idx}.json`)
            .catch(() => load('/Lottie/lvl/lvl1.json'))
            .then((d) => alive && setData(d))
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [level])
    return data
}

export const LevelUpScreen = ({ event, onClose, theme = 'metal', overlay = true }: Props) => {
    const cozy = theme === 'cozy'
    const lottie = useLevelLottie(event?.newLevel ?? 1)

    useEffect(() => {
        preloadSound(LEVEL_UP_SOUND)
    }, [])
    useEffect(() => {
        if (event) playSound(LEVEL_UP_SOUND)
    }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!event) return null

    const titleStyle = cozy
        ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)` }
        : { color: '#EDE4FF', textShadow: `0 0 18px ${ACCENT}AA` }
    const numberStyle = cozy
        ? { color: '#F1ECE3', textShadow: `0 5px 0 ${COZY.headlineShadow}, 0 10px 0 rgba(0,0,0,0.3)` }
        : { color: '#FFFFFF', textShadow: `0 0 28px ${ACCENT}, 0 0 60px ${ACCENT}88` }

    return (
        <CelebrationShell
            key={event.id}
            theme={theme}
            accent={ACCENT}
            starsTier="mythic"
            confetti
            overlay={overlay}
            buttonLabel="Продолжить"
            onButton={onClose}
            cozyButton={{ fill: '#C9AEF5', edge: '#8E6FC7' }}
        >
            <motion.p
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                className="text-3xl font-black uppercase tracking-wide"
                style={titleStyle}
            >
                Новый уровень!
            </motion.p>

            {/* Персонаж уровня */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay: 0.1 }}
                className="relative mt-4 h-44 w-44"
            >
                <div
                    className={cozy ? 'absolute inset-0 rounded-3xl' : 'absolute inset-0 rounded-full'}
                    style={
                        cozy
                            ? { background: COZY.card, border: `4px solid ${COZY.cardBorder}`, boxShadow: `0 8px 0 ${COZY.cardEdge}` }
                            : { background: `radial-gradient(closest-side, ${ACCENT}55, transparent)` }
                    }
                />
                {lottie && <Lottie animationData={lottie} loop autoplay className="relative h-full w-full" />}
            </motion.div>

            {/* Было → стало */}
            <div className="mt-5 flex items-center justify-center gap-4">
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-black line-through decoration-4"
                    style={{ color: cozy ? '#7A756D' : '#5C6B73' }}
                >
                    {event.oldLevel}
                </motion.span>
                <ArrowRight className="h-8 w-8 shrink-0" style={{ color: cozy ? COZY.honey : ACCENT }} />
                <motion.span
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.6, duration: 0.8, delay: 0.45 }}
                    className="inline-block text-8xl font-black leading-none"
                    style={numberStyle}
                >
                    {event.newLevel}
                </motion.span>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-lg font-bold"
                style={{ color: cozy ? '#C8C1B5' : '#9AA7B0' }}
            >
                Теперь ты на уровне {event.newLevel}
            </motion.p>

            {event.gemsAwarded > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.85, type: 'spring', bounce: 0.55 }}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-lg font-black"
                    style={
                        cozy
                            ? { background: '#2C5566', color: '#BFEFFF', border: '3px solid #8FD3F0', boxShadow: '0 4px 0 #4F97B8' }
                            : { background: 'rgba(56,189,248,0.12)', color: '#7DD3FC', border: '1px solid rgba(56,189,248,0.4)' }
                    }
                >
                    <Gem className="h-5 w-5" />+{event.gemsAwarded}
                </motion.div>
            )}
        </CelebrationShell>
    )
}
