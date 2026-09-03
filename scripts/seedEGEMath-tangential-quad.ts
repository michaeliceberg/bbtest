// scripts/seedEGEMath-tangential-quad.ts
//
// Курс "ЕГЭ Математика Профиль" (courseId=11), урок "Вписанная окружность"
// (id=302, Unit 1 "Планиметрия") — раньше там были только задачи на
// окружность, вписанную в ТРЕУГОЛЬНИК (r=S/p, высота правильного
// треугольника). Реальное задание №1 ЕГЭ-профиль — про окружность,
// вписанную в ЧЕТЫРЁХУГОЛЬНИК (свойство равенства касательных отрезков:
// AB+CD = BC+AD, откуда периметр = 2(AB+CD)) — этого типа не было в
// курсе вообще (проверено прямым SQL-поиском). Добавлено 8 новых задач,
// первая (id после инсерта) — "флагманская", к ней привязан интерактивный
// разбор по шагам (см. components/geometry/TangentialQuadWalkthrough.tsx),
// как раньше у трапеции (challenge id=1679).
//
// Порядок: 8 новых задач становятся order 1-8 (флагманская — 1-я, по
// тому же принципу, что и разбор трапеции — "важная задача, с неё
// логичнее начинать"), 24 существующие задачи про треугольник сдвинуты
// на +8 (стали order 9-32). Сдвиг через временный оффсет (+1000), чтобы
// не словить конфликт по order во время самого UPDATE.

import postgres from 'postgres';
import 'dotenv/config';
import * as schema from '../db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';

const AUTHOR = 'ЕГЭ Математика Профиль';
const LESSON_ID = 302;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = {
    question: string;
    correct: string;
    distractors: string[];
};

const challenges: ChallengeSeed[] = [
    {
        // Флагманская — к ней привязан интерактивный разбор по шагам.
        question: 'В четырёхугольник $ABCD$ вписана окружность, $AB=10$, $CD=16$. Найдите периметр четырёхугольника $ABCD$.',
        correct: '52',
        // забыл ×2 (сложил только AB+CD), перемножил вместо сложения,
        // неверно скомбинировал (2·AB+CD), неверно скомбинировал в другую
        // сторону (AB+2·CD), правдоподобная случайная догадка.
        distractors: ['26', '160', '36', '42', '60'],
    },
    {
        question: 'В четырёхугольник $ABCD$ вписана окружность, $AB=22$, $CD=77$. Найдите периметр четырёхугольника $ABCD$.',
        correct: '198',
        distractors: ['99', '1694', '121', '176', '200'],
    },
    {
        question: 'В четырёхугольник $ABCD$ вписана окружность, $AB=8$, $CD=19$. Найдите периметр четырёхугольника $ABCD$.',
        correct: '54',
        distractors: ['27', '152', '35', '46', '50'],
    },
    {
        question: 'В четырёхугольник $ABCD$ вписана окружность, $AB=13$, $CD=25$. Найдите периметр четырёхугольника $ABCD$.',
        correct: '76',
        distractors: ['38', '325', '51', '63', '70'],
    },
    {
        question: 'В четырёхугольник $ABCD$ вписана окружность, $AB=17$, $CD=9$. Найдите периметр четырёхугольника $ABCD$.',
        correct: '52',
        distractors: ['26', '153', '43', '35', '48'],
    },
    {
        // Обратная формулировка — периметр и одна сторона известны, найти
        // противоположную (тот же факт, реальный вариант ЕГЭ формулирует
        // и так тоже).
        question: 'В четырёхугольник $ABCD$, периметр которого равен 48, вписана окружность, $AB=15$. Найдите $CD$.',
        correct: '9',
        // забыл разделить периметр на 2 (P-AB), знак перепутан (P/2+AB),
        // взял четверть периметра, повторил данное AB, случайная догадка.
        distractors: ['33', '39', '12', '15', '18'],
    },
    {
        question: 'В четырёхугольник $ABCD$, периметр которого равен 64, вписана окружность, $AB=11$. Найдите $CD$.',
        correct: '21',
        distractors: ['53', '43', '16', '11', '25'],
    },
    {
        question: 'В четырёхугольник $ABCD$ вписана окружность, $AB=31$, $CD=14$. Найдите периметр четырёхугольника $ABCD$.',
        correct: '90',
        distractors: ['45', '434', '76', '59', '85'],
    },
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
        console.log('Сдвигаю существующие задачи урока 302 на +8 (временный оффсет +1000)...');
        await queryClient`UPDATE challenges SET "order" = "order" + 1000 WHERE lesson_id = ${LESSON_ID}`;
        await queryClient`UPDATE challenges SET "order" = "order" - 992 WHERE lesson_id = ${LESSON_ID} AND "order" > 1000`;

        console.log(`Добавляю ${challenges.length} новых задач (окружность в четырёхугольнике) с order 1-${challenges.length}...`);

        let flagshipId: number | null = null;

        for (let i = 0; i < challenges.length; i++) {
            const c = challenges[i];
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: LESSON_ID,
                type: 'ASSIST',
                question: c.question,
                order: i + 1,
                points: 10,
                author: AUTHOR,
                difficulty: '',
                imageSrc: '',
            }).returning();

            if (i === 0) flagshipId = challenge.id;

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

        console.log('Готово. Флагманская задача (разбор по шагам) id =', flagshipId);
    } finally {
        await queryClient.end();
    }
};

main();
