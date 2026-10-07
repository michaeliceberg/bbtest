// store/use-achievement-claim-store.ts
//
// Сколько наград за ачивки ещё не забрано (число на пункте меню «Ачивки» и точка на гамбургере).
// Начальное значение приходит с сервера (app/(main)/layout.tsx → AchievementClaimInit), дальше
// обновляется при новых ачивках и после клика «забрать».

import { create } from 'zustand';

type Store = { count: number; setCount: (n: number) => void };

export const useAchievementClaimStore = create<Store>((set) => ({
    count: 0,
    setCount: (n) => set({ count: Math.max(0, n) }),
}));
