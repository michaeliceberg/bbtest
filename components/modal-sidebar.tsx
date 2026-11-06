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
	userName?: string
	userImageSrc?: string
	learnLocked?: boolean
	learnSubject?: 'math' | 'physics'
	isAdmin?: boolean
	isPro?: boolean
}

export const MobileSidebar = ({ courses, activeCourseId, userName, userImageSrc, learnLocked, learnSubject, isAdmin, isPro }: Props) => {
	const [open, setOpen] = useState(false)
	const pathname = usePathname()
	const claimCount = useAchievementClaimStore((st) => st.count)

	// Автоматически закрываем меню при переходе на любую страницу — иначе
	// на телефоне сайдбар оставался открытым поверх новой страницы.
	useEffect(() => {
		setOpen(false)
	}, [pathname])
	// открыли меню — сворачиваем панель сета и лоток «Вторая часть» в ангаре
	useEffect(() => {
		if (open) window.dispatchEvent(new Event('mobile-sidebar-open'))
	}, [open])

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger className='relative'>
				<Menu className='text-white' />
				{claimCount > 0 && <span className='absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-[#FFC53D] shadow-[0_0_8px_rgba(255,197,61,0.8)]' />}
			</SheetTrigger>
			{/* выше ангара (его плашки до z 1250), чтобы сет и «Вторая часть» не лезли поверх меню */}
			<SheetContent className='p-0 z-[1500]' overlayClassName='z-[1490]' side='left'>
				<Sidebar
					courses={courses}
					activeCourseId={activeCourseId}
					userName={userName}
					userImageSrc={userImageSrc}
					learnLocked={learnLocked}
					learnSubject={learnSubject}
					isAdmin={isAdmin}
					isPro={isPro}
					onAfterCourseChange={() => setOpen(false)}
				/>
			</SheetContent>
		</Sheet>
	)
}
