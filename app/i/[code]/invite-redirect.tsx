'use client'

import { useEffect } from 'react'
import { LessonLoading } from '@/components/lesson-loading'
import { SIDEBAR_LOTTIE_LOADERS } from '@/utils/TransitionLink'

// Редирект на клиенте, а не redirect() на сервере: иначе мессенджер пошёл бы
// по редиректу и не увидел og-картинку этой страницы. Пока грузится урок —
// та же заставка с Lottie, что при переходе между пунктами меню.
export const InviteRedirect = ({ href }: { href: string }) => {
	useEffect(() => {
		window.location.replace(href)
	}, [href])
	return <LessonLoading minDuration={1800} lottieFiles={SIDEBAR_LOTTIE_LOADERS} />
}
