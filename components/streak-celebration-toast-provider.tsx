// components/streak-celebration-toast-provider.tsx

'use client';

import { StreakCelebrationToast } from './streak-celebration-toast';
import { useStreakCelebrationStore } from '@/store/use-streak-celebration-store';

export const StreakCelebrationToastProvider = () => {
    const { queue, dismissCurrent } = useStreakCelebrationStore();
    const current = queue[0] ?? null;

    return (
        <StreakCelebrationToast
            event={current}
            onClose={dismissCurrent}
        />
    );
};
