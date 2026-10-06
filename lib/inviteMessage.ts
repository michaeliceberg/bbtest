// lib/inviteMessage.ts
//
// Текст приглашения друга (кнопка «🍕 Позвать друга» на итогах урока).
// Блоки через пустые строки — в мессенджере читается как карточка.
// Ссылку добавляет shareInviteLink последней строкой: по ней мессенджер
// рисует картинку-превью (app/i/[code]).

import { TRIAL_TRACKS, type TrialSubject } from '@/lib/trialTracks'

const hooksFor = (subject: TrialSubject) => [
	`Я тут ${TRIAL_TRACKS[subject].subjectAcc} прохожу и пиццу фармлю 🍕`,
	`Нашёл приложение, где за ${TRIAL_TRACKS[subject].subjectAcc} дают пиццу. Без шуток 🍕`,
	'Залетай, тут ЕГЭ решают за пиццу 🍕',
]

// Подпись кнопки приглашения друга (итоги урока и экран приза гостя).
export const battleButtonLabel = (subject: TrialSubject) => `Кто круче в ${TRIAL_TRACKS[subject].subjectPrep}? Баттл с другом 🍕`

export const formatSeconds = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

export const buildInviteMessage = ({
	nickname,
	lessonTitle,
	seconds,
	streak,
	subject = 'physics',
}: {
	nickname: string | null
	lessonTitle: string
	seconds: number
	streak: number
	subject?: TrialSubject
}) => {
	const HOOKS = hooksFor(subject)
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
		`Пройдёшь 3 урока ${TRIAL_TRACKS[subject].topicGen} — кусочек пиццы получим ОБА 🤝`,
		'',
		'Слабо побить мой результат? 😏',
	]
	return lines.filter((l) => l !== null).join('\n')
}
