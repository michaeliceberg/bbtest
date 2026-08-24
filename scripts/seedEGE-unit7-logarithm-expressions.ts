// scripts/seedEGE-unit7-logarithm-expressions.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — преобразования числовых
// логарифмических выражений, 34 задачи с
// https://math-ege.sdamgia.ru/test?theme=58, один урок.

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
    { question: 'Найдите значение выражения $\\log_3 1,8 + \\log_3 5$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $( \\log_2 16 ) \\cdot ( \\log_6 36 )$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите значение выражения $7 \\cdot 5^{\\log_5 4}$.',
        correct: '28', distractors: ['56', '14', '29', '27', '42'] },
    { question: 'Найдите значение выражения $36^{\\log_6 5}$.',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'Найдите значение выражения $\\log_{0,25} 2$.',
        correct: '-0,5', distractors: ['-1', '-0,25', '-1,5', '-0,01', '-0,75'] },
    { question: 'Найдите значение выражения $\\log_4 8$.',
        correct: '1,5', distractors: ['3', '0,75', '2,5', '0,5', '2,25'] },
    { question: 'Найдите значение выражения $\\log_5 60 - \\log_5 12$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите значение выражения $\\log_5 0,2 + \\log_{0,5} 4$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'] },
    { question: 'Найдите значение выражения $\\log_{0,3} 10 - \\log_{0,3} 3$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите значение выражения $\\frac{\\log_3 25}{\\log_3 5}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{\\log_7 13}{\\log_{49} 13}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\log_5 9 \\cdot \\log_3 25$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите значение выражения $\\frac{9^{\\log_5 50}}{9^{\\log_5 2}}$.',
        correct: '81', distractors: ['162', '40,5', '82', '80', '121,5'] },
    { question: 'Найдите значение выражения $( 1 -\\log_2 12 ) ( 1 -\\log_6 12 )$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите значение выражения $6 \\log_7 \\sqrt[3]{7}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\log_{\\sqrt[6]{13}} 13$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите значение выражения $\\frac{\\log_3 18}{2 +\\log_3 2}$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите значение выражения $\\frac{\\log_3 5}{\\log_3 7} +\\log_7 0,2$.',
        correct: '0', distractors: ['1', '-1', '2', '0,5', '-0,5'] },
    { question: 'Найдите значение выражения $\\log_{0,8} 3 \\cdot \\log_3 1,25$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите значение выражения $5^{\\log_{25} 49}$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $( \\log_{\\sqrt{7}} 49 )^{2}$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите значение выражения $5^{3 +\\log_5 2}$.',
        correct: '250', distractors: ['500', '125', '251', '249', '375'] },
    { question: 'Найдите значение выражения $8^{2 \\log_8 3}$.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'Найдите значение выражения $64^{\\log_8 \\sqrt{3}}$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите значение выражения $\\log_4 ( \\log_5 25 )$.',
        correct: '0,5', distractors: ['1', '0,25', '1,5', '0,01', '0,75'] },
    { question: 'Найдите значение выражения $\\frac{24}{3^{\\log_3 2}}$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите значение выражения $\\log_{\\frac{1}{13}} \\sqrt{13}$.',
        correct: '-0,5', distractors: ['-1', '-0,25', '-1,5', '-0,01', '-0,75'] },
    { question: 'Найдите значение выражения $\\log_3 8,1 +\\log_3 10$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите значение выражения $\\frac{\\log_6 \\sqrt{13}}{\\log_6 13}$.',
        correct: '0,5', distractors: ['1', '0,25', '1,5', '0,01', '0,75'] },
    { question: 'Найдите значение выражения $( 3^{\\log_2 3} )^{\\log_3 2}$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите значение выражения $\\log_5 7 \\cdot \\log_7 25$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{\\log_2 12,8 -\\log_2 0,8}{5^{\\log_{25} 16}}$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите значение выражения $3^{\\log_3 7} +49^{\\log_7 \\sqrt{13}}$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите значение выражения $\\frac{\\log_5 63}{\\log_5 3} -\\log_3 ( 7 \\sqrt{3} )$.',
        correct: '1,5', distractors: ['3', '0,75', '2,5', '0,5', '2,25'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Логарифмические выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Преобразования логарифмических выражений',
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
