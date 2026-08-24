// scripts/seedEGE-unit11-hyperbola-function.ts
//
// Unit 11 курса "ЕГЭ Математика Профиль" — чтение функции
// f(x) = k/x + a по графику, 7 задач с
// https://math-ege.sdamgia.ru/test?theme=125, один урок.

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
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f(-12)$.',
        correct: '0,75', distractors: ['1,5', '0,375', '1,75', '0,01', '1,125'], image: '295001' },
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f(50)$.',
        correct: '-2,96', distractors: ['-5,92', '-1,48', '-3,96', '-1,96', '-4,44'], image: '295002' },
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f\\left(\\dfrac{1}{3}\\right)$.',
        correct: '11', distractors: ['22', '5,5', '12', '10', '16,5'], image: '295003' },
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f(7,5)$.',
        correct: '1,6', distractors: ['3,2', '0,8', '2,6', '0,6', '2,4'], image: '295004' },
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f(25)$.',
        correct: '0,84', distractors: ['1,68', '0,42', '1,84', '0,01', '1,26'], image: '295005' },
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f(12,5)$.',
        correct: '-2,4', distractors: ['-4,8', '-1,2', '-3,4', '-1,4', '-3,6'], image: '295006' },
    { question: 'На рисунке изображён график функции $f(x) = \\dfrac{k}{x} + a$. Найдите $f(20)$.',
        correct: '-0,9', distractors: ['-1,8', '-0,45', '-1,9', '-0,01', '-1,35'], image: '295007' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 11 → Функция k/x + a по графику');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Функция k/x + a по графику',
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
