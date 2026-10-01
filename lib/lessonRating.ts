// lib/lessonRating.ts — шкала «Насколько понятен был урок?» (1 — хуже всего).
export const LESSON_RATING_OPTIONS = [
	{ score: 1, emoji: '😵‍💫', label: 'Мозг.exe не отвечает', hint: 'ничего не понял' },
	{ score: 2, emoji: '🤨', label: 'Ну такое…', hint: 'понял через раз' },
	{ score: 3, emoji: '😎', label: 'Норм, вкатился', hint: 'в целом понятно' },
	{ score: 4, emoji: '🤯', label: 'База! Всё изи', hint: 'понял всё' },
] as const
