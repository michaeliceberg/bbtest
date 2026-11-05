// components/learn-section-header.tsx
//
// Экран раздела задачника (/learn?task=N, ЕГЭ Математика): «← В ангар», предмет этого задания и где ученик сейчас:
// тренажёры d/t → задачи s/25. Сами тренажёры (кнопки тем с медалями) и уроки — ниже.

import Link from 'next/link'
import { ArrowLeft, Check, Dumbbell, ListChecks, Star } from 'lucide-react'

export function LearnSectionHeader({ num, title, pic, tasks, trainers, fixed = false }: {
    num: number; title: string; pic: string
    tasks?: { solved: number; target: number; full?: number }
    fixed?: boolean
    trainers: { title: string; percent: number }[]
}) {
    const tDone = trainers.filter((t) => t.percent >= 50).length // на серебре — нужно для починки
    const tOk = trainers.length === 0 || tDone >= trainers.length
    const solved = Math.min(tasks?.solved ?? 0, tasks?.target ?? 0)
    const tGold = trainers.filter((t) => t.percent >= 100).length
    const gold = fixed && tGold >= trainers.length && (tasks?.solved ?? 0) >= (tasks?.full ?? 0)
    const chip = (ok: boolean) => `flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black ${ok ? 'bg-[#163322] text-[#9EE8B0]' : 'bg-[#0F171B] text-[#C9D3D9]'}`
    return (
        <div>
            <Link href="/learn" className="inline-flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#151F23] px-3 py-1.5 text-sm font-black text-[#C9D3D9] active:border-b-2">
                <ArrowLeft className="h-4 w-4" />В ангар
            </Link>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#2A363C] bg-[#151F23] p-3">
                <ItemBadge pic={pic} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wide text-[#53ADEF]">Задание {num}</p>
                    <p className="truncate text-lg font-black text-[#F2F7FB]">{title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {trainers.length > 0 && (
                            <span className={chip(tOk)}>{tOk ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Dumbbell className="h-3.5 w-3.5" />}Тренажёры {tDone}/{trainers.length}</span>
                        )}
                        {/* до починки — сколько задач нужно, чтобы починить; после — путь к золоту (весь раздел + тренажёры на золото) */}
                        {!fixed && tasks && tasks.target > 0 && (
                            <span className={chip(solved >= tasks.target)}><ListChecks className="h-3.5 w-3.5" />Задачи {solved}/{tasks.target}</span>
                        )}
                        {fixed && (
                            <span className="flex items-center gap-1.5 rounded-lg bg-[#2A2410] px-2 py-1 text-xs font-black text-[#FFD84D]">
                                <Star className="h-3.5 w-3.5" fill={gold ? '#FFD84D' : 'none'} />
                                {gold ? 'Золото!' : `Золото: задачи ${Math.min(tasks?.solved ?? 0, tasks?.full ?? 0)}/${tasks?.full ?? 0}, тренажёры ${tGold}/${trainers.length}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Предмет ангара на светлом круге: картинки рисованы для светлого пола ангара, и на тёмной карточке тёмные вещи
// (провода, бочка) почти не видны. Круг — пыльно-бежевый, как пол ангара, с объёмной нижней гранью; под предметом
// своей тени нет — у картинок ангара тень уже нарисована.
function ItemBadge({ pic }: { pic: string }) {
    return (
        <span className="relative h-[72px] w-[72px] flex-shrink-0">
            <span className="absolute inset-x-0 bottom-0 top-[6px] rounded-full border-b-4"
                style={{ background: 'radial-gradient(circle at 50% 30%, #EFE4C8, #C9B98F 70%, #A8976C)', borderBottomColor: '#7A6A45', boxShadow: '0 6px 14px -6px #000c' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pic} alt="" aria-hidden draggable={false} className="relative h-full w-full object-contain p-1.5" />
        </span>
    )
}
