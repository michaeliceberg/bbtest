// scripts/seedEGE-unit11-linear-function.ts
//
// Unit 11 курса "ЕГЭ Математика Профиль" — чтение линейной функции
// по графику, 5 задач с
// https://math-ege.sdamgia.ru/test?theme=267, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const COURSE_ID = 11;
const UNIT_ORDER = 11;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'На рисунке изображён график функции $f(x) = kx + b$. Найдите $f(-5)$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'], image: '290001' },
    { question: 'На рисунке изображён график функции $f(x) = kx + b$. Найдите $f(-9)$.',
        correct: '-10,5', distractors: ['-21', '-5,25', '-11,5', '-9,5', '-15,75'], image: '290002' },
    { question: 'На рисунке изображён график функции $f(x) = kx + b$. Найдите $f(12)$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'], image: '290003' },
    { question: 'На рисунке изображён график функции $f(x) = kx + b$. Найдите $f(-10)$.',
        correct: '-4,25', distractors: ['-8,5', '-2,125', '-5,25', '-3,25', '-6,375'], image: '290003' },
    { question: 'На рисунке изображён график функции $f(x) = kx + b$. Найдите $f(-16)$.',
        correct: '14,5', distractors: ['29', '7,25', '15,5', '13,5', '21,75'], image: '290004' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 11 → Линейная функция по графику');

        const [unit] = await db.insert(schema.units).values({
            title: 'Линейная функция по графику',
            description: 'Чтение коэффициентов линейной функции y = kx + b по графику',
            imageSrc: 'LottieUnit11',
            courseId: COURSE_ID,
            order: UNIT_ORDER,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Линейная функция по графику',
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
