// scripts/seedEGEPhysics-unit3-lesson4.ts
//
// Курс "ЕГЭ Физика" — Unit 3 "Работа и энергия", урок 4
// (50 задач с https://phys-ege.sdamgia.ru/test?theme=216:
// изменение импульса под действием силы (F*t), реактивное движение и
// отдача (выстрел из пушки/ружья, прыжок с тележки/саней), абсолютно
// неупругие столкновения (в т.ч. под углом, разлёт осколков),
// упругое рассеяние под 90°, импульс системы по векторным диаграммам).
//
// Дистракторы: где у sdamgia есть собственные варианты ответа (встроенный
// HTML-комментарий с вариантами) — взяты как есть плюс 1-2 дополнительных.
// Где официальных вариантов нет — подобраны индивидуально под физику
// конкретной задачи (см. /tmp/phys216_work), без единой фиксированной
// формулы вида correct*0.5/1.5/2.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 104; // "Работа и энергия"

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { pid: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys216_work/challenges216.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 3 → Работа и энергия → Урок 4');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Изменение импульса и реактивное движение',
            unitId: UNIT_ID,
            order: 4,
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
                imageSrc: c.image ? `/geometry/phys216_${c.image}.svg` : '',
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
