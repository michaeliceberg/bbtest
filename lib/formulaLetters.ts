// lib/formulaLetters.ts
//
// Извлечение однобуквенных переменных из LaTeX-строки формулы — нужно
// для типа задания INSERT (пропущенная буква в формуле). Не новый
// контент, а новый рендер существующих t_challengeOptions[0].text.

// Слова-функции, которые в формулах пишутся обычным текстом без backslash
// (не LaTeX-командой) — их буквы НЕ считаются кандидатами-переменными,
// даже если формально это "слитная последовательность латинских букв"
// (как m/g/h в mgh). Пример: "sin"/"cos" в "qvB sin \alpha".
const FUNCTION_WORDS = new Set([
	'sin', 'cos', 'tg', 'tan', 'ctg', 'cot', 'ctan',
	'sh', 'ch', 'th', 'cth',
	'arcsin', 'arccos', 'arctg', 'arcctg', 'arctan',
	'ln', 'lg', 'log', 'exp', 'lim', 'det', 'sign', 'mod', 'deg', 'rad', 'min', 'max',
])

type LetterOccurrence = {
	letter: string
	// Позиция буквы в ИСХОДНОЙ (не "очищенной") latex-строке — чтобы точечно
	// заменить именно эту букву на плейсхолдер, не трогая остальной текст
	// (включая буквы внутри LaTeX-команд вроде \sqrt).
	index: number
	// Ключ "слитного" куска, из которого эта буква взята (mgh -> все три
	// буквы с одним runKey). Нужен для двойного пропуска: две буквы одного
	// произведения можно менять местами (mgh = hmg), из разных частей
	// формулы — в общем случае нет.
	runKey: string
}

// Куски букв. Команду от обычного текста формулы отличаем ПОСЛЕ матча —
// по символу перед началом куска (см. ниже), а не lookbehind'ом на весь
// квантификатор: `(?<!\\)[A-Za-z]+` откидывает только САМУ ПЕРВУЮ букву
// куска, если ей предшествует backslash, а не куда весь `\huge` целиком —
// движок регэкспа просто сдвигается на 1 символ и находит "uge".
const LETTER_RUN_RE = /[A-Za-zА-Яа-я]+/g

const findLetterOccurrences = (latex: string): LetterOccurrence[] => {
	const occurrences: LetterOccurrence[] = []
	const re = new RegExp(LETTER_RUN_RE)
	let match: RegExpExecArray | null
	while ((match = re.exec(latex))) {
		const run = match[0]
		// Последовательность букв идёт СРАЗУ после backslash — значит это
		// имя LaTeX-команды (\huge, \frac, \sqrt, \alpha...), а не текст
		// формулы, пропускаем целиком.
		if (latex[match.index - 1] === '\\') continue
		const runKey = `${match.index}:${run}`
		const isCyrillic = /[А-Яа-я]/.test(run)

		if (isCyrillic) {
			// Кириллица слитно (2+ буквы) — словесный подстрочный индекс
			// ("тяж", "кин", "красн"), не переменные. Изолированная одна
			// кириллическая буква — как и раньше, валидный кандидат.
			if (run.length === 1) {
				occurrences.push({ letter: run, index: match.index, runKey })
			}
			continue
		}

		// Латиница слитно — считаем произведением однобуквенных переменных
		// (mgh = m·g·h, qvB = q·v·B), кроме известных названий функций,
		// которые в этих формулах пишутся обычным текстом без backslash.
		if (FUNCTION_WORDS.has(run.toLowerCase())) continue
		for (let i = 0; i < run.length; i++) {
			occurrences.push({ letter: run[i], index: match.index + i, runKey })
		}
	}
	return occurrences
}

export const extractLetterCandidates = (latex: string): string[] =>
	Array.from(new Set(findLetterOccurrences(latex).map((o) => o.letter)))

