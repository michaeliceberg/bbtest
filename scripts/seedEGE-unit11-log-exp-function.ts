// scripts/seedEGE-unit11-log-exp-function.ts
//
// Unit 11 курса "ЕГЭ Математика Профиль" — чтение логарифмической
// и показательной функции по графику, 11 задач с
// https://math-ege.sdamgia.ru/test?theme=272, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const UNIT_ID = 97;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите $f(32)$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'], image: '297001' },
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите $f\\left(\\dfrac{1}{8}\\right)$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'], image: '297001' },
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите значение $x$, при котором $f(x) = 2$.',
        correct: '32', distractors: ['64', '16', '33', '31', '48'], image: '297001' },
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите $f(27)$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'], image: '297002' },
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите $f(16)$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'], image: '297003' },
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите $f(0,5)$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'], image: '297003' },
    { question: 'На рисунке изображён график функции $f(x) = b + \\log_a(x)$. Найдите $f\\left(\\dfrac{1}{8}\\right)$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'], image: '297004' },
    { question: 'На рисунке изображён график функции $f(x) = \\log_a(x + b)$. Найдите $f(63)$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'], image: '297005' },
    { question: 'На рисунке изображён график функции $f(x) = \\log_a(x + b)$. Найдите $f(22)$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'], image: '297006' },
    { question: 'На рисунке изображён график функции $f(x) = \\log_a(x + b)$. Найдите значение $x$, при котором $f(x) = 3$.',
        correct: '23', distractors: ['46', '11,5', '24', '22', '34,5'], image: '297007' },
    { question: 'На рисунке изображён график функции $f(x) = a^{x} + b$. Найдите $f(10)$.',
        correct: '29', distractors: ['58', '14,5', '30', '28', '43,5'], image: '297008' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 11 → Логарифмическая и показательная функция по графику');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Логарифмическая и показательная функция по графику',
            unitId: UNIT_ID,
            order: 5,
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
