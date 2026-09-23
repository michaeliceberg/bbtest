type Props = {
	title: string
}

// По прямой просьбе пользователя (2026-09-23): убрана стрелка-ссылка на
// /courses (не должно быть возможности уйти со страницы туда). На
// телефоне название курса уже показано в верхней sticky-панели ("Тренажёр
// {курс}", см. components/mobile-header.tsx) — здесь дублировать нечего,
// весь блок скрыт на мобильном (тот же приём, что и в
// app/(main)/learn/header.tsx).
export const Header = ({ title }: Props) => {
	return (
		<div className='hidden lg:flex sticky top-0 bg-[#151F23] pb-3 pt-[28px] mt-[-28px] items-center justify-center border-b-2 mb-5 text-neutral-400 z-50'>
			<h1 className='font-bold text-lg text-[#F2F7FB]'>{title}</h1>
		</div>
	)
}
