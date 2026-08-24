// scripts/seedEGE-unit7-irrational-expressions.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — преобразования числовых
// иррациональных выражений, 13 задач с
// https://math-ege.sdamgia.ru/test?theme=56, один урок.

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
    { question: 'Найдите значение выражения $\\sqrt{65^{2} -56^{2}}$',
        correct: '33', distractors: ['66', '16,5', '34', '32', '49,5'] },
    { question: 'Найдите значение выражения $\\frac{( 2 \\sqrt{7} )^{2}}{14}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $( \\sqrt{13} -\\sqrt{7} ) ( \\sqrt{13} +\\sqrt{7} )$',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt{2,8} \\cdot \\sqrt{4,2}}{\\sqrt{0,24}}$',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $( \\sqrt{3\\frac{6}{7}} -\\sqrt{1\\frac{5}{7}} ) : \\sqrt{\\frac{3}{28}}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt[9]{7} \\cdot \\sqrt[18]{7}}{\\sqrt[6]{7}}$',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt[5]{10} \\cdot \\sqrt[5]{16}}{\\sqrt[5]{5}}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{( \\sqrt{13} +\\sqrt{7} )^{2}}{10 +\\sqrt{91}}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $5 \\cdot \\sqrt[3]{9} \\cdot \\sqrt[6]{9}$',
        correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
    { question: 'Найдите значение выражения $\\sqrt[3]{49} \\cdot \\sqrt[6]{49}$',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $( \\sqrt{15} -\\sqrt{60} ) \\cdot \\sqrt{15}$',
        correct: '-15', distractors: ['-30', '-7,5', '-16', '-14', '-22,5'] },
    { question: 'Найдите значение выражения ($\\sqrt{63}$ − $\\sqrt{28}$) $\\cdot \\sqrt{7}$',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $( \\sqrt{54} -\\sqrt{24} ) \\cdot \\sqrt{6}$',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Иррациональные выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Преобразования иррациональных выражений',
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
