// components/achievement-toast-provider.tsx

'use client';

import { AchievementToast } from './achievement-toast';
import { useAchievementStore } from '@/store/use-achievement-store';

export const AchievementToastProvider = () => {
    const { queue, dismissCurrent } = useAchievementStore();
    const current = queue[0] ?? null;

    return (
        <AchievementToast
            achievement={current}
            onClose={dismissCurrent}
        />
    );
};
