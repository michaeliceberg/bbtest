// scripts/seedTrigLogTrainer.ts
//
// Новый тренажёр "Тригонометрия" + "Логарифмы" для курса "ЕГЭ Математика
// Профиль" (courseId=11) — по просьбе пользователя, на основе уже
// существующего черновика `scripts/seedTM10.ts` (108 готовых задач, но
// собранных всего в 8 крупных уроках — 36/12/10×6). Тот старый файл
// НЕЛЬЗЯ запускать напрямую: в его main() первым делом идёт полное
// `db.delete()` ПО ВСЕМ t_courses/t_units/t_lessons/t_challenges —
// снесло бы вообще весь тренажёр (Физика-11, Геометрия-9 и т.д.).
// Вместо этого — безопасно читаем seedTM10.ts КАК ТЕКСТ (не импортируем,
// не выполняем ни строчки его кода) и вручную парсим литералы массивов
// `.values([...])`, балансируя скобки С УЧЁТОМ строк в кавычках (LaTeX
// внутри содержит непарные "[" — например "\left[ ... \right." — это
// обычные символы текста, не синтаксис массива, наивный счётчик скобок
// на них ломается).
//
// Разбивка на уроки по 2-3 задачи — та же идея, что и с темами физики
// (маленькие "этапы" вместо одного длинного урока на 36 задач), явная
// просьба пользователя. Внутри каждого из 8 исходных уроков контент уже
// однороден по теме (типовые значения sin/cos/tg/ctg, одна формула
// приведения, одно свойство логарифма) — группируем блоками по 3 подряд
// в исходном порядке (порядок уже осмысленный: сначала все "чистые"
// значения, потом "±"-варианты и т.п.), последняя группа темы может быть
// короче (1-2), никогда не смешиваем задачи РАЗНЫХ подтем в одну группу.

import fs from "fs"
import path from "path"
import db from "@/db/drizzle"
import { t_courses, t_units, t_lessons, t_challenges, t_challengeOptions } from "@/db/schema"

const MATH11_COURSE_ID = 11 // "ЕГЭ Математика Профиль" (courses.id, НЕ t_courses)

type RawChallenge = {
	id: number
	t_lessonId: number
	type: string
	order: number
	question: string
	points: number
	author: string
	imageSrc: string
	difficulty: string
	numRans: string
}
type RawOption = { t_challengeId: number; correct: boolean; text: string; imageSrc: string }

// ---------- Безопасный текстовый парсинг seedTM10.ts (без импорта/выполнения) ----------

function extractValuesArrays(source: string, tableName: string): string[] {
	const marker = `db.insert(schema.${tableName}).values(`
	const results: string[] = []
	let searchFrom = 0
	while (true) {
		const idx = source.indexOf(marker, searchFrom)
		if (idx === -1) break
		let i = idx + marker.length
		let depth = 0
		const start = i
		let inString = false
		for (; i < source.length; i++) {
			const ch = source[i]
			if (inString) {
				if (ch === "\\") { i++; continue }
				if (ch === "'") inString = false
				continue
			}
			if (ch === "'") { inString = true; continue }
			if (ch === "[") depth++
			else if (ch === "]") { depth--; if (depth === 0) { i++; break } }
		}
		results.push(source.slice(start, i))
		searchFrom = i
	}
	return results
}

function loadOldTM10Data(): { challenges: RawChallenge[]; options: RawOption[] } {
	const filePath = path.join(process.cwd(), "scripts", "seedTM10.ts")
	const src = fs.readFileSync(filePath, "utf8")

	const challengeArrays = extractValuesArrays(src, "t_challenges")
	const optionArrays = extractValuesArrays(src, "t_challengeOptions")
	if (challengeArrays.length !== 2 || optionArrays.length !== 2) {
		throw new Error(`Неожиданная структура seedTM10.ts: challenge blocks=${challengeArrays.length}, option blocks=${optionArrays.length} (ожидалось по 2) — проверь файл вручную перед запуском`)
	}

	const challenges: RawChallenge[] = []
	for (const arrText of challengeArrays) {
		challenges.push(...(new Function(`return ${arrText}`)() as RawChallenge[]))
	}
	const options: RawOption[] = []
	for (const arrText of optionArrays) {
		options.push(...(new Function(`return ${arrText}`)() as RawOption[]))
	}
	return { challenges, options }
}

// ---------- Группировка по 2-3 внутри каждой подтемы ----------

// Сбалансированное деление вместо наивного chunk(items,3): наивное
// деление 10 элементов по 3 даёт [3,3,3,1] — последний урок-"огрызок" из
// ОДНОЙ задачи технически рендерится, но без единого соседа по уроку у
// ASSIST/M_ASC-задачи (варианты ответа собираются динамически из ДРУГИХ
// задач ТОГО ЖЕ урока, см. buildAssistQuestion в page.tsx) — 0 вариантов-
// обманок, вопрос показывает 1 кнопку и тривиально "угадывается" без
// чтения условия. Та же категория бага, что уже чинили для физики
// (маленькие "Термины"-уроки с одной величиной). Вместо этого — размеры
// групп различаются не больше чем на 1 (round-robin остаток), гарантируя
// каждой группе ≥2 элемента при исходном количестве ≥2.
function chunkBalanced<T>(items: T[], targetSize: number): T[][] {
	if (items.length === 0) return []
	const numGroups = Math.max(1, Math.ceil(items.length / targetSize))
	const baseSize = Math.floor(items.length / numGroups)
	const remainder = items.length % numGroups
	const out: T[][] = []
	let idx = 0
	for (let g = 0; g < numGroups; g++) {
		const size = baseSize + (g < remainder ? 1 : 0)
		out.push(items.slice(idx, idx + size))
		idx += size
	}
	return out
}

