// scripts/seedOGEMath-unit7.ts
//
// Курс "ОГЭ Математика" (новый) — Unit 7 "Сравнение и оценка чисел" —
// 50 задач с https://math-oge.sdamgia.ru/test?id=82292606&nt=True&pub=False
// (все "Тип 7" ОГЭ — "оцените/сравните число на координатной прямой").
//
// В отличие от прошлых ЕГЭ-скриптов, у ЭТИХ задач варианты ответа —
// ГОТОВЫЕ (официальные, прямо в тексте задачи "1)...2)...3)...4)..."), не
// изобретаются дистракторы — просто 4 варианта как есть на sdamgia,
// текст ответа "N" в исходнике = номер (1-4) верного варианта.
//
// Разбито на 4 урока по методу решения (не по формальной подтеме
// sdamgia — там всё "Тип 7" одним потоком):
// 1. "Оценка числа без картинки" (16) — оценить величину корня/дроби,
//    сравнить с целыми/промежутком, без иллюстрации вообще.
// 2. "Одно число на координатной прямой" (11) — точка a на прямой
//    (позиция без явного значения), выбрать верное утверждение-
//    неравенство про неё.
// 3. "Несколько чисел на координатной прямой" (7) — 2-3 точки
//    (a,b,c / x,y,z), сравнение через знак разности/утверждение.
// 4. "Сопоставь число и точку" (16) — по картинке с несколькими
//    точками (или явным точкам-кандидатам) найти, какое число
//    соответствует какой точке.
//
// Диаграммы (34 из 50 задач с картинкой) — НЕ скопированы с оригинала
// (тот рисует SVG векторными путями без <text>, буквы — обрисованные
// глифы), а перерисованы с нуля новым переиспользуемым рендерером
// `scripts/svg-tools/render_numberline.py` (числовая прямая: деления,
// подписи целых/дробных, отмеченные точки-буквы) в стиле проекта
// (тёмный фон, голубой акцент #7dd3fc для точек — та же роль, что у
// оригинала играет оранжевый). Позиции точек не скопированы пиксель-в-
// пиксель с оригинала (там нечитаемо без OCR) — просчитаны заново
// напрямую из математики: где сохранился явный список чисел-кандидатов
// (задания "сопоставь число и точку"), точка стоит на ТОЧНО вычисленном
// верном значении (корень/дробь) на собственной шкале; где на картинке
// абстрактная точка "a" без числового смысла (задания "какое
// утверждение верно"), её положение подобрано так, чтобы на шкале было
// верно РОВНО заявленное утверждение и заведомо неверны остальные три
// (проверено алгебраически для каждой задачи, не на глаз). Для двух
// задач (322425 "c,b,a" и 448839 "z,y,x" — тройки-перестановки одних и
// тех же трёх букв в разном порядке) отдельно сверен порядок точек на
// оригинале через прямой рендер в Browser pane (буквы на оригинале
// рисуются глифами-путями, легко перепутать на глаз) — не предполагался
// заранее по одному только совпадению букв с похожей задачей.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const AUTHOR = 'ОГЭ Математика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type ChallengeSeed = {
    question: string;
    image: string;
    options: string[];
    correctIndex: number;
};

