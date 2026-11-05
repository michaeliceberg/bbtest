'use client'

// Настоящая панель сета (SetPanel) с выдуманными данными — посмотреть блюда на скатерти
import { useState } from 'react'
import { SetPanel } from '@/components/set-bar'
import type { SetBarData } from '@/lib/setBar'

const DATA: SetBarData = {
    moveId: 1, taskNum: 7, taskTitle: 'Уравнения', step: 'tasks', hasTrainer: true,
    tLessonId: 1, trainerTitle: 'Три волшебных угла', tLessonId2: null, trainer2Title: null,
    tier: 'rare', setNumber: 2, tasksDone: 2, tasksTotal: 5, caseClaimed: false,
}

export function PanelDemo() {
    const [dish, setDish] = useState(1)
    return (
        <div className="mx-auto max-w-md">
            <div className="mb-3 flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                    <button key={i} onClick={() => setDish(i)}
                        className={`rounded-lg px-3 py-1 text-sm font-bold ${dish === i ? 'bg-[#F2C35B] text-[#3A2A08]' : 'bg-[#26333B]'}`}>
                        {['Закуска', 'Основное', 'Десерт', 'Нет сета'][i]}
                    </button>
                ))}
            </div>
            {/* SetPanel висит под полоской (absolute top-full) — даём ему «полоску» нулевой высоты и место ниже */}
            <div className="relative">
                <SetPanel d={DATA} dish={dish} closing={false} onClose={() => {}} />
            </div>
            <div className="h-[660px]" />
        </div>
    )
}
