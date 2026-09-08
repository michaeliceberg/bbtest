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

export function getStageQueryParams(trueIdx: number, stagesLength: number, title: string): string {
    const isLastOverall = trueIdx === stagesLength - 1;
    const isBoss = isLastOverall || isReviewStage(title);
    // Сундук — один промежуточный (не боссовский) этап в середине списка,
    // чисто по позиции.
    const isChest = !isBoss && stagesLength >= 3 && trueIdx === Math.floor((stagesLength - 1) / 2);
    const isMegaChest = isLastOverall;

    const params: string[] = [];
    if (isBoss) params.push('boss=1');
    if (isChest) params.push('chest=1');
    if (isMegaChest) params.push('megachest=1');
    return params.length ? '?' + params.join('&') : '';
}
