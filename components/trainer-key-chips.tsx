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
import { NAV_ITEM_PRESS, TinyMedal, medalFor, navItemStyle } from '@/components/nav-sheet-ui'

export type TrainerKeyChip = { tUnitId: number; title: string; percent: number }

export function TrainerKeyChips({ num, keys }: { num: number; keys: TrainerKeyChip[] }) {
    const router = useRouter()
    const [ask, setAsk] = useState<TrainerKeyChip | null>(null)
    if (!keys.length) return null
    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-1.5">
                <Dumbbell className="mr-0.5 h-5 w-5 flex-shrink-0 text-[#9AA7B0]" aria-label="Тренажёры" />
                {keys.map((k) => {
                    const lit = medalFor(k.percent) !== 'none'
                    return (
                        <button
                            key={k.tUnitId}
                            type="button"
                            onClick={() => setAsk(k)}
                            className={`flex items-center gap-1.5 rounded-xl py-1 pl-1.5 pr-2.5 text-[13px] font-extrabold ${NAV_ITEM_PRESS}`}
                            style={{ ...navItemStyle(false), color: lit ? '#E2EAF0' : '#6B7A83', opacity: lit ? 1 : 0.75 }}
                        >
                            <span className="mx-1"><TinyMedal percent={k.percent} size={22} boost /></span>
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
