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
// 3. Символ (или название закона/явления) в тексте вопроса ("В чём
//    измеряется $F_{тяж}$?" — ответ только "Н", не название; или "ЗСИ",
//    "МДК" — вопрос-равенство без единой величины) — правила от
//    специфичных к общим, чтобы "F_{тяж}" не перехватывался более общим
//    правилом "F".
//
// ВАЖНО: правила сгруппированы ПО ТЕМЕ (t_unit.id) — у разных тем один и
// тот же голый символ означает РАЗНОЕ (например "p" — импульс в Динамике,
// но давление в Газе; "E" — энергия в Газе/Оптике, но напряжённость поля
// в Электростатике; "A" — работа газа в Газе, но работа батареи в
// Электростатике). Общий (не по темам) список правил раньше работал,
// пока темой была только Динамика — при добавлении остальных тем это
// стало бы минным полем ложных срабатываний, поэтому таблицы разнесены
// по RULES_BY_UNIT[t_unitId], без общего "плоского" фоллбека.
//
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
		.replace(/\\huge|\\quad|\\Large|\\large|\\displaystyle/g, '')
		.replace(/\\triangle/g, 'Δ')
		.replace(/\\rho/g, 'ρ')
		.replace(/\\pi/g, 'π')
		.replace(/\\cdot/g, '·')
		.replace(/\$/g, '')
		.replace(/\s+/g, '')
		.trim()

type UnitRules = {
	formula: Record<string, string>
	name: Record<string, string>
	symbol: StickerRule[]
}

// Не начинается и не заканчивается латинской/кириллической буквой —
// общий "safe lookaround" для голых однобуквенных символов вроде "p", "F",
// "A", чтобы не задеть их как часть более длинного слова/индекса.
const bare = (letter: string) =>
	new RegExp(`(?<![a-zA-Zа-яА-Я])${letter}(?![a-zA-Zа-яА-Я_{])`)

