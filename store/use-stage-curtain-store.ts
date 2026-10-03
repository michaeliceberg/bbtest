// store/use-stage-curtain-store.ts
//
// «Шторка» при открытии урока тренажёра (components/stage-curtain-provider.tsx).
// Состояние живёт в сторе, а сама шторка — в корневом layout: при переходе
// /trainer → /t-lesson страница /trainer размонтируется, а шторка должна
// пережить смену маршрута и уйти вбок уже поверх нового урока.

import { create } from 'zustand';
import type { ReactNode } from 'react';

export type StageCurtainPayload = {
    href: string;
    // Плитка нажатого этапа (копия показывается на шторке).
    tileSize: number;
    tileBackground?: string;
    tileBorder?: string;
    icon: ReactNode;
    title?: string;
    subtitle?: string;
    accent: string;
};

type StageCurtainStore = {
    payload: StageCurtainPayload | null;
    start: (p: StageCurtainPayload) => void;
    end: () => void;
};

export const useStageCurtainStore = create<StageCurtainStore>((set, get) => ({
    payload: null,
    start: (p) => { if (!get().payload) set({ payload: p }); },
    end: () => set({ payload: null }),
}));
