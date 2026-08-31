// store/use-streak-celebration-store.ts
//
// Очередь для тоста "серия продлена" (components/streak-celebration-toast.tsx)
// — тот же паттерн, что уже используется для ачивок (store/
// use-achievement-store.ts): очередь, а не одиночное значение, на случай
// если несколько источников (задачник + тренажёр) умудрятся показать
// событие почти одновременно.

import { create } from 'zustand';

type StreakEvent = {
    id: number; // Date.now() при вызове — нужен как React key для гарантированного
    // ремаунта (см. components/streak-celebration-toast.tsx), просто числа
    // streak самого по себе недостаточно: оно не меняется при повторном
    // показе того же дня, если бы такое вдруг случилось.
    streak: number;
};

type StreakCelebrationStore = {
    queue: StreakEvent[];
    showStreakCelebration: (streak: number) => void;
    dismissCurrent: () => void;
};

export const useStreakCelebrationStore = create<StreakCelebrationStore>((set) => ({
    queue: [],
    showStreakCelebration: (streak) => set((state) => ({ queue: [...state.queue, { id: Date.now(), streak }] })),
    dismissCurrent: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
