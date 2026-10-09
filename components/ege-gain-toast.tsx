'use client'

// components/ege-gain-toast.tsx — «+N к прогнозу ЕГЭ» после урока тренажёра или верной задачи
// задачника (расчёт — getEgeGain в lib/egeMap.ts). Тап ведёт в «Мой путь».

import Link from 'next/link'
import { toast } from 'sonner'
import type { EgeGain } from '@/lib/egeMap'

// «через 3 урока» / «через 5 задач»
const stepsWord = (n: number, kind: EgeGain['kind']) => {
    const m10 = n % 10, m100 = n % 100
    const f = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2
    return kind === 't_unit' ? ['урок', 'урока', 'уроков'][f] : ['задачу', 'задачи', 'задач'][f]
}

// Плашка висит 4–5 с — поэтому одна короткая строка: «🎯 +1 балл ЕГЭ через 3 урока».
export const showEgeGain = (gain: EgeGain | null | undefined) => {
    if (!gain || gain.primary < 0.005) return
    const jumped = gain.toTest > gain.fromTest
    const steps = gain.stepsToNext
    const text = jumped ? '+1 балл ЕГЭ!'
        : steps !== null && steps <= 10 ? `+1 балл ЕГЭ через ${steps} ${stepsWord(steps, gain.kind)}`
        : 'Прогноз ЕГЭ растёт'
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
            <span className="text-3xl">{jumped ? '🚀' : steps !== null && steps <= 10 ? '🎯' : '📈'}</span>
            <span className="min-w-0 flex-1 text-base font-black leading-tight" style={{ color: jumped ? '#F2C35B' : '#A1D151' }}>
                {text}
            </span>
            <span className="shrink-0 text-xs font-black text-[#9AA7B0]">Мой путь ›</span>
        </Link>
    ), { duration: 5000 })
}
