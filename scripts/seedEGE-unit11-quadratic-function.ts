// scripts/seedEGE-unit11-quadratic-function.ts
//
// Unit 11 курса "ЕГЭ Математика Профиль" — чтение квадратичной
// функции по графику, 8 задач с
// https://math-ege.sdamgia.ru/test?theme=294, один урок.

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
    { question: 'На рисунке изображён график функции $f(x) = 2x^{2} + bx + c$. Найдите $f(-5)$.',
        correct: '31', distractors: ['62', '15,5', '32', '30', '46,5'], image: '294001' },
    { question: 'На рисунке изображён график функции $f(x) = -2x^{2} + bx + c$. Найдите $f(5)$.',
        correct: '-13', distractors: ['-26', '-6,5', '-14', '-12', '-19,5'], image: '294002' },
    { question: 'На рисунке изображён график функции $f(x) = -2x^{2} + bx + c$. Найдите $f(3)$.',
        correct: '-21', distractors: ['-42', '-10,5', '-22', '-20', '-31,5'], image: '294003' },
    { question: 'На рисунке изображён график функции $f(x) = -2x^{2} + bx + c$. Найдите $f(-2)$.',
        correct: '-12', distractors: ['-24', '-6', '-13', '-11', '-18'], image: '294004' },
    { question: 'На рисунке изображён график функции $f(x) = x^{2} + bx + c$. Найдите $f(-1)$.',
        correct: '34', distractors: ['68', '17', '35', '33', '51'], image: '294005' },
    { question: 'На рисунке изображён график функции $f(x) = -x^{2} + bx + c$. Найдите $f(-8)$.',
        correct: '-13', distractors: ['-26', '-6,5', '-14', '-12', '-19,5'], image: '294006' },
    { question: 'На рисунке изображён график функции $f(x) = ax^{2} - 4x + c$. Найдите $f(-3)$.',
        correct: '26', distractors: ['52', '13', '27', '25', '39'], image: '294007' },
    { question: 'На рисунке изображён график функции $f(x) = ax^{2} - 3x + c$. Найдите $f(-4)$.',
        correct: '-14', distractors: ['-28', '-7', '-15', '-13', '-21'], image: '294003' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 11 → Квадратичная функция по графику');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Квадратичная функция по графику',
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
