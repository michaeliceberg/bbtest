'use client'

import { useEffect } from 'react'

// Редирект на клиенте, а не redirect() на сервере: иначе мессенджер пошёл бы
// по редиректу и не увидел og-картинку этой страницы.
export const InviteRedirect = ({ href }: { href: string }) => {
	useEffect(() => {
		window.location.replace(href)
	}, [href])
	return (
		<div className="min-h-screen flex items-center justify-center bg-[#131D22] text-[#9AA7B0] font-bold">
			Загружаем урок… 🍕
		</div>
	)
}
