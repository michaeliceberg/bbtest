'use client'

// Простой вид /trainer: вместо стопки карточек — одна полоска из иконок и
// цифр (уровень, серия, монеты, гемы, сердца) и две «таблетки» — пицца и квест
// дня; по тапу таблетка раскрывает привычную подробную карточку.
// Слово «простой» — выбор в сайдбаре (lib/trainerView.ts).

import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Heart, Gem, Coins } from 'lucide-react'
import { getLevelInfo } from '@/lib/xp'

type Props = {
    xp: number
    streak: number
    streakDoneToday: boolean
    points: number
    gems: number
    hearts: number
    pizzaSlices: number
    questDone: number
    questTotal: number
    pizzaPanel: ReactNode
    questPanel?: ReactNode
}

const RING_R = 17
const RING_C = 2 * Math.PI * RING_R

const Stat = ({ icon, value, color }: { icon: ReactNode; value: number | string; color: string }) => (
    <div className="flex items-center gap-1 text-sm font-extrabold" style={{ color }}>
        {icon}
        <span>{value}</span>
    </div>
)

export const TrainerTopBar = ({ xp, streak, streakDoneToday, points, gems, hearts, pizzaSlices, questDone, questTotal, pizzaPanel, questPanel }: Props) => {
    const info = getLevelInfo(xp)
    const [open, setOpen] = useState<null | 'pizza' | 'quest'>(null)
    const toggle = (k: 'pizza' | 'quest') => setOpen((cur) => (cur === k ? null : k))

    const chip = (k: 'pizza' | 'quest', label: ReactNode, active: boolean) => (
        <button
            type="button"
            onClick={() => toggle(k)}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border-2 border-b-4 active:border-b-2 text-sm font-extrabold transition-colors"
            style={{
                background: open === k ? '#22313A' : '#161F23',
                borderColor: open === k ? '#53ADEF' : '#3A464E',
                color: active ? '#A1D151' : '#F2F7FB',
            }}
        >
            {label}
        </button>
    )

    return (
        <div className="mb-3">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#3A464E] bg-[#151F23] px-3 py-2">
                <LevelRing level={info.level} percent={info.progressPercent} />
                <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                    <Stat icon={<Flame className="w-4 h-4" fill={streakDoneToday ? '#F09B38' : 'none'} />} value={streak} color={streakDoneToday ? '#F09B38' : '#7A8A93'} />
                    <Stat icon={<Coins className="w-4 h-4" />} value={points} color="#F2C35B" />
                    <Stat icon={<Gem className="w-4 h-4" />} value={gems} color="#53ADEF" />
                    <Stat icon={<Heart className="w-4 h-4" fill="#DC605B" />} value={hearts} color="#DC605B" />
                </div>
            </div>

            <div className="mt-2 flex gap-2">
                {chip('pizza', <>🍕 {pizzaSlices}/8</>, pizzaSlices >= 8)}
                {questPanel && chip('quest', <>🎯 {questDone}/{questTotal}</>, questDone >= questTotal)}
            </div>

            {open && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 rounded-2xl border-2 border-[#3A464E] bg-[#151F23] p-3"
                >
                    {open === 'pizza' ? pizzaPanel : questPanel}
                </motion.div>
            )}
        </div>
    )
}

// Кружок с номером уровня и кольцом прогресса до следующего.
const LevelRing = ({ level, percent }: { level: number; percent: number }) => (
    <div className="relative w-11 h-11 flex-shrink-0" title={`Уровень ${level}`}>
        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="20" cy="20" r={RING_R} fill="none" stroke="#2A363D" strokeWidth="4" />
            <circle
                cx="20" cy="20" r={RING_R} fill="none" stroke="#C385F7" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - percent / 100)}
            />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#F2F7FB]">{level}</div>
    </div>
)
