// scripts/seedEGE-unit11-line-parabola-intersect.ts
//
// Unit 11 курса "ЕГЭ Математика Профиль" — точки пересечения
// прямой и параболы по графику, 9 задач с
// https://math-ege.sdamgia.ru/test?theme=296, один урок.

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
    { question: 'На рисунке изображены графики функций $f(x) = 5x + 9$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'], image: '299001' },
    { question: 'На рисунке изображены графики функций $f(x) = 5x + 9$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите ординату точки $B$.',
        correct: '39', distractors: ['78', '19,5', '40', '38', '58,5'], image: '299001' },
    { question: 'На рисунке изображены графики функций $f(x) = -4x + 9$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.',
        correct: '-8', distractors: ['-16', '-4', '-9', '-7', '-12'], image: '299002' },
    { question: 'На рисунке изображены графики функций $f(x) = -4x + 9$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите ординату точки $B$.',
        correct: '41', distractors: ['82', '20,5', '42', '40', '61,5'], image: '299002' },
    { question: 'На рисунке изображены графики функций $f(x) = -3x + 13$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'], image: '299003' },
    { question: 'На рисунке изображены графики функций $f(x) = -3x + 13$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите ординату точки $B$.',
        correct: '22', distractors: ['44', '11', '23', '21', '33'], image: '299003' },
    { question: 'На рисунке изображены графики функций $f(x) = 3x + 5$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.',
        correct: '-7', distractors: ['-14', '-3,5', '-8', '-6', '-10,5'], image: '299004' },
    { question: 'На рисунке изображены графики функций $f(x) = 3x + 5$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите ординату точки $B$.',
        correct: '-16', distractors: ['-32', '-8', '-17', '-15', '-24'], image: '299004' },
    { question: 'На рисунке изображены графики функций $f(x) = -2x - 4$ и $g(x) = ax^{2} + bx + c$, которые пересекаются в точках $A$ и $B$. Найдите абсциссу точки $B$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'], image: '299005' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 11 → Пересечение прямой и параболы');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Пересечение прямой и параболы',
            unitId: UNIT_ID,
            order: 7,
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
