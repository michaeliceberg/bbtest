'use client'
// «Штурм» (lib/storm.ts): плашка с обратным отсчётом — сверху на /trainer и в уроке тренажёра.
// Пока идут 10 минут: время, сколько уроков из STORM_GOAL, что дадут. Кончилось время — исчезает.
import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { declensionRu } from '@/usefulFunctions'

export type StormInfo = { until: string; lessons: number; goal: number; rewarded: boolean }

export const useStormLeft = (until: string | null) => {
    const [left, setLeft] = useState<number | null>(null)
    useEffect(() => {
        if (!until) { setLeft(null); return }
        const end = new Date(until).getTime()
        const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)))
        tick()
        const t = setInterval(tick, 1000)
        return () => clearInterval(t)
    }, [until])
    return left
}

export const fmtLeft = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const StormPill = ({ storm, className, compact }: { storm: StormInfo | null; className?: string; compact?: boolean }) => {
    const left = useStormLeft(storm?.until ?? null)
    if (!storm || left === null || left <= 0) return null
    const need = Math.max(0, storm.goal - storm.lessons)
    // Компактная — в самом уроке: огонь, время и сколько уроков набрано.
    if (compact) return (
        <div className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-black text-white shadow-[0_3px_0_#8A2A10]', className)}
            style={{ background: 'linear-gradient(90deg, #FF5A1F, #FF9A1F)' }}>
            <Flame className="h-4 w-4 animate-pulse" strokeWidth={2.8} />
            <span className="tabular-nums">{fmtLeft(left)}</span>
            {!storm.rewarded && <span className="opacity-90">· {storm.lessons}/{storm.goal}</span>}
        </div>
    )
    return (
        <div className={cn('flex items-center gap-2 rounded-2xl px-3 py-2 text-white shadow-[0_4px_0_#8A2A10]', className)}
            style={{ background: 'linear-gradient(90deg, #FF5A1F, #FF9A1F)' }}>
            <Flame className="h-5 w-5 shrink-0 animate-pulse" strokeWidth={2.8} />
            <span className="font-black tracking-wide">ШТУРМ</span>
            <span className="font-black tabular-nums">{fmtLeft(left)}</span>
            <span className="ml-auto text-right text-xs font-bold leading-tight">
                {storm.rewarded || need === 0
                    ? '+монеты за каждый урок'
                    : <>ещё {need} {declensionRu(need, 'урок', 'урока', 'уроков')} → мифический кейс</>}
            </span>
        </div>
    )
}
