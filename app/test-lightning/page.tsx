'use client'

// Тестовая страница молний тренажёра (components/LightningStrike.tsx):
// кнопка — удар молнии со звуком, как при 5 подряд (жёлтая) и 8 подряд (синяя).

import { useEffect, useState } from 'react'
import TrainerProgressBar from '@/components/trainer-progress-bar'
import LightningStrike, { preloadLightningSounds, type LightningVariant } from '@/components/LightningStrike'

const BUTTONS: { variant: LightningVariant; label: string; hint: string; color: string }[] = [
    { variant: 'yellow', label: 'Обычная молния', hint: '5 подряд · 1 с', color: '#FFE042' },
    { variant: 'blue', label: 'Синяя молния', hint: '8 подряд · 1.5 с', color: '#6BFFFF' },
]

export default function TestLightningPage() {
    const [strike, setStrike] = useState<{ key: number; variant: LightningVariant } | null>(null)
    useEffect(() => preloadLightningSounds(), [])
    const [demoStreak, setDemoStreak] = useState(0)

    return (
        <div className="min-h-screen bg-[#0F1419] text-white p-6">
            <div className="max-w-md mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Тест молний</h1>
                    <p className="text-sm text-[#9AA7B0]">Нажми кнопку — ударит молния со звуком, как в тренажёре.</p>
                </div>
                {BUTTONS.map((b) => (
                    <button
                        key={b.variant}
                        onClick={() => setStrike((s) => ({ key: (s?.key ?? 0) + 1, variant: b.variant }))}
                        className="relative z-10 rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)] active:translate-y-0.5"
                        style={{ background: `linear-gradient(180deg, ${b.color} 0%, #2A363C 55%, #141C20 100%)` }}
                    >
                        <span className="flex flex-col items-center gap-1 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] px-6 py-4">
                            <span className="text-lg font-black uppercase tracking-[0.1em]" style={{ color: b.color, textShadow: `0 0 12px ${b.color}99` }}>
                                ⚡ {b.label}
                            </span>
                            <span className="text-xs font-bold text-[#9AA7B0]">{b.hint}</span>
                        </span>
                    </button>
                ))}

                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#3A464E] bg-[#151F23] p-4">
                    <p className="text-sm font-bold text-[#9AA7B0]">Прогресс-бар тренажёра во время серии</p>
                    <TrainerProgressBar percent={65} streak={demoStreak} />
                    <div className="flex gap-2">
                        {[
                            { label: 'Обычная', n: 0 },
                            { label: 'Серия 5+', n: 5 },
                            { label: 'Серия 8+', n: 8 },
                        ].map((b) => (
                            <button
                                key={b.n}
                                onClick={() => setDemoStreak(b.n)}
                                className={`flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold ${demoStreak === b.n ? 'border-[#78C93C] text-white' : 'border-[#3A464E] text-[#9AA7B0]'}`}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {strike && (
                <LightningStrike key={strike.key} variant={strike.variant} label={strike.variant === 'yellow' ? 'КОМБО x5' : 'КОМБО x8'} onDone={() => setStrike(null)} />
            )}
        </div>
    )
}