const lesson1Challenges: ChallengeSeed[] = [
    {
        question: 'Какому из данных промежутков принадлежит число $\\frac{2}{9}$?',
        image: '',
        options: ['[0,1; 0,2]', '[0,2; 0,3]', '[0,3; 0,4]', '[0,4; 0,5]'],
        correctIndex: 1, // sdamgia id=287938
    },
    {
        question: 'Между какими числами заключено число $\\sqrt{98}$',
        image: '',
        options: ['4 и 5', '9 и 10', '31 и 33', '97 и 99'],
        correctIndex: 1, // sdamgia id=340882
    },
    {
        question: 'Между какими числами заключено число $\\sqrt{59}$',
        image: '',
        options: ['7 и 8', '29 и 30', '58 и 60', '3 и 4'],
        correctIndex: 0, // sdamgia id=424904
    },
    {
        question: 'Какое из данных чисел принадлежит промежутку [7; 8]?',
        image: '',
        options: ['$\\sqrt{7}$', '$\\sqrt{8}$', '$\\sqrt{42}$', '$\\sqrt{61}$'],
        correctIndex: 3, // sdamgia id=406570
    },
    {
        question: 'Какое из следующих чисел заключено между числами $\\frac{13}{15}$ и $\\frac{18}{19}$ ?',
        image: '',
        options: ['0,9', '1', '1,1', '1,2'],
        correctIndex: 0, // sdamgia id=341699
    },
    {
        question: 'Между какими целыми числами заключено число $\\frac{130}{11}$',
        image: '',
        options: ['10 и 11', '11 и 12', '12 и 13', '13 и 14'],
        correctIndex: 1, // sdamgia id=461862
    },
    {
        question: 'Какое из данных ниже чисел принадлежит отрезку [3; 4]?',
        image: '',
        options: ['$\\frac{45}{19}$', '$\\frac{52}{19}$', '$\\frac{68}{19}$', '$\\frac{77}{19}$'],
        correctIndex: 2, // sdamgia id=369728
    },
    {
        question: 'Какое из данных ниже чисел принадлежит отрезку [8; 9]?',
        image: '',
        options: ['$\\frac{46}{7}$', '$\\frac{53}{7}$', '$\\frac{55}{7}$', '$\\frac{61}{7}$'],
        correctIndex: 3, // sdamgia id=369825
    },
    {
        question: 'Какое из данных ниже чисел принадлежит отрезку [4; 5]?',
        image: '',
        options: ['$\\frac{58}{17}$', '$\\frac{72}{17}$', '$\\frac{87}{17}$', '$\\frac{91}{17}$'],
        correctIndex: 1, // sdamgia id=369854
    },
    {
        question: 'Какое из следующих чисел заключено между числами $\\frac{8}{3}$ и $\\frac{11}{4}$',
        image: '',
        options: ['2,7', '2,8', '2,9', '3'],
        correctIndex: 0, // sdamgia id=341488
    },
    {
        question: 'Между какими числами заключено число $\\sqrt{30}$?',
        image: '',
        options: ['11 и 13', '5 и 6', '2 и 3', '29 и 31'],
        correctIndex: 1, // sdamgia id=353115
    },
    {
        question: 'Какое из данных чисел принадлежит промежутку $[ 5;6 ]$?',
        image: '',
        options: ['$\\sqrt{5}$', '$\\sqrt{6}$', '$\\sqrt{27}$', '$\\sqrt{37}$'],
        correctIndex: 2, // sdamgia id=352624
    },
    {
        question: 'Между какими целыми числами заключено число $\\frac{131}{12}$',
        image: '',
        options: ['10 и 11', '11 и 12', '12 и 13', '13 и 14'],
        correctIndex: 0, // sdamgia id=461837
    },
    {
        question: 'Какому промежутку принадлежит число $\\sqrt{53}$',
        image: '',
        options: ['[4; 5]', '[5; 6]', '[6; 7]', '[7; 8]'],
        correctIndex: 3, // sdamgia id=317223
    },
    {
        question: 'Между какими числами заключено число $\\sqrt{56}$',
        image: '',
        options: ['55 и 57', '3 и 4', '19 и 21', '7 и 8'],
        correctIndex: 3, // sdamgia id=424992
    },
    {
        question: 'Какому из данных промежутков принадлежит число $\\frac{7}{11}$?',
        image: '',
        options: ['[0,4; 0,5]', '[0,5; 0,6]', '[0,6; 0,7]', '[0,7; 0,8]'],
        correctIndex: 2, // sdamgia id=353058
    },
];

