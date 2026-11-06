'use client'

// Кнопка с цитатой в углу ангара и окно «Откуда эти фразы»: источники вынесены сюда, чтобы не занимать место в плашке предмета.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Quote, X } from 'lucide-react'
import { HANGAR_JOKES, HANGAR_JOKE_GROUP } from '@/lib/hangarJokes'
import { ZN_RUBRIC_TITLE } from '@/lib/zaNauku'

const GROUPS = Object.keys(HANGAR_JOKES).map(Number)

export function HangarQuotesButton({ className = '' }: { className?: string }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <button type="button" aria-label="Откуда эти фразы" onClick={() => setOpen(true)}
                className={`flex h-[42px] w-[46px] items-center justify-center rounded-xl border-2 border-b-4 border-[#1E2629] bg-[#3A454B] shadow-lg active:border-b-0 ${className}`}
                style={{ zIndex: 1260 }}>
                <Quote className="h-[18px] w-[18px] fill-[#F2C35B] text-[#F2C35B]" />
            </button>
            {open && createPortal(
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-3" onClick={() => setOpen(false)}>
                    <div className="flex max-h-[88vh] w-full max-w-md flex-col rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 border-b border-[#2C3A41] p-3.5">
                            <Quote className="h-5 w-5 shrink-0 fill-[#F2C35B] text-[#F2C35B]" />
                            <span className="flex-1 text-lg font-black text-[#F2F7FB]">Откуда эти фразы</span>
                            <button type="button" aria-label="Закрыть" onClick={() => setOpen(false)} className="-mr-1 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="overflow-y-auto p-3.5">
                            <p className="text-sm font-bold leading-snug text-[#E8D9B8]">
                                Цитаты на предметах ангара взяты из газеты МФТИ «За науку». Над этими шутками физтехи смеялись на лекциях и экзаменах задолго до нас. Мы нашли их в сборнике «Время было такое» (1959–1995).
                            </p>
                            <p className="mt-2 text-sm font-bold leading-snug text-[#E8D9B8]">
                                Слова после цитаты дописал Команданте. Ещё больше шуток лежит в архиве на починенном компьютере.
                            </p>
                            {GROUPS.map((g) => (
                                <div key={g} className="mt-4">
                                    <p className="text-xs font-black uppercase tracking-wide text-[#F2C35B]">{HANGAR_JOKE_GROUP[g]}</p>
                                    {HANGAR_JOKES[g].map((j) => (
                                        <div key={j.quote} className="mt-2">
                                            <p className="text-sm leading-snug text-[#F2F7FB]">{j.quote}</p>
                                            <p className="mt-0.5 text-[11px] font-bold text-[#7E8F99]">{ZN_RUBRIC_TITLE[j.rubric]}, {j.source}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
