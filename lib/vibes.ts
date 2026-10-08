// lib/vibes.ts
//
// Экран "Что тебе заходит?" перед пробным уроком гостя (components/
// guest-vibe-picker.tsx): ученик выбирает 3-5 плиток — гаджеты, игры,
// музыка, еда, спорт, увлечения — и позывной собирается из его же выбора
// (прилагательное от одной плитки + существительное от другой), а не
// полностью случайно (lib/nickname.ts — фоллбэк, если экран пропущен).
//
// У игр — маленькие картинки (public/vibes/*.webp, по просьбе пользователя
// 2026-10-01; чужой арт — решение пользователя), у остальных — эмодзи.

export type VibeCategory = 'gadgets' | 'games' | 'music' | 'food' | 'sport' | 'hobby' | 'streamers'

export type Vibe = {
	id: string
	emoji: string
	label: string
	category: VibeCategory
	adj: string
	noun: string
	// Картинка вместо эмодзи на плитке.
	image?: string
}

export const VIBE_CATEGORIES: { id: VibeCategory; title: string }[] = [
	{ id: 'games', title: 'Игры' },
	{ id: 'streamers', title: 'Любимый стример' },
	{ id: 'food', title: 'Еда' },
	{ id: 'sport', title: 'Спорт' },
	{ id: 'hobby', title: 'Увлечения' },
	{ id: 'music', title: 'Музыка' },
	{ id: 'gadgets', title: 'Гаджеты' },
]

