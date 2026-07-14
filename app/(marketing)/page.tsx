// app/(marketing)/page.tsx

'use client'

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Lottie from 'lottie-react';
import LottieHelloBread from '@/public/LottieHelloBread.json';

export default function Home() {
  const { data: session } = useSession();
  const userName = session?.user?.name;

  return (
    <div className='max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2'>
      <div className='relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0'>
        <Lottie 
          animationData={LottieHelloBread} 
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className='flex flex-col items-center gap-y-8'>
        {userName ? (
          <h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>
            С возвращением, 
            <br />
            {userName}! 👋
            <br />
            Готов продолжить?
          </h1>
        ) : (
          <h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>
            Привет! Давай
            <br />
            учиться вместе! 🚀
          </h1>
        )}
        
        <div className='flex flex-col items-center gap-y-3 max-w-[330px] w-full'>
          <Button 
            size='lg' 
            variant='secondary' 
            className='w-full transition-transform hover:scale-105 group'
            asChild
          >
            <Link href='/learn'>
              {userName ? 'Продолжаем учиться' : 'Начать учиться'}
              <span className='inline-block transition-transform group-hover:translate-x-1 ml-1'>
                →
              </span>
            </Link>
          </Button>
          
          <p className='text-sm text-muted-foreground text-center mt-2'>
            {userName 
              ? `${userName}, у тебя отлично получается! 🌟` 
              : 'Присоединяйся к сотням учеников и достигай успеха! 📚'}
          </p>
        </div>
      </div>
    </div>
  );
}









// // app/(marketing)/page.tsx

// import { Button } from '@/components/ui/button';
// import { auth } from '@/lib/server-auth';
// import Image from 'next/image';
// import Link from 'next/link';
// import Lottie from 'lottie-react';
// import LottieHelloBread from '@/public/LottieHelloBread.json';

// export default async function Home() {
//   // 🔥 Используем серверную аутентификацию вместо useSession
//   const session = await auth();
//   const userName = session?.user?.name;

//   return (
//     <div className='max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2'>
//       {/* Анимированный персонаж - нужно будет обернуть в клиентский компонент */}
//       <div className='relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0'>
//         <Lottie 
//           animationData={LottieHelloBread} 
//           loop={true}
//           style={{ width: '100%', height: '100%' }}
//         />
//       </div>

//       {/* Контент с приветствием */}
//       <div className='flex flex-col items-center gap-y-8'>
//         {userName ? (
//           <h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>
//             С возвращением, 
//             <br />
//             {userName}! 👋
//             <br />
//             Готов продолжить?
//           </h1>
//         ) : (
//           <h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>
//             Привет! Давай
//             <br />
//             учиться вместе! 🚀
//           </h1>
//         )}
        
//         <div className='flex flex-col items-center gap-y-3 max-w-[330px] w-full'>
//           <Button 
//             size='lg' 
//             variant='secondary' 
//             className='w-full transition-transform hover:scale-105 group'
//             asChild
//           >
//             <Link href='/learn'>
//               {userName ? 'Продолжаем учиться' : 'Начать учиться'}
//               <span className='inline-block transition-transform group-hover:translate-x-1 ml-1'>
//                 →
//               </span>
//             </Link>
//           </Button>
          
//           <p className='text-sm text-muted-foreground text-center mt-2'>
//             {userName 
//               ? `${userName}, у тебя отлично получается! 🌟` 
//               : 'Присоединяйся к сотням учеников и достигай успеха! 📚'}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // app/(marketing)/page.tsx

// 'use client'

// import { Button } from '@/components/ui/button';
// import { useSession } from 'next-auth/react';
// import Image from 'next/image';
// import Link from 'next/link';
// import Lottie from 'lottie-react';
// import LottieHelloBread from '@/public/LottieHelloBread.json';

// export default function Home() {
//   const { data: session } = useSession();
//   const userName = session?.user?.name;

//   return (
//     <div className='max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2'>
//       {/* Анимированный персонаж */}
//       <div className='relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0'>
//         <Lottie 
//           animationData={LottieHelloBread} 
//           loop={true}
//           style={{ width: '100%', height: '100%' }}
//         />
//       </div>

//       {/* Контент с приветствием */}
//       <div className='flex flex-col items-center gap-y-8'>
//         {userName ? (
//           <h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>
//             С возвращением, 
//             <br />
//             {userName}! 👋
//             <br />
//             Готов продолжить?
//           </h1>
//         ) : (
//           <h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>
//             Привет! Давай
//             <br />
//             учитсья вместе! 🚀
//           </h1>
//         )}
        
//         <div className='flex flex-col items-center gap-y-3 max-w-[330px] w-full'>
//           <Button 
//             size='lg' 
//             variant='secondary' 
//             className='w-full transition-transform hover:scale-105 group'
//             asChild
//           >
//             <Link href='/learn'>
//               {userName ? 'Продолжаем учиться' : 'Начать учиться'}
//               <span className='inline-block transition-transform group-hover:translate-x-1 ml-1'>
//                 →
//               </span>
//             </Link>
//           </Button>
          
//           <p className='text-sm text-muted-foreground text-center mt-2'>
//             {userName 
//               ? `${userName}, у тебя отлично получается! 🌟` 
//               : 'Присоединяйся к сотням учеников и достигай успеха! 📚'}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }




// //page.tsx

// 'use client'
// import { Button } from '@/components/ui/button';
// import { Loader } from 'lucide-react';
// import Image from 'next/image';
// import Link from 'next/link';


// // /Users/mac/Downloads/LottieWaterMellonThumbsUp.json
// // import LottieWaterMellonThumbsUp from '@/public/Lottie/LottieWaterMellonThumbsUp.json'
// import LottieHelloBread from '@/public/LottieHelloBread.json'

// import Lottie from 'lottie-react';


// export default function Home() {
// 	return (



// 		<div className='max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2'>
// 			<div className='relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0'>
				


				
// 			<Image 
// 				src='/LottieHelloBreadImg.jpg' 
// 				fill 
// 				alt='Hero' 
// 				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
// 			/>

// 			</div>

// 			<div className='flex flex-col items-center gap-y-8'>
// 				<h1 className='text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center'>Учи и практикуй математику с нами!</h1>
// 				<div className='flex flex-col items-center gap-y-3 max-w-[330px] w-full'>
// 						<Loader className='h-5 w-5 text-muted-foreground animate-spin'></Loader>

// 								<Button size='lg' variant='secondary' className='w-full'>
// 									<Link href='/learn'>Продолжаем учиться</Link>
// 								</Button>

// 								<Link href='/learn'>Продолжаем учиться</Link>


				


					
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
