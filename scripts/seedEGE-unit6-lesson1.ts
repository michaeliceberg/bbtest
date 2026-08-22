// scripts/seedEGE-unit6-lesson1.ts
//
// Пилотный урок "Показательные уравнения" (Тип 6 ФИПИ/sdamgia) для курса
// "ЕГЭ Математика Профиль". Источник данных: scripts/data/type6.json
// (см. scripts/scrape-sdamgia.ts). Формулы переведены в LaTeX вручную,
// к каждому правильному ответу добавлено 5 правдоподобных дистракторов.
//
// Запуск: npx tsx scripts/seedEGE-unit6-lesson1.ts

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = {
    question: string;
    correct: string;
    distractors: string[];
};

// Источник: sdamgia id указан в комментарии для трассируемости.
const challengesData: ChallengeSeed[] = [
    { // 2855
        question: 'Найдите корень уравнения $\\large \\left(\\frac{1}{7}\\right)^{5x-3}=\\frac{1}{49}$',
        correct: '1', distractors: ['0,2', '-1', '5', '0', '2'],
    },
    { // 2949
        question: 'Найдите корень уравнения $\\large \\left(\\frac{1}{9}\\right)^{x-13}=3$',
        correct: '12,5', distractors: ['13,5', '-12,5', '25', '12', '6,5'],
    },
    { // 13383
        question: 'Найдите корень уравнения: $\\large \\left(\\frac{1}{4}\\right)^{2+x}=64$',
        correct: '-5', distractors: ['5', '-1', '1', '-8', '-2'],
    },
    { // 14193
        question: 'Найдите решение уравнения: $\\large \\left(\\frac{1}{19}\\right)^{x-1}=19^{x}$',
        correct: '0,5', distractors: ['-0,5', '1', '0', '2', '-1'],
    },
    { // 26650
        question: 'Найдите корень уравнения $\\large 2^{4-2x}=64$',
        correct: '-1', distractors: ['1', '-5', '5', '0', '-2'],
    },
    { // 26666
        question: 'Найдите корень уравнения: $\\large 9^{-5+x}=729$',
        correct: '8', distractors: ['-8', '2', '5', '3', '10'],
    },
    { // 104195
        question: 'Решите уравнение $\\large 9^{7-x}=81^{2x}$',
        correct: '1,4', distractors: ['-1,4', '1', '7', '0,7', '2,8'],
    },
    { // 509413
        question: 'Найдите корень уравнения $\\large 7^{18{,}5x+0{,}7}=\\frac{1}{343}$',
        correct: '-0,2', distractors: ['0,2', '-3,7', '-0,4', '0,4', '-0,02'],
    },
    { // 510009
        question: 'Найдите корень уравнения $\\large 3^{x-5}=81$',
        correct: '9', distractors: ['-9', '4', '5', '-4', '1'],
    },
    { // 510936
        question: 'Найдите корень уравнения $\\large 6^{12{,}5x+2}=\\frac{1}{216}$',
        correct: '-0,4', distractors: ['0,4', '-5', '-0,2', '0,2', '5'],
    },
    { // 524013
        question: 'Найдите корень уравнения $\\large 2^{1-3x}=16$',
        correct: '-1', distractors: ['1', '3', '-3', '5', '0'],
    },
    { // 525088
        question: 'Найдите корень уравнения $\\large 6^{2-5x}=0{,}6\\cdot 10^{2-5x}$',
        correct: '0,2', distractors: ['-0,2', '1', '0,4', '-1', '0,6'],
    },
    { // 530684
        question: 'Найдите корень уравнения $\\large 4^{x-15}=\\frac{1}{2}$',
        correct: '14,5', distractors: ['15,5', '-14,5', '14', '15', '13,5'],
    },
    { // 665310
        question: 'Найдите корень уравнения $\\large 4^{x-7}=\\frac{1}{64}$',
        correct: '4', distractors: ['-4', '3', '10', '7', '-3'],
    },
    { // 676849
        question: 'Решите уравнение $\\large 6^{x+1}-6^{x}=180$',
        correct: '2', distractors: ['-2', '36', '3', '1', '5'],
    },
    { // 676926
        question: 'Решите уравнение $\\large 5^{x+1}-5^{x}=500$',
        correct: '3', distractors: ['-3', '125', '4', '2', '5'],
    },
    { // 685354
        question: 'Найдите корень уравнения: $\\large \\left(\\frac{1}{3}\\right)^{3-x}=81$',
        correct: '7', distractors: ['-7', '1', '4', '-4', '3'],
    },
    { // 704219
        question: 'Найдите корень уравнения $\\large 27\\cdot\\left(\\frac{1}{3}\\right)^{3-x}=9^{x}$',
        correct: '0', distractors: ['1', '-1', '3', '-3', '2'],
    },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const main = async () => {
    try {
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 6 → Показательные уравнения');

        const [course] = await db.insert(schema.courses).values({
            title: 'ЕГЭ Математика Профиль',
            imageSrc: 'CourseImgs/m11_ege.jpeg',
        }).returning();
        console.log('course:', course.id, course.title);

        const [unit] = await db.insert(schema.units).values({
            title: 'Простейшие уравнения',
            description: 'Тип 6 ЕГЭ: показательные, логарифмические, иррациональные, тригонометрические, рациональные и линейные/квадратные/кубические уравнения',
            imageSrc: 'LottieUnit1',
            courseId: course.id,
            order: 1,
        }).returning();
        console.log('unit:', unit.id, unit.title);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Показательные уравнения',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log('lesson:', lesson.id, lesson.title);

        for (let i = 0; i < challengesData.length; i++) {
            const c = challengesData[i];
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: lesson.id,
                type: 'ASSIST',
                question: c.question,
                order: i + 1,
                points: 10,
                author: AUTHOR,
                difficulty: '',
                imageSrc: '',
            }).returning();

            const options = shuffle([
                { text: c.correct, correct: true },
                ...c.distractors.map((d) => ({ text: d, correct: false })),
            ]);

            await db.insert(schema.challengeOptions).values(
                options.map((o) => ({
                    challengeId: challenge.id,
                    text: o.text,
                    correct: o.correct,
                }))
            );

            console.log(`  [${i + 1}/${challengesData.length}] challenge ${challenge.id} — "${c.correct}" среди ${options.length} вариантов`);
        }

        console.log('Готово!');
    } catch (error) {
        console.error(error);
        throw new Error('Не получилось заполнить БД');
    } finally {
        await queryClient.end();
    }
};

main();
