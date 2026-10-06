// lib/inviteMessage.ts
//
// Текст приглашения друга (кнопка «Кто круче в …? Баттл с другом 🍕» на итогах урока).
// Блоки через пустые строки — в мессенджере читается как карточка.
// Ссылку добавляет shareInviteLink последней строкой: по ней мессенджер
// рисует картинку-превью (app/i/[code]).

import { TRIAL_TRACKS, type TrialSubject } from '@/lib/trialTracks'

// Подпись кнопки приглашения друга (итоги урока и экран приза гостя).
export const battleButtonLabel = (subject: TrialSubject) => `Кто круче в ${TRIAL_TRACKS[subject].subjectPrep}? Баттл с другом 🍕`

export const formatSeconds = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

// Telegram сам превращает **текст** в жирный при отправке сообщения
// (разметка в поле ввода), поэтому выделяем никнейм и «ДОДО-ПИЦЦУ» звёздочками.
// В других мессенджерах (ВК, WhatsApp) звёздочки останутся видны — основная
// аудитория в Telegram.
export const buildBattleMessage = ({
	nickname,
	subject = 'physics',
	extraLine,
}: {
	nickname: string | null
	subject?: TrialSubject
	extraLine?: string
}) => {
	const lines = [
		nickname ? `Я **${nickname.toUpperCase()}** 🧙` : null,
		`ГО НА БАТТЛ ПО ${TRIAL_TRACKS[subject].battleSlang.toUpperCase()} — ЗАЛУТАЕМ **ДОДО-ПИЦЦУ**! 🍕`,
		'',
		extraLine ?? null,
		extraLine ? '' : null,
		'👇 Урок без регистрации — по ссылке:',
	]
	return lines.filter((l) => l !== null).join('\n')
}

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
}) => buildBattleMessage({
	nickname,
	subject,
	extraLine: `⚡ «${lessonTitle}» — за ${formatSeconds(seconds)}${streak >= 3 ? `, ${streak} подряд без ошибок` : ''}. Слабо побить? 😏`,
})
