// lib/vibes.ts
//
// Экран "Что тебе заходит?" перед пробным уроком гостя (components/
// guest-vibe-picker.tsx): ученик выбирает 3-5 плиток — гаджеты, игры,
// музыка, еда, спорт, увлечения — и позывной собирается из его же выбора
// (прилагательное от одной плитки + существительное от другой), а не
// полностью случайно (lib/nickname.ts — фоллбэк, если экран пропущен).
//
// Бренды и игры — только текстом (без логотипов/картинок), как упоминание.

export type VibeCategory = 'gadgets' | 'games' | 'music' | 'food' | 'sport' | 'hobby'

export type Vibe = {
	id: string
	emoji: string
	label: string
	category: VibeCategory
	adj: string
	noun: string
}

export const VIBE_CATEGORIES: { id: VibeCategory; title: string }[] = [
	{ id: 'games', title: 'Игры' },
	{ id: 'music', title: 'Музыка' },
	{ id: 'gadgets', title: 'Гаджеты' },
	{ id: 'food', title: 'Еда' },
	{ id: 'sport', title: 'Спорт' },
	{ id: 'hobby', title: 'Увлечения' },
]

export const VIBES: Vibe[] = [
	// Игры
	{ id: 'minecraft', emoji: '⛏️', label: 'Майнкрафт', category: 'games', adj: 'Кубический', noun: 'Крафтер' },
	{ id: 'cs', emoji: '🎯', label: 'КС', category: 'games', adj: 'Хедшотный', noun: 'Снайпер' },
	{ id: 'dota', emoji: '⚔️', label: 'Дота', category: 'games', adj: 'Мидовый', noun: 'Керри' },
	{ id: 'brawl', emoji: '💥', label: 'Бравл Старс', category: 'games', adj: 'Звёздный', noun: 'Бравлер' },
	{ id: 'roblox', emoji: '🧱', label: 'Роблокс', category: 'games', adj: 'Пиксельный', noun: 'Роблоксер' },
	{ id: 'racing', emoji: '🏎️', label: 'Гонки', category: 'games', adj: 'Турбированный', noun: 'Гонщик' },
	// Музыка
	{ id: 'rap', emoji: '🎤', label: 'Рэп', category: 'music', adj: 'Битовый', noun: 'Рэпер' },
	{ id: 'phonk', emoji: '🚗', label: 'Фонк', category: 'music', adj: 'Фонковый', noun: 'Дрифтер' },
	{ id: 'rock', emoji: '🎸', label: 'Рок', category: 'music', adj: 'Громкий', noun: 'Рокер' },
	{ id: 'kpop', emoji: '💜', label: 'K-pop', category: 'music', adj: 'Сияющий', noun: 'Айдол' },
	{ id: 'pop', emoji: '🕺', label: 'Поп', category: 'music', adj: 'Трендовый', noun: 'Танцор' },
	{ id: 'classic', emoji: '🎻', label: 'Классика', category: 'music', adj: 'Утончённый', noun: 'Маэстро' },
	// Гаджеты
	{ id: 'iphone', emoji: '📱', label: 'Айфон', category: 'gadgets', adj: 'Яблочный', noun: 'Айфонщик' },
	{ id: 'headphones', emoji: '🎧', label: 'Наушники', category: 'gadgets', adj: 'Басовый', noun: 'Меломан' },
	{ id: 'console', emoji: '🎮', label: 'Плойка', category: 'gadgets', adj: 'Консольный', noun: 'Геймер' },
	{ id: 'gamingpc', emoji: '🖥️', label: 'Игровой ПК', category: 'gadgets', adj: 'Разогнанный', noun: 'Сетапер' },
	{ id: 'watch', emoji: '⌚', label: 'Смарт-часы', category: 'gadgets', adj: 'Умный', noun: 'Хронометр' },
	{ id: 'camera', emoji: '📸', label: 'Камера', category: 'gadgets', adj: 'Кадровый', noun: 'Блогер' },
	// Еда
	{ id: 'pizza', emoji: '🍕', label: 'Пицца', category: 'food', adj: 'Сырный', noun: 'Пиццеед' },
	{ id: 'burger', emoji: '🍔', label: 'Бургеры', category: 'food', adj: 'Двойной', noun: 'Бургермен' },
	{ id: 'sushi', emoji: '🍣', label: 'Роллы', category: 'food', adj: 'Самурайский', noun: 'Сушист' },
	{ id: 'soda', emoji: '🥤', label: 'Газировка', category: 'food', adj: 'Шипучий', noun: 'Пузырь' },
	{ id: 'noodles', emoji: '🍜', label: 'Лапша', category: 'food', adj: 'Лапшичный', noun: 'Студент' },
	{ id: 'sweets', emoji: '🍩', label: 'Сладкое', category: 'food', adj: 'Сахарный', noun: 'Пончик' },
	// Спорт
	{ id: 'football', emoji: '⚽', label: 'Футбол', category: 'sport', adj: 'Голевой', noun: 'Форвард' },
	{ id: 'basketball', emoji: '🏀', label: 'Баскетбол', category: 'sport', adj: 'Трёхочковый', noun: 'Данкер' },
	{ id: 'skate', emoji: '🛹', label: 'Скейт', category: 'sport', adj: 'Уличный', noun: 'Скейтер' },
	{ id: 'fight', emoji: '🥊', label: 'Единоборства', category: 'sport', adj: 'Нокаутный', noun: 'Боец' },
	{ id: 'gym', emoji: '🏋️', label: 'Качалка', category: 'sport', adj: 'Качёвый', noun: 'Атлет' },
	{ id: 'bike', emoji: '🚲', label: 'Велик', category: 'sport', adj: 'Быстрый', noun: 'Райдер' },
	// Увлечения
	{ id: 'anime', emoji: '🍥', label: 'Аниме', category: 'hobby', adj: 'Анимешный', noun: 'Сенсей' },
	{ id: 'tiktok', emoji: '📹', label: 'Тикток', category: 'hobby', adj: 'Вирусный', noun: 'Тиктокер' },
	{ id: 'series', emoji: '🍿', label: 'Сериалы', category: 'hobby', adj: 'Сериальный', noun: 'Киноман' },
	{ id: 'drawing', emoji: '🎨', label: 'Рисование', category: 'hobby', adj: 'Творческий', noun: 'Художник' },
	{ id: 'cats', emoji: '🐱', label: 'Котики', category: 'hobby', adj: 'Мурчащий', noun: 'Котовод' },
	{ id: 'books', emoji: '📚', label: 'Книги', category: 'hobby', adj: 'Начитанный', noun: 'Книжник' },
]

