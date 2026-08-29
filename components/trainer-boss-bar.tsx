// components/trainer-boss-bar.tsx
//
// HP-полоса босса на финальном ("корона"/"контрольная") этапе темы — за
// каждый верный ответ наносится урон (полоса уменьшается + красная
// вспышка + лут-дроп баночки здоровья), HP=0 ровно когда все вопросы
// урока отвечены верно (совпадает с уже существующим isPerfectScore/
// сундуком в TQUIZ.tsx). Лут-дроп чисто декоративный (не даёт реальных
// сердечек/наград — это отдельная, не начатая тема) — просто визуальный
// отклик на "удар". Плейсхолдер-арт (emoji) — пользователь заменит на
// гифки персонажа/босса/баночки позже.

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
    hp: number // 0-100, оставшееся здоровье босса
    hit: boolean // true сразу после верного ответа — момент удара
}

export const TrainerBossBar = ({ hp, hit }: Props) => {
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

    return (
        <div className="px-4 pt-1 pb-3">
            <div className="flex items-center gap-3">
                <motion.div
                    className="relative w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ border: '2px solid #DC605B' }}
                    animate={{
                        backgroundColor: flash ? '#DC605B' : '#3A1F1F',
                        scale: flash ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 0.25 }}
                >
                    👹
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
                </motion.div>
                <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#DC605B] mb-1">Босс</div>
                    <div className="h-3 bg-[#2A1A1A] rounded-full overflow-hidden border border-[#4A2A2A]">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: '#DC605B' }}
                            animate={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
