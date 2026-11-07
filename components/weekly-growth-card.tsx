'use client'

// components/weekly-growth-card.tsx — «Моя неделя» на /path: уроки, задачи, серия и рост прогноза ЕГЭ
// «было → стало» с кнопкой «в сторис» (картинка 1080×1920, components/share-story-button.tsx). Данные — lib/weeklyReport.ts.

import { BookOpen, CircleCheck, Flame, TrendingUp } from 'lucide-react'
import { declensionRu } from '@/usefulFunctions'
import { ShareStoryButton } from '@/components/share-story-button'
import type { WeeklySummary } from '@/lib/weeklyReport'

export const WeeklyGrowthCard = ({ w, inviteUrl }: { w: WeeklySummary; inviteUrl: string }) => {
    const grew = w.testNow !== null && w.testBefore !== null && w.testNow > w.testBefore
    if (!grew && w.lessons === 0 && w.tasks === 0) return null
    const d = grew ? (w.testNow as number) - (w.testBefore as number) : 0
    return (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#6B5B3A] bg-[#151F23] p-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#C9B98F]">
                <TrendingUp className="h-4 w-4 text-[#F2C35B]" /> Моя неделя
            </div>
            {grew && (
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-white tabular-nums">{w.testBefore} → <span className="text-[#F2C35B]">{w.testNow}</span></span>
                    <span className="mb-1 rounded-full bg-[#78C93C22] px-2 py-0.5 text-sm font-black text-[#A1D151]">+{d}</span>
                </div>
            )}
            {grew && <div className="-mt-2 text-xs font-bold text-[#8FA3AE]">прогноз балла ЕГЭ за неделю</div>}
            <div className="flex flex-wrap gap-2 text-sm font-black text-[#D7E0E5]">
                <Stat icon={<BookOpen className="h-4 w-4 text-[#53ADEF]" />}>{w.lessons} {declensionRu(w.lessons, 'урок', 'урока', 'уроков')}</Stat>
                <Stat icon={<CircleCheck className="h-4 w-4 text-[#78C93C]" />}>{w.tasks} {declensionRu(w.tasks, 'задача', 'задачи', 'задач')}</Stat>
                {w.streak > 0 && <Stat icon={<Flame className="h-4 w-4 text-[#F09B38]" />}>серия {w.streak}</Stat>}
            </div>
            {grew && (
                <ShareStoryButton label="Похвастаться в сторис"
                    data={{ title: 'Мой рост за неделю', big: `${w.testBefore} → ${w.testNow}`, prize: `+${d} баллов ЕГЭ за неделю`, url: inviteUrl }} />
            )}
        </div>
    )
}

// Плашка-счётчик: иконка в цветном кружке + число. Эмодзи в интерфейсе не используем (2026-11-07).
const Stat = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <span className="flex items-center gap-1.5 rounded-lg bg-black/25 py-1 pl-1.5 pr-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5">{icon}</span>
        {children}
    </span>
)
