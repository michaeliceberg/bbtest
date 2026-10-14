// store/use-learn-open-unit.ts
//
// Задачник (/learn): какой раздел сейчас раскрыт (открыт только один). null — раздел по умолчанию,
// который страница выбрала на сервере (defaultOpenId у LearnUnitFold / CourseProgressStrip).

import { create } from 'zustand';

type Store = { openId: number | null; setOpenId: (id: number) => void };

export const useLearnOpenUnit = create<Store>((set) => ({
    openId: null,
    setOpenId: (id) => set({ openId: id }),
}));
