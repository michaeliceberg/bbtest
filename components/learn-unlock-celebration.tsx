// components/learn-unlock-celebration.tsx
//
// Один раз после прохождения трёх первых разборов любого предмета (lib/learn-unlock.ts)
// — полноэкранное поздравление «Тебе открыт Задачник» в игровом/тёплом стиле
// (общий каркас celebration-shell.tsx). Флаг «уже показывали» — localStorage.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CelebrationShell } from '@/components/celebration-shell'
import { COZY } from '@/lib/cozyTheme'
import { useUiTheme } from '@/lib/uiTheme'
import { playSound, preloadSound, LEVEL_UP_SOUND } from '@/lib/sound'
import Lottie from '@/components/lottie-player'

// Lottie грузится через общую обёртку (JSON — по URL, не в бандле)

const SEEN_KEY = 'learnUnlockSeen'
const ACCENT = '#34D399'

export const LearnUnlockCelebration = ({ subject = 'physics' }: { subject?: 'math' | 'physics' }) => {
    const theme = useUiTheme()
    const cozy = theme === 'cozy'
    const router = useRouter()
    const [show, setShow] = useState(false)
    const [lottie, setLottie] = useState<object | null>(null)

    useEffect(() => {
        try {
            // Физика — старый ключ (кто уже видел, не увидит снова), у математики свой.
            const key = subject === 'math' ? `${SEEN_KEY}:math` : SEEN_KEY
            if (localStorage.getItem(key)) return
            localStorage.setItem(key, '1')
        } catch {
            return
        }
        preloadSound(LEVEL_UP_SOUND)
        fetch('/Lottie/hw/FlamyHwDone.json').then((r) => r.json()).then(setLottie).catch(() => {})
        setShow(true)
        playSound(LEVEL_UP_SOUND)
    }, [])

    if (!show) return null

    const titleStyle = cozy
        ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)` }
        : { color: '#D1FAE5', textShadow: `0 0 18px ${ACCENT}AA` }

    return (
        <CelebrationShell
            theme={theme}
            accent={ACCENT}
            starsTier="rare"
            confetti
            overlay
            buttonLabel="Погнали в Задачник!"
            onButton={() => {
                setShow(false)
                router.push('/learn')
            }}
        >
            <motion.p
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                className="text-3xl font-black uppercase tracking-wide"
                style={titleStyle}
            >
                Задачник открыт!
            </motion.p>

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay: 0.1 }}
                className="relative mt-4 h-48 w-48"
            >
                {!cozy && <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(closest-side, ${ACCENT}55, transparent)` }} />}
                {lottie && <Lottie animationData={lottie} loop autoplay className="relative h-full w-full" />}
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-5 max-w-sm text-xl font-bold leading-snug"
                style={{ color: cozy ? '#F3E3C8' : '#E5EEF2' }}
            >
                {subject === 'math' ? 'Ты прошёл первые разборы тригонометрии 💪' : 'Ты прошёл все разборы электродинамики 💪'}
            </motion.p>
            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="mt-3 max-w-sm text-lg font-semibold leading-snug"
                style={{ color: cozy ? '#D9C4A3' : '#9AA7B0' }}
            >
                Теперь тебе доступен <span style={{ color: cozy ? COZY.honey : ACCENT }} className="font-black">Задачник</span> — там собраны типовые задания ЕГЭ
            </motion.p>
        </CelebrationShell>
    )
}
