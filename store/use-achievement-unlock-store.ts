// store/use-achievement-unlock-store.ts
//
// Очередь тостов новых ачивок (Steam-стиль, components/achievement-unlock-toast.tsx).
// push() — показать выданные (с событий браузера), check() — забрать то, что сервер выдал «втихую»
// (друг зарегистрировался, пицца 8/8 и т.д.) и ещё не показано.

import { create } from 'zustand';
import type { AchievementDTO } from '@/lib/achievementsCatalog';
import { fetchUnseenAchievements, getUnclaimedAchievementsCount } from '@/actions/achievements';
import { useAchievementClaimStore } from '@/store/use-achievement-claim-store';

type Store = {
    queue: AchievementDTO[];
    push: (list: AchievementDTO[]) => void;
    dismissCurrent: () => void;
    check: () => Promise<void>;
};

export const useAchievementUnlockStore = create<Store>((set, get) => ({
    queue: [],
    push: (list) => {
        if (!list.length) return;
        set((s) => ({ queue: [...s.queue, ...list.filter((a) => !s.queue.some((q) => q.key === a.key))] }));
        // Новая ачивка = новая награда к получению — обновляем число в меню.
        getUnclaimedAchievementsCount().then((n) => useAchievementClaimStore.getState().setCount(n)).catch(() => {});
    },
    dismissCurrent: () => set((s) => ({ queue: s.queue.slice(1) })),
    check: async () => {
        try {
            get().push(await fetchUnseenAchievements());
        } catch {
            // тост — мелочь, не ломаем страницу
        }
    },
}));
