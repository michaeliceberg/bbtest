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
    currentAchievement: Achievement | null;
    showAchievement: (achievement: Achievement) => void;
    clearAchievement: () => void;
};

export const useAchievementStore = create<AchievementStore>((set) => ({
    currentAchievement: null,
    showAchievement: (achievement) => set({ currentAchievement: achievement }),
    clearAchievement: () => set({ currentAchievement: null }),
}));