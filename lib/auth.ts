// // lib/auth.ts


import { getServerSession } from "next-auth";
import type { NextAuthOptions, DefaultSession } from "next-auth";
import VKProvider from "next-auth/providers/vk";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyTelegramAuth } from "./telegram-auth";
import { getPhoneForCheck } from "./phone-call-store";
import { getCallCheckStatus } from "./sms-ru";
import { formatRuPhonePretty } from "./phone";

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
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "id", type: "text" },
        first_name: { label: "first_name", type: "text" },
        last_name: { label: "last_name", type: "text" },
        username: { label: "username", type: "text" },
        photo_url: { label: "photo_url", type: "text" },
        auth_date: { label: "auth_date", type: "text" },
        hash: { label: "hash", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const valid = verifyTelegramAuth({
          id: credentials.id,
          first_name: credentials.first_name,
          last_name: credentials.last_name,
          username: credentials.username,
          photo_url: credentials.photo_url,
          auth_date: credentials.auth_date,
          hash: credentials.hash,
        });

        if (!valid) return null;

        const name = [credentials.first_name, credentials.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || credentials.username || "Ученик";

        return {
          id: `tg:${credentials.id}`,
          name,
          image: credentials.photo_url || undefined,
        };
      },
    }),
    CredentialsProvider({
      id: "phone-call",
      name: "Звонок",
      credentials: {
        checkId: { label: "checkId", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.checkId) return null;

        // Телефон берём из своего хранилища, а не из того, что прислал
        // клиент — checkId сам по себе уже привязан к конкретному номеру.
        const phone = getPhoneForCheck(credentials.checkId);
        if (!phone) return null;

        const status = await getCallCheckStatus(credentials.checkId);
        if (status !== "confirmed") return null;

        return {
          id: `phone:${phone}`,
          name: formatRuPhonePretty(phone),
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
        if (user.image) {
          token.picture = user.image;
        }
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

