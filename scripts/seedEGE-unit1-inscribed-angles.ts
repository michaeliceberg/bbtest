// scripts/seedEGE-unit1-inscribed-angles.ts
//
// Второй урок Unit 1 курса "ЕГЭ Математика Профиль" (unit id=92) —
// центральные и вписанные углы, 16 задач с
// https://math-ege.sdamgia.ru/test?theme=111. Картинки — SVG-окружности,
// сгенерированные scripts/render-geometry-svg.py (circles).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const UNIT_ID = 92;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = {
    sdamgiaId: string;
    question: string;
    correct: string;
    distractors: string[];
    hasImage: boolean;
};

const challenges: ChallengeSeed[] = [
    { sdamgiaId: '500246', hasImage: true,
        question: 'Треугольник $ABC$ вписан в окружность с центром $O$. Найдите угол $BOC$, если угол $BAC$ равен 32°.',
        correct: '64', distractors: ['32', '16', '128', '58', '96'] },
    { sdamgiaId: '245385', hasImage: true,
        question: 'Найдите центральный угол $AOB$, если он на 15° больше вписанного угла $ACB$, опирающегося на ту же дугу. Ответ дайте в градусах.',
        correct: '30', distractors: ['15', '45', '60', '75', '7,5'] },
    { sdamgiaId: '27857', hasImage: true,
        question: 'Чему равен острый вписанный угол, опирающийся на хорду, равную радиусу окружности? Ответ дайте в градусах.',
        correct: '30', distractors: ['60', '15', '45', '90', '120'] },
    { sdamgiaId: '27859', hasImage: true,
        question: 'Чему равен тупой вписанный угол, опирающийся на хорду, равную радиусу окружности? Ответ дайте в градусах.',
        correct: '150', distractors: ['30', '60', '120', '165', '100'] },
    { sdamgiaId: '27863', hasImage: true,
        question: 'Центральный угол на 36° больше острого вписанного угла, опирающегося на ту же дугу окружности. Найдите вписанный угол. Ответ дайте в градусах.',
        correct: '36', distractors: ['72', '18', '108', '12', '144'] },
    { sdamgiaId: '27864', hasImage: true,
        question: 'Найдите вписанный угол, опирающийся на дугу, которая составляет $\\frac{1}{5}$ окружности. Ответ дайте в градусах.',
        correct: '36', distractors: ['72', '18', '144', '12', '60'] },
    { sdamgiaId: '27866', hasImage: true,
        question: 'Дуга окружности $AC$, не содержащая точки $B$, составляет 200°. А дуга окружности $BC$, не содержащая точки $A$, составляет 80°. Найдите вписанный угол $ACB$. Ответ дайте в градусах.',
        correct: '40', distractors: ['80', '20', '140', '60', '100'] },
    { sdamgiaId: '27869', hasImage: true,
        question: 'В окружности с центром $O$ отрезки $AC$ и $BD$ — диаметры. Вписанный угол $ACB$ равен 38°. Найдите центральный угол $AOD$. Ответ дайте в градусах.',
        correct: '104', distractors: ['76', '52', '128', '14', '90'] },
    { sdamgiaId: '27870', hasImage: true,
        question: 'В окружности с центром $O$ отрезки $AC$ и $BD$ — диаметры. Центральный угол $AOD$ равен 110°. Найдите вписанный угол $ACB$. Ответ дайте в градусах.',
        correct: '35', distractors: ['70', '55', '140', '20', '90'] },
    { sdamgiaId: '27885', hasImage: true,
        question: 'Найдите угол $ACB$, если вписанные углы $ADB$ и $DAE$ опираются на дуги окружности, градусные величины которых равны соответственно 118° и 38°. Ответ дайте в градусах.',
        correct: '40', distractors: ['59', '19', '78', '20', '118'] },
    { sdamgiaId: '27886', hasImage: true,
        question: 'Угол $ACB$ равен 42°. Градусная величина дуги $AB$ окружности, не содержащей точек $D$ и $E$, равна 124°. Найдите угол $DAE$. Ответ дайте в градусах.',
        correct: '20', distractors: ['42', '84', '62', '10', '124'] },
    { sdamgiaId: '525110', hasImage: true,
        question: 'Четырёхугольник $ABCD$ вписан в окружность. Угол $ABD$ равен 61°, угол $CAD$ равен 37°. Найдите угол $ABC$. Ответ дайте в градусах.',
        correct: '98', distractors: ['61', '37', '24', '124', '49'] },
    { sdamgiaId: '525131', hasImage: true,
        question: 'Угол $ABD$ равен 53°. Угол $BCA$ равен 38°. Найдите вписанный угол $BCD$. Ответ дайте в градусах.',
        correct: '91', distractors: ['53', '38', '15', '106', '76'] },
    { sdamgiaId: '525719', hasImage: false,
        question: 'Угол между двумя соседними сторонами правильного многоугольника равен 160°. Найдите число вершин многоугольника.',
        correct: '18', distractors: ['20', '9', '36', '15', '24'] },
    { sdamgiaId: '526006', hasImage: true,
        question: 'Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен 102°, угол $CAD$ равен 46°. Найдите угол $ABD$. Ответ дайте в градусах.',
        correct: '56', distractors: ['102', '46', '148', '28', '23'] },
    { sdamgiaId: '676844', hasImage: true,
        question: 'На окружности по разные стороны от диаметра $MN$ взяты точки $K$ и $P$. Известно, что $\\angle MNP = 36°$. Найдите $\\angle PKN$. Ответ дайте в градусах.',
        correct: '54', distractors: ['36', '90', '18', '72', '44'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Центральные и вписанные углы (16 задач)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Центральные и вписанные углы',
            unitId: UNIT_ID,
            order: 2,
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
                imageSrc: c.hasImage ? `/geometry/${c.sdamgiaId}.svg` : '',
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

            console.log(`  [${i + 1}/${challenges.length}] challenge ${challenge.id} (sdamgia ${c.sdamgiaId}) — "${c.correct}"`);
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
