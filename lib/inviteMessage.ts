// lib/inviteMessage.ts
//
// Текст приглашения друга (кнопка «🍕 Позвать друга» на итогах урока).
// Блоки через пустые строки — в мессенджере читается как карточка.
// Ссылку добавляет shareInviteLink последней строкой: по ней мессенджер
// рисует картинку-превью (app/i/[code]).

const HOOKS = [
	'Я тут физику прохожу и пиццу фармлю 🍕',
	'Нашёл приложение, где за физику дают пиццу. Без шуток 🍕',
	'Залетай, тут ЕГЭ решают за пиццу 🍕',
]

export const formatSeconds = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

export const buildInviteMessage = ({
	nickname,
	lessonTitle,
	seconds,
	streak,
}: {
	nickname: string | null
	lessonTitle: string
	seconds: number
	streak: number
}) => {
	const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)]
	const lines = [
		'🍕 ЗАРАБОТАЙ НАМ ПИЦЦУ!',
		'',
		hook,
		'',
		nickname ? `😎 ${nickname}` : null,
		`⚡ «${lessonTitle}» — за ${formatSeconds(seconds)}${streak >= 3 ? `, ${streak} подряд без ошибок` : ''}`,
		'',
		'👇 Пройди урок по ссылке — регистрация не нужна.',
		'Пройдёшь 3 урока Электродинамики — кусочек пиццы получим ОБА 🤝',
		'',
		'Слабо побить мой результат? 😏',
	]
	return lines.filter((l) => l !== null).join('\n')
}
