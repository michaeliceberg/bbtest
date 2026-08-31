// store/use-level-up-store.ts
//
// Очередь для модалки "новый уровень" (components/level-up-modal.tsx) —
// тот же паттерн, что уже используется для ачивок/стрика (store/
// use-achievement-store.ts, store/use-streak-celebration-store.ts).
// oldLevel хранится явно (не просто newLevel-1) — одно начисление XP
// может перепрыгнуть сразу НЕСКОЛЬКО уровней (например тренажёр даёт
// плоские 200 XP за урок), тогда анимация "было → стало" должна idти
// от настоящего старого уровня, не от newLevel-1.

import { create } from 'zustand';

type LevelUpEvent = {
    id: number; // Date.now() — React key для гарантированного ремаунта
    oldLevel: number;
    newLevel: number;
    gemsAwarded: number;
};

type LevelUpStore = {
    queue: LevelUpEvent[];
    showLevelUp: (oldLevel: number, newLevel: number, gemsAwarded: number) => void;
    dismissCurrent: () => void;
};

export const useLevelUpStore = create<LevelUpStore>((set) => ({
    queue: [],
    showLevelUp: (oldLevel, newLevel, gemsAwarded) =>
        set((state) => ({ queue: [...state.queue, { id: Date.now(), oldLevel, newLevel, gemsAwarded }] })),
    dismissCurrent: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
