'use client'

// Прототип параллакс-фона для /trainer: длинная карта-заглушка поверх components/parallax-world.tsx.
// Переключатели — чтобы сравнить с фоном/без и на 2 / 3 слоях (для слабых телефонов).

import { useState } from 'react'
import { ParallaxWorld } from '@/components/parallax-world'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const BLOCKS = [
    { title: 'Тригонометрия', color: GGEGE_PALETTE.blue },
    { title: 'Логарифмы', color: GGEGE_PALETTE.purple },
    { title: 'Теорема Виета', color: GGEGE_PALETTE.green },
    { title: 'Планиметрия', color: GGEGE_PALETTE.orange },
    { title: 'Стереометрия', color: GGEGE_PALETTE.teal },
]

export default function TestParallaxPage() {
    const [on, setOn] = useState(true)
    const [layers, setLayers] = useState(3)
    const [variant, setVariant] = useState<'simple' | 'rich'>('rich')
    return (
        <div className="relative min-h-screen bg-[#131D22]">
            <ParallaxWorld enabled={on} layers={layers} variant={variant} />

            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-2 bg-[#131D22]/90 px-3 py-2 border-b border-[#2A363C]">
                <button type="button" onClick={() => setOn((v) => !v)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-black ${on ? 'bg-[#78C93C] text-[#1B2A10]' : 'bg-[#2A363C] text-[#9AA7B0]'}`}>
                    Параллакс: {on ? 'вкл' : 'выкл'}
                </button>
                {([['simple', 'Вариант 1'], ['rich', 'Вариант 2']] as const).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setVariant(v)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-black ${variant === v ? 'bg-[#C385F7] text-[#1E0F2E]' : 'bg-[#2A363C] text-[#9AA7B0]'}`}>
                        {label}
                    </button>
                ))}
                {[2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => setLayers(n)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-black ${layers === n ? 'bg-[#53ADEF] text-[#0B1F2E]' : 'bg-[#2A363C] text-[#9AA7B0]'}`}>
                        {n} слоя
                    </button>
                ))}
            </div>

            {/* Заглушка карты тренажёра: блоки с «тропинкой» из кружков-уроков. */}
            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-10 px-4 py-8">
                {BLOCKS.map((b, bi) => (
                    <div key={b.title} className="flex flex-col items-center gap-5">
                        <div className="w-full rounded-2xl border-2 px-4 py-3 font-black text-lg text-white"
                            style={{ borderColor: b.color.bottom, backgroundColor: `${b.color.button}26` }}>
                            {b.title}
                        </div>
                        {Array.from({ length: 7 }, (_, i) => (
                            <div key={i} className="flex h-16 w-16 items-center justify-center rounded-2xl border-b-4 text-2xl font-black text-white"
                                style={{
                                    backgroundColor: i < 3 || bi > 1 ? b.color.button : '#2A363C',
                                    borderColor: i < 3 || bi > 1 ? b.color.bottom : '#1C252A',
                                    transform: `translateX(${Math.sin((i + bi) * 1.1) * 70}px)`,
                                }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
