// scripts/seedEGEPhysics-unit11-lesson3.ts
//
// Курс "ЕГЭ Физика" (courseId=12) — Unit 11 (id=112, "Закон Кулона, закон
// сохранения заряда"), НОВЫЙ урок 3 "Работа и мощность тока, закон
// Джоуля-Ленца" (theme=243 на sdamgia, 33 задачи: работа/мощность
// электрического тока, закон Джоуля-Ленца, тепловыделение в резисторах
// при последовательном/параллельном соединении, лампы накаливания с
// нелинейной ВАХ, предохранители).
//
// Тип ASSIST. 4 из 33 задачи — официальные варианты sdamgia (как есть,
// без подгонки под 6). Остальные 29 — 5 индивидуально подобранных
// дистракторов на задачу (6 вариантов).
//
// 14 из 33 задач — с диаграммой (13 уникальных image_id, 27983/27949
// делят один и тот же рисунок), ВСЕ перерисованы по сырым координатам
// оригинала: 3 нелинейных I(U)-графика лампы накаливания (кубический
// Bezier из сырого <path>, каждый answer-verified через физику: решение
// уравнения Bezier(t) на пересечение с известной осью и сверка с
// доверенным ответом sdamgia), 9 схем электрических цепей (резисторы/
// батарея/амперметр/вольтметр/ключ/лампа), 1 составное изображение
// (схема + 2 стрелочных индикатора для задачи 3471 — оба показания
// сняты не на глаз, а расчётом угла стрелки по сырым координатам SVG
// относительно откалиброванных по числовым меткам делений шкалы:
// V=4.2В, A=0.5А, что даёт W=U·I·t=630Дж, ТОЧНО совпадает с ответом).
//
// Баг парсера, найденный и исправленный на этой теме: класс
// tex-формул со СЛОВЕСНЫМ описанием формулы в alt ("дробь: числитель:
// I, знаменатель: 2 конец дроби" = LaTeX \frac{I}{2}) — раньше не
// встречался в темах 241/287/290 (там alt почти всегда уже был
// LaTeX-подобным), здесь потребовал ручного словаря переводов
// (MANUAL_TEX в /tmp/phys243_work/parse2.py). Также найден и
// исправлен баг, из-за которого <img class="tex"> формулы внутри
// УСЛОВИЯ задачи (не только в официальных вариантах) вырезались
// целиком ДО того, как успевали превратиться в LaTeX — правильный
// порядок: сначала tex_sub() конвертирует img→$...$, потом общий
// tag-strip убирает остальные (иллюстрации).
//
// Данные — /tmp/phys243_work/seed_content.json.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 112;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { id: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys243_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 11 → Урок 3 (Работа и мощность тока, закон Джоуля-Ленца)');

        const unit = await db.query.units.findFirst({ where: (u, { eq }) => eq(u.id, UNIT_ID) });
        if (!unit) throw new Error(`Unit ${UNIT_ID} не найден`);
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const existingLessons = await db.query.lessons.findMany({ where: (l, { eq }) => eq(l.unitId, UNIT_ID) });
        const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map((l) => l.order)) + 1 : 1;

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Работа и мощность тока, закон Джоуля-Ленца',
            unitId: unit.id,
            order: nextOrder,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" order=${nextOrder} (${challenges.length} задач)`);

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
                imageSrc: c.image ? `/geometry/phys243_${c.image}.svg` : '',
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
