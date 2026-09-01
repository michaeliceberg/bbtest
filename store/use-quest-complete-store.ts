// store/use-quest-complete-store.ts
//
// Очередь для модалки "квест дня выполнен" (components/quest-complete-
// modal.tsx) — тот же паттерн, что уже используется для уровня/ачивок/
// стрика (store/use-level-up-store.ts и соседи). Триггерится ТОЛЬКО на
// переход false→true (см. DailyQuestStatus.justCompleted в actions/
// generate-trainer-quest.ts), не на каждое действие после выполнения.

import { create } from 'zustand';

type QuestCompleteEvent = {
    id: number; // Date.now() — React key для гарантированного ремаунта
    streak: number;
    pointsReward: number;
};

type QuestCompleteStore = {
    queue: QuestCompleteEvent[];
    showQuestComplete: (streak: number, pointsReward: number) => void;
    dismissCurrent: () => void;
};

export const useQuestCompleteStore = create<QuestCompleteStore>((set) => ({
    queue: [],
    showQuestComplete: (streak, pointsReward) =>
        set((state) => ({ queue: [...state.queue, { id: Date.now(), streak, pointsReward }] })),
    dismissCurrent: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
