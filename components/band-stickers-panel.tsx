'use client'

// components/band-stickers-panel.tsx — коллекция банд-стикеров на странице банды: 12 плиток
// (закрытые — силуэт с замком). Глава нажимает открытый стикер — он становится картинкой банды.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BAND_STICKERS } from '@/lib/bandStickers'
import { BandStickerTile } from '@/components/band-sticker-tile'
import { setGangBandImage } from '@/actions/band-stickers'

export const BandStickersPanel = ({ levels, isLeader, currentId }: {
    levels: Record<number, number>; isLeader: boolean; currentId: number | null
}) => {
    const router = useRouter()
    const [msg, setMsg] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const opened = Object.keys(levels).length

    const pick = (id: number) => {
        if (!levels[id]) { setMsg('Закрыт — выпадает из мегакейса главы банды-победителя недели'); return }
        if (!isLeader) { setMsg('Картинку банды выбирает глава'); return }
        if (id === currentId) return
        startTransition(async () => {
            const r = await setGangBandImage(id).catch(() => ({ error: 'Что-то пошло не так' }))
            setMsg('ok' in r ? 'Готово — новая картинка банды!' : r.error)
            router.refresh()
        })
    }

    return (
        <div className="rounded-3xl border-2 border-[#2A363C] bg-[#161F23] p-4">
            <div className="flex items-baseline justify-between">
                <p className="text-lg font-black text-[#F2F7FB]">Банд-стикеры</p>
                <p className="text-xs font-bold text-[#9AA7B0]">{opened} / {BAND_STICKERS.length}</p>
            </div>
            <p className="mt-0.5 text-xs text-[#9AA7B0]">
                Выпадают главе банды-победителя из мегакейса. Повтор — +★. {isLeader ? 'Нажми открытый — он станет картинкой банды.' : ''}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                {BAND_STICKERS.map((s) => (
                    <button key={s.id} type="button" disabled={pending} onClick={() => pick(s.id)}
                        className="flex aspect-square items-center justify-center active:scale-95 transition-transform">
                        <BandStickerTile id={s.id} level={levels[s.id] ?? 0} size={72} selected={s.id === currentId} />
                    </button>
                ))}
            </div>
            {msg && <p className="mt-3 text-center text-sm font-bold text-[#C9D3D9]">{msg}</p>}
        </div>
    )
}
