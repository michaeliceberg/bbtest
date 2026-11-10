'use client'

// components/game-notices.tsx — уведомления Штурма и заморозки серии в общем тёмном стиле (components/notice-toast.tsx).
import { Flame, Snowflake, Crown } from 'lucide-react'
import { showNotice } from '@/components/notice-toast'

export const showStormGain = (st: { goal: number; lessons: number; coins: number; mythicNow?: boolean }) => {
    if (st.mythicNow) showNotice({ icon: <Crown className="h-6 w-6" strokeWidth={2.6} />, title: 'Штурм пройден', sub: `${st.goal} из ${st.goal}, мифический кейс твой`, tone: 'gold', duration: 5000 })
    else showNotice({ icon: <Flame className="h-6 w-6" strokeWidth={2.6} />, title: `Штурм: +${st.coins} монет`, sub: `${st.lessons} из ${st.goal} уроков`, tone: 'orange' })
}

export const showFreezeSaved = (streak?: number) =>
    showNotice({ icon: <Snowflake className="h-6 w-6" strokeWidth={2.6} />, title: 'Заморозка спасла серию', sub: streak ? `${streak} дн. подряд` : undefined, tone: 'blue' })
