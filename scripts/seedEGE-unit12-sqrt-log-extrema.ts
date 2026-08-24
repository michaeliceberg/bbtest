// scripts/seedEGE-unit12-sqrt-log-extrema.ts
//
// Unit 12 курса "ЕГЭ Математика Профиль" — точки экстремума и
// наибольшее/наименьшее значение функций вида sqrt(квадратный
// трёхчлен) и log(квадратный трёхчлен), 17 задач с
// https://math-ege.sdamgia.ru/test?theme=175, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const COURSE_ID = 11;
const UNIT_ORDER = 12;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'Найдите точку максимума функции $y = \\sqrt{4 - 4x - x^{2}}$.',
        correct: '-2', distractors: ['-4', '-1', '-3', '-5', '-6'] },
    { question: 'Найдите точку максимума функции $y = \\sqrt{-79 - 18x - x^{2}}$.',
        correct: '-9', distractors: ['-18', '-4,5', '-10', '-8', '-13,5'] },
    { question: 'Найдите точку максимума функции $y = \\sqrt{13 + 6x - x^{2}}$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите точку максимума функции $y = \\sqrt{-1 + 8x - x^{2}}$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите точку максимума функции $y = \\sqrt{-76 - 20x - x^{2}}$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите точку максимума функции $y = \\sqrt{-41 + 16x - x^{2}}$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите точку минимума функции $y = \\sqrt{x^{2} - 6x + 11}$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите точку минимума функции $y = \\sqrt{x^{2} + 4x + 21}$.',
        correct: '-2', distractors: ['-4', '-1', '-3', '-5', '-6'] },
    { question: 'Найдите точку минимума функции $y = \\sqrt{x^{2} - 12x + 55}$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите наименьшее значение функции $y = \\sqrt{x^{2} - 16x + 185}$.',
        correct: '11', distractors: ['22', '5,5', '12', '10', '16,5'] },
    { question: 'Найдите наименьшее значение функции $y = \\sqrt{x^{2} + 12x + 52}$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите наименьшее значение функции $y = \\sqrt{x^{2} - 20x + 101}$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите наименьшее значение функции $y = \\sqrt{x^{2} + 22x + 122}$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите наибольшее значение функции $y = \\sqrt{32 + 14x - x^{2}}$.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите наибольшее значение функции $y = \\sqrt{-80 - 24x - x^{2}}$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите точку максимума функции $y = \\log_3(-135 - 24x - x^{2}) - 6$.',
        correct: '-12', distractors: ['-24', '-6', '-13', '-11', '-18'] },
    { question: 'Найдите точку максимума функции $y = \\log_7(-185 + 28x - x^{2}) - 7$.',
        correct: '14', distractors: ['28', '7', '15', '13', '21'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 12 → Экстремумы sqrt/log от квадратного трёхчлена');

        const [unit] = await db.insert(schema.units).values({
            title: 'Экстремумы функций sqrt и log',
            description: 'Точки экстремума и наибольшее/наименьшее значение функций вида sqrt(квадратный трёхчлен) и log(квадратный трёхчлен)',
            imageSrc: 'LottieUnit12',
            courseId: COURSE_ID,
            order: UNIT_ORDER,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Экстремумы функций sqrt и log',
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
