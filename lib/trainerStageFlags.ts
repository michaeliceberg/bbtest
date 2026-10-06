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
export const STEP_BY_STEP_CHALLENGE_TYPES = new Set(['SINWALK', 'LOGWALK', 'LOGDEFWALK', 'LOGSUBWALK', 'LOGPOWWALK', 'LOGSWAPWALK', 'LOGDIVWALK', 'LOGCOMBOWALK', 'LOGFLIPWALK', 'FARADAYWALK', 'DIRWALK', 'LENZWALK', 'SINCOSDEFWALK', 'LEGFINDWALK', 'HYPFINDWALK', 'TRIGSCWALK', 'TRIGTGWALK', 'TRIGCIRCWALK', 'REDFORMWALK']);

export function isStepByStepLesson(challengeTypes: string[]): boolean {
    return challengeTypes.some((t) => STEP_BY_STEP_CHALLENGE_TYPES.has(t));
}

// Флаги этапа (босс / сундук / мегасундук / мифический / экзамен) вычисляются
// СЕРВЕРОМ из позиции урока в теме и его названия (app/t-lesson/[t_lessonId]/
// page.tsx). Раньше они приходили в URL (?chest=1 …) — пользователь мог
// вручную дописать/поменять параметр и получить кейс не на своём этапе.
export type StageFlags = { isBoss: boolean; isChest: boolean; isMegaChest: boolean; isMythic: boolean; isExam: boolean }

export function getStageFlags(trueIdx: number, stagesLength: number, title: string): StageFlags {
    const isLastOverall = trueIdx === stagesLength - 1;
    const isBoss = isLastOverall || isReviewStage(title) || isBossExamStage(title);
    // Сундук — один промежуточный (не боссовский) этап в середине списка,
    // чисто по позиции.
    const isChest = !isBoss && stagesLength >= 3 && trueIdx === Math.floor((stagesLength - 1) / 2);
    const isMegaChest = isLastOverall && !isBossExamStage(title);
    return { isBoss, isChest, isMegaChest, isMythic: isMythicStage(title), isExam: isBossExamStage(title) };
}