export const VIBE_MIN = 3
export const VIBE_MAX = 5

// Те же вкусовые слова/титулы и та же редкость по числу слов, что и в
// lib/nickname.ts: 70% — 2 слова, 24% — 3, 6% — 4 с титулом.
const FLAVOR_WORDS = ['Кранчи', 'Твистер', 'Наггетс', 'Комбо', 'Спайси', 'Хрустяш', 'Роял']
const TITLES = ['Сэр', 'Лорд', 'Барон', 'Граф', 'Дон', 'Магистр']

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Прилагательное и существительное — от РАЗНЫХ плиток (если выбрано больше
// одной), чтобы позывной отражал сразу два увлечения ("Кубический Рэпер").
export const buildNicknameFromVibes = (ids: string[]): string => {
	const chosen = VIBES.filter((v) => ids.includes(v.id))
	if (chosen.length === 0) return 'Загадочный Ученик'
	const adjVibe = pick(chosen)
	const rest = chosen.filter((v) => v.id !== adjVibe.id)
	const nounVibe = rest.length > 0 ? pick(rest) : adjVibe
	const adj = adjVibe.adj
	const noun = nounVibe.noun

	const roll = Math.random()
	if (roll < 0.06) return `${pick(TITLES)} ${adj} ${pick(FLAVOR_WORDS)} ${noun}`
	if (roll < 0.3) return `${adj} ${noun} ${pick(FLAVOR_WORDS)}`
	return `${adj} ${noun}`
}
