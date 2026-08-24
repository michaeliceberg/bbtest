// scripts/seedEGE-unit7-letter-irrational-expressions.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — преобразования буквенных
// иррациональных выражений, 11 задач с
// https://math-ege.sdamgia.ru/test?theme=61, один урок.

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
    { question: 'Найдите значение выражения $\\frac{5 \\sqrt{x} +2}{\\sqrt{x}} -\\frac{2 \\sqrt{x}}{x}$ при $x > 0$',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt{m}}{\\sqrt[9]{m} \\cdot \\sqrt[18]{m}}$ при $m=64$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите значение выражения $\\frac{12 \\sqrt[9]{m} \\cdot \\sqrt[18]{m}}{\\sqrt[6]{m}}$ при $m > 0$',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt{81 \\sqrt[7]{b}}}{\\sqrt[14]{b}}$ при $b > 0$',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt[9]{\\sqrt{m}}}{\\sqrt{16 \\sqrt[9]{m}}}$ при $m > 0$',
        correct: '0,25', distractors: ['0,5', '0,125', '1,25', '0,01', '0,375'] },
    { question: 'Найдите значение выражения $\\frac{15 \\sqrt[5]{\\sqrt[28]{a}} -7 \\sqrt[7]{\\sqrt[20]{a}}}{2 \\sqrt[35]{\\sqrt[4]{a}}}$ при $a > 0$',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите $\\frac{g ( 2 -x )}{g ( 2 +x )}$ если $g ( x ) = \\sqrt[3]{x ( 4 -x )}$ при $|x| \\neq 2$',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите $h ( 5 +x ) +h ( 5 -x )$ если $h ( x ) = \\sqrt[3]{x} +\\sqrt[3]{x -10}$',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите значение выражения $\\frac{7 \\sqrt{x} -5}{\\sqrt{x}} +\\frac{5 \\sqrt{x}}{x} +3x -4$ при $x=3$',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите значение выражения $x +\\sqrt{x^{2} -4x +4}$ при $x \\leq 2$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\sqrt{( a -6 )^{2}} +\\sqrt{( a -10 )^{2}}$ при $6 \\leq a \\leq 10$',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Буквенные иррациональные выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Буквенные иррациональные выражения',
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
