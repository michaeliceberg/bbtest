'use client'

// components/hangar-entry.tsx
//
// Плитка «Ангар» на /learn (справа от карточки уровня): превью ангара ученика в его текущем состоянии,
// посередине кнопка «В ангар». По нажатию ангар открывается во весь экран — можно выбирать задания,
// подсвечивать предметы и чинить, как в «Моём пути».

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Warehouse, X } from 'lucide-react'
import { HangarScene, type SceneItem } from '@/components/hangar-scene'
import type { LayoutOverrides } from '@/lib/hangarModel'

export function HangarEntry({ items, layout }: { items: SceneItem[]; layout?: LayoutOverrides | null }) {
    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const fixed = items.filter((i) => i.state === 'fixed').length
    const ready = items.some((i) => i.state === 'ready')

    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [open])

    return (
        <>
            <div className="relative h-full min-h-[150px] overflow-hidden rounded-2xl border-2 border-[#2A363C] bg-[#0F171B]">
                {/* превью: сама сцена, чуть приглушённая, без нажатий */}
                <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 opacity-80" aria-hidden>
                    <HangarScene items={items} layout={layout} bare />
                </div>
                <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(closest-side, rgba(15,23,27,0.15), rgba(15,23,27,0.65))' }} />
                <div className="relative flex h-full flex-col items-center justify-center gap-2 p-2">
                    <button type="button" onClick={() => setOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border-b-4 px-3 py-2 text-sm font-black uppercase text-[#3A2A08] active:border-b-0"
                        style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', borderBottomColor: '#B8862E' }}>
                        <Warehouse className="h-4 w-4" strokeWidth={2.6} />В ангар
                    </button>
                    <span className="rounded-md bg-[#0F171B]/80 px-1.5 py-0.5 text-[11px] font-black text-[#C9D3D9]">
                        {ready ? 'Есть что починить!' : `починено ${fixed}/20`}
                    </span>
                </div>
            </div>

            {mounted && open && createPortal(
                <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#0F171B]/95 backdrop-blur-sm">
                    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-4">
                        <div className="mb-1 flex justify-end">
                            <button type="button" aria-label="Закрыть ангар" onClick={() => setOpen(false)}
                                className="rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#161F23] p-2 text-[#C9D3D9] active:border-b-0">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <HangarScene items={items} layout={layout} />
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
