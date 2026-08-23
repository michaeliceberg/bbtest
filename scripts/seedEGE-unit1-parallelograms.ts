// scripts/seedEGE-unit1-parallelograms.ts
//
// Unit 1 курса "ЕГЭ Математика Профиль" (unit id=92, создан заранее) —
// Тип 1 ФИПИ: параллелограммы, прямоугольники, ромбы, квадраты.
// Один урок, 35 задач с https://math-ege.sdamgia.ru/test?theme=102.
// Картинки — сгенерированные SVG в public/geometry/{sdamgiaId}.svg
// (scripts/render-geometry-svg.py), вершины фигур подобраны вручную по
// узлам сетки на основе исходных иллюстраций.

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
    { sdamgiaId: '27436', hasImage: true,
        question: 'В параллелограмме $ABCD$ $AB=3$, $AD=21$, $\\sin A=\\frac{6}{7}$. Найдите большую высоту параллелограмма.',
        correct: '18', distractors: ['-18', '21', '14', '24', '7'] },
    { sdamgiaId: '27582', hasImage: true,
        question: 'Найдите площадь квадрата, если его диагональ равна 1.',
        correct: '0,5', distractors: ['1', '2', '0,25', '0,7', '-0,5'] },
    { sdamgiaId: '27601', hasImage: true,
        question: 'Площадь прямоугольника равна 18. Найдите его большую сторону, если она на 3 больше меньшей стороны.',
        correct: '6', distractors: ['3', '9', '12', '-6', '4,5'] },
    { sdamgiaId: '27603', hasImage: true,
        question: 'Найдите периметр прямоугольника, если его площадь равна 18, а отношение соседних сторон равно 1:2.',
        correct: '18', distractors: ['9', '24', '12', '15', '6'] },
    { sdamgiaId: '27604', hasImage: true,
        question: 'Периметр прямоугольника равен 42, а площадь 98. Найдите большую сторону прямоугольника.',
        correct: '14', distractors: ['7', '21', '49', '98', '28'] },
    { sdamgiaId: '27605', hasImage: true,
        question: 'Периметр прямоугольника равен 28, а диагональ равна 10. Найдите площадь этого прямоугольника.',
        correct: '48', distractors: ['24', '96', '14', '100', '56'] },
    { sdamgiaId: '27606', hasImage: true,
        question: 'Периметр прямоугольника равен 34, а площадь равна 60. Найдите диагональ этого прямоугольника.',
        correct: '13', distractors: ['17', '169', '12', '15', '26'] },
    { sdamgiaId: '27610', hasImage: true,
        question: 'Параллелограмм и прямоугольник имеют одинаковые стороны. Найдите острый угол параллелограмма, если его площадь равна половине площади прямоугольника. Ответ дайте в градусах.',
        correct: '30', distractors: ['60', '45', '15', '150', '120'] },
    { sdamgiaId: '27611', hasImage: true,
        question: 'Стороны параллелограмма равны 9 и 15. Высота, опущенная на первую сторону, равна 10. Найдите высоту, опущенную на вторую сторону параллелограмма.',
        correct: '6', distractors: ['9', '15', '10', '5', '18'] },
    { sdamgiaId: '27612', hasImage: true,
        question: 'Площадь параллелограмма равна 40, две его стороны равны 5 и 10. Найдите большую высоту этого параллелограмма.',
        correct: '8', distractors: ['4', '10', '5', '40', '2'] },
    { sdamgiaId: '27613', hasImage: true,
        question: 'Найдите площадь ромба, если его высота равна 2, а острый угол 30°.',
        correct: '8', distractors: ['4', '2', '16', '1', '6'] },
    { sdamgiaId: '27614', hasImage: true,
        question: 'Найдите площадь ромба, если его диагонали равны 4 и 12.',
        correct: '24', distractors: ['48', '16', '8', '12', '96'] },
    { sdamgiaId: '27615', hasImage: true,
        question: 'Площадь ромба равна 18. Одна из его диагоналей равна 12. Найдите другую диагональ.',
        correct: '3', distractors: ['6', '1,5', '36', '9', '4,5'] },
    { sdamgiaId: '27616', hasImage: true,
        question: 'Площадь ромба равна 6. Одна из его диагоналей в 3 раза больше другой. Найдите меньшую диагональ.',
        correct: '2', distractors: ['6', '1', '4', '3', '12'] },
    { sdamgiaId: '27806', hasImage: true,
        question: 'Сумма двух углов параллелограмма равна 100°. Найдите один из оставшихся углов. Ответ дайте в градусах.',
        correct: '130', distractors: ['50', '80', '260', '65', '100'] },
    { sdamgiaId: '27807', hasImage: true,
        question: 'Один угол параллелограмма больше другого на 70°. Найдите больший угол. Ответ дайте в градусах.',
        correct: '125', distractors: ['55', '70', '110', '140', '35'] },
    { sdamgiaId: '27808', hasImage: true,
        question: 'Диагональ параллелограмма образует с двумя его сторонами углы 26° и 34°. Найдите больший угол параллелограмма. Ответ дайте в градусах.',
        correct: '120', distractors: ['60', '30', '150', '8', '64'] },
    { sdamgiaId: '27809', hasImage: true,
        question: 'Периметр параллелограмма равен 46. Одна сторона параллелограмма на 3 больше другой. Найдите меньшую сторону параллелограмма.',
        correct: '10', distractors: ['13', '23', '20', '8', '15,5'] },
    { sdamgiaId: '27812', hasImage: true,
        question: 'Диагональ прямоугольника вдвое больше одной из его сторон. Найдите больший из углов, который образует диагональ со сторонами прямоугольника. Ответ выразите в градусах.',
        correct: '60', distractors: ['30', '45', '120', '15', '75'] },
    { sdamgiaId: '27817', hasImage: true,
        question: 'Найдите высоту ромба, сторона которого равна $\\sqrt{3}$, а острый угол равен 60°.',
        correct: '1,5', distractors: ['3', '0,75', '2,25', '0,5', '4,5'] },
    { sdamgiaId: '27822', hasImage: true,
        question: 'Найдите больший угол параллелограмма, если два его угла относятся как 3:7. Ответ дайте в градусах.',
        correct: '126', distractors: ['54', '63', '108', '42', '135'] },
    { sdamgiaId: '27823', hasImage: true,
        question: 'Найдите угол между биссектрисами углов параллелограмма, прилежащих к одной стороне. Ответ дайте в градусах.',
        correct: '90', distractors: ['45', '60', '100', '80', '120'] },
    { sdamgiaId: '27824', hasImage: true,
        question: 'Две стороны параллелограмма относятся как 3:4, а периметр его равен 70. Найдите большую сторону параллелограмма.',
        correct: '20', distractors: ['15', '35', '30', '10', '25'] },
    { sdamgiaId: '27826', hasImage: true,
        question: 'Биссектриса тупого угла параллелограмма делит противоположную сторону в отношении 4:3, считая от вершины острого угла. Найдите большую сторону параллелограмма, если его периметр равен 88.',
        correct: '28', distractors: ['16', '44', '22', '24', '32'] },
    { sdamgiaId: '27827', hasImage: true,
        question: 'Точка пересечения биссектрис двух углов параллелограмма, прилежащих к одной стороне, принадлежит противоположной стороне. Меньшая сторона параллелограмма равна 5. Найдите его большую сторону.',
        correct: '10', distractors: ['5', '15', '20', '2,5', '7,5'] },
    { sdamgiaId: '27828', hasImage: true,
        question: 'Найдите большую диагональ ромба, сторона которого равна $\\sqrt{3}$, а острый угол равен 60°.',
        correct: '3', distractors: ['1,7', '6', '9', '1,5', '4,5'] },
    { sdamgiaId: '27829', hasImage: true,
        question: 'Диагонали ромба относятся как 3:4. Периметр ромба равен 200. Найдите высоту ромба.',
        correct: '48', distractors: ['50', '60', '80', '24', '96'] },
    { sdamgiaId: '27845', hasImage: true,
        question: 'Диагонали четырёхугольника равны 4 и 5. Найдите периметр четырёхугольника, вершинами которого являются середины сторон данного четырёхугольника.',
        correct: '9', distractors: ['18', '4,5', '20', '10', '6'] },
    { sdamgiaId: '282851', hasImage: true,
        question: 'В ромбе $ABCD$ угол $ABC$ равен 122°. Найдите угол $ACD$. Ответ дайте в градусах.',
        correct: '29', distractors: ['58', '61', '122', '32', '44'] },
    { sdamgiaId: '282852', hasImage: true,
        question: 'В ромбе $ABCD$ угол $ACD$ равен 43°. Найдите угол $ABC$. Ответ дайте в градусах.',
        correct: '94', distractors: ['86', '47', '43', '137', '172'] },
    { sdamgiaId: '317338', hasImage: true,
        question: 'Площадь параллелограмма $ABCD$ равна 189. Точка $E$ — середина стороны $AD$. Найдите площадь трапеции $AECB$.',
        correct: '141,75', distractors: ['47,25', '94,5', '157,5', '126', '165,375'] },
    { sdamgiaId: '319056', hasImage: true,
        question: "Площадь параллелограмма $ABCD$ равна 153. Найдите площадь параллелограмма $A'B'C'D'$, вершинами которого являются середины сторон данного параллелограмма.",
        correct: '76,5', distractors: ['153', '38,25', '306', '51', '102'] },
    { sdamgiaId: '319057', hasImage: true,
        question: 'Площадь параллелограмма $ABCD$ равна 176. Точка $E$ — середина стороны $CD$. Найдите площадь треугольника $ADE$.',
        correct: '44', distractors: ['88', '22', '176', '66', '33'] },
    { sdamgiaId: '526245', hasImage: true,
        question: 'Угол между стороной и диагональю ромба равен 54°. Найдите острый угол ромба. Ответ дайте в градусах.',
        correct: '72', distractors: ['54', '108', '36', '18', '126'] },
    { sdamgiaId: '665285', hasImage: true,
        question: 'Площадь параллелограмма $ABCD$ равна 24. Точка $E$ — середина стороны $AD$. Найдите площадь трапеции $BCDE$.',
        correct: '18', distractors: ['6', '12', '20', '16', '21'] },
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 1 → Параллелограммы (35 задач)');

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Параллелограммы, прямоугольники, ромбы',
            unitId: UNIT_ID,
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
