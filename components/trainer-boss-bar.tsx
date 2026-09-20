// components/trainer-boss-bar.tsx
//
// HP-полоса босса на финальном ("корона"/"контрольная") этапе темы — за
// каждый верный ответ наносится урон (полоса уменьшается + вспышка +
// лут-дроп баночки здоровья), HP=0 ровно когда все вопросы урока отвечены
// верно (совпадает с уже существующим isPerfectScore/сундуком в TQUIZ.tsx).
// Лут-дроп чисто декоративный (не даёт реальных сердечек/наград) —
// просто визуальный отклик на "удар".
//
// По прямой просьбе пользователя (2026-09-10) — аватарка босса (раньше
// собственный SVG BossFace) убрана целиком, вместо неё сам "образ" босса
// теперь несёт Lottie в облаке маскота (см. randomBossLottie/bossLottie в
// trainer-question.tsx), а HP-полоса растянута на всю ширину экрана,
// а не делит место с квадратиком аватарки.

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
    hp: number // 0-100, оставшееся здоровье босса
    hit: boolean // true сразу после верного ответа — момент удара
    streak?: number // серия верных подряд — каждый 5-й ответ подряд = крит-удар
}

const CRIT_EVERY = 5

export const TrainerBossBar = ({ hp, hit, streak = 0 }: Props) => {
    const [critKey, setCritKey] = useState(0)
    const [showCrit, setShowCrit] = useState(false)
    useEffect(() => {
        if (streak <= 0 || streak % CRIT_EVERY !== 0) return
        setShowCrit(true)
        setCritKey((k) => k + 1)
        const t = setTimeout(() => setShowCrit(false), 1400)
        return () => clearTimeout(t)
    }, [streak])

    const [flash, setFlash] = useState(false)
    // Простой remount-key вместо AnimatePresence — в этом проекте
    // AnimatePresence иногда не завершает exit-анимацию (см. CLAUDE.md),
    // поэтому лут просто монтируется/размонтируется по showLoot, а key
    // гарантирует, что два удара подряд каждый раз проигрывают анимацию
    // заново, а не переиспользуют уже смонтированный (застрявший) узел.
    const [showLoot, setShowLoot] = useState(false)
    const [lootKey, setLootKey] = useState(0)

    useEffect(() => {
        if (!hit) return
        setFlash(true)
        setShowLoot(true)
        setLootKey((k) => k + 1)
        const tFlash = setTimeout(() => setFlash(false), 300)
        const tLoot = setTimeout(() => setShowLoot(false), 900)
        return () => { clearTimeout(tFlash); clearTimeout(tLoot) }
    }, [hit])

    const clampedHp = Math.max(0, Math.min(100, hp))

    return (
        <div className="px-4 pt-1 pb-3">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#DC605B]">Босс</span>
                <span className="text-[10px] font-bold text-[#DC605B]">{Math.round(clampedHp)}%</span>
            </div>
            <div className="relative w-full h-3 bg-[#2A1A1A] rounded-full overflow-visible border border-[#4A2A2A]">
                <motion.div
                    className="h-full rounded-full overflow-hidden"
                    animate={{
                        width: `${clampedHp}%`,
                        backgroundColor: flash ? (showCrit ? '#FFD84D' : '#FF8A8A') : '#DC605B',
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
                {showCrit && (
                    <motion.div
                        key={`crit-${critKey}`}
                        initial={{ opacity: 0, scale: 0.4, rotate: -8 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.4, 1.15, 1.15], rotate: [-8, 4, -2, 0], y: [0, -6, -14, -26] }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        className="absolute -top-9 right-2 pointer-events-none px-2.5 py-0.5 rounded-lg font-black text-sm tracking-wide text-[#412402] shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #FFD84D, #FF9F1C)', boxShadow: '0 0 18px 4px rgba(255,159,28,0.6)' }}
                    >
                        💥 КРИТ ×{Math.round(streak / CRIT_EVERY) + 1}!
                    </motion.div>
                )}
                {showLoot && (
                    <motion.div
                        key={lootKey}
                        initial={{ opacity: 0, y: 0, scale: 0.6 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl pointer-events-none"
                    >
                        🧪
                    </motion.div>
                )}
            </div>
        </div>
    )
}
