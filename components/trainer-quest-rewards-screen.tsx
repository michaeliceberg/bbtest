// components/trainer-quest-rewards-screen.tsx
//
// Промежуточный экран "ближайших наград" — показывается ПОСЛЕ идеально
// пройденного урока тренажёра, но ДО Rive-анимации открытия сундука
// (components/ChestReward.tsx), см. app/t-lesson/[t_lessonId]/TQUIZ.tsx.
// Тот же приём, что уже применяется в Duolingo: маленькая пауза с
// прогрессом по нескольким лёгким целям перед самой наградой — даёт
// игроку понять, за что именно он получит сундук, и подогревает интерес
// к следующим целям.
//
// Данные — честные, не выдуманные на клиенте: серверный экшен
// reportLessonQuestSignals (actions/generate-trainer-quest.ts) считает их
// из реальных данных (trainer_quests.streak5Count/perfectLessonCount,
// user_homework за текущий месяц) в момент завершения урока. Единственное
// исключение — первая карточка "Продли серию дней": она всегда 1/1 в
// момент показа этого экрана, поскольку сам факт того, что урок только
// что пройден идеально, УЖЕ означает "позанимался сегодня" — статичное
// значение, отдельный запрос к серверу ради него не нужен.

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Smile, Frown } from 'lucide-react'
import { Button } from './ui/button'

export type QuestRewardsData = {
    streak5Count: number
    streak5Target: number
    perfectLessonCount: number
    perfectTarget: number
    hwDone: number | null
    hwTotal: number | null
} | null

type Props = {
    data: QuestRewardsData
    onOpenChest: () => void
}

type Tier = 'common' | 'rare' | 'mythic'

const TIER_STYLE: Record<Tier, { color: string; bg: string; border: string; glow: string }> = {
    common: { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.5)', glow: 'rgba(156,163,175,0.35)' },
    rare: { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.5)', glow: 'rgba(56,189,248,0.4)' },
    mythic: { color: '#FBBF24', bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.55)', glow: 'rgba(251,191,36,0.45)' },
}

// Родительный падеж (нужен для "Задания <месяца>") — Intl не всегда даёт
// нужный падеж стабильно для ru-RU, надёжнее захардкодить.
const MONTH_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const QuestCard = ({
    title, current, target, tier, delay,
}: { title: string; current: number; target: number; tier: Tier; delay: number }) => {
    const [fillPct, setFillPct] = useState(0)
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    const isDone = current >= target
    const style = TIER_STYLE[tier]

    useEffect(() => {
        const t = setTimeout(() => setFillPct(pct), 300 + delay * 1000)
        return () => clearTimeout(t)
    }, [pct, delay])

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
            className="rounded-2xl border border-[#3A464E] bg-[#151F23] p-4"
        >
            <p className="font-bold text-[#F2F7FB] mb-3">{title}</p>
            <div className="flex items-center gap-3">
                <div className="relative flex-1 h-7 rounded-full overflow-hidden" style={{ backgroundColor: '#232F35' }}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #2DD4BF, #34D399)' }}
                        animate={{ width: `${fillPct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        {current} / {target}
                    </span>
                </div>
                <div
                    className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: style.bg, border: `2px solid ${style.border}`, boxShadow: isDone ? `0 0 14px ${style.glow}` : undefined }}
                >
                    <Gift className="w-5 h-5" style={{ color: style.color }} />
                    {isDone && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: delay + 0.9, type: 'spring', stiffness: 400, damping: 15 }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold"
                        >
                            ✓
                        </motion.span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export const TrainerQuestRewardsScreen = ({ data, onOpenChest }: Props) => {
    const streak5Current = data?.streak5Count ?? 0
    const streak5Target = data?.streak5Target ?? 2
    const perfectCurrent = data?.perfectLessonCount ?? 0
    const perfectTarget = data?.perfectTarget ?? 2
    const showHomework = data?.hwTotal != null && data.hwTotal > 0
    const hwDone = data?.hwDone ?? 0
    const hwTotal = data?.hwTotal ?? 0
    const hwCompleted = showHomework && hwDone >= hwTotal
    const monthName = MONTH_GENITIVE[new Date().getMonth()]

    return (
        <div className="w-full max-w-xl mx-auto py-6 px-1">
            <motion.h1
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="text-center text-2xl sm:text-3xl font-extrabold mb-6"
                style={{ color: '#34D399' }}
            >
                +1 балл за задание!
            </motion.h1>

            <div className="flex flex-col gap-3">
                <QuestCard title="Продли серию дней" current={1} target={1} tier="common" delay={0} />
                <QuestCard
                    title="Дайте 5 верных ответов подряд в 2 уроках"
                    current={streak5Current}
                    target={streak5Target}
                    tier="rare"
                    delay={0.15}
                />
                <QuestCard
                    title="Пройдите 2 урока без ошибок"
                    current={perfectCurrent}
                    target={perfectTarget}
                    tier="mythic"
                    delay={0.3}
                />
            </div>

            {showHomework && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.35 }}
                    className="mt-3 rounded-2xl border p-4 flex items-center justify-between"
                    style={{ borderColor: hwCompleted ? 'rgba(52,211,153,0.5)' : 'rgba(58,70,78,1)' }}
                >
                    <div>
                        <p className="font-bold text-[#F2F7FB]">Задания {monthName}</p>
                        <p className="text-sm text-[#9AA7B0] mt-0.5">{hwDone} / {hwTotal}</p>
                    </div>
                    {hwCompleted
                        ? <Smile className="w-8 h-8 text-emerald-400" />
                        : <Frown className="w-8 h-8 text-[#9AA7B0]" />}
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="mt-6"
            >
                <Button onClick={onOpenChest} variant="primary" className="w-full">
                    Открыть сундук
                </Button>
            </motion.div>
        </div>
    )
}
