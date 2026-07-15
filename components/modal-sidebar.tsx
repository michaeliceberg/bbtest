'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { Sidebar } from '@/components/sidebar'
import { Menu } from 'lucide-react'

export const MobileSidebar = () => {
	const [open, setOpen] = useState(false)
	const pathname = usePathname()

	// Автоматически закрываем меню при переходе на любую страницу — иначе
	// на телефоне сайдбар оставался открытым поверх новой страницы.
	useEffect(() => {
		setOpen(false)
	}, [pathname])

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger>
				<Menu className='text-white' />
			</SheetTrigger>
			<SheetContent className='p-0 z-[100]' side='left'>
				<Sidebar />
			</SheetContent>
		</Sheet>
	)
}
