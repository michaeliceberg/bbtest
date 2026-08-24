// scripts/seedEGE-unit7-power-expressions.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — вычисление значений
// степенных выражений, 20 задач с
// https://math-ege.sdamgia.ru/test?theme=57, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const COURSE_ID = 11;
const UNIT_ORDER = 7;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = { question: string; correct: string; distractors: string[] };

const challenges: ChallengeSeed[] = [
    { question: 'Найдите значение выражения $ 5^{0,36} \\cdot 25^{0,32} $.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $ \\frac{3^{6,5}}{9^{2,25}} $.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите значение выражения $ 7^{\\frac{4}{9}} \\cdot 49^{\\frac{5}{18}} $.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $ \\frac{2^{3,5} \\cdot 3^{5,5}}{6^{4,5}} $.',
        correct: '1,5', distractors: ['3', '0,8', '2,5', '0,5', '2,2'] },
    { question: 'Найдите значение выражения $ 35^{-4,7} \\cdot 7^{5,7} :5^{-3,7} $.',
        correct: '1,4', distractors: ['2,8', '0,7', '2,4', '0,4', '2,1'] },
    { question: 'Найдите значение выражения $ ( \\frac{2^{\\frac{1}{3}} \\cdot 2^{\\frac{1}{4}}}{\\sqrt[12]{2}} )^{2} $.',
        correct: '2', distractors: ['4', '1', '3', '20', '5'] },
    { question: 'Найдите значение выражения $ \\frac{( 2^{\\frac{3}{5}} \\cdot 5^{\\frac{2}{3}} )^{15}}{10^{9}} $.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $ 0,8^{\\frac{1}{7}} \\cdot 5^{\\frac{2}{7}} \\cdot 20^{\\frac{6}{7}} $.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите значение выражения $ \\frac{49^{5,2}}{7^{8,4}} $.',
        correct: '49', distractors: ['98', '24,5', '50', '48', '73,5'] },
    { question: 'Найдите значение выражения $ 4^{8} \\cdot 11^{10} :44^{8} $.',
        correct: '121', distractors: ['242', '60,5', '122', '120', '181,5'] },
    { question: 'Найдите значение выражения $ 3^{\\sqrt{5} +10} \\cdot 3^{-5 -\\sqrt{5}} $.',
        correct: '243', distractors: ['486', '121,5', '244', '242', '364,5'] },
    { question: 'Найдите значение выражения $ ( 5^{12} )^{3} :5^{37} $.',
        correct: '0,2', distractors: ['0,4', '0,1', '1,2', '0,3', '2'] },
    { question: 'Найдите значение выражения $ ( 49^{6} )^{3} : ( 7^{7} )^{5} $.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $ 5^{3 \\sqrt{7} -1} \\cdot 5^{1 -\\sqrt{7}} :5^{2 \\sqrt{7} -1} $.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $ 2^{3 \\sqrt{7} -1} \\cdot 8^{1 -\\sqrt{7}} $.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите значение выражения $ \\frac{0,5^{\\sqrt{10} -1}}{2^{-\\sqrt{10}}} $.',
        correct: '2', distractors: ['4', '1', '3', '20', '5'] },
    { question: 'Найдите значение выражения $ \\frac{6^{\\sqrt{3}} \\cdot 7^{\\sqrt{3}}}{42^{\\sqrt{3} -1}} $.',
        correct: '42', distractors: ['84', '21', '43', '41', '63'] },
    { question: 'Найдите значение выражения $ \\frac{\\sqrt[15]{5} \\cdot 5 \\cdot \\sqrt[10]{5}}{\\sqrt[6]{5}} $.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $ 3^{-0,7} \\cdot 3^{1,3} \\cdot 9^{0,7} $.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите значение выражения $ ( \\sqrt{a} :a^{\\frac{1}{3}} )^{4} $.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 (Степенные выражения)');

        const [unit] = await db.insert(schema.units).values({
            title: 'Степени и корни',
            description: 'Вычисление значений степенных выражений',
            imageSrc: 'LottieUnit7',
            courseId: COURSE_ID,
            order: UNIT_ORDER,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Вычисление значений степенных выражений',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}"`);

        for (let i = 0; i < challenges.length; i++) {
            const c = challenges[i];
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

            console.log(`  [${i + 1}/${challenges.length}] challenge ${challenge.id} — "${c.correct}"`);
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
