'use client'
import { courses } from '@/db/schema';
import Image from '@/node_modules/next/image';
import Link from '@/node_modules/next/link';
import { InfinityIcon } from 'lucide-react';
import { Button } from './ui/button';
import Lottie from 'lottie-react';
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import LottieGems from '@/public/Lottie/LottieGems.json'


type Props = {
	activeCourse: typeof courses.$inferSelect;
	hearts: number;
	points: number;
	gems: number;
	hasActiveSubscription: boolean;
};
export const UserProgress = ({ activeCourse, hearts, points, gems, hasActiveSubscription }: Props) => {
	return (
		<div className='flex items-center justify-between gap-x-2 w-full'>
			<Link href='/courses'>
				<Button variant='ghost'>
					<Image src={activeCourse.imageSrc} alt={activeCourse.title} className='rounded-md border' width={32} height={32} />
				</Button>
			</Link>

			<Link href='/shop' className='pt-3'>
				<Button variant='ghost' className='text-orange-500 '>
					
					<Lottie className="h-14 w-14 mr-2 pb-2"
						animationData={ LottieCoins } 
					/>
					{points}
					
					{/* <Image src='/points.svg' height={28} width={28} alt='Points' className='mr-2' /> */}
					{/* {points} */}
				</Button>
			</Link>


			<Link href='/shop' className='pt-2'>
				<Button variant='ghost' className='text-red-500'>
					
					<Lottie className="h-10 w-10 mr-2 pb-2"
						animationData={ LottieGems } 
					/>
					{gems}
				</Button>
			</Link>



			<Link href='/shop'>
				<Button variant='ghost' className='text-rose-500'>
					<Image src='/heart.svg' height={22} width={22} alt='Hearts' className='mr-2' />
					{hasActiveSubscription ? <InfinityIcon className='h-4 w-4 stroke-[3]' /> : hearts}
				</Button>
			</Link>
		</div>
	);
};