export const VIBES: Vibe[] = [
	// Игры
	{ id: 'minecraft', emoji: '⛏️', label: 'Майнкрафт', category: 'games', adj: 'Кубический', noun: 'Крафтер', image: '/vibes/minecraft.webp?v=2' },
	{ id: 'cs', emoji: '🎯', label: 'КС', category: 'games', adj: 'Хедшотный', noun: 'Снайпер', image: '/vibes/cs.webp?v=2' },
	{ id: 'dota', emoji: '⚔️', label: 'Дота', category: 'games', adj: 'Мидовый', noun: 'Керри', image: '/vibes/dota.webp?v=2' },
	{ id: 'brawl', emoji: '💥', label: 'Бравл Старс', category: 'games', adj: 'Звёздный', noun: 'Бравлер', image: '/vibes/brawl.webp' },
	{ id: 'roblox', emoji: '🧱', label: 'Роблокс', category: 'games', adj: 'Пиксельный', noun: 'Роблоксер', image: '/vibes/roblox.webp?v=2' },
	{ id: 'pubg', emoji: '🪂', label: 'Пабг', category: 'games', adj: 'Десантный', noun: 'Выживший', image: '/vibes/pubg.webp?v=2' },
	{ id: 'fortnite', emoji: '🪂', label: 'Фортнайт', category: 'games', adj: 'Строящий', noun: 'Фортнайтер', image: '/vibes/fortnite.webp?v=1' },
	{ id: 'gta', emoji: '🚓', label: 'ГТА', category: 'games', adj: 'Угарный', noun: 'Угонщик', image: '/vibes/gta.webp?v=1' },
	{ id: 'genshin', emoji: '✨', label: 'Геншин', category: 'games', adj: 'Элементальный', noun: 'Путешественник', image: '/vibes/genshin.webp?v=1' },
	{ id: 'valorant', emoji: '🔫', label: 'Валорант', category: 'games', adj: 'Агентский', noun: 'Дуэлянт', image: '/vibes/valorant.webp?v=1' },
	{ id: 'amongus', emoji: '🧑‍🚀', label: 'Амонг Ас', category: 'games', adj: 'Подозрительный', noun: 'Импостер', image: '/vibes/amongus.webp?v=1' },
	{ id: 'standoff', emoji: '🎖️', label: 'Стандофф', category: 'games', adj: 'Тактический', noun: 'Штурмовик', image: '/vibes/standoff.webp?v=1' },
	{ id: 'fifa', emoji: '🕹️', label: 'ФИФА', category: 'games', adj: 'Виртуальный', noun: 'Тренер', image: '/vibes/fifa.webp?v=1' },
	{ id: 'clash', emoji: '🏰', label: 'Клеш', category: 'games', adj: 'Золотой', noun: 'Рейдер', image: '/vibes/clash.webp?v=1' },
	{ id: 'tanks', emoji: '🪖', label: 'Танки', category: 'games', adj: 'Броневой', noun: 'Танкист', image: '/vibes/tanks.webp?v=1' },
	{ id: 'sims', emoji: '🏠', label: 'Симс', category: 'games', adj: 'Домашний', noun: 'Симулятор', image: '/vibes/sims.webp?v=1' },
	// Стримеры (фото — public/vibes/st_*.webp)
	{ id: 'st_buster', emoji: '📺', label: 'Бустер', category: 'streamers', adj: 'Бустовый', noun: 'Бустер', image: '/vibes/st_buster.webp?v=1' },
	{ id: 'st_simple', emoji: '📺', label: 'Симпл', category: 'streamers', adj: 'Хладнокровный', noun: 'Симпл', image: '/vibes/st_simple.webp?v=1' },
	{ id: 'st_bratishkin', emoji: '📺', label: 'Братишкин', category: 'streamers', adj: 'Братский', noun: 'Братишкин', image: '/vibes/st_bratishkin.webp?v=1' },
	{ id: 'st_zubarev', emoji: '📺', label: 'Зубарев', category: 'streamers', adj: 'Зубастый', noun: 'Зубарев', image: '/vibes/st_zubarev.webp?v=1' },
	{ id: 'st_paradeevich', emoji: '📺', label: 'Парадеевич', category: 'streamers', adj: 'Парадный', noun: 'Парадеевич', image: '/vibes/st_paradeevich.webp?v=1' },
	{ id: 'st_nikoglai', emoji: '📺', label: 'Никоглай', category: 'streamers', adj: 'Громкий', noun: 'Никоглай', image: '/vibes/st_nikoglai.webp?v=1' },
	{ id: 'st_evelon', emoji: '📺', label: 'Эвелон', category: 'streamers', adj: 'Эпичный', noun: 'Эвелон', image: '/vibes/st_evelon.webp?v=1' },
	{ id: 'st_koresh', emoji: '📺', label: 'Кореш', category: 'streamers', adj: 'Корефанский', noun: 'Кореш', image: '/vibes/st_koresh.webp?v=1' },
	{ id: 'st_recrent', emoji: '📺', label: 'Рекрент', category: 'streamers', adj: 'Рекордный', noun: 'Рекрент', image: '/vibes/st_recrent.webp?v=1' },
	{ id: 'st_sasavot', emoji: '📺', label: 'Сасавот', category: 'streamers', adj: 'Ламповый', noun: 'Сасавот', image: '/vibes/st_sasavot.webp?v=1' },
	{ id: 'st_hesus', emoji: '📺', label: 'Хесус', category: 'streamers', adj: 'Легендарный', noun: 'Хесус', image: '/vibes/st_hesus.webp?v=1' },
	{ id: 'st_gensuha', emoji: '📺', label: 'Генсуха', category: 'streamers', adj: 'Рофловый', noun: 'Генсуха', image: '/vibes/st_gensuha.webp?v=1' },
	{ id: 'st_strogo', emoji: '📺', label: 'Строго', category: 'streamers', adj: 'Чатовый', noun: 'Строго', image: '/vibes/st_strogo.webp?v=1' },
	{ id: 'st_lix', emoji: '📺', label: 'Ликс', category: 'streamers', adj: 'Донатный', noun: 'Ликс', image: '/vibes/st_lix.webp?v=1' },
	{ id: 'st_tenderlybae', emoji: '📺', label: 'Тендерлибае', category: 'streamers', adj: 'Нежный', noun: 'Тендерлибае', image: '/vibes/st_tenderlybae.webp?v=1' },
	{ id: 'st_frame', emoji: '📺', label: 'Фрейм', category: 'streamers', adj: 'Хайповый', noun: 'Фрейм', image: '/vibes/st_frame.webp?v=1' },
	// Музыка
	{ id: 'rap', emoji: '🎤', label: 'Рэп', category: 'music', adj: 'Битовый', noun: 'Рэпер' },
	{ id: 'phonk', emoji: '🚗', label: 'Фонк', category: 'music', adj: 'Фонковый', noun: 'Дрифтер' },
	{ id: 'rock', emoji: '🎸', label: 'Рок', category: 'music', adj: 'Громкий', noun: 'Рокер' },
	{ id: 'kpop', emoji: '💜', label: 'K-pop', category: 'music', adj: 'Сияющий', noun: 'Айдол' },
	{ id: 'pop', emoji: '🕺', label: 'Поп', category: 'music', adj: 'Трендовый', noun: 'Танцор' },
	{ id: 'classic', emoji: '🎻', label: 'Классика', category: 'music', adj: 'Утончённый', noun: 'Маэстро' },
	{ id: 'techno', emoji: '🎛️', label: 'Электроника', category: 'music', adj: 'Электронный', noun: 'Диджей' },
	{ id: 'lofi', emoji: '☕', label: 'Лофи', category: 'music', adj: 'Расслабленный', noun: 'Лофист' },
	{ id: 'metal', emoji: '🤘', label: 'Метал', category: 'music', adj: 'Тяжёлый', noun: 'Металлист' },
	{ id: 'indie', emoji: '🌿', label: 'Инди', category: 'music', adj: 'Ламповый', noun: 'Инди-кид' },
	{ id: 'shanson', emoji: '🎹', label: 'Шансон', category: 'music', adj: 'Душевный', noun: 'Шансонье' },
	{ id: 'hiphop', emoji: '🧢', label: 'Хип-хоп', category: 'music', adj: 'Уличный', noun: 'МС' },
	{ id: 'dubstep', emoji: '🔊', label: 'Дабстеп', category: 'music', adj: 'Басовитый', noun: 'Дропер' },
	{ id: 'guitar', emoji: '🎼', label: 'Гитара', category: 'music', adj: 'Струнный', noun: 'Гитарист' },
	// Гаджеты
	{ id: 'iphone', emoji: '📱', label: 'Айфон', category: 'gadgets', adj: 'Яблочный', noun: 'Айфонщик' },
	{ id: 'headphones', emoji: '🎧', label: 'Наушники', category: 'gadgets', adj: 'Басовый', noun: 'Меломан' },
	{ id: 'console', emoji: '🎮', label: 'Плойка', category: 'gadgets', adj: 'Консольный', noun: 'Геймер' },
	{ id: 'gamingpc', emoji: '🖥️', label: 'Игровой ПК', category: 'gadgets', adj: 'Разогнанный', noun: 'Сетапер' },
	{ id: 'watch', emoji: '⌚', label: 'Смарт-часы', category: 'gadgets', adj: 'Умный', noun: 'Хронометр' },
	{ id: 'camera', emoji: '📸', label: 'Камера', category: 'gadgets', adj: 'Кадровый', noun: 'Блогер' },
	{ id: 'laptop', emoji: '💻', label: 'Ноутбук', category: 'gadgets', adj: 'Ноутбучный', noun: 'Хакер' },
	{ id: 'drone', emoji: '🚁', label: 'Дрон', category: 'gadgets', adj: 'Летающий', noun: 'Пилот' },
	{ id: 'vr', emoji: '🥽', label: 'VR-очки', category: 'gadgets', adj: 'Виртуальный', noun: 'Путешественник' },
	{ id: 'keyboard', emoji: '⌨️', label: 'Механика', category: 'gadgets', adj: 'Кликающий', noun: 'Клавиатурщик' },
	{ id: 'tablet', emoji: '🖊️', label: 'Планшет', category: 'gadgets', adj: 'Рисующий', noun: 'Планшетник' },
	{ id: 'scooter', emoji: '🛴', label: 'Самокат', category: 'gadgets', adj: 'Электрический', noun: 'Самокатчик' },
	{ id: 'powerbank', emoji: '🔋', label: 'Павербанк', category: 'gadgets', adj: 'Заряженный', noun: 'Зарядник' },
	{ id: 'robot', emoji: '🤖', label: 'Роботы', category: 'gadgets', adj: 'Кибернетический', noun: 'Робот' },
	// Еда
	{ id: 'pizza', emoji: '🍕', label: 'Пицца', category: 'food', adj: 'Сырный', noun: 'Пиццеед' },
	{ id: 'burger', emoji: '🍔', label: 'Бургеры', category: 'food', adj: 'Двойной', noun: 'Бургермен' },
	{ id: 'sushi', emoji: '🍣', label: 'Роллы', category: 'food', adj: 'Самурайский', noun: 'Сушист' },
	{ id: 'soda', emoji: '🥤', label: 'Газировка', category: 'food', adj: 'Шипучий', noun: 'Пузырь' },
	{ id: 'noodles', emoji: '🍜', label: 'Лапша', category: 'food', adj: 'Лапшичный', noun: 'Студент' },
	{ id: 'sweets', emoji: '🍩', label: 'Сладкое', category: 'food', adj: 'Сахарный', noun: 'Пончик' },
	{ id: 'fries', emoji: '🍟', label: 'Картошка фри', category: 'food', adj: 'Хрустящий', noun: 'Картофан' },
	{ id: 'chicken', emoji: '🍗', label: 'Наггетсы', category: 'food', adj: 'Золотой', noun: 'Наггетсоед' },
	{ id: 'shawarma', emoji: '🌯', label: 'Шаурма', category: 'food', adj: 'Острый', noun: 'Шаурмен' },
	{ id: 'icecream', emoji: '🍦', label: 'Мороженое', category: 'food', adj: 'Холодный', noun: 'Пломбир' },
	{ id: 'cola', emoji: '🧃', label: 'Сок', category: 'food', adj: 'Сочный', noun: 'Соковик' },
	{ id: 'dumplings', emoji: '🥟', label: 'Пельмени', category: 'food', adj: 'Домашний', noun: 'Пельмень' },
	{ id: 'chocolate', emoji: '🍫', label: 'Шоколад', category: 'food', adj: 'Шоколадный', noun: 'Шоколадник' },
	{ id: 'popcorn', emoji: '🍿', label: 'Попкорн', category: 'food', adj: 'Кинотеатровый', noun: 'Попкорнщик' },
	// Спорт
	{ id: 'football', emoji: '⚽', label: 'Футбол', category: 'sport', adj: 'Голевой', noun: 'Форвард' },
	{ id: 'basketball', emoji: '🏀', label: 'Баскетбол', category: 'sport', adj: 'Трёхочковый', noun: 'Данкер' },
	{ id: 'skate', emoji: '🛹', label: 'Скейт', category: 'sport', adj: 'Уличный', noun: 'Скейтер' },
	{ id: 'fight', emoji: '🥊', label: 'Единоборства', category: 'sport', adj: 'Нокаутный', noun: 'Боец' },
	{ id: 'gym', emoji: '🏋️', label: 'Качалка', category: 'sport', adj: 'Качёвый', noun: 'Атлет' },
	{ id: 'bike', emoji: '🚲', label: 'Велик', category: 'sport', adj: 'Быстрый', noun: 'Райдер' },
	{ id: 'tennis', emoji: '🎾', label: 'Теннис', category: 'sport', adj: 'Подающий', noun: 'Теннисист' },
	{ id: 'swim', emoji: '🏊', label: 'Плавание', category: 'sport', adj: 'Водный', noun: 'Пловец' },
	{ id: 'volleyball', emoji: '🏐', label: 'Волейбол', category: 'sport', adj: 'Блокирующий', noun: 'Связующий' },
	{ id: 'hockey', emoji: '🏒', label: 'Хоккей', category: 'sport', adj: 'Ледовый', noun: 'Хоккеист' },
	{ id: 'running', emoji: '🏃', label: 'Бег', category: 'sport', adj: 'Марафонский', noun: 'Бегун' },
	{ id: 'snowboard', emoji: '🏂', label: 'Сноуборд', category: 'sport', adj: 'Заснеженный', noun: 'Сноубордист' },
	{ id: 'parkour', emoji: '🤸', label: 'Паркур', category: 'sport', adj: 'Ловкий', noun: 'Паркурщик' },
	{ id: 'chess', emoji: '♟️', label: 'Шахматы', category: 'sport', adj: 'Стратегический', noun: 'Гроссмейстер' },
	// Увлечения
	{ id: 'anime', emoji: '🍥', label: 'Аниме', category: 'hobby', adj: 'Анимешный', noun: 'Сенсей' },
	{ id: 'tiktok', emoji: '📹', label: 'Тикток', category: 'hobby', adj: 'Вирусный', noun: 'Тиктокер' },
	{ id: 'series', emoji: '🍿', label: 'Сериалы', category: 'hobby', adj: 'Сериальный', noun: 'Киноман' },
	{ id: 'drawing', emoji: '🎨', label: 'Рисование', category: 'hobby', adj: 'Творческий', noun: 'Художник' },
	{ id: 'cats', emoji: '🐱', label: 'Котики', category: 'hobby', adj: 'Мурчащий', noun: 'Котовод' },
	{ id: 'books', emoji: '📚', label: 'Книги', category: 'hobby', adj: 'Начитанный', noun: 'Книжник' },
	{ id: 'memes', emoji: '😂', label: 'Мемы', category: 'hobby', adj: 'Мемный', noun: 'Мемолог' },
	{ id: 'cooking', emoji: '🍳', label: 'Готовка', category: 'hobby', adj: 'Кулинарный', noun: 'Шеф' },
	{ id: 'travel', emoji: '✈️', label: 'Путешествия', category: 'hobby', adj: 'Дорожный', noun: 'Турист' },
	{ id: 'photo', emoji: '📷', label: 'Фото', category: 'hobby', adj: 'Кадровый', noun: 'Фотограф' },
	{ id: 'dance', emoji: '💃', label: 'Танцы', category: 'hobby', adj: 'Танцевальный', noun: 'Танцор' },
	{ id: 'space', emoji: '🚀', label: 'Космос', category: 'hobby', adj: 'Космический', noun: 'Астронавт' },
	{ id: 'dogs', emoji: '🐶', label: 'Собаки', category: 'hobby', adj: 'Преданный', noun: 'Собаковод' },
	{ id: 'legos', emoji: '🧩', label: 'Конструкторы', category: 'hobby', adj: 'Собранный', noun: 'Конструктор' },
	{ id: 'cars', emoji: '🏎️', label: 'Машины', category: 'hobby', adj: 'Скоростной', noun: 'Автолюбитель' },
	{ id: 'stream', emoji: '📺', label: 'Стримы', category: 'hobby', adj: 'Эфирный', noun: 'Стример' },
]

// Минимум 5 плиток; верхней границы по сути нет — чем больше выбрано, тем больше сочетаний в позывном.
export const VIBE_MIN = 5
export const VIBE_MAX = 30

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

	// Чем больше плиток выбрано, тем чаще берём ТРЕТЬЮ плитку для второго прилагательного
	// («Кубический Басовый Рэпер») — комбинаций становится кратно больше.
	const third = rest.filter((v) => v.id !== nounVibe.id)
	const extraAdjChance = Math.min(0.5, Math.max(0, chosen.length - 5) * 0.08 + 0.15)
	if (third.length > 0 && Math.random() < extraAdjChance) {
		const adj2 = pick(third).adj
		const roll2 = Math.random()
		if (roll2 < 0.06) return `${pick(TITLES)} ${adj} ${adj2} ${noun}`
		return `${adj} ${adj2} ${noun}`
	}

	const roll = Math.random()
	if (roll < 0.06) return `${pick(TITLES)} ${adj} ${pick(FLAVOR_WORDS)} ${noun}`
	if (roll < 0.3) return `${adj} ${noun} ${pick(FLAVOR_WORDS)}`
	return `${adj} ${noun}`
}
