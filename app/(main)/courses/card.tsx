import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Image from 'next/image';

type Props = {
	title: string;
	id: number;
	imageSrc: string;
	onClick: (id: number) => void;
	disabled?: boolean;
	active?: boolean;
};

// Премиальная тёмная карточка курса: баннер во всю ширину, название белым
// на тёмной плашке под ним (раньше серый текст на тёмном фоне плохо читался).
export const Card = ({ title, id, imageSrc, disabled, onClick, active }: Props) => {
	return (
		<div
			onClick={() => onClick(id)}
			className={cn(
				'group relative cursor-pointer rounded-2xl p-[2px] transition-transform duration-200 hover:-translate-y-1 active:translate-y-0',
				active
					? 'bg-gradient-to-b from-[#78C93C] via-[#3A464E] to-[#141C20] shadow-[0_0_24px_rgba(120,201,60,0.35)]'
					: 'bg-gradient-to-b from-[#5A6B76] via-[#2A363C] to-[#141C20] shadow-[0_10px_28px_rgba(0,0,0,0.45)]',
				disabled && 'pointer-events-none opacity-50',
			)}>
			<div className='overflow-hidden rounded-[14px] bg-[#151F23]'>
				<div className='relative aspect-square w-full overflow-hidden'>
					<Image
						src={imageSrc}
						alt={title}
						fill
						sizes='(max-width: 1024px) 50vw, 300px'
						className='object-cover transition-transform duration-300 group-hover:scale-105'
					/>
					<div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#151F23] to-transparent' />
					{active && (
						<div className='absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-[#78C93C] px-2 py-1 text-xs font-bold text-white shadow-md'>
							<Check className='h-3.5 w-3.5 stroke-[4]' />
							Текущий
						</div>
					)}
				</div>
				<p className='px-3 pb-3 pt-1 text-center text-base font-extrabold tracking-wide text-[#F2F7FB]'>{title}</p>
			</div>
		</div>
	);
};
