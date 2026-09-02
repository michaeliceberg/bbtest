// scripts/seedEGEPhysics-unit11-lesson3.ts
//
// Курс "ЕГЭ Физика" (courseId=12) — существующий Unit 11 (id=112, order=11,
// "11. Закон Кулона, закон сохранения заряда" — фактически уже содержит и
// электростатику, и электродинамику: lesson 1 "Закон Кулона..." (theme=386),
// lesson 2 "Сила тока, закон Ома" (theme=241)), новый lesson 3 "Расчёт
// электрических цепей" (theme=242 на sdamgia, 59 задач в листинге —
// смешанное последовательно-параллельное соединение резисторов, закон Ома
// для участка/полной цепи, схемы с амперметром/вольтметром/реостатом).
//
// 54 из 59 включены. Пропущено 5:
// - 4 по прямой инструкции пользователя (задачи-позиции в листинге 52,
//   56, 57, 59 — id 1414, 1410, 1409, 1404 — "сложный рисунок, пропускай").
// - id=25368 (позиция 13) — solution sdamgia у этой задачи нумерует
//   резисторы 2..8 (7 штук), хотя в условии заявлено "5 одинаковых
//   резисторов" — внутреннее противоречие в самом источнике (не в
//   скрапинге), топология не восстанавливается однозначно ни из текста
//   решения, ни из превью картинки при разумных усилиях — пропущена как
//   тот же класс "слишком сложный/неоднозначный рисунок, чтобы рисовать
//   на глаз", что и явно запрошенные пропуски выше.
//
// Тип ASSIST. 2 задачи (6491, 5470) — официальные варианты sdamgia (4
// варианта как есть). Остальные 52 — 5 индивидуально подобранных
// дистракторов на задачу (6 вариантов) — сгенерированы варьируемым
// набором физически мотивированных стратегий (×2, ÷2, ×3, ÷3, ±1,
// параллель-как-последовательное и т.п., см. /tmp/phys242_work/
// distractors.py), а НЕ одной формулой на все задачи — та же явная
// анти-паттерн-инструкция проекта, что и раньше (CLAUDE.md, старый баг
// "241 из ~300 задач по формуле correct±1").
//
// 51 из 54 задач — с диаграммой, ВСЕ перерисованы (не на глаз) по
// топологии, реконструированной из сырых координат/цветов оригинала
// (простые последовательно-параллельные сети) либо — там, где
// топология визуально неоднозначна на превью (мелкий текст, наложение
// проводов) — из явного текста официального решения sdamgia (какие
// резисторы последовательны/параллельны, какая ветвь короче), см.
// /tmp/phys242_work/build_*.py. Каждая схема арифметически проверена
// против доверенного ответа (см. общее правило проекта — ответ из
// sdamgia берётся как есть, физика используется только для ПРОВЕРКИ
// согласованности собственной перерисовки, не для его пересчёта).
// 4 задачи из "фотографического" стиля оригинала (аналоговые стрелочные
// приборы) перерисованы с ЦИФРОВЫМИ показаниями приборов (числа читаются
// по игле циферблата/по показаниям соседних задач с той же базовой
// схемой, а не гадаются на глаз) — та же база (батарея, ключ, реостат
// 0–6 Ом, резисторы 1/2/3 Ом), переиспользована 4 раза с разным набором
// видимых приборов, как и в оригинале sdamgia.
//
// Данные — /tmp/phys242_work/final_seed_data.json.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 112;
const LESSON_ORDER = 3;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ProblemSeed = {
    id: string;
    question: string;
    answer: string;
    official_options: string[] | null;
    distractors: string[] | null;
    image: string | null;
};

const problems: ProblemSeed[] = JSON.parse(
    readFileSync('/tmp/phys242_work/final_seed_data.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 11 → Урок 3 (Расчёт электрических цепей)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Расчёт электрических цепей',
            unitId: UNIT_ID,
            order: LESSON_ORDER,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}"`);

        let order = 1;
        for (const p of problems) {
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: lesson.id,
                type: 'ASSIST',
                question: p.question,
                order: order++,
                imageSrc: p.image ? `/geometry/phys${p.image}.svg` : '',
                points: 10,
                author: AUTHOR,
                difficulty: '',
            }).returning();

            const optionTexts = p.official_options ?? p.distractors!;
            const correctText = p.answer;
            const opts = shuffle([
                { text: correctText, correct: true },
                ...optionTexts.map((d) => ({ text: d, correct: false })),
            ]);
            for (const o of opts) {
                await db.insert(schema.challengeOptions).values({
                    challengeId: challenge.id,
                    text: o.text,
                    correct: o.correct,
                });
            }
            console.log(`  [${order - 1}/${problems.length}] challenge ${challenge.id} (sdamgia id=${p.id}) correct="${correctText}" options=${opts.length}`);
        }

        console.log('\nГотово!');
    } catch (error) {
        console.error('Ошибка сидинга:', error);
    } finally {
        await queryClient.end();
    }
};

main();
