import { Button } from '@/components/ui/button'

export const Footer = () => {
	return (
		<footer className='hidden lg:block h-20 w-full border-t-2 border-[#3A464E] p-2'>
			<div className='max-w-screen-lg mx-auto flex items-center justify-evenly h-full'>
				<Button size='lg' variant='ghost' className='w-full'>
					Математика
				</Button>

				<Button size='lg' variant='ghost' className='w-full'>
					Физика
				</Button>

				<Button size='lg' variant='ghost' className='w-full'>
					Информатика
				</Button>
			</div>
		</footer>
	)
}
