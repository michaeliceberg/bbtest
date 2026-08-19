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
		<nav className='lg:hidden px-4 h-[50px] flex items-center gap-3 bg-[#151F23] border-b border-[#3A464E] fixed top-0 w-full z-50'>
			<MobileSidebar courses={courses} activeCourseId={activeCourseId} hasTrainerQuest={hasTrainerQuest} />
			{courseTitle && (
				<span className='font-bold text-sm text-[#F2F7FB] truncate'>{courseTitle}</span>
			)}
		</nav>
	)
}
