// components/learn-section-header.tsx
//
// Экран раздела задачника (/learn?task=N, ЕГЭ Математика): «← В ангар», предмет этого задания и где ученик сейчас:
// тренажёры d/t → задачи s/25. Сами тренажёры (кнопки тем с медалями) и уроки — ниже.

import Link from 'next/link'
import { ArrowLeft, Check, Dumbbell, ListChecks } from 'lucide-react'

export function LearnSectionHeader({ num, title, pic, tasks, trainers }: {
    num: number; title: string; pic: string
    tasks?: { solved: number; target: number }
    trainers: { title: string; percent: number }[]
}) {
    const tDone = trainers.filter((t) => t.percent > 0).length
    const tOk = trainers.length === 0 || tDone >= trainers.length
    const solved = Math.min(tasks?.solved ?? 0, tasks?.target ?? 0)
    const chip = (ok: boolean) => `flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black ${ok ? 'bg-[#163322] text-[#9EE8B0]' : 'bg-[#0F171B] text-[#C9D3D9]'}`
    return (
        <div>
            <Link href="/learn" className="inline-flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#151F23] px-3 py-1.5 text-sm font-black text-[#C9D3D9] active:border-b-2">
                <ArrowLeft className="h-4 w-4" />В ангар
            </Link>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#2A363C] bg-[#151F23] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pic} alt="" aria-hidden draggable={false} className="h-16 w-16 flex-shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wide text-[#53ADEF]">Задание {num}</p>
                    <p className="truncate text-lg font-black text-[#F2F7FB]">{title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {trainers.length > 0 && (
                            <span className={chip(tOk)}>{tOk ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Dumbbell className="h-3.5 w-3.5" />}Тренажёры {tDone}/{trainers.length}</span>
                        )}
                        {tasks && tasks.target > 0 && (
                            <span className={chip(solved >= tasks.target)}><ListChecks className="h-3.5 w-3.5" />Задачи {solved}/{tasks.target}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
