'use client'

// Тест экрана «Новый уровень!» (components/level-up-screen.tsx) в обоих стилях.
// Запуск по кнопке — иначе браузер не даст проиграть звук.

import { useState } from 'react'
import { LevelUpScreen } from '@/components/level-up-screen'
import type { UiTheme } from '@/lib/cozyTheme'

const btn = 'rounded-xl px-5 py-3 font-black uppercase text-sm'

export default function TestLevelUpPage() {
    const [theme, setTheme] = useState<UiTheme | null>(null)
    const [id, setId] = useState(0)
    const [jump, setJump] = useState(1)
    if (theme) {
        return <LevelUpScreen overlay event={{ id, oldLevel: 6, newLevel: 6 + jump, gemsAwarded: 5 * jump }} theme={theme} onClose={() => setTheme(null)} />
    }
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#131D22] p-4">
            <p className="text-[#9AA7B0] font-bold">Экран «Новый уровень!»</p>
            <label className="flex items-center gap-2 text-sm text-[#D5DEE5]">
                <input type="checkbox" checked={jump === 2} onChange={(e) => setJump(e.target.checked ? 2 : 1)} />
                прыжок через уровень (6 → 8)
            </label>
            <button className={btn + ' bg-[#78C93C] text-[#1B2A10]'} onClick={() => { setId(Date.now()); setTheme('metal') }}>▶ Игровой стиль</button>
            <button className={btn + ' bg-[#FFB67A] text-[#3A2412]'} onClick={() => { setId(Date.now()); setTheme('cozy') }}>▶ Тёплый стиль</button>
        </div>
    )
}
