// components/quest-complete-modal-provider.tsx

'use client';

import { QuestCompleteModal } from './quest-complete-modal';
import { useQuestCompleteStore } from '@/store/use-quest-complete-store';

export const QuestCompleteModalProvider = () => {
    const { queue, dismissCurrent } = useQuestCompleteStore();
    const current = queue[0] ?? null;

    return (
        <QuestCompleteModal
            event={current}
            onClose={dismissCurrent}
        />
    );
};
