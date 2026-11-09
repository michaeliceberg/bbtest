type Props = {
	children: React.ReactNode
	/** с какой ширины показывать колонку (по умолчанию lg); экран ангара — только с xl, чтобы ангару хватало места */
	from?: 'lg' | 'xl'
}
export const StickyWrapper = ({ children, from = 'lg' }: Props) => {
	return (
		<div className={`hidden ${from === 'xl' ? 'xl:block' : 'lg:block'} w-[368px] shrink-0 sticky self-end bottom-6`}>
			<div className='min-h-[calc(100vh-48px)] sticky top-6 flex flex-col gap-y-4'>{children}</div>
		</div>
	)
}
