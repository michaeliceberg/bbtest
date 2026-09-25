'use client'

// Тест экрана «N ответов подряд» (components/streak-celebration-screen.tsx)
// в обоих стилях и для обоих рубежей (3 и 7).

import { useState } from 'react'
import { StreakCelebrationScreen } from '@/components/streak-celebration-screen'
import type { UiTheme } from '@/lib/cozyTheme'
import { LOTTIE_STREAK_CHARACTER_LIST, getRandomLottie } from '@/src/constants/lottieConstants'

const btn = 'rounded-xl px-5 py-3 font-black uppercase text-sm'

export default function TestStreakScreenPage() {
    const [show, setShow] = useState<{ theme: UiTheme; milestone: number; lottie: unknown } | null>(null)
    if (show) {
        return <StreakCelebrationScreen animationData={show.lottie} milestone={show.milestone} theme={show.theme} onNext={() => setShow(null)} />
    }
    const open = (theme: UiTheme, milestone: number) => setShow({ theme, milestone, lottie: getRandomLottie(LOTTIE_STREAK_CHARACTER_LIST) })
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#131D22] p-4">
            <p className="text-[#9AA7B0] font-bold">Экран «N ответов подряд»</p>
            <button className={btn + ' bg-[#78C93C] text-[#1B2A10]'} onClick={() => open('metal', 3)}>Игровой · 3 подряд</button>
            <button className={btn + ' bg-[#78C93C] text-[#1B2A10]'} onClick={() => open('metal', 7)}>Игровой · 7 подряд</button>
            <button className={btn + ' bg-[#FFB67A] text-[#3A2412]'} onClick={() => open('cozy', 3)}>Тёплый · 3 подряд</button>
            <button className={btn + ' bg-[#FFB67A] text-[#3A2412]'} onClick={() => open('cozy', 7)}>Тёплый · 7 подряд</button>
        </div>
    )
}
