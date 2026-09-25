type Props = {
	title: string
	cozy?: boolean
}

// По прямой просьбе пользователя (2026-09-23): убрана стрелка-ссылка на
// /courses (не должно быть возможности уйти со страницы туда). На
// телефоне название курса уже показано в верхней sticky-панели ("Тренажёр
// {курс}", см. components/mobile-header.tsx) — здесь дублировать нечего,
// весь блок скрыт на мобильном (тот же приём, что и в
// app/(main)/learn/header.tsx).
export const Header = ({ title, cozy = false }: Props) => {
	return (
		<div
			className='hidden lg:flex sticky top-0 pb-3 pt-[28px] mt-[-28px] items-center justify-center border-b-2 mb-5 text-neutral-400 z-50'
			style={{ background: cozy ? '#221E1A' : '#151F23', borderColor: cozy ? '#4A433B' : undefined }}
		>
			<h1
				className='font-black text-lg'
				style={cozy ? { color: '#FFE08A', textShadow: '0 2px 0 #8A4B14' } : { color: '#F2F7FB' }}
			>
				{title}
			</h1>
		</div>
	)
}
