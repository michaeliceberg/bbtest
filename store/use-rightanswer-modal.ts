// store/use-rightanswer-modal.ts

import { create } from "zustand";

type RightAnswerModalState = {
    isOpen: boolean
    points: number
    gems: number
    openR: (points?: number, gems?: number) => void
    close: () => void
}

export const useRightAnswerModal = create<RightAnswerModalState>((set) => ({
    isOpen: false,
    points: 0,
    gems: 0,
    openR: (points = 10, gems = 1) => {
        // Отправляем событие с данными
        window.dispatchEvent(new CustomEvent('rightAnswerModalOpen', { 
            detail: { points, gems } 
        }));
        set({ isOpen: true, points, gems });
    },
    close: () => set({ isOpen: false, points: 0, gems: 0 }),
}))



