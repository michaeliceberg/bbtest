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
        <div className="mt-4 rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'linear-gradient(135deg, #1D3A52 0%, #1A2530 55%, #2A1F3D 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(120,190,245,0.45), 0 4px 0 #0D1A24' }}>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#7E8F99]">
                <TrendingUp className="h-4 w-4 text-[#9FD3FA]" /> Моя неделя
            </div>
            {grew && (
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-white tabular-nums">{w.testBefore} → <span className="bg-gradient-to-r from-[#7FC6F7] to-[#C9A2FA] bg-clip-text text-transparent">{w.testNow}</span></span>
                    <span className="mb-1 rounded-full bg-[#78C93C22] px-2 py-0.5 text-sm font-black text-[#A1D151]">+{d}</span>
                </div>
            )}
            {grew && <div className="-mt-2 text-xs font-bold text-[#8FA3AE]">прогноз балла ЕГЭ за неделю</div>}
            <div className="flex flex-wrap gap-2 text-sm font-black text-[#D7E0E5]">
                <span className="rounded-full bg-[#0E1518] px-3 py-1">📚 {w.lessons} уроков</span>
                <span className="rounded-full bg-[#0E1518] px-3 py-1">✅ {w.tasks} задач</span>
                {w.streak > 0 && <span className="rounded-full bg-[#0E1518] px-3 py-1">🔥 серия {w.streak}</span>}
            </div>
            {grew && (
                <ShareStoryButton label="📸 Похвастаться в сторис"
                    data={{ title: 'Мой рост за неделю', big: `${w.testBefore} → ${w.testNow}`, prize: `+${d} баллов ЕГЭ за неделю 🚀`, url: inviteUrl }} />
            )}
        </div>
    )
}
