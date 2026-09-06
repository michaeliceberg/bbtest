// scripts/seedGeometry9TrigCourse.ts
//
// Новый тренажёр "Геометрия-9", юнит "Синус, косинус, тангенс в
// прямоугольном треугольнике" — по прямой просьбе пользователя (см.
// CLAUDE.md). Тип задачи — новый 'DIAGRAM' (картинка + собственные
// 4 варианта-формулы, без обычного механизма "обманки из соседей по
// уроку", см. комментарий в app/t-lesson/[t_lessonId]/page.tsx).
//
// Картинки — public/trainer-images/trig-{a,b,c}{1..6}.svg, сгенерированы
// программно (не на глаз) с точными координатами через поворот/отражение
// канонического треугольника — см. историю сессии в CLAUDE.md.

import db from "../db/drizzle";
import { t_courses, t_units, t_lessons, t_challenges, t_challengeOptions } from "../db/schema";
import { eq } from "drizzle-orm";

type ChallengeSpec = {
    image: string;
    question: string;
    options: { text: string; correct: boolean }[];
};

const OPTIONS_HYP: (correctIdx: number) => { text: string; correct: boolean }[] = (correctIdx) => {
    const opts = ["$c\\cos\\alpha$", "$c\\sin\\alpha$", "$\\dfrac{c}{\\sin\\alpha}$", "$\\dfrac{c}{\\cos\\alpha}$"];
    return opts.map((text, i) => ({ text, correct: i === correctIdx }));
};
const OPTIONS_LEG: (correctIdx: number) => { text: string; correct: boolean }[] = (correctIdx) => {
    const opts = ["$b\\cos\\alpha$", "$b\\sin\\alpha$", "$\\dfrac{b}{\\sin\\alpha}$", "$\\dfrac{b}{\\cos\\alpha}$"];
    return opts.map((text, i) => ({ text, correct: i === correctIdx }));
};
const OPTIONS_TAN: (correctIdx: number) => { text: string; correct: boolean }[] = (correctIdx) => {
    const opts = ["$b\\tan\\alpha$", "$\\dfrac{b}{\\tan\\alpha}$", "$b\\sin\\alpha$", "$b\\cos\\alpha$"];
    return opts.map((text, i) => ({ text, correct: i === correctIdx }));
};

const Q_ADJ = "Дана гипотенуза $c$ и угол $\\alpha$. Как найти ПРИЛЕЖАЩИЙ катет (отмечен на рисунке)?";
const Q_OPP = "Дана гипотенуза $c$ и угол $\\alpha$. Как найти ПРОТИВОЛЕЖАЩИЙ катет (отмечен на рисунке)?";
const Q_HYP_FROM_ADJ = "Дан ПРИЛЕЖАЩИЙ катет $b$ и угол $\\alpha$. Как найти гипотенузу (отмечена на рисунке)?";
const Q_HYP_FROM_OPP = "Дан ПРОТИВОЛЕЖАЩИЙ катет $b$ и угол $\\alpha$. Как найти гипотенузу (отмечена на рисунке)?";
const Q_OPP_FROM_ADJ = "Дан ПРИЛЕЖАЩИЙ катет $b$ и угол $\\alpha$. Как найти ПРОТИВОЛЕЖАЩИЙ катет (отмечен на рисунке)?";
const Q_ADJ_FROM_OPP = "Дан ПРОТИВОЛЕЖАЩИЙ катет $b$ и угол $\\alpha$. Как найти ПРИЛЕЖАЩИЙ катет (отмечен на рисунке)?";

// Урок A — от гипотенузы к катету (cos/sin вперемешку)
const lessonA: ChallengeSpec[] = [
    { image: "trig-a1.svg", question: Q_ADJ, options: OPTIONS_HYP(0) },
    { image: "trig-a2.svg", question: Q_OPP, options: OPTIONS_HYP(1) },
    { image: "trig-a3.svg", question: Q_ADJ, options: OPTIONS_HYP(0) },
    { image: "trig-a4.svg", question: Q_OPP, options: OPTIONS_HYP(1) },
    { image: "trig-a5.svg", question: Q_ADJ, options: OPTIONS_HYP(0) },
    { image: "trig-a6.svg", question: Q_OPP, options: OPTIONS_HYP(1) },
];

