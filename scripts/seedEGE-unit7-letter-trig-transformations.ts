// scripts/seedEGE-unit7-letter-trig-transformations.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — преобразования буквенных
// тригонометрических выражений, 2 задачи с
// https://math-ege.sdamgia.ru/test?theme=64, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const UNIT_ID = 94;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = { question: string; correct: string; distractors: string[] };

const challenges: ChallengeSeed[] = [
    { question: 'Найдите значение выражения $\\frac{3\\cos(\\pi -\\beta) +\\sin\\left(\\frac{\\pi}{2} +\\beta\\right)}{\\cos(\\beta +3\\pi)}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{2\\sin(\\alpha -7\\pi) +\\cos\\left(\\frac{3\\pi}{2} +\\alpha\\right)}{\\sin(\\alpha +\\pi)}$.',
        correct: '1', distractors: ['2', '0,5', '3', '-1', '4'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Буквенные тригонометрические выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Буквенные тригонометрические выражения',
            unitId: UNIT_ID,
            order: 9,
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
                imageSrc: '',
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
