// lib/lessonRating.ts — шкала «Насколько понятен был урок?» (1 — хуже всего).
export const LESSON_RATING_OPTIONS = [
	{ score: 1, emoji: '😵‍💫', label: 'Мозг.exe не отвечает', hint: 'ничего не понял' },
	{ score: 2, emoji: '🤨', label: 'Ну такое…', hint: 'понял через раз' },
	{ score: 3, emoji: '😎', label: 'Норм, вкатился', hint: 'в целом понятно' },
	{ score: 4, emoji: '🤯', label: 'База! Всё изи', hint: 'понял всё' },
] as const

// Высшая оценка — вместо эмодзи случайный стикер (выбор пользователя 2026-10-02).
export const TOP_RATING_STICKERS = [
	{ src: '/stickers/rating/ponasenkov-1.webp', label: 'Переиграл и уничтожил!' },
	{ src: '/stickers/rating/ponasenkov-2.webp', label: 'Переиграл и уничтожил!' },
	{ src: '/stickers/rating/ponasenkov-3.webp', label: 'Переиграл и уничтожил!' },
	{ src: '/stickers/rating/ponasenkov-4.webp', label: 'Переиграл и уничтожил!' },
	{ src: '/stickers/rating/zhirinovsky.webp', label: 'Идеально' },
] as const

// Когда урок заметно переделали — дата правки (2026-10-02). Если ученик ставил
// оценку раньше этой даты, «Насколько понятен был урок?» спрашиваем ещё раз.
// После серьёзной переделки урока — дописать/обновить его дату здесь.
export const LESSON_CONTENT_UPDATED_AT: Record<number, string> = {
	490: '2026-10-02T17:36:14+03:00', // «Знакомство с окружностью»
}
