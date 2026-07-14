// app/(marketing)/header.tsx

'use client';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sparkles, User } from 'lucide-react';
import AuthButton from "@/app/(marketing)/vk-auth-btn";

export const Header = () => {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userName = session?.user?.name;

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
            : 'bg-white/80 backdrop-blur-sm border-b-2 border-slate-200'
        }`}
      >
        <div className='lg:max-w-screen-lg mx-auto px-4 h-20 flex items-center justify-between'>
          <Link href='/' className='group flex items-center gap-x-3 transition-transform hover:scale-105'>
            <div className='relative'>
              <Image 
                src='/mascot.svg' 
                height={40} 
                width={40} 
                alt='Mascot' 
                className='transition-all group-hover:rotate-12'
              />
              <Sparkles className='absolute -top-2 -right-2 h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity' />
            </div>
            
            <div className='flex flex-col'>
              <p className='rounded-lg text-green-500 tracking-wide border-2 border-b-4 border-r-4 border-green-700 px-3 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
                ggege
              </p>
              <span className='text-xs text-muted-foreground hidden md:block'>
                Учись с удовольствием
              </span>
            </div>
          </Link>

          <div className='flex items-center gap-x-4'>
            {session && (
              <div className='flex items-center gap-x-2'>
                <div className='flex items-center gap-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full'>
                  <User className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-semibold text-green-700'>
                    {userName}
                  </span>
                </div>
              </div>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      <div className='h-20' />
    </>
  );
};







// // app/(marketing)/header.tsx

// 'use client';

// import { Button } from '@/components/ui/button';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { Sparkles } from 'lucide-react';

// export const Header = () => {
//   const [isScrolled, setIsScrolled] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   return (
//     <>
//       <header className={`...`}>
//         <div className='...'>
//           <Link href='/' className='...'>
//             {/* логотип */}
//           </Link>

//           {/* Просто кнопка входа без проверки сессии */}
//           <Button variant="default" asChild>
//             <Link href="/api/auth/signin">Войти</Link>
//           </Button>
//         </div>
//       </header>
//       <div className='h-20' />
//     </>
//   );
// };





// // app/(marketing)/header.tsx

// 'use client';

// import { Button } from '@/components/ui/button';
// import { useSession } from 'next-auth/react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { Sparkles, User } from 'lucide-react';
// import AuthButton from "@/components/vk-auth-btn";

// export const Header = () => {
//   const { data: session } = useSession();
//   const [isScrolled, setIsScrolled] = useState(false);

//   // Эффект для отслеживания скролла
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const userName = session?.user?.name;

//   return (
//     <>
//       <header 
//         className={`fixed top-0 w-full z-50 transition-all duration-300 ${
//           isScrolled 
//             ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
//             : 'bg-white/80 backdrop-blur-sm border-b-2 border-slate-200'
//         }`}
//       >
//         <div className='lg:max-w-screen-lg mx-auto px-4 h-20 flex items-center justify-between'>
//           {/* Логотип и название */}
//           <Link href='/' className='group flex items-center gap-x-3 transition-transform hover:scale-105'>
//             <div className='relative'>
//               <Image 
//                 src='/mascot.svg' 
//                 height={40} 
//                 width={40} 
//                 alt='Mascot' 
//                 className='transition-all group-hover:rotate-12'
//               />
//               <Sparkles className='absolute -top-2 -right-2 h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity' />
//             </div>
            
//             <div className='flex flex-col'>
//               <p className='rounded-lg text-green-500 tracking-wide border-2 border-b-4 border-r-4 border-green-700 px-3 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
//                 5x5
//               </p>
//               <span className='text-xs text-muted-foreground hidden md:block'>
//                 Учись с удовольствием
//               </span>
//             </div>
//           </Link>

//           {/* Правая часть с именем пользователя и кнопкой выхода */}
//           <div className='flex items-center gap-x-4'>
//             {session && (
//               <div className='flex items-center gap-x-2'>
//                 <div className='flex items-center gap-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full'>
//                   <User className='h-4 w-4 text-green-600' />
//                   <span className='text-sm font-semibold text-green-700'>
//                     {userName}
//                   </span>
//                 </div>
//               </div>
//             )}
//             <AuthButton />
//           </div>
//         </div>
//       </header>

//       {/* Отступ для фиксированного хедера */}
//       <div className='h-20' />
//     </>
//   );
// };



// 'use client';

// import { Button } from '@/components/ui/button';
// import { useSession } from 'next-auth/react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { Menu, X, Sparkles, Home, BookOpen, TrendingUp, User } from 'lucide-react';
// import AuthButton from "@/components/vk-auth-btn";

// export const Header = () => {
//   const { data: session } = useSession();
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [greeting, setGreeting] = useState('');

//   // Эффект для отслеживания скролла
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // Эффект для приветствия в зависимости от времени
//   useEffect(() => {
//     const hour = new Date().getHours();
//     if (hour < 12) setGreeting('Доброе утро');
//     else if (hour < 18) setGreeting('Добрый день');
//     else setGreeting('Добрый вечер');
//   }, []);

//   const userName = session?.user?.name;

//   return (
//     <>
//       <header 
//         className={`fixed top-0 w-full z-50 transition-all duration-300 ${
//           isScrolled 
//             ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
//             : 'bg-white/80 backdrop-blur-sm border-b-2 border-slate-200'
//         }`}
//       >
//         <div className='lg:max-w-screen-lg mx-auto px-4 h-20 flex items-center justify-between'>
//           {/* Логотип и название */}
//           <Link href='/' className='group flex items-center gap-x-3 transition-transform hover:scale-105'>
//             <div className='relative'>
//               <Image 
//                 src='/mascot.svg' 
//                 height={40} 
//                 width={40} 
//                 alt='Mascot' 
//                 className='transition-all group-hover:rotate-12'
//               />
//               <Sparkles className='absolute -top-2 -right-2 h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity' />
//             </div>
            
//             <div className='flex flex-col'>
//               <p className='rounded-lg text-green-500 tracking-wide border-2 border-b-4 border-r-4 border-green-700 px-3 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
//                 5x5
//               </p>
//               <span className='text-xs text-muted-foreground hidden md:block'>
//                 Учись с удовольствием
//               </span>
//             </div>
//           </Link>

//           {/* Десктопная навигация */}
//           <div className='hidden md:flex items-center gap-x-6'>
//             <nav className='flex items-center gap-x-4'>
//               <Link 
//                 href='/' 
//                 className='text-sm font-medium text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-x-1 group'
//               >
//                 <Home className='h-4 w-4 group-hover:scale-110 transition-transform' />
//                 Главная
//               </Link>
//               <Link 
//                 href='/learn' 
//                 className='text-sm font-medium text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-x-1 group'
//               >
//                 <BookOpen className='h-4 w-4 group-hover:scale-110 transition-transform' />
//                 Обучение
//               </Link>
//               <Link 
//                 href='/progress' 
//                 className='text-sm font-medium text-muted-foreground hover:text-green-600 transition-colors flex items-center gap-x-1 group'
//               >
//                 <TrendingUp className='h-4 w-4 group-hover:scale-110 transition-transform' />
//                 Прогресс
//               </Link>
//             </nav>

//             {/* Приветствие и кнопка авторизации */}
//             <div className='flex items-center gap-x-3'>
//               {session && (
//                 <div className='text-right hidden lg:block'>
//                   <p className='text-xs text-muted-foreground'>{greeting},</p>
//                   <p className='text-sm font-semibold text-green-700 flex items-center gap-x-1'>
//                     {userName?.split(' ')[0]}
//                     <User className='h-3 w-3' />
//                   </p>
//                 </div>
//               )}
//               <AuthButton />
//             </div>
//           </div>

//           {/* Мобильное меню кнопка */}
//           <button 
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className='md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors'
//           >
//             {isMobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
//           </button>
//         </div>
//       </header>

//       {/* Мобильное выезжающее меню */}
//       {isMobileMenuOpen && (
//         <div className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden' onClick={() => setIsMobileMenuOpen(false)}>
//           <div 
//             className='fixed top-20 left-0 right-0 bg-white shadow-xl rounded-b-2xl p-6 animate-in slide-in-from-top duration-300'
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Приветствие в мобильном меню */}
//             {session && (
//               <div className='mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl'>
//                 <p className='text-sm text-muted-foreground'>{greeting},</p>
//                 <p className='text-lg font-bold text-green-700'>
//                   {userName}! 👋
//                 </p>
//                 <p className='text-xs text-muted-foreground mt-1'>
//                   Рады снова тебя видеть!
//                 </p>
//               </div>
//             )}

