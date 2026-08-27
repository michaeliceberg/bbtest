// scripts/seedEGEPhysics-unit8-lesson2.ts
//
// Курс "ЕГЭ Физика" — Unit 8 (id=109, "Работа, количество теплоты,
// внутренняя энергия"), урок 2 (theme=235 на sdamgia, 48 задач: удельная
// теплоёмкость, количество теплоты при нагревании/охлаждении, фазовые
// переходы (плавление/парообразование), теплообмен/калориметрия). Тип
// ASSIST. По 5 дистракторов на задачу (6 вариантов ответа) — кроме 5 задач
// (1109, 5538, 6231, 6268, 6304), у которых есть официальные варианты
// sdamgia ("Тип 2") — у них берём варианты как есть (4 штуки), не
// подгоняя под 6 (см. CLAUDE.md, раздел "Дистракторы").
//
// 22 из 48 задач имеют график t(Q)/t(τ) — перерисованы, см.
// /tmp/phys235_work/render235.py (переиспользует pv_multi_segment и
// pV_diagram_ticks из render397.py/render393.py).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const UNIT_ID = 109;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { id: string; question: string; correct: string; distractors: string[]; image: string | null };

const challenges: ChallengeSeed[] = JSON.parse(
    readFileSync('/tmp/phys235_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: ЕГЭ Физика → Unit 8 → Урок 2 (удельная теплоёмкость, теплообмен)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Количество теплоты и теплообмен',
            unitId: UNIT_ID,
            order: 2,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}" (${challenges.length})`);

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
                imageSrc: c.image ?? '',
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
