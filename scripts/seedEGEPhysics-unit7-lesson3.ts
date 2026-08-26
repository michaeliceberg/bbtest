// scripts/seedEGEPhysics-unit7-lesson3.ts
//
// Курс "ЕГЭ Физика" — Unit 7 (id=108, "Основное уравнение МКТ"), урок 3
// (28 задач с https://phys-ege.sdamgia.ru/test?theme=393: изопроцессы
// идеального газа, pV/pT/Vρ-диаграммы состояний). Тип ASSIST — один
// числовой ответ. По 5 дистракторов на задачу (6 вариантов ответа всего),
// подобраны индивидуально под физику каждой задачи (см.
// /tmp/phys393_work/distractors393.json).
//
// 8 задач имеют диаграмму состояния газа (перерисованы по методологии
// проекта, см. /tmp/phys393_work/render393.py), 5 задач — таблицу
// параметров состояний A/B (перерисована как SVG, см.
// /tmp/phys393_work/render_tables.py).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 108;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { id: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys393_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 7 → Основное уравнение МКТ → Урок 3');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Изопроцессы идеального газа',
            unitId: UNIT_ID,
            order: 3,
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
