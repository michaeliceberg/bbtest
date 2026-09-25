'use client'

// Тестовая страница экрана «Квесты дня» (components/trainer-quest-rewards-screen.tsx)
// с примерными данными. Кнопка «Открыть» делает НАСТОЯЩИЙ запрос: кейс выдаётся,
// только если квест реально выполнен сегодня (обычно — «Продли серию дней»
// после любого пройденного урока тренажёра по теме урока 442).

import { useState } from 'react'
import { TrainerQuestRewardsScreen } from '@/components/trainer-quest-rewards-screen'

export default function TestQuestsPage() {
    const [key, setKey] = useState(0)
    return (
        <div className="w-full max-w-xl mx-auto">
            <TrainerQuestRewardsScreen
                key={key}
                t_lessonId={442}
                data={{
                    monthIndex: new Date().getMonth(),
                    monthPoints: 7,
                    quests: [
                        { key: 'streak', progress: 1, target: 1, done: true, claimed: false, tier: 'common', streakDays: 3 },
                        { key: 'perfect', progress: 2, target: 2, done: true, claimed: true, tier: 'rare' },
                        { key: 'combo8', progress: 1, target: 3, done: false, claimed: false, tier: 'mythic' },
                        { key: 'hw', progress: 0, target: 1, done: false, claimed: false, tier: 'mega' },
                    ],
                }}
                primaryLabel="Показать ещё раз"
                onPrimary={() => setKey((k) => k + 1)}
            />
        </div>
    )
}
