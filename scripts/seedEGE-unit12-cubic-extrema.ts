// scripts/seedEGE-unit12-cubic-extrema.ts
//
// Unit 12 курса "ЕГЭ Математика Профиль" — точки экстремума и
// наибольшее/наименьшее значение кубических функций, 62 задачи с
// https://math-ege.sdamgia.ru/test?theme=81, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const UNIT_ID = 98;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'Найдите точку максимума функции $y = x^{3} - 192x + 14$.',
        correct: '-8', distractors: ['-16', '-4', '-9', '-7', '-12'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 48x + 19$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 243x + 19$.',
        correct: '-9', distractors: ['-18', '-4,5', '-10', '-8', '-13,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 243x + 5$.',
        correct: '-9', distractors: ['-18', '-4,5', '-10', '-8', '-13,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 108x + 19$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 75x + 19$.',
        correct: '-5', distractors: ['-10', '-2,5', '-6', '-4', '-7,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 300x + 5$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 3x + 11$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 27x + 23$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 75x + 11$.',
        correct: '-5', distractors: ['-10', '-2,5', '-6', '-4', '-7,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 48x + 5$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 192x + 5$.',
        correct: '-8', distractors: ['-16', '-4', '-9', '-7', '-12'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 192x + 23$.',
        correct: '-8', distractors: ['-16', '-4', '-9', '-7', '-12'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 108x + 5$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 147x + 11$.',
        correct: '-7', distractors: ['-14', '-3,5', '-8', '-6', '-10,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 300x + 14$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 108x + 11$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 108x + 115$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 12x + 23$.',
        correct: '-2', distractors: ['-4', '-1', '-3', '-5', '-6'] },
    { question: 'Найдите точку максимума функции $y = x^{3} + 15x^{2} + 17$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 15x^{2} + 11$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 30x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} + 3x^{2} + 15$.',
        correct: '-2', distractors: ['-4', '-1', '-3', '-5', '-6'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 9x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} + 15x^{2} + 13$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите точку максимума функции $y = x^{3} + 21x^{2} + 19$.',
        correct: '-14', distractors: ['-28', '-7', '-15', '-13', '-21'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 12x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} + 6x^{2} + 13$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите точку максимума функции $y = x^{3} + 24x^{2} + 19$.',
        correct: '-16', distractors: ['-32', '-8', '-17', '-15', '-24'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 27x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 12x^{2} + 17$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 24x^{2} + 17$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 27x^{2} + 11$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 24x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку максимума функции $y = x^{3} - 3x^{2} + 2$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 30x^{2} + 17$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 9x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} - 3x^{2} + 19$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите точку минимума функции $y = x^{3} - 24x^{2} + 17$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите точку минимума функции $y = x^{3} - 12x^{2} + 19$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 12x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 27x^{2} + 19$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 9x^{2} + 19$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 6x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} - 27x^{2} + 17$.',
        correct: '18', distractors: ['36', '9', '19', '17', '27'] },
    { question: 'Найдите точку минимума функции $y = x^{3} + 18x^{2} + 15$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите точку минимума функции $y = x^{3} - 30x^{2} + 11$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите точку минимума функции $y = x^{3} - 3x^{2} + 2$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 3x + 23$ на отрезке $[0; 2]$.',
        correct: '21', distractors: ['42', '10,5', '22', '20', '31,5'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 27x + 14$ на отрезке $[0; 4]$.',
        correct: '-40', distractors: ['-80', '-20', '-41', '-39', '-60'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 300x + 14$ на отрезке $[0; 11]$.',
        correct: '-1986', distractors: ['-3972', '-993', '-1987', '-1985', '-2979'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 12x + 19$ на отрезке $[0; 3]$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 75x + 14$ на отрезке $[0; 6]$.',
        correct: '-236', distractors: ['-472', '-118', '-237', '-235', '-354'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 75x + 5$ на отрезке $[0; 6]$.',
        correct: '-245', distractors: ['-490', '-122,5', '-246', '-244', '-367,5'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 192x + 14$ на отрезке $[0; 9]$.',
        correct: '-1010', distractors: ['-2020', '-505', '-1011', '-1009', '-1515'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 147x + 19$ на отрезке $[0; 8]$.',
        correct: '-667', distractors: ['-1334', '-333,5', '-668', '-666', '-1000,5'] },
    { question: 'Найдите наибольшее значение функции $y = x^{3} - 3x + 14$ на отрезке $[2; 0]$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите наибольшее значение функции $y = x^{3} - 3x + 5$ на отрезке $[2; 0]$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите наибольшее значение функции $y = x^{3} - 3x + 11$ на отрезке $[2; 0]$.',
        correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
    { question: 'Найдите наибольшее значение функции $y = x^{3} - 3x + 23$ на отрезке $[2; 0]$.',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'Найдите наибольшее значение функции $y = x^{3} - 3x + 4$ на отрезке $[2; 0]$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите наименьшее значение функции $y = x^{3} - 300x + 23$ на отрезке $[0; 11]$.',
        correct: '-1977', distractors: ['-3954', '-988,5', '-1978', '-1976', '-2965,5'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 12 → Экстремумы кубических функций');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Экстремумы кубических функций',
            unitId: UNIT_ID,
            order: 2,
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
                imageSrc: c.image ? `/geometry/${c.image}.svg` : '',
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
