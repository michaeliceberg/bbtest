// scripts/seedEGE-unit1-triangle-basics.ts
//
// Unit 1 курса "ЕГЭ Математика Профиль" — базовые свойства
// треугольника: площадь через две стороны и угол, средняя линия,
// высоты к сторонам, внешний угол, отношение углов, 26 задач с
// https://math-ege.sdamgia.ru/test?theme=96, один урок.

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
    { question: 'Найдите площадь треугольника, две стороны которого равны 8 и 12, а угол между ними равен 30°.',
        correct: '24', distractors: ['48', '12', '25', '23', '36'] },
    { question: 'Найдите площадь треугольника, две стороны которого равны 50 и 20, а угол между ними равен 30°.',
        correct: '250', distractors: ['500', '125', '251', '249', '375'] },
    { question: 'Площадь треугольника $ABC$ равна 4, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь треугольника $CDE$.',
        correct: '1', distractors: ['2', '0,5', '0,01', '1,5', '3'] },
    { question: 'Площадь треугольника $ABC$ равна 176, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь треугольника $CDE$.',
        correct: '44', distractors: ['88', '22', '45', '43', '66'] },
    { question: 'У треугольника со сторонами 9 и 6 проведены высоты к этим сторонам. Высота, проведённая к первой стороне, равна 4. Чему равна высота, проведённая ко второй стороне?',
        correct: '6', distractors: ['12', '3', '7', '5', '9'] },
    { question: 'У треугольника со сторонами 15 и 5 проведены высоты к этим сторонам. Высота, проведённая к первой стороне, равна 1. Чему равна высота, проведённая ко второй стороне?',
        correct: '3', distractors: ['6', '1,5', '4', '2', '4,5'] },
    { question: 'У треугольника со сторонами 8 и 2 проведены высоты к этим сторонам. Высота, проведённая к первой стороне, равна 1. Чему равна высота, проведённая ко второй стороне?',
        correct: '4', distractors: ['8', '2', '5', '3', '6'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 40°, внешний угол при вершине $B$ равен 102°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '62', distractors: ['124', '31', '63', '61', '93'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 10°, внешний угол при вершине $B$ равен 31°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '21', distractors: ['42', '10,5', '22', '20', '31,5'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 36°, внешний угол при вершине $B$ равен 118°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '82', distractors: ['164', '41', '83', '81', '123'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 80°, внешний угол при вершине $B$ равен 104°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '24', distractors: ['48', '12', '25', '23', '36'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 72°, внешний угол при вершине $B$ равен 84°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '12', distractors: ['24', '6', '13', '11', '18'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 70°, внешний угол при вершине $B$ равен 79°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '9', distractors: ['18', '4,5', '10', '8', '13,5'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 48°, внешний угол при вершине $B$ равен 118°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '70', distractors: ['140', '35', '71', '69', '105'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 88°, внешний угол при вершине $B$ равен 124°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '36', distractors: ['72', '18', '37', '35', '54'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 44°, внешний угол при вершине $B$ равен 118°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '74', distractors: ['148', '37', '75', '73', '111'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 30°, внешний угол при вершине $B$ равен 120°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '90', distractors: ['180', '45', '91', '89', '135'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 8°, внешний угол при вершине $B$ равен 25°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '17', distractors: ['34', '8,5', '18', '16', '25,5'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 42°, внешний угол при вершине $B$ равен 118°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '76', distractors: ['152', '38', '77', '75', '114'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 54°, внешний угол при вершине $B$ равен 118°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '64', distractors: ['128', '32', '65', '63', '96'] },
    { question: 'В треугольнике $ABC$ угол $A$ равен 31°, внешний угол при вершине $B$ равен 119°. Найдите угол $C$. Ответ дайте в градусах.',
        correct: '88', distractors: ['176', '44', '89', '87', '132'] },
    { question: 'Углы треугольника относятся как 2:3:4. Найдите меньший из них. Ответ дайте в градусах.',
        correct: '40', distractors: ['80', '20', '41', '39', '60'] },
    { question: 'Углы треугольника относятся как 1:1:10. Найдите меньший из них. Ответ дайте в градусах.',
        correct: '15', distractors: ['30', '7,5', '16', '14', '22,5'] },
    { question: 'Углы треугольника относятся как 2:8:35. Найдите меньший из них. Ответ дайте в градусах.',
        correct: '8', distractors: ['16', '4', '9', '7', '12'] },
    { question: 'Углы треугольника относятся как 1:1:1. Найдите меньший из них. Ответ дайте в градусах.',
        correct: '60', distractors: ['120', '30', '61', '59', '90'] },
    { question: 'Углы треугольника относятся как 3:13:14. Найдите меньший из них. Ответ дайте в градусах.',
        correct: '18', distractors: ['36', '9', '19', '17', '27'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Базовые свойства треугольника');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Базовые свойства треугольника',
            unitId: UNIT_ID,
            order: 7,
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
