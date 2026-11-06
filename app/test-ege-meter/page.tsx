'use client'

// Проба Баллометра: настоящее окно (components/ballometer.tsx) на придуманных данных. Сохранение отключено.

import { useEffect, useState } from 'react'
import { BallometerPanel, BallometerChip, BallometerTab, BallometerSide, BALLOMETER_TAB_VARIANTS } from '@/components/ballometer'
import { EGE_DEFAULT_TARGET } from '@/lib/egeMeter'

const PRESETS: { label: string; primary: number; perWeek: number | null }[] = [
    { label: 'Летит', primary: 8, perWeek: 1 },
    { label: 'Без запаса', primary: 8, perWeek: 0.48 },
    { label: '3,8', primary: 8, perWeek: 0.43 },
    { label: 'Сбавил', primary: 8, perWeek: 0.2 },
    { label: 'Стоит', primary: 8, perWeek: 0 },
    { label: 'Новичок', primary: 0, perWeek: null },
]

export default function TestEgeMeterPage() {
    const [primary, setPrimary] = useState(8)
    const [perWeek, setPerWeek] = useState<number | null>(0.43)
    // дата только в браузере: иначе сервер и браузер считают карту от разного времени
    const [nowIso, setNowIso] = useState<string | null>(null)
    const [tabVariant, setTabVariant] = useState(0)
    useEffect(() => { setNowIso(new Date().toISOString()) }, [])
    if (!nowIso) return <main className="min-h-screen bg-[#131D22]" />
    const d = { primary, perWeek, targetTest: EGE_DEFAULT_TARGET, setGain: 0.2, goalDateIso: null, setsGoal: null, setsThisWeek: 2, setsToday: 1, nowIso }
    return (
        <main className="mx-auto min-h-screen max-w-md space-y-3 bg-[#131D22] p-3 text-[#F2F7FB]">
            <section className="mr-9 rounded-2xl border border-[#2C3A41] bg-[#151F23] p-3 text-sm">
                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button key={p.label} type="button" onClick={() => { setPrimary(p.primary); setPerWeek(p.perWeek) }}
                            className="rounded-lg border-2 border-b-4 border-[#3A464E] bg-[#1C282E] px-2.5 py-1 text-xs font-bold active:border-b-0">{p.label}</button>
                    ))}
                    <BallometerChip d={d} className="h-9" />
                </div>
            </section>
            {/* мини-значок у правого края: варианты; выбранный стоит справа над линейкой, нажатие выдвигает панель */}
            <section className="mr-9 rounded-2xl border border-[#2C3A41] bg-[#151F23] p-3 text-sm">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#C9B98F]">Мини-значок у края · нажми, чтобы поставить справа</p>
                <div className="flex items-end justify-between gap-2">
                    {BALLOMETER_TAB_VARIANTS.map((name, i) => (
                        <div key={name} className="flex flex-col items-end gap-1">
                            <div className={`rounded-xl p-1 pr-0 ${tabVariant === i ? 'bg-[#F2C35B]/20 ring-2 ring-[#F2C35B]' : ''}`}>
                                <BallometerTab d={d} variant={i} onClick={() => setTabVariant(i)} />
                            </div>
                            <span className="w-full text-center text-[11px] font-bold text-[#9AA7B0]">{name}</span>
                        </div>
                    ))}
                </div>
            </section>
            <section className="rounded-2xl border-2 border-[#6B5B3A] bg-[#151F23] p-3.5"><BallometerPanel d={d} demo /></section>
            {/* макет свёрнутой линейки ЕГЭ — чтобы видеть, как значок стоит над ней */}
            <div className="pointer-events-none fixed right-0 top-1/2 z-[59] flex h-[370px] w-[30px] -translate-y-1/2 justify-center rounded-l-lg border-y border-l border-[#272E19] pt-1.5 text-[8px] font-black text-[#D9D2B0]"
                style={{ background: 'linear-gradient(90deg,#55613A,#3D4728 40%,#272E19)' }}>ЕГЭ</div>
            <BallometerSide d={d} variant={tabVariant} demo />
        </main>
    )
}
