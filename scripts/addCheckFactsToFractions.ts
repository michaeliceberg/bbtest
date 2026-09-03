import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Добавляет CHECK-факты ("верно ли утверждение?") в уже существующие
// уроки темы "Дроби и десятичные" (см. scripts/rebuildFractionsUnit.ts) —
// авторские true/false-утверждения вида "3/8 = 0,125" (ложное) или
// "1/2 = 0,5" (истинное), используя новую явно-авторскую ветку CHECK в
// app/t-lesson/[t_lessonId]/page.tsx (t_challengeOptions[0].text =
// 'CORRECT'/'WRONG' — служебный вердикт, не настоящий числовой ответ).

const AUTHOR = 'Арифметика';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type DecimalDef = { plain: string; tex: string; fracNum: number; fracDen: number }

const D_05: DecimalDef = { plain: '0,5', tex: '0{,}5', fracNum: 1, fracDen: 2 }
const D_025: DecimalDef = { plain: '0,25', tex: '0{,}25', fracNum: 1, fracDen: 4 }
const D_0125: DecimalDef = { plain: '0,125', tex: '0{,}125', fracNum: 1, fracDen: 8 }
const D_075: DecimalDef = { plain: '0,75', tex: '0{,}75', fracNum: 3, fracDen: 4 }
const D_0375: DecimalDef = { plain: '0,375', tex: '0{,}375', fracNum: 3, fracDen: 8 }

type CheckFact = { question: string; verdict: 'CORRECT' | 'WRONG' }

// Для каждой дроби — 1 истинное утверждение (сама она) и 1 ложное
// (та же дробь = ДРУГАЯ десятичная из того же набора, циклический сдвиг
// на 1 — гарантирует не самопарность и разнообразие пар внутри набора).
function checkFactsFor(defs: DecimalDef[]): CheckFact[] {
	const facts: CheckFact[] = []
	defs.forEach((d, i) => {
		const frac = `\\dfrac{${d.fracNum}}{${d.fracDen}}`
		facts.push({ question: `$\\huge ${frac} = ${d.tex}$`, verdict: 'CORRECT' })

		const wrongPartner = defs[(i + 1) % defs.length]
		if (wrongPartner !== d) {
			facts.push({ question: `$\\huge ${frac} = ${wrongPartner.tex}$`, verdict: 'WRONG' })
		}
	})
	return facts
}

const LESSON_DECIMALS: Record<string, DecimalDef[]> = {
	'Умножение: 0,5 и 0,25': [D_05, D_025],
	'Умножение: 0,75 и 0,125': [D_075, D_0125],
	'Умножение: комбо': [D_05, D_025, D_075, D_0125],
	'Умножение: + 0,375': [D_05, D_025, D_075, D_0125, D_0375],
	'Умножение: Контрольная': [D_05, D_025, D_075, D_0125, D_0375],
	'Деление: 0,5 и 0,25': [D_05, D_025],
	'Деление: 0,75 и 0,125': [D_075, D_0125],
	'Деление: комбо': [D_05, D_025, D_075, D_0125],
	'Деление: + 0,375': [D_05, D_025, D_075, D_0125, D_0375],
	'Деление: Контрольная': [D_05, D_025, D_075, D_0125, D_0375],
}

const main = async () => {
	try {
		const unit = await db.query.t_units.findFirst({ where: eq(schema.t_units.title, 'Дроби и десятичные') })
		if (!unit) throw new Error('Юнит "Дроби и десятичные" не найден')

		const lessons = await db.query.t_lessons.findMany({
			where: and(eq(schema.t_lessons.t_unitId, unit.id), inArray(schema.t_lessons.title, Object.keys(LESSON_DECIMALS))),
			with: { t_challenges: true },
		})

		for (const lesson of lessons) {
			const defs = LESSON_DECIMALS[lesson.title]
			const facts = checkFactsFor(defs)
			const startOrder = lesson.t_challenges.length + 1

			for (let i = 0; i < facts.length; i++) {
				const fact = facts[i]
				const [challenge] = await db
					.insert(schema.t_challenges)
					.values({
						t_lessonId: lesson.id,
						type: 'CHECK',
						question: fact.question,
						order: startOrder + i,
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
					text: fact.verdict,
					correct: true,
				})
			}

			console.log(`Урок "${lesson.title}" (${lesson.id}) — добавлено ${facts.length} CHECK-фактов`)
		}
	} finally {
		await queryClient.end()
	}
}

main()
