import { Button } from '@/components/ui/button'
import Image from 'next/image'

export const Footer = () => {
	return (
		<footer className='hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2'>
			<div className='max-w-screen-lg mx-auto flex items-center justify-evenly h-full'>
				<Button size='lg' variant='ghost' className='w-full'>
					<div className="relative w-6 h-5 mr-4 flex-shrink-0">
						<Image 
							src='/hr.svg' 
							alt='Croatian' 
							fill
							className='rounded-md object-contain'
						/>
					</div>
					Математика
				</Button>

				<Button size='lg' variant='ghost' className='w-full'>
					<div className="relative w-6 h-5 mr-4 flex-shrink-0">
						<Image 
							src='/es.svg' 
							alt='Spanish' 
							fill
							className='rounded-md object-contain'
						/>
					</div>
					Физика
				</Button>

				<Button size='lg' variant='ghost' className='w-full'>
					<div className="relative w-6 h-5 mr-4 flex-shrink-0">
						<Image 
							src='/fr.svg' 
							alt='French' 
							fill
							className='rounded-md object-contain'
						/>
					</div>
					Информатика
				</Button>
			</div>
		</footer>
	)
}



// // footer.tsx

// import { Button } from '@/components/ui/button'
// import Image from 'next/image'

// export const Footer = () => {
// 	return (
// 		<footer className='hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2'>
// 			<div className='max-w-screen-lg mx-auto flex items-center justify-evenly h-full'>
// 				<Button size='lg' variant='ghost' className='w-full'>
// 					<Image 
// 						src='/hr.svg' 
// 						alt='Croatian' 
// 						width={24} 
// 						height={20} 
// 						className='mr-4 rounded-md' 
// 						style={{ width: 'auto', height: 'auto' }}
// 					/>
// 					Математика
// 				</Button>

// 				<Button size='lg' variant='ghost' className='w-full'>
// 					<Image 
// 						src='/es.svg' 
// 						alt='Spanish' 
// 						width={24} 
// 						height={20} 
// 						className='mr-4 rounded-md' 
// 						style={{ width: 'auto', height: 'auto' }}
// 					/>
// 					Физика
// 				</Button>

// 				<Button size='lg' variant='ghost' className='w-full'>
// 					<Image 
// 						src='/fr.svg' 
// 						alt='French' 
// 						width={24} 
// 						height={20} 
// 						className='mr-4 rounded-md' 
// 						style={{ width: 'auto', height: 'auto' }}
// 					/>
// 					Информатика
// 				</Button>
// 			</div>
// 		</footer>
// 	)
// }





// // // footer.tsx

// // import { Button } from '@/components/ui/button'
// // import Image from 'next/image'

// // export const Footer = () => {
// // 	return (
// // 		<footer className='hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2'>
// // 			<div className='max-w-screen-lg mx-auto flex items-center justify-evenly h-full'>
// // 				<Button size='lg' variant='ghost' className='w-full'>
// // 					<Image 
// // 						src='/hr.svg' 
// // 						alt='Croatian' 
// // 						width={24} 
// // 						height={20} 
// // 						className='mr-4 rounded-md' 
// // 					/>
// // 					Математика
// // 				</Button>

// // 				<Button size='lg' variant='ghost' className='w-full'>
// // 					<Image 
// // 						src='/es.svg' 
// // 						alt='Spanish' 
// // 						width={24} 
// // 						height={20} 
// // 						className='mr-4 rounded-md' 
// // 					/>
// // 					Физика
// // 				</Button>

// // 				<Button size='lg' variant='ghost' className='w-full'>
// // 					<Image 
// // 						src='/fr.svg' 
// // 						alt='French' 
// // 						width={24} 
// // 						height={20} 
// // 						className='mr-4 rounded-md' 
// // 					/>
// // 					Информатика
// // 				</Button>
// // 			</div>
// // 		</footer>
// // 	)
// // }