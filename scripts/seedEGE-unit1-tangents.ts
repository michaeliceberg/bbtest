// scripts/seedEGE-unit1-tangents.ts
//
// Третий урок Unit 1 курса "ЕГЭ Математика Профиль" (unit id=92) —
// касательная, хорда, секущая, 11 задач с
// https://math-ege.sdamgia.ru/test?theme=112. Картинки — SVG-окружности,
// сгенерированные scripts/render-geometry-svg.py (circles + касательные).

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
};

const challenges: ChallengeSeed[] = [
    { sdamgiaId: '245730',
        question: 'Найдите хорду, на которую опирается угол 30°, вписанный в окружность радиуса 3.',
        correct: '3', distractors: ['1,5', '6', '2', '4,5', '9'] },
    { sdamgiaId: '245731',
        question: 'Найдите хорду, на которую опирается угол 120°, вписанный в окружность радиуса $\\sqrt{3}$.',
        correct: '3', distractors: ['6', '1,5', '2', '4', '9'] },
    { sdamgiaId: '245733',
        question: 'Хорда $AB$ делит окружность на две части, градусные величины которых относятся как 5 : 7. Под каким углом видна эта хорда из точки $C$, принадлежащей меньшей дуге окружности? Ответ дайте в градусах.',
        correct: '105', distractors: ['75', '150', '52,5', '60', '120'] },
    { sdamgiaId: '245734',
        question: 'Хорда $AB$ стягивает дугу окружности в 92°. Найдите угол $ABC$ между этой хордой и касательной к окружности, проведенной через точку $B$. Ответ дайте в градусах.',
        correct: '46', distractors: ['92', '23', '44', '134', '48'] },
    { sdamgiaId: '245736',
        question: 'Через концы $A$ и $B$ дуги окружности с центром $O$ проведены касательные $AC$ и $BC$. Угол $CAB$ равен 32°. Найдите угол $AOB$. Ответ дайте в градусах.',
        correct: '64', distractors: ['32', '148', '58', '116', '74'] },
    { sdamgiaId: '245736',
        question: 'Через концы $A$, $B$ дуги окружности в 62° проведены касательные $AC$ и $BC$. Найдите угол $ACB$. Ответ дайте в градусах.',
        correct: '118', distractors: ['62', '31', '124', '56', '149'] },
    { sdamgiaId: '245736',
        question: 'Касательные $CA$ и $CB$ к окружности образуют угол $ACB$, равный 122°. Найдите величину меньшей дуги $AB$, стягиваемой точками касания. Ответ дайте в градусах.',
        correct: '58', distractors: ['122', '61', '29', '118', '244'] },
    { sdamgiaId: '245742',
        question: 'Найдите угол $ACO$, если его сторона $CA$ касается окружности, $O$ — центр окружности, сторона $CO$ пересекает окружность в точке $B$, дуга $AB$ окружности, заключённая внутри этого угла, равна 64°. Ответ дайте в градусах.',
        correct: '26', distractors: ['64', '32', '13', '128', '52'] },
    { sdamgiaId: '245742',
        question: 'Угол $ACO$ равен 28°, где $O$ — центр окружности. Его сторона $CA$ касается окружности. Найдите величину меньшей дуги $AB$ окружности, заключенной внутри этого угла. Ответ дайте в градусах.',
        correct: '62', distractors: ['28', '56', '31', '124', '118'] },
    { sdamgiaId: '246164',
        question: 'Найдите угол $ACO$, если его сторона $CA$ касается окружности, $O$ — центр окружности, сторона $CO$ пересекает окружность в точках $B$ и $D$, а дуга $AD$ окружности, заключенная внутри этого угла, равна 116°. Ответ дайте в градусах.',
        correct: '26', distractors: ['116', '58', '13', '128', '52'] },
    { sdamgiaId: '246164',
        question: 'Угол $ACO$ равен 24°. Его сторона $CA$ касается окружности с центром в точке $O$. Сторона $CO$ пересекает окружность в точках $B$ и $D$ (см. рис.). Найдите градусную меру дуги $AD$ окружности, заключенной внутри этого угла. Ответ дайте в градусах.',
        correct: '114', distractors: ['24', '48', '66', '156', '132'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Касательная, хорда, секущая (11 задач)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Касательная, хорда, секущая',
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
                imageSrc: `/geometry/${c.sdamgiaId}.svg`,
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

            console.log(`  [${i + 1}/${challenges.length}] challenge ${challenge.id} (sdamgia img ${c.sdamgiaId}) — "${c.correct}"`);
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
