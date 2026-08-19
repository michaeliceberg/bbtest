import { MobileSidebar } from './modal-sidebar'
import type { SidebarCourse } from './sidebar'

type Props = {
	courseTitle?: string
	courses?: SidebarCourse[]
	activeCourseId?: number | null
	hasTrainerQuest?: boolean
}

export const MobileHeader = ({ courseTitle, courses, activeCourseId, hasTrainerQuest }: Props) => {
	return (
		<nav className='lg:hidden fixed px-4 h-[50px] flex items-center bg-[#151F23] border-b border-[#3A464E] top-0 w-full z-50'>
			<MobileSidebar courses={courses} activeCourseId={activeCourseId} hasTrainerQuest={hasTrainerQuest} />
			{courseTitle && (
				<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[60%] truncate font-bold text-sm text-[#F2F7FB]'>
					{courseTitle}
				</span>
			)}
		</nav>
	)
}
