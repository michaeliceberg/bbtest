// lib/skillTier.ts
//
// Общая палитра "готовности" для бейджа-ссылки на тему тренажёра —
// раньше жила только внутри app/lesson/question-bubble.tsx (нижняя
// строка меты задачи), теперь бейдж переехал в шапку урока
// (app/lesson/quiz.tsx), понадобилась одна точка правды на оба места.

// Порог "готовности" — насколько высокий процент в теме тренажёра
// говорит "можешь уверенно решать эту задачу курса". Ниже — только
// потренировался, но экзаменационный уровень ещё рано; выше — уже
// закреплено. Выше общего UNLOCK_THRESHOLD=50 у самого тренажёра
// (там это порог разблокировки следующего этапа, а не готовности к
// сложной задаче курса) — тут сознательно строже.
export const SKILL_READY_THRESHOLD = 70;

// - не начато (0%) — Lottie-приглашение;
// - практикуется (1-69%) — предупреждающий янтарный ("ещё рано");
// - закреплено (70%+) — премиальный фиолетово-фуксия градиент, тот же,
//   что уже используется для пройденного этапа на карте скиллов
//   (components/trainer-grade-tree.tsx, done-квадратик) — единый
//   визуальный язык "готов" между картой тренажёра и задачей курса.
export const SKILL_PRACTICING_COLOR = '#E8A23D';
export const SKILL_READY_GRADIENT = 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)';
export const SKILL_READY_BORDER = '#C4B5FD';

export type SkillTier = 'locked' | 'practicing' | 'ready';

export const getSkillTier = (percentage: number): SkillTier => {
    if (percentage === 0) return 'locked';
    if (percentage >= SKILL_READY_THRESHOLD) return 'ready';
    return 'practicing';
};