const lesson2Challenges: ChallengeSeed[] = [
    {
        question: 'На координатной прямой отмечено число a. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_311418.svg',
        options: ['$a + 4 > 0$', '$a + 5 < 0$', '$2 - a > 0$', '$3 - a < 0$'],
        correctIndex: 2, // sdamgia id=311418
    },
    {
        question: 'На координатной прямой отмечено число a. Какое из утверждений для этого числа является верным?',
        image: 'oge7_448931.svg',
        options: ['$a - 6 < 0$', '$6 - a > 0$', '$a - 7 > 0$', '$8 - a < 0$'],
        correctIndex: 2, // sdamgia id=448931
    },
    {
        question: 'На координатной прямой отмечено число a. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_341398.svg',
        options: ['$a - 8 > 0$', '$7 - a < 0$', '$a - 3 > 0$', '$2 - a > 0$'],
        correctIndex: 2, // sdamgia id=341398
    },
    {
        question: 'На координатной прямой отмечено число а. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_311749.svg',
        options: ['$- a < 2$', '$- 1 - a > 0$', '$\\frac{1}{a} > 0$', '$a + 3 < 0$'],
        correctIndex: 1, // sdamgia id=311749
    },
    {
        question: 'На координатной прямой отмечено число a. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_311421.svg',
        options: ['$a - 3 > 0$', '$6 - a < 0$', '$a - 7 > 0$', '$4 - a > 0$'],
        correctIndex: 0, // sdamgia id=311421
    },
    {
        question: 'На координатной прямой отмечено число а. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_311779.svg',
        options: ['$- a < 1$', '$- 2 - a > 0$', '$\\frac{1}{a} < 0$', '$a + 4 < 0$'],
        correctIndex: 2, // sdamgia id=311779
    },
    {
        question: 'На координатной прямой отмечено число а. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_311837.svg',
        options: ['$- a > - 5$', '$6 - a < 0$', '$\\frac{1}{a} < 0$', '$a - 3 > 0$'],
        correctIndex: 3, // sdamgia id=311837
    },
    {
        question: 'На координатной прямой отмечено число a. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_436848.svg',
        options: ['$4 - a > 0$', '$4 - a < 0$', '$a - 3 < 0$', '$a - 6 > 0$'],
        correctIndex: 1, // sdamgia id=436848
    },
    {
        question: 'На координатной прямой отмечено число a. Какое из утверждений относительно этого числа является верным?',
        image: 'oge7_316273.svg',
        options: ['$- a > - 6$', '$9 - a < 0$', '$\\frac{1}{a} > 0$', '$a - 8 > 0$'],
        correctIndex: 2, // sdamgia id=316273
    },
    {
        question: 'На координатной прямой отмечены числа a и b. Какое из приведенных утверждений неверно?',
        image: 'oge7_317584.svg',
        options: ['$ab^2 < 0$', '$a - b > 0$', '$a + b < 0$', '$ab < 0$'],
        correctIndex: 0, // sdamgia id=317584
    },
    {
        question: 'На координатной прямой отмечено число a. Найдите наибольшее из чисел $a^2 , a^3 , a^{4}$',
        image: 'oge7_353368.svg',
        options: ['$a^2$', '$a^3$', '$a^{4}$', 'не хватает данных для ответа'],
        correctIndex: 0, // sdamgia id=353368
    },
];

const lesson3Challenges: ChallengeSeed[] = [
    {
        question: 'На координатной прямой отмечены числа a, b, и c. Укажите номер верного утверждения.',
        image: 'oge7_322417.svg',
        options: ['$a + b > 0$', '$\\frac{1}{b} > \\frac{1}{c}$', '$ab < 0$', '$( a - b ) c < 0$'],
        correctIndex: 3, // sdamgia id=322417
    },
    {
        question: 'На координатной прямой отмечены числа a, b и c. Какая из разностей a - b, a - c, c - b отрицательна?',
        image: 'oge7_322425.svg',
        options: ['$a - b$', '$a - c$', '$c - b$', 'ни одна из них'],
        correctIndex: 2, // sdamgia id=322425
    },
    {
        question: 'На координатной прямой отмечены числа x, y и z. Какая из разностей z - x, y - z, x - y отрицательна?',
        image: 'oge7_448839.svg',
        options: ['$z - x$', '$y - z$', '$x - y$', 'ни одна из них'],
        correctIndex: 0, // sdamgia id=448839
    },
    {
        question: 'На координатной прямой отмечены числа x, y и z. Какая из разностей z - x, z - y, y - x отрицательна?',
        image: 'oge7_322418.svg',
        options: ['$z - x$', '$z - y$', '$y - x$', 'ни одна из них'],
        correctIndex: 3, // sdamgia id=322418
    },
    {
        question: 'На координатной прямой отмечены числа a и b. Какое из следующих утверждений относительно этих чисел является верным?',
        image: 'oge7_339306.svg',
        options: ['$a^{3} > 0$', '$a - b > 0$', '$ab < 1$', '$a + b > 1$'],
        correctIndex: 2, // sdamgia id=339306
    },
    {
        question: 'На координатной прямой отмечены числа a и b. Какое из следующих утверждений относительно этих чисел является верным?',
        image: 'oge7_352829.svg',
        options: ['$b - a < 0$', '$a^2 - b^2 < 0$', '$\\frac{1}{a} < b$', '$a + b < 0$'],
        correctIndex: 1, // sdamgia id=352829
    },
    {
        question: 'На координатной прямой отмечены числа a, b и с. Из следующих утверждений выберите верное.',
        image: 'oge7_322538.svg',
        options: ['$a - c > 0$', '$c - a < 0$', '$a - b < 0$', '$b - c > 0$'],
        correctIndex: 2, // sdamgia id=322538
    },
];