// t_units.id -> правила. Id подтверждены прямым запросом к БД (4=Динамика,
// 5=Кинематика, 6=Газ и нагрев, 7=Электростатика, 8=Электродинамика,
// 9=Оптика) — см. запись в CLAUDE.md.
const RULES_BY_UNIT: Record<number, UnitRules> = {
	// ---------------- 4. Динамика ----------------
	4: {
		formula: {
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
		},
		name: {
			'сила тяжести': 'gravity',
			'сила упругости': 'elastic',
			'сила Архимеда': 'buoyancy',
			'давление': 'pressure-liquid', // без формулы неоднозначно (тело/жидкость)
			'кинетическая энергия': 'kinetic-energy',
			'потенциальная энергия': 'potential-energy',
			'энергия пружины': 'spring-energy',
			'импульс тела': 'momentum',
			'равнодействующая сила': 'net-force',
			'вес тела': 'elevator-weight',
			'период колебаний': 'oscillation-period',
		},
		symbol: [
			// Законы сохранения — формула-равенство, не одна величина (см.
			// правило про const/ЗСИ/ЗСЭ в lib/formulaLetters.ts).
			{ pattern: /^ЗСИ/, sticker: 'momentum-conservation' },
			{ pattern: /^ЗСЭ/, sticker: 'energy-conservation' },
			{ pattern: /F_\{тяж\}/, sticker: 'gravity' },
			{ pattern: /F_\{упр\}/, sticker: 'elastic' },
			{ pattern: /F_\{Арх\}/, sticker: 'buoyancy' },
			{ pattern: /E_\{кин\}/, sticker: 'kinetic-energy' },
			{ pattern: /E_\{пот\}/, sticker: 'potential-energy' },
			{ pattern: /E_\{пруж\}/, sticker: 'spring-energy' },
			{ pattern: bare('p'), sticker: 'momentum' },
			{ pattern: bare('T'), sticker: 'oscillation-period' },
			// Голая "F" однозначна — F_тяж/F_упр/F_Арх выше уже перехватили
			// все подстрочные варианты.
			{ pattern: bare('F'), sticker: 'net-force' },
			// Голая "P" намеренно НЕ включена — неоднозначна (давление ИЛИ
			// вес тела) без формулы/названия рядом.
		],
	},

	// ---------------- 5. Кинематика ----------------
	5: {
		formula: {},
		name: {
			'координата': 'coordinate-motion',
			'путь': 'coordinate-motion',
			'ускорение': 'acceleration-kin',
			'частота': 'circular-motion',
			'центростремительное ускорение': 'circular-motion',
			'угловая скорость': 'circular-motion',
			'дальность броска': 'projectile-motion',
			'высота броска': 'projectile-motion',
		},
		symbol: [
			{ pattern: /a_\{цс\}/, sticker: 'circular-motion' },
			{ pattern: /L_\{max\}/, sticker: 'projectile-motion' },
			{ pattern: /H_\{max\}/, sticker: 'projectile-motion' },
			{ pattern: /\\omega/, sticker: 'circular-motion' },
			{ pattern: /\\nu/, sticker: 'circular-motion' },
			{ pattern: bare('S'), sticker: 'coordinate-motion' },
			{ pattern: bare('x'), sticker: 'coordinate-motion' },
			{ pattern: bare('a'), sticker: 'acceleration-kin' },
		],
	},

	// ---------------- 6. Газ и нагрев ----------------
	6: {
		formula: {},
		name: {
			'давление идеального газа': 'gas-molecules',
			'плотность': 'gas-molecules',
			'концентрация молекул': 'gas-molecules',
			'количество вещества': 'gas-molecules',
			'средняя энергия теплового движения молекулы': 'kinetic-energy',
			'кинетическая энергия молекулы': 'kinetic-energy',
			'средняя квадратичная скорость молекул': 'kinetic-energy',
			'изменение внутренней энергии': 'gas-piston-work',
			'работа газа': 'gas-piston-work',
			'количество теплоты': 'heating',
			'полезная работа': 'heat-engine',
		},
		symbol: [
			{ pattern: /^МДК/, sticker: 'gas-molecules' },
			{ pattern: /^Первый законТД/, sticker: 'gas-piston-work' },
			{ pattern: /^Нагрев/, sticker: 'heating' },
			{ pattern: /^Плавление/, sticker: 'phase-change' },
			{ pattern: /^Испарение/, sticker: 'phase-change' },
			{ pattern: /^Энергия сгорания/, sticker: 'heating' },
			{ pattern: /\\eta/, sticker: 'heat-engine' },
			{ pattern: /A_\{пол\}/, sticker: 'heat-engine' },
			{ pattern: /E_\{кин\}/, sticker: 'kinetic-energy' },
			{ pattern: /<v>/, sticker: 'kinetic-energy' },
			{ pattern: /\\triangle U/, sticker: 'gas-piston-work' },
			{ pattern: /\\phi/, sticker: 'humidity' },
			{ pattern: /\\rho/, sticker: 'gas-molecules' },
			{ pattern: /\\nu/, sticker: 'gas-molecules' },
			{ pattern: bare('n'), sticker: 'gas-molecules' },
			{ pattern: bare('p'), sticker: 'gas-molecules' },
			{ pattern: bare('Q'), sticker: 'heating' },
			{ pattern: bare('A'), sticker: 'gas-piston-work' },
			{ pattern: bare('E'), sticker: 'kinetic-energy' },
		],
	},

	// ---------------- 7. Электростатика ----------------
	7: {
		formula: {},
		name: {
			'сила Кулона': 'coulomb-force',
			'напряжённость электрического поля': 'electric-field',
			'потенциал электрического поля': 'electric-potential',
			'электроёмкость конденсатора': 'capacitor',
			'энергия конденсатора': 'capacitor-energy',
			'работа источника тока': 'circuit',
			'сопротивление проводника': 'circuit',
			'мощность тока': 'circuit',
			'сила тока': 'circuit',
		},
		symbol: [
			{ pattern: /F_\{Кул\}/, sticker: 'coulomb-force' },
			{ pattern: /\\phi/, sticker: 'electric-potential' },
			{ pattern: bare('C'), sticker: 'capacitor' },
			{ pattern: bare('W'), sticker: 'capacitor-energy' },
			{ pattern: bare('T'), sticker: 'oscillation-period' },
			{ pattern: bare('R'), sticker: 'circuit' },
			{ pattern: bare('N'), sticker: 'circuit' },
			{ pattern: bare('E'), sticker: 'electric-field' },
			{ pattern: bare('A'), sticker: 'circuit' },
			{ pattern: bare('i'), sticker: 'circuit' },
		],
	},

	// ---------------- 8. Электродинамика ----------------
	8: {
		formula: {},
		name: {
			'сила Лоренца': 'lorentz-force',
			'сила Ампера': 'ampere-force',
			'ЭДС индукции': 'induction',
			'магнитный поток': 'induction',
			'период колебаний': 'oscillation-period',
		},
		symbol: [
			{ pattern: /^Закон Фарадея/, sticker: 'induction' },
			{ pattern: /F_\{Лор\}/, sticker: 'lorentz-force' },
			{ pattern: /F_\{[АA]\}/, sticker: 'ampere-force' }, // "А" в БД — кириллица, но подстрахуемся и латиницей
			{ pattern: /ε_\{i\}/, sticker: 'induction' },
			{ pattern: /Φ/, sticker: 'induction' },
			{ pattern: bare('T'), sticker: 'oscillation-period' },
			{ pattern: bare('W'), sticker: 'capacitor-energy' },
		],
	},

	// ---------------- 9. Оптика ----------------
	9: {
		formula: {},
		name: {
			'скорость света в среде': 'refraction',
			'оптическая сила линзы': 'lens',
			'энергия фотона': 'photon',
			'работа выхода электронов': 'photoelectric',
			'импульс фотона': 'photon',
		},
		symbol: [
			{ pattern: /^Закон преломления/, sticker: 'refraction' },
			{ pattern: /^Дифракция/, sticker: 'diffraction' },
			{ pattern: /^Угол полного отражения/, sticker: 'total-reflection' },
			{ pattern: /^Условие\s+максимума/, sticker: 'diffraction' },
			{ pattern: /^Условие минимума/, sticker: 'diffraction' },
			{ pattern: /^Собирающая линза/, sticker: 'lens' },
			{ pattern: /^Увеличение линзы/, sticker: 'lens' },
			{ pattern: /^Фотоэффект/, sticker: 'photoelectric' },
			{ pattern: /A_\{вых\}/, sticker: 'photoelectric' },
			{ pattern: bare('D'), sticker: 'lens' },
			{ pattern: bare('v'), sticker: 'refraction' },
			{ pattern: bare('E'), sticker: 'photon' },
			{ pattern: bare('p'), sticker: 'photon' },
		],
	},
}

type ChallengeLike = {
	question: string
	t_challengeOptions: { text: string; correct: boolean }[]
}

export const getTopicSticker = (challenge: ChallengeLike, unitId: number | null | undefined): string | null => {
	if (!unitId) return null
	const rules = RULES_BY_UNIT[unitId]
	if (!rules) return null

	const correctText = challenge.t_challengeOptions.find((o) => o.correct)?.text
		?? challenge.t_challengeOptions[0]?.text
	if (correctText) {
		const canonical = canonicalFormula(correctText)
		if (rules.formula[canonical]) return rules.formula[canonical]

		const trimmedName = correctText.trim()
		if (rules.name[trimmedName]) return rules.name[trimmedName]
	}

	for (const rule of rules.symbol) {
		if (rule.pattern.test(challenge.question)) return rule.sticker
	}

	return null
}
