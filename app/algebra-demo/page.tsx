'use client'

// Черновая demo-страница для проверки интерактивного тренажёра
// "выразить переменную в пропорции" (components/algebra/ProportionDragTrainer.tsx)
// — по тому же принципу, что и app/demo-assist/page.tsx: без авторизации,
// не подключена ни к какому курсу/БД, только для живой проверки самого
// механизма перетаскивания.

import { useState } from 'react'
import ProportionDragTrainer, { type ProportionExercise } from '@/components/algebra/ProportionDragTrainer'

export const dynamic = 'force-dynamic'

const EXERCISES: ProportionExercise[] = [
    {
        id: 'simple',
        target: 'a',
        tl: ['a'],
        bl: ['b'],
        tr: ['c'],
        br: [],
        showRightDenominator: false,
    },
    {
        id: 'full',
        target: 'a',
        tl: ['a'],
        bl: ['b'],
        tr: ['c'],
        br: ['d'],
        showRightDenominator: true,
    },
]

export default function AlgebraDemoPage() {
    const [exIndex, setExIndex] = useState(0)
    const [key, setKey] = useState(0)
    const exercise = EXERCISES[exIndex]

    return (
        <div className="min-h-screen bg-[#0F171A] text-[#F2F7FB] flex flex-col items-center gap-8 py-12 px-4">
            <h1 className="text-xl font-bold">Тренажёр алгебры: пропорции (черновик)</h1>
            <div className="flex gap-2">
                {EXERCISES.map((ex, i) => (
                    <button
                        key={ex.id}
                        onClick={() => {
                            setExIndex(i)
                            setKey((k) => k + 1)
                        }}
                        className={
                            'px-3 py-1.5 rounded-lg border text-sm ' +
                            (i === exIndex
                                ? 'bg-[#4A90D9] border-[#4A90D9] text-white'
                                : 'bg-[#1B2C3D] border-[#3A464E] text-[#9AA7B0]')
                        }
                    >
                        {ex.id === 'simple' ? 'a/b = c' : 'a/b = c/d'}
                    </button>
                ))}
                <button
                    onClick={() => setKey((k) => k + 1)}
                    className="px-3 py-1.5 rounded-lg border text-sm bg-[#1B2C3D] border-[#3A464E] text-[#9AA7B0]"
                >
                    Сбросить
                </button>
            </div>
            <div className="p-6 rounded-2xl bg-[#151F23] border border-[#232F34]">
                <ProportionDragTrainer key={key} exercise={exercise} onSolved={() => console.log('SOLVED', exercise.id)} />
            </div>
        </div>
    )
}
