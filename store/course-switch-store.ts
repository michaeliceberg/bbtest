// store/course-switch-store.ts
//
// Мост между сайдбаром (клик по курсу) и LearnWrapper (анимация страницы):
// сайдбар и контент /learn — не родитель/потомок, а соседи под общим
// layout.tsx, поэтому "курс выбран" нужно сообщить мгновенно, не дожидаясь
// ответа сервера — иначе выезд старого контента влево стартует только
// когда придут новые данные, а не в момент клика.

import { create } from 'zustand';

type CourseSwitchState = {
    pendingCourseId: number | null;
    setPending: (courseId: number) => void;
    clear: () => void;
};

export const useCourseSwitchStore = create<CourseSwitchState>((set) => ({
    pendingCourseId: null,
    setPending: (courseId) => set({ pendingCourseId: courseId }),
    clear: () => set({ pendingCourseId: null }),
}));
