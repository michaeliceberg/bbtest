// lib/topicStickers.ts
//
// Сопоставление задачи тренажёра формул с "картинкой темы" (стикер из
// public/topic-stickers/*.svg) — гиря+стрелка для силы тяжести, пружина
// для упругости и т.п. Цель — визуальная связь формулы с реальным миром,
// не только буквы. Пока подключено только в тренажёре (t-lesson), см.
// components/trainer-question.tsx.
//
// Три уровня сопоставления, по убыванию специфичности:
// 1. Формула (M_ASC, "F_тяж=?" -> "$ \\huge  mg$") — сравниваем КАНОНИЗИРОВАННУЮ
//    (без \huge/\quad/лишних пробелов) правую часть с известным списком.
// 2. Название величины (словарный вопрос "Что такое $F_{тяж}$?" -> ответ
//    "сила тяжести") — сравниваем правильный ответ ЦЕЛИКОМ с известным
//    списком названий. Однозначно даже когда символ (P) переиспользован
//    для разных величин — ответ-название у них разный.
// 3. Символ в тексте вопроса ("В чём измеряется $F_{тяж}$?" — ответ
//    только "Н", не название) — ищем в question ИЗВЕСТНЫЙ символ. Проверяем
//    паттерны от самых специфичных к самым общим, чтобы "F_{тяж}" не
//    перехватывался более широким правилом "F".
// Если ничего не совпало (например расплывчатое "Что измеряется в $Н$?"
// без конкретного символа) — стикер не показываем, это осознанный пробел.

type StickerRule = { pattern: RegExp; sticker: string }

// \frac{A}{B} -> A/B и \sqrt{X} -> √X ДО остальной чистки — иначе фигурные
// скобки/бэкслеши внутри них никогда не свернутся в плоскую строку.
// Один уровень вложенных {} внутри аргумента (нужно для x^{2} внутри
// числителя \frac{...x^{2}}{2}) — глубже в реальных формулах темы нет.
const FRAC_RE = /\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
const SQRT_RE = /\\sqrt\{([^{}]*)\}/g

const canonicalFormula = (raw: string): string =>
	raw
		.replace(FRAC_RE, '$1/$2')
		.replace(SQRT_RE, '√$1')
		.replace(/\\huge|\\quad|\\Large|\\displaystyle/g, '')
		.replace(/\\triangle/g, 'Δ')
		.replace(/\\rho/g, 'ρ')
		.replace(/\\pi/g, 'π')
		.replace(/\\cdot/g, '·')
		.replace(/\$/g, '')
		.replace(/\s+/g, '')
		.trim()

// 1. Формулы — канонизированная правая часть корневого M_ASC-ответа.
const FORMULA_TO_STICKER: Record<string, string> = {
	'mg': 'gravity',
	'ρgV_{пч}': 'buoyancy',
	'k·Δx': 'elastic',
	'F/S': 'pressure-solid',
	'ρgh': 'pressure-liquid',
	'mv^{2}/2': 'kinetic-energy',
	'mgh': 'potential-energy',
	'kΔx^{2}/2': 'spring-energy',
	'm·v': 'momentum',
	'ma': 'net-force',
	'm(g+a)': 'elevator-weight',
	'm(g-a)': 'elevator-weight',
	'2π√L/g': 'oscillation-period',
	'2π√m/k': 'oscillation-period',
}

// 2. Названия величин — ответ словарного вопроса "Что такое $X$?".
const NAME_TO_STICKER: Record<string, string> = {
	'сила тяжести': 'gravity',
	'сила упругости': 'elastic',
	'сила Архимеда': 'buoyancy',
	'давление': 'pressure-liquid', // без формулы неоднозначно (тело/жидкость) — берём более узнаваемый вариант
	'кинетическая энергия': 'kinetic-energy',
	'потенциальная энергия': 'potential-energy',
	'энергия пружины': 'spring-energy',
	'импульс тела': 'momentum',
	'равнодействующая сила': 'net-force',
	'вес тела': 'elevator-weight',
	'период колебаний': 'oscillation-period',
}

// 3. Символ в тексте вопроса — от специфичных к общим (проверяются по порядку).
const SYMBOL_RULES: StickerRule[] = [
	// Законы сохранения — не одна величина, а формула-равенство (см.
	// правило про const/ЗСИ/ЗСЭ в lib/formulaLetters.ts), поэтому не
	// попадают под FORMULA_TO_STICKER/NAME_TO_STICKER выше — ловим по
	// названию закона в самом вопросе.
	{ pattern: /^ЗСИ/, sticker: 'momentum-conservation' },
	{ pattern: /^ЗСЭ/, sticker: 'energy-conservation' },
	{ pattern: /F_\{тяж\}/, sticker: 'gravity' },
	{ pattern: /F_\{упр\}/, sticker: 'elastic' },
	{ pattern: /F_\{Арх\}/, sticker: 'buoyancy' },
	{ pattern: /E_\{кин\}/, sticker: 'kinetic-energy' },
	{ pattern: /E_\{пот\}/, sticker: 'potential-energy' },
	{ pattern: /E_\{пруж\}/, sticker: 'spring-energy' },
	{ pattern: /(?<![a-zA-Zа-яА-Я])p(?![a-zA-Zа-яА-Я_])/, sticker: 'momentum' },
	{ pattern: /(?<![a-zA-Zа-яА-Я])T(?![a-zA-Zа-яА-Я_])/, sticker: 'oscillation-period' },
	// Голая "F" (без индекса) однозначна — F_тяж/F_упр/F_Арх выше уже
	// перехватили ВСЕ подстрочные варианты, до этого правила доходит
	// только настоящая безындексная "равнодействующая сила".
	{ pattern: /(?<![a-zA-Zа-яА-Я])F(?![a-zA-Zа-яА-Я_{])/, sticker: 'net-force' },
	// Голая "P" намеренно НЕ включена — неоднозначна (давление ИЛИ вес
	// тела используют один и тот же безындексный символ) и без формулы/
	// названия рядом не различима надёжно.
]

type ChallengeLike = {
	question: string
	t_challengeOptions: { text: string; correct: boolean }[]
}

export const getTopicSticker = (challenge: ChallengeLike): string | null => {
	const correctText = challenge.t_challengeOptions.find((o) => o.correct)?.text
		?? challenge.t_challengeOptions[0]?.text
	if (correctText) {
		const canonical = canonicalFormula(correctText)
		if (FORMULA_TO_STICKER[canonical]) return FORMULA_TO_STICKER[canonical]

		const trimmedName = correctText.trim()
		if (NAME_TO_STICKER[trimmedName]) return NAME_TO_STICKER[trimmedName]
	}

	for (const rule of SYMBOL_RULES) {
		if (rule.pattern.test(challenge.question)) return rule.sticker
	}

	return null
}
