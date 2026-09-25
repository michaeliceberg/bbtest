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
    // Браузер не даёт играть звук, пока пользователь ни разу не нажал на
    // страницу, — поэтому экран запускается по кнопке (в уроке перед экраном
    // квестов всегда есть клик «Дальше», там это не нужно).
    const [started, setStarted] = useState(false)
    if (!started) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#131D22]">
                <button
                    onClick={() => setStarted(true)}
                    className="rounded-xl bg-[#78C93C] px-8 py-4 text-lg font-black uppercase text-[#1B2A10] shadow-[0_6px_0_#60A12F] active:translate-y-1 active:shadow-[0_2px_0_#60A12F]"
                >
                    ▶ Запустить со звуком
                </button>
            </div>
        )
    }
    return (
        <div className="w-full max-w-xl mx-auto">
            <TrainerQuestRewardsScreen
                key={key}
                t_lessonId={442}
                demo
                theme="cozy"
                data={{
                    monthIndex: new Date().getMonth(),
                    monthPoints: 9,
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
