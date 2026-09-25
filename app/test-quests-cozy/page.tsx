'use client'

// Тестовая страница экрана «Квесты дня» в пробном стиле «cozy» (тёплый, мультяшный,
// в духе Minecraft) — сравнить с /test-quests (текущий стиль).
// Тестовая страница экрана «Квесты дня» (components/trainer-quest-rewards-screen.tsx)
// с примерными данными: 2 кейса ждут открытия (обычный, редкий), КОМБО 8 —
// уже получен (золотая карточка), ДЗ не сделано. «Дальше» открывает кейсы по
// очереди — настоящим запросом (награда реально начисляется, в обход проверки квестов).

import { useState } from 'react'
import { TrainerQuestRewardsScreen } from '@/components/trainer-quest-rewards-screen'

export default function TestQuestsCozyPage() {
    const [key, setKey] = useState(0)
    return (
        <div className="w-full max-w-xl mx-auto">
            <TrainerQuestRewardsScreen
                key={key}
                t_lessonId={442}
                demo
                theme="cozy"
                data={{
                    monthIndex: new Date().getMonth(),
                    monthPoints: 7,
                    earnedNow: 2,
                    quests: [
                        { key: 'streak', progress: 1, target: 1, done: true, claimed: false, tier: 'common', streakDays: 3, prevProgress: 0, pointNow: true },
                        { key: 'perfect', progress: 2, target: 2, done: true, claimed: false, tier: 'rare', prevProgress: 1, pointNow: true },
                        { key: 'combo8', progress: 3, target: 3, done: true, claimed: true, tier: 'mythic' },
                        { key: 'hw', progress: 0, target: 1, done: false, claimed: false, tier: 'mega' },
                    ],
                }}
                primaryLabel="Показать ещё раз"
                onPrimary={() => setKey((k) => k + 1)}
            />
        </div>
    )
}
