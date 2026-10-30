'use client'

// components/hangar-entry.tsx
//
// Плитка «Ангар» на /learn (справа от карточки уровня): превью ангара ученика в его текущем состоянии,
// посередине кнопка «В ангар». По нажатию ангар открывается во весь экран — можно выбирать задания,
// подсвечивать предметы и чинить, как в «Моём пути».

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Warehouse } from 'lucide-react'
import { RepairIcon } from '@/components/repair-icon'
import { HangarScene, type SceneItem } from '@/components/hangar-scene'
import type { LayoutOverrides } from '@/lib/hangarModel'

export function HangarEntry({ items, layout, catStage = 0, openOnLoad = false }: { items: SceneItem[]; layout?: LayoutOverrides | null; catStage?: number; openOnLoad?: boolean }) {
    // /learn?hangar=1 (ссылка из оповещения «кто-то мяучит») — ангар открывается сразу
    const [open, setOpen] = useState(openOnLoad)
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
                    <HangarScene items={items} layout={layout} catStage={catStage} bare />
                </div>
                <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(closest-side, rgba(15,23,27,0.15), rgba(15,23,27,0.65))' }} />
                <div className="relative flex h-full flex-col items-center justify-center gap-2 p-2">
                    <button type="button" onClick={() => setOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border-b-4 px-3 py-2 text-sm font-black uppercase text-[#3A2A08] active:border-b-0"
                        style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', borderBottomColor: '#B8862E' }}>
                        <Warehouse className="h-4 w-4" strokeWidth={2.6} />В ангар
                    </button>
                    <span className="flex items-center gap-1 rounded-md bg-[#0F171B]/80 px-1.5 py-0.5 text-[11px] font-black text-[#C9D3D9]" title="Починено">
                        {catStage === 1 ? 'Кто-то мяучит!' : ready ? 'Есть что починить!' : <><RepairIcon className="h-3.5 w-3.5 text-[#F2C35B]" />{fixed}/20</>}
                    </span>
                </div>
            </div>

            {mounted && open && createPortal(
                <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#0F171B]">
                    {/* продолжение картинки во все стороны: тот же ангар, сильно размытый и затемнённый (статично) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/bg.webp" alt="" aria-hidden draggable={false}
                        className="pointer-events-none fixed inset-0 h-full w-full scale-125 object-cover"
                        style={{ filter: 'blur(36px) brightness(0.55) saturate(1.2)' }} />
                    <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(15,23,27,0) 30%, rgba(15,23,27,0.75) 100%)' }} />
                    <div className="relative mx-auto w-full max-w-xl px-4 pb-10 pt-4">
<HangarScene items={items} layout={layout} catStage={catStage} onClose={() => setOpen(false)} />
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
