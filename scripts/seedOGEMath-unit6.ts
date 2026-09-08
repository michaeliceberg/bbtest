// scripts/seedOGEMath-unit6.ts
//
// Новый курс "ОГЭ Математика" — Unit 6 "Числа и вычисления" (order=6,
// совпадает с номером задания в самом ОГЭ, sdamgia называет темой "Тип 6"),
// 50 задач с https://math-oge.sdamgia.ru/test?id=82292536&nt=True&pub=False
// (арифметика: обыкновенные и десятичные дроби).
//
// Разбито на 6 lessons по способу решения (не просто по subtopic sdamgia):
//  1. Сложение и вычитание обыкновенных дробей (общий знаменатель, НОК)
//  2. Умножение и деление обыкновенных дробей (числитель×числитель,
//     деление — умножение на перевёрнутую дробь)
//  3. Сложные дроби и нахождение числителя (1/(1/a±1/b), и отдельный
//     формат ответа "запишите числитель" вместо самого значения)
//  4. Сложение и вычитание десятичных дробей (выравнивание разрядов)
//  5. Умножение десятичных дробей (перенос запятой)
//  6. Деление десятичных дробей (дана как дробная черта decimal/decimal)
//
// У этого теста sdamgia НЕ фиксированный список задач — при повторном
// заходе на test?id=... отдаёт другую случайную выборку той же темы
// (проверено: id страницы совпадает, но problem?id= внутри — разные).
// Поэтому здесь используется КОНКРЕТНЫЙ снэпшот одной выборки (50 задач,
// честно скрейплены каждая по /problem?id=<id> — эти страницы стабильны),
// не сам динамический test-урл.
//
// Правильный ответ — поле "Ответ:" со страницы problem?id=, скопировано
// буквально (см. правило проекта). Дистракторы придуманы под конкретную
// физику ошибки (перепутал знак, сложил вместо вычёл, забыл общий
// знаменатель, забыл перевернуть дробь при делении, сдвинул запятую и
// т.п.) — не единая формула на всех, варьируется по типу операции, см.
// /tmp/oge_math_work (генератор дистракторов, не сохранён в репозитории).
// 6 вариантов на задачу (5 дистракторов) — новый стандарт проекта.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ОГЭ Математика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = {
    sourceId: string;
    question: string;
    correct: string;
    distractors: string[];
};
type LessonSeed = { title: string; challenges: ChallengeSeed[] };

const lessonsData: LessonSeed[] = JSON.parse(
    readFileSync('/tmp/oge_math_work/seed_content.json', 'utf-8')
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
        console.log('Seeding: новый курс "ОГЭ Математика" → Unit 6 "Числа и вычисления"');

        const [course] = await db.insert(schema.courses).values({
            title: 'ОГЭ Математика',
            imageSrc: '/CourseImgs/m11_ege.jpeg',
        }).returning();
        console.log(`course: ${course.id} "${course.title}"`);

        const [unit] = await db.insert(schema.units).values({
            title: '6. Числа и вычисления',
            description: 'Действия с обыкновенными и десятичными дробями — арифметика без калькулятора',
            imageSrc: 'LottieUnit6',
            courseId: course.id,
            order: 6,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        let totalChallenges = 0;
        for (let li = 0; li < lessonsData.length; li++) {
            const lessonSeed = lessonsData[li];
            const [lesson] = await db.insert(schema.lessons).values({
                title: lessonSeed.title,
                unitId: unit.id,
                order: li + 1,
            }).returning();
            console.log(`  lesson: ${lesson.id} "${lesson.title}" (${lessonSeed.challenges.length})`);

            for (let ci = 0; ci < lessonSeed.challenges.length; ci++) {
                const c = lessonSeed.challenges[ci];
                const [challenge] = await db.insert(schema.challenges).values({
                    lessonId: lesson.id,
                    type: 'ASSIST',
                    question: c.question,
                    order: ci + 1,
                    points: 10,
                    author: AUTHOR,
                    difficulty: '',
                    imageSrc: '',
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

                totalChallenges++;
            }
        }

        console.log('done:', totalChallenges, 'challenges across', lessonsData.length, 'lessons');
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await queryClient.end();
    }
};

main();
