// scripts/seedEGE-unit12-exp-extrema.ts
//
// Unit 12 курса "ЕГЭ Математика Профиль" — точки экстремума и
// наименьшее значение функций вида (x±A)e^(x±B), 29 задач с
// https://math-ege.sdamgia.ru/test?theme=82, один урок.

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
    { question: 'Найдите наименьшее значение функции $y = (x - 8)e^{x - 7}$ на отрезке $[6; 8]$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите наименьшее значение функции $y = (x - 17)e^{x - 16}$ на отрезке $[15; 17]$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите наименьшее значение функции $y = (x - 13)e^{x - 12}$ на отрезке $[11; 13]$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите наименьшее значение функции $y = (x - 10)e^{x - 9}$ на отрезке $[8; 10]$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите наименьшее значение функции $y = (x - 14)e^{x - 13}$ на отрезке $[12; 14]$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите наименьшее значение функции $y = (x - 73)e^{x - 72}$ на отрезке $[71; 73]$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите точку минимума функции $y = (x + 16)e^{x - 16}$.',
        correct: '-17', distractors: ['-34', '-8,5', '-18', '-16', '-25,5'] },
    { question: 'Найдите точку минимума функции $y = (x + 18)e^{x - 18}$.',
        correct: '-19', distractors: ['-38', '-9,5', '-20', '-18', '-28,5'] },
    { question: 'Найдите точку минимума функции $y = (x + 12)e^{x - 12}$.',
        correct: '-13', distractors: ['-26', '-6,5', '-14', '-12', '-19,5'] },
    { question: 'Найдите точку минимума функции $y = (x + 11)e^{x - 11}$.',
        correct: '-12', distractors: ['-24', '-6', '-13', '-11', '-18'] },
    { question: 'Найдите точку минимума функции $y = (x + 7)e^{x - 7}$.',
        correct: '-8', distractors: ['-16', '-4', '-9', '-7', '-12'] },
    { question: 'Найдите точку минимума функции $y = (x + 14)e^{x - 14}$.',
        correct: '-15', distractors: ['-30', '-7,5', '-16', '-14', '-22,5'] },
    { question: 'Найдите точку минимума функции $y = (x + 10)e^{x - 10}$.',
        correct: '-11', distractors: ['-22', '-5,5', '-12', '-10', '-16,5'] },
    { question: 'Найдите точку максимума функции $y = (9 - x)e^{x + 9}$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите точку максимума функции $y = (3 - x)e^{x + 3}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите точку максимума функции $y = (10 - x)e^{x + 10}$.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите точку максимума функции $y = (6 - x)e^{x + 6}$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите точку максимума функции $y = (8 - x)e^{x + 8}$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите точку максимума функции $y = (21 - x)e^{x + 21}$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите точку минимума функции $y = (3 - x)e^{3 - x}$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите точку минимума функции $y = (25 - x)e^{25 - x}$.',
        correct: '26', distractors: ['52', '13', '27', '25', '39'] },
    { question: 'Найдите точку минимума функции $y = (16 - x)e^{16 - x}$.',
        correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
    { question: 'Найдите точку минимума функции $y = (6 - x)e^{6 - x}$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите точку минимума функции $y = (11 - x)e^{11 - x}$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите точку максимума функции $y = (x + 16)e^{16 - x}$.',
        correct: '-15', distractors: ['-30', '-7,5', '-16', '-14', '-22,5'] },
    { question: 'Найдите точку максимума функции $y = (x + 17)e^{17 - x}$.',
        correct: '-16', distractors: ['-32', '-8', '-17', '-15', '-24'] },
    { question: 'Найдите точку максимума функции $y = (x + 9)e^{9 - x}$.',
        correct: '-8', distractors: ['-16', '-4', '-9', '-7', '-12'] },
    { question: 'Найдите точку максимума функции $y = (x + 13)e^{13 - x}$.',
        correct: '-12', distractors: ['-24', '-6', '-13', '-11', '-18'] },
    { question: 'Найдите точку максимума функции $y = (x + 7)e^{7 - x}$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 12 → Экстремумы показательных функций');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Экстремумы показательных функций',
            unitId: UNIT_ID,
            order: 4,
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
