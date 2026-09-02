import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';

const AUTHOR = 'Арифметика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type Fact = { question: string; answer: string };

function multiplicationFacts(numbers: number[]): Fact[] {
	const facts: Fact[] = [];
	for (const n of numbers) {
		for (let m = 1; m <= 10; m++) {
			facts.push({ question: `${n} \\times ${m}`, answer: String(n * m) });
		}
	}
	return facts;
}

function squareFacts(from: number, to: number): Fact[] {
	const facts: Fact[] = [];
	for (let n = from; n <= to; n++) {
		facts.push({ question: `${n}^2`, answer: String(n * n) });
	}
	return facts;
}

const decimalToFraction: [string, string][] = [
	['0,25', '1/4'],
	['0,125', '1/8'],
	['0,75', '3/4'],
	['0,5', '1/2'],
	['0,375', '3/8'],
];

function fractionToDecimalFacts(): Fact[] {
	return decimalToFraction.map(([dec, frac]) => ({
		question: `Чему равно ${frac} в виде десятичной дроби?`,
		answer: dec,
	}));
}

function decimalToFractionFacts(): Fact[] {
	return decimalToFraction.map(([dec, frac]) => ({
		question: `Чему равно ${dec} в виде обыкновенной дроби?`,
		answer: frac,
	}));
}

const quickMultTricks: Fact[] = [
	{ question: '24 \\times 0{,}375 = ?', answer: '9' },
	{ question: '16 \\times 0{,}25 = ?', answer: '4' },
	{ question: '40 \\times 0{,}75 = ?', answer: '30' },
	{ question: '48 \\times 0{,}125 = ?', answer: '6' },
	{ question: '22 \\times 0{,}5 = ?', answer: '11' },
	{ question: '32 \\times 0{,}25 = ?', answer: '8' },
	{ question: '56 \\times 0{,}125 = ?', answer: '7' },
	{ question: '28 \\times 0{,}75 = ?', answer: '21' },
];

type StageSpec = { title: string; facts: Fact[] };
type UnitSpec = { title: string; description: string; order: number; challengeType: 'ASSIST' | 'SPEED'; stages: StageSpec[] };

const units: UnitSpec[] = [
	{
		title: 'Таблица умножения',
		description: 'Быстрый устный счёт: таблица умножения от 2 до 9',
		order: 1,
		// SPEED — тренировка на скорость (см. type-speed.tsx): свой таймер
		// с горящими цифрами + мгновенный ответ по клику на вариант, без
		// подтверждения общей кнопкой внизу. По прямой просьбе
		// пользователя — таблица умножения и квадраты именно про
		// скорость реакции, не только про правильность.
		challengeType: 'SPEED',
		stages: [
			{ title: 'Этап 1: ×2 и ×3', facts: multiplicationFacts([2, 3]) },
			{ title: 'Этап 2: ×4 и ×5', facts: multiplicationFacts([4, 5]) },
			{ title: 'Этап 3: ×6 и ×7', facts: multiplicationFacts([6, 7]) },
			{ title: 'Этап 4: ×8 и ×9', facts: multiplicationFacts([8, 9]) },
		],
	},
	{
		title: 'Квадраты чисел',
		description: 'Квадраты чисел от 1 до 26 наизусть',
		order: 2,
		challengeType: 'SPEED',
		stages: [
			{ title: 'Этап 1: квадраты 1–7', facts: squareFacts(1, 7) },
			{ title: 'Этап 2: квадраты 8–14', facts: squareFacts(8, 14) },
			{ title: 'Этап 3: квадраты 15–20', facts: squareFacts(15, 20) },
			{ title: 'Этап 4: квадраты 21–26', facts: squareFacts(21, 26) },
		],
	},
	{
		title: 'Дроби и десятичные',
		description: 'Частые эквиваленты дробей и десятичных чисел, приёмы быстрого счёта',
		order: 3,
		challengeType: 'ASSIST',
		stages: [
			{ title: 'Этап 1: дробь → десятичная', facts: fractionToDecimalFacts() },
			{ title: 'Этап 2: десятичная → дробь', facts: decimalToFractionFacts() },
			{ title: 'Этап 3: быстрый счёт с десятичными', facts: quickMultTricks },
		],
	},
];

const main = async () => {
	try {
		let course = await db.query.t_courses.findFirst({
			where: eq(schema.t_courses.title, 'Арифметика'),
		});
		if (!course) {
			[course] = await db
				.insert(schema.t_courses)
				.values({ title: 'Арифметика', imageSrc: 'lnip_mat_6.svg', courseId: null, grade: null })
				.returning();
		}

		for (const u of units) {
			let unit = await db.query.t_units.findFirst({
				where: and(eq(schema.t_units.title, u.title), eq(schema.t_units.t_courseId, course.id)),
			});
			if (!unit) {
				[unit] = await db
					.insert(schema.t_units)
					.values({
						title: u.title,
						description: u.description,
						imageSrc: `LottieUnit${u.order}`,
						t_courseId: course.id,
						order: u.order,
					})
					.returning();
			}

			for (let sIdx = 0; sIdx < u.stages.length; sIdx++) {
				const stage = u.stages[sIdx];
				let lesson = await db.query.t_lessons.findFirst({
					where: and(eq(schema.t_lessons.title, stage.title), eq(schema.t_lessons.t_unitId, unit.id)),
				});
				if (!lesson) {
					[lesson] = await db
						.insert(schema.t_lessons)
						.values({ title: stage.title, t_unitId: unit.id, order: sIdx + 1 })
						.returning();
				}

				for (let fIdx = 0; fIdx < stage.facts.length; fIdx++) {
					const fact = stage.facts[fIdx];
					const isFormula = fact.question.includes('\\') || fact.question.includes('^');
					const question = isFormula ? `$${fact.question}$` : fact.question;

					const [challenge] = await db
						.insert(schema.t_challenges)
						.values({
							t_lessonId: lesson.id,
							type: u.challengeType,
							question,
							order: fIdx + 1,
							points: 10,
							author: AUTHOR,
							numRans: '1',
							difficulty: '',
							imageSrc: '',
							stage: 1,
						})
						.returning();

					await db.insert(schema.t_challengeOptions).values({
						t_challengeId: challenge.id,
						text: fact.answer,
						correct: true,
					});
				}

				console.log(`Юнит "${u.title}" / Этап "${stage.title}" (lesson ${lesson.id}) — ${stage.facts.length} задач`);
			}
		}

		console.log('Курс "Арифметика":', course);
	} finally {
		await queryClient.end();
	}
};

main();
