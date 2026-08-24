// scripts/seedEGEPhysics-unit2-lesson1.ts
//
// Курс "ЕГЭ Физика" — Unit 2 "Динамика", урок 1
// (33 задачи с https://phys-ege.sdamgia.ru/test?theme=208:
// второй закон Ньютона, F=ma).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_TITLE = 'ЕГЭ Физика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys204_work/challenges208.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 2 → Динамика → Урок 1');

        const course = await db.query.courses.findFirst({ where: eq(schema.courses.title, COURSE_TITLE) });
        if (!course) throw new Error('Курс "ЕГЭ Физика" не найден');

        let unit = await db.query.units.findFirst({ where: eq(schema.units.title, 'Динамика') });
        if (!unit) {
            [unit] = await db.insert(schema.units).values({
                title: 'Динамика',
                description: 'Законы Ньютона, силы, вес, наклонная плоскость, пружины',
                courseId: course.id,
                order: 2,
                imageSrc: 'LottieUnit2',
            }).returning();
            console.log(`unit: ${unit.id} "${unit.title}"`);
        } else {
            console.log(`unit exists: ${unit.id}`);
        }

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Второй закон Ньютона',
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
