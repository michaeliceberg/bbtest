// lib/achievementsClient.ts
//
// Сообщить серверу о событии (из браузера): каждое событие за визит страницы шлём один раз,
// новые ачивки сразу показываем тостом.

'use client';

import { reportAchievementEvent, reportChestOpened } from '@/actions/achievements';
import type { ClientEventKey } from '@/lib/achievementsCatalog';
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store';

const sent = new Set<string>();

export const reportAchievement = (event: ClientEventKey) => {
    if (sent.has(event)) return;
    sent.add(event);
    reportAchievementEvent(event)
        .then((list) => useAchievementUnlockStore.getState().push(list))
        .catch(() => sent.delete(event));
};

export const reportChest = (tier: 'common' | 'rare' | 'mythic' | 'mega') => {
    reportChestOpened(tier)
        .then((list) => useAchievementUnlockStore.getState().push(list))
        .catch(() => {});
};

// Проверить «тихие» ачивки (после урока, сундука и т.п.).
export const checkAchievements = () => {
    void useAchievementUnlockStore.getState().check();
};
