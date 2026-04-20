// // lib/auth.ts
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";

// export async function requireAuth() {
//   const session = await getServerSession();
  
//   if (!session) {
//     redirect('/api/auth/signin'); // Редирект на страницу входа
//   }
  
//   return session;
// }

// // Или для API роутов (возвращает ошибку вместо редиректа)
// export async function getAuthenticatedSession() {
//   const session = await getServerSession();
  
//   if (!session) {
//     throw new Error('Unauthorized');
//   }
  
//   return session;
// }




// //TODO: рабочая вроде была
// // lib/auth.ts
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";

// interface AuthUser {
//   id: string;
//   name: string | null;
//   email: string | null;
//   image: string | null;
//   firstName?: string;
//   lastName?: string;
//   vkId: string;
// }

// interface AuthResult {
//   userId: string;
//   user: AuthUser;
//   session: any;
// }

// export async function auth(): Promise<AuthResult> {
//   const session = await getServerSession();
  
//   if (!session?.user?.id) {
//     throw new Error('Вы не авторизованы!');
//   }
  
//   const user: AuthUser = {
//     id: session.user.id,
//     name: session.user.name || null,
//     email: session.user.email || null,
//     image: session.user.image || null,
//     vkId: session.user.id, // VK ID тот же, что и id
//   };
  
//   return {
//     userId: session.user.id,
//     user: user,
//     session: session,
//   };
// }

// // Функция с редиректом (как requireAuth)
// export async function requireAuth(): Promise<AuthResult> {
//   try {
//     return await auth();
//   } catch (error) {
//     redirect('/api/auth/signin');
//   }
// }

// // Для API роутов (без редиректа, только ошибка)
// export async function getAuth(): Promise<AuthResult | null> {
//   try {
//     return await auth();
//   } catch {
//     return null;
//   }
// }




// // //TODO: рабочая до ЭТОГО
// import { cookies } from 'next/headers';

// // Типы для пользователя VK
// interface VKUser {
//   id: number;
//   first_name: string;
//   last_name?: string;
//   photo_100?: string;
//   photo_200?: string;
// }

// // Функция для получения сессии пользователя из cookies
// export async function getVKUser(): Promise<VKUser | null> {
//   const cookieStore = await cookies();
//   const vkUserCookie = cookieStore.get('vk_user');
  
//   if (!vkUserCookie) {
//     return null;
//   }
  
//   try {
//     return JSON.parse(vkUserCookie.value);
//   } catch {
//     return null;
//   }
// }

// // Функция для получения userId
// export async function getVKUserId(): Promise<string | null> {
//   const user = await getVKUser();
//   return user?.id?.toString() || null;
// }

// // Функция проверки аутентификации
// export async function requireAuth() {
//   const userId = await getVKUserId();
//   if (!userId) {
//     throw new Error('Вы не авторизованы!');
//   }
//   return userId;
// }






// // lib/auth.ts
// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";
// import type { NextAuthOptions } from "next-auth";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//       // Запрашиваем email у VK (важно!)
//       authorization: {
//         params: {
//           scope: "email photos", // photos дает фото, email дает почту
//         },
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       // Добавляем id из profile в token
//       if (profile) {
//         token.id = profile.id;
//         token.email = profile.email;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       // Передаем id и email из token в session.user
//       if (token.id) {
//         session.user.id = token.id as string;
//       }
//       if (token.email) {
//         session.user.email = token.email as string;
//       }
//       return session;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// export const { handlers, signIn, signOut } = NextAuth(authOptions);








// // lib/auth.ts
// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";
// import type { NextAuthOptions, DefaultSession, Profile } from "next-auth";

// // Расширяем типы
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       email?: string | null;
//     } & DefaultSession["user"];
//   }

