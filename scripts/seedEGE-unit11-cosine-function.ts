// scripts/seedEGE-unit11-cosine-function.ts
//
// Unit 11 курса "ЕГЭ Математика Профиль" — чтение функции
// f(x) = a*cos(x) + b по графику, 8 задач с
// https://math-ege.sdamgia.ru/test?theme=191, один урок.

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
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $a$.',
        correct: '1,5', distractors: ['3', '0,75', '2,5', '0,5', '2,25'], image: '298001' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $b$.',
        correct: '-0,5', distractors: ['-1', '-0,25', '-1,5', '-0,01', '-0,75'], image: '298002' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $a$.',
        correct: '-1,5', distractors: ['-3', '-0,75', '-2,5', '-0,5', '-2,25'], image: '298003' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $b$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'], image: '298004' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $a$.',
        correct: '-1,5', distractors: ['-3', '-0,75', '-2,5', '-0,5', '-2,25'], image: '298005' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $b$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'], image: '298006' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $a$.',
        correct: '-2', distractors: ['-4', '-1', '-3', '-5', '-6'], image: '298007' },
    { question: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $f(0)$.',
        correct: '0,5', distractors: ['1', '0,25', '1,5', '0,01', '0,75'], image: '298008' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 11 → Функция a*cos(x)+b по графику');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Функция a·cos(x)+b по графику',
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
