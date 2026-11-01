'use client'

// components/streak-chip.tsx
//
// Серия дней маленькой плашкой в углу ангара (вместо большого баннера над ним).
// Серый огонь — сегодня ещё не продлена; поздно вечером и не продлена — пульсирует красным.
// По нажатию — короткое пояснение и заморозки.

import { useEffect, useState } from 'react'
import { Flame, Snowflake } from 'lucide-react'
import { daysWord } from '@/usefulFunctions'

const RISK_HOUR = 20

export function StreakChip({ streak, hasExtendedToday, freezes }: { streak: number; hasExtendedToday: boolean; freezes: number }) {
    const [open, setOpen] = useState(false)
    const [late, setLate] = useState(false)
    useEffect(() => setLate(new Date().getHours() >= RISK_HOUR), [])
    const risk = late && streak > 0 && !hasExtendedToday
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-xl border-2 bg-[#151F23]/90 px-2.5 py-1 text-sm font-black shadow-lg ${risk ? 'animate-pulse border-[#DC605B] text-[#FFB4A8]' : 'border-[#4A3A14] text-[#F2E3C2]'}`}>
                <Flame className="h-4 w-4" style={{ color: hasExtendedToday ? '#FF9A3C' : '#7A8A93' }} fill={hasExtendedToday ? '#FF9A3C' : 'none'} />
                {streak}
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border-2 border-[#2A363C] bg-[#151F23] p-3 text-left text-sm font-bold text-[#C9D3D9] shadow-xl">
                    <p className="font-black text-[#F2F7FB]">Серия: {streak} {daysWord(streak)} подряд</p>
                    <p className="mt-1">{hasExtendedToday ? 'Сегодня уже продлена ✓' : 'Реши урок тренажёра или задачу — и серия продлится'}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-[#8FD3FF]"><Snowflake className="h-4 w-4" />Заморозок: {freezes}</p>
                </div>
            )}
        </div>
    )
}
