'use client'

// components/ege-task-grid.tsx
//
// Карточка темы тренажёра: плитка всех 20 заданий ЕГЭ (как сверху задачника), горят те,
// к которым готовит эта тема. Горящая клетка ведёт в раздел задачника (/learn?task=N).

import Link from 'next/link'
import { KeyRound } from 'lucide-react'

export const EGE_PART_COLOR = { part1: '#53ADEF', part2: '#C385F7' } as const

const Cell = ({ n, on }: { n: number; on: boolean }) => {
    const color = n <= 13 ? EGE_PART_COLOR.part1 : EGE_PART_COLOR.part2
    const cls = 'flex h-6 min-w-0 items-center justify-center rounded-[5px] text-[10px] font-black'
    if (!on) return <span className={cls} style={{ background: '#1C262B', color: '#3E4B52' }}>{n}</span>
    return (
        <Link href={`/learn?task=${n}`} title={`Задание №${n} в задачнике`} className={`${cls} active:scale-90 transition-transform`}
            style={{ background: color, color: '#0F171B', boxShadow: `0 0 10px ${color}88` }}>
            {n}
        </Link>
    )
}

export function EgeTaskGrid({ tasks }: { tasks: number[] }) {
    if (!tasks.length) return null
    const set = new Set(tasks)
    return (
        <div className="mb-4 rounded-xl border border-[#26333B] bg-[#0F171B]/70 px-2.5 py-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-[#9AA7B0]">
                <KeyRound className="h-3.5 w-3.5 text-[#F2C35B]" />
                Ключ к заданиям ЕГЭ: <span className="text-[#E2EAF0]">{tasks.map((n) => `№${n}`).join(', ')}</span>
            </div>
            {/* одна сетка на 13 колонок: вторая часть (7 клеток) под первой, клетки одного размера */}
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                {Array.from({ length: 20 }, (_, i) => <Cell key={i} n={i + 1} on={set.has(i + 1)} />)}
            </div>
        </div>
    )
}
