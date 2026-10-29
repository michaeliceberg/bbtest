'use client'

// components/trainer-key-chips.tsx
//
// Раздел задачника (/learn): какие темы тренажёра готовят к этому заданию ЕГЭ — «каркас» для задач.
// Кнопки в ряд (переносятся на новую строку): не начато — бледные, с медалью — горят.
// Нажатие → «Перейти к тренажёру X?» → /trainer?topic=<название темы> (карта откроет нужную тему).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TinyMedal, medalFor } from '@/components/nav-sheet-ui'

export type TrainerKeyChip = { tUnitId: number; title: string; percent: number }

const LIT = { bronze: '#B9784F', silver: '#7FB6DE', gold: '#F0A818' } as const

export function TrainerKeyChips({ num, keys }: { num: number; keys: TrainerKeyChip[] }) {
    const router = useRouter()
    const [ask, setAsk] = useState<TrainerKeyChip | null>(null)
    if (!keys.length) return null
    const ready = keys.filter((k) => k.percent > 0).length
    return (
        <div className="mb-4 rounded-2xl border-2 border-[#26333B] bg-[#161F23] px-3 py-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-black text-[#9AA7B0]">
                <Dumbbell className="h-4 w-4 text-[#F2C35B]" />
                <span>Каркас для №{num} — тренажёры</span>
                <span className="ml-auto text-[#E2EAF0]">{ready}/{keys.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {keys.map((k) => {
                    const m = medalFor(k.percent)
                    const lit = m !== 'none'
                    const c = lit ? LIT[m] : null
                    return (
                        <button
                            key={k.tUnitId}
                            type="button"
                            onClick={() => setAsk(k)}
                            className="flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-[13px] font-extrabold transition-transform active:scale-95"
                            style={lit
                                ? { borderColor: c!, color: '#F2F7FB', background: `${c}26`, boxShadow: `0 3px 0 ${c}66` }
                                : { borderColor: '#2C3A41', color: '#6B7A83', background: '#1A2328', boxShadow: '0 3px 0 #10171A' }}
                        >
                            <TinyMedal percent={k.percent} size={16} />
                            {k.title}
                        </button>
                    )
                })}
            </div>

            <Dialog open={!!ask} onOpenChange={(o) => { if (!o) setAsk(null) }}>
                <DialogContent className="max-w-sm border-2 border-[#2C3A41] bg-[#161F23] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-black">Перейти к тренажёру «{ask?.title}»?</DialogTitle>
                        <DialogDescription className="text-center text-[#9AA7B0]">
                            {ask && ask.percent > 0 ? `Пройдено ${ask.percent}% — добей тему, и задачи №${num} пойдут легче.` : `Сначала каркас: эта тема готовит к заданию №${num}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => setAsk(null)}
                            className="flex-1 rounded-xl px-3 py-3 font-extrabold text-[#C9D4DA] active:translate-y-[3px]"
                            style={{ background: '#26333B', boxShadow: '0 3px 0 #10171A' }}>Остаться</button>
                        <button type="button" onClick={() => { const t = ask!.title; setAsk(null); router.push(`/trainer?topic=${encodeURIComponent(t)}`) }}
                            className="flex-1 rounded-xl px-3 py-3 font-extrabold text-[#0F171B] active:translate-y-[3px]"
                            style={{ background: '#78C93C', boxShadow: '0 3px 0 #60A12F' }}>Перейти</button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
