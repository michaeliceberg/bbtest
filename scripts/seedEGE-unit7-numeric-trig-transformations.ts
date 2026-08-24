// scripts/seedEGE-unit7-numeric-trig-transformations.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — преобразования числовых
// тригонометрических выражений, 32 задачи с
// https://math-ege.sdamgia.ru/test?theme=59, один урок.

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
    { question: 'Найдите значение выражения $\\frac{12\\sin 11^{\\circ} \\cdot \\cos 11^{\\circ}}{\\sin 22^{\\circ}}$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите значение выражения $\\frac{24(\\sin^{2} 17^{\\circ} -\\cos^{2} 17^{\\circ})}{\\cos 34^{\\circ}}$.',
        correct: '-24', distractors: ['-48', '-12', '-25', '-23', '-36'] },
    { question: 'Найдите значение выражения $\\frac{5\\cos 29^{\\circ}}{\\sin 61^{\\circ}}$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $36\\sqrt{6} \\tan \\frac{\\pi}{6} \\sin \\frac{\\pi}{4}$.',
        correct: '36', distractors: ['72', '18', '37', '35', '54'] },
    { question: 'Найдите значение выражения $4\\sqrt{2}\\cos \\frac{\\pi}{4} \\cos \\frac{7\\pi}{3}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{8}{\\sin\\left(-\\frac{27\\pi}{4}\\right)\\cos\\left(\\frac{31\\pi}{4}\\right)}$.',
        correct: '-16', distractors: ['-32', '-8', '-17', '-15', '-24'] },
    { question: 'Найдите значение выражения $-4\\sqrt{3}\\cos(-750^{\\circ})$.',
        correct: '-6', distractors: ['-12', '-3', '-7', '-5', '-9'] },
    { question: 'Найдите значение выражения $2\\sqrt{3}\\tan(-300^{\\circ})$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите значение выражения $-18\\sqrt{2}\\sin(-135^{\\circ})$.',
        correct: '18', distractors: ['36', '9', '19', '17', '27'] },
    { question: 'Найдите значение выражения $24\\sqrt{2}\\cos\\left(-\\frac{\\pi}{3}\\right)\\sin\\left(-\\frac{\\pi}{4}\\right)$.',
        correct: '-12', distractors: ['-24', '-6', '-13', '-11', '-18'] },
    { question: 'Найдите значение выражения $\\frac{14\\sin 19^{\\circ}}{\\sin 341^{\\circ}}$.',
        correct: '-14', distractors: ['-28', '-7', '-15', '-13', '-21'] },
    { question: 'Найдите значение выражения $\\frac{4\\cos 146^{\\circ}}{\\cos 34^{\\circ}}$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите значение выражения $\\frac{5\\tan 163^{\\circ}}{\\tan 17^{\\circ}}$.',
        correct: '-5', distractors: ['-10', '-2,5', '-6', '-4', '-7,5'] },
    { question: 'Найдите значение выражения $\\frac{14\\sin 409^{\\circ}}{\\sin 49^{\\circ}}$.',
        correct: '14', distractors: ['28', '7', '15', '13', '21'] },
    { question: 'Найдите значение выражения $5\\tan 17^{\\circ} \\cdot \\tan 107^{\\circ}$.',
        correct: '-5', distractors: ['-10', '-2,5', '-6', '-4', '-7,5'] },
    { question: 'Найдите значение выражения $7\\tan 13^{\\circ} \\cdot \\tan 77^{\\circ}$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $\\frac{12}{\\sin^{2} 37^{\\circ} +\\sin^{2} 127^{\\circ}}$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите значение выражения $\\frac{6}{\\cos^{2} 23^{\\circ} +\\cos^{2} 113^{\\circ}}$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите значение выражения $\\frac{12}{\\sin^{2} 27^{\\circ} +\\cos^{2} 207^{\\circ}}$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Найдите значение выражения $\\frac{5\\sin 98^{\\circ}}{\\sin 49^{\\circ} \\cdot \\sin 41^{\\circ}}$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'Найдите значение выражения $\\frac{5\\sin 74^{\\circ}}{\\cos 37^{\\circ} \\cdot \\cos 53^{\\circ}}$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'Найдите значение выражения $12\\sin 150^{\\circ} \\cdot \\cos 120^{\\circ}$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'] },
    { question: 'Найдите значение выражения $8\\sin \\frac{5\\pi}{12} \\cdot \\cos \\frac{5\\pi}{12}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\sqrt{3}\\cos^{2} \\frac{5\\pi}{12} -\\sqrt{3}\\sin^{2} \\frac{5\\pi}{12}$.',
        correct: '-1,5', distractors: ['-3', '-0,75', '-2,5', '-0,5', '-2,25'] },
    { question: 'Найдите значение выражения $\\sqrt{12}\\cos^{2} \\frac{5\\pi}{12} -\\sqrt{3}$.',
        correct: '-1,5', distractors: ['-3', '-0,75', '-2,5', '-0,5', '-2,25'] },
    { question: 'Найдите значение выражения $\\sqrt{3} -\\sqrt{12}\\sin^{2} \\frac{5\\pi}{12}$.',
        correct: '-1,5', distractors: ['-3', '-0,75', '-2,5', '-0,5', '-2,25'] },
    { question: 'Найдите значение выражения $-50\\tan 9^{\\circ} \\cdot \\tan 81^{\\circ} +31$.',
        correct: '-19', distractors: ['-38', '-9,5', '-20', '-18', '-28,5'] },
    { question: 'Найдите значение выражения $-\\frac{4}{\\sin^{2} 27^{\\circ} +\\sin^{2} 117^{\\circ}}$.',
        correct: '-4', distractors: ['-8', '-2', '-5', '-3', '-6'] },
    { question: 'Найдите значение выражения $\\frac{23}{\\sin^{2} 56^{\\circ} +1 +\\sin^{2} 146^{\\circ}}$.',
        correct: '11,5', distractors: ['23', '5,75', '12,5', '10,5', '17,25'] },
    { question: 'Найдите значение выражения $\\frac{50\\sin 19^{\\circ} \\cdot \\cos 19^{\\circ}}{\\sin 38^{\\circ}}$.',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'Найдите значение выражения $\\sqrt{3}\\sin \\frac{\\pi}{3} \\cdot \\cos 2\\pi +\\sqrt{2}\\cos \\frac{\\pi}{4} \\cdot \\sin \\frac{3\\pi}{2}$.',
        correct: '0,5', distractors: ['1', '0,25', '1,5', '0,01', '0,75'] },
    { question: 'Найдите значение выражения $-8\\cos 15^{\\circ} \\cdot \\cos 105^{\\circ}$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Числовые тригонометрические выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Преобразования числовых тригонометрических выражений',
            unitId: UNIT_ID,
            order: 8,
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