// Урок B — от катета к гипотенузе (деление на cos/sin вперемешку)
const lessonB: ChallengeSpec[] = [
    { image: "trig-b1.svg", question: Q_HYP_FROM_ADJ, options: OPTIONS_LEG(3) },
    { image: "trig-b2.svg", question: Q_HYP_FROM_OPP, options: OPTIONS_LEG(2) },
    { image: "trig-b3.svg", question: Q_HYP_FROM_ADJ, options: OPTIONS_LEG(3) },
    { image: "trig-b4.svg", question: Q_HYP_FROM_OPP, options: OPTIONS_LEG(2) },
    { image: "trig-b5.svg", question: Q_HYP_FROM_ADJ, options: OPTIONS_LEG(3) },
    { image: "trig-b6.svg", question: Q_HYP_FROM_OPP, options: OPTIONS_LEG(2) },
];

// Урок C — тангенс: катет через катет (умножение/деление на tg вперемешку)
const lessonC: ChallengeSpec[] = [
    { image: "trig-c1.svg", question: Q_OPP_FROM_ADJ, options: OPTIONS_TAN(0) },
    { image: "trig-c2.svg", question: Q_ADJ_FROM_OPP, options: OPTIONS_TAN(1) },
    { image: "trig-c3.svg", question: Q_OPP_FROM_ADJ, options: OPTIONS_TAN(0) },
    { image: "trig-c4.svg", question: Q_ADJ_FROM_OPP, options: OPTIONS_TAN(1) },
    { image: "trig-c5.svg", question: Q_OPP_FROM_ADJ, options: OPTIONS_TAN(0) },
    { image: "trig-c6.svg", question: Q_ADJ_FROM_OPP, options: OPTIONS_TAN(1) },
];

async function insertLesson(unitId: number, order: number, title: string, specs: ChallengeSpec[]) {
    const existing = await db.query.t_lessons.findFirst({ where: eq(t_lessons.title, title) });
    if (existing) {
        console.log(`Урок "${title}" уже существует (id=${existing.id}), пропуск`);
        return existing.id;
    }
    const [lesson] = await db.insert(t_lessons).values({ title, t_unitId: unitId, order }).returning({ id: t_lessons.id });
    for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const [ch] = await db.insert(t_challenges).values({
            t_lessonId: lesson.id,
            numRans: '1',
            type: 'DIAGRAM',
            question: spec.question,
            order: i + 1,
            points: 10,
            author: 'Геометрия 9',
            difficulty: '',
            imageSrc: spec.image,
        }).returning({ id: t_challenges.id });
        await db.insert(t_challengeOptions).values(
            spec.options.map((o) => ({ t_challengeId: ch.id, text: o.text, correct: o.correct }))
        );
    }
    console.log(`Урок "${title}" (id=${lesson.id}): ${specs.length} задач`);
    return lesson.id;
}

async function main() {
    let course = await db.query.t_courses.findFirst({ where: eq(t_courses.title, 'Геометрия-9') });
    let courseId: number;
    if (!course) {
        const [inserted] = await db.insert(t_courses).values({
            title: 'Геометрия-9',
            imageSrc: '/trainer-images/triangle-1.svg',
            grade: 9,
        }).returning({ id: t_courses.id });
        courseId = inserted.id;
        console.log(`Создан t_course "Геометрия-9" id=${courseId}`);
    } else {
        courseId = course.id;
        console.log(`t_course "Геометрия-9" уже существует, id=${courseId}`);
    }

    let unit = await db.query.t_units.findFirst({
        where: eq(t_units.title, 'Синус, косинус, тангенс в прямоугольном треугольнике'),
    });
    let unitId: number;
    if (!unit) {
        const [inserted] = await db.insert(t_units).values({
            title: 'Синус, косинус, тангенс в прямоугольном треугольнике',
            description: 'Находим стороны прямоугольного треугольника по гипотенузе/катету и углу',
            imageSrc: '/trainer-images/triangle-1.svg',
            t_courseId: courseId,
            order: 1,
        }).returning({ id: t_units.id });
        unitId = inserted.id;
        console.log(`Создан t_unit id=${unitId}`);
    } else {
        unitId = unit.id;
        console.log(`t_unit уже существует, id=${unitId}`);
    }

    await insertLesson(unitId, 1, 'От гипотенузы к катету', lessonA);
    await insertLesson(unitId, 2, 'От катета к гипотенузе', lessonB);
    await insertLesson(unitId, 3, 'Тангенс: катет через катет', lessonC);

    console.log('Готово.');
    process.exit(0);
}

main().catch((e) => {
    console.error('ОШИБКА:', e);
    process.exit(1);
});
