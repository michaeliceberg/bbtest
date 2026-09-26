// lib/trainerStageFlags.ts
//
// Чисто позиционная логика "какой этап темы — босс/сундук/мегасундук",
// раньше жила только внутри components/trainer-grade-tree.tsx. Вынесена
// сюда, т.к. теперь нужна и на сервере (app/t-lesson/[t_lessonId]/page.tsx,
// для query-параметров кнопки "Следующий урок" — переход должен приводить
// к ТОЙ ЖЕ разметке экрана, что и прямая ссылка с карты скиллов).

// "Контрольная"-урок (мини-босс) — по названию, конвенция без отдельного
// поля в БД.
export const isReviewStage = (title: string): boolean => /контрольн/i.test(title);

// Бесконечный босс-экзамен темы (любые M_ASC задачи темы, каждый раз новые) —
// по слову "босс-экзамен" в названии урока.
export const isBossExamStage = (title: string): boolean => /босс-экзамен/i.test(title);

// Мифическая контрольная — по слову "мифич" в названии: гарантированный
// мифический кейс по завершении (конвенция без поля в БД).
export const isMythicStage = (title: string): boolean => /мифич/i.test(title);

// Типы самодостаточных интерактивных разборов "по шагам" (walkthrough) —
// SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK/LOGPOWWALK/LOGSWAPWALK/
// LOGDIVWALK/LOGCOMBOWALK/LOGFLIPWALK, см. app/t-lesson/[t_lessonId]/
// type-*.tsx. Каждый такой t_lesson состоит РОВНО из одного challenge
// этого типа — используется для отдельного визуального акцента на карте
// скиллов тренажёра (золотая иконка книги вместо обычного яйца/щита/...,
// см. trainer-grade-tree.tsx, по прямой просьбе пользователя, 2026-09-19).
// export — переиспользуется и в app/t-lesson/[t_lessonId]/page.tsx, чтобы
// не прицеплять "картинку темы" (topicSticker) самодостаточным разборам —
// у них своя диаграмма, чужая generic-иллюстрация только путает (см.
// FARADAYWALK — "Закон Фарадея" случайно матчился на induction.svg через
// getTopicSticker по тексту вопроса, реальный баг, найденный пользователем).
export const STEP_BY_STEP_CHALLENGE_TYPES = new Set(['SINWALK', 'LOGWALK', 'LOGDEFWALK', 'LOGSUBWALK', 'LOGPOWWALK', 'LOGSWAPWALK', 'LOGDIVWALK', 'LOGCOMBOWALK', 'LOGFLIPWALK', 'FARADAYWALK', 'DIRWALK', 'SINCOSDEFWALK', 'LEGFINDWALK', 'TRIGSCWALK', 'TRIGTGWALK', 'TRIGCIRCWALK']);

export function isStepByStepLesson(challengeTypes: string[]): boolean {
    return challengeTypes.some((t) => STEP_BY_STEP_CHALLENGE_TYPES.has(t));
}

export function getStageQueryParams(trueIdx: number, stagesLength: number, title: string): string {
    const isLastOverall = trueIdx === stagesLength - 1;
    const isBoss = isLastOverall || isReviewStage(title) || isBossExamStage(title);
    // Сундук — один промежуточный (не боссовский) этап в середине списка,
    // чисто по позиции.
    const isChest = !isBoss && stagesLength >= 3 && trueIdx === Math.floor((stagesLength - 1) / 2);
    const isMegaChest = isLastOverall && !isBossExamStage(title);

    const params: string[] = [];
    if (isBoss) params.push('boss=1');
    if (isChest) params.push('chest=1');
    if (isMegaChest) params.push('megachest=1');
    if (isMythicStage(title)) params.push('mythic=1');
    if (isBossExamStage(title)) params.push('exam=1');
    return params.length ? '?' + params.join('&') : '';
}
