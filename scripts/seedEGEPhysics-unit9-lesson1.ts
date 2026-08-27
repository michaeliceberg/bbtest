// scripts/seedEGEPhysics-unit9-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 9, урок 1 (59 задач с
// https://phys-ege.sdamgia.ru/test?theme=335: формат "выберите все верные
// утверждения" (multi-select) — циклические pV/pT/pρ-процессы идеального
// газа, изотермы, насыщенный пар, фазовые переходы. Тип SELECT — чекбоксы
// (см. app/lesson/card.tsx, тот же тип уже используется в Unit 5
// "Механика"), а не ASSIST с числовым ответом.
//
// 31 из 59 задач с диаграммой — все перерисованы (см.
// /tmp/phys335_work/render335.py), новые функции: rho_cycle_arc (p-ρ цикл
// с четвертью окружности), two_isotherms (гиперболы pV=const),
// saturation_curve (кривая давления насыщенного пара), pressure_vs_height
// (атмосферное давление от высоты), n_vs_t_saturating (концентрация пара
// рост+плато), two_parallel_isobars (VT-диаграмма два сосуда).

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
    readFileSync('/tmp/phys335_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 9 → Урок 1 (выберите верные утверждения)');

        const [unit] = await db.insert(schema.units).values({
            title: 'Циклические процессы и фазовые переходы',
            description: 'Выберите все верные утверждения — циклы идеального газа, изотермы, насыщенный пар',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 9,
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
