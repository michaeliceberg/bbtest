// 'use client';

// import { useUser } from '@clerk/nextjs';
// import { usePathname, useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// const EXEMPT_PATHS = ['/youcansee'];

// export function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { isSignedIn, isLoaded } = useUser();
//   const pathname = usePathname() || '';
//   const router = useRouter();

//   // Normalize path (remove trailing slashes)
//   const normalizedPath = pathname.replace(/\/+$/, '');

//   console.log('Current pathname:', pathname);
//   console.log('Normalized path:', normalizedPath);
//   console.log('Is signed in:', isSignedIn);
//   console.log('Is loaded:', isLoaded);
//   console.log('Is exempt:', EXEMPT_PATHS.includes(normalizedPath));

//   useEffect(() => {
//     if (
//       isLoaded &&
//       !isSignedIn &&
//       !EXEMPT_PATHS.includes(normalizedPath)
//     ) {
//       console.log('Redirecting to login...');
//       router.push('/sign-in'); // adjust if your login route differs
//     }
//   }, [isLoaded, isSignedIn, normalizedPath, router]);

//   if (!isLoaded || (!isSignedIn && !EXEMPT_PATHS.includes(normalizedPath))) {
//     return null; // or a loading spinner
//   }

//   return <>{children}</>;
// }