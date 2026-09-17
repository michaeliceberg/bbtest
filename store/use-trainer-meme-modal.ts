import { create } from "zustand";

type Variant = 'right' | 'wrong'

type TrainerMemeModalState = {
    isOpen: boolean
    variant: Variant
    openRight: () => void
    openWrong: () => void
    close: () => void
}

export const useTrainerMemeModal = create<TrainerMemeModalState>((set) => ({
    isOpen: false,
    variant: 'right',
    openRight: () => set({ isOpen: true, variant: 'right' }),
    openWrong: () => set({ isOpen: true, variant: 'wrong' }),
    close: () => set({ isOpen: false }),
}))
