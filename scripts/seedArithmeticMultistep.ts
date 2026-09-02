import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { MultistepStep } from '../app/t-lesson/[t_lessonId]/page';

const AUTHOR = 'Арифметика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type DecimalFrac = { decimal: string; num: number; den: number };

const decimalFracs: DecimalFrac[] = [
	{ decimal: '0{,}75', num: 3, den: 4 },
	{ decimal: '0{,}25', num: 1, den: 4 },
	{ decimal: '0{,}5', num: 1, den: 2 },
	{ decimal: '0{,}125', num: 1, den: 8 },
	{ decimal: '0{,}375', num: 3, den: 8 },
];

// Каждой дроби — пара кратных знаменателю целых чисел, чтобы деление
// "что останется от целого числа при сокращении" всегда было ровным.
const wholeNumbersByDen: Record<number, number[]> = {
	4: [32, 20],
	2: [22, 30],
	8: [48, 56],
};

function buildProblem(decimal: string, num: number, den: number, whole: number): { question: string; steps: MultistepStep[] } {
	const remainder = whole / den;
	const finalAnswer = num * remainder;

	const steps: MultistepStep[] = [
		{
			prompt: `Как умножить $${decimal} \\times ${whole}$? Сначала переведём ${decimal.replace('{,}', ',')} в обыкновенную дробь:`,
			formula: `${decimal} = \\dfrac{?}{${den}}`,
			answer: String(num),
		},
		{
			prompt: `Теперь умножаем дробь на целое число: $\\dfrac{${num}}{${den}} \\times \\dfrac{${whole}}{1}$. Сократим ${den} и ${whole} — что останется от ${whole}?`,
			cancelVisual: { leftNum: String(num), leftDen: String(den), rightNum: String(whole), rightDen: '1' },
			answer: String(remainder),
		},
		{
			prompt: 'Осталось перемножить то, что осталось:',
			formula: `${num} \\times ${remainder} = ?`,
			answer: String(finalAnswer),
		},
	];

	return {
		question: `Как умножить $${decimal} \\times ${whole}$?`,
		steps,
	};
}

const main = async () => {
	try {
		const course = await db.query.t_courses.findFirst({ where: eq(schema.t_courses.title, 'Арифметика') });
		if (!course) throw new Error('Курс "Арифметика" не найден — сначала запустите seedArithmeticTrainer.ts');

		const unit = await db.query.t_units.findFirst({
			where: and(eq(schema.t_units.title, 'Дроби и десятичные'), eq(schema.t_units.t_courseId, course.id)),
		});
		if (!unit) throw new Error('Юнит "Дроби и десятичные" не найден');

		const stageTitle = 'Этап 4: умножение по шагам';
		let lesson = await db.query.t_lessons.findFirst({
			where: and(eq(schema.t_lessons.title, stageTitle), eq(schema.t_lessons.t_unitId, unit.id)),
		});
		if (!lesson) {
			[lesson] = await db
				.insert(schema.t_lessons)
				.values({ title: stageTitle, t_unitId: unit.id, order: 4 })
				.returning();
		}

		let order = 1;
		for (const { decimal, num, den } of decimalFracs) {
			const wholes = wholeNumbersByDen[den];
			for (const whole of wholes) {
				const { question, steps } = buildProblem(decimal, num, den, whole);

				const [challenge] = await db
					.insert(schema.t_challenges)
					.values({
						t_lessonId: lesson.id,
						type: 'MULTISTEP',
						question,
						order: order++,
						points: 15,
						author: AUTHOR,
						numRans: '1',
						difficulty: '',
						imageSrc: '',
						stage: 1,
						multistepData: JSON.stringify(steps),
					})
					.returning();

				console.log(`Challenge ${challenge.id}: ${question} (шагов: ${steps.length})`);
			}
		}

		console.log(`Этап "${stageTitle}" (lesson ${lesson.id}) готов.`);
	} finally {
		await queryClient.end();
	}
};

main();
