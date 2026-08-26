// scripts/seedEGEPhysics-unit6-lesson2.ts
//
// Курс "ЕГЭ Физика" — Unit 6 (id=107, "Механика: качественные задачи"),
// урок 2 (51 задача с https://phys-ege.sdamgia.ru/test?theme=285: тот же
// формат "для каждой величины определите характер изменения", что и в
// уроке 1 — тип задания CONSTRUCT, см. app/lesson/character-change.tsx.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 107;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type OptionSeed = { text: string; correct: boolean };
type ChallengeSeed = { id: string; question: string; options: OptionSeed[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys285_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 6 → Урок 2 (характер изменения величин, часть 2)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Определите характер изменения — 2',
            unitId: UNIT_ID,
            order: 2,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" (${challenges.length})`);

        for (let i = 0; i < challenges.length; i++) {
            const c = challenges[i];
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: lesson.id,
                type: 'CONSTRUCT',
                question: c.question,
                order: i + 1,
                points: 10,
                author: AUTHOR,
                difficulty: '',
                imageSrc: c.image ?? '',
            }).returning();

            const options = shuffle(c.options);

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
