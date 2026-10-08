'use client'

// components/ege-gain-toast.tsx — «+N к прогнозу ЕГЭ» после урока тренажёра или верной задачи
// задачника (расчёт — getEgeGain в lib/egeMap.ts). Тап ведёт в «Мой путь».

import Link from 'next/link'
import { toast } from 'sonner'
import type { EgeGain } from '@/lib/egeMap'

const fmt = (x: number) => {
    const v = x < 0.1 ? Math.round(x * 100) / 100 : Math.round(x * 10) / 10
    return v.toString().replace('.', ',')
}

export const showEgeGain = (gain: EgeGain | null | undefined) => {
    if (!gain || gain.primary < 0.005) return
    const jumped = gain.toTest > gain.fromTest
    toast.custom((id) => (
        <Link
            href="/path"
            onClick={() => toast.dismiss(id)}
            className="flex w-[340px] max-w-[calc(100vw-32px)] items-center gap-3 rounded-2xl border-2 px-3.5 py-3"
            style={{
                borderColor: jumped ? '#F2C35B' : '#78C93C',
                background: jumped ? 'linear-gradient(135deg, #3A2E12, #161F23 70%)' : 'linear-gradient(135deg, #1E2E18, #161F23 70%)',
                boxShadow: `0 5px 0 ${jumped ? '#7A5A12' : '#2F4A22'}, 0 12px 24px rgba(0,0,0,0.45)`,
            }}
        >
            <span className="text-3xl">{jumped ? '🚀' : '📈'}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-base font-black" style={{ color: jumped ? '#F2C35B' : '#A1D151' }}>
                    +{fmt(gain.primary)} к прогнозу ЕГЭ
                </span>
                <span className="block truncate text-xs font-bold text-[#C9D3D9]">
                    {jumped ? `≈${gain.fromTest} → ${gain.toTest} тестовых баллов!` : gain.taskNum ? `Задание №${gain.taskNum} · ${gain.taskTitle}` : 'Копилка «Моего пути» растёт'}
                </span>
            </span>
            <span className="shrink-0 text-xs font-black text-[#9AA7B0]">Мой путь ›</span>
        </Link>
    ), { duration: jumped ? 6000 : 4000 })
}
