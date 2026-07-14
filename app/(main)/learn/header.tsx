// app/learn/header.tsx

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
	title: string;
	progressPercent?: number; // 0-100
};

export const Header = ({ title, progressPercent = 0 }: Props) => {
	return (
		<div className='sticky top-0 bg-white pb-3 lg:pt-[28px] lg:mt-[-28px] border-b-2 mb-5 text-neutral-400 lg:z-50'>
			<div className='flex items-center justify-between mb-2'>
				<Link href='/courses'>
					<Button variant='ghost' size='sm'>
						<ArrowLeft className='h-5 w-5 stroke-2 text-neutral-400' />
					</Button>
				</Link>
				<h1 className='font-bold text-lg'>{title}</h1>
				<div className='w-10' /> {/* Пустой блок для баланса */}
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
// 		<div className='sticky top-0 bg-white pb-3 lg:pt-[28px] lg:mt-[-28px] flex items-center justify-between border-b-2 mb-5 text-neutral-400 lg:z-50'>
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
