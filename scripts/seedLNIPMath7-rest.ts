import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

const AUTHOR = 'ЛНИП Математика 7';
const COURSE_TITLE = 'ЛНИП Математика 7';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

type ProblemSpec = {
	unitTitle: string;
	unitDescription: string;
	lessonTitle: string;
	order: number;
	question: string;
	correct: string;
	distractors: string[];
};

const problems: ProblemSpec[] = [
	{
		unitTitle: 'Сокращение алгебраических дробей',
		unitDescription: 'Сокращение дробей через разность квадратов и упрощение полученного выражения',
		lessonTitle: 'Сокращение дроби и упрощение выражения',
		order: 3,
		question:
			'Сократите дробь и упростите выражение: $\\dfrac{9a^2-b^2}{3a+b} - 2b - 1$',
		correct: '3a-b-1',
		distractors: ['3a-3b-1', '3a+b-1', '3a-b+1', '9a-3b-1', '-3a+b+1'],
	},
	{
		unitTitle: 'Разложение на множители',
		unitDescription: 'Разложение многочленов на множители, приём "прибавить и вычесть"',
		lessonTitle: 'Разложение на множители x⁴+x²+1',
		order: 4,
		question: 'Разложите на множители: $x^4+x^2+1$',
		correct: '(x^2+x+1)(x^2-x+1)',
		distractors: [
			'(x^2+1)(x^2+1)',
			'(x^2+x-1)(x^2-x-1)',
			'(x^2+x+1)(x^2+x-1)',
			'x^2(x^2+1)+1',
			'(x-1)(x+1)(x^2+1)',
		],
	},
	{
		unitTitle: 'НОД и НОК чисел',
		unitDescription: 'Наибольший общий делитель и наименьшее общее кратное, проценты',
		lessonTitle: 'Сколько процентов НОД составляет от НОК',
		order: 5,
		question:
			'Определите, сколько процентов от наименьшего общего кратного чисел 360 и 8400 составляет наибольший общий делитель этих чисел (ответ округлите до сотых).',
		correct: '0,48',
		distractors: ['210', '4,76', '47,62', '1,20', '4,29'],
	},
	{
		unitTitle: 'Совместная работа',
		unitDescription: 'Задачи на совместную работу: заполнение бассейна через несколько труб',
		lessonTitle: 'Заполнение бассейна двумя трубами',
		order: 6,
		question:
			'Через одну трубу бассейн заполняется за 5 часов, а через вторую — за 4 часа. Через сколько часов бассейн заполнится на 90%, если открыть обе трубы одновременно?',
		correct: '2',
		distractors: ['4,5', '2,22', '1,8', '0,5', '20'],
	},
	{
		unitTitle: 'Треугольники: сумма углов',
		unitDescription: 'Внешний угол треугольника, соотношение сторон и углов',
		lessonTitle: 'Внешний угол треугольника MNK',
		order: 7,
		question:
			'В треугольнике MNK угол M равен полусумме двух других углов. Стороны угла M относятся как 2:1. Найдите внешний угол при вершине N (в градусах).',
		correct: '150',
		distractors: ['30', '60', '90', '120', '165'],
	},
	{
		unitTitle: 'Треугольники: перпендикуляр к стороне',
		unitDescription: 'Прямоугольные треугольники, теорема синусов, тождество sin·cos',
		lessonTitle: 'Перпендикуляр CP делит сторону AB',
		order: 8,
		question:
			'В треугольнике ABC угол A=15°, угол B=30°, BC=6,5 см. Перпендикуляр CP к AC делит сторону AB на части AP и PB. Найдите AP (в см).',
		correct: '13',
		distractors: ['12,56', '6,5', '10', '15', '13,5'],
	},
	{
		unitTitle: 'Комбинированные вычисления',
		unitDescription: 'Действия с обыкновенными дробями, смешанными числами и степенями',
		lessonTitle: 'Вычисление числового выражения (Вариант 2)',
		order: 9,
		question:
			'Вычислите (ответ округлите до сотых): $\\left(\\dfrac{3}{64} \\cdot 5\\dfrac{1}{3} - \\dfrac{1}{3}\\right) : \\left(\\dfrac{1}{3}\\right)^3 + (-1)^5$',
		correct: '-3,25',
		distractors: ['-2,25', '-1,25', '3,25', '-4,25', '9,75'],
	},
	{
		unitTitle: 'Алгебраические дроби (Вариант 2)',
		unitDescription: 'Упрощение выражений с алгебраическими дробями',
		lessonTitle: 'Упрощение алгебраической дроби (Вариант 2)',
		order: 10,
		question: 'Упростите выражение: $\\dfrac{2x-2y}{y} : \\dfrac{3y}{x^2-y^2}$',
		correct: '\\dfrac{2(x-y)^2(x+y)}{3y^2}',
		distractors: [
			'\\dfrac{2(x-y)(x+y)^2}{3y^2}',
			'\\dfrac{2(x-y)^2(x+y)}{3y}',
			'\\dfrac{(x-y)^2(x+y)}{3y^2}',
			'\\dfrac{2(x-y)^2}{3y^2}',
			'-\\dfrac{2(x-y)^2(x+y)}{3y^2}',
		],
	},
	{
		unitTitle: 'Сокращение дробей (Вариант 2)',
		unitDescription: 'Сокращение дробей через полный квадрат и разность квадратов',
		lessonTitle: 'Сокращение дроби через полный квадрат',
		order: 11,
		question:
			'Сократите дробь: $\\dfrac{a^2-2 \\cdot a+1-25b^2}{a-1-5b}$',
		correct: 'a+5b-1',
		distractors: ['a-5b-1', 'a+5b+1', 'a-1-5b', '5a+b-1', 'a-25b-1'],
	},
];

const main = async () => {
	try {
		const course = await db.query.courses.findFirst({
			where: eq(schema.courses.title, COURSE_TITLE),
		});
		if (!course) throw new Error('Курс не найден, сначала запустите seedLNIPMath7.ts');

		for (const p of problems) {
			let unit = await db.query.units.findFirst({
				where: eq(schema.units.title, p.unitTitle),
			});
			if (!unit) {
				[unit] = await db
					.insert(schema.units)
					.values({
						title: p.unitTitle,
						description: p.unitDescription,
						courseId: course.id,
						order: p.order,
						imageSrc: `LottieUnit${p.order}`,
					})
					.returning();
			}

			const [lesson] = await db
				.insert(schema.lessons)
				.values({ title: p.lessonTitle, unitId: unit.id, order: 1 })
				.returning();

			const [challenge] = await db
				.insert(schema.challenges)
				.values({
					lessonId: lesson.id,
					type: 'ASSIST',
					question: p.question,
					order: 1,
					points: 10,
					author: AUTHOR,
					difficulty: '',
					imageSrc: '',
				})
				.returning();

			const isFormula = p.correct.includes('\\') || p.correct.includes('^');
			const wrap = (t: string) => (isFormula ? `$${t}$` : t);

			const options = shuffle([
				{ text: wrap(p.correct), correct: true },
				...p.distractors.map((d) => ({ text: wrap(d), correct: false })),
			]);

			await db.insert(schema.challengeOptions).values(
				options.map((o) => ({
					challengeId: challenge.id,
					text: o.text,
					correct: o.correct,
				}))
			);

			console.log(`Unit "${p.unitTitle}" (${unit.id}) / Lesson (${lesson.id}) / Challenge (${challenge.id})`);
		}
	} finally {
		await queryClient.end();
	}
};

main();
