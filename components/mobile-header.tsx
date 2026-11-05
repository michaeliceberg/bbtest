'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTrainerNavStore } from '@/store/use-trainer-nav-store'
import { useSetBarStore } from '@/store/use-set-bar-store'
import { BellIcon, SetDots } from './set-bar'
import { SET_BELL_SOUND, SET_BELL_VOLUME, playSound } from '@/lib/sound'
import { MobileSidebar } from './modal-sidebar'
import type { SidebarCourse } from './sidebar'

type Props = {
	courseTitle?: string
	courses?: SidebarCourse[]
	activeCourseId?: number | null
	hasTrainerQuest?: boolean
	userName?: string
	userImageSrc?: string
	learnLocked?: boolean
	learnSubject?: 'math' | 'physics'
	isAdmin?: boolean
	isPro?: boolean
}

export const MobileHeader = ({ courseTitle, courses, activeCourseId, hasTrainerQuest, userName, userImageSrc, learnLocked, learnSubject, isAdmin, isPro }: Props) => {
	// По прямой просьбе пользователя (2026-09-23) — единственный заголовок
	// на телефоне (страничные Header'ы /learn и /trainer скрыты на
	// мобильном, см. их файлы) получает префикс раздела, чтобы не быть
	// голым названием курса: "Задачник ЕГЭ Физика" на /learn, "Тренажёр
	// ЕГЭ Физика" на /trainer. На остальных страницах — как раньше, без
	// префикса.
	const pathname = usePathname()
	const displayTitle = courseTitle
		? pathname?.startsWith('/trainer')
			? `Тренажёр ${courseTitle}`
			: pathname?.startsWith('/learn')
				? `Задачник ${courseTitle}`
				: pathname?.startsWith('/path')
					? 'Мой путь к ЕГЭ'
					: courseTitle
		: undefined

	// На /trainer (простой вид) вместо названия — кнопка на всю ширину с текущим юнитом:
	// цвет юнита, при смене юнита «подпрыгивает», по нажатию открывает меню юнитов.
	const nav = useTrainerNavStore()
	const unitButton = (pathname?.startsWith('/trainer') || pathname?.startsWith('/learn')) && nav.title && nav.open ? nav : null
	// Полоска «Сета» (components/set-bar.tsx) уехала под шапку при прокрутке — справа остаются точки и сундук
	const setBar = useSetBarStore()
	const miniSet = setBar.dish !== null && setBar.compact
	// нажали мини-значок — колокольчик «дзинь» (кнопка уходит вниз, звук), потом сет разворачивается
	const [bellPressed, setBellPressed] = useState(false)
	const openSet = () => {
		playSound(SET_BELL_SOUND, SET_BELL_VOLUME)
		setBellPressed(true)
		window.setTimeout(() => setBellPressed(false), 150)
		window.setTimeout(() => setBar.open?.(), 180)
	}

	return (
		<nav className='lg:hidden fixed px-4 h-[50px] flex items-center bg-[#151F23] border-b border-[#3A464E] top-0 w-full z-50'>
			<MobileSidebar
				courses={courses}
				activeCourseId={activeCourseId}
				hasTrainerQuest={hasTrainerQuest}
				userName={userName}
				userImageSrc={userImageSrc}
				learnLocked={learnLocked}
					learnSubject={learnSubject}
				isAdmin={isAdmin}
					isPro={isPro}
			/>
			{unitButton && (
				<motion.button
					key={unitButton.title}
					type='button'
					onClick={() => unitButton.open?.()}
					initial={{ scale: 0.88, y: -6 }}
					animate={{ scale: 1, y: 0 }}
					transition={{ type: 'spring', stiffness: 520, damping: 14 }}
					className='ml-3 flex-1 min-w-0 h-[38px] px-3 rounded-xl flex items-center gap-2 text-white font-extrabold text-sm border-b-4 active:border-b-0'
					style={{ background: `linear-gradient(135deg, ${unitButton.button}, ${unitButton.bottom})`, borderBottomColor: unitButton.bottom }}
				>
					<span className='flex-1 truncate text-center pl-6'>{unitButton.title}</span>
					<ChevronDown className='w-4 h-4 flex-shrink-0 opacity-90' />
				</motion.button>
			)}
			{setBar.dish !== null && (
				<button type='button' onClick={openSet}
					className='flex h-[38px] shrink-0 items-center gap-1.5 overflow-hidden rounded-xl bg-[#0F171B] border-[#2A363C] transition-[width,opacity,padding] duration-300'
					style={{ marginLeft: !unitButton ? 'auto' : miniSet ? 8 : 0, width: miniSet ? (setBar.dish === 3 ? 44 : 78) : 0, opacity: miniSet ? 1 : 0, paddingLeft: miniSet ? 8 : 0, paddingRight: miniSet ? 6 : 0, borderWidth: miniSet ? 2 : 0 }}
					aria-hidden={!miniSet} tabIndex={miniSet ? 0 : -1} aria-label='Сет'>
					{setBar.dish < 3 && <SetDots dish={setBar.dish} size={8} />}
					{/* колокольчик уровня сета — как на язычке полоски */}
					<span className={`flex items-center ${setBar.dish === 2 ? 'animate-bounce' : ''}`}><BellIcon n={setBar.bell} size={26} pressed={bellPressed} /></span>
				</button>
			)}
			{!unitButton && displayTitle && (
				<span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[60%] truncate font-bold text-sm text-[#F2F7FB]'>
					{displayTitle}
				</span>
			)}
		</nav>
	)
}
