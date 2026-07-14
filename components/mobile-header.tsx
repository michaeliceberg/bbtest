import { MobileSidebar } from './modal-sidebar'

export const MobileHeader = () => {
	return (
		<nav className='lg:hidden px-6 h-[50px] flex items-center bg-green-500 border-b fixed top-0 w-full z-50'>
			<MobileSidebar />
		</nav>
	)
}



// components/mobile-header.tsx

// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// export const MobileHeader = () => {
//     // Убираем useSession полностью
//     return (
//         <div className="lg:hidden fixed top-0 left-0 right-0 h-[50px] bg-white border-b flex items-center px-4 z-50">
//             <Link href="/learn" className="font-bold text-green-600">
//                 BRAINSTARS
//             </Link>
//         </div>
//     );
// };