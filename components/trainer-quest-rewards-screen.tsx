// components/trainer-quest-rewards-screen.tsx
//
// Экран «Квесты дня» — ПОСЛЕДНИЙ в цепочке финала урока тренажёра
// (итоги → рулетка, если выпала → этот экран), показывается после любого
// урока. Премиальный стиль экрана кейсов (фон, звёзды, металлические рамки).
//
// Квесты (дневные, начинаются заново каждый день; считает сервер —
// actions/generate-trainer-quest.ts, reportLessonQuestSignals):
//   Продли серию дней → Обычный кейс; 2 урока без ошибок → Редкий;
//   КОМБО 8 в трёх уроках → Мифический; ДЗ на сегодня (если есть) → МЕГА.
// Выполненный квест: кнопка «Открыть кейс» → барабан (CaseReel) нужной
// редкости, награду решает сервер (claimQuestCase), раз в день на квест.
// Каждый выполненный квест = +1 квест-поинт; внизу — сумма за месяц.

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { daysWord, declensionRu } from '@/usefulFunctions'
import { CaseReel, CaseStars } from '@/components/CaseReel'
import { getLessonCasePool, LESSON_CASE_TIER_ICON, LESSON_CASE_TIER_LABEL, type LessonCaseTier } from '@/lib/caseRewards'
import { claimQuestCase, type DailyQuest, type DailyQuestKey, type DailyQuestsData } from '@/actions/generate-trainer-quest'
import { RollingNumber } from '@/components/rolling-number'

export type QuestRewardsData = DailyQuestsData | null

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

// Цвет рамки/акцента по редкости награды (в тон фонам кейсов).
const TIER_ACCENT: Record<LessonCaseTier, string> = {
    common: '#8FA3AE',
    rare: '#00C5FF',
    mythic: '#A868FC',
    mega: '#FF8A00',
}

const questTitle = (q: DailyQuest) => {
    if (q.key === 'streak') return 'Продли серию дней'
    if (q.key === 'perfect') return `Пройди ${q.target} ${declensionRu(q.target, 'урок', 'урока', 'уроков')} без ошибок`
    if (q.key === 'combo8') return `КОМБО 8 в ${q.target} уроках`
    return 'Сделай домашние задания'
}

type Props = {
    data: QuestRewardsData
    t_lessonId: number
    primaryLabel: string
    onPrimary: () => void
    secondaryLabel?: string
    onSecondary?: () => void
}

const QuestRow = ({ q, index, onOpen }: { q: DailyQuest; index: number; onOpen: () => void }) => {
    const accent = TIER_ACCENT[q.tier]
    const percent = Math.min(100, (q.progress / q.target) * 100)
    const canOpen = q.done && !q.claimed
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.18, type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="relative rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            style={{ background: `linear-gradient(180deg, ${q.done ? accent : '#5A6B76'} 0%, #2A363C 55%, #141C20 100%)` }}
        >
            {canOpen && (
                <span aria-hidden className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 22px ${accent}99` }} />
            )}
            <div className="relative flex items-center gap-3 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={LESSON_CASE_TIER_ICON[q.tier]}
                    alt=""
                    className={`h-12 w-12 shrink-0 object-contain ${canOpen ? 'animate-chest-idle-bounce' : ''} ${q.claimed ? 'opacity-40' : ''}`}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-[#F2F7FB] leading-tight">{questTitle(q)}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: accent }}>
                        {LESSON_CASE_TIER_LABEL[q.tier]} кейс
                        {q.key === 'streak' && q.streakDays ? <span className="text-[#9AA7B0] normal-case tracking-normal"> · 🔥 {q.streakDays} {daysWord(q.streakDays)} подряд</span> : null}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#2A3A4A]">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: q.done ? accent : '#5A6B76' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ delay: 0.45 + index * 0.18, duration: 0.7, ease: 'easeOut' }}
                            />
                        </div>
                        <span className="text-xs font-black tabular-nums text-[#D5DEE5]">
                            {q.progress}/{q.target}
                        </span>
                    </div>
                </div>
                {canOpen ? (
                    <motion.button
                        onClick={onOpen}
                        whileTap={{ scale: 0.95, y: 1 }}
                        className="shrink-0 rounded-xl p-[2px]"
                        style={{ background: `linear-gradient(180deg, ${accent} 0%, #2A363C 100%)` }}
                    >
                        <span className="animate-shine-sweep block rounded-[10px] bg-[#0C1215] px-3 py-2 text-xs font-black uppercase tracking-[0.08em]" style={{ color: accent }}>
                            Открыть
                        </span>
                    </motion.button>
                ) : q.claimed ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#78C93C]">
                        <Check className="h-4 w-4" strokeWidth={3} /> Получено
                    </span>
                ) : null}
            </div>
        </motion.div>
    )
}

