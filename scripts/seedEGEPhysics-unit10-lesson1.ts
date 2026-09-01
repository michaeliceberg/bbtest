// scripts/seedEGEPhysics-unit10-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 10, урок 1 (73 задачи с
// https://phys-ege.sdamgia.ru/test?theme=389): формат "Установите
// соответствие" (matching А/Б -> 1/2/3/4/5) — используем существующий
// тип CONSTRUCT (app/lesson/character-change.tsx), изначально сделанный
// под "определите характер изменения", но достаточно общий: группа
// (challengeOptions.text = "name::optionText") + один correct вариант на
// группу. 25 задач с общей диаграммой (imageSrc, точки/участки
// пронумерованы на картинке, группы — текстовые описания процессов/
// участков), 17 задач с ДВУМЯ мини-графиками А)/Б) для сопоставления с
// утверждениями (imageSrc — композитная картинка с обоими графиками
// рядом, подписанными А/Б; группы — просто "График А"/"График Б"), 30
// чисто текстовых/формульных задач без картинки, плюс 1 задача типа
// "определите характер изменения" (43815, увеличится/уменьшится/не
// изменится).
//
// Данные собраны и провалидированы в /tmp/phys389_work/assembled.json
// (скрейпинг -> парсинг HTML -> конвертация формул в LaTeX -> сборка
// групп/вариантов по официальному ответу sdamgia, посимвольно/по '&').
// Диаграммы перерисованы в public/geometry/phys389_*.svg — реальные
// координаты линий извлечены из оригинальных SVG (chain_lines по
// stroke=#CC761F), не нарисованы на глаз.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const COURSE_ID = 12;
const AUTHOR = 'ЕГЭ Физика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type GroupOption = { text: string; correct: boolean };
type Group = { name: string; options: GroupOption[] };
type ChallengeSeed = { id: string; question: string; groups: Group[]; imageSrc: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys389_work/assembled.json', 'utf-8')
);

// Особый случай 43815 — "определите характер изменения" (увеличится/
// уменьшится/не изменится), а не matching-таблица. Добавлен вручную,
// т.к. его исходная разметка (обычная <table>, не wrap_flex_table)
// не проходит общий парсер.
const CHANGE_CHALLENGE = {
    id: '43815',
    question: 'В цилиндре под поршнем долгое время находится жидкость и её насыщенный пар. Как изменятся давление и концентрация молекул пара при медленном перемещении поршня вниз, если температура останется неизменной? В процессе движения поршень не касается поверхности жидкости.',
    imageSrc: 'phys389_43815',
    groups: [
        { name: 'Давление пара', options: [
            { text: 'Увеличится', correct: false },
            { text: 'Уменьшится', correct: false },
            { text: 'Не изменится', correct: true },
        ]},
        { name: 'Концентрация молекул пара', options: [
            { text: 'Увеличится', correct: false },
            { text: 'Уменьшится', correct: false },
            { text: 'Не изменится', correct: true },
        ]},
    ],
};

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
        console.log('Seeding: ЕГЭ Физика → Unit 10 → Урок 1 (Установите соответствие)');

        const [unit] = await db.insert(schema.units).values({
            title: '10. Установите соответствие',
            description: 'Сопоставьте графики, процессы и физические величины — задачи на соответствие',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 10,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Установите соответствие',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}"`);

        const allSeeds = [...challenges, CHANGE_CHALLENGE];
        let order = 1;
        for (const seed of allSeeds) {
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
            console.log(`  [${order - 1}/${allSeeds.length}] challenge ${challenge.id} (sdamgia id=${seed.id}), groups=${seed.groups.length}`);
        }

        console.log('\nГотово!');
    } catch (error) {
        console.error('Ошибка сидинга:', error);
    } finally {
        await queryClient.end();
    }
};

main();
