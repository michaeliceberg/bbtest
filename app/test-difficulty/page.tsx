'use client'

// Тест вариантов компонента «Сложность» (components/difficulty-badge.tsx):
// каждый вариант на всех трёх уровнях + как он смотрится рядом с плашкой этапа.

import { useState } from 'react'
import { DifficultyBadge, type DifficultyVariant } from '@/components/difficulty-badge'

const VARIANTS: { id: DifficultyVariant; title: string }[] = [
    { id: 'squares', title: '1. Квадратики (сейчас в уроке)' },
    { id: 'skulls', title: '2. Черепки' },
    { id: 'flames', title: '3. Огоньки' },
    { id: 'meter', title: '4. Спидометр' },
    { id: 'bars', title: '5. Столбики «сигнала»' },
    { id: 'pill', title: '6. Компактная таблетка: слово + черепки' },
]

export default function TestDifficultyPage() {
    const [nonce, setNonce] = useState(0)
    return (
        <div className="min-h-screen bg-[#131D22] px-4 py-6 flex flex-col items-center gap-8">
            <button className="rounded-xl px-5 py-3 font-black uppercase text-sm bg-[#78C93C] text-[#1B2A10]" onClick={() => setNonce((n) => n + 1)}>
                Проиграть заново
            </button>
            {VARIANTS.map((v) => (
                <div key={`${v.id}-${nonce}`} className="w-full max-w-md flex flex-col gap-3">
                    <p className="text-[#F2F7FB] font-black">{v.title}</p>
                    <div className="flex items-end justify-around gap-2">
                        {([1, 2, 3] as const).map((l) => <DifficultyBadge key={l} level={l} variant={v.id} />)}
                    </div>
                    {/* Как стоит в уроке: плашка этапа по центру, сложность справа. */}
                    <div className="w-full grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-[#2A363D] p-2">
                        <span />
                        <span className="px-3 py-1 rounded-full text-sm font-black bg-[#53ADEF26] text-[#53ADEF]">Этап 1: правая часть</span>
                        <span className="justify-self-end"><DifficultyBadge level={2} variant={v.id} /></span>
                    </div>
                </div>
            ))}
        </div>
    )
}
