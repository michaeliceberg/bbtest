import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const AUTHOR = 'Арифметика';
const PURPLE = '#C386F8';
const GREEN = '#A1D151';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type DecimalDef = {
	plain: string // '0,5' — для обычных предложений
	tex: string // '0{,}5' — для вставки внутрь $...$ (KaTeX-конвенция интервала после запятой)
	fracNum: number
	fracDen: number
	isUnit: boolean // true = 0,5/0,25/0,125 (унитарная дробь 1/N — приём "×decimal = ÷N" работает буквально)
}

const D_05: DecimalDef = { plain: '0,5', tex: '0{,}5', fracNum: 1, fracDen: 2, isUnit: true }
const D_025: DecimalDef = { plain: '0,25', tex: '0{,}25', fracNum: 1, fracDen: 4, isUnit: true }
const D_0125: DecimalDef = { plain: '0,125', tex: '0{,}125', fracNum: 1, fracDen: 8, isUnit: true }
const D_075: DecimalDef = { plain: '0,75', tex: '0{,}75', fracNum: 3, fracDen: 4, isUnit: false }
const D_0375: DecimalDef = { plain: '0,375', tex: '0{,}375', fracNum: 3, fracDen: 8, isUnit: false }

type Fact = { question: string; answer: string }

function dictionaryFacts(defs: DecimalDef[]): Fact[] {
	const facts: Fact[] = []
	for (const d of defs) {
		const frac = `${d.fracNum}/${d.fracDen}`
		facts.push({ question: `Чему равно ${d.plain} в виде обыкновенной дроби?`, answer: frac })
		facts.push({ question: `Чему равно ${frac} в виде десятичной дроби?`, answer: d.plain })
	}
	return facts
}

// Приём "умножение = деление на знаменатель" — работает только для
// унитарных дробей (1/N): N×0,5 всегда равно N/2 независимо от самого N —
// поэтому правильный ответ ПОСТОЯНЕН для конкретной дроби (2 для 0,5, 4
// для 0,25, 8 для 0,125), а само число N в вопросе меняется только чтобы
// ребёнок обобщил закономерность, а не запомнил один частный случай.
// \Huge — тот же приём, что уже используют M_ASC-формулы в БД для
// крупного отображения; цвета — тот же \textcolor, что и в type-speed.tsx
// (тренажёр "Таблица умножения на скорость"), тот же фиолетовый/зелёный.
function multTrickFacts(defs: DecimalDef[], ns: number[]): Fact[] {
	const facts: Fact[] = []
	for (const d of defs) {
		if (!d.isUnit) continue
		for (const n of ns) {
			const question = `$\\huge \\textcolor{${PURPLE}}{${n}} \\times \\textcolor{${GREEN}}{${d.tex}} = \\textcolor{${PURPLE}}{${n}} / \\textcolor{${GREEN}}{?}$`
			facts.push({ question, answer: `$\\Large \\textcolor{${PURPLE}}{${d.fracDen}}$` })
		}
	}
	return facts
}

// Для НЕ-унитарных дробей (0,75=3/4, 0,375=3/8) простого "= N/const" нет —
// используем прямое вычисление произведения (тот же формат, что уже был
// у "быстрого счёта с десятичными" в этой же теме), N подобрано кратным
// знаменателю, чтобы результат был целым.
function multDirectFacts(defs: DecimalDef[], ns: number[]): Fact[] {
	const facts: Fact[] = []
	for (const d of defs) {
		if (d.isUnit) continue
		for (const n of ns) {
			if (n % d.fracDen !== 0) continue
			const product = (n * d.fracNum) / d.fracDen
			facts.push({ question: `$\\huge ${n} \\times ${d.tex} = ?$`, answer: `$\\Large \\textcolor{${PURPLE}}{${product}}$` })
		}
	}
	return facts
}

// Деление на унитарную дробь 1/N — то же самое, что умножение на N,
// опять же независимо от самого делимого — тот же приём "постоянный
// ответ, N меняется для обобщения", что и у multTrickFacts.
function divTrickFacts(defs: DecimalDef[], ns: number[]): Fact[] {
	const facts: Fact[] = []
	for (const d of defs) {
		if (!d.isUnit) continue
		for (const n of ns) {
			const question = `$\\huge \\textcolor{${PURPLE}}{${n}} \\div \\textcolor{${GREEN}}{${d.tex}} = \\textcolor{${PURPLE}}{${n}} \\times \\textcolor{${GREEN}}{?}$`
			facts.push({ question, answer: `$\\Large \\textcolor{${PURPLE}}{${d.fracDen}}$` })
		}
	}
	return facts
}

function divDirectFacts(defs: DecimalDef[], ns: number[]): Fact[] {
	const facts: Fact[] = []
	for (const d of defs) {
		if (d.isUnit) continue
		for (const n of ns) {
			if (n % d.fracNum !== 0) continue
			const quotient = (n * d.fracDen) / d.fracNum
			facts.push({ question: `$\\huge ${n} \\div ${d.tex} = ?$`, answer: `$\\Large \\textcolor{${PURPLE}}{${quotient}}$` })
		}
	}
	return facts
}

