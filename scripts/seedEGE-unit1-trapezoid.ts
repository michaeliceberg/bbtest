// scripts/seedEGE-unit1-trapezoid.ts
//
// Четвёртый урок Unit 1 курса "ЕГЭ Математика Профиль" (unit id=92) —
// равнобедренная трапеция, 5 задач с
// https://math-ege.sdamgia.ru/test?theme=94. Все задачи используют одну
// и ту же картинку (общий чертёж трапеции ABCD с высотой CE).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const UNIT_ID = 92;
const AUTHOR = 'ЕГЭ Математика Профиль';
const IMAGE = '/geometry/244864.svg';

type ChallengeSeed = {
    question: string;
    correct: string;
    distractors: string[];
};

const challenges: ChallengeSeed[] = [
    { question: 'Основания равнобедренной трапеции равны 51 и 65. Боковые стороны равны 25. Найдите синус острого угла трапеции.',
        correct: '0,96', distractors: ['0,28', '1,2', '0,48', '0,86', '1,04'] },
    { question: 'Основания равнобедренной трапеции равны 43 и 73. Косинус острого угла трапеции равен $\\frac{5}{7}$. Найдите боковую сторону.',
        correct: '21', distractors: ['14', '35', '28', '17,5', '24'] },
    { question: 'Большее основание равнобедренной трапеции равно 34. Боковая сторона равна 14. Синус острого угла равен $\\frac{2\\sqrt{10}}{7}$. Найдите меньшее основание.',
        correct: '22', distractors: ['34', '12', '27', '20', '44'] },
    { question: 'Основания равнобедренной трапеции равны 7 и 51. Тангенс острого угла равен $\\frac{5}{11}$. Найдите высоту трапеции.',
        correct: '10', distractors: ['22', '5', '15', '8', '12'] },
    { question: 'Меньшее основание равнобедренной трапеции равно 23. Высота трапеции равна 39. Тангенс острого угла равен $\\frac{13}{8}$. Найдите большее основание.',
        correct: '71', distractors: ['23', '62', '48', '84', '55'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Равнобедренная трапеция (5 задач)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Равнобедренная трапеция',
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
                imageSrc: IMAGE,
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