const lesson4Challenges: ChallengeSeed[] = [
    {
        question: 'На координатной прямой точками A, B, C и D отмечены числа -0,74; -0,047; 0,07; -0,407. Какой точкой изображается число -0,047?',
        image: 'oge7_350257.svg',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 2, // sdamgia id=350257
    },
    {
        question: 'Одно из чисел $\\frac{5}{6} , \\frac{5}{7} , \\frac{5}{9} , \\frac{5}{12}$ отмечено на координатной прямой точкой A. Укажите это число.',
        image: 'oge7_311392.svg',
        options: ['$\\frac{5}{6}$', '$\\frac{5}{7}$', '$\\frac{5}{9}$', '$\\frac{5}{12}$'],
        correctIndex: 2, // sdamgia id=311392
    },
    {
        question: 'Одна из точек, отмеченных на координатной прямой, соответствует числу $\\sqrt{61}$ Какая это точка?',
        image: 'oge7_314157.svg',
        options: ['точка M', 'точка N', 'точка P', 'точка Q'],
        correctIndex: 3, // sdamgia id=314157
    },
    {
        question: 'На координатной прямой отмечена точка А, которая соответствует одному из чисел, указанных ниже. Какому числу она соответствует?',
        image: 'oge7_333002.svg',
        options: ['$\\frac{2}{7}$', '$\\frac{4}{7}$', '$\\frac{10}{7}$', '$\\frac{11}{7}$'],
        correctIndex: 0, // sdamgia id=333002
    },
    {
        question: 'Какому из следующих чисел соответствует точка, отмеченная на координатной прямой?',
        image: 'oge7_317074.svg',
        options: ['$\\frac{10}{23}$', '$\\frac{12}{23}$', '$\\frac{13}{23}$', '$\\frac{14}{23}$'],
        correctIndex: 2, // sdamgia id=317074
    },
    {
        question: 'На координатной прямой отмечены точки A, B, C, D. Одна из них соответствует числу $\\frac{58}{7}$ Какая это точка?',
        image: 'oge7_474133.svg',
        options: ['точка A', 'точка B', 'точка C', 'точка D'],
        correctIndex: 2, // sdamgia id=474133
    },
    {
        question: 'Одна из точек, отмеченных на координатной прямой, соответствует числу $\\frac{3}{8}$ Какая это точка?',
        image: 'oge7_311380.svg',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 2, // sdamgia id=311380
    },
    {
        question: 'Одно из чисел $\\frac{81}{17} , \\frac{90}{17} , \\frac{99}{17} , \\frac{108}{17}$ отмечено на прямой точкой. Укажите это число.',
        image: 'oge7_355545.svg',
        options: ['$\\frac{81}{17}$', '$\\frac{90}{17}$', '$\\frac{99}{17}$', '$\\frac{108}{17}$'],
        correctIndex: 1, // sdamgia id=355545
    },
    {
        question: 'Какому из следующих чисел соответствует точка, отмеченная на координатной прямой?',
        image: 'oge7_356006.svg',
        options: ['$\\frac{5}{9}$', '$\\frac{11}{9}$', '$\\frac{13}{9}$', '$\\frac{14}{9}$'],
        correctIndex: 0, // sdamgia id=356006
    },
    {
        question: 'Одна из точек, отмеченных на координатной прямой, соответствует числу $\\sqrt{77}$ Какая это точка?',
        image: 'oge7_314146.svg',
        options: ['точка A', 'точка B', 'точка C', 'точка D'],
        correctIndex: 3, // sdamgia id=314146
    },
    {
        question: 'На координатной прямой точками отмечены числа $\\frac{7}{3} ; \\frac{9}{7} ;1,82;2,5$. Какому числу соответствует точка B?',
        image: 'oge7_352558.svg',
        options: ['$\\frac{7}{3}$', '$\\frac{9}{7}$', '$1,82$', '$2,5$'],
        correctIndex: 2, // sdamgia id=352558
    },
    {
        question: 'Какое из чисел отмечено на координатной прямой точкой A?',
        image: 'oge7_205776.svg',
        options: ['$\\sqrt{2}$', '$\\sqrt{3}$', '$\\sqrt{7}$', '$\\sqrt{11}$'],
        correctIndex: 1, // sdamgia id=205776
    },
    {
        question: 'Какому из следующих чисел соответствует точка, отмеченная на координатной прямой?',
        image: 'oge7_340971.svg',
        options: ['$\\frac{12}{23}$', '$\\frac{13}{23}$', '$\\frac{17}{23}$', '$\\frac{10}{23}$'],
        correctIndex: 1, // sdamgia id=340971
    },
    {
        question: 'На координатной прямой точками отмечены числа $\\frac{5}{8} ; \\frac{4}{3} ;1,44;0,84$. Какому числу соответствует точка B?',
        image: 'oge7_352658.svg',
        options: ['$\\frac{5}{8}$', '$\\frac{4}{3}$', '$1,44$', '$0,84$'],
        correctIndex: 3, // sdamgia id=352658
    },
    {
        question: 'Одно из чисел $\\frac{58}{13} , \\frac{69}{13} , \\frac{76}{13} , \\frac{83}{13}$ отмечено на прямой точкой. Укажите это число.',
        image: 'oge7_355546.svg',
        options: ['$\\frac{58}{13}$', '$\\frac{69}{13}$', '$\\frac{76}{13}$', '$\\frac{83}{13}$'],
        correctIndex: 2, // sdamgia id=355546
    },
    {
        question: 'Одна из точек, отмеченных на координатной прямой, соответствует числу $\\sqrt{45}$ Какая это точка?',
        image: 'oge7_314155.svg',
        options: ['точка M', 'точка N', 'точка P', 'точка Q'],
        correctIndex: 1, // sdamgia id=314155
    },
];

