'use client'
// Экран «ШТУРМ!» — показывается сразу после урока, который запустил штурм (lib/storm.ts).
import { motion } from 'framer-motion'
import { CelebrationShell } from '@/components/celebration-shell'
import { STORM_COINS_PER_LESSON_UI, STORM_GOAL_UI, STORM_MINUTES_UI } from '@/lib/stormUi'

export const StormStartScreen = ({ onGo }: { onGo: () => void }) => (
    <CelebrationShell accent="#FF6A1F" starsTier="mythic" buttonLabel="В атаку! 🔥" onButton={onGo} shinyButton>
        <div className="flex flex-col items-center text-center gap-4 px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src="/miguel/miguel-tank.webp" alt="" className="w-56 h-56 object-contain" draggable={false}
                initial={{ scale: 0.3, opacity: 0, x: -120 }} animate={{ scale: 1, opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }} />
            <motion.h1 className="text-5xl font-black tracking-wide" style={{ color: '#FF8A2A', textShadow: '0 4px 0 #6B1A05' }}
                initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: 'spring', bounce: 0.5 }}>
                ШТУРМ!
            </motion.h1>
            <p className="text-xl font-black">У тебя {STORM_MINUTES_UI} минут, боец!</p>
            <div className="w-full max-w-sm rounded-2xl border-2 border-[#FF8A2A]/60 bg-[#1B252B] p-4 text-left text-base font-bold space-y-2">
                <div>🪙 +{STORM_COINS_PER_LESSON_UI} монет за каждый урок</div>
                <div>🎁 кейс почти за каждый урок, и чаще редкий</div>
                <div>👑 {STORM_GOAL_UI} урока до конца штурма → <span className="text-[#C385F7]">мифический кейс</span></div>
            </div>
            <p className="text-sm text-[#9AA7B0]">Время пошло. Маньяна — враг революции!</p>
        </div>
    </CelebrationShell>
)
