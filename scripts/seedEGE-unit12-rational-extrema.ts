// scripts/seedEGE-unit12-rational-extrema.ts
//
// Unit 12 курса "ЕГЭ Математика Профиль" — точки экстремума и
// наибольшее/наименьшее значение дробно-рациональных функций вида
// y=-(x²+A)/x, 11 задач с
// https://math-ege.sdamgia.ru/test?theme=83, один урок.

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
    { question: 'Найдите точку максимума функции $y = -\\dfrac{x^{2} + 289}{x}$.',
        correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
    { question: 'Найдите точку минимума функции $y = -\\dfrac{x^{2} + 1}{x}$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите наименьшее значение функции $y = \\dfrac{x^{2} + 25}{x}$ на отрезке $[1; 10]$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'Найдите наибольшее значение функции $y = \\dfrac{x^{2} + 25}{x}$ на отрезке $[-10; -1]$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите точку максимума функции $y = \\dfrac{16}{x} + x + 3$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите точку максимума функции $y = -\\dfrac{x^{2} + 121}{x}$.',
        correct: '11', distractors: ['22', '5,5', '12', '10', '16,5'] },
    { question: 'Найдите точку максимума функции $y = -\\dfrac{x^{2} + 576}{x}$.',
        correct: '24', distractors: ['48', '12', '25', '23', '36'] },
    { question: 'Найдите точку максимума функции $y = -\\dfrac{x^{2} + 841}{x}$.',
        correct: '29', distractors: ['58', '14,5', '30', '28', '43,5'] },
    { question: 'Найдите точку минимума функции $y = -\\dfrac{x^{2} + 36}{x}$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите точку минимума функции $y = -\\dfrac{x^{2} + 256}{x}$.',
        correct: '-16', distractors: ['-32', '-8', '-17', '-15', '-24'] },
    { question: 'Найдите точку минимума функции $y = -\\dfrac{x^{2} + 441}{x}$.',
        correct: '-21', distractors: ['-42', '-10,5', '-22', '-20', '-31,5'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 12 → Экстремумы дробно-рациональных функций');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Экстремумы дробно-рациональных функций',
            unitId: UNIT_ID,
            order: 3,
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
