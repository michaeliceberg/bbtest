'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { Sidebar, type SidebarCourse } from '@/components/sidebar'
import { Menu } from 'lucide-react'

type Props = {
	courses?: SidebarCourse[]
	activeCourseId?: number | null
	hasTrainerQuest?: boolean
}

export const MobileSidebar = ({ courses, activeCourseId, hasTrainerQuest }: Props) => {
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
				<Sidebar
					courses={courses}
					activeCourseId={activeCourseId}
					hasTrainerQuest={hasTrainerQuest}
					onAfterCourseChange={() => setOpen(false)}
				/>
			</SheetContent>
		</Sheet>
	)
}
