// scripts/seedEGE-unit7-letter-logarithm-expressions.ts
//
// Unit 7 курса "ЕГЭ Математика Профиль" — преобразования буквенных
// логарифмических выражений, 3 задачи с
// https://math-ege.sdamgia.ru/test?theme=63, один урок.

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
    { question: 'Найдите значение выражения $\\log_a (ab^{3})$, если $\\log_b a = \\frac{1}{7}$.',
        correct: '22', distractors: ['44', '11', '23', '21', '33'] },
    { question: 'Найдите $\\log_a \\frac{a}{b^{3}}$, если $\\log_a b = 5$.',
        correct: '-14', distractors: ['-28', '-7', '-13', '-15', '14'] },
    { question: 'Найдите $\\log_a (a^{2} b^{3})$, если $\\log_a b = -2$.',
        correct: '-4', distractors: ['-8', '-2', '-3', '-5', '4'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 7 → Буквенные логарифмические выражения');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Буквенные логарифмические выражения',
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
