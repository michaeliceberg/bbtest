import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

const AUTHOR = 'ЛНИП Математика 7';

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

const main = async () => {
	try {
		let course = await db.query.courses.findFirst({
			where: eq(schema.courses.title, 'ЛНИП Математика 7'),
		});
		if (!course) {
			[course] = await db
				.insert(schema.courses)
				.values({ title: 'ЛНИП Математика 7', imageSrc: 'lnip_mat_7.svg' })
				.returning();
		}

		// Unit 1: пример №1 (Вычислить)
		let unit1 = await db.query.units.findFirst({
			where: eq(schema.units.title, 'Действия с дробями и десятичными числами'),
		});
		if (!unit1) {
			[unit1] = await db
				.insert(schema.units)
				.values({
					title: 'Действия с дробями и десятичными числами',
					description: 'Порядок действий с обыкновенными и десятичными дробями, смешанные числа',
					courseId: course.id,
					order: 1,
					imageSrc: 'LottieUnit1',
				})
				.returning();
		}

		const [lesson1] = await db
			.insert(schema.lessons)
			.values({ title: 'Вычисление числовых выражений', unitId: unit1.id, order: 1 })
			.returning();

		const [challenge1] = await db
			.insert(schema.challenges)
			.values({
				lessonId: lesson1.id,
				type: 'ASSIST',
				question:
					'Вычислите (ответ округлите до сотых): $\\left(7{,}42 \\cdot \\dfrac{5}{9} - (-11{,}48)\\right) : 1\\dfrac{4}{5} : 0{,}35$',
				order: 1,
				points: 10,
				author: AUTHOR,
				difficulty: '',
				imageSrc: '',
			})
			.returning();

		const options1 = shuffle([
			{ text: '24,77', correct: true },
			{ text: '-11,68', correct: false }, // забыли, что минус на минус даёт плюс
			{ text: '44,58', correct: false }, // пропустили деление на 1 4/5
			{ text: '8,67', correct: false }, // пропустили деление на 0,35
			{ text: '83,65', correct: false }, // приняли 7,42 за 74,2
			{ text: '2,48', correct: false }, // приняли 0,35 за 3,5
		]);

		await db.insert(schema.challengeOptions).values(
			options1.map((o) => ({
				challengeId: challenge1.id,
				text: o.text,
				correct: o.correct,
			}))
		);

		// Unit 2: пример №2 (Упростить)
		let unit2 = await db.query.units.findFirst({
			where: eq(schema.units.title, 'Алгебраические дроби'),
		});
		if (!unit2) {
			[unit2] = await db
				.insert(schema.units)
				.values({
					title: 'Алгебраические дроби',
					description: 'Сокращение и упрощение выражений с алгебраическими дробями',
					courseId: course.id,
					order: 2,
					imageSrc: 'LottieUnit2',
				})
				.returning();
		}

		const [lesson2] = await db
			.insert(schema.lessons)
			.values({ title: 'Упрощение алгебраических дробей', unitId: unit2.id, order: 1 })
			.returning();

		const [challenge2] = await db
			.insert(schema.challenges)
			.values({
				lessonId: lesson2.id,
				type: 'ASSIST',
				question:
					'Упростите выражение: $\\dfrac{3a+3b}{b} : \\dfrac{9a^2-b^2}{3a+b}$',
				order: 1,
				points: 10,
				author: AUTHOR,
				difficulty: '',
				imageSrc: '',
			})
			.returning();

		const options2 = shuffle([
			{ text: '$\\dfrac{3(a+b)}{b(3a-b)}$', correct: true },
			{ text: '$\\dfrac{3(a+b)(3a-b)}{b}$', correct: false }, // умножили вместо деления
			{ text: '$\\dfrac{a+b}{b(3a-b)}$', correct: false }, // потеряли множитель 3
			{ text: '$\\dfrac{3(a+b)}{b(3a+b)}$', correct: false }, // неверно разложили разность квадратов
			{ text: '$\\dfrac{3}{3a-b}$', correct: false }, // сократили (a+b) и b как попало
			{ text: '$-\\dfrac{3(a+b)}{b(3a-b)}$', correct: false }, // потеряли знак
		]);

		await db.insert(schema.challengeOptions).values(
			options2.map((o) => ({
				challengeId: challenge2.id,
				text: o.text,
				correct: o.correct,
			}))
		);

		console.log('Курс создан:', course);
		console.log('Unit 1:', unit1.id, 'Lesson 1:', lesson1.id, 'Challenge 1:', challenge1.id);
		console.log('Unit 2:', unit2.id, 'Lesson 2:', lesson2.id, 'Challenge 2:', challenge2.id);
	} finally {
		await queryClient.end();
	}
};

main();
