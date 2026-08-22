// scripts/seedEGE-unit6-lessons2-6.ts
//
// Оставшиеся 5 уроков юнита "Простейшие уравнения" (курс id=11, unit id=91,
// созданные в scripts/seedEGE-unit6-lesson1.ts): логарифмические,
// иррациональные, линейные/квадратные/кубические, рациональные,
// тригонометрические уравнения. Источник: scripts/data/type6.json.
//
// Запуск: npx tsx scripts/seedEGE-unit6-lessons2-6.ts

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

const COURSE_ID = 11;
const UNIT_ID = 91;
const AUTHOR = 'ЕГЭ Математика Профиль';

type ChallengeSeed = {
    question: string;
    correct: string;
    distractors: string[];
};

type LessonSeed = {
    title: string;
    order: number;
    challenges: ChallengeSeed[];
};

const lessons: LessonSeed[] = [
    {
        title: 'Логарифмические уравнения',
        order: 2,
        challenges: [
            { question: 'Найдите корень уравнения $\\large \\log_5(4+x)=2$', correct: '21', distractors: ['-21', '25', '4', '1', '29'] },
            { question: 'Найдите корень уравнения $\\large \\log_7(x+9)=\\log_7(2x-11)$', correct: '20', distractors: ['-20', '11', '9', '2', '22'] },
            { question: 'Найдите корень уравнения $\\large \\log_2(15+x)=\\log_2 3$', correct: '-12', distractors: ['12', '-3', '-18', '15', '-9'] },
            { question: 'Найдите корень уравнения $\\large \\log_{\\frac{1}{7}}(7-x)=-2$', correct: '-42', distractors: ['42', '-49', '-35', '7', '-56'] },
            { question: 'Найдите корень уравнения $\\large \\log_9(3+x)=\\log_9 11$', correct: '8', distractors: ['-8', '11', '3', '14', '5'] },
            { question: 'Решите уравнение $\\large \\log_5(x^2+2x)=\\log_5(x^2+10)$', correct: '5', distractors: ['-5', '10', '2', '0', '8'] },
            { question: 'Решите уравнение $\\large \\log_4(4+7x)=\\log_4(1+5x)+1$', correct: '0', distractors: ['-1', '1', '4', '-4', '13'] },
            { question: 'Найдите корень уравнения $\\large 2^{\\log_8(5x-3)}=4$', correct: '13,4', distractors: ['-13,4', '12,8', '13', '67', '6,7'] },
            { question: 'Найдите корень уравнения $\\large \\log_3(x^2+4x)=\\log_3(x^2+4)$', correct: '1', distractors: ['-1', '4', '0', '2', '-4'] },
            { question: 'Найдите корень уравнения $\\large \\log_{\\frac{1}{8}}(4-4x)=-2$', correct: '-15', distractors: ['15', '-60', '-16', '16', '-4'] },
            { question: 'Решите уравнение $\\large \\log_{27}\\left(3^{5x+5}\\right)=2$', correct: '0,2', distractors: ['-0,2', '1', '0,6', '-1', '2'] },
            { question: 'Найдите корень уравнения $\\large \\log_{11}(16+x)=\\log_{11} 12$', correct: '-4', distractors: ['4', '-16', '12', '-12', '8'] },
            { question: 'Найдите корень уравнения $\\large \\log_6(3+x)=\\log_6 11$', correct: '8', distractors: ['-8', '11', '3', '14', '5'] },
            { question: 'Найдите корень уравнения $\\large 3^{\\log_{27}(3x-2)}=7$', correct: '115', distractors: ['-115', '341', '343', '113', '117'] },
            { question: 'Решите уравнение $\\large \\log_x 27=3$', correct: '3', distractors: ['-3', '9', '27', '1', '6'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите меньший из корней: $\\large \\log_{x-7} 25=2$', correct: '12', distractors: ['2', '-12', '32', '7', '17'] },
            { question: 'Найдите корень уравнения $\\large \\log_4(x-4)=3$', correct: '68', distractors: ['-68', '64', '60', '4', '76'] },
        ],
    },
    {
        title: 'Иррациональные уравнения',
        order: 3,
        challenges: [
            { question: 'Найдите корень уравнения $\\large \\sqrt{15-2x}=3$', correct: '3', distractors: ['-3', '6', '9', '12', '0'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{\\frac{6}{2x-42}}=\\frac{1}{10}$', correct: '321', distractors: ['-321', '621', '21', '300', '342'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{\\frac{7x+28}{18}}=7$', correct: '122', distractors: ['-122', '130', '114', '49', '7'] },
            { question: 'Найдите корень уравнения. Если уравнение имеет более одного корня, укажите меньший из них: $\\large \\sqrt{-72+17x}=x$', correct: '8', distractors: ['9', '-8', '72', '4', '17'] },
            { question: 'Найдите корень уравнения. Если уравнение имеет более одного корня, укажите меньший из них: $\\large \\sqrt{-72-17x}=-x$', correct: '-9', distractors: ['-8', '9', '8', '-72', '-1'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt[3]{x-4}=3$', correct: '31', distractors: ['-31', '13', '23', '35', '27'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt[5]{x-3}=-2$', correct: '-29', distractors: ['29', '-35', '-32', '-3', '-27'] },
            { question: 'Решите уравнение $\\large \\sqrt{x-2}=6$', correct: '38', distractors: ['-38', '34', '36', '40', '8'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{-4-5x}=4$', correct: '-4', distractors: ['4', '-3', '-5', '16', '0'] },
            { question: 'Решите уравнение: $\\large \\sqrt{\\frac{1}{1-5x}}=\\frac{1}{6}$', correct: '-7', distractors: ['7', '-35', '-6', '5', '1'] },
            { question: 'Решите уравнение: $\\large \\sqrt[3]{x+2}=-2$', correct: '-10', distractors: ['10', '-6', '-2', '-12', '6'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{37+7x}=4$', correct: '-3', distractors: ['3', '-4', '-1', '16', '-7'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt[3]{x+9}=5$', correct: '116', distractors: ['-116', '125', '9', '5', '106'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите меньший из корней: $\\large \\sqrt{-40+13x}=x$', correct: '5', distractors: ['8', '-5', '40', '13', '3'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{\\frac{4}{4-7x}}=0{,}4$', correct: '-3', distractors: ['3', '-25', '-4', '4', '-1'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{73-x}=x-1$', correct: '9', distractors: ['-9', '8', '73', '1', '-8'] },
            { question: 'Найдите корень уравнения $\\large \\sqrt{6x-57}=9$', correct: '23', distractors: ['-23', '19', '27', '81', '9,5'] },
        ],
    },
    {
        title: 'Линейные, квадратные, кубические уравнения',
        order: 4,
        challenges: [
            { question: 'Найдите корень уравнения: $\\large -\\frac{2}{9}x=1\\frac{1}{9}$', correct: '-5', distractors: ['5', '-10', '-9', '1', '-4,5'] },
            { question: 'Найдите корень уравнения: $\\large \\frac{8}{9}x=18\\frac{2}{3}$', correct: '21', distractors: ['-21', '18', '9', '24', '8'] },
            { question: 'Найдите корень уравнения: $\\large \\frac{4}{7}x=7\\frac{3}{7}$', correct: '13', distractors: ['-13', '7', '4', '52', '9'] },
            { question: 'Найдите корень уравнения: $\\large -\\frac{2}{9}x=1\\frac{1}{9}$', correct: '-5', distractors: ['5', '-9', '-1', '2', '-10'] },
            { question: 'Найдите корень уравнения. Если уравнение имеет более одного корня, укажите больший из них: $\\large x^2-2x-35=0$', correct: '7', distractors: ['-5', '35', '5', '-7', '12'] },
            { question: 'Решите уравнение $\\large (x-6)^2=-24x$', correct: '-6', distractors: ['6', '-12', '12', '0', '-36'] },
            { question: 'Решите уравнение $\\large x^2+9=(x+9)^2$', correct: '-4', distractors: ['4', '-9', '9', '-72', '-2'] },
            { question: 'Решите уравнение $\\large (x+12)^2=48x$', correct: '12', distractors: ['-12', '24', '48', '0', '6'] },
            { question: 'Решите уравнение $\\large x^2-9=(x+3)^2$', correct: '-3', distractors: ['3', '-9', '9', '-18', '-6'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите меньший из корней: $\\large \\frac{1}{5}x^2=16\\frac{1}{5}$', correct: '-9', distractors: ['9', '-81', '81', '-3', '-16'] },
            { question: 'Найдите корень уравнения $\\large (x+8)^5=243$', correct: '-5', distractors: ['5', '-3', '-13', '3', '-11'] },
            { question: 'Найдите корень уравнения $\\large (x-7)^9=-512$', correct: '5', distractors: ['-5', '9', '-9', '7', '2'] },
            { question: 'Найдите корень уравнения $\\large (2x-3)^2=(2x+9)^2$', correct: '-1,5', distractors: ['1,5', '-3', '3', '-0,5', '-12'] },
            { question: 'Найдите корень уравнения $\\large (x-10)^2=(x+4)^2$', correct: '3', distractors: ['-3', '10', '-4', '84', '14'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите меньший из корней: $\\large \\frac{1}{14}x^2=16\\frac{1}{14}$', correct: '-15', distractors: ['15', '-225', '225', '-1', '-16'] },
            { question: 'Найдите корень уравнения $\\large (x+9)^3=-216$', correct: '-15', distractors: ['15', '-6', '-3', '6', '-24'] },
            { question: 'Найдите корень уравнения $\\large (x-13)^3=64$', correct: '17', distractors: ['-17', '4', '9', '-4', '21'] },
        ],
    },
    {
        title: 'Рациональные уравнения',
        order: 5,
        challenges: [
            { question: 'Найдите корень уравнения: $\\large \\frac{x+3}{x+7}=-3$', correct: '-6', distractors: ['6', '-3', '-7', '3', '-24'] },
            { question: 'Найдите корень уравнения. Если уравнение имеет более одного корня, в ответе укажите больший из них: $\\large x=\\frac{6x-15}{x-2}$', correct: '5', distractors: ['3', '-5', '15', '-3', '2'] },
            { question: 'Найдите корень уравнения. Если уравнение имеет более одного корня, в ответе запишите меньший из корней: $\\large \\frac{2}{x^2-14}=1$', correct: '-4', distractors: ['4', '-16', '16', '-2', '14'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите больший из корней: $\\large \\frac{25x}{x^2+24}=1$', correct: '24', distractors: ['1', '-24', '25', '-1', '12'] },
            { question: 'Найдите корень уравнения: $\\large \\frac{1}{4x+3}=\\frac{1}{3}$', correct: '0', distractors: ['3', '-3', '1', '-0,75', '0,75'] },
            { question: 'Найдите корень уравнения: $\\large \\frac{1}{2x-11}=\\frac{1}{3}$', correct: '7', distractors: ['-7', '11', '14', '3', '4'] },
            { question: 'Найдите корень уравнения: $\\large \\frac{1}{2x+3}=2$', correct: '-1,25', distractors: ['1,25', '-3', '0,5', '-2,5', '2'] },
            { question: 'Найдите корень уравнения $\\large \\frac{1}{3x-4}=\\frac{1}{4x-11}$', correct: '7', distractors: ['-7', '4', '11', '-4', '15'] },
            { question: 'Найдите корень уравнения $\\large \\frac{1}{10x+6}=1$', correct: '-0,5', distractors: ['0,5', '-0,6', '0,1', '-1', '5'] },
            { question: 'Найдите корень уравнения $\\large \\frac{1}{7x+3}=5$', correct: '-0,4', distractors: ['0,4', '-0,6', '0,2', '-3', '5'] },
            { question: 'Найдите корень уравнения $\\large \\frac{1}{2x+5}=\\frac{1}{3x-5}$', correct: '10', distractors: ['-10', '5', '-5', '15', '2'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите больший из корней: $\\large \\frac{7x}{2x^2-15}=1$', correct: '10', distractors: ['-1,5', '15', '-10', '7', '2,5'] },
            { question: 'Найдите корень уравнения $\\large 3^{2-x}=81$', correct: '-2', distractors: ['2', '-4', '4', '-6', '6'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответе запишите меньший из корней: $\\large \\frac{13}{x^2+12}=1$', correct: '-1', distractors: ['1', '-13', '13', '-12', '12'] },
            { question: 'Решите уравнение. Если уравнение имеет больше одного корня, в ответе запишите меньший из корней: $\\large x=\\frac{-4x+18}{x-1}$', correct: '-6', distractors: ['3', '-18', '18', '-3', '6'] },
            { question: 'Решите уравнение. Если уравнение имеет более одного корня, в ответ запишите больший корень: $\\large \\frac{x+6}{4x+1{,}1}=\\frac{x+6}{3x+1}$', correct: '-0,1', distractors: ['-6', '0,1', '6', '-1,1', '-17'] },
            { question: 'Найдите корень уравнения $\\large \\frac{x+89}{x-7}=\\frac{-5}{x-7}$', correct: '-94', distractors: ['94', '-89', '-5', '7', '-84'] },
        ],
    },
    {
        title: 'Тригонометрические уравнения',
        order: 6,
        challenges: [
            { question: 'Найдите корень уравнения. В ответе запишите наибольший отрицательный корень: $\\large \\cos\\frac{\\pi(x-1)}{3}=\\frac{1}{2}$', correct: '-4', distractors: ['-2', '-6', '4', '-8', '-10'] },
            { question: 'Найдите корень уравнения. В ответе запишите наибольший отрицательный корень: $\\large \\cos\\frac{\\pi(x+1)}{4}=\\frac{\\sqrt{2}}{2}$', correct: '-2', distractors: ['-8', '2', '-10', '-6', '6'] },
            { question: 'Найдите корень уравнения. В ответе запишите наибольший отрицательный корень: $\\large \\cos\\frac{\\pi(4x+1)}{6}=\\frac{\\sqrt{3}}{2}$', correct: '-0,5', distractors: ['-3', '0,5', '-3,5', '3', '-2,5'] },
            { question: 'Найдите корни уравнения. В ответе запишите наибольший отрицательный корень: $\\large \\cos\\frac{8\\pi x}{6}=\\frac{\\sqrt{3}}{2}$', correct: '-0,125', distractors: ['-1,375', '0,125', '-1,625', '1,375', '-0,875'] },
            { question: 'Найдите корни уравнения. В ответе запишите наибольший отрицательный корень: $\\large \\cos\\frac{\\pi(x-7)}{3}=\\frac{1}{2}$', correct: '-4', distractors: ['-6', '4', '-10', '-2', '8'] },
            { question: 'Решите уравнение. В ответе напишите наименьший положительный корень: $\\large \\sin\\frac{\\pi x}{3}=0{,}5$', correct: '0,5', distractors: ['2,5', '-0,5', '6,5', '1', '5,5'] },
            { question: 'Решите уравнение. В ответе напишите наибольший отрицательный корень: $\\large \\tan\\frac{\\pi(x+2)}{3}=-\\sqrt{3}$', correct: '-3', distractors: ['-6', '3', '0', '-9', '-1'] },
            { question: 'Решите уравнение. В ответе напишите наибольший отрицательный корень: $\\large \\tan\\frac{\\pi(x-3)}{6}=\\frac{1}{\\sqrt{3}}$', correct: '-2', distractors: ['-8', '2', '-14', '4', '-1'] },
            { question: 'Решите уравнение. В ответе напишите наибольший отрицательный корень: $\\large \\tan\\frac{\\pi(4x-5)}{4}=-1$', correct: '-1', distractors: ['-2', '1', '-3', '0', '2'] },
            { question: 'Решите уравнение. В ответе напишите наибольший отрицательный корень: $\\large \\tan\\frac{\\pi(x+3)}{3}=-\\sqrt{3}$', correct: '-1', distractors: ['-4', '2', '-7', '1', '-10'] },
            { question: 'Решите уравнение. В ответе напишите наибольший отрицательный корень: $\\large \\sin\\frac{\\pi(4x-3)}{4}=1$', correct: '-0,75', distractors: ['-1,25', '0,75', '-2,75', '1,25', '-3,75'] },
            { question: 'Решите уравнение. В ответе напишите наименьший положительный корень: $\\large \\sin\\frac{\\pi(8x+3)}{6}=0{,}5$', correct: '0,25', distractors: ['-0,25', '1,25', '-1,75', '0,75', '1,75'] },
            { question: 'Решите уравнение. В ответе напишите наименьший положительный корень: $\\large \\sin\\frac{\\pi(x+9)}{4}=-\\frac{\\sqrt{2}}{2}$', correct: '4', distractors: ['-4', '6', '12', '-6', '2'] },
            { question: 'Решите уравнение. В ответе напишите наименьший положительный корень: $\\large \\sin\\frac{\\pi(2x-3)}{6}=-0{,}5$', correct: '1', distractors: ['-1', '5', '-5', '7', '3'] },
        ],
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
        console.log('Seeding: ЕГЭ Математика Профиль → Unit 6 → 5 lessons');

        for (const lessonSeed of lessons) {
            const [lesson] = await db.insert(schema.lessons).values({
                title: lessonSeed.title,
                unitId: UNIT_ID,
                order: lessonSeed.order,
            }).returning();
            console.log(`lesson: ${lesson.id} "${lesson.title}"`);

            for (let i = 0; i < lessonSeed.challenges.length; i++) {
                const c = lessonSeed.challenges[i];
                const [challenge] = await db.insert(schema.challenges).values({
                    lessonId: lesson.id,
                    type: 'ASSIST',
                    question: c.question,
                    order: i + 1,
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
                    }))
                );

                console.log(`  [${i + 1}/${lessonSeed.challenges.length}] challenge ${challenge.id} — "${c.correct}"`);
            }
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