//             {/* Мобильная навигация */}
//             <nav className='flex flex-col gap-y-3'>
//               <Link 
//                 href='/' 
//                 className='flex items-center gap-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors'
//                 onClick={() => setIsMobileMenuOpen(false)}
//               >
//                 <Home className='h-5 w-5 text-green-600' />
//                 <span className='font-medium'>Главная</span>
//               </Link>
//               <Link 
//                 href='/learn' 
//                 className='flex items-center gap-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors'
//                 onClick={() => setIsMobileMenuOpen(false)}
//               >
//                 <BookOpen className='h-5 w-5 text-blue-600' />
//                 <span className='font-medium'>Обучение</span>
//               </Link>
//               <Link 
//                 href='/progress' 
//                 className='flex items-center gap-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors'
//                 onClick={() => setIsMobileMenuOpen(false)}
//               >
//                 <TrendingUp className='h-5 w-5 text-purple-600' />
//                 <span className='font-medium'>Мой прогресс</span>
//               </Link>
//             </nav>

//             {/* Блок с вдохновляющей цитатой */}
//             <div className='mt-6 pt-6 border-t border-slate-200'>
//               <p className='text-xs text-center text-muted-foreground italic'>
//                 "Знания — это сила, а математика — это ключ 🔑"
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Отступ для фиксированного хедера */}
//       <div className='h-20' />
//     </>
//   );
// };




