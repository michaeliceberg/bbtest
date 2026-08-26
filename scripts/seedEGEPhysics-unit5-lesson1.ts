// scripts/seedEGEPhysics-unit5-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 5 "Механика", урок 1
// (95 задач с https://phys-ege.sdamgia.ru/test?theme=322: все задачи темы —
// формата "выберите все верные утверждения" (multi-select), а не с одним
// числовым ответом. Реализован новый тип задания SELECT — чекбоксы в цвет
// юнита вместо квадратных карточек ASSIST (см. app/lesson/card.tsx).
//
// Картинки: 18 таблиц данных из условия отрисованы как SVG (см. CLAUDE.md —
// таблица не поддерживается компонентом вопроса), плюс 12 схематичных
// диаграмм без числовых осей (графики-схемы, векторные диаграммы). Ещё 54
// задачи с графиками x(t)/v(t)/F(t) для двух тел (прямая+парабола) требуют
// индивидуального декодирования точных пиксельных координат каждой кривой —
// отложены на следующий заход (imageSrc=null временно), картинки будут
// добавлены точечными UPDATE после отрисовки, без повторного сидирования.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_ID = 12;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type OptionSeed = { text: string; correct: boolean };
type ChallengeSeed = { id: string; question: string; options: OptionSeed[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys322_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 5 → Механика → Урок 1');

        const [unit] = await db.insert(schema.units).values({
            title: 'Механика',
            description: 'Выберите все верные утверждения — кинематика, динамика и графики движения',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 5,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Выберите верные утверждения',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" (${challenges.length})`);

        for (let i = 0; i < challenges.length; i++) {
            const c = challenges[i];
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: lesson.id,
                type: 'SELECT',
                question: c.question,
                order: i + 1,
                points: 10,
                author: AUTHOR,
                difficulty: '',
                imageSrc: c.image ?? '',
            }).returning();

            const options = shuffle(c.options);

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
