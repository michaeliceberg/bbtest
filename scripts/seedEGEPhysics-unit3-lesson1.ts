// scripts/seedEGEPhysics-unit3-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 3 "Работа и энергия", урок 1
// (90 задач с https://phys-ege.sdamgia.ru/test?theme=217:
// кинетическая/потенциальная энергия, работа, закон сохранения энергии).
//
// Дистракторы: где у sdamgia есть собственные варианты ответа (встроенный
// HTML-комментарий с вариантами) — взяты как есть. Где их нет — сгенерированы
// по физике конкретной задачи (см. /tmp/phys217_work), без единой фиксированной
// формулы вида correct*0.5/1.5/2 (это была отдельная известная проблема в
// остальном курсе).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_ID = 12;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { pid: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys204_work/challenges217.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 3 → Работа и энергия → Урок 1');

        const [unit] = await db.insert(schema.units).values({
            title: 'Работа и энергия',
            description: 'Кинетическая и потенциальная энергия, работа силы, закон сохранения энергии',
            imageSrc: 'LottieUnit3',
            courseId: COURSE_ID,
            order: 3,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Работа. Мощность. Энергия',
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
