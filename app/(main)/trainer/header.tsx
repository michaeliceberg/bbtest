'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTrainerNavStore } from '@/store/use-trainer-nav-store'
import { SetBar } from '@/components/set-bar'
import type { SetBarData } from '@/lib/setBar'

type Props = {
	title: string
	cozy?: boolean
	setBar?: SetBarData | null // полоска «Сета» (components/set-bar.tsx); на телефоне — единственное, что видно из этой шапки
}

// По прямой просьбе пользователя (2026-09-23): убрана стрелка-ссылка на
// /courses (не должно быть возможности уйти со страницы туда). На
// телефоне название курса уже показано в верхней sticky-панели
// (components/mobile-header.tsx) — весь блок скрыт на мобильном.
// На компьютере (2026-10-07), как и на телефоне, вместо названия курса —
// кнопка на всю ширину с юнитом, на котором сейчас прокручена страница
// (цвет юнита, bounce при смене, по нажатию — меню юнитов).
export const Header = ({ title, cozy = false, setBar }: Props) => {
	const nav = useTrainerNavStore()
	const unitButton = nav.title && nav.open ? nav : null

	return (
		<div
			className={`${setBar ? 'flex' : 'hidden lg:flex'} flex-col sticky top-[50px] lg:top-0 z-40 lg:z-50 -mt-4 mb-2 lg:pb-4 lg:pt-[28px] lg:mt-[-28px] lg:mb-3 items-center justify-center text-neutral-400`}
		>
			{/* Без сплошной плашки и линии: фон шапки (только на компьютере) — плавное затухание цвета страницы снизу,
			    чтобы прокручиваемый контент не наезжал на кнопку, но не было видно «другого» фона. */}
			<div className='hidden lg:block absolute inset-0 -z-10 pointer-events-none'
				style={{ background: `linear-gradient(to bottom, ${cozy ? '#221E1A' : '#151F23'} 72%, transparent)` }} />
			<div className='hidden lg:flex w-full items-center justify-center'>
			{unitButton ? (
				<motion.button
					key={unitButton.title}
					type='button'
					onClick={() => unitButton.open?.()}
					initial={{ scale: 0.92, y: -6 }}
					animate={{ scale: 1, y: 0 }}
					transition={{ type: 'spring', stiffness: 520, damping: 14 }}
					className='w-full h-[44px] px-4 rounded-xl flex items-center gap-2 text-white font-extrabold text-base border-b-4 active:border-b-0'
					style={{ background: `linear-gradient(135deg, ${unitButton.button}, ${unitButton.bottom})`, borderBottomColor: unitButton.bottom }}
				>
					<span className='flex-1 truncate text-center pl-6'>{unitButton.title}</span>
					<ChevronDown className='w-5 h-5 flex-shrink-0 opacity-90' />
				</motion.button>
			) : (
				<h1
					className='font-black text-lg'
					style={cozy ? { color: '#FFE08A', textShadow: '0 2px 0 #8A4B14' } : { color: '#F2F7FB' }}
				>
					{title}
				</h1>
			)}
			</div>
			{setBar && <SetBar data={setBar} />}
		</div>
	)
}
