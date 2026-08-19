// app/learn/header.tsx

import { cn } from '@/lib/utils';

type Props = {
	title: string;
	progressPercent?: number; // 0-100
};

export const Header = ({ title, progressPercent = 0 }: Props) => {
	// На телефоне название курса уже показано в верхней sticky-панели —
	// если тут больше нечего показывать (нет прогресс-бара), весь блок
	// схлопывается в ноль, без отступов и линии.
	return (
		<div className={cn(
			'sticky top-0 bg-[#151F23] lg:pb-3 lg:pt-[28px] lg:mt-[-28px] lg:border-b-2 lg:mb-5 text-neutral-400 lg:z-50',
			progressPercent > 0 && 'pt-3 pb-3 mb-3',
		)}>
			<div className='hidden lg:flex items-center justify-center mb-2'>
				<h1 className='font-bold text-lg'>{title}</h1>
			</div>

			{/* Progress bar */}
			{progressPercent > 0 && (
				<div className='px-4'>
					<div className='flex justify-between text-xs text-neutral-500 mb-1'>
						<span>Прогресс курса</span>
						<span>{Math.round(progressPercent)}%</span>
					</div>
					<div className='h-2 bg-neutral-200 rounded-full overflow-hidden'>
						<div
							className='h-full bg-green-500 rounded-full transition-all duration-300 ease-out'
							style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
};


// import { Button } from '@/components/ui/button'
// import Link from '@/node_modules/next/link'
// import { ArrowLeft } from 'lucide-react'

// type Props = {
// 	title: String
// }

// export const Header = ({ title }: Props) => {
// 	return (
// 		<div className='sticky top-0 bg-[#151F23] pb-3 lg:pt-[28px] lg:mt-[-28px] flex items-center justify-between border-b-2 mb-5 text-neutral-400 lg:z-50'>
// 			<Link href='/courses'>
// 				<Button variant='ghost' size='sm'>
// 					<ArrowLeft className='h-5 w-5 stroke-2 text-neutral-400' />
// 				</Button>
// 			</Link>
// 			<h1 className='font-bold text-lg'>{title}</h1>
// 			<div />
// 		</div>
// 	)
// }