const N_UNIT = [4, 7, 12, 20]
const N_NONUNIT_MULT = [4, 8, 12, 16]
const N_NONUNIT_MULT_8 = [8, 16, 24, 32]
const N_DIV_UNIT = [4, 7, 12, 20]
const N_DIV_NONUNIT = [3, 6, 9, 12]

function multFactsFor(defs: DecimalDef[]): Fact[] {
	const unit = defs.filter((d) => d.isUnit)
	const nonUnit4 = defs.filter((d) => !d.isUnit && d.fracDen === 4)
	const nonUnit8 = defs.filter((d) => !d.isUnit && d.fracDen === 8)
	return [
		...dictionaryFacts(defs),
		...multTrickFacts(unit, N_UNIT),
		...multDirectFacts(nonUnit4, N_NONUNIT_MULT),
		...multDirectFacts(nonUnit8, N_NONUNIT_MULT_8),
	]
}

function divFactsFor(defs: DecimalDef[]): Fact[] {
	const unit = defs.filter((d) => d.isUnit)
	const nonUnit = defs.filter((d) => !d.isUnit)
	return [
		...dictionaryFacts(defs),
		...divTrickFacts(unit, N_DIV_UNIT),
		...divDirectFacts(nonUnit, N_DIV_NONUNIT),
	]
}

type LessonSpec = { title: string; order: number; facts: Fact[] }

const lessons: LessonSpec[] = [
	{ title: 'Умножение: 0,5 и 0,25', order: 1, facts: multFactsFor([D_05, D_025]) },
	{ title: 'Умножение: 0,75 и 0,125', order: 2, facts: multFactsFor([D_075, D_0125]) },
	{ title: 'Умножение: комбо', order: 3, facts: multFactsFor([D_05, D_025, D_075, D_0125]) },
	{ title: 'Умножение: + 0,375', order: 4, facts: multFactsFor([D_05, D_025, D_075, D_0125, D_0375]) },
	{ title: 'Умножение: Контрольная', order: 5, facts: multFactsFor([D_05, D_025, D_075, D_0125, D_0375]) },
	{ title: 'Деление: 0,5 и 0,25', order: 6, facts: divFactsFor([D_05, D_025]) },
	{ title: 'Деление: 0,75 и 0,125', order: 7, facts: divFactsFor([D_075, D_0125]) },
	{ title: 'Деление: комбо', order: 8, facts: divFactsFor([D_05, D_025, D_075, D_0125]) },
	{ title: 'Деление: + 0,375', order: 9, facts: divFactsFor([D_05, D_025, D_075, D_0125, D_0375]) },
	{ title: 'Деление: Контрольная', order: 10, facts: divFactsFor([D_05, D_025, D_075, D_0125, D_0375]) },
]

const main = async () => {
	try {
		const unit = await db.query.t_units.findFirst({ where: eq(schema.t_units.title, 'Дроби и десятичные') })
		if (!unit) throw new Error('Юнит "Дроби и десятичные" не найден')

		// Удаляем только СТАРЫЕ ASSIST-этапы ("всё в одну кучу") — этап 4
		// "умножение по шагам" (MULTISTEP) не трогаем, это отдельный,
		// уже хорошо работающий тип задания.
		const oldLessons = await db.query.t_lessons.findMany({
			where: and(
				eq(schema.t_lessons.t_unitId, unit.id),
				inArray(schema.t_lessons.title, [
					'Этап 1: дробь → десятичная',
					'Этап 2: десятичная → дробь',
					'Этап 3: быстрый счёт с десятичными',
				])
			),
		})
		for (const l of oldLessons) {
			await db.delete(schema.t_lessons).where(eq(schema.t_lessons.id, l.id))
			console.log(`Удалён старый этап "${l.title}" (${l.id})`)
		}

		// Существующий "Этап 4: умножение по шагам" (MULTISTEP) сдвигаем
		// в конец, чтобы порядок был: 10 новых + он последним бонусом.
		const multistepLesson = await db.query.t_lessons.findFirst({
			where: and(eq(schema.t_lessons.t_unitId, unit.id), eq(schema.t_lessons.title, 'Этап 4: умножение по шагам')),
		})
		if (multistepLesson) {
			await db.update(schema.t_lessons).set({ order: 11 }).where(eq(schema.t_lessons.id, multistepLesson.id))
		}

		for (const spec of lessons) {
			const [lesson] = await db
				.insert(schema.t_lessons)
				.values({ title: spec.title, t_unitId: unit.id, order: spec.order })
				.returning()

			for (let i = 0; i < spec.facts.length; i++) {
				const fact = spec.facts[i]
				const [challenge] = await db
					.insert(schema.t_challenges)
					.values({
						t_lessonId: lesson.id,
						type: 'ASSIST',
						question: fact.question,
						order: i + 1,
						points: 10,
						author: AUTHOR,
						numRans: '1',
						difficulty: '',
						imageSrc: '',
						stage: 1,
					})
					.returning()

				await db.insert(schema.t_challengeOptions).values({
					t_challengeId: challenge.id,
					text: fact.answer,
					correct: true,
				})
			}

			console.log(`Урок "${spec.title}" (lesson ${lesson.id}) — ${spec.facts.length} задач`)
		}
	} finally {
		await queryClient.end()
	}
}

main()
