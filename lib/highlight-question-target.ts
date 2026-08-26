// lib/highlight-question-target.ts
//
// Эвристика: находит в тексте условия задачи фразу "что нужно найти"
// ("Найдите...", "Чему равен...", "На сколько увеличится..." и т.п.) и
// возвращает текст, разбитый на 3 куска [до, найденное, после] — чтобы
// затем средний кусок можно было подсветить цветом юнита. Если совпадения
// нет (или оно пересекает LaTeX-формулу $...$), возвращает null — в этом
// случае условие рендерится как раньше, без подсветки.

const TARGET_RE = new RegExp(
    '(' +
        'найдите|найти|определите|определить|' +
        'чему[^?.()]*?(?:равн(?:а|о|ы)|равен)|' +
        'как[оа]в[оа]?(?: будет| станет)?|' +
        'каким (?:будет|станет)|' +
        'как(?:ой|ая|ое|ую|их)(?: (?:будет|станет|должна быть|должен быть|должно быть))?|' +
        'на сколько|' +
        'во сколько раз|' +
        '(?:за |через )?сколько[^?.()]*?потребуется|' +
        'сколько[^?.()]*?потребовалось' +
    ')' +
    '([^?.()]*[?.]?)',
    'i'
);

export type QuestionHighlight = {
    before: string;
    target: string;
    after: string;
};

const hasBalancedDollars = (s: string): boolean => (s.match(/\$/g)?.length ?? 0) % 2 === 0;

export function findQuestionTarget(question: string): QuestionHighlight | null {
    const match = TARGET_RE.exec(question);
    if (!match || match.index === undefined) return null;

    const start = match.index;
    const target = match[0];
    const end = start + target.length;

    const before = question.slice(0, start);
    const after = question.slice(end);

    // Не подсвечиваем, если совпадение или префикс перед ним ломает
    // парность $...$ — иначе KaTeX получит рваную формулу на стыке кусков.
    if (!hasBalancedDollars(before) || !hasBalancedDollars(target)) return null;
    if (target.trim().length < 3) return null;

    return { before, target, after };
}
