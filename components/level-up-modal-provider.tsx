// components/level-up-modal-provider.tsx

'use client';

import { LevelUpModal } from './level-up-modal';
import { useLevelUpStore } from '@/store/use-level-up-store';

export const LevelUpModalProvider = () => {
    const { queue, dismissCurrent } = useLevelUpStore();
    const current = queue[0] ?? null;

    return (
        <LevelUpModal
            event={current}
            onClose={dismissCurrent}
        />
    );
};
