// store/celebration-store.ts

import { create } from 'zustand';

type Reward = {
    points?: number;
    gems?: number;
    lootBox?: string;
};

type CelebrationState = {
    isOpen: boolean;
    title: string;
    message: string;
    reward: Reward | null;
    show: (title: string, message?: string, reward?: Reward | null) => void;
    hide: () => void;
};

export const useCelebrationStore = create<CelebrationState>((set) => ({
    isOpen: false,
    title: '',
    message: '',
    reward: null,
    show: (title, message = '', reward = null) => set({ isOpen: true, title, message, reward }),
    hide: () => set({ isOpen: false, title: '', message: '', reward: null }),
}));