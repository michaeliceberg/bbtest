// scripts/seedEGEPhysics-unit4-lesson2.ts
//
// Курс "ЕГЭ Физика" — Unit 4 "Гидростатика", урок 2
// (34 задачи с https://phys-ege.sdamgia.ru/test?theme=222:
// звуковые волны — длина волны, период, частота, скорость звука, эхо,
// разница скоростей звука в разных средах, диапазоны частот/длин волн).
//
// Дистракторы: где у sdamgia есть собственные варианты ответа (встроенный
// HTML-комментарий с вариантами) — взяты как есть плюс 1-2 дополнительных.
// Где официальных вариантов нет — подобраны индивидуально под физику
// конкретной задачи (см. /tmp/phys222_work), без единой фиксированной
// формулы вида correct*0.5/1.5/2.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 105; // "Гидростатика"

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { pid: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys222_work/challenges222.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 4 → Гидростатика → Урок 2');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Звуковые волны',
            unitId: UNIT_ID,
            order: 2,
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
                imageSrc: c.image ? `/geometry/phys222_${c.image}.svg` : '',
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
