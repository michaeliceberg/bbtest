// store/use-set-bar-store.ts
//
// Полоска «Сета» (components/set-bar.tsx) и мини-значок сета в верхней шапке телефона
// (components/mobile-header.tsx): когда страницу листают вниз, полоска прячется под шапку,
// а справа от кнопки юнита остаются три точки-блюда и колокольчик уровня сета.

import { create } from 'zustand'

type SetBarStore = {
    dish: number | null // 0 закуска, 1 основное, 2 десерт, 3 сет съеден / нет сета; null — полоски на странице нет
    compact: boolean
    chest: string // картинка сундука десерта (редкость растёт с числом сетов за день)
    bell: number // уровень колокольчика = какой это сет за день (1..4)
    open: (() => void) | null
    set: (p: Partial<Pick<SetBarStore, 'dish' | 'compact' | 'open' | 'chest' | 'bell'>>) => void
}

export const useSetBarStore = create<SetBarStore>((set) => ({
    dish: null,
    compact: false,
    chest: '/chests/comm0001.svg',
    bell: 1,
    open: null,
    set: (p) => set(p),
}))
