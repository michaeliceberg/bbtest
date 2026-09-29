// lib/trainer-topic.ts
//
// Общая логика выбора "активной темы тренажёра" (t_course) для всего, что
// должно совпадать между /trainer и /learn — прежде всего карточки "Квест
// дня" (components/trainer-quest-card.tsx). Раньше обе страницы резолвили
// эту тему по-разному (см. CLAUDE.md, "Баг 'Квест дня' рассинхронизирован
// между /trainer и /learn") — вынесено сюда, чтобы расхождение больше не
// могло случайно закрасться снова при правке одной страницы без другой.

// М9, Физика-9 и Геометрия-9 временно скрыты из тренажёра (пусто/не
// готово) — не показываются как вкладки-предметы и не должны становиться
// "активной темой" квеста, даже если у пользователя активен курс,
// формально на них ссылающийся (t_courses.courseId) — иначе квест
// "тренажёра" навсегда застревал бы на 0/1, указывая на тему без единого
// урока внутри. Геометрия-9 (id=4) опустела после переноса её
// единственного юнита ("Синус, косинус, тангенс...") в Математика-11.
export const HIDDEN_T_COURSE_IDS = [1, 2, 4];

// Порядок вкладок-предметов на /trainer — по прямой просьбе пользователя
// (Математика-11 первой, за ней Физика-11, затем Арифметика). Курс, не
// упомянутый здесь (появится в будущем) — попадает в конец списка, а не
// теряется. Сортировка только ДЛЯ ОТОБРАЖЕНИЯ вкладок — resolveActiveTCourse
// ниже принимает свой собственный (несортированный) список отдельно, чтобы
// порядок вкладок не задевал её фоллбэк-логику "первая видимая тема".
const TAB_DISPLAY_ORDER = ['Математика-11', 'Физика-11', 'Арифметика'];
export function sortTCoursesForTabs<T extends { title: string }>(courses: T[]): T[] {
    return [...courses].sort((a, b) => {
        const ai = TAB_DISPLAY_ORDER.indexOf(a.title);
        const bi = TAB_DISPLAY_ORDER.indexOf(b.title);
        const aRank = ai === -1 ? TAB_DISPLAY_ORDER.length : ai;
        const bRank = bi === -1 ? TAB_DISPLAY_ORDER.length : bi;
        return aRank - bRank;
    });
}

/**
 * Тема тренажёра, привязанная к активному курсу пользователя (через
 * t_courses.courseId), среди ВИДИМЫХ тем — с фоллбэком на первую видимую
 * тему, если привязки нет (курс без своего тренажёра) или она указывает на
 * скрытую тему. Единая точка правды для /trainer и /learn — обе страницы
 * должны получать здесь ОДИНАКОВЫЙ результат для одного и того же
 * пользователя в один и тот же момент.
 */
export function resolveActiveTCourse<T extends { id: number; courseId: number | null }>(
    allTCourses: T[],
    activeCourseId: number | null | undefined
): T | undefined {
    const visible = allTCourses.filter((tc) => !HIDDEN_T_COURSE_IDS.includes(tc.id));
    return visible.find((tc) => tc.courseId === activeCourseId) ?? visible[0];
}

// В каком тренажёре открыта только одна тема (остальные вкладки видны, но
// заблокированы) — просьба пользователя 2026-09-29: сначала проходят
// Электродинамику (там три пошаговых урока).
export const TRAINER_ONLY_ACTIVE_GROUP: Record<string, string> = {
    'ЕГЭ Физика': 'Электродинамика',
}

// Какой курс считать активным — ОДНА функция для сайдбара (layout), /trainer и
// /learn (баг 2026-09-29: без cookie сайдбар брал первый курс списка, а тренажёр —
// курс из профиля; cookie с курсом не из списка ученика — сайдбар молча показывал
// другой курс). Порядок: cookie (если курс есть у ученика) → курс из профиля (если
// есть у ученика) → первый курс ученика.
export function pickActiveCourseId(
    cookieValue: string | undefined,
    userCourseIds: number[],
    profileCourseId: number | null | undefined,
): number | undefined {
    const fromCookie = cookieValue ? parseInt(cookieValue) : NaN
    if (!Number.isNaN(fromCookie) && userCourseIds.includes(fromCookie)) return fromCookie
    if (profileCourseId != null && userCourseIds.includes(profileCourseId)) return profileCourseId
    return userCourseIds[0]
}

// Задачник: в каком курсе открыт только один юнит (courseId → часть названия
// юнита). Остальные юниты заблокированы, /learn сам скроллит к открытому.
export const LEARN_ONLY_UNIT: Record<number, string> = {
    12: 'Закон Кулона', // ЕГЭ Физика → «11. Закон Кулона, закон сохранения заряда»
}
