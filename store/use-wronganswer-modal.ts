import { create } from "zustand";

type WrongAnswerModalState = {
    isOpen: boolean
    open: () => void
    close: () => void

}

export const useWrongAnswerModal = create<WrongAnswerModalState>((set)=> ({
    isOpen: false,
    open: () => set({isOpen: true}),
    close: () => set({isOpen: false}),
}))