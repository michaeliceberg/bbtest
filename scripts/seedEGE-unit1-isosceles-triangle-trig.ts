// scripts/seedEGE-unit1-isosceles-triangle-trig.ts
//
// Unit 1 курса "ЕГЭ Математика Профиль" — равнобедренный
// треугольник: сторона по синусу/косинусу угла при основании,
// 51 задача с
// https://math-ege.sdamgia.ru/test?theme=90, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const UNIT_ID = 92;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'В треугольнике $ABC$ $AB = 30$, $\\sin A = 0,8$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'В треугольнике $ABC$ $AB = 6$, $\\sin A = 0,8$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'В треугольнике $ABC$ $AB = 14$, $\\sin A = 0,96$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'В треугольнике $ABC$ $AB = 32$, $\\sin A = 0,6$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AB = 2\\sqrt{91}$, $\\sin A = 0,3$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'В треугольнике $ABC$ $AB = 8\\sqrt{3}$, $\\sin A = 0,5$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'В треугольнике $ABC$ $AB = 4\\sqrt{6}$, $\\sin A = 0,2$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'В треугольнике $ABC$ $AB = 2\\sqrt{15}$, $\\sin A = 0,25$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 25$, $\\sin B = \\dfrac{3\\sqrt{11}}{10}$. Найдите $AB$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 25$, $\\sin B = \\dfrac{3}{5}$. Найдите $AB$.',
        correct: '40', distractors: ['80', '20', '41', '39', '60'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 10$, $\\sin B = \\dfrac{3}{5}$. Найдите $AB$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 15$, $\\sin B = \\dfrac{\\sqrt{91}}{10}$. Найдите $AB$.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'В треугольнике $ABC$ $AB = 10$, $\\sin A = \\dfrac{2\\sqrt{6}}{5}$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '25', distractors: ['50', '12,5', '26', '24', '37,5'] },
    { question: 'В треугольнике $ABC$ $AB = 3,6$, $\\sin A = \\dfrac{\\sqrt{91}}{10}$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'В треугольнике $ABC$ $AB = 1,2$, $\\sin A = \\dfrac{3\\sqrt{11}}{10}$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'В треугольнике $ABC$ $AB = 4,8$, $\\sin A = \\dfrac{\\sqrt{21}}{5}$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'В треугольнике $ABC$ $AB = 9,6$, $\\sin A = \\dfrac{7}{25}$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '5', distractors: ['10', '2,5', '6', '4', '7,5'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 8$, $\\cos A = 0,5$. Найдите $AB$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'В треугольнике $ABC$ $AB = 8$, $\\cos A = 0,5$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 5$, $\\cos A = 0,2$. Найдите $AB$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 14$, $\\cos A = 0,5$. Найдите $AB$.',
        correct: '14', distractors: ['28', '7', '15', '13', '21'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 8$, $\\cos A = 0,25$. Найдите $AB$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 20$, $\\cos A = 0,25$. Найдите $AB$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 6$, $\\cos A = 0,5$. Найдите $AB$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 5$, $\\cos A = 0,4$. Найдите $AB$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 10$, $\\cos A = 0,2$. Найдите $AB$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 18$, $\\cos A = 0,5$. Найдите $AB$.',
        correct: '18', distractors: ['36', '9', '19', '17', '27'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 20$, $\\cos A = 0,5$. Найдите $AB$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 20$, $\\cos A = 0,4$. Найдите $AB$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 2$, $\\cos A = 0,5$. Найдите $AB$.',
        correct: '2', distractors: ['4', '1', '3', '5', '6'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 20$, $\\cos A = 0,3$. Найдите $AB$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 10$, $\\cos A = 0,4$. Найдите $AB$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 5$, $\\cos A = 0,6$. Найдите $AB$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 20$, $\\cos A = 0,2$. Найдите $AB$.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'В треугольнике $ABC$ $AB = 32$, $\\cos A = 0,8$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AB = 6$, $\\cos A = 0,25$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'В треугольнике $ABC$ $AB = 28$, $\\cos A = 0,7$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AB = 18$, $\\cos A = 0,6$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
    { question: 'В треугольнике $ABC$ $AB = 12$, $\\cos A = 0,6$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'В треугольнике $ABC$ $AB = 6$, $\\cos A = 0,2$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
    { question: 'В треугольнике $ABC$ $AB = 10$, $\\cos A = 0,5$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'В треугольнике $ABC$ $AB = 6$, $\\cos A = 0,75$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ $AB = 24$, $\\cos A = 0,6$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AB = 2$, $\\cos A = 0,25$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ $AB = 24$, $\\cos A = 0,75$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'В треугольнике $ABC$ $AB = 16$, $\\cos A = 0,8$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '10', distractors: ['20', '5', '11', '9', '15'] },
    { question: 'В треугольнике $ABC$ $AB = 36$, $\\cos A = 0,9$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AB = 16$, $\\cos A = 0,5$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'В треугольнике $ABC$ $AB = 30$, $\\cos A = 0,75$. Найдите $AC$, если известно, что $AC = BC$.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 5$, $\\cos A = \\dfrac{3}{5}$. Найдите $AB$.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'В треугольнике $ABC$ $AC = BC = 5$, $\\sin A = \\dfrac{4}{5}$. Найдите $AB$.',
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Равнобедренный треугольник: сторона по тригонометрии угла');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Равнобедренный треугольник: сторона по синусу/косинусу угла',
            unitId: UNIT_ID,
            order: 6,
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
