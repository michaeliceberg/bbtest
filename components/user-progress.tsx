'use client'
import { courses } from '@/db/schema';
import Image from '@/node_modules/next/image';
import Link from '@/node_modules/next/link';
import { InfinityIcon } from 'lucide-react';
import { Button } from './ui/button';
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import LottieGems from '@/public/Lottie/LottieGems.json'
import LottieGG from '@/public/Lottie/LottieGG.json'
import { cn } from '@/lib/utils';
import { getLevelInfo } from '@/lib/xp';
import Lottie from '@/components/lottie-player'

// Lottie грузится через общую обёртку (JSON — по URL, не в бандле)



type Props = {
	activeCourse: typeof courses.$inferSelect;
	hearts: number;
	points: number;
	gems: number;
	xp: number;
	// gg-стикеры — "мистическая" валюта (Фаза 2, 2026-09-29), назначение
	// нарочно не объясняется ученику — виден только растущий счётчик,
	// без явного лейбла/подсказки, что это. Необязательный (default 0) —
	// не все места рендера UserProgress передают эту цифру.
	ggStickers?: number;
	hasActiveSubscription: boolean;
	theme?: 'light' | 'dark';
};
export const UserProgress = ({ activeCourse, hearts, points, gems, xp, ggStickers = 0, hasActiveSubscription, theme = 'light' }: Props) => {
	const isDark = theme === 'dark';
	const { level, progressPercent } = getLevelInfo(xp);

	const wrapperClass = isDark
		? 'flex flex-wrap items-center justify-between gap-x-2 gap-y-1 w-full rounded-xl border border-game-border bg-game-card px-3 py-2'
		: 'flex flex-wrap items-center justify-between gap-x-2 gap-y-1 w-full';

	const ghostHover = isDark ? 'hover:bg-game-card-light' : '';

	return (
		<div className={wrapperClass}>
			<Link href='/courses'>
				<Button variant='ghost' className={ghostHover}>
					<Image src={activeCourse.imageSrc} alt={activeCourse.title} className='rounded-md border' width={32} height={32} />
				</Button>
			</Link>

			{/* Уровень — растёт за верные ответы и в курсах, и в тренажёре, и
				за получение наград достижений (см. lib/xp.ts), чтобы одинаково
				мотивировать заниматься и там, и там, а не только одним из
				способов. Бейдж с числом и тонкой полосой прогресса до
				следующего уровня, в цвете, не занятом соседними currency-
				иконками (orange/red/rose); ведёт на /progress — там теперь
				есть полноразмерный блок уровня (components/level-card.tsx). */}
			<Link href='/progress'>
				<div className={cn('flex flex-col items-center px-2 text-violet-400', ghostHover)}>
					<span className='text-xs font-bold leading-none'>Ур. {level}</span>
					<div className='w-9 h-1 rounded-full bg-current/20 mt-1 overflow-hidden' style={{ backgroundColor: 'rgba(167,139,250,0.2)' }}>
						<div className='h-full rounded-full bg-violet-400' style={{ width: `${progressPercent}%` }} />
					</div>
				</div>
			</Link>

			<Link href='/shop' className='pt-3'>
				<Button variant='ghost' className={cn('text-orange-500', ghostHover)}>

					<Lottie className="h-14 w-14 mr-2 pb-2"
						animationData={ LottieCoins }
					/>
					{points}

					{/* <Image src='/points.svg' height={28} width={28} alt='Points' className='mr-2' /> */}
					{/* {points} */}
				</Button>
			</Link>


			<Link href='/shop' className='pt-2'>
				<Button variant='ghost' className={cn('text-red-500', ghostHover)}>

					<Lottie className="h-10 w-10 mr-2 pb-2"
						animationData={ LottieGems }
					/>
					{gems}
				</Button>
			</Link>



			{/* gg-стикеры — "мистическая" валюта, назначение нарочно не
				объясняется (см. Props выше) — просто растущий счётчик,
				чтобы вызывать вопрос "а зачем они" у самого ученика. */}
			<Button variant='ghost' className={cn('text-[#FFF3C1]', ghostHover)} title="gg-стикеры">
				<Lottie className="h-9 w-9 mr-1" animationData={ LottieGG } />
				{ggStickers}
			</Button>

			<Link href='/shop'>
				<Button variant='ghost' className={cn('text-rose-500', ghostHover)}>
					<Image src='/heart.svg' height={22} width={22} alt='Hearts' className='mr-2' />
					{hasActiveSubscription ? <InfinityIcon className='h-4 w-4 stroke-[3]' /> : hearts}
				</Button>
			</Link>
		</div>
	);
};
