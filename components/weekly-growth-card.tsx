'use client'

// components/weekly-growth-card.tsx — «Моя неделя» на /path: уроки, задачи, серия и рост прогноза ЕГЭ
// «было → стало» с кнопкой «в сторис» (картинка 1080×1920, components/share-story-button.tsx). Данные — lib/weeklyReport.ts.

import { TrendingUp } from 'lucide-react'
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
                <span className="rounded-lg bg-black/25 px-2.5 py-1">📚 {w.lessons} уроков</span>
                <span className="rounded-lg bg-black/25 px-2.5 py-1">✅ {w.tasks} задач</span>
                {w.streak > 0 && <span className="rounded-lg bg-black/25 px-2.5 py-1">🔥 серия {w.streak}</span>}
            </div>
            {grew && (
                <ShareStoryButton label="📸 Похвастаться в сторис"
                    data={{ title: 'Мой рост за неделю', big: `${w.testBefore} → ${w.testNow}`, prize: `+${d} баллов ЕГЭ за неделю 🚀`, url: inviteUrl }} />
            )}
        </div>
    )
}
