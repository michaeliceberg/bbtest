// app/api/auth/[...nextauth]/route.ts

// import NextAuth from "next-auth";
// import VkProvider from "next-auth/providers/vk";

// const handler = NextAuth({
//   providers: [
//     VkProvider({
//       clientId: process.env.VK_CLIENT_ID!,
//       clientSecret: process.env.VK_CLIENT_SECRET!,
//     }),
//   ],
//   // Опционально: куда редиректить после входа
//   callbacks: {
//     async session({ session, token }) {
//       // Здесь можно добавить ID пользователя VK в сессию
//       // session.user.id = token.sub;
//       return session;
//     },
//   },
// });

// export { handler as GET, handler as POST };




// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Импортируем authOptions

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
