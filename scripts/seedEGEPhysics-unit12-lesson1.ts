// scripts/seedEGEPhysics-unit12-lesson1.ts
//
// Курс "ЕГЭ Физика" (courseId=12) — НОВЫЙ Unit 12 (order=12, следует за уже
// существующим Unit 11 "Закон Кулона, закон сохранения заряда", order=11 —
// поэтому этот, несмотря на то что пользователь в чате называл его
// "unit11", на самом деле становится 12-м по счёту юнитом курса), урок 1
// "Сила тока, закон Ома" (theme=241 на sdamgia, 40 задач: сила тока, заряд
// q(t)/I(t)-графики, закон Ома для участка цепи, ЭДС и внутреннее
// сопротивление, последовательное/параллельное соединение резисторов).
//
// Тип ASSIST. 8 из 40 задач — официальные варианты sdamgia (4 варианта
// как есть, без подгонки под 6, включая исправленную опечатку источника
// "5 0м"→"5 Ом" в задаче 3330). Остальные 32 — 5 индивидуально подобранных
// дистракторов на задачу (6 вариантов), варьирующих тип типичной ошибки
// школьника (перепутал формулу, забыл перевести единицы, инвертировал
// зависимость и т.п.) — см. /tmp/phys241_work/assemble.py.
//
// 28 из 40 задач — с диаграммой, ВСЕ перерисованы по сырым координатам
// оригинала (не на глаз, по прямой инструкции пользователя "не обрезай
// оси координат, подписи, единицы измерений"): 22 линейных/кусочно-
// линейных/гиперболический I(U)/I(t)/q(t)-графика (render241.py,
// line_graph()) — каждый answer-verified пересчётом физики (наклон/
// площадь под графиком) против доверенного ответа sdamgia, включая
// повторную проверку каждой не-uniform подписи сетки (найден и
// пойман реальный баг: 86103 изначально давал R=0.25 Ом вместо 0.5 Ом
// из-за того, что подписана была не каждая линия сетки I-оси, а через
// одну — тот же класс бага, что уже раньше ловился на 43088). 6 схем
// электрических цепей (build_circuits.py — резисторы/батарея/амперметр/
// вольтметр/ключ, топология и все числовые подписи сверены с оригиналом
// визуально и физика проверена расчётом), 1 составное изображение из
// схемы+двух стрелочных индикаторов (1403_combo, задача 1403 — оригинал
// sdamgia использует ДВА разных image_id на одну задачу: 88341 схема +
// 220100 два циферблата амперметра/вольтметра), 1 таблица переведена в
// SVG-картинку (38845_table, тот же приём, что и в прошлых уроках).
//
// Данные — /tmp/phys241_work/seed_content.json.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_ID = 12;
const UNIT_ORDER = 12;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { id: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys241_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 12 (новый) → Урок 1 (Сила тока, закон Ома)');

        const [unit] = await db.insert(schema.units).values({
            title: '12. Сила тока, закон Ома',
            description: 'Сила тока, заряд, закон Ома для участка цепи, ЭДС и внутреннее сопротивление источника',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: UNIT_ORDER,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}" order=${unit.order}`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Сила тока, закон Ома',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" (${challenges.length} задач)`);

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
                imageSrc: c.image ? `/geometry/phys241_${c.image}.svg` : '',
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
            console.log(`  [${i + 1}/${challenges.length}] challenge ${challenge.id} (sdamgia id=${c.id}), options=${options.length}`);
        }

        console.log('\nГотово!');
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await queryClient.end();
    }
};

main();
