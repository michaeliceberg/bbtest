// scripts/seedQuantumUnit.ts
//
// Тема "Квантовая" (t_unit id=10, тема "Физика-11") была заведена ещё в
// более ранней сессии как пустая заготовка "под будущее наполнение" и с
// тех пор ни разу не заполнялась (0 уроков) — пользователь заметил это
// живьём ("почему-то пустой раздел квантовой физики"). Наполняем тем же
// способом, что и остальные темы курса физики: этап с формулами →
// словарный слой → контрольная. Фотоэффект/энергия и импульс фотона уже
// покрыты темой "Оптика" (см. seedOpticsVocab.ts) — здесь сознательно
// НЕ дублируются, только то, чего там нет: постулат Бора, де Бройль,
// дефект массы/энергия связи, закон радиоактивного распада.
//
// Паттерн — тот же insertVocabChallenge/insertVocabSet, что и в
// seedDynamicsVocabPilot.ts (M_ASC-задача с ОДНИМ правильным ответом,
// без хранимых "неправильных" вариантов — дистракторы для рендера
// собираются динамически из формул-соседей урока в page.tsx).

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";

const QUANTUM_UNIT_ID = 10;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
	symbol: string
	name: string
	unit: string
}

async function createLesson(title: string, order: number): Promise<number> {
	const [lesson] = await db.insert(t_lessons).values({
		title,
		t_unitId: QUANTUM_UNIT_ID,
		order,
	}).returning({ id: t_lessons.id })
	return lesson.id
}

async function insertChallenge(lessonId: number, order: number, question: string, correctAnswers: string[]): Promise<number> {
	const [ch] = await db.insert(t_challenges).values({
		t_lessonId: lessonId,
		type: 'M_ASC',
		question,
		order,
		points: 10,
		author: AUTHOR,
		numRans: '1',
		difficulty: '1',
		imageSrc: '0',
	}).returning({ id: t_challenges.id })

	await db.insert(t_challengeOptions).values(
		correctAnswers.map((text) => ({ t_challengeId: ch.id, text, correct: true }))
	)
	return ch.id
}

async function duplicateChallenge(sourceId: number, targetLessonId: number, order: number) {
	const source = await db.query.t_challenges.findFirst({
		where: (t, { eq }) => eq(t.id, sourceId),
		with: { t_challengeOptions: true },
	})
	if (!source) throw new Error(`Source challenge ${sourceId} not found`)

	const [newChallenge] = await db.insert(t_challenges).values({
		t_lessonId: targetLessonId,
		type: source.type,
		question: source.question,
		order,
		points: source.points,
		author: source.author,
		numRans: source.numRans,
		difficulty: source.difficulty,
		imageSrc: source.imageSrc,
	}).returning({ id: t_challenges.id })

	if (source.t_challengeOptions.length > 0) {
		await db.insert(t_challengeOptions).values(
			source.t_challengeOptions.map((o) => ({
				t_challengeId: newChallenge.id,
				text: o.text,
				correct: o.correct,
				imageSrc: o.imageSrc,
				audioSrc: o.audioSrc,
			}))
		)
	}
	return newChallenge.id
}

async function insertVocabSet(lessonId: number, quantities: Quantity[], startOrder: number) {
	let order = startOrder
	for (const q of quantities) {
		await insertChallenge(lessonId, order++, `Что такое $${q.symbol}$?`, [q.name])
		await insertChallenge(lessonId, order++, `В чём измеряется $${q.symbol}$?`, [q.unit])
	}

	const byUnit = new Map<string, string[]>()
	for (const q of quantities) {
		const names = byUnit.get(q.unit) ?? []
		if (!names.includes(q.name)) names.push(q.name)
		byUnit.set(q.unit, names)
	}
	for (const [unit, names] of byUnit) {
		await insertChallenge(lessonId, order++, `Что измеряется в $${unit}$?`, names)
	}
	return order
}

async function main() {
	// --- Этап 1: 5 формул квантовой физики (фотоэффект/энергия фотона —
	// уже в теме "Оптика", здесь не дублируем) ---
	const stage1Id = await createLesson("Этап 1", 1)
	const bohrId = await insertChallenge(
		stage1Id, 1,
		"2-й постулат Бора $\\quad \\huge  h\\nu=? $",
		["$ \\huge E_{m} - E_{n} $"]
	)
	const deBroglieId = await insertChallenge(
		stage1Id, 2,
		"Длина волны де Бройля $\\quad \\huge  \\lambda=? $",
		["$ \\huge \\frac{h}{p} $"]
	)
	const massDefectId = await insertChallenge(
		stage1Id, 3,
		"Дефект массы $\\quad \\huge  \\triangle m=? $",
		["$ \\huge Zm_{p} + (A-Z)m_{n} - m_{я} $"]
	)
	const bindingEnergyId = await insertChallenge(
		stage1Id, 4,
		"Энергия связи ядра $\\quad \\huge  E_{св}=? $",
		["$ \\huge \\triangle m \\cdot c^{2} $"]
	)
	const decayLawId = await insertChallenge(
		stage1Id, 5,
		"Закон радиоактивного распада $\\quad \\huge  N=? $",
		["$ \\huge N_{0} \\cdot 2^{-t/T} $"]
	)
	console.log(`Этап 1 создан: lesson=${stage1Id}, challenges=[${bohrId},${deBroglieId},${massDefectId},${bindingEnergyId},${decayLawId}]`)

	// --- Термины: атом и ядро (словарь только для "именованных" величин —
	// постулат Бора и закон распада остаются формулами-законами, как
	// ЗСИ/ЗСЭ/МДК в других темах, без парного словарного вопроса) ---
	const vocabLessonId = await createLesson("Термины: атом и ядро", 2)
	await duplicateChallenge(deBroglieId, vocabLessonId, 1)
	await duplicateChallenge(massDefectId, vocabLessonId, 2)
	await duplicateChallenge(bindingEnergyId, vocabLessonId, 3)
	await insertVocabSet(vocabLessonId, [
		{ symbol: '\\lambda', name: 'длина волны де Бройля', unit: 'м' },
		{ symbol: '\\triangle m', name: 'дефект массы', unit: 'кг' },
		{ symbol: 'E_{св}', name: 'энергия связи ядра', unit: 'Дж' },
	], 4)
	console.log(`Термины создан: lesson=${vocabLessonId}`)

	// --- Контрольная (мини-босс, повтор всех 5 формул) ---
	const reviewLessonId = await createLesson("Контрольная", 3)
	const reviewSources = [bohrId, deBroglieId, massDefectId, bindingEnergyId, decayLawId]
	for (let i = 0; i < reviewSources.length; i++) {
		await duplicateChallenge(reviewSources[i], reviewLessonId, i + 1)
	}
	console.log(`Контрольная создана: lesson=${reviewLessonId}`)

	console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
