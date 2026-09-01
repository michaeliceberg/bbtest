// scripts/seedEGEPhysics-unit10-lesson2.ts
//
// Курс "ЕГЭ Физика" — Unit 10 (id=111, уже существует), новый урок 2
// "Изменение величин, часть 1" (45 задач с
// https://phys-ege.sdamgia.ru/test?theme=282): формат "как изменяются
// X и Y" (увеличивается/уменьшается/не изменяется) — тот же тип CONSTRUCT,
// что и 43815 в уроке 1, только теперь это ОСНОВНОЙ формат урока, а не
// единичный особый случай. 8 задач с диаграммой процесса (imageSrc,
// перерисованы по реальным координатам линий из оригиналов — <line>/
// <polyline>/безье-<path>, с учётом обоих оттенков "оранжевого" у
// sdamgia #CC761F/#CB7629), 3 задачи с аппаратной иллюстрацией (цилиндр
// с поршнем, одна — с шариком), 34 чисто текстовые.
//
// Групповые названия величин у части задач восстановлены вручную из
// текста вопроса (см. MANUAL_HEADERS в /tmp/phys282_work/assemble.py) —
// в оригинальной HTML-таблице заголовок был пустой ячейкой (только
// узкий неразрывный пробел), сама формулировка величин есть только в
// предложении "Как изменились/изменяются X и Y?".

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 111;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type GroupOption = { text: string; correct: boolean };
type Group = { name: string; options: GroupOption[] };
type ChallengeSeed = { id: string; question: string; groups: Group[]; imageSrc: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys282_work/assembled.json', 'utf-8')
);

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const REUSE_LESSON_ID = 351;

const main = async () => {
    try {
        console.log('Seeding: ЕГЭ Физика → Unit 10 → Урок 2 (Изменение величин, часть 1)');

        const [unit] = await db.select().from(schema.units).where(eq(schema.units.id, UNIT_ID));
        console.log(`unit: ${unit.id} "${unit.title}"`);

        let lesson: typeof schema.lessons.$inferSelect;
        if (REUSE_LESSON_ID) {
            [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, REUSE_LESSON_ID));
            console.log(`переиспользуем lesson: ${lesson.id} "${lesson.title}"`);
            const deleted = await db.delete(schema.challenges).where(eq(schema.challenges.lessonId, lesson.id)).returning();
            console.log(`удалено старых challenges: ${deleted.length}`);
        } else {
            [lesson] = await db.insert(schema.lessons).values({
                title: 'Изменение величин, часть 1',
                unitId: unit.id,
                order: 2,
            }).returning();
            console.log(`lesson: ${lesson.id} "${lesson.title}"`);
        }

        let order = 1;
        for (const seed of challenges) {
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: lesson.id,
                type: 'CONSTRUCT',
                question: seed.question,
                order: order++,
                imageSrc: seed.imageSrc ? `/geometry/${seed.imageSrc}.svg` : '',
                points: 10,
                author: AUTHOR,
                difficulty: '',
            }).returning();

            for (const group of seed.groups) {
                const shuffledOpts = shuffle(group.options);
                for (const opt of shuffledOpts) {
                    await db.insert(schema.challengeOptions).values({
                        challengeId: challenge.id,
                        text: `${group.name}::${opt.text}`,
                        correct: opt.correct,
                    });
                }
            }
            console.log(`  [${order - 1}/${challenges.length}] challenge ${challenge.id} (sdamgia id=${seed.id}), groups=${seed.groups.length}`);
        }

        console.log('\nГотово!');
    } catch (error) {
        console.error('Ошибка сидинга:', error);
    } finally {
        await queryClient.end();
    }
};

main();
