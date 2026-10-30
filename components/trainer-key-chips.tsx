'use client'

// components/trainer-key-chips.tsx
//
// Тренажёры-«каркас» задания ЕГЭ в задачнике (/learn).
// • TrainerGoDialog — окошко «Перейти в тренажёр»: список тем задания с медалями, выбираешь тему → «Перейти»
//   (/trainer?topic=<название>) или «Назад»; клик мимо окна закрывает. Открывается и из шкалы «Прогресс по
//   разделам» (зелёная кнопка-гантель над ячейкой), и из блока в разделе.
// • TrainerKeyChips — блок в раскрытом разделе (над круглыми кнопками уроков): какие тренажёры пройдены (медаль),
//   какие ещё нет, и мягкое «Внимание: сначала тренажёры». Тема пройдена = есть хотя бы бронза.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Dumbbell } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TinyMedal, medalFor } from '@/components/nav-sheet-ui'
import { declensionRu } from '@/usefulFunctions'

export type TrainerKeyChip = { tUnitId: number; title: string; percent: number }

export const TRAINER_GREEN = { top: '#8BDB4C', bottom: '#5FAE2E', edge: '#3F7F1C', text: '#10230A' }
export const trainerKeyDone = (k: TrainerKeyChip) => k.percent > 0
const MEDAL_WORD = { none: 'не начато', bronze: 'бронза', silver: 'серебро', gold: 'золото' } as const

export function TrainerGoDialog({ num, keys, open, initialId, onClose }: {
    num: number; keys: TrainerKeyChip[]; open: boolean; initialId?: number | null; onClose: () => void
}) {
    const router = useRouter()
    const firstTodo = keys.find((k) => !trainerKeyDone(k)) ?? keys[0]
    const [pick, setPick] = useState<number | null>(null)
    useEffect(() => { if (open) setPick(initialId ?? firstTodo?.tUnitId ?? null) }, [open, initialId, firstTodo?.tUnitId])
    const chosen = keys.find((k) => k.tUnitId === pick) ?? null

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="max-w-sm border-2 border-[#2C3A41] bg-[#161F23] text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl font-black">
                        <Dumbbell className="h-5 w-5 text-[#8BDB4C]" />Перейти в тренажёр?
                    </DialogTitle>
                    <DialogDescription className="text-center text-[#9AA7B0]">
                        Эти темы готовят к заданию №{num}.<br />Выбери, с какой начать.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-1 flex flex-col gap-1.5">
                    {keys.map((k) => {
                        const on = k.tUnitId === pick
                        return (
                            <button key={k.tUnitId} type="button" onClick={() => setPick(k.tUnitId)}
                                className="flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-left transition-colors"
                                style={{ borderColor: on ? TRAINER_GREEN.top : '#2C3A41', background: on ? 'rgba(139,219,76,0.12)' : '#1B252A' }}>
                                <TinyMedal percent={k.percent} size={24} boost />
                                <span className="min-w-0 flex-1 text-sm font-extrabold leading-tight text-[#E2EAF0]">{k.title}</span>
                                <span className="shrink-0 text-[11px] font-black" style={{ color: trainerKeyDone(k) ? '#C9D4DA' : '#F2C35B' }}>
                                    {trainerKeyDone(k) ? MEDAL_WORD[medalFor(k.percent)] : 'не пройден'}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <div className="mt-2 flex gap-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 rounded-xl border-b-4 px-3 py-3 font-extrabold text-[#C9D4DA] active:border-b-0"
                        style={{ background: '#26333B', borderBottomColor: '#10171A' }}>Назад</button>
                    <button type="button" disabled={!chosen}
                        onClick={() => { if (!chosen) return; onClose(); router.push(`/trainer?topic=${encodeURIComponent(chosen.title)}`) }}
                        className="flex-1 rounded-xl border-b-4 px-3 py-3 font-extrabold active:border-b-0 disabled:opacity-50"
                        style={{ background: `linear-gradient(180deg, ${TRAINER_GREEN.top}, ${TRAINER_GREEN.bottom})`, borderBottomColor: TRAINER_GREEN.edge, color: TRAINER_GREEN.text }}>Перейти</button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function TrainerKeyChips({ num, keys }: { num: number; keys: TrainerKeyChip[] }) {
    const [ask, setAsk] = useState<number | null>(null)
    if (!keys.length) return null
    const done = keys.filter(trainerKeyDone).length
    const left = keys.length - done
    const all = left === 0

    return (
        <div className="-mt-1 mb-5 overflow-hidden rounded-2xl border-2"
            style={{ borderColor: all ? '#3A4A2E' : 'rgba(139,219,76,0.45)', background: all ? '#161F23' : 'linear-gradient(180deg, rgba(139,219,76,0.10), rgba(22,31,35,1) 60%)' }}>
            <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(180deg, ${TRAINER_GREEN.top}, ${TRAINER_GREEN.bottom})`, boxShadow: `0 3px 0 ${TRAINER_GREEN.edge}` }}>
                    <Dumbbell className="h-5 w-5" style={{ color: TRAINER_GREEN.text }} strokeWidth={2.6} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black leading-tight text-[#F2F7FB]">Тренажёры к заданию №{num}</span>
                    <span className="block text-xs font-bold leading-tight" style={{ color: all ? '#8BDB4C' : '#F2C35B' }}>
                        {all
                            ? 'Все пройдены — задачи пойдут легче 🔥'
                            : `Внимание: ещё ${left} ${declensionRu(left, 'тренажёр', 'тренажёра', 'тренажёров')} не ${left === 1 ? 'пройден' : 'пройдены'} — начни с них`}
                    </span>
                </span>
                <span className="shrink-0 text-sm font-black text-[#C9D4DA]">{done}/{keys.length}</span>
            </div>
            <div className="flex flex-col gap-1 px-2 pb-2">
                {keys.map((k) => {
                    const ok = trainerKeyDone(k)
                    return (
                        <button key={k.tUnitId} type="button" onClick={() => setAsk(k.tUnitId)}
                            className="flex items-center gap-2.5 rounded-xl border-b-4 px-2.5 py-2 text-left active:border-b-0"
                            style={{ background: '#1B252A', borderBottomColor: '#10171A' }}>
                            <TinyMedal percent={k.percent} size={26} boost />
                            <span className={`min-w-0 flex-1 text-sm font-extrabold leading-tight ${ok ? 'text-[#C9D4DA]' : 'text-[#F2F7FB]'}`}>{k.title}</span>
                            {ok ? (
                                <span className="flex shrink-0 items-center gap-1 text-[11px] font-black text-[#8BDB4C]"><Check className="h-3.5 w-3.5" strokeWidth={3} />{MEDAL_WORD[medalFor(k.percent)]}</span>
                            ) : (
                                <span className="flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-black uppercase"
                                    style={{ background: `linear-gradient(180deg, ${TRAINER_GREEN.top}, ${TRAINER_GREEN.bottom})`, color: TRAINER_GREEN.text }}>
                                    Пройти<ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
            <TrainerGoDialog num={num} keys={keys} open={ask !== null} initialId={ask} onClose={() => setAsk(null)} />
        </div>
    )
}
