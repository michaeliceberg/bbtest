// scripts/seedEGEPhysics-unit10-lesson4.ts
//
// Курс "ЕГЭ Физика" — Unit 10 (id=111, "10. Установите соответствие"),
// новый урок 4 "Изменение величин, часть 3" (18 задач с
// https://phys-ege.sdamgia.ru/test?theme=290): тот же формат "как
// изменится величина X" (CONSTRUCT), что и lesson2/lesson3 этого юнита.
//
// Данные — /tmp/phys290_work/assembled.json. Парсер (scripts-уровня
// /tmp/phys290_work/parse2.py, аналог parse2.py из theme=287) доработан
// СРАЗУ с учётом двух багов, найденных при аудите lesson3 (theme=287):
// 1) регэксп обрезки хвостовой инструкции "Для каждой величины..."
//    учитывает оба варианта терминатора (точка ИЛИ двоеточие);
// 2) добавлена unicodedata.normalize('NFC', ...) — sdamgia иногда отдаёт
//    "й" в разложенном юникод-виде ("и" + отдельный U+0306 COMBINING
//    BREVE вместо precomposed U+0439) — без нормализации это молча
//    ломает regex-сопоставление литеральных русских слов (найдено на
//    задаче 48521 этой темы — "Для кажДОЙ" с разложенным "й" не совпадало
//    с паттерном обрезки, инструкция утекала в текст вопроса).
//
// 8 из 18 задач с диаграммой — перерисованы в public/geometry/
// phys290_<image_id>.svg по сырым координатам оригинала (не на глаз):
// простые p-T/V-T/U-p линии-процессы (изохоры/изобары через начало
// координат, изотерма, и один НЕ через начало координат — направление
// проверено численно через отношение V/T на обоих концах, должно расти
// или падать в сторону, требуемую ответом задачи, тот же метод, что
// поймал реальный баг в диаграмме 79355 урока lesson3), один полный
// 3-точечный цикл p-T (изохора-изотерма-изобара), одна схема
// цилиндр+поршень+газ (без пара/жидкости — свежий, не переиспользованный
// вариант). 1 задача (27981) переиспользует уже существующий
// phys287_100026.svg — тот же самый оригинальный image_id, что и в
// lesson3 (theme=287, задача 43312) — не перерисован заново.
//
// Задача 11269 — условие с 6 вхождениями <sub> (p_1, V_1, T_1 дважды,
// T_2 дважды) переведено в LaTeX вручную (MANUAL_CONDITION_FIXES в
// assemble.py) — та же причина, что и у задачи 7787 в theme=287
// (тег-стриппер конвертирует </sub> в пробел, "T_1" превращается в
// нечитаемое "T 1").

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 111; // "10. Установите соответствие" — уже существует

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type GroupOption = { text: string; correct: boolean };
type Group = { name: string; options: GroupOption[] };
type ChallengeSeed = { id: string; question: string; groups: Group[]; imageSrc: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys290_work/assembled.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 10 → Урок 4 (Изменение величин, часть 3)');

        const unit = await db.query.units.findFirst({ where: eq(schema.units.id, UNIT_ID) });
        if (!unit) throw new Error(`Unit ${UNIT_ID} не найден`);
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const existingLessons = await db.query.lessons.findMany({ where: eq(schema.lessons.unitId, UNIT_ID) });
        const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map((l) => l.order)) + 1 : 1;

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Изменение величин, часть 3',
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
