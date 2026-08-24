// scripts/seedEGE-unit7-trig-expressions.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — вычисление значений
// тригонометрических выражений, 31 задача с
// https://math-ege.sdamgia.ru/test?theme=65, один урок.

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
    { question: 'Найдите $\\tan \\alpha$, если $\\cos \\alpha = \\frac{\\sqrt{10}}{10}$ и $\\alpha \\in \\left(\\frac{3\\pi}{2};2\\pi\\right)$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'] },
    { question: 'Найдите $\\tan \\alpha$, если $\\sin \\alpha = -\\frac{5}{\\sqrt{26}}$ и $\\alpha \\in \\left(\\pi;\\frac{3\\pi}{2}\\right)$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите $3\\cos \\alpha$, если $\\sin \\alpha = -\\frac{2\\sqrt{2}}{3}$ и $\\alpha \\in \\left(\\frac{3\\pi}{2};2\\pi\\right)$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Найдите $5\\sin \\alpha$, если $\\cos \\alpha = \\frac{2\\sqrt{6}}{5}$ и $\\alpha \\in \\left(\\frac{3\\pi}{2};2\\pi\\right)$.',
        correct: '-1', distractors: ['-2', '-0,5', '-0,01', '-1,5', '-3'] },
    { question: 'Найдите $24\\cos 2\\alpha$, если $\\sin \\alpha = -0,2$.',
        correct: '22,08', distractors: ['44,16', '11,04', '23,08', '21,08', '33,12'] },
    { question: 'Найдите $\\frac{10\\sin 6\\alpha}{3\\cos 3\\alpha}$, если $\\sin 3\\alpha = 0,6$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите $5\\tan(5\\pi -\\gamma) -\\tan(-\\gamma)$, если $\\tan \\gamma = 7$.',
        correct: '-28', distractors: ['-56', '-14', '-29', '-27', '-42'] },
    { question: 'Найдите $\\sin\\left(\\frac{7\\pi}{2} -\\alpha\\right)$, если $\\sin \\alpha = 0,8$ и $\\alpha \\in \\left(\\frac{\\pi}{2};\\pi\\right)$.',
        correct: '0,6', distractors: ['1,2', '0,3', '1,6', '0,01', '0,9'] },
    { question: 'Найдите $26\\cos\\left(\\frac{3\\pi}{2} +\\alpha\\right)$, если $\\cos \\alpha = \\frac{12}{13}$ и $\\alpha \\in \\left(\\frac{3\\pi}{2};2\\pi\\right)$.',
        correct: '-10', distractors: ['-20', '-5', '-11', '-9', '-15'] },
    { question: 'Найдите $\\tan\\left(\\alpha +\\frac{5\\pi}{2}\\right)$, если $\\tan \\alpha = 0,4$.',
        correct: '-2,5', distractors: ['-5', '-1,25', '-3,5', '-1,5', '-3,75'] },
    { question: 'Найдите $\\tan^{2} \\alpha$, если $5\\sin^{2} \\alpha +13\\cos^{2} \\alpha = 6$.',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите $\\frac{3\\cos \\alpha -4\\sin \\alpha}{2\\sin \\alpha -5\\cos \\alpha}$, если $\\tan \\alpha = 3$.',
        correct: '-9', distractors: ['-18', '-4,5', '-10', '-8', '-13,5'] },
    { question: 'Найдите $\\frac{10\\cos \\alpha +4\\sin \\alpha +15}{2\\sin \\alpha +5\\cos \\alpha +3}$, если $\\tan \\alpha = -2,5$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите $\\tan \\alpha$, если $\\frac{7\\sin \\alpha +13\\cos \\alpha}{5\\sin \\alpha -17\\cos \\alpha} = 3$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите $\\tan \\alpha$, если $\\frac{3\\sin \\alpha -5\\cos \\alpha +2}{\\sin \\alpha +3\\cos \\alpha +6} = \\frac{1}{3}$.',
        correct: '2,25', distractors: ['4,5', '1,125', '3,25', '1,25', '3,375'] },
    { question: 'Найдите $7\\cos(\\pi +\\beta) -2\\sin\\left(\\frac{\\pi}{2} +\\beta\\right)$, если $\\cos \\beta = -\\frac{1}{3}$.',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите $5\\sin(\\alpha -7\\pi) -11\\cos\\left(\\frac{3\\pi}{2} +\\alpha\\right)$, если $\\sin \\alpha = -0,25$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'Найдите $9\\cos 2\\alpha$, если $\\cos \\alpha = \\frac{1}{3}$.',
        correct: '-7', distractors: ['-14', '-3,5', '-8', '-6', '-10,5'] },
    { question: 'Найдите $-47\\cos 2\\alpha$, если $\\cos \\alpha = -0,4$.',
        correct: '31,96', distractors: ['63,92', '15,98', '32,96', '30,96', '47,94'] },
    { question: 'Найдите значение выражения $\\frac{51\\cos 4^{\\circ}}{\\sin 86^{\\circ}} +8$.',
        correct: '59', distractors: ['118', '29,5', '60', '58', '88,5'] },
    { question: 'Найдите значение выражения $\\frac{19}{\\cos^{2} 37^{\\circ} +1 +\\cos^{2} 53^{\\circ}}$.',
        correct: '9,5', distractors: ['19', '4,75', '10,5', '8,5', '14,25'] },
    { question: 'Найдите значение выражения $\\frac{59}{\\cos^{2} 14^{\\circ} +3 +\\cos^{2} 76^{\\circ}}$.',
        correct: '14,75', distractors: ['29,5', '7,375', '15,75', '13,75', '22,125'] },
    { question: 'Найдите значение выражения $\\frac{35\\cos 11^{\\circ}}{\\sin 79^{\\circ}} +7$.',
        correct: '42', distractors: ['84', '21', '43', '41', '63'] },
    { question: 'Найдите значение выражения $46\\tan 7^{\\circ} \\cdot \\tan 83^{\\circ}$.',
        correct: '46', distractors: ['92', '23', '47', '45', '69'] },
    { question: 'Найдите $\\tan \\alpha$, если $\\cos \\alpha = -\\frac{\\sqrt{10}}{10}$ и $\\alpha \\in \\left(\\frac{\\pi}{2};\\pi\\right)$.',
        correct: '-3', distractors: ['-6', '-1,5', '-4', '-2', '-4,5'] },
    { question: 'Найдите значение выражения $\\frac{32\\cos 26^{\\circ}}{\\sin 64^{\\circ}}$.',
        correct: '32', distractors: ['64', '16', '33', '31', '48'] },
    { question: 'Найдите значение выражения $\\sqrt{50}\\cos^{2} \\frac{9\\pi}{8} -\\sqrt{50}\\sin^{2} \\frac{9\\pi}{8}$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите $\\cos \\alpha$, если $\\sin \\alpha = \\frac{2\\sqrt{6}}{5}$ и $\\alpha \\in \\left(\\frac{\\pi}{2};\\pi\\right)$.',
        correct: '-0,2', distractors: ['-0,4', '-0,1', '-1,2', '-0,01', '-0,3'] },
    { question: 'Найдите $2\\cos 2\\alpha$, если $\\sin \\alpha = -0,7$.',
        correct: '0,04', distractors: ['0,08', '0,02', '1,04', '0,01', '0,06'] },
    { question: 'Найдите $\\sin 2\\alpha$, если $\\cos \\alpha = 0,6$ и $\\pi < \\alpha < 2\\pi$.',
        correct: '-0,96', distractors: ['-1,92', '-0,48', '-1,96', '-0,01', '-1,44'] },
    { question: 'Найдите значение выражения $4\\sqrt{2}\\cos^{2} \\frac{15\\pi}{8} -2\\sqrt{2}$.',
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Тригонометрические выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Вычисление значений тригонометрических выражений',
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
