'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { Sidebar, type SidebarCourse } from '@/components/sidebar'
import { Menu } from 'lucide-react'
import { useAchievementClaimStore } from '@/store/use-achievement-claim-store'

type Props = {
	courses?: SidebarCourse[]
	activeCourseId?: number | null
	hasTrainerQuest?: boolean
	userName?: string
	userImageSrc?: string
	learnLocked?: boolean
	learnSubject?: 'math' | 'physics'
	isAdmin?: boolean
}

export const MobileSidebar = ({ courses, activeCourseId, hasTrainerQuest, userName, userImageSrc, learnLocked, learnSubject, isAdmin }: Props) => {
	const [open, setOpen] = useState(false)
	const pathname = usePathname()
	const claimCount = useAchievementClaimStore((st) => st.count)

	// Автоматически закрываем меню при переходе на любую страницу — иначе
	// на телефоне сайдбар оставался открытым поверх новой страницы.
	useEffect(() => {
		setOpen(false)
	}, [pathname])

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger className='relative'>
				<Menu className='text-white' />
				{claimCount > 0 && <span className='absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-[#FFC53D] shadow-[0_0_8px_rgba(255,197,61,0.8)]' />}
			</SheetTrigger>
			<SheetContent className='p-0 z-[100]' side='left'>
				<Sidebar
					courses={courses}
					activeCourseId={activeCourseId}
					hasTrainerQuest={hasTrainerQuest}
					userName={userName}
					userImageSrc={userImageSrc}
					learnLocked={learnLocked}
					learnSubject={learnSubject}
					isAdmin={isAdmin}
					onAfterCourseChange={() => setOpen(false)}
				/>
			</SheetContent>
		</Sheet>
	)
}
