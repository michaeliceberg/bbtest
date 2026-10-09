// lib/bandStickers.ts — «банд-стикеры»: картинки для банды (public/band-imgs/bandN.webp).
// Выпадают только из мегакейса главы банды-победителя недельной битвы (lib/gangWeek.ts).
// Повтор поднимает уровень стикера (звёздочки). 1–10 — редкие (синяя рамка с блеском),
// 11–12 — легендарные (золотая переливающаяся), выпадают ~в 10 раз реже.
// Файл без server-only: каталог нужен и на клиенте (плитки, барабан).

export type BandRarity = 'rare' | 'legendary'
export type BandSticker = { id: number; src: string; rarity: BandRarity; weight: number }

export const BAND_STICKERS: BandSticker[] = Array.from({ length: 12 }, (_, i) => {
    const id = i + 1
    const legendary = id >= 11
    return { id, src: `/band-imgs/band${id}.webp`, rarity: legendary ? 'legendary' : 'rare', weight: legendary ? 1 : 10 }
})
export const BAND_STICKER_BY_ID: Record<number, BandSticker> = Object.fromEntries(BAND_STICKERS.map((s) => [s.id, s]))

export const pickBandSticker = (): BandSticker => {
    const total = BAND_STICKERS.reduce((s, x) => s + x.weight, 0)
    let r = Math.random() * total
    for (const s of BAND_STICKERS) { r -= s.weight; if (r < 0) return s }
    return BAND_STICKERS[0]
}

// Картинка банды хранится в gangs.emoji как 'band:N' (рядом с 'icon:id' и старыми эмодзи).
export const BAND_PREFIX = 'band:'
export const bandIdOf = (value: string | null | undefined): number | null => {
    if (!value || !value.startsWith(BAND_PREFIX)) return null
    const id = Number(value.slice(BAND_PREFIX.length))
    return BAND_STICKER_BY_ID[id] ? id : null
}