// Общий пул частых однобуквенных физических/математических переменных —
// используется и как добор обманок для INSERT (см. pickInsertBlank ниже),
// и как источник замены для corruptFormulaLetter (тип CHECK). Вынесен на
// уровень модуля, а не внутрь одной функции — обеим нужен один и тот же
// список.
const GENERIC_FALLBACK_LETTERS = [
	'a', 'b', 'c', 'd', 'e', 'F', 'g', 'h', 'k', 'l', 'm', 'n',
	'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
	'A', 'B', 'C', 'E', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
]

export type CorruptedFormula = {
	corruptedLatex: string
	originalLetter: string
	replacementLetter: string
}

// Тип задания CHECK ("правильно ли записана формула?") — портим ОДНУ
// букву в формуле похожей, но ДРУГОЙ буквой ("mgh" -> "mkh"), чтобы
// получить правдоподобную ошибку школьника (перепутал соседнюю
// переменную), а не случайный мусор. siblingLetterPool — буквы из других
// формул урока (тот же принцип "правдоподобная обманка", что уже
// используется в pickInsertBlank), в дополнение к общему пулу ниже — не
// обязателен, без него используется только общий пул.
export const corruptFormulaLetter = (
	latex: string,
	siblingLetterPool: string[] = [],
): CorruptedFormula | null => {
	const occurrences = findLetterOccurrences(latex)
	if (occurrences.length === 0) return null

	const target = occurrences[Math.floor(Math.random() * occurrences.length)]
	// Не подменяем на букву, которая и так уже где-то встречается в этой
	// же формуле — иначе результат может случайно совпасть по смыслу
	// (та же переменная дважды) вместо правдоподобной ошибки.
	const usedLetters = new Set(occurrences.map((o) => o.letter))

	const candidates = Array.from(new Set([...siblingLetterPool, ...GENERIC_FALLBACK_LETTERS]))
		.filter((letter) => letter !== target.letter && !usedLetters.has(letter))
	if (candidates.length === 0) return null

	const replacement = candidates[Math.floor(Math.random() * candidates.length)]
	const corruptedLatex = latex.slice(0, target.index) + replacement + latex.slice(target.index + 1)

	return { corruptedLatex, originalLetter: target.letter, replacementLetter: replacement }
}

type ChallengeLike = {
	t_challengeOptions: { text: string; correct: boolean }[]
}

export type InsertBlank = {
	blankedFormula: string
	// 1 буква — обычный режим, 2 — усложнённый. Обе буквы двойного режима
	// всегда из ОДНОГО слитного произведения, поэтому неважно, в какой из
	// двух пропусков какую вписал ученик — mgh и hmg равнозначны (порядок
	// сомножителей не важен). Порядок элементов массива соответствует
	// порядку пропусков слева направо в формуле (blank 1, blank 2).
	correctLetters: string[]
	distractorLetters: string[]
}

