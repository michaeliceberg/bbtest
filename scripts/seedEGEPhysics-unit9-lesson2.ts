// scripts/seedEGEPhysics-unit9-lesson2.ts
//
// Курс "ЕГЭ Физика" — Unit 9 (id=110, "9. Газ. Графики"), новый урок 2 (68
// задач с https://phys-ege.sdamgia.ru/test?theme=395): тот же формат
// "выберите все верные утверждения" (SELECT), что и урок 1 (theme=335) —
// циклические pV/pT/VT/TV/UV/p-E-процессы идеального газа, графики
// нагрева/охлаждения и фазовых переходов (t от Q).
//
// 46 из 56 задач с диаграммой перерисованы заново (public/geometry/
// phys395_<id>_0.svg) — в АКТУАЛЬНОЙ голубой палитре (#7dd3fc), не старой
// оранжевой, которой ещё пользовался урок 1. 2 задачи (42275, 8097)
// переиспользуют уже существующие диаграммы урока 1 (phys335_87964_0.svg,
// phys335_78719_0.svg) — тот же исходный график sdamgia (общий image_id),
// перерисовывать заново не нужно.
//
// Верные ответы — поле "Ответ:" со страницы sdamgia, копируется буквально
// (см. CLAUDE.md, "Правильный ответ — всегда доверенный"). Варианты —
// сами 5 утверждений из условия sdamgia (официальный SELECT-формат, не
// придуманные дистракторы).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';
import { eq } from 'drizzle-orm';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 110; // "9. Газ. Графики" — уже существует (создан для урока 1)

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type OptionSeed = { text: string; correct: boolean };
type ChallengeSeed = { id: string; question: string; options: OptionSeed[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys395_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 9 → Урок 2 (выберите верные утверждения, theme=395)');

        const unit = await db.query.units.findFirst({ where: eq(schema.units.id, UNIT_ID) });
        if (!unit) throw new Error(`Unit ${UNIT_ID} не найден`);
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const existingLessons = await db.query.lessons.findMany({ where: eq(schema.lessons.unitId, UNIT_ID) });
        const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map((l) => l.order)) + 1 : 1;

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Выберите верные утверждения 2',
            unitId: UNIT_ID,
            order: nextOrder,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" order=${nextOrder} (${challenges.length} задач)`);

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
