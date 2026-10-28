'use client'

// Простой вид /trainer: вместо стопки карточек — одна полоска из иконок и
// цифр (уровень) и «таблетки» — серия дней, пицца и квест
// дня; по тапу таблетка раскрывает привычную подробную карточку.
// Слово «простой» — выбор в сайдбаре (lib/trainerView.ts).

import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { getLevelInfo } from '@/lib/xp'
import { daysWord } from '@/usefulFunctions'

type Props = {
    xp: number
    pizzaSlices: number
    questDone: number
    questTotal: number
    pizzaPanel: ReactNode
    questPanel?: ReactNode
    // Серия дней по курсу (lib/streak.ts): огонёк серый, пока сегодня ещё не занимался.
    streak?: number
    streakToday?: boolean
    streakFreezes?: number
}

const RING_R = 17
const RING_C = 2 * Math.PI * RING_R

export const TrainerTopBar = ({ xp, pizzaSlices, questDone, questTotal, pizzaPanel, questPanel, streak = 0, streakToday = false, streakFreezes = 0 }: Props) => {
    const info = getLevelInfo(xp)
    const [open, setOpen] = useState<null | 'pizza' | 'quest' | 'streak'>(null)
    const toggle = (k: 'pizza' | 'quest' | 'streak') => setOpen((cur) => (cur === k ? null : k))

    const chip = (k: 'pizza' | 'quest' | 'streak', label: ReactNode, active: boolean, activeColor = '#A1D151') => (
        <button
            type="button"
            onClick={() => toggle(k)}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 border-b-4 active:border-b-2 text-sm font-extrabold transition-colors"
            style={{
                background: open === k ? '#22313A' : '#161F23',
                borderColor: open === k ? '#53ADEF' : '#3A464E',
                color: active ? activeColor : '#F2F7FB',
            }}
        >
            {label}
        </button>
    )

    return (
        <div className="mb-3">
            <div className="flex items-center gap-2">
                <LevelRing level={info.level} percent={info.progressPercent} />
                {chip('streak', <><span style={streakToday ? undefined : { filter: 'grayscale(1)', opacity: 0.55 }}>🔥</span> {streak}</>, streakToday && streak > 0, '#FFB347')}
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
                    {open === 'pizza' ? pizzaPanel : open === 'quest' ? questPanel : (
                        <StreakPanel streak={streak} today={streakToday} freezes={streakFreezes} />
                    )}
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

// Что показывает огонёк: серия дней подряд, продлена ли сегодня, сколько заморозок про запас.
const StreakPanel = ({ streak, today, freezes }: { streak: number; today: boolean; freezes: number }) => (
    <div className="flex items-center gap-3">
        <span className="text-4xl leading-none" style={today ? undefined : { filter: 'grayscale(1)', opacity: 0.55 }}>🔥</span>
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-base font-extrabold text-white">
                {streak > 0 ? `Серия: ${streak} ${daysWord(streak)} подряд` : 'Серии пока нет'}
            </span>
            <span className="text-sm text-[#9AA7B0]">
                {today
                    ? 'Сегодня серия продлена. Красава! Возвращайся завтра 💪'
                    : streak > 0
                        ? 'Сегодня ещё не занимался. Реши задание, чтобы не потерять серию ⏳'
                        : 'Занимайся каждый день — огонёк будет расти'}
            </span>
            {freezes > 0 && <span className="text-xs text-[#7FC8F2]">❄️ Заморозок про запас: {freezes}</span>}
        </div>
    </div>
)
