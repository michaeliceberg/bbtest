// store/lesson-unlock-store.ts

import { create } from 'zustand';

type LessonUnlockStore = {
    unlockedLessonId: number | null;
    unlockedLessonTitle: string;
    unlockedUnitTitle: string;
    showNotification: boolean;
    notifiedLessons: Set<number>;
    notifyUnlocked: (lessonId: number, lessonTitle: string, unitTitle: string) => void;
    closeNotification: () => void;
    hasBeenNotified: (lessonId: number) => boolean;
};

export const useLessonUnlockStore = create<LessonUnlockStore>((set, get) => ({
    unlockedLessonId: null,
    unlockedLessonTitle: '',
    unlockedUnitTitle: '',
    showNotification: false,
    notifiedLessons: new Set(),
    
    notifyUnlocked: (lessonId, lessonTitle, unitTitle) => {
        const { notifiedLessons } = get();
        if (notifiedLessons.has(lessonId)) return;
        
        notifiedLessons.add(lessonId);
        set({
            unlockedLessonId: lessonId,
            unlockedLessonTitle: lessonTitle,
            unlockedUnitTitle: unitTitle,
            showNotification: true,
            notifiedLessons: new Set(notifiedLessons),
        });
    },
    
    closeNotification: () => {
        set({ showNotification: false, unlockedLessonId: null });
    },
    
    hasBeenNotified: (lessonId) => {
        return get().notifiedLessons.has(lessonId);
    },
}));