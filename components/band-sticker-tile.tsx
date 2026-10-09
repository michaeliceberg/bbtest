'use client'

// components/band-sticker-tile.tsx — плитка банд-стикера: рамка по редкости (1–10 синяя с блеском,
// 11–12 золотая переливающаяся), закрытый — силуэт с замком, уровень — звёздочки.

import { Lock } from 'lucide-react'
import { BAND_STICKER_BY_ID } from '@/lib/bandStickers'

export const BandStickerTile = ({ id, level = 0, size = 96, selected = false, showStars = true }: {
    id: number; level?: number; size?: number; selected?: boolean; showStars?: boolean
}) => {
    const st = BAND_STICKER_BY_ID[id]
    const legendary = st.rarity === 'legendary'
    const locked = level <= 0
    const r = Math.round(size * 0.2)
    return (
        <div className="relative overflow-hidden" style={{
            width: size, height: size, borderRadius: r, padding: Math.max(2, Math.round(size / 32)),
            background: legendary ? '#B8862E' : 'linear-gradient(135deg, #9BE1FF, #2E7BE8 55%, #9BE1FF)',
            boxShadow: selected
                ? `0 0 0 3px #F2F7FB, 0 0 ${size / 4}px ${legendary ? 'rgba(255,215,100,0.7)' : 'rgba(83,173,239,0.7)'}`
                : `0 0 ${size / 6}px -2px ${legendary ? 'rgba(255,215,100,0.6)' : 'rgba(83,173,239,0.5)'}`,
            opacity: locked ? 0.75 : 1,
        }}>
            {legendary && <div className="band-gold-spin" />}
            <div className="relative h-full w-full overflow-hidden" style={{
                borderRadius: r - 2,
                background: legendary ? 'radial-gradient(circle at 50% 30%, #4A3A16, #141B1F 75%)' : 'radial-gradient(circle at 50% 30%, #1E3A55, #141B1F 75%)',
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={st.src} alt="" draggable={false} className="h-full w-full object-contain p-[6%]"
                    style={locked ? { filter: 'brightness(0)', opacity: 0.45 } : undefined} />
                {locked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="text-[#C9D3D9]" style={{ width: size * 0.26, height: size * 0.26 }} />
                    </div>
                )}
                {!locked && showStars && (
                    <div className="absolute inset-x-0 bottom-0.5 flex justify-center gap-px font-black leading-none drop-shadow"
                        style={{ fontSize: Math.max(9, size * 0.15), color: legendary ? '#FFE58A' : '#BDEBFF' }}>
                        {level <= 5 ? '★'.repeat(level) : `★×${level}`}
                    </div>
                )}
            </div>
            {!locked && <div className="band-sheen" />}
        </div>
    )
}
