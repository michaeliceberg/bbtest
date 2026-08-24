// scripts/seedEGE-unit8-derivative-physics.ts
//
// Unit 8 курса "ЕГЭ Математика Профиль" — физический смысл производной,
// 6 задач с https://math-ege.sdamgia.ru/test?theme=69, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const COURSE_ID = 11;
const UNIT_ORDER = 8;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'Материальная точка движется прямолинейно по закону $x(t) = 6t^{2} -48t +17$ (где $x$ — расстояние от точки отсчёта в метрах, $t$ — время в секундах, измеренное с начала движения). Найдите её скорость (в м/с) в момент времени $t = 9$ с.',
        correct: '60', distractors: ['120', '30', '61', '59', '90'] },
    { question: 'Материальная точка движется прямолинейно по закону $x(t) = \\frac{1}{2}t^{3} -3t^{2} +2t$ (где $x$ — расстояние от точки отсчёта в метрах, $t$ — время в секундах, измеренное с начала движения). Найдите её скорость (в м/с) в момент времени $t = 6$ с.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Материальная точка движется прямолинейно по закону $x(t) = -t^{4} +6t^{3} +5t +23$ (где $x$ — расстояние от точки отсчёта в метрах, $t$ — время в секундах, измеренное с начала движения). Найдите её скорость (в м/с) в момент времени $t = 3$ с.',
        correct: '59', distractors: ['118', '29,5', '60', '58', '89'] },
    { question: 'Материальная точка движется прямолинейно по закону $x(t) = t^{2} -13t +23$ (где $x$ — расстояние от точки отсчёта в метрах, $t$ — время в секундах, измеренное с начала движения). В какой момент времени (в секундах) её скорость была равна 3 м/с?',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Материальная точка движется прямолинейно по закону $x(t) = \\frac{1}{3}t^{3} -3t^{2} -5t +3$ (где $x$ — расстояние от точки отсчёта в метрах, $t$ — время в секундах, измеренное с начала движения). В какой момент времени (в секундах) её скорость была равна 2 м/с?',
        correct: '7', distractors: ['14', '3,5', '8', '6', '10,5'] },
    { question: 'Материальная точка $M$ начинает движение из точки $A$ и движется по прямой на протяжении 12 секунд. График показывает, как менялось расстояние от точки $A$ до точки $M$ со временем. На оси абсцисс откладывается время $t$ в секундах, на оси ординат — расстояние $s$. Определите, сколько раз за время движения скорость точки $M$ обращалась в ноль (начало и конец движения не учитывайте).',
        correct: '6', distractors: ['4', '5', '3', '8', '7'], image: '109501' },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 8 (Физический смысл производной)');

        const [unit] = await db.insert(schema.units).values({
            title: 'Физический смысл производной',
            description: 'Скорость как производная координаты по времени',
            imageSrc: 'LottieUnit8',
            courseId: COURSE_ID,
            order: UNIT_ORDER,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Физический смысл производной',
            unitId: unit.id,
            order: 1,
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
