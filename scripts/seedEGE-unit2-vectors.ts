// scripts/seedEGE-unit2-vectors.ts
//
// Unit 2 курса "ЕГЭ Математика Профиль" — новый юнит "Векторы",
// 58 задач с https://math-ege.sdamgia.ru/test?theme=182,
// разбитые на 2 урока по смыслу.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const COURSE_ID = 11;
const UNIT_ORDER = 2;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[] };
type LessonSeed = { title: string; order: number; challenges: ChallengeSeed[] };

const lessons: LessonSeed[] = [
    {
        title: 'Длина и квадрат длины вектора по координатам',
        order: 1,
        challenges: [
            { question: 'Найдите длину вектора $\\vec a (6; 8)$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Найдите длину вектора $\\vec a (-10; 24)$.', correct: '26', distractors: ['52', '13', '27', '25', '39'] },
            { question: 'Найдите длину вектора $\\vec a (-24; 10)$.', correct: '26', distractors: ['52', '13', '27', '25', '39'] },
            { question: 'Найдите длину вектора $\\vec a (-3; 4)$.', correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
            { question: 'Найдите длину вектора $\\vec a (-15; 8)$.', correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
            { question: 'Найдите длину вектора $\\vec a (8; -6)$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Найдите длину вектора $\\vec a (5; 12)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (-4; 3)$.', correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
            { question: 'Найдите длину вектора $\\vec a (15; 8)$.', correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
            { question: 'Найдите длину вектора $\\vec a (-5; -12)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (-4; -3)$.', correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
            { question: 'Найдите длину вектора $\\vec a (5; -12)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (7; -24)$.', correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
            { question: 'Найдите длину вектора $\\vec a (-8; 6)$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Найдите длину вектора $\\vec a (-9; 12)$.', correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
            { question: 'Найдите длину вектора $\\vec a (8; -15)$.', correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
            { question: 'Найдите длину вектора $\\vec a (-15; -8)$.', correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
            { question: 'Найдите длину вектора $\\vec a (-12; 5)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (-24; 7)$.', correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
            { question: 'Найдите длину вектора $\\vec a (6; -8)$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Найдите длину вектора $\\vec a (-5; 12)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (-8; -6)$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Найдите длину вектора $\\vec a (-12; -5)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (-12; -9)$.', correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
            { question: 'Найдите длину вектора $\\vec a (12; -5)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (-8; -15)$.', correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
            { question: 'Найдите длину вектора $\\vec a (3; 4)$.', correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
            { question: 'Найдите длину вектора $\\vec a (15; -8)$.', correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
            { question: 'Найдите длину вектора $\\vec a (12; 5)$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Найдите длину вектора $\\vec a (4; 3)$.', correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
            { question: 'Даны точки $A(2; 4)$ и $B(8; 6)$. Найдите квадрат длины вектора $\\overrightarrow{AB}$.', correct: '40', distractors: ['80', '20', '41', '39', '60'] },
            { question: 'Даны точки $A(2; 2)$ и $B(3; 5)$. Найдите квадрат длины вектора $\\overrightarrow{AB}$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Даны векторы $\\vec a (-3; 1)$ и $\\vec b (3; 2)$. Найдите квадрат длины вектора $\\vec a + \\vec b$.', correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
            { question: 'Даны векторы $\\vec a (-4; 2)$ и $\\vec b (1; 5)$. Найдите квадрат длины вектора $\\vec a + \\vec b$.', correct: '58', distractors: ['116', '29', '59', '57', '87'] },
        ],
    },
    {
        title: 'Векторы в прямоугольнике: диагональ, сумма и разность',
        order: 2,
        challenges: [
            { question: 'Две стороны прямоугольника $ABCD$ равны 6 и 8. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 15 и 20. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 12 и 5. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 40 и 9. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '41', distractors: ['82', '20,5', '42', '40', '61,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 24 и 7. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 36 и 27. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '45', distractors: ['90', '22,5', '46', '44', '67,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 24 и 45. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '51', distractors: ['102', '25,5', '52', '50', '76,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 30 и 16. Найдите длину вектора $\\overrightarrow{AC}$.', correct: '34', distractors: ['68', '17', '35', '33', '51'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 6 и 8. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 14 и 48. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '50', distractors: ['100', '25', '51', '49', '75'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 16 и 12. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '20', distractors: ['40', '10', '21', '19', '30'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 21 и 28. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '35', distractors: ['70', '17,5', '36', '34', '52,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 12 и 5. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 96 и 28. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '100', distractors: ['200', '50', '101', '99', '150'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 9 и 40. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '41', distractors: ['82', '20,5', '42', '40', '61,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 20 и 21. Найдите длину суммы векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '29', distractors: ['58', '14,5', '30', '28', '43,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 6 и 8. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '10', distractors: ['20', '5', '11', '9', '15'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 20 и 15. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 12 и 5. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 24 и 7. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 12 и 16. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '20', distractors: ['40', '10', '21', '19', '30'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 40 и 9. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '41', distractors: ['82', '20,5', '42', '40', '61,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 21 и 72. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '75', distractors: ['150', '37,5', '76', '74', '112,5'] },
            { question: 'Две стороны прямоугольника $ABCD$ равны 96 и 28. Найдите длину разности векторов $\\overrightarrow{AB}$ и $\\overrightarrow{AD}$.', correct: '100', distractors: ['200', '50', '101', '99', '150'] },
        ],
    },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 2 → Векторы');

        const [unit] = await db.insert(schema.units).values({
            title: 'Векторы',
            description: 'Длина вектора, квадрат длины, векторы в прямоугольнике',
            courseId: COURSE_ID,
            order: UNIT_ORDER,
            imageSrc: 'LottieUnit2',
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        for (const lessonSeed of lessons) {
            const [lesson] = await db.insert(schema.lessons).values({
                title: lessonSeed.title,
                unitId: unit.id,
                order: lessonSeed.order,
            }).returning();
            console.log(`  lesson: ${lesson.id} "${lesson.title}"`);

            for (let i = 0; i < lessonSeed.challenges.length; i++) {
                const c = lessonSeed.challenges[i];
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

                console.log(`    [${i + 1}/${lessonSeed.challenges.length}] challenge ${challenge.id} — "${c.correct}"`);
            }
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
