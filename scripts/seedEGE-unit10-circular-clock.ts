// scripts/seedEGE-unit10-circular-clock.ts
//
// Unit 10 курса "ЕГЭ Математика Профиль" — движение по круговой
// трассе и стрелки часов, 5 задач с
// https://math-ege.sdamgia.ru/test?theme=85, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const UNIT_ID = 96;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'Два мотоциклиста стартуют одновременно в одном направлении из двух диаметрально противоположных точек круговой трассы, длина которой равна 14 км. Через сколько минут мотоциклисты поравняются в первый раз, если скорость одного из них на 21 км/ч больше скорости другого?',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Из одной точки круговой трассы, длина которой равна 14 км, одновременно в одном направлении стартовали два автомобиля. Скорость первого автомобиля равна 80 км/ч, и через 40 минут после старта он опережал второй автомобиль на один круг. Найдите скорость второго автомобиля. Ответ дайте в км/ч.',
        correct: '59', distractors: ['118', '29,5', '60', '58', '88,5'] },
    { question: 'Из пункта A круговой трассы выехал велосипедист. Через 30 минут он ещё не вернулся в пункт А, и из пункта А следом за ним отправился мотоциклист. Через 10 минут после отправления он догнал велосипедиста в первый раз, а ещё через 30 минут после этого догнал его во второй раз. Найдите скорость мотоциклиста, если длина трассы равна 30 км. Ответ дайте в км/ч.',
        correct: '80', distractors: ['160', '40', '81', '79', '120'] },
    { question: 'Часы со стрелками показывают 8 часов ровно. Через сколько минут минутная стрелка в четвёртый раз поравняется с часовой?',
        correct: '240', distractors: ['480', '120', '241', '239', '360'] },
    { question: 'Часы со стрелками показывают 5 часов ровно. Через сколько минут минутная стрелка в седьмой раз поравняется с часовой?',
        correct: '420', distractors: ['840', '210', '421', '419', '630'] },
];

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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 10 → Круговая трасса и часы');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Круговая трасса и стрелки часов',
            unitId: UNIT_ID,
            order: 3,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}"`);

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
                imageSrc: c.image ? `/geometry/${c.image}.svg` : '',
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
                }))
            );

            console.log(`  [${i + 1}/${challenges.length}] challenge ${challenge.id} — "${c.correct}"`);
        }

        console.log('Готово!');
    } catch (error) {
        console.error(error);
        throw new Error('Не получилось заполнить БД');
    } finally {
        await queryClient.end();
    }
};

main();
