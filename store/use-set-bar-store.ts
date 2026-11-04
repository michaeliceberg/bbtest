// store/use-set-bar-store.ts
//
// Полоска «Сета» (components/set-bar.tsx) и мини-значок сета в верхней шапке телефона
// (components/mobile-header.tsx): когда страницу листают вниз, полоска прячется под шапку,
// а справа от кнопки юнита остаются три точки-блюда и сундук.

import { create } from 'zustand'

type SetBarStore = {
    dish: number | null // 0 закуска, 1 основное, 2 десерт, 3 сет съеден / нет сета; null — полоски на странице нет
    compact: boolean
    open: (() => void) | null
    set: (p: Partial<Pick<SetBarStore, 'dish' | 'compact' | 'open'>>) => void
}

export const useSetBarStore = create<SetBarStore>((set) => ({
    dish: null,
    compact: false,
    open: null,
    set: (p) => set(p),
}))
