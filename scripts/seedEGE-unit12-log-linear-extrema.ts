// scripts/seedEGE-unit12-log-linear-extrema.ts
//
// Unit 12 курса "ЕГЭ Математика Профиль" — наибольшее/наименьшее
// значение функций вида kx-ln(x+A)^n на отрезке, 22 задачи с
// https://math-ege.sdamgia.ru/test?theme=80, один урок.

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
    { question: 'Найдите наименьшее значение функции $y = 3x - \\ln(x + 3)^{3}$ на отрезке $[-2,5; 0]$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите наименьшее значение функции $y = 3x - \\ln(x + 5)^{3}$ на отрезке $[-4,5; 0]$.',
        correct: '-12', distractors: ['-24', '-6', '-13', '-11', '-18'] },
    { question: 'Найдите наименьшее значение функции $y = 5x - \\ln(x + 5)^{5}$ на отрезке $[-4,5; 0]$.',
        correct: '-20', distractors: ['-40', '-10', '-21', '-19', '-30'] },
    { question: 'Найдите наименьшее значение функции $y = 4x - \\ln(x + 8)^{4}$ на отрезке $[-7,5; 0]$.',
        correct: '-28', distractors: ['-56', '-14', '-29', '-27', '-42'] },
    { question: 'Найдите наименьшее значение функции $y = 3x - \\ln(x + 2)^{3}$ на отрезке $[-1,5; 0]$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'] },
    { question: 'Найдите наименьшее значение функции $y = 8x - \\ln(x + 3)^{8}$ на отрезке $[-2,5; 0]$.',
        correct: '-16', distractors: ['-32', '-8', '-17', '-15', '-24'] },
    { question: 'Найдите наибольшее значение функции $y = \\ln(x + 5)^{5} - 5x$ на отрезке $[-4,5; 0]$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите наибольшее значение функции $y = \\ln(x + 4)^{9} - 9x$ на отрезке $[-3,5; 0]$.',
        correct: '27', distractors: ['54', '13,5', '28', '26', '40,5'] },
    { question: 'Найдите наибольшее значение функции $y = \\ln(x + 8)^{9} - 9x$ на отрезке $[-7,5; 0]$.',
        correct: '63', distractors: ['126', '31,5', '64', '62', '94,5'] },
    { question: 'Найдите наибольшее значение функции $y = \\ln(x + 5)^{7} - 7x$ на отрезке $[-4,5; 0]$.',
        correct: '28', distractors: ['56', '14', '29', '27', '42'] },
    { question: 'Найдите наибольшее значение функции $y = \\ln(x + 5)^{8} - 8x$ на отрезке $[-4,5; 0]$.',
        correct: '32', distractors: ['64', '16', '33', '31', '48'] },
    { question: 'Найдите наибольшее значение функции $y = \\ln(x + 3)^{9} - 9x$ на отрезке $[-2,5; 0]$.',
        correct: '18', distractors: ['36', '9', '19', '17', '27'] },
    { question: 'Найдите наименьшее значение функции $y = 4x - 4\\ln(x + 7) + 6$ на отрезке $[-6,5; 0]$.',
        correct: '-18', distractors: ['-36', '-9', '-19', '-17', '-27'] },
    { question: 'Найдите наименьшее значение функции $y = 5x - 5\\ln(x + 7) + 11$ на отрезке $[-6,5; 0]$.',
        correct: '-19', distractors: ['-38', '-9,5', '-20', '-18', '-28,5'] },
    { question: 'Найдите наименьшее значение функции $y = 9x - 9\\ln(x + 3) + 12$ на отрезке $[-2,5; 0]$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите наименьшее значение функции $y = 2x - 2\\ln(x + 8) + 7$ на отрезке $[-7,5; 0]$.',
        correct: '-7', distractors: ['-14', '-3,5', '-8', '-6', '-10,5'] },
    { question: 'Найдите наименьшее значение функции $y = 6x - 6\\ln(x + 4) + 3$ на отрезке $[-3,5; 0]$.',
        correct: '-15', distractors: ['-30', '-7,5', '-16', '-14', '-22,5'] },
    { question: 'Найдите наименьшее значение функции $y = 4x - 4\\ln(x + 4) + 8$ на отрезке $[-3,5; 0]$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите наименьшее значение функции $y = 4x - 4\\ln(x + 4) + 3$ на отрезке $[-3,5; 0]$.',
        correct: '-9', distractors: ['-18', '-4,5', '-10', '-8', '-13,5'] },
    { question: 'Найдите наименьшее значение функции $y = 7x - 7\\ln(x + 8) + 2$ на отрезке $[-7,5; 0]$.',
        correct: '-47', distractors: ['-94', '-23,5', '-48', '-46', '-70,5'] },
    { question: 'Найдите наименьшее значение функции $y = 8x - 8\\ln(x + 8) + 12$ на отрезке $[-7,5; 0]$.',
        correct: '-44', distractors: ['-88', '-22', '-45', '-43', '-66'] },
    { question: 'Найдите наименьшее значение функции $y = 3x - 3\\ln(x + 3) + 4$ на отрезке $[-2,5; 0]$.',
        correct: '-2', distractors: ['-4', '-1', '-3', '-5', '-6'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 12 → Экстремумы логарифмическо-линейных функций');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Экстремумы логарифмическо-линейных функций',
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
