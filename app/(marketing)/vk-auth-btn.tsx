// 'use client';
// import { useSession, signIn, signOut } from 'next-auth/react';
// import React from 'react';

// export default function AuthButton() {
//   const { data: session, status } = useSession();

//   if (status === 'loading') return <div>Загрузка...</div>;

//   if (session) {
//     return (
//       <div>
//         Добро пожаловать, {session.user?.name}! <br />
//         <button onClick={() => signOut()}>Выйти</button>
//       </div>
//     );
//   }

//   return (
//     <button onClick={() => signIn('vk')}>
//       Войти через ВКонтакте
//     </button>
//   );
// }



// // app/(marketing)/vk-auth-btn.tsx


// 'use client';

// import { useSession, signIn, signOut } from 'next-auth/react';
// import { Button } from '@/components/ui/button';
// import { Loader } from 'lucide-react';

// export default function AuthButton() {
//   const { data: session, status } = useSession();

//   if (status === 'loading') {
//     return <Loader className='h-5 w-5 text-muted-foreground animate-spin' />;
//   }

//   if (session) {
//     return (
//       <Button variant="ghost" size="sm" onClick={() => signOut()}>
//         Выйтииии
//       </Button>
//     );
//   }

//   return (
//     <Button onClick={() => signIn('vk')}>
//       Войти через ВКонтакте
//     </Button>
//   );
// }



// // app/(marketing)/vk-auth-btn.tsx

// // Убираем 'use client' и useSession
// import { auth } from '@/lib/server-auth';
// import { Button } from '@/components/ui/button';
// import { signOutAction } from '@/app/actions/auth-actions';

// // Серверный компонент
// export default async function AuthButton() {
//   const session = await auth();
//   const isAuthenticated = !!session;

//   if (isAuthenticated) {
//     return (
//       <form action={signOutAction}>
//         <Button type="submit" variant="ghost" size="sm">
//           Выйти
//         </Button>
//       </form>
//     );
//   }

//   return (
//     <Button asChild>
//       <a href="/api/auth/signin?vk">Войти через ВКонтакте</a>
//     </Button>
//   );
// }



// app/(marketing)/vk-auth-btn.tsx

// 'use client';

// import { useSession, signIn, signOut } from 'next-auth/react';
// import { Button } from '@/components/ui/button';
// import { Loader } from 'lucide-react';

// export default function AuthButton() {
//   const { data: session, status } = useSession({
//     refetchOnWindowFocus: false,
//     refetchInterval: false,
//   });

//   if (status === 'loading') {
//     return <Loader className='h-5 w-5 text-muted-foreground animate-spin' />;
//   }

//   if (session) {
//     return (
//       <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
//         Выйти
//       </Button>
//     );
//   }

//   return (
//     <Button onClick={() => signIn('vk', { callbackUrl: '/learn' })}>
//       Войти через ВКонтакте
//     </Button>
//   );
// }




// // app/(marketing)/vk-auth-btn.tsx

// 'use client';

// import { useSession, signIn, signOut } from 'next-auth/react';
// import { Button } from '@/components/ui/button';
// import { Loader } from 'lucide-react';

// export default function AuthButton() {
//   const { data: session, status } = useSession();

//   // Не передаём параметры, они не поддерживаются в таком виде

//   if (status === 'loading') {
//     return <Loader className='h-5 w-5 text-muted-foreground animate-spin' />;
//   }

//   if (session) {
//     return (
//       <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
//         Выйти
//       </Button>
//     );
//   }

//   return (
//     <Button onClick={() => signIn('vk', { callbackUrl: '/learn' })}>
//       Войти через ВКонтакте
//     </Button>
//   );
// }





// app/(marketing)/vk-auth-btn.tsx

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Loader className='h-5 w-5 text-muted-foreground animate-spin' />;
  }

  if (session) {
    return (
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Выйти
      </Button>
    );
  }

  return (
    <Button onClick={() => signIn('vk')}>
      Войти через ВКонтакте
    </Button>
  );
}