//   interface Profile {
//     id: number;
//     email?: string;
//     first_name?: string;
//     last_name?: string;
//     photo_100?: string;
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//       authorization: {
//         params: {
//           scope: "email photos", // Важно: запрашиваем email
//         },
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       if (profile) {
//         token.id = profile.id;
//         token.email = profile.email;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (token.id) {
//         session.user.id = token.id as string;
//       }
//       if (token.email) {
//         session.user.email = token.email as string;
//       }
//       return session;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// export const { handlers, signIn, signOut } = NextAuth(authOptions);




// // lib/auth.ts (добавьте эту функцию в конец файла)
// import { getServerSession } from "next-auth";

// export async function auth() {
//   return await getServerSession(authOptions);
// }









// // lib/auth.ts
// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";
// import type { NextAuthOptions, DefaultSession, Profile } from "next-auth";

// // Расширяем типы
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       email?: string | null;
//     } & DefaultSession["user"];
//   }

//   interface Profile {
//     id: number;
//     email?: string;
//     first_name?: string;
//     last_name?: string;
//     photo_100?: string;
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//       authorization: {
//         params: {
//           scope: "email photos",
//         },
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       console.log('Profile received:', profile); // Отладка: смотрим что приходит
//       console.log('Full profile:', JSON.stringify(profile, null, 2));
      
//       if (profile) {
//         token.id = String(profile.id); // Преобразуем number в string
//         token.email = profile.email;
//         token.name = profile.first_name + ' ' + profile.last_name;
//         token.picture = profile.photo_100;
//       }
      
//       console.log('Token after JWT callback:', token); // Отладка
//       return token;
//     },
    
//     async session({ session, token }) {
//       console.log('Token in session callback:', token); // Отладка
      
//       if (token.id) {
//         session.user.id = token.id as string;
//       }
//       if (token.email) {
//         session.user.email = token.email as string;
//       }
//       if (token.name) {
//         session.user.name = token.name as string;
//       }
//       if (token.picture) {
//         session.user.image = token.picture as string;
//       }
      
//       console.log('Session after callback:', session); // Отладка
//       return session;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// export const { handlers, signIn, signOut } = NextAuth(authOptions);

// // Добавьте эту функцию
// import { getServerSession } from "next-auth";

// export async function auth() {
//   return await getServerSession(authOptions);
// }





// // lib/auth.ts
// import { getServerSession } from "next-auth";
// import type { NextAuthOptions, DefaultSession } from "next-auth";
// import VKProvider from "next-auth/providers/vk";

// // Расширяем типы
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       email?: string | null;
//     } & DefaultSession["user"];
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//       authorization: {
//         params: {
//           scope: "email photos",
//         },
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       console.log('Account:', account); // Отладка
      
//       // Данные из VK приходят через account, не через profile
//       if (account) {
//         // ID пользователя VK
//         if (account.providerAccountId) {
//           token.id = account.providerAccountId;
//         }
        
//         // Access token может понадобиться для API VK
//         token.accessToken = account.access_token;
//       }
      
//       // profile иногда содержит дополнительные данные
//       if (profile) {
//         console.log('Profile data:', profile);
//         if (profile.email) token.email = profile.email;
//         if (profile.name) token.name = profile.name;
//         // if (profile.picture) token.picture = profile.picture;
//       }
      
//       return token;
//     },
    
//     async session({ session, token }) {
//       console.log('Token in session:', token);
      
//       // Добавляем id пользователя в сессию
//       if (token.id) {
//         session.user.id = token.id as string;
//       }
      
//       // Добавляем остальные поля
//       if (token.email) {
//         session.user.email = token.email as string;
//       }
      
//       if (token.name) {
//         session.user.name = token.name as string;
//       }
      
//       if (token.picture) {
//         session.user.image = token.picture as string;
//       }
      
//       // Сохраняем access token отдельно, если нужно
//       // session.accessToken = token.accessToken;
      
//       return session;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// // Функция для получения сессии на сервере
// export async function auth() {
//   return await getServerSession(authOptions);
// }






// import { getServerSession } from "next-auth";
// import type { NextAuthOptions, DefaultSession } from "next-auth";
// import VKProvider from "next-auth/providers/vk";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       email?: string | null;
//     } & DefaultSession["user"];
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//       authorization: {
//         params: {
//           scope: "email photos",
//         },
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       console.log('Full account:', JSON.stringify(account, null, 2));
//       console.log('Full profile:', JSON.stringify(profile, null, 2));
      
//       // Первый вход - account и profile доступны
//       if (account && profile) {
//         // VK возвращает id в profile (число)
//         if (profile.id) {
//           token.id = String(profile.id); // Преобразуем в строку
//         }
        
//         // Альтернативный вариант - из account
//         if (account.providerAccountId) {
//           token.id = account.providerAccountId;
//         }
        
//         // Имя пользователя
//         if (profile.first_name && profile.last_name) {
//           token.name = `${profile.first_name} ${profile.last_name}`;
//         } else if (profile.name) {
//           token.name = profile.name;
//         }
        
//         // Email
//         if (profile.email) {
//           token.email = profile.email;
//         }
        
//         // Аватар
//         if (profile.photo_100) {
//           token.picture = profile.photo_100;
//         }
        
//         token.accessToken = account.access_token;
//       }
      
//       console.log('Final token:', { id: token.id, name: token.name, email: token.email });
      
//       return token;
//     },
    
//     async session({ session, token }) {
//       console.log('Session callback - token:', { id: token.id, name: token.name, email: token.email });
      
//       // Добавляем id пользователя в сессию
//       if (token.id) {
//         session.user.id = token.id as string;
//       }
      
//       // Добавляем остальные поля
//       if (token.email) {
//         session.user.email = token.email as string;
//       }
      
//       if (token.name) {
//         session.user.name = token.name as string;
//       }
      
//       if (token.picture) {
//         session.user.image = token.picture as string;
//       }
      
//       return session;
//     },
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// export async function auth() {
//   return await getServerSession(authOptions);
// }





import { getServerSession } from "next-auth";
import type { NextAuthOptions, DefaultSession } from "next-auth";
import VKProvider from "next-auth/providers/vk";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    VKProvider({
      clientId: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
      authorization: {
        url: 'https://oauth.vk.com/authorize',
        params: {
          scope: 'email photos',
          v: '5.131',
        },
      },
      userinfo: {
        url: 'https://api.vk.com/method/users.get',
        params: {
          fields: 'photo_100,email',
          v: '5.131',
        },
      },
      profile(profile) {
        console.log('Profile in provider:', profile);
        
        // VK возвращает массив response
        const user = profile.response?.[0] || profile;
        
        return {
          id: String(user.id),
          name: `${user.first_name} ${user.last_name}`,
        //   email: user.email,
        //   image: user.photo_100,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
    //   console.log('JWT Callback - account:', !!account);
    //   console.log('JWT Callback - profile:', !!profile);
    //   console.log('JWT Callback - user:', user);
      
      // user содержит данные из profile провайдера
      if (user) {
        token.id = user.id;
        token.name = user.name;
        // token.email = user.email;
        // token.picture = user.image;
      }
      
      // Если есть account, сохраняем access token
      if (account) {
        token.accessToken = account.access_token;
      }
      
    //   console.log('Final token:', { id: token.id, name: token.name, email: token.email });
      console.log('Final token:', { id: token.id, name: token.name });
      
      return token;
    },
    
    async session({ session, token }) {
        // console.log('Session callback - token:', { id: token.id, name: token.name, email: token.email });
        console.log('Session callback - token:', { id: token.id, name: token.name, });
      
      if (token.id) {
        session.user.id = token.id as string;
      }
      
    //   if (token.email) {
    //     session.user.email = token.email as string;
    //   }
      
      if (token.name) {
        session.user.name = token.name as string;
      }
      
      if (token.picture) {
        session.user.image = token.picture as string;
      }
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function auth() {
  return await getServerSession(authOptions);
}






// // lib/next-auth.ts
// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";

// export const { handlers, signIn, signOut, auth } = NextAuth({
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//     }),
//   ],
//   callbacks: {
//     async session({ session, token }) {
//       // Добавляем VK ID в сессию
//       if (token.sub) {
//         session.user.id = token.sub;
//       }
//       return session;
//     },
//   },
// });

// // Расширяем тип для User
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//     };
//   }
// }






// // lib/auth.ts
// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";

// export const { handlers, signIn, signOut, auth } = NextAuth({
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//     }),
//   ],
//   callbacks: {
//     async session({ session, token }) {
//       // Добавляем VK ID в сессию
//       if (token.sub) {
//         session.user.id = token.sub;
//       }
//       return session;
//     },
//   },
// });

// // Расширяем тип для User
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//     };
//   }
// }









// lib/auth.ts
// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";
// import type { NextAuthOptions } from "next-auth";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//     }),
//   ],
//   callbacks: {
//     async session({ session, token }) {
//       // Добавляем VK ID в сессию
//       if (token.sub) {
//         session.user.id = token.sub;
//       }
//       return session;
//     },
//   },
// };

// export const { handlers, signIn, signOut } = NextAuth(authOptions);










// import NextAuth from "next-auth";
// import VKProvider from "next-auth/providers/vk";
// import type { NextAuthOptions } from "next-auth";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     VKProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//     }),
//   ],
//   secret: process.env.NEXTAUTH_SECRET, // 👈 Явно укажите секрет
//   callbacks: {
//     async session({ session, token }) {
//       if (token.sub) {
//         session.user.id = token.sub;
//       }
//       return session;
//     },
//   },
// };

// export const { handlers, signIn, signOut } = NextAuth(authOptions);












// const getVKUserId = async () => {
//     try {
//       // Проверка через VK Bridge (для VK Mini Apps)
//       if (typeof window !== 'undefined' && window.vkBridge) {
//         const user = await window.vkBridge.send('VKWebAppGetUserInfo');
//         return user.id;
//       }
      
//       // Или через VK API
//       if (window.VK && window.VK.Auth) {
//         const response = await new Promise((resolve) => {
//           VK.Auth.login(resolve);
//         });
//         return response.session.user.id;
//       }
      
//       return null;
//     } catch (error) {
//       console.error('Ошибка получения ID пользователя:', error);
//       return null;
//     }
//   };