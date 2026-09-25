'use client'

// Тестовая страница экрана завершения урока тренажёра
// (components/trainer-lesson-complete-screen.tsx) — без прохождения урока.

import { useState } from 'react'
import { TrainerLessonCompleteScreen } from '@/components/trainer-lesson-complete-screen'
import { LOTTIE_STREAK_CHARACTER_LIST, getRandomLottie } from '@/src/constants/lottieConstants'

export default function TestCompletePage() {
    const [key, setKey] = useState(0)
    const [chain, setChain] = useState(false)
    const [lottie] = useState(() => getRandomLottie(LOTTIE_STREAK_CHARACTER_LIST))
    const [cozy, setCozy] = useState(false)

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Переключатель стиля для теста */}
            <button
                onClick={() => { setCozy((c) => !c); setKey((k) => k + 1) }}
                className="fixed top-3 right-3 z-50 rounded-lg bg-black/60 px-3 py-2 text-xs font-bold text-white"
            >
                {cozy ? '🎮 Игровой' : '🏡 Тёплый'}
            </button>
            <TrainerLessonCompleteScreen
                key={key}
                theme={cozy ? 'cozy' : 'metal'}
                lottieData={lottie}
                streak={6}
                xp={50}
                elapsedSeconds={134}
                primaryLabel="Показать ещё раз"
                onPrimary={() => setKey((k) => k + 1)}
                secondaryLabel={chain ? 'Обычный вариант' : 'Вариант «серия без остановки»'}
                onSecondary={() => {
                    setChain((c) => !c)
                    setKey((k) => k + 1)
                }}
                chainHint={chain ? { count: 1, remaining: 2 } : null}
            />
        </div>
    )
}
