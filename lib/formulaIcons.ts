// lib/formulaIcons.ts
//
// Тип задания PICMATCH ("сопоставь картинку и формулу") — пилот на теме
// "Динамика" (t_unit=4), см. CLAUDE.md. Таблица подобрана вручную по
// РЕАЛЬНЫМ question-текстам t_challenges этой темы (см. scripts/
// seedDynamicsVocabPilot*.ts) — не универсальный парсер формул; для
// следующей темы (Кинематика и т.д.) нужен свой набор правил здесь же.
// Модуль без React/lucide-react — безопасен для импорта из серверного
// page.tsx; сопоставление ключа с самой иконкой — в components/
// FormulaIcon.tsx (клиентский, рендерится в trainer-question.tsx).

export type FormulaIconKey =
	| 'kinetic-energy' | 'potential-energy' | 'spring-energy' | 'momentum'
	| 'pressure-solid' | 'pressure-liquid' | 'gravity-force' | 'archimedes-force'
	| 'elastic-force' | 'newton-second-law' | 'weight-up' | 'weight-down'
	| 'pendulum-period'

const RULES: { test: (question: string) => boolean; icon: FormulaIconKey }[] = [
	{ test: (q) => q.startsWith('Кинетическая энергия'), icon: 'kinetic-energy' },
	{ test: (q) => q.startsWith('Потенциальная энергия'), icon: 'potential-energy' },
	{ test: (q) => q.startsWith('Энергия пружины'), icon: 'spring-energy' },
	{ test: (q) => q.startsWith('Импульс тела'), icon: 'momentum' },
	{ test: (q) => q.startsWith('Давление тела'), icon: 'pressure-solid' },
	{ test: (q) => q.startsWith('Давление жидкости'), icon: 'pressure-liquid' },
	{ test: (q) => q.startsWith('Сила тяжести'), icon: 'gravity-force' },
	{ test: (q) => q.startsWith('Сила Архимеда'), icon: 'archimedes-force' },
	{ test: (q) => q.startsWith('Сила упругости'), icon: 'elastic-force' },
	{ test: (q) => q.startsWith('2-ой закон Ньютона'), icon: 'newton-second-law' },
	// "Вес в лифте↑"/"Вес в лифте↓" отличаются только направляющей стрелкой
	// в самом тексте вопроса (см. scripts/seedDynamicsVocabPilot2.ts) —
	// проверка направления ДО общей проверки "Вес в лифте" важна, иначе
	// первое правило по startsWith перехватило бы оба случая на 'weight-up'.
	{ test: (q) => q.startsWith('Вес в лифте') && q.includes('\\downarrow'), icon: 'weight-down' },
	{ test: (q) => q.startsWith('Вес в лифте') && q.includes('\\uparrow'), icon: 'weight-up' },
	{ test: (q) => q.startsWith('Период колебаний'), icon: 'pendulum-period' },
]

export const getFormulaIconKey = (question: string): FormulaIconKey | null =>
	RULES.find((r) => r.test(question))?.icon ?? null
