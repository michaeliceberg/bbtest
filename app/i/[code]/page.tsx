// app/i/[code]/page.tsx
//
// Ссылка-приглашение ggege.ru/i/КОД (вместо ?ref=userId с телефоном внутри).
// Мессенджеры читают отсюда og:image (app/api/og/invite) — картинка с
// позывным и результатом приходит вместе с текстом одним сообщением.
// Человека сразу перекидываем в пробный урок, ?ref=КОД ловит ReferralCatcher.

import type { Metadata } from 'next'
import { InviteRedirect } from './invite-redirect'
import { TRIAL_T_LESSON_ID } from '@/lib/referral'

type Props = { params: { code: string }; searchParams: { l?: string; t?: string; s?: string } }

const BASE = 'https://ggege.ru'

export const generateMetadata = ({ params, searchParams }: Props): Metadata => {
	const q = new URLSearchParams({ code: params.code })
	if (searchParams.l) q.set('l', searchParams.l)
	if (searchParams.t) q.set('t', searchParams.t)
	if (searchParams.s) q.set('s', searchParams.s)
	const image = `${BASE}/api/og/invite?${q.toString()}`
	const title = '🍕 Заработай нам пиццу!'
	const description = 'Пройди урок физики без регистрации. Сможешь круче?'
	return {
		title,
		description,
		openGraph: { title, description, url: `${BASE}/i/${params.code}`, siteName: 'ggege', images: [{ url: image, width: 1200, height: 630 }] },
		twitter: { card: 'summary_large_image', title, description, images: [image] },
	}
}

const InvitePage = ({ params }: Props) => (
	<InviteRedirect href={`/t-lesson/${TRIAL_T_LESSON_ID}?ref=${encodeURIComponent(params.code)}`} />
)

export default InvitePage
