import { Button } from '@/components/ui/button'
import Link from '@/node_modules/next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
	title: String
}

export const Header = ({ title }: Props) => {
	return (
		<div className='sticky top-0 bg-game-bg pb-3 lg:pt-[28px] lg:mt-[-28px] flex items-center justify-between border-b border-game-border mb-5 text-gray-400 lg:z-50'>
			<Link href='/courses'>
				<Button variant='ghost' size='sm' className='hover:bg-game-card-light'>
					<ArrowLeft className='h-5 w-5 stroke-2 text-game-gold' />
				</Button>
			</Link>
			<h1 className='font-bold text-lg text-white'>{title}</h1>
			<div />
		</div>
	)
}
