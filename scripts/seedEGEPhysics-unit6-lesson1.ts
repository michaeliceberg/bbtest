// scripts/seedEGEPhysics-unit6-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 6, урок 1
// (66 задач с https://phys-ege.sdamgia.ru/test?theme=281: формат
// "для каждой величины определите характер изменения" — новый тип
// задания CONSTRUCT (см. app/lesson/character-change.tsx). 64 обычных
// задачи (2 величины × увеличится/уменьшится/не изменится) + 2 задачи
// подтипа "график → величина" (46115, 51015), закодированные тем же
// механизмом с группами "График А"/"График Б".

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_ID = 12;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type OptionSeed = { text: string; correct: boolean };
type ChallengeSeed = { id: string; question: string; options: OptionSeed[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys281_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 6 → Урок 1 (характер изменения величин)');

        const [unit] = await db.insert(schema.units).values({
            title: 'Механика: качественные задачи',
            description: 'Определите характер изменения физических величин',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 6,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Определите характер изменения',
            unitId: unit.id,
            order: 1,
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

            // Порядок групп важен для UI не критичен (character-change.tsx
            // сам группирует по имени величины), но перемешивание внутри
            // группы (Увеличится/Уменьшится/Не изменится) допустимо —
            // компонент сам приводит их к канону при показе.
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
