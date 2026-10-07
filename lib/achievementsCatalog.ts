// lib/achievementsCatalog.ts
//
// Каталог ачивок (Steam-стиль): ключ, группа, иконка-эмодзи (шаблонная — позже заменим картинками
// через поле iconSrc), весёлое название и подпись. Без серверного кода — используется и на сервере
// (выдача), и в браузере (тост, страница /achievements).

export type AchievementGroup = 'start' | 'progress' | 'accuracy' | 'habit' | 'chests' | 'friends';

export type AchievementDef = {
	key: string;
	group: AchievementGroup;
	emoji: string; // шаблонная иконка; потом — iconSrc
	iconSrc?: string; // путь к картинке, когда нарисуем (приоритетнее emoji)
	title: string;
	desc: string;
};

export const ACHIEVEMENT_GROUPS: { id: AchievementGroup; title: string; color: string }[] = [
	{ id: 'start', title: 'Первые шаги', color: '#53ADEF' },
	{ id: 'progress', title: 'Прогресс', color: '#78C93C' },
	{ id: 'accuracy', title: 'Точность', color: '#C385F7' },
	{ id: 'habit', title: 'Привычка', color: '#F09B38' },
	{ id: 'chests', title: 'Сундуки и пицца', color: '#EF9F27' },
	{ id: 'friends', title: 'Друзья и банды', color: '#BC418A' },
];

export const ACHIEVEMENTS: AchievementDef[] = [
	// Первые шаги
	{ key: 'hello_world', group: 'start', emoji: '👋', title: 'Привет, мир', desc: 'Зашёл в приложение впервые' },
	{ key: 'first_math', group: 'start', emoji: '📐', title: 'Первая кровь… то есть формула', desc: 'Решил первый урок тренажёра по математике' },
	{ key: 'first_physics', group: 'start', emoji: '🍎', title: 'Ньютон бы гордился', desc: 'Решил первый урок тренажёра по физике' },
	{ key: 'first_mistake', group: 'start', emoji: '🙈', title: 'Все с чего-то начинают', desc: 'Первый раз ошибся в тренажёре' },
	{ key: 'reference_open', group: 'start', emoji: '📖', title: 'Подсмотрел', desc: 'Открыл справочник впервые' },
	{ key: 'avatar_change', group: 'start', emoji: '🎭', title: 'Ребрендинг', desc: 'Сменил аватарку' },

	// Прогресс
	{ key: 'unit_done', group: 'progress', emoji: '🏁', title: 'Один юнит позади', desc: 'Прошёл целую тему тренажёра' },
	{ key: 'lessons_10', group: 'progress', emoji: '🔥', title: 'Разогрелся', desc: 'Прошёл 10 разных уроков' },
	{ key: 'lessons_50', group: 'progress', emoji: '💪', title: 'Втянулся', desc: 'Прошёл 50 разных уроков' },
	{ key: 'lessons_100', group: 'progress', emoji: '🏭', title: 'Станочный режим', desc: 'Прошёл 100 разных уроков' },
	{ key: 'all_math', group: 'progress', emoji: '🎓', title: 'Математик-пенсионер', desc: 'Прошёл весь тренажёр по математике' },
	{ key: 'all_physics', group: 'progress', emoji: '🪐', title: 'Властелин вселенной (локально)', desc: 'Прошёл весь тренажёр по физике' },
	{ key: 'all_achievements', group: 'progress', emoji: '👑', title: 'Настоящий король', desc: 'Получил все остальные ачивки' },
	{ key: 'boss_first', group: 'progress', emoji: '👹', title: 'Босс повержен (почти)', desc: 'Прошёл босс-экзамен' },
	{ key: 'step_clean', group: 'progress', emoji: '🧠', title: 'Прочитал, понял, победил', desc: 'Прошёл разбор «Урок» без единой ошибки' },

	// Точность
	{ key: 'lesson_clean', group: 'accuracy', emoji: '✨', title: 'Чистая работа', desc: 'Прошёл урок без единой ошибки' },
	{ key: 'clean_5', group: 'accuracy', emoji: '⌚', title: 'Швейцарские часы', desc: '5 уроков подряд без ошибок' },
	{ key: 'combo_8', group: 'accuracy', emoji: '⚡', title: 'Уровень «молния»', desc: '8 верных ответов подряд' },
	{ key: 'review_ok', group: 'accuracy', emoji: '🩹', title: 'Из ошибок растут', desc: 'Верно ответил в работе над ошибками' },
	{ key: 'review_first', group: 'accuracy', emoji: '🎯', title: 'Исправился с первого раза', desc: 'Работа над ошибками прошла с первой попытки' },
	{ key: 'mistakes_3', group: 'accuracy', emoji: '🌧️', title: 'Сегодня не твой день', desc: '3 ошибки подряд — бывает!' },

	// Привычка
	{ key: 'streak_3', group: 'habit', emoji: '🌱', title: 'Не бросил — уже герой', desc: '3 дня подряд' },
	{ key: 'streak_7', group: 'habit', emoji: '📅', title: 'Неделя без отмазок', desc: '7 дней подряд' },
	{ key: 'streak_30', group: 'habit', emoji: '🩺', title: 'Это уже диагноз', desc: '30 дней подряд' },
	{ key: 'hw_first', group: 'habit', emoji: '🐭', title: 'Домашняя крыса', desc: 'Выполнил первое домашнее задание' },
	{ key: 'hw_10', group: 'habit', emoji: '🐹', title: 'Домашний зверь', desc: 'Выполнил 10 домашних заданий' },
	{ key: 'hw_50', group: 'habit', emoji: '🦖', title: 'Домашний тиран', desc: 'Выполнил 50 домашних заданий' },
	{ key: 'night_owl', group: 'habit', emoji: '🦉', title: 'Сова-отличник', desc: 'Прошёл урок после 23:00' },
	{ key: 'early_bird', group: 'habit', emoji: '🐓', title: 'Кто рано встаёт, тому ЕГЭ подаёт', desc: 'Прошёл урок до 7 утра' },

	// Сундуки и пицца
	{ key: 'chest_common', group: 'chests', emoji: '📦', title: 'Пока что просто сундук', desc: 'Получил первый обычный сундук' },
	{ key: 'chest_rare', group: 'chests', emoji: '🎁', title: 'О, уже интереснее', desc: 'Получил первый редкий сундук' },
	{ key: 'chest_mythic', group: 'chests', emoji: '🔮', title: 'Ты точно не взломал?', desc: 'Получил первый мифический сундук' },
	{ key: 'chest_mega', group: 'chests', emoji: '👑', title: 'Лотерея? Нет, талант', desc: 'Получил первый мега-сундук' },
	{ key: 'chests_10', group: 'chests', emoji: '🎰', title: 'Любитель азарта', desc: 'Открыл 10 сундуков' },
	{ key: 'first_gem', group: 'chests', emoji: '💎', title: 'Блестяшка', desc: 'Выбил гем из сундука' },
	{ key: 'first_gg', group: 'chests', emoji: '🏷️', title: 'GG, друг', desc: 'Выбил gg-стикер из сундука' },
	{ key: 'pizza_full', group: 'chests', emoji: '🍕', title: 'Пицца не за горами', desc: 'Собрал все 8 кусочков пиццы' },

	// Друзья и банды
	{ key: 'invite_first', group: 'friends', emoji: '📣', title: 'Агитатор', desc: 'Друг зарегистрировался по твоей ссылке' },
	{ key: 'friend_lesson', group: 'friends', emoji: '🤝', title: 'Хорошие у тебя друзья', desc: 'Приглашённый друг прошёл свой первый урок' },
	{ key: 'gang_create', group: 'friends', emoji: '🏴', title: 'Босс района', desc: 'Создал банду' },
];

