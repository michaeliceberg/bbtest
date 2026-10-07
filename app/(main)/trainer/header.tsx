'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTrainerNavStore } from '@/store/use-trainer-nav-store'

type Props = {
	title: string
	cozy?: boolean
}

// По прямой просьбе пользователя (2026-09-23): убрана стрелка-ссылка на
// /courses (не должно быть возможности уйти со страницы туда). На
// телефоне название курса уже показано в верхней sticky-панели
// (components/mobile-header.tsx) — весь блок скрыт на мобильном.
// На компьютере (2026-10-07), как и на телефоне, вместо названия курса —
// кнопка на всю ширину с юнитом, на котором сейчас прокручена страница
// (цвет юнита, bounce при смене, по нажатию — меню юнитов).
export const Header = ({ title, cozy = false }: Props) => {
	const nav = useTrainerNavStore()
	const unitButton = nav.title && nav.open ? nav : null

	return (
		<div
			className='hidden lg:flex sticky top-0 pb-3 pt-[28px] mt-[-28px] items-center justify-center border-b-2 mb-5 text-neutral-400 z-50'
			style={{ background: cozy ? '#221E1A' : '#151F23', borderColor: cozy ? '#4A433B' : undefined }}
		>
			{unitButton ? (
				<motion.button
					key={unitButton.title}
					type='button'
					onClick={() => unitButton.open?.()}
					initial={{ scale: 0.92, y: -6 }}
					animate={{ scale: 1, y: 0 }}
					transition={{ type: 'spring', stiffness: 520, damping: 14 }}
					className='w-full h-[44px] px-4 rounded-xl flex items-center gap-2 text-white font-extrabold text-base active:translate-y-[2px]'
					style={{ background: `linear-gradient(135deg, ${unitButton.button}, ${unitButton.bottom})`, boxShadow: `0 4px 0 ${unitButton.bottom}` }}
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
	)
}