const main = async () => {
    try {
        console.log('Seeding: ОГЭ Математика → Unit 7 "Сравнение и оценка чисел"');

        let [course] = await db.query.courses.findMany({
            where: (c, { eq }) => eq(c.title, 'ОГЭ Математика'),
        });
        if (!course) {
            [course] = await db.insert(schema.courses).values({
                title: 'ОГЭ Математика',
                imageSrc: '/CourseImgs/m11_ege.jpeg',
            }).returning();
            console.log(`course created: ${course.id} "${course.title}"`);
        } else {
            console.log(`course exists: ${course.id} "${course.title}"`);
        }

        const [unit] = await db.insert(schema.units).values({
            title: '7. Сравнение и оценка чисел',
            description: 'Координатная прямая: оценка корней и дробей, сравнение чисел',
            imageSrc: 'LottieUnit3',
            courseId: course.id,
            order: 7,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const lessonDefs: { title: string; challenges: ChallengeSeed[] }[] = [
            { title: 'Оценка числа без картинки', challenges: lesson1Challenges },
            { title: 'Одно число на координатной прямой', challenges: lesson2Challenges },
            { title: 'Несколько чисел на координатной прямой', challenges: lesson3Challenges },
            { title: 'Сопоставь число и точку', challenges: lesson4Challenges },
        ];

        for (let li = 0; li < lessonDefs.length; li++) {
            const { title, challenges } = lessonDefs[li];
            const [lesson] = await db.insert(schema.lessons).values({
                title,
                unitId: unit.id,
                order: li + 1,
            }).returning();
            console.log(`lesson: ${lesson.id} "${lesson.title}" (${challenges.length} задач)`);

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
                    imageSrc: c.image ? `/geometry/${c.image}` : '',
                }).returning();

                await db.insert(schema.challengeOptions).values(
                    c.options.map((text, idx) => ({
                        challengeId: challenge.id,
                        text,
                        correct: idx === c.correctIndex,
                        imageSrc: '',
                        audioSrc: '',
                    }))
                );
            }
        }

        console.log('Готово.');
    } finally {
        await queryClient.end();
    }
};

main();
