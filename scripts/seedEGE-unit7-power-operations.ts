// scripts/seedEGE-unit7-power-operations.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — действия со степенями,
// 31 задача с https://math-ege.sdamgia.ru/test?theme=62, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const UNIT_ID = 94;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = { question: string; correct: string; distractors: string[] };

const challenges: ChallengeSeed[] = [
    { question: 'Найдите значение выражения $\\frac{7 ( m^{5} )^{6} +11 ( m^{3} )^{10}}{( 3m^{15} )^{2}}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{( 3x )^{3} \\cdot x^{-9}}{x^{-10} \\cdot 2x^{4}}$',
        correct: '13,5', distractors: ['27', '6,75', '14,5', '12,5', '20,25'] },
    { question: 'Найдите значение выражения $\\frac{a^{2} b^{-6}}{( 4a )^{3} b^{-2}} \\cdot \\frac{16}{a^{-1} b^{-4}}$',
        correct: '0,25', distractors: ['0,5', '0,125', '1,25', '0,01', '0,375'] },
    { question: 'Найдите значение выражения $( ( 2x^{3} )^{4} -( x^{2} )^{6} ) : ( 3x^{12} )$',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'Найдите значение выражения $18x^{7} \\cdot x^{13} : ( 3x^{10} )^{2}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $( 7x^{3} )^{2} : ( 7x^{6} )$',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Найдите значение выражения $( 4a )^{3} :a^{7} \\cdot a^{4}$',
        correct: '64', distractors: ['128', '32', '65', '63', '96'] },
    { question: 'Найдите значение выражения $\\frac{11a^{6}}{b^{3}} -( 3a^{2} b )^{3} 4a^{6} b^{6}$ при $b=2$',
        correct: '-0,5', distractors: ['-1', '-0,25', '-1,5', '-0,01', '-0,75'] },
    { question: 'Найдите значение выражения $\\frac{a^{3,33}}{a^{2,11} \\cdot a^{2,22}}$ при $a= \\frac{2}{7}$',
        correct: '3,5', distractors: ['7', '1,75', '4,5', '2,5', '5,25'] },
    { question: 'Найдите значение выражения $a^{0,65} \\cdot a^{0,67} \\cdot a^{0,68}$ при $a=11$',
        correct: '121', distractors: ['242', '60,5', '122', '120', '181,5'] },
    { question: 'Найдите значение выражения $\\frac{6n^{\\frac{1}{3}}}{n^{\\frac{1}{12}} \\cdot n^{\\frac{1}{4}}}$ при $n > 0$',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Найдите значение выражения $\\frac{( \\sqrt[3]{7a^{2}} )^{6}}{a^{4}}$ при $a \\neq 0$',
        correct: '49', distractors: ['98', '24,5', '50', '48', '73,5'] },
    { question: 'Найдите значение выражения $\\frac{( 4a )^{2,5}}{a^{2} \\sqrt{a}}$ при $a > 0$',
        correct: '32', distractors: ['64', '16', '33', '31', '48'] },
    { question: 'Найдите значение выражения $\\frac{( 9b )^{1,5} \\cdot b^{2,7}}{b^{4,2}}$ при $b > 0$',
        correct: '27', distractors: ['54', '13,5', '28', '26', '40,5'] },
    { question: 'Найдите значение выражения $\\frac{( \\sqrt{3} a )^{2} \\sqrt[5]{a^{3}}}{a^{2,6}}$ при $a > 0$',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'Найдите значение выражения $\\frac{n^{\\frac{5}{6}}}{n^{\\frac{1}{12}} \\cdot n^{\\frac{1}{4}}}$ при $n=64$',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите значение выражения $\\frac{x^{-5} \\cdot x^{8}}{x}$ при $x=4$',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите значение выражения $b^{5} :b^{9} \\cdot b^{6}$ при $b=0,01$',
        correct: '0,0001', distractors: ['0,0002', '0,00005', '1,0001', '0,01', '0,00015'] },
    { question: 'Найдите значение выражения $( 4b )^{3} :b^{9} \\cdot b^{5}$ при $b=128$',
        correct: '0,5', distractors: ['1', '0,25', '1,5', '0,01', '0,75'] },
    { question: 'Найдите значение выражения $x \\cdot 3^{2x +1} \\cdot 9^{-x}$ при $x=5$',
        correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
    { question: 'Найдите значение выражения $6x \\cdot ( 3x^{12} )^{3} : ( 3x^{9} )^{4}$ при $x=75$',
        correct: '150', distractors: ['300', '75', '151', '149', '225'] },
    { question: 'Найдите значение выражения $( 2a^{3} )^{4} : ( 2a^{11} )$ при $a=11$',
        correct: '88', distractors: ['176', '44', '89', '87', '132'] },
    { question: 'Найдите значение выражения $b^{\\frac{1}{5}} \\cdot ( b^{\\frac{9}{10}} )^{2}$ при $b=7$',
        correct: '49', distractors: ['98', '24,5', '50', '48', '73,5'] },
    { question: 'Найдите значение выражения $\\frac{g ( x -9 )}{g ( x -11 )}$ если $g ( x ) =8^{x}$',
        correct: '64', distractors: ['128', '32', '65', '63', '96'] },
    { question: 'Найдите значение выражения $7^{2x -1} :49^{x} :x$ при $x= \\frac{1}{14}$',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'Найдите значение выражения $\\frac{a^{7,4}}{a^{8,4}}$ при $a=0,4$',
        correct: '2,5', distractors: ['5', '1,25', '3,5', '1,5', '3,75'] },
    { question: 'Найдите значение выражения $\\frac{\\sqrt[9]{a} \\sqrt[18]{a}}{a \\sqrt[6]{a}}$ при $a=1,25$',
        correct: '0,8', distractors: ['1,6', '0,4', '1,8', '0,01', '1,2'] },
    { question: 'Найдите значение выражения $\\frac{b^{3 \\sqrt{2} +2}}{( b^{\\sqrt{2}} )^{3}}$ при $b = 6$',
        correct: '36', distractors: ['72', '18', '37', '35', '54'] },
    { question: 'Найдите значение выражения $\\frac{( b^{\\sqrt{3}} )^{2 \\sqrt{3}}}{b^{4}}$ при $b=5$',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'Найдите значение выражения $\\frac{a^{3,21} \\cdot a^{7,36}}{a^{8,57}}$ при $a=12$',
        correct: '144', distractors: ['288', '72', '145', '143', '216'] },
    { question: 'Найдите значение выражения $\\frac{a^{3} b^{-2}}{( 2a )^{2} b^{-5}} \\cdot \\frac{18}{ab^{3}}$ при $a = \\sqrt{3} -1$, $b = \\frac{3}{17}$',
        correct: '4,5', distractors: ['9', '2,25', '5,5', '3,5', '6,75'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Действия со степенями');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Действия со степенями',
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
