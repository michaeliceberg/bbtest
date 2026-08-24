// scripts/seedEGE-unit1-inscribed-circle.ts
//
// Unit 1 курса "ЕГЭ Математика Профиль" — вписанная окружность:
// площадь через периметр и радиус, радиус/высота правильного
// треугольника, 24 задачи с
// https://math-ege.sdamgia.ru/test?theme=113, один урок.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const UNIT_ID = 92;
const AUTHOR = 'ЕГЭ Математика Профиль';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = { question: string; correct: string; distractors: string[]; image?: string };

const challenges: ChallengeSeed[] = [
    { question: 'Периметр треугольника равен 12, а радиус вписанной окружности равен 1. Найдите площадь этого треугольника.',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'Площадь треугольника равна 24, а радиус вписанной окружности равен 2. Найдите периметр этого треугольника.',
        correct: '24', distractors: ['48', '12', '25', '23', '36'] },
    { question: 'Около окружности, радиус которой равен 3, описан многоугольник, периметр которого равен 20. Найдите его площадь.',
        correct: '30', distractors: ['60', '15', '31', '29', '45'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 138.',
        correct: '46', distractors: ['92', '23', '47', '45', '69'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 39.',
        correct: '13', distractors: ['26', '6,5', '14', '12', '19,5'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 66.',
        correct: '22', distractors: ['44', '11', '23', '21', '33'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 60.',
        correct: '20', distractors: ['40', '10', '21', '19', '30'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 84.',
        correct: '28', distractors: ['56', '14', '29', '27', '42'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 123.',
        correct: '41', distractors: ['82', '20,5', '42', '40', '61,5'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 117.',
        correct: '39', distractors: ['78', '19,5', '40', '38', '58,5'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 45.',
        correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 48.',
        correct: '16', distractors: ['32', '8', '17', '15', '24'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 90.',
        correct: '30', distractors: ['60', '15', '31', '29', '45'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 24.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна 126.',
        correct: '42', distractors: ['84', '21', '43', '41', '63'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 31. Найдите высоту этого треугольника.',
        correct: '93', distractors: ['186', '46,5', '94', '92', '139,5'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 44. Найдите высоту этого треугольника.',
        correct: '132', distractors: ['264', '66', '133', '131', '198'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 33. Найдите высоту этого треугольника.',
        correct: '99', distractors: ['198', '49,5', '100', '98', '148,5'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 45. Найдите высоту этого треугольника.',
        correct: '135', distractors: ['270', '67,5', '136', '134', '202,5'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 11. Найдите высоту этого треугольника.',
        correct: '33', distractors: ['66', '16,5', '34', '32', '49,5'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 42. Найдите высоту этого треугольника.',
        correct: '126', distractors: ['252', '63', '127', '125', '189'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 4. Найдите высоту этого треугольника.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 27. Найдите высоту этого треугольника.',
        correct: '81', distractors: ['162', '40,5', '82', '80', '121,5'] },
    { question: 'Радиус окружности, вписанной в правильный треугольник, равен 16. Найдите высоту этого треугольника.',
        correct: '48', distractors: ['96', '24', '49', '47', '72'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Вписанная окружность');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Вписанная окружность',
            unitId: UNIT_ID,
            order: 8,
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
