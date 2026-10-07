// store/use-trainer-nav-store.ts
//
// Связь карты скиллов тренажёра (простой вид) с верхней липкой шапкой на телефоне:
// карта сообщает, какой юнит сейчас на экране (название и цвет) и как открыть меню юнитов,
// а шапка (components/mobile-header.tsx) рисует из этого кнопку на всю ширину.

import { create } from 'zustand';

type TrainerNavStore = {
    title: string | null;
    button: string;
    bottom: string;
    open: (() => void) | null;
    set: (p: { title: string; button: string; bottom: string }) => void;
    setOpen: (fn: (() => void) | null) => void;
    clear: () => void;
};

export const useTrainerNavStore = create<TrainerNavStore>((set) => ({
    title: null,
    button: '#53ADEF',
    bottom: '#428BC0',
    open: null,
    set: (p) => set(p),
    setOpen: (fn) => set({ open: fn }),
    clear: () => set({ title: null, open: null }),
}));