// 'use client';

// import { Button } from '@/components/ui/button';
// import { useSession } from 'next-auth/react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { Sparkles } from 'lucide-react';
// import AuthButton from "@/components/vk-auth-btn";

// export const Header = () => {
//   const { data: session } = useSession();
//   const [isScrolled, setIsScrolled] = useState(false);

//   // Эффект для отслеживания скролла
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   return (
//     <>
//       <header 
//         className={`fixed top-0 w-full z-50 transition-all duration-300 ${
//           isScrolled 
//             ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
//             : 'bg-white/80 backdrop-blur-sm border-b-2 border-slate-200'
//         }`}
//       >
//         <div className='lg:max-w-screen-lg mx-auto px-4 h-20 flex items-center justify-between'>
//           {/* Логотип и название */}
//           <Link href='/' className='group flex items-center gap-x-3 transition-transform hover:scale-105'>
//             <div className='relative'>
//               <Image 
//                 src='/mascot.svg' 
//                 height={40} 
//                 width={40} 
//                 alt='Mascot' 
//                 className='transition-all group-hover:rotate-12'
//               />
//               <Sparkles className='absolute -top-2 -right-2 h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity' />
//             </div>
            
//             <div className='flex flex-col'>
//               <p className='rounded-lg text-green-500 tracking-wide border-2 border-b-4 border-r-4 border-green-700 px-3 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
//                 5x5
//               </p>
//               <span className='text-xs text-muted-foreground hidden md:block'>
//                 Учись с удовольствием
//               </span>
//             </div>
//           </Link>

//           {/* Кнопка авторизации */}
//           <AuthButton />
//         </div>
//       </header>

//       {/* Отступ для фиксированного хедера */}
//       <div className='h-20' />
//     </>
//   );
// };






// //header.tsx

// import { Button } from '@/components/ui/button'
// import { Loader } from 'lucide-react'
// import Image from 'next/image'


// import AuthButton from "@/components/vk-auth-btn" 


// export const Header = () => {
// 	return (
// 		<header className='h-20 w-full border-b-2 border-slate-200 px-4'>
// 			<div className='lg:max-w-screen-lg mx-auto flex items-center justify-between h-full'>
// 				<div className='pt-8 pl-4 pb-7 flex items-center gap-x-3'>
// 					<Image src='/mascot.svg' height={40} width={40} alt='Mascot' />

// 					<p className='rounded-lg text-green-500 tracking-wide border-2 border-b-4 border-r-4 border-green-700 px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block'>
// 						5x5
// 					</p>


// 				</div>


// 				<AuthButton />

// 				<Loader className='h-5 w-5 text-muted-foreground animate-spin' />
				
				
// 			</div>
// 		</header>
// 	)
// }
