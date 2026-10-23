'use client'

// components/lesson-share-button.tsx — кнопка «поделиться» у пошагового урока на карте /trainer
// (2026-10-23). Отправляет ссылку-приглашение именно на этот урок: друг проходит разбор
// без регистрации, в конце — кейс с призом и «Зарегистрируйся и забери приз».
import { createContext, useContext } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { shareInviteLink } from '@/components/share-story-button'
import { buildLessonInviteMessage } from '@/lib/inviteMessage'
import { getLessonInviteLink } from '@/lib/referral'
import type { TrialSubject } from '@/lib/trialTracks'
import { cn } from '@/lib/utils'

export type LessonShareInfo = { code: string | null; nickname: string | null; subject: TrialSubject }

// Данные приглашающего — контекстом, чтобы не тащить проп через все рендеры карты.
export const LessonShareContext = createContext<LessonShareInfo | null>(null)

// Кнопка для урока на карте: рисуется только если есть контекст (ученик вошёл).
export const MapLessonShare = ({ lessonId, lessonTitle, className }: { lessonId: number; lessonTitle: string; className?: string }) => {
	const info = useContext(LessonShareContext)
	return info ? <LessonShareButton lessonId={lessonId} lessonTitle={lessonTitle} info={info} className={className} /> : null
}

export const LessonShareButton = ({ lessonId, lessonTitle, info, className }: { lessonId: number; lessonTitle: string; info: LessonShareInfo; className?: string }) => {
	const onClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		const res = await shareInviteLink(
			buildLessonInviteMessage({ nickname: info.nickname, lessonTitle }),
			getLessonInviteLink(info.code, lessonId, info.subject),
		)
		if (res === 'copied') toast.success('Ссылка на урок скопирована — отправь другу 👌')
		else if (res === 'failed' && !(typeof navigator !== 'undefined' && 'share' in navigator)) toast.error('Не получилось скопировать ссылку')
	}
	return (
		<button
			type="button"
			onClick={onClick}
			title="Поделись уроком с другом! Ему станет понятнее!"
			aria-label={`Поделиться уроком «${lessonTitle}»`}
			className={cn(
				'pointer-events-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#FFE9A8]/50 bg-[#161F23]/90 text-[#FFD84D] transition active:scale-90 hover:bg-[#232F34]',
				className,
			)}
		>
			<Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />
		</button>
	)
}
