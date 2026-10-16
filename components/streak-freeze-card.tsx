'use client'

// components/streak-freeze-card.tsx — заморозки серии: сколько есть и кнопка «купить за гемы».
// compact — строка внутри баннера «Не теряй серию» (/learn, /trainer), иначе — карточка в /account.

import { useState, useTransition } from 'react'
import { Snowflake, Gem } from 'lucide-react'
import { toast } from 'sonner'
import { buyStreakFreeze } from '@/actions/streak-freeze'
import { STREAK_FREEZE_MAX, STREAK_FREEZE_PRICE_GEMS } from '@/lib/streakFreeze'
import { cn } from '@/lib/utils'

export const StreakFreezeCard = ({ freezes: initial, gems: initialGems, compact = false }: { freezes: number; gems: number; compact?: boolean }) => {
    const [freezes, setFreezes] = useState(initial)
    const [gems, setGems] = useState(initialGems)
    const [pending, start] = useTransition()
    const full = freezes >= STREAK_FREEZE_MAX
    const poor = gems < STREAK_FREEZE_PRICE_GEMS
    const buy = () => start(async () => {
        const r = await buyStreakFreeze()
        if (r.ok) { setFreezes(r.freezes); setGems(r.gems); toast.success('❄️ Заморозка куплена — пропущенный день не сожжёт серию') }
        else toast.error(r.error === 'max' ? `Больше ${STREAK_FREEZE_MAX} заморозок держать нельзя` : r.error === 'gems' ? 'Не хватает гемов' : 'Нужно войти')
    })
    const icons = (
        <span className="flex gap-1">
            {Array.from({ length: STREAK_FREEZE_MAX }, (_, i) => (
                <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={i < freezes
                        ? { background: 'linear-gradient(135deg, #5CC8F5, #3B82F6)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 10px rgba(92,200,245,0.5)' }
                        : { background: '#1B262B', boxShadow: 'inset 0 0 0 1px #2F3C43' }}>
                    <Snowflake className={cn('h-4 w-4', i < freezes ? 'text-white' : 'text-[#45535B]')} strokeWidth={2.5} />
                </span>
            ))}
        </span>
    )
    const button = !full && (
        <button type="button" disabled={pending || poor} onClick={buy}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black text-white transition-transform active:translate-y-[3px] disabled:opacity-45"
            style={{ background: 'linear-gradient(135deg, #3E8FD0, #2C5FA8)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 0 #1A3560' }}>
            Купить · {STREAK_FREEZE_PRICE_GEMS}<Gem className="h-4 w-4 text-[#FF7FB8]" />
        </button>
    )
    if (compact) return (
        <div className="mt-2 flex items-center gap-2">
            {icons}
            <span className="flex-1 text-xs font-bold text-[#9FD3FA]">{freezes ? 'Заморозка спасёт серию, если пропустишь день' : 'Купи заморозку — спасёт серию, если пропустишь день'}</span>
            {button}
        </div>
    )
    return (
        <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'linear-gradient(180deg, #1C2A33, #172128)', boxShadow: 'inset 0 0 0 1.5px rgba(92,200,245,0.4)' }}>
            <div className="flex items-center gap-3">
                {icons}
                <div className="min-w-0 flex-1">
                    <div className="font-black text-white">Заморозка серии</div>
                    <div className="text-xs font-bold text-[#8FA3AE]">Пропустил день — заморозка тратится сама, серия не сгорает. Можно держать {STREAK_FREEZE_MAX}.</div>
                </div>
            </div>
            {full ? <div className="text-sm font-black text-[#9FD3FA]">Запас полный ❄️❄️</div> : <div className="flex justify-end">{button}</div>}
        </div>
    )
}
