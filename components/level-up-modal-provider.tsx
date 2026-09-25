// components/level-up-modal-provider.tsx
//
// Глобальный показ «Новый уровень!» — теперь во весь экран
// (components/level-up-screen.tsx), раньше была модалка level-up-modal.tsx.

'use client';

import { LevelUpScreen } from './level-up-screen';
import { useLevelUpStore } from '@/store/use-level-up-store';
import { useUiTheme } from '@/lib/uiTheme';

export const LevelUpModalProvider = () => {
    const { queue, dismissCurrent } = useLevelUpStore();
    const current = queue[0] ?? null;
    const theme = useUiTheme();

    return <LevelUpScreen event={current} onClose={dismissCurrent} theme={theme} />;
};
