'use client'

// Проба Баллометра: настоящее окно (components/ballometer.tsx) на придуманных данных. Сохранение отключено.

import { useEffect, useState } from 'react'
import { BallometerPanel, BallometerChip } from '@/components/ballometer'
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
    useEffect(() => { setNowIso(new Date().toISOString()) }, [])
    if (!nowIso) return <main className="min-h-screen bg-[#131D22]" />
    const d = { primary, perWeek, targetTest: EGE_DEFAULT_TARGET, setGain: 0.2, goalDateIso: null, setsGoal: null, setsThisWeek: 2, setsToday: 1, nowIso }
    return (
        <main className="mx-auto min-h-screen max-w-md space-y-3 bg-[#131D22] p-3 text-[#F2F7FB]">
            <section className="rounded-2xl border border-[#2C3A41] bg-[#151F23] p-3 text-sm">
                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button key={p.label} type="button" onClick={() => { setPrimary(p.primary); setPerWeek(p.perWeek) }}
                            className="rounded-lg border-2 border-b-4 border-[#3A464E] bg-[#1C282E] px-2.5 py-1 text-xs font-bold active:border-b-0">{p.label}</button>
                    ))}
                    <BallometerChip d={d} className="h-9" />
                </div>
            </section>
            <section className="rounded-2xl border-2 border-[#6B5B3A] bg-[#151F23] p-3.5"><BallometerPanel d={d} demo /></section>
        </main>
    )
}
