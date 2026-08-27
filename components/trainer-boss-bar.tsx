// components/trainer-boss-bar.tsx
//
// HP-полоса босса на финальном ("корона") этапе темы — за каждый верный
// ответ наносится урон (полоса уменьшается + красная вспышка), HP=0
// ровно когда все вопросы урока отвечены верно (совпадает с уже
// существующим isPerfectScore/сундуком в TQUIZ.tsx). Плейсхолдер-арт
// (emoji) — пользователь заменит на гифки персонажа/босса позже.

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
    hp: number // 0-100, оставшееся здоровье босса
    hit: boolean // true сразу после верного ответа — момент удара
}

export const TrainerBossBar = ({ hp, hit }: Props) => {
    const [flash, setFlash] = useState(false)

    useEffect(() => {
        if (!hit) return
        setFlash(true)
        const t = setTimeout(() => setFlash(false), 300)
        return () => clearTimeout(t)
    }, [hit])

    return (
        <div className="px-4 pt-1 pb-3">
            <div className="flex items-center gap-3">
                <motion.div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ border: '2px solid #DC605B' }}
                    animate={{
                        backgroundColor: flash ? '#DC605B' : '#3A1F1F',
                        scale: flash ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 0.25 }}
                >
                    👹
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
