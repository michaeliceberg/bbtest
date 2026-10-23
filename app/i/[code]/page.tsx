// app/i/[code]/page.tsx
//
// Ссылка-приглашение ggege.ru/i/КОД (вместо ?ref=userId с телефоном внутри).
// Мессенджеры читают отсюда og:image (app/api/og/invite) — картинка с
// позывным и результатом приходит вместе с текстом одним сообщением.
// Человека сразу перекидываем в пробный урок, ?ref=КОД ловит ReferralCatcher.

import type { Metadata } from 'next'
import { InviteRedirect } from './invite-redirect'
import { TRIAL_TRACKS, type TrialSubject } from '@/lib/trialTracks'
import { getTLessonPublic } from '@/db/queries'
import { isGuestOpenLesson } from '@/lib/guestLessons'

type Props = { params: { code: string }; searchParams: { l?: string; t?: string; s?: string; c?: string; u?: string } }

const subjectOf = (sp: Props['searchParams']): TrialSubject => (sp.c === 'm' ? 'math' : 'physics')

const BASE = 'https://ggege.ru'

export const generateMetadata = ({ params, searchParams }: Props): Metadata => {
	const q = new URLSearchParams({ code: params.code })
	if (searchParams.l) q.set('l', searchParams.l)
	if (searchParams.t) q.set('t', searchParams.t)
	if (searchParams.s) q.set('s', searchParams.s)
	const image = `${BASE}/api/og/invite?${q.toString()}`
	const title = '🍕 Заработай нам пиццу!'
	const description = searchParams.u
		? 'Не понял тему в школе? Вот понятный разбор по шагам — без регистрации.'
		: `Пройди урок ${TRIAL_TRACKS[subjectOf(searchParams)].lessonGen} без регистрации. Сможешь круче?`
	return {
		title,
		description,
		openGraph: { title, description, url: `${BASE}/i/${params.code}`, siteName: 'ggege', images: [{ url: image, width: 1200, height: 630 }] },
		twitter: { card: 'summary_large_image', title, description, images: [image] },
	}
}

// ?u=<урок> — конкретный урок без регистрации (любой пошаговый разбор, кнопка «поделиться» на карте
// /trainer); иначе первый урок трека.
const lessonOf = async (sp: Props['searchParams']) => {
	const u = Number(sp.u)
	if (u > 0 && isGuestOpenLesson(await getTLessonPublic(u).catch(() => null))) return u
	return TRIAL_TRACKS[subjectOf(sp)].trial
}

const InvitePage = async ({ params, searchParams }: Props) => (
	<InviteRedirect href={`/t-lesson/${await lessonOf(searchParams)}?ref=${encodeURIComponent(params.code)}`} />
)

export default InvitePage
