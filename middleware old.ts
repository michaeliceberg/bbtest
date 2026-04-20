// import { authMiddleware } from '@clerk/nextjs/server'

// export default authMiddleware({
// 	publicRoutes: ['/', '/api/webhooks/stripe'],
// })

// export const config = {
// 	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// }




// import { authMiddleware } from '@clerk/nextjs/server'

// export default authMiddleware({
// 	publicRoutes: ['/', '/api/webhooks/stripe'],
// })

// export const config = {
// 	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// }






// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// // 1. Определяем публичные маршруты через хелпер
// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/api/webhooks/stripe'
// ])

// // 2. Используем замыкание для проверки маршрутов
// export default clerkMiddleware(async (auth, request) => {
//   // 3. Если маршрут НЕ публичный — защищаем его
//   if (!isPublicRoute(request)) {
//     await auth.protect()
//   }
// })

// // Матчер оставляем без изменений
// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// }


// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/api/webhooks/stripe',
//   '/sign-in(.*)',  // если есть кастомная страница логина
//   '/sign-up(.*)',
// ])

// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     await auth.protect()
//   }
// })


// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/api/webhooks/stripe',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
// ])

// export default clerkMiddleware(async (auth, request) => {
//   // Проверяем, защищён ли маршрут, и если пользователь не авторизован
//   if (!isPublicRoute(request) && !auth.userId) {
//     // Редирект на страницу входа
//     return auth.redirectToSignIn()
//   }
// })

// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// }


// import { clerkMiddleware } from '@clerk/nextjs/server'

// export default clerkMiddleware({
// 	publicRoutes: ['/', '/api/webhooks/stripe'],
// })

// export const config = {
// 	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// }



import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({
	publicRoutes: ['/', '/api/webhooks/stripe'],
})

export const config = {
	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}








// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     await auth.protect()
//   }
// })

// export const config = {
//   matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
// }



// middleware.ts

// import { authMiddleware, redirectToSignIn } from "@clerk/nextjs/server";

// export default authMiddleware({
//   publicRoutes: [
//     '/',
//     '/api/auth/callback/vk',
//     '/sign-in(.*)',
//     '/sign-up(.*)',
//   ],
//   afterAuth(auth, req) {
//     // Обработка callback от VK
//     if (req.nextUrl.pathname.startsWith('/api/auth/callback/vk')) {
//       return;
//     }
    
//     if (!auth.userId && !auth.isPublicRoute) {
//       return redirectToSignIn({ returnBackUrl: req.url });
//     }
//   },
// });

// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// };