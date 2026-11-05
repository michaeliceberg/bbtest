'use client'

// Настоящая полоска и панель сета с выдуманными данными: блюда, превью, варианты кнопки «начать»
import { useState } from 'react'
import { BarButton, BellTongue, SET_GO_VARIANTS, SetPanel } from '@/components/set-bar'
import type { SetBarData } from '@/lib/setBar'

const BASE: SetBarData = {
    moveId: 1, taskNum: 3, taskTitle: 'Стереометрия', step: 'trainer', hasTrainer: true,
    tLessonId: 499, trainerTitle: 'ТТП: разминка', tLessonId2: 497, trainer2Title: 'ТТП', tier: 'common', setNumber: 1,
    tasksDone: 2, tasksTotal: 5, caseClaimed: false, preview: null,
}
const LESSON_PREVIEW = { kind: 'lesson' as const, text: 'Теорема о трёх перпендикулярах: наклонная перпендикулярна прямой в плоскости ⇔ её проекция перпендикулярна этой прямой', image: '/unit-pics/similarity.svg' }
const TASK_PREVIEW = { kind: 'task' as const, question: 'В правильной треугольной пирамиде $SABC$ точка $M$ — середина ребра $AB$, $SM = 5$, $AB = 6$. Найдите площадь боковой поверхности.', image: null }

export function PanelDemo() {
    const [dish, setDish] = useState(0)
    const [v, setV] = useState(0)
    const [open, setOpen] = useState(true)
    const d: SetBarData = { ...BASE, preview: dish === 0 ? LESSON_PREVIEW : dish === 1 ? TASK_PREVIEW : null }
    return (
        <div className="mx-auto max-w-[720px]">
            <div className="mb-2 flex flex-wrap justify-center gap-2">
                {['Закуска', 'Основное', 'Десерт', 'Нет сета'].map((t, i) => (
                    <button key={i} onClick={() => setDish(i)}
                        className={`rounded-lg px-3 py-1 text-sm font-bold ${dish === i ? 'bg-[#F2C35B] text-[#3A2A08]' : 'bg-[#26333B]'}`}>{t}</button>
                ))}
            </div>
            <div className="mb-4 flex flex-wrap justify-center gap-2">
                {SET_GO_VARIANTS.map((g, i) => (
                    <button key={i} onClick={() => setV(i)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${v === i ? 'bg-[#78C93C] text-[#16240C]' : 'bg-[#26333B]'}`}>Кнопка {i + 1}: {g.label}</button>
                ))}
            </div>
            <div className="relative">
                <BarButton d={d} dish={dish} onClick={() => setOpen(!open)} />
                <BellTongue n={d.setNumber} open={open} onToggle={setOpen} />
                {open && <SetPanel d={d} dish={dish} closing={false} onClose={() => setOpen(false)} goVariant={v} />}
            </div>
            <div className="h-[620px]" />
        </div>
    )
}
