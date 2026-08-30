// store/use-achievement-store.ts

import { create } from 'zustand';

type Achievement = {
    id: number;
    name: string;
    description: string;
    rewardPoints: number;
    rewardGems: number;
};

type AchievementStore = {
    queue: Achievement[];
    showAchievement: (achievement: Achievement) => void;
    dismissCurrent: () => void;
};

// Очередь, не одиночное значение — за один ответ вполне может закрыться
// сразу несколько достижений (например, "50 домашек" И мета-достижение
// "получи все достижения" в один и тот же вызов recalculateAchievements),
// одиночный слот тихо терял бы все, кроме последнего.
export const useAchievementStore = create<AchievementStore>((set) => ({
    queue: [],
    showAchievement: (achievement) => set((state) => ({ queue: [...state.queue, achievement] })),
    dismissCurrent: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