// (исходный t_lessonId в seedTM10.ts, диапазон [start,end) внутри него, имя подтемы)
type SubTopic = { sourceLessonId: number; start: number; end: number; title: string }

const TRIG_SUBTOPICS: SubTopic[] = [
	{ sourceLessonId: 1001, start: 0, end: 6, title: "sin(x) = a" },
	{ sourceLessonId: 1001, start: 6, end: 12, title: "cos(x) = a" },
	{ sourceLessonId: 1001, start: 12, end: 15, title: "sin(x) = ±a" },
	{ sourceLessonId: 1001, start: 15, end: 18, title: "cos(x) = ±a" },
	{ sourceLessonId: 1001, start: 18, end: 24, title: "tg(x) = a" },
	{ sourceLessonId: 1001, start: 24, end: 30, title: "ctg(x) = a" },
	{ sourceLessonId: 1001, start: 30, end: 33, title: "tg(x) = ±a" },
	{ sourceLessonId: 1001, start: 33, end: 36, title: "ctg(x) = ±a" },
	{ sourceLessonId: 1002, start: 0, end: 3, title: "Приведение: π/2 + x" },
	{ sourceLessonId: 1002, start: 3, end: 6, title: "Приведение: π/2 − x" },
	{ sourceLessonId: 1002, start: 6, end: 9, title: "Приведение: x − π/2" },
	{ sourceLessonId: 1002, start: 9, end: 12, title: "Приведение: −x − π/2" },
]

const LOG_SUBTOPICS: SubTopic[] = [
	{ sourceLessonId: 1003, start: 0, end: 10, title: "Сложение и вычитание логарифмов" },
	{ sourceLessonId: 1004, start: 0, end: 10, title: "Логарифм с переставленными основанием и аргументом" },
	{ sourceLessonId: 1005, start: 0, end: 10, title: "Степень в основании и аргументе" },
	{ sourceLessonId: 1006, start: 0, end: 10, title: "Показатель степени — логарифм" },
	{ sourceLessonId: 1007, start: 0, end: 10, title: "Частное логарифмов с общим основанием" },
	{ sourceLessonId: 1008, start: 0, end: 10, title: "Произведение логарифмов (цепочка оснований)" },
]

async function seedUnit(unitTitle: string, unitOrder: number, tCourseId: number, subtopics: SubTopic[], byLesson: Map<number, RawChallenge[]>, correctByChallenge: Map<number, RawOption>) {
	const [unit] = await db.insert(t_units).values({
		title: unitTitle,
		t_courseId: tCourseId,
		order: unitOrder,
		description: "",
		imageSrc: "",
	}).returning({ id: t_units.id })

	let lessonOrder = 1
	for (const sub of subtopics) {
		const sourceItems = byLesson.get(sub.sourceLessonId) ?? []
		const slice = sourceItems.slice(sub.start, sub.end)
		const groups = chunkBalanced(slice, 3)

		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi]
			const title = groups.length > 1 ? `${sub.title} — ${gi + 1}` : sub.title

			const [lesson] = await db.insert(t_lessons).values({
				title,
				t_unitId: unit.id,
				order: lessonOrder++,
			}).returning({ id: t_lessons.id })

			for (let ci = 0; ci < group.length; ci++) {
				const src = group[ci]
				const correct = correctByChallenge.get(src.id)
				if (!correct) throw new Error(`Нет правильного ответа для challenge id=${src.id} (${src.question})`)

				const [ch] = await db.insert(t_challenges).values({
					t_lessonId: lesson.id,
					type: src.type as any,
					question: src.question,
					order: ci + 1,
					points: src.points,
					author: src.author,
					numRans: src.numRans,
					difficulty: src.difficulty,
					imageSrc: src.imageSrc,
				}).returning({ id: t_challenges.id })

				await db.insert(t_challengeOptions).values({
					t_challengeId: ch.id,
					text: correct.text,
					correct: true,
				})
			}
		}
	}
	return unit.id
}

async function main() {
	const { challenges, options } = loadOldTM10Data()
	console.log(`Прочитано из seedTM10.ts: ${challenges.length} задач, ${options.length} вариантов`)

	const byLesson = new Map<number, RawChallenge[]>()
	for (const c of challenges) {
		const arr = byLesson.get(c.t_lessonId) ?? []
		arr.push(c)
		byLesson.set(c.t_lessonId, arr)
	}
	// Сортируем по исходному order — гарантирует, что деление на группы по 3
	// идёт в том же порядке, что и в оригинальном файле.
	for (const arr of byLesson.values()) arr.sort((a, b) => a.order - b.order)

	const correctByChallenge = new Map<number, RawOption>()
	for (const o of options) {
		if (o.correct && o.text.trim() !== "") correctByChallenge.set(o.t_challengeId, o)
	}

	const [course] = await db.insert(t_courses).values({
		title: "Математика-11",
		imageSrc: "lnip_mat_6.svg",
		grade: 11,
		courseId: MATH11_COURSE_ID,
	}).returning({ id: t_courses.id })
	console.log(`t_course создан: id=${course.id}`)

	const trigUnitId = await seedUnit("Тригонометрия", 1, course.id, TRIG_SUBTOPICS, byLesson, correctByChallenge)
	console.log(`Юнит "Тригонометрия" создан: id=${trigUnitId}`)

	const logUnitId = await seedUnit("Логарифмы", 2, course.id, LOG_SUBTOPICS, byLesson, correctByChallenge)
	console.log(`Юнит "Логарифмы" создан: id=${logUnitId}`)

	console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