export const ACHIEVEMENT_BY_KEY: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a]));

// Награда за ачивку: забирается кликом на странице «Ачивки» (один раз).
export type AchievementReward = { kind: 'coins' | 'gems' | 'pizza'; amount: number };

export const REWARDS: Record<string, AchievementReward> = {
	hello_world: { kind: 'coins', amount: 30 },
	first_math: { kind: 'coins', amount: 50 },
	first_physics: { kind: 'coins', amount: 50 },
	first_mistake: { kind: 'coins', amount: 20 },
	reference_open: { kind: 'coins', amount: 20 },
	avatar_change: { kind: 'coins', amount: 20 },
	unit_done: { kind: 'gems', amount: 5 },
	lessons_10: { kind: 'coins', amount: 100 },
	lessons_50: { kind: 'gems', amount: 10 },
	lessons_100: { kind: 'pizza', amount: 2 },
	all_math: { kind: 'pizza', amount: 2 },
	all_physics: { kind: 'pizza', amount: 2 },
	all_achievements: { kind: 'pizza', amount: 2 },
	boss_first: { kind: 'gems', amount: 10 },
	step_clean: { kind: 'gems', amount: 5 },
	lesson_clean: { kind: 'coins', amount: 50 },
	clean_5: { kind: 'gems', amount: 8 },
	combo_8: { kind: 'gems', amount: 5 },
	review_ok: { kind: 'coins', amount: 20 },
	review_first: { kind: 'coins', amount: 50 },
	mistakes_3: { kind: 'coins', amount: 30 },
	streak_3: { kind: 'coins', amount: 50 },
	streak_7: { kind: 'gems', amount: 10 },
	streak_30: { kind: 'pizza', amount: 2 },
	hw_first: { kind: 'coins', amount: 30 },
	hw_10: { kind: 'gems', amount: 5 },
	hw_50: { kind: 'gems', amount: 10 },
	night_owl: { kind: 'coins', amount: 30 },
	early_bird: { kind: 'coins', amount: 30 },
	chest_common: { kind: 'coins', amount: 20 },
	chest_rare: { kind: 'gems', amount: 3 },
	chest_mythic: { kind: 'gems', amount: 5 },
	chest_mega: { kind: 'pizza', amount: 1 },
	chests_10: { kind: 'coins', amount: 100 },
	first_gem: { kind: 'gems', amount: 2 },
	first_gg: { kind: 'coins', amount: 30 },
	pizza_full: { kind: 'gems', amount: 5 },
	invite_first: { kind: 'pizza', amount: 1 },
	friend_lesson: { kind: 'pizza', amount: 1 },
	gang_create: { kind: 'coins', amount: 50 },
};

export const rewardText = (r: AchievementReward) =>
	r.kind === 'coins' ? `+${r.amount} монет` : r.kind === 'gems' ? `+${r.amount} ${r.amount === 1 ? 'гем' : r.amount < 5 ? 'гема' : 'гемов'}` : `+${r.amount} ${r.amount === 1 ? 'кусочек пиццы' : 'кусочка пиццы'}`;

export type AchievementDTO = { key: string; title: string; desc: string; emoji: string; iconSrc?: string; group: AchievementGroup };

export const toDTO = (a: AchievementDef): AchievementDTO => ({ key: a.key, title: a.title, desc: a.desc, emoji: a.emoji, iconSrc: a.iconSrc, group: a.group });

// События, о которых может сообщить браузер (остальные ачивки выдаются только сервером).
export const CLIENT_EVENT_KEYS = ['first_mistake', 'mistakes_3', 'combo_8', 'review_ok', 'review_first', 'reference_open'] as const;
export type ClientEventKey = (typeof CLIENT_EVENT_KEYS)[number];
