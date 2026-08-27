// scripts/seedEGEPhysics-unit8-lesson3.ts
//
// Курс "ЕГЭ Физика" — Unit 8 (id=109, "Работа, количество теплоты,
// внутренняя энергия"), урок 3 (theme=237 на sdamgia, 49 задач: КПД
// тепловых машин, цикл Карно, максимально возможный КПД). Тип ASSIST.
// По 5 дистракторов на задачу (6 вариантов) — кроме 21 задачи с
// официальными вариантами sdamgia ("Тип 2", очень частый формат для этой
// темы), у них берём варианты как есть (4 штуки).
//
// 2 задачи (3616, 3617) содержат таблицу зависимости КПД от температуры
// нагревателя — переведена в SVG-картинку (см.
// /tmp/phys237_work/render_tables.py), как обычная иллюстрация.
// Остальные 47 задач без картинок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 109;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { id: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys237_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 8 → Урок 3 (КПД тепловых машин)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'КПД тепловых машин',
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
