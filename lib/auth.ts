// // lib/auth.ts


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
        // console.log('Profile in provider:', profile);
        
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
      // console.log('Final token:', { id: token.id, name: token.name });
      
      return token;
    },
    
    async session({ session, token }) {
        // console.log('Session callback - token:', { id: token.id, name: token.name, email: token.email });
        // console.log('Session callback - token:', { id: token.id, name: token.name, });
      
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

