// components/vk-auth-btn.tsx

'use client';

import { signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

type Props = {
    isAuthenticated?: boolean;
    userName?: string;
    userImage?: string;
};

export default function AuthButton({ isAuthenticated, userName, userImage }: Props) {
    if (isAuthenticated) {
        return (
            <div className="flex items-center gap-2">
                {userImage && (
                    <Image src={userImage} alt={userName || 'User'} width={32} height={32} className="rounded-full" />
                )}
                <span className="text-sm font-medium">{userName}</span>
                <button 
                    onClick={() => signOut()}
                    className="text-sm text-red-500 hover:text-red-700"
                >
                    Выйти
                </button>
            </div>
        );
    }
    
    return (
        <button 
            onClick={() => signIn('vk')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
            Войти через VK
        </button>
    );
}






// // // vk-auth-btn.tsx



// 'use client';
// import { useSession, signIn, signOut } from 'next-auth/react';
// import React from 'react';
// import { Button } from './ui/button';
// import { Loader, LogOut } from 'lucide-react';

// export default function AuthButton() {
//   const { data: session, status } = useSession();

//   if (status === 'loading') {
//     return (
//       <Button variant='ghost' disabled>
//         <Loader className='h-5 w-5 text-muted-foreground animate-spin' />
//       </Button>
//     );
//   }

//   if (session) {
//     return (
//       <Button variant='ghost' onClick={() => signOut()} className='gap-2'>
//         <LogOut className='h-4 w-4' />
//         Выйти
//       </Button>
//     );
//   }

//   return (
//     <Button 
//       variant='super' 
//       onClick={() => signIn('vk')}
//       className='gap-2 bg-[#0077FF] hover:bg-[#0077FF]/90 text-white'
//     >
//       Войти через ВКонтакте
//       <svg 
//         width="20" 
//         height="20" 
//         viewBox="0 0 24 24" 
//         fill="none" 
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <path 
//           d="M22.12 6.5C22.24 6.12 22.12 6 21.75 6H19.5C19.12 6 18.99 6.25 18.87 6.5C18.87 6.5 17.75 9 16.25 10.75C16 11 15.87 11.12 15.75 11.12C15.62 11.12 15.5 11 15.5 10.62V6.87C15.5 6.5 15.37 6.25 15 6.25H11.12C10.87 6.25 10.75 6.5 10.75 6.75C10.75 7.5 11.5 7.62 11.5 9.37V12.87C11.5 13.37 11.37 13.5 11.12 13.5C10.37 13.5 8.75 11 7.5 8C7.37 7.62 7.25 7.5 6.87 7.5H4.37C4 7.5 3.75 7.75 3.75 8.12C3.75 8.62 4.5 12.75 7.25 16.37C8.12 17.75 9.37 18.37 10.62 18.37C11.75 18.37 12.25 18.12 12.25 17.75C12.25 17.37 12.12 16.87 11.62 16.37C11.25 16 10.75 15.62 10.75 15.25C10.75 15 10.87 14.75 11.12 14.5C11.5 14.12 12.5 15.25 13.25 16.25C13.75 16.87 14.12 17.5 14.75 17.5H17.25C17.62 17.5 17.87 17.25 17.75 16.87C17.62 16.5 16.87 15.5 15.87 14.25C15.5 13.75 15.25 13.5 15.25 13.25C15.25 13 15.5 12.62 15.75 12.37C17 11 18.25 8.5 18.25 8.5C18.37 8.25 18.62 8 19 8H21.75C22.12 8 22.24 7.75 22.12 6.5Z" 
//           fill="white"
//         />
//       </svg>
//     </Button>
//   );
// }





// 'use client';
// import { useSession, signIn, signOut } from 'next-auth/react';
// import React from 'react';
// import { Button } from './ui/button';

// export default function AuthButton() {
//   const { data: session, status } = useSession();

//   if (status === 'loading') return <div>Загрузка...</div>;

//   if (session) {
//     return (
//       <div>
//         <Button variant='ghost' onClick={() => signOut()}>Выйти</Button>
//       </div>
//     );
//   }

//   return (
//     <Button variant='super' onClick={() => signIn('vk')}>
//       Войти через ВКонтакте
//     </Button>
//   );
// }