// challenge — задача, из формулы которой делаем пропуск.
// siblingChallenges — остальные M_ASC-задачи этого же урока, источник
// букв-обманок (реально встречающихся в других формулах, не случайных).
// wantDouble — попытаться сделать усложнённый (2 пропуска) вариант; без
// подходящего слитного произведения из ≥2 букв — тихо откатывается на
// обычный однобуквенный пропуск (а не на ASSIST).
export const pickInsertBlank = (
	challenge: ChallengeLike,
	siblingChallenges: ChallengeLike[],
	wantDouble: boolean = false,
): InsertBlank | null => {
	const formula = challenge.t_challengeOptions.find((o) => o.correct)?.text
		?? challenge.t_challengeOptions[0]?.text
	if (!formula) return null

	const occurrences = findLetterOccurrences(formula)
	if (occurrences.length === 0) return null

	let chosen: LetterOccurrence[]

	if (wantDouble) {
		const runGroups = new Map<string, LetterOccurrence[]>()
		for (const occ of occurrences) {
			const group = runGroups.get(occ.runKey) ?? []
			group.push(occ)
			runGroups.set(occ.runKey, group)
		}
		const doubleCandidateRuns = Array.from(runGroups.values()).filter((g) => g.length >= 2)

		if (doubleCandidateRuns.length > 0) {
			const run = doubleCandidateRuns[Math.floor(Math.random() * doubleCandidateRuns.length)]
			const shuffled = [...run]
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
					;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
			}
			// Сортируем по позиции в формуле — "пропуск 1" всегда левее
			// "пропуска 2" на экране, это то, что ждёт UI для
			// последовательной подсветки. Правильность при этом всё равно
			// проверяется без учёта порядка (см. correctLetters выше).
			chosen = shuffled.slice(0, 2).sort((a, b) => a.index - b.index)
		} else {
			chosen = [occurrences[Math.floor(Math.random() * occurrences.length)]]
		}
	} else {
		chosen = [occurrences[Math.floor(Math.random() * occurrences.length)]]
	}

	const correctLetters = chosen.map((o) => o.letter)

	const siblingLetters = new Set<string>()
	for (const sibling of siblingChallenges) {
		const siblingFormula = sibling.t_challengeOptions.find((o) => o.correct)?.text
			?? sibling.t_challengeOptions[0]?.text
		if (!siblingFormula) continue
		for (const letter of extractLetterCandidates(siblingFormula)) {
			if (!correctLetters.includes(letter)) siblingLetters.add(letter)
		}
	}

	// Маленькие уроки (2-3 формулы, как в новых "термин"-уроках, см.
	// CLAUDE.md "Пилот content-generation") физически не могут дать 3
	// обманки из соседей — единственный сосед даёт максимум 2 разные
	// буквы, и INSERT тогда НИКОГДА не срабатывал (тихо откатывался на
	// ASSIST каждый раз, даже когда сама формула отлично годится для
	// пропуска буквы). Если соседей не хватило — добираем из общего пула
	// частых однобуквенных физических/математических переменных (не
	// специфичных ни одной формуле, но хотя бы похожих по духу на реальные
	// обозначения, а не случайных символов) — GENERIC_FALLBACK_LETTERS,
	// объявлен на уровне модуля выше (переиспользуется и corruptFormulaLetter).

	// Столько же обманок, сколько в обычном режиме (3) — при 2 верных
	// буквах кнопок будет 5 вместо 4, этого достаточно для сложности, а
	// требовать 4 обманки оказалось слишком строго: в маленьких уроках
	// (3-4 задачи) столько разных букв среди соседей просто неоткуда
	// взять, и усложнённый режим тихо никогда не срабатывал.
	const neededDistractors = 3
	if (siblingLetters.size < neededDistractors) {
		for (const letter of GENERIC_FALLBACK_LETTERS) {
			if (siblingLetters.size >= neededDistractors) break
			if (!correctLetters.includes(letter)) siblingLetters.add(letter)
		}
	}
	if (siblingLetters.size < neededDistractors) {
		// В принципе не хватает даже с общим пулом (например, формула
		// сплошь из уникальных символов вне a-z/A-Z) — откат на
		// однобуквенный режим, а если и это не помогло — на ASSIST.
		if (chosen.length === 2) {
			return pickInsertBlank(challenge, siblingChallenges, false)
		}
		return null
	}

	const distractorPool = Array.from(siblingLetters)
	for (let i = distractorPool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
			;[distractorPool[i], distractorPool[j]] = [distractorPool[j], distractorPool[i]]
	}
	const distractorLetters = distractorPool.slice(0, neededDistractors)

	// Заменяем ровно выбранные позиции — по индексу в исходной строке, не
	// повторным поиском буквы регэкспом (иначе легко задеть не то
	// вхождение при повторяющихся буквах или буквах внутри LaTeX-команд).
	// Каждому пропуску — свой номер-маркер (1/2, по порядку слева
	// направо), чтобы порознь подсвечивать и заполнять их по очереди на UI.
	let blankedFormula = formula
	const withMarkers = chosen.map((occ, i) => ({ ...occ, marker: i + 1 }))
	for (const occ of [...withMarkers].sort((a, b) => b.index - a.index)) {
		blankedFormula = blankedFormula.slice(0, occ.index)
			+ `\\boxed{\\phantom{${occ.marker}}}`
			+ blankedFormula.slice(occ.index + 1)
	}

	return { blankedFormula, correctLetters, distractorLetters }
}
