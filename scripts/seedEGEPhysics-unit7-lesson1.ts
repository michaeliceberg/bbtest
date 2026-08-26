// scripts/seedEGEPhysics-unit7-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 7 "Основное уравнение МКТ", урок 1
// (94 задачи с https://phys-ege.sdamgia.ru/test?theme=381). В отличие от
// Unit 6 (характер изменения — CONSTRUCT), здесь каждая задача требует
// ОДНОГО числового ответа (во сколько раз/чему равно/какова температура и
// т.п.) без готовых вариантов от sdamgia — обычный тип ASSIST, как в
// Unit 1-4. Дистракторы подобраны индивидуально под физику каждой задачи
// (см. /tmp/phys381_work/build_distractors.js): забытый второй множитель,
// перепутанное направление отношения (обратная величина), деление вместо
// умножения, забытый квадрат/корень в v_rms-соотношениях и т.п. — без
// единой формулы на все задачи.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_ID = 12;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { id: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys381_work/seed_content.json', 'utf-8')
);

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
        console.log('Seeding: ЕГЭ Физика → Unit 7 → Основное уравнение МКТ → Урок 1');

        const [unit] = await db.insert(schema.units).values({
            title: 'Основное уравнение МКТ',
            description: 'Молекулярно-кинетическая теория газов: давление, температура, концентрация',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 7,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Давление, температура, концентрация',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" (${challenges.length})`);

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
                imageSrc: c.image ?? '',
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
                    imageSrc: '',
                    audioSrc: '',
                }))
            );
        }

        console.log('done:', challenges.length, 'challenges');
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await queryClient.end();
    }
};

main();
