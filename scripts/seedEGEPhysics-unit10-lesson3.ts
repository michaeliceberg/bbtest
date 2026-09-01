// scripts/seedEGEPhysics-unit10-lesson2.ts
//
// Курс "ЕГЭ Физика" — Unit 10 (id=111, "10. Установите соответствие"),
// новый урок 2 "Изменение величин, часть 2" (21 задача с
// https://phys-ege.sdamgia.ru/test?theme=287): формат "как изменится
// величина X" — используем существующий тип CONSTRUCT (см. lesson 1,
// scripts/seedEGEPhysics-unit10-lesson1.ts) — то же самое, что там уже
// применялось для задачи 43815 ("определите характер изменения"),
// просто теперь это ВЕСЬ урок, а не единичный случай: 2 группы на
// задачу (обычно 2 физические величины), 3 варианта в каждой
// (увеличивается/уменьшается/не изменяется — конкретная формулировка
// различается по задаче, берётся из легенды самой задачи).
//
// Данные собраны в /tmp/phys287_work/assembled.json (скрейпинг ->
// парсинг HTML -> сборка групп по официальному ответу sdamgia).
// 10 из 21 задачи с диаграммой — перерисованы в public/geometry/
// phys287_<image_id>.svg по сырым координатам оригинала (не на глаз):
// простые p-T/V-T линии-процессы через начало координат (изохоры/
// изобары), кривая давления насыщенного пара (с полным сохранением
// числовой сетки и подписей "p, кПа"/"T, K" — по прямой просьбе
// пользователя не обрезать оси/подписи/единицы), составная
// диаграмма из двух мини-графиков ①/② для сравнения работы/ΔU двух
// изохорных процессов с одинаковым ΔT (сверено по сырым координатам —
// физика ответа "не изменилась" для обеих величин верна только при
// точном совпадении ΔT между процессами) и одна схематичная
// иллюстрация (цилиндр с поршнем, жидкость/пар) — переиспользован
// стиль уже существующего phys389_43815.svg (тот же сценарий "поршень
// вниз").

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const COURSE_ID = 12;
const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 111; // "10. Установите соответствие" — уже существует

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type GroupOption = { text: string; correct: boolean };
type Group = { name: string; options: GroupOption[] };
type ChallengeSeed = { id: string; question: string; groups: Group[]; imageSrc: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys287_work/assembled.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 10 → Урок 2 (Изменение величин, часть 2)');

        const unit = await db.query.units.findFirst({ where: eq(schema.units.id, UNIT_ID) });
        if (!unit) throw new Error(`Unit ${UNIT_ID} не найден`);
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const existingLessons = await db.query.lessons.findMany({ where: eq(schema.lessons.unitId, UNIT_ID) });
        const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map((l) => l.order)) + 1 : 1;

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Изменение величин, часть 2',
            unitId: UNIT_ID,
            order: nextOrder,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" order=${nextOrder} (${challenges.length} задач)`);

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
