'use client'

// Тестовая страница экрана «Строим твой путь» (components/plan-build-modal.tsx) с примерными данными.
import { useState } from 'react'
import { PlanBuildModal } from '@/components/plan-build-modal'

const SAMPLE = {
    primary: 7.4, primaryMax: 15, test: 46, testLo: 42, testHi: 52,
    strong: [{ num: 1, title: 'Планиметрия' }, { num: 4, title: 'Вероятность' }, { num: 7, title: 'Уравнения' }],
    middle: [{ num: 2, title: 'Векторы' }, { num: 9, title: 'Производная' }],
    weak: [{ num: 3, title: 'Стереометрия' }, { num: 11, title: 'Текстовые' }],
    soon: [{ num: 20, title: 'Теория чисел' }],
}

export default function TestPlanBuild() {
    const [run, setRun] = useState(0)
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#131D22]">
            <button type="button" onClick={() => setRun((n) => n + 1)} className="rounded-2xl bg-[#F09B38] px-6 py-3 font-black text-[#151F24]">Построить мой план ➜</button>
            {run > 0 && <PlanBuildModal key={run} r={SAMPLE} onClose={() => setRun(0)} />}
        </div>
    )
}
