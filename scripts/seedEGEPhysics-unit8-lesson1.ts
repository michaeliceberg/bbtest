// scripts/seedEGEPhysics-unit8-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 8 «Работа, количество теплоты, внутренняя
// энергия» (theme=397 на sdamgia, 39 задач: первое начало термодинамики,
// внутренняя энергия идеального газа, работа газа как площадь под графиком
// в координатах p-V, качественные задачи на pT/pV циклах). Урок 1
// (единственный в юните на данный момент). Тип ASSIST, по 5 дистракторов
// на задачу (6 вариантов ответа), подобраны индивидуально под физику
// каждой задачи (см. /tmp/phys397_work/distractors397.json).
//
// 26 из 39 задач имеют диаграмму (pV/pT графики циклов и процессов,
// графики нагревания/плавления) — перерисованы по методологии проекта,
// см. /tmp/phys397_work/render397.py.

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
    readFileSync('/tmp/phys397_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 8 → Работа, количество теплоты, внутренняя энергия');

        const [unit] = await db.insert(schema.units).values({
            title: 'Работа, количество теплоты, внутренняя энергия',
            description: 'Первое начало термодинамики: внутренняя энергия идеального газа, работа газа, теплопередача',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 8,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Первое начало термодинамики',
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
