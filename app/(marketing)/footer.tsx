import Link from 'next/link'

export const Footer = () => {
	return (
		<footer className='w-full border-t border-[#3A464E]/60 py-5'>
			<div className='max-w-screen-lg mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#5C6B73]'>
				<span>ggege · подготовка к ЕГЭ и ОГЭ</span>
				<span className='flex gap-4'>
					<Link href='/offer' className='hover:text-white'>Оферта</Link>
					<Link href='/privacy' className='hover:text-white'>Конфиденциальность</Link>
				</span>
			</div>
		</footer>
	)
}
