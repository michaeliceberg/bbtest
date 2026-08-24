// scripts/seedEGE-unit8-antiderivative.ts
//
// Unit 8 курса "ЕГЭ Математика Профиль" — первообразная, чтение
// графика F(x)/f(x), 5 задач с
// https://math-ege.sdamgia.ru/test?theme=183, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const UNIT_ID = 95;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'На рисунке изображён график функции $y = F(x)$ — одной из первообразных функции $f(x)$, определённой на интервале $(-5;6)$. Найдите количество решений уравнения $f(x) = 0$ на отрезке $[-3;4]$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'], image: '281001' },
    { question: 'На рисунке изображён график функции $y = f(x)$. Функция $F(x)$ — одна из первообразных функции $f(x)$. Найдите площадь закрашенной фигуры.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'], image: '281002' },
    { question: 'На рисунке изображён график функции $y = f(x)$ (два луча с общей начальной точкой). Пользуясь рисунком, вычислите $F(6) - F(3)$, где $F(x)$ — одна из первообразных функции $f(x)$.',
        correct: '7,5', distractors: ['15', '3,75', '8,5', '6,5', '11,25'], image: '281003' },
    { question: 'На рисунке изображён график функции $y = f(x)$, определённой на интервале $(-4;12)$. Найдите наименьшее значение функции $f(x)$ на отрезке $[2;9,5]$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'], image: '281004' },
    { question: 'На рисунке изображён график функции $y = f(x)$. Пользуясь рисунком, вычислите определённый интеграл $\\int_{1}^{5} f(x)\\,dx$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'], image: '281005' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 8 → Первообразная');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Первообразная',
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
