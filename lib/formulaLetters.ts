// lib/formulaLetters.ts
//
// Извлечение однобуквенных переменных из LaTeX-строки формулы — нужно
// для типа задания INSERT (пропущенная буква в формуле). Не новый
// контент, а новый рендер существующих t_challengeOptions[0].text.

// Убираем LaTeX-команды (\frac, \sqrt, \huge, \quad, а также греческие
// команды типа \nu, \rho, \eta — после удаления backslash они остаются
// многобуквенным словом и не пройдут проверку "изолированная буква" ниже).
const stripLatexCommands = (latex: string): string => latex.replace(/\\[a-zA-Zа-яА-Я]+/g, ' ')

// Изолированная буква — не часть более длинного слова/индекса (поэтому
// кириллические индексы вроде "тяж", "Арх", "кин" не считаются кандидатами,
// а F перед "_{тяж}" считается).
const ISOLATED_LETTER_RE = /(?<![A-Za-zА-Яа-я])([A-Za-zА-Яа-я])(?![A-Za-zА-Яа-я])/g

export const extractLetterCandidates = (latex: string): string[] => {
	const stripped = stripLatexCommands(latex)
	const matches = stripped.match(ISOLATED_LETTER_RE) || []
	return Array.from(new Set(matches))
}

type ChallengeLike = {
	t_challengeOptions: { text: string; correct: boolean }[]
}

export type InsertBlank = {
	blankedFormula: string
	correctLetter: string
	distractorLetters: string[]
}

// challenge — задача, из формулы которой делаем пропуск.
// siblingChallenges — остальные M_ASC-задачи этого же урока, источник
// букв-обманок (реально встречающихся в других формулах, не случайных).
export const pickInsertBlank = (
	challenge: ChallengeLike,
	siblingChallenges: ChallengeLike[],
): InsertBlank | null => {
	const formula = challenge.t_challengeOptions.find((o) => o.correct)?.text
		?? challenge.t_challengeOptions[0]?.text
	if (!formula) return null

	const candidates = extractLetterCandidates(formula)
	if (candidates.length === 0) return null

	const correctLetter = candidates[Math.floor(Math.random() * candidates.length)]

	const siblingLetters = new Set<string>()
	for (const sibling of siblingChallenges) {
		const siblingFormula = sibling.t_challengeOptions.find((o) => o.correct)?.text
			?? sibling.t_challengeOptions[0]?.text
		if (!siblingFormula) continue
		for (const letter of extractLetterCandidates(siblingFormula)) {
			if (letter !== correctLetter) siblingLetters.add(letter)
		}
	}

	if (siblingLetters.size < 3) return null

	const distractorPool = Array.from(siblingLetters)
	for (let i = distractorPool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
			;[distractorPool[i], distractorPool[j]] = [distractorPool[j], distractorPool[i]]
	}
	const distractorLetters = distractorPool.slice(0, 3)

	// Заменяем ОДНО (первое) вхождение выбранной буквы на плейсхолдер —
	// используем изолированный regex, чтобы не задеть букву внутри
	// другого слова/индекса.
	const letterRe = new RegExp(`(?<![A-Za-zА-Яа-я])${correctLetter}(?![A-Za-zА-Яа-я])`)
	const blankedFormula = formula.replace(letterRe, '\\boxed{\\phantom{X}}')

	return { blankedFormula, correctLetter, distractorLetters }
}