export const TrainerQuestRewardsScreen = ({ data, t_lessonId, primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props) => {
    const [quests, setQuests] = useState<DailyQuest[]>(data?.quests ?? [])
    const [opening, setOpening] = useState<DailyQuest | null>(null)
    const monthName = MONTHS[data?.monthIndex ?? new Date().getMonth()]

    if (opening) {
        const key: DailyQuestKey = opening.key
        return (
            <CaseReel
                isMega={opening.tier !== 'common'}
                tier={opening.tier}
                pool={getLessonCasePool(opening.tier)}
                spinAction={() => claimQuestCase(t_lessonId, key)}
                title={`Квест: ${questTitle(opening)}`}
                onDone={() => {
                    setQuests((prev) => prev.map((q) => (q.key === key ? { ...q, claimed: true } : q)))
                    setOpening(null)
                }}
            />
        )
    }

    return (
        <div className="relative min-h-screen text-[#F2F7FB] flex flex-col overflow-x-clip">
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: '#131D22' }}>
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 15%, #A868FC2E, transparent 55%)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
                <CaseStars tier="common" />
            </div>

            <div className="relative z-10 flex flex-col gap-3 px-4 pt-8">
                <motion.h1
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                    className="text-center text-3xl font-black bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(90deg, #FBBF24, #A868FC)' }}
                >
                    Квесты дня
                </motion.h1>
                <p className="text-center text-sm text-[#9AA7B0]">Выполняй квесты — открывай кейсы. Завтра — новые.</p>

                <div className="mt-2 flex flex-col gap-3">
                    {quests.map((q, i) => (
                        <QuestRow key={q.key} q={q} index={i} onOpen={() => setOpening(q)} />
                    ))}
                </div>

                {/* Квест-поинты за месяц */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + quests.length * 0.18 + 0.2, duration: 0.4 }}
                    className="mt-2 flex items-center justify-between rounded-2xl border border-[#3A464E] bg-[#151F23]/80 px-4 py-3"
                >
                    <span className="text-sm font-bold text-[#D5DEE5]">
                        Квест-поинты за {monthName}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#FBBF24]" style={{ textShadow: '0 0 12px #FBBF2499' }}>
                        ⭐
                        <RollingNumber value={String(data?.monthPoints ?? 0)} start className="text-2xl font-black" />
                    </span>
                </motion.div>
            </div>

            <div className="flex-1" />

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + quests.length * 0.18, duration: 0.35 }}
                className="relative z-10 flex flex-col gap-3 px-4 pb-4 pt-4"
            >
                <motion.button
                    onClick={onPrimary}
                    whileTap={{ scale: 0.97, y: 2 }}
                    className="relative w-full rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
                    style={{ background: 'linear-gradient(180deg, #78C93C 0%, #2A363C 55%, #141C20 100%)' }}
                >
                    <span aria-hidden className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 26px #78C93CAA' }} />
                    <span
                        className="animate-shine-sweep relative flex items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] px-8 py-4 font-black text-lg uppercase tracking-[0.1em]"
                        style={{ color: '#78C93C', textShadow: '0 0 12px #78C93C99' }}
                    >
                        {primaryLabel}
                        <ArrowRight className="h-5 w-5" />
                    </span>
                </motion.button>
                {secondaryLabel && onSecondary && (
                    <button
                        onClick={onSecondary}
                        className="w-full rounded-2xl border-2 border-[#3A464E] bg-[#151F23]/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#D5DEE5] transition-colors hover:border-[#5A6B76]"
                    >
                        {secondaryLabel}
                    </button>
                )}
            </motion.div>
        </div>
    )
}
