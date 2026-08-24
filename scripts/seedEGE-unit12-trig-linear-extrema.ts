// scripts/seedEGE-unit12-trig-linear-extrema.ts
//
// Unit 12 курса "ЕГЭ Математика Профиль" — наибольшее/наименьшее
// значение функций вида A*cos(x)+B*x+C и B*x-A*sin(x)+C на
// отрезке, 29 задач с
// https://math-ege.sdamgia.ru/test?theme=78, один урок.

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
    { question: 'Найдите наибольшее значение функции $y = 12\\cos x + 6\\sqrt{3}\\,x - 2\\sqrt{3}\\pi + 6$ на отрезке $[0; \\dfrac{\\pi}{3}]$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите наибольшее значение функции $y = 12\\sqrt{2}\\cos x + 12x - 3\\pi + 9$ на отрезке $[0; \\dfrac{\\pi}{2}]$.',
        correct: '21', distractors: ['42', '10,5', '22', '20', '31,5'] },
    { question: 'Найдите наибольшее значение функции $y = 7\\sqrt{2}\\cos x + 7x - \\dfrac{7\\pi}{4} + 9$ на отрезке $[0; \\dfrac{\\pi}{2}]$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите наибольшее значение функции $y = 5\\sqrt{2}\\cos x + 5x - \\dfrac{5\\pi}{4} + 11$ на отрезке $[0; \\dfrac{\\pi}{2}]$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите наибольшее значение функции $y = 16\\sqrt{2}\\cos x + 16x - 4\\pi + 13$ на отрезке $[0; \\dfrac{\\pi}{2}]$.',
        correct: '29', distractors: ['58', '14,5', '30', '28', '43,5'] },
    { question: 'Найдите наибольшее значение функции $y = 60\\cos x + 30\\sqrt{3}\\,x - 10\\sqrt{3}\\pi + 24$ на отрезке $[0; \\dfrac{\\pi}{3}]$.',
        correct: '54', distractors: ['108', '27', '55', '53', '81'] },
    { question: 'Найдите наименьшее значение функции $y = 5\\cos x - 6x + 4$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите наименьшее значение функции $y = 7\\cos x - 13x + 9$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите наименьшее значение функции $y = 5\\cos x - 9x + 3$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите наименьшее значение функции $y = 12\\cos x - 13x + 7$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '19', distractors: ['38', '9,5', '20', '18', '28,5'] },
    { question: 'Найдите наименьшее значение функции $y = 13\\cos x - 15x + 7$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите наименьшее значение функции $y = 7\\cos x - 17x + 7$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '14', distractors: ['28', '7', '15', '13', '21'] },
    { question: 'Найдите наименьшее значение функции $y = 9\\cos x - 13x + 3$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите наименьшее значение функции $y = 4\\cos x - 9x + 5$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите наименьшее значение функции $y = 3\\cos x - 5x + 9$ на отрезке $\\left[-\\dfrac{3\\pi}{2}; 0\\right]$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите наибольшее значение функции $y = 15x - 3\\sin x + 5$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите наибольшее значение функции $y = 11x - 9\\sin x + 3$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите наибольшее значение функции $y = 12x - 8\\sin x + 6$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите наибольшее значение функции $y = 7x - 6\\sin x + 8$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите наибольшее значение функции $y = 7x - 2\\sin x + 7$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите наибольшее значение функции $y = 8x - 7\\sin x + 7$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите наибольшее значение функции $y = 16x - 4\\sin x + 8$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите наибольшее значение функции $y = 16x - 6\\sin x + 4$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите наибольшее значение функции $y = 12x - 2\\sin x + 3$ на отрезке $\\left[-\\dfrac{\\pi}{2}; 0\\right]$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите наименьшее значение функции $y = 9\\cos x + 14x + 7$ на отрезке $\\left[0; \\dfrac{3\\pi}{2}\\right]$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите наименьшее значение функции $y = 10\\cos x + 17x + 3$ на отрезке $\\left[0; \\dfrac{3\\pi}{2}\\right]$.',
        correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
    { question: 'Найдите наименьшее значение функции $y = 2\\cos x + 7x + 9$ на отрезке $\\left[0; \\dfrac{3\\pi}{2}\\right]$.',
        correct: '11', distractors: ['22', '5,5', '12', '10', '16,5'] },
    { question: 'Найдите наименьшее значение функции $y = 6\\cos x + 11x + 7$ на отрезке $\\left[0; \\dfrac{3\\pi}{2}\\right]$.',
        correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
    { question: 'Найдите наименьшее значение функции $y = 8\\cos x + 10x + 8$ на отрезке $\\left[0; \\dfrac{3\\pi}{2}\\right]$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 12 → Экстремумы тригонометрическо-линейных функций');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Экстремумы тригонометрическо-линейных функций',
            unitId: UNIT_ID,
            order: 6,
